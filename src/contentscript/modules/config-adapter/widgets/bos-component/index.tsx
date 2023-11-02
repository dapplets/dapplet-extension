import { setupWalletSelector } from '@near-wallet-selector/core'
import { initBGFunctions } from 'chrome-extension-message-wrapper'
import { EthersProviderContext, useInitNear, Widget } from 'near-social-vm'
import * as React from 'react'
import { createRoot } from 'react-dom/client'
import { singletonHook } from 'react-singleton-hook'
import { StyleSheetManager } from 'styled-components'
import browser from 'webextension-polyfill'
import * as EventBus from '../../../../../common/global-event-bus'
import { ChainTypes, DefaultSigners } from '../../../../../common/types'
import { FakeStorage } from './fake-storage'
import { setupWallet } from './setup-wallet'

// ToDo: allow to switch network in BOS
const networkId = 'mainnet'

// The singleton prevents the creation of new VM instances.
export const useSingletonInitNear = singletonHook(null, () => {
  const { initNear } = useInitNear()
  React.useEffect(() => {
    initNear &&
      initNear({
        networkId,
        // The wallet selector looks like an unnecessary abstraction layer over the background wallet
        // but we have to use it because near-social-vm uses not only a wallet object, but also a selector state
        // object and its Observable for event subscription
        selector: setupWalletSelector({
          network: networkId,
          // The storage is faked because it's not necessary. The selected wallet ID is hardcoded below
          storage: new FakeStorage(),
          modules: [
            // ToDo: use real app and chain, now it's difficult to implement because of the singleton
            setupWallet({
              app: DefaultSigners.EXTENSION,
              chain: ChainTypes.NEAR_MAINNET,
            }),
          ],
        }).then((selector) => {
          // Use background wallet by default
          const wallet = selector.wallet
          selector.wallet = () => wallet('background')
          return selector
        }),
        features: {
          enableComponentSrcDataKey: true,
          skipTxConfirmationPopup: true,
        },
      })
  }, [initNear])
})

export const useSingletonOverrides = singletonHook({ overrides: {}, isLoading: true }, () => {
  const [overrides, setOverrides] = React.useState<{ [widgetSrc: string]: string }>({})
  const [isLoading, setIsLoading] = React.useState(true)

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

  return { overrides, isLoading }
})

const Component: React.FC<{
  src: string
  props: any
}> = ({ src, props }) => {
  useSingletonInitNear()

  const { overrides, isLoading } = useSingletonOverrides()

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

  disconnectedCallback() {
    this._root.unmount()
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
