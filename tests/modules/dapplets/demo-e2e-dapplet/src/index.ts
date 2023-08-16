import {} from '../../../../../lib'
import MAIN_IMG from './images/Red_Icon3.svg'

const adapterName = 'test-e2e-adapter'

@Injectable
export default class DemoDapplet {
  @Inject(adapterName)
  public adapter: any

  async activate(): Promise<void> {
    const { button } = this.adapter.exports
    this.adapter.attachConfig({
      POST: async (ctx) => {
        return [
          button({
            id: 'button_post',
            initial: 'POSTWITHLABEL',
            POSTWITHLABEL: {
              label: 'POST WITH LABEL',
              img: MAIN_IMG,
              hidden: false,
              exec: async () => {
                console.log(ctx);
                await Core.alert(ctx.authorFullname);
              },
            },
          }),
          button({
            id: 'button_post_no_label',
            initial: 'POST',
            POST: {
              img: MAIN_IMG,
              hidden: false,
              exec: async () => {
                console.log(ctx);
                await Core.alert(ctx.authorUsername);
              },
            },
          }),
        ]
      },
      PROFILE: async (ctx) => [
        button({
          id: 'button_profile',
          initial: 'PROFILE',
          PROFILE: {
            label: 'PROFILE',
            img: MAIN_IMG,
            hidden: false,
            exec: async (_,me) => {
              console.log(ctx);
              await Core.alert(me.label);
            },
          },
        }),
        button({
          id: 'button_profile_no_img',
          initial: 'PROFILENOIMG',
          PROFILENOIMG: {
            label: 'PROFILE NO IMG',
            hidden: false,
            exec: async (_,me) => {
              console.log(ctx);
              await Core.alert(me.label);
            },
          },
        }),
      ],
    })
  }
}
