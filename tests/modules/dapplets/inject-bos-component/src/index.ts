import {} from '../../../../../lib'

@Injectable
export default class Dapplet {
  @Inject('test-e2e-adapter')
  public adapter: any

  async activate(): Promise<void> {
    const { bos } = this.adapter.exports
    this.adapter.attachConfig({
      POST: () => [
        bos({
          DEFAULT: {
            label: 'TEST',
            exec: () => Core.alert('PASS'),
          },
        }),
      ],
      PROFILE: () => [
        bos({
          DEFAULT: {
            label: 'TEST',
            exec: () => Core.alert('PASS'),
          },
        }),
      ],
    })
  }
}
