import {} from '../../../../lib'
import MAIN_IMG from './Black_Icon2.svg'

@Injectable
export default class DemoDapplet {
  @Inject('test-twitter-adapter')
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
      POST: (ctx) =>
        button({
          DEFAULT: {
            label: 'FAKE',
            img: MAIN_IMG,
            exec: () => console.log('ctx = ', ctx),
          },
        }),
    })
  }
}
