import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Users, ShieldAlert, BarChart3, Database, Search, ArrowRight, UserCheck, ShieldX, TrendingUp, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { Input } from "../../components/ui/input"
import { adminApi } from "../../services/api"
import { cn } from "../../utils/cn"

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState(null)

  useEffect(() => {
    adminApi.getAnalytics()
      .then(data => setAnalytics(data))
      .catch(err => console.error("Error fetching analytics:", err))
      .finally(() => setLoading(false))
  }, [])

  const stats = [
    { label: "Total Users", value: analytics?.total_users || "0", icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Pending Vetting", value: analytics?.pending_freelancers || "0", icon: UserCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Active Disputes", value: analytics?.active_disputes || "0", icon: ShieldAlert, color: "text-red-600", bg: "bg-red-50" },
    { label: "System Health", value: "99.9%", icon: Database, color: "text-blue-600", bg: "bg-blue-50" },
  ]

  const alerts = analytics?.recent_alerts || []

  return (
    <div className="space-y-8 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">System Control</h1>
          <p className="text-[var(--muted-foreground)] font-medium">Platform-wide analytics and administrative oversight.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)] group-focus-within:text-[var(--primary)] transition-colors" />
            <Input className="pl-10 h-10 w-48 lg:w-64 bg-[var(--muted)]/50 border-none" placeholder="Find user or log ID..." />
          </div>
          <Button variant="outline" className="font-bold border-2">Export Logs</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="border-none shadow-sm card-shadow bg-[var(--card)]">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black tracking-tighter leading-none">{stat.value}</h3>
                    <p className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest mt-1">{stat.label}</p>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                   <div className={`h-full ${stat.color.replace('text', 'bg')} opacity-40 w-2/3`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-sm card-shadow bg-[var(--card)]">
           <CardHeader className="flex flex-row items-center justify-between pb-6">
              <div>
                <CardTitle className="text-xl font-bold">Critical Alerts</CardTitle>
                <CardDescription>Actions requiring immediate administrative review.</CardDescription>
              </div>
              <Badge variant="destructive" className="animate-pulse">Live Feed</Badge>
           </CardHeader>
           <CardContent className="p-0">
             <Table>
               <TableHeader>
                 <TableRow>
                    <TableHead className="pl-6">Alert Category</TableHead>
                    <TableHead>Insight</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead className="text-right pr-6">Activity</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {alerts.map(alert => (
                   <TableRow key={alert.id} className="group cursor-pointer">
                      <TableCell className="pl-6">
                         <Badge variant="outline" className="font-bold border-indigo-100 bg-indigo-50/20 text-indigo-700">
                            {alert.type}
                         </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-sm group-hover:text-[var(--primary)] transition-colors">
                         {alert.title}
                      </TableCell>
                      <TableCell>
                         <span className={cn(
                           "text-[10px] font-black uppercase tracking-widest",
                           alert.priority === "High" ? "text-red-500" : alert.priority === "Medium" ? "text-orange-500" : "text-blue-500"
                         )}>
                            {alert.priority}
                         </span>
                      </TableCell>
                      <TableCell className="text-right pr-6 text-xs font-medium text-[var(--muted-foreground)]">
                         {alert.time}
                      </TableCell>
                   </TableRow>
                 ))}
               </TableBody>
             </Table>
             <div className="p-4 text-center border-t border-[var(--border)]">
                <Button variant="ghost" size="sm" className="font-bold text-[var(--primary)] text-xs">Access Platform Audit Logs</Button>
             </div>
           </CardContent>
        </Card>

        <Card className="border-none shadow-sm card-shadow bg-slate-900 text-white flex flex-col justify-between p-2">
            <CardHeader className="p-6">
               <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="text-emerald-400 w-8 h-8" />
                  <Badge className="bg-emerald-400/20 text-emerald-400 border-none font-black text-[10px]">RECORD GROWTH</Badge>
               </div>
               <CardTitle className="text-3xl font-black mt-2">Scale Report</CardTitle>
               <CardDescription className="text-slate-400">Monthly platform volume increased by 28% compared to Q3.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-4">
               <div className="flex items-end gap-2 h-32">
                 {[40, 70, 45, 90, 65, 80, 100].map((h, i) => (
                   <motion.div 
                     key={i}
                     initial={{ height: 0 }}
                     animate={{ height: `${h}%` }}
                     transition={{ delay: 0.5 + i * 0.05, duration: 1 }}
                     className="flex-1 bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-t-sm"
                   />
                 ))}
               </div>
               <Button className="w-full bg-indigo-500 hover:bg-indigo-400 text-white font-bold border-none h-11">
                  View Q4 Snapshot
                  <ArrowRight className="w-4 h-4 ml-2" />
               </Button>
            </CardContent>
        </Card>
      </div>
    </div>
  )
}
