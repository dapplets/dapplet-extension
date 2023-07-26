import {} from '../../../../lib'

@Injectable
export default class Dapplet {
  @Inject('test-twitter-adapter')
  public adapter: any

  async activate(): Promise<void> {
    const { button } = this.adapter.exports
    this.adapter.attachConfig({
      POST: () =>
        button({
          DEFAULT: {
            label: 'TEST',
            exec: () => Core.alert('PASS'),
          },
        }),
    })
  }
}
