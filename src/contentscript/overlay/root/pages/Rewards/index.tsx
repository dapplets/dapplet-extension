import React, {
  ReactElement,
  useState,
  useEffect,
  useMemo,
  FC,
  useRef,
  ChangeEvent,
} from 'react'
import cn from 'classnames'
import styles from './Rewards.module.scss'
import { SettingWrapper } from '../../components/SettingWrapper'
import { SettingItem } from '../../components/SettingItem'
import { Message } from '../../components/Message'
import { Modal } from '../../components/Modal'
import { ModalReward } from '../../components/ModalReward'
import './rewards.scss'

export interface RewardsProps {
  setUnderConstructionDetails: (x) => void
  isTokenomics: boolean
  setActiveTabUnderConstructionDetails: any
}
let _isMounted = false
const RECEPIENT_CREATE = {
  rewardName: '',
  rewardPool: 20,
  recepient: [],
  conditional: [],
}

enum UnderConstructionDetails {
  INFO = 0,
  TOKENOMICS = 1,
  REWARDS = 2,
}

export const Rewards: FC<RewardsProps> = (props) => {
  const {
    setUnderConstructionDetails,
    isTokenomics,
    setActiveTabUnderConstructionDetails,
  } = props
  let sumQuantity = 0
  const [distributed, onDistributed] = useState(`${sumQuantity}%`)
  const newCustomPoolObject = {
    customPool: '',
  }
  const [newCustomPool, setCustomPool] = useState({ customPoolForm: [] })

  const [items, setItems] = useState({
    items: [],
  })
  const [name, setName] = useState({ name: '' })
  const [pool, setPool] = useState({ pool: '20' })

  const [itemsRecepientForm, setItemsRecepient] = useState({
    recepientForm: [],
  })

  const [recepient, setRecepient] = useState({
    userID: '',
    condition: '',
    isActive: false,
  })

  const [poolInputInvalid, setPoolInputInvalid] = useState(false)
  const [addRecepientDisabled, setAddRecepientDisabled] = useState(false)

  const [isModal, setModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [isApplyDisabled, setApplyDisabled] = useState(false)
  const [isApplyChanges, setApplyChanges] = useState(false)

  const [isModalChange, setModalChange] = useState(false)

  const [itemIndex, setItemInex] = useState(0)

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

    onDistributed(`${sumQuantity}%`)
    console.log(items)
    console.log(itemsRecepientForm)
    console.log(name)
  }, [
    sumQuantity,
    items,
    pool,
    poolInputInvalid,
    addRecepientDisabled,
    itemsRecepientForm,
    name,
    itemIndex,
  ])

  const onClose = () => setModal(false)
  const onCloseChange = () => setModalChange(false)

  const addButtonClickHandler = () => {
    const newCustomPoolForm = Object.assign({}, newCustomPool)
    newCustomPool.customPoolForm.push(newCustomPoolObject)
    setCustomPool(newCustomPoolForm)
  }

  const onDeleteChild = (id: number) => {
    const newCustomPoolForm = Object.assign({}, newCustomPool)
    newCustomPoolForm.customPoolForm.splice(id, 1)
    setCustomPool(newCustomPoolForm)
  }

  const addItem = (event) => {
    event.preventDefault()

    const newForm = Object.assign({}, items)

    const pushForm = Object.assign({}, name, pool, itemsRecepientForm)

    newForm.items.push(pushForm)

    setItems(newForm)

    itemsRecepientForm.recepientForm = []
  }

  const handleChangeName = (event) => {
    setName({ name: event.target.value })
  }
  // const handleChangeUserId = (event) => {
  //   setName({ name: event.target.value })
  // }
  // const handleChangeNum = (event) => {
  //   setPool({ pool: String(sumQuantity) })
  //   console.log(setPool)
  // }

  // ====

  const addButtonClickRecepient = () => {
    const newForm = Object.assign({}, itemsRecepientForm)
    setSelectedUser(null)

    const pushForm = Object.assign({}, recepient)
    newForm.recepientForm.push(pushForm)
    setItemsRecepient(newForm)
  }
  const onDeleteChildRecepient = (id: number) => {
    const newForm = Object.assign({}, itemsRecepientForm)
    newForm.recepientForm.splice(id, 1)
    setItemsRecepient(newForm)
  }

  const addButtonClickConditional = (id: number) => {
    const newForm = Object.assign({}, itemsRecepientForm)
    newForm.recepientForm[id].isActive = true
    setItemsRecepient(newForm)
  }
  const onDeleteChildConditional = (id: number) => {
    const newForm = Object.assign({}, itemsRecepientForm)
    newForm.recepientForm[id].isActive = false
    setItemsRecepient(newForm)
  }
  const handleChangeRecepient = (event) => {
    setRecepient({ ...recepient, userID: event.target.value })
  }

  // ===
  const onDeleteChildItems = (id: number) => {
    const newCustomPoolForm = Object.assign({}, items)
    newCustomPoolForm.items.splice(id, 1)
    setName({ name: '' })
    setPool({ pool: '20' })
    setRecepient({ userID: '', condition: '', isActive: false })

    setItems(newCustomPoolForm)
  }

  return (
    <div className={styles.wrapper}>
      {isTokenomics ? (
        <div className={styles.blockRewards}>
          {newCustomPool.customPoolForm.length === 0 && (
            <div className={styles.customPoolBlock}>
              <div className={styles.customPool}>
                <div className={styles.customPoolLabel}>Create pool</div>
                <button
                  onClick={addButtonClickHandler}
                  className={styles.customPoolButton}
                />
              </div>
              <div className={styles.customPoolDistributed}>
                <div className={styles.customPoolLabel}>Distributed</div>
                <span className={styles.customLabelDistributed}>
                  {distributed}
                </span>
              </div>
              {items && items.items && items.items.length !== 0 && (
                <button
                  disabled={addRecepientDisabled}
                  onClick={() => {
                    setName({ name: '' })
                    setPool({ pool: '20' })
                    setRecepient({ userID: '', condition: '', isActive: false })
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
          )}

          {newCustomPool.customPoolForm.map((x, i) => (
            <div key={i} className={styles.customPoolBlock}>
              <div className={styles.customPool}>
                <div className={styles.customPoolLabel}>Custom pool</div>
                <div className={styles.blockNewCustomPool}>
                  <input
                    className={styles.inputNewCustomPool}
                    onChange={(e) => e.target.value}
                  />
                  {/* <span className={styles.inputNewCustomPoolLabel}>AUG</span> */}
                  <button
                    onClick={() => onDeleteChild(i)}
                    className={styles.buttonDeleteNewCustomPool}
                  />
                </div>
              </div>
              <div className={styles.customPooNewDistributed}>
                <div className={styles.customPoolLabel}>You Use</div>
                <span className={styles.customLabelDistributed}>
                  {distributed}
                </span>
              </div>
              {items && items.items && items.items.length !== 0 && (
                <button
                  disabled={addRecepientDisabled}
                  onClick={() => {
                    setName({ name: '' })
                    setPool({ pool: '20' })

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
          ))}

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
                            <div key={i} className={styles.createdRewardsBlock}>
                              <div className={styles.createdRewardsBlockUser}>
                                <span
                                  className={styles.createdRewardsBlockLabel}
                                >
                                  User:
                                </span>
                                <span
                                  className={
                                    styles.createdRewardsBlockLabelUser
                                  }
                                >
                                  {x.userID}
                                </span>
                              </div>
                              {x.condition && typeof x.condition === 'string' && (
                                <div
                                  className={
                                    styles.createdRewardsBlockConditions
                                  }
                                >
                                  <span
                                    className={styles.createdRewardsBlockLabel}
                                  >
                                    Conditions :
                                  </span>
                                  <span
                                    className={
                                      styles.createdRewardsBlockLabelAdapter
                                    }
                                  >
                                    {x.condition}
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                      </>
                    }
                  />
                  <span
                    className={styles.percentReward}
                  >{`Reward ${item.pool}%`}</span>
                  <button
                    onClick={() => {
                      setItemInex(index)
                      setModalChange(true)
                    }}
                    className={styles.changeReward}
                  >
                    Change
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
            {items && items.items && items.items.length !== 0 && (
              <button className={styles.pushChanges}>Push changes</button>
            )}
          </div>

          {items && items.items && items.items.length === 0 && (
            <Message
              title="No rewards yet"
              subtitle="Click below to create first reward"
              // link="F.A.Q"
              // linkText="F.A.Q"
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
                      <span className={styles.nameLabel}>Pool</span>
                      <input
                        name="pool"
                        value={`${pool.pool}%`}
                        onBlur={() => {
                          pool.pool.length <= 0
                            ? setPool({ pool: '20' })
                            : setPool({ pool: pool.pool })
                        }}
                        onChange={(e: any) => {
                          const { data, inputType } = e.nativeEvent

                          switch (inputType) {
                            case 'insertText':
                              if (isNaN(+data) === false && data !== ' ') {
                                const newValue =
                                  pool.pool === '0' ? data : pool.pool + data
                                if (+newValue > 100) setPool({ pool: '100' })
                                else setPool({ pool: newValue })
                              }
                              break
                            case 'deleteContentBackward':
                              const newValue = pool.pool.slice(0, -2)

                              setPool({ pool: newValue })
                              break

                            default:
                              break
                          }
                        }}
                        className={cn(styles.poolInput, {
                          [styles.poolInputInvalid]: poolInputInvalid,
                        })}
                      />
                    </div>
                  </div>
                  {poolInputInvalid && (
                    <div className={styles.poolInputInvalidText}>
                      Distributed must not exceed 100%
                    </div>
                  )}
                  <div className={styles.rewardRecepientBlock}>
                    <div className={styles.recepientBlock}>
                      <span className={styles.nameLabel}>Recipient</span>
                      <button
                        type="button"
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
                              name="userId"
                              className={styles.recepientInput}
                              onChange={(e) => {
                                handleChangeRecepient(e)
                                itemsRecepientForm.recepientForm[i].userID =
                                  e.target.value
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => onDeleteChildRecepient(i)}
                              className={styles.recepientInputButton}
                            />
                          </div>

                          <div className={styles.recepientConditionalBlock}>
                            {!itemsRecepientForm.recepientForm[i].isActive && (
                              <div className={styles.recepientChangeBlock}>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    addButtonClickConditional(i)
                                  }}
                                  className={styles.recepientConditionalButton}
                                />
                                <span
                                  className={styles.recepientConditionalLabel}
                                >
                                  conditional
                                </span>
                              </div>
                            )}

                            {itemsRecepientForm.recepientForm[i].isActive && (
                              <div
                                key={i}
                                className={cn(styles.conditionalWrapper, {})}
                              >
                                <span className={styles.conditionalLabel}>
                                  condition: if this dapplet has dependency to
                                </span>
                                <div className={styles.conditionalInputBlock}>
                                  <input
                                    name="condition"
                                    className={styles.inputConditional}
                                    onChange={(e) => {
                                      itemsRecepientForm.recepientForm[
                                        i
                                      ].condition = e.target.value
                                    }}
                                  />
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      itemsRecepientForm.recepientForm[
                                        i
                                      ].condition = null
                                      onDeleteChildConditional(i)
                                    }}
                                    className={styles.inputConditionalDelete}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </form>
              </>
              //
            }
            footer={
              <button
                disabled={
                  !(
                    name.name &&
                    name.name.length >= 1 &&
                    pool.pool &&
                    pool.pool.length >= 1 &&
                    recepient.userID &&
                    recepient.userID.length >= 1
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
                    recepient.userID &&
                    recepient.userID.length >= 1,
                })}
              >
                Apply
              </button>
            }
            onClose={onClose}
          />
        </div>
      ) : (
        <Message
          title="There are no rewards without tokenomics"
          subtitle="Let's create tokenomics first"
          // link="Create"
          // linkText="Create"
          // className={styles.newMessage}
          children={
            <a
              onClick={() => {
                setActiveTabUnderConstructionDetails(
                  UnderConstructionDetails.TOKENOMICS
                )
              }}
              className={styles.createTokenomics}
            >
              Create
            </a>
          }
        />
      )}

      <div className={styles.linkNavigation}>
        <button
          onClick={() => setUnderConstructionDetails(false)}
          className={styles.back}
        >
          Back
        </button>
      </div>
      <Modal
        visible={isModalChange}
        title={''}
        // id={i}
        content={
          <>
            {items && items.items && items.items[itemIndex] && (
              <>
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
                        value={
                          // items && items.items
                          items.items[itemIndex].name
                        }
                        name="rewardName"
                        className={styles.nameInput}
                        onChange={(e: any) => {
                          e.preventDefault()

                          const { data, inputType } = e.nativeEvent
                          switch (inputType) {
                            case 'insertText':
                              // items.items[itemIndex].name =
                              //   data + items.items[itemIndex].name
                              const newValueNum = data + items[itemIndex].name
                              // setItems({
                              //   ...items.items,
                              //   items: [{ name: newValueNum }],
                              // })
                              setItems((prevState) => ({
                                ...prevState,
                                items: [{ name: newValueNum }],
                              }))
                              // setItems((prevState) => ({
                              //   ...prevState,
                              //   // [items &&
                              //   // items[itemIndex] &&
                              //   // items[itemIndex].name]: newValueNum,
                              //   name: { newValueNum },
                              // }))

                              break
                            case 'deleteContentBackward':
                              const newValue = items.items[
                                itemIndex
                              ].name.slice(0, -1)

                              // setItems((prevState) => ({
                              //   ...prevState,
                              //   // [items &&
                              //   // items[itemIndex] &&
                              //   // items[itemIndex].name]: newValue,
                              //   name: { newValue },
                              // }))
                              // setItems({
                              //   ...items.items,
                              //   items: [{ name: newValue }],
                              // })
                              // items.items[itemIndex].name = newValue
                              setItems((prevState) => ({
                                ...prevState,
                                items: [{ name: newValue }],
                              }))
                              break

                            default:
                              break
                          }
                          console.log(items)

                          console.log(items.items[itemIndex].name)
                          console.log(data)
                        }}
                      />
                    </div>
                    {/* <div className={styles.rewardPoolBlock}>
                      <span className={styles.nameLabel}>Pool</span>
                      <input
                        name="pool"
                        value={
                          // items && items.items
                          // ?
                          items.items[itemIndex].pool
                          // : ''
                        }
                        // onBlur={() => {
                        //   items.items[itemIndex].pool <= 0
                        //     ? setItems({
                        //         ...items.items,
                        //         items: [{ pool: '20' }],
                        //       })
                        //     : setItems({
                        //         ...items.items,
                        //         items: [{ pool: items.items[itemIndex].pool }],
                        //       })
                        // }}
                        onChange={(e: any) => {
                          const { data, inputType } = e.nativeEvent

                          switch (inputType) {
                            case 'insertText':
                              if (isNaN(+data) === false && data !== ' ') {
                                const newValue =
                                  items.items[itemIndex].pool === '0'
                                    ? data
                                    : items.items[itemIndex].pool + data
                                if (+newValue > 100)
                                  setItems({
                                    ...items.items,
                                    items: [{ pool: '100' }],
                                  })
                                else
                                  setItems({
                                    ...items.items,
                                    items: [{ pool: newValue }],
                                  })
                              }
                              break
                            case 'deleteContentBackward':
                              const newValue = items.items[
                                itemIndex
                              ].pool.slice(0, 0)

                              setItems({
                                ...items.items,
                                items: [{ pool: newValue }],
                              })
                              break

                            default:
                              break
                          }
                        }}
                        className={cn(styles.poolInput, {
                          [styles.poolInputInvalid]: poolInputInvalid,
                        })}
                      />
                    </div> */}
                  </div>
                  {/* {poolInputInvalid && (
                    <div className={styles.poolInputInvalidText}>
                      Distributed must not exceed 100%
                    </div>
                  )} */}
                  {/* <div className={styles.rewardRecepientBlock}>
                    <div className={styles.recepientBlock}>
                      <span className={styles.nameLabel}>Recipient</span>
                      <button
                        type="button"
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
                              name="userId"
                              className={styles.recepientInput}
                              onChange={(e) => {
                                handleChangeRecepient(e)
                                itemsRecepientForm.recepientForm[i].userID =
                                  e.target.value
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => onDeleteChildRecepient(i)}
                              className={styles.recepientInputButton}
                            />
                          </div>

                          <div className={styles.recepientConditionalBlock}>
                            {!itemsRecepientForm.recepientForm[i].isActive && (
                              <div className={styles.recepientChangeBlock}>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    addButtonClickConditional(i)
                                  }}
                                  className={styles.recepientConditionalButton}
                                />
                                <span
                                  className={styles.recepientConditionalLabel}
                                >
                                  conditional
                                </span>
                              </div>
                            )}

                            {itemsRecepientForm.recepientForm[i].isActive && (
                              <div
                                key={i}
                                className={cn(styles.conditionalWrapper, {})}
                              >
                                <span className={styles.conditionalLabel}>
                                  condition: if this dapplet has dependency to
                                </span>
                                <div className={styles.conditionalInputBlock}>
                                  <input
                                    name="condition"
                                    className={styles.inputConditional}
                                    onChange={(e) => {
                                      itemsRecepientForm.recepientForm[
                                        i
                                      ].condition = e.target.value
                                    }}
                                  />
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      itemsRecepientForm.recepientForm[
                                        i
                                      ].condition = null
                                      onDeleteChildConditional(i)
                                    }}
                                    className={styles.inputConditionalDelete}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div> */}
                </form>
              </>
            )}
          </>
        }
        footer={''}
        onClose={() => {
          setModalChange(false)
        }}
      />
    </div>
  )
}
