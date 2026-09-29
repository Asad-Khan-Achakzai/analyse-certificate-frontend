'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import MenuItem from '@mui/material/MenuItem'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Alert from '@mui/material/Alert'
import CustomTextField from '@core/components/mui/TextField'
import Link from '@components/Link'
import { api } from '@/lib/api'

const statusColor = {
  draft: 'warning',
  issued: 'success',
  revoked: 'error'
}

export default function CertificateList() {
  const router = useRouter()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [cloningId, setCloningId] = useState(null)

  const load = () => {
    setLoading(true)
    setError('')
    api
      .listCertificates({ search, status, limit: 100 })
      .then(res => setItems(res.data.items || []))
      .catch(err => {
        setItems([])
        setError(err.message || 'Failed to load certificates')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  const downloadPdf = async id => {
    try {
      const res = await api.getCertificatePdf(id)
      window.open(res.data.url, '_blank')
    } catch (err) {
      setError(err.message)
    }
  }

  const downloadQr = async id => {
    try {
      const res = await api.getCertificateQr(id)
      window.open(res.data.url, '_blank')
    } catch (err) {
      setError(err.message)
    }
  }

  const regenerate = async id => {
    setBusyId(id)
    setError('')
    setMessage('')
    try {
      await api.regenerateCertificate(id)
      setMessage('PDF and QR regenerated')
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  const clone = async id => {
    setCloningId(id)
    setError('')
    setMessage('')
    try {
      const res = await api.cloneCertificate(id)
      const newId = res.data?._id
      if (newId) {
        router.push(`/certificates/${newId}/edit`)
      } else {
        setMessage('Certificate cloned')
        load()
      }
    } catch (err) {
      setError(err.message)
      setCloningId(null)
    }
  }

  return (
    <Card>
      <CardHeader
        title='Certificates'
        subheader='View, edit, download, and regenerate any certificate'
        action={
          <Button component={Link} href='/certificates/new' variant='contained'>
            New Certificate
          </Button>
        }
      />
      <CardContent>
        {error ? (
          <Alert severity='error' className='mbe-4'>
            {error}
          </Alert>
        ) : null}
        {message ? (
          <Alert severity='success' className='mbe-4'>
            {message}
          </Alert>
        ) : null}

        <div className='flex flex-wrap gap-4 mbe-4'>
          <CustomTextField
            label='Search'
            placeholder='Number, PO, destination, company'
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && load()}
          />
          <CustomTextField
            select
            label='Status'
            value={status}
            onChange={e => setStatus(e.target.value)}
            className='min-is-[160px]'
          >
            <MenuItem value=''>All</MenuItem>
            <MenuItem value='draft'>Draft</MenuItem>
            <MenuItem value='issued'>Issued</MenuItem>
            <MenuItem value='revoked'>Revoked</MenuItem>
          </CustomTextField>
          <Button variant='tonal' onClick={load}>
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className='flex justify-center p-8'>
            <CircularProgress />
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Certificate No</TableCell>
                  <TableCell>Issuing company</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>PO No</TableCell>
                  <TableCell>Destination</TableCell>
                  <TableCell>Products</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align='right'>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8}>No certificates found</TableCell>
                  </TableRow>
                ) : (
                  items.map(item => (
                    <TableRow key={item._id} hover>
                      <TableCell>{item.certificateNumber}</TableCell>
                      <TableCell>{item.issuer?.name || item.companySnapshot?.name || '-'}</TableCell>
                      <TableCell>
                        {item.certificateDate ? new Date(item.certificateDate).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>{item.poNumber}</TableCell>
                      <TableCell>{item.destinationCountry}</TableCell>
                      <TableCell>{item.products?.length || 0}</TableCell>
                      <TableCell>
                        <Chip
                          size='small'
                          label={item.status}
                          color={statusColor[item.status] || 'default'}
                          variant='tonal'
                        />
                      </TableCell>
                      <TableCell align='right'>
                        <div className='flex justify-end items-center gap-1 flex-wrap'>
                          {item.pdfKey ? (
                            <Tooltip title='Download PDF'>
                              <IconButton size='small' color='primary' onClick={() => downloadPdf(item._id)}>
                                <i className='tabler-file-type-pdf' />
                              </IconButton>
                            </Tooltip>
                          ) : null}
                          {item.qrCodeKey ? (
                            <Tooltip title='Download QR'>
                              <IconButton size='small' onClick={() => downloadQr(item._id)}>
                                <i className='tabler-qrcode' />
                              </IconButton>
                            </Tooltip>
                          ) : null}
                          {item.status !== 'revoked' ? (
                            <>
                              <Button component={Link} href={`/certificates/${item._id}/edit`} size='small'>
                                Edit
                              </Button>
                              <Button
                                size='small'
                                variant='tonal'
                                disabled={busyId === item._id}
                                onClick={() => regenerate(item._id)}
                              >
                                {busyId === item._id ? '...' : 'Regenerate'}
                              </Button>
                            </>
                          ) : null}
                          <Button
                            size='small'
                            variant='tonal'
                            color='secondary'
                            disabled={cloningId === item._id}
                            onClick={() => clone(item._id)}
                          >
                            {cloningId === item._id ? '...' : 'Clone'}
                          </Button>
                          <Button component={Link} href={`/certificates/${item._id}`} size='small' variant='text'>
                            View
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
