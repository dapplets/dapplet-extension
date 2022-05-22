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
import { useNavigate } from 'react-router-dom'
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
  menuActiveTabs?: IMenu[]
  nameActiveTab?: string
  onSelectedActiveMenu?: (selected: string) => void
}

type TToggleOverlay = Pick<OverlayToolbarProps, 'toggle'> & {
  className?: string
  getNode?: () => void
}

const ToggleOverlay = ({
  toggle,
  className,
  getNode,
}: TToggleOverlay): ReactElement => {
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
    menuActiveTabs,
    nameActiveTab,
    onSelectedActiveMenu,
    ...anotherProps
  } = props

  const [allDapplet, setAllDapplet] = useState<ManifestAndDetails[]>([])

  const handlerSelectedTab = (id: string) => (): void => onSelectedTab(id)
  const handlerRemoveTab = (id: string) => (): void => onRemoveTab(id)

  const nonSystemTabs = tabs //.filter((x) => !x.uri.includes('/popup.html#'))

  const nodeOverlayToolbar = useRef<HTMLInputElement>()
  const [isNodeOverlayToolbar, setNodeOverlayToolbar] = useState(false)
  const [isActiveSystemTabs, setActiveSystemTabs] = useState(false)

  useEffect(() => {
    _isMounted = true
    const init = async () => {
      const { getFeaturesByHostnames, getCurrentContextIds, getThisTab } =
        await initBGFunctions(browser)
      const currentTab = await getThisTab()
      const ids = await getCurrentContextIds(currentTab)
      const d = await getFeaturesByHostnames(ids)
      setAllDapplet(d)
      // console.log(location.pathname.includes('/tab', 0))
      // console.log(location.pathname)
    }
    init()
    // console.log(isActiveSystemTabs, 'iast')
    // console.log(location.pathname, 'lp')
    // console.log(isSystemDapplets, 'isD')

    if (!activeOverlay) return
    const noSystem = !activeOverlay.uri.includes('/popup.html#')
    if (noSystem) onOverlayTab()
    return () => {
      _isMounted = false
    }
  }, [
    activeOverlay,
    nodeOverlayToolbar,
    isNodeOverlayToolbar,
    nameActiveTab,
    idActiveTab,
    isActiveSystemTabs,
    location.pathname,
  ])
  // console.log(location.pathname.includes(idActiveTab), 'locat')

  const handleClickGetNodeOverlayToolbar = () => {
    if (nodeOverlayToolbar && nodeOverlayToolbar.current) {
      nodeOverlayToolbar.current.value = ''

      const element = nodeOverlayToolbar.current.getBoundingClientRect()

      const x = element.x

      if (x > 10 && x < 100) {
        setNodeOverlayToolbar(true)
      } else {
        setNodeOverlayToolbar(false)
      }
    }
  }
  const nodeButtonMemo = useMemo(() => {}, [
    nodeOverlayToolbar,
    isNodeOverlayToolbar,
  ])
  // console.log(nameActiveTab)
  // console.log(idActiveTab)

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

        <div className={cn(styles.tabs, {})}>
          <OverlayTab
            id="system"
            dap={allDapplet}
            source={nonSystemTabs[0]?.source}
            menu={menu}
            nameSelectedMenu={nameSelectedMenu}
            activeTab={true}
            idActiveTab={idActiveTab}
            onSelectedMenu={onSelectedMenu}
            onClick={handlerSelectedTab('system')}
            className={cn({
              [styles.active]: true,
              [styles.noActive]:
                isActiveSystemTabs && location.pathname !== '/',
            })}
            notification={false}
            title="System"
            setActiveSystemTabs={setActiveSystemTabs}
          />

          <div className={styles.TabList}>
            {nonSystemTabs.length > 0 &&
              nonSystemTabs.map(({ id, title, source }) => {
                const active = id === idActiveTab

                return (
                  <OverlayTab
                    id={id}
                    dap={allDapplet}
                    source={source}
                    menu={[]}
                    key={id}
                    idActiveTab={idActiveTab}
                    nameSelectedMenu={nameSelectedMenu}
                    activeTab={active}
                    isSystemDapplets={isSystemDapplets}
                    // nameActiveTab={nameActiveTab}
                    // onSelectedActiveMenu={onSelectedActiveMenu}
                    onSelectedMenu={onSelectedMenu}
                    removeTab={handlerRemoveTab(id)}
                    onClick={handlerSelectedTab(id)}
                    className={cn({ [styles.active]: active })}
                    notification={false}
                    title={title}
                    setActiveSystemTabs={setActiveSystemTabs}
                  />
                )
              })}
          </div>
        </div>
      </div>
    </div>
  )
}
