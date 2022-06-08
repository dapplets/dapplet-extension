import cn from 'classnames'
import * as React from 'react'
import { TabLoader } from '../../components/TabLoader'
import { Overlay } from '../../overlay'
import { OverlayManager } from '../../overlayManager'
import { PopupItem } from '../../PopupItem'
import styles from './ContentItem.module.scss'

const OVERLAY_LOADING_TIMEOUT = 5000

enum LoadingMode {
  NotLoading = 0,
  Loading = 1,
  SlowLoading = 2,
  NetworkError = 3,
  ServerError = 4,
  SslError = 5,
}

interface P {
  overlay: Overlay
  isActive: boolean
  overlayManager: OverlayManager
  // className: string
}

interface S {
  loadingMode: LoadingMode
}

export class ContentItem extends React.Component<P, S> {
  ref = React.createRef<HTMLDivElement>()

  constructor(props: P) {
    super(props)

    this.state = {
      loadingMode: LoadingMode.Loading,
    }
  }

  componentDidMount() {
    this.loadFrame()
  }

  loadFrame() {
    const timeoutId = setTimeout(
      () => this.setState({ loadingMode: LoadingMode.SlowLoading }),
      OVERLAY_LOADING_TIMEOUT
    )

    const overlay = this.props.overlay
    overlay.checkAvailability()

    this.setState({ loadingMode: LoadingMode.Loading })

    this.ref.current.appendChild(overlay.frame)

    const loadHandler = () => {
      clearTimeout(timeoutId)
      if (!overlay.isError) {
        this.setState({ loadingMode: LoadingMode.NotLoading })
      }
      overlay.frame.removeEventListener('load', loadHandler)
    }
    overlay.frame.addEventListener('load', loadHandler)

    const networkErrorHandler = () => {
      clearTimeout(timeoutId)
      overlay.frame.remove()

      const { protocol, hostname } = new URL(overlay.url)
      if (protocol === 'https:' && (hostname === 'localhost' || hostname === '127.0.0.1')) {
        this.setState({ loadingMode: LoadingMode.SslError })
      } else {
        this.setState({ loadingMode: LoadingMode.NetworkError })
      }

      overlay.frame.removeEventListener('error_network', networkErrorHandler)
    }
    overlay.frame.addEventListener('error_network', networkErrorHandler)

    const serverErrorHandler = () => {
      clearTimeout(timeoutId)
      overlay.frame.remove()
      this.setState({ loadingMode: LoadingMode.ServerError })
      overlay.frame.removeEventListener('error_server', serverErrorHandler)
    }
    overlay.frame.addEventListener('error_server', serverErrorHandler)
  }

  openOverlayInTab() {
    const overlay = this.props.overlay
    window.open(overlay.url, '_blank')
  }

  render() {
    const s = this.state
    const p = this.props
    const x = this.props.overlay

    const childrenOverlays = p.overlayManager.getOverlays().filter((x) => x.parent === p.overlay)

    return (
      <div
        className={cn(styles.contentItem, {
          [styles.contentItemActive]: p.isActive,
        })}
      >
        {s.loadingMode === LoadingMode.Loading && (
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

        {s.loadingMode === LoadingMode.SlowLoading && (
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

        {s.loadingMode === LoadingMode.NetworkError && (
          <div className="loader-container" style={{ zIndex: 1 }}>
            <div className="load-text">No Internet Connection</div>
            <div className="load-text">Please check your internet connection and try again</div>
            <div className="load-text">
              <button onClick={this.loadFrame.bind(this)}>Try again</button>
            </div>
          </div>
        )}

        {s.loadingMode === LoadingMode.ServerError && (
          <div className="loader-container" style={{ zIndex: 1 }}>
            <div className="load-text">Internal Server Error</div>
            <div className="load-text">
              Sorry, there were some technical issues while processing your request. You can change
              preferred overlay storage and try again.
            </div>
            <div className="load-text">
              <button onClick={this.loadFrame.bind(this)}>Try again</button>
            </div>
          </div>
        )}

        {s.loadingMode === LoadingMode.SslError && (
          <div className="loader-container" style={{ zIndex: 1 }}>
            <div className="load-text">Unverified SSL Certificate</div>
            <div className="load-text">
              <p>
                If you are a dapplet developer and you are running the overlay over HTTPS, you may
                encounter an untrusted SSL certificate error. Open the overlay in a new browser tab
                and accept the self-signed certificate.
              </p>
            </div>
            <div className="load-text">
              <button onClick={this.openOverlayInTab.bind(this)}>Accept SSL</button>
            </div>
            <div className="load-text">
              <p>
                If you are not developing dapplets, then you should beware, your Internet connection
                may be broken.
              </p>
            </div>
            <div className="load-text">
              <button onClick={this.loadFrame.bind(this)}>Try again</button>
            </div>
          </div>
        )}

        <div
          style={{ display: s.loadingMode === LoadingMode.NotLoading ? undefined : 'none' }}
          className={styles.frameContainer}
          ref={this.ref}
        ></div>

        {childrenOverlays.map((x) => (
          <PopupItem key={x.id} overlay={x} />
        ))}
      </div>
    )
  }
}
