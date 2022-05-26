import { withTheme } from '@rjsf/core'
import { Theme as SemanticUITheme } from '@rjsf/semantic-ui'
import { initBGFunctions } from 'chrome-extension-message-wrapper'
import * as React from 'react'
import { Button, Card, Dimmer, Loader, Message } from 'semantic-ui-react'
import { browser } from 'webextension-polyfill-ts'
import ModuleInfo from '../background/models/moduleInfo'
import VersionInfo from '../background/models/versionInfo'
import { CONTEXT_ID_WILDCARD } from '../common/constants'
import { DefaultConfig, SchemaConfig } from '../common/types'
import SelectWidget from './SelectWidget'
import TextWidget from './TextWidget'

SemanticUITheme.widgets.SelectWidget = SelectWidget
SemanticUITheme.widgets.TextWidget = TextWidget
const Form = withTheme(SemanticUITheme)

interface Props {
  mi?: ModuleInfo & {
    hostnames: string[]
    order: number
    sourceRegistry: { url: string; isDev: boolean }
  }
  vi?: VersionInfo
  schemaConfig?: SchemaConfig
  defaultConfig?: DefaultConfig
}

interface State {
  owner: string
  data: any
  loading: boolean
  devMode: boolean
  hiddenProperties: string[]
  swarmGatewayUrl: string
  isEdited: boolean
}

export class SettingsPage extends React.Component<Props, State> {
  constructor(props) {
    super(props)

    this.state = {
      owner: null,
      data: {},
      loading: false,
      devMode: false,
      hiddenProperties: [],
      swarmGatewayUrl: '',
      isEdited: false,
    }
  }

  async componentDidMount() {
    const { mi, vi, schemaConfig, defaultConfig } = this.props

    if (mi || vi || schemaConfig || defaultConfig) {
      const { getDevMode, getSwarmGateway } = await initBGFunctions(browser)
      const devMode = await getDevMode()
      const swarmGatewayUrl = await getSwarmGateway()

      const hiddenProperties =
        schemaConfig && schemaConfig.properties
          ? Object.entries(schemaConfig.properties)
              .filter(([k, v]: any) => v.hidden)
              .map(([k, v]: any) => v.title ?? k)
          : []

      // Do not show hidden settings when developer mode is disabled
      if (!devMode) {
        if (schemaConfig && schemaConfig.properties) {
          for (const key in schemaConfig.properties) {
            if (schemaConfig.properties[key].hidden) {
              delete schemaConfig.properties[key]
            }
          }
        }
      }

      this.setState({ devMode, hiddenProperties, swarmGatewayUrl })
      await this._refreshData()
      await this._updateOwnership()
    }
  }

  private async _refreshData() {
    const { getAllUserSettings } = await initBGFunctions(browser)
    const customData = await getAllUserSettings(this.props.mi.name)
    const defaultData =
      (this.props.defaultConfig && this.props.defaultConfig[this.props.vi.environment]) || {}
    const data = { ...defaultData, ...customData }
    this.setState({ data })
  }

  private async _updateOwnership() {
    if (!this.props.mi.sourceRegistry.isDev) {
      const { getOwnership } = await initBGFunctions(browser)
      const owner = await getOwnership(this.props.mi.sourceRegistry.url, this.props.mi.name)
      this.setState({ owner })
    }
  }

  private async _saveData(data: any) {
    this.setState({ loading: true, data })
    const { setAllUserSettings } = await initBGFunctions(browser)
    await setAllUserSettings(this.props.mi.name, data)
    await this._refreshData()
    await this._reloadFeature()
    this.setState({ loading: false, isEdited: false })
  }

  private async _reloadFeature() {
    const { reloadFeature } = await initBGFunctions(browser)
    const isEverywhere = true
    const targetContextIds = isEverywhere ? [CONTEXT_ID_WILDCARD] : this.props.mi.hostnames
    await reloadFeature(
      this.props.mi.name,
      this.props.vi.version,
      targetContextIds,
      this.props.mi.order,
      this.props.mi.sourceRegistry.url
    )
  }

  private async _resetSettings() {
    this.setState({ loading: true })
    const { clearUserSettings } = await initBGFunctions(browser)
    await clearUserSettings(this.props.mi.name)
    await this._refreshData()
    await this._reloadFeature()
    this.setState({ loading: false, isEdited: false })
  }

  render() {
    const { mi, vi, schemaConfig, defaultConfig } = this.props
    const { owner, data } = this.state

    return (
      <React.Fragment>
        <h1>User Settings</h1>

        {mi && vi ? (
          <React.Fragment>
            {/* Warning about Hidden properties */}
            {this.state.devMode && this.state.hiddenProperties.length > 0 ? (
              <Message warning>
                <Message.Header>Hidden settings</Message.Header>
                <p>The following options are available only in developer mode:</p>
                <p>{this.state.hiddenProperties.join(', ')}</p>
              </Message>
            ) : null}

            {/* Module Header Info */}
            <Card fluid>
              <Card.Content>
                {/* <Image
                                    floated='right'
                                    size='mini'
                                    circular
                                    src={(mi.icon && mi.icon.uris.length > 0) ? ((mi.icon.uris?.[0]?.indexOf('bzz:/') !== -1) ? joinUrls(this.state.swarmGatewayUrl, 'bzz/' + mi.icon.uris?.[0].match(/[0-9a-fA-F]{64}/gm)[0]) : mi.icon.uris?.[0]) : NOLOGO_PNG}
                                /> */}
                <Card.Header>{mi.title}</Card.Header>
                <Card.Meta>{mi.type}</Card.Meta>
                <Card.Description>
                  {mi.description}
                  <br />
                  <strong>
                    {mi.name}#{vi.branch}@{vi.version}
                  </strong>
                  <br />
                  {owner ? (
                    <React.Fragment>
                      Owner:{' '}
                      <a
                        style={{ cursor: 'pointer' }}
                        onClick={() =>
                          window.open(`https://goerli.etherscan.io/address/${owner}`, '_blank')
                        }
                      >
                        {owner}
                      </a>
                    </React.Fragment>
                  ) : null}
                </Card.Description>
              </Card.Content>
            </Card>

            {/* Form */}
            {schemaConfig && schemaConfig.properties ? (
              <Form
                schema={schemaConfig || {}}
                onSubmit={(e) => this._saveData(e.formData)}
                formData={data}
                onChange={(e) => this.setState({ isEdited: true, data: e.formData })}
              >
                <div>
                  <Button
                    type="submit"
                    primary
                    disabled={this.state.loading || !this.state.isEdited}
                    loading={this.state.loading}
                  >
                    Save and Reload
                  </Button>
                  <Button basic disabled={this.state.loading} onClick={() => this._resetSettings()}>
                    Reset
                  </Button>
                </div>
              </Form>
            ) : (
              <p>No settings available for this dapplet.</p>
            )}
          </React.Fragment>
        ) : (
          <Dimmer active inverted>
            <Loader inverted>Loading</Loader>
          </Dimmer>
        )}
      </React.Fragment>
    )
  }
}
