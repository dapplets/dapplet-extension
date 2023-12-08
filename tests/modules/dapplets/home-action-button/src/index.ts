import {} from '../../../../../lib'
import EXAMPLE_IMG from './example.png'

interface IState {
  counter: number
  text: string
}

@Injectable
export default class Feature {
  @Inject('test-virtual-adapter')
  public adapter

  activate() {
    const state = Core.state<IState>({ counter: 0, text: '' })
    const overlay = Core.overlay<IState>({
      name: 'overlay',
      title: 'Test overlay',
    }).useState(state)
    Core.onAction(() => overlay.open())

    const { button } = this.adapter.exports
    this.adapter.attachConfig({
      POST: (ctx) => [
        button({
          DEFAULT: {
            img: EXAMPLE_IMG,
            label: state[ctx.id].counter,
            exec: () => {
              const oldValue = state[ctx.id].counter.value
              state[ctx.id].counter.next(oldValue + 1)
              overlay.open(ctx.id)
            },
          },
        }),
      ],
    })
  }
}
