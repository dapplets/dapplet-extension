import { initBGFunctions } from 'chrome-extension-message-wrapper'
import TimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en'
import React, { useEffect, useState } from 'react'
import { browser } from 'webextension-polyfill-ts'
import { Event } from '../../../../../common/models/event'
// import { CloseIcon } from '../../components/CloseIcon'
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
  const [isUpdateAvailable, onUpdateAvailable] = useState(false)
  const abortController = useAbortController()
  useEffect(() => {
    const init = async () => {
      const notifications = await getNotifications()
      if (!abortController.signal.aborted) {
        setEvent(notifications)
        setLoad(false)
        checkUpdates()
      }
    }
    init()
    return () => {
      abortController.abort
    }
  }, [event, load, abortController.signal.aborted])

  const getNotifications = async () => {
    const backgroundFunctions = await initBGFunctions(browser)
    const { getEvents, setRead } = backgroundFunctions

    const notifications: Event[] = await getEvents()

    return notifications
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

  const checkUpdates = async () => {
    const { getNewExtensionVersion } = await initBGFunctions(browser)
    const isUpdateAvailable = await getNewExtensionVersion()
    if (!abortController.signal.aborted) {
      onUpdateAvailable(isUpdateAvailable)
    }
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
                <div className={styles.warning}>
                  <span>Some of the network functions are not available.</span>
                  <span>We are already working on a solution.</span>
                </div>

                <div className={styles.notification}>
                  {/* <div className={styles.announcements}> */}
                  <>
                    <div className={styles.titleWrapper}>
                      <span className={styles.titleBlock}>Announcements</span>
                      <div className={styles.delimeter}></div>
                    </div>
                    <span className={styles.notOlder}>Nothing here</span>
                  </>
                  {/* </div> */}
                  {/* <div className={styles.eventDapplets}> */}
                  <>
                    <div className={styles.titleWrapper}>
                      <span className={styles.titleBlock}>From dapplets</span>
                      <div className={styles.delimeter}></div>
                    </div>
                    {event.length > 0 &&
                      event.map((x, i) => {
                        return (
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
                            description={x.description}
                            _id={x.id}
                            date={x.created}
                          />
                        )
                      })}
                    <button className={styles.btnNotification} onClick={() => setOlder(!isOlder)}>
                      Show old
                    </button>
                  </>
                  {/* </div> */}
                  {/* <div className={styles.older}> */}

                  {isOlder ? (
                    <>
                      <div className={styles.titleWrapper}>
                        <span className={styles.titleBlock}>Older notifications</span>
                        <div className={styles.delimeter}></div>
                      </div>
                      <span className={styles.notOlder}>Nothing here</span>
                      <button
                        disabled
                        className={styles.btnNotification}
                        onClick={() => setOlder(true)}
                      >
                        Load more
                      </button>
                    </>
                  ) : null}

                  {/* </div> */}
                </div>

                {/* <div className={styles.notificationClose}>
                  <CloseIcon
                    onClick={() => onRemoveEventsAll(event)}
                    appearance="big"
                    color="red"
                  />
                  <span className={styles.clearAll}>Clear all</span>
                </div> */}
              </div>
            )) ||
              ''}
          </>
        )}
      </>

      {!event.length && <div className={styles.noNot}>Nothing here</div>}
    </div>
  )
}
