import { Eye, ArrowRight, Check } from 'lucide-react'
import { Transaction } from '@/types/payment'

interface PaymentMobileCardProps {
  transaction: Transaction
  onViewDetails: (txn: Transaction) => void
}

export default function PaymentMobileCard({ transaction, onViewDetails }: PaymentMobileCardProps) {
  const txn = transaction
  return (
    <div 
      className="bg-white rounded-xl shadow-sm p-4 space-y-4 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onViewDetails(txn)}
    >
      <div className="flex justify-between items-start">
        <div>
          <div className="font-semibold text-blue-600 text-sm">{txn.id}</div>
          <div className="flex items-center gap-1 text-xs text-green-700 mt-1">
            <ArrowRight className="w-3 h-3" />
            {txn.type}
          </div>
        </div>
        <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
          txn.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
        }`}>
          {txn.status}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm border-t border-gray-100 pt-3">
        <div>
          <p className="text-gray-500 text-xs">Tracking ID</p>
          <div className="font-medium text-gray-900 text-xs">{txn.trackingId}</div>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Amount</p>
          <div className="font-medium text-gray-900">
            ${txn.amount.toFixed(2)}
            {txn.reconciled && (
                <span className="block text-[10px] text-green-600 flex items-center gap-0.5">
                  <Check className="w-3 h-3" /> Reconciled
                </span>
            )}
          </div>
        </div>
        <div className="col-span-2">
          <p className="text-gray-500 text-xs">Party</p>
          <div className="text-sm font-medium text-gray-900">{txn.rider}</div>
          <div className="text-xs text-gray-500">{txn.merchant}</div>
        </div>
        <div>
            <p className="text-gray-500 text-xs">Date</p>
            <div className="text-xs text-gray-900">{new Date(txn.date).toLocaleDateString()}</div>
            <div className="text-[10px] text-gray-500">{new Date(txn.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
          <div>
            <p className="text-gray-500 text-xs">Method</p>
            <span className="inline-block px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded border border-green-100">
              {txn.method}
            </span>
        </div>
      </div>

      <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
        <button 
          className="p-2 text-primary hover:bg-primary-50 rounded-md transition-colors"
          onClick={(e) => { e.stopPropagation(); onViewDetails(txn); }}
        >
          <Eye className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
