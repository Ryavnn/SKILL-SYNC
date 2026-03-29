import React, { useState, useEffect } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { 
  FileText, 
  Users, 
  Plus, 
  Trash2, 
  ChevronRight, 
  CircleDollarSign, 
  Calendar,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowLeft
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Textarea } from "../../components/ui/textarea"
import { Badge } from "../../components/ui/badge"
import { clientApi, contractApi, userApi } from "../../services/api"

export default function ClientCreateContract() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const projectId = searchParams.get("projectId")
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  
  const [project, setProject] = useState(null)
  const [freelancer, setFreelancer] = useState(null)
  
  const [milestones, setMilestones] = useState([
    { id: Date.now(), title: "Initial Delivery", description: "First phase of the project.", amount: "" }
  ])

  useEffect(() => {
    if (projectId) {
      fetchData()
    }
  }, [projectId])

  const fetchData = async () => {
    try {
      setLoading(true)
      const projRes = await clientApi.getProject(projectId)
      setProject(projRes.data)
      
      if (projRes.data.assignedFreelancerId) {
        const freeRes = await userApi.getUser(projRes.data.assignedFreelancerId)
        setFreelancer(freeRes.data)
      }
      
      setError(null)
    } catch (err) {
      console.error(err)
      setError("Failed to load project details")
    } finally {
      setLoading(false)
    }
  }

  const addMilestone = () => {
    setMilestones([...milestones, { id: Date.now(), title: "", description: "", amount: "" }])
  }

  const removeMilestone = (id) => {
    if (milestones.length > 1) {
      setMilestones(milestones.filter(m => m.id !== id))
    }
  }

  const updateMilestone = (id, field, value) => {
    setMilestones(milestones.map(m => m.id === id ? { ...m, [field]: value } : m))
  }

  const totalAmount = milestones.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!project || !freelancer) return
    if (milestones.some(m => !m.title || !m.amount)) {
      setError("Please fill in all milestone titles and amounts.")
      return
    }

    try {
      setSubmitting(true)
      setError(null)
      
      const payload = {
        projectId,
        freelancerId: freelancer.id,
        totalAmount: totalAmount,
        milestones: milestones.map(({ title, description, amount }) => ({
          title,
          description,
          amount: parseFloat(amount)
        }))
      }
      
      await contractApi.create(payload)
      navigate("/client/contracts")
    } catch (err) {
      console.error(err)
      setError(err.message || "Failed to create contract")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-[var(--muted-foreground)]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)] mb-4" />
        <p>Preparing the drafting board...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4 -ml-2 text-[var(--muted-foreground)]">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Project
          </Button>
          <h1 className="text-3xl font-black tracking-tight">Draft Contract</h1>
          <p className="text-[var(--muted-foreground)]">Define milestones and finalize the agreement.</p>
        </div>
        <div className="text-right">
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 font-bold uppercase tracking-widest text-[9px] px-3 py-1">
            New Agreement
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Col: Form */}
        <div className="md:col-span-2 space-y-6">
          <form id="contract-form" onSubmit={handleSubmit} className="space-y-6">
            <Card className="border-none shadow-sm card-shadow bg-[var(--card)]">
              <CardHeader>
                <CardTitle className="text-base font-bold">Milestones</CardTitle>
                <CardDescription>Break down the project into manageable, payable phases.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <AnimatePresence initial={false}>
                  {milestones.map((milestone, index) => (
                    <motion.div 
                      key={milestone.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-4 rounded-xl border-2 border-slate-50 bg-slate-50/50 space-y-4 relative group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Milestone #{index + 1}</span>
                        {milestones.length > 1 && (
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => removeMilestone(milestone.id)}
                            className="h-6 w-6 text-red-400 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2 space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)] pl-1">Title</label>
                          <Input 
                            placeholder="e.g. Design Phase" 
                            value={milestone.title}
                            onChange={(e) => updateMilestone(milestone.id, 'title', e.target.value)}
                            required
                            className="bg-white border-transparent focus:border-indigo-500 shadow-none ring-0 h-9 text-sm font-medium"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)] pl-1">Amount (KSh)</label>
                          <Input 
                            type="number"
                            placeholder="0.00" 
                            value={milestone.amount}
                            onChange={(e) => updateMilestone(milestone.id, 'amount', e.target.value)}
                            required
                            className="bg-white border-transparent focus:border-indigo-500 shadow-none ring-0 h-9 text-sm font-bold"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)] pl-1">Description (Optional)</label>
                        <Textarea 
                          placeholder="What will be delivered in this phase?" 
                          value={milestone.description}
                          onChange={(e) => updateMilestone(milestone.id, 'description', e.target.value)}
                          className="bg-white border-transparent focus:border-indigo-500 shadow-none ring-0 text-sm min-h-[60px]"
                        />
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full border-dashed border-2 text-[var(--muted-foreground)] hover:text-indigo-600 hover:border-indigo-300 transition-all font-bold text-xs h-12"
                  onClick={addMilestone}
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Another Milestone
                </Button>
              </CardContent>
            </Card>

            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3 text-red-600">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}
          </form>
        </div>

        {/* Right Col: Summary */}
        <div className="space-y-6">
          <Card className="border-none shadow-sm card-shadow bg-[var(--card)] sticky top-8">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Contract Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600"><FileText className="w-4 h-4" /></div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Project</p>
                    <p className="text-sm font-black truncate">{project?.title}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-slate-100 text-slate-600"><Users className="w-4 h-4" /></div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Freelancer</p>
                    <p className="text-sm font-black truncate">{freelancer?.name}</p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 space-y-4">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">
                  <span>Subtotal</span>
                  <span>{new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(totalAmount).replace('KES', 'KSh')}</span>
                </div>
                <div className="flex justify-between items-center bg-indigo-600 p-4 rounded-xl text-white shadow-lg shadow-indigo-100">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Total Budget</p>
                    <h2 className="text-2xl font-black tracking-tight leading-none px-0 py-0">{new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(totalAmount).replace('KES', 'KSh')}</h2>
                  </div>
                  <CircleDollarSign className="w-8 h-8 opacity-40 shrink-0" />
                </div>
              </div>

              <div className="space-y-3">
                <Button 
                  form="contract-form"
                  type="submit" 
                  disabled={submitting}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest text-[11px] h-12 shadow-xl shadow-slate-200 group"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>Create & Send Contract <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" /></>
                  )}
                </Button>
                <p className="text-[10px] text-center text-slate-400 font-medium px-4 leading-relaxed">
                  By creating this contract, you agree to the platform terms. Funds choice will be available once the freelancer accepts.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="p-6 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-4">
            <h4 className="flex items-center text-[10px] font-black uppercase tracking-widest text-indigo-700">
              <CheckCircle2 className="w-3.5 h-3.5 mr-2" /> How Escrow Works
            </h4>
            <div className="space-y-3">
              <div className="flex gap-3">
                <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-black flex items-center justify-center shrink-0">1</span>
                <p className="text-[10px] font-medium text-indigo-900/70 leading-relaxed italic">Draft milestones and send contract to the freelancer.</p>
              </div>
              <div className="flex gap-3">
                <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-black flex items-center justify-center shrink-0">2</span>
                <p className="text-[10px] font-medium text-indigo-900/70 leading-relaxed italic">Freelancer active & accepts the terms.</p>
              </div>
              <div className="flex gap-3">
                <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-black flex items-center justify-center shrink-0">3</span>
                <p className="text-[10px] font-medium text-indigo-900/70 leading-relaxed italic">Fund milestones to start work safely.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
