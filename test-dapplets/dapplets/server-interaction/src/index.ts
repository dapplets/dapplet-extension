import {} from '../../../../lib'
import MAIN_IMG from './target.png'

interface IDappState {
  amount: any
}

@Injectable
export default class TwitterFeature {
  @Inject('test-twitter-adapter') public adapter: any
  async activate() {
    const serverUrl = await Core.storage.get('serverUrl')
    const defaultState: IDappState = { amount: 0 }
    const server = Core.connect<IDappState>({ url: serverUrl }, defaultState)
    const state = Core.state<IDappState>(defaultState)
    const { button } = this.adapter.exports
    this.adapter.attachConfig({
      POST: (ctx: { id: string }) => {
        state[ctx.id].amount.next(server.state[ctx.id].amount)
        return button({
          initial: 'DEFAULT',
          DEFAULT: {
            img: MAIN_IMG,
            label: state[ctx.id].amount.value,
            exec: () => server.send('increment', ctx.id),
          },
        })
      },
    })
  }
}
