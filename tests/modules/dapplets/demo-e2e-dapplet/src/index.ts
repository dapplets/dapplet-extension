import {} from '../../../../../lib'
import MAIN_IMG from './images/Red_Icon3.svg'

@Injectable
export default class DemoDapplet {
  @Inject('test-e2e-adapter')
  public adapter: any

  async activate(): Promise<void> {
    const { button } = this.adapter.exports
    this.adapter.attachConfig({
      POST: (ctx) => [
        button({
          initial: 'DEFAULT',
          DEFAULT: {
            label: { DARK: 'DARK', LIGHT: 'LIGHT' },
            img: MAIN_IMG,
            exec: async () => {
              console.log(ctx)
              await Core.alert(ctx.authorFullname)
            },
          },
        }),
        button({
          initial: 'DEFAULT',
          DEFAULT: {
            img: MAIN_IMG,
            exec: async () => {
              console.log(ctx)
              await Core.alert(ctx.authorUsername)
            },
          },
        }),
      ],
      PROFILE: (ctx) => [
        button({
          initial: 'DEFAULT',
          DEFAULT: {
            label: 'PROFILE',
            img: MAIN_IMG,
            exec: async (_, me) => {
              console.log(ctx)
              await Core.alert(me.label)
            },
          },
        }),
        button({
          initial: 'DEFAULT',
          DEFAULT: {
            label: 'PROFILE NO IMG',
            exec: async (_, me) => {
              console.log(ctx)
              await Core.alert(me.label)
            },
          },
        }),
      ],
    })
  }
}
