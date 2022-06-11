import copyToClipboard from 'copy-to-clipboard'
import { useCallback, useEffect, useRef, useState } from 'react'

export default function useCopied(str: string): [boolean, () => void, (value: boolean) => void] {
  const copyableString = useRef(str)
  const [copied, setCopied] = useState(false)

  const copyAction = useCallback(() => {
    const copiedString = copyToClipboard(copyableString.current)
    setCopied(copiedString)
  }, [copyableString])

  useEffect(() => {
    copyableString.current = str
  }, [str])

  return [copied, copyAction, setCopied]
}
