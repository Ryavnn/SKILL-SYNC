import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Link, useNavigate } from "react-router-dom"
import { User, Briefcase, Mail, Lock, ArrowRight, Loader2, Zap, CheckCircle2 } from "lucide-react"
import { useAuth } from "../hooks/useAuth"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card"
import { cn } from "../utils/cn"

export default function Register() {
  const [role, setRole] = useState("freelancer")
  const [formData, setFormData] = useState({ name: "", email: "", password: "", company: "" })
  const { register, loading, error } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    const { name, email, password } = formData
    const success = await register({ name, email, password, role })
    if (success) {
      const userStr = localStorage.getItem("user")
      if (userStr) {
        const user = JSON.parse(userStr)
        navigate(`/${user.role}/dashboard`)
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-32 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.05),transparent_40%)]">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-[var(--primary)] rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Zap className="fill-white text-white w-5 h-5" />
            </div>
          </Link>
          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight">Create your account</h1>
          <p className="text-[var(--muted-foreground)] mt-2">Join the global network of IT excellence.</p>
        </div>

        <Card className="border-[var(--border)] shadow-2xl shadow-black/5 bg-[var(--card)]/80 backdrop-blur-xl">
          <CardContent className="p-8 lg:p-12">
            <form onSubmit={handleSubmit} className="space-y-8">
              {error && (
                <div className="p-4 text-sm font-semibold bg-red-50 text-red-600 rounded-lg border border-red-100 animate-in">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <Label className="text-base font-bold">I am a...</Label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setRole("freelancer")}
                    className={cn(
                      "p-4 lg:p-6 rounded-2xl border-2 text-left transition-all duration-300 relative group overflow-hidden",
                      role === "freelancer"
                        ? "border-[var(--primary)] bg-indigo-50/50"
                        : "border-[var(--border)] bg-transparent hover:border-indigo-200"
                    )}
                  >
                    <div className={cn("w-10 h-10 rounded-xl mb-3 flex items-center justify-center transition-colors", role === "freelancer" ? "bg-indigo-500 text-white" : "bg-[var(--muted)] text-[var(--muted-foreground)]")}>
                      <User className="w-5 h-5" />
                    </div>
                    <span className="block font-bold text-lg">Freelancer</span>
                    <span className="block text-xs text-[var(--muted-foreground)] mt-1">Found my next challenge</span>
                    {role === "freelancer" && <CheckCircle2 className="absolute top-4 right-4 w-5 h-5 text-indigo-500 animate-in" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole("client")}
                    className={cn(
                      "p-4 lg:p-6 rounded-2xl border-2 text-left transition-all duration-300 relative group overflow-hidden",
                      role === "client"
                        ? "border-[var(--primary)] bg-indigo-50/50"
                        : "border-[var(--border)] bg-transparent hover:border-indigo-200"
                    )}
                  >
                    <div className={cn("w-10 h-10 rounded-xl mb-3 flex items-center justify-center transition-colors", role === "client" ? "bg-indigo-500 text-white" : "bg-[var(--muted)] text-[var(--muted-foreground)]")}>
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <span className="block font-bold text-lg">Client</span>
                    <span className="block text-xs text-[var(--muted-foreground)] mt-1">Hiring top-tier talent</span>
                    {role === "client" && <CheckCircle2 className="absolute top-4 right-4 w-5 h-5 text-indigo-500 animate-in" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                {role === "client" && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "100%" }}
                    className="space-y-2 md:col-span-2"
                  >
                    <Label htmlFor="company">Company Name</Label>
                    <Input
                      id="company"
                      placeholder="Acme Inc."
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      required
                    />
                  </motion.div>
                )}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="password">Create Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                  <p className="text-[10px] text-[var(--muted-foreground)] flex items-center gap-1.5 mt-1">
                    <CheckCircle2 className="w-3 h-3" /> Must be at least 8 characters long
                  </p>
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full h-12 font-bold rounded-xl group" disabled={loading}>
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-10 pt-8 border-t border-[var(--border)] text-center">
              <p className="text-sm text-[var(--muted-foreground)] font-medium">
                Already have an account?{" "}
                <Link to="/login" className="text-[var(--primary)] hover:underline font-bold">
                  Sign in now
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
