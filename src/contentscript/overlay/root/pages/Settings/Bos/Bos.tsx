import { initBGFunctions } from 'chrome-extension-message-wrapper'
import React, { FC, useEffect, useState } from 'react'
import browser from 'webextension-polyfill'
import * as EventBus from '../../../../../../common/global-event-bus'
import { ChainTypes, DefaultSigners, MutationRecord } from '../../../../../../common/types'
import { Input } from '../../../components/Input'
import { SettingItem } from '../../../components/SettingItem'
import { SettingWrapper } from '../../../components/SettingWrapper'
import styles from './Bos.module.scss'
import { useVisibleBosComponents } from './useVisibleBosComponents'

enum FormStatus {
  View,
  Create,
  Edit,
}

const EMPTY_MUTATION = {
  id: '',
  description: '',
  overrides: {},
}

export const Bos: FC = () => {
  const [formStatus, setFormStatus] = useState<FormStatus>(FormStatus.View)
  const [isEdited, setIsEdited] = useState(false)
  const [currentAccount, setCurrentAccount] = useState(null)
  const [mutation, setMutation] = useState<MutationRecord>(EMPTY_MUTATION)
  const [isCopied, setIsCopied] = useState(false)

  const inViewComponents = useVisibleBosComponents()

  useEffect(() => {
    const load = async () => {
      const { getMutation, getMutationById, getAddress } = await initBGFunctions(browser)
      const mutationId = await getMutation()
      const mutation = await getMutationById(mutationId)
      const currentAccount = await getAddress(DefaultSigners.EXTENSION, ChainTypes.NEAR_MAINNET)
      // ToDo: why getAddress returns 0x0000000000000000000000000000000000000000 ???
      setCurrentAccount(
        currentAccount === '0x0000000000000000000000000000000000000000' ? null : currentAccount
      )
      setMutation(mutation ?? EMPTY_MUTATION)
    }

    load()

    EventBus.on('bos_mutation_changed', load)
    return () => EventBus.off('bos_mutation_changed', load)
  }, [])

  useEffect(() => {
    const [authorId] = mutation.id.split('/')
    if (mutation.isDraft) {
      setFormStatus(FormStatus.Create)
    } else {
      setFormStatus(authorId === currentAccount ? FormStatus.Edit : FormStatus.View)
    }
  }, [currentAccount, mutation])

  useEffect(() => {
    let timer

    if (isCopied) {
      timer = setTimeout(() => setIsCopied(false), 3000)
    }

    return () => clearTimeout(timer)
  }, [isCopied])

  function handleEditComponentClick(widgetSrc: string) {
    const url = 'https://near.org/near/widget/ComponentDetailsPage?src=' + widgetSrc
    window.open(url, '_blank')
  }

  async function handleShareClick() {
    try {
      const { constructMutationLink } = await initBGFunctions(browser)
      const link = await constructMutationLink(mutation.id, window.location.href)
      window.navigator.clipboard.writeText(link)
      setIsCopied(true)
    } catch (error) {
      console.error(error)
    }
  }

  async function handleSaveClick() {
    try {
      const { updateMutation, createMutation, setMutation } = await initBGFunctions(browser)
      if (formStatus === FormStatus.Edit) {
        await updateMutation(mutation)
      } else if (formStatus === FormStatus.Create) {
        await createMutation(mutation)
      }
      await setMutation(mutation.id)
      setIsEdited(false)
    } catch (err) {
      setIsEdited(true)
      console.error(err)
    }
  }

  async function handleForkMutationClick() {
    if (!currentAccount) return
    setIsEdited(true)
    setMutation((mut) => {
      const [, mutationId] = mut.id.split('/')
      const id = currentAccount + '/' + mutationId + '-Fork'
      return { ...mut, id, isDraft: true }
    })
  }

  function handlePreviewClick() {
    EventBus.emit('bos_mutation_preview', mutation.overrides)
  }

  function hanldeInputChange(fromSrc: string, toSrc: string) {
    setMutation((mut) => ({ ...mut, overrides: { ...mut.overrides, [fromSrc]: toSrc } }))
    setIsEdited(true)
  }

  function handleIdInputChange(id: string) {
    setMutation((mut) => ({ ...mut, id }))
  }

  function handleDescriptionInputChange(description: string) {
    setMutation((mut) => ({ ...mut, description }))
    setIsEdited(true)
  }

  const outOfView = inViewComponents.filter((x) => !Object.keys(mutation.overrides).includes(x))
  const allOverrides = [...Object.keys(mutation.overrides), ...outOfView].sort()

  return (
    <div className={styles.blockSettings}>
      <div className={styles.scrollBlock}>
        <SettingWrapper className={styles.wrapperSettings} title="General">
          <SettingItem
            title="Current Mutation"
            component={
              currentAccount && formStatus !== FormStatus.Create ? (
                <button className={styles.forkButton} onClick={() => handleForkMutationClick()}>
                  Fork
                </button>
              ) : null
            }
          >
            <Input
              value={mutation.id}
              onChange={handleIdInputChange}
              disabled={formStatus !== FormStatus.Create}
            />
          </SettingItem>
          <SettingItem title="Description">
            <Input
              value={mutation.description}
              onChange={handleDescriptionInputChange}
              disabled={formStatus == FormStatus.View}
            />
          </SettingItem>
        </SettingWrapper>
        {allOverrides.length > 0 ? (
          <SettingWrapper className={styles.wrapperSettings} title="Overrides">
            {allOverrides.map((fromSrc, i) => (
              <SettingItem
                key={i}
                title={fromSrc}
                component={
                  <button
                    className={styles.forkButton}
                    onClick={() => handleEditComponentClick(fromSrc)}
                  >
                    Edit
                  </button>
                }
              >
                <Input
                  placeholder={'Enter widget source to override'}
                  value={mutation.overrides[fromSrc] ?? ''}
                  onChange={(toSrc) => hanldeInputChange(fromSrc, toSrc)}
                  disabled={formStatus == FormStatus.View}
                />
              </SettingItem>
            ))}
          </SettingWrapper>
        ) : null}
        <div className={styles.bottomContainer}>
          <button className={styles.btnPreview} disabled={isEdited} onClick={handleShareClick}>
            {isCopied ? 'Copied' : 'Copy Link'}
          </button>
          <button className={styles.btnPreview} disabled={!isEdited} onClick={handlePreviewClick}>
            Preview
          </button>
          <button className={styles.btnCreate} disabled={!isEdited} onClick={handleSaveClick}>
            Save
          </button>
        </div>
      </div>
    </div>
  )
}