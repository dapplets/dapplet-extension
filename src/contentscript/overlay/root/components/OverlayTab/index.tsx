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
import { ManifestAndDetails } from '../../../../../popup/components/dapplet'
import { StorageRef } from '../../../../../background/registries/registry'

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
    ...anotherProps
  } = props

  const [imgActiveTab, setImgActiveTab] = useState<StorageRef>(null)

  useEffect(() => {
    _isMounted = true
    // const init = async () => {
    const dapplet = dap.find((x) => x.name === source)
    if (dapplet) {
      setImgActiveTab(dapplet.icon)
    }

    // dap.map((x, i) => {
    //   if (x.name === source) {
    //     setImgActiveTab(x.icon)
    //   } else {
    //     return
    //   }
    // })
    // }
    // init()

    return () => {
      _isMounted = false
    }
  }, [imgActiveTab])

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
      onClick={() => {
        // console.log(imgActiveTab)
        // console.log(dap)
        console.log(activeTab)
      }}
    >
      <div className={styles.top}>
        {/* {imgActiveTab === null? } */}
        <StorageRefImage
          onClick={onClick}
          className={cn(styles.image, { [styles.cursor]: !activeTab })}
          storageRef={imgActiveTab}
        />
        {showRemoveTab && (
          <Close className={styles.close} onClick={removeTab} />
        )}
      </div>

      {showMenu && (
        <ul className={styles.list}>
          {menu &&
            menu.map(({ _id, icon: Icon, title }) => {
              return (
                <li
                  key={_id}
                  title={title}
                  onClick={handlerClick(title)}
                  className={cn(styles.item, {
                    [styles.notification]: notification,
                    [styles.notificationSetting]: notificationSetting,
                    [styles.selected]: nameSelectedMenu === title,
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
