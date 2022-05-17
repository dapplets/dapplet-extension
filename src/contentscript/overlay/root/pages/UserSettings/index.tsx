import { browser } from 'webextension-polyfill-ts'
import { initBGFunctions } from 'chrome-extension-message-wrapper'
import React, {
  DetailedHTMLProps,
  HTMLAttributes,
  ReactElement,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import cn from 'classnames'
import styles from './UserSettings.module.scss'

export interface UserSettingsProps
  extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {}
let _isMounted = false
export const UserSettings = (props: UserSettingsProps): ReactElement => {
  return (
    <div>
      <div>USER SETTINGS</div>
    </div>
  )
}
