import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Wallet, CircleDollarSign, ArrowUpRight, Download, Loader2, X, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { paymentApi, mpesaApi, clientApi } from "../../services/api"

export default function ClientPayments() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ spent: 0, escrow: 0, releasedMonth: 0 })
  
  // Escrow Modal State
  const [showFundModal, setShowFundModal] = useState(false)
  const [activeContracts, setActiveContracts] = useState([])
  const [selectedContract, setSelectedContract] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [funding, setFunding] = useState(false)
  const [paymentId, setPaymentId] = useState(null)
  const [paymentStatus, setPaymentStatus] = useState(null) // 'pending' | 'processing' | 'completed' | 'failed'
  const [statusMessage, setStatusMessage] = useState("")
  const [notify, setNotify] = useState(null)

  const showNotify = (type, msg) => {
    setNotify({ type, msg })
    setTimeout(() => setNotify(null), 3000)
  }

  const fetchPaymentData = () => {
    setLoading(true)
    paymentApi.getPayments()
      .then(res => {
        const txns = res.data || []
        setTransactions(txns)
        
        let spent = 0, escrow = 0, releasedMonth = 0
        const currentMonth = new Date().getMonth()
        const currentYear = new Date().getFullYear()

        txns.forEach(t => {
          const amt = parseFloat(t.amount) || 0
          if (t.status === 'completed') {
            if (t.type === 'deposit') {
              escrow += amt
            } else if (t.type === 'release') {
              escrow -= Math.min(escrow, amt)
              spent += amt
              
              const dt = new Date(t.created_at)
              if (dt.getMonth() === currentMonth && dt.getFullYear() === currentYear) {
                releasedMonth += amt
              }
            }
          }
        })
        setStats({ spent, escrow, releasedMonth })
      })
      .catch(err => {
        console.error(err)
        showNotify('error', "Failed to load payment history")
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchPaymentData()
  }, [])

  const openFundModal = () => {
    clientApi.getContracts()
      .then(res => {
        const active = (res.data || []).filter(c => c.status === 'active')
        setActiveContracts(active)
        if (active.length > 0) setSelectedContract(active[0].id)
        setShowFundModal(true)
      })
      .catch(err => {
        console.error("Failed to fetch contracts", err)
        showNotify('error', "Could not load active contracts. Please try again.")
      })
  }

  const handleFundEscrow = async () => {
    if (!selectedContract || !phoneNumber) {
      showNotify('error', "Please select a contract and enter your phone number")
      return
    }

    setFunding(true)
    setPaymentStatus('pending')
    setStatusMessage("Initiating M-Pesa payment...")

    try {
      const response = await mpesaApi.initiateSTKPush({
        contract_id: selectedContract,
        phone_number: phoneNumber
      })

      const paymentId = response.data.payment_id
      setPaymentId(paymentId)
      setStatusMessage(response.data.message || "Check your phone to complete payment")

      // Poll for payment status
      pollPaymentStatus(paymentId)

    } catch (err) {
      setPaymentStatus('failed')
      setStatusMessage("Error initiating payment: " + (err.message || 'Unknown error'))
      setFunding(false)
    }
  }

  const pollPaymentStatus = async (paymentId) => {
    const maxAttempts = 30 // Poll for 2 minutes (30 * 4 seconds)
    let attempts = 0

    const poll = setInterval(async () => {
      attempts++

      try {
        const response = await mpesaApi.getPaymentStatus(paymentId)
        const status = response.data.status

        if (status === 'completed') {
          setPaymentStatus('completed')
          setStatusMessage("Payment successful! Escrow funded.")
          setFunding(false)
          clearInterval(poll)
          
          // Refresh payment history after 2 seconds
          setTimeout(() => {
            setShowFundModal(false)
            fetchPaymentData()
            resetModal()
          }, 2000)

        } else if (status === 'failed') {
          setPaymentStatus('failed')
          setStatusMessage(response.data.result_desc || "Payment failed. Please try again.")
          setFunding(false)
          clearInterval(poll)

        } else if (status === 'processing') {
          setPaymentStatus('processing')
          setStatusMessage("Payment confirmed. Updating escrow...")
        }

        // Stop polling after max attempts
        if (attempts >= maxAttempts && status === 'pending') {
          setPaymentStatus('failed')
          setStatusMessage("Payment timeout. Please check your M-Pesa messages.")
          setFunding(false)
          clearInterval(poll)
        }

      } catch (err) {
        console.error("Error polling payment status:", err)
        clearInterval(poll)
        setPaymentStatus('failed')
        setStatusMessage("Error checking payment status")
        setFunding(false)
      }
    }, 4000) // Poll every 4 seconds
  }

  const resetModal = () => {
    setPhoneNumber("")
    setPaymentId(null)
    setPaymentStatus(null)
    setStatusMessage("")
    setFunding(false)
  }


  return (
    <div className="space-y-8 animate-in relative">
      {notify && (
        <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl font-bold text-sm text-white animate-in slide-in-from-top-4 ${
          notify.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'
        }`}>
          {notify.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <X className="w-4 h-4" />}
          {notify.msg}
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Payments</h1>
          <p className="text-[var(--muted-foreground)]">Fund escrow, release milestones, and view history.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="font-bold"><Download className="w-4 h-4 mr-2" /> Export</Button>
          <Button onClick={openFundModal} className="font-bold shadow-lg shadow-indigo-500/20"><Wallet className="w-4 h-4 mr-2" /> Fund Escrow</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Total Spent", value: `KSh ${stats.spent.toLocaleString()}`, icon: CircleDollarSign, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "In Escrow", value: `KSh ${stats.escrow.toLocaleString()}`, icon: Wallet, color: "text-orange-600", bg: "bg-orange-50" },
          { label: "Released This Month", value: `KSh ${stats.releasedMonth.toLocaleString()}`, icon: ArrowUpRight, color: "text-emerald-600", bg: "bg-emerald-50" },
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
        <CardHeader><CardTitle className="text-lg font-bold">Payment History</CardTitle></CardHeader>
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
                  <TableHead>Freelancer</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right pr-6">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="pl-6 font-semibold">{p.project_title || "Unknown Project"}</TableCell>
                    <TableCell className="text-sm">{p.freelancer_name || "Unknown"}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px] font-bold uppercase">{p.type}</Badge></TableCell>
                    <TableCell><Badge variant={p.status === "completed" ? "success" : "secondary"} className="text-[10px] font-bold uppercase">{p.status}</Badge></TableCell>
                    <TableCell className="text-right font-bold">KSh {parseFloat(p.amount).toLocaleString()}</TableCell>
                    <TableCell className="text-right pr-6 text-sm text-[var(--muted-foreground)]">
                       {p.created_at ? new Date(p.created_at).toLocaleDateString() : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Fund Escrow Modal */}
      {showFundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[var(--background)] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-[var(--border)]"
          >
            <div className="px-6 py-4 border-b border-[var(--border)] flex justify-between items-center bg-[var(--muted)]/30">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Wallet className="w-5 h-5 text-indigo-600" />
                Fund Escrow
              </h2>
              <button onClick={() => setShowFundModal(false)} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {activeContracts.length === 0 ? (
                <div className="text-center py-6">
                   <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                   <p className="font-bold">All caught up!</p>
                   <p className="text-sm text-[var(--muted-foreground)] mt-1">You have no active contracts that require funding.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <label className="text-sm font-bold tracking-wide uppercase text-[var(--muted-foreground)]">Select Contract</label>
                    <select 
                      className="w-full p-3 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                      value={selectedContract}
                      onChange={(e) => setSelectedContract(e.target.value)}
                      disabled={funding}
                    >
                      {activeContracts.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.projectTitle || `Contract ${c.id.substring(0,8)}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-4">
                    <label className="text-sm font-bold tracking-wide uppercase text-[var(--muted-foreground)]">M-Pesa Phone Number</label>
                    <input
                      type="tel"
                      placeholder="0712345678 or 254712345678"
                      className="w-full p-3 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      disabled={funding}
                    />
                  </div>

                  {/* Payment Status */}
                  {paymentStatus && (
                    <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                      paymentStatus === 'completed' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                      paymentStatus === 'failed' ? 'bg-red-50 border-red-200 text-red-800' :
                      'bg-blue-50 border-blue-200 text-blue-800'
                    }`}>
                      {paymentStatus === 'completed' && <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />}
                      {paymentStatus === 'pending' && <Loader2 className="w-5 h-5 shrink-0 mt-0.5 animate-spin" />}
                      {paymentStatus === 'processing' && <Loader2 className="w-5 h-5 shrink-0 mt-0.5 animate-spin" />}
                      {paymentStatus === 'failed' && <X className="w-5 h-5 shrink-0 mt-0.5" />}
                      <div className="text-sm">
                        <p className="font-bold capitalize">{paymentStatus}</p>
                        <p className="mt-1">{statusMessage}</p>
                      </div>
                    </div>
                  )}

                  {!paymentStatus && (
                    <div className="bg-blue-50 text-blue-800 text-sm p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                       <Wallet className="w-5 h-5 shrink-0 mt-0.5" />
                       <p>
                         <strong>Secure Payment via M-Pesa.</strong><br/>
                         You will receive an STK Push prompt on your phone to complete payment. Funds will be deposited into escrow once confirmed.
                       </p>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="px-6 py-4 bg-[var(--muted)]/50 border-t border-[var(--border)] flex justify-end gap-3">
              <Button variant="ghost" className="font-bold" onClick={() => { setShowFundModal(false); resetModal(); }} disabled={funding && paymentStatus !== 'completed'}>
                {paymentStatus === 'completed' ? 'Close' : 'Cancel'}
              </Button>
              {activeContracts.length > 0 && !paymentStatus && (
                 <Button 
                   onClick={handleFundEscrow} 
                   disabled={funding || !selectedContract || !phoneNumber} 
                   className="font-bold shadow-lg shadow-indigo-500/20 bg-indigo-600 hover:bg-indigo-700"
                 >
                   {funding ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Wallet className="w-4 h-4 mr-2" />}
                   {funding ? "Processing..." : "Pay with M-Pesa"}
                 </Button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

