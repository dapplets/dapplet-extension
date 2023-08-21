import {} from '../../../../../lib'

@Injectable
export default class Dapplet {
  async activate(
    @Inject('test-common-adapter')
    adapter: any
  ): Promise<void> {
    const { button } = adapter.exports
    adapter.attachConfig({
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
