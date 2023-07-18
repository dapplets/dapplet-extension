import { generateGuid } from '../../common/generateGuid'
import GlobalConfigService from './globalConfigService'

const MATOMO_API_URL = 'https://mtmo.mooo.com/matomo.php'
const ID_SITE = 1

export enum AnalyticsGoals {
  ExtensionInstalled = '1',
  ExtensionIconClicked = '2',
  DappletActivated = '3',
  DappletDeactivated = '4',
  MovedToStore = '5',
  MovedToNftMarketplace = '6',
}

export type TrackParams = {
  idgoal?: AnalyticsGoals
  url?: string
  dapplet?: string
}

export class AnalyticsService {
  constructor(private _globalConfigService: GlobalConfigService) {}

  public async track(p: TrackParams) {
    await this._request({
      idgoal: p.idgoal,
      url: p.url ? `https://extension` + p.url : undefined,
      dimension1: p.dapplet,
    })
  }

  private async _request(params: { [key: string]: string }) {
    if (EXTENSION_ENV !== 'production') return
    if (!(await this._isActive())) return

    const visitorId = await this._getUserAgentId()
    const userAgentName = await this._globalConfigService.getUserAgentName()

    const time = new Date()
    const url = new URL(MATOMO_API_URL)

    url.searchParams.set('idsite', ID_SITE.toString())
    url.searchParams.set('rec', '1')
    url.searchParams.set('apiv', '1')
    url.searchParams.set('_id', visitorId)
    url.searchParams.set('rand', generateGuid())
    url.searchParams.set('h', time.getHours().toString())
    url.searchParams.set('m', time.getMinutes().toString())
    url.searchParams.set('s', time.getSeconds().toString())
    url.searchParams.set('dimension2', EXTENSION_VERSION)

    if (userAgentName) {
      url.searchParams.set('uid', userAgentName)
    } else {
      url.searchParams.set('cid', visitorId)
    }

    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) url.searchParams.set(k, v)
    })

    await fetch(url, { method: 'POST' }).catch((err) => console.error(err))
  }

  private async _isActive(): Promise<boolean> {
    return this._globalConfigService.getUserTracking()
  }

  private async _getUserAgentId(): Promise<string> {
    const guid = await this._globalConfigService.getUserAgentId()
    return guid.substring(0, 16)
  }
}
