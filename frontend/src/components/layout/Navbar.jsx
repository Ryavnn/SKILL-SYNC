import { Link, NavLink } from "react-router-dom"
import { ArrowRight, Menu, Zap } from "lucide-react"
import { Button } from "../ui/button"

export default function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 border-b border-transparent bg-[var(--background)]/60 backdrop-blur-lg z-50 transition-all duration-300">
      <div className="container h-full flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 bg-[var(--primary)] rounded-xl flex items-center justify-center shadow-indigo-500/20 shadow-xl group-hover:scale-105 transition-transform">
            <Zap className="fill-white text-white w-5 h-5" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-[var(--foreground)]">
            SkillSync
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <NavLink to="/" className={({ isActive }) => `px-4 py-2 text-sm font-medium transition-colors ${isActive ? "text-[var(--primary)]" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"}`}>
            Solutions
          </NavLink>
          <NavLink to="/marketplace" className="px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
            Freelancers
          </NavLink>
          <NavLink to="/about" className="px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
            Resources
          </NavLink>
          <NavLink to="/pricing" className="px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
            Pricing
          </NavLink>
        </nav>

        <div className="flex items-center gap-3">
          <Link to="/login" className="hidden sm:block">
            <Button variant="ghost" size="sm" className="font-semibold">Sign In</Button>
          </Link>
          <Link to="/register">
            <Button size="sm" className="font-bold bg-[var(--foreground)] text-[var(--background)] hover:bg-[var(--foreground)]/90 px-6 group rounded-full">
              Get Started
              <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}
