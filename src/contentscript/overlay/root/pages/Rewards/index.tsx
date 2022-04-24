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

export const Rewards: FC<RewardsProps> = (props) => {
  const { setUnderConstructionDetails } = props
  const [distributed, onDistributed] = useState('0%')
  const newCustomPoolObject = {
    customPool: '2141234124',
  }
  const [newCustomPool, setCustomPool] = useState({ customPoolForm: [] })
  const [recepient, setNewRecepient] = useState({ recepientNew: [] })

  useEffect(() => {
    // let newForm = Object.assign({}, recepient)
    // newForm.recepientNew = [RECEPIENT_CREATE]
    // setNewRecepient(newForm)
    // console.log(recepient)
  }, [])
  const add = () => {
    const newForm = Object.assign({}, recepient)
    newForm.recepientNew.push(RECEPIENT_CREATE)
    setNewRecepient(newForm)

    console.log(recepient)
  }
  // const [conditional, setConditional] = useState(recepient[0].recepient)
  // const [creationForm, onCreationForm] = useState(recepient)
  const newRecepientObject = {
    userId: '',
  }
  const newRecepientConditionObject = {
    condition: '',
  }

  const [isApplyDisabled, setApplyDisabled] = useState(true)
  const [isApplyChanges, setApplyChanges] = useState(false)
  const [isModal, setModal] = useState(false)

  // const applyTrace = useMemo(() => {
  //   if (recepient[0].rewordName.length >= 1 && recepient[0].rewordPool > 1) {
  //     setApplyDisabled(false)
  //   } else {
  //     setApplyDisabled(true)
  //   }
  //   console.log(recepient)
  // }, [isApplyDisabled, recepient])

  // const changeHandler = (e: ChangeEvent<HTMLInputElement>) => {
  //   const { name, value } = e.currentTarget
  //   const newForm = Object.assign({}, recepient)
  //   newForm.recepientNew[0][name] = value
  //   console.log(value)
  //   console.log(newForm)

  //   setNewRecepient(newForm)
  //   // setNewRecepient([...recepient.push(newForm)])
  //   // recepient.push(newForm)

  //   console.log(recepient)
  // }
  // const changeHandlerRecepient = (e: ChangeEvent<HTMLInputElement>) => {
  //   const { name, value } = e.currentTarget

  //   const newForm = Object.assign({}, recepient)
  //   newForm[0].recepient[0][name] = value
  //   // console.log(value)

  //   setNewRecepient(newForm)
  // }
  // const changeHandlerConditional = (e: ChangeEvent<HTMLInputElement>) => {
  //   const { name, value } = e.currentTarget

  //   const newForm = Object.assign({}, recepient)
  //   newForm[0].conditional[0][name] = value
  //   console.log(value)

  //   setNewRecepient(newForm)
  // }

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

  // const addButtonClickHandlerRecepient = () => {
  //   const newRecepientForm = Object.assign({}, recepient)
  //   newRecepientForm[0].recepient.push(newRecepientObject)
  //   setNewRecepient(newRecepientForm)
  // }
  // const onDeleteChildRecepient = (id: number) => {
  //   const newRecepientForm = Object.assign({}, recepient)
  //   newRecepientForm[0].recepient.splice(id, 1)
  //   setNewRecepient(newRecepientForm)
  // }

  // const addButtonClickHandlerRecepientCondition = () => {
  //   const newConditionForm = Object.assign({}, recepient)
  //   newConditionForm[0].conditional.push(newRecepientConditionObject)
  //   setNewRecepient(newConditionForm)
  // }
  // const onDeleteChildRecepientCondition = (id: number) => {
  //   const newConditionForm = Object.assign({}, recepient)
  //   newConditionForm[0].conditional.splice(id, 1)
  //   setNewRecepient(newConditionForm)
  // }
  // const add = () => {
  //   const newForm = Object.assign({}, recepient)
  //   newForm.push(RECEPIENT_CREATE)
  //   setNewRecepient(newForm)
  // }

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
          </div>
        ))}
        {isApplyChanges && (
          <div className={styles.wrapperChanges}>
            <div className={styles.createdRewardsWrapper}>
              <SettingWrapper
                className={styles.settingWrapperCreatedRewards}
                title=""
                children={
                  <>
                    {recepient.recepientNew.map((x, i) => (
                      <div key={i} className={styles.createdRewardsBlock}>
                        <div className={styles.createdRewardsBlockUser}>
                          <span className={styles.createdRewardsBlockLabel}>
                            User:
                          </span>
                          <span className={styles.createdRewardsBlockLabelUser}>
                            {`${x.rewardName}`}
                          </span>
                        </div>

                        <div className={styles.createdRewardsBlockConditions}>
                          <span className={styles.createdRewardsBlockLabel}>
                            Conditions :
                          </span>
                          <span
                            className={styles.createdRewardsBlockLabelAdapter}
                          >
                            {''}
                          </span>
                        </div>
                      </div>
                    ))}
                  </>
                }
              />
              <span className={styles.percentReward}>{`Reward %`}</span>
              <span className={styles.changeReward}>Change</span>
            </div>
            <button
              onClick={() => setModal(true)}
              className={styles.pushChanges}
            >
              Push changes
            </button>
          </div>
        )}
        {!isApplyChanges && (
          <Message
            title="No rewards yet"
            subtitle="Click below to create first reward"
            // link="F.A.Q"
            // linkText="F.A.Q"
            children={
              <button
                onClick={() => setModal(true)}
                className={styles.createRewards}
              >
                Create
              </button>
            }
          />
        )}

        <ModalReward
          visible={isModal}
          title={'Reword creation'}
          content={
            <>
              <div className={styles.creationWrapper}>
                <div className={styles.creationFirstBlock}>
                  <div className={styles.rewardNameBlock}>
                    <span className={styles.nameLabel}>Reword name</span>
                    <input
                      // onChange={(e) =>
                      //   setNewRecepient((prevState: any) => ({
                      //     ...prevState,
                      //     rewordName: e.target.value,
                      //   }))
                      // }
                      onChange={(e) => {
                        RECEPIENT_CREATE.rewardName = e.target.value
                        console.log(recepient)
                      }}
                      name="rewardName"
                      // value={recepient.rewordName}
                      className={styles.nameInput}
                    />
                  </div>
                  <div className={styles.rewardPoolBlock}>
                    <span className={styles.nameLabel}>Pool</span>
                    <input
                      name="rewardPool"
                      // onChange={(e) => changeHandler(e)}
                      // value={recepient.rewordPool}
                      className={styles.poolInput}
                    />
                  </div>
                </div>

                <div className={styles.rewardRecepientBlock}>
                  <div className={styles.recepientBlock}>
                    <span className={styles.nameLabel}>Recipient</span>
                    <button
                      // onClick={addButtonClickHandlerRecepient}
                      className={styles.customPoolButton}
                    />
                  </div>

                  <div className={styles.newRewardRecepientBlock}>
                    {/* {x.recepient.map((x, i) => ( */}
                    <div className={styles.recepientInputBlock}>
                      <input
                        name="userId"
                        className={styles.recepientInput}
                        // onChange={(e) => changeHandlerRecepient(e)}
                      />
                      <button
                        // onClick={() => onDeleteChildRecepient(i)}
                        className={styles.recepientInputButton}
                      />
                    </div>
                    {/* ))} */}
                    {/* {x.conditional.map((x, i) => ( */}
                    <div className={styles.recepientConditionalBlock}>
                      <div className={styles.recepientChangeBlock}>
                        <button
                          // onClick={addButtonClickHandlerRecepientCondition}
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
                            // onChange={(e) => changeHandlerConditional(e)}
                            className={styles.inputConditional}
                          />
                          <button
                            // onClick={() => onDeleteChildRecepientCondition(i)}
                            className={styles.inputConditionalDelete}
                          />
                        </div>
                      </div>
                    </div>
                    {/* ))} */}
                  </div>
                </div>
              </div>
            </>
            //
          }
          footer={
            <button
              onClick={() => {
                setApplyChanges(true)
                // setNewRecepient(recepient)
                add()
                // console.log(recepient)

                onClose()
              }}
              className={cn(styles.applyButton, {
                [styles.applyButtonDisabled]: isApplyDisabled,
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
