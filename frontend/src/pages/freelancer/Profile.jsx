import React, { useState, useEffect } from "react"
import { Camera, Mail, MapPin, Briefcase, Link as LinkIcon, Save, X, Plus, Loader2 } from "lucide-react"
import { useAuth } from "../../hooks/useAuth"
import { freelancerApi, userApi, uploadApi } from "../../services/api"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Badge } from "../../components/ui/badge"
import { cn } from "../../utils/cn"

const SKILLS_POOL = [
  "React", "Node.js", "Python", "TypeScript", "PostgreSQL", "MongoDB",
  "AWS", "Docker", "Figma", "UI Design", "Go", "GraphQL", "Next.js", "TailwindCSS"
]

export default function FreelancerProfile() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState({
    name: "",
    title: "",
    email: "",
    location: "",
    bio: "",
    hourlyRate: 0,
    experience: "senior",
  })
  const [selectedSkills, setSelectedSkills] = useState([])
  const [portfolioLinks, setPortfolioLinks] = useState([])
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)

  useEffect(() => {
    if (user?.id) {
      setLoading(true)
      // Fetch user and profile in parallel
      Promise.allSettled([
        userApi.getUser(user.id),
        freelancerApi.getProfile(user.id)
      ])
        .then(([userRes, profileRes]) => {
          // If profile is missing (404), redirect to creation setup
          if (profileRes.status === 'rejected' && profileRes.reason?.status === 404) {
            navigate("/freelancer/create-profile")
            return
          }

          if (userRes.status === 'fulfilled') {
            const u = userRes.value.data?.user || userRes.value.user
            if (u) {
              setProfile(prev => ({ ...prev, name: u.name, email: u.email }))
              if (u.avatar) setAvatarPreview(u.avatar)
            }
          }

          if (profileRes.status === 'fulfilled') {
            const p = profileRes.value.data?.profile || profileRes.value.data
            if (p) {
              setProfile(prev => ({
                ...prev,
                title: p.title || "",
                location: p.location || "",
                bio: p.bio || "",
                hourlyRate: p.hourlyRate || 0,
                experience: p.experience || "senior",
              }))
              setSelectedSkills(p.skills || [])
              setPortfolioLinks(p.portfolioLinks || [])
            }
          }
        })
        .catch(err => console.error("Error fetching data:", err))
        .finally(() => setLoading(false))
    }
  }, [user, navigate])

  const toggleSkill = (s) => isEditing && setSelectedSkills(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s])

  const handleAvatarChange = (e) => {
    if (!isEditing) return
    const file = e.target.files?.[0]
    if (file) {
      setAvatarPreview(URL.createObjectURL(file))
      setSelectedFile(file)
    }
  }

  const handleSave = async () => {
    if (!user?.id) return
    setSaving(true)
    try {
      if (selectedFile) {
        try {
          await uploadApi.uploadAvatar(selectedFile)
        } catch (uploadErr) {
          console.error("Avatar upload failed:", uploadErr)
        }
      }

      // Sanitize portfolio links
      const sanitizedLinks = portfolioLinks
        .filter(l => l.trim() !== "")
        .map(l => (l.startsWith("http://") || l.startsWith("https://")) ? l : `https://${l}`)

      // Parallel updates to User Module and Freelancer Module
      await Promise.all([
        userApi.updateUser(user.id, { name: profile.name, email: profile.email }),
        freelancerApi.updateProfile(user.id, {
          title: profile.title,
          location: profile.location,
          bio: profile.bio,
          hourlyRate: profile.hourlyRate,
          experience: profile.experience,
          skills: selectedSkills,
          portfolioLinks: sanitizedLinks
        })
      ])
      setIsEditing(false)
    } catch (err) {
      console.error("Error saving profile:", err)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    // Optionally reload data here to reset changes, but let's keep it simple for now
    window.location.reload() 
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">My Profile</h1>
          <p className="text-[var(--muted-foreground)]">Manage your professional details and credentials.</p>
        </div>
        <div className="flex gap-3">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} className="font-bold h-11 px-8">
              Edit Profile
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleCancel} className="font-bold h-11 px-8" disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} className="font-bold h-11 px-8 shadow-lg shadow-indigo-500/20" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save Changes
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="border-none shadow-sm card-shadow bg-[var(--card)]">
            <CardContent className="p-6 flex flex-col items-center gap-4">
              <label className="cursor-pointer group">
                <div className="w-28 h-28 rounded-full border-2 border-dashed border-[var(--border)] hover:border-[var(--primary)] flex items-center justify-center overflow-hidden transition-all bg-[var(--muted)] relative">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-8 h-8 text-[var(--muted-foreground)] group-hover:text-[var(--primary)] transition-colors" />
                  )}
                  {isEditing && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                  )}
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={!isEditing} />
              </label>
              <div className="text-center">
                <h3 className="font-bold text-lg">{profile.name}</h3>
                <p className="text-sm text-[var(--muted-foreground)]">{profile.title}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm card-shadow bg-[var(--card)]">
            <CardHeader><CardTitle className="text-sm font-bold">Quick Info</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center gap-3 text-[var(--muted-foreground)]"><Mail className="w-4 h-4" />{profile.email}</div>
              <div className="flex items-center gap-3 text-[var(--muted-foreground)]"><MapPin className="w-4 h-4" />{profile.location}</div>
              <div className="flex items-center gap-3 text-[var(--muted-foreground)]"><Briefcase className="w-4 h-4" />KSh {profile.hourlyRate.toLocaleString()}/hr</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm card-shadow bg-[var(--card)]">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Personal Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input disabled={!isEditing} value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Professional Title</Label>
                <Input disabled={!isEditing} value={profile.title} onChange={e => setProfile({...profile, title: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input disabled={!isEditing} type="email" value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input disabled={!isEditing} value={profile.location} onChange={e => setProfile({...profile, location: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Hourly Rate (KSh)</Label>
                <Input disabled={!isEditing} type="number" value={profile.hourlyRate} onChange={e => setProfile({...profile, hourlyRate: parseFloat(e.target.value) || 0})} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Bio</Label>
                <textarea
                  disabled={!isEditing}
                  value={profile.bio}
                  onChange={e => setProfile({...profile, bio: e.target.value})}
                  rows={4}
                  maxLength={500}
                  placeholder="Describe your expertise and working style..."
                  className="w-full rounded-xl border border-[var(--input)] bg-transparent px-4 py-3 text-sm placeholder:text-[var(--muted-foreground)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--ring)] resize-none"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm card-shadow bg-[var(--card)]">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Skills & Expertise</CardTitle>
              <CardDescription>Select your core competencies.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {SKILLS_POOL.map(skill => (
                  <Badge
                    key={skill}
                    variant={selectedSkills.some(s => s.toLowerCase() === skill.toLowerCase()) ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer transition-all py-1.5 px-3 text-xs font-bold", 
                      selectedSkills.some(s => s.toLowerCase() === skill.toLowerCase()) 
                        ? "bg-indigo-600 hover:bg-indigo-700" 
                        : "hover:border-indigo-300"
                    )}
                    onClick={() => toggleSkill(skill)}
                  >{skill}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm card-shadow bg-[var(--card)]">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2"><LinkIcon className="w-5 h-5" /> Portfolio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {portfolioLinks.map((link, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input value={link} onChange={e => { const n = [...portfolioLinks]; n[i] = e.target.value; setPortfolioLinks(n) }} placeholder="https://..." className="flex-1" />
                  {portfolioLinks.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => setPortfolioLinks(p => p.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600 hover:bg-red-50 shrink-0">
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => setPortfolioLinks(p => [...p, ""])} className="font-bold border-dashed border-2 text-xs">
                <Plus className="w-3 h-3 mr-1" /> Add Link
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
