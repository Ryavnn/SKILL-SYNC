import React, { useState } from "react"
import { motion } from "framer-motion"
import { Link, useNavigate } from "react-router-dom"
import { Send, Plus, X, Loader2, FileText } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Badge } from "../../components/ui/badge"
import { clientApi } from "../../services/api"
import { cn } from "../../utils/cn"

const SKILL_OPTIONS = ["React", "Node.js", "Python", "TypeScript", "PostgreSQL", "AWS", "Docker", "Figma", "UI Design", "Go", "GraphQL", "Next.js"]

export default function PostProject() {
  const [form, setForm] = useState({ title: "", description: "", budgetMin: "", budgetMax: "", timeline: "", })
  const [selectedSkills, setSelectedSkills] = useState([])
  const [submitting, setSubmitting] = useState(false)

  const navigate = useNavigate()
  const toggleSkill = (s) => setSelectedSkills(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload = {
        title: form.title,
        description: form.description,
        budget_min: parseFloat(form.budgetMin),
        budget_max: parseFloat(form.budgetMax),
        timeline: form.timeline,
        skills: selectedSkills
      }
      await clientApi.postProject(payload)
      navigate('/client/dashboard')
    } catch (err) {
      console.error("Error posting project:", err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-8 animate-in max-w-3xl">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Post a New Project</h1>
        <p className="text-[var(--muted-foreground)]">Describe your needs — our AI will match you with the best talent.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-none shadow-sm card-shadow bg-[var(--card)]">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2"><FileText className="w-5 h-5" /> Project Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Project Title</Label>
              <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. E-commerce Platform Redesign" required />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <textarea
                value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
                rows={6}
                maxLength={2000}
                placeholder="Describe your project scope, deliverables, and any specific requirements..."
                className="w-full rounded-xl border border-[var(--input)] bg-transparent px-4 py-3 text-sm placeholder:text-[var(--muted-foreground)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--ring)] resize-none"
                required
              />
              <p className="text-[10px] text-[var(--muted-foreground)] text-right">{form.description.length}/2000</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm card-shadow bg-[var(--card)]">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Budget & Timeline</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>Min Budget (KSh)</Label>
              <Input type="number" value={form.budgetMin} onChange={e => setForm({...form, budgetMin: e.target.value})} placeholder="1,000" required />
            </div>
            <div className="space-y-2">
              <Label>Max Budget (KSh)</Label>
              <Input type="number" value={form.budgetMax} onChange={e => setForm({...form, budgetMax: e.target.value})} placeholder="5,000" required />
            </div>
            <div className="space-y-2">
              <Label>Timeline</Label>
              <Input type="date" value={form.timeline} onChange={e => setForm({...form, timeline: e.target.value})} required />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm card-shadow bg-[var(--card)]">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Required Skills</CardTitle>
            <CardDescription>Select the skills needed for this project.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {SKILL_OPTIONS.map(s => (
                <Badge key={s} variant={selectedSkills.includes(s) ? "default" : "outline"} className={cn("cursor-pointer transition-all py-1.5 px-3 text-xs font-bold", selectedSkills.includes(s) ? "bg-indigo-600 hover:bg-indigo-700" : "hover:border-indigo-300")} onClick={() => toggleSkill(s)}>
                  {s}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" className="font-bold">Save as Draft</Button>
          <Button type="submit" className="font-bold h-11 px-8 shadow-lg shadow-indigo-500/20" disabled={submitting}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
            Submit & Find Matches
          </Button>
        </div>
      </form>
    </div>
  )
}
