import React, { useEffect, useState } from 'react'
import { initBGFunctions } from 'chrome-extension-message-wrapper'

import styles from './Notifications.module.scss'
import { Notification } from '../../components/Notification'
import { CloseIcon } from '../../components/CloseIcon'

import { addEvent } from '../../../../../background/services/eventService'

import { browser } from 'webextension-polyfill-ts'
import { rcompare } from 'semver'
import { List, Segment, Label } from 'semantic-ui-react'
import { Event } from '../../../../../common/models/event'
import {
  CONTEXT_ID_WILDCARD,
  ModuleTypes,
} from '../../../../../common/constants'

let _isMounted = false

export const Notifications = () => {
  const [event, setEvent] = useState([])

  useEffect(() => {
    _isMounted = true
    const init = async () => {
      const backgroundFunctions = await initBGFunctions(browser)
      const { getEvents, setRead } = backgroundFunctions
      const events: Event[] = await getEvents()
      setEvent(events)
      // setRead(events.map((e) => e.id))
      // console.log(events.map((e) => e.id))
    }
    init()

    return () => {
      _isMounted = false
    }
  }, [event])

  const onRemoveEvent = async (f) => {
    const { deleteEvent, getCurrentContextIds } = await initBGFunctions(browser)
    // const { deleteEvents } = deleteEvent
    const contextIds = await getCurrentContextIds(null)
    // const events: Event[] = await deleteEvent(contextIds)

    await deleteEvent(f.id, contextIds)
    const d = event.filter((x) => x.id !== f.id)
    setEvent(d)
  }
  const onRemoveEventsAll = async (f) => {
    const { deleteAllEvents } = await initBGFunctions(browser)
    await deleteAllEvents(f)
    setEvent(f)
  }

  return (
    <div className={styles.wrapper}>
      {(event.length && (
        <div className={styles.block}>
          <div className={styles.notification}>
            {event.length > 0 &&
              event.map((x) => {
                return (
                  <Notification
                    onClear={() => onRemoveEvent(x)}
                    key={x.id}
                    label={'System'}
                    message={{
                      ...x,
                      title: x.title,
                      description: x.description,
                      date: x.created,
                    }}
                  />
                )
              })}
          </div>

          <div className={styles.notificationClose}>
            <CloseIcon
              onClick={() => onRemoveEventsAll(event)}
              appearance="big"
              color="red"
            />
            <span className={styles.clearAll}>clear all</span>
          </div>
        </div>
      )) ||
        ''}

      {!event.length && (
        <div className={styles.noNot}>There is no notifications</div>
      )}
    </div>
  )
}
