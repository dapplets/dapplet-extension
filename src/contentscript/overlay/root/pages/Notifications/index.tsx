import { initBGFunctions } from 'chrome-extension-message-wrapper'
import TimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en'
import React, { useEffect, useState } from 'react'
import { browser } from 'webextension-polyfill-ts'
import { Event } from '../../../../../common/models/event'
import { CloseIcon } from '../../components/CloseIcon'
import { Notification } from '../../components/Notification'
import { TabLoader } from '../../components/TabLoader'
import styles from './Notifications.module.scss'

TimeAgo.addLocale(en)

let _isMounted = false

export const Notifications = () => {
  const [event, setEvent] = useState([])
  const [load, setLoad] = useState(true)

  useEffect(() => {
    _isMounted = true

    const init = async () => {
      await getNotifications()
    }
    init()

    return () => {
      _isMounted = false
    }
  }, [event, load])

  const getNotifications = async () => {
    const backgroundFunctions = await initBGFunctions(browser)
    const { getEvents, setRead } = backgroundFunctions

    const events: Event[] = await getEvents()

    setEvent(events)
    setLoad(false)
  }

  const onRemoveEvent = async (f) => {
    const { deleteEvent, getCurrentContextIds } = await initBGFunctions(browser)

    const contextIds = await getCurrentContextIds(null)

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
      <>
        {load ? (
          <TabLoader />
        ) : (
          <>
            {(event.length && (
              <div className={styles.block}>
                <div className={styles.notification}>
                  {event.length > 0 &&
                    event.map((x, i) => {
                      return (
                        <Notification
                          onClear={() => {
                            setTimeout(() => {
                              onRemoveEvent(x)
                            }, 500)
                          }}
                          key={x.id}
                          label={'System'}
                          title={x.title}
                          description={x.description}
                          _id={x.id}
                          date={x.created}
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
                  <span className={styles.clearAll}>Clear all</span>
                </div>
              </div>
            )) ||
              ''}
          </>
        )}
      </>

      {!event.length && <div className={styles.noNot}>There are no notifications</div>}
    </div>
  )
}
