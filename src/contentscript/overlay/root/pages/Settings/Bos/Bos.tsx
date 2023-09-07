import { initBGFunctions } from 'chrome-extension-message-wrapper'
import React, { FC, useEffect, useState } from 'react'
import browser from 'webextension-polyfill'
import { Input } from '../../../components/Input'
import { SettingItem } from '../../../components/SettingItem'
import { SettingWrapper } from '../../../components/SettingWrapper'
import styles from './Bos.module.scss'

const EXCLUDED_COMPONENTS = ['near/widget/TosCheck']

export const Bos: FC = () => {
  const [inViewComponents, setInViewComponents] = useState<string[]>([])
  const [overrides, setOverrides] = useState<{ [widgetSrc: string]: string }>({})
  const [isEdited, setIsEdited] = useState(false)

  useEffect(() => {
    const widgets = Array.from(document.querySelectorAll('.dapplet-widget'))
    const bosComponents = widgets
      .map((el) =>
        Array.from(el.shadowRoot.querySelectorAll('*[data-bos-src]')).map((bos) =>
          bos.getAttribute('data-bos-src')
        )
      )
      .flat()
    const uniqueIds = Array.from(new Set(bosComponents)).filter(
      (comp) => !EXCLUDED_COMPONENTS.includes(comp)
    )

    setInViewComponents(uniqueIds)
  }, [])

  useEffect(() => {
    ;(async () => {
      const { getBosOverrides,getAllMutations } = await initBGFunctions(browser)
      const x = await getAllMutations()
      console.log(x);
      
      const overrides = await getBosOverrides()
      setOverrides(overrides)
    })()
  }, [])

  function handleForkClick(widgetSrc: string) {
    const url = 'https://near.org/near/widget/ComponentDetailsPage?src=' + widgetSrc
    window.open(url, '_blank')
  }

  async function handleSaveClick() {
    const { setBosOverrides } = await initBGFunctions(browser)
    await setBosOverrides(overrides)
    setIsEdited(false)
  }

  function hanldeInputChange(fromSrc: string, toSrc: string) {
    setOverrides((overrides) => ({ ...overrides, [fromSrc]: toSrc }))
    setIsEdited(true)
  }

  const outOfViewComponents = Object.keys(overrides).filter(
    (src) => !inViewComponents.includes(src)
  )

  return (
    <div className={styles.blockSettings}>
      <div className={styles.scrollBlock}>
        <SettingWrapper className={styles.wrapperSettings} title="In View">
          {inViewComponents.map((widgetSrc, i) => (
            <SettingItem
              key={i}
              title={widgetSrc}
              component={
                <button className={styles.forkButton} onClick={() => handleForkClick(widgetSrc)}>
                  Fork
                </button>
              }
            >
              <Input
                placeholder={'Enter widget source to override'}
                value={overrides[widgetSrc] ?? ''}
                onChange={(toSrc) => hanldeInputChange(widgetSrc, toSrc)}
              />
            </SettingItem>
          ))}
        </SettingWrapper>
        {outOfViewComponents.length > 0 ? (
          <SettingWrapper className={styles.wrapperSettings} title="Out of View">
            {outOfViewComponents.map((widgetSrc, i) => (
              <SettingItem
                key={i}
                title={widgetSrc}
                component={
                  <button className={styles.forkButton} onClick={() => handleForkClick(widgetSrc)}>
                    Fork
                  </button>
                }
              >
                <Input
                  placeholder={'Enter widget source to override'}
                  value={overrides[widgetSrc] ?? ''}
                  onChange={(toSrc) => hanldeInputChange(widgetSrc, toSrc)}
                />
              </SettingItem>
            ))}
          </SettingWrapper>
        ) : null}
        <div className={styles.bottomContainer}>
          <button className={styles.btnCreate} disabled={!isEdited} onClick={handleSaveClick}>
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
