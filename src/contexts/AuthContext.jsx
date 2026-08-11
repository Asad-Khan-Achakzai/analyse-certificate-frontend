'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { api, clearTokens, getAccessToken, getRefreshToken, setTokens } from '@/lib/api'

const AuthContext = createContext(null)

const PUBLIC_PATHS = ['/login', '/register']

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const loadMe = useCallback(async () => {
    if (!getAccessToken()) {
      setUser(null)
      setCompany(null)
      setLoading(false)
      return null
    }

    try {
      const res = await api.me()
      setUser(res.data.user)
      setCompany(res.data.company)
      return res.data
    } catch {
      clearTokens()
      setUser(null)
      setCompany(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMe()
  }, [loadMe])

  useEffect(() => {
    if (loading) return
    const isPublic = PUBLIC_PATHS.some(p => pathname?.startsWith(p)) || pathname?.startsWith('/verify')
    if (!user && !isPublic) {
      router.replace('/login')
    }
    if (user && (pathname === '/login' || pathname === '/register')) {
      router.replace('/dashboard')
    }
  }, [loading, user, pathname, router])

  const login = async (email, password) => {
    const res = await api.login({ email, password })
    setTokens({ accessToken: res.data.accessToken, refreshToken: res.data.refreshToken })
    setUser(res.data.user)
    setCompany(res.data.company)
    return res.data
  }

  const register = async payload => {
    const res = await api.register(payload)
    setTokens({ accessToken: res.data.accessToken, refreshToken: res.data.refreshToken })
    setUser(res.data.user)
    setCompany(res.data.company)
    return res.data
  }

  const logout = async () => {
    try {
      await api.logout({ refreshToken: getRefreshToken() })
    } catch {
      // ignore
    }
    clearTokens()
    setUser(null)
    setCompany(null)
    router.replace('/login')
  }

  const refreshCompany = async () => {
    const res = await api.getCompany()
    setCompany(res.data)
    return res.data
  }

  const value = useMemo(
    () => ({
      user,
      company,
      loading,
      login,
      register,
      logout,
      refreshCompany,
      reload: loadMe
    }),
    [user, company, loading, loadMe]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
