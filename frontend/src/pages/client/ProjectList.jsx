import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import { Briefcase, Clock, Plus, Filter, Loader2, ChevronRight, Search } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Badge } from "../../components/ui/badge"
import { clientApi } from "../../services/api"

export default function ProjectList() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    clientApi.getProjects()
      .then(data => setProjects(data.data || []))
      .catch(err => console.error("Error loading projects:", err))
      .finally(() => setLoading(false))
  }, [])

  const filteredProjects = projects.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) || 
    p.status.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-8 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">My Projects</h1>
          <p className="text-[var(--muted-foreground)]">Manage your active listings and contracts.</p>
        </div>
        <Link to="/client/post-project">
          <Button className="font-bold shadow-lg shadow-indigo-500/20">
            <Plus className="w-4 h-4 mr-2" /> Post New Project
          </Button>
        </Link>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
          <Input 
            placeholder="Search projects..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="pl-9 h-10"
          />
        </div>
        <Button variant="outline" size="icon" className="h-10 w-10 shrink-0">
          <Filter className="w-4 h-4" />
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-12 bg-[var(--muted)]/30 rounded-2xl border-2 border-dashed border-[var(--border)]">
          <Briefcase className="w-12 h-12 mx-auto text-[var(--muted-foreground)] mb-4" />
          <h3 className="text-lg font-bold">No projects found</h3>
          <p className="text-sm text-[var(--muted-foreground)] mb-6">Get started by posting your first project requirement.</p>
          <Link to="/client/post-project">
            <Button variant="outline" className="font-bold">Post Project</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredProjects.map((project, i) => (
            <motion.div 
              key={project.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link to={`/client/projects/${project.id}`}>
                <Card className="border-none shadow-sm card-shadow hover:shadow-md transition-shadow bg-[var(--card)] group cursor-pointer">
                  <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold group-hover:text-indigo-600 transition-colors">{project.title}</h3>
                        <Badge variant={project.status === 'open' ? 'success' : 'secondary'} className="uppercase text-[10px] tracking-wider font-bold">
                          {project.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-[var(--muted-foreground)] line-clamp-1">{project.description}</p>
                      <div className="flex items-center gap-4 text-xs font-bold text-[var(--muted-foreground)] mt-2">
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Posted {new Date(project.createdAt).toLocaleDateString()}</span>
                        <span>Budget: KSh {parseFloat(project.budgetMin).toLocaleString()} - {parseFloat(project.budgetMax).toLocaleString()}</span>
                        <span>{project.proposalsCount || 0} Proposals</span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[var(--muted-foreground)] group-hover:text-indigo-600 transition-colors" />
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}