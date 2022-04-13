import React, { useState, useEffect, FC } from 'react'
import ModuleInfo from '../../../../../background/models/moduleInfo'
import VersionInfo from '../../../../../background/models/versionInfo'
// import { StorageRefImage } from '../../../../../popup/components/StorageRefImage'
import { StorageRef } from '../../../../../background/registries/registry'
// import { StorageRefImage } from './StorageRefImage'
import { DEFAULT_BRANCH_NAME } from '../../../../../common/constants'
import TopologicalSort from 'topological-sort'
import styles from './DevModulesList.module.scss'
import { initBGFunctions } from 'chrome-extension-message-wrapper'
import { browser } from 'webextension-polyfill-ts'
let _isMounted = true

interface PropsStorageRefImage {
  storageRef: StorageRef
}

export const StorageRefImage: FC<PropsStorageRefImage> = (props) => {
  const { storageRef } = props
  const [dataUri, setDataUri] = useState(null)
  useEffect(() => {
    _isMounted = true
    // loadSwarmGateway()

    const init = async () => {
      const { getResource } = await initBGFunctions(browser)
      const base64 = await getResource(storageRef)
      const dataUri = 'data:text/plain;base64,' + base64
      setDataUri(dataUri)
    }
    init()
    return () => {
      _isMounted = false
    }
  })
  return (
    <div className={styles.dappletsImg}>
      <img src={dataUri} />
    </div>
  )
}
interface PropsDeveloper {
  modules: {
    module: ModuleInfo
    versions: VersionInfo[]
    isDeployed: boolean[]
  }[]
  onDetailsClick: (x: any, y: any) => void
}
export const DevModule: FC<PropsDeveloper> = (props) => {
  const { modules, onDetailsClick } = props
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
    const firstFourCharacters = hash.substring(0, 6)
    const lastFourCharacters = hash.substring(hash.length - 1, hash.length - 5)

    return `${firstFourCharacters}...${lastFourCharacters}`
  }
  return (
    <>
      {sorted.map((m, i) => (
        <div className={styles.dappletsBlock} key={i}>
          <StorageRefImage storageRef={m.module.icon} />
          {/* {m.isDeployed?.[0] === true ? <span /> : null} */}
          <div className={styles.dappletsInfo}>
            <div className={styles.dappletsTegs}>
              <div className={styles.dappletsVersion}>
                {m.versions[0].version}
              </div>
              {m.versions[0].branch !== 'default' && (
                <div className={styles.dappletsBranch}>
                  {m.versions[0] ? m.versions[0].branch : 'Under construction'}
                </div>
              )}
              {!m.isDeployed?.[0] && (
                <div className={styles.dappletsNotDeploy}>not deployed</div>
              )}
            </div>
            <div className={styles.blockInfo}>
              <h3 className={styles.dappletsTitle}>{m.module.title}</h3>
              <button className={styles.dappletsSettings} />
              <button className={styles.dappletsReupload}>
                {!m.isDeployed?.[0] ? 'Deploy' : 'Reupload'}
              </button>
            </div>
            <div className={styles.dappletsLabel}>
              {m.module.name && (
                <div>
                  <span className={styles.dappletsLabelSpan}>Name:</span>
                  <label className={styles.dappletsLabelSpan}>
                    {m.module.name}
                  </label>
                </div>
              )}

              {m.module.author && (
                <div>
                  <span className={styles.dappletsLabelSpan}>Ownership:</span>
                  <label className={styles.dappletsLabelSpan}>
                    {visible(`${m.module.author}`)}
                  </label>
                </div>
              )}
              {m.module.registryUrl && (
                <div>
                  <span className={styles.dappletsLabelSpan}>Registry:</span>
                  <label className={styles.dappletsLabelSpan}>
                    {visible(`${m.module.registryUrl}`)}
                  </label>
                </div>
              )}
              {m.versions[0].version && (
                <div>
                  <span className={styles.dappletsLabelSpan}>
                    Version in registry:
                  </span>
                  <label className={styles.dappletsLabelSpan}>
                    {m.versions[0].version}
                  </label>
                </div>
              )}
              <div>
                <span className={styles.dappletsLabelSpan}>Type:</span>
                <label className={styles.dappletsLabelSpan}>
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

{
  /* <div className={styles.dappletsBlock}>
<StorageRefImage storageRef={m.module.icon} />
<div className={styles.dappletsInfo}> */
}
// <div className={styles.dappletsTegs}>
//   {/* <div className={styles.dappletsVersion}>{moduleVersion}</div> */}
//   <div className={styles.dappletsBranch}>{moduleBranch}</div>
// </div>

// <div className={styles.blockInfo}>
//   <h3 className={styles.dappletsTitle}>{moduleTitle}</h3>
//   <button className={styles.dappletsSettings} />
//   <button className={styles.dappletsReupload}>Reupload </button>
// </div>
// <div className={styles.dappletsLabel}>
{
  /* <div>
      <span className={styles.dappletsLabelSpan}>ID:</span>
      <label className={styles.dappletsLabelSpan}>rnhgrs.eth</label>
    </div> */
}
{
  /* <div>
      <span className={styles.dappletsLabelSpan}>Ownership:</span>
      <label className={styles.dappletsLabelSpan}>
        0xB6fa...B8ad
      </label>
    </div> */
}
{
  /* <div>
      <span className={styles.dappletsLabelSpan}>Regestry:</span>
      <label className={styles.dappletsLabelSpan}>
        0xB6fa...B8ad
      </label>
    </div> */
}
{
  /* <div>
      <span className={styles.dappletsLabelSpan}>
        Version in registry:
      </span>
      <label className={styles.dappletsLabelSpan}>
        0xB6fa...B8ad
      </label>
    </div> */
}
// <div>
// <span className={styles.dappletsLabelSpan}>Type:</span>
// <label className={styles.dappletsLabelSpan}>{moduleType}</label>
//   </div>
// </div>
// </div>
// </div>
