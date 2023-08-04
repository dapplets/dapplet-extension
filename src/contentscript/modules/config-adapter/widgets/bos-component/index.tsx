// near-social-vm
import { setupWalletSelector } from '@near-wallet-selector/core'
import { EthersProviderContext, useInitNear, Widget } from 'near-social-vm'
import * as React from 'react'
import * as ReactDOM from 'react-dom'

const networkId = 'mainnet'

export function Component() {
  const { initNear } = useInitNear()

  React.useEffect(() => {
    initNear &&
      initNear({
        networkId,
        selector: setupWalletSelector({
          network: networkId,
          modules: [],
        }),
      })
  }, [initNear])

  if (!EthersProviderContext.Provider) {
    return null
  }

  return (
    <Widget
      src="near/widget/TosCheck"
      props={{
        targetComponent: 'alsakhaev.near/widget/ExampleButton',
        targetProps: {
          componentAccountId: 'alsakhaev.near',
          componentName: 'ExampleButton',
        },
        tosName: 'adminalpha.near/widget/TosContent',
      }}
    />
  )
}

export class BosComponent extends HTMLElement {
  connectedCallback() {
    const mountPoint = document.createElement('div')
    this.attachShadow({ mode: 'open' }).appendChild(mountPoint)

    ReactDOM.render(<Component />, mountPoint)
  }
}
