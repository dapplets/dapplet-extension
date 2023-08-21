import {} from '../../../../../lib'
import MAIN_IMG from './Black_Icon2.svg'

@Injectable
export default class DemoDapplet {
  @Inject('test-common-adapter')
  public adapter: any

  async activate(): Promise<void> {
    const { button } = this.adapter.exports
    this.adapter.attachConfig({
      BODY: (ctx) => [
        button({
          DEFAULT: {
            label: 'confirm',
            img: MAIN_IMG,
            exec: async () => {
              const result = await Core.confirm('Click Cancel to continue')
              Core.notify(!result ? 'PASS' : 'FAIL')
            },
          },
        }),
      ],
    })
  }
}
