import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { FolderKanban, CheckCircle2, Clock, XCircle, Eye, ArrowRight, Loader2, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs"
import { contractApi, freelancerApi } from "../../services/api"

export default function FreelancerProjects() {
  const navigate = useNavigate()
  const [contracts, setContracts] = useState([])
  const [assignedProjects, setAssignedProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [contractsRes, projectsRes] = await Promise.all([
        contractApi.getContracts(),
        freelancerApi.getProjects()
      ])
      setContracts(contractsRes.data || [])
      setAssignedProjects(projectsRes.data || [])
      setError(null)
    } catch (err) {
      console.error(err)
      setError(err.message || "Failed to load projects/contracts")
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (id, action) => {
    try {
      // Optimistic update
      setContracts(prev => prev.map(c => {
        if (c.id === id) {
          return { ...c, status: action === 'accept' ? 'active' : 'rejected' }
        }
        return c
      }))

      if (action === 'accept') {
        await contractApi.accept(id)
      } else {
        await contractApi.reject(id)
      }
      // Re-fetch to ensure sync with backend
      fetchData()
    } catch (err) {
      console.error(err)
      // Revert on error by fetching
      fetchData()
    }
  }

  const formatCurrency = (val) => new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0
  }).format(val).replace('KES', 'KSh')

  const invitations = contracts.filter(c => c.status === 'pending_acceptance')

  // Projects that this freelancer is assigned to
  const allActiveEngagements = assignedProjects.map(p => {
    // Find if there is an associated contract
    const contract = contracts.find(c => c.projectId === p.id)
    return {
      ...p,
      contract: contract,
      hasInvitation: contract?.status === 'pending_acceptance'
    }
  })

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-[var(--muted-foreground)]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)] mb-4" />
        <p>Loading projects...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-red-500">
        <AlertCircle className="w-8 h-8 mb-4 border-red-500" />
        <p className="font-bold">{error}</p>
        <Button onClick={fetchData} variant="outline" className="mt-4">Try Again</Button>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Projects</h1>
        <p className="text-[var(--muted-foreground)]">Manage your assigned work and project collaborations.</p>
      </div>

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList>
          <TabsTrigger value="active">Active ({allActiveEngagements.length})</TabsTrigger>
          <TabsTrigger value="invitations">Invitations ({invitations.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {allActiveEngagements.length === 0 ? (
            <Card className="border-dashed bg-transparent shadow-none">
              <CardContent className="flex flex-col items-center justify-center p-12 text-center text-[var(--muted-foreground)]">
                <FolderKanban className="w-12 h-12 mb-4 opacity-20" />
                <p>No active projects.</p>
              </CardContent>
            </Card>
          ) : (
            allActiveEngagements.map((eng, i) => {
              const project = eng
              const contract = eng.contract

              const totalMilestones = contract?.milestones?.length || 0
              const completedMilestones = contract?.milestones?.filter(m => m.status === 'completed' || m.status === 'approved').length || 0
              const progressPct = totalMilestones === 0 ? 0 : Math.round((completedMilestones / totalMilestones) * 100)

              return (
                <motion.div key={project.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className="border-none shadow-sm card-shadow bg-[var(--card)] hover:shadow-md transition-all cursor-pointer group" onClick={() => navigate(`/freelancer/projects/${project.id}`)}>
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-lg group-hover:text-indigo-600 transition-colors uppercase">{project.title || "Unnamed Project"}</h3>
                            <Badge variant="outline" className="text-[10px] uppercase">
                              {project.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="text-sm text-[var(--muted-foreground)] font-medium">
                            Budget: {formatCurrency(project.budgetMin)} - {formatCurrency(project.budgetMax)}
                          </p>

                          {eng.hasInvitation && (
                            <Badge className="mt-2 bg-amber-500 hover:bg-amber-600 text-white border-none animate-pulse">
                              <AlertCircle className="w-3 h-3 mr-1" /> Action Required: Review Contract
                            </Badge>
                          )}
                          {!contract && !eng.hasInvitation && project.status === 'in_progress' && (
                            <Badge variant="outline" className="mt-2 text-[10px] text-indigo-600 border-indigo-200">
                              Setup: Waiting for Contract
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-6">
                          {contract && (
                            <div className="w-32">
                              <div className="flex justify-between text-xs font-bold mb-1">
                                <span>{progressPct}% Done</span>
                                <span className="text-[9px] text-[var(--muted-foreground)] uppercase italic">
                                  {contract.status}
                                </span>
                              </div>
                              <div className="h-1.5 bg-[var(--muted)] rounded-full overflow-hidden">
                                <div className="h-full bg-[var(--primary)] rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                              </div>
                            </div>
                          )}
                          <Button variant="ghost" size="icon" className="group-hover:translate-x-1 transition-transform">
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })
          )}
        </TabsContent>

        <TabsContent value="invitations" className="space-y-4">
          {invitations.length === 0 ? (
            <Card className="border-dashed bg-transparent shadow-none">
              <CardContent className="flex flex-col items-center justify-center p-12 text-center text-[var(--muted-foreground)]">
                <FolderKanban className="w-12 h-12 mb-4 opacity-20" />
                <p>No new invitations.</p>
              </CardContent>
            </Card>
          ) : (
            invitations.map((inv, i) => (
              <motion.div key={inv.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="border-none shadow-sm card-shadow bg-[var(--card)] hover:shadow-md transition-all cursor-pointer group" onClick={() => navigate(`/freelancer/projects/${inv.projectId}`)}>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg group-hover:text-indigo-600 transition-all">{inv.projectTitle || "Unnamed Project"}</h3>
                        <p className="text-sm text-[var(--muted-foreground)] font-medium">Budget: {formatCurrency(inv.totalAmount)}</p>
                        <div className="flex gap-1.5 mt-2">
                          <Badge variant="outline" className="text-[10px] font-bold py-0 h-5">Contract Details</Badge>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAction(inv.id, 'reject');
                          }}
                          variant="outline"
                          className="font-bold text-red-500 hover:bg-red-50 hover:text-red-600 border-red-200"
                        >
                          <XCircle className="w-4 h-4 mr-1" /> Decline
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAction(inv.id, 'accept');
                          }}
                          className="font-bold shadow-lg shadow-indigo-500/10"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" /> Accept
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
