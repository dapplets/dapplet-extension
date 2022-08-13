import cn from 'classnames'
import React, { DetailedHTMLProps, FC, HTMLAttributes, useEffect, useState } from 'react'
import { ManifestAndDetails } from '../../../../../popup/components/dapplet'
import { ReactComponent as DeleteIcon } from '../../assets/svg/newDelete.svg'
import { ReactComponent as HomeIcon } from '../../assets/svg/newHome.svg'
import { ReactComponent as SearchIcon } from '../../assets/svg/newLinks.svg'
import { ReactComponent as SettingsIcon } from '../../assets/svg/newSettings.svg'
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
  onSettingsModule: Function
  onOpenDappletAction: any
  onRemoveMyDapplet?: Function
  onDeployDapplet: Function
  onOpenStore: Function
  loadShowButton: boolean
  onOpenStoreAuthor: Function
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
    ...anotherProps
  } = props

  const { title, description, author, icon, isActive, isActionHandler, isUnderConstruction } =
    dapplet

  const [loadHome, setLoadHome] = useState(false)
  useEffect(() => {}, [loadHome])
  const loadingHome = () => {
    setLoadHome(false)
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
                    // className={loadShowButton ? styles.loadShowButton : ''}
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
