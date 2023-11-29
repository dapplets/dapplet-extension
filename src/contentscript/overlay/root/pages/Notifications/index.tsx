import { initBGFunctions } from 'chrome-extension-message-wrapper'
import cn from 'classnames'
import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import browser from 'webextension-polyfill'
import * as EventBus from '../../../../../common/global-event-bus'
import {
  Notification as Notify,
  NotificationStatus,
  NotificationType,
} from '../../../../../common/models/notification'
import IconDefault from '../../assets/icons/notificationIcons/defaultIcon.svg'
import { Notification } from '../../components/Notification'
import styles from './Notifications.module.scss'

const sortEvents = (events: Notify[]): Notify[] =>
  events.sort(
    (a, b) =>
      (a.status === NotificationStatus.Highlighted ? 0 : 1) -
        (b.status === NotificationStatus.Highlighted ? 0 : 1) ||
      new Date(b.createdAt).valueOf() - new Date(a.createdAt).valueOf()
  )

export const Notifications = () => {
  const [event, setEvent] = useState<Notify[]>([])
  const [load, setLoad] = useState(true)
  // const [isOlder, setOlder] = useState(false)
  const [count, setCount] = useState(8)
  // const [loadNotify, setLoadNotify] = useState(false)
  const location = useLocation()
  const state = location.state as any

  const counter = () => {
    setCount((prevState) => prevState + 10)
  }

  useEffect(() => {
    const init = async () => {
      const notifications = await getNotifications()
      setEvent(sortEvents(notifications))
      setLoad(false)
      // checkUpdates()
    }
    load && init()
  }, [load])

  useEffect(() => {
    const handleUpdateNotifications = async () => {
      const notifications = await getNotifications()
      setEvent(sortEvents(notifications))
    }

    EventBus.on('notifications_updated', handleUpdateNotifications)

    return () => {
      EventBus.off('notifications_updated', handleUpdateNotifications)
    }
  }, [])

  const getNotifications = async () => {
    const backgroundFunctions = await initBGFunctions(browser)
    const { getNotifications } = backgroundFunctions
    // todo: argument mocked
    const notifications: Notify[] = await getNotifications(NotificationType.Application)

    return notifications
  }

  // const onRemoveEvent = async (f) => {
  //   const { deleteNotification, getCurrentContextIds } = await initBGFunctions(browser)

  //   const contextIds = await getCurrentContextIds(null)

  //   await deleteNotification(f.id, contextIds)

  //   const d = event.filter((x) => x.id !== f.id)
  //   // .sort((x, i) =>
  //   //   x.status === NotificationStatus.Highlighted
  //   //     ? -1
  //   //     : i.status === NotificationStatus.Highlighted
  //   //     ? 0
  //   //     : 1
  //   // )
  //   setEvent(d)
  // }

  const onRemoveEventsAll = async (f) => {
    // setLoadNotify(true)
    const { markAllNotificationsAsViewed } = await initBGFunctions(browser)
    await markAllNotificationsAsViewed(f)
    // setTimeout(() => setLoadNotify(false), 1000)
    const notification = await getNotifications()
    setEvent(sortEvents(notification))
  }

  // const checkUpdates = async () => {
  //   const { getNewExtensionVersion } = await initBGFunctions(browser)
  //   const isUpdateAvailable = await getNewExtensionVersion()
  // }

  const setReadNotifications = async (id) => {
    const { markNotificationAsViewed } = await initBGFunctions(browser)

    await markNotificationAsViewed(id)

    const notification = await getNotifications()
    setEvent(sortEvents(notification))
  }

  return (
    <div className={styles.wrapper} data-testid="notification">
      <>
        {/* {load ? (
          <TabLoader />
        ) : ( */}
        <div className={styles.block}>
          {/* <div className={styles.warning}>
              <span>Some of the network functions are not available.</span>
              <span>We are already working on a solution.</span>
            </div> */}

          <div className={styles.notification}>
            {/* <>
                <div className={styles.titleWrapper}>
                  <span className={styles.titleBlock}>Announcements</span>
                  <div className={styles.delimeter}></div>
                </div>
                <span className={styles.notOlder}>Nothing here</span>
              </> */}
            {!load ? (
              <>
                <div className={styles.titleWrapper}>
                  <span className={styles.titleBlock}>Notifications</span>
                  <button
                    className={cn(styles.btnNotification, styles.isRead)}
                    onClick={() => onRemoveEventsAll(event)}
                    disabled={
                      event &&
                      event.filter((x) => x.status === NotificationStatus.Highlighted).length === 0
                    }
                  >
                    Mark all as read
                  </button>
                </div>

                <>
                  {event?.length > 0 &&
                    event.map((x, i) => {
                      if (i < count) {
                        return (
                          <Notification
                            onClear={setReadNotifications}
                            icon={x.icon ? x.icon : IconDefault}
                            key={x.id}
                            label={'System'}
                            title={x.title}
                            description={x.message}
                            _id={x.id}
                            date={x.createdAt}
                            actions={x.actions}
                            stateNotify={state ? state : null}
                            status={x.status}
                          />
                        )
                      }
                    })}
                </>
                {/* )} */}

                <>
                  {/* {event.length > 0 &&
                    event
                      .filter((x) => x.status === NotificationStatus.Default)
                      .map((x, i) => {
                        if (i < count) {
                          return x ? (
                            <Notification
                              onClear={() => {
                                onRemoveEvent(x)
                              }}
                              // todo: mocked
                              icon={x.icon ? x.icon : IconDefault}
                              //
                              key={x.id}
                              label={'System'}
                              title={x.title}
                              description={x.message}
                              _id={x.id}
                              date={x.createdAt}
                              isRead={x.status}
                            />
                          ) : (
                            <span className={styles.notOlder}>Nothing here</span>
                          )
                        }
                      })} */}

                  <button
                    disabled={
                      count >=
                      // .filter((x) => x.status === NotificationStatus.Default)
                      event.length
                    }
                    className={styles.btnNotification}
                    onClick={() => counter()}
                  >
                    Load more
                  </button>
                </>
              </>
            ) : null}

            {/* {isOlder ? (
                <>
                 
                  {event.length > 0 &&
                    event
                      .filter((x) => x.status === NotificationStatus.Default)
                      .map((x, i) => {
                        if (i < count) {
                          return x ? (
                            <Notification
                              onClear={() => {
                                onRemoveEvent(x)
                              }}
                              // todo: mocked
                              icon={x.icon ? x.icon : IconDefault}
                              //
                              key={x.id}
                              label={'System'}
                              title={x.title}
                              description={x.message}
                              _id={x.id}
                              date={x.createdAt}
                              isRead={x.status}
                            />
                          ) : (
                            <span className={styles.notOlder}>Nothing here</span>
                          )
                        }
                      })}

                  <button
                    disabled={
                      count >= event.filter((x) => x.status === NotificationStatus.Default).length
                    }
                    className={styles.btnNotification}
                    onClick={() => counter()}
                  >
                    Load more
                  </button>
                </>
              ) : null} */}
          </div>
        </div>
        {/* )} */}
      </>
      {!event.length && !load && <div className={styles.noNot}> No notifications yet</div>}
    </div>
  )
}
