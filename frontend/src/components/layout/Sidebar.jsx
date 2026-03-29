import * as React from "react"
import { Link, useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  UserCircle,
  FolderKanban,
  Users,
  MessageSquare,
  CircleDollarSign,
  PlusCircle,
  Search,
  FileText,
  CreditCard,
  ShieldCheck,
  AlertTriangle,
  BarChart3,
  LogOut,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { cn } from "../../utils/cn"
import { Button } from "../ui/button"

const navConfig = {
  freelancer: [
    { label: "Dashboard", to: "/freelancer/dashboard", icon: LayoutDashboard },
    { label: "Profile", to: "/freelancer/profile", icon: UserCircle },
    { label: "Browse Projects", to: "/freelancer/browse-projects", icon: Search },
    { label: "My Projects", to: "/freelancer/projects", icon: FolderKanban },
    { label: "Referrals", to: "/freelancer/referrals", icon: Users },
    { label: "Messages", to: "/freelancer/messages", icon: MessageSquare },
    { label: "Earnings", to: "/freelancer/earnings", icon: CircleDollarSign },
  ],
  client: [
    { label: "Dashboard", to: "/client/dashboard", icon: LayoutDashboard },
    { label: "My Projects", to: "/client/projects", icon: FolderKanban },
    { label: "Post Project", to: "/client/post-project", icon: PlusCircle },
    { label: "Find Freelancers", to: "/client/freelancers", icon: Search },
    { label: "AI Matches", to: "/client/matching-results", icon: Search },
    { label: "Contracts", to: "/client/contracts", icon: FileText },
    { label: "Messages", to: "/client/messages", icon: MessageSquare },
    { label: "Payments", to: "/client/payments", icon: CreditCard },
  ],
  admin: [
    { label: "Dashboard", to: "/admin/dashboard", icon: LayoutDashboard },
    { label: "User Management", to: "/admin/users", icon: Users },
    { label: "Verification", to: "/admin/verification", icon: ShieldCheck },
    { label: "Disputes", to: "/admin/disputes", icon: AlertTriangle },
    { label: "Analytics", to: "/admin/analytics", icon: BarChart3 },
  ],
}

export default function Sidebar({ role }) {
  const location = useLocation()
  const [collapsed, setCollapsed] = React.useState(false)
  const items = navConfig[role] || []

  const handleLogout = () => {
    localStorage.removeItem("token")
    window.location.href = "/login"
  }

  return (
    <aside
      className={cn(
        "fixed left-0 top-16 h-[calc(100vh-64px)] border-r border-[var(--border)] bg-[var(--card)] transition-all duration-300 z-40 hidden md:flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex-1 flex flex-col p-3 overflow-y-auto">
        <div className={cn("px-3 mb-4 transition-opacity", collapsed ? "opacity-0" : "opacity-100")}>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
            {role} portal
          </span>
        </div>

        <nav className="space-y-1">
          {items.map((item) => {
            const isActive = location.pathname === item.to
            const Icon = item.icon

            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 group relative",
                  isActive
                    ? "bg-[var(--secondary)] text-[var(--secondary-foreground)] font-semibold"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                )}
              >
                <Icon className={cn("w-5 h-5 shrink-0", isActive ? "text-[var(--primary)]" : "group-hover:text-[var(--foreground)]")} />
                {!collapsed && <span className="text-sm truncate">{item.label}</span>}

                {collapsed && (
                  <div className="absolute left-14 bg-[var(--foreground)] text-[var(--background)] text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                    {item.label}
                  </div>
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="p-3 border-t border-[var(--border)] flex flex-col gap-1">
        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md text-[var(--muted-foreground)] hover:bg-[var(--destructive)]/10 hover:text-[var(--destructive)] transition-all duration-200 group relative w-full text-left"
          )}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Sign Out</span>}
          {collapsed && (
            <div className="absolute left-14 bg-[var(--foreground)] text-[var(--background)] text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
              Sign Out
            </div>
          )}
        </button>

        <Button
          variant="ghost"
          size="icon"
          className="self-center mt-2"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>
    </aside>
  )
}
