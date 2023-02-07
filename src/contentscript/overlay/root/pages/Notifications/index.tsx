import { initBGFunctions } from 'chrome-extension-message-wrapper'
import TimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en'
import React, { useEffect, useState } from 'react'
import { browser } from 'webextension-polyfill-ts'
import { Notification as Notify } from '../../../../../common/models/event'
import { CloseIcon } from '../../components/CloseIcon'
import { Notification } from '../../components/Notification'
import { TabLoader } from '../../components/TabLoader'
import useAbortController from '../../hooks/useAbortController'
import styles from './Notifications.module.scss'

TimeAgo.addLocale(en)

export const Notifications = () => {
  const [event, setEvent] = useState([])
  const [load, setLoad] = useState(true)
  const abortController = useAbortController()
  useEffect(() => {
    const init = async () => {
      const notifications = await getNotifications()
      if (!abortController.signal.aborted) {
        setEvent(notifications)
        setLoad(false)
      }
    }
    init()
    return () => {
      abortController.abort
    }
  }, [event, load, abortController.signal.aborted])

  const getNotifications = async () => {
    const backgroundFunctions = await initBGFunctions(browser)
    const { getNotifications } = backgroundFunctions

    const notifications: Notify[] = await getNotifications(2)

    return notifications
  }

  const onRemoveEvent = async (f) => {
    const { deleteNotification, getCurrentContextIds } = await initBGFunctions(browser)

    const contextIds = await getCurrentContextIds(null)

    await deleteNotification(f.id, contextIds)

    const d = event.filter((x) => x.id !== f.id)
    setEvent(d)
  }
  const onRemoveEventsAll = async (f) => {
    const { deleteAllNotifications } = await initBGFunctions(browser)
    await deleteAllNotifications(f)
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
                          description={x.message}
                          _id={x.id}
                          date={x.createdAt}
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
