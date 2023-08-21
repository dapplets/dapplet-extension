import {} from '../../../../../lib'
import MAIN_IMG from './Black_Icon2.svg'

@Injectable
export default class DemoDapplet {
  @Inject('test-common-adapter')
  public adapter: any

  // current user from twitter
  private _globalContext = {}

  async activate(): Promise<void> {
    const { button } = this.adapter.exports
    this.adapter.attachConfig({
      GLOBAL: (global) => {
        // Save reference to the global context
        Object.assign(this._globalContext, global)
      },
      BODY: (ctx) => [
        button({
          DEFAULT: {
            label: 'alert',
            img: MAIN_IMG,
            exec: async () => {
              await Core.alert('Click OK to continue')
              await Core.notify('PASS')
            },
          },
        }),
      ],
    })
  }
}
