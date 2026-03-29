import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Search, Filter, Clock, CheckCircle2, ChevronRight, Briefcase, Calendar, DollarSign, Loader2, AlertCircle } from "lucide-react"
import { Link } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Badge } from "../../components/ui/badge"
import { clientApi } from "../../services/api"

export default function MyProjects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await clientApi.getProjects()
      if (response.data) {
        setProjects(response.data)
      }
    } catch (err) {
      console.error("Failed to fetch projects:", err)
      setError("Could not load your projects. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTab = activeTab === "all" || p.status === activeTab
    return matchesSearch && matchesTab
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'in_progress': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'completed': return 'bg-slate-50 text-slate-700 border-slate-200'
      default: return 'bg-slate-50 text-slate-700'
    }
  }

  return (
    <div className="space-y-8 animate-in">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">My Projects</h1>
          <p className="text-[var(--muted-foreground)]">Manage and track all your posted assignments.</p>
        </div>
        <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 px-6 shadow-lg shadow-indigo-500/20 active:scale-95 transition-all">
          <Link to="/client/post-project">
            <Plus className="w-5 h-5 mr-2" />
            Post New Project
          </Link>
        </Button>
      </div>

      {/* Filters and Stats */}
      <Card className="border-none shadow-sm card-shadow bg-[var(--card)]">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row gap-6 justify-between items-center">
            {/* Tabs */}
            <div className="flex items-center p-1 bg-[var(--muted)]/50 rounded-xl w-full md:w-auto overflow-x-auto">
              {["all", "open", "in_progress", "completed"].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`
                    px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all whitespace-nowrap
                    ${activeTab === tab 
                      ? "bg-[var(--card)] text-indigo-600 shadow-sm" 
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"}
                  `}
                >
                  {tab.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative group w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)] group-focus-within:text-indigo-600 transition-colors" />
              <Input 
                placeholder="Search projects..." 
                className="pl-10 bg-transparent border-2 border-transparent focus:border-indigo-500/50 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
            <p className="font-bold text-[var(--muted-foreground)]">Fetching your projects...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-red-50/50 rounded-2xl border-2 border-red-100 p-8">
            <AlertCircle className="w-12 h-12 text-red-500" />
            <h3 className="text-xl font-bold text-red-900">Oops! Something went wrong</h3>
            <p className="text-red-700 max-w-md">{error}</p>
            <Button variant="outline" onClick={fetchProjects} className="border-red-200 text-red-700 hover:bg-red-100">Try Again</Button>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
              <Briefcase className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold">No projects found</h3>
              <p className="text-[var(--muted-foreground)] max-w-sm mx-auto">
                {searchTerm || activeTab !== "all" 
                  ? "Try adjusting your filters or search terms." 
                  : "You haven't posted any projects yet. Start by creating one!"}
              </p>
            </div>
            {!searchTerm && activeTab === "all" && (
              <Button asChild className="bg-indigo-600">
                <Link to="/client/post-project">Post your first project</Link>
              </Button>
            )}
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredProjects.map((project, idx) => (
              <motion.div
                key={project.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: idx * 0.05 }}
              >
                <Card className="group hover:border-indigo-200 transition-all border-2 border-transparent bg-[var(--card)] card-shadow overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    <CardContent className="p-6 flex-1 flex flex-col md:flex-row md:items-center gap-6">
                      <div className="h-14 w-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0 group-hover:scale-110 transition-transform">
                        <Briefcase className="w-7 h-7" />
                      </div>
                      
                      <div className="flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-bold group-hover:text-indigo-600 transition-colors uppercase tracking-tight">
                            {project.title}
                          </h3>
                          <Badge variant="outline" className={`capitalize font-bold text-[10px] py-0 h-5 border-2 ${getStatusColor(project.status)}`}>
                            {project.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-[var(--muted-foreground)] line-clamp-1 italic">
                          {project.description}
                        </p>
                        
                        <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-[var(--muted-foreground)] pt-2">
                          <div className="flex items-center gap-1.5 bg-slate-100/50 px-2 py-1 rounded-md">
                             <Calendar className="w-3.5 h-3.5" />
                             <span>Due {new Date(project.timeline).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1.5 bg-emerald-50/50 text-emerald-700 px-2 py-1 rounded-md">
                             <DollarSign className="w-3.5 h-3.5" />
                             <span>KSh {parseFloat(project.budgetMin || 0).toLocaleString()} - {parseFloat(project.budgetMax || 0).toLocaleString()}</span>
                          </div>
                          {project.requiredSkills && (
                            <div className="flex items-center gap-1.5">
                              {project.requiredSkills.slice(0, 3).map(skill => (
                                <Badge key={skill} variant="secondary" className="text-[10px] uppercase py-0 h-4">{skill}</Badge>
                              ))}
                              {project.requiredSkills.length > 3 && (
                                <span className="text-[10px]">+{project.requiredSkills.length - 3}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                    
                    <div className="bg-[var(--muted)]/20 p-4 md:p-6 md:w-32 flex flex-row md:flex-col items-center justify-center gap-3 border-t md:border-t-0 md:border-l border-[var(--border)]">
                      <Button asChild variant="ghost" className="font-bold text-xs h-9 uppercase tracking-widest hover:bg-indigo-50 hover:text-indigo-600">
                        <Link to={`/client/projects/${project.id}`}>
                           Manage
                        </Link>
                      </Button>
                      <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)] hidden md:block" />
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
