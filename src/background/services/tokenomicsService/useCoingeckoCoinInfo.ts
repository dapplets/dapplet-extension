import { useEffect, useState } from 'react'

type CoinInfoSchema = {
  market_cap: number | null
  trade_24h: number | null
  price_change: number | null
  price: number | null
  img_thumb: string | null
}

export const getCoingeckoCoinInfoUri = (contracts: string, quoteId: string, platformId: string) => {
  return `https://api.coingecko.com/api/v3/coins/${platformId}/contract/${contracts}`
}

export const getCoingeckoSimpleTokenPriceUri = (
  contracts: string,
  quoteId: string,
  platformId: string
) => {
  return `https://api.coingecko.com/api/v3/simple/token_price/${platformId}?contract_addresses=${contracts}&vs_currencies=${quoteId}`
}

export const fetchCoingeckoCoinInfo =
  (fetchFunction: any) => async (contract: string, quote: string, platform: string) => {
    try {
      const addr = contract.toLowerCase()
      const quoteId = quote.toLowerCase()
      const platformId = platform.toLowerCase()
      const url = getCoingeckoCoinInfoUri(addr, quoteId, platformId)

      const data = await fetchFunction(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await data.json()

      const price = result.market_data
      const img_thumb = result.image.thumb

      const priceData = {
        market_cap: price.market_cap[quoteId] ? price.market_cap[quoteId] : null,
        trade_24h: price.total_volume[quoteId] ? price.total_volume[quoteId] : null,
        price_change: price.price_change_percentage_24h_in_currency[quoteId]
          ? price.price_change_percentage_24h_in_currency[quoteId]
          : null,
        price: price.current_price[quoteId] ? price.current_price[quoteId] : null,
        img_thumb: img_thumb ? img_thumb : null,
      }

      return priceData ? priceData : undefined
    } catch (_) {
      return undefined
    }
  }

export const getCoingeckoCoinInfo = fetchCoingeckoCoinInfo(
  typeof window !== 'undefined' && window.fetch
)

export async function getCoingeckoTokenPrices(
  contracts: string[],
  quote: string,
  platform: string
): Promise<number[]> {
  const url = getCoingeckoCoinInfoUri(contracts.join(','), quote, platform)
  const res = await fetch(url)
  const data = await res.json()
  return contracts.map((address) => data[address][quote])
}

export const useCoingeckoCoinInfo = (
  contract: string | null,
  quote = 'usd',
  platform = 'ethereum'
): CoinInfoSchema | undefined => {
  const [price, setPrice] = useState<CoinInfoSchema | undefined>(undefined)
  // const blockNo = useBlockNumber();

  useEffect(() => {
    async function getPrice() {
      if (!contract) return
      const tokenPrice = await getCoingeckoCoinInfo(contract, quote, platform)
      setPrice(tokenPrice)
    }

    void getPrice()
  }, [contract, quote, platform]) // blockNo
  console.log(price)
  return price
}
