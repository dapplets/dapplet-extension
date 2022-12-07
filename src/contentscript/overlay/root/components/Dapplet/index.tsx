import { initBGFunctions } from 'chrome-extension-message-wrapper'
import cn from 'classnames'
import React, { DetailedHTMLProps, FC, HTMLAttributes, useEffect, useState } from 'react'
import { browser } from 'webextension-polyfill-ts'
import { ManifestAndDetails } from '../../../../../popup/components/dapplet'
import { ReactComponent as DeleteIcon } from '../../assets/svg/newDelete.svg'
import { ReactComponent as HomeIcon } from '../../assets/svg/newHome.svg'
import { ReactComponent as SearchIcon } from '../../assets/svg/newLinks.svg'
import { ReactComponent as SettingsIcon } from '../../assets/svg/newSettings.svg'
import useAbortController from '../../hooks/useAbortController'
import { DappletImage } from '../DappletImage'
import { DappletInfo } from '../DappletInfo'
import { DappletTitle } from '../DappletTitle'
import { SquaredButton } from '../SquaredButton'
import { Switch } from '../Switch'
import styles from './Dapplet.module.scss'
// TODO: How will the dapplets be displayed during development?

export interface DappletProps
  extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
  dapplet: ManifestAndDetails & {
    users: any[]
    website: string
    isFavourites: boolean
  }
  index?: any
  onSwitchChange: Function
  onSettingsModule: (x: any) => void
  onOpenDappletAction: (dapplet: any) => void
  onRemoveMyDapplet?: (x: any) => void
  onDeployDapplet: Function
  onOpenStore: (x: any) => void
  loadShowButton: boolean
  onOpenStoreAuthor: Function
  getTabsForDapplet?: any
}

export const Dapplet: FC<DappletProps> = (props: DappletProps) => {
  const {
    dapplet,
    className,
    onSwitchChange,
    onSettingsModule,
    onOpenDappletAction,
    onRemoveMyDapplet,
    onDeployDapplet,
    onOpenStore,
    loadShowButton,
    onOpenStoreAuthor,
    index,
    getTabsForDapplet,
    ...anotherProps
  } = props

  const { name, title, description, author, icon, isActive, isActionHandler, isUnderConstruction } =
    dapplet

  const [loadHome, setLoadHome] = useState(false)
  const [registryActive, setRegistryActive] = useState(null)
  const [owner, setOwner] = useState(null)
  const abortController = useAbortController()
  useEffect(() => {
    const init = async () => {
      // if (!abortController.signal.aborted) {
      await updateData()
      // }
    }
    init()
    return () => {
      // abortController.abort()
    }
  }, [loadHome, abortController.signal.aborted])
  const loadingHome = () => {
    setLoadHome(false)
  }

  const updateData = async () => {
    const { getRegistries, getOwnership } = await initBGFunctions(browser)
    const registries = await getRegistries()

    const newRegistries = registries
      .filter((r) => r.isDev === false && r.isEnabled !== false)
      .map((x, i) => x.url)
    if (!abortController.signal.aborted) {
      setRegistryActive(newRegistries[0])
    }

    const newOwner = await getOwnership(newRegistries[0], name)
    if (!abortController.signal.aborted) {
      setOwner(newOwner)
    }
    // if (isActive) getTabsForDapplet(dapplet)
  }

  return (
    <div className={cn(styles.wrapperCard, className)} {...anotherProps}>
      <DappletImage isFavourites={false} storageRef={icon} />

      <div className={cn(styles.wrapperBlock)}>
        <div className={styles.header}>
          <div className={cn(styles.blockTop)}>
            <DappletTitle isShowDescription={false} title={title}>
              {dapplet.sourceRegistry.isDev && <span className={styles.isDev}>dev</span>}
            </DappletTitle>

            <div className={cn(styles.blockIcons)}></div>

            {!isUnderConstruction && (
              <>
                {loadHome ? (
                  <span className={styles.loader}></span>
                ) : (
                  <Switch
                    className={isActive ? 'active-switch' : 'not-active-switch'}
                    checked={isActive}
                    onChange={(e) => {
                      onSwitchChange(dapplet, !isActive, index, e['shiftKey'], loadingHome)
                      setLoadHome(true)
                    }}
                  />
                )}
              </>
            )}
          </div>

          <div className={cn(styles.blockText)}>{description}</div>
        </div>

        <div className={cn(styles.blockBottom)}>
          <div className={cn(styles.firstButtons)}>
            {isActive && isActionHandler ? (
              <div className={styles.blockButtons}>
                <SquaredButton
                  appearance="smail"
                  icon={HomeIcon}
                  className={styles.squareButton}
                  title="Home"
                  onClick={() => onOpenDappletAction(dapplet)}
                />
              </div>
            ) : null}

            {!isUnderConstruction && (
              <div className={styles.blockButtons}>
                <SquaredButton
                  appearance="smail"
                  icon={SettingsIcon}
                  className={styles.squareButton}
                  title="Settings"
                  onClick={() => onSettingsModule(dapplet)}
                />
              </div>
            )}

            <div className={styles.blockButtons}>
              <SquaredButton
                appearance="smail"
                icon={SearchIcon}
                className={styles.squareButton}
                title="Dapplet in the Store"
                onClick={() => onOpenStore(dapplet)}
              />
            </div>

            <DappletInfo
              title="Owner"
              value={dapplet.sourceRegistry.isDev ? owner : author}
              className={styles.cardInfo}
              onClick={() => onOpenStoreAuthor(dapplet)}
            />
          </div>

          <div className={cn(styles.lastButton)}>
            {dapplet.isMyDapplet && (
              <SquaredButton
                appearance="smail"
                icon={DeleteIcon}
                title="Delete"
                onClick={() => onRemoveMyDapplet(dapplet)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
