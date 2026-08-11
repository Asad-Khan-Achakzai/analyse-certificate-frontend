'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Link from '@components/Link'
import Logo from '@components/layout/shared/Logo'
import CustomTextField from '@core/components/mui/TextField'
import { useAuth } from '@/contexts/AuthContext'

const Register = () => {
  const { register } = useAuth()
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    companyName: '',
    country: '',
    address: '',
    phone: '',
    fax: '',
    addressAr: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const set = key => e => setForm(prev => ({ ...prev, [key]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await register(form)
      router.push('/dashboard')
    } catch (err) {
      setError(err.message || 'Registration failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className='flex flex-col justify-center items-center min-bs-[100dvh] p-6'>
      <div className='mb-6'>
        <Logo />
      </div>
      <div className='bg-backgroundPaper rounded-lg p-6 shadow-sm is-full max-is-[720px] flex flex-col gap-4'>
        <Typography variant='h4'>Register your company</Typography>
        <Typography color='text.secondary'>Create an admin account to start issuing certificates</Typography>
        {error ? <Alert severity='error'>{error}</Alert> : null}
        <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 6 }}>
              <CustomTextField fullWidth label='Your name' value={form.name} onChange={set('name')} required />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <CustomTextField fullWidth label='Email' type='email' value={form.email} onChange={set('email')} required />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <CustomTextField
                fullWidth
                label='Password'
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={set('password')}
                required
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position='end'>
                        <IconButton edge='end' onClick={() => setShowPassword(s => !s)}>
                          <i className={showPassword ? 'tabler-eye-off' : 'tabler-eye'} />
                        </IconButton>
                      </InputAdornment>
                    )
                  }
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <CustomTextField
                fullWidth
                label='Company name'
                value={form.companyName}
                onChange={set('companyName')}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <CustomTextField fullWidth label='Country' value={form.country} onChange={set('country')} required />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <CustomTextField fullWidth label='Phone' value={form.phone} onChange={set('phone')} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <CustomTextField
                fullWidth
                label='Address'
                multiline
                minRows={2}
                value={form.address}
                onChange={set('address')}
                required
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <CustomTextField
                fullWidth
                label='Address (Arabic, optional)'
                multiline
                minRows={2}
                value={form.addressAr}
                onChange={set('addressAr')}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <CustomTextField fullWidth label='Fax' value={form.fax} onChange={set('fax')} />
            </Grid>
          </Grid>
          <Button type='submit' variant='contained' disabled={submitting}>
            {submitting ? 'Creating...' : 'Create account'}
          </Button>
          <Typography>
            Already have an account?{' '}
            <Typography component={Link} href='/login' color='primary.main' display='inline'>
              Login
            </Typography>
          </Typography>
        </form>
      </div>
    </div>
  )
}

export default Register
