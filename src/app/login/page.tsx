'use client'

import { Suspense } from 'react'
import LoginForm from '@/components/LoginForm'

function LoginPageContent() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Ambient gradients */}
      <div className="pointer-events-none absolute inset-0 bg-radial" />
      {/* Centered auth card */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="card-mobile p-6 md:p-8">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  )
} 