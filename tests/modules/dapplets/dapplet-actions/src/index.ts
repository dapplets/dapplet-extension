import {} from '../../../../../lib'
import ICON from './icon.svg'

@Injectable
export default class Dapplet {
  @Inject('overlay-adapter.dapplet-base.eth')
  public adapter: any

  public state = Core.state({ counter: 0 })

  async activate(): Promise<void> {
    const { button } = this.adapter.exports
    this.adapter.attachConfig({
      MENU_ACTION: () => [
        button({
          initial: 'DEFAULT',
          DEFAULT: {
            title: this.state.global.counter,
            icon: ICON,
            onClick: () => {
              this.state.global.counter.next(this.state.global.counter.value + 1)
            },
            pinId: 'test-button',
          },
        }),
        button({
          initial: 'DEFAULT',
          DEFAULT: {
            title: this.state.global.counter,
            icon: ICON,
            onClick: () => {
              this.state.global.counter.next(this.state.global.counter.value + 1)
            },
            pinId: 'test-button-2',
          },
        }),
      ],
    })
  }
}
