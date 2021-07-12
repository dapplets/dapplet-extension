import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { List } from 'semantic-ui-react';
//import 'semantic-ui-css/semantic.min.css';
import './index.scss';
import { browser } from "webextension-polyfill-ts";
import { initBGFunctions } from "chrome-extension-message-wrapper";

interface Props {}
interface State {}

class Index extends React.Component<Props, State> {

  _openExtensionsHandler = async () => {
    const { createTab } = await initBGFunctions(browser);
    await createTab('chrome://extensions/');
  }

  render() {
    return (
      <React.Fragment>
        <h1>Upgrade Guide</h1>
        <List as='ol'>
          <List.Item as='li'>
            Download the new version of the <b>Dapplets</b> browser extension <a href='https://github.com/dapplets/dapplet-extension/releases/latest/download/dapplet-extension.zip' target='_blank'>
              <b>here</b>
            </a>
          </List.Item>
          <List.Item as='li'>
            Open <a onClick={this._openExtensionsHandler} style={{ cursor: 'pointer' }}>chrome://extensions</a> in a new tab
          </List.Item>
          <List.Item as='li'>
            <p>Remove the previous version of the extension</p>
            <img src='https://user-images.githubusercontent.com/43613968/123969499-f4445800-d9c0-11eb-8028-09535e5c8bb2.jpg' />
          </List.Item>
          <List.Item as='li'>
            <p><b>Drag and drop</b> the downloaded file into the extensions page. The extension will install automatically</p>
            <img src='https://user-images.githubusercontent.com/43613968/117132354-6cb8df00-adab-11eb-93bb-eb17b287e140.png' />
          </List.Item>
          <List.Item as='li'>
            <p>If you are using Ubuntu or another Linux OS the Dapplets extension can disappear from the Chrome Extensions after restarting the PC. To avoid this unzip the archive and instead of drag and drop use the <b>Load unpacked</b> button to add the extension</p>
            <img src='https://user-images.githubusercontent.com/43613968/118473499-b93cdc80-b712-11eb-8a1a-d3779e490e8c.png' />
            <img src='https://user-images.githubusercontent.com/43613968/118473927-2ea8ad00-b713-11eb-9bbf-f2b7cb33a6bf.png' />
          </List.Item>
        </List>
      </React.Fragment>
    );
  }
}

ReactDOM.render(<Index />, document.querySelector('#app'));
