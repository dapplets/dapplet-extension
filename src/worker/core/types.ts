import { BehaviorSubjectProxy } from 'rxjs-proxify'

export interface IModule {}

export interface IContentAdapter<IAdapterConfig> extends IModule {
  exports?: ((featureId: string) => any) | any
  attachConfig(config: IAdapterConfig, feature?: any): { $: (ctx: any, id: string) => any }
  detachConfig(config: IAdapterConfig, featureId?: string): void
}

export interface IFeature extends IModule {
  contextIds?: string[]
  orderIndex?: number

  activate?(): void
  deactivate?(): void
}

export interface IResolver extends IModule {
  getBranch(): string
}

export interface IPubSub {
  exec(topic: string, message: any): Promise<any>
  //notify(topic: string, message: any): void;
  // on(method: string, handler: (params: any | any[]) => any): {
  //     off: () => void;
  // };
  onMessage(handler: (operation: string, message: any) => any): {
    off: () => void
  }
  registered?: boolean
}

export interface ISharedState<T> {
  global: BehaviorSubjectProxy<T>
}
