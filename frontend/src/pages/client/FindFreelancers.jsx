import React, { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Filter, Star, CheckCircle2, SlidersHorizontal, UserPlus, MapPin, DollarSign, Clock, Loader2 } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Badge } from "../../components/ui/badge"
import { Checkbox } from "../../components/ui/checkbox"
import { Label } from "../../components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar"
import { useNavigate } from "react-router-dom"
import { marketplaceApi } from "../../services/api"

const SKILLS_LIST = ["React", "Node.js", "Figma", "AWS", "Python", "Go", "TypeScript", "PostgreSQL", "TailwindCSS", "Next.js"]

export default function FindFreelancers() {
  const navigate = useNavigate()
  const [freelancers, setFreelancers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSkills, setSelectedSkills] = useState([])
  const [minExperience, setMinExperience] = useState(0)
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const fetchFreelancers = useCallback(async () => {
    setLoading(true)
    try {
      const response = await marketplaceApi.searchFreelancers({
        search_term: searchTerm,
        skills: selectedSkills,
        min_experience: minExperience,
        verified_only: verifiedOnly
      })
      console.log("API Response:", response) // Debug log
      if (response.data) {
        console.log("Freelancers data:", response.data) // Debug log
        setFreelancers(response.data)
      } else {
        console.warn("No data property in response")
        setFreelancers([])
      }
    } catch (error) {
      console.error("Failed to fetch freelancers:", error)
      console.error("Error details:", error.message, error.response)
      setFreelancers([])
    } finally {
      setLoading(false)
    }
  }, [searchTerm, selectedSkills, minExperience, verifiedOnly])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFreelancers()
    }, 500)
    return () => clearTimeout(timer)
  }, [fetchFreelancers])

  const toggleSkill = (skill) => {
    setSelectedSkills(prev => 
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    )
  }

  return (
    <div className="space-y-8 animate-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Browse Talent</h1>
          <p className="text-[var(--muted-foreground)]">Find the perfect specialist for your next big project.</p>
        </div>
        <div className="flex items-center gap-3">
           <Button 
            variant="outline" 
            className="md:hidden"
            onClick={() => setShowFilters(!showFilters)}
           >
              <Filter className="w-4 h-4 mr-2" />
              Filters
           </Button>
           <div className="relative group flex-1 md:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1-2 w-4 h-4 text-[var(--muted-foreground)] group-focus-within:text-[var(--primary)] transition-colors" />
              <Input 
                placeholder="Search by name or role..." 
                className="pl-10 h-10 w-full md:w-64 bg-[var(--card)]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <aside className={cn(
          "lg:block space-y-8",
          showFilters ? "block" : "hidden"
        )}>
          <Card className="border-none shadow-sm card-shadow bg-[var(--card)] sticky top-24">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                 <SlidersHorizontal className="w-4 h-4" />
                 Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
               {/* Verified Only */}
               <div className="flex items-center justify-between space-x-2 p-3 bg-[var(--muted)]/50 rounded-xl">
                  <Label htmlFor="verified" className="text-sm font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Verified Only
                  </Label>
                  <Checkbox 
                    id="verified" 
                    checked={verifiedOnly}
                    onChange={(e) => setVerifiedOnly(e.target.checked)}
                  />
               </div>

               {/* Skills */}
               <div className="space-y-3">
                  <Label className="text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)]">Skills</Label>
                  <div className="flex flex-wrap gap-2">
                    {SKILLS_LIST.map(skill => (
                      <Badge 
                        key={skill}
                        variant={selectedSkills.includes(skill) ? "default" : "outline"}
                        className={cn(
                          "cursor-pointer transition-all",
                          selectedSkills.includes(skill) ? "bg-indigo-600" : "hover:border-indigo-300"
                        )}
                        onClick={() => toggleSkill(skill)}
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
               </div>

               {/* Experience */}
               <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)]">Min. Experience</Label>
                    <span className="text-sm font-bold text-[var(--primary)]">
                        {minExperience === 0 ? "Any" : 
                         minExperience <= 2 ? "Junior+" : 
                         minExperience <= 5 ? "Mid+" : 
                         minExperience <= 9 ? "Senior+" : "Expert"}
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="10" 
                    step="1"
                    className="w-full h-1.5 bg-[var(--muted)] rounded-full appearance-none accent-indigo-600 cursor-pointer"
                    value={minExperience}
                    onChange={(e) => setMinExperience(parseInt(e.target.value))}
                  />
               </div>

               <Button 
                variant="ghost" 
                className="w-full text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={() => {
                  setSelectedSkills([])
                  setMinExperience(0)
                  setVerifiedOnly(false)
                  setSearchTerm("")
                }}
               >
                 Reset All Filters
               </Button>
            </CardContent>
          </Card>
        </aside>

        {/* Results Grid */}
        <div className="lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-[var(--muted-foreground)] font-medium">
              {loading ? "Searching..." : (
                <>Showing <span className="text-[var(--foreground)] font-bold">{freelancers.length}</span> professionals</>
              )}
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                <p className="text-[var(--muted-foreground)] font-medium">Loading talent...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AnimatePresence mode="popLayout">
                  {freelancers.map((f, i) => (
                    <motion.div
                      key={f.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card className="h-full border-none shadow-sm card-shadow bg-[var(--card)] hover:shadow-md transition-all flex flex-col group">
                        <CardHeader className="pb-4">
                           <div className="flex items-start justify-between">
                              <Avatar className="h-16 w-16 border-2 border-indigo-100 ring-4 ring-indigo-50/30">
                                 <AvatarFallback className="text-xl font-black bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
                                    {f.name ? f.name.split(' ').map(n=>n[0]).join('') : "U"}
                                 </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col items-end gap-1">
                                 <div className="flex items-center gap-1 text-amber-500 font-black">
                                    <Star className="w-4 h-4 fill-current" />
                                    <span className="text-sm">0.0</span>
                                    <span className="text-[10px] text-[var(--muted-foreground)] font-medium">(0)</span>
                                 </div>
                                 {f.verificationStatus === 'verified' && (
                                    <Badge variant="success" className="bg-emerald-50 text-emerald-700 border-none px-2 py-0 text-[10px] uppercase font-black tracking-tighter">
                                       <CheckCircle2 className="w-3 h-3 mr-1" />
                                       Verified
                                    </Badge>
                                 )}
                              </div>
                           </div>
                           <div className="mt-4">
                              <CardTitle className="text-xl font-extrabold group-hover:text-indigo-600 transition-colors uppercase">{f.name || "Unknown Freelancer"}</CardTitle>
                              <CardDescription className="font-bold text-indigo-500/80">{f.title || "Specialist"}</CardDescription>
                           </div>
                        </CardHeader>
                        
                        <CardContent className="flex-1 space-y-4 pb-4">
                           <p className="text-sm text-[var(--muted-foreground)] line-clamp-2 leading-relaxed">
                              {f.bio || "No bio available."}
                           </p>
                           <div className="flex flex-wrap gap-1.5">
                              {f.skills && f.skills.map(skill => (
                                <Badge key={skill} variant="outline" className="text-[10px] font-bold py-0 h-5 border-slate-200 uppercase">
                                   {skill}
                                </Badge>
                              ))}
                           </div>
                           <div className="flex items-center gap-4 pt-2 text-[11px] font-bold text-[var(--muted-foreground)] border-t border-[var(--border)] pt-4">
                              <div className="flex items-center gap-1">
                                 <DollarSign className="w-3 h-3" />
                                 <span>KSh {f.hourlyRate ? parseFloat(f.hourlyRate).toLocaleString() : "0"}/hr</span>
                              </div>
                              <div className="flex items-center gap-1 capitalize">
                                 <Clock className="w-3 h-3" />
                                 <span>{f.experience || "junior"}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                 <MapPin className="w-3 h-3" />
                                 <span>{f.location ? f.location.split(',')[0] : "Earth"}</span>
                              </div>
                           </div>
                        </CardContent>

                        <CardFooter className="pt-0 pb-6 gap-3">
                           <Button 
                             variant="outline" 
                             className="flex-1 font-bold h-10 border-2"
                             onClick={() => navigate(`/client/freelancer/${f.user_id || f.id}`)}
                           >
                             Profile
                           </Button>
                           <Button 
                             className="flex-1 font-bold h-10 shadow-lg shadow-indigo-500/10 active:scale-95 transition-transform"
                             onClick={() => navigate(`/client/freelancer/${f.user_id || f.id}`)}
                           >
                              <UserPlus className="w-4 h-4 mr-2" />
                              Hire
                           </Button>
                        </CardFooter>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {!loading && freelancers.length === 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-20 text-center space-y-4"
                >
                  <div className="w-20 h-20 bg-[var(--muted)] rounded-full flex items-center justify-center mx-auto text-[var(--muted-foreground)]">
                    <Search className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-bold">No freelancers found</h3>
                  {searchTerm || selectedSkills.length > 0 || verifiedOnly ? (
                    <>
                      <p className="text-[var(--muted-foreground)]">Try adjusting your filters or search terms.</p>
                      <Button variant="link" className="font-bold text-indigo-600" onClick={() => {
                        setSelectedSkills([])
                        setMinExperience(0)
                        setVerifiedOnly(false)
                        setSearchTerm("")
                      }}>Clear all filters</Button>
                    </>
                  ) : (
                    <>
                      <p className="text-[var(--muted-foreground)]">There are no freelancers registered yet.</p>
                      <p className="text-sm text-[var(--muted-foreground)]">Freelancers need to create profiles before they appear here.</p>
                    </>
                  )}
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function cn(...inputs) {
  return inputs.filter(Boolean).join(" ")
}
