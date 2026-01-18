import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { walletApi } from '@/lib/api/wallet'
import { WalletFilters, WalletResponse } from '@/types/wallet'
import { useDebounce } from './use-debounce'

export const useWallets = (filters: WalletFilters) => {
  const debouncedSearch = useDebounce(filters.search, 500)

  return useQuery<WalletResponse>({
    queryKey: ['wallets', { ...filters, search: debouncedSearch }],
    queryFn: () => walletApi.getWallets({ ...filters, search: debouncedSearch }),
    placeholderData: keepPreviousData,
  })
}
