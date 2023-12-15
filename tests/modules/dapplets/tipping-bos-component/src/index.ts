import {} from '../../../../../lib'

@Injectable
export default class Tipping {
  @Inject('test-virtual-adapter')
  public adapter: any
  globalCtx: any

  async activate(): Promise<void> {
    const { bos } = this.adapter.exports
    this.adapter.attachConfig({
      GLOBAL: (ctx) => {
        this.globalCtx = ctx
      },
      POST: (ctx) => {
        const accountGId = ctx?.authorUsername + '/' + this.globalCtx?.websiteName?.toLowerCase()
        const itemGId = 'tweet/' + ctx?.id
        return bos({
          DEFAULT: {
            src: 'nikter.near/widget/Tipping',
            accountGId,
            itemGId,
          },
        })
      },
    })
  }
}
