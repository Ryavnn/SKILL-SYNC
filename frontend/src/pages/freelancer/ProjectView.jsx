import React, { useState, useEffect } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  Briefcase, Calendar, DollarSign, Clock, ChevronLeft,
  User, CheckCircle2, Loader2, FileText, Send, AlertCircle
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import { Input } from "../../components/ui/input"
import { Textarea } from "../../components/ui/textarea"
import { clientApi, proposalApi, contractApi } from "../../services/api"

export default function FreelancerProjectView() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [notify, setNotify] = useState(null)
  const [contract, setContract] = useState(null)
  
  // Proposal form state
  const [formData, setFormData] = useState({
    bid_amount: "",
    estimated_duration: "",
    cover_letter: ""
  })

  const showNotify = (type, msg) => {
    setNotify({ type, msg })
    setTimeout(() => setNotify(null), 3000)
  }

  const isHired = project?.status === 'in_progress' || project?.status === 'completed'

  useEffect(() => {
    if (id) {
      fetchProject()
    }
  }, [id])

  useEffect(() => {
    if (isHired && id) {
      fetchContract()
    }
  }, [id, isHired])

  const fetchProject = async () => {
    setLoading(true)
    try {
      const res = await clientApi.getProject(id)
      setProject(res.data)
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

  const handleAcceptContract = async () => {
    if (!contract) return
    
    setSubmitting(true)
    try {
      await contractApi.accept(contract.id)
      showNotify('success', "Contract accepted! You can now start work.")
      // Refresh contract state
      fetchContract()
    } catch (err) {
      showNotify('error', err.message || "Failed to accept contract")
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.bid_amount || !formData.estimated_duration || !formData.cover_letter) {
      showNotify('error', "Please fill in all fields")
      return
    }

    if (formData.cover_letter.length < 20) {
      showNotify('error', "Cover letter must be at least 20 characters long")
      return
    }

    setSubmitting(true)
    try {
      await proposalApi.submit({
        projectId: id,
        bidAmount: parseFloat(formData.bid_amount),
        estimatedDuration: formData.estimated_duration,
        coverLetter: formData.cover_letter
      })
      showNotify('success', "Proposal submitted successfully!")
      setTimeout(() => navigate('/freelancer/projects'), 1500)
    } catch (err) {
      showNotify('error', err.message || "Failed to submit proposal")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
        <p className="text-[var(--muted-foreground)]">Manage your assigned work and project collaborations.</p>
    </div>
  )

  if (error || !project) return (
    <div className="text-center py-20 px-4 max-w-2xl mx-auto bg-red-50/50 rounded-3xl border-2 border-dashed border-red-100">
      <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
      <h3 className="text-2xl font-black text-red-900 mb-2">Error</h3>
      <p className="text-red-700 mb-8 italic">"{error || "Project not found"}"</p>
      <Link to="/freelancer/projects">
        <Button variant="outline" className="border-red-200">
          <ChevronLeft className="w-4 h-4 mr-2" /> Back to Projects
        </Button>
      </Link>
    </div>
  )

  return (
    <div className="space-y-8 animate-in pb-12">
      {notify && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl font-bold text-sm text-white animate-in slide-in-from-right-full ${
          notify.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'
        }`}>
          {notify.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link to="/freelancer/projects">
          <Button variant="ghost" size="sm" className="font-bold text-[var(--muted-foreground)] hover:text-indigo-600 tracking-widest text-[10px] uppercase">
            <ChevronLeft className="w-4 h-4 mr-1" /> {isHired ? "Workspace" : "Marketplace"} / {project.title}
          </Button>
        </Link>
        <Badge variant={project.status === 'open' ? 'success' : 'secondary'} className="uppercase text-[10px] tracking-widest font-black px-3 py-1 border-2">
          {project.status.replace('_', ' ')}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-sm card-shadow bg-[var(--card)] overflow-hidden rounded-[2rem]">
            <CardHeader className="p-8 md:p-12 bg-slate-900 text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                <Briefcase className="w-64 h-64 -mr-20 -mt-20 transform rotate-12" />
              </div>
              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-2">
                   <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight leading-none">{project.title}</h1>
                   {isHired && <Badge className="bg-emerald-500 text-white border-0">ACTIVE JOB</Badge>}
                </div>
                <div className="flex flex-wrap items-center gap-6 text-slate-400 font-bold text-xs uppercase tracking-widest">
                  <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-indigo-400" /> Posted {new Date(project.createdAt).toLocaleDateString()}</span>
                  <span className="flex items-center gap-2 text-emerald-400">
                    <DollarSign className="w-4 h-4" /> 
                    {isHired && contract ? `Contract: KSh ${parseFloat(contract.totalAmount).toLocaleString()}` : `Budget: KSh ${parseFloat(project.budgetMin).toLocaleString()} - ${parseFloat(project.budgetMax).toLocaleString()}`}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-10">
              {isHired && contract ? (
                <section className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black uppercase tracking-widest text-indigo-600">Milestones</h3>
                    <Badge variant="outline" className="text-[10px] font-bold">{contract.milestones?.length || 0} Total</Badge>
                  </div>
                  <div className="space-y-3">
                    {contract.milestones?.map((m, idx) => (
                      <div key={m.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-indigo-200 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-xs font-black text-slate-400 border border-slate-100 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                            {idx + 1}
                          </div>
                          <div>
                            <p className="font-bold text-sm">{m.title}</p>
                            <p className="text-[10px] text-[var(--muted-foreground)] font-bold uppercase tracking-wider">KSh {parseFloat(m.amount).toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={m.status === 'completed' || m.status === 'approved' || m.status === 'released' ? 'success' : m.status === 'submitted' ? 'warning' : 'secondary'} className="text-[9px] uppercase tracking-tighter">
                            {m.status}
                          </Badge>
                          
                          {m.status === 'pending' && (
                            <Button 
                              size="sm" 
                              onClick={() => {
                                setSubmitting(true)
                                contractApi.submitMilestone(m.id)
                                  .then(() => {
                                    showNotify('success', "Milestone submitted!")
                                    fetchContract()
                                  })
                                  .catch(err => showNotify('error', err.message))
                                  .finally(() => setSubmitting(false))
                              }}
                              disabled={submitting}
                              className="h-7 text-[9px] font-black uppercase tracking-widest bg-indigo-600 hover:bg-indigo-700"
                            >
                              Submit
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ) : (
                <section>
                  <h3 className="text-sm font-black uppercase tracking-widest text-indigo-600 mb-4">Project Description</h3>
                  <p className="text-[var(--foreground)] font-medium leading-relaxed whitespace-pre-line">
                    {project.description}
                  </p>
                </section>
              )}

              <section>
                <h3 className="text-sm font-black uppercase tracking-widest text-indigo-600 mb-4">Required Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {project.requiredSkills?.map(skill => (
                    <Badge key={skill} variant="outline" className="py-1.5 px-4 text-[10px] font-black uppercase tracking-widest bg-slate-50 border-slate-200">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </section>

              {contract && contract.status === 'pending_acceptance' && (
                <motion.section 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-8 rounded-[2rem] bg-indigo-600 text-white space-y-6 shadow-2xl shadow-indigo-200"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-white/10">
                      <FileText className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-tight">Contract Pending Approval</h3>
                      <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest">Review the milestones and accept the agreement to begin.</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                      <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-1">Total Value</p>
                      <p className="text-2xl font-black">KSh {parseFloat(contract.totalAmount).toLocaleString()}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                      <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-1">Milestones</p>
                      <p className="text-2xl font-black">{contract.milestones?.length || 0}</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button 
                      onClick={handleAcceptContract}
                      disabled={submitting}
                      className="flex-1 bg-white text-indigo-600 hover:bg-slate-50 font-black uppercase tracking-widest text-[11px] h-14 rounded-2xl shadow-lg"
                    >
                      {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Accept Contract & Start Work"}
                    </Button>
                    <Button 
                      variant="outline" 
                      className="border-white/20 text-white hover:bg-white/10 font-black uppercase tracking-widest text-[11px] h-14 rounded-2xl"
                    >
                      Request Revision
                    </Button>
                  </div>
                  
                  <p className="text-[10px] text-center text-indigo-200 font-medium">
                    By clicking accept, you agree to the platform's escrow terms and the defined delivery schedule.
                  </p>
                </motion.section>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {!isHired ? (
            <Card className="border-none shadow-sm card-shadow bg-[var(--card)] overflow-hidden rounded-[2rem] sticky top-24">
              <CardHeader className="bg-indigo-600 text-white p-6">
                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
                  <Send className="w-4 h-4" /> Submit Proposal
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--muted-foreground)]">Your Bid (KSh)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                      <Input 
                        type="number" 
                        placeholder="0.00" 
                        className="pl-9 h-12 font-bold focus:ring-indigo-500/20"
                        value={formData.bid_amount}
                        onChange={e => setFormData({...formData, bid_amount: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--muted-foreground)]">Estimated Duration</label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                      <Input 
                        placeholder="e.g. 2 weeks" 
                        className="pl-9 h-12 font-bold focus:ring-indigo-500/20"
                        value={formData.estimated_duration}
                        onChange={e => setFormData({...formData, estimated_duration: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--muted-foreground)]">Cover Letter</label>
                    <Textarea 
                      placeholder="Describe why you're a good fit..." 
                      className="min-h-[150px] font-medium focus:ring-indigo-500/20"
                      value={formData.cover_letter}
                      onChange={e => setFormData({...formData, cover_letter: e.target.value})}
                      required
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={submitting}
                    className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-500/20 transition-all rounded-xl"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Application"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-none shadow-sm card-shadow bg-[var(--card)] overflow-hidden rounded-[2rem] sticky top-24">
              <CardHeader className="bg-slate-900 text-white p-6">
                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
                  <User className="w-4 h-4" /> Client Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                 <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--muted-foreground)] block mb-1">Client Name</label>
                    <p className="font-black text-slate-900">{project.clientName || 'Private Client'}</p>
                 </div>
                 <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--muted-foreground)] block mb-1">Contact Email</label>
                    <p className="font-bold text-indigo-600 text-sm underline decoration-2 underline-offset-4">{project.clientEmail || 'hidden@skillsync.com'}</p>
                 </div>
                 <hr className="opacity-10" />
                 <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                    <p className="text-[10px] font-bold text-indigo-900 italic">
                      "Remember to communicate through the Slack-Sync integrated chat for payment protection."
                    </p>
                 </div>
                 <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest text-[10px] h-10 rounded-xl">
                    Open Messages
                 </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
