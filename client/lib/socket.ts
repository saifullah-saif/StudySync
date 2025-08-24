import { io, Socket } from 'socket.io-client'

class SocketManager {
  private socket: Socket | null = null
  private userId: number | null = null

  connect(userId: number) {
    if (this.socket?.connected && this.userId === userId) {
      return this.socket
    }

    this.disconnect()
    this.userId = userId

    this.socket = io(process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000', {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    })

    this.socket.emit('join_user_room', userId)

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id)
    })

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected')
    })

    return this.socket
  }

  disconnect() {
    if (this.socket) {
      if (this.userId) {
        this.socket.emit('leave_user_room', this.userId)
      }
      this.socket.disconnect()
      this.socket = null
      this.userId = null
    }
  }

  getSocket() {
    return this.socket
  }

  isConnected() {
    return this.socket?.connected || false
  }
}

export const socketManager = new SocketManager()
