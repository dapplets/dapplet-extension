import { initBGFunctions } from 'chrome-extension-message-wrapper'
import cn from 'classnames'
import React, { FC, useEffect, useState } from 'react'
import { browser } from 'webextension-polyfill-ts'
import * as EventBus from '../../../../../common/global-event-bus'
import { ReactComponent as EndImg } from './assets/end.svg'
import { ReactComponent as PromoImg } from './assets/promo.svg'
import styles from './BaseOnbording.module.scss'
import { Button } from './components/Button'
import { Skip } from './components/Skip'
import { Title } from './components/Title'
export type OnbordingProps = {}

export enum PagesTitle {
  PROMO = 0,
  STEP_1 = 1,
  STEP_2 = 2,
  STEP_3 = 3,
  END = 4,
}

export const Onbording: FC<OnbordingProps> = (props: OnbordingProps) => {
  const [page, setPage] = useState(PagesTitle.PROMO)
  const [titleOnbording, setTitleOnbording] = useState('Introduction')
  const [step, setStep] = useState('1')

  const [firstInstallation, setFirstInstallation] = useState(false)
  useEffect(() => {
    const init = async () => {
      await _updateData()
    }
    init()
    return () => {}
  }, [])
  useEffect(() => {
    EventBus.on('onbording_update', _updateData)
    return () => {
      EventBus.off('onbording_update', _updateData)
    }
  }, [])
  const _updateData = async () => {
    const { getIsFirstInstallation } = await initBGFunctions(browser)
    const IsFirstInstallation = await getIsFirstInstallation()
    setFirstInstallation(IsFirstInstallation)
  }

  const closeInstallation = async () => {
    const { setIsFirstInstallation } = await initBGFunctions(browser)
    setFirstInstallation(false)
    setStep('1')
    setTitleOnbording('Introduction')
    setPage(PagesTitle.PROMO)
    await setIsFirstInstallation(false)
  }

  return (
    <>
      {firstInstallation ? (
        <div className={cn(styles.wrapper)}>
          {page === PagesTitle.PROMO && (
            <div className={cn(styles.promoBlock)}>
              <Title
                setPage={setPage}
                setStep={setStep}
                setTitleOnbording={setTitleOnbording}
                step={step}
                value={titleOnbording}
              />
              <PromoImg />
              <div className={styles.text}>
                Hi. Dapplets Extension is your portal to the world of the augmented Internet. Real
                WEB3 right in your browser. Fasten your seatbelts! Click the mustache button to open
                the dapplets list.
              </div>
              <div className={styles.buttonBlock}>
                <Skip onSkip={() => closeInstallation()} />
                <Button
                  value={'Next'}
                  onNext={() => {
                    setStep('2')
                    setTitleOnbording(`Step 1 of 3`)
                    setPage(PagesTitle.STEP_1)
                  }}
                />
              </div>
            </div>
          )}
          {page === PagesTitle.STEP_1 && (
            <div className={cn(styles.promoBlock)}>
              <Title
                setStep={setStep}
                setTitleOnbording={setTitleOnbording}
                setPage={setPage}
                step={step}
                isActive
                value={titleOnbording}
              />
              <div className={styles.text}>
                Our extension gives you the ability to <span className={styles.darkColor}>add</span>{' '}
                almost any <span className={styles.darkColor}>functionality</span> on top of
                familiar WEB2 websites directly in your browser with the help of{' '}
                <span className={styles.darkColor}>dapplets</span> - mini-applications available
                from this interface. We've added some for you ;)
              </div>
              <div className={styles.buttonBlock}>
                <Skip onSkip={() => closeInstallation()} />
                <Button
                  value={'Next'}
                  onNext={() => {
                    setStep('3')
                    setTitleOnbording(`Step 2 of 3`)
                    setPage(PagesTitle.STEP_2)
                  }}
                />
              </div>
            </div>
          )}
          {page === PagesTitle.STEP_2 && (
            <div className={cn(styles.promoBlock)}>
              <Title
                setStep={setStep}
                setTitleOnbording={setTitleOnbording}
                setPage={setPage}
                step={step}
                isActive
                value={titleOnbording}
              />
              <div className={styles.text}>
                It's time to get to know the contexts. We call a context the environment (website)
                in which the dapplet runs. Depending on the contexts, dapplets can be active or
                inactive. For example, a dapplet for Twitter will not work on Youtube.
              </div>
              <div className={styles.buttonBlock}>
                <Skip onSkip={() => closeInstallation()} />
                <Button
                  value={'Next'}
                  onNext={() => {
                    setStep('4')
                    setTitleOnbording(`Step 3 of 3`)
                    setPage(PagesTitle.STEP_3)
                  }}
                />
              </div>
            </div>
          )}
          {page === PagesTitle.STEP_3 && (
            <div className={cn(styles.promoBlock)}>
              <Title
                setStep={setStep}
                setTitleOnbording={setTitleOnbording}
                setPage={setPage}
                step={step}
                isActive
                value={titleOnbording}
              />
              <div className={styles.text}>
                Dapplets can be turned on and off with these switches. Try it, it's easy. After
                enabling the dapplet, the result will immediately appear on the page.
              </div>
              <Button
                big
                value={'Finish onboarding'}
                onNext={() => {
                  setStep('5')
                  setTitleOnbording(`Congratulations!`)
                  setPage(PagesTitle.END)
                }}
              />
            </div>
          )}
          {page === PagesTitle.END && (
            <div className={cn(styles.promoBlock)}>
              <Title
                setStep={setStep}
                setTitleOnbording={setTitleOnbording}
                setPage={setPage}
                step={step}
                value={titleOnbording}
              />
              <EndImg />
              <div style={{ marginBottom: '10px' }} className={styles.text}>
                There are many more interesting things you can do with our extension, which we will
                tell you about in future releases, but in the meantime feel free to explore the
                possibilities of our extension yourself.
              </div>
              <Button big value={'Close'} onNext={() => closeInstallation()} />
            </div>
          )}
        </div>
      ) : null}
    </>
  )
}
