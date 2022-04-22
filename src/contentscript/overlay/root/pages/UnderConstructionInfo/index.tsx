import React, {
  ReactElement,
  useState,
  useEffect,
  useMemo,
  FC,
  useRef,
} from 'react'
import cn from 'classnames'
import styles from './UnderConstructionInfo.module.scss'
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
import { StorageRefImage } from '../../components/DevModulesList'
import {
  DEFAULT_BRANCH_NAME,
  ModuleTypes,
  StorageTypes,
} from '../../../../../common/constants'
const iconInputChangeHandler = async (
  event: React.ChangeEvent<HTMLInputElement>
) => {
  // const s = this.state
  const files = event.target.files
  if (files.length > 0) {
    const file = files[0]
    const base64: string = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (error) => reject(error)
    })
    // mi.icon = {
    //   hash: null,
    //   uris: [base64],
    // }
  } else {
    // mi.icon = null
  }
  // setMi(mi)
  // console.log(mi)
}

export interface UnderConstructionInfoProps {
  // isDappletsDetails: boolean
  // setDappletsDetail: (x) => void
  // ModuleInfo: any
  // ModuleVersion: any
  setUnderConstructionDetails: (x) => void
}
let _isMounted = false

export const UnderConstructionInfo: FC<UnderConstructionInfoProps> = (
  props
) => {
  const { setUnderConstructionDetails } = props

  const [author, setAuthor] = useState({ authorForm: [] })
  const newAuthorObject = {
    author: 'New admins',
  }
  const addButtonClickHandler = () => {
    const newAuthor = Object.assign({}, author)
    newAuthor.authorForm.push(newAuthorObject)
    setAuthor(newAuthor)
  }

  const onDeleteChild = (id: number) => {
    const newAuthor = Object.assign({}, author)
    newAuthor.authorForm.splice(id, 1)
    setAuthor(newAuthor)
  }

  const [contextId, setContextId] = useState({ contextForm: [] })
  const newContextObject = {
    contextForm: 'Video',
  }
  const addButtonClickHandlerContext = () => {
    const newContext = Object.assign({}, contextId)
    newContext.contextForm.push(newContextObject)
    setContextId(newContext)
  }

  const onDeleteChildContext = (id: number) => {
    const newContext = Object.assign({}, contextId)
    newContext.contextForm.splice(id, 1)
    setContextId(newContext)
  }
  return (
    <div className={styles.wrapper}>
      <div className={styles.mainInfoBlock}>
        <SettingWrapper
          className={styles.wrapperSettings}
          title="Social"
          children={
            <div className={styles.socialBlock}>
              <SettingItem
                title="Name"
                className={styles.item}
                component={<></>}
                children={
                  <div className={styles.moduleTitle}>
                    <input
                      // value={miTitle}
                      onChange={(e) => {
                        // setMiTitle(e.target.value)
                      }}
                      className={styles.inputTitle}
                    />
                  </div>
                }
              />
              <SettingItem
                title="Title"
                className={styles.item}
                component={<></>}
                children={
                  <input
                    // value={miTitle}
                    onChange={(e) => {
                      // setMiTitle(e.target.value)
                    }}
                    className={styles.inputTitle}
                  />
                }
              />
              <SettingItem
                title="Description"
                component={<></>}
                className={styles.item}
                children={
                  <input
                    className={styles.inputTitle}
                    // value={miDescription}
                    onChange={(e) => {
                      // setMiDescription(e.target.value)
                    }}
                  />
                }
              />
              <SettingItem
                title="Full description"
                component={<></>}
                className={styles.item}
                children={<textarea className={styles.fullDescription} />}
              />

              <div className={styles.iconBlock}>
                <div className={styles.imgBlock}>
                  {/* <StorageRefImage
                  className={styles.img}
                  storageRef={mi.icon}
                /> */}
                  <div className={styles.img}></div>

                  {/* {st.map((x, i) => (
                  <span className={styles.imgTitle} key={i}>
                    {x.name}
                  </span>
                ))} */}
                </div>

                <div className={styles.buttonIcon}>
                  <input
                    // ref={fileInput}
                    type="file"
                    name="file"
                    id="file"
                    accept=".png, .svg"
                    className={styles.inputfile}
                    onChange={(e) => {
                      // onChange(e)
                      // iconInputChangeHandler(e)
                      // console.log(mi.icon)
                    }}
                  />
                  <label htmlFor="file">Change icon</label>
                </div>
              </div>
            </div>
          }
        />
        <SettingWrapper
          title="Team"
          children={
            <div className={styles.parametersBlock}>
              <div className={styles.wrapperContextID}>
                <div className={styles.blockContextID}>
                  <h3 className={styles.blockContextIDTitle}>Context IDs</h3>
                  <button
                    onClick={addButtonClickHandlerContext}
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
                      onClick={() => onDeleteChildContext(i)}
                      className={styles.contextDelete}
                    />
                  </div>
                ))}
              </div>
            </div>
          }
        />
        <SettingWrapper
          title="Parameters"
          children={
            <div className={styles.ownershipBlock}>
              <div className={styles.wrapperAdmins}>
                <div className={styles.blockAdmins}>
                  <h3 className={styles.adminsTitle}>Admins</h3>
                  <button
                    onClick={addButtonClickHandler}
                    className={styles.adminsButton}
                  />
                </div>
                {author.authorForm.map((x, i) => (
                  <div key={i} className={styles.blockAuthors}>
                    <input
                      className={styles.authorTitle}
                      placeholder={x.author}
                      onChange={(e) => e.target.value}
                    />
                    <button
                      onClick={() => onDeleteChild(i)}
                      className={styles.authorDelete}
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
          onClick={() => setUnderConstructionDetails(false)}
          className={styles.back}
        >
          Back
        </button>
        <a className={styles.push}>Push changes</a>
      </div>
    </div>
  )
}
