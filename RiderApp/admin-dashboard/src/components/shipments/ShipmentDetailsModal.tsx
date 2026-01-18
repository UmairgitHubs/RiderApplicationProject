import React, { useMemo, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { X, User, MapPin, Package, CreditCard, Warehouse, Truck, Clock, Phone, FileText, Printer, PenSquare, Download, CheckCircle2, Loader2, FileSpreadsheet } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Shipment } from '@/types/shipment';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminShipmentsApi } from '@/lib/api';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ShipmentDetailsModalProps {
  shipment: Shipment | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
}

export default function ShipmentDetailsModal({ shipment, isOpen, onClose, onEdit }: ShipmentDetailsModalProps) {
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const queryClient = useQueryClient();

  const { data: shipmentData, isLoading } = useQuery({
    queryKey: ['shipment', shipment?.id],
    queryFn: () => adminShipmentsApi.getById(shipment?.id!),
    enabled: !!shipment?.id && isOpen,
  });

  const addNoteMutation = useMutation({
    mutationFn: (note: string) => adminShipmentsApi.addNote(shipment!.id, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipment', shipment?.id] });
      setIsAddNoteOpen(false);
      setNoteText('');
      toast.success('Note added successfully');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error?.message || 'Failed to add note');
    }
  });

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    addNoteMutation.mutate(noteText);
  };

  const details = useMemo(() => {
    if (!shipmentData?.data?.shipment) return null;
    return shipmentData.data.shipment;
  }, [shipmentData]);

  if (!shipment) return null;

  // Use fetched details or fallback to prop shipment (limited)
  const d = details || {}; 

  // Helpers for display
  const formatCurrency = (val: any) => `$${Number(val || 0).toFixed(2)}`;

  const handlePrintLabel = () => {
    if (!d) return;
    
    // Create PDF (Standard Label Size: 4x6 inches = 101.6mm x 152.4mm)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [101.6, 152.4]
    });

    // Brand Colors
    const ORANGE = [249, 115, 22]; // #f97316
    const DARK_GRAY = [31, 41, 55]; // #1f2937
    const LIGHT_GRAY = [243, 244, 246]; // #f3f4f6

    const width = 101.6;
    const height = 152.4;
    const margin = 5;
    const contentW = width - (margin * 2);

    // --- 1. HEADER (Orange Brand Bar) ---
    doc.setFillColor(ORANGE[0], ORANGE[1], ORANGE[2]);
    doc.rect(0, 0, width, 20, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("EXPRESS LOGISTICS", margin, 12);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(new Date(d.created_at || Date.now()).toLocaleDateString(), width - margin, 12, { align: 'right' });

    // --- 2. PRIORITY BADGE ---
    if ((d.priority || shipment?.priority) === 'High') {
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(width - 35, 24, 30, 6, 1, 1, 'F');
        doc.setTextColor(220, 38, 38); // Red text
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text("HIGH PRIORITY", width - 20, 28.5, { align: 'center' });
    }

    // --- 3. TRACKING NUMBER ---
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("TRACKING NUMBER", width / 2, 35, { align: 'center' });
    
    doc.setFontSize(18);
    doc.setFont("courier", "bold");
    doc.text(id || 'UNKNOWN', width / 2, 43, { align: 'center' });

    // --- 4. BARCODE SIMULATION ---
    const barcodeY = 48;
    const barcodeH = 12;
    const barcodeW = 70;
    const startX = (width - barcodeW) / 2;
    
    doc.setFillColor(0, 0, 0);
    // Simple random-ish pattern generator based on char codes of ID
    let currentX = startX;
    const idStr = id || '0000';
    
    // Draw standard start bars
    doc.rect(currentX, barcodeY, 0.5, barcodeH, 'F');
    currentX += 1;
    doc.rect(currentX, barcodeY, 0.5, barcodeH, 'F');
    currentX += 1;

    // Draw data bars
    for (let i = 0; i < 45; i++) {
        const charCode = idStr.charCodeAt(i % idStr.length);
        const barWidth = (charCode % 3) * 0.4 + 0.3; // Random width 0.3 - 1.1
        const gapWidth = ((charCode * 7) % 3) * 0.4 + 0.5; // Random gap
        
        if (currentX + barWidth > startX + barcodeW) break;
        
        doc.rect(currentX, barcodeY, barWidth, barcodeH, 'F');
        currentX += barWidth + gapWidth;
    }
    
    // Draw end bars
    doc.rect(startX + barcodeW - 2, barcodeY, 0.5, barcodeH, 'F');
    doc.rect(startX + barcodeW - 1, barcodeY, 0.5, barcodeH, 'F');


    // --- 5. ADDRESSES (Modern Cards) ---
    const addrY = 68;
    
    // Sender (Compact)
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(margin, addrY, contentW, 12, 1, 1, 'FD');
    doc.setFontSize(6);
    doc.setTextColor(100, 100, 100);
    doc.text("FROM (MERCHANT)", margin + 2, addrY + 4);
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text(`${d.merchant?.full_name || 'Unknown'}  |  ${d.merchant?.phone || ''}`, margin + 2, addrY + 9);

    // Recipient (Prominent)
    const recY = addrY + 16;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(0, 0, 0); 
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, recY, contentW, 40, 1, 1, 'S'); // Outline only for stronger visual
    
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "bold");
    doc.text("DELIVER TO (CUSTOMER)", margin + 3, recY + 5);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text((d.recipient_name || d.customerName || 'N/A').toUpperCase(), margin + 3, recY + 13);
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    const addrLines = doc.splitTextToSize((d.delivery_address || 'N/A').toUpperCase(), contentW - 6);
    doc.text(addrLines, margin + 3, recY + 20);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`TEL: ${d.recipient_phone || 'N/A'}`, margin + 3, recY + 36);


    // --- 6. INFO GRID ---
    const gridY = recY + 45;
    const boxW = (contentW - 4) / 3;
    const boxH = 18;
    
    // Weight
    doc.setFillColor(LIGHT_GRAY[0], LIGHT_GRAY[1], LIGHT_GRAY[2]);
    doc.setDrawColor(200, 200, 200);
    doc.roundedRect(margin, gridY, boxW, boxH, 1, 1, 'FD');
    doc.setFontSize(6);
    doc.setTextColor(100, 100, 100);
    doc.text("WEIGHT", margin + 2, gridY + 4);
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`${d.package_weight || '0.5'} KG`, margin + (boxW/2), gridY + 12, { align: 'center' });

    // Service Type
    doc.roundedRect(margin + boxW + 2, gridY, boxW, boxH, 1, 1, 'FD');
    doc.setFontSize(6);
    doc.setTextColor(100, 100, 100);
    doc.text("TYPE", margin + boxW + 4, gridY + 4);
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(d.package_type || 'PARCEL', margin + boxW + 2 + (boxW/2), gridY + 12, { align: 'center' });

    // Hub
    doc.roundedRect(margin + (boxW * 2) + 4, gridY, boxW, boxH, 1, 1, 'FD');
    doc.setFontSize(6);
    doc.setTextColor(100, 100, 100);
    doc.text("ROUTE", margin + (boxW * 2) + 6, gridY + 4);
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    const hub = d.hub || shipment?.hub || 'Central Hub';
    doc.text(hub.substring(0, 6).toUpperCase(), margin + (boxW * 2) + 4 + (boxW/2), gridY + 12, { align: 'center' });

    
    // --- 7. COD SECTION (Bottom Highlight) ---
    const codY = height - 25;
    doc.setFillColor(DARK_GRAY[0], DARK_GRAY[1], DARK_GRAY[2]);
    doc.rect(0, codY, width, 25, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text("CASH ON DELIVERY AMOUNT:", margin, codY + 6);
    
    doc.setFontSize(26);
    doc.setFont("helvetica", "bold");
    doc.text(formatCurrency(d.cod_amount || 0), width - margin, codY + 16, { align: 'right' });
    
    // Decoration line
    doc.setDrawColor(ORANGE[0], ORANGE[1], ORANGE[2]);
    doc.setLineWidth(1);
    doc.line(margin, codY + 20, width - margin, codY + 20);

    // Open Print Dialog
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  };

  const handleExportCSV = () => {
    if (!d) return;

    const headers = ['Tracking ID', 'Date', 'Merchant', 'Customer', 'Phone', 'Address', 'Status', 'COD Amount', 'Delivery Fee'];
    const row = [
      id,
      new Date(d.created_at || Date.now()).toLocaleDateString(),
      `"${d.merchant?.full_name || 'N/A'}"`,
      `"${d.recipient_name || 'N/A'}"`,
      d.recipient_phone || 'N/A',
      `"${d.delivery_address || 'N/A'}"`,
      d.status,
      d.cod_amount || 0,
      d.delivery_fee || 0
    ];

    const csvContent = [
      headers.join(','),
      row.join(',')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `shipment_${id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    if (!d) return;
    const doc = new jsPDF();
    
    // Brand / Header
    doc.setTextColor(249, 115, 22); // Orange
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text('Shipment Detail Report', 14, 20);
    
    doc.setTextColor(100);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 26);

    doc.setTextColor(0);
    doc.setFontSize(12);
    doc.text(`Tracking ID: ${id}`, 14, 35);
    doc.setFontSize(11);
    doc.text(`Status: ${d.status}`, 14, 41);

    // Addresses
    doc.setDrawColor(200);
    doc.line(14, 46, 196, 46);

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text('Sender Information', 14, 55);
    doc.text('Receiver Information', 105, 55);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    // Sender
    doc.text(d.merchant?.full_name || 'N/A', 14, 62);
    doc.text(d.merchant?.phone || 'N/A', 14, 67);
    const senderAddr = doc.splitTextToSize(d.pickup_address || d.merchant?.address || 'N/A', 80);
    doc.text(senderAddr, 14, 72);

    // Receiver
    doc.text(d.recipient_name || d.customerName || 'N/A', 105, 62);
    doc.text(d.recipient_phone || 'N/A', 105, 67);
    const receiverAddr = doc.splitTextToSize(d.delivery_address || 'N/A', 80);
    doc.text(receiverAddr, 105, 72);

    // Table
    const startY = 95;
    autoTable(doc, {
      startY,
      head: [['Description', 'Details']],
      body: [
        ['Package Weight', `${d.package_weight || 'N/A'} kg`],
        ['Package Type', d.package_type || 'Standard'],
        ['Priority', d.priority || 'Normal'],
        ['COD Amount', formatCurrency(d.cod_amount)],
        ['Delivery Fee', formatCurrency(d.delivery_fee)],
        ['Total Payable', formatCurrency(Number(d.cod_amount || 0) + Number(d.delivery_fee || 0))],
        ['Payment Status', d.payment_status || 'Pending'],
        ['Current Hub', d.hub || 'Central Hub']
      ],
      theme: 'grid',
      headStyles: { fillColor: [249, 115, 22], textColor: 255 },
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 } }
    });

    // Tracking History
    let finalY = (doc as any).lastAutoTable.finalY + 10;
    
    if (d.tracking_history?.length > 0) {
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text('Tracking History', 14, finalY);
        finalY += 5;

        const historyRows = d.tracking_history.map((h: any) => [
            new Date(h.created_at).toLocaleString(),
            h.status,
            h.notes || '-'
        ]);

        autoTable(doc, {
            startY: finalY,
            head: [['Date/Time', 'Status', 'Notes']],
            body: historyRows,
            theme: 'plain',
            styles: { fontSize: 9 },
            headStyles: { fontStyle: 'bold' }
        });
    }

    doc.save(`shipment_${id}.pdf`);
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Out for Delivery': return 'bg-blue-50 border-blue-100 text-blue-600';
      case 'Delivered': return 'bg-green-50 border-green-100 text-green-600';
      case 'At Hub': return 'bg-orange-50 border-orange-100 text-orange-600';
      default: return 'bg-gray-50 border-gray-100 text-gray-600';
    }
  };

  const status = d.status || shipment.status;
  const id = d.id || shipment.id;
  const date = d.created_at ? new Date(d.created_at).toLocaleString() : shipment.date;

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in duration-200" />
        <Dialog.Content className="fixed top-[5%] left-[50%] translate-x-[-50%] w-[95%] max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-xl z-50 overflow-y-auto outline-none animate-in zoom-in-95 duration-200 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
          
          {/* Header */}
          <div className="sticky top-0 bg-white z-50 border-b border-gray-100 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Shipment Details</h2>
              <p className="text-sm font-medium text-orange-500 mt-1">{id}</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            
            {/* Status Bar */}
            <div className={`flex items-center justify-between px-6 py-4 rounded-xl border ${getStatusColor(status)}`}>
              <div>
                <p className="text-xs font-semibold uppercase opacity-70 mb-1">Current Status</p>
                <div className="flex items-center gap-2">
                   <span className="font-bold text-lg">{status}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="inline-block px-2 py-1 rounded bg-white/50 text-xs font-semibold mb-1">
                  Express Delivery
                </div>
                <p className="text-sm font-medium opacity-80">{date}</p>
              </div>
            </div>

            {/* Loading State Overlay for Content */}
            {isLoading && !details ? (
                <div className="flex justify-center py-12">
                     <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                </div>
            ) : (
             <>
                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Sender Info - Top Left */}
                <div className="bg-gray-50/50 rounded-xl p-5 border border-gray-100">
                    <div className="flex items-center gap-2 mb-3 text-orange-500 font-semibold">
                    <User className="w-4 h-4" /> Sender Information
                    </div>
                    <div className="space-y-3">
                    <div>
                        <span className="text-xs text-gray-400 block uppercase">Merchant</span>
                        <p className="font-medium text-gray-900">{d.merchant?.full_name || shipment.merchant?.name}</p>
                        <p className="text-sm text-gray-500">{d.merchant?.email || shipment.merchant?.code}</p>
                    </div>
                    <div>
                        <span className="text-xs text-gray-400 block uppercase">Phone</span>
                        <p className="font-medium text-gray-900">{d.merchant?.phone || 'N/A'}</p>
                    </div>
                    <div>
                        <span className="text-xs text-gray-400 block uppercase">Pickup Address</span>
                        <p className="font-medium text-gray-900">{d.pickup_address || d.merchant?.address || 'N/A'}</p>
                    </div>
                    </div>
                </div>

                {/* Receiver Info - Top Right */}
                <div className="bg-gray-50/50 rounded-xl p-5 border border-gray-100">
                    <div className="flex items-center gap-2 mb-3 text-sky-500 font-semibold">
                    <User className="w-4 h-4" /> Receiver Information
                    </div>
                    <div className="space-y-3">
                    <div>
                        <span className="text-xs text-gray-400 block uppercase">Customer Name</span>
                        <p className="font-medium text-gray-900">{d.recipient_name || shipment.customer?.name}</p>
                    </div>
                    <div>
                        <span className="text-xs text-gray-400 block uppercase">Phone</span>
                        <p className="font-medium text-gray-900">{d.recipient_phone || 'N/A'}</p>
                    </div>
                    <div>
                        <span className="text-xs text-gray-400 block uppercase">Delivery Address</span>
                        <p className="font-medium text-gray-900">{d.delivery_address || shipment.customer?.address}</p>
                    </div>
                    </div>
                </div>

                {/* Package Details - Mid Left */}
                <div className="bg-gray-50/50 rounded-xl p-5 border border-gray-100">
                    <div className="flex items-center gap-2 mb-3 text-orange-500 font-semibold">
                    <Package className="w-4 h-4" /> Package Details
                    </div>
                    <div className="grid grid-cols-2 gap-y-3">
                    <div>
                        <span className="text-xs text-gray-400 block uppercase">Weight</span>
                        <p className="font-medium text-gray-900">{d.package_weight ? `${d.package_weight} kg` : 'N/A'}</p>
                    </div>
                    <div>
                        <span className="text-xs text-gray-400 block uppercase">Value</span>
                        <p className="font-medium text-gray-900">{d.package_value ? formatCurrency(d.package_value) : 'N/A'}</p>
                    </div>
                    <div>
                        <span className="text-xs text-gray-400 block uppercase">Type</span>
                        <p className="font-medium text-gray-900">{d.package_type || 'Standard'}</p>
                    </div>
                    <div>
                        <span className="text-xs text-gray-400 block uppercase">Priority</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${(d.priority || shipment.priority) === 'High' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                        {d.priority || shipment.priority || 'Normal'}
                        </span>
                    </div>
                    </div>
                </div>

                {/* Payment Details - Mid Right */}
                <div className="bg-gray-50/50 rounded-xl p-5 border border-gray-100">
                    <div className="flex items-center gap-2 mb-3 text-orange-500 font-semibold">
                    <CreditCard className="w-4 h-4" /> Payment Details
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">COD Amount</span>
                            <span className="font-medium text-gray-900">{formatCurrency(d.cod_amount || shipment.codAmount)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Delivery Fee</span>
                            <span className="font-medium text-gray-900">{formatCurrency(d.delivery_fee)}</span>
                        </div>
                        <div className="pt-2 border-t border-gray-200 flex justify-between items-center mt-2">
                            <span className="font-bold text-gray-700">Total Amount</span>
                            <span className="font-bold text-orange-500 text-lg">{formatCurrency(Number(d.cod_amount || 0) + Number(d.delivery_fee || 0))}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm pt-1">
                            <span className="text-gray-500">Payment Status</span>
                            <span className="text-orange-500 font-medium bg-orange-50 px-2 py-0.5 rounded uppercase text-xs">{d.payment_status || shipment.codStatus}</span>
                        </div>
                    </div>
                </div>

                {/* Hub Info */}
                <div className="bg-gray-50/50 rounded-xl p-5 border border-gray-100">
                    <div className="flex items-center gap-2 mb-3 text-orange-500 font-semibold">
                    <Warehouse className="w-4 h-4" /> Hub Information
                    </div>
                    <span className="text-xs text-gray-400 block uppercase">Current Hub</span>
                    <p className="font-medium text-gray-900">{d.hub || shipment.hub || 'Central Hub'}</p>
                </div>

                {/* Assigned Rider */}
                <div className="bg-gray-50/50 rounded-xl p-5 border border-gray-100">
                    <div className="flex items-center gap-2 mb-3 text-orange-500 font-semibold">
                    <Truck className="w-4 h-4" /> Assigned Rider
                    </div>
                    <div className="flex justify-between items-start">
                        <div>
                            <span className="text-xs text-gray-400 block uppercase">Name</span>
                            <p className="font-medium text-gray-900">{d.rider ? d.rider.full_name : (shipment.rider === 'Unassigned' ? 'Not Assigned' : shipment.rider)}</p>
                        </div>
                        {(d.rider || shipment.rider !== 'Unassigned') && (
                            <div className="text-right">
                                <p className="text-sm font-medium text-gray-900">{d.rider?.phone}</p> 
                            </div>
                        )}
                    </div>
                </div>
                
                </div>

                {/* Special Instructions */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <h4 className="text-sm font-bold text-yellow-800 mb-1">Special Instructions</h4>
                    <p className="text-sm text-yellow-800 opacity-90">{d.special_instructions || 'None'}</p>
                </div>

                {/* Tracking Timeline */}
                <div className="bg-gray-50/50 rounded-xl p-6 border border-gray-100">
                    <div className="flex items-center gap-2 mb-6 text-orange-500 font-bold">
                    <Clock className="w-5 h-5" /> Tracking Timeline
                    </div>
                    <div className="space-y-6 relative pl-2">
                         {/* Fallback timeline if real data is missing or just show simple list */}
                         {d.tracking_history?.length > 0 ? (
                             <>
                             <div className="absolute left-[11px] top-2 bottom-4 w-[2px] bg-gray-200 z-0"></div>
                             {d.tracking_history.map((event: any, index: number) => (
                                <div key={index} className="flex gap-4 relative z-10">
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 bg-white border-green-500 text-green-500`}>
                                        <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-gray-900">{event.status}</h4>
                                        <div className="flex justify-between items-start">
                                            <p className="text-sm text-gray-500 whitespace-pre-wrap">{event.notes}</p>
                                            <span className="text-xs text-gray-400 font-mono shrink-0 ml-2">{new Date(event.created_at).toLocaleString()} ({event.updated_by_user?.full_name || 'System'})</span>
                                        </div>
                                    </div>
                                </div>
                             ))}
                             </>
                         ) : (
                             <p className="text-gray-500 text-sm italic">No tracking history available.</p>
                         )}
                    </div>
                </div>

                {/* QR Code */}
                <div className="flex flex-col items-center justify-center py-6 border-t border-gray-100 border-dashed">
                    <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 mb-3">
                        <QRCodeSVG value={`https://riderapp.com/track/${id}`} size={120} />
                    </div>
                    <p className="text-sm text-gray-500">Scan to track shipment</p>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded mt-2 text-gray-600">{id}</code>
                </div>
              </>
            )}

          </div>

          {/* Footer Actions */}
          <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 px-6 flex flex-wrap gap-3 justify-between items-center z-50">
             <div className="flex gap-3 w-full md:w-auto">
                <button 
                  onClick={() => onEdit()}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
                >
                    <PenSquare className="w-4 h-4" /> Edit Shipment
                </button>
                 <button 
                    onClick={handlePrintLabel}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors">
                    <Printer className="w-4 h-4" /> Print Label
                </button>
             </div>
             <div className="flex gap-3 w-full md:w-auto mt-3 md:mt-0">
                 <button 
                    onClick={() => setIsAddNoteOpen(true)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-white rounded-lg font-medium transition-colors"
                 >
                    <FileText className="w-4 h-4" /> Add Note
                </button>
                <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                        <button 
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-200">
                            <Download className="w-4 h-4" /> Export
                        </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
                        <DropdownMenu.Content className="min-w-[160px] bg-white rounded-lg shadow-lg border border-gray-100 p-1 z-[60] animate-in fade-in zoom-in-95 duration-100" sideOffset={5} align="end">
                            <DropdownMenu.Item 
                                onClick={handleExportCSV}
                                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md cursor-pointer outline-none transition-colors">
                                <FileSpreadsheet className="w-4 h-4 text-green-600" />
                                <span>Export as CSV</span>
                            </DropdownMenu.Item>
                            <DropdownMenu.Item 
                                onClick={handleExportPDF}
                                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md cursor-pointer outline-none transition-colors">
                                <FileText className="w-4 h-4 text-red-500" />
                                <span>Export as PDF</span>
                            </DropdownMenu.Item>
                        </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                </DropdownMenu.Root>
             </div>
          </div>
          
           {/* Add Note Modal - Nested Dialog */}
           <Dialog.Root open={isAddNoteOpen} onOpenChange={setIsAddNoteOpen}>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] animate-in fade-in duration-200" />
              <Dialog.Content className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-[95%] max-w-md bg-white rounded-xl shadow-2xl z-[61] outline-none animate-in zoom-in-95 duration-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-bold text-lg text-gray-900">Add Tracking Note</h3>
                  <button onClick={() => setIsAddNoteOpen(false)} className="p-2 hover:bg-gray-50 rounded-full text-gray-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-500 mb-3">Add a note to the shipment tracking history. The status will remain unchanged.</p>
                  <textarea 
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    className="w-full h-32 p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none resize-none text-sm"
                    placeholder="Enter details about this shipment update..."
                  />
                </div>
                <div className="p-4 bg-gray-50 flex justify-end gap-3">
                  <button 
                    onClick={() => setIsAddNoteOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleAddNote}
                    disabled={!noteText.trim() || addNoteMutation.isPending}
                    className="px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {addNoteMutation.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                    Add Note
                  </button>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
