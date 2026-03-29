import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { CircleDollarSign, TrendingUp, ArrowUpRight, Wallet, Download, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { paymentApi } from "../../services/api"

export default function FreelancerEarnings() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total_earned: "0", pending: "0", contracts: [] })
  const [transactions, setTransactions] = useState([])

  useEffect(() => {
    Promise.all([
      paymentApi.getEarnings(),
      paymentApi.getPayments()
    ]).then(([earningsRes, paymentsRes]) => {
      setStats(earningsRes.data || { total_earned: "0", pending: "0", contracts: [] })
      setTransactions(paymentsRes.data || [])
    }).catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  // Calculate Avg Per Project
  const activeContracts = stats.contracts ? stats.contracts.length : 0
  const totalNumber = parseFloat(stats.total_earned) || 0
  const avgProject = activeContracts > 0 ? (totalNumber / activeContracts) : 0

  return (
    <div className="space-y-8 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Earnings</h1>
          <p className="text-[var(--muted-foreground)]">Track your income and milestone payments.</p>
        </div>
        <Button variant="outline" className="font-bold"><Download className="w-4 h-4 mr-2" /> Export Statement</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Earnings", value: `KSh ${parseFloat(stats.total_earned).toLocaleString()}`, icon: CircleDollarSign, color: "text-emerald-600", bg: "bg-emerald-50", change: "+18%" },
          { label: "Pending Payouts", value: `KSh ${parseFloat(stats.pending).toLocaleString()}`, icon: Wallet, color: "text-orange-600", bg: "bg-orange-50", change: null },
          { label: "Active Contracts", value: activeContracts.toString(), icon: TrendingUp, color: "text-indigo-600", bg: "bg-indigo-50", change: null },
          { label: "Avg. Per Project", value: `KSh ${Math.round(avgProject).toLocaleString()}`, icon: ArrowUpRight, color: "text-blue-600", bg: "bg-blue-50", change: null },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="border-none shadow-sm card-shadow bg-[var(--card)]">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-xl ${s.bg} ${s.color}`}><s.icon className="w-5 h-5" /></div>
                  {s.change && <Badge variant="success" className="bg-emerald-50 text-emerald-700 border-none font-bold text-[10px]"><ArrowUpRight className="w-3 h-3 mr-0.5" />{s.change}</Badge>}
                </div>
                <h3 className="text-2xl font-black tracking-tight">{s.value}</h3>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)] mt-1">{s.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Earnings Chart Placeholder */}
      <Card className="border-none shadow-sm card-shadow bg-[var(--card)]">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Monthly Overview (Prototype)</CardTitle>
          <CardDescription>Earnings trend across the last 6 months.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3 h-40">
            {[28, 45, 62, 38, 75, 90].map((h, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ delay: 0.3 + i * 0.08, duration: 0.8 }}
                className="flex-1 bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-t-md relative group cursor-pointer"
              >
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 text-[10px] font-bold bg-[var(--foreground)] text-[var(--background)] px-2 py-0.5 rounded transition-opacity whitespace-nowrap">
                  KSh {Math.round(h * 4500).toLocaleString()}
                </div>
              </motion.div>
            ))}
          </div>
          <div className="flex gap-3 mt-2">
            {["May", "Jun", "Jul", "Aug", "Sep", "Oct"].map(m => (
              <span key={m} className="flex-1 text-center text-[10px] font-bold text-[var(--muted-foreground)]">{m}</span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card className="border-none shadow-sm card-shadow bg-[var(--card)]">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Transaction History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
             <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>
          ) : transactions.length === 0 ? (
             <div className="text-center py-10 text-[var(--muted-foreground)]">No transactions found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Project</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right pr-6">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="pl-6 font-semibold">{t.project_title || "Unknown Project"}</TableCell>
                    <TableCell className="text-sm">{t.client_name || "Unknown"}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px] font-bold uppercase">{t.type}</Badge></TableCell>
                    <TableCell><Badge variant={t.status === "completed" ? "success" : "secondary"} className="text-[10px] font-bold uppercase">{t.status}</Badge></TableCell>
                    <TableCell className="text-right font-bold text-emerald-600">
                      {t.type === 'release' ? '+' : ''}KSh {parseFloat(t.amount).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right pr-6 text-sm text-[var(--muted-foreground)]">
                       {t.created_at ? new Date(t.created_at).toLocaleDateString() : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

