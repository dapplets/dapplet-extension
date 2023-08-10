function injectScript(url) {
  try {
    const container = document.head || document.documentElement
    const scriptTag = document.createElement('script')
    scriptTag.setAttribute('async', 'false')
    scriptTag.src = url
    container.insertBefore(scriptTag, container.children[0])
    container.removeChild(scriptTag)
  } catch (error) {
    console.error('MyNearWallet patching failed', error)
  }
}

// Near Wallet displays "Unknown App" for transactions with empty HTTP header "referer"
// It's a workaround replacing document.referrer value
if (new URL(document.location.href).searchParams.get('referrer') === 'Dapplets Extension') {
  if (typeof chrome !== 'undefined' && chrome.runtime !== undefined) {
    injectScript(chrome.runtime.getURL('mnw-patch-inpage.js'))
  }
}
