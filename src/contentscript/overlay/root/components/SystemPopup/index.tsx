import TimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en'
import React from 'react'
import { Bus } from '../../../../../common/bus'

import { App } from './App'

TimeAgo.addDefaultLocale(en)

interface Props {
  bus: Bus
}

export const SystemPopup = ({ bus }: Props) => {
  return <App bus={bus} />
}
