import {} from '../../../../lib'

@Injectable
export default class DemoDapplet {
  @Inject('twitter-config.dapplet-base.eth')
  public adapter: any

  async activate(): Promise<void> {
    const { button } = this.adapter.exports
    this.adapter.attachConfig({
      POST: (ctx) =>
        button({
          DEFAULT: {
            label: 'TEST',
            exec: () => {
              const url = Core.createShareLink('https://twitter.com/alsakhaev', ctx)
              console.log(url)
              Core.openPage(url)
            },
          },
        }),
    })
  }
}
