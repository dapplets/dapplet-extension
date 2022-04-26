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
  const [recepient, setNewRecepient] = useState({ recepientNew: [] })
  // const [num, setNum] = useState(recepientNew)
  const newForm = Object.assign({}, recepient)
  useEffect(() => {
    newForm.recepientNew = [RECEPIENT_CREATE]
    setNewRecepient(recepient)
  }, [recepient])

  const newRecepientObject = {
    userId: '',
  }
  const newRecepientConditionObject = {
    condition: '',
  }

  const [isApplyDisabled, setApplyDisabled] = useState(true)
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

        <div className={styles.wrapperChanges}>
          <div className={styles.createdRewardsWrapper}>
            <>
              {recepient.recepientNew &&
                recepient.recepientNew.length > 0 &&
                recepient.recepientNew.map((x, i) => (
                  <SettingWrapper
                    key={i}
                    className={styles.settingWrapperCreatedRewards}
                    title={`${x}`}
                    children={
                      <>
                        <div className={styles.createdRewardsBlock}>
                          <div className={styles.createdRewardsBlockUser}>
                            <span className={styles.createdRewardsBlockLabel}>
                              User:
                            </span>
                            <span
                              className={styles.createdRewardsBlockLabelUser}
                            >
                              {''}
                            </span>
                          </div>

                          <div className={styles.createdRewardsBlockConditions}>
                            <span className={styles.createdRewardsBlockLabel}>
                              Conditions :
                            </span>
                            <span
                              className={styles.createdRewardsBlockLabelAdapter}
                            ></span>
                          </div>
                        </div>
                      </>
                    }
                  />
                ))}

              <span className={styles.percentReward}>{`Reward %`}</span>
              <button className={styles.changeReward}>Change</button>
            </>
          </div>
          <button
            onClick={() => {
              setModal(true)
            }}
            className={styles.pushChanges}
          >
            Push changes
          </button>
        </div>

        {/* {!isApplyChanges && ( */}
        <Message
          title="No rewards yet"
          subtitle="Click below to create first reward"
          // link="F.A.Q"
          // linkText="F.A.Q"
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
        {/* )} */}

        <ModalReward
          visible={isModal}
          title={'Reword creation'}
          content={
            <>
              <div className={styles.creationWrapper}>
                <div className={styles.creationFirstBlock}>
                  <div className={styles.rewardNameBlock}>
                    <span className={styles.nameLabel}>Reward name</span>
                    <input
                      onChange={(e) => {
                        newForm.recepientNew[0][e.target.name] = e.target.value

                        setNewRecepient(newForm)
                        console.log(RECEPIENT_CREATE)
                      }}
                      name="rewardName"
                      className={styles.nameInput}
                    />
                  </div>
                  <div className={styles.rewardPoolBlock}>
                    <span className={styles.nameLabel}>Pool</span>
                    <input
                      name="rewardPool"
                      onChange={(e) => {
                        newForm.recepientNew[0][e.target.name] = Number(
                          e.target.value
                        )

                        setNewRecepient(newForm)
                        console.log(RECEPIENT_CREATE)
                      }}
                      className={styles.poolInput}
                    />
                  </div>
                </div>

                <div className={styles.rewardRecepientBlock}>
                  <div className={styles.recepientBlock}>
                    <span className={styles.nameLabel}>Recipient</span>
                    <button className={styles.customPoolButton} />
                  </div>

                  <div className={styles.newRewardRecepientBlock}>
                    <div className={styles.recepientInputBlock}>
                      <input name="userId" className={styles.recepientInput} />
                      <button className={styles.recepientInputButton} />
                    </div>

                    <div className={styles.recepientConditionalBlock}>
                      <div className={styles.recepientChangeBlock}>
                        <button className={styles.recepientConditionalButton} />
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
                          <button className={styles.inputConditionalDelete} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
            //
          }
          footer={
            <button
              onClick={() => {
                console.log(recepient)
                setNewRecepient((prevState: any) => ({
                  ...prevState,
                  recepientNew: { ...prevState.recepientNew },
                }))
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
