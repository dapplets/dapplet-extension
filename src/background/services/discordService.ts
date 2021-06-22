import GlobalConfigService from './globalConfigService';

interface IDiscordMessage {
    authorUsername: string,
    content: string,
    timestamp: string,
    link: string,
}

export default class DiscordService {
    constructor(private _globalConfigService: GlobalConfigService) { }

    async getDiscordMessages(): Promise<any> {
      const url = `https://dapplet-api.herokuapp.com/announcements`;
      try {
          const resp = await fetch(url);
          const messages: IDiscordMessage[] = (await resp.json()).data;
          if (messages.length === 0) return [];

          const lastTimestamp = await this._globalConfigService.getLastMessageSeenTimestamp();
          if (!lastTimestamp) return messages;

          const lastTimestampDateMs = (new Date(lastTimestamp)).getTime();
          for (let i = messages.length - 1; i >= 0 ; i--) {
            const timestampDateMs = (new Date(messages[i].timestamp)).getTime();
            if (lastTimestampDateMs === timestampDateMs) return messages.slice(0, i);
            if (lastTimestampDateMs < timestampDateMs) return messages.slice(0, i + 1);
          }
          return messages;
      } catch (err) {
          console.error(err);
      }
      return [];
    }

    async hideDiscordMessages(timestamp: string) {
      await this._globalConfigService.setLastMessageSeenTimestamp(timestamp);
    }
}
