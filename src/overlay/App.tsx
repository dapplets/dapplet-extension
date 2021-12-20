import * as React from "react";
import { DappletConfirmation } from "./pages/dapplet-confirmation";
import { SystemOverlayData, SystemOverlayTabs } from "../common/types";
import { LoginSession } from "./pages/login-session";
import { bus } from ".";
import { Overlay } from "./components/Overlay";

interface Props {
  frames: SystemOverlayData[];
}

interface State {}

export class App extends React.Component<Props, State> {
  closeClickHandler = () => {
    bus.publish("cancel");
  };

  render() {
    const { frames } = this.props;
    if (frames.length === 0) return null;

    const [firstFrame] = frames;
    const { activeTab, payload, popup } = firstFrame;

    switch (activeTab) {
      case SystemOverlayTabs.DAPPLET_CONFIRMATION:
        return <DappletConfirmation data={payload} />;

      case SystemOverlayTabs.LOGIN_SESSION:
        const requests = frames.map(x => ({ ...x.payload, frameId: x.frameId }));
        return (
          <Overlay
            onCloseClick={popup ? this.closeClickHandler : null}
            title={`Login to "${payload.app}"`}
            subtitle={
              payload.loginRequest.role ? `as "${payload.loginRequest.role}"` : null
            }
          >
            {requests.map((x, i) => <LoginSession bus={bus} request={x} key={x.frameId}/>)}
          </Overlay>
        );

      default:
        return null;
    }
  }
}
