import {} from '../../../../../lib'

@Injectable
export default class Dapplet {
  @Inject('test-e2e-adapter')
  public adapter: any

  async activate(): Promise<void> {
    const { bos } = this.adapter.exports
    this.adapter.attachConfig({
      POST: (post) => [
        bos({
          DEFAULT: {
            src: 'alsakhaev.near/widget/ExampleButton',
            props: {
              label: post.authorUsername,
            },
            exec: () => Core.alert('PASS'),
          },
        }),
      ],
      PROFILE: (profile) => [
        bos({
          DEFAULT: {
            src: 'alsakhaev.near/widget/ExampleButton',
            props: {
              label: profile.authorUsername,
            },
            exec: () => Core.alert('PASS'),
          },
        }),
      ],
    })
  }
}
