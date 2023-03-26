import { initBGFunctions } from 'chrome-extension-message-wrapper'
import cn from 'classnames'
import React, { FC, useEffect, useState } from 'react'
import { browser } from 'webextension-polyfill-ts'
import { SettingTitle } from '../../components/SettingTitle'
import { DappletsMainInfo } from '../DappletsInfo'
import { Tokenomics } from '../Tokenomics'
import { UnderConstruction } from '../UnderConstruction'
import { UnderConstructionInfo } from '../UnderConstructionInfo'
import { Developer } from './Developer/Developer'
import { SettingsList } from './Settings/Settings'
import styles from './Settings/Settings.module.scss'

enum SettingsTabs {
  // MAIN = 0,
  SETTINGS = 0,
  DEVELOPER = 2,
}
export enum DappletsDetails {
  MAININFO = 0,
  TOKENOMICS = 1,
}

export enum UnderConstructionDetails {
  INFO = 0,
  TOKENOMICS = 1,
  // REWARDS = 2,
}

export const NAVIGATION_LIST = [
  // { _id: '0', title: 'Main' },
  { _id: '0', title: 'Settings' },
  { _id: '1', title: 'Developer' },
]
export interface SettingsOverlayProps {
  isLoadingDeploy: boolean
  setLoadingDeploy: () => void
  setLoadingDeployFinally: () => void
  setOpenWallet: () => void
  connectedDescriptors: []
  selectedWallet: string
}

export const SettingsOverlay: FC<SettingsOverlayProps> = (props) => {
  const {
    isLoadingDeploy,
    setLoadingDeploy,
    setLoadingDeployFinally,
    setOpenWallet,
    connectedDescriptors,
    selectedWallet,
  } = props
  const [activeTab, setActiveTab] = useState(SettingsTabs.SETTINGS)
  const [activeTaDappletsDetails, setActiveTabDappletsDetails] = useState(DappletsDetails.MAININFO)
  const [activeTabUnderConstructionDetails, setActiveTabUnderConstructionDetails] = useState(
    UnderConstructionDetails.INFO
  )
  const [devMode, setMode] = useState(false)
  const [isSvgLoaderDevMode, setSvgLoaderDevMode] = useState(false)

  const [errorReporting, onErrorReporting] = useState(false)
  const [isSvgErrorReporting, setSvgErrorReporting] = useState(false)

  const [isDappletsDetails, setDappletsDetail] = useState(false)
  const [isUnderConstruction, setUnderConstruction] = useState(false)
  const [isUnderConstructionDetails, setUnderConstructionDetails] = useState(false)
  const [ModuleInfo, setModuleInfo] = useState(null)
  const [ModuleVersion, setModuleVersion] = useState([])

  const [isTokenomics, setTokenomics] = useState(false)
  const [isShowChildrenUnderConstraction, setShowChildrenUnderConstraction] = useState(false)
  const [isShowChildrenRegistry, setShowChildrenRegistry] = useState(false)

  useEffect(() => {
    const init = async () => {
      await loadDevMode()
      await loadErrorReporting()
    }
    init()
    return () => {}
  }, [])

  const loadDevMode = async () => {
    setSvgLoaderDevMode(true)

    const { getDevMode } = await initBGFunctions(browser)
    const devMode = await getDevMode()

    setMode(devMode)
    setSvgLoaderDevMode(false)
  }

  const setDevmode = async (isActive: boolean) => {
    const { setDevMode } = await initBGFunctions(browser)
    await setDevMode(isActive)
    loadDevMode()
  }

  const loadErrorReporting = async () => {
    setSvgErrorReporting(true)

    const { getErrorReporting } = await initBGFunctions(browser)
    const errorReporting = await getErrorReporting()

    onErrorReporting(errorReporting)
    setSvgErrorReporting(false)
  }

  const setErrorReporting = async (isActive: boolean) => {
    const { setErrorReporting } = await initBGFunctions(browser)
    await setErrorReporting(isActive)
    loadErrorReporting()
  }

  return (
    <>
      {!isDappletsDetails && !isUnderConstruction && !isUnderConstructionDetails && (
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
                isSvgLoaderDevMode={isSvgLoaderDevMode}
                isSvgErrorReporting={isSvgErrorReporting}
                errorReporting={errorReporting}
                setErrorReporting={setErrorReporting}
              />
            )}

            {activeTab === SettingsTabs.DEVELOPER && (
              <Developer
                selectedWallet={selectedWallet}
                connectedDescriptors={connectedDescriptors}
                setOpenWallet={setOpenWallet}
                isLoadingDeploy={isLoadingDeploy}
                setLoadingDeploy={setLoadingDeploy}
                setLoadingDeployFinally={setLoadingDeployFinally}
                isShowChildrenRegistry={isShowChildrenRegistry}
                setShowChildrenRegistry={setShowChildrenRegistry}
                setModuleVersion={setModuleVersion}
                setModuleInfo={setModuleInfo}
                setDappletsDetail={setDappletsDetail}
                setUnderConstruction={setUnderConstruction}
                setUnderConstructionDetails={setUnderConstructionDetails}
              />
            )}
          </div>
        </div>
      )}
      {isDappletsDetails && !isUnderConstructionDetails && !isUnderConstruction && (
        <div
          className={cn(styles.wrapper, {
            [styles.wrapperTokenomics]: activeTaDappletsDetails === DappletsDetails.TOKENOMICS,
          })}
        >
          <div
            className={cn(styles.title, {
              [styles.titleTokenomics]: activeTaDappletsDetails === DappletsDetails.TOKENOMICS,
            })}
          >
            <SettingTitle
              title="Main info"
              onClick={() => setActiveTabDappletsDetails(DappletsDetails.MAININFO)}
              isActive={activeTaDappletsDetails === DappletsDetails.MAININFO}
            />
            {ModuleInfo && ModuleInfo.type === 'FEATURE' ? (
              <SettingTitle
                title="Tokenomics"
                onClick={() => setActiveTabDappletsDetails(DappletsDetails.TOKENOMICS)}
                isActive={activeTaDappletsDetails === DappletsDetails.TOKENOMICS}
              />
            ) : null}
          </div>
          <div className={styles.settingMain}>
            {activeTaDappletsDetails === DappletsDetails.MAININFO && (
              <DappletsMainInfo
                ModuleInfo={ModuleInfo}
                ModuleVersion={ModuleVersion}
                setDappletsDetail={setDappletsDetail}
                setShowChildrenRegistry={setShowChildrenRegistry}
              />
            )}
            {activeTaDappletsDetails === DappletsDetails.TOKENOMICS &&
            ModuleInfo &&
            ModuleInfo.type === 'FEATURE' ? (
              <Tokenomics
                ModuleInfo={ModuleInfo}
                setPageDetails={setDappletsDetail}
                setActiveTab={setActiveTabDappletsDetails}
              />
            ) : null}
          </div>
        </div>
      )}
      {isUnderConstruction && !isDappletsDetails && !isUnderConstructionDetails && (
        <div className={styles.wrapper}>
          <div className={styles.settingMain}>
            <UnderConstruction
              setModuleVersion={setModuleVersion}
              setModuleInfo={setModuleInfo}
              setUnderConstructionDetails={setUnderConstructionDetails}
              setUnderConstruction={setUnderConstruction}
            />
          </div>
        </div>
      )}

      {!isUnderConstruction && !isDappletsDetails && isUnderConstructionDetails && (
        <div
          className={cn(styles.wrapper, {
            [styles.wrapperTokenomics]:
              activeTabUnderConstructionDetails === UnderConstructionDetails.TOKENOMICS,
          })}
        >
          <div
            className={cn(styles.title, {
              [styles.titleTokenomics]:
                activeTabUnderConstructionDetails === UnderConstructionDetails.TOKENOMICS,
            })}
          >
            <SettingTitle
              title="Info"
              onClick={() => setActiveTabUnderConstructionDetails(UnderConstructionDetails.INFO)}
              isActive={activeTabUnderConstructionDetails === UnderConstructionDetails.INFO}
            />
            <SettingTitle
              title="Tokenomics"
              onClick={() =>
                setActiveTabUnderConstructionDetails(UnderConstructionDetails.TOKENOMICS)
              }
              isActive={activeTabUnderConstructionDetails === UnderConstructionDetails.TOKENOMICS}
            />
            {/* <SettingTitle
              title="Rewards"
              onClick={() => setActiveTabUnderConstructionDetails(UnderConstructionDetails.REWARDS)}
              isActive={activeTabUnderConstructionDetails === UnderConstructionDetails.REWARDS}
            /> */}
          </div>
          <div className={styles.settingMain}>
            {activeTabUnderConstructionDetails === UnderConstructionDetails.INFO && (
              <div>
                <UnderConstructionInfo
                  ModuleInfo={ModuleInfo}
                  ModuleVersion={ModuleVersion}
                  setUnderConstructionDetails={setUnderConstructionDetails}
                  setShowChildrenUnderConstraction={setShowChildrenUnderConstraction}
                />
              </div>
            )}
            {activeTabUnderConstructionDetails === UnderConstructionDetails.TOKENOMICS && (
              <Tokenomics
                ModuleInfo={ModuleInfo}
                setPageDetails={setUnderConstructionDetails}
                setActiveTab={setActiveTabUnderConstructionDetails}
              />
            )}
            {/* {activeTabUnderConstructionDetails === UnderConstructionDetails.REWARDS && (
              <Rewards
                setUnderConstructionDetails={setUnderConstructionDetails}
                isTokenomics={isTokenomics}
                setActiveTabUnderConstructionDetails={setActiveTabUnderConstructionDetails}
              />
            )} */}
          </div>
        </div>
      )}
    </>
  )
}
