import cn from 'classnames'
import React, { useEffect, useRef, useState } from 'react'
import { ManifestAndDetails } from '../../../../../common/types'
import { ReactComponent as SettingsIcon } from '../../assets/newIcon/dapset.svg'
import { PopupItem } from '../../components/PopupItem'
import { TabLoader } from '../../components/TabLoader'
import { Overlay } from '../../overlay'
import { OverlayManager } from '../../overlayManager'
import { getActualModules } from '../../utils/refreshModules'
import { DappletImage } from '../DappletImage'
import { DappletTitle } from '../DappletTitle'
import { SquaredButton } from '../SquaredButton'
import styles from './ContentItem.module.scss'

const OVERLAY_LOADING_TIMEOUT = 5000

enum LoadingMode {
  NotLoading,
  Loading,
  SlowLoading,
  NetworkError,
  ServerError,
  SslError,
}

interface IContentItemProps {
  overlay: Overlay
  isActive: boolean
  overlayManager: OverlayManager
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSettingsModule?: any
  // className: string
}

export const ContentItem = (props: IContentItemProps) => {
  const ref = useRef(null)
  const [updateFrame, changeUpdateFrame] = useState<boolean>(true)
  const [loadingMode, setloadingMode] = useState<LoadingMode>(LoadingMode.Loading)
  const [overlays, setOverlays] = useState<Overlay[]>()
  const [activeModuleInfo, setActiveModuleInfo] = useState<ManifestAndDetails>()

  useEffect(() => {
    const timeoutId = setTimeout(
      () => setloadingMode(LoadingMode.SlowLoading),
      OVERLAY_LOADING_TIMEOUT
    )

    const overlay = props.overlay
    overlay.checkAvailability()

    setloadingMode(LoadingMode.Loading)

    ref.current.appendChild(overlay.frame)

    const loadHandler = () => {
      clearTimeout(timeoutId)
      if (!overlay.isError) {
        setloadingMode(LoadingMode.NotLoading)
      }
      overlay.frame.removeEventListener('load', loadHandler)
    }
    overlay.frame.addEventListener('load', loadHandler)

    const networkErrorHandler = () => {
      clearTimeout(timeoutId)
      overlay.frame.remove()

      const { protocol, hostname } = new URL(overlay.url)
      if (protocol === 'https:' && (hostname === 'localhost' || hostname === '127.0.0.1')) {
        setloadingMode(LoadingMode.SslError)
      } else {
        setloadingMode(LoadingMode.NetworkError)
      }

      overlay.frame.removeEventListener('error_network', networkErrorHandler)
    }
    overlay.frame.addEventListener('error_network', networkErrorHandler)

    const serverErrorHandler = () => {
      clearTimeout(timeoutId)
      overlay.frame.remove()
      setloadingMode(LoadingMode.ServerError)
      overlay.frame.removeEventListener('error_server', serverErrorHandler)
    }
    overlay.frame.addEventListener('error_server', serverErrorHandler)
    setOverlays(props.overlayManager.getOverlays())
    const current = ref.current
    return () => current.removeChild(props.overlay.frame)
  }, [props.overlay, props.overlayManager, updateFrame])

  useEffect(() => {
    ;(async () => {
      if (!activeModuleInfo) {
        try {
          const actualModules = await getActualModules()
          const actualModule = actualModules?.find((x) => x.name === props.overlay.source)
          setActiveModuleInfo(actualModule)
        } catch (err) {
          console.log(err)
        }
      }
    })()
  }, [activeModuleInfo, props.overlay.source])

  return (
    <div
      className={cn(styles.contentItem, {
        [styles.contentItemActive]: props.isActive,
      })}
    >
      {loadingMode === LoadingMode.Loading && (
        // <div className="loader-container">
        //   <div className="flex">
        //     <div className="loader"></div>
        //   </div>
        //   <div className="load-text">Loading Overlay...</div>
        //   <div className="load-text">
        //     Downloading from decentralized sources like Swarm or IPFS can take some time
        //   </div>
        // </div>
        <TabLoader />
      )}

      {loadingMode === LoadingMode.SlowLoading && (
        // <div className="loader-container">
        //   <div className="flex">
        //     <div className="loader"></div>
        //   </div>
        //   <div className="load-text">Loading Overlay...</div>
        //   <div className="load-text">The overlay it is taking a while to load.</div>
        //   <div className="load-text-desc">
        //     If the overlay does not load, try changing your preferred overlay storage in the
        //     extension settings.
        //   </div>
        // </div>
        <TabLoader />
      )}

      {loadingMode === LoadingMode.NetworkError && (
        <div className={styles.loaderContainer}>
          <div className={styles.loadTitle}>No Internet Connection</div>
          <div className={styles.loadText}>Please check your internet connection and try again</div>
          <div className={styles.loadButtonBlock}>
            <button className={styles.loadButton} onClick={() => changeUpdateFrame(!updateFrame)}>
              Try again
            </button>
          </div>
        </div>
      )}

      {loadingMode === LoadingMode.ServerError && (
        <div className={styles.loaderContainer}>
          <div className={styles.loadTitle}>Internal Server Error</div>
          <div className={styles.loadText}>
            Sorry, there were some technical issues while processing your request. You can change
            preferred overlay storage and try again.
          </div>
          <div className={styles.loadButtonBlock}>
            <button className={styles.loadButton} onClick={() => changeUpdateFrame(!updateFrame)}>
              Try again
            </button>
          </div>
        </div>
      )}

      {loadingMode === LoadingMode.SslError && (
        <div className={styles.loaderContainer}>
          <div className={styles.loadTitle}>Unverified SSL Certificate</div>
          <div className={styles.loadText}>
            <p>
              If you are a dapplet developer and you are running the overlay over HTTPS, you may
              encounter an untrusted SSL certificate error. Open the overlay in a new browser tab
              and accept the self-signed certificate.
            </p>
          </div>
          <div className={styles.loadButtonBlock}>
            <button
              className={styles.loadButton}
              onClick={() => {
                const overlay = props.overlay
                window.open(overlay.url, '_blank')
              }}
            >
              Accept SSL
            </button>
          </div>
          <div className={styles.loadText}>
            <p>
              If you are not developing dapplets, then you should beware, your Internet connection
              may be broken.
            </p>
          </div>
          <div className={styles.loadButtonBlock}>
            <button className={styles.loadButton} onClick={() => changeUpdateFrame(!updateFrame)}>
              Try again
            </button>
          </div>
        </div>
      )}

      <div style={{ display: loadingMode === LoadingMode.NotLoading ? undefined : 'none' }}>
        {activeModuleInfo && (
          <div className={cn(styles.wrapperCard)}>
            <div className={cn(styles.leftBlock)}>
              <DappletImage storageRef={activeModuleInfo.icon} className={styles.imgBlock} />

              <DappletTitle
                className={styles.title}
                isShowDescription={false}
                title={activeModuleInfo.title}
              ></DappletTitle>
            </div>

            <div className={styles.blockButtons}>
              <SquaredButton
                appearance="smail"
                icon={SettingsIcon}
                className={styles.squareButton}
                title="Settings"
                onClick={() => props.onSettingsModule(activeModuleInfo)}
              />
            </div>
          </div>
        )}
        <div className={styles.frameContainer} ref={ref}></div>
      </div>

      {overlays
        ?.filter((x) => x.parent === props.overlay)
        .map((x) => (
          <PopupItem key={x.id} overlay={x} />
        ))}
    </div>
  )
}
