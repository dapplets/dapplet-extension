import * as React from "react";
import { Button } from "semantic-ui-react";

interface Props {
  labelBefore: string;
  labelAfter: string;
  onClick: (...args: any[]) => void;
  style?: any;
}

interface State {
  clicked: boolean;
  loading: boolean;
}

export class CopyButton extends React.Component<Props, State> {
  constructor(props) {
    super(props);

    this.state = {
      clicked: false,
      loading: false,
    };
  }

  clickHandler = async (...args: any[]) => {
    this.setState({ loading: true });
    await Promise.resolve(this.props.onClick(...args));
    this.setState({ loading: false, clicked: true });
    setTimeout(() => this.setState({ clicked: false }), 4000);
  };

  render() {
    if (!this.state.clicked) {
      return (
        <Button
          style={this.props.style}
          loading={this.state.loading}
          disabled={this.state.loading}
          primary
          size="mini"
          onClick={this.clickHandler.bind(this)}
        >
          {this.props.labelBefore}
        </Button>
      );
    } else {
      return (
        <Button
          style={this.props.style}
          primary
          size="mini"
        >
          {this.props.labelAfter}
        </Button>
      );
    }
  }
}
