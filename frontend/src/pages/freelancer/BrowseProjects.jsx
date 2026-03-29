import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Search, 
  Filter, 
  Clock, 
  Briefcase, 
  Calendar, 
  ArrowRight,
  TrendingUp,
  MapPin,
  ChevronRight
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Badge } from "../../components/ui/badge"
import { clientApi } from "../../services/api"

export default function BrowseProjects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const navigate = useNavigate()

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const data = await clientApi.getProjects()
      // The API returns { data: [...], status: 200 }
      setProjects(data.data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredProjects = projects.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-8 animate-in max-w-6xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <Badge variant="secondary" className="bg-indigo-50 text-indigo-600 border-indigo-100 px-3 py-1 font-bold text-xs">
            PROJECT MARKETPLACE
          </Badge>
          <h1 className="text-4xl font-extrabold tracking-tight text-[var(--foreground)]">
            Find Your Next <span className="text-gradient">Breakthrough</span>
          </h1>
          <p className="text-[var(--muted-foreground)] text-lg max-w-2xl">
            Discover high-value opportunities from top clients across East Africa and beyond.
          </p>
        </div>
      </div>

      <div className="sticky top-20 z-20 bg-[var(--background)]/80 backdrop-blur-md pt-2 pb-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 group w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)] group-focus-within:text-indigo-500 transition-colors" />
            <Input 
              placeholder="Search by title, description, or skills..." 
              className="pl-10 h-12 bg-[var(--card)] border-[var(--border)] focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="h-12 gap-2 border-[var(--border)] hover:bg-[var(--muted)] font-bold px-6 shadow-sm">
            <Filter className="w-4 h-4" /> Filters
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-64 bg-[var(--card)] rounded-2xl animate-pulse border border-[var(--border)]" />
          ))}
        </div>
      ) : error ? (
        <Card className="border-red-100 bg-red-50/30">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 rotate-45" />
            </div>
            <h3 className="text-lg font-bold text-red-900">Oops! Something went wrong</h3>
            <p className="text-red-700 max-w-sm mt-1">{error}</p>
            <Button variant="outline" className="mt-6 border-red-200" onClick={fetchProjects}>Try Again</Button>
          </CardContent>
        </Card>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-20 bg-[var(--card)] rounded-3xl border border-dashed border-[var(--separator)]">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-50 text-slate-400 mb-4">
            <Briefcase className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold">No projects found</h3>
          <p className="text-[var(--muted-foreground)] mt-2">Try adjusting your search or filters to see more results.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredProjects.map((p, i) => (
              <motion.div 
                key={p.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <Card className="h-full border border-[var(--separator)] hover:border-indigo-200 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 group overflow-hidden bg-[var(--card)] relative">
                  <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <CardTitle className="text-xl font-bold line-clamp-1 group-hover:text-indigo-600 transition-colors">
                          {p.title}
                        </CardTitle>
                        <div className="flex items-center gap-3 text-sm text-[var(--muted-foreground)] font-medium">
                          <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-indigo-400" /> Remote</span>
                          <span>•</span>
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-indigo-400" /> {p.timeline}</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    <p className="text-[var(--muted-foreground)] text-sm line-clamp-2 leading-relaxed h-10">
                      {p.description}
                    </p>

                    <div className="flex flex-wrap gap-1.5 min-h-[50px] content-start">
                      {p.required_skills?.map(skill => (
                        <Badge key={skill} variant="outline" className="text-[10px] font-bold px-2.5 py-0.5 bg-slate-50/50 hover:bg-indigo-50 hover:border-indigo-200 transition-colors cursor-default border-[var(--border)]">
                          {skill}
                        </Badge>
                      ))}
                    </div>

                    <div className="pt-4 border-t border-[var(--separator)] flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="text-[10px] uppercase font-bold text-[var(--muted-foreground)] tracking-wider">PROJECT BUDGET</p>
                        <p className="font-extrabold text-lg text-[var(--foreground)]">
                           KSh {p.budgetMin?.toLocaleString()} - {p.budgetMax?.toLocaleString()}
                        </p>
                      </div>
                      <Button 
                        onClick={() => navigate(`/freelancer/marketplace-projects/${p.id}`)}
                        className="h-10 px-5 font-bold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all rounded-xl gap-2"
                      >
                        Details <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
