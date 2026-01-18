import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, FileSpreadsheet, FileText, Download, Check, Filter } from 'lucide-react'

interface ExportShipmentsModalProps {
  isOpen: boolean
  onClose: () => void
  onExport: (format: 'csv' | 'pdf') => void
  totalShipments: number
  filters: {
    search: string
    status: string
    dateRange: string
    hub: string
  }
}

export default function ExportShipmentsModal({ isOpen, onClose, onExport, totalShipments, filters }: ExportShipmentsModalProps) {
  const [format, setFormat] = useState<'csv' | 'pdf'>('csv')

  const handleExport = () => {
    onExport(format)
    onClose()
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] animate-in fade-in duration-200" />
        <Dialog.Content 
          className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-[95%] max-w-lg bg-white rounded-xl shadow-xl z-[110] outline-none animate-in zoom-in-95 duration-200 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-xl z-10">
            <div className="flex items-center gap-4">
              <div className="bg-orange-50 p-3 rounded-xl">
                <Download className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <Dialog.Title className="text-xl font-bold text-gray-900">Export Shipments Report</Dialog.Title>
                <p className="text-sm text-gray-500 mt-1">Download a detailed report of your shipments.</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Format Selection */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-500" /> Export Format
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormat('csv')}
                  className={`relative flex items-center justify-center gap-3 p-4 border rounded-xl transition-all ${
                    format === 'csv' 
                      ? 'border-orange-500 bg-orange-50/50 text-orange-600 ring-1 ring-orange-500' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-600'
                  }`}
                >
                  <FileSpreadsheet className={`w-5 h-5 ${format === 'csv' ? 'text-orange-600' : 'text-gray-500'}`} />
                  <span className="font-medium">CSV / Excel</span>
                  {format === 'csv' && (
                    <div className="absolute top-2 right-2">
                      <Check className="w-4 h-4 text-orange-500" />
                    </div>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setFormat('pdf')}
                  className={`relative flex items-center justify-center gap-3 p-4 border rounded-xl transition-all ${
                    format === 'pdf' 
                      ? 'border-orange-500 bg-orange-50/50 text-orange-600 ring-1 ring-orange-500' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-600'
                  }`}
                >
                  <FileText className={`w-5 h-5 ${format === 'pdf' ? 'text-orange-600' : 'text-gray-500'}`} />
                  <span className="font-medium">PDF Document</span>
                  {format === 'pdf' && (
                    <div className="absolute top-2 right-2">
                      <Check className="w-4 h-4 text-orange-500" />
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* Current Filters Info */}
             <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-start gap-3">
                    <Filter className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                        <h4 className="text-sm font-semibold text-gray-900">Current Filters Applied</h4>
                        <p className="text-sm text-gray-500 mt-1">The report will honor your current search settings.</p>
                        
                        <div className="flex flex-wrap gap-2 mt-3">
                            <span className="inline-flex items-center px-2 py-1 rounded bg-white border border-gray-200 text-xs font-medium text-gray-600">
                                Total Shipments: {totalShipments}
                            </span>
                            {filters.search && (
                                <span className="inline-flex items-center px-2 py-1 rounded bg-white border border-gray-200 text-xs font-medium text-gray-600">
                                    Search: "{filters.search}"
                                </span>
                            )}
                             {filters.status && filters.status !== 'all' && (
                                <span className="inline-flex items-center px-2 py-1 rounded bg-white border border-gray-200 text-xs font-medium text-gray-600">
                                    Status: {filters.status}
                                </span>
                            )}
                             {filters.dateRange && filters.dateRange !== 'all' && (
                                <span className="inline-flex items-center px-2 py-1 rounded bg-white border border-gray-200 text-xs font-medium text-gray-600">
                                    Date: {filters.dateRange}
                                </span>
                            )}
                             {filters.hub && filters.hub !== 'all' && (
                                <span className="inline-flex items-center px-2 py-1 rounded bg-white border border-gray-200 text-xs font-medium text-gray-600">
                                    Hub: {filters.hub}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

          </div>

          <div className="p-6 pt-2 pb-6 flex justify-end gap-3 rounded-b-xl">
            <button 
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              className="flex items-center justify-center gap-2 px-8 py-2.5 text-sm font-bold text-white bg-orange-500 rounded-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-orange-500 transition-all shadow-sm shadow-orange-200"
            >
              <Download className="w-4 h-4" />
              Download Report
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
