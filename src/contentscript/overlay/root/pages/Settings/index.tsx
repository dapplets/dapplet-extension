import { initBGFunctions } from 'chrome-extension-message-wrapper'
import cn from 'classnames'
import React, { FC, useCallback, useEffect, useState } from 'react'
import browser from 'webextension-polyfill'
import { SettingTitle } from '../../components/SettingTitle'
import { DappletsMainInfo } from '../DappletsInfo'
import { Tokenomics } from '../Tokenomics'
import { UnderConstruction } from '../UnderConstruction'
import { UnderConstructionInfo } from '../UnderConstructionInfo'
import { Bos } from './Bos/Bos'
import { Developer } from './Developer/Developer'
import { SettingsList } from './Settings/Settings'
import styles from './Settings/Settings.module.scss'

enum SettingsTabs {
  // MAIN = 0,
  SETTINGS = 0,
  BOS = 1,
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
  setOpenWallet: () => void
  connectedDescriptors: []
  selectedWallet: string
  initModules: () => void
}

export const SettingsOverlay: FC<SettingsOverlayProps> = (props) => {
  const { setOpenWallet, connectedDescriptors, selectedWallet, initModules } = props
  const [activeTab, setActiveTab] = useState(SettingsTabs.BOS)
  const [activeTaDappletsDetails, setActiveTabDappletsDetails] = useState(DappletsDetails.MAININFO)
  const [activeTabUnderConstructionDetails, setActiveTabUnderConstructionDetails] = useState(
    UnderConstructionDetails.INFO
  )
  const [devMode, setMode] = useState(false)
  const [isSvgLoaderDevMode, setSvgLoaderDevMode] = useState(false)
  const [errorReporting, onErrorReporting] = useState(false)
  const [isSvgErrorReporting, setSvgErrorReporting] = useState(false)
  const [isDappletsDetails, _setDappletsDetail] = useState(false)
  const [isUnderConstruction, _setUnderConstruction] = useState(false)
  const [isUnderConstructionDetails, _setUnderConstructionDetails] = useState(false)
  const [ModuleInfo, _setModuleInfo] = useState(null)
  const [ModuleVersion, _setModuleVersion] = useState([])
  const [isShowChildrenRegistry, _setShowChildrenRegistry] = useState(false)

  const memorizedSetShowChildrenRegistry = useCallback((x) => _setShowChildrenRegistry(x), [])
  const memorizedSetModuleVersion = useCallback((x) => _setModuleVersion(x), [])
  const memorizedSetModuleInfo = useCallback((x) => _setModuleInfo(x), [])
  const memorizedSetDappletsDetail = useCallback((x) => _setDappletsDetail(x), [])
  const memorizedSetUnderConstruction = useCallback((x) => _setUnderConstruction(x), [])
  const memorizedSetUnderConstructionDetails = useCallback(
    (x) => _setUnderConstructionDetails(x),
    []
  )

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
            <SettingTitle
              title="BOS"
              onClick={() => setActiveTab(SettingsTabs.BOS)}
              isActive={activeTab === SettingsTabs.BOS}
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

            {activeTab === SettingsTabs.BOS && <Bos />}

            {activeTab === SettingsTabs.DEVELOPER && (
              <Developer
                selectedWallet={selectedWallet}
                connectedDescriptors={connectedDescriptors}
                setOpenWallet={setOpenWallet}
                isShowChildrenRegistry={isShowChildrenRegistry}
                setShowChildrenRegistry={memorizedSetShowChildrenRegistry}
                setModuleVersion={memorizedSetModuleVersion}
                setModuleInfo={memorizedSetModuleInfo}
                setDappletsDetail={memorizedSetDappletsDetail}
                setUnderConstruction={memorizedSetUnderConstruction}
                setUnderConstructionDetails={memorizedSetUnderConstructionDetails}
                initModules={initModules}
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
            {/* {ModuleInfo && ModuleInfo.type === 'FEATURE' ? (
              <SettingTitle
                title="Tokenomics"
                onClick={() => setActiveTabDappletsDetails(DappletsDetails.TOKENOMICS)}
                isActive={activeTaDappletsDetails === DappletsDetails.TOKENOMICS}
              />
            ) : null} */}
          </div>
          <div className={styles.settingMain}>
            {activeTaDappletsDetails === DappletsDetails.MAININFO && (
              <DappletsMainInfo
                ModuleInfo={ModuleInfo}
                ModuleVersion={ModuleVersion}
                setDappletsDetail={memorizedSetDappletsDetail}
                setShowChildrenRegistry={memorizedSetShowChildrenRegistry}
              />
            )}
            {activeTaDappletsDetails === DappletsDetails.TOKENOMICS &&
            ModuleInfo &&
            ModuleInfo.type === 'FEATURE' ? (
              <Tokenomics
                ModuleInfo={ModuleInfo}
                setPageDetails={memorizedSetDappletsDetail}
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
              setModuleVersion={memorizedSetModuleVersion}
              setModuleInfo={memorizedSetModuleInfo}
              setUnderConstructionDetails={memorizedSetUnderConstructionDetails}
              setUnderConstruction={memorizedSetUnderConstruction}
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
                  setUnderConstructionDetails={memorizedSetUnderConstructionDetails}
                  // setShowChildrenUnderConstraction={setShowChildrenUnderConstraction}
                />
              </div>
            )}
            {activeTabUnderConstructionDetails === UnderConstructionDetails.TOKENOMICS && (
              <Tokenomics
                ModuleInfo={ModuleInfo}
                setPageDetails={memorizedSetUnderConstructionDetails}
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
