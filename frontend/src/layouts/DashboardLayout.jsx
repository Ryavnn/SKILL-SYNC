import { Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Topbar from '../components/layout/Topbar'
import Sidebar from '../components/layout/Sidebar'
import { cn } from '../utils/cn'

export default function DashboardLayout({ role }) {
  const { user, loading } = useAuth()

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to="/" replace />

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Topbar />
      <div className="flex pt-16">
        <Sidebar role={role} />
        <main className={cn(
          "flex-1 flex flex-col min-h-[calc(100vh-64px)] transition-all duration-300",
          "md:ml-64"
        )}>
          <div className="flex-1 p-4 md:p-8 lg:p-10">
            <div className="max-w-7xl mx-auto">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
