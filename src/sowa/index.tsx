import { initBGFunctions } from 'chrome-extension-message-wrapper'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Button, Container, Header } from 'semantic-ui-react'
import { browser } from 'webextension-polyfill-ts'
import { Bus } from '../common/bus'
import '../common/semantic-ui-css/semantic.min.css'
import { getRenderer } from '../common/sowa'
import * as tracing from '../common/tracing'
import './index.scss'

tracing.startTracing()

interface IIndexProps {}

interface IIndexState {
  isLoading: boolean
  sowaId: string
  txMeta: any
  renderedSowaView: string
}

class Index extends React.Component<IIndexProps, IIndexState> {
  private _bus: Bus = null

  constructor(props) {
    super(props)

    this.state = {
      isLoading: true,
      sowaId: null,
      txMeta: null,
      renderedSowaView: null,
    }

    this._bus = new Bus()
    this._bus.subscribe('txmeta', async (sowaId, txMeta) => {
      const { getSowaTemplate } = await initBGFunctions(browser)
      const dappletConfig = await getSowaTemplate(sowaId)

      let html = 'Compatible SOWA view is not found.'

      for (const view of dappletConfig.views) {
        if (!view['@type']) {
          continue
        }

        const renderer = getRenderer(view['@type'])

        if (renderer) {
          html = renderer(view.template, txMeta)
          break
        }
      }

      this.setState({
        isLoading: false,
        sowaId,
        txMeta,
        renderedSowaView: html,
      })
    })
  }

  render() {
    const { isLoading, renderedSowaView } = this.state

    return (
      <React.Fragment>
        {isLoading ? (
          'Loading...'
        ) : (
          <div>
            <Container text>
              <Header as="h2">SOWA Transaction</Header>
              <p>
                Your wallet doesn't support SOWA transactions.
                <br />
                It might look like this:
              </p>
              {/* {x.map(a=><SSowaView dangerouslySetInnerHTML={{ __html: a.renderedSowaView }} />)} */}
              <div
                style={{
                  width: '100%',
                  padding: '20px 20px',
                  margin: '0 0 15px 0',
                  background: 'rgb(255,255,255)',
                  borderRadius: '6px',
                  borderBottomWidth: '1px',
                  borderBottomStyle: 'solid',
                  borderBottomColor: 'rgba(12,12,13,0)',
                  boxShadow:
                    '0px 2px 6px 0 rgba(0,0,0,0.1), 0 0 1px 0 rgba(50,50,93,0.02), -1px 2px 10px 0 rgba(59,59,92,0.15)',
                }}
                dangerouslySetInnerHTML={{ __html: renderedSowaView }}
              />
              <div>
                <Button primary onClick={() => this._bus.publish('approved')}>
                  Continue
                </Button>
                <Button basic onClick={() => this._bus.publish('error')}>
                  Reject
                </Button>
              </div>
            </Container>
          </div>
        )}
      </React.Fragment>
    )
  }
}

ReactDOM.render(<Index />, document.querySelector('#app'))
