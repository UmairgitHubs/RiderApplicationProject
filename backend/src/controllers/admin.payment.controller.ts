import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/async.middleware';

/**
 * Get all payment transactions with filtering and pagination
 */
export const getAllPayments = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { search, page = 1, limit = 10, status, dateFrom, dateTo } = req.query;

  const pageNumber = Number(page);
  const pageSize = Number(limit);
  const skip = (pageNumber - 1) * pageSize;

  const where: any = {};

  if (status) {
    where.status = status;
  }

  if (dateFrom || dateTo) {
    where.created_at = {};
    if (dateFrom) where.created_at.gte = new Date(String(dateFrom));
    if (dateTo) where.created_at.lte = new Date(String(dateTo));
  }

  if (search) {
    where.OR = [
      { id: { contains: String(search), mode: 'insensitive' } },
      { 
        shipment: { 
            OR: [
                { tracking_number: { contains: String(search), mode: 'insensitive' } },
                { 
                    merchant: { 
                        OR: [
                            { full_name: { contains: String(search), mode: 'insensitive' } },
                            { 
                                merchant: {
                                    business_name: { contains: String(search), mode: 'insensitive' } 
                                }
                            }
                        ]
                    } 
                },
                {
                    rider: {
                         full_name: { contains: String(search), mode: 'insensitive' } 
                    }
                }
            ]
        } 
      }
    ];
  }

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        shipment: {
            include: {
                merchant: {
                    select: { full_name: true, merchant: { select: { business_name: true } } }
                },
                rider: {
                    select: { full_name: true }
                }
            }
        },
        user: {
            select: { full_name: true, email: true }
        }
      },
      skip,
      take: pageSize,
      orderBy: { created_at: 'desc' }
    }),
    prisma.payment.count({ where })
  ]);

  const data = payments.map(p => ({
    id: p.id,
    type: p.payment_method === 'COD' || p.payment_method === 'Cash' ? 'COD Collection' : 'Online Payment',
    trackingId: p.shipment?.tracking_number || 'N/A',
    rider: p.shipment?.rider?.full_name || 'Unassigned',
    merchant: p.shipment?.merchant?.merchant?.business_name || p.shipment?.merchant?.full_name || 'N/A',
    amount: Number(p.amount),
    reconciled: p.status === 'completed', // Assuming completed means reconciled for now
    method: p.payment_method,
    date: p.created_at, // Send ISO date to frontend
    status: p.status.charAt(0).toUpperCase() + p.status.slice(1)
  }));

  res.json({
    success: true,
    data,
    pagination: {
        page: pageNumber,
        limit: pageSize,
        total,
        pages: Math.ceil(total / pageSize)
    }
  });
});

/**
 * Get payment statistics
 */
export const getPaymentStats = asyncHandler(async (req: AuthRequest, res: Response) => {
    // 1. Total Transactions
    const totalTransactions = await prisma.payment.count();

    // 2. Completed
    const completed = await prisma.payment.count({ where: { status: 'completed' } });

    // 3. Pending
    const pending = await prisma.payment.count({ where: { status: 'pending' } });

    // 4. COD Collections (Method = 'Cash' or 'COD')
    const codCollections = await prisma.payment.count({ 
        where: { 
            payment_method: { in: ['Cash', 'COD'], mode: 'insensitive' } 
        } 
    });

    // 5. Total Amount
    const totalAmountResult = await prisma.payment.aggregate({
        _sum: { amount: true }
    });
    const totalAmount = Number(totalAmountResult._sum.amount || 0);

    // 6. Reconciled (mapped to completed for now)
    const reconciled = completed;

    res.json({
        success: true,
        data: {
            totalTransactions,
            completed,
            pending,
            codCollections,
            reconciled,
            totalAmount
        }
    });
});

/**
 * Get payment details by ID
 */
export const getPaymentDetails = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
          shipment: {
              include: {
                  merchant: {
                      select: { id: true, full_name: true, merchant: { select: { business_name: true } } }
                  },
                  rider: {
                      select: { id: true, full_name: true }
                  },
                  tracking_history: {
                      orderBy: { created_at: 'desc' }
                  }
              }
          },
          user: {
              select: { id: true, full_name: true, email: true }
          }
      }
  });

  if (!payment) {
      res.status(404);
      throw new Error('Payment transaction not found');
  }

  // Calculations
  const totalAmount = Number(payment.amount); // This is the Base Amount / Total Collected
  const deliveryFee = payment.shipment ? Number(payment.shipment.delivery_fee) : 0;
  
  // Currency Conversion Logic
  const currency = payment.currency || 'PKR';
  const exchangeRate = currency === 'USD' ? 278 : 1; // Fixed rate: 1 USD = 278 PKR

  // Convert to PKR for standard display/settlement
  const totalAmountPKR = totalAmount * exchangeRate;
  const deliveryFeePKR = deliveryFee * exchangeRate;

  // Calculate Commission on Product Value (Total - Delivery)
  // We assume the delivery fee is passed to the platform/rider, so commission should only be on the merchant's goods value.
  const productValue = Math.max(0, totalAmount - deliveryFee);
  const productValuePKR = Math.max(0, totalAmountPKR - deliveryFeePKR);

  // Commission Logic: 5% of Product Value
  const commissionRate = 0.05;
  const commission = productValue * commissionRate;
  const commissionPKR = productValuePKR * commissionRate;
  
  // Net Amount = Total - Delivery - Commission
  const netAmount = totalAmount - deliveryFee - commission;
  const netAmountPKR = totalAmountPKR - deliveryFeePKR - commissionPKR;

  // Timeline construction
  const timeline: { label: string; time: Date | null; status: string }[] = [
      {
          label: 'Amount Collected',
          time: payment.created_at,
          status: 'completed'
      }
  ];

  // Try to find "Submitted to Hub" event from tracking history if available
  // This is illustrative, depends on actual tracking events naming
  if (payment.shipment?.tracking_history) {
      const submittedEvent = payment.shipment.tracking_history.find(e => 
          e.status.toLowerCase().includes('hub') || e.status.toLowerCase().includes('submitted')
      );
      
      if (submittedEvent) {
          timeline.push({
              label: 'Submitted to Hub',
              time: submittedEvent.created_at,
              status: 'completed'
          });
      } else {
        // If not found, check if overall status implies it
        if (payment.status === 'completed') {
             // If completed, assume submitted
             timeline.push({
                label: 'Submitted to Hub',
                time: null, // Unknown time
                status: 'completed'
            });
        } else {
            timeline.push({
                label: 'Submitted to Hub',
                time: null,
                status: 'pending'
            });
        }
      }
  } else {
       timeline.push({
            label: 'Submitted to Hub',
            time: null,
            status: 'pending'
        });
  }


  if (payment.status === 'completed' || payment.status === 'submitted_to_hub') {
      // If submitted_to_hub, it's NOT reconciled yet, so "Processed & Reconciled" is pending.
      // If completed, it IS reconciled.
      timeline.push({
           label: 'Processed & Reconciled',
           time: payment.status === 'completed' ? payment.updated_at : null,
           status: payment.status === 'completed' ? 'completed' : 'pending'
      });
  } else {
      timeline.push({
           label: 'Processed & Reconciled',
           time: null, 
           status: 'pending'
      });
  }

  const data = {
      id: payment.id,
      type: payment.payment_method === 'COD' || payment.payment_method === 'Cash' ? 'COD Collection' : 'Online Payment',
      status: payment.status.charAt(0).toUpperCase() + payment.status.slice(1),
      date: payment.created_at,
      currency: currency,
      amountBreakdown: {
          baseAmount: totalAmount,
          deliveryFee: deliveryFee,
          commission: commission,
          netAmount: netAmount,
          // Converted values for display if needed or forced to PKR
          baseAmountPKR: totalAmountPKR,
          deliveryFeePKR: deliveryFeePKR,
          commissionPKR: commissionPKR,
          netAmountPKR: netAmountPKR
      },
      rider: {
          name: payment.shipment?.rider?.full_name || 'Unassigned',
          id: payment.shipment?.rider?.id || 'N/A'
      },
      merchant: {
          name: payment.shipment?.merchant?.merchant?.business_name || payment.shipment?.merchant?.full_name || 'N/A',
          id: payment.shipment?.merchant?.id || 'N/A'
      },
      paymentMethod: payment.payment_method,
      reconciled: payment.status === 'completed',
      timeline: timeline
  };

  res.json({
      success: true,
      data
  });
});

/**
 * Mark payment as submitted to hub
 */
export const markPaymentAsSubmitted = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    // Use a transaction to ensure both Payment and ShipmentTracking are updated
    const result = await prisma.$transaction(async (prisma) => {
        // 1. Get Payment
        const payment = await prisma.payment.findUnique({
            where: { id },
            include: { shipment: true }
        });

        if (!payment) {
            throw new Error('Payment not found');
        }

        if (!payment.shipment_id) {
            throw new Error('No shipment associated with this payment');
        }

        // 2. Add Tracking Event
        await prisma.shipmentTracking.create({
            data: {
                shipment_id: payment.shipment_id,
                status: 'Cash Submitted to Hub',
                notes: 'Cash collected and submitted to Hub',
                location_address: 'Hub', 
                updated_by: req.user?.id
            }
        });

        // 3. Update Payment Status to indicate it's at the hub but not fully reconciled yet
        const updatedPayment = await prisma.payment.update({
            where: { id },
            data: {
                status: 'submitted_to_hub'
            }
        });

        return updatedPayment;
    });

    res.json({
        success: true,
        data: result
    });
});

/**
 * Reconcile a payment
 */
export const reconcilePayment = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    // Use a transaction
    const result = await prisma.$transaction(async (prisma) => {
        // 1. Get Payment
        const payment = await prisma.payment.findUnique({
            where: { id },
             include: { shipment: true }
        });

        if (!payment) {
            throw new Error('Payment not found');
        }

        // 2. Add Tracking Event (if linked to shipment)
        if (payment.shipment_id) {
            await prisma.shipmentTracking.create({
                data: {
                    shipment_id: payment.shipment_id,
                    status: 'Payment Reconciled',
                    notes: 'Payment has been fully processed and reconciled.',
                    location_address: 'Finance Dept',
                    updated_by: req.user?.id
                }
            });
        }

        // 3. Update Payment Status to completed/reconciled
        const updatedPayment = await prisma.payment.update({
            where: { id },
            data: {
                status: 'completed'
            }
        });
        
        return updatedPayment;
    });

    res.json({
        success: true,
        data: result
    });
});
