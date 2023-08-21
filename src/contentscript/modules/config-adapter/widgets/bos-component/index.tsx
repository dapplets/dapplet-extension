// near-social-vm
import { setupWalletSelector } from '@near-wallet-selector/core'
import { EthersProviderContext, useInitNear, Widget } from 'near-social-vm'
import * as React from 'react'
import * as ReactDOM from 'react-dom'

const networkId = 'mainnet'

type TransferableProps = {
  [key: string]: null | string | number | boolean
}

export function Component({ src, props }: { src: string; props: TransferableProps }) {
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
        targetComponent: src,
        targetProps: props,
        tosName: 'adminalpha.near/widget/TosContent',
      }}
    />
  )
}

export class BosComponent extends HTMLElement {
  public src: string
  public props: TransferableProps

  connectedCallback() {
    const mountPoint = document.createElement('div')
    this.attachShadow({ mode: 'open' }).appendChild(mountPoint)

    ReactDOM.render(<Component src={this.src} props={this.props} />, mountPoint)
  }
}
