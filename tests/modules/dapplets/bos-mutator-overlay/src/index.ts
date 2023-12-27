import {} from '../../../../../lib'

@Injectable
export default class Dapplet {
  @Inject('twitter-bos-config')
  public adapter: any

  async activate(): Promise<void> {
    const { bos } = this.adapter.exports

    this.adapter.attachConfig({
      POST_OVERLAY: () => [
        bos({
          DEFAULT: {
            src: 'lisofffa.near/widget/Mutation-Overlay',
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
