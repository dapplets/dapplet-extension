interface ISocialNetworkConnectionCondition {
  socNet_id: string
  near_id: string
  url: string
  fullname: string
}

export const socialNetworkConnectionCondition = (props: ISocialNetworkConnectionCondition) => {
  const { socNet_id, near_id, url, fullname } = props
  return url.includes(socNet_id) && fullname.includes(near_id)
}
