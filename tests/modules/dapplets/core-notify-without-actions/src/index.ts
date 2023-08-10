import {} from '../../../../lib'

@Injectable
export default class DemoDapplet {
  @Inject('test-common-adapter')
  public adapter: any

  async activate(): Promise<void> {
    const { button } = this.adapter.exports
    this.adapter.attachConfig({
      BODY: () => [
        button({
          DEFAULT: {
            label: 'Notify',
            exec: async () => {
              await Core.notify('PASS')
            },
          },
        }),
      ],
    })
  }
}
