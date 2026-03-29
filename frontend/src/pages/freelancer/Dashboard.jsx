import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { Briefcase, Clock, CheckCircle2, CircleDollarSign, ArrowUpRight, Plus, ExternalLink, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { freelancerApi } from "../../services/api"

export default function FreelancerDashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState([])
  const [earnings, setEarnings] = useState(null)

  useEffect(() => {
    Promise.all([
      freelancerApi.getProjects(),
      freelancerApi.getEarnings()
    ]).then(([projectsRes, earningsRes]) => {
      setProjects(projectsRes.data || [])
      setEarnings(earningsRes.data || null)
    }).catch(err => console.error("Error fetching dashboard data:", err))
      .finally(() => setLoading(false))
  }, [])

  const stats = [
    { label: "Active Projects", value: projects.filter(p => p.status === 'active' || p.status === 'in_progress').length.toString(), icon: Briefcase, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Hours Logged", value: earnings?.hours_logged || "0h", icon: Clock, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Completed Jobs", value: projects.filter(p => p.status === 'completed').length.toString(), icon: CheckCircle2, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Total Earnings", value: `KSh ${earnings?.total_amount?.toLocaleString() || '0'}`, icon: CircleDollarSign, color: "text-orange-600", bg: "bg-orange-50" },
  ]

  return (
    <div className="space-y-8 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Freelancer Dashboard</h1>
          <p className="text-[var(--muted-foreground)]">Overview of your active projects and weekly performance.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="font-semibold">Generate Report</Button>
          <Button className="font-bold shadow-lg shadow-indigo-500/20">
            <Plus className="w-4 h-4 mr-2" />
            New Update
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="border-none shadow-sm card-shadow bg-[var(--card)]">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2 rounded-xl ${stat.bg} ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <Badge variant="success" className="bg-emerald-50 text-emerald-700 border-none font-bold">
                    <ArrowUpRight className="w-3 h-3 mr-1" /> +12%
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--muted-foreground)]">{stat.label}</p>
                  <h3 className="text-2xl font-black mt-1 tracking-tight">{stat.value}</h3>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-sm card-shadow bg-[var(--card)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
            <div>
              <CardTitle className="text-xl font-bold">Recent Projects</CardTitle>
              <CardDescription>Management of your ongoing work streams.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-[var(--primary)] font-bold">View All</Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent px-6">
                  <TableHead className="pl-6">Project Name</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right pr-6">Budget</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.slice(0, 5).map((project) => (
                  <TableRow
                    key={project.id}
                    className="hover:bg-slate-50/50 cursor-pointer group"
                    onClick={() => navigate(`/freelancer/projects/${project.id}`)}
                  >
                    <TableCell className="pl-6 font-semibold group-hover:text-[var(--primary)] transition-colors">
                      {project.title}
                    </TableCell>
                    <TableCell className="text-[var(--muted-foreground)] font-medium">{project.clientName || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge
                        variant={(project.status === "active" || project.status === "in_progress") ? "success" : "secondary"}
                        className="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                      >
                        {project.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6 font-bold">KSh {project.budgetMax?.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm card-shadow bg-[var(--card)] overflow-hidden">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Skills Progress</CardTitle>
            <CardDescription>Track your technical growth.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {[
              { name: "React / Next.js", progress: 92 },
              { name: "PostgreSQL", progress: 75 },
              { name: "UI Design", progress: 88 },
              { name: "Docker", progress: 60 }
            ].map(skill => (
              <div key={skill.name} className="space-y-2">
                <div className="flex justify-between text-sm font-bold">
                  <span>{skill.name}</span>
                  <span className="text-[var(--primary)]">{skill.progress}%</span>
                </div>
                <div className="h-2 w-full bg-[var(--muted)] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${skill.progress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-[var(--primary)] rounded-full"
                  />
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full mt-4 font-bold border-dashed border-2 hover:bg-slate-50">
              Explore New Courses
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
