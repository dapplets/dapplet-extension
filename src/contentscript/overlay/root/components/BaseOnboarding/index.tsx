import { initBGFunctions } from 'chrome-extension-message-wrapper'
import cn from 'classnames'
import React, { FC, useEffect, useState } from 'react'
import { browser } from 'webextension-polyfill-ts'
import * as EventBus from '../../../../../common/global-event-bus'
import { ReactComponent as EndImg } from './assets/end.svg'
import { ReactComponent as NormalSwitch } from './assets/Normal_switch.svg'
import { ReactComponent as PromoImg } from './assets/promo.svg'
import styles from './BaseOnboarding.module.scss'
import { Button } from './components/Button'
import { SkipButton } from './components/SkipButton'
import { Title } from './components/Title'

export enum OnboardingSteps {
  PROMO = 0,
  STEP_1 = 1,
  STEP_2 = 2,
  STEP_3 = 3,
  END = 4,
}

export const Onboarding: FC = () => {
  const [step, setStep] = useState(OnboardingSteps.PROMO)
  const [firstInstallation, setFirstInstallation] = useState(false)

  useEffect(() => {
    _updateData()
  }, [])

  useEffect(() => {
    EventBus.on('onboarding_update', _updateData)
    return () => {
      EventBus.off('onboarding_update', _updateData)
    }
  }, [])

  const _updateData = async () => {
    const { getIsFirstInstallation } = await initBGFunctions(browser)
    const IsFirstInstallation = await getIsFirstInstallation()
    setFirstInstallation(IsFirstInstallation)
  }

  const handleSkipButtonClick = async () => {
    const { setIsFirstInstallation } = await initBGFunctions(browser)
    setFirstInstallation(false)
    setStep(OnboardingSteps.PROMO)
    await setIsFirstInstallation(false)
  }

  if (!firstInstallation) return null

  return (
    <div className={cn(styles.wrapper)}>
      <div className={cn(styles.promoBlock)}>
        {step === OnboardingSteps.PROMO ? (
          <>
            <Title title="Introduction" onStepChange={setStep} currentStep={step} stepsNumber={5} />
            <PromoImg />
            <div className={styles.text}>
              Hi. Dapplets Extension is your portal to the world of the augmented Internet. Real
              WEB3 right in your browser. Fasten your seatbelts! Click the mustache button to open
              the dapplets list.
            </div>
            <div className={styles.buttonBlock}>
              <SkipButton onClick={handleSkipButtonClick} />
              <Button label="Next" onClick={() => setStep(OnboardingSteps.STEP_1)} />
            </div>
          </>
        ) : null}

        {step === OnboardingSteps.STEP_1 ? (
          <>
            <Title title="Overview" onStepChange={setStep} currentStep={step} stepsNumber={5} />
            <div className={styles.text}>
              Our extension gives you the ability to <span className={styles.darkColor}>add</span>{' '}
              almost any <span className={styles.darkColor}>functionality</span> on top of familiar
              WEB2 websites directly in your browser with the help of{' '}
              <span className={styles.darkColor}>dapplets</span> - mini-applications available from
              this interface. We&apos;ve added some for you ;)
            </div>
            <div className={styles.buttonBlock}>
              <SkipButton onClick={handleSkipButtonClick} />
              <Button label="Next" onClick={() => setStep(OnboardingSteps.STEP_2)} />
            </div>
          </>
        ) : null}

        {step === OnboardingSteps.STEP_2 ? (
          <>
            <Title title="Contexts" onStepChange={setStep} currentStep={step} stepsNumber={5} />
            <div className={styles.text}>
              It&apos;s time to get to know the contexts. We call a context the environment
              (website) in which the dapplet runs. Depending on the contexts, dapplets can be active
              or inactive. For example, a dapplet for Twitter will not work on YouTube.
            </div>
            <div className={styles.buttonBlock}>
              <SkipButton onClick={handleSkipButtonClick} />
              <Button label="Next" onClick={() => setStep(OnboardingSteps.STEP_3)} />
            </div>
          </>
        ) : null}

        {step === OnboardingSteps.STEP_3 ? (
          <>
            <Title
              title="Enable dapplet"
              onStepChange={setStep}
              currentStep={step}
              stepsNumber={5}
            />
            <div className={styles.text}>
              With these switches you can turn the Dapplets on and off.
            </div>
            <NormalSwitch />
            <div className={styles.text}>
              Try it out, it is very simple. After you activate the dapplet, the result will be
              displayed on the page immediately.
            </div>
            <Button big label="Finish onboarding" onClick={() => setStep(OnboardingSteps.END)} />
          </>
        ) : null}

        {step === OnboardingSteps.END ? (
          <>
            <Title
              title="Congratulations"
              onStepChange={setStep}
              currentStep={step}
              stepsNumber={5}
            />
            <EndImg />
            <div style={{ marginBottom: '10px' }} className={styles.text}>
              There are many more interesting things you can do with our extension, which we will
              tell you about in future releases, but in the meantime feel free to explore the
              possibilities of our extension yourself.
            </div>
            <Button big label="Close" onClick={handleSkipButtonClick} />
          </>
        ) : null}
      </div>
    </div>
  )
}
