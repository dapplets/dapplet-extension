import {} from '../../../../lib'

@Injectable
export default class DemoDapplet {
  constructor(
    @Inject('test-twitter-adapter')
    private adapter: any
  ) {}

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
