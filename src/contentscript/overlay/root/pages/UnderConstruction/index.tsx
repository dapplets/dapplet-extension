import React, {
  ReactElement,
  useState,
  useEffect,
  useMemo,
  FC,
  useRef,
} from 'react'
import cn from 'classnames'
import styles from './UnderConstruction.module.scss'
import { SettingItem } from '../../components/SettingItem'
import { SettingWrapper } from '../../components/SettingWrapper'
export interface UnderConstruction {
  setUnderConstruction: (x) => void
}
export const UnderConstruction: FC<UnderConstruction> = (
  props: UnderConstruction
) => {
  const { setUnderConstruction } = props
  return (
    <div className={styles.wrapper}>
      <div className={styles.mainInfoBlock}>
        <SettingWrapper
          title="Social"
          children={
            <div className={styles.socialBlock}>
              <SettingItem
                title="Title"
                className={styles.item}
                component={<></>}
                children={<input className={styles.inputTitle} />}
              />
              <SettingItem
                title="Description"
                component={<></>}
                className={styles.item}
                children={<input className={styles.inputTitle} />}
              />
              <SettingItem
                title="Full description"
                component={<></>}
                className={styles.item}
                children={<textarea className={styles.fullDescription} />}
              />
            </div>
          }
        />
      </div>
      <div className={styles.linkNavigation}>
        <button
          onClick={() => setUnderConstruction(false)}
          className={styles.back}
        >
          Back
        </button>
        <a className={styles.push}>Done</a>
      </div>
    </div>
  )
}
