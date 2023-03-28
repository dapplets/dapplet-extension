import cn from 'classnames'
import { initBGFunctions } from 'chrome-extension-message-wrapper'
import { browser } from 'webextension-polyfill-ts'
import React, { FC, useEffect, useRef, useState } from 'react'
import { Message } from '../../components/Message'
import { ModalReward } from '../../components/ModalReward'
import { SettingWrapper } from '../../components/SettingWrapper'
import styles from './Rewards.module.scss'
import './rewards.scss'

export interface RewardsProps {
  setUnderConstructionDetails: (x) => void
  moduleInfo: any
  setActiveTabUnderConstructionDetails: any
}

enum UnderConstructionDetails {
  INFO = 0,
  TOKENOMICS = 1,
  REWARDS = 2,
}

export const Rewards: FC<RewardsProps> = (props) => {
  const { setUnderConstructionDetails,moduleInfo, setActiveTabUnderConstructionDetails } = props
  let sumQuantity = 0
  const [distributed, onDistributed] = useState(`${sumQuantity}%`)
  const [items, setItems] = useState({
    items: [],
  })
  const [name, setName] = useState({ name: '' })
  const [pool, setPool] = useState({ pool: '20' })
  const [itemsRecepientForm, setItemsRecepient] = useState({
    recepientForm: [],
  })
  const [recepient, setRecepient] = useState({
    userID: null,
    condition: null,
    isActive: false,
  })
  const [poolInputInvalid, setPoolInputInvalid] = useState(false)
  const [addRecepientDisabled, setAddRecepientDisabled] = useState(false)
  const [isModal, setModal] = useState(false)
  const [isModalChange, setModalChange] = useState(false)
  const [itemIndex, setItemInex] = useState(0)
  const [newItem, setNewItem] = useState({ newItem: [] })
  const [inputValueCustomPool, setDefaultValueCustomPool] = useState('')
  const [isCondition, setCondition] = useState(false)
  const poolNewInput = useRef<HTMLInputElement>()
  const revardUserIdInput = useRef<HTMLInputElement>()
  const newRewardUserIdInput = useRef<HTMLInputElement>()
  const newRewardUserIdBlock = useRef<HTMLDivElement>()
  const [userIdDisabled, setUserIdDisabled] = useState(false)
  const [newUserIdDisabled, setNewUserIdDisabled] = useState(false)
  const [isTokenomics, setTokenomics] = useState(false)
  const [tokensByApp, setTokensByApp] = useState(null)
  useEffect(()=>{
    const init = async () => {
      // setLoad(true)
      await _updateData()
      // setLoad(false)
    }
    init()
    return () => {}
  },[])
  const _updateData = async () => {
    const { getTokensByApp } = await initBGFunctions(browser)

    const tokensByApp = await getTokensByApp(moduleInfo.name)
console.log(tokensByApp);
tokensByApp.length && setTokenomics(true)
    setTokensByApp(tokensByApp)
  }

  useEffect(() => {
    if (items && items.items) {
      for (let i = 0; i < items.items.length; i++) {
        sumQuantity += +items.items[i].pool!
      }
      if (+pool.pool + Number(sumQuantity) > 100) {
        setPoolInputInvalid(true)
      } else if (+pool.pool + Number(sumQuantity) <= 100) {
        setPoolInputInvalid(false)
      }
      if (sumQuantity >= 100) {
        setAddRecepientDisabled(true)
      } else if (sumQuantity <= 100) {
        setAddRecepientDisabled(false)
      }
    }
    if (
      itemsRecepientForm &&
      itemsRecepientForm.recepientForm &&
      itemsRecepientForm.recepientForm.length >= 1 &&
      !revardUserIdInput.current?.value
    ) {
      setUserIdDisabled(true)
    } else {
      setUserIdDisabled(false)
    }

    if (+pool.pool + Number(sumQuantity) > 100) {
      setPoolInputInvalid(true)
    } else if (+pool.pool + Number(sumQuantity) <= 100) {
      setPoolInputInvalid(false)
    }

    if (+poolNewInput.current?.value > 100 || +poolNewInput.current?.value <= 0) {
      setPoolInputInvalid(true)
    } else {
      setPoolInputInvalid(false)
    }

    onDistributed(`${sumQuantity}%`)

    if (revardUserIdInput.current?.value === undefined) {
      setUserIdDisabled(false)
    } else if (revardUserIdInput.current?.value === '') {
      setUserIdDisabled(true)
    } else {
      setUserIdDisabled(false)
    }

    if (newRewardUserIdInput.current?.value === undefined) {
      setNewUserIdDisabled(false)
    } else if (
      newRewardUserIdBlock &&
      newRewardUserIdBlock.current !== null &&
      newRewardUserIdInput.current?.value === ''
    ) {
      setNewUserIdDisabled(true)
    } else {
      setNewUserIdDisabled(false)
    }
  }, [
    sumQuantity,
    items,
    pool,
    poolInputInvalid,
    addRecepientDisabled,
    itemsRecepientForm,
    name,
    itemIndex,
    isModalChange,
    newItem,
    isCondition,
    poolNewInput,
    userIdDisabled,
    recepient,
    revardUserIdInput,
    newRewardUserIdInput,
    newUserIdDisabled,
    newRewardUserIdBlock,
  ])
  const onClose = () => setModal(false)
  const onCloseChange = () => setModalChange(false)

  const addItem = (event) => {
    event.preventDefault()
    const newForm = Object.assign({}, items)
    const pushForm = Object.assign({}, name, pool, itemsRecepientForm)
    if (itemsRecepientForm.recepientForm) newForm.items.push(pushForm)
    setItems(newForm)
    itemsRecepientForm.recepientForm = []
  }

  const addItemEdit = (event, i) => {
    event.preventDefault()
    const newForm = Object.assign({}, items)
    newForm.items
  }

  const handleChangeName = (event) => {
    setName({ name: event.target.value })
  }

  const addButtonClickRecepient = () => {
    setItemsRecepient({
      recepientForm: [],
    })
    const newForm = Object.assign({}, itemsRecepientForm)
    const pushForm = Object.assign({}, recepient)
    newForm.recepientForm.push(pushForm)
    setItemsRecepient(newForm)
  }

  const addButtonClickRecepientEdit = (i) => {
    const pushForm = Object.assign({}, recepient)
    pushForm.condition = null
    pushForm.isActive = false
    pushForm.userID = null
    const newForm = newItem.newItem[i].recepientForm.push(pushForm)
    setItemsRecepient(newForm)
  }

  const onDeleteChildRecepient = (id: number) => {
    const newForm = Object.assign({}, itemsRecepientForm)
    newForm.recepientForm.splice(id, 1)
    setItemsRecepient(newForm)
  }
  const onDeleteChildRecepientEdit = (i: number, id: number) => {
    const newForm = newItem.newItem[i].recepientForm.splice(id, 1)
    setItemsRecepient(newForm)
  }

  const handleChangeRecepient = (event) => {
    setRecepient({ ...recepient, userID: event.target.value })
  }

  const onDeleteChildItems = (id: number) => {
    const newCustomPoolForm = Object.assign({}, items)
    newCustomPoolForm.items.splice(id, 1)
    setName({ name: '' })
    setPool({ pool: '20' })
    setRecepient({ userID: null, condition: null, isActive: false })
    setItems(newCustomPoolForm)
  }

  return (
    <div className={styles.wrapper}>
      {isTokenomics ? (
        <div className={styles.blockRewards}>
          <div className={styles.customPoolBlock}>
            <div className={styles.customPool}>
              <div className={styles.customPoolLabel}>Pool</div>
              <div className={styles.blockNewCustomPool}>
                <input
                  className={styles.inputNewCustomPool}
                  onChange={(e) => {
                    setDefaultValueCustomPool(e.target.value)
                  }}
                />
              </div>
              <div className={styles.customPoolLabel}>AUGe</div>
            </div>
            <div className={styles.customPooNewDistributed}>
              <div className={styles.customPoolLabel}>{`Distributed `}</div>
              <span className={styles.customLabelDistributed}>{distributed}</span>
            </div>
            {items && items.items && items.items.length !== 0 && (
              <button
                disabled={addRecepientDisabled}
                onClick={() => {
                  setName({ name: '' })
                  setPool({ pool: '20' })
                  setCondition(false)
                  setModal(true)
                }}
                className={cn(styles.pushChanges, styles.newReward, {
                  [styles.newRewardDisabled]: addRecepientDisabled,
                })}
              >
                Add new reward
              </button>
            )}
          </div>
          <div className={styles.wrapperChanges}>
            {items.items &&
              items.items.map((item, index) => (
                <div key={index} className={styles.createdRewardsWrapper}>
                  <SettingWrapper
                    className={styles.settingWrapperCreatedRewards}
                    title={`${item.name}`}
                    children={
                      <>
                        {item.recepientForm &&
                          item.recepientForm.map((x, i) => (
                            <>
                              <div key={i} className={styles.createdRewardsBlock}>
                                <div className={styles.createdRewardsBlockUser}>
                                  <span className={styles.createdRewardsBlockLabel}>User:</span>
                                  <span className={styles.createdRewardsBlockLabelUser}>
                                    {x.userID}
                                  </span>
                                </div>
                                {x.condition && typeof x.condition === 'string' && (
                                  <div className={styles.createdRewardsBlockConditions}>
                                    <span className={styles.createdRewardsBlockLabel}>
                                      Conditions :
                                    </span>
                                    <span className={styles.createdRewardsBlockLabelAdapter}>
                                      {x.condition}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </>
                          ))}
                      </>
                    }
                  />
                  <span className={styles.percentReward}>{`Reward ${item.pool}%`}</span>
                  <button
                    onClick={() => {
                      setItemInex(index)
                      const newItemForm = Object.assign({}, item)
                      setNewItem({ newItem: [newItemForm] })
                      setModalChange(true)
                    }}
                    className={styles.changeReward}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      onDeleteChildItems(index)
                    }}
                    className={styles.deleteReward}
                  >
                    Delete
                  </button>
                </div>
              ))}
            {items && items.items && items.items.length !== 0 && sumQuantity <= 100 && (
              <button className={styles.pushChanges}>Push changes</button>
            )}
          </div>
          {items && items.items && items.items.length === 0 && (
            <Message
              title="No rewards yet"
              subtitle="Click below to create the first reward"
              className={styles.newMessage}
              children={
                <button
                  onClick={() => {
                    setModal(true)
                  }}
                  className={styles.createRewards}
                >
                  Create
                </button>
              }
            />
          )}
          <ModalReward
            visible={isModal}
            title={'Reward creation'}
            content={
              <>
                <form className={styles.creationWrapper}>
                  <div className={styles.creationFirstBlock}>
                    <div className={styles.rewardNameBlock}>
                      <span className={styles.nameLabel}>Reward name</span>
                      <input
                        value={name.name}
                        onChange={(e) => handleChangeName(e)}
                        name="rewardName"
                        className={styles.nameInput}
                      />
                    </div>
                    <div className={styles.rewardPoolBlock}>
                      <span className={styles.nameLabel}>% of Pool</span>
                      <input
                        name="pool"
                        value={pool.pool}
                        onBlur={() => {
                          pool.pool.length <= 0
                            ? setPool({ pool: '20' })
                            : setPool({ pool: pool.pool })
                        }}
                        onFocus={(e) => {
                          if (+e.target.value <= 0 || +e.target.value > 100) {
                            setPoolInputInvalid(true)
                          } else {
                            setPoolInputInvalid(false)
                            setPool({ pool: e.target.value })
                          }
                        }}
                        onChange={(e) => {
                          if (isNaN(+e.target.value) === false) {
                            setPool({ pool: e.target.value })
                            setPoolInputInvalid(false)
                          }
                          if (+e.target.value <= 0 || +e.target.value > 100) {
                            setPoolInputInvalid(true)
                          }
                        }}
                        className={cn(styles.poolInput, {
                          [styles.poolInputInvalid]: poolInputInvalid,
                        })}
                      />
                    </div>
                  </div>
                  {poolInputInvalid || +pool.pool > 100 || +pool.pool <= 0 ? (
                    <div className={styles.poolInputInvalidText}>Distributed amount 100%</div>
                  ) : null}
                  <div className={styles.rewardRecepientBlock}>
                    <div className={styles.recepientBlock}>
                      <span className={styles.nameLabel}>Recipient</span>
                      <button
                        type="button"
                        disabled={userIdDisabled}
                        onClick={() => {
                          addButtonClickRecepient()
                        }}
                        className={styles.customPoolButton}
                      />
                    </div>
                    {itemsRecepientForm &&
                      itemsRecepientForm.recepientForm &&
                      itemsRecepientForm.recepientForm.length !== 0 &&
                      itemsRecepientForm.recepientForm.map((x, i) => (
                        <div key={i} className={styles.newRewardRecepientBlock}>
                          <div className={styles.recepientInputBlock}>
                            <input
                              ref={revardUserIdInput}
                              name="userId"
                              className={styles.recepientInput}
                              onChange={(e) => {
                                handleChangeRecepient(e)
                                itemsRecepientForm.recepientForm[i].userID = e.target.value
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteChildRecepient(i)
                              }}
                              className={styles.recepientInputButton}
                            />
                          </div>
                          <div className={styles.recepientConditionalBlock}>
                            {!isCondition && (
                              <div className={styles.recepientChangeBlock}>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    setCondition(true)
                                  }}
                                  className={styles.recepientConditionalButton}
                                />
                                <span className={styles.recepientConditionalLabel}>
                                  conditional
                                </span>
                              </div>
                            )}
                            {isCondition && (
                              <div className={cn(styles.conditionalWrapper, {})}>
                                <span className={styles.conditionalLabel}>
                                  condition: this dapplet is dependent on
                                </span>
                                <div className={styles.conditionalInputBlock}>
                                  <input
                                    name="condition"
                                    className={styles.inputConditional}
                                    onChange={(e) => {
                                      itemsRecepientForm.recepientForm[i].condition = e.target.value
                                    }}
                                  />
                                  {itemsRecepientForm.recepientForm.length <= 1 && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        itemsRecepientForm.recepientForm[i].condition = null
                                        setCondition(false)
                                      }}
                                      className={styles.inputConditionalDelete}
                                    />
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </form>
              </>
            }
            footer={
              <button
                disabled={
                  !(
                    name.name &&
                    name.name.length >= 1 &&
                    pool.pool &&
                    pool.pool.length >= 1 &&
                    Number(pool.pool) <= 100 &&
                    !userIdDisabled &&
                    !poolInputInvalid
                  )
                }
                onClick={(e) => {
                  addItem(e)

                  onClose()
                }}
                className={cn(styles.applyButtonDisabled, {
                  [styles.applyButton]:
                    name.name &&
                    name.name.length >= 1 &&
                    pool.pool &&
                    pool.pool.length >= 1 &&
                    Number(pool.pool) <= 100 &&
                    !userIdDisabled &&
                    !poolInputInvalid,
                })}
              >
                Apply
              </button>
            }
            onClose={() => {
              setName({ name: '' })
              setPool({ pool: '20' })
              setCondition(false)
              setRecepient({
                userID: null,
                condition: null,
                isActive: false,
              })
              itemsRecepientForm.recepientForm = []
              onClose()
            }}
          />
        </div>
      ) : (
        <Message
          title="There are no rewards without tokenomics"
          subtitle="Let's create tokenomics first"
          children={
            <a
              onClick={() => {
                setActiveTabUnderConstructionDetails(UnderConstructionDetails.TOKENOMICS)
              }}
              className={styles.createTokenomics}
            >
              Go to Tokenomics
            </a>
          }
        />
      )}
      <div className={styles.linkNavigation}>
        <button onClick={() => setUnderConstructionDetails(false)} className={styles.back}>
          Back
        </button>
      </div>
      <>
        {newItem &&
          newItem.newItem &&
          newItem.newItem.length !== 0 &&
          newItem.newItem.map((x, i) => (
            <ModalReward
              key={i}
              visible={isModalChange}
              title={'Reward edit'}
              content={
                <form
                  onClick={(e) => {
                    e.preventDefault()
                  }}
                  onChange={(e) => {
                    e.preventDefault()
                  }}
                  className={styles.creationWrapper}
                >
                  <div className={styles.creationFirstBlock}>
                    <div className={styles.rewardNameBlock}>
                      <span className={styles.nameLabel}>Reward name</span>
                      <input
                        defaultValue={newItem.newItem[i].name}
                        onChange={(e) => {
                          e.preventDefault()
                          const newName = e.target.value
                          newItem.newItem[i].name = newName
                        }}
                        name="rewardName"
                        className={styles.nameInput}
                      />
                    </div>
                    <div className={styles.rewardPoolBlock}>
                      <span className={styles.nameLabel}>% of Pool</span>
                      <input
                        name="pool"
                        type="number"
                        min="1"
                        max="100"
                        defaultValue={newItem.newItem[i].pool}
                        ref={poolNewInput}
                        onBlur={() => {
                          if (+newItem.newItem[i].pool <= 0 || +newItem.newItem[i].pool > 100) {
                            newItem.newItem[i].pool = items.items[itemIndex].pool
                          } else {
                            newItem.newItem[i].pool = newItem.newItem[i].pool
                          }
                        }}
                        onFocus={(e) => {
                          if (+e.target.value <= 0 || +e.target.value > 100) {
                            setPoolInputInvalid(true)
                          } else {
                            setPoolInputInvalid(false)

                            newItem.newItem[i].pool = e.target.value
                          }
                        }}
                        onChange={(e: any) => {
                          if (+e.target.value <= 0 || +e.target.value > 100) {
                            setPoolInputInvalid(true)
                          } else {
                            setPoolInputInvalid(false)
                            newItem.newItem[i].pool = e.target.value
                          }
                        }}
                        className={cn(styles.poolInput, styles.newPoolInput, {
                          [styles.poolInputInvalid]: poolInputInvalid,
                        })}
                      />
                    </div>
                  </div>
                  {poolInputInvalid ||
                  +poolNewInput.current?.value > 100 ||
                  +poolNewInput.current?.value <= 0 ? (
                    <div className={styles.poolInputInvalidText}>
                      Distributed amount 100% or be negative
                    </div>
                  ) : null}
                  <div className={styles.rewardRecepientBlock}>
                    <div className={styles.recepientBlock}>
                      <span className={styles.nameLabel}>Recipient</span>
                      <button
                        type="button"
                        disabled={newUserIdDisabled}
                        onClick={() => {
                          addButtonClickRecepientEdit(i)
                        }}
                        className={styles.customPoolButton}
                      />
                    </div>
                    {newItem.newItem[i] &&
                      newItem.newItem[i].recepientForm &&
                      newItem.newItem[i].recepientForm.length !== 0 &&
                      newItem.newItem[i].recepientForm.map((x, item) => (
                        <div
                          key={item}
                          ref={newRewardUserIdBlock}
                          className={styles.newRewardRecepientBlock}
                        >
                          <div className={styles.recepientInputBlock}>
                            <input
                              ref={newRewardUserIdInput}
                              name="userId"
                              className={styles.recepientInput}
                              defaultValue={newItem.newItem[i].recepientForm[item].userID}
                              onChange={(e) => {
                                handleChangeRecepient(e)
                                newItem.newItem[i].recepientForm[item].userID = e.target.value
                              }}
                            />

                            <button
                              type="button"
                              onClick={() => onDeleteChildRecepientEdit(i, item)}
                              className={styles.recepientInputButton}
                            />
                          </div>

                          <div className={styles.recepientConditionalBlock}>
                            {!isCondition && (
                              <div className={styles.recepientChangeBlock}>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    setCondition(true)
                                  }}
                                  className={styles.recepientConditionalButton}
                                />
                                <span className={styles.recepientConditionalLabel}>
                                  conditional
                                </span>
                              </div>
                            )}

                            {isCondition && (
                              <div className={cn(styles.conditionalWrapper, {})}>
                                <span className={styles.conditionalLabel}>
                                  condition: this dapplet is dependent on
                                </span>
                                <div className={styles.conditionalInputBlock}>
                                  <input
                                    name="condition"
                                    defaultValue={newItem.newItem[i].recepientForm[item].condition}
                                    className={styles.inputConditional}
                                    onChange={(e) => {
                                      newItem.newItem[i].recepientForm[item].condition =
                                        e.target.value
                                    }}
                                  />
                                  {newItem.newItem[i].recepientForm.lendth <= 1 && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        newItem.newItem[i].recepientForm[item].condition = null
                                        setCondition(false)
                                      }}
                                      className={styles.inputConditionalDelete}
                                    />
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </form>
              }
              footer={
                <button
                  disabled={
                    !(
                      newItem.newItem[i].name &&
                      newItem.newItem[i].name.length >= 1 &&
                      !poolInputInvalid &&
                      newItem.newItem[i].recepientForm &&
                      !newUserIdDisabled
                    )
                  }
                  onClick={(e) => {
                    addItemEdit(e, i)
                    onCloseChange()
                  }}
                  className={cn(styles.applyButtonDisabled, {
                    [styles.applyButton]:
                      newItem.newItem[i].name &&
                      newItem.newItem[i].name.length >= 1 &&
                      newItem.newItem[i].recepientForm &&
                      !newUserIdDisabled,
                  })}
                >
                  Edit
                </button>
              }
              onClose={() => onCloseChange()}
            />
          ))}
      </>
    </div>
  )
}
