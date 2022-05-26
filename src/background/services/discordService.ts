import GlobalConfigService from './globalConfigService'

interface IDiscordMessage {
  authorUsername: string
  content: string
  timestamp: string
  link: string
}

export default class DiscordService {
  constructor(private _globalConfigService: GlobalConfigService) {}

  async getDiscordMessages(): Promise<any> {
    const url = `https://dapplet-api.herokuapp.com/announcements`
    try {
      const resp = await fetch(url)
      const parsedResp = await resp.json()
      if (!parsedResp.success) throw new Error(parsedResp.message)

      const messages: IDiscordMessage[] = parsedResp.data

      const lastTimestamp = await this._globalConfigService.getLastMessageSeenTimestamp()
      if (!lastTimestamp) return messages

      const lastTimestampDateMs = new Date(lastTimestamp).getTime()
      return messages.filter((msg) => new Date(msg.timestamp).getTime() > lastTimestampDateMs)
    } catch (err) {
      console.error(err)
    }
    return []
  }

  async hideDiscordMessages(timestamp: string) {
    await this._globalConfigService.setLastMessageSeenTimestamp(timestamp)
  }
}
