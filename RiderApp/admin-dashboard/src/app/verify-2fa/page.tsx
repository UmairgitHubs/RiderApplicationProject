'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Shield, ArrowLeft } from 'lucide-react'
import { authApi } from '@/lib/api'
import { auth } from '@/lib/auth'
import Link from 'next/link'

export default function VerifyTwoFactorPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''

  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [timer, setTimer] = useState(60)
  const [resending, setResending] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus()
  }, [])

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1)
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [timer])

  const handleOtpChange = (value: string, index: number) => {
    // Only allow numbers
    const numericValue = value.replace(/[^0-9]/g, '')
    
    if (numericValue.length > 1) {
      // Handle paste
      const pastedOtp = numericValue.slice(0, 6).split('')
      const newOtp = [...otp]
      pastedOtp.forEach((digit, i) => {
        if (index + i < 6) {
          newOtp[index + i] = digit
        }
      })
      setOtp(newOtp)
      
      // Focus the last filled input
      const lastIndex = Math.min(index + pastedOtp.length - 1, 5)
      inputRefs.current[lastIndex]?.focus()
    } else {
      const newOtp = [...otp]
      newOtp[index] = numericValue
      setOtp(newOtp)

      // Auto-focus next input
      if (numericValue && index < 5) {
        inputRefs.current[index + 1]?.focus()
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleVerify = async () => {
    const otpCode = otp.join('')
    
    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit code.')
      return
    }

    if (!email) {
      setError('Email not found. Please start over.')
      router.push('/login')
      return
    }

    setError('')
    setLoading(true)

    try {
      // Verify using 2FA endpoint
      const response = await authApi.verify2FA(email, otpCode)
      
      if (response.success) {
        // Token is set by API helper if successful
        router.push('/dashboard')
      } else {
        setError('Invalid or expired verification code. Please try again.')
        setOtp(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
          'Failed to verify OTP. Please try again.'
      )
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    if (timer > 0 || !email) return

    setResending(true)
    setError('')

    try {
      await authApi.forgotPassword(email)
      setTimer(60)
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } catch (err: any) {
      setError('Failed to resend OTP. Please try again.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        {/* Header Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
            <Shield className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-2">
          <h1 className="text-2xl font-bold text-primary">Verify OTP</h1>
        </div>

        {/* Instructions */}
        <div className="text-center mb-8">
          <p className="text-gray-600 text-sm">
            Enter the 6-digit code sent to your email
          </p>
          <p className="text-gray-400 text-xs mt-1">
            (Use: 123456 for demo)
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* OTP Input */}
        <div className="mb-6">
          <label
            htmlFor="otp"
            className="block text-sm font-medium text-gray-700 mb-3"
          >
            OTP Code
          </label>
          <div className="flex gap-2 justify-center">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className="w-12 h-14 text-center text-xl font-semibold border-2 border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary outline-none transition-colors"
              />
            ))}
          </div>
        </div>

        {/* Resend OTP */}
        <div className="text-center mb-6">
          {timer > 0 ? (
            <p className="text-sm text-gray-500">
              Resend code in {timer}s
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={resending}
              className="text-sm font-medium text-primary hover:text-primary-600 disabled:opacity-50"
            >
              {resending ? 'Resending...' : 'Resend OTP'}
            </button>
          )}
        </div>

        {/* Verify Button */}
        <button
          type="button"
          onClick={handleVerify}
          disabled={loading || otp.join('').length !== 6}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-lg text-white bg-primary hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium mb-4"
        >
          {loading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Verifying...
            </>
          ) : (
            'Verify & Login'
          )}
        </button>

        {/* Back to Login */}
        <Link
          href="/login"
          className="flex items-center justify-center gap-2 text-sm font-medium text-primary hover:text-primary-600"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </Link>
      </div>
    </div>
  )
}



