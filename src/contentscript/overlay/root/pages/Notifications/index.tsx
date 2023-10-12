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
import { TabLoader } from '../../components/TabLoader'
import styles from './Notifications.module.scss'
export const Notifications = () => {
  const [event, setEvent] = useState<Notify[]>([])

  const [load, setLoad] = useState(true)
  const [isOlder, setOlder] = useState(false)
  const [count, setCount] = useState(8)
  const [loadNotify, setLoadNotify] = useState(false)
  const location = useLocation()
  const state = location.state as any
  console.log(state)

  const counter = () => {
    setCount((prevState) => prevState + 10)
  }

  useEffect(() => {
    const init = async () => {
      const notifications = await getNotifications()

      setEvent(notifications)
      setLoad(false)
      // checkUpdates()
    }
    init()
    return () => {}
  }, [load])

  useEffect(() => {
    const handleUpdateNotifications = async () => {
      const notifications = await getNotifications()
      setEvent(notifications)
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

  const onRemoveEvent = async (f) => {
    const { deleteNotification, getCurrentContextIds } = await initBGFunctions(browser)

    const contextIds = await getCurrentContextIds(null)

    await deleteNotification(f.id, contextIds)

    const d = event.filter((x) => x.id !== f.id)
    setEvent(d)
  }

  const onRemoveEventsAll = async (f) => {
    setLoadNotify(true)
    const { markAllNotificationsAsViewed, deleteAllNotifications } = await initBGFunctions(browser)
    await markAllNotificationsAsViewed(f)
    setTimeout(() => setLoadNotify(false), 1000)
    const notification = await getNotifications()
    setEvent(notification)
  }

  const checkUpdates = async () => {
    const { getNewExtensionVersion } = await initBGFunctions(browser)
    const isUpdateAvailable = await getNewExtensionVersion()
  }

  const getReadNotifications = async (id) => {
    const { markNotificationAsViewed } = await initBGFunctions(browser)

    await markNotificationAsViewed(id)

    const notification = await getNotifications()
    setEvent(notification)
  }

  return (
    <div className={styles.wrapper} data-testid="notification">
      <>
        {load ? (
          <TabLoader />
        ) : (
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
                {loadNotify ? (
                  // todo: unificate loaders
                  // todo: unificate bg in pages
                  <div className={styles.loaderNotify}></div>
                ) : (
                  <>
                    {event.length > 0 &&
                      event
                        .sort((x, i) =>
                          x.status === NotificationStatus.Highlighted
                            ? -1
                            : i.status === NotificationStatus.Highlighted
                            ? 0
                            : 1
                        )
                        // .filter((x) => x.status === NotificationStatus.Highlighted)
                        .map((x, i) => {
                          if (i < count) {
                            return (
                              <Notification
                                onClear={getReadNotifications}
                                icon={x.icon ? x.icon : IconDefault}
                                //
                                key={x.id}
                                label={'System'}
                                title={x.title}
                                description={x.message}
                                _id={x.id}
                                date={x.createdAt}
                                actions={x.actions}
                                teaser={x.teaser}
                                stateNotify={state ? state : null}
                                isRead={x.status}
                              />
                            )
                          }
                        })}
                  </>
                )}

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
        )}
      </>
    </div>
  )
}
