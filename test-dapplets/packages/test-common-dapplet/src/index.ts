import {} from '../../../../lib'
import EXAMPLE_IMG from './icons/ex06.png'

@Injectable
export default class ViewportFeature {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any,  @typescript-eslint/explicit-module-boundary-types
  @Inject('test-common-adapter') public adapter: any

  activate() {
    const { button } = this.adapter.exports
    this.adapter.attachConfig({
      BODY: (ctx) =>
        button({
          DEFAULT: {
            tooltip: 'Injected Button',
            img: EXAMPLE_IMG,
            exec: () => {
              console.log('ctx', ctx)
            },
          },
        }),
    })
  }
}
