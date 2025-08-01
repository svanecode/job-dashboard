'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Wifi, WifiOff } from 'lucide-react'

export default function ConnectionStatus() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null)

  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Check if Supabase environment variables are set
        const hasSupabaseConfig = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        
        if (!hasSupabaseConfig) {
          setIsConnected(false)
          return
        }

        // Try to fetch a simple request to test connection
        const response = await fetch('/api/health', { 
          method: 'HEAD',
          cache: 'no-cache'
        })
        
        setIsConnected(response.ok)
      } catch {
        setIsConnected(false)
      }
    }

    checkConnection()
    
    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000)
    
    return () => clearInterval(interval)
  }, [])

  if (isConnected === null) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-2 text-sm"
    >
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
        isConnected 
          ? 'bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-300/20' 
          : 'bg-red-400/10 text-red-300 ring-1 ring-red-300/20'
      }`}>
        {isConnected ? (
          <Wifi className="size-4" />
        ) : (
          <WifiOff className="size-4" />
        )}
        <span className="font-medium">
          {isConnected ? 'Forbundet' : 'Offline'}
        </span>
      </div>
    </motion.div>
  )
} 