import AdminPanel from '@/components/AdminPanel'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function AdminPage() {
  return (
    <ProtectedRoute requireAdmin>
      <main className="bg-radial relative min-h-screen text-slate-200 overflow-x-hidden w-full max-w-full">
        {/* Noise overlay */}
        <div className="noise" />
        
        {/* Main content */}
        <div className="relative z-10 overflow-x-hidden w-full max-w-full">
          {/* Header */}
          <div className="container-mobile md:container mx-auto py-6 md:py-10 overflow-hidden w-full max-w-full">
            <div className="mb-8">
              <h1 className="font-heading text-3xl sm:text-4xl tracking-tight text-white mb-2">
                Admin Dashboard
              </h1>
              <p className="text-slate-400 text-lg">
                Administrer chatbot og systemindstillinger
              </p>
            </div>
          </div>

          {/* Admin Panel */}
          <div className="container-mobile md:container mx-auto overflow-hidden w-full max-w-full">
            <AdminPanel />
          </div>
        </div>
      </main>
    </ProtectedRoute>
  )
} 