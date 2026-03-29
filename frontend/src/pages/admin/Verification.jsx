import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ShieldCheck, CheckCircle2, XCircle, Eye, Clock, FileText, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar"
import { adminApi } from "../../services/api"

export default function AdminVerification() {
  const [credentials, setCredentials] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [processingId, setProcessingId] = useState(null)

  useEffect(() => {
    fetchPendingCredentials()
  }, [])

  const fetchPendingCredentials = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await adminApi.getCredentials()
      setCredentials(response.pending_freelancers || [])
    } catch (err) {
      setError(err.message || 'Failed to fetch credentials')
      console.error('Error fetching credentials:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (credentialId, status) => {
    try {
      setProcessingId(credentialId)
      await adminApi.verifyCredential(credentialId, { status })
      
      // Remove verified credential from list
      setCredentials(prev => prev.filter(c => c.id !== credentialId))
      
    } catch (err) {
      setError(err.message || `Failed to ${status} credential`)
      console.error(`Error ${status} credential:`, err)
    } finally {
      setProcessingId(null)
    }
  }

  const handleViewDocument = (documentUrl) => {
    if (!documentUrl) return
    window.open(documentUrl, '_blank', 'noopener,noreferrer')
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const getInitials = (name) => {
    if (!name) return '??'
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Credential Verification</h1>
          <p className="text-[var(--muted-foreground)]">Review and verify freelancer certifications.</p>
        </div>
        <Badge variant="secondary" className="font-bold text-sm px-4 py-1.5">
          <Clock className="w-4 h-4 mr-1" /> {credentials.length} Pending
        </Badge>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-600 text-sm font-medium">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Pending Review", value: credentials.length.toString(), icon: Clock, color: "text-orange-600", bg: "bg-orange-50" },
          { label: "Approved Today", value: "0", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Rejected", value: "0", icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
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

      <div className="space-y-4">
        {credentials.length === 0 ? (
          <Card className="border-none shadow-sm card-shadow bg-[var(--card)]">
            <CardContent className="p-12 text-center">
              <ShieldCheck className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="font-bold text-lg mb-2">No pending credentials</h3>
              <p className="text-sm text-[var(--muted-foreground)]">All credentials have been reviewed.</p>
            </CardContent>
          </Card>
        ) : (
          credentials.map((item, i) => (
            <motion.div key={item.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <Card className="border-none shadow-sm card-shadow bg-[var(--card)] hover:shadow-md transition-all">
                <CardContent className="p-6 flex flex-col md:flex-row md:items-center gap-4">
                  <Avatar className="h-12 w-12 shrink-0">
                    <AvatarFallback className="font-bold bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
                      {getInitials(item.user?.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg">{item.user?.name || 'Unknown Freelancer'}</h3>
                    <p className="text-sm text-[var(--muted-foreground)]">{item.experience_level || 'Freelancer Profile'}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-[var(--muted-foreground)]">
                      <FileText className="w-3 h-3" />
                      <span>{item.credentials?.length || 0} Documents Attached</span>
                      {item.submitted_at && (
                        <>
                          <span>·</span>
                          <span>Submitted {formatDate(item.submitted_at)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="font-bold"
                      onClick={() => handleViewDocument(item.credentials?.[0]?.document_url)}
                      disabled={!item.credentials?.[0]?.document_url || processingId === item.id}
                    >
                      <Eye className="w-4 h-4 mr-1" /> Review
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="font-bold text-red-500 hover:bg-red-50 hover:text-red-600 border-red-200"
                      onClick={() => handleVerify(item.id, 'rejected')}
                      disabled={processingId === item.id}
                    >
                      {processingId === item.id ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4 mr-1" />
                      )}
                      Reject
                    </Button>
                    <Button 
                      size="sm" 
                      className="font-bold shadow-lg shadow-indigo-500/10"
                      onClick={() => handleVerify(item.id, 'verified')}
                      disabled={processingId === item.id}
                    >
                      {processingId === item.id ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                      )}
                      Approve
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}
