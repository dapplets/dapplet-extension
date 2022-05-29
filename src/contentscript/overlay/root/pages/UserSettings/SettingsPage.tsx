// import { initBGFunctions } from 'chrome-extension-message-wrapper'
import { withTheme } from '@rjsf/core'
import { Theme as SemanticUITheme } from '@rjsf/semantic-ui'
import { initBGFunctions } from 'chrome-extension-message-wrapper'
import React, { FC, useEffect, useState } from 'react'
import { Button } from 'semantic-ui-react'
import { browser } from 'webextension-polyfill-ts'
import ModuleInfo from '../../../../../background/models/moduleInfo'
import VersionInfo from '../../../../../background/models/versionInfo'
import { CONTEXT_ID_WILDCARD } from '../../../../../common/constants'
import { DefaultConfig, SchemaConfig } from '../../../../../common/types'
import { Message } from '../../components/Message'
import SelectWidget from './SelectWigets'
import TextWidget from './TextWigets'

SemanticUITheme.widgets.SelectWidget = SelectWidget
SemanticUITheme.widgets.TextWidget = TextWidget
const Form = withTheme(SemanticUITheme)

export interface SettingsPageProps {
  mi?: ModuleInfo & {
    hostnames: string[]
    order: number
    sourceRegistry: { url: string; isDev: boolean }
  }
  vi?: VersionInfo
  schemaConfig?: SchemaConfig
  defaultConfig?: DefaultConfig
}
let _isMounted = false
export const SettingsPage: FC<SettingsPageProps> = (props) => {
  const { mi, vi, schemaConfig, defaultConfig } = props

  const [owner, setOwner] = useState(null)
  const [data, setData] = useState({})
  const [loading, setLoading] = useState(false)
  const [devMode, setDevMode] = useState(false)
  const [hiddenProperties, setHiddenProperties] = useState([])
  const [swarmGatewayUrl, setSwarmGatewayUrl] = useState('')
  const [isEdited, setEdited] = useState(false)

  useEffect(() => {
    _isMounted = true
    const init = async () => {
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
        setDevMode(devMode)
        setHiddenProperties(hiddenProperties)
        setSwarmGatewayUrl(swarmGatewayUrl)

        await _refreshData()
        await _updateOwnership()
      }
    }
    init()

    return () => {
      _isMounted = false
    }
  }, [])

  const _refreshData = async () => {
    const { getAllUserSettings } = await initBGFunctions(browser)
    const customData = await getAllUserSettings(mi.name)
    const defaultData = (defaultConfig && defaultConfig[vi.environment]) || {}
    const data = { ...defaultData, ...customData }
    setData(data)
  }

  const _updateOwnership = async () => {
    if (!mi.sourceRegistry.isDev) {
      const { getOwnership } = await initBGFunctions(browser)
      const owner = await getOwnership(mi.sourceRegistry.url, mi.name)
      setOwner(owner)
    }
  }
  const _saveData = async (data: any) => {
    setLoading(true)
    setData(data)

    const { setAllUserSettings } = await initBGFunctions(browser)
    await setAllUserSettings(mi.name, data)
    await _refreshData()
    await _reloadFeature()
    setLoading(false)
    setEdited(false)
  }

  const _reloadFeature = async () => {
    const { reloadFeature } = await initBGFunctions(browser)
    const isEverywhere = true
    const targetContextIds = isEverywhere ? [CONTEXT_ID_WILDCARD] : mi.hostnames
    await reloadFeature(mi.name, vi.version, targetContextIds, mi.order, mi.sourceRegistry.url)
  }

  const _resetSettings = async () => {
    setLoading(true)

    const { clearUserSettings } = await initBGFunctions(browser)
    await clearUserSettings(mi.name)
    await _refreshData()
    await _reloadFeature()
    setLoading(false)
    setEdited(false)
  }

  return (
    <div>
      <h1>User Settings</h1>

      {mi && vi ? (
        <div>
          {/* Warning about Hidden properties */}
          {devMode && hiddenProperties.length > 0 ? (
            <Message
              title="Hidden settings"
              subtitle="The following options are available only in developer mode:"
              children={<>{hiddenProperties.join(', ')}</>}
            />
          ) : null}

          {/* Module Header Info */}
          <div>
            <h3>{mi.title}</h3>
            <h3>{mi.type}</h3>
            <div>
              {mi.description}
              <br />
              <strong>
                {mi.name}#{vi.branch}@{vi.version}
              </strong>
              <br />
              {owner ? (
                <div>
                  Owner:
                  <a
                    style={{ cursor: 'pointer' }}
                    onClick={() =>
                      window.open(`https://goerli.etherscan.io/address/${owner}`, '_blank')
                    }
                  >
                    {owner}
                  </a>
                </div>
              ) : null}
            </div>
          </div>

          {/* Form */}
          {schemaConfig && schemaConfig.properties ? (
            <Form
              schema={schemaConfig || {}}
              onSubmit={(e) => _saveData(e.formData)}
              formData={data}
              onChange={(e) => {
                setEdited(true)
                setData(e.formData)
              }}
            >
              <div>
                <Button type="submit" primary disabled={loading || !isEdited} loading={loading}>
                  Save and Reload
                </Button>
                <Button basic disabled={loading} onClick={() => _resetSettings()}>
                  Reset
                </Button>
              </div>
            </Form>
          ) : (
            <p>No settings available for this dapplet.</p>
          )}
        </div>
      ) : (
        <div>Loading</div>
      )}
    </div>
  )
}
