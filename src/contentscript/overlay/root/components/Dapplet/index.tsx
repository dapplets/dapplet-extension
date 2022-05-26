import cn from 'classnames'
import React, { DetailedHTMLProps, FC, HTMLAttributes } from 'react'
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

  onSwitchChange: Function
  onSettingsModule: Function
  onOpenDappletAction: Function
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
    ...anotherProps
  } = props

  const { title, description, author, icon, isActive, isActionHandler, isUnderConstruction } =
    dapplet

  return (
    <div className={cn(styles.wrapperCard, className)} {...anotherProps}>
      <DappletImage isFavourites={false} storageRef={icon} />

      <div className={cn(styles.wrapperBlock)}>
        <div className={styles.header}>
          <div className={cn(styles.blockTop)}>
            <DappletTitle isShowDescription={false} title={title} />

            <div className={cn(styles.blockIcons)}>
              {/* <Icon size="small" icon={Installed} />
                          <Icon size="small" icon={Update} />  */}
            </div>

            {!isUnderConstruction && (
              <Switch
                checked={isActive}
                onChange={() => {
                  onSwitchChange(dapplet, !isActive)
                }}
              />
            )}
          </div>

          <div className={cn(styles.blockText)}>{description}</div>
        </div>

        <div className={cn(styles.blockBottom)}>
          <div className={cn(styles.firstButtons)}>
            {isActive && isActionHandler ? (
              <SquaredButton
                appearance="smail"
                icon={HomeIcon}
                className={styles.squareButton}
                title="Home"
                onClick={() => {
                  onOpenDappletAction(dapplet)
                }}
              />
            ) : null}
            {!isUnderConstruction && (
              <SquaredButton
                appearance="smail"
                icon={SettingsIcon}
                className={styles.squareButton}
                title="Settings"
                onClick={() => {
                  onSettingsModule(dapplet)
                }}
              />
            )}

            <SquaredButton
              appearance="smail"
              icon={SearchIcon}
              className={styles.squareButton}
              title="Search"
              onClick={() => {
                onOpenStore(dapplet)
              }}
            />

            <DappletInfo
              title="Author"
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
