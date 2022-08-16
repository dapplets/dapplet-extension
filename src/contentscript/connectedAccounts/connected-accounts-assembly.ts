export interface IConditionProps {
  tw_id: string
  near_id: string
  url: string
  user: string
}

export const connectionCondition = (props: IConditionProps) => {
  const { tw_id, near_id, url, user } = props
  return url.includes(tw_id) && user.includes(near_id)
}
