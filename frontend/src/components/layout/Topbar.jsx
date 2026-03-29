import * as React from "react"
import { Link } from "react-router-dom"
import { Bell, Search, Settings, HelpCircle, Menu, Check, Loader2 } from "lucide-react"
import { useAuth } from "../../hooks/useAuth"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { notificationApi } from "../../services/api"

export default function Topbar() {
  const { user } = useAuth()
  
  const [showNotif, setShowNotif] = React.useState(false)
  const [notifications, setNotifications] = React.useState([])
  const [loadingNotifs, setLoadingNotifs] = React.useState(false)
  const notifRef = React.useRef(null)

  React.useEffect(() => {
    if (user) {
      setLoadingNotifs(true)
      notificationApi.getNotifications()
        .then(res => {
          // Backend returns { status: "success", data: { notifications: [...], unread_count: X } }
          setNotifications(res.data?.notifications || [])
        })
        .catch(err => {
          console.error("Failed to load notifications", err)
          setNotifications([])
        })
        .finally(() => setLoadingNotifs(false))
    }
  }, [user])

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotif(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation()
    try {
      await notificationApi.markAsRead(id)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    } catch (err) {
      console.error("Failed to mark notification as read", err)
    }
  }

  const unreadCount = Array.isArray(notifications) 
    ? notifications.filter(n => !n.is_read).length 
    : 0

  const initials = user?.name
    ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "SS"

  return (
    <header className="fixed top-0 left-0 right-0 h-16 border-b border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-md z-50 px-4 flex items-center justify-between">
      <div className="flex items-center gap-4 lg:gap-8">
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="w-5 h-5" />
        </Button>
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-[var(--primary)] rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <span className="font-[var(--font-sans)] font-extrabold text-xl tracking-tight text-[var(--foreground)] hidden sm:block">
            SkillSync
          </span>
        </Link>

        {/* Search */}
        <div className="hidden md:flex items-center relative w-64 lg:w-96 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)] group-focus-within:text-[var(--primary)] transition-colors" />
          <Input 
            placeholder="Search projects or skills..." 
            className="pl-10 h-9 bg-[var(--muted)]/50 border-none focus-visible:ring-1"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded border border-[var(--border)] bg-[var(--card)] text-[10px] font-medium text-[var(--muted-foreground)]">⌘</kbd>
            <kbd className="px-1.5 py-0.5 rounded border border-[var(--border)] bg-[var(--card)] text-[10px] font-medium text-[var(--muted-foreground)]">K</kbd>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-1">
          <Button variant="ghost" size="icon" className="text-[var(--muted-foreground)]">
            <HelpCircle className="w-5 h-5" />
          </Button>

          {/* Notifications Dropdown Container */}
          <div className="relative" ref={notifRef}>
            <Button 
               variant="ghost" 
               size="icon" 
               className="text-[var(--muted-foreground)] relative"
               onClick={() => setShowNotif(!showNotif)}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[var(--card)] animate-pulse" />
              )}
            </Button>

            {/* Dropdown Panel */}
            {showNotif && (
              <div className="absolute top-full mt-2 right-0 w-80 max-h-[85vh] overflow-y-auto bg-[var(--card)] border border-[var(--border)] shadow-2xl rounded-2xl p-2 z-50 animate-in fade-in slide-in-from-top-4 origin-top-right">
                <div className="px-3 py-2 flex items-center justify-between border-b border-[var(--border)] mb-2">
                   <h3 className="font-bold text-sm">Notifications</h3>
                   <span className="text-[10px] font-bold bg-[var(--muted)] px-2 py-0.5 rounded-full">{unreadCount} unread</span>
                </div>
                
                {loadingNotifs ? (
                  <div className="py-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-indigo-500" /></div>
                ) : !Array.isArray(notifications) || notifications.length === 0 ? (
                  <div className="py-8 text-center text-sm text-[var(--muted-foreground)]">You have no notifications.</div>
                ) : (
                  <div className="space-y-1">
                    {notifications.map(n => (
                      <div key={n.id} className={`p-3 rounded-xl transition-colors ${n.is_read ? 'opacity-70 hover:bg-[var(--muted)]/50' : 'bg-indigo-50/50 hover:bg-indigo-50 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20'}`}>
                        <div className="flex justify-between items-start gap-2">
                          <p className={`text-sm ${n.is_read ? 'font-medium' : 'font-bold'}`}>{n.message}</p>
                          {!n.is_read && (
                            <button onClick={(e) => handleMarkAsRead(n.id, e)} className="text-indigo-600 hover:text-indigo-800 shrink-0 p-1" title="Mark as read">
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <div className="mt-1.5 flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">{n.type}</span>
                          <span className="text-[10px] text-[var(--muted-foreground)]">{new Date(n.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <Button variant="ghost" size="icon" className="text-[var(--muted-foreground)]">
            <Settings className="w-5 h-5" />
          </Button>
        </div>
        
        <div className="h-6 w-[1px] bg-[var(--border)] mx-2 hidden sm:block" />

        <div className="flex items-center gap-3 pl-2">
          <div className="hidden lg:flex flex-col items-end">
            <span className="text-sm font-semibold leading-none">{user?.name || "Guest User"}</span>
            <span className="text-[11px] font-medium text-[var(--muted-foreground)] capitalize">{user?.role || "Visitor"}</span>
          </div>
          <Avatar className="h-9 w-9 border border-[var(--border)] ring-2 ring-[var(--background)] ring-offset-2 transition-all hover:ring-[var(--primary)] cursor-pointer">
            <AvatarImage src={user?.avatar} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}
