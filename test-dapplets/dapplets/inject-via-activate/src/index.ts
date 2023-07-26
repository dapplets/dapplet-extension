import {} from '../../../../lib'

@Injectable
export default class Dapplet {
  async activate(
    @Inject('test-twitter-adapter')
    adapter: any
  ): Promise<void> {
    const { button } = adapter.exports
    adapter.attachConfig({
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
