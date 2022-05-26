import * as React from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { Container } from 'semantic-ui-react'
import { Bus } from '../common/bus'
import '../common/semantic-ui-css/semantic.min.css'
import { ChainTypes } from '../common/types'
import { SelectWallet } from './components/selectWallet'
import './index.scss'
import * as modules from './modules'

interface Props {
  bus: Bus
  chains: ChainTypes[]
}

interface State {}

export class App extends React.Component<Props, State> {
  render() {
    const p = this.props

    return (
      <Container text style={{ paddingTop: '30px' }}>
        <HashRouter>
          <Routes>
            <Route path="/" element={<SelectWallet bus={p.bus} chains={p.chains} />} />
            <Route path="/metamask" element={<modules.metamask bus={p.bus} />} />
            <Route path="/walletconnect" element={<modules.walletconnect bus={p.bus} />} />
            <Route
              path="/near_testnet"
              element={<modules.near bus={p.bus} chain={ChainTypes.NEAR_TESTNET} />}
            />
            <Route
              path="/near_mainnet"
              element={<modules.near bus={p.bus} chain={ChainTypes.NEAR_MAINNET} />}
            />
            <Route path="/dapplets" element={<modules.dapplets bus={p.bus} />} />
          </Routes>
        </HashRouter>
      </Container>
    )
  }
}
