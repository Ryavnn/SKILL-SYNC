import React from "react"
import { motion } from "framer-motion"
import { ShieldAlert, AlertTriangle, MessageSquare, CheckCircle2, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"

const DISPUTES = [
  { id: 1, project: "SaaS Dashboard Redesign", claimant: "Safaricom PLC", respondent: "Wanjiku K.", type: "Milestone Scope", priority: "High", status: "Open", date: "Oct 12, 2026" },
  { id: 2, project: "Mobile App API", claimant: "Brian K.", respondent: "M-Kopa Solar", type: "Late Payment", priority: "Medium", status: "Under Review", date: "Oct 10, 2026" },
  { id: 3, project: "Logo Redesign", claimant: "Jumia Kenya", respondent: "Amina O.", type: "Quality Dispute", priority: "Low", status: "Resolved", date: "Sep 28, 2026" },
]

export default function AdminDisputes() {
  return (
    <div className="space-y-8 animate-in">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Dispute Resolution</h1>
        <p className="text-[var(--muted-foreground)]">Manage and resolve contract and payment disputes.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Open Disputes", value: "1", icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
          { label: "Under Review", value: "1", icon: Clock, color: "text-orange-600", bg: "bg-orange-50" },
          { label: "Resolved", value: "14", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
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
        <CardHeader><CardTitle className="text-lg font-bold">All Disputes</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Project</TableHead>
                <TableHead>Parties</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {DISPUTES.map(d => (
                <TableRow key={d.id}>
                  <TableCell className="pl-6 font-semibold">{d.project}</TableCell>
                  <TableCell className="text-sm text-[var(--muted-foreground)]">{d.claimant} vs {d.respondent}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px] font-bold">{d.type}</Badge></TableCell>
                  <TableCell>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${d.priority === "High" ? "text-red-500" : d.priority === "Medium" ? "text-orange-500" : "text-blue-500"}`}>{d.priority}</span>
                  </TableCell>
                  <TableCell><Badge variant={d.status === "Resolved" ? "success" : d.status === "Open" ? "destructive" : "secondary"} className="text-[10px] font-bold uppercase">{d.status}</Badge></TableCell>
                  <TableCell className="text-right pr-6">
                    <Button variant="ghost" size="sm" className="font-bold text-xs"><MessageSquare className="w-3 h-3 mr-1" /> Review</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
