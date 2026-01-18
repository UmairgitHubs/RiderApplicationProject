import { Eye, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { WalletUser } from '@/types/wallet'

interface WalletTableProps {
  users: WalletUser[]
  onViewDetails: (user: WalletUser) => void
}

export default function WalletTable({ users, onViewDetails }: WalletTableProps) {
  return (
    <div className="hidden xl:block w-full overflow-hidden rounded-xl border border-gray-100">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 text-gray-500 font-medium whitespace-nowrap text-xs uppercase tracking-wider">
          <tr>
            <th className="px-4 py-3">User ID</th>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3 text-right">Balance</th>
            <th className="px-4 py-3 text-right">Pending</th>
            <th className="px-4 py-3 text-right">Deposits</th>
            <th className="px-4 py-3 text-right">Withdrawals</th>
            <th className="px-4 py-3">Last Tx</th>
            <th className="px-4 py-3 text-center">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {users.length > 0 ? (
            users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-semibold text-[#f97316] whitespace-nowrap text-xs">
                    <span title={user.id}>
                        {user.id.substring(0, 8)}...
                    </span>
                </td>
                <td className="px-4 py-3 max-w-[150px]">
                  <div className="font-medium text-gray-900 truncate text-sm" title={user.name}>{user.name}</div>
                  <div className="text-xs text-gray-400 truncate" title={user.email}>{user.email}</div>
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap font-medium text-gray-900">
                    ${user.currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  {user.pendingAmount > 0 ? (
                    <span className="inline-flex px-2 py-0.5 rounded bg-orange-100 text-orange-700 text-xs font-semibold">
                      ${user.pendingAmount.toFixed(2)}
                    </span>
                  ) : (
                      <span className="text-gray-400 text-xs text-opacity-70">
                      -
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap text-xs">
                    <div className="text-green-600 font-medium">
                      +${user.totalDeposits.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap text-xs">
                    <div className="text-red-500 font-medium">
                      -${user.totalWithdrawals.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                </td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                  {user.lastTransactionDate}
                </td>
                <td className="px-4 py-3 text-center">
                  <button 
                    onClick={() => onViewDetails(user)}
                    className="p-1.5 text-[#f97316] bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                No users found matching your search.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
