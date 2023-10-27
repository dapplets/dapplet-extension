import { ModuleTypes } from '../../../common/constants'
import { setDappletActions } from '../../overlay/root/hooks/useDappletActions'
import { State } from '../state'
import { Exports, WidgetConfig } from '../types'

function createWidgetFactory<T>() {
  return (config: WidgetConfig<T>) => () => {
    const state = new State<T>(config, null, null)
    state.setState('DEFAULT') // ToDo: utilize initial prop
    return state
  }
}

class OverlayAdapter {
  private states: { state: State<any>; moduleName: string }[] = []

  public exports = (): Exports => ({
    button: createWidgetFactory(),
    label: createWidgetFactory(),
  })

  public attachConfig(featureConfig, moduleRuntimeInfo): void {
    const moduleName = moduleRuntimeInfo.manifest.name

    // ToDo: asynchronous behavior is poorly handled here
    featureConfig.MENU_ACTION({ id: 'MENU_ACTION' }).then((widgetFactories) => {
      const stateObjects: State<any>[] = widgetFactories.map((factory) => factory())

      stateObjects.forEach((state) => (state.changedHandler = this._refreshReactState))

      this.states.push(...stateObjects.map((state) => ({ state, moduleName })))

      this._refreshReactState()
    })
  }

  public detachConfig(_, moduleName) {
    // Unsubscribe
    this.states
      .filter((state) => state.moduleName === moduleName)
      .forEach((state) => (state.state.changedHandler = null))

    this.states = this.states.filter((state) => state.moduleName !== moduleName)
    this._refreshReactState()
  }

  private _refreshReactState = () => {
    setDappletActions(
      this.states.map((state) => ({
        ...state.state.getStateValues(),
        moduleName: state.moduleName,
      }))
    )
  }
}

const ManifestOverlayAdapter = {
  branch: 'default',
  createdAt: '1970-01-20T05:35:11.280Z',
  defaultConfig: {},
  dependencies: {},
  dist: { hash: '', uris: [] },
  environment: 'prod',
  extensionVersion: '0.0.0-pre.0',
  interfaces: {},
  main: { hash: '', uris: [] },
  name: 'overlay-adapter.dapplet-base.eth',
  registryUrl: 'v3.registry.dapplet-base.eth',
  schemaConfig: {},
  type: ModuleTypes.Adapter,
  version: '0.1.0',
  overlays: {},
  getId: () => 'overlay-adapter.dapplet-base.eth#default@0.1.0',
}

const Module = {
  manifest: ManifestOverlayAdapter,
  order: 0,
  contextIds: [],
  defaultConfig: {},
  schemaConfig: {},
  clazz: OverlayAdapter,
}

export default Module
