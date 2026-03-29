import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Users, Search, MoreHorizontal, Shield, Ban, CheckCircle2, Mail, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Badge } from "../../components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar"
import { userApi, adminApi } from "../../services/api"

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await adminApi.getUsers()
      setUsers(res.users || [])
    } catch (err) {
      console.error("Error fetching users:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleToggleStatus = async (user) => {
    try {
      await adminApi.suspendUser(user.id, { is_active: !user.is_active })
      fetchUsers()
    } catch (err) {
      console.error("Error toggling user status:", err)
    }
  }

  const filtered = (users || []).filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-8 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">User Management</h1>
          <p className="text-[var(--muted-foreground)]">Manage platform accounts and permissions.</p>
        </div>
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..." className="pl-10 w-full sm:w-64 bg-[var(--card)]" />
        </div>
      </div>

      <Card className="border-none shadow-sm card-shadow bg-[var(--card)]">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(u => (
                <TableRow key={u.id}>
                  <TableCell className="pl-6">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9"><AvatarFallback className="text-[10px] font-bold bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">{u.name?.split(' ').map(n => n[0]).join('') || '?'}</AvatarFallback></Avatar>
                      <div>
                        <span className="font-bold text-sm block">{u.name}</span>
                        <span className="text-xs text-[var(--muted-foreground)]">{u.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px] font-bold">{u.role}</Badge></TableCell>
                  <TableCell><Badge variant={u.is_active ? "success" : "destructive"} className="text-[10px] font-bold uppercase">{u.is_active ? "Active" : "Suspended"}</Badge></TableCell>
                  <TableCell className="text-sm text-[var(--muted-foreground)]">{new Date(u.created_at).toLocaleDateString()}</TableCell>
                   <TableCell className="text-right pr-6">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" title="Email"><Mail className="w-4 h-4" /></Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleToggleStatus(u)}
                        className={u.is_active ? "text-red-500 hover:text-red-600 hover:bg-red-50" : "text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50"} 
                        title={u.is_active ? "Suspend" : "Activate"}
                      >
                        {u.is_active ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
