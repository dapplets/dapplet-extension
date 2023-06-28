export class ProxyAdapter {
  private attachedConfig = null

  public exports = new Proxy(
    {},
    {
      get: (target, widgetName) => {
        // ToDo: implement it
        return (widgetConfig: any) => {}
      },
    }
  )

  constructor(public adapterName: string) {}

  public attachConfig(config: any) {
    // ToDo: implement it
    this.attachedConfig = config
  }

  public detachConfig() {
    // ToDo: implement it
    this.attachedConfig = null
  }
}
