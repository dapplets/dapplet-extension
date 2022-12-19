import { ModuleTypes } from '../../../../common/constants'
import { ButtonWidget, IButtonWidgetState } from '../button'
import { ILabelWidgetState, LabelWidget } from '../label'
import { Exports } from '../../types'
import { WidgetsCreator } from '../../widgetsCreator'
export const widgets = []

export default class OverlayAdapter {
  public state: any
  public widgetsCreator = new WidgetsCreator()
  public exports = (): Exports => ({
    button: this.widgetsCreator.createWidgetFactory<IButtonWidgetState>(ButtonWidget),
    label: this.widgetsCreator.createWidgetFactory<ILabelWidgetState>(LabelWidget),
  })
  public config = {
    MENU_ACTION: {},
  }

  constructor(readonly adapter: any) {}
  public attachConfig(feature, moduleName): void {
    const newWidgets = {
      moduleName: moduleName.manifest.name,
      MENU_ACTION: feature.MENU_ACTION,
      contextIds: moduleName.contextIds,
      orderIndex: feature.orderIndex,
    }

    widgets.push(newWidgets)
  }
  public detachConfig(config, featureId) {
    widgets.splice(
      0,
      widgets.length,
      ...widgets.filter((n) => {
        return n.moduleName !== featureId
      })
    )
  }
}

export const ManifestOverlayAdapter = {
  manifest: {
    branch: 'default',
    createdAt: '1970-01-20T05:35:11.280Z',
    defaultConfig: null,
    dependencies: {},
    dist: { hash: '', uris: [] },
    environment: null,
    extensionVersion: '0.0.0-pre.0',
    interfaces: {},
    main: null,
    name: 'overlay-adapter.dapplet-base.eth',
    overlays: null,
    registryUrl: 'v2.registry.dapplet-base.eth',
    schemaConfig: null,
    type: ModuleTypes.Adapter,
    version: '0.1.0',
    getId: null,
  },
  instance: new OverlayAdapter('overlay-adapter.dapplet-base.eth'),
  clazz: OverlayAdapter,

  order: null,
  contextIds: null,
  constructorDependencies: [],
  instancedPropertyDependencies: {},
  instancedConstructorDeps: [],
  activateMethodsDependencies: [],
  instancedActivateMethodsDependencies: [],
  defaultConfig: null,
}
