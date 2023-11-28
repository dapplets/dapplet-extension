import '@near-wallet-selector/modal-ui/styles.css'
import { EthersProviderContext, useInitNear, Widget } from 'near-social-vm'
import React from 'react'
import { singletonHook } from 'react-singleton-hook'
import { StyleSheetManager } from 'styled-components'

import '@near-wallet-selector/modal-ui/styles.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import 'bootstrap/dist/js/bootstrap.bundle'
import 'react-bootstrap-typeahead/css/Typeahead.bs5.css'
import 'react-bootstrap-typeahead/css/Typeahead.css'
import './App.scss'

// ToDo: allow to switch network in BOS
const networkId = 'mainnet'

const stylesMountPoint = document.createElement('div')
document.head.appendChild(stylesMountPoint)

// The singleton prevents the creation of new VM instances.
export const useSingletonInitNear = singletonHook(null, () => {
  const { initNear } = useInitNear()
  React.useEffect(() => {
    initNear &&
      initNear({
        networkId,
        features: {
          enableComponentSrcDataKey: true,
          skipTxConfirmationPopup: true,
        },
      })
  }, [initNear])
})

export const App: React.FC = () => {
  const src = new URLSearchParams(window.location.search).get('src')

  useSingletonInitNear()

  if (!EthersProviderContext.Provider) {
    return null
  }

  return (
    <StyleSheetManager target={stylesMountPoint}>
      <Widget src={src} props={{}} />
    </StyleSheetManager>
  )
}
