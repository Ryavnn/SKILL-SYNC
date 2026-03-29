import React, { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import {
  Users, Copy, Gift, CheckCircle2, Clock, Share2, Mail,
  AlertCircle, Loader2, ArrowUpRight, UserX,
} from "lucide-react"
import {
  Card, CardContent, CardHeader, CardTitle,
} from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "../../components/ui/table"
import { Avatar, AvatarFallback } from "../../components/ui/avatar"
import { referralApi } from "../../services/api"

// ─── Status badge config ─────────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending:  { variant: "secondary", label: "Pending" },
  accepted: { variant: "success",   label: "Accepted" },
  rejected: { variant: "destructive", label: "Rejected" },
  expired:  { variant: "outline",   label: "Expired" },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function initials(name = "") {
  return name.trim().split(/\s+/).map(n => n[0] ?? "").join("").toUpperCase().slice(0, 2) || "?"
}

function formatDate(iso) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" })
}

function formatReward(amount) {
  if (!amount || amount === 0) return "—"
  return `KSh ${Number(amount).toLocaleString()}`
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function FreelancerReferrals() {
  const [referral, setReferral] = useState(null)   // { referral_code, referral_link }
  const [stats,    setStats]    = useState(null)   // aggregated counts
  const [history,  setHistory]  = useState([])     // enriched referral list
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)
  const [copied,   setCopied]   = useState(false)  // copy-to-clipboard feedback

  // ── Fetch all referral data on mount ────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [meRes, statsRes, historyRes] = await Promise.all([
        referralApi.getMyReferral(),
        referralApi.getReferralStats(),
        referralApi.getReferralHistory(),
      ])
      setReferral(meRes.data)
      setStats(statsRes.data)
      setHistory(Array.isArray(historyRes.data) ? historyRes.data : [])
    } catch (err) {
      setError(err.message || "Failed to load referral data. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ── Copy to clipboard ────────────────────────────────────────────────────────
  const handleCopy = () => {
    if (!referral?.referral_link) return
    navigator.clipboard.writeText(referral.referral_link).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    })
  }

  // ── Share helpers ─────────────────────────────────────────────────────────────
  const shareText = referral
    ? `Join SkillSync and get matched to top projects! Use my referral link: ${referral.referral_link}`
    : ""

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`
  const emailUrl    = `mailto:?subject=${encodeURIComponent("Join SkillSync via my referral")}&body=${encodeURIComponent(shareText)}`

  // ── Stats grid config ──────────────────────────────────────────────────────
  const statCards = stats
    ? [
        { label: "Total Referrals",    value: stats.total_referrals,    icon: Users,        color: "text-indigo-600", bg: "bg-indigo-50"  },
        { label: "Pending",            value: stats.pending_referrals,  icon: Clock,        color: "text-orange-600", bg: "bg-orange-50"  },
        { label: "Rewards Earned",     value: formatReward(stats.total_earned), icon: Gift, color: "text-emerald-600",bg: "bg-emerald-50" },
      ]
    : []

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 animate-in">

      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Referral Program</h1>
          <p className="text-[var(--muted-foreground)]">Refer projects to peers and earn rewards.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="font-bold"
            onClick={() => window.open(whatsappUrl, "_blank")}
            disabled={!referral}
            title="Share via WhatsApp"
          >
            {/* WhatsApp icon via SVG */}
            <svg viewBox="0 0 24 24" className="w-4 h-4 mr-2 fill-green-500" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WhatsApp
          </Button>
          <Button
            className="font-bold shadow-lg shadow-indigo-500/20"
            onClick={() => window.location.href = emailUrl}
            disabled={!referral}
          >
            <Mail className="w-4 h-4 mr-2" /> Share via Email
          </Button>
        </div>
      </div>

      {/* ── Global Error Banner ────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-red-200 bg-red-50 text-red-700">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
          <Button variant="ghost" size="sm" className="ml-auto text-red-600 hover:text-red-700" onClick={fetchAll}>
            Retry
          </Button>
        </div>
      )}

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="border-none shadow-sm card-shadow bg-[var(--card)]">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gray-100 animate-pulse" />
                  <div className="space-y-2 flex-1">
                    <div className="h-6 w-16 rounded bg-gray-100 animate-pulse" />
                    <div className="h-3 w-24 rounded bg-gray-100 animate-pulse" />
                  </div>
                </CardContent>
              </Card>
            ))
          : statCards.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <Card className="border-none shadow-sm card-shadow bg-[var(--card)]">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${s.bg} ${s.color}`}>
                      <s.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black tracking-tight">{s.value}</h3>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">{s.label}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
        }
      </div>

      {/* ── Referral Link Card ─────────────────────────────────────────────── */}
      <Card className="border-none shadow-sm card-shadow bg-indigo-50/50">
        <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm">Your Referral Link</h3>
            {loading ? (
              <div className="mt-2 h-9 rounded-lg bg-indigo-100 animate-pulse" />
            ) : referral?.referral_link ? (
              <p className="text-xs text-[var(--muted-foreground)] mt-2 font-mono bg-white/60 rounded-lg px-3 py-2 border border-indigo-100 truncate select-all">
                {referral.referral_link}
              </p>
            ) : (
              <p className="text-xs text-[var(--muted-foreground)] mt-2">Link unavailable.</p>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              className="font-bold"
              onClick={handleCopy}
              disabled={loading || !referral?.referral_link}
            >
              {copied
                ? <><CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500" /> Copied!</>
                : <><Copy className="w-4 h-4 mr-2" /> Copy Link</>
              }
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Referral History ──────────────────────────────────────────────── */}
      <Card className="border-none shadow-sm card-shadow bg-[var(--card)]">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Referral History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">

          {/* Loading state */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-[var(--muted-foreground)]">
              <Loader2 className="w-7 h-7 animate-spin" />
              <p className="text-sm">Loading your referrals…</p>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && history.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-[var(--muted-foreground)]">
              <UserX className="w-10 h-10 opacity-40" />
              <p className="font-semibold">No referrals yet</p>
              <p className="text-sm">Share your referral link to start earning rewards.</p>
            </div>
          )}

          {/* History table */}
          {!loading && history.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Project</TableHead>
                  <TableHead>Referred To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reward</TableHead>
                  <TableHead className="text-right pr-6">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map(r => {
                  const statusCfg = STATUS_CONFIG[r.status] ?? { variant: "outline", label: r.status }
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="pl-6 font-semibold">{r.project_title}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="text-[10px] font-bold">
                              {initials(r.referred_user)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{r.referred_user}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusCfg.variant} className="text-[10px] font-bold uppercase">
                          {statusCfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-bold">{formatReward(r.reward)}</TableCell>
                      <TableCell className="text-right pr-6 text-sm text-[var(--muted-foreground)]">
                        {formatDate(r.created_at)}
                      </TableCell>
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
