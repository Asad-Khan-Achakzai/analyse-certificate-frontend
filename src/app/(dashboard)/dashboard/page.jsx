'use client'

import { useEffect, useState } from 'react'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Link from '@components/Link'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'

function StatCard({ title, value, color }) {
  return (
    <Card>
      <CardContent>
        <Typography color='text.secondary' className='mb-2'>
          {title}
        </Typography>
        <Typography variant='h3' color={color || 'text.primary'}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const { user, company } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .getStats()
      .then(res => setStats(res.data))
      .catch(() => setStats({ total: 0, issued: 0, draft: 0, revoked: 0 }))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className='flex justify-center p-10'>
        <CircularProgress />
      </div>
    )
  }

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <div className='flex flex-wrap items-center justify-between gap-4'>
          <div>
            <Typography variant='h4'>Dashboard</Typography>
            <Typography color='text.secondary'>
              Welcome{user?.name ? `, ${user.name}` : ''}
              {company?.name ? ` · ${company.name}` : ''}
            </Typography>
          </div>
          <Button component={Link} href='/certificates/new' variant='contained'>
            New Certificate
          </Button>
        </div>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <StatCard title='Total' value={stats?.total ?? 0} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <StatCard title='Issued' value={stats?.issued ?? 0} color='success.main' />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <StatCard title='Draft' value={stats?.draft ?? 0} color='warning.main' />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <StatCard title='Revoked' value={stats?.revoked ?? 0} color='error.main' />
      </Grid>
    </Grid>
  )
}
