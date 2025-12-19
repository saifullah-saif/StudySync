import Pusher from 'pusher-js'

class PusherManager {
  private pusher: Pusher | null = null
  private userId: number | null = null
  private channel: any = null

  connect(userId: number) {
    if (this.pusher && this.userId === userId && this.channel) {
      return this.channel
    }

    this.disconnect()
    this.userId = userId

    // Initialize Pusher client
    this.pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY || '', {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || '',
    })

    // Subscribe to user's private channel
    this.channel = this.pusher.subscribe(`user_${userId}`)

    this.channel.bind('pusher:subscription_succeeded', () => {
      console.log('Pusher subscribed to channel:', `user_${userId}`)
    })

    this.channel.bind('pusher:subscription_error', (error: any) => {
      console.error('Pusher subscription error:', error)
    })

    return this.channel
  }

  disconnect() {
    if (this.pusher && this.userId) {
      this.pusher.unsubscribe(`user_${this.userId}`)
      this.pusher.disconnect()
      this.pusher = null
      this.channel = null
      this.userId = null
    }
  }

  getChannel() {
    return this.channel
  }

  isConnected() {
    return this.channel !== null
  }
}

export const pusherManager = new PusherManager()
export default pusherManager
