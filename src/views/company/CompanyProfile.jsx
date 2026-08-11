'use client'

import { useEffect, useState } from 'react'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import Alert from '@mui/material/Alert'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import CustomTextField from '@core/components/mui/TextField'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'

export default function CompanyProfile() {
  const { refreshCompany } = useAuth()
  const [form, setForm] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState('')

  useEffect(() => {
    api
      .getCompany()
      .then(res => setForm(res.data))
      .catch(err => setError(err.message))
  }, [])

  if (!form) {
    return (
      <div className='flex justify-center p-10'>
        {error ? <Alert severity='error'>{error}</Alert> : <CircularProgress />}
      </div>
    )
  }

  const set = key => e => setForm(prev => ({ ...prev, [key]: e.target.value }))

  const save = async e => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')
    try {
      const res = await api.updateCompany({
        name: form.name,
        country: form.country,
        address: form.address,
        addressAr: form.addressAr || null,
        phone: form.phone || null,
        fax: form.fax || null
      })
      setForm(res.data)
      await refreshCompany()
      setMessage('Company profile updated')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const upload = async (kind, file) => {
    if (!file) return
    setError('')
    setMessage('')
    setUploading(kind)
    try {
      const res = kind === 'logo' ? await api.uploadLogo(file) : await api.uploadStamp(file)
      setForm(res.data)
      await refreshCompany()
      setMessage(`${kind === 'logo' ? 'Logo' : 'Stamp'} uploaded successfully`)
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading('')
    }
  }

  return (
    <div className='flex flex-col gap-6'>
      {message ? <Alert severity='success'>{message}</Alert> : null}
      {error ? <Alert severity='error'>{error}</Alert> : null}

      <Card>
        <CardHeader
          title='Company branding'
          subheader='Logo and stamp appear on issued PDF certificates'
        />
        <CardContent>
          <div className='flex flex-wrap gap-8'>
            <div className='flex flex-col gap-3 min-is-[220px]'>
              <Typography variant='h6'>Company logo</Typography>
              <div className='border rounded p-4 flex items-center justify-center min-bs-[120px] bg-[var(--mui-palette-action-hover)]'>
                {form.logoUrl ? (
                  <img src={form.logoUrl} alt='Logo' className='max-bs-[100px] max-is-[200px] object-contain' />
                ) : (
                  <Typography color='text.secondary'>No logo yet</Typography>
                )}
              </div>
              <Button component='label' variant='contained' disabled={uploading === 'logo'}>
                {uploading === 'logo' ? 'Uploading...' : 'Upload logo'}
                <input
                  hidden
                  type='file'
                  accept='image/png,image/jpeg,image/webp,image/gif'
                  onChange={e => upload('logo', e.target.files?.[0])}
                />
              </Button>
              <Typography variant='caption' color='text.secondary'>
                PNG or JPG, max 5MB
              </Typography>
            </div>

            <div className='flex flex-col gap-3 min-is-[220px]'>
              <Typography variant='h6'>QA stamp</Typography>
              <div className='border rounded p-4 flex items-center justify-center min-bs-[120px] bg-[var(--mui-palette-action-hover)]'>
                {form.stampUrl ? (
                  <img src={form.stampUrl} alt='Stamp' className='max-bs-[100px] max-is-[200px] object-contain' />
                ) : (
                  <Typography color='text.secondary'>No stamp yet</Typography>
                )}
              </div>
              <Button component='label' variant='outlined' disabled={uploading === 'stamp'}>
                {uploading === 'stamp' ? 'Uploading...' : 'Upload stamp'}
                <input
                  hidden
                  type='file'
                  accept='image/png,image/jpeg,image/webp,image/gif'
                  onChange={e => upload('stamp', e.target.files?.[0])}
                />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title='Company details' subheader='Shown on certificates and the public verification page' />
        <CardContent>
          <form onSubmit={save} className='flex flex-col gap-4'>
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, md: 6 }}>
                <CustomTextField fullWidth label='Company name' value={form.name || ''} onChange={set('name')} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <CustomTextField fullWidth label='Country' value={form.country || ''} onChange={set('country')} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <CustomTextField fullWidth label='Phone' value={form.phone || ''} onChange={set('phone')} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <CustomTextField fullWidth label='Fax' value={form.fax || ''} onChange={set('fax')} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <CustomTextField
                  fullWidth
                  label='Address'
                  multiline
                  minRows={2}
                  value={form.address || ''}
                  onChange={set('address')}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <CustomTextField
                  fullWidth
                  label='Address (Arabic)'
                  multiline
                  minRows={2}
                  value={form.addressAr || ''}
                  onChange={set('addressAr')}
                />
              </Grid>
            </Grid>
            <Divider />
            <Button type='submit' variant='contained' disabled={saving} className='self-start'>
              {saving ? 'Saving...' : 'Save company details'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
