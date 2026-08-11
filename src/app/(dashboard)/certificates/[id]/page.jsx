'use client'

import { use } from 'react'
import CertificateDetail from '@views/certificates/CertificateDetail'

export default function Page({ params }) {
  const { id } = use(params)
  return <CertificateDetail id={id} />
}
