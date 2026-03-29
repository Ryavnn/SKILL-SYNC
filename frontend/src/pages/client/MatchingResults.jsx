import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Sparkles, Star, CheckCircle2, Eye, UserPlus, Filter, ArrowUpDown, Loader2 } from "lucide-react"
import { Card, CardContent } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import { Avatar, AvatarFallback } from "../../components/ui/avatar"
import { marketplaceApi, clientApi, invitationApi } from "../../services/api"
import { useSearchParams, Link } from "react-router-dom"

function getScoreColor(score) {
  if (score >= 90) return "text-emerald-600 bg-emerald-50"
  if (score >= 80) return "text-blue-600 bg-blue-50"
  if (score >= 70) return "text-orange-600 bg-orange-50"
  return "text-[var(--muted-foreground)] bg-[var(--muted)]"
}

export default function MatchingResults() {
  const [searchParams] = useSearchParams()
  const initialProjectId = searchParams.get("projectId")
  
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [projectId, setProjectId] = useState(initialProjectId)
  const [invitingFreelancer, setInvitingFreelancer] = useState(null)
  
  useEffect(() => {
    async function fetchMatches() {
      setLoading(true)
      setError(null)
      try {
        let targetId = initialProjectId
        if (!targetId) {
          // Fallback: Fetch latest open project for user
          const myProjectsResp = await clientApi.getProjects()
          const projects = myProjectsResp.data || []
          if (projects.length > 0) {
            targetId = projects[0].id
          } else {
            setMatches([])
            setLoading(false)
            return
          }
        }
        
        setProjectId(targetId)
        const response = await marketplaceApi.getAiMatches(targetId)
        setMatches(response.data || [])
      } catch (err) {
        setError(err.message || "Failed to fetch AI matches.")
      } finally {
        setLoading(false)
      }
    }
    
    fetchMatches()
  }, [initialProjectId])

  const handleInviteFreelancer = async (freelancerId) => {
    if (!projectId) {
      alert("No project selected. Please select a project first.")
      return
    }

    setInvitingFreelancer(freelancerId)
    try {
      // Send invitation via the dedicated invitation API
      await invitationApi.sendInvitation({
        project_id: projectId,
        freelancer_id: freelancerId,
        message: "You've been invited to work on this project based on your skills and experience. We'd love to collaborate with you!"
      })
      
      alert("Invitation sent successfully! The freelancer will be notified.")
    } catch (err) {
      console.error("Invite error:", err)
      alert(err.message || "Failed to send invitation. Please try again.")
    } finally {
      setInvitingFreelancer(null)
    }
  }

  return (
    <div className="space-y-8 animate-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-6 h-6 text-indigo-500" />
            <h1 className="text-3xl font-extrabold tracking-tight">AI Match Results</h1>
          </div>
          {loading ? (
             <p className="text-[var(--muted-foreground)]">Analyzing marketplace talent pool...</p>
          ) : (
             <p className="text-[var(--muted-foreground)]">We found <strong>{matches.length} professionals</strong> matching your project requirements.</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="font-bold text-sm">
            <Filter className="w-4 h-4 mr-2" /> Refine
          </Button>
          <Button variant="outline" className="font-bold text-sm">
            <ArrowUpDown className="w-4 h-4 mr-2" /> Sort
          </Button>
        </div>
      </div>

      {error && (
         <div className="p-4 bg-red-50 text-red-600 font-bold rounded-xl text-sm">
            {error}
         </div>
      )}

      {/* Match Score Legend */}
      <Card className="border-none shadow-sm card-shadow bg-indigo-50/50">
        <CardContent className="p-4 flex flex-wrap items-center gap-4 text-xs font-bold">
          <span className="text-[var(--muted-foreground)]">Match Quality:</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> 90–100% Excellent</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> 80–89% Strong</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> 70–79% Good</span>
        </CardContent>
      </Card>

      {/* Results */}
      {loading ? (
         <div className="flex flex-col items-center justify-center py-20 gap-4">
             <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
             <p className="text-[var(--muted-foreground)] font-medium">Running match algorithms...</p>
         </div>
      ) : matches.length === 0 ? (
         <div className="text-center py-20 space-y-4">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold">No Matches Found</h3>
            <p className="text-[var(--muted-foreground)] text-sm max-w-md mx-auto">Either you have no active projects or there are no freelancers that fit your requirements right now.</p>
            <Link to="/client/post-project">
              <Button className="mt-4 font-bold">Post a New Project</Button>
            </Link>
         </div>
      ) : (
        <div className="space-y-4">
          {matches.map((match, i) => {
            const freelancer = match.freelancer || {}
            // Defensive checks in case data format varies
            const score = match.score || 0
            const name = freelancer.name || "Unknown Freelancer"
            const role = freelancer.title || "Specialist"
            const exp = freelancer.experienceLevel || "junior"
            const rate = freelancer.hourlyRate || 0
            const verified = freelancer.verificationStatus === 'verified'
            const skills = freelancer.skills || []
            const rating = match.rating || 0.0
            const reviewsCount = match.reviews_count || 0
            
            return (
              <motion.div
                key={freelancer.user_id || i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <Card className="border-none shadow-sm card-shadow bg-[var(--card)] hover:shadow-md transition-all group">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                      {/* Match Score */}
                      <div className={`w-16 h-16 shrink-0 rounded-2xl flex flex-col items-center justify-center font-black ${getScoreColor(score)}`}>
                        <span className="text-xl leading-none">{Math.round(score)}</span>
                        <span className="text-[8px] uppercase tracking-widest opacity-70">Match</span>
                      </div>

                      {/* Avatar + Info */}
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <Avatar className="h-14 w-14 border-2 border-indigo-100 shrink-0">
                          {freelancer.avatarUrl ? (
                             <img src={freelancer.avatarUrl} alt={name} className="w-full h-full object-cover" />
                          ) : (
                             <AvatarFallback className="font-black bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">{name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          )}
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-extrabold text-lg group-hover:text-indigo-600 transition-colors uppercase">{name}</h3>
                            {verified && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-[var(--muted-foreground)] font-medium capitalize">{role} · {exp} exp · KSh {parseFloat(rate).toLocaleString()}/hr</p>
                          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                            {skills.slice(0, 5).map(skill => (
                              <Badge key={skill} variant="outline" className="text-[10px] uppercase font-bold py-0 h-5 border-slate-200">
                                {skill}
                              </Badge>
                            ))}
                            {skills.length > 5 && (
                              <Badge variant="secondary" className="text-[10px] font-bold py-0 h-5">+{skills.length - 5}</Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Rating + Actions */}
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right hidden sm:block">
                          <div className="flex items-center gap-1 text-amber-500 font-black justify-end">
                            <Star className="w-4 h-4 fill-current" />
                            <span>{parseFloat(rating).toFixed(1)}</span>
                          </div>
                          <p className="text-[10px] text-[var(--muted-foreground)] font-bold">{reviewsCount} reviews</p>
                        </div>
                        <div className="flex gap-2">
                          <Link to={`/client/freelancer/${freelancer.user_id}`}>
                            <Button variant="outline" size="sm" className="font-bold">
                              <Eye className="w-4 h-4 mr-1" /> Profile
                            </Button>
                          </Link>
                          <Button 
                            size="sm" 
                            className="font-bold shadow-lg shadow-indigo-500/10"
                            onClick={() => handleInviteFreelancer(freelancer.user_id)}
                            disabled={invitingFreelancer === freelancer.user_id}
                          >
                            {invitingFreelancer === freelancer.user_id ? (
                              <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Inviting...</>
                            ) : (
                              <><UserPlus className="w-4 h-4 mr-1" /> Invite</>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

