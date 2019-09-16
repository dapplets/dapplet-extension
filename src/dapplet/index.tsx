import * as React from 'react';
import * as ReactDOM from 'react-dom';
import 'semantic-ui-css/semantic.min.css'
import './index.scss';
import { Bus } from '../common/bus';
import styled from "styled-components";
import { apiFetchDapplet } from './api';
import { getRenderer } from './helpers';
import { Container, Header, Button } from 'semantic-ui-react'

const SDapplet = styled.div`
  width: 100%;
  padding: 20px 20px;
  margin: 0 0 15px 0;
  background: rgb(255,255,255);
  border-radius: 6px;
  border-bottom-width: 1px;
  border-bottom-style: solid;
  border-bottom-color: rgba(12,12,13,0);
  box-shadow: 0px 2px 6px 0 rgba(0,0,0,0.1), 0 0 1px 0 rgba(50,50,93,0.02), -1px 2px 10px 0 rgba(59,59,92,0.15);
`;

interface IIndexProps {
}

interface IIndexState {
    isLoading: boolean;
    dappletId: string;
    txMeta: any;
    renderedDapplet: string;
}

class Index extends React.Component<IIndexProps, IIndexState> {
    private _bus: Bus = null;

    constructor(props) {
        super(props);

        this.state = {
            isLoading: true,
            dappletId: null,
            txMeta: null,
            renderedDapplet: null
        };

        this._bus = new Bus();
        this._bus.subscribe('txmeta', async (dappletId, txMeta) => {
            const dappletConfig = await apiFetchDapplet(dappletId);

            let html = "Compatible Dapplet view is not found.";

            for (const view of dappletConfig.views) {
                if (!view["@type"]) {
                    continue;
                }

                const renderer = getRenderer(view["@type"]);

                if (renderer) {
                    html = renderer(view.template, txMeta);
                    break;
                }
            }

            this.setState({
                isLoading: false,
                dappletId,
                txMeta,
                renderedDapplet: html
            });
        });
    }

    render() {
        const { isLoading, renderedDapplet } = this.state;

        return (
            <React.Fragment>
                {isLoading ? 'Loading...' : (<div>
                    <Container text>
                        <Header as='h2'>Dapplet</Header>
                        <p>Your wallet doesn't support Dapplet transactions.<br/>It might look like this:</p>
                        {/* {x.map(a=><SDapplet dangerouslySetInnerHTML={{ __html: a.renderedDapplet }} />)} */}
                        <SDapplet dangerouslySetInnerHTML={{ __html: renderedDapplet }} />
                        <div>
                            <Button primary onClick={() => this._bus.publish('approved')}>Continue</Button>
                            <Button basic onClick={() => this._bus.publish('error')}>Reject</Button>
                        </div>
                    </Container>
                </div>)}
            </React.Fragment>
        );
    }
}

ReactDOM.render(<Index />, document.querySelector('#app'));