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
      POST: (ctx) => [
        button({
          DEFAULT: {
            label: 'alert',
            img: MAIN_IMG,
            exec: async () => {
              await Core.alert('ATTENTION!!!')
              console.log(ctx)
            },
          },
        }),
        button({
          DEFAULT: {
            label: 'confirm',
            img: MAIN_IMG,
            exec: async () => {
              const answer = await Core.confirm(
                'BE OR NOT TO BE OR NOT TO BE OR NOT TO BE OR NOT TO BE?'
              )
              console.log('answer:', answer ? 'yes' : 'no')
              console.log(ctx)
            },
          },
        }),
      ],
    })
  }
}
