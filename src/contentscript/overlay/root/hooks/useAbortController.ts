import { useEffect, useMemo } from 'react'

const useAbortController = () => {
  const abortController = useMemo(() => new AbortController(), [])
  useEffect(() => () => abortController.abort(), [abortController])

  return abortController
}

export default useAbortController
