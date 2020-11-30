import * as React from "react";
import { Icon, Popup } from "semantic-ui-react";
import { SemanticICONS } from "semantic-ui-react/dist/commonjs/generic";

interface Props {
    name: SemanticICONS;
    text: string;
    onClick: (...args: any[]) => void;
}

interface State {
    clicked: boolean;
}

export class CheckIcon extends React.Component<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            clicked: false
        };
    }

    clickHandler = (...args: any[]) => {
        this.setState({ clicked: true });
        setTimeout(() => this.setState({ clicked: false }), 2000);
        this.props.onClick(...args);
    }

    render() {
        if (this.state.clicked) {
            return <Popup
                content={this.props.text}
                open
                size='mini'
                trigger={<Icon
                    link
                    name='check'
                    onClick={this.clickHandler}
                />}
            />
        } else {
            return <Icon
                link
                name={(this.state.clicked) ? 'check' : this.props.name}
                onClick={this.clickHandler}
            />;
        }
    }
}