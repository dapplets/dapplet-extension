import {} from '../../../../lib'

@Injectable
export default class Dapplet {
  @Inject('test-common-adapter')
  public adapter: any

  async activate(): Promise<void> {
    const { button } = this.adapter.exports
    this.adapter.attachConfig({
      BODY: () =>
        button({
          DEFAULT: {
            label: 'TEST',
            exec: () => Core.notify('PASS'),
          },
        }),
    })
  }
}
