import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Briefcase, Users, Plus, FileText, Target, Wallet, Send, Filter, ChevronRight, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar"
import { clientApi } from "../../services/api"

export default function ClientDashboard() {
  const [contracts, setContracts] = useState([])
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState([])

  useEffect(() => {
    Promise.all([
      clientApi.getProjects(),
      clientApi.getContracts()
    ]).then(([projectsRes, contractsRes]) => {
      setProjects(projectsRes.data || [])
      setContracts(contractsRes.data || [])
    }).catch(err => console.error("Error fetching client dashboard data:", err))
      .finally(() => setLoading(false))
  }, [])

  const stats = [
    { label: "Active Jobs", value: projects.filter(p => p.status === 'open' || p.status === 'in_progress').length.toString(), icon: Briefcase, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Applicants", value: projects.reduce((acc, p) => acc + (p.proposals_count || 0), 0).toString(), icon: Users, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Active Contracts", value: contracts.filter(c => c.status === 'active').length.toString(), icon: Target, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Spend Total", value: `KSh ${contracts.reduce((acc, c) => acc + parseFloat(c.total_amount || 0), 0).toLocaleString()}`, icon: Wallet, color: "text-orange-600", bg: "bg-orange-50" },
  ]

  const activeTalents = contracts
    .filter(c => c.status === 'active')
    .map(c => ({
      name: c.freelancer_name,
      role: c.freelancer_title || "Freelancer",
      avatar: (c.freelancer_name || "??").substring(0, 2).toUpperCase(),
      rating: "5.0", // Placeholder for rating as we don't have reviews yet
      status: "Active"
    }))

  return (
    <div className="space-y-8 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Client Hub</h1>
          <p className="text-[var(--muted-foreground)]">Manage your open positions and collaborate with talent.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="font-semibold">
             <Filter className="w-4 h-4 mr-2" />
             Filter
          </Button>
          <Button className="font-bold bg-[var(--foreground)] text-[var(--background)] hover:bg-[var(--foreground)]/90 shadow-xl">
            <Plus className="w-4 h-4 mr-2" />
            Post a New Job
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="border-none shadow-sm card-shadow bg-[var(--card)]">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color}`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <Badge variant="outline" className="text-[10px] font-bold">YTD View</Badge>
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tight">{stat.value}</h3>
                  <p className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-widest mt-1">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <Card className="lg:col-span-3 border-none shadow-sm card-shadow bg-[var(--card)]">
           <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold">Active Talents</CardTitle>
              <CardDescription>The professionals currently working on your projects.</CardDescription>
           </CardHeader>
           <CardContent className="p-0">
              <div className="space-y-1 p-2">
                  {activeTalents.length === 0 ? (
                    <div className="py-12 text-center">
                       <p className="text-sm text-[var(--muted-foreground)]">No active freelancers found.</p>
                    </div>
                  ) : (
                    activeTalents.map(person => (
                      <div key={person.name} className="flex items-center justify-between p-4 hover:bg-[var(--muted)]/50 rounded-xl transition-colors cursor-pointer group">
                         <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12 border-2 border-indigo-100">
                               <AvatarFallback>{person.avatar}</AvatarFallback>
                            </Avatar>
                            <div>
                               <h4 className="font-bold text-sm">{person.name}</h4>
                               <p className="text-xs text-[var(--muted-foreground)] font-medium">{person.role}</p>
                            </div>
                         </div>
                         <div className="flex items-center gap-6">
                            <div className="text-right hidden sm:block">
                               <span className="block text-xs font-bold text-amber-500">★ {person.rating}</span>
                               <span className="block text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">{person.status}</span>
                            </div>
                            <Button variant="ghost" size="icon" className="group-hover:translate-x-1 transition-transform">
                               <ChevronRight className="w-5 h-5" />
                            </Button>
                         </div>
                      </div>
                    ))
                  )}
               </div>
              <div className="p-4 border-t border-[var(--border)] text-center">
                 <Button variant="link" className="text-xs font-bold text-[var(--primary)]">Hiring history & Analytics</Button>
              </div>
           </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-none shadow-sm card-shadow bg-indigo-600 text-white overflow-hidden relative">
           <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
              <Send className="w-32 h-32" />
           </div>
           <CardHeader>
              <CardTitle className="text-2xl font-bold">Quick Message</CardTitle>
              <CardDescription className="text-indigo-100">Blast an update to all active freelancers.</CardDescription>
           </CardHeader>
           <CardContent className="space-y-4 relative z-10">
              <textarea 
                className="w-full h-32 bg-white/10 border border-white/20 rounded-xl p-4 text-sm placeholder:text-indigo-200 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                placeholder="Type your message here..."
              />
              <Button className="w-full bg-white text-indigo-600 hover:bg-white/90 font-bold h-11">
                 Send Broadcast
                 <Send className="w-4 h-4 ml-2" />
              </Button>
           </CardContent>
        </Card>
      </div>
    </div>
  )
}
