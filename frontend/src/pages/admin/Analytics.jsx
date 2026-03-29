import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Users, Briefcase, CircleDollarSign, ShieldAlert, TrendingUp, BarChart3, ArrowUpRight, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import { adminApi } from "../../services/api"

export default function AdminAnalytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.getAnalytics()
      .then(res => setData(res))
      .catch(err => console.error("Failed to load analytics", err))
      .finally(() => setLoading(false))
  }, [])

  const stats = [
    { label: "Total Users", value: data?.total_users || 0, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50", change: "+12%" },
    { label: "Active Projects", value: data?.total_projects || 0, icon: Briefcase, color: "text-blue-600", bg: "bg-blue-50", change: "+4%" },
    { label: "Platform Payouts", value: `KSh ${parseFloat(data?.total_payouts || 0).toLocaleString()}`, icon: CircleDollarSign, color: "text-emerald-600", bg: "bg-emerald-50", change: "+8%" },
    { label: "Open Disputes", value: data?.open_disputes || 0, icon: ShieldAlert, color: "text-orange-600", bg: "bg-orange-50", change: null },
  ]

  return (
    <div className="space-y-8 animate-in">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Platform Analytics</h1>
        <p className="text-[var(--muted-foreground)]">Key performance metrics across the SkillSync platform.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="border-none shadow-sm card-shadow bg-[var(--card)]">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-xl ${s.bg} ${s.color}`}><s.icon className="w-5 h-5" /></div>
                  <Badge variant="success" className="bg-emerald-50 text-emerald-700 border-none font-bold text-[10px]"><ArrowUpRight className="w-3 h-3 mr-0.5" />{s.change}</Badge>
                </div>
                <h3 className="text-2xl font-black tracking-tight">{s.value}</h3>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)] mt-1">{s.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User Growth */}
        <Card className="border-none shadow-sm card-shadow bg-[var(--card)]">
          <CardHeader>
            <CardTitle className="text-lg font-bold">User Growth</CardTitle>
            <CardDescription>New registrations over the last 6 months.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3 h-40">
              {[35, 50, 42, 68, 55, 85].map((h, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ delay: 0.3 + i * 0.08, duration: 0.8 }}
                  className="flex-1 bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-t-md cursor-pointer hover:from-indigo-600 hover:to-indigo-500 transition-colors"
                />
              ))}
            </div>
            <div className="flex gap-3 mt-2">
              {["May", "Jun", "Jul", "Aug", "Sep", "Oct"].map(m => (
                <span key={m} className="flex-1 text-center text-[10px] font-bold text-[var(--muted-foreground)]">{m}</span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Revenue */}
        <Card className="border-none shadow-sm card-shadow bg-[var(--card)]">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Revenue Breakdown</CardTitle>
            <CardDescription>Platform fees by category.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Project Commissions", value: "KSh 18.2M", pct: 64, color: "bg-indigo-500" },
              { label: "Subscription Fees", value: "KSh 6.8M", pct: 24, color: "bg-emerald-500" },
              { label: "Referral Bonuses", value: "KSh 3.4M", pct: 12, color: "bg-orange-500" },
            ].map(r => (
              <div key={r.label} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-bold">{r.label}</span>
                  <span className="text-[var(--muted-foreground)] font-bold">{r.value} ({r.pct}%)</span>
                </div>
                <div className="h-2 bg-[var(--muted)] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${r.pct}%` }}
                    transition={{ duration: 1 }}
                    className={`h-full rounded-full ${r.color}`}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed */}
      <Card className="border-none shadow-sm card-shadow bg-[var(--card)]">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Recent Platform Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { text: "New freelancer registration: Faith Muthoni", time: "2 min ago", type: "user" },
            { text: "Project posted: E-commerce Rebuild by Jumia Kenya", time: "15 min ago", type: "project" },
            { text: "Payment released: KSh 160,000 for SaaS Dashboard", time: "1 hr ago", type: "payment" },
            { text: "Credential approved: AWS cert for Wanjiku Kamau", time: "2 hr ago", type: "verification" },
          ].map((a, i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-[var(--muted)]/50 transition-colors">
              <div className={`w-2 h-2 rounded-full shrink-0 ${a.type === "user" ? "bg-indigo-500" : a.type === "project" ? "bg-blue-500" : a.type === "payment" ? "bg-emerald-500" : "bg-orange-500"}`} />
              <span className="text-sm font-medium flex-1">{a.text}</span>
              <span className="text-xs text-[var(--muted-foreground)] shrink-0">{a.time}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
