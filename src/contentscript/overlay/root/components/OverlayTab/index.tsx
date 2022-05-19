import React, {
  DetailedHTMLProps,
  HTMLAttributes,
  ReactElement,
  useEffect,
  useState,
} from 'react'
import styles from './OverlayTab.module.scss'

import { ReactComponent as Close } from '../../assets/svg/close.svg'

import cn from 'classnames'
import { IMenu } from '../../models/menu.model'
import { StorageRefImage } from '../DevModulesList'
import { browser } from 'webextension-polyfill-ts'
import { initBGFunctions } from 'chrome-extension-message-wrapper'
import { ManifestAndDetails } from '../../../../../popup/components/dapplet'
import { StorageRef } from '../../../../../background/registries/registry'
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useParams,
  MemoryRouter,
  useNavigate,
  useLocation,
} from 'react-router-dom'

export interface OverlayTabProps
  extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
  activeTab?: boolean
  nameSelectedMenu?: string
  image?: any
  notification?: boolean
  menu: IMenu[]
  notificationSetting?: boolean
  isSystemDapplets?: boolean
  onSelectedMenu: (selected: string) => void
  removeTab?: () => void
  source?: string
  dap?: any
  idActiveTab?: string
}
let _isMounted = false
export const OverlayTab = (props: OverlayTabProps): ReactElement => {
  const {
    activeTab,
    image,
    id,
    nameSelectedMenu,
    notification,
    notificationSetting,
    className,
    menu,
    isSystemDapplets,
    onSelectedMenu,
    onClick,
    removeTab,
    source,
    dap,
    idActiveTab,
    ...anotherProps
  } = props

  const [imgActiveTab, setImgActiveTab] = useState<StorageRef>(null)
  const navigate = useNavigate()
  const [devMode, setMode] = useState(false)
  const location = useLocation()

  // const [toggleSystemMenu, setToggleSystemMenu] = useState(true)
  useEffect(() => {
    _isMounted = true
    // const init = async () => {
    const dapplet = dap.find((x) => x.name === source)
    if (dapplet) {
      setImgActiveTab(dapplet.icon)
    }
    // await loadDevMode()
    // setToggleSystemMenu(!showMenu)
    // }
    // init()

    return () => {
      _isMounted = false
    }
  }, [imgActiveTab])
  // console.log(toggleSystemMenu)

  const loadDevMode = async () => {
    // setSvgLoaderDevMode(true)

    const { getDevMode } = await initBGFunctions(browser)
    const devMode = await getDevMode()
    setMode(devMode)
    // setTimeout(() => setSvgLoaderDevMode(false), 500)
  }

  const handlerClick = (title: string) => (): void =>
    nameSelectedMenu !== title && onSelectedMenu(title)

  const showRemoveTab =
    (!activeTab || (activeTab && isSystemDapplets)) &&
    typeof removeTab !== 'undefined'
  const showMenu = activeTab && !isSystemDapplets && menu && menu.length > 0

  return (
    <div
      className={cn(styles.tab, className, {
        [styles.tabNotActive]: !activeTab,
      })}
      {...anotherProps}
    >
      {id !== 'system' ? (
        <div className={styles.top}>
          <StorageRefImage
            onClick={() => {
              console.log(location, 'l')

              console.log(id, 'id')
              console.log(idActiveTab, 'at')

              // if (location.pathname !== `/tab/${id}`) {
              navigate(`/tab/${id}`)
              console.log(navigate(`/tab/${id}`))
              // }

              // if (imgActiveTab !== null) {
              //   navigate(`/:dapplet_id`)
              // }
              // if (imgActiveTab !== null) {
              //   navigate(`/:dapplet_id/system`)
              // }
            }}
            className={cn(styles.image, { [styles.cursor]: !activeTab })}
            storageRef={imgActiveTab}
          />
          {/* {showRemoveTab && ( */}
          <Close
            className={styles.close}
            onClick={() => {
              // navigate(`/`)
              removeTab()
            }}
          />
          {/* )} */}
        </div>
      ) : (
        <div
          onClick={() => {
            console.log(location, 'l')

            console.log(id, 'id')
            console.log(idActiveTab, 'at')
          }}
          className={cn(styles.image, { [styles.cursor]: !activeTab })}
        ></div>
      )}

      {showMenu && (
        <ul className={styles.list}>
          {menu &&
            menu.map(({ _id, icon: Icon, title, route }) => {
              return (
                <li
                  key={_id}
                  title={title}
                  onClick={() => {
                    handlerClick(title)
                    if (title !== 'Dapplets') {
                      navigate(`/${title.toLowerCase()}`)
                    } else if (title === 'Dapplets') {
                      navigate(`/`)
                    }
                    // else if (title === 'User Settings') {
                    //   navigate(`/:dapplet_id/settings`)
                    // } else {
                    //   navigate(`/:dapplet_id`)
                    // }
                  }}
                  className={cn(styles.item, {
                    [styles.notification]: notification,
                    [styles.notificationSetting]: notificationSetting,
                    [styles.selected]: route === location.pathname,
                  })}
                >
                  <Icon className={styles.icon} />
                </li>
              )
            })}
        </ul>
      )}
    </div>
  )
}
