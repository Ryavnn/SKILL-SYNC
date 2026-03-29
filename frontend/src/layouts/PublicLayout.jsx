import { Outlet } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'

export default function PublicLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-[var(--background)] selection:bg-indigo-100 selection:text-indigo-900">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
    </div>
  )
}
