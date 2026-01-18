import React from 'react'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'rect' | 'circle'
}

export default function Skeleton({ className = '', variant = 'rect' }: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-gray-200'
  
  let variantClasses = ''
  switch (variant) {
    case 'text':
      variantClasses = 'h-4 w-full rounded'
      break
    case 'circle':
      variantClasses = 'rounded-full'
      break
    case 'rect':
    default:
      variantClasses = 'rounded-md'
      break
  }

  return <div className={`${baseClasses} ${variantClasses} ${className}`} />
}
