// near-social-vm
import { setupWalletSelector } from '@near-wallet-selector/core'
import { EthersProviderContext, useInitNear, Widget } from 'near-social-vm'
import * as React from 'react'
import { createRoot } from 'react-dom/client'
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

  private _stylesMountPoint = document.createElement('div')
  private _componentMountPoint = document.createElement('div')
  private _root = createRoot(this._componentMountPoint)

  connectedCallback() {
    const shadowRoot = this.attachShadow({ mode: 'open' })

    // Prevent propagation of clicks from BOS-component to parent
    this._componentMountPoint.addEventListener('click', (e) => {
      e.stopPropagation()
    })

    shadowRoot.appendChild(this._stylesMountPoint)
    shadowRoot.appendChild(this._componentMountPoint)

    const { props } = this._getCustomProps()

    // ToDo: custom setter will be applied for initially declared properties only
    Object.keys(props).forEach((propName) => {
      this['_' + propName] = props[propName]
      Object.defineProperty(this, propName, {
        enumerable: true,
        get: () => this['_' + propName],
        set: (value) => {
          this['_' + propName] = value

          this._render()
        },
      })
    })

    this._render()
  }

  _getCustomProps(): { src: string; props: any } {
    const { src, ...anotherProps } = this

    const keysToSkip = ['__CE_state', '__CE_definition', '__CE_shadowRoot']

    const props = Object.fromEntries(
      Object.keys(anotherProps)
        .filter((key) => !keysToSkip.includes(key) && !key.startsWith('_'))
        .map((key) => [key, anotherProps[key]])
    )

    return { src, props }
  }

  _render() {
    const { src, props } = this._getCustomProps()

    this._root.render(
      <StyleSheetManager target={this._stylesMountPoint}>
        <Component src={src} props={props} />
      </StyleSheetManager>
    )
  }
}
