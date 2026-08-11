'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Link from '@components/Link'
import { api } from '@/lib/api'

export default function CertificateDetail({ id }) {
  const router = useRouter()
  const [cert, setCert] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const load = () => {
    api
      .getCertificate(id)
      .then(res => setCert(res.data))
      .catch(err => setError(err.message))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (!cert && !error) {
    return (
      <div className='flex justify-center p-10'>
        <CircularProgress />
      </div>
    )
  }

  if (error && !cert) return <Alert severity='error'>{error}</Alert>

  const issuer = cert.issuer?.name ? cert.issuer : cert.companySnapshot

  const issue = async () => {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const res = await api.issueCertificate(id)
      setCert(res.data)
      setMessage('Certificate issued. PDF and QR code generated.')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const regenerate = async () => {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const res = await api.regenerateCertificate(id)
      setCert(res.data)
      setMessage('PDF and QR regenerated with latest certificate data.')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const revoke = async () => {
    if (!confirm('Revoke this certificate?')) return
    setBusy(true)
    try {
      const res = await api.revokeCertificate(id)
      setCert(res.data)
      setMessage('Certificate revoked')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!confirm('Delete this draft?')) return
    await api.deleteCertificate(id)
    router.push('/certificates')
  }

  const openPdf = async () => {
    const res = await api.getCertificatePdf(id)
    window.open(res.data.url, '_blank')
  }

  const openQr = async () => {
    const res = await api.getCertificateQr(id)
    window.open(res.data.url, '_blank')
  }

  return (
    <Card>
      <CardHeader
        title={cert.certificateNumber}
        subheader={`PO ${cert.poNumber} · ${cert.destinationCountry}${issuer?.name ? ` · ${issuer.name}` : ''}`}
        action={
          <Chip
            label={cert.status}
            color={cert.status === 'issued' ? 'success' : cert.status === 'revoked' ? 'error' : 'warning'}
          />
        }
      />
      <CardContent className='flex flex-col gap-4'>
        {message ? <Alert severity='success'>{message}</Alert> : null}
        {error ? <Alert severity='error'>{error}</Alert> : null}

        <div className='flex flex-wrap gap-2'>
          {cert.status !== 'revoked' ? (
            <Button component={Link} href={`/certificates/${id}/edit`} variant='contained'>
              Edit
            </Button>
          ) : null}

          {cert.status === 'draft' ? (
            <>
              <Button variant='tonal' disabled={busy} onClick={issue}>
                Issue (Generate PDF + QR)
              </Button>
              <Button variant='tonal' color='secondary' disabled={busy} onClick={regenerate}>
                Generate PDF + QR
              </Button>
              <Button color='error' variant='tonal' onClick={remove}>
                Delete
              </Button>
            </>
          ) : null}

          {cert.status === 'issued' ? (
            <>
              <Button variant='tonal' onClick={openPdf} disabled={!cert.pdfKey}>
                Download PDF
              </Button>
              <Button variant='tonal' onClick={openQr} disabled={!cert.qrCodeKey}>
                Download QR
              </Button>
              <Button variant='tonal' color='secondary' disabled={busy} onClick={regenerate}>
                Regenerate PDF + QR
              </Button>
              <Button
                component={Link}
                href={`/verify/${cert.publicId}`}
                target='_blank'
                variant='tonal'
                color='secondary'
              >
                Open verify page
              </Button>
              <Button color='error' variant='tonal' disabled={busy} onClick={revoke}>
                Revoke
              </Button>
            </>
          ) : null}

          {cert.status === 'revoked' && cert.pdfKey ? (
            <Button variant='tonal' onClick={openPdf}>
              Download PDF
            </Button>
          ) : null}
        </div>

        {(issuer?.name || cert.issuerLogoUrl) && (
          <div className='flex flex-wrap items-start gap-4'>
            {cert.issuerLogoUrl ? (
              <img
                src={cert.issuerLogoUrl}
                alt='Issuer logo'
                className='max-bs-[72px] max-is-[140px] object-contain'
              />
            ) : null}
            <div>
              <Typography variant='h6'>{issuer?.name}</Typography>
              <Typography color='text.secondary'>{issuer?.address}</Typography>
              <Typography color='text.secondary'>
                {[issuer?.country, issuer?.phone].filter(Boolean).join(' · ')}
              </Typography>
            </div>
          </div>
        )}

        {cert.qrCodeUrl ? (
          <div>
            <Typography variant='h6' className='mbe-2'>
              QR Code
            </Typography>
            <img src={cert.qrCodeUrl} alt='QR code' className='bs-[160px] is-[160px]' />
            <Typography color='text.secondary' className='mts-2'>
              /verify/{cert.publicId}
            </Typography>
          </div>
        ) : null}

        <Divider />

        <Typography variant='h6'>Products</Typography>
        <div className='overflow-x-auto'>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell>Material</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Batch</TableCell>
                <TableCell>Prod. Date</TableCell>
                <TableCell>Expiry</TableCell>
                <TableCell>Sensory</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(cert.products || []).map((p, i) => (
                <TableRow key={i}>
                  <TableCell>{p.materialNumber}</TableCell>
                  <TableCell>{p.materialDescription}</TableCell>
                  <TableCell>{p.batchNumber}</TableCell>
                  <TableCell>{p.productionDate}</TableCell>
                  <TableCell>{p.expiryDate}</TableCell>
                  <TableCell>{p.sensoryResult}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {(cert.statements || []).length > 0 ? (
          <>
            <Typography variant='h6'>Statements</Typography>
            <ul className='list-disc pis-6'>
              {cert.statements.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </>
        ) : null}
      </CardContent>
    </Card>
  )
}
