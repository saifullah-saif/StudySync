"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Header from "@/components/header"
import { chatAPI } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Send, MessageCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { socketManager } from "@/lib/socket"

interface Message {
  id: number
  content: string
  sender_id: number
  receiver_id: number
  timestamp: string
  is_read: boolean
  sender: {
    id: number
    name: string
    profile_picture_url?: string
  }
  receiver: {
    id: number
    name: string
    profile_picture_url?: string
  }
}

interface ChatUser {
  id: number
  name: string
  profile_picture_url?: string
  department?: string
  semester?: number
}

export default function ChatPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  const [chatUser, setChatUser] = useState<ChatUser | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Get chat user info from URL params
  const userId = searchParams.get('userId')
  const userName = searchParams.get('userName')
  const userDepartment = searchParams.get('userDepartment')
  const userSemester = searchParams.get('userSemester')
  const userProfilePicture = searchParams.get('userProfilePicture')

  useEffect(() => {
    if (!userId || !userName || !user) {
      router.push('/buddies')
      return
    }

    // Set chat user info
    setChatUser({
      id: parseInt(userId),
      name: userName,
      profile_picture_url: userProfilePicture || undefined,
      department: userDepartment || undefined,
      semester: userSemester ? parseInt(userSemester) : undefined,
    })

    // Initialize Socket.IO connection
    const socket = socketManager.connect(user.id)

    // Listen for new messages
    socket.on('new_message', (data: any) => {
      if (data.sender_id === parseInt(userId)) {
        setMessages(prev => {
          // Check if message already exists to prevent duplicates
          const exists = prev.find(msg => msg.id === data.message.id)
          if (!exists) {
            return [...prev, data.message]
          }
          return prev
        })
        scrollToBottom()
        // Mark message as read since user is actively viewing chat
        markAsRead()
      }
    })

    // Remove the message_sent listener since we handle optimistic updates differently
    // socket.on('message_sent', (data: any) => { ... })

    // Listen for read status updates
    socket.on('messages_read', (data: any) => {
      if (data.reader_id === parseInt(userId)) {
        setMessages(prev => prev.map(msg => 
          msg.sender_id === user.id ? { ...msg, is_read: true } : msg
        ))
      }
    })

    // Load chat history
    loadChatHistory()

    return () => {
      socketManager.disconnect()
    }
  }, [userId, userName, user, router])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadChatHistory = async () => {
    try {
      setLoading(true)
      setError("")
      const response = await chatAPI.getChatHistory(userId!)
      
      if (response.success) {
        setMessages(response.data.messages)
      } else {
        setError("Failed to load chat history")
      }
    } catch (err: any) {
      console.error("Error loading chat history:", err)
      setError("Failed to load chat history. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newMessage.trim() || sending || !user) return

    const messageContent = newMessage.trim()
    const tempId = Date.now() // Temporary ID for optimistic message
    setNewMessage("")
    setSending(true)

    // Add optimistic message with temporary ID
    const optimisticMessage: Message = {
      id: tempId,
      content: messageContent,
      sender_id: user.id,
      receiver_id: parseInt(userId!),
      timestamp: new Date().toISOString(),
      is_read: false,
      sender: {
        id: user.id,
        name: user.name,
        profile_picture_url: user.profile_picture_url || undefined,
      },
      receiver: chatUser!,
    }
    
    setMessages(prev => [...prev, optimisticMessage])
    scrollToBottom()

    try {
      const response = await chatAPI.sendMessage(userId!, messageContent)
      
      if (response.success) {
        // Replace optimistic message with real message from server
        setMessages(prev => prev.map(msg => 
          msg.id === tempId ? response.data.message : msg
        ))
      } else {
        // Remove optimistic message on failure
        setMessages(prev => prev.filter(msg => msg.id !== tempId))
        setError("Failed to send message")
        setNewMessage(messageContent) // Restore message on failure
      }
    } catch (err: any) {
      console.error("Error sending message:", err)
      // Remove optimistic message on failure
      setMessages(prev => prev.filter(msg => msg.id !== tempId))
      setError("Failed to send message. Please try again.")
      setNewMessage(messageContent) // Restore message on failure
    } finally {
      setSending(false)
    }
  }

  const markAsRead = async () => {
    try {
      await chatAPI.markAsRead(userId!)
    } catch (err) {
      console.error("Error marking messages as read:", err)
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    }
  }

  if (!user || !chatUser) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Chat Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/buddies')}
              className="group flex items-center space-x-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 hover:shadow-sm"
            >
              <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
              <span>Back to Buddies</span>
            </Button>
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarImage src={chatUser.profile_picture_url || "/placeholder.svg"} />
                <AvatarFallback>
                  {chatUser.name.split(" ").map((n) => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl font-semibold">{chatUser.name}</h1>
                {chatUser.department && (
                  <p className="text-sm text-gray-600">
                    {chatUser.department}
                    {chatUser.semester && ` • Semester ${chatUser.semester}`}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Chat Container */}
        <Card className="h-[600px] flex flex-col">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center space-x-2">
              <MessageCircle className="w-5 h-5" />
              <span>Chat with {chatUser.name}</span>
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading messages...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <p className="text-red-600 mb-2">{error}</p>
                    <Button 
                      onClick={loadChatHistory} 
                      size="sm"
                      className="group bg-red-600 hover:bg-red-700 transition-all duration-200 hover:shadow-sm"
                    >
                      Try Again
                    </Button>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No messages yet</p>
                    <p className="text-gray-400 text-sm">Start the conversation!</p>
                  </div>
                </div>
              ) : (
                messages.map((message, index) => {
                  const isCurrentUser = message.sender_id === user.id
                  // Use a combination of id and index to ensure unique keys
                  const messageKey = `${message.id}-${index}`
                  return (
                    <div
                      key={messageKey}
                      className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${isCurrentUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={message.sender.profile_picture_url || "/placeholder.svg"} />
                          <AvatarFallback className="text-xs">
                            {message.sender.name.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className={`rounded-lg px-3 py-2 ${
                            isCurrentUser
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-900'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <div className={`flex items-center justify-between mt-1 ${isCurrentUser ? 'text-blue-100' : 'text-gray-500'}`}>
                            <span className="text-xs">{formatTime(message.timestamp)}</span>
                            {isCurrentUser && (
                              <span className="text-xs ml-2">
                                {message.is_read ? '✓✓' : '✓'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="border-t p-4">
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  disabled={sending}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="group bg-blue-600 hover:bg-blue-700 transition-all duration-200 hover:shadow-sm"
                >
                  {sending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Send className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  )}
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
