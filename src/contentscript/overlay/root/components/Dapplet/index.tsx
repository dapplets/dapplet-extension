import { initBGFunctions } from 'chrome-extension-message-wrapper'
import cn from 'classnames'
import React, { DetailedHTMLProps, FC, HTMLAttributes, useEffect, useState } from 'react'
import { browser } from 'webextension-polyfill-ts'
import { getRegistriesInfo } from '../../../..'
import { ManifestAndDetails } from '../../../../../common/types'
import { ReactComponent as CopiedIcon } from '../../assets/svg/copied.svg'
import { ReactComponent as CopyIcon } from '../../assets/svg/copyModal.svg'
import { ReactComponent as LoadingIcon } from '../../assets/svg/loaderCopy.svg'
import { ReactComponent as DeleteIcon } from '../../assets/svg/newDelete.svg'
import { ReactComponent as HomeIcon } from '../../assets/svg/newHome.svg'
import { ReactComponent as SearchIcon } from '../../assets/svg/newLinks.svg'
import { ReactComponent as SettingsIcon } from '../../assets/svg/newSettings.svg'
import { ReactComponent as OpenSeaIcon } from '../../assets/svg/opensea.svg'
import useAbortController from '../../hooks/useAbortController'
import { DappletImage } from '../DappletImage'
import { DappletInfo } from '../DappletInfo'
import { DappletTitle } from '../DappletTitle'
import { SquaredButton } from '../SquaredButton'
import { Switch } from '../Switch'
import styles from './Dapplet.module.scss'

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
  onOpenStore: (x: any) => void
  onOpenNft: (x: any) => void
  loadShowButton: boolean
  onOpenStoreAuthor: Function
  getTabsForDapplet?: any
}

enum LoadingState {
  LOADING,
  LOADED,
  READY,
}

export const Dapplet: FC<DappletProps> = (props: DappletProps) => {
  const {
    dapplet,
    className,
    onSwitchChange,
    onSettingsModule,
    onOpenDappletAction,
    onRemoveMyDapplet,
    onOpenStore,
    onOpenNft,
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
  const [copied, setCopied] = useState<LoadingState>(LoadingState.READY)
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

  const copyUserEnvInfo = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    setCopied(LoadingState.LOADING)
    e.preventDefault()
    e.stopPropagation()
    const { getUserAgentName } = await initBGFunctions(browser)
    const userAgentNameInput = await getUserAgentName()
    // console.log('=== dapplet ===', dapplet)
    const registries = getRegistriesInfo()
    // console.log('=!!!!= registries =!!!!=', registries)
    const activeAdaptersInfo = registries.filter((m) => m.manifest.type === 'ADAPTER')
    // console.log('=!!!!= activeAdaptersInfo =!!!!=', activeAdaptersInfo)
    const { userAgent, platform } = window.navigator
    const result = {
      dapplet: {
        name: dapplet.name,
        userVersion: dapplet.activeVersion,
        lastVersion: dapplet.lastVersion,
        author: dapplet.author,
        registry: dapplet.sourceRegistry.url,
      },
      context: dapplet.hostnames,
      extension: EXTENSION_VERSION,
      browser: userAgent,
      system: platform,
      userAgent: userAgentNameInput,
      activeAdapters: activeAdaptersInfo.map((a) => ({
        name: a.manifest.name,
        version: a.manifest.version,
      })),
    }
    navigator.clipboard.writeText(JSON.stringify(result))
    setCopied(LoadingState.LOADED)
  }

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => {
        setCopied(LoadingState.READY)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [copied])

  return (
    <div className={cn(styles.wrapperCard, className)} data-testid={name} {...anotherProps}>
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

            <div className={styles.blockButtons}>
              <SquaredButton
                appearance="smail"
                icon={OpenSeaIcon}
                className={styles.squareButton}
                title="NFT at OpenSea"
                onClick={() => onOpenNft(dapplet)}
              />
            </div>

            <div className={styles.blockButtons}>
              <SquaredButton
                appearance="smail"
                icon={
                  copied === LoadingState.READY
                    ? CopyIcon
                    : copied === LoadingState.LOADING
                    ? LoadingIcon
                    : CopiedIcon
                }
                disabled={copied !== LoadingState.READY}
                className={styles.squareButton}
                title="Copy the environment info"
                onClick={copyUserEnvInfo}
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
