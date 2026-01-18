import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export function useAuth() {
  const router = useRouter()

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: any) => authApi.login(email, password),
    onSuccess: (response) => {
      if (response.success) {
        toast.success('Login successful, redirecting...')
        if (response.data?.requiresTwoFactor) {
          router.push(`/verify-2fa?email=${encodeURIComponent(response.data.email)}`)
        } else if (response.data?.token) {
          router.push('/dashboard')
        }
      }
    },
  })

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      router.push('/login')
    },
  })

  return {
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    logout: logoutMutation.mutateAsync,
    isLoggingOut: logoutMutation.isPending,
  }
}
