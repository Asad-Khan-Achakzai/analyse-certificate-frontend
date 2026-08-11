'use client'

import CircularProgress from '@mui/material/CircularProgress'
import { useAuth } from '@/contexts/AuthContext'

export default function AuthGate({ children }) {
  const { loading, user } = useAuth()

  if (loading) {
    return (
      <div className='flex justify-center items-center min-bs-[50vh]'>
        <CircularProgress />
      </div>
    )
  }

  if (!user) return null

  return children
}
