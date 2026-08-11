'use client'

import { use } from 'react'
import CertificateForm from '@views/certificates/CertificateForm'

export default function Page({ params }) {
  const { id } = use(params)
  return <CertificateForm certificateId={id} />
}
