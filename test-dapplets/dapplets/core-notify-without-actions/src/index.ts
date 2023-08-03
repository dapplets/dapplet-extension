import {} from '../../../../lib'

@Injectable
export default class DemoDapplet {
  @Inject('test-twitter-adapter')
  public adapter: any

  async activate(): Promise<void> {
    const { button } = this.adapter.exports
    this.adapter.attachConfig({
      POST: () => [
        button({
          DEFAULT: {
            label: 'Notify',
            exec: async () => {
              await Core.notify('Test Message')
            },
          },
        }),
      ],
    })
  }
}
