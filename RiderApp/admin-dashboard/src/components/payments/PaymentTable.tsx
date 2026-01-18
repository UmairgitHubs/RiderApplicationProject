import { Eye, ArrowRight, Check } from 'lucide-react'
import { Transaction } from '@/types/payment'

interface PaymentTableProps {
  transactions: Transaction[]
  onViewDetails: (txn: Transaction) => void
}

export default function PaymentTable({ transactions, onViewDetails }: PaymentTableProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden hidden md:block">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-100">
          <tr>
            <th className="px-4 py-4 w-[140px]">Transaction ID</th>
            <th className="px-4 py-4">Type</th>
            <th className="px-4 py-4 w-[140px]">Tracking ID</th>
            <th className="px-4 py-4">Party</th>
            <th className="px-4 py-4">Amount</th>
            <th className="px-4 py-4">Method</th>
            <th className="px-4 py-4">Date</th>
            <th className="px-4 py-4">Status</th>
            <th className="px-4 py-4 text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {transactions.map((txn) => (
            <tr 
              key={txn.id} 
              className="hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => onViewDetails(txn)}
            >
              <td className="px-4 py-4 align-top">
                <span className="font-semibold text-blue-600 block">{txn.id}</span>
              </td>
              <td className="px-4 py-4 align-top">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700 mt-1">
                  <ArrowRight className="w-3 h-3 text-green-600" />
                  {txn.type}
                </div>
              </td>
              <td className="px-4 py-4 align-top">
                <div className="text-gray-900 mt-1 font-medium">{txn.trackingId}</div>
              </td>
              <td className="px-4 py-4 align-top">
                <div className="font-bold text-gray-900">{txn.rider}</div>
                <div className="text-xs text-gray-500 mt-0.5">{txn.merchant}</div>
              </td>
              <td className="px-4 py-4 align-top">
                <div className="font-bold text-gray-900 mt-1">Pkr{txn.amount.toFixed(2)}</div>
                {txn.reconciled && (
                  <div className="flex items-center gap-1 text-[10px] text-green-600 font-medium mt-0.5">
                    <Check className="w-3 h-3" />
                    Reconciled
                  </div>
                )}
              </td>
              <td className="px-4 py-4 align-top">
                <span className="inline-block mt-1 px-2.5 py-0.5 bg-green-50 text-green-700 text-xs rounded border border-green-200">
                  {txn.method}
                </span>
              </td>
              <td className="px-4 py-4 align-top">
                <div className="text-gray-900 mt-1 font-medium">
                  {new Date(txn.date).toLocaleDateString()}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(txn.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </td>
              <td className="px-4 py-4 align-top">
                <span className={`inline-flex px-3 py-1 rounded text-xs font-medium mt-1 ${
                  txn.status === 'Completed' ? 'bg-green-500 text-white' : 'bg-orange-400 text-white'
                }`}>
                  {txn.status}
                </span>
              </td>
              <td className="px-4 py-4 align-top text-center">
                <button 
                  className="p-1.5 text-primary hover:bg-primary-50 rounded-md transition-colors mt-0.5 inline-block"
                  onClick={(e) => { e.stopPropagation(); onViewDetails(txn); }}
                >
                  <Eye className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
