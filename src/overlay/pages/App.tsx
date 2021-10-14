import * as React from "react";
import { DappletConfirmation } from "./DappletConfirmation";
import { SystemOverlayTabs } from "../../common/types";

interface Props {
  activeTab: string;
  data: any;
}
interface State {}

export class App extends React.Component<Props, State> {
  render() {
    if (this.props.activeTab === SystemOverlayTabs.DAPPLET_CONFIRMATION) {
      return <DappletConfirmation data={this.props.data}></DappletConfirmation>;
    }
    return null;
  }
}
