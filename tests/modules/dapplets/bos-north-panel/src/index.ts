import {} from '../../../../../lib'

@Injectable
export default class Dapplet {
  @Inject('twitter-bos-config')
  public adapter: any

  async activate(): Promise<void> {
    const { bos } = this.adapter.exports
    console.log(this.adapter, 'overlay')

    this.adapter.attachConfig({
      NORTH_PANEL: () => [
        bos({
          DEFAULT: {
            src: 'lisofffa.near/widget/North-Panel',
            label: 'TEST',
            onClick: () => {
              Core.alert('PASS')
            },
          },
        }),
      ],
    })
  }
}
