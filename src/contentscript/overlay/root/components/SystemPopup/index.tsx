import * as React from 'react'
import { Bus } from '../../../../../common/bus'
import { SystemOverlayData, SystemOverlayTabs } from '../../../../../common/types'
import { Overlay } from './components/Overlay'
import ConnectedAccounts from './pages/ConnectedAccountsModal'
import { DappletConfirmation } from './pages/dapplet-confirmation'
import { LoginSession } from './pages/login-session'
import styles from './SystemPopup.module.scss'

interface Props {
  bus: Bus
}

interface State {
  frames: SystemOverlayData[]
}

export class SystemPopup extends React.Component<Props, State> {
  constructor(p: Props) {
    super(p)
    this.state = {
      frames: [],
    }
  }

  closeClickHandler = () => {
    this.props.bus.publish('cancel')
  }

  componentDidMount(): void {
    const { bus } = this.props

    bus.subscribe('data', (frameId: string, frame: SystemOverlayData) => {
      frame.frameId = frameId
      this.setState((s) => ({
        frames: [...s.frames, frame],
      }))
    })

    bus.subscribe('close_frame', (frameId: string) => {
      this.setState((s) => {
        const frames = [...s.frames].filter((x) => x.frameId !== frameId)
        return {
          frames,
        }
      })
    })
  }

  render() {
    const { bus } = this.props
    const { frames } = this.state
    if (frames.length === 0) return null

    const [firstFrame] = frames
    const { activeTab, payload, popup } = firstFrame

    const requests = frames.map((x) => ({ ...x.payload, frameId: x.frameId }))

    switch (activeTab) {
      case SystemOverlayTabs.DAPPLET_CONFIRMATION:
        return (
          <BlurBox>
            <Overlay
              onCloseClick={popup ? this.closeClickHandler : null}
              title={`Following a Share Link`}
            >
              {[1].map((x) => (
                <div style={{ width: '100%' }} key={x}>
                  <DappletConfirmation data={payload} bus={bus} />
                </div>
              ))}
            </Overlay>
          </BlurBox>
        )

      case SystemOverlayTabs.LOGIN_SESSION:
        return (
          <BlurBox>
            <Overlay
              onCloseClick={popup ? this.closeClickHandler : null}
              title={`Login to "${payload.app}"`}
              subtitle={payload.loginRequest?.role ? `as "${payload.loginRequest?.role}"` : null}
            >
              {requests.map((x) => (
                <LoginSession bus={bus} request={x} key={x.frameId} />
              ))}
            </Overlay>
          </BlurBox>
        )

      case SystemOverlayTabs.CONNECTED_ACCOUNTS:
        return (
          <BlurBox>
            <ConnectedAccounts
              bus={bus}
              onCloseClick={popup ? this.closeClickHandler : null}
              data={payload}
            />
          </BlurBox>
        )
      default:
        return null
    }
  }
}

type BlurBoxProps = {
  children?: React.ReactNode
}

const BlurBox: React.FC<BlurBoxProps> = ({ children }) => {
  return <div className={styles['dapplets-popup-container']}>{children}</div>
}
