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
import { ItemContent } from 'semantic-ui-react'

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
  // const [newCustomPool, setCustomPool] = useState({ customPoolForm: [] })

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

  const [newItem, setNewItem] = useState({ newItem: [] })
  const [oldItem, setOldItem] = useState({ oldItem: [] })
  const [inputValueCustomPool, setDefaultValueCustomPool] = useState('')
  // const [defaultCustomPool, setDefaultCustomPool] = useState(
  //   `${inputValueCustomPool} Auge`
  // )

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
    console.log(items)
    console.log(newItem)
    console.log(itemIndex)

    onDistributed(`${sumQuantity}%`)
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
    // defaultCustomPool,
  ])
  // const handleAgeChange = (event) => {

  // }
  const onClose = () => setModal(false)
  const onCloseChange = () => setModalChange(false)

  const addItem = (event) => {
    event.preventDefault()

    const newForm = Object.assign({}, items)

    const pushForm = Object.assign({}, name, pool, itemsRecepientForm)

    newForm.items.push(pushForm)

    setItems(newForm)

    itemsRecepientForm.recepientForm = []
  }

  const addItemEdit = (event, id) => {
    event.preventDefault()

    const newForm = Object.assign({}, items.items[id])

    const pushForm = Object.assign({}, newItem.newItem[id])

    newForm.push(pushForm)

    setItems(newForm)

    itemsRecepientForm.recepientForm = []
  }

  const handleChangeName = (event) => {
    setName({ name: event.target.value })
  }

  // ====

  const addButtonClickRecepient = () => {
    const newForm = Object.assign({}, itemsRecepientForm)
    setSelectedUser(null)

    const pushForm = Object.assign({}, recepient)
    newForm.recepientForm.push(pushForm)
    setItemsRecepient(newForm)
  }

  const addButtonClickRecepientEdit = (i) => {
    const pushForm = Object.assign({}, recepient)
    console.log(pushForm)
    pushForm.condition = ''
    pushForm.isActive = false
    pushForm.userID = ''

    const newForm = newItem.newItem[i].recepientForm.push(pushForm)

    setItemsRecepient(newForm)

    console.log(pushForm)
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

  const addButtonClickConditional = (id: number) => {
    const newForm = Object.assign({}, itemsRecepientForm)
    newForm.recepientForm[id].isActive = true
    setItemsRecepient(newForm)
  }

  const addButtonClickConditionalEdit = (id: number, i?: number) => {
    const newForm = newItem.newItem[id].recepientForm
    newForm[i].isActive = true
    console.log(newForm, 'tr')

    setItemsRecepient(newForm)
  }

  const onDeleteChildConditional = (id: number) => {
    const newForm = Object.assign({}, itemsRecepientForm)
    newForm.recepientForm[id].isActive = false
    setItemsRecepient(newForm)
  }

  const onDeleteChildConditionalEdit = (id: number, i?: number) => {
    const newForm = newItem.newItem[id].recepientForm
    newForm[i].isActive = false
    console.log(newForm, 'fl')
    setItemsRecepient(newForm)
  }

  const handleChangeRecepient = (event) => {
    setRecepient({ ...recepient, userID: event.target.value })
  }

  // ===
  const onDeleteChildItems = (id: number) => {
    const newCustomPoolForm = Object.assign({}, items)
    newCustomPoolForm.items.splice(id, 1)
    // setName({ name: '' })
    // setPool({ pool: '20' })
    // recepient.condition = ''
    // recepient.isActive = false
    // recepient.userID = ''
    // setRecepient({ userID: '', condition: '', isActive: false })

    setItems(newCustomPoolForm)
  }

  return (
    <div className={styles.wrapper}>
      {isTokenomics ? (
        <div className={styles.blockRewards}>
          {/* {newCustomPool.customPoolForm.length === 0 && (
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
          )} */}

          {/* {newCustomPool.customPoolForm.map((x, i) => ( */}
          <div className={styles.customPoolBlock}>
            <div className={styles.customPool}>
              <div className={styles.customPoolLabel}>Pool</div>
              <div className={styles.blockNewCustomPool}>
                <input
                  className={styles.inputNewCustomPool}
                  // value={}
                  onChange={(e) => {
                    setDefaultValueCustomPool(e.target.value)
                  }}
                />

                {/* <button
                    onClick={() => onDeleteChild(i)}
                    className={styles.buttonDeleteNewCustomPool}
                  /> */}
              </div>
              <div className={styles.customPoolLabel}>AUGe</div>
            </div>
            <div className={styles.customPooNewDistributed}>
              <div className={styles.customPoolLabel}>{`Distributed `}</div>
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
          {/* ))} */}

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
                      const newItemForm = Object.assign({}, item)
                      setNewItem({ newItem: [newItemForm] })
                      setModalChange(true)
                      // setOldItem({ oldItem: [item] })
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
            {items && items.items && items.items.length !== 0 && (
              <button className={styles.pushChanges}>Push changes</button>
            )}
          </div>

          {items && items.items && items.items.length === 0 && (
            <Message
              title="No rewards yet"
              subtitle="Click below to create first reward"
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
                        value={pool.pool}
                        onBlur={() => {
                          pool.pool.length <= 0
                            ? setPool({ pool: '20' })
                            : setPool({ pool: pool.pool })
                        }}
                        onChange={(e) => {
                          if (isNaN(+e.target.value) === false) {
                            setPool({ pool: e.target.value })
                          }
                          if (e.target.value === '0') {
                            setPool({ pool: '20' })
                          }

                          // }
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
                    Number(pool.pool) <= 100 &&
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
                    Number(pool.pool) <= 100 &&
                    recepient.userID &&
                    recepient.userID.length >= 1,
                })}
              >
                Apply
              </button>
            }
            onClose={() => {
              setName({ name: '' })
              setPool({ pool: '20' })
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
                setActiveTabUnderConstructionDetails(
                  UnderConstructionDetails.TOKENOMICS
                )
              }}
              className={styles.createTokenomics}
            >
              Go to Tokenomics
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
                          //   setValue(objArr.map(obj =>
                          //     obj.id == idToEdit ? {...obj, [prop]: event.target.value} : obj
                          //  ));
                        }}
                        name="rewardName"
                        className={styles.nameInput}
                      />
                    </div>
                    <div className={styles.rewardPoolBlock}>
                      <span className={styles.nameLabel}>Pool</span>
                      <input
                        name="pool"
                        defaultValue={newItem.newItem[i].pool}
                        onBlur={() => {
                          newItem.newItem[i].pool.length <= 0
                            ? (newItem.newItem[i].pool = '20')
                            : newItem.newItem[i].pool
                        }}
                        onChange={(e) => {
                          if (isNaN(+e.target.value) === false) {
                            newItem.newItem[i].pool = e.target.value
                          }
                          if (e.target.value === '0') {
                            newItem.newItem[i].pool = '20'
                          }
                          if (
                            +newItem.newItem[i].pool + Number(sumQuantity) >
                            100
                          ) {
                            setPoolInputInvalid(true)
                          } else if (
                            +newItem.newItem[i].pool + Number(sumQuantity) <=
                            100
                          ) {
                            setPoolInputInvalid(false)
                          }
                          // }
                        }}
                        className={cn(styles.poolInput, {
                          [styles.poolInputInvalid]: poolInputInvalid,
                        })}
                      />
                    </div>
                  </div>
                  {poolInputInvalid ||
                    (newItem.newItem[i].pool + sumQuantity > 100 && (
                      <div className={styles.poolInputInvalidText}>
                        Distributed must not exceed 100%
                      </div>
                    ))}
                  <div className={styles.rewardRecepientBlock}>
                    <div className={styles.recepientBlock}>
                      <span className={styles.nameLabel}>Recipient</span>
                      <button
                        type="button"
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
                          className={styles.newRewardRecepientBlock}
                        >
                          <div className={styles.recepientInputBlock}>
                            <input
                              name="userId"
                              className={styles.recepientInput}
                              defaultValue={
                                newItem.newItem[i].recepientForm[item].userID
                              }
                              onChange={(e) => {
                                handleChangeRecepient(e)
                                newItem.newItem[i].recepientForm[item].userID =
                                  e.target.value
                              }}
                            />
                            <button
                              type="button"
                              onClick={() =>
                                onDeleteChildRecepientEdit(i, item)
                              }
                              className={styles.recepientInputButton}
                            />
                          </div>

                          <div className={styles.recepientConditionalBlock}>
                            {newItem.newItem[i].recepientForm[item].isActive ===
                              false && (
                              <div className={styles.recepientChangeBlock}>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    addButtonClickConditionalEdit(i, item)
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

                            {newItem.newItem[i].recepientForm[item].isActive ===
                              true && (
                              <div
                                // key={item}
                                className={cn(styles.conditionalWrapper, {})}
                              >
                                <span className={styles.conditionalLabel}>
                                  condition: if this dapplet has dependency to
                                </span>
                                <div className={styles.conditionalInputBlock}>
                                  <input
                                    name="condition"
                                    defaultValue={
                                      newItem.newItem[i].recepientForm[item]
                                        .condition
                                    }
                                    className={styles.inputConditional}
                                    onChange={(e) => {
                                      newItem.newItem[i].recepientForm[
                                        item
                                      ].condition = e.target.value
                                    }}
                                  />
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      newItem.newItem[i].recepientForm[
                                        item
                                      ].condition = null
                                      onDeleteChildConditionalEdit(i, item)
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
              }
              footer={
                <button
                  disabled={
                    !(
                      newItem.newItem[i].name &&
                      newItem.newItem[i].name.length >= 1 &&
                      newItem.newItem[i].pool &&
                      newItem.newItem[i].pool.length >= 1 &&
                      Number(newItem.newItem[i].pool + sumQuantity) <= 100 &&
                      newItem.newItem[i].recepientForm[i].userID &&
                      newItem.newItem[i].recepientForm[i].userID.length >= 1
                    )
                  }
                  onClick={(e) => {
                    // addItemEdit(e, itemIndex)
                    items.items[itemIndex] = newItem.newItem[i]
                    console.log(items)

                    // onCloseChange()
                  }}
                  className={cn(styles.applyButtonDisabled, {
                    [styles.applyButton]:
                      newItem.newItem[i].name &&
                      newItem.newItem[i].name.length >= 1 &&
                      newItem.newItem[i].pool &&
                      newItem.newItem[i].pool.length >= 1 &&
                      Number(newItem.newItem[i].pool + sumQuantity) <= 100 &&
                      newItem.newItem[i].recepientForm[i].userID &&
                      newItem.newItem[i].recepientForm[i].userID.length >= 1,
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
