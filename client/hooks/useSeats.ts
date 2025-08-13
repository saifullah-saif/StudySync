import { useState, useEffect } from 'react'

export interface Seat {
  id: number
  seat_number: string
  position_x: number
  position_y: number
  has_computer: boolean
  has_power_outlet: boolean
  is_accessible: boolean
  is_active: boolean
  reservations: Array<{
    id: number
    status: 'reserved' | 'occupied'
    start_time: string
    end_time: string
    user_id: number
  }>
}

export interface SeatReservation {
  id: number
  seat_id: number
  user_id: number
  room_id: number
  start_time: string
  end_time: string
  status: 'reserved' | 'occupied'
  purpose?: string
  seats: Seat
  library_rooms: {
    id: number
    name: string
    room_number: string
  }
}

export function useSeats(roomId: number | null) {
  const [seats, setSeats] = useState<Seat[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSeats = async () => {
    if (!roomId) return

    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`http://localhost:5000/api/seats/room/${roomId}`)
      const data = await response.json()
      
      if (data.success) {
        setSeats(data.data)
      } else {
        setError(data.message || 'Failed to fetch seats')
      }
    } catch (err) {
      setError('Failed to fetch seats')
      console.error('Error fetching seats:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSeats()
  }, [roomId])

  const reserveSeat = async (seatId: number, startTime: Date, endTime: Date, purpose?: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/seats/${seatId}/reserve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          purpose
        })
      })

      const data = await response.json()
      
      if (data.success) {
        // Refresh seats data
        await fetchSeats()
        return data.data
      } else {
        throw new Error(data.message || 'Failed to reserve seat')
      }
    } catch (err) {
      console.error('Error reserving seat:', err)
      throw err
    }
  }

  const cancelReservation = async (reservationId: number) => {
    try {
      const response = await fetch(`http://localhost:5000/api/seats/reservations/${reservationId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      const data = await response.json()
      
      if (data.success) {
        // Refresh seats data
        await fetchSeats()
        return true
      } else {
        throw new Error(data.message || 'Failed to cancel reservation')
      }
    } catch (err) {
      console.error('Error cancelling reservation:', err)
      throw err
    }
  }

  const getUserReservations = async (): Promise<SeatReservation[]> => {
    try {
      const response = await fetch('http://localhost:5000/api/seats/reservations/my', {
        credentials: 'include'
      })

      const data = await response.json()
      
      if (data.success) {
        return data.data
      } else {
        throw new Error(data.message || 'Failed to fetch reservations')
      }
    } catch (err) {
      console.error('Error fetching user reservations:', err)
      throw err
    }
  }

  return {
    seats,
    loading,
    error,
    refetch: fetchSeats,
    reserveSeat,
    cancelReservation,
    getUserReservations
  }
}
