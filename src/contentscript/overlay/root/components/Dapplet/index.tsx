import cn from 'classnames'
import React, { DetailedHTMLProps, FC, HTMLAttributes, useEffect, useState } from 'react'
import { ManifestAndDetails } from '../../../../../common/types'
import { ReactComponent as Error } from '../../assets/icons/error.svg'
import { ReactComponent as CopiedIcon } from '../../assets/svg/copied.svg'
import { ReactComponent as CopyIcon } from '../../assets/svg/copyModal.svg'
import { ReactComponent as LoadingIcon } from '../../assets/svg/loaderCopy.svg'
import { ReactComponent as DeleteIcon } from '../../assets/svg/newDelete.svg'
import { ReactComponent as HomeIcon } from '../../assets/svg/newHome.svg'
import { ReactComponent as SearchIcon } from '../../assets/svg/newLinks.svg'
import { ReactComponent as SettingsIcon } from '../../assets/svg/newSettings.svg'
import { ReactComponent as OpenSeaIcon } from '../../assets/svg/opensea.svg'
import { createUserEnvInfo } from '../../utils/createUserEnvInfo'
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
  onOpenStoreAuthor: Function
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
    onOpenStoreAuthor,
    index,
    ...anotherProps
  } = props

  const {
    name,
    title,
    error,
    description,
    author,
    icon,
    isActive,
    isActionHandler,
    isUnderConstruction,
  } = dapplet

  const [loadHome, setLoadHome] = useState(false)
  const [copied, setCopied] = useState<LoadingState>(LoadingState.READY)

  const loadingHome = () => {
    setLoadHome(false)
  }

  const copyUserEnvInfo = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    setCopied(LoadingState.LOADING)
    e.preventDefault()
    e.stopPropagation()
    const userEnvInfo = await createUserEnvInfo(dapplet)
    navigator.clipboard.writeText(JSON.stringify(userEnvInfo))
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
      <DappletImage storageRef={icon} />

      <div className={cn(styles.wrapperBlock)}>
        <div className={styles.header}>
          <div
            className={cn(styles.blockTop, {
              [styles.errorTitle]: error,
            })}
          >
            {error ? (
              <span className={styles.errorIcon}>
                <Error />{' '}
              </span>
            ) : null}
            <DappletTitle isShowDescription={false} title={title}>
              {dapplet.sourceRegistry.isDev ? <div className={styles.isDev}>dev</div> : null}
            </DappletTitle>
            {!isUnderConstruction && (
              <div className={styles.loaderOrSwitchContainer}>
                {loadHome ? (
                  <div className={styles.loader}></div>
                ) : (
                  <Switch
                    className={isActive ? 'active-switch' : 'not-active-switch'}
                    checked={isActive}
                    onChange={(e) => {
                      onSwitchChange(dapplet, index, e['shiftKey'], loadingHome)
                      setLoadHome(true)
                    }}
                  />
                )}
              </div>
            )}
          </div>
          {error ? <span className={styles.moduleError}>{'Dapplet error'}</span> : null}

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
              value={author}
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
