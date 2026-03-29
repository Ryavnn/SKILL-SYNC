import React, { useState, useEffect } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  Briefcase, Calendar, DollarSign, Clock, ChevronLeft,
  User, CheckCircle2, Loader2, Sparkles, FileText,
  MoreHorizontal, Check, X, MessageSquare, ExternalLink, Plus
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import { Avatar, AvatarFallback } from "../../components/ui/avatar"
import { clientApi, proposalApi, contractApi } from "../../services/api"

export default function ProjectView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [proposals, setProposals] = useState([])
  const [contract, setContract] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [actionLoading, setActionLoading] = useState(null)
  
  // Add Milestone State
  const [showAddMilestoneModal, setShowAddMilestoneModal] = useState(false)
  const [newMilestone, setNewMilestone] = useState({ title: '', amount: '', description: '' })
  const [addingMilestone, setAddingMilestone] = useState(false)
  const [notify, setNotify] = useState(null)

  const isHired = project?.assignedFreelancerId
  
  const showNotify = (type, msg) => {
    setNotify({ type, msg })
    setTimeout(() => setNotify(null), 3000)
  }

  useEffect(() => {
    if (id) {
      fetchData()
      fetchContract() // Always try to fetch contract
    }
  }, [id])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [projRes, propRes] = await Promise.all([
        clientApi.getProject(id),
        proposalApi.getProjectProposals(id)
      ])
      setProject(projRes.data)
      setProposals(propRes.data || [])
    } catch (err) {
      setError(err.message || "Failed to load project details")
    } finally {
      setLoading(false)
    }
  }

  const fetchContract = async () => {
    try {
      const res = await contractApi.getContracts()
      const projectContract = res.data?.find(c => c.projectId === id)
      if (projectContract) {
         setContract(projectContract)
      }
    } catch (err) {
      console.error("Failed to fetch contract:", err)
    }
  }

  const handleMilestoneAction = async (milestoneId) => {
     setActionLoading(milestoneId)
     try {
       await contractApi.approveMilestone(milestoneId)
       showNotify('success', "Milestone approved and payment released!")
       fetchContract()
     } catch (err) {
       showNotify('error', err.message || "Failed to approve milestone")
     } finally {
       setActionLoading(null)
     }
  }

  const handleProposalAction = async (proposalId, status) => {
    setActionLoading(proposalId)
    try {
      await proposalApi.updateStatus(proposalId, { status })
      showNotify('success', `Proposal ${status} successfully`)
      fetchData()
    } catch (err) {
      showNotify('error', err.message || `Failed to ${status} proposal`)
    } finally {
      setActionLoading(null)
    }
  }

  const handleAddMilestone = async (e) => {
    e.preventDefault()
    if (!contract || !newMilestone.title || !newMilestone.amount) return

    setAddingMilestone(true)
    try {
      await contractApi.addMilestone(contract.id, {
        title: newMilestone.title,
        amount: parseFloat(newMilestone.amount),
        description: newMilestone.description
      })
      setShowAddMilestoneModal(false)
      setNewMilestone({ title: '', amount: '', description: '' })
      showNotify('success', "New milestone added to contract!")
      fetchContract() // Refresh contract state
    } catch (err) {
      console.error("Failed to add milestone:", err)
      showNotify('error', "Failed to add milestone. Please try again.")
    } finally {
      setAddingMilestone(false)
    }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      <p className="font-bold text-[var(--muted-foreground)] animate-pulse">Loading project dashboard...</p>
    </div>
  )

  if (error || !project) return (
    <div className="text-center py-20 px-4 bg-red-50/50 rounded-3xl border-2 border-dashed border-red-100 max-w-2xl mx-auto">
      <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
        <X className="w-8 h-8" />
      </div>
      <h3 className="text-2xl font-extrabold text-red-900 mb-2">Error loading project</h3>
      <p className="text-red-700 font-medium mb-8 italic">"{error || "Project not found"}"</p>
      <Link to="/client/projects">
        <Button className="bg-red-600 hover:bg-red-700 text-white font-bold h-11 px-8 rounded-xl shadow-lg shadow-red-500/20 active:scale-95 transition-all">
          <ChevronLeft className="w-5 h-5 mr-2" /> Back to Projects
        </Button>
      </Link>
    </div>
  )

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Briefcase },
    { id: 'proposals', label: `Proposals (${proposals.length})`, icon: FileText }
  ]
  
  // Show Milestones tab if project has an assigned freelancer
  if (isHired) {
    tabs.push({ id: 'milestones', label: 'Milestones & Workspace', icon: CheckCircle2 })
  }

  return (
    <div className="space-y-8 animate-in">
      {/* Inline toast notification */}
      {notify && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl font-bold text-sm text-white transition-all ${
          notify.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'
        }`}>
          {notify.type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
          {notify.msg}
        </div>
      )}
      {/* Breadcrumbs & Simple Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link to="/client/projects">
          <Button variant="ghost" size="sm" className="font-bold text-[var(--muted-foreground)] hover:text-indigo-600 transition-colors uppercase tracking-widest text-[10px]">
            <ChevronLeft className="w-4 h-4 mr-1" /> Dashboard / Projects
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Badge variant={project.status === 'open' ? 'success' : 'secondary'} className="uppercase text-[10px] tracking-widest font-black px-3 py-1 border-2">
            Project Status: {project.status.replace('_', ' ')}
          </Badge>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-[2rem] bg-slate-900 p-8 md:p-12 shadow-2xl shadow-indigo-500/10">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Briefcase className="w-64 h-64 -mr-20 -mt-20 transform rotate-12" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4 max-w-3xl">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight uppercase leading-none">
              {project.title}
            </h1>
            <div className="flex flex-wrap items-center gap-6 text-slate-400 font-bold text-xs uppercase tracking-widest">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-400" />
                Posted {new Date(project.createdAt).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-2 text-emerald-400">
                <DollarSign className="w-4 h-4" />
                Budget: KSh {parseFloat(project.budgetMin).toLocaleString()} - {parseFloat(project.budgetMax).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="shrink-0 flex gap-3">
             {!isHired && (
               <Link to={`/client/matching-results?projectId=${project.id}`}>
                <Button className="h-12 px-6 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-500/20 active:scale-95 transition-all">
                  <Sparkles className="w-4 h-4 mr-2" /> Find AI Matches
                </Button>
              </Link>
             )}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 bg-[var(--muted)]/50 p-1 rounded-2xl w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all
              ${activeTab === tab.id
                ? "bg-[var(--card)] text-indigo-600 shadow-lg shadow-indigo-500/5 ring-1 ring-black/5"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"}
            `}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Variable Content */}
        <div className="lg:col-span-2 space-y-8">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' ? (
              <motion.div
                key="overview"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-8"
              >
                <Card className="border-none shadow-sm card-shadow bg-[var(--card)] overflow-hidden">
                  <CardHeader className="border-b border-[var(--border)] bg-slate-50/50">
                    <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-600" />
                      Project Description
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="prose prose-indigo max-w-none">
                      <p className="whitespace-pre-line leading-relaxed text-[var(--foreground)] font-medium">
                        {project.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm card-shadow bg-[var(--card)] overflow-hidden">
                  <CardHeader className="border-b border-[var(--border)] bg-slate-50/50">
                    <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Required Technical Stack
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="flex flex-wrap gap-3">
                      {project.requiredSkills?.map(skill => (
                        <Badge key={skill} variant="outline" className="py-2 px-4 text-xs font-black uppercase tracking-widest border-2 border-slate-200 bg-white">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : activeTab === 'milestones' ? (
              <motion.div
                key="milestones"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-8"
              >
                 {!contract ? (
                   <Card className="border-none shadow-sm card-shadow bg-[var(--card)] overflow-hidden rounded-[2rem]">
                     <CardContent className="p-12 text-center">
                       <FileText className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
                       <p className="font-bold text-slate-900 mb-2">No Contract Yet</p>
                       <p className="text-sm text-slate-500 mb-6">Create a contract to define milestones and payment terms for this project.</p>
                       <Button 
                         onClick={() => navigate(`/client/contracts/create?projectId=${id}`)}
                         className="bg-indigo-600 hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-500/20"
                       >
                         <Plus className="w-4 h-4 mr-2" />
                         Create Contract
                       </Button>
                     </CardContent>
                   </Card>
                 ) : (
                   <Card className="border-none shadow-sm card-shadow bg-[var(--card)] overflow-hidden rounded-[2rem]">
                    <CardHeader className="p-8 bg-slate-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-xl font-black uppercase tracking-tight">Project Milestones</CardTitle>
                          <CardDescription className="text-xs font-bold uppercase tracking-widest">Track progress and release payments for completed work.</CardDescription>
                        </div>
                        {contract && (
                          <Badge variant={contract.status === 'active' ? 'success' : 'secondary'} className="text-[10px] uppercase font-black">
                            {contract.status.replace('_', ' ')}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                      <div className="space-y-4">
                        {contract?.milestones?.length === 0 ? (
                          <div className="text-center py-12">
                            <CheckCircle2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <p className="font-bold text-slate-600">No milestones yet</p>
                            <p className="text-xs text-slate-400 mt-2">Add milestones to track project progress</p>
                          </div>
                        ) : (
                          contract?.milestones?.map((m, idx) => (
                            <div key={m.id} className="flex items-center justify-between p-6 rounded-[1.5rem] bg-white border border-slate-100 shadow-sm group hover:border-indigo-200 transition-all">
                              <div className="flex items-center gap-6">
                                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-xs font-black text-slate-400 border border-slate-100 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                  {idx + 1}
                                </div>
                                <div>
                                  <p className="font-extrabold text-slate-900">{m.title}</p>
                                  <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">KSh {parseFloat(m.amount).toLocaleString()}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-4">
                                <Badge variant={m.status === 'released' || m.status === 'approved' ? 'success' : m.status === 'submitted' ? 'warning' : 'secondary'} className="text-[10px] uppercase font-black px-3 py-1">
                                  {m.status}
                                </Badge>
                                
                                {m.status === 'submitted' && (
                                  <Button 
                                    size="sm" 
                                    onClick={() => handleMilestoneAction(m.id)}
                                    disabled={actionLoading === m.id}
                                    className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-[9px] rounded-xl shadow-lg shadow-emerald-500/10"
                                  >
                                    {actionLoading === m.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Approve & Pay"}
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))
                        )}

                        {contract && contract.status !== 'rejected' && contract.status !== 'completed' && (
                          <Button 
                            variant="outline" 
                            className="w-full border-dashed border-2 py-8 rounded-[1.5rem] text-slate-400 hover:text-indigo-600 hover:border-indigo-300 transition-all font-bold text-xs"
                            onClick={() => setShowAddMilestoneModal(true)}
                          >
                            <Plus className="w-4 h-4 mr-2" /> Add New Milestone
                          </Button>
                        )}
                      </div>
                    </CardContent>
                   </Card>
                 )}
              </motion.div>
            ) : (
              <motion.div
                key="proposals"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4"
              >
                {proposals.length === 0 ? (
                  <div className="text-center py-20 bg-[var(--muted)]/20 rounded-[2rem] border-4 border-dashed border-[var(--border)]">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
                      <FileText className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-black uppercase tracking-tight mb-2">No proposals yet</h3>
                    <p className="text-[var(--muted-foreground)] font-medium max-w-sm mx-auto">
                      Wait for freelancers to apply or use the AI Matching tool to find candidates.
                    </p>
                  </div>
                ) : (
                  proposals.map((proposal, idx) => (
                    <Card key={proposal.id} className="border-none shadow-sm card-shadow bg-[var(--card)] hover:ring-2 hover:ring-indigo-500/20 transition-all">
                      <CardContent className="p-0">
                        <div className="p-6 border-b border-[var(--border)] flex flex-col md:flex-row md:items-center justify-between gap-6">
                          <div className="flex items-center gap-4">
                            <Avatar className="w-12 h-12 border-2 border-slate-100 ring-2 ring-indigo-500/10">
                              <AvatarFallback className="font-black bg-indigo-50 text-indigo-600 uppercase">
                                {proposal.freelancerName?.charAt(0) || 'F'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-black uppercase tracking-tight text-lg leading-none">{proposal.freelancerName}</h4>
                              <p className="text-xs font-bold text-indigo-600/80 mt-1 uppercase tracking-widest">{proposal.freelancerEmail}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-right">
                            <div className="hidden sm:block">
                              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--muted-foreground)] mb-1">Bid Amount</p>
                              <p className="text-xl font-black tabular-nums">KSh {parseFloat(proposal.bidAmount).toLocaleString()}</p>
                            </div>
                            <div className="hidden sm:block h-8 w-px bg-slate-200"></div>
                            <div className="hidden sm:block">
                              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--muted-foreground)] mb-1">Estimated Duration</p>
                              <p className="text-sm font-black whitespace-nowrap">{proposal.estimatedDuration}</p>
                            </div>
                          </div>
                        </div>

                        <div className="p-6 bg-slate-50/30">
                          <p className="text-sm leading-relaxed text-slate-600 font-medium mb-6 italic">
                            "{proposal.coverLetter}"
                          </p>

                          <div className="flex flex-wrap items-center justify-between gap-4">
                            <Badge variant={proposal.status === 'accepted' ? 'success' : proposal.status === 'rejected' ? 'destructive' : 'secondary'} className="uppercase font-black text-[10px] tracking-widest py-1 px-3 border-2">
                              {proposal.status}
                            </Badge>

                            <div className="flex items-center gap-2">
                              {proposal.status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleProposalAction(proposal.id, 'rejected')}
                                    disabled={actionLoading === proposal.id}
                                    className="font-black uppercase tracking-widest text-[10px] h-9 border-2 border-red-100 text-red-600 hover:bg-red-50 hover:text-red-700 active:scale-95"
                                  >
                                    {actionLoading === proposal.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><X className="w-4 h-4 mr-1.5" /> Decline</>}
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleProposalAction(proposal.id, 'accepted')}
                                    disabled={actionLoading === proposal.id}
                                    className="font-black uppercase tracking-widest text-[10px] h-9 bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 active:scale-95"
                                  >
                                    {actionLoading === proposal.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-1.5" /> Hire Freelancer</>}
                                  </Button>
                                </>
                              )}
                              <Button size="sm" variant="ghost" asChild className="font-bold text-[10px] uppercase h-9">
                                <Link to={`/messages?userId=${proposal.freelancerId}`}>
                                  <MessageSquare className="w-4 h-4 mr-1.5" /> Message
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: Sidebar */}
        <div className="space-y-6">
          <Card className="border-none shadow-sm card-shadow bg-[var(--card)] overflow-hidden">
            <CardHeader className="bg-indigo-600 text-white p-6">
              <CardTitle className="text-xs font-black uppercase tracking-[0.2em] opacity-80">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[var(--muted-foreground)]">Proposals</p>
                  <p className="text-2xl font-black">{proposals.length}</p>
                </div>
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                  <FileText className="w-6 h-6" />
                </div>
              </div>
              <div className="h-px bg-slate-100"></div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[var(--muted-foreground)]">Deadline</p>
                  <p className="text-lg font-black">{new Date(project.deadline || project.timeline).toLocaleDateString()}</p>
                </div>
                <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                  <Clock className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          {project.assignedFreelancerId && (
            <Card className="border-none shadow-sm card-shadow bg-[var(--card)] overflow-hidden border-2 border-indigo-500/30">
              <CardHeader className="bg-indigo-500/10 p-4 border-b border-indigo-500/10">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Hired Partner</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <Avatar className="h-14 w-14 ring-4 ring-indigo-500/5">
                    <AvatarFallback className="bg-indigo-600 text-white font-black">
                      {project.assignedFreelancerName?.charAt(0) || "F"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-lg font-black tracking-tight uppercase leading-tight">{project.assignedFreelancerName || "Active Partner"}</p>
                    <Badge variant="outline" className="mt-1 font-bold text-[8px] uppercase border-indigo-200 text-indigo-700">Contract Active</Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" asChild className="font-black text-[9px] uppercase tracking-widest border-2">
                    <Link to={`/freelancers/${project.assignedFreelancerId}`}>Profile</Link>
                  </Button>
                  <Button 
                    size="sm" 
                    className="bg-indigo-600 font-black text-[9px] uppercase tracking-widest" 
                    onClick={() => setActiveTab('milestones')}
                  >
                    View Workspace
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-none shadow-sm card-shadow bg-[var(--card)] overflow-hidden">
            <CardHeader className="bg-slate-50 p-6 border-b border-[var(--border)]">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest">Platform Help</CardTitle>
            </CardHeader>
            <CardContent className="p-6 text-xs font-medium text-[var(--muted-foreground)] leading-relaxed space-y-4">
              <p>Hire verified freelancers and use our escrow system to ensure safe payments.</p>
              <Button variant="ghost" size="sm" className="w-full justify-start text-indigo-600 font-black uppercase tracking-widest text-[9px] p-0 h-auto">
                Learn about milestones <ExternalLink className="w-3 h-3 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Milestone Modal */}
      {showAddMilestoneModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="bg-[var(--card)] w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 ring-1 ring-black/5"
          >
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 flex items-center gap-3">
                <Plus className="w-5 h-5 text-indigo-600" />
                Add Milestone
              </h2>
              <button onClick={() => setShowAddMilestoneModal(false)} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-white hover:shadow-md transition-all text-slate-400 hover:text-red-500">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleAddMilestone} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Milestone Title</label>
                <input
                  type="text"
                  placeholder="e.g. Phase 2: Implementation"
                  className="w-full p-4 rounded-2xl border-2 border-slate-100 bg-slate-50/30 text-sm font-bold focus:border-indigo-500 hover:border-slate-200 outline-none transition-all shadow-inner"
                  value={newMilestone.title}
                  onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Budget Amount (KSh)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">KSh</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    className="w-full p-4 pl-12 rounded-2xl border-2 border-slate-100 bg-slate-50/30 text-sm font-black focus:border-indigo-500 hover:border-slate-200 outline-none transition-all shadow-inner"
                    value={newMilestone.amount}
                    onChange={(e) => setNewMilestone({ ...newMilestone, amount: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Description (Optional)</label>
                <textarea
                  placeholder="What will be delivered in this milestone?"
                  rows={3}
                  className="w-full p-4 rounded-2xl border-2 border-slate-100 bg-slate-50/30 text-sm font-medium focus:border-indigo-500 hover:border-slate-200 outline-none transition-all resize-none shadow-inner"
                  value={newMilestone.description}
                  onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                />
              </div>

              <div className="pt-4 flex gap-4">
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="flex-1 font-black uppercase tracking-widest text-[11px] h-12 rounded-2xl border-2 border-transparent hover:border-slate-100"
                  onClick={() => setShowAddMilestoneModal(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={addingMilestone}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest text-[11px] shadow-xl shadow-slate-200 h-12 rounded-2xl group transition-all"
                >
                  {addingMilestone ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                    <span className="flex items-center gap-2">Confirm <Check className="w-4 h-4 group-hover:scale-110 transition-transform" /></span>
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}