import { initBGFunctions } from 'chrome-extension-message-wrapper'
import { useEffect, useState } from 'react'
import { singletonHook } from 'react-singleton-hook'
import browser from 'webextension-polyfill'
import * as EventBus from '../../../../common/global-event-bus'

export type DappletAction = {
  moduleName: string
  action?: () => void
  title?: string
  icon?: string
  pinnedID?: string
  hidden?: boolean
  disabled?: boolean
  pinned?: boolean
}

interface IState {
  dappletActions: DappletAction[]
  pinDappletAction(moduleName: string, pinId: string): Promise<void>
  unpinDappletAction(moduleName: string, pinId: string): Promise<void>
}

const initState: IState = {
  dappletActions: [],
  pinDappletAction: () => undefined,
  unpinDappletAction: () => undefined,
}

let _setDappletActions: (actions: DappletAction[]) => void = () => {
  throw new Error('You must useDappletActions before setting its state')
}

export const useDappletActions = singletonHook(initState, () => {
  const [dappletActions, setDappletActions] = useState(initState.dappletActions)
  const [pinnedActions, setPinnedActions] = useState([])

  _setDappletActions = (actions) => {
    setDappletActions(
      actions.map((action) => ({
        ...action,
        pinned: pinnedActions.some(
          (pin) => pin.dappletName === action.moduleName && pin.widgetPinId === action.pinnedID
        ),
      }))
    )
  }

  useEffect(() => {
    const _refreshData = async () => {
      try {
        const { getPinnedActions } = await initBGFunctions(browser)
        const pinnedActions = await getPinnedActions()
        setPinnedActions(pinnedActions)
      } catch (err) {
        console.error(err)
      }
    }

    EventBus.on('myactions_changed', _refreshData)

    return () => {
      EventBus.off('myactions_changed', _refreshData)
    }
  }, [])

  useEffect(() => {
    // ToDo: code duplication
    setDappletActions((actions) =>
      actions.map((action) => ({
        ...action,
        pinned: pinnedActions.some(
          (pin) => pin.dappletName === action.moduleName && pin.widgetPinId === action.pinnedID
        ),
      }))
    )
  }, [pinnedActions])

  const pinDappletAction = async (name, pinId) => {
    try {
      const { addPinnedActions } = await initBGFunctions(browser)
      await addPinnedActions(name, pinId)
    } catch (err) {
      console.error(err)
    }
  }

  const unpinDappletAction = async (name, pinId) => {
    try {
      const { removePinnedActions } = await initBGFunctions(browser)
      await removePinnedActions(name, pinId)
    } catch (err) {
      console.error(err)
    }
  }

  return {
    dappletActions,
    pinDappletAction,
    unpinDappletAction,
  }
})

export const setDappletActions = (actions) => _setDappletActions(actions)
