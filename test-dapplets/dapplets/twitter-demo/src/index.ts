import {} from '../../../../lib'
import BLACK_IMG from './images/Black_Icon3.svg'
import MAIN_IMG from './images/Red_Icon3.svg'
import WHITE_IMG from './images/White_Icon3.svg'

const adapterName = 'test-virtual-adapter'

@Injectable
export default class DemoDapplet {
  @Inject(adapterName)
  public adapter: any

  @Inject('overlay-adapter.dapplet-base.eth')
  public adapterAction: any

  // current user from twitter
  private _globalContext = {}

  private _$: any
  private _overlay: any
  private _config: any
  private _adapterDescription: {
    contextsNames: string[]
    widgets?: any
  }

  async activate(): Promise<void> {
    console.log('this.adapter', this.adapter)
    if (this.adapter._attachedConfig) {
      const contextsNames = Object.keys(this.adapter._attachedConfig)
      console.log(contextsNames)

      this._adapterDescription = { contextsNames, widgets: {} }
    }

    // Object.keys(this.adapter.exports).forEach((widgetName) => {
    //   //console.log('widgetName:', widgetName);
    //   const contextInsPoints = this.adapter.getContextInsPoints(widgetName)
    //   //console.log(contextInsPoints);
    //   const widgetParamsDescription = this.adapter.getWidgetParamsDescription(widgetName)
    //   //console.log(widgetParamsDescription);
    //   this._adapterDescription.widgets[widgetName] = { contextInsPoints, widgetParamsDescription }
    // })

    if (!this._overlay) {
      this._overlay = Core.overlay({ name: 'twitter-demo-overlay', title: 'Twitter Demo' }).listen({
        forceOverlay: () => localStorage?.setItem('tw-dd-open-force', 'open'),
      })
    }

    try {
      this._overlay.onClose(() => console.log('The overlay closed!'))
    } catch (err) {
      console.log('Overlay.onClose() does not exist.', err)
    }

    try {
      const adapterManifest = await (<any>Core).getManifest(adapterName)
      console.log('adapterManifest', adapterManifest)
    } catch (err) {
      console.log('Core.getManifest has en error:', err)
    }

    Core.onAction(() => this.openOverlay())
    ;(<any>Core).onWalletsUpdate(() => console.log('*** Wallets updated'))
    ;(<any>Core).onConnectedAccountsUpdate(() => console.log('*** Connected Accounts updated'))

    try {
      if (localStorage.getItem('tw-dd-open-force') === 'open') {
        localStorage.removeItem('tw-dd-open-force')
        this.openOverlay()
      }
    } catch (err) {
      console.log('localStorage is not existed.', err)
    }

    // Core.onShareLink((sharedData) => console.log('Shared data:', sharedData))

    const createShareLink = (id) => {
      const sharedData = { ctxId: id }
      const link = (<any>Core).createShareLink('https://twitter.com/teremovskii', sharedData)
      console.log('ShareLink:', link)
    }

    const {
      // avatar,
      avatarBadge,
      // usernameBadge,
      // label,
      button,
      // picture,
      // caption,
      // box
    } = this.adapter.exports

    const { button: buttonAction } = this.adapterAction.exports

    this.adapterAction.attachConfig({
      MENU_ACTION: () => [
        buttonAction({
          initial: 'DEFAULT',
          DEFAULT: {
            icon: MAIN_IMG,
            title: 'Test',
            pinnedID: 'test-action-button',
            action: (_, me) => {
              me.title = 'Done!'
            },
          },
        }),
      ],
    })

    this._config = {
      GLOBAL: (global) => {
        // Save reference to the global context
        Object.assign(this._globalContext, global)
      },
      POST: (ctx) => {
        return [
          // {
          //   QUOTE_POST: async (repostCtx) =>
          //     button({
          //       initial: 'DEFAULT',
          //       DEFAULT: {
          //         label: 'quote post',
          //         img: MAIN_IMG,
          //         exec: () => {
          //           console.log('ctx = ', ctx)
          //           console.log('repostCtx = ', repostCtx)
          //           console.log('parent ctx = ', repostCtx.parent)
          //           this.openOverlay()
          //         },
          //       },
          //     }),
          // },
          // [
          //   {
          //     label: 'Add tweet to the Ethereum registry',
          //     exec: (ctx) => {
          //       console.log('ctx1 = ', ctx)
          //       this.openOverlay()
          //     },
          //   },
          //   {
          //     label: 'Add tweet to the NEAR registry',
          //     exec: (ctx) => {
          //       console.log('ctx2 = ', ctx)
          //       this.openOverlay()
          //     },
          //   },
          //   {
          //     label: 'Add tweet to the Swarm',
          //     exec: (ctx) => {
          //       console.log('ctx3 = ', ctx)
          //       this.openOverlay()
          //     },
          //   },
          // ],
          // avatar({
          //   initial: 'DEFAULT',
          //   DEFAULT: {
          //     img: MAIN_IMG,
          //     exec: () => {
          //       console.log('ctx = ', ctx)
          //       this.openOverlay({ index: '0/0', ctx })
          //     },
          //   },
          // }),
          avatarBadge({
            initial: 'DEFAULT',
            DEFAULT: {
              vertical: 'bottom',
              horizontal: 'right',
              img: { DARK: WHITE_IMG, LIGHT: BLACK_IMG },
              exec: (_, me) => {
                console.log('ctx = (DEFAULT)', ctx)
                this.openOverlay({ index: '0/1', ctx })
                // Core.overlayManager.unregisterAll()
                // me.img = { LIGHT: WHITE_IMG, DARK: BLACK_IMG }
                me.state = 'SECOND'
              },
            },
            SECOND: {
              vertical: 'bottom',
              horizontal: 'right',
              img: { LIGHT: WHITE_IMG, DARK: BLACK_IMG },
              exec: (_, me) => {
                console.log('ctx = (SECOND)', ctx)
                this.openOverlay({ index: '0/1', ctx })
                // Core.overlayManager.unregisterAll()
                // me.img = { DARK: WHITE_IMG, LIGHT: BLACK_IMG }
                me.state = 'DEFAULT'
              },
            },
          }),
          // box({
          //   initial: 'DEFAULT',
          //   DEFAULT: {
          //     img: MAIN_IMG,
          //     text: '5,000 NEAR',
          //     color: 'white',
          //     textBackground: 'black',
          //     replace: 'https://github.com/dapplets/dapplet-extension',
          //     exec: (_: any, me: any) => {
          //       console.log('ctx = ', ctx)
          //       me.state = 'ANOTHER'
          //       // this.openOverlay({ index: '0/0', ctx });
          //     },
          //   },
          //   ANOTHER: {
          //     img: { DARK: WHITE_IMG, LIGHT: BLACK_IMG },
          //     text: '1,000 NEAR',
          //     color: 'white',
          //     textBackground: 'black',
          //     replace: 'https://github.com/dapplets/dapplet-extension',
          //     exec: (_: any, me: any) => {
          //       console.log('ctx = ', ctx)
          //       me.state = 'HIDDEN'
          //       setTimeout(() => (me.state = 'DEFAULT'), 2000)
          //       // this.openOverlay({ index: '0/0', ctx });
          //     },
          //   },
          //   HIDDEN: {
          //     img: MAIN_IMG,
          //     text: '5,000 NEAR',
          //     color: 'white',
          //     textBackground: 'black',
          //     replace: 'https://github.com/dapplets/dapplet-extension',
          //     hidden: true,
          //     exec: (_: any, me: any) => {
          //       console.log('ctx = ', ctx)
          //       me.state = 'DEFAULT'
          //       // this.openOverlay({ index: '0/0', ctx });
          //     },
          //   },
          // }),
          // usernameBadge({
          //   initial: 'DEFAULT',
          //   DEFAULT: {
          //     img: { DARK: WHITE_IMG, LIGHT: BLACK_IMG },
          //     exec: () => {
          //       console.log('ctx = ', ctx)
          //       this.openOverlay({ index: '0/2', ctx })
          //     },
          //   },
          // }),
          button({
            id: 'button',
            initial: 'DEFAULT',
            DEFAULT: {
              label: 0,
              img: MAIN_IMG,
              hidden: false,
              exec: (_, me) => {
                console.log('ctx = ', ctx)
                this.openOverlay({ index: '0/3', ctx })
                me.label += 1
              },
            },
          }),
          button({
            DEFAULT: {
              label: 'FAKE',
              img: MAIN_IMG,
              // LP: 2. Toggle the state “hidden/shown” of the picture on button click
              exec: () => {
                console.log('ctx = ', ctx)
                this._$(ctx, 'button').hidden = !this._$(ctx, 'button').hidden
              },
              // LP end
            },
          }),
          // label({
          //   initial: 'DEFAULT',
          //   DEFAULT: {
          //     basic: true,
          //     img: MAIN_IMG,
          //     text: 'close overlay',
          //     exec: () => {
          //       console.log('ctx = ', ctx)
          //       if (this._overlay.isOpen()) this._overlay.close()
          //       //this.openOverlay({ index: '0/4', ctx });
          //     },
          //   },
          // }),
          // picture({
          //   initial: 'DEFAULT',
          //   DEFAULT: {
          //     img: MAIN_IMG,
          //     exec: () => {
          //       console.log('ctx = ', ctx)
          //       this.openOverlay({ index: '0/5', ctx })
          //     },
          //   },
          // }),
          // caption({
          //   initial: 'DEFAULT',
          //   DEFAULT: {
          //     img: MAIN_IMG,
          //     text: 'caption',
          //     exec: () => {
          //       console.log('ctx = ', ctx)
          //       this.openOverlay({ index: '0/6', ctx })
          //     },
          //   },
          // }),
        ]
      },
      PROFILE: async (ctx) => {
        return [
          // avatar({
          //   initial: 'DEFAULT',
          //   DEFAULT: {
          //     img: MAIN_IMG,
          //     exec: () => {
          //       console.log('ctx = ', ctx)
          //       this.openOverlay({ index: '1/0', ctx })
          //     },
          //   },
          // }),
          avatarBadge({
            // initial: 'DEFAULT',
            DEFAULT: {
              vertical: 'bottom',
              horizontal: 'right',
              img: MAIN_IMG,
              tooltip: 'Create ShareLink',
              exec: () => {
                console.log('ctx = ', ctx)
                createShareLink(ctx?.id)
                // this.openOverlay({ index: '1/1', ctx })
              },
            },
          }),
          // usernameBadge({
          //   initial: 'DEFAULT',
          //   DEFAULT: {
          //     img: MAIN_IMG,
          //     exec: () => {
          //       console.log('ctx = ', ctx)
          //       this.openOverlay({ index: '1/2', ctx })
          //     },
          //   },
          // }),
          button({
            initial: 'DEFAULT',
            DEFAULT: {
              img: MAIN_IMG,
              label: 'LOGIN',
              init: async (_, me) => {
                const existSessions = await Core.sessions()
                console.log('existSessions', existSessions)
                if (existSessions.length !== 0) me.state = 'LOGGED'
              },
              exec: async (_, me) => {
                console.log('ctx = in LOGIN', ctx)
                // this.openOverlay({ index: '1/3', ctx })

                const existSessions = await Core.sessions()
                console.log('existSessions', existSessions)

                const newSessions = await Core.login(
                  { authMethods: ['ethereum/goerli'] },
                  {
                    onLogin: () => console.log('onLogin'),
                    onLogout: () => console.log('onLogout'),
                    // onReject: () => console.log('onReject'),
                    // onSwitch: () => console.log('onSwitch'),
                  }
                )
                console.log(newSessions)
                me.state = 'LOGGED'
              },
            },
            LOGGED: {
              img: MAIN_IMG,
              label: 'LOGOUT',
              exec: async (_, me) => {
                console.log('ctx = in LOGOUT', ctx)
                // this.openOverlay({ index: '1/3', ctx })

                const existSessions = await Core.sessions()
                await Promise.all(existSessions.map((x) => x.logout()))
                const newExistSessions = await Core.sessions()
                console.log('existSessions', newExistSessions)
                me.state = 'DEFAULT'
              },
            },
          }),
        ]
      },
      // HEADING: (ctx) => [
      //   usernameBadge({
      //     initial: 'DEFAULT',
      //     DEFAULT: {
      //       img: MAIN_IMG,
      //       exec: async () => {
      //         console.log('ctx = ', ctx)
      //         this.openOverlay({ index: '2/0', ctx })
      //         const newExistSessions = await Core.sessions()
      //         console.log('existSessions', newExistSessions)
      //       },
      //     },
      //   }),
      // ],
      // SUSPENDED: (ctx) => [
      //   avatar({
      //     initial: 'DEFAULT',
      //     DEFAULT: {
      //       img: MAIN_IMG,
      //       exec: () => {
      //         console.log('ctx = ', ctx)
      //         this.openOverlay({ index: '3/0', ctx })
      //       },
      //     },
      //   }),
      //   usernameBadge({
      //     initial: 'DEFAULT',
      //     DEFAULT: {
      //       img: MAIN_IMG,
      //       exec: () => {
      //         console.log('ctx = ', ctx)
      //         this.openOverlay({ index: '3/1', ctx })
      //       },
      //     },
      //   }),
      // ],
    }
    const { $ } = this.adapter.attachConfig(this._config)
    this._$ = $
  }

  openOverlay(props?: any): void {
    this._overlay.send(
      'data',
      this._adapterDescription
        ? { ...props, adapterDescription: this._adapterDescription }
        : { ...props }
    )
  }
}
