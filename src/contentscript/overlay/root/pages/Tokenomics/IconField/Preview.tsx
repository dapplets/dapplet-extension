import React, { useEffect, useState } from 'react'

type PreviewProps = {
  file: File | null
}

const Preview = ({ file }: PreviewProps) => {
  const [source, setSource] = useState<string | null>(null)

  useEffect(() => {
    if (file) {
      const reader = new FileReader()

      reader.onloadend = () => {
        if (typeof reader.result === 'string') setSource(reader.result)
      }

      reader.readAsDataURL(file)
    }
  }, [file])

  if (!file) return null

  if (!source) return null

  return <img src={source} alt={file.name} height={96} width={96} />
}

export default Preview
