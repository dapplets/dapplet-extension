import {} from '../../../../../lib'
import ICON from './icon.svg'

@Injectable
export default class Dapplet {
  @Inject('overlay-adapter.dapplet-base.eth')
  public adapter: any

  public state = Core.state({ hiddenOne: false, hiddenTwo: false })

  async activate(): Promise<void> {
    const { button } = this.adapter.exports
    this.adapter.attachConfig({
      MENU_ACTION: () => [
        button({
          initial: 'DEFAULT',
          DEFAULT: {
            title: 'HIDE 1',
            hidden: this.state.global.hiddenOne,
            icon: ICON,
            onClick: () => {
              this.state.global.hiddenOne.next(true)
            },
          },
        }),
        button({
          initial: 'DEFAULT',
          DEFAULT: {
            title: 'HIDE 2',
            hidden: this.state.global.hiddenTwo,
            icon: ICON,
            onClick: () => {
              this.state.global.hiddenTwo.next(true)
            },
            pinId: 'test-2',
          },
        }),
      ],
    })
  }
}
