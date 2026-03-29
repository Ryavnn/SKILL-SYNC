import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Mail, CheckCircle, XCircle, Clock, Briefcase, DollarSign, Calendar, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import { invitationApi } from "../../services/api"

export default function Invitations() {
  const [invitations, setInvitations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [processingId, setProcessingId] = useState(null)

  useEffect(() => {
    fetchInvitations()
  }, [])

  const fetchInvitations = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await invitationApi.getMyInvitations()
      setInvitations(response.data || [])
    } catch (err) {
      setError(err.message || "Failed to fetch invitations")
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (invitationId) => {
    setProcessingId(invitationId)
    try {
      await invitationApi.acceptInvitation(invitationId)
      alert("Invitation accepted! You've been assigned to the project.")
      fetchInvitations() // Refresh the list
    } catch (err) {
      alert(err.message || "Failed to accept invitation")
    } finally {
      setProcessingId(null)
    }
  }

  const handleDecline = async (invitationId) => {
    if (!confirm("Are you sure you want to decline this invitation?")) return
    
    setProcessingId(invitationId)
    try {
      await invitationApi.declineInvitation(invitationId)
      alert("Invitation declined")
      fetchInvitations() // Refresh the list
    } catch (err) {
      alert(err.message || "Failed to decline invitation")
    } finally {
      setProcessingId(null)
    }
  }

  const getStatusBadge = (status) => {
    const variants = {
      pending: { color: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: Clock },
      accepted: { color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle },
      declined: { color: "bg-red-50 text-red-700 border-red-200", icon: XCircle }
    }
    const variant = variants[status] || variants.pending
    const Icon = variant.icon

    return (
      <Badge className={`${variant.color} border font-bold text-xs uppercase tracking-wide`}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-red-50 text-red-600 rounded-2xl font-bold">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Mail className="w-6 h-6 text-indigo-500" />
            <h1 className="text-3xl font-extrabold tracking-tight">Project Invitations</h1>
          </div>
          <p className="text-[var(--muted-foreground)]">
            Manage invitations from clients to work on their projects
          </p>
        </div>
      </div>

      {/* Invitations List */}
      {invitations.length === 0 ? (
        <Card className="border-none shadow-sm card-shadow bg-[var(--card)]">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-2">No Invitations</h3>
            <p className="text-[var(--muted-foreground)] text-sm">
              You don't have any project invitations at the moment. When clients invite you to their projects, they'll appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {invitations.map((invitation, i) => (
            <motion.div
              key={invitation.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="border-none shadow-sm card-shadow bg-[var(--card)] hover:shadow-md transition-all">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Project Info */}
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-xl font-extrabold">{invitation.project.title}</h3>
                            {getStatusBadge(invitation.status)}
                          </div>
                          <p className="text-sm text-[var(--muted-foreground)] mb-3">
                            from <span className="font-bold">{invitation.client.name}</span> ({invitation.client.email})
                          </p>
                        </div>
                      </div>

                      <p className="text-sm text-[var(--foreground)] leading-relaxed">
                        {invitation.project.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-[var(--muted-foreground)]">
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          KSh {invitation.project.budget?.toLocaleString() || 'N/A'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-4 h-4" />
                          {invitation.project.status}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Invited {new Date(invitation.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      {invitation.message && (
                        <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                          <p className="text-sm italic text-[var(--foreground)]">"{invitation.message}"</p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {invitation.status === 'pending' && (
                      <div className="flex md:flex-col gap-3 shrink-0">
                        <Button
                          className="flex-1 md:flex-none font-bold shadow-lg shadow-emerald-500/10 bg-emerald-600 hover:bg-emerald-500"
                          onClick={() => handleAccept(invitation.id)}
                          disabled={processingId === invitation.id}
                        >
                          {processingId === invitation.id ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                          ) : (
                            <><CheckCircle className="w-4 h-4 mr-2" /> Accept</>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 md:flex-none font-bold border-red-200 text-red-600 hover:bg-red-50"
                          onClick={() => handleDecline(invitation.id)}
                          disabled={processingId === invitation.id}
                        >
                          <XCircle className="w-4 h-4 mr-2" /> Decline
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
