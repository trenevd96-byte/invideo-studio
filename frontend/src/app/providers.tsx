'use client'

interface ProvidersProps {
  children: React.ReactNode
  session?: any
}

export function Providers({ children }: ProvidersProps) {
  return <>{children}</>
}