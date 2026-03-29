import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Camera, Plus, X, Save, Link as LinkIcon, Briefcase, GraduationCap, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Badge } from "../../components/ui/badge"
import { cn } from "../../utils/cn"
import { freelancerApi, uploadApi } from "../../services/api"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../hooks/useAuth"

const AVAILABLE_SKILLS = [
  "React", "Node.js", "Python", "TypeScript", "PostgreSQL", "MongoDB",
  "AWS", "Docker", "Figma", "UI Design", "Go", "Rust", "GraphQL",
  "Next.js", "TailwindCSS", "Flutter", "Swift", "Kotlin", "DevOps", "CI/CD"
]

const EXPERIENCE_LEVELS = [
  { value: "junior", label: "Junior", desc: "0–2 years" },
  { value: "mid", label: "Mid-Level", desc: "3–5 years" },
  { value: "senior", label: "Senior", desc: "6–9 years" },
  { value: "expert", label: "Expert", desc: "10+ years" },
]

export default function CreateProfile() {
  const navigate = useNavigate()
  const [photo, setPhoto] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [title, setTitle] = useState("")
  const [bio, setBio] = useState("")
  const [location, setLocation] = useState("")
  const [hourlyRate, setHourlyRate] = useState("")
  const [selectedSkills, setSelectedSkills] = useState([])
  const [experience, setExperience] = useState("")
  const [portfolioLinks, setPortfolioLinks] = useState([""])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const { user } = useAuth()

  React.useEffect(() => {
    if (user?.id) {
       freelancerApi.getProfile(user.id)
         .then(() => navigate("/freelancer/dashboard"))
         .catch(() => {}) // Profile NOT found is EXPECTED here
    }
  }, [user])

  const toggleSkill = (skill) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    )
  }

  const addPortfolioLink = () => setPortfolioLinks(prev => [...prev, ""])
  const removePortfolioLink = (i) => setPortfolioLinks(prev => prev.filter((_, idx) => idx !== i))
  const updatePortfolioLink = (i, val) => setPortfolioLinks(prev => prev.map((link, idx) => idx === i ? val : link))

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhoto(URL.createObjectURL(file))
      setSelectedFile(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (selectedSkills.length < 1) return setError("Please select at least one skill.")
    if (!experience) return setError("Please select your experience level.")
    
    setSaving(true)
    setError(null)
    try {
      // 1. Upload Avatar if selected
      if (selectedFile) {
        try {
          await uploadApi.uploadAvatar(selectedFile)
        } catch (uploadErr) {
          console.error("Avatar upload failed:", uploadErr)
          // Continue profile creation even if avatar fails
        }
      }

      // 2. Create Profile
      const sanitizedLinks = portfolioLinks
        .filter(l => l.trim() !== "")
        .map(l => (l.startsWith("http://") || l.startsWith("https://")) ? l : `https://${l}`)

      await freelancerApi.createProfile({
        title,
        bio,
        skills: selectedSkills,
        experience: experience,
        portfolioLinks: sanitizedLinks,
        location,
        hourlyRate: parseFloat(hourlyRate) || 0
      })
      navigate("/freelancer/dashboard")
    } catch (err) {
      setError(err.message || "Failed to create profile. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8 animate-in">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Create Your Profile</h1>
        <p className="text-[var(--muted-foreground)]">Set up your professional presence on SkillSync.</p>
        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold animate-in zoom-in-95">
            {error}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column — Photo & Experience */}
        <div className="space-y-6">
          <Card className="border-none shadow-sm card-shadow bg-[var(--card)]">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Profile Photo</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <label className="cursor-pointer group">
                <div className={cn(
                  "w-32 h-32 rounded-full border-2 border-dashed flex items-center justify-center overflow-hidden transition-all",
                  photo ? "border-transparent" : "border-[var(--border)] hover:border-[var(--primary)]"
                )}>
                  {photo ? (
                    <img src={photo} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-8 h-8 text-[var(--muted-foreground)] group-hover:text-[var(--primary)] transition-colors" />
                  )}
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </label>
              <p className="text-xs text-[var(--muted-foreground)] text-center">Click to upload. JPG, PNG up to 5MB.</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm card-shadow bg-[var(--card)]">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <GraduationCap className="w-5 h-5" /> Experience Level
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {EXPERIENCE_LEVELS.map(level => (
                <button
                  type="button"
                  key={level.value}
                  onClick={() => setExperience(level.value)}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all text-left",
                    experience === level.value
                      ? "border-[var(--primary)] bg-indigo-50/50"
                      : "border-transparent hover:bg-[var(--muted)]/50"
                  )}
                >
                  <span className="font-bold text-sm">{level.label}</span>
                  <span className="text-xs text-[var(--muted-foreground)]">{level.desc}</span>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column — Bio, Skills, Portfolio */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm card-shadow bg-[var(--card)]">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Professional Overview</CardTitle>
              <CardDescription>Give clients a quick summary of your role and details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Professional Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Senior Full-Stack Developer"
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Professional Bio</Label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={5}
                  maxLength={500}
                  placeholder="I'm a senior full-stack developer with 6+ years of experience..."
                  className="w-full rounded-xl border border-[var(--input)] bg-transparent px-4 py-3 text-sm placeholder:text-[var(--muted-foreground)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--ring)] resize-none"
                />
                <p className="text-[10px] text-[var(--muted-foreground)] text-right mt-1">{bio.length}/500</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. San Francisco, US"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rate">Hourly Rate (KSh)</Label>
                  <Input
                    id="rate"
                    type="number"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    placeholder="0.00"
                    className="rounded-xl"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm card-shadow bg-[var(--card)]">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Briefcase className="w-5 h-5" /> Skills
              </CardTitle>
              <CardDescription>Select your areas of expertise. Choose at least 3.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_SKILLS.map(skill => (
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
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
              <p className="text-[10px] text-[var(--muted-foreground)] mt-3">{selectedSkills.length} selected</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm card-shadow bg-[var(--card)]">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <LinkIcon className="w-5 h-5" /> Portfolio Links
              </CardTitle>
              <CardDescription>Share your best work — GitHub, Dribbble, personal site, etc.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {portfolioLinks.map((link, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={link}
                    onChange={(e) => updatePortfolioLink(i, e.target.value)}
                    placeholder="https://github.com/yourprofile"
                    className="flex-1"
                  />
                  {portfolioLinks.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => removePortfolioLink(i)} className="text-red-400 hover:text-red-600 hover:bg-red-50 shrink-0">
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addPortfolioLink} className="font-bold border-dashed border-2 text-xs">
                <Plus className="w-3 h-3 mr-1" /> Add Another Link
              </Button>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" className="font-bold">Cancel</Button>
            <Button type="submit" className="font-bold h-11 px-8 shadow-lg shadow-indigo-500/20" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save Profile
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
