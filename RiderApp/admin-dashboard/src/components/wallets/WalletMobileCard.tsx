import { Eye } from 'lucide-react'
import { WalletUser } from '@/types/wallet'

interface WalletMobileCardProps {
  user: WalletUser
  onViewDetails: (user: WalletUser) => void
}

export default function WalletMobileCard({ user, onViewDetails }: WalletMobileCardProps) {
  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-start">
        <div className="overflow-hidden mr-4">
          <span className="text-xs font-bold text-[#f97316] mb-1 block truncate" title={user.id}>
             #{user.id.substring(0, 8)}...
          </span>
          <h3 className="font-semibold text-gray-900 truncate" title={user.name}>{user.name}</h3>
          <p className="text-xs text-gray-500 truncate" title={user.email}>{user.email}</p>
        </div>
        <div className="text-right whitespace-nowrap">
          <p className="text-sm font-medium text-gray-500">Balance</p>
          <p className="text-lg font-bold text-gray-900">${user.currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-3 rounded-lg">
        <div>
          <p className="text-xs text-green-600 font-medium mb-1">Total Deposits</p>
          <p className="font-semibold text-gray-900 truncate" title={`$${user.totalDeposits.toLocaleString()}`}>
              ${user.totalDeposits.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </div>
          <div>
          <p className="text-xs text-red-500 font-medium mb-1">Total Withdrawals</p>
          <p className="font-semibold text-gray-900 truncate" title={`$${user.totalWithdrawals.toLocaleString()}`}>
              ${user.totalWithdrawals.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="col-span-2 flex justify-between items-center border-t border-gray-200 pt-2 mt-1">
          <span className="text-xs text-gray-500">Pending</span>
          {user.pendingAmount > 0 ? (
              <span className="inline-flex px-2 py-0.5 rounded bg-orange-100 text-orange-700 text-xs font-semibold">
                ${user.pendingAmount.toFixed(2)}
              </span>
            ) : (
                <span className="text-xs text-gray-400 font-medium">$0.00</span>
            )}
        </div>
      </div>
      
      <div className="flex justify-end pt-2">
          <button 
            onClick={() => onViewDetails(user)}
            className="flex items-center px-4 py-2 text-sm font-medium text-[#f97316] border border-orange-100 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors w-full justify-center"
          >
            <Eye className="w-4 h-4 mr-2" />
            View Details
          </button>
      </div>
    </div>
  )
}
