'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import Divider from '@mui/material/Divider'
import CustomTextField from '@core/components/mui/TextField'
import { api } from '@/lib/api'

const emptyProduct = () => ({
  materialNumber: '',
  materialDescription: '',
  batchNumber: '',
  productionDate: '',
  expiryDate: '',
  sensoryResult: ''
})

const emptyLimit = () => ({ parameter: '', result: '' })

const emptyForm = () => ({
  certificateNumber: '',
  certificateDate: new Date().toISOString().slice(0, 10),
  poNumber: '',
  destinationCountry: '',
  issuer: {
    name: '',
    address: '',
    country: '',
    addressAr: '',
    phone: '',
    fax: ''
  },
  products: [emptyProduct()],
  microbiologicalLimits: [],
  chemicalLimits: [],
  physicalProperties: [],
  statements: [],
  signatories: {
    preparedBy: { name: '', title: '' },
    verifiedBy: { name: '', title: '' },
    approvedBy: { name: '', title: '' }
  }
})

function RowEditor({ title, subtitle, rows, onChange, fields, onAdd, onRemove, allowEmpty = false }) {
  return (
    <div className='flex flex-col gap-3'>
      <div className='flex items-center justify-between gap-2 flex-wrap'>
        <div>
          <Typography variant='h6'>{title}</Typography>
          {subtitle ? (
            <Typography variant='body2' color='text.secondary'>
              {subtitle}
            </Typography>
          ) : null}
        </div>
        <Button size='small' variant='tonal' onClick={onAdd} startIcon={<i className='tabler-plus' />}>
          Add row
        </Button>
      </div>
      {rows.length === 0 ? (
        <Typography color='text.secondary'>None added (optional)</Typography>
      ) : (
        rows.map((row, index) => (
          <Grid container spacing={3} key={index} alignItems='center'>
            {fields.map(field => (
              <Grid size={{ xs: 12, md: field.md || 4 }} key={field.key}>
                <CustomTextField
                  fullWidth
                  label={field.label}
                  value={row[field.key] || ''}
                  onChange={e => onChange(index, field.key, e.target.value)}
                />
              </Grid>
            ))}
            <Grid size={{ xs: 12, md: 1 }}>
              <IconButton
                color='error'
                disabled={!allowEmpty && rows.length <= 1}
                onClick={() => onRemove(index)}
              >
                <i className='tabler-trash' />
              </IconButton>
            </Grid>
          </Grid>
        ))
      )}
    </div>
  )
}

export default function CertificateForm({ certificateId }) {
  const router = useRouter()
  const [form, setForm] = useState(emptyForm())
  const [issuerLogoUrl, setIssuerLogoUrl] = useState(null)
  const [issuerStampUrl, setIssuerStampUrl] = useState(null)
  const [logoFile, setLogoFile] = useState(null)
  const [stampFile, setStampFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [stampPreview, setStampPreview] = useState(null)
  const [signatureFiles, setSignatureFiles] = useState({
    preparedBy: null,
    verifiedBy: null,
    approvedBy: null
  })
  const [signaturePreviews, setSignaturePreviews] = useState({
    preparedBy: null,
    verifiedBy: null,
    approvedBy: null
  })
  const [signatureUrls, setSignatureUrls] = useState({
    preparedBy: null,
    verifiedBy: null,
    approvedBy: null
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const isEdit = Boolean(certificateId)

  const [certStatus, setCertStatus] = useState('draft')

  useEffect(() => {
    if (!certificateId) return
    api
      .getCertificate(certificateId)
      .then(res => {
        const c = res.data
        const issuerSource = c.issuer?.name ? c.issuer : c.companySnapshot || {}
        setCertStatus(c.status || 'draft')
        setForm({
          certificateNumber: c.certificateNumber,
          certificateDate: c.certificateDate?.slice(0, 10),
          poNumber: c.poNumber,
          destinationCountry: c.destinationCountry,
          issuer: {
            name: issuerSource.name || '',
            address: issuerSource.address || '',
            country: issuerSource.country || '',
            addressAr: issuerSource.addressAr || '',
            phone: issuerSource.phone || '',
            fax: issuerSource.fax || ''
          },
          products: c.products?.length ? c.products : [emptyProduct()],
          microbiologicalLimits: c.microbiologicalLimits?.length ? c.microbiologicalLimits : [],
          chemicalLimits: c.chemicalLimits?.length ? c.chemicalLimits : [],
          physicalProperties: c.physicalProperties || [],
          statements: c.statements || [],
          signatories: {
            preparedBy: { name: '', title: '', ...(c.signatories?.preparedBy || {}) },
            verifiedBy: { name: '', title: '', ...(c.signatories?.verifiedBy || {}) },
            approvedBy: { name: '', title: '', ...(c.signatories?.approvedBy || {}) }
          }
        })
        setIssuerLogoUrl(c.issuerLogoUrl || null)
        setIssuerStampUrl(c.issuerStampUrl || null)
        setSignatureUrls({
          preparedBy: c.preparedBySignatureUrl || null,
          verifiedBy: c.verifiedBySignatureUrl || null,
          approvedBy: c.approvedBySignatureUrl || null
        })
      })
      .catch(err => setError(err.message))
  }, [certificateId])

  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview)
      if (stampPreview) URL.revokeObjectURL(stampPreview)
      Object.values(signaturePreviews).forEach(url => {
        if (url) URL.revokeObjectURL(url)
      })
    }
  }, [logoPreview, stampPreview, signaturePreviews])

  const setIssuer = key => e =>
    setForm(prev => ({ ...prev, issuer: { ...prev.issuer, [key]: e.target.value } }))

  const onPickLogo = file => {
    if (!file) return
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  const onPickStamp = file => {
    if (!file) return
    setStampFile(file)
    setStampPreview(URL.createObjectURL(file))
  }

  const onPickSignature = (role, file) => {
    if (!file) return
    setSignatureFiles(prev => ({ ...prev, [role]: file }))
    setSignaturePreviews(prev => {
      if (prev[role]) URL.revokeObjectURL(prev[role])
      return { ...prev, [role]: URL.createObjectURL(file) }
    })
  }

  const updateProduct = (index, key, value) => {
    setForm(prev => {
      const products = [...prev.products]
      products[index] = { ...products[index], [key]: value }
      return { ...prev, products }
    })
  }

  const updateLimit = (listKey, index, key, value) => {
    setForm(prev => {
      const list = [...prev[listKey]]
      list[index] = { ...list[index], [key]: value }
      return { ...prev, [listKey]: list }
    })
  }

  const updateStringList = (listKey, index, value) => {
    setForm(prev => {
      const list = [...prev[listKey]]
      list[index] = value
      return { ...prev, [listKey]: list }
    })
  }

  const submit = async e => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (!form.issuer.name.trim() || !form.issuer.address.trim() || !form.issuer.country.trim()) {
        throw new Error('Issuing company name, address, and country are required')
      }

      const products = form.products.filter(
        p =>
          p.materialNumber ||
          p.materialDescription ||
          p.batchNumber ||
          p.productionDate ||
          p.expiryDate ||
          p.sensoryResult
      )

      if (products.length === 0) {
        throw new Error('Add at least one product with material details')
      }

      const incomplete = products.find(
        p =>
          !p.materialNumber ||
          !p.materialDescription ||
          !p.batchNumber ||
          !p.productionDate ||
          !p.expiryDate ||
          !p.sensoryResult
      )
      if (incomplete) {
        throw new Error('Each product needs Material, Description, Batch, Prod. Date, Expiry, and Sensory')
      }

      const payload = {
        ...form,
        issuer: {
          name: form.issuer.name.trim(),
          address: form.issuer.address.trim(),
          country: form.issuer.country.trim(),
          addressAr: form.issuer.addressAr?.trim() || null,
          phone: form.issuer.phone?.trim() || null,
          fax: form.issuer.fax?.trim() || null
        },
        products,
        microbiologicalLimits: form.microbiologicalLimits.filter(r => r.parameter && r.result),
        chemicalLimits: form.chemicalLimits.filter(r => r.parameter && r.result),
        physicalProperties: form.physicalProperties.filter(Boolean),
        statements: form.statements.filter(Boolean)
      }

      let id = certificateId
      if (isEdit) {
        await api.updateCertificate(certificateId, payload)
      } else {
        const res = await api.createCertificate(payload)
        id = res.data._id
      }

      if (logoFile) {
        const uploaded = await api.uploadCertificateIssuerLogo(id, logoFile)
        setIssuerLogoUrl(uploaded.data.issuerLogoUrl)
        setLogoFile(null)
      }
      if (stampFile) {
        const uploaded = await api.uploadCertificateIssuerStamp(id, stampFile)
        setIssuerStampUrl(uploaded.data.issuerStampUrl)
        setStampFile(null)
      }

      for (const role of ['preparedBy', 'verifiedBy', 'approvedBy']) {
        if (signatureFiles[role]) {
          const uploaded = await api.uploadCertificateSignature(id, role, signatureFiles[role])
          setSignatureUrls(prev => ({
            ...prev,
            preparedBy: uploaded.data.preparedBySignatureUrl || prev.preparedBy,
            verifiedBy: uploaded.data.verifiedBySignatureUrl || prev.verifiedBy,
            approvedBy: uploaded.data.approvedBySignatureUrl || prev.approvedBy
          }))
        }
      }
      setSignatureFiles({ preparedBy: null, verifiedBy: null, approvedBy: null })

      router.push(`/certificates/${id}`)
    } catch (err) {
      setError(err.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader
        title={isEdit ? 'Edit Certificate' : 'Create Certificate'}
        subheader={
          isEdit && certStatus === 'issued'
            ? 'Editing an issued certificate will regenerate its PDF and QR automatically'
            : 'Each certificate has its own issuing company details'
        }
      />
      <CardContent>
        {error ? (
          <Alert severity='error' className='mbe-4'>
            {error}
          </Alert>
        ) : null}
        {isEdit && certStatus === 'issued' ? (
          <Alert severity='info' className='mbe-4'>
            This certificate is already issued. Saving updates the record and regenerates the PDF/QR.
          </Alert>
        ) : null}
        <form onSubmit={submit} className='flex flex-col gap-6'>
          <div className='flex flex-col gap-3'>
            <Typography variant='h6'>Issuing company</Typography>
            <Typography variant='body2' color='text.secondary'>
              Enter the company that appears on this certificate (name, logo, address). This can be different for every certificate.
            </Typography>
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, md: 6 }}>
                <CustomTextField
                  fullWidth
                  required
                  label='Company name'
                  value={form.issuer.name}
                  onChange={setIssuer('name')}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <CustomTextField
                  fullWidth
                  required
                  label='Country'
                  value={form.issuer.country}
                  onChange={setIssuer('country')}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <CustomTextField fullWidth label='Phone' value={form.issuer.phone} onChange={setIssuer('phone')} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <CustomTextField fullWidth label='Fax' value={form.issuer.fax} onChange={setIssuer('fax')} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <CustomTextField
                  fullWidth
                  required
                  label='Address'
                  multiline
                  minRows={2}
                  value={form.issuer.address}
                  onChange={setIssuer('address')}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <CustomTextField
                  fullWidth
                  label='Address (Arabic, optional)'
                  multiline
                  minRows={2}
                  value={form.issuer.addressAr}
                  onChange={setIssuer('addressAr')}
                />
              </Grid>
            </Grid>

            <div className='flex flex-wrap gap-6 mbs-2'>
              <div className='flex flex-col gap-2 min-is-[200px]'>
                <Typography fontWeight={600}>Company logo</Typography>
                <div className='border rounded p-3 flex items-center justify-center min-bs-[100px]'>
                  {logoPreview || issuerLogoUrl ? (
                    <img
                      src={logoPreview || issuerLogoUrl}
                      alt='Issuer logo'
                      className='max-bs-[90px] max-is-[180px] object-contain'
                    />
                  ) : (
                    <Typography color='text.secondary'>No logo selected</Typography>
                  )}
                </div>
                <Button component='label' variant='contained'>
                  Upload logo
                  <input
                    hidden
                    type='file'
                    accept='image/png,image/jpeg,image/webp,image/gif'
                    onChange={e => onPickLogo(e.target.files?.[0])}
                  />
                </Button>
              </div>
              <div className='flex flex-col gap-2 min-is-[200px]'>
                <Typography fontWeight={600}>QA stamp (optional)</Typography>
                <div className='border rounded p-3 flex items-center justify-center min-bs-[100px]'>
                  {stampPreview || issuerStampUrl ? (
                    <img
                      src={stampPreview || issuerStampUrl}
                      alt='Issuer stamp'
                      className='max-bs-[90px] max-is-[180px] object-contain'
                    />
                  ) : (
                    <Typography color='text.secondary'>No stamp selected</Typography>
                  )}
                </div>
                <Button component='label' variant='outlined'>
                  Upload stamp
                  <input
                    hidden
                    type='file'
                    accept='image/png,image/jpeg,image/webp,image/gif'
                    onChange={e => onPickStamp(e.target.files?.[0])}
                  />
                </Button>
              </div>
            </div>
          </div>

          <Divider />

          <Typography variant='h6'>Certificate details</Typography>
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 4 }}>
              <CustomTextField
                fullWidth
                required
                label='Report Reference No'
                value={form.certificateNumber}
                onChange={e => setForm(p => ({ ...p, certificateNumber: e.target.value }))}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <CustomTextField
                fullWidth
                required
                type='date'
                label='Date'
                value={form.certificateDate}
                onChange={e => setForm(p => ({ ...p, certificateDate: e.target.value }))}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <CustomTextField
                fullWidth
                required
                label='PO No'
                value={form.poNumber}
                onChange={e => setForm(p => ({ ...p, poNumber: e.target.value }))}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <CustomTextField
                fullWidth
                required
                label='Destination Country'
                value={form.destinationCountry}
                onChange={e => setForm(p => ({ ...p, destinationCountry: e.target.value }))}
              />
            </Grid>
          </Grid>

          <Divider />

          <RowEditor
            title='Products'
            subtitle='Required — at least one product'
            rows={form.products}
            fields={[
              { key: 'materialNumber', label: 'Material', md: 2 },
              { key: 'materialDescription', label: 'Material Description', md: 3 },
              { key: 'batchNumber', label: 'Batch', md: 2 },
              { key: 'productionDate', label: 'Prod. Date', md: 2 },
              { key: 'expiryDate', label: 'Expiry Date', md: 2 },
              { key: 'sensoryResult', label: 'Sensory', md: 1 }
            ]}
            onChange={updateProduct}
            onAdd={() => setForm(p => ({ ...p, products: [...p.products, emptyProduct()] }))}
            onRemove={index =>
              setForm(p => ({ ...p, products: p.products.filter((_, i) => i !== index) }))
            }
          />

          <Divider />

          <RowEditor
            title='Microbiological Limits'
            subtitle='Optional'
            allowEmpty
            rows={form.microbiologicalLimits}
            fields={[
              { key: 'parameter', label: 'Parameter', md: 5 },
              { key: 'result', label: 'Result', md: 5 }
            ]}
            onChange={(i, k, v) => updateLimit('microbiologicalLimits', i, k, v)}
            onAdd={() =>
              setForm(p => ({ ...p, microbiologicalLimits: [...p.microbiologicalLimits, emptyLimit()] }))
            }
            onRemove={index =>
              setForm(p => ({
                ...p,
                microbiologicalLimits: p.microbiologicalLimits.filter((_, i) => i !== index)
              }))
            }
          />

          <RowEditor
            title='Chemical Limits'
            subtitle='Optional'
            allowEmpty
            rows={form.chemicalLimits}
            fields={[
              { key: 'parameter', label: 'Parameter', md: 5 },
              { key: 'result', label: 'Result', md: 5 }
            ]}
            onChange={(i, k, v) => updateLimit('chemicalLimits', i, k, v)}
            onAdd={() => setForm(p => ({ ...p, chemicalLimits: [...p.chemicalLimits, emptyLimit()] }))}
            onRemove={index =>
              setForm(p => ({
                ...p,
                chemicalLimits: p.chemicalLimits.filter((_, i) => i !== index)
              }))
            }
          />

          <div className='flex flex-col gap-3'>
            <div className='flex items-center justify-between'>
              <div>
                <Typography variant='h6'>Physical Properties</Typography>
                <Typography variant='body2' color='text.secondary'>
                  Optional
                </Typography>
              </div>
              <Button
                size='small'
                variant='tonal'
                onClick={() => setForm(p => ({ ...p, physicalProperties: [...p.physicalProperties, ''] }))}
              >
                Add
              </Button>
            </div>
            {form.physicalProperties.length === 0 ? (
              <Typography color='text.secondary'>None added</Typography>
            ) : (
              form.physicalProperties.map((item, index) => (
                <div className='flex gap-2' key={index}>
                  <CustomTextField
                    fullWidth
                    label={`Property ${index + 1}`}
                    value={item}
                    onChange={e => updateStringList('physicalProperties', index, e.target.value)}
                  />
                  <IconButton
                    color='error'
                    onClick={() =>
                      setForm(p => ({
                        ...p,
                        physicalProperties: p.physicalProperties.filter((_, i) => i !== index)
                      }))
                    }
                  >
                    <i className='tabler-trash' />
                  </IconButton>
                </div>
              ))
            )}
          </div>

          <div className='flex flex-col gap-3'>
            <div className='flex items-center justify-between'>
              <div>
                <Typography variant='h6'>Certificate Statements</Typography>
                <Typography variant='body2' color='text.secondary'>
                  Optional
                </Typography>
              </div>
              <Button
                size='small'
                variant='tonal'
                onClick={() => setForm(p => ({ ...p, statements: [...p.statements, ''] }))}
              >
                Add
              </Button>
            </div>
            {form.statements.length === 0 ? (
              <Typography color='text.secondary'>None added</Typography>
            ) : (
              form.statements.map((item, index) => (
                <div className='flex gap-2' key={index}>
                  <CustomTextField
                    fullWidth
                    label={`Statement ${index + 1}`}
                    value={item}
                    onChange={e => updateStringList('statements', index, e.target.value)}
                  />
                  <IconButton
                    color='error'
                    onClick={() =>
                      setForm(p => ({
                        ...p,
                        statements: p.statements.filter((_, i) => i !== index)
                      }))
                    }
                  >
                    <i className='tabler-trash' />
                  </IconButton>
                </div>
              ))
            )}
          </div>

          <Divider />

          <div>
            <Typography variant='h6'>Signatories</Typography>
            <Typography variant='body2' color='text.secondary' className='mbe-3'>
              Optional — upload PNG/JPG signatures for each role. QA stamp appears under Approved by on the PDF.
            </Typography>
            <Grid container spacing={4}>
              {['preparedBy', 'verifiedBy', 'approvedBy'].map(key => (
                <Grid size={{ xs: 12, md: 4 }} key={key}>
                  <Typography className='mbe-2 capitalize'>{key.replace('By', ' by')}</Typography>
                  <div className='flex flex-col gap-3'>
                    <CustomTextField
                      fullWidth
                      label='Name'
                      value={form.signatories[key].name}
                      onChange={e =>
                        setForm(p => ({
                          ...p,
                          signatories: {
                            ...p.signatories,
                            [key]: { ...p.signatories[key], name: e.target.value }
                          }
                        }))
                      }
                    />
                    <CustomTextField
                      fullWidth
                      label='Title'
                      value={form.signatories[key].title}
                      onChange={e =>
                        setForm(p => ({
                          ...p,
                          signatories: {
                            ...p.signatories,
                            [key]: { ...p.signatories[key], title: e.target.value }
                          }
                        }))
                      }
                    />
                    <div className='border rounded p-3 flex items-center justify-center min-bs-[80px] bg-[var(--mui-palette-action-hover)]'>
                      {signaturePreviews[key] || signatureUrls[key] ? (
                        <img
                          src={signaturePreviews[key] || signatureUrls[key]}
                          alt={`${key} signature`}
                          className='max-bs-[70px] max-is-[160px] object-contain'
                        />
                      ) : (
                        <Typography color='text.secondary' variant='body2'>
                          No signature
                        </Typography>
                      )}
                    </div>
                    <Button component='label' variant='outlined' size='small'>
                      Upload signature PNG
                      <input
                        hidden
                        type='file'
                        accept='image/png,image/jpeg,image/webp,image/gif'
                        onChange={e => onPickSignature(key, e.target.files?.[0])}
                      />
                    </Button>
                  </div>
                </Grid>
              ))}
            </Grid>
          </div>

          <div className='flex gap-3'>
            <Button type='submit' variant='contained' disabled={saving}>
              {saving
                ? 'Saving...'
                : isEdit
                  ? certStatus === 'issued'
                    ? 'Save & regenerate PDF'
                    : 'Update draft'
                  : 'Save draft'}
            </Button>
            <Button variant='tonal' color='secondary' onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
