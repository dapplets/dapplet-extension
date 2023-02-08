import { initBGFunctions } from 'chrome-extension-message-wrapper'
import TimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en'
import React, { useEffect, useState } from 'react'
import { browser } from 'webextension-polyfill-ts'
import { Notification as Notify } from '../../../../../common/models/notification'
// import { CloseIcon } from '../../components/CloseIcon'
import * as EventBus from '../../../../../common/global-event-bus'
import IconDefault from '../../assets/icons/notificationIcons/defaultIcon.svg'
import { Notification } from '../../components/Notification'
import { TabLoader } from '../../components/TabLoader'
import useAbortController from '../../hooks/useAbortController'
import styles from './Notifications.module.scss'

TimeAgo.addLocale(en)

export const Notifications = () => {
  const [event, setEvent] = useState([])
  const [load, setLoad] = useState(true)
  const [isOlder, setOlder] = useState(false)
  // const [isUpdateAvailable, onUpdateAvailable] = useState(false)
  const abortController = useAbortController()
  useEffect(() => {
    const init = async () => {
      const notifications = await getNotifications()

      setEvent(notifications)
      setLoad(false)
      // checkUpdates()

      EventBus.on('SHOW NOTIFICATION', async () => {
        const notifications = await getNotifications()

        return setEvent(notifications)
      })

      EventBus.on('READ NOTIFICATION', async () => {
        const notifications = await getNotifications()
        return setEvent(notifications)
      })
      EventBus.on('READ ALL NOTIFICATION', async () => {
        const notifications = await getNotifications()
        setEvent(notifications)
      })
    }
    init()
    return () => {
      EventBus.off('SHOW NOTIFICATION', async () => {
        const notifications = await getNotifications()

        return setEvent(notifications)
      })

      EventBus.off('READ NOTIFICATION', async () => {
        const notifications = await getNotifications()
        return setEvent(notifications)
      })
      EventBus.off('READ ALL NOTIFICATION', async () => {
        const notifications = await getNotifications()
        setEvent(notifications)
      })
    }
  }, [load])

  const getNotifications = async () => {
    const backgroundFunctions = await initBGFunctions(browser)
    const { getNotifications } = backgroundFunctions
    // todo: argument mocked
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
    const { markNotificationAsViewedAll } = await initBGFunctions(browser)
    await markNotificationAsViewedAll(f)
    setEvent(f)
  }

  const checkUpdates = async () => {
    const { getNewExtensionVersion } = await initBGFunctions(browser)
    const isUpdateAvailable = await getNewExtensionVersion()
    // if (!abortController.signal.aborted) {
    // onUpdateAvailable(isUpdateAvailable)
    // }
  }
  const getReadNotifications = async (id) => {
    const backgroundFunctions = await initBGFunctions(browser)
    const { markNotificationAsViewed } = backgroundFunctions

    await markNotificationAsViewed(id)

    await getNotifications
  }
  return (
    <div className={styles.wrapper}>
      <>
        {load ? (
          <TabLoader />
        ) : (
          <div className={styles.block}>
            <div className={styles.warning}>
              <span>Some of the network functions are not available.</span>
              <span>We are already working on a solution.</span>
            </div>

            <div className={styles.notification}>
              <>
                <div className={styles.titleWrapper}>
                  <span className={styles.titleBlock}>Announcements</span>
                  <div className={styles.delimeter}></div>
                </div>
                <span className={styles.notOlder}>Nothing here</span>
              </>

              <>
                <div className={styles.titleWrapper}>
                  <span className={styles.titleBlock}>From dapplets</span>
                  <div className={styles.delimeter}></div>
                </div>
                {event.length > 0 &&
                  event
                    .filter((x) => x.status === 1)
                    .map((x, i) => {
                      return (
                        <Notification
                          onClear={getReadNotifications}
                          // todo: mocked
                          icon={IconDefault}
                          //
                          key={x.id}
                          label={'System'}
                          title={x.title}
                          description={x.message}
                          _id={x.id}
                          date={x.expiresAt}
                        />
                      )
                    })}
                <button className={styles.btnNotification} onClick={() => setOlder(!isOlder)}>
                  Show old
                </button>
              </>

              {isOlder ? (
                <>
                  <div className={styles.titleWrapper}>
                    <span className={styles.titleBlock}>Older notifications</span>
                    <div className={styles.delimeter}></div>
                  </div>
                  {event.length > 0 &&
                    event
                      .filter((x) => x.status === 0)
                      .map((x, i) => {
                        return x ? (
                          <Notification
                            onClear={() => {
                              setTimeout(() => {
                                onRemoveEvent(x)
                              }, 500)
                            }}
                            // todo: mocked
                            icon={IconDefault}
                            //
                            key={x.id}
                            label={'System'}
                            title={x.title}
                            description={x.message}
                            _id={x.id}
                            date={x.expiresAt}
                            isRead={x.status}
                          />
                        ) : (
                          <span className={styles.notOlder}>Nothing here</span>
                        )
                      })}

                  <button
                    disabled
                    className={styles.btnNotification}
                    onClick={() => setOlder(true)}
                  >
                    Load more
                  </button>
                </>
              ) : null}
            </div>

            {/* <div className={styles.notificationClose}>
              <CloseIcon onClick={() => onRemoveEventsAll(event)} appearance="big" color="red" />
              <span className={styles.clearAll}>Clear all</span>
            </div> */}
          </div>
        )}
      </>

      {/* {!event.length && <div className={styles.noNot}>Nothing here</div>} */}
    </div>
  )
}
