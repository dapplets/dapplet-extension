import React, {
  DetailedHTMLProps,
  HTMLAttributes,
  ReactElement,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import styles from './OverlayToolbar.module.scss'
import { OverlayTab } from '../OverlayTab'
import cn from 'classnames'
import { ReactComponent as Coolicon } from '../../assets/svg/coolicon.svg'
import { ITab } from '../../types/tab'
import { IMenu } from '../../models/menu.model'
import { Overlay } from '../../overlay'
import { ManifestAndDetails } from '../../../../../popup/components/dapplet'
import { initBGFunctions } from 'chrome-extension-message-wrapper'
import { browser } from 'webextension-polyfill-ts'
import { loadJsonFile } from 'near-api-js/lib/key_stores/unencrypted_file_system_keystore'
// TODO: change element hiding from Margin to transform
export interface OverlayToolbarProps
  extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
  tabs: ITab[]
  menu: IMenu[]
  nameSelectedMenu?: string
  activeOverlay: Overlay
  idActiveTab: string
  isDevMode: boolean
  isSystemDapplets: boolean
  toggle: () => void
  onOverlayTab: () => void
  onSelectedMenu: (selected: string) => void
  onRemoveTab: (id: string) => void
  onSelectedTab: (id: string) => void
}

type TToggleOverlay = Pick<OverlayToolbarProps, 'toggle'> & {
  className?: string
  getNode?: () => void
}

const ToggleOverlay = ({
  toggle,
  className,
  getNode,
}: // clN,

TToggleOverlay): ReactElement => {
  return (
    <button
      className={cn(styles.toggleOverlay, className)}
      onClick={() => {
        toggle()
        getNode()
      }}
    >
      <Coolicon />
    </button>
  )
}
let _isMounted = false
export const OverlayToolbar = (props: OverlayToolbarProps): ReactElement => {
  const {
    tabs,
    nameSelectedMenu,
    idActiveTab,
    className,
    isDevMode,
    isSystemDapplets,
    activeOverlay,
    menu,
    toggle,
    onSelectedMenu,
    onOverlayTab,
    onSelectedTab,
    onRemoveTab,

    ...anotherProps
  } = props

  const [allDapplet, setAllDapplet] = useState<ManifestAndDetails[]>([])

  const handlerSelectedTab = (id: string) => (): void => onSelectedTab(id)
  const handlerRemoveTab = (id: string) => (): void => onRemoveTab(id)
  const nonSystemTabs = tabs.filter((x) => !x.uri.includes('/popup.html#'))

  const nodeOverlayToolbar = useRef<HTMLInputElement>()
  const [isNodeOverlayToolbar, setNodeOverlayToolbar] = useState(false)

  useEffect(() => {
    _isMounted = true
    const init = async () => {
      const { getFeaturesByHostnames, getCurrentContextIds, getThisTab } =
        await initBGFunctions(browser)
      const currentTab = await getThisTab()
      const ids = await getCurrentContextIds(currentTab)
      const d = await getFeaturesByHostnames(ids)
      setAllDapplet(d)
    }
    init()

    if (!activeOverlay) return
    const noSystem = !activeOverlay.uri.includes('/popup.html#')
    if (noSystem) onOverlayTab()
    return () => {
      _isMounted = false
    }
  }, [activeOverlay, nodeOverlayToolbar, isNodeOverlayToolbar])
  const handleClickGetNodeOverlayToolbar = () => {
    if (nodeOverlayToolbar && nodeOverlayToolbar.current) {
      nodeOverlayToolbar.current.value = ''
      // const parent = nodeOverlayToolbar.current.getBoundingClientRect()
      const element = nodeOverlayToolbar.current.getBoundingClientRect()

      const x = element.x
      // const y = element.top - parent.top

      console.log(x)
      if (x > 10 && x < 100) {
        setNodeOverlayToolbar(true)
        console.log(isNodeOverlayToolbar)
        console.log(element)
      } else {
        setNodeOverlayToolbar(false)
        console.log(isNodeOverlayToolbar)
        console.log(element)
      }
    }
  }
  const nodeButtonMemo = useMemo(() => {}, [
    nodeOverlayToolbar,
    isNodeOverlayToolbar,
  ])

  console.log(nonSystemTabs)

  return (
    <div
      ref={nodeOverlayToolbar}
      className={cn(
        styles.overlayToolbar,
        {
          [styles.mobileToolbar]: isNodeOverlayToolbar,
        },
        className
      )}
      {...anotherProps}
    >
      <div className={styles.inner}>
        <ToggleOverlay
          getNode={handleClickGetNodeOverlayToolbar}
          toggle={toggle}
          className="toggleOverlay"
        />

        <div className={styles.tabs}>
          <OverlayTab
            id="system"
            dap={allDapplet}
            source={nonSystemTabs[0]?.source}
            menu={menu}
            nameSelectedMenu={nameSelectedMenu}
            activeTab={true}
            onSelectedMenu={onSelectedMenu}
            onClick={handlerSelectedTab('system')}
            className={cn({ [styles.active]: true })}
            notification={false}
            title="System"
          />

          <div className={styles.TabList}>
            {nonSystemTabs.length > 0 &&
              nonSystemTabs.map(({ id, title, source }) => {
                const active = id === idActiveTab
                // console.log(active)

                return (
                  <OverlayTab
                    id={id}
                    dap={allDapplet}
                    source={source}
                    menu={[]}
                    key={id}
                    nameSelectedMenu={nameSelectedMenu}
                    activeTab={active}
                    isSystemDapplets={isSystemDapplets}
                    onSelectedMenu={onSelectedMenu}
                    removeTab={handlerRemoveTab(id)}
                    onClick={handlerSelectedTab(id)}
                    className={cn({ [styles.active]: active })}
                    notification={false}
                    title={title}
                    // image={uri}
                  />
                )
              })}
          </div>
        </div>
      </div>
    </div>
  )
}
