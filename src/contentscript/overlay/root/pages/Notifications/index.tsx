import React, { useEffect, useState } from 'react'
import { initBGFunctions } from 'chrome-extension-message-wrapper'
import ManifestDTO from '../../../../../background/dto/manifestDTO'
import styles from './Notifications.module.scss'
import { Notification } from '../../components/Notification'
import { CloseIcon } from '../../components/CloseIcon'
import { NOTIFICATION_LIST } from '../../components/Notification/notification-list'

import { ManifestAndDetails } from '../../../../../popup/components/dapplet'
import { browser } from 'webextension-polyfill-ts'
import { rcompare } from 'semver'
import {
  CONTEXT_ID_WILDCARD,
  ModuleTypes,
} from '../../../../../common/constants'

let _isMounted = false

export type Module = ManifestDTO & {
  isLoading: boolean
  error: string
  versions: string[]
}

export const Notifications = () => {
  return (
    <div className={styles.wrapper}>
      <div className={styles.notification}>
        {NOTIFICATION_LIST.map((x) => {
          return (
            <Notification
              key={x._id}
              label={'System'}
              message={{
                ...x,
                title: x.title,
                description: x.description,
                date: x.date,
              }}
            />
          )
        })}
      </div>
      <div className={styles.notificationClose}>
        <CloseIcon appearance="big" color="red" />
        <span className={styles.clearAll}>clear all</span>
      </div>
    </div>
  )
}
