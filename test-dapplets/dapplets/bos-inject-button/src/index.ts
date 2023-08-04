import {} from '../../../../lib'

@Injectable
export default class Dapplet {
  constructor(
    @Inject('test-twitter-adapter')
    private adapter: any
  ) {}

  async activate(): Promise<void> {
    const { bos } = this.adapter.exports
    this.adapter.attachConfig({
      POST: () =>
        bos({
          DEFAULT: {
            label: 'TEST',
            exec: () => Core.alert('PASS'),
          },
        }),
    })
  }
}
