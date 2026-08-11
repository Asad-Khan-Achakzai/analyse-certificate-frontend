'use client'

import { use } from 'react'
import VerifyCertificate from '@views/verify/VerifyCertificate'

export default function Page({ params }) {
  const { publicId } = use(params)
  return <VerifyCertificate publicId={publicId} />
}
