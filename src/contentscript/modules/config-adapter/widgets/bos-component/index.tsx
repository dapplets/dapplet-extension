// near-social-vm
import { setupWalletSelector } from '@near-wallet-selector/core'
import { EthersProviderContext, useInitNear, Widget } from 'near-social-vm'
import * as React from 'react'
import * as ReactDOM from 'react-dom'

const networkId = 'mainnet'

export function Component({ src, props }: { src: string; props: any }) {
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

  connectedCallback() {
    const mountPoint = document.createElement('div')
    this.attachShadow({ mode: 'open' }).appendChild(mountPoint)

    const { src, ...anotherProps } = this

    const keysToSkip = ['__CE_state', '__CE_definition', '__CE_shadowRoot']

    const props = Object.fromEntries(
      Object.keys(anotherProps)
        .filter((x) => !keysToSkip.includes(x))
        .map((key) => [key, anotherProps[key]])
    )

    ReactDOM.render(<Component src={src} props={props} />, mountPoint)
  }
}
