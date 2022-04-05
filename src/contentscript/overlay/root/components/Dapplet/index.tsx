import React, { FC, DetailedHTMLProps, HTMLAttributes } from 'react'
import cn from 'classnames'
import styles from './Dapplet.module.scss'
import { DappletImage } from '../DappletImage'
import { Icon } from '../Icon'
import { Switch } from '../Switch'
import { SquaredButton } from '../SquaredButton'
import { DappletTitle } from '../DappletTitle'
import { DappletInfo } from '../DappletInfo'
import { ReactComponent as Installed } from '../../assets/icons/installed.svg'
import { ReactComponent as Update } from '../../assets/icons/update.svg'
import { ReactComponent as HomeIcon } from '../../assets/svg/home.svg'
import { ReactComponent as SettingsIcon } from '../../assets/svg/settings.svg'
import { ReactComponent as CloudsIcon } from '../../assets/svg/clouds.svg'
import { ReactComponent as SearchIcon } from '../../assets/svg/search.svg'
import { ReactComponent as DeleteIcon } from '../../assets/svg/delete.svg'
import { useToggle } from '../../hooks/useToggle'
import { Avatar } from '../Avatar'
import { ManifestAndDetails } from '../../../../../popup/components/dapplet'

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
}

export const Dapplet: FC<DappletProps> = (props: DappletProps) => {
  const [isShowDescription, onShowDescription] = useToggle(false)
  const {
    dapplet,
    className,
    onSwitchChange,
    onSettingsModule,
    onOpenDappletAction,
    onRemoveMyDapplet: onRemoveDapplet,
    onDeployDapplet,
    onOpenStore,
    ...anotherProps
  } = props
  const {
    title,
    description,
    users,
    author,
    website,
    isFavourites,
    icon,
    isActive,
    isActionHandler,
    isUnderConstruction,
    sourceRegistry,
  } = dapplet

  return (
    <div className={cn(styles.wrapperCard, className)} {...anotherProps}>
      <DappletImage isFavourites={isFavourites} storageRef={icon} />

      <div className={cn(styles.wrapperBlock)}>
        <div className={styles.header} onClick={onShowDescription}>
          <div className={cn(styles.blockTop)}>
            <DappletTitle isShowDescription={isShowDescription} title={title} />

            <div className={cn(styles.blockIcons)}>
              <Icon size="small" icon={Installed} />
              <Icon size="small" icon={Update} />
            </div>

            {!isUnderConstruction && (
              <Switch
                checked={isActive}
                onChange={() => onSwitchChange(dapplet, !isActive)}
              />
            )}
          </div>

          <div className={cn(styles.blockText)}>{description}</div>
        </div>

        {isShowDescription && (
          <div className={styles.description}>
            <div className={styles.descriptionTop}>
              {users && (
                <>
                  <div className={styles.avatars}>
                    <ul className={styles.avatarsList}>
                      {users.slice(0, 3).map(({ _id, avatar }) => {
                        return (
                          <li className={styles.avatarsItem} key={_id}>
                            <Avatar avatar={avatar} size="small" />
                          </li>
                        )
                      })}
                    </ul>
                    <span className={styles.avatarsAnother}>
                      +{users.length} more lists
                    </span>
                  </div>
                </>
              )}
              {users && (
                <p className={styles.activeUsers}>
                  {users.length} active users
                </p>
              )}
            </div>
            <div className={styles.descriptionBottom}>
              {author && <DappletInfo title="Author" value={author} />}
              {website && (
                <DappletInfo
                  title="Website"
                  value={website}
                  appearance="link"
                />
              )}
            </div>
          </div>
        )}

        <div className={cn(styles.blockBottom)}>
          <div className={cn(styles.firstButtons)}>
            {isActive && isActionHandler && (
              <SquaredButton
                appearance="smail"
                icon={HomeIcon}
                className={styles.squareButton}
                title="Home"
                onClick={() => onOpenDappletAction(dapplet)}
              />
            )}
            {!isUnderConstruction && (
              <SquaredButton
                appearance="smail"
                icon={SettingsIcon}
                className={styles.squareButton}
                title="Settings"
                onClick={() => onSettingsModule(dapplet)}
              />
            )}
          
            <SquaredButton
              appearance="smail"
              icon={SearchIcon}
              className={styles.squareButton}
              title="Search"
              onClick={() => onOpenStore(dapplet)}
            />

            {isActive && sourceRegistry?.isDev && (
              <SquaredButton
                appearance="smail"
                icon={CloudsIcon}
                className={styles.squareButton}
                title="Clouds"
                onClick={() => onDeployDapplet(dapplet)}
              />
            )}

            {/* NO BUTTON */}
            {!isShowDescription && (
              <DappletInfo
                title="Author"
                value={author}
                className={styles.cardInfo}
              />
            )}
          </div>

          <div className={cn(styles.lastButton)}>
            {onRemoveDapplet && (
              <SquaredButton
                appearance="smail"
                icon={DeleteIcon}
                title="Delete"
                onClick={() => onRemoveDapplet(dapplet)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
