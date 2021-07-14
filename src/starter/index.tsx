import * as React from 'react';
import * as ReactDOM from 'react-dom';
import '../common/semantic-ui-css/semantic.min.css';
import './index.scss';
import { busInstance } from './starterBus';
import { Container, Header, Button, Divider } from 'semantic-ui-react';
import * as tracing from '../common/tracing';

tracing.startTracing();

interface IIndexProps {
}

interface IIndexState {
    isLoading: boolean;
    ctx: any;
    widgets: {
        id: string;
        dapplet: string;
        label: string;
        img: string;
        order: number;
    }[];
}

class Index extends React.Component<IIndexProps, IIndexState> {
    constructor(props) {
        super(props);

        this.state = {
            isLoading: true,
            ctx: null,
            widgets: []
        };

        busInstance.onCtx(({ ctx, buttons }) => {
            this.setState({
                isLoading: false,
                ctx,
                widgets: buttons
            });
        });
    }

    onButtonClick(buttonId: string) {
        busInstance.emitButtonClicked(buttonId);
    }

    render() {
        const { isLoading, ctx, widgets } = this.state;

        return (
            <React.Fragment>
                {isLoading ? 'Loading...' : (<div>
                    <Container text>
                        <Header as='h2'>Starter</Header>
                        {(widgets.length > 0) ? (
                            <React.Fragment>
                                <p>The following actions are available for the selected context:</p>
                                {widgets.map((b, key) => <div key={key}>
                                    <Button primary fluid onClick={() => this.onButtonClick(b.id)}>
                                        {(b.img) ? <img width="16" height="16" src={b.img} /> : null}
                                        {b.label}
                                    </Button>
                                    <Divider hidden fitted />
                                </div>)}
                            </React.Fragment>
                        ) : (
                            <p>No available actions for the selected context.</p>
                        )}

                    </Container>
                </div>)}
            </React.Fragment>
        );
    }
}

ReactDOM.render(<Index />, document.querySelector('#app'));