export const proxyFetch: typeof fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const request = new Request(input, init)

  const requestBlob = request.body ? await request.blob() : undefined

  const bgResponse = await chrome.runtime.sendMessage({
    type: 'FETCH_REQUEST',
    payload: {
      url: request.url,
      objectUrl: requestBlob ? URL.createObjectURL(requestBlob) : undefined,
      options: {
        method: request.method,
        headers: Object.fromEntries(request.headers.entries()),
        mode: request.mode,
        credentials: request.credentials,
        cache: request.cache,
        redirect: request.redirect,
        referrer: request.referrer,
        referrerPolicy: request.referrerPolicy,
        integrity: request.integrity,
        keepalive: request.keepalive,
      },
    },
  })

  const responseBlob = await fetch(bgResponse.objectUrl).then((x) => x.blob())

  URL.revokeObjectURL(bgResponse.objectUrl)

  const response = new Response(responseBlob, {
    status: bgResponse.status,
    statusText: bgResponse.statusText,
    headers: new Headers(bgResponse.headers),
  })

  return response
}
