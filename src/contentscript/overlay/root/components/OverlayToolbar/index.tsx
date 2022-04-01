import React, {
  DetailedHTMLProps,
  HTMLAttributes,
  ReactElement,
  useEffect,
  useMemo,
  useRef,
} from 'react'
import styles from './OverlayToolbar.module.scss'
import { OverlayTab } from '../OverlayTab'
import cn from 'classnames'
import { ReactComponent as Coolicon } from '../../assets/svg/coolicon.svg'
import { ITab } from '../../types/tab'
import { IMenu } from '../../models/menu.model'
import { Overlay } from '../../overlay'

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
  clN?: () => void
}

const ToggleOverlay = ({
  toggle,
  className,
  clN,
}: // clN,

TToggleOverlay): ReactElement => {
  const nodeButton = useRef<HTMLInputElement>()
  // const onClick = (e) => {
  //   const parent = e.target.parentNode.getBoundingClientRect()
  //   const element = e.target.getBoundingClientRect()

  //   const x = element.left - parent.left
  //   const y = element.top - parent.top
  //   if (x > 1 || y > 1) {
  //     clN = true
  //   } else {
  //     clN = false
  //   }
  //   console.log(clN)

  //   console.log(x, y)
  // }

  return (
    <button
      className={cn(styles.toggleOverlay, className)}
      onClick={() => {
        toggle()
        clN()
      }}
    >
      <Coolicon />
    </button>
  )
}

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

  const handlerSelectedTab = (id: string) => (): void => onSelectedTab(id)
  const handlerRemoveTab = (id: string) => (): void => onRemoveTab(id)
  const nonSystemTabs = tabs.filter((x) => !x.uri.includes('/popup.html#'))
  const nodeButton = useRef<HTMLInputElement>()
  useEffect(() => {
    if (!activeOverlay) return
    const noSystem = !activeOverlay.uri.includes('/popup.html#')
    if (noSystem) onOverlayTab()
  }, [activeOverlay, nodeButton])
  const handleClick = () => {
    if (nodeButton && nodeButton.current) {
      nodeButton.current.value = ''
      const parent = nodeButton.current.getBoundingClientRect()
      const element = nodeButton.current.getBoundingClientRect()

      const x = element.x
      const y = element.top - parent.top

      console.log(x)
      if (x < 30) {
        nodeButton.current.classList.add('mini')
      } else {
        nodeButton.current.classList.remove('mini')
      }
    }
  }
  const nodeButtonMemo = useMemo(() => {}, [nodeButton])
  return (
    <div
      ref={nodeButton}
      className={cn(styles.overlayToolbar, className)}
      {...anotherProps}
    >
      <div className={styles.inner}>
        <ToggleOverlay
          clN={handleClick}
          toggle={toggle}
          className="toggleOverlay"
        />

        <div className={styles.tabs}>
          <OverlayTab
            id="system"
            menu={menu}
            nameSelectedMenu={nameSelectedMenu}
            activeTab={true}
            onSelectedMenu={onSelectedMenu}
            onClick={handlerSelectedTab('system')}
            className={cn({ [styles.active]: true })}
            notification={false}
            title="System"
          />

          <>
            {nonSystemTabs.length > 0 &&
              nonSystemTabs.map(({ id, title }) => {
                const active = id === idActiveTab

                return (
                  <OverlayTab
                    id={id}
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
                  />
                )
              })}
          </>
        </div>
      </div>
    </div>
  )
}
