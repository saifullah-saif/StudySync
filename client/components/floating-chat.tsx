"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, ArrowLeft, Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/auth-context";
import { buddyAPI, chatAPI } from "@/lib/api";
import { pusherManager } from "@/lib/socket";

interface Connection {
  id: number;
  user_id: number;
  connected_user_id: number;
  request_type: string;
  status: string;
  user_role: string;
  created_at: string;
  accepted_at: string;
  connected_user: {
    id: number;
    name: string;
    email: string;
    profile_picture_url?: string;
    department?: string;
    semester?: number;
  };
}

interface Message {
  id: number;
  content: string;
  sender_id: number;
  receiver_id: number;
  timestamp: string;
  is_read: boolean;
  sender: {
    id: number;
    name: string;
    profile_picture_url?: string;
  };
  receiver: {
    id: number;
    name: string;
    profile_picture_url?: string;
  };
}

export function FloatingChat() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [connectionsLoading, setConnectionsLoading] = useState(false);
  const [activeChatConnection, setActiveChatConnection] =
    useState<Connection | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load connections when modal opens
  useEffect(() => {
    if (chatModalOpen && connections.length === 0) {
      loadConnections();
    }
  }, [chatModalOpen]);

  // Pusher setup for real-time messaging
  useEffect(() => {
    if (!user?.id || !activeChatConnection) return;

    const channelName = `private-chat-${user.id}`;
    const channel = pusherManager.connect(user.id);

    const handleNewMessage = (data: any) => {
      // Only handle incoming messages from the chat partner, not echoes of our own messages
      if (data.sender_id === activeChatConnection.connected_user.id) {
        setMessages((prev) => {
          const message = data.message || data;
          // Check if message already exists to prevent duplicates
          const exists = prev.find(msg => msg.id === message.id);
          if (!exists) {
            return [...prev, message];
          }
          return prev;
        });
        scrollToBottom();
        // Mark message as read since user is actively viewing chat
        markAsRead(data.id || data.message?.id);
      }
    };

    const handleMessagesRead = (data: { messageIds: number[] }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          data.messageIds.includes(msg.id) ? { ...msg, is_read: true } : msg
        )
      );
    };

    channel.bind("new_message", handleNewMessage);
    channel.bind("messages_read", handleMessagesRead);

    return () => {
      channel.unbind("new_message", handleNewMessage);
      channel.unbind("messages_read", handleMessagesRead);
      pusherManager.disconnect();
    };
  }, [user?.id, activeChatConnection]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadConnections = async () => {
    setConnectionsLoading(true);
    try {
      const response = await buddyAPI.getAcceptedConnections();
      if (response.success) {
        setConnections(response.data?.connections || []);
      }
    } catch (error) {
      console.error("Failed to load connections:", error);
    } finally {
      setConnectionsLoading(false);
    }
  };

  const loadChatHistory = async (connectionUserId: number) => {
    setChatLoading(true);
    try {
      const response = await chatAPI.getChatHistory(connectionUserId);
      if (response.success) {
        const messageList = response.data?.messages || response.messages || [];
        setMessages(messageList);
        scrollToBottom();
        const unreadMessages = messageList.filter(
          (msg: Message) => !msg.is_read && msg.sender_id === connectionUserId
        );
        if (unreadMessages.length > 0) {
          unreadMessages.forEach((msg: Message) => markAsRead(msg.id));
        }
      }
    } catch (error) {
      console.error("Failed to load chat history:", error);
      setMessages([]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChatConnection || sending) return;

    const tempId = Date.now();
    const optimisticMessage: Message = {
      id: tempId,
      content: newMessage,
      sender_id: user!.id,
      receiver_id: activeChatConnection.connected_user.id,
      timestamp: new Date().toISOString(),
      is_read: false,
      sender: {
        id: user!.id,
        name: user!.name,
        profile_picture_url: user!.profile_picture_url || undefined,
      },
      receiver: {
        id: activeChatConnection.connected_user.id,
        name: activeChatConnection.connected_user.name,
        profile_picture_url:
          activeChatConnection.connected_user.profile_picture_url,
      },
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    const messageText = newMessage;
    setNewMessage("");
    setSending(true);
    scrollToBottom();

    try {
      const response = await chatAPI.sendMessage(
        activeChatConnection.connected_user.id,
        messageText
      );
      if (response.success) {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === tempId ? response.data.message : msg))
        );
      } else {
        // Remove optimistic message on failure
        setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
        setNewMessage(messageText);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      setNewMessage(messageText);
    } finally {
      setSending(false);
    }
  };

  const markAsRead = async (messageId: number) => {
    try {
      await chatAPI.markAsRead([messageId]);
    } catch (error) {
      console.error("Failed to mark message as read:", error);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleOpenChat = (connection: Connection) => {
    setActiveChatConnection(connection);
    loadChatHistory(connection.connected_user.id);
  };

  const handleBackToConnections = () => {
    setActiveChatConnection(null);
    setMessages([]);
  };

  const handleChatClick = (connection: Connection) => {
    handleOpenChat(connection);
  };

  const handleModalClose = (open: boolean) => {
    setChatModalOpen(open);
    if (!open) {
      // Optionally reset chat state when closing
      setTimeout(() => {
        setActiveChatConnection(null);
        setMessages([]);
      }, 300);
    }
  };

  // Don't render on landing page or if not authenticated
  if (pathname === "/" || !user) {
    return null;
  }

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setChatModalOpen(true)}
        className="fixed bottom-8 right-8 h-16 w-16 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-300 flex items-center justify-center z-50 group"
        aria-label="Open chat"
      >
        <MessageCircle className="h-7 w-7 group-hover:scale-110 transition-transform" />
        {connections.length > 0 && (
          <span className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center border-2 border-white animate-pulse">
            {connections.length}
          </span>
        )}
      </button>

      {/* Chat Modal */}
      <Dialog open={chatModalOpen} onOpenChange={handleModalClose}>
        <DialogContent className="sm:max-w-2xl bg-white border-slate-200 shadow-2xl max-h-[80vh] overflow-hidden flex flex-col">
          {!activeChatConnection ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <MessageCircle className="h-6 w-6 text-blue-600" />
                  Your Connections
                </DialogTitle>
                <DialogDescription className="text-slate-600">
                  Start a conversation with your study buddies
                </DialogDescription>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto px-1 py-4">
                {connectionsLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-slate-500">Loading connections...</p>
                  </div>
                ) : connections.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-slate-300 mb-4">
                      <MessageCircle className="w-16 h-16 mx-auto" />
                    </div>
                    <p className="text-slate-600 text-lg font-medium">
                      No connections yet
                    </p>
                    <p className="text-slate-400 text-sm mt-2">
                      Connect with study buddies to start chatting
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {connections.map((connection) => (
                      <div
                        key={connection.id}
                        className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all duration-200 group cursor-pointer border border-slate-200 hover:border-blue-300"
                        onClick={() => handleChatClick(connection)}
                      >
                        <div className="flex items-center space-x-4 flex-1">
                          <Avatar className="h-12 w-12 ring-2 ring-white shadow-md">
                            <AvatarImage
                              src={
                                connection.connected_user.profile_picture_url ||
                                "/placeholder.svg"
                              }
                            />
                            <AvatarFallback className="text-sm font-medium">
                              {connection.connected_user.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                              {connection.connected_user.name}
                            </h3>
                            <p className="text-sm text-slate-500 truncate">
                              {connection.connected_user.department &&
                              connection.connected_user.semester
                                ? `${connection.connected_user.department} • Semester ${connection.connected_user.semester}`
                                : connection.connected_user.email}
                            </p>
                            <Badge
                              variant="outline"
                              className="text-xs bg-blue-50 border-blue-200 text-blue-700 font-medium mt-1"
                            >
                              {connection.request_type === "peer"
                                ? "Study Buddy"
                                : connection.user_role === "requester"
                                ? "Your Mentor"
                                : "Your Mentee"}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-all duration-300 group-hover:scale-105"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleChatClick(connection);
                          }}
                        >
                          <MessageCircle className="w-4 h-4 mr-1" />
                          Chat
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Chat Interface */}
              <DialogHeader className="border-b border-slate-200 pb-4">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBackToConnections}
                    className="hover:bg-slate-100"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Avatar className="h-10 w-10 ring-2 ring-white shadow-md">
                    <AvatarImage
                      src={
                        activeChatConnection.connected_user
                          .profile_picture_url || "/placeholder.svg"
                      }
                    />
                    <AvatarFallback className="text-sm font-medium">
                      {activeChatConnection.connected_user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <DialogTitle className="text-lg font-bold text-slate-900 truncate">
                      {activeChatConnection.connected_user.name}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-slate-500 truncate">
                      {activeChatConnection.connected_user.department &&
                      activeChatConnection.connected_user.semester
                        ? `${activeChatConnection.connected_user.department} • Semester ${activeChatConnection.connected_user.semester}`
                        : activeChatConnection.connected_user.email}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                {chatLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-slate-500">Loading messages...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-slate-300 mb-4">
                      <MessageCircle className="w-16 h-16 mx-auto" />
                    </div>
                    <p className="text-slate-600 text-lg font-medium">
                      No messages yet
                    </p>
                    <p className="text-slate-400 text-sm mt-2">
                      Start the conversation by sending a message
                    </p>
                  </div>
                ) : (
                  <>
                    {messages.map((message, index) => {
                      const isOwnMessage = message.sender_id === user?.id;
                      // Use a combination of id and index to ensure unique keys
                      const messageKey = `${message.id}-${index}`;
                      return (
                        <div
                          key={messageKey}
                          className={`flex ${
                            isOwnMessage ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                              isOwnMessage
                                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                                : "bg-slate-100 text-slate-900"
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {message.content}
                            </p>
                            <p
                              className={`text-xs mt-1 ${
                                isOwnMessage ? "text-blue-100" : "text-slate-500"
                              }`}
                            >
                              {formatTime(message.timestamp)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Message Input */}
              <div className="border-t border-slate-200 p-4">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    disabled={sending}
                  />
                  <Button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-all duration-300 px-6"
                  >
                    {sending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </form>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
