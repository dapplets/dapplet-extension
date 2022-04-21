import React, { ReactElement, useState, useEffect, useMemo, FC } from 'react'
import cn from 'classnames'
import styles from './DappletsInfoSettings.module.scss'
import { SettingWrapper } from '../../components/SettingWrapper'
import { SettingItem } from '../../components/SettingItem'
import {
  isValidHttp,
  isValidUrl,
  isValidPostageStampId,
} from '../../../../../popup/helpers'
import { browser } from 'webextension-polyfill-ts'
import { initBGFunctions } from 'chrome-extension-message-wrapper'
import { useToggle } from '../../hooks/useToggle'
import { Bus } from '../../../../../common/bus'
import ModuleInfo from '../../../../../background/models/moduleInfo'
import VersionInfo from '../../../../../background/models/versionInfo'
import * as tracing from '../../../../../common/tracing'
import { ChainTypes, DefaultSigners } from '../../../../../common/types'
import { typeOfUri, chainByUri, joinUrls } from '../../../../../common/helpers'
import {
  DEFAULT_BRANCH_NAME,
  ModuleTypes,
  StorageTypes,
} from '../../../../../common/constants'
export interface DappletsInfoSettings {
  isDappletsDetails: boolean
  setDappletsDetail: (x) => void
}

export const DappletsInfoSettings: FC<DappletsInfoSettings> = (props) => {
  const { isDappletsDetails, setDappletsDetail } = props
  const [contextId, setContextId] = useState({ contextForm: [] })
  const newAuthorObject = {
    contextForm: 'Video',
  }
  const addButtonClickHandler = () => {
    const newContext = Object.assign({}, contextId)
    newContext.contextForm.push(newAuthorObject)
    setContextId(newContext)
  }

  const onDeleteChild = (id: number) => {
    const newContext = Object.assign({}, contextId)
    newContext.contextForm.splice(id, 1)
    setContextId(newContext)
  }
  return (
    <div className={styles.wrapper}>
      <div className={styles.mainInfoBlock}>
        <SettingWrapper
          title="Parameters"
          children={
            <div className={styles.parametersBlock}>
              <div className={styles.wrapperContextID}>
                <div className={styles.blockContextID}>
                  <h3 className={styles.blockContextIDTitle}>Context IDs</h3>
                  <button
                    onClick={addButtonClickHandler}
                    className={styles.contextIDButton}
                  />
                </div>
                {contextId.contextForm.map((x, i) => (
                  <div key={i} className={styles.blockContext}>
                    <input
                      className={styles.blockContextTitle}
                      placeholder={x.contextForm}
                      onChange={(e) => e.target.value}
                    />

                    <button
                      onClick={() => onDeleteChild(i)}
                      className={styles.contextDelete}
                    />
                  </div>
                ))}
              </div>
            </div>
          }
        />
      </div>
      <div className={styles.linkNavigation}>
        <button
          onClick={() => setDappletsDetail(false)}
          className={styles.back}
        >
          Back
        </button>
        <a className={styles.push}>Push changes</a>
      </div>
    </div>
  )
}
