import {} from '../../../../lib'

/*
  To pass the test, you need:
  1. Activate the dapplet
  2. Click on the button in the post
  3. Check that the alert window displays the user's full name
  4. Change the user's full name in Twitter profile without reloading the page
  5. Click on the button in the post
  6. Check that the alert window displays the new user's full name
*/

@Injectable
export default class Dapplet {
  @Inject('test-twitter-adapter')
  public adapter: any

  private _globalContext = {
    fullname: null,
  }

  async activate(): Promise<void> {
    const { button } = this.adapter.exports
    this.adapter.attachConfig({
      GLOBAL: (global) => {
        this._globalContext = global
      },
      POST: () =>
        button({
          DEFAULT: {
            label: 'TEST',
            exec: () => Core.alert(this._globalContext.fullname),
          },
        }),
    })
  }
}
