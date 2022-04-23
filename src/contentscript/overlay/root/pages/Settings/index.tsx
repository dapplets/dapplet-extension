import React, { ReactElement, useState, useEffect, useMemo } from 'react'
import cn from 'classnames'
import styles from './Settings.module.scss'
import {
  isValidHttp,
  isValidUrl,
  isValidPostageStampId,
} from '../../../../../popup/helpers'
import { browser } from 'webextension-polyfill-ts'
import { initBGFunctions } from 'chrome-extension-message-wrapper'
import { useToggle } from '../../hooks/useToggle'

import { SettingTitle } from '../../components/SettingTitle'
import { SettingItem } from '../../components/SettingItem'
import { Switch } from '../../components/Switch'
import { Dropdown } from '../../components/Dropdown'
import { SettingWrapper } from '../../components/SettingWrapper'
import { Checkbox } from '../../components/Checkbox'
import { InputPanel } from '../../components/InputPanel'
// import { CheckboxList } from '../Notifications'

import { Developer } from './Developer'
import { SettingsList } from './Settings'
import { MainList } from './Main'

import { UnderConstructionInfo } from '../UnderConstructionInfo'
import { DappletsMainInfo } from '../DappletsInfo'
import { UnderConstruction } from '../UnderConstruction'
import { DappletsInfoSettings } from '../DappletsInfoSettings'
import { Tokenimics } from '../Tokenomics'

enum SettingsTabs {
  // MAIN = 0,
  SETTINGS = 0,
  DEVELOPER = 2,
}
enum DappletsDetails {
  MAININFO = 0,
  SETTINGS = 1,
}

enum UnderConstructionDetails {
  INFO = 0,
  TOKENOMICS = 1,
  REWARDS = 2,
}

export const NAVIGATION_LIST = [
  // { _id: '0', title: 'Main' },
  { _id: '0', title: 'Settings' },
  { _id: '1', title: 'Developer' },
]

let _isMounted = false
export const SettingsOverlay = () => {
  const [activeTab, setActiveTab] = useState(SettingsTabs.SETTINGS)
  const [activeTaDappletsDetails, setActiveTabDappletsDetails] = useState(
    DappletsDetails.MAININFO
  )
  const [
    activeTabUnderConstructionDetails,
    setActiveTabUnderConstructionDetails,
  ] = useState(UnderConstructionDetails.INFO)
  const [devMode, setMode] = useState(false)
  const [errorReporting, onErrorReporting] = useState(false)
  const [isDappletsDetails, setDappletsDetail] = useState(false)
  const [isUnderConstruction, setUnderConstruction] = useState(false)
  const [isUnderConstructionDetails, setUnderConstructionDetails] =
    useState(false)
  const [ModuleInfo, setModuleInfo] = useState([])
  const [ModuleVersion, setModuleVersion] = useState([])
  useEffect(() => {
    _isMounted = true
    const init = async () => {
      await loadDevMode()
      await loadErrorReporting()
      // console.log(devMode)
    }
    init()
    return () => {
      _isMounted = false
    }
    // devMode
  }, [])
  const loadDevMode = async () => {
    const { getDevMode } = await initBGFunctions(browser)
    const devMode = await getDevMode()
    setMode(devMode)
  }
  const setDevmode = async (isActive: boolean) => {
    const { setDevMode } = await initBGFunctions(browser)
    await setDevMode(isActive)
    loadDevMode()
    // TODO: ???
    // await this.props.updateTabs()
  }
  const loadErrorReporting = async () => {
    const { getErrorReporting } = await initBGFunctions(browser)
    const errorReporting = await getErrorReporting()
    onErrorReporting(errorReporting)
  }
  const setErrorReporting = async (isActive: boolean) => {
    const { setErrorReporting } = await initBGFunctions(browser)
    await setErrorReporting(isActive)
    loadErrorReporting()
  }
  console.log(isUnderConstruction)

  return (
    <>
      {!isDappletsDetails &&
        !isUnderConstruction &&
        !isUnderConstructionDetails && (
          <div className={styles.wrapper}>
            <div className={styles.title}>
              {/* <SettingTitle
          title="Main"
          onClick={() => setActiveTab(SettingsTabs.MAIN)}
          isActive={activeTab === SettingsTabs.MAIN}
        /> */}
              <SettingTitle
                title="Settings"
                onClick={() => setActiveTab(SettingsTabs.SETTINGS)}
                isActive={activeTab === SettingsTabs.SETTINGS}
              />
              {devMode && (
                <SettingTitle
                  title="Developer"
                  onClick={() => setActiveTab(SettingsTabs.DEVELOPER)}
                  isActive={activeTab === SettingsTabs.DEVELOPER}
                />
              )}
            </div>

            <div className={styles.settingMain}>
              {/* {activeTab === SettingsTabs.MAIN && (
  <MainList/>
        )} */}
              {activeTab === SettingsTabs.SETTINGS && (
                <SettingsList
                  devModeProps={devMode}
                  setDevMode={setDevmode}
                  errorReporting={errorReporting}
                  setErrorReporting={setErrorReporting}
                />
              )}

              {activeTab === SettingsTabs.DEVELOPER && (
                <Developer
                  setModuleVersion={setModuleVersion}
                  setModuleInfo={setModuleInfo}
                  isDappletsDetails={isDappletsDetails}
                  setDappletsDetail={setDappletsDetail}
                  isUnderConstruction={isUnderConstruction}
                  setUnderConstruction={setUnderConstruction}
                  isUnderConstructionDetails={isUnderConstructionDetails}
                  setUnderConstructionDetails={setUnderConstructionDetails}
                />
              )}
            </div>
          </div>
        )}
      {isDappletsDetails &&
        !isUnderConstructionDetails &&
        !isUnderConstruction && (
          <div className={styles.wrapper}>
            <div className={styles.title}>
              <SettingTitle
                title="Main info"
                onClick={() =>
                  setActiveTabDappletsDetails(DappletsDetails.MAININFO)
                }
                isActive={activeTaDappletsDetails === DappletsDetails.MAININFO}
              />
              <SettingTitle
                title="Settings"
                onClick={() =>
                  setActiveTabDappletsDetails(DappletsDetails.SETTINGS)
                }
                isActive={activeTaDappletsDetails === DappletsDetails.SETTINGS}
              />
            </div>
            <div className={styles.settingMain}>
              {activeTaDappletsDetails === DappletsDetails.MAININFO && (
                <DappletsMainInfo
                  ModuleInfo={ModuleInfo}
                  ModuleVersion={ModuleVersion}
                  isDappletsDetails={isDappletsDetails}
                  setDappletsDetail={setDappletsDetail}
                />
              )}
              {activeTaDappletsDetails === DappletsDetails.SETTINGS && (
                <DappletsInfoSettings
                  isDappletsDetails={isDappletsDetails}
                  setDappletsDetail={setDappletsDetail}
                />
              )}
            </div>
          </div>
        )}
      {isUnderConstruction &&
        !isDappletsDetails &&
        !isUnderConstructionDetails && (
          <div className={styles.wrapper}>
            <div className={styles.settingMain}>
              <UnderConstruction
                // ModuleInfo={ModuleInfo}
                // ModuleVersion={ModuleVersion}
                setUnderConstruction={setUnderConstruction}
              />
            </div>
          </div>
        )}

      {!isUnderConstruction &&
        !isDappletsDetails &&
        isUnderConstructionDetails && (
          <div className={styles.wrapper}>
            <div className={styles.title}>
              <SettingTitle
                title="Info"
                onClick={() =>
                  setActiveTabUnderConstructionDetails(
                    UnderConstructionDetails.INFO
                  )
                }
                isActive={
                  activeTabUnderConstructionDetails ===
                  UnderConstructionDetails.INFO
                }
              />
              <SettingTitle
                title="Tokenomics"
                onClick={() =>
                  setActiveTabUnderConstructionDetails(
                    UnderConstructionDetails.TOKENOMICS
                  )
                }
                isActive={
                  activeTabUnderConstructionDetails ===
                  UnderConstructionDetails.TOKENOMICS
                }
              />
              <SettingTitle
                title="Rewards"
                onClick={() =>
                  setActiveTabUnderConstructionDetails(
                    UnderConstructionDetails.REWARDS
                  )
                }
                isActive={
                  activeTabUnderConstructionDetails ===
                  UnderConstructionDetails.REWARDS
                }
              />
            </div>
            <div className={styles.settingMain}>
              {activeTabUnderConstructionDetails ===
                UnderConstructionDetails.INFO && (
                <div>
                  <UnderConstructionInfo
                    setUnderConstructionDetails={setUnderConstructionDetails}
                  />
                </div>
              )}
              {activeTabUnderConstructionDetails ===
                UnderConstructionDetails.TOKENOMICS && (
                <Tokenimics
                  setUnderConstructionDetails={setUnderConstructionDetails}
                />
              )}
              {activeTabUnderConstructionDetails ===
                UnderConstructionDetails.REWARDS && <div></div>}
              {/* <UnderConstruction
                // ModuleInfo={ModuleInfo}
                // ModuleVersion={ModuleVersion}
                setUnderConstruction={setUnderConstruction}
              /> */}
            </div>
          </div>
        )}
    </>
  )
}

// https://goerli.mooo.com/
// 0x141442f8DC04E962478404ba6704fDDDE531D60e
