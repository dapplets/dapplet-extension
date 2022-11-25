export interface IConditionProps {
  socNet_id: string
  near_id: string
  url: string
  user: string
}

export const connectionCondition = (props: IConditionProps) => {
  const { socNet_id, near_id, url, user } = props
  return url.includes(socNet_id) && user.includes(near_id)
}
