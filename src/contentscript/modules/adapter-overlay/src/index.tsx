import { ModuleTypes } from '../../../../common/constants'
import { Exports } from '../../types'
import { WidgetsCreator } from '../../widgetsCreator'
import { ButtonWidget, IButtonWidgetState } from '../button'
import { ILabelWidgetState, LabelWidget } from '../label'
export const widgets = []

class OverlayAdapter {
  public state: any
  public widgetsCreator = new WidgetsCreator()
  public exports = (): Exports => ({
    button: this.widgetsCreator.createWidgetFactory<IButtonWidgetState>(ButtonWidget),
    label: this.widgetsCreator.createWidgetFactory<ILabelWidgetState>(LabelWidget),
  })
  public config = {
    MENU_ACTION: {},
  }

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
  registryUrl: 'v2.registry.dapplet-base.eth',
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
