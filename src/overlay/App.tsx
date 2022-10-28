import * as React from 'react'
import { bus } from '.'
import { SystemOverlayData, SystemOverlayTabs } from '../common/types'
import { Overlay } from './components/Overlay'
import ConnectedAccounts from './pages/ConnectedAccountsModal'
import { DappletConfirmation } from './pages/dapplet-confirmation'
import { LoginSession } from './pages/login-session'

interface Props {
  frames: SystemOverlayData[]
}

interface State {}

export class App extends React.Component<Props, State> {
  closeClickHandler = () => {
    bus.publish('cancel')
  }

  render() {
    const { frames } = this.props
    if (frames.length === 0) return null

    const [firstFrame] = frames
    const { activeTab, payload, popup } = firstFrame

    switch (activeTab) {
      case SystemOverlayTabs.DAPPLET_CONFIRMATION:
        return <DappletConfirmation data={payload} />

      case SystemOverlayTabs.LOGIN_SESSION:
        const requests = frames.map((x) => ({ ...x.payload, frameId: x.frameId }))
        return (
          <Overlay
            onCloseClick={popup ? this.closeClickHandler : null}
            title={`Login to "${payload.app}"`}
            subtitle={payload.loginRequest?.role ? `as "${payload.loginRequest?.role}"` : null}
          >
            {requests.map((x, i) => (
              <LoginSession bus={bus} request={x} key={x.frameId} />
            ))}
          </Overlay>
        )

      case SystemOverlayTabs.CONNECTED_ACCOUNTS:
        return (
          <ConnectedAccounts
            bus={bus}
            onCloseClick={popup ? this.closeClickHandler : null}
            data={payload}
          />
        )
      default:
        return null
    }
  }
}
