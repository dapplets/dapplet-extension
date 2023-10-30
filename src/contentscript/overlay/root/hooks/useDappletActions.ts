import { initBGFunctions } from 'chrome-extension-message-wrapper'
import { useCallback, useEffect, useState } from 'react'
import { singletonHook } from 'react-singleton-hook'
import browser from 'webextension-polyfill'
import * as EventBus from '../../../../common/global-event-bus'

export type DappletActionProps = {
  moduleName: string
  onClick?: () => void
  title?: string
  icon?: string
  pinId?: string
  hidden?: boolean
  disabled?: boolean
  pinned?: boolean
  onPinned?: () => void
}

interface IState {
  dappletActions: DappletActionProps[]
}

const initState: IState = {
  dappletActions: [],
}

let _setDappletActions: (actions: DappletActionProps[]) => void = () => {
  throw new Error('You must useDappletActions before setting its state')
}

export const useDappletActions = singletonHook(initState, () => {
  const [dappletActions, setDappletActions] = useState([])
  const [pinnedActions, setPinnedActions] = useState([])

  const pinDappletAction = useCallback(async (name, pinId) => {
    try {
      const { addPinnedActions } = await initBGFunctions(browser)
      await addPinnedActions(name, pinId)
    } catch (err) {
      console.error(err)
    }
  }, [])

  const unpinDappletAction = useCallback(async (name, pinId) => {
    try {
      const { removePinnedActions } = await initBGFunctions(browser)
      await removePinnedActions(name, pinId)
    } catch (err) {
      console.error(err)
    }
  }, [])

  const extendActionsWithHandlers = useCallback(
    (actions: DappletActionProps[]) => {
      return actions
        .map((action) => ({
          ...action,
          pinned:
            pinnedActions.some(
              (pin) => pin.dappletName === action.moduleName && pin.widgetPinId === action.pinId
            ) ?? false,
        }))
        .map((action) => ({
          ...action,
          onPinned: async () => {
            // ToDo: update value in DynamicAdapter/State

            if (action.pinned) {
              await unpinDappletAction(action.moduleName, action.pinId)
            } else {
              await pinDappletAction(action.moduleName, action.pinId)
            }
          },
        }))
    },
    [pinnedActions, pinDappletAction, unpinDappletAction]
  )

  _setDappletActions = (actions) => {
    setDappletActions(extendActionsWithHandlers(actions))
  }

  useEffect(() => {
    setDappletActions((actions) => extendActionsWithHandlers(actions))
  }, [pinnedActions])

  useEffect(() => {
    const refreshPinnedActions = async () => {
      try {
        const { getPinnedActions } = await initBGFunctions(browser)
        const pinnedActions = await getPinnedActions()
        setPinnedActions(pinnedActions)
      } catch (err) {
        console.error(err)
      }
    }

    refreshPinnedActions()

    EventBus.on('myactions_changed', refreshPinnedActions)

    return () => {
      EventBus.off('myactions_changed', refreshPinnedActions)
    }
  }, [])

  return {
    dappletActions,
  }
})

export const setDappletActions = (actions) => _setDappletActions(actions)
