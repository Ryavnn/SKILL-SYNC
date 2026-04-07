import React from "react"
import { useParams, useLocation, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Star, CheckCircle2, MapPin, Clock, ExternalLink, UserPlus, MessageSquare, Globe, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import { Avatar, AvatarFallback } from "../../components/ui/avatar"

import { userApi, freelancerApi, clientApi, invitationApi, messagingApi } from "../../services/api"

export default function ProfileView() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const isClientView = location.pathname.startsWith('/client/')
  
  const [profile, setProfile] = React.useState(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(null)
  const [inviting, setInviting] = React.useState(false)
  const [messaging, setMessaging] = React.useState(false)
  const [myProjects, setMyProjects] = React.useState([])
  const [showProjectSelector, setShowProjectSelector] = React.useState(false)
  const [selectedProject, setSelectedProject] = React.useState(null)

  const handleMessage = async () => {
    setMessaging(true)
    try {
      const res = await messagingApi.getOrCreateThread({ participant_id: id })
      navigate(isClientView ? '/client/messages' : '/freelancer/messages', { 
        state: { threadId: res.data.id } 
      })
    } catch (err) {
      console.error("Messaging error:", err)
      alert("Failed to start conversation. Please try again.")
    } finally {
      setMessaging(false)
    }
  }

  React.useEffect(() => {
    if (id) {
      setLoading(true)
      const requests = [
        userApi.getUser(id),
        freelancerApi.getProfile(id)
      ]
      
      // If viewing as a client, also fetch their projects
      if (isClientView) {
        requests.push(clientApi.getProjects())
      }
      
      Promise.all(requests)
        .then((results) => {
          const [userRes, profileRes, projectsRes] = results
          const u = userRes.data
          const p = profileRes.data
          
          if (!u) {
            console.warn("User data missing in response:", userRes)
            setError("User profile not found")
            return
          }

          setProfile({
            name: u.name,
            role: p?.title || "Freelancer",
            bio: p?.bio || "No bio available.",
            skills: p?.skills || [],
            verified: p?.verificationStatus === 'verified',
            experience: p?.experience || "junior",
            hourlyRate: p?.hourlyRate || 0,
            location: p?.location || "Not specified",
            portfolio: p?.portfolioLinks?.map(l => ({ label: new URL(l).hostname, url: l })) || [],
            completedProjects: 0, 
            successRate: 100,
            rating: 5.0
          })
          
          if (isClientView && projectsRes?.data) {
            setMyProjects(projectsRes.data || [])
          }
        })
        .catch(err => setError(err.message || "Failed to load profile details"))
        .finally(() => setLoading(false))
    }
  }, [id, isClientView])

  const handleInviteClick = () => {
    if (!isClientView) return
    
    if (myProjects.length === 0) {
      alert("You don't have any active projects. Please create a project first.")
      return
    }
    
    if (myProjects.length === 1) {
      setSelectedProject(myProjects[0].id)
      handleSendInvitation(myProjects[0].id)
    } else {
      setShowProjectSelector(true)
    }
  }

  const handleSendInvitation = async (projectId) => {
    setInviting(true)
    try {
      await invitationApi.sendInvitation({
        project_id: projectId || selectedProject,
        freelancer_id: id,
        message: "You've been invited to work on this project based on your skills and experience. We'd love to collaborate with you!"
      })
      
      alert("Invitation sent successfully! The freelancer will be notified.")
      setShowProjectSelector(false)
    } catch (err) {
      console.error("Invite error:", err)
      alert(err.message || "Failed to send invitation. Please try again.")
    } finally {
      setInviting(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (error) return (
    <div className="p-8 text-center bg-red-50 text-red-600 rounded-2xl font-bold">
      {error}
    </div>
  )

  if (!profile) return null

  return (
    <div className="space-y-8 animate-in">
      Hero Banner
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-none shadow-sm card-shadow bg-[var(--card)] overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-indigo-500 via-indigo-400 to-emerald-400" />
          <CardContent className="px-6 lg:px-10 pb-8 -mt-16 relative">
            <div className="flex flex-col md:flex-row md:items-end gap-6">
              <Avatar className="h-28 w-28 border-4 border-[var(--card)] ring-4 ring-indigo-100/50 shadow-xl">
                <AvatarFallback className="text-3xl font-black bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">{profile.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-3xl font-extrabold tracking-tight">{profile.name}</h1>
                  {profile.verified && (
                    <Badge variant="success" className="bg-emerald-50 text-emerald-700 border-none font-black text-[10px] uppercase tracking-wide">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Verified
                    </Badge>
                  )}
                </div>
                <p className="text-[var(--muted-foreground)] font-bold mt-1">{profile.role}</p>
                <div className="flex items-center gap-4 mt-3 text-xs font-bold text-[var(--muted-foreground)]">
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {profile.location}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {profile.experience}y experience</span>
                  <span className="flex items-center gap-1">KSh {profile.hourlyRate.toLocaleString()}/hr</span>
                </div>
              </div>
              <div className="flex gap-3 shrink-0">
                <Button 
                  variant="outline" 
                  className="font-bold"
                  onClick={handleMessage}
                  disabled={messaging}
                >
                  {messaging ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Starting Chat...</>
                  ) : (
                    <><MessageSquare className="w-4 h-4 mr-2" /> Message</>
                  )}
                </Button>
                {isClientView && (
                  <Button 
                    className="font-bold shadow-lg shadow-indigo-500/20"
                    onClick={handleInviteClick}
                    disabled={inviting}
                  >
                    {inviting ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Inviting...</>
                    ) : (
                      <><UserPlus className="w-4 h-4 mr-2" /> Invite to Project</>
                    )}
                  </Button>
                )}
                {!isClientView && (
                  <Button className="font-bold shadow-lg shadow-indigo-500/20">
                    <UserPlus className="w-4 h-4 mr-2" /> Hire
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm card-shadow bg-[var(--card)]">
            <CardHeader>
              <CardTitle className="text-lg font-bold">About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">{profile.bio}</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm card-shadow bg-[var(--card)]">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map(skill => (
                  <Badge key={skill} variant="outline" className="py-1.5 px-3 text-xs font-bold border-slate-200">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm card-shadow bg-[var(--card)]">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Globe className="w-5 h-5" /> Portfolio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {profile.portfolio.map(link => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-[var(--muted)]/50 transition-colors group"
                >
                  <span className="text-sm font-bold group-hover:text-[var(--primary)] transition-colors">{link.label}</span>
                  <ExternalLink className="w-4 h-4 text-[var(--muted-foreground)] group-hover:text-[var(--primary)]" />
                </a>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-sm card-shadow bg-[var(--card)]">
            <CardContent className="p-6 space-y-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-amber-500 mb-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-5 h-5 ${i < Math.floor(profile.rating) ? 'fill-current' : ''}`} />
                  ))}
                </div>
                <p className="text-2xl font-black">{profile.rating}</p>
                <p className="text-xs text-[var(--muted-foreground)] font-medium">5 reviews</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--border)]">
                <div className="text-center">
                  <p className="text-2xl font-black">{profile.completedProjects}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">Projects</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-black text-emerald-600">{profile.successRate}%</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">Success</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {isClientView && (
            <Card className="border-none shadow-sm card-shadow bg-slate-900 text-white">
              <CardContent className="p-6 text-center space-y-4">
                <h3 className="text-lg font-bold">Ready to work together?</h3>
                <p className="text-sm text-slate-400">Send a project invitation and start collaborating today.</p>
                <Button 
                  className="w-full bg-indigo-500 hover:bg-indigo-400 font-bold h-11"
                  onClick={handleInviteClick}
                  disabled={inviting}
                >
                  {inviting ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Inviting...</>
                  ) : (
                    <><UserPlus className="w-4 h-4 mr-2" /> Invite to Project</>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {showProjectSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowProjectSelector(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[var(--card)] rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold">Select a Project</h3>
            <p className="text-sm text-[var(--muted-foreground)]">Choose which project to invite {profile.name} to:</p>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {myProjects.map((project) => (
                <div
                  key={project.id}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedProject === project.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-[var(--border)] hover:border-indigo-300'
                  }`}
                  onClick={() => setSelectedProject(project.id)}
                >
                  <h4 className="font-bold">{project.title}</h4>
                  <p className="text-xs text-[var(--muted-foreground)] mt-1 line-clamp-2">{project.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-[10px]">{project.status}</Badge>
                    <span className="text-xs text-[var(--muted-foreground)]">
                      Budget: KSh {parseFloat(project.budget || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1 font-bold"
                onClick={() => setShowProjectSelector(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 font-bold"
                onClick={() => handleSendInvitation()}
                disabled={!selectedProject || inviting}
              >
                {inviting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
                ) : (
                  'Send Invitation'
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
