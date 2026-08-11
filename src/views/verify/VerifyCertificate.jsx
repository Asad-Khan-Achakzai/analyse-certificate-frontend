'use client'

import { useEffect, useState } from 'react'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import { api } from '@/lib/api'
import { useSettings } from '@core/hooks/useSettings'

export default function VerifyCertificate({ publicId }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const { updatePageSettings } = useSettings()

  useEffect(() => {
    return updatePageSettings({ mode: 'light' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    api
      .verify(publicId)
      .then(res => setData(res.data))
      .catch(err => setError(err.message || 'Certificate not found'))
      .finally(() => setLoading(false))
  }, [publicId])

  const downloadPdf = async () => {
    const res = await api.verifyPdf(publicId)
    window.open(res.data.url, '_blank')
  }

  if (loading) {
    return (
      <div className='flex justify-center items-center min-bs-[100dvh]'>
        <CircularProgress />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className='flex justify-center items-center min-bs-[100dvh] p-6'>
        <Alert severity='error'>{error || 'Certificate not found'}</Alert>
      </div>
    )
  }

  const issued = data.status === 'issued'

  return (
    <div className='flex justify-center p-4 sm:p-8 min-bs-[100dvh] bg-[var(--mui-palette-background-default)]'>
      <Card className='is-full max-is-[900px]'>
        <CardContent className='flex flex-col gap-4'>
          <div className='flex flex-wrap items-start justify-between gap-4'>
            <div className='flex items-center gap-4'>
              {data.company?.logoUrl ? (
                <img src={data.company.logoUrl} alt='Company logo' className='max-bs-[72px] max-is-[140px] object-contain' />
              ) : null}
              <div>
                <Typography variant='h4'>Certificate Verification</Typography>
                <Typography color='text.secondary'>{data.company?.name}</Typography>
              </div>
            </div>
            <Chip
              label={data.status}
              color={issued ? 'success' : 'error'}
              variant='tonal'
            />
          </div>

          {!issued ? (
            <Alert severity='warning'>This certificate has been revoked and is no longer valid.</Alert>
          ) : (
            <Alert severity='success'>This certificate is valid and was issued by {data.company?.name}.</Alert>
          )}

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
            <Typography>
              <strong>Certificate No:</strong> {data.certificateNumber}
            </Typography>
            <Typography>
              <strong>Date:</strong>{' '}
              {data.certificateDate ? new Date(data.certificateDate).toLocaleDateString() : '-'}
            </Typography>
            <Typography>
              <strong>PO No:</strong> {data.poNumber}
            </Typography>
            <Typography>
              <strong>Destination:</strong> {data.destinationCountry}
            </Typography>
          </div>

          {issued ? (
            <>
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
                    {(data.products || []).map((p, i) => (
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

              {(data.statements || []).length > 0 ? (
                <>
                  <Typography variant='h6'>Statements</Typography>
                  <ul className='list-disc pis-6'>
                    {data.statements.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </>
              ) : null}

              {data.hasPdf ? (
                <Button variant='contained' onClick={downloadPdf} className='self-start'>
                  Download original PDF
                </Button>
              ) : null}
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
