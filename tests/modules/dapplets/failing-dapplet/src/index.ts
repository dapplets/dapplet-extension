import {} from '../../../../../lib'

@Injectable
export default class Dapplet {
  @Inject('test-common-adapter')
  public adapter: any

  async activate(): Promise<void> {
    await new Promise((_, reject) => setTimeout(reject, 3000))
  }
}
