import {} from '../../../../lib'

@Injectable
export default class DemoDapplet {
  @Inject('test-twitter-adapter')
  public adapter: any

  private subscription

  async activate(): Promise<void> {
    this.subscription = Core.events
      .ofType('notification_action')
      .subscribe(this.handleNotificationAction.bind(this))

    const { button } = this.adapter.exports
    this.adapter.attachConfig({
      POST: () => [
        button({
          DEFAULT: {
            label: 'TEST',
            exec: async () => {
              await Core.notify({
                title: 'Test Title',
                message: 'Test Message',
                payload: {
                  key: 'value',
                },
                actions: [
                  {
                    action: 'ok',
                    title: 'OK',
                  },
                ],
              })
            },
          },
        }),
      ],
    })
  }

  async deactivate(): Promise<void> {
    this.subscription.unsubscribe()
  }

  handleNotificationAction({ payload }) {
    if (payload.key === 'value') {
      Core.alert('PASS')
    }
  }
}
