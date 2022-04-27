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
import { id } from 'ethers/lib/utils'

export interface RewardsProps {
  setUnderConstructionDetails: (x) => void
  // isSupport?: boolean
}
let _isMounted = false
const RECEPIENT_CREATE = {
  rewardName: '',
  rewardPool: 20,
  recepient: [],
  conditional: [],
}
// const recepientNew = []

export const Rewards: FC<RewardsProps> = (props) => {
  const { setUnderConstructionDetails } = props
  const [distributed, onDistributed] = useState('0%')
  const newCustomPoolObject = {
    customPool: '2141234124',
  }
  const [newCustomPool, setCustomPool] = useState({ customPoolForm: [] })

  const [items, setItems] = useState({
    items: [],
  })
  const [name, setName] = useState({ name: '' })
  const [pool, setPool] = useState({ pool: '' })
  const [itemsRecepientForm, setItemsRecepient] = useState({
    recepientForm: [],
  })

  const [recepient, setRecepient] = useState({ userID: '' })
  const [condition, setCondition] = useState({ condition: '' })

  useEffect(
    () => {
      console.log(items)
    },
    [
      // name, pool, items, itemsRecepientForm, recepient
    ]
  )
  const Num = useMemo(() => {
    // if (
    //   name.name &&
    //   name.name.length >= 1 &&
    //   pool.pool &&
    //   pool.pool.length >= 1 &&
    //   recepient.userID &&
    //   recepient.userID.length >= 1
    // ) {
    //   setApplyDisabled(true)
    // } else {
    //   setApplyDisabled(false)
    // }
  }, [recepient])

  const [isApplyDisabled, setApplyDisabled] = useState(false)
  const [isApplyChanges, setApplyChanges] = useState(false)
  const [isModal, setModal] = useState(false)

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
    console.log(items)
  }

  const handleChange = (event) => {
    setName({ name: event.target.value })
  }
  const handleChangeNum = (event) => {
    setPool({ pool: event.target.value })
  }

  // ====
  const addButtonClickRecepient = () => {
    const newForm = Object.assign({}, itemsRecepientForm)

    newForm.recepientForm.push(recepient)
    setItemsRecepient(newForm)

    console.log(itemsRecepientForm)
  }
  const onDeleteChildRecepient = (id: number) => {
    const newForm = Object.assign({}, itemsRecepientForm)
    newForm.recepientForm.splice(id, 1)
    setItemsRecepient(newForm)
  }

  // // ===
  // const addButtonClickCondition = () => {
  //   const newForm = Object.assign({}, itemsConditionForm)
  //   newForm.conditionForm.push(condition)
  //   setItemsCondition(newForm)
  // }
  // const onDeleteChildCondition = (id: number) => {
  //   const newForm = Object.assign({}, itemsConditionForm)
  //   newForm.conditionForm.splice(id, 1)
  //   setItemsCondition(newForm)
  // }
  const handleChangeRecepient = (event) => {
    event.preventDefault
    setRecepient({ userID: event.target.value })
  }

  return (
    <div className={styles.wrapper}>
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
              <button className={cn(styles.pushChanges, styles.newReward)}>
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
              <button className={cn(styles.pushChanges, styles.newReward)}>
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
                              <span className={styles.createdRewardsBlockLabel}>
                                User:
                              </span>
                              <span
                                className={styles.createdRewardsBlockLabelUser}
                              >
                                {x.userID}
                              </span>
                            </div>

                            <div
                              className={styles.createdRewardsBlockConditions}
                            >
                              <span className={styles.createdRewardsBlockLabel}>
                                Conditions :
                              </span>
                              <span
                                className={
                                  styles.createdRewardsBlockLabelAdapter
                                }
                              ></span>
                            </div>
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
                      name="name"
                      value={pool.pool}
                      onChange={(e) => handleChangeNum(e)}
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
                  {itemsRecepientForm.recepientForm &&
                    itemsRecepientForm.recepientForm.map((x, i) => (
                      <div key={i} className={styles.newRewardRecepientBlock}>
                        <div className={styles.recepientInputBlock}>
                          <input
                            name="userId"
                            value={recepient.userID}
                            className={styles.recepientInput}
                            onChange={(e) => {
                              handleChangeRecepient(e)
                              console.log(i)
                              console.log(recepient)
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
                              className={styles.recepientConditionalButton}
                            />
                            <span className={styles.recepientConditionalLabel}>
                              conditional
                            </span>
                          </div>

                          <div className={styles.conditionalWrapper}>
                            <span className={styles.conditionalLabel}>
                              condition: if this dapplet has dependency to
                            </span>
                            <div className={styles.conditionalInputBlock}>
                              <input
                                name="condition"
                                className={styles.inputConditional}
                              />
                              <button
                                type="button"
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
              })}
            >
              Apply
            </button>
          }
          onClose={onClose}
        />
      </div>

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
