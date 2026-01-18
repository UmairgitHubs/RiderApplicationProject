'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const { login, isLoggingIn } = useAuth()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data)
    } catch (error) {
      // Error handling is managed by useAuth/mutation
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <label 
            htmlFor="email" 
            className="text-sm font-medium text-gray-700 block"
        >
            Email Address
        </label>
        <input
          {...register('email')}
          id="email"
          type="email"
          placeholder="admin@example.com"
          className={`w-full px-4 py-3 rounded-xl border bg-gray-50/50 focus:bg-white transition-all outline-none focus:ring-2 disabled:opacity-50 ${
            errors.email 
              ? 'border-red-500 focus:ring-red-200' 
              : 'border-gray-200 focus:border-primary focus:ring-primary/20'
          }`}
          disabled={isLoggingIn}
        />
        {errors.email && (
          <p className="text-sm text-red-500 animate-in slide-in-from-top-1 fade-in">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
            <label 
                htmlFor="password" 
                className="text-sm font-medium text-gray-700 block"
            >
                Password
            </label>
            <Link 
                href="/forgot-password" 
                className="text-sm text-primary hover:text-primary/80 transition-colors font-medium"
            >
                Forgot password?
            </Link>
        </div>
        <div className="relative">
          <input
            {...register('password')}
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            className={`w-full px-4 py-3 rounded-xl border bg-gray-50/50 focus:bg-white transition-all outline-none focus:ring-2 disabled:opacity-50 pr-12 ${
              errors.password
                ? 'border-red-500 focus:ring-red-200'
                : 'border-gray-200 focus:border-primary focus:ring-primary/20'
            }`}
            disabled={isLoggingIn}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoggingIn}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        {errors.password && (
          <p className="text-sm text-red-500 animate-in slide-in-from-top-1 fade-in">
            {errors.password.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoggingIn}
        className="w-full bg-primary text-white font-medium py-3 rounded-xl hover:bg-primary/90 transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-primary/25 active:scale-[0.98]"
      >
        {isLoggingIn ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="animate-spin" size={20} />
            <span>Signing in...</span>
          </div>
        ) : (
          'Sign In'
        )}
      </button>

      <div className="text-center">
        <p className="text-sm text-gray-500">
           Protected by strict security protocols.
        </p>
      </div>
    </form>
  )
}
