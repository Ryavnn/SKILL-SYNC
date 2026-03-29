import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { FileText, CheckCircle2, Clock, CircleDollarSign, ArrowRight, Loader2, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { Avatar, AvatarFallback } from "../../components/ui/avatar"
import { contractApi } from "../../services/api"

export default function ClientContracts() {
  const [contracts, setContracts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchContracts()
  }, [])

  const fetchContracts = async () => {
    try {
      setLoading(true)
      const res = await contractApi.getContracts()
      setContracts(res.data || [])
      setError(null)
    } catch (err) {
      console.error(err)
      setError(err.message || "Failed to load contracts")
    } finally {
      setLoading(false)
    }
  }

  const activeContracts = contracts.filter(c => c.status === 'active').length
  
  const milestonesDue = contracts.reduce((total, c) => {
    const pending = c.milestones?.filter(m => m.status === 'pending').length || 0
    return total + pending
  }, 0)

  const totalSpent = contracts.reduce((total, c) => total + parseFloat(c.totalAmount || 0), 0)
  
  const formatCurrency = (val) => new Intl.NumberFormat('en-KE', { 
    style: 'currency', 
    currency: 'KES', 
    maximumFractionDigits: 0 
  }).format(val).replace('KES', 'KSh')

  const getInitials = (name) => {
    if (!name) return "?"
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-[var(--muted-foreground)]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)] mb-4" />
        <p>Loading contracts...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-red-500">
        <AlertCircle className="w-8 h-8 mb-4 border-red-500" />
        <p className="font-bold">{error}</p>
        <Button onClick={fetchContracts} variant="outline" className="mt-4">Try Again</Button>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Contracts</h1>
        <p className="text-[var(--muted-foreground)]">Manage milestones and track project progress.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Active Contracts", value: activeContracts, icon: FileText, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Milestones Due", value: milestonesDue, icon: Clock, color: "text-orange-600", bg: "bg-orange-50" },
          { label: "Total Committed", value: formatCurrency(totalSpent), icon: CircleDollarSign, color: "text-emerald-600", bg: "bg-emerald-50" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="border-none shadow-sm card-shadow bg-[var(--card)]">
              <CardContent className="p-6 flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${s.bg} ${s.color}`}><s.icon className="w-6 h-6" /></div>
                <div>
                  <h3 className="text-2xl font-black tracking-tight">{s.value}</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="border-none shadow-sm card-shadow bg-[var(--card)]">
        <CardHeader>
          <CardTitle className="text-lg font-bold">All Contracts</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {contracts.length === 0 ? (
            <div className="p-8 text-center text-[var(--muted-foreground)]">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No contracts found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Project</TableHead>
                  <TableHead>Freelancer</TableHead>
                  <TableHead>Milestones</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right pr-6">Budget</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map(c => {
                  const totalMilestones = c.milestones?.length || 0
                  const completedMilestones = c.milestones?.filter(m => m.status === 'completed' || m.status === 'approved').length || 0
                  const progressPct = totalMilestones === 0 ? 0 : (completedMilestones / totalMilestones) * 100

                  return (
                    <TableRow key={c.id} className="cursor-pointer group">
                      <TableCell className="pl-6 font-semibold group-hover:text-indigo-600 transition-colors">
                        {c.projectTitle || "Unnamed Project"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="text-[10px] font-bold">{getInitials(c.freelancerName)}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{c.freelancerName || "Unknown"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-[var(--muted)] rounded-full overflow-hidden">
                            <div className="h-full bg-[var(--primary)] rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                          </div>
                          <span className="text-xs font-bold">{completedMilestones}/{totalMilestones}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={c.status === "active" ? "default" : "secondary"} className="text-[10px] font-bold uppercase">
                          {c.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6 font-bold">{formatCurrency(c.totalAmount)}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
