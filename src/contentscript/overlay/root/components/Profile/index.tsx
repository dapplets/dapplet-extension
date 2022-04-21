import React, { Component, FC, useEffect, useRef, useState } from 'react'
import styles from './Profile.module.scss'
import cn from 'classnames'
import { Avatar } from '../Avatar'

import { useToggle } from '../../hooks/useToggle'
import { ReactComponent as Open } from './profileIcons/open.svg'

import { ReactComponent as Ephir } from './profileIcons/Money/ephir.svg'
import { ReactComponent as Metamask } from './profileIcons/Money/metamask.svg'
import { ReactComponent as Nira } from './profileIcons/Money/nira.svg'
import { ReactComponent as OtherMoney } from './profileIcons/Money/purseNoName.svg'

import { ReactComponent as ChangeOpen } from './profileIcons/iconsProfile/changeOpen.svg'
import { ReactComponent as DoorOpen } from './profileIcons/iconsProfile/doorOpen.svg'
import { ReactComponent as EtheriumOpen } from './profileIcons/iconsProfile/EtheriumOpen.svg'

import { ReactComponent as ChangeClose } from './profileIcons/iconsProfile/choiseClose.svg'
import { ReactComponent as DoorClose } from './profileIcons/iconsProfile/closeDoor.svg'
import { ReactComponent as EtheriumClose } from './profileIcons/iconsProfile/etheriumClose.svg'

import { ReactComponent as ProfileOne } from './profileIcons/Profile/profileOne.svg'
import { ReactComponent as ProfileTwo } from './profileIcons/Profile/profileTwo.svg'
import { ReactComponent as ProfileThree } from './profileIcons/Profile/profileThree.svg'
import classNames from 'classnames'

export interface ProfileProps {
  // avatar: string
  hash?: string
  // isLogin?: boolean;
  open?: () => void
  onLogout?: () => void
  mini?: boolean
}

const TEST_PROFILE = [<ProfileOne />, <ProfileTwo />, <ProfileThree />]
const TEST_PROFILE_One = [<ProfileOne />]

const TEST_MONEY = [<Ephir />, <Metamask />, <Nira />, <OtherMoney />]

export const Profile: FC<ProfileProps> = (props: ProfileProps) => {
  const {
    // avatar,
    hash,
    //  isOpen,
    onLogout,
    open,
    mini = false,
  } = props
  const [isOpen, setOpen] = useToggle(false)
  const [isOpenProfile, setOpenProfile] = useState(false)
  const [isLogin, setLogin] = useToggle(true)
  // const [isChange, setChange] = useToggle(false)
  // const [isDoor, setDoor] = useToggle(false)
  // const [isEphir, setEphir] = useToggle(false)
  // const [activeState, setActiveState] = useState(false)
  const visible = (hash: string): string => {
    const firstFourCharacters = hash.substring(0, 4)
    const lastFourCharacters = hash.substring(hash.length - 0, hash.length - 4)

    return `${firstFourCharacters}...${lastFourCharacters}`
  }

  const newTestIcons = () => {
    return TEST_MONEY.map((x, i) => (
      <span className={styles.profileIconsMoney} key={i}>
        {x}
      </span>
    ))
  }

  return (
    <div className={styles.wrapper}>
      {isLogin && (
        <div className={styles.wrapperBlock}>
          <div className={styles.bigOpenBlock}>
            <header
              className={cn(styles.header, { [styles.mini]: mini })}
              onClick={open}
            >
              {!isOpenProfile && (
                <div>
                  <Num examples={examples} />
                </div>
              )}

              {!mini && (
                // <>
                <div className={styles.blockInfo}>
                  <div className={styles.nameAccount}>
                    Ethernial.Eth <div className={styles.blockEns}>ENS</div>
                  </div>
                  {/* {hash && */}
                  <p className={styles.hash}>{visible(hash)}</p>
                  {/* } */}

                  {/* {!hash && ( */}
                  <div className={styles.moneyBlock}>{newTestIcons()}</div>
                  {/* )} */}
                </div>
                // </>
              )}
            </header>
            <span className={styles.blockOpenIcon} onClick={setOpen}>
              <Open />
            </span>
            {/* {!mini && ( */}
            {/* )} */}
          </div>
          <div>
            {isOpen && !mini && (
              <ul
                className={cn(styles.list, {
                  [styles.isOpen]: isOpen,
                })}
              >
                <li
                  // onClick={onLogout}
                  onClick={setLogin}
                  className={styles.item}
                >
                  Log out
                </li>
              </ul>
            )}
          </div>
        </div>
      )}
      {!isLogin && (
        <ul onClick={setLogin} className={cn(styles.listLogIn)}>
          Log in
        </ul>
      )}
    </div>
  )
}

const ExampleItem = ({ handleChange, item }) => {
  const [isOpenProfile, setOpenProfile] = useState(false)
  const [isChange, setChange] = useToggle(false)
  const [isDoor, setDoor] = useToggle(false)
  const [isEphir, setEphir] = useToggle(false)
  // console.log(isOpenProfile)

  return (
    <div
      className={cn(styles.bigStyleProfile, {
        [styles.miniProfile]: isOpenProfile,
      })}
      // onClick={() => {
      //   setOpenProfile(!isOpenProfile)

      // }}
    >
      {!item.isChanged ? (
        <span
          // onFocus={() => {
          //   setOpenProfile(isOpenProfile)
          // }}
          className={cn(styles.profileIcon, {
            [styles.profileIconMini]: isOpenProfile,
          })}
          onClick={() => {
            handleChange(item.id)
          }}
        >
          {!item.isChanged ? item.id : item.id}
          <span
            className={cn(styles.notChange, {
              [styles.change]: isChange,
            })}
          ></span>
          <span
            className={cn(styles.notEphir, {
              [styles.ephir]: isEphir,
            })}
          ></span>
          <span
            className={cn(styles.notDoor, {
              [styles.door]: isDoor,
            })}
          ></span>
        </span>
      ) : (
        <span
          onFocus={() => {
            setOpenProfile(isOpenProfile)
            console.log('lalla')
          }}
          onClick={() => {
            handleChange(item.id)
            // setOpenProfile(!isOpenProfile)
          }}
          className={cn(styles.profileIconActive, {
            // [styles.profileIconMini]: isOpenProfile,
          })}
        >
          {!item.isChanged ? item.id : item.id}

          <span
            className={cn(styles.change, {
              [styles.notChange]: isChange,
            })}
          ></span>
          <span
            className={cn(styles.ephir, {
              [styles.notEphir]: isEphir,
            })}
          ></span>
          <span
            className={cn(styles.door, {
              [styles.notDoor]: isDoor,
            })}
          ></span>
        </span>
      )}
    </div>
  )
}
const Num = (props) => {
  const [examples, setExamples] = React.useState(props.examples)
  const [isOpenProfile, setOpenProfile] = useState(false)
  const handleChange = (index) => {
    setExamples((previosExamples) => {
      return previosExamples.map((it) => {
        if (it.id === index) {
          return {
            ...it,

            isChanged: true,
          }
        } else {
          return {
            ...it,
            isChanged: false,
          }
        }

        // return it
      })
    })
  }
  console.log(isOpenProfile)

  return (
    <div
      onClick={() => setOpenProfile(!isOpenProfile)}
      className={cn(styles.num, { [styles.numActive]: !isOpenProfile })}
    >
      {examples.map((item, index) => (
        <ExampleItem key={index} handleChange={handleChange} item={item} />
      ))}
    </div>
  )
}
const examples = TEST_PROFILE.map((it) => ({
  id: it,
  isChanged: false,
}))
const examplesOne = TEST_PROFILE_One.map((it) => ({
  id: it,
  isChanged: false,
}))

export const ProfileImg: FC<ProfileProps> = (props: ProfileProps) => {
  const {
    // avatar,
    hash,
    //  isOpen,
    onLogout,
    open,
    mini = false,
  } = props
  const [isOpen, setOpen] = useToggle(false)
  const [isOpenProfile, setOpenProfile] = useState(false)
  const [isLogin, setLogin] = useToggle(true)

  const visible = (hash: string): string => {
    const firstFourCharacters = hash.substring(0, 4)
    const lastFourCharacters = hash.substring(hash.length - 0, hash.length - 4)

    return `${firstFourCharacters}...${lastFourCharacters}`
  }

  const newTestIcons = () => {
    return TEST_MONEY.map((x, i) => (
      <span className={styles.profileIconsMoney} key={i}>
        {x}
      </span>
    ))
  }
  return (
    <div className={styles.wrapper} style={{ marginTop: '10px' }}>
      {isLogin && (
        <div className={styles.wrapperBlock}>
          <div className={styles.bigOpenBlock}>
            <header
              className={cn(styles.header, { [styles.mini]: mini })}
              onClick={open}
            >
              {!isOpenProfile && (
                <div>
                  <Num examples={examples} />
                </div>
              )}
            </header>
            <span className={styles.blockOpenIcon} onClick={setOpen}>
              <Open />
            </span>
            {/* {!mini && ( */}
            {/* )} */}
          </div>
          <div>
            {isOpen && !mini && (
              <ul
                className={cn(styles.list, {
                  [styles.isOpen]: isOpen,
                })}
              >
                <li
                  // onClick={onLogout}
                  onClick={setLogin}
                  className={styles.item}
                >
                  Log out
                </li>
              </ul>
            )}
          </div>
        </div>
      )}
      {!isLogin && (
        <ul onClick={setLogin} className={cn(styles.listLogIn)}>
          Log in
        </ul>
      )}
    </div>
  )
}
export const ProfileText: FC<ProfileProps> = (props: ProfileProps) => {
  const {
    // avatar,
    hash,
    //  isOpen,
    onLogout,
    open,
    mini = false,
  } = props
  const [isOpen, setOpen] = useToggle(false)
  const [isOpenProfile, setOpenProfile] = useState(false)
  const [isLogin, setLogin] = useToggle(true)
  // const [isChange, setChange] = useToggle(false)
  // const [isDoor, setDoor] = useToggle(false)
  // const [isEphir, setEphir] = useToggle(false)
  // const [activeState, setActiveState] = useState(false)
  const visible = (hash: string): string => {
    const firstFourCharacters = hash.substring(0, 4)
    const lastFourCharacters = hash.substring(hash.length - 0, hash.length - 4)

    return `${firstFourCharacters}...${lastFourCharacters}`
  }

  const newTestIcons = () => {
    return TEST_MONEY.map((x, i) => (
      <span className={styles.profileIconsMoney} key={i}>
        {x}
      </span>
    ))
  }

  return (
    <div className={styles.wrapper} style={{ marginTop: '10px' }}>
      {isLogin && (
        <div className={styles.wrapperBlock}>
          <div className={styles.bigOpenBlock}>
            <header
              className={cn(styles.header, { [styles.mini]: mini })}
              onClick={open}
            >
              {/* {!isOpenProfile && (
                <div>
                  <Num examples={examples} />
                </div>
              )} */}

              {!mini && (
                // <>
                <div className={styles.blockInfo}>
                  <div className={styles.nameAccount}>
                    Ethernial.Eth <div className={styles.blockEns}>ENS</div>
                  </div>
                  {/* {hash && */}
                  <p className={styles.hash}>{visible(hash)}</p>
                  {/* } */}

                  {/* {!hash && ( */}
                  {/* <div className={styles.moneyBlock}>{newTestIcons()}</div> */}
                  {/* )} */}
                </div>
                // </>
              )}
            </header>
            <span className={styles.blockOpenIcon} onClick={setOpen}>
              <Open />
            </span>
            {/* {!mini && ( */}
            {/* )} */}
          </div>
          <div>
            {isOpen && !mini && (
              <ul
                className={cn(styles.list, {
                  [styles.isOpen]: isOpen,
                })}
              >
                <li
                  // onClick={onLogout}
                  onClick={setLogin}
                  className={styles.item}
                >
                  Log out
                </li>
              </ul>
            )}
          </div>
        </div>
      )}
      {!isLogin && (
        <ul onClick={setLogin} className={cn(styles.listLogIn)}>
          Log in
        </ul>
      )}
    </div>
  )
}

export const ProfileOneImg: FC<ProfileProps> = (props: ProfileProps) => {
  const {
    // avatar,
    hash,
    //  isOpen,
    onLogout,
    open,
    mini = false,
  } = props
  const [isOpen, setOpen] = useToggle(false)
  const [isOpenProfile, setOpenProfile] = useState(false)
  const [isLogin, setLogin] = useToggle(true)
  // const [isChange, setChange] = useToggle(false)
  // const [isDoor, setDoor] = useToggle(false)
  // const [isEphir, setEphir] = useToggle(false)
  // const [activeState, setActiveState] = useState(false)
  const visible = (hash: string): string => {
    const firstFourCharacters = hash.substring(0, 4)
    const lastFourCharacters = hash.substring(hash.length - 0, hash.length - 4)

    return `${firstFourCharacters}...${lastFourCharacters}`
  }

  const newTestIcons = () => {
    return TEST_MONEY.map((x, i) => (
      <span className={styles.profileIconsMoney} key={i}>
        {x}
      </span>
    ))
  }

  return (
    <div className={styles.wrapper} style={{ marginTop: '10px' }}>
      {isLogin && (
        <div className={styles.wrapperBlock}>
          <div className={styles.bigOpenBlock}>
            <header
              className={cn(styles.header, { [styles.mini]: mini })}
              onClick={open}
            >
              {/* {!isOpenProfile && ( */}
              <div>
                <NumTwo examples={examplesOne} />
              </div>
              {/* )} */}

              {!mini && (
                // <>
                <div className={styles.blockInfo}>
                  <div className={styles.nameAccount}>
                    Ethernial.Eth <div className={styles.blockEns}>ENS</div>
                  </div>
                  {/* {hash && */}
                  {/* <p className={styles.hash}>{visible(hash)}</p> */}
                  {/* } */}

                  {/* {!hash && ( */}
                  <div className={styles.moneyBlock}>{newTestIcons()}</div>
                  {/* )} */}
                </div>
                // </>
              )}
            </header>
            <span className={styles.blockOpenIcon} onClick={setOpen}>
              <Open />
            </span>
            {/* {!mini && ( */}
            {/* )} */}
          </div>
          <div>
            {isOpen && !mini && (
              <ul
                className={cn(styles.list, {
                  [styles.isOpen]: isOpen,
                })}
              >
                <li
                  // onClick={onLogout}
                  onClick={setLogin}
                  className={styles.item}
                >
                  Log out
                </li>
              </ul>
            )}
          </div>
        </div>
      )}
      {!isLogin && (
        <ul onClick={setLogin} className={cn(styles.listLogIn)}>
          Log in
        </ul>
      )}
    </div>
  )
}

const ExampleItemTwo = ({ handleChange, item }) => {
  const [isOpenProfile, setOpenProfile] = useState(false)
  const [isChange, setChange] = useToggle(false)
  const [isDoor, setDoor] = useToggle(false)
  const [isEphir, setEphir] = useToggle(false)
  // console.log(isOpenProfile)

  return (
    <div
      className={cn(styles.bigStyleProfile, {
        // [styles.miniProfile]: isOpenProfile,
      })}
      // onClick={() => {
      //   setOpenProfile(!isOpenProfile)

      // }}
    >
      {!item.isChanged ? (
        <span
          // onFocus={() => {
          //   setOpenProfile(isOpenProfile)
          // }}
          className={cn(styles.profileIcon, {
            // [styles.profileIconMini]: isOpenProfile,
          })}
          onClick={() => {
            handleChange(item.id)
          }}
        >
          {!item.isChanged ? item.id : item.id}
          <span
            className={cn(styles.notChange, {
              [styles.change]: isChange,
            })}
          ></span>
          <span
            className={cn(styles.notEphir, {
              [styles.ephir]: isEphir,
            })}
          ></span>
          <span
            className={cn(styles.notDoor, {
              [styles.door]: isDoor,
            })}
          ></span>
        </span>
      ) : (
        <span
          // onFocus={() => {
          //   setOpenProfile(isOpenProfile)
          // }}
          className={cn(styles.profileIcon, {
            // [styles.profileIconMini]: isOpenProfile,
          })}
          onClick={() => {
            handleChange(item.id)
          }}
        >
          {!item.isChanged ? item.id : item.id}
          <span
            className={cn(styles.notChange, {
              [styles.change]: isChange,
            })}
          ></span>
          <span
            className={cn(styles.notEphir, {
              [styles.ephir]: isEphir,
            })}
          ></span>
          <span
            className={cn(styles.notDoor, {
              [styles.door]: isDoor,
            })}
          ></span>
        </span>
      )}
    </div>
  )
}
const NumTwo = (props) => {
  const [examples, setExamples] = React.useState(props.examples)
  const [isOpenProfile, setOpenProfile] = useState(false)
  const handleChange = (index) => {
    setExamples((previosExamples) => {
      return previosExamples.map((it) => {
        if (it.id === index) {
          return {
            ...it,

            isChanged: true,
          }
        } else {
          return {
            ...it,
            isChanged: false,
          }
        }

        // return it
      })
    })
  }
  // console.log(isOpenProfile)

  return (
    <div
      // onClick={() => setOpenProfile(!isOpenProfile)}
      className={cn(styles.num, { [styles.numActive]: !isOpenProfile })}
    >
      {examples.map((item, index) => (
        <ExampleItemTwo key={index} handleChange={handleChange} item={item} />
      ))}
    </div>
  )
}
