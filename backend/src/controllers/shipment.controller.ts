import { Request, Response } from 'express';
import prisma from '../config/database';
import { logger } from '../utils/logger';
import * as xlsx from 'xlsx';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import { settingsService } from '../services/settings.service';
import { sendOrderUpdateNotification, sendDeliveryAlertNotification } from '../services/notification.service';

const generateTrackingNumber = (): string => {
  const prefix = 'CE';
  const year = new Date().getFullYear();
  const random = Math.floor(1000000 + Math.random() * 9000000);
  return `${prefix}${year}${random}`;
};

const generateBarcodeNumber = (trackingNumber: string, packageNumber: number): string => {
  return `${trackingNumber}-PKG${packageNumber.toString().padStart(3, '0')}`;
};

export const createShipment = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
      });
    }

    const {
      recipientName,
      recipientPhone,
      recipientEmail,
      recipientCity,
      pickupAddress,
      pickupCity,
      pickupLatitude,
      pickupLongitude,
      deliveryAddress,
      deliveryLatitude,
      deliveryLongitude,
      packages,
      specialInstructions,
      scheduledPickupTime,
      scheduledDeliveryTime,
      codAmount,
      paymentMethod,
      packageType,
      packageWeight,
      packageValue,
      shipmentType, // Extract shipmentType
    } = req.body;

    const trackingNumber = generateTrackingNumber();

    // Find Origin Hub
    let originHubId = null;
    if (pickupCity) {
      const normalizedCity = pickupCity.trim();
      // Try exact or case-insensitive match
      let hub = await prisma.hub.findFirst({
        where: {
          city: { equals: normalizedCity, mode: 'insensitive' }
        }
      });
      
      // Fallback: Try contains (e.g. 'West End' finding 'Hub West End' if city is stored weirdly or vice versa)
      if (!hub) {
         hub = await prisma.hub.findFirst({
            where: {
               city: { contains: normalizedCity, mode: 'insensitive'}
            }
         });
      }

      if (hub) {
        originHubId = hub.id;
      }
    }

    // Generate Batch ID if franchise
    const batchId = shipmentType === 'franchise' ? `FR${new Date().getFullYear()}${Math.floor(Math.random() * 1000000)}` : null;

    let packagesArray = packages || [];
    if (typeof packagesArray === 'string') {
      try {
        packagesArray = JSON.parse(packagesArray);
      } catch (e) {
        packagesArray = [];
      }
    }
    
    // ... (existing package logic omitted for brevity, keeping it intact in replacement if needed, 
    // but typically ReplaceFileContent replaces the whole block.
    // I need to be careful not to delete logic I'm not showing.
    // I will target the block from destructuring to shipment creation.)
    
    if (!packagesArray.length && (packageType || packageWeight || packageValue)) {
      packagesArray = [{
        packageType: packageType || null,
        packageWeight: packageWeight || null,
        packageValue: packageValue || null,
        packageSize: 'medium',
        description: null,
      }];
    }

    if (packagesArray.length === 0) {
      packagesArray = [{
        packageType: null,
        packageWeight: null,
        packageValue: null,
        packageSize: 'medium',
        description: null,
      }];
    }

    const totalWeight = packagesArray.reduce((sum: number, pkg: any) => {
      return sum + (pkg.packageWeight ? parseFloat(pkg.packageWeight) : 0);
    }, 0);

    const baseFee = 100; 
    const weightMultiplier = totalWeight * 10;
    const codFee = codAmount ? parseFloat(codAmount) * 0.02 : 0; 
    const deliveryFee = baseFee + weightMultiplier + codFee;

    const settings = await settingsService.getSettings();
    let assignedRiderId = null;
    let initialStatus = 'pending';

    if (settings.auto_assignment) {
        const availableRiders = await prisma.rider.findMany({
            where: {
                is_online: true,
                current_latitude: { not: null },
                current_longitude: { not: null },
                user: {
                    is_active: true,
                    is_verified: true
                }
            },
            include: {
                user: true
            }
        });

        if (availableRiders.length > 0 && pickupLatitude && pickupLongitude) {
            const pLat = parseFloat(pickupLatitude);
            const pLon = parseFloat(pickupLongitude);

            let nearestRider = null;
            let minDistance = Infinity;

            for (const rider of availableRiders) {
                const rLat = Number(rider.current_latitude);
                const rLon = Number(rider.current_longitude);
                const dist = Math.sqrt(Math.pow(rLat - pLat, 2) + Math.pow(rLon - pLon, 2));
                
                if (dist < minDistance) {
                    minDistance = dist;
                    nearestRider = rider;
                }
            }

            if (nearestRider) {
                assignedRiderId = nearestRider.id;
                initialStatus = 'assigned'; 
            }
        }
    }

    // Create Main Shipment
    const shipment = await prisma.shipment.create({
      data: {
        tracking_number: trackingNumber,
        merchant_id: userId,
        recipient_name: recipientName,
        recipient_phone: recipientPhone,
        recipient_email: recipientEmail || null,
        recipient_city: recipientCity || null,
        pickup_address: pickupAddress,
        pickup_city: pickupCity || null,
        hub_id: originHubId,
        pickup_latitude: pickupLatitude ? parseFloat(pickupLatitude) : null,
        pickup_longitude: pickupLongitude ? parseFloat(pickupLongitude) : null,
        delivery_address: deliveryAddress,
        delivery_latitude: deliveryLatitude ? parseFloat(deliveryLatitude) : null,
        delivery_longitude: deliveryLongitude ? parseFloat(deliveryLongitude) : null,
        package_type: packagesArray[0]?.packageType || null,
        package_weight: totalWeight || null,
        package_value: packagesArray.reduce((sum: number, pkg: any) => sum + (pkg.packageValue ? parseFloat(pkg.packageValue) : 0), 0) || null,
        special_instructions: specialInstructions || null,
        scheduled_pickup_time: scheduledPickupTime ? new Date(scheduledPickupTime) : null,
        scheduled_delivery_time: scheduledDeliveryTime ? new Date(scheduledDeliveryTime) : null,
        delivery_fee: deliveryFee,
        cod_amount: codAmount ? parseFloat(codAmount) : 0,
        payment_method: paymentMethod || 'wallet',
        status: initialStatus,
        payment_status: 'pending',
        rider_id: assignedRiderId,
        // New Fields
        batch_id: batchId,
        shipment_type: shipmentType || 'individual'
      } as any,
    });

    // Handle Excel File for Franchise Orders
    if (shipmentType === 'franchise' && batchId && req.file) {
      try {
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data: any[] = xlsx.utils.sheet_to_json(sheet);

        console.log(`Processing ${data.length} rows from Excel upload for batch ${batchId}`);

        for (const row of data) {
          // Map Excel columns to variables - flexible mapping
          const rowName = row['Name'] || row['Receiver Name'] || row['Recipient'] || 'Unknown Recipient';
          const rowPhone = row['Phone'] || row['Mobile'] || row['Contact'] || recipientPhone; 
          const rowAddress = row['Address'] || row['Location'] || row['Delivery Address'] || 'Unknown Address';
          const rowCity = row['City'] || row['Town'] || row['District'] || recipientCity || null;
          const rowType = row['Type'] || row['Package Type'] || packagesArray[0]?.packageType || 'Standard';
          const rowWeight = row['Weight'] || row['kg'] || totalWeight || 1;
          const rowCOD = row['COD'] || row['Amount'] || codAmount || 0;
          const rowInstructions = row['Instructions'] || row['Notes'] || specialInstructions || null;

          const rowTracking = generateTrackingNumber();

          // Create shipment for each row
          const rowShipment = await prisma.shipment.create({
             data: {
              tracking_number: rowTracking,
              merchant_id: userId,
              recipient_name: rowName,
              recipient_phone: rowPhone, 
              recipient_city: rowCity,
              pickup_address: pickupAddress,
              pickup_city: pickupCity || null,
              hub_id: originHubId,
              delivery_address: rowAddress,
              package_type: rowType,
              package_weight: parseFloat(rowWeight.toString()) || 1,
              delivery_fee: deliveryFee,
              status: initialStatus, // Use same status as main (assigned if rider active) or pending
              batch_id: batchId,
              shipment_type: 'franchise',
              cod_amount: parseFloat(rowCOD.toString()) || 0,
              special_instructions: rowInstructions,
              payment_method: paymentMethod || 'wallet',
              payment_status: 'pending',
              merchant_note: 'Imported via Bulk Upload'
            } as any
          });

          // Create package record for this shipment
           const pkgRecord = await prisma.package.create({
            data: {
              shipment_id: rowShipment.id,
              weight: parseFloat(rowWeight.toString()) || 1,
              dimensions: 'standard',
              type: rowType,
              fragile: false
            } as any
          });

          // Generate barcode/QR for this package
           const barcodeNumber = generateBarcodeNumber(rowTracking, 1);
           const qrData = JSON.stringify({
             barcodeNumber,
             trackingNumber: rowTracking,
             shipmentId: rowShipment.id,
             packageNumber: 1,
             packageId: `${rowShipment.id}-PKG1`
           });
           
           try {
             const qrCodeUrl = await QRCode.toDataURL(qrData);
             await prisma.package.update({
               where: { id: pkgRecord.id },
               data: {
                 barcode_number: barcodeNumber,
                 qr_code_url: qrCodeUrl
               }
             });
           } catch (e) { console.error('QR Gen Error', e); }
          
          // Initial History
          await prisma.shipmentTracking.create({
            data: {
               shipment_id: rowShipment.id,
               status: 'pending',
               location_address: 'Merchant Location'
            } as any
          });
        }
      } catch (err) {
        console.error("Error parsing Excel file:", err);
      }
    }

    const createdPackages = [];
    for (let i = 0; i < packagesArray.length; i++) {
      const pkg = packagesArray[i];
      const packageNumber = i + 1;
      const barcodeNumber = generateBarcodeNumber(trackingNumber, packageNumber);

      const packageQrCodeData = JSON.stringify({
        barcodeNumber,
        trackingNumber,
        shipmentId: shipment.id,
        packageNumber,
        packageId: `${shipment.id}-PKG${packageNumber}`,
        merchantId: userId,
      });

      let packageQrCodeUrl = null;
      try {
        packageQrCodeUrl = await QRCode.toDataURL(packageQrCodeData);
      } catch (error) {
        logger.error('QR code error:', error);
      }

      const createdPackage = await prisma.package.create({
        data: {
          shipment_id: shipment.id,
          package_number: packageNumber,
          package_type: pkg.packageType || null,
          package_weight: pkg.packageWeight ? parseFloat(pkg.packageWeight) : null,
          package_value: pkg.packageValue ? parseFloat(pkg.packageValue) : null,
          package_size: pkg.packageSize || 'medium',
          description: pkg.description || null,
          barcode_number: barcodeNumber,
          qr_code_data: packageQrCodeData,
          qr_code_url: packageQrCodeUrl,
          status: 'pending',
        },
      });

      createdPackages.push(createdPackage);
    }

    await prisma.shipmentTracking.create({
      data: {
        shipment_id: shipment.id,
        status: 'pending',
        location_address: pickupAddress,
        notes: 'Shipment created',
        updated_by: userId,
      },
    });

    await prisma.notification.create({
      data: {
        user_id: userId,
        title: 'Shipment Created',
        message: `Your shipment ${trackingNumber} has been created successfully with ${createdPackages.length} package(s).`,
        type: 'delivery',
        reference_id: shipment.id,
        reference_type: 'shipment',
      },
    });

    // Send external notification (Email/SMS) based on user preferences
    sendOrderUpdateNotification(
      userId,
      trackingNumber,
      'created successfully'
    ).catch((error) => logger.error('Error sending shipment creation notification:', error));

    res.status(201).json({
      success: true,
      data: {
        shipment: {
          id: shipment.id,
          trackingNumber: shipment.tracking_number,
          status: shipment.status,
          deliveryFee: shipment.delivery_fee,
          codAmount: shipment.cod_amount,
          createdAt: shipment.created_at,
          packageCount: createdPackages.length,
        },
        packages: createdPackages.map((pkg) => ({
          id: pkg.id,
          packageNumber: pkg.package_number,
          barcodeNumber: pkg.barcode_number,
          packageType: pkg.package_type,
          packageWeight: pkg.package_weight,
          packageValue: pkg.package_value,
          qrCodeUrl: pkg.qr_code_url,
          status: pkg.status,
        })),
      },
      message: `Shipment created successfully.`,
    });
  } catch (error: any) {
    logger.error('Create shipment error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while creating the shipment.',
      },
    });
  }
};

export const getShipmentStats = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    const [active, delivered, total] = await Promise.all([
      prisma.shipment.count({
        where: {
          merchant_id: userId,
          status: {
            in: ['pending', 'assigned', 'picked_up', 'in_transit'],
          },
        },
      }),
      prisma.shipment.count({
        where: {
          merchant_id: userId,
          status: 'delivered',
        },
      }),
      prisma.shipment.count({
        where: {
          merchant_id: userId,
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        active,
        delivered,
        total,
      },
    });
  } catch (error: any) {
    logger.error('Get shipment stats error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching shipment stats.',
      },
    });
  }
};

export const getMerchantShipments = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { status, page = 1, limit = 20, search } = req.query;

    const where: any = { merchant_id: userId };
    if (status && status !== 'all') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { tracking_number: { contains: search as string, mode: 'insensitive' } },
        { recipient_name: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [shipments, total] = await Promise.all([
      prisma.shipment.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        orderBy: { created_at: 'desc' },
        include: {
          packages: { select: { id: true } },
          rider: { select: { id: true, full_name: true, phone: true } },
        },
      }),
      prisma.shipment.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        shipments: shipments.map((s) => ({
          id: s.id,
          trackingNumber: s.tracking_number,
          status: s.status,
          recipientName: s.recipient_name,
          deliveryAddress: s.delivery_address,
          deliveryFee: s.delivery_fee,
          codAmount: s.cod_amount,
          createdAt: s.created_at,
          packageCount: s.packages.length,
          rider: s.rider,
          // Franchise/Bulk Support
          batchId: s.batch_id,
          shipmentType: s.shipment_type,
        })),
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          totalPages: Math.ceil(total / parseInt(limit as string)),
        },
      },
    });
  } catch (error: any) {
    logger.error('Get merchant shipments error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching shipments.',
      },
    });
  }
};

export const getShipmentDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    const shipment = await prisma.shipment.findUnique({
      where: { id },
      include: {
        merchant: { select: { id: true, email: true, full_name: true, phone: true } },
        rider: { select: { id: true, full_name: true, phone: true } },
        packages: { orderBy: { package_number: 'asc' } },
        tracking_history: { orderBy: { created_at: 'desc' }, take: 10 },
      },
    });

    if (!shipment) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Shipment not found.' },
      });
    }

    if (shipment.merchant_id !== userId && shipment.rider_id !== userId) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied.' },
      });
    }

    res.json({ success: true, data: { shipment } });
  } catch (error: any) {
    logger.error('Get shipment details error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An error occurred.' },
    });
  }
};

export const trackShipment = async (req: Request, res: Response) => {
  try {
    const { trackingNumber } = req.params;

    const shipment = await prisma.shipment.findUnique({
      where: { tracking_number: trackingNumber },
      include: {
        packages: { orderBy: { package_number: 'asc' } },
        tracking_history: { orderBy: { created_at: 'desc' } },
        rider: { select: { id: true, full_name: true } },
      },
    });

    if (!shipment) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Shipment not found.' },
      });
    }

    res.json({
      success: true,
      data: {
        shipment: {
          id: shipment.id,
          trackingNumber: shipment.tracking_number,
          status: shipment.status,
          recipientName: shipment.recipient_name,
          deliveryAddress: shipment.delivery_address,
          pickupAddress: shipment.pickup_address,
          estimatedDeliveryTime: shipment.estimated_delivery_time,
          trackingHistory: shipment.tracking_history,
          rider: shipment.rider,
        },
        packages: shipment.packages.map((pkg) => ({
          id: pkg.id,
          packageNumber: pkg.package_number,
          barcodeNumber: pkg.barcode_number,
          packageType: pkg.package_type,
          packageWeight: pkg.package_weight,
          packageValue: pkg.package_value,
          qrCodeUrl: pkg.qr_code_url,
          status: pkg.status,
        })),
      },
    });
  } catch (error: any) {
    logger.error('Track shipment error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An error occurred.' },
    });
  }
};

export const updateShipmentStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    const { status, notes, latitude, longitude, address } = req.body;

    const shipment = await prisma.shipment.findUnique({ where: { id } });

    if (!shipment) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Shipment not found.' },
      });
    }

    if (shipment.rider_id !== userId && shipment.merchant_id !== userId) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Permission denied.' },
      });
    }

    const updatedShipment = await prisma.shipment.update({
      where: { id },
      data: {
        status,
        ...(status === 'picked_up' && { actual_pickup_time: new Date() }),
        ...(status === 'delivered' && { actual_delivery_time: new Date() }),
      },
    });

    await prisma.shipmentTracking.create({
      data: {
        shipment_id: id,
        status,
        location_latitude: latitude ? parseFloat(latitude) : null,
        location_longitude: longitude ? parseFloat(longitude) : null,
        location_address: address || null,
        notes: notes || null,
        updated_by: userId,
      },
    });

    const statusMessages: any = {
      assigned: 'Your shipment has been assigned to a rider.',
      picked_up: 'Your shipment has been picked up.',
      in_transit: 'Your shipment is on the way.',
      delivered: 'Your shipment has been delivered.',
      cancelled: 'Your shipment has been cancelled.',
    };

    const notifications = [
      {
        user_id: shipment.merchant_id,
        title: 'Shipment Status Update',
        message: statusMessages[status] || `Shipment status updated to ${status}.`,
        type: 'delivery',
        reference_id: id,
        reference_type: 'shipment',
      }
    ];

    if (shipment.rider_id) {
      notifications.push({
        user_id: shipment.rider_id,
        title: 'Shipment Status Update',
        message: statusMessages[status] || `Shipment status updated to ${status}.`,
        type: 'delivery',
        reference_id: id,
        reference_type: 'shipment',
      });
    }

    await prisma.notification.createMany({ data: notifications });

    // Send smart notifications based on user preferences (non-blocking)
    const statusDisplayNames: Record<string, string> = {
      assigned: 'Assigned to Rider',
      picked_up: 'Picked Up',
      in_transit: 'In Transit',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
    };

    // Send notification to merchant
    sendOrderUpdateNotification(
      shipment.merchant_id,
      shipment.tracking_number,
      statusDisplayNames[status] || status
    ).catch((error) => logger.error('Error sending merchant notification:', error));

    // Send notification to rider if assigned
    if (shipment.rider_id) {
      sendDeliveryAlertNotification(
        shipment.rider_id,
        shipment.tracking_number,
        `Shipment status updated to ${statusDisplayNames[status] || status}`
      ).catch((error) => logger.error('Error sending rider notification:', error));
    }

    res.json({
      success: true,
      data: { shipment: updatedShipment },
      message: 'Status updated successfully.',
    });
  } catch (error: any) {
    logger.error('Update shipment status error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An error occurred.' },
    });
  }
};

export const cancelShipment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    const shipment = await prisma.shipment.findUnique({ where: { id } });

    if (!shipment) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Shipment not found.' },
      });
    }

    if (shipment.merchant_id !== userId) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied.' },
      });
    }

    if (['delivered', 'cancelled'].includes(shipment.status)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATUS', message: 'Cannot cancel shipment in current status.' },
      });
    }

    const updatedShipment = await prisma.shipment.update({
      where: { id },
      data: { status: 'cancelled' },
    });

    await prisma.shipmentTracking.create({
      data: {
        shipment_id: id,
        status: 'cancelled',
        notes: 'Shipment cancelled by merchant',
        updated_by: userId,
      },
    });

    res.json({
      success: true,
      data: { shipment: updatedShipment },
      message: 'Shipment cancelled successfully.',
    });
  } catch (error: any) {
    logger.error('Cancel shipment error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An error occurred.' },
    });
  }
};


