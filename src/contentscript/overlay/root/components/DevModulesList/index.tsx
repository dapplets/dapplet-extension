import React, { useState, useEffect, FC } from 'react'
import ModuleInfo from '../../../../../background/models/moduleInfo'
import VersionInfo from '../../../../../background/models/versionInfo'
// import { StorageRefImage } from '../../../../../popup/components/StorageRefImage'
import { StorageRef } from '../../../../../background/registries/registry'
// import { StorageRefImage } from './StorageRefImage'
import { DEFAULT_BRANCH_NAME } from '../../../../../common/constants'
import TopologicalSort from 'topological-sort'
import styles from './DevModulesList.module.scss'
import cn from 'classnames'
import { initBGFunctions } from 'chrome-extension-message-wrapper'
// import NO_LOGO from '../../assets/images/no-logo.png'
import { browser } from 'webextension-polyfill-ts'
let _isMounted = true

interface PropsStorageRefImage {
  storageRef: StorageRef
  className?: string
}

export const StorageRefImage: FC<PropsStorageRefImage> = (props) => {
  const { storageRef, className } = props
  const [dataUri, setDataUri] = useState(null)
  useEffect(() => {
    _isMounted = true
    // loadSwarmGateway()

    const init = async () => {
      const { hash, uris } = storageRef
      if (!hash && uris.length > 0 && uris[0].indexOf('data:') === 0) {
        setDataUri(uris[0])
      } else {
        const { getResource } = await initBGFunctions(browser)
        const base64 = await getResource(storageRef)
        const dataUri = 'data:text/plain;base64,' + base64
        setDataUri(dataUri)
      }
    }
    init()
    return () => {
      _isMounted = false
    }
  })
  return (
    <div className={cn(styles.dappletsImg, className)}>
      {dataUri ? <img src={dataUri} /> : <span className={styles.noLogo} />}
    </div>
  )
}
interface PropsDeveloper {
  isDappletsDetails: boolean
  setDappletsDetail: (x) => void
  modules: {
    module: ModuleInfo
    versions: VersionInfo[]
    isDeployed: boolean[]
  }[]
  onDetailsClick: (x: any, y: any) => void
  setModuleInfo: (x) => void
  setModuleVersion: (x) => void
  isUnderConstructionDetails: boolean
  setUnderConstructionDetails: (x) => void
}
export const DevModule: FC<PropsDeveloper> = (props) => {
  const {
    modules,
    onDetailsClick,
    isDappletsDetails,
    setDappletsDetail,
    setModuleInfo,
    setModuleVersion,
    isUnderConstructionDetails,
    setUnderConstructionDetails,
  } = props
  // const [dapDet, onDappletsDetails] = useState(isDappletsDetails)
  const nodes = new Map<string, any>()
  modules.forEach((x) => {
    nodes.set(
      x.versions[0]
        ? x.module.name + '#' + x.versions[0]?.branch
        : x.module.name,
      x
    )
    // console.log(x)
  })
  const sorting = new TopologicalSort(nodes)
  modules.forEach((x) => {
    const deps = [
      ...Object.keys(x.versions[0]?.dependencies || {}),
      ...Object.keys(x.versions[0]?.interfaces || {}),
    ]
    deps.forEach((d) => {
      if (nodes.has(d + '#' + DEFAULT_BRANCH_NAME)) {
        sorting.addEdge(
          d + '#' + DEFAULT_BRANCH_NAME,
          x.module.name + '#' + x.versions[0]?.branch
        )
      }
      // console.log(x)
    })
  })
  const sorted = [...sorting.sort().values()].map((x) => x.node)

  const visible = (hash: string): string => {
    if (hash.length > 28) {
      const firstFourCharacters = hash.substring(0, 14)
      const lastFourCharacters = hash.substring(
        hash.length - 0,
        hash.length - 14
      )

      return `${firstFourCharacters}...${lastFourCharacters}`
    } else {
      return hash
    }
  }

  return (
    <>
      {sorted.map((m, i) => (
        <div className={styles.dappletsBlock} key={i}>
          <StorageRefImage storageRef={m.module.icon} />
          {/* {m.isDeployed?.[0] === true ? <span /> : null} */}
          <div className={styles.dappletsInfo}>
            <div className={styles.dappletsTegs}>
              {
                m.versions && m.versions[0] && m.versions[0].version ? (
                  <div className={styles.dappletsVersion}>
                    {m.versions[0].version}
                  </div>
                ) : null
                //  (
                //   <div className={styles.dappletsVersion}>UK</div>
                // )
              }

              {m.versions &&
                m.versions[0] &&
                m.versions[0].branch &&
                m.versions[0].branch !== 'default' && (
                  <div className={styles.dappletsBranch}>
                    {m.versions[0].branch}
                  </div>
                )}
              {m.isDeployed?.[0] === false && (
                <div className={styles.dappletsNotDeploy}>not deployed</div>
              )}
            </div>

            <div className={styles.blockInfo}>
              <h3
                onClick={() => {
                  console.log(m.module)
                  console.log(m.versions[0])
                }}
                className={styles.dappletsTitle}
              >
                {m.module.title}
              </h3>
              {m.module.isUnderConstruction ? (
                <span
                  className={styles.dappletsSettingsIsUnderConstructionBlock}
                >
                  <button
                    className={styles.dappletsSettingsIsUnderConstruction}
                    onClick={() => {
                      onDetailsClick(m.module, m.versions[0])
                      // setDappletsDetail(true)
                      setUnderConstructionDetails(true)
                      setModuleInfo(m.module)
                      setModuleVersion(m.versions[0])
                      // console.log(m.module, m.versions[0])
                    }}
                  />
                  <span className={styles.dappletsSettingsIsTocenomics} />
                </span>
              ) : (
                <button
                  className={styles.dappletsSettings}
                  onClick={() => {
                    onDetailsClick(m.module, m.versions[0])
                    setDappletsDetail(true)
                    setModuleInfo(m.module)
                    setModuleVersion(m.versions[0])
                    // console.log(m.module, m.versions[0])
                  }}
                />
              )}
              {m.module.isUnderConstruction ? (
                <button
                  // onClick={() => console.log(m.module.isUnderConstruction)}
                  className={cn(
                    styles.dappletsReuploadisUnderConstructionPublish,
                    {
                      [styles.dappletsReuploadisUnderConstructionDeploy]:
                        m.isDeployed?.[0] === false,
                    }
                  )}
                >
                  {m.isDeployed?.[0] === false ? 'Deploy' : 'Publish'}
                </button>
              ) : (
                <button
                  // onClick={() => console.log(m.module.isUnderConstruction)}
                  className={styles.dappletsReupload}
                >
                  {m.isDeployed?.[0] === false ? 'Deploy' : 'Reupload'}
                </button>
              )}
            </div>
            <div className={styles.dappletsLabel}>
              {m.module.name && (
                <div>
                  <span className={styles.dappletsLabelSpan}>Name:</span>
                  <label
                    className={cn(
                      styles.dappletsLabelSpan,
                      styles.dappletsLabelSpanInfo
                    )}
                  >
                    {m.module.name}
                  </label>
                </div>
              )}

              {m.module.author && (
                <div>
                  <span className={styles.dappletsLabelSpan}>Ownership:</span>
                  <label
                    className={cn(
                      styles.dappletsLabelSpan,
                      styles.dappletsLabelSpanInfo
                    )}
                  >
                    {visible(` ${m.module.author}`)}
                  </label>
                </div>
              )}
              {m.module.registryUrl && (
                <div>
                  <span className={styles.dappletsLabelSpan}>Registry:</span>
                  <label
                    className={cn(
                      styles.dappletsLabelSpan,
                      styles.dappletsLabelSpanInfo
                    )}
                  >
                    {visible(`${m.module.registryUrl}`)}
                  </label>
                </div>
              )}
              {m.versions && m.versions[0] && m.versions[0].version && (
                <div>
                  <span className={styles.dappletsLabelSpan}>
                    Version in registry:
                  </span>
                  <label
                    className={cn(
                      styles.dappletsLabelSpan,
                      styles.dappletsLabelSpanInfo
                    )}
                  >
                    {m.versions[0].version}
                  </label>
                </div>
              )}
              <div>
                <span className={styles.dappletsLabelSpan}>Type:</span>
                <label
                  className={cn(
                    styles.dappletsLabelSpan,
                    styles.dappletsLabelSpanInfo
                  )}
                >
                  {m.module.type}
                </label>
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  )
}
