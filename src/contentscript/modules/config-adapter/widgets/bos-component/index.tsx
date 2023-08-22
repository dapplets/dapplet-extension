// near-social-vm
import { setupWalletSelector } from '@near-wallet-selector/core'
import { EthersProviderContext, useInitNear, Widget } from 'near-social-vm'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { StyleSheetManager } from 'styled-components'

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
    const shadowRoot = this.attachShadow({ mode: 'open' })

    const stylesMountPoint = document.createElement('div')
    const componentMountPoint = document.createElement('div')

    componentMountPoint.addEventListener('click', (e) => {
      e.stopPropagation()
    })

    shadowRoot.appendChild(stylesMountPoint)
    shadowRoot.appendChild(componentMountPoint)

    const { src, ...anotherProps } = this

    const keysToSkip = ['__CE_state', '__CE_definition', '__CE_shadowRoot']

    const props = Object.fromEntries(
      Object.keys(anotherProps)
        .filter((x) => !keysToSkip.includes(x))
        .map((key) => [key, anotherProps[key]])
    )

    ReactDOM.render(
      <StyleSheetManager target={stylesMountPoint}>
        <Component src={src} props={props} />
      </StyleSheetManager>,
      componentMountPoint
    )
  }
}
