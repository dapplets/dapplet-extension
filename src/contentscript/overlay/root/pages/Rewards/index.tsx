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
// const recepientNew = []
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
  const [distributed, onDistributed] = useState('0%')
  const newCustomPoolObject = {
    customPool: '2141234124',
  }
  const [newCustomPool, setCustomPool] = useState({ customPoolForm: [] })

  const [items, setItems] = useState({
    items: [],
  })
  const [name, setName] = useState({ name: '' })
  const [pool, setPool] = useState({ pool: '20' })
  const [itemsRecepientForm, setItemsRecepient] = useState({
    recepientForm: [],
    condition: [],
  })

  const [recepient, setRecepient] = useState({ userID: '' })
  const [condition, setCondition] = useState({ condition: '' })
  const node = useRef<HTMLDivElement>()
  useEffect(
    () => {
      console.log(items)
    },
    [
      // name, pool, items, itemsRecepientForm, recepient
    ]
  )
  const booleanNode = node.current?.classList.contains('valid')
  const Num = useMemo(() => {}, [])

  const [isApplyDisabled, setApplyDisabled] = useState(false)
  const [isApplyChanges, setApplyChanges] = useState(false)
  const [isModal, setModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)

  const onClose = () => setModal(false)

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

  // const [state, setState] = useState({ username: '', items: [] })

  const addItem = (event) => {
    event.preventDefault()

    const newForm = Object.assign({}, items)

    const pushForm = Object.assign({}, name, pool, itemsRecepientForm)

    newForm.items.push(pushForm)

    setItems(newForm)

    itemsRecepientForm.recepientForm = []
    console.log(items, recepient, itemsRecepientForm)
  }

  const handleChange = (event) => {
    setName({ name: event.target.value })
  }
  // const handleChangeNum = (event) => {
  //   setPool({ pool: event.target.value })
  // }

  // ====

  const handleChangeRecepient = (event) => {
    setRecepient({ userID: event.target.value })
  }
  const handleChangeCondition = (event) => {
    setCondition({ condition: event.target.value })
  }
  const addButtonClickRecepient = () => {
    const newForm = Object.assign({}, itemsRecepientForm)
    setSelectedUser(null)
    const pushForm = Object.assign({}, condition, recepient)
    newForm.recepientForm.push(pushForm)
    setItemsRecepient(newForm)
  }
  const onDeleteChildRecepient = (id: number) => {
    const newForm = Object.assign({}, itemsRecepientForm)
    newForm.recepientForm.splice(id, 1)
    setItemsRecepient(newForm)
  }

  // ===
  const onDeleteChildItems = (id: number) => {
    const newCustomPoolForm = Object.assign({}, items)
    newCustomPoolForm.items.splice(id, 1)
    setName({ name: '' })
    setPool({ pool: '20' })
    setRecepient({ userID: '' })
    setCondition({ condition: '' })
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
              {items.items.length !== 0 && (
                <button
                  onClick={() => {
                    setName({ name: '' })
                    setPool({ pool: '20' })
                    setRecepient({ userID: '' })
                    setCondition({ condition: '' })
                    setModal(true)
                  }}
                  className={cn(styles.pushChanges, styles.newReward)}
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
                    // placeholder={x.author}
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
              {items.items.length !== 0 && (
                <button
                  onClick={() => {
                    setName({ name: '' })
                    setPool({ pool: '20' })
                    setRecepient({ userID: '' })
                    setCondition({ condition: '' })
                    setModal(true)
                  }}
                  className={cn(styles.pushChanges, styles.newReward)}
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
                              {x.condition && x.condition.length >= 1 && (
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
                    // onClick={() => {
                    //   setModal(true)
                    // }}
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
            {items.items.length !== 0 && (
              <button className={styles.pushChanges}>Push changes</button>
            )}
          </div>

          {items.items.length === 0 && (
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
                <form
                  // onSubmit={(e) => addItem(e)}
                  className={styles.creationWrapper}
                >
                  <div className={styles.creationFirstBlock}>
                    <div className={styles.rewardNameBlock}>
                      <span className={styles.nameLabel}>Reward name</span>
                      <input
                        value={name.name}
                        onChange={(e) => handleChange(e)}
                        name="rewardName"
                        className={styles.nameInput}
                      />
                    </div>
                    <div className={styles.rewardPoolBlock}>
                      <span className={styles.nameLabel}>Pool</span>
                      <input
                        name="pool"
                        value={`${pool.pool}%`}
                        // onChange={(e) => handleChangeNum(e)}
                        onChange={(e: any) => {
                          const { data, inputType } = e.nativeEvent

                          console.log({ data, inputType, e })
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
                              const newValue = pool.pool.slice(0, -1)
                              if (newValue.length === 0) setPool({ pool: '1' })
                              else setPool({ pool: newValue })
                              break

                            default:
                              break
                          }
                        }}
                        className={styles.poolInput}
                      />
                    </div>
                  </div>

                  <div className={styles.rewardRecepientBlock}>
                    <div className={styles.recepientBlock}>
                      <span className={styles.nameLabel}>Recipient</span>
                      <button
                        type="button"
                        onClick={addButtonClickRecepient}
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
                              // value={recepient.userID}
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
                            <div className={styles.recepientChangeBlock}>
                              <button
                                type="button"
                                onClick={() => {
                                  node.current?.classList.add('valid')
                                  console.log(booleanNode)
                                }}
                                className={styles.recepientConditionalButton}
                              />
                              <span
                                className={styles.recepientConditionalLabel}
                              >
                                conditional
                              </span>
                            </div>

                            <div
                              ref={node}
                              className={styles.conditionalWrapper}
                            >
                              <span className={styles.conditionalLabel}>
                                condition: if this dapplet has dependency to
                              </span>
                              <div className={styles.conditionalInputBlock}>
                                <input
                                  name="condition"
                                  className={styles.inputConditional}
                                  onChange={(e) => {
                                    handleChangeCondition(e)
                                    itemsRecepientForm.recepientForm[
                                      i
                                    ].condition = e.target.value
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    node.current?.classList.remove('valid')
                                    console.log(booleanNode)
                                  }}
                                  className={styles.inputConditionalDelete}
                                />
                              </div>
                            </div>
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
                  // &&
                  // itemsRecepientForm.recepientForm[0].userID.length >= 2,
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
    </div>
  )
}
