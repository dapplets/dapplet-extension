import {} from '../../../../lib'

@Injectable
export default class DemoDapplet {
  @Inject('test-common-adapter')
  public adapter: any

  async activate(): Promise<void> {
    const { button } = this.adapter.exports
    this.adapter.attachConfig({
      BODY: () => [
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
                    title: 'Ok',
                  },
                ],
              })
            },
          },
        }),
      ],
    })
  }

  @OnEvent('notification_action')
  handleNotificationActionWithDecorator({ payload }) {
    if (payload.key === 'value') {
      Core.notify('PASS')
    }
  }
}
