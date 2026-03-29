import React, { useState, useEffect, useRef } from "react"
import { useLocation } from "react-router-dom"
import { Search, Send, Paperclip, Loader2 } from "lucide-react"
import { Card } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Avatar, AvatarFallback } from "../../components/ui/avatar"
import { cn } from "../../utils/cn"
import { messagingApi } from "../../services/api"
import { useAuth } from "../../hooks/useAuth"

export default function FreelancerMessages() {
  const { user } = useAuth()
  const location = useLocation()
  const targetThreadId = location.state?.threadId

  const [conversations, setConversations] = useState([])
  const [activeConvo, setActiveConvo] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMsg, setNewMsg] = useState("")
  const [loadingConvos, setLoadingConvos] = useState(true)
  const [sending, setSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  
  const messagesEndRef = useRef(null)

  // Fetch threads/inbox
  const fetchConversations = async () => {
    try {
      const res = await messagingApi.getConversations()
      const data = res.data || []
      setConversations(data)
      
      // If we have a target thread from navigation state, select it
      if (targetThreadId && !activeConvo) {
        const target = data.find(c => c.id === targetThreadId)
        if (target) {
          setActiveConvo(target)
          return
        }
      }

      if (data.length > 0 && !activeConvo) {
        setActiveConvo(data[0])
      }
    } catch (err) {
      console.error("Failed to fetch conversations", err)
    } finally {
      setLoadingConvos(false)
    }
  }

  // Fetch messages for a specific thread
  const fetchMessages = async (threadId) => {
    try {
      const res = await messagingApi.getMessages(threadId)
      setMessages(res.data || []) 
    } catch (err) {
      console.error("Failed to fetch messages", err)
    }
  }

  useEffect(() => {
    fetchConversations()
    // Poll conversations every 10 seconds to update 'last message' in the list
    const convoInterval = setInterval(fetchConversations, 10000)
    return () => clearInterval(convoInterval)
  }, [])

  useEffect(() => {
    if (activeConvo) {
      fetchMessages(activeConvo.id)
      // Poll active messages every 3 seconds
      const msgInterval = setInterval(() => {
        fetchMessages(activeConvo.id)
      }, 3000)
      return () => clearInterval(msgInterval)
    }
  }, [activeConvo?.id])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = async () => {
    if (!newMsg.trim() || !activeConvo) return
    
    setSending(true)
    try {
      const res = await messagingApi.sendMessage({
        thread_id: activeConvo.id,
        content: newMsg
      })
      // Optimistically append message
      setMessages(prev => [...prev, res.data])
      setNewMsg("")
      // Update convo list to show latest message snippet
      fetchConversations()
    } catch (err) {
      console.error("Failed to send message", err)
    } finally {
      setSending(false)
    }
  }

  const getOtherParticipant = (thread) => {
    if (!user || !thread) return null
    return thread.participant_1?.id === user.id ? thread.participant_2 : thread.participant_1
  }

  const getInitials = (name) => {
    if (!name) return "U"
    return name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2)
  }

  const formatTime = (dateString) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const activeOtherPerson = getOtherParticipant(activeConvo)
  
  const filteredConvos = conversations.filter(c => {
    const other = getOtherParticipant(c)
    if (!other) return false
    return other.name.toLowerCase().includes(searchQuery.toLowerCase())
  })

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Messages</h1>
        <p className="text-[var(--muted-foreground)]">Project conversations with your clients.</p>
      </div>

      <Card className="border-none shadow-sm card-shadow bg-[var(--card)] overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 min-h-[500px] max-h-[70vh]">
          {/* Conversation List */}
          <div className="border-r border-[var(--border)] flex flex-col h-full">
            <div className="p-3 border-b border-[var(--border)] shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                <Input 
                  placeholder="Search conversations..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-[var(--muted)]/50 border-none h-9" 
                />
              </div>
            </div>
            
            <div className="divide-y divide-[var(--border)] overflow-y-auto flex-1">
              {loadingConvos ? (
                <div className="flex justify-center items-center h-32">
                  <Loader2 className="w-6 h-6 animate-spin text-[var(--muted-foreground)]" />
                </div>
              ) : filteredConvos.length === 0 ? (
                <div className="p-8 text-center text-sm text-[var(--muted-foreground)]">
                  No conversations found.
                </div>
              ) : (
                filteredConvos.map(c => {
                  const other = getOtherParticipant(c)
                  const initials = getInitials(other?.name)
                  const lastMsgText = c.last_message?.content || "No messages yet"
                  const lastMsgTime = formatTime(c.last_message?.created_at)
                  
                  return (
                    <button
                      key={c.id}
                      onClick={() => setActiveConvo(c)}
                      className={cn(
                        "w-full flex items-center gap-3 p-4 text-left hover:bg-[var(--muted)]/50 transition-colors",
                        activeConvo?.id === c.id && "bg-[var(--muted)]/70 relative before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-indigo-500"
                      )}
                    >
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarFallback className="text-xs font-bold">{initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm truncate pr-2">{other?.name || "Unknown"}</span>
                          <span className="text-[10px] text-[var(--muted-foreground)] shrink-0">{lastMsgTime}</span>
                        </div>
                        <p className="text-xs text-[var(--muted-foreground)] truncate">{lastMsgText}</p>
                      </div>
                      {c.unread_count > 0 && (
                        <span className="w-5 h-5 rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                          {c.unread_count}
                        </span>
                      )}
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="md:col-span-2 flex flex-col h-full bg-[var(--muted)]/10">
            {activeConvo ? (
              <>
                <div className="p-4 border-b border-[var(--border)] flex items-center gap-3 bg-[var(--card)] shrink-0 shadow-sm z-10">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-[10px] font-bold bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
                      {getInitials(activeOtherPerson?.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-bold text-sm">{activeOtherPerson?.name || "Unknown User"}</span>
                </div>
                
                <div className="flex-1 p-4 overflow-y-auto space-y-4 relative">
                  {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-sm text-[var(--muted-foreground)]">
                      Start the conversation!
                    </div>
                  ) : (
                    messages.map(m => {
                      const isMe = user?.id === m.sender_id
                      return (
                        <div key={m.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                          <div className={cn(
                            "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                            isMe 
                              ? "bg-indigo-500 text-white rounded-br-sm" 
                              : "bg-[var(--card)] border border-[var(--border)] rounded-bl-sm"
                          )}>
                            <p className="whitespace-pre-wrap">{m.content}</p>
                            <p className={cn(
                              "text-[10px] mt-1.5 text-right", 
                              isMe ? "text-indigo-200" : "text-[var(--muted-foreground)]"
                            )}>
                              {formatTime(m.created_at)}
                            </p>
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
                
                <div className="p-4 border-t border-[var(--border)] flex items-center gap-3 bg-[var(--card)] shrink-0">
                  <Button variant="ghost" size="icon" className="shrink-0 text-[var(--muted-foreground)] hover:text-foreground">
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  <Input
                    value={newMsg}
                    onChange={e => setNewMsg(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 border-[var(--border)] focus-visible:ring-indigo-500"
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                    disabled={sending}
                  />
                  <Button 
                    onClick={handleSend}
                    size="icon" 
                    disabled={sending || !newMsg.trim()}
                    className="shrink-0 shadow-lg shadow-indigo-500/20 bg-indigo-600 hover:bg-indigo-700 text-white transition-all disabled:opacity-50"
                  >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-[var(--muted-foreground)]">
                <div className="w-16 h-16 rounded-full bg-[var(--muted)] flex items-center justify-center mb-4">
                  <Send className="w-8 h-8 opacity-50" />
                </div>
                <p>Select a conversation to start messaging</p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}

