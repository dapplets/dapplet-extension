// near-social-vm
import { setupWalletSelector } from '@near-wallet-selector/core'
import { initBGFunctions } from 'chrome-extension-message-wrapper'
import { EthersProviderContext, useInitNear, Widget } from 'near-social-vm'
import * as React from 'react'
import { createRoot } from 'react-dom/client'
import { StyleSheetManager } from 'styled-components'
import browser from 'webextension-polyfill'
import * as EventBus from '../../../../../common/global-event-bus'

const networkId = 'mainnet'

export function Component({ src, props }: { src: string; props: any }) {
  const { initNear } = useInitNear()
  const [overrides, setOverrides] = React.useState<{ [widgetSrc: string]: string }>({})
  const [isLoading, setIsLoading] = React.useState(true)

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

  const loadOverrides = React.useCallback(() => {
    ;(async () => {
      const { getMutation, getMutationById } = await initBGFunctions(browser)
      const mutationId = await getMutation()
      const mutation = await getMutationById(mutationId)
      setOverrides(mutation?.overrides ?? {})
      setIsLoading(false)
    })()
  }, [])

  React.useEffect(() => {
    loadOverrides()
  }, [loadOverrides])

  React.useEffect(() => {
    EventBus.on('bos_mutation_changed', loadOverrides)
    return () => EventBus.off('bos_mutation_changed', loadOverrides)
  }, [loadOverrides])

  React.useEffect(() => {
    EventBus.on('bos_mutation_preview', setOverrides)
    return () => EventBus.off('bos_mutation_preview', setOverrides)
  }, [])

  if (!EthersProviderContext.Provider || isLoading) {
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
      autoConfirm
      enableDataSrcAttribute
      overrides={overrides}
    />
  )
}

export class BosComponent extends HTMLElement {
  public src: string
  public insertionPoint: string
  public styles: string

  private _adapterStylesMountPoint = document.createElement('style')
  private _stylesMountPoint = document.createElement('div')
  private _componentMountPoint = document.createElement('div')
  private _root = createRoot(this._componentMountPoint)

  connectedCallback() {
    const shadowRoot = this.attachShadow({ mode: 'open' })

    // Prevent propagation of clicks from BOS-component to parent
    this._componentMountPoint.addEventListener('click', (e) => {
      e.stopPropagation()
    })

    shadowRoot.appendChild(this._componentMountPoint)
    shadowRoot.appendChild(this._stylesMountPoint)

    // Apply styles from parser config
    if (this.styles) {
      // It will prevent inheritance without affecting other CSS defined within the ShadowDOM.
      // https://stackoverflow.com/a/68062098
      const disableInheritanceRule = ':host { all: initial; } '
      this._adapterStylesMountPoint.innerHTML = disableInheritanceRule + this.styles
      shadowRoot.appendChild(this._adapterStylesMountPoint)
    }

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
