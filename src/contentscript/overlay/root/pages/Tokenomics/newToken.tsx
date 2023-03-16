import { initBGFunctions } from 'chrome-extension-message-wrapper'
import cn from 'classnames'
import { Form, Formik } from 'formik'
import React, { FC, useEffect, useState } from 'react'
import { browser } from 'webextension-polyfill-ts'
import { Modal } from '../../components/Modal'
import saveBlobToIpfs from '../../utils/saveBlobToIpfs'
import { DappletsDetails, UnderConstructionDetails } from '../Settings'
import Button from './Button'
import CreateTokenSchema from './CreateTokenSchema'
import Field from './Field/Field'
import IconField from './IconField/IconField'
import styles from './newToken.module.scss'
export interface NewTokenProps {
  setNewToken?: (x) => void
  module?: any
  setActiveTab?: any
}

interface CreateTokenForm {
  name: string
  symbol: string
  icon: File | null
  decimals: string
}

export const DEFAULT_VALUES: CreateTokenForm = {
  name: '',
  symbol: '',
  icon: null,
  decimals: '16',
}
type Message = {
  type: 'negative' | 'positive'
  header: string
  message: string[]
}
export const NewToken: FC<NewTokenProps> = (props) => {
  const { setNewToken, module, setActiveTab } = props

  const [isModal, setModal] = useState(false)
  const { network, ecosystemTokens } = useEcosystem() //todo: mocked
  //   const { createToken, status: tokenCreatingTx } = useCreateToken()
  const [valuesProps, setValuesProps] = useState(DEFAULT_VALUES)
  const [isModalTransaction, setModalTransaction] = useState(false)
  const [isModalEndCreation, setModalEndCreation] = useState(false)
  const [message, setMessage] = useState<Message>(null)
  const [isModalError, setModalError] = useState(false)
  const [isLoading, setLoading] = useState(false)
  const onClose = () => setModal(false)
  const onCloseError = () => {
    setModalError(false)
    setMessage(null)
  }

  useEffect(() => {
    const init = async () => {
      await _updateData()
    }
    init()

    return () => {}
  }, [])
  const _updateData = async () => {
    const { getTokensByApp } = await initBGFunctions(browser)
    const tokens = await getTokensByApp(module.name)
  }
  const handleSubmit = async (values: CreateTokenForm) => {
    const { symbol, name, icon } = values
    const iconUrl = await saveBlobToIpfs(icon) // ToDo: move to hook?
    try {
      setModalTransaction(true)
      const { createAppToken } = await initBGFunctions(browser)
      if (!icon) return

      await createAppToken(module.name, symbol, name, iconUrl, [])
      setModalTransaction(false)
      setModalEndCreation(true)
    } catch (e) {
      setMessage({
        type: 'negative',
        header: 'Transaction error',
        message: [e.message],
      })
      setModalError(true)
    } finally {
      setModalTransaction(false)
    }
  }
  const _updatePage = async () => {
    setModalEndCreation(false)

    setActiveTab(
      module.isUnderConstruction ? UnderConstructionDetails.INFO : DappletsDetails.MAININFO
    )
  }

  return (
    <>
      {' '}
      <div className={cn(styles.wrapper)}>
        <div className={cn(styles.titleForm)}>Custom token creation</div>
        <div className={cn(styles.titleDependecies)}>
          <span className={cn(styles.dependecies)}>Dependencies:</span>
          <span className={cn(styles.ecosystem)}>{ecosystemTokens}</span>
        </div>
        <Formik
          initialValues={DEFAULT_VALUES}
          onSubmit={(values) => {
            setValuesProps(values)
            setModal(true)
          }}
          validationSchema={CreateTokenSchema}
        >
          {({ errors, touched, values }) => {
            const areErrors = Object.values(errors).length > 0
            const isTouched = Object.values(touched).length > 0
            const isDisabled = !isTouched || areErrors

            return (
              <Form className={styles.form}>
                <div className={styles.fieldGroup}>
                  <Field
                    data-testid="create-token-name-field"
                    label="Token Name"
                    name="name"
                    maxLength={16}
                    invalid={Boolean(errors.name) && touched.name}
                    value={values.name
                      // .replace(/[^a-z0-9\s]/gi, "")
                      .replace(/\s+/gi, ' ')
                      .trimStart()}
                  />

                  {errors.name && touched.name && (
                    <div className={styles.errorMessage}>{errors.name}</div>
                  )}
                </div>
                <div className={styles.fieldGroup}>
                  <Field
                    data-testid="create-token-symbol-field"
                    label="Token ID"
                    name="symbol"
                    minLength={3}
                    maxLength={4}
                    invalid={Boolean(errors.symbol) && touched.symbol}
                    value={values.symbol.trim()}
                  />
                  {errors.symbol && touched.symbol && (
                    <div
                      data-testid="create-token-symbol-field-error-message"
                      className={styles.errorMessage}
                    >
                      {errors.symbol}
                    </div>
                  )}
                </div>
                <div className={styles.fieldGroup}>
                  <Field value={values.decimals} label="Decimals" name="decimals" disabled />
                </div>

                <div className={cn(styles.fieldGroup, styles.iconGroup)}>
                  <IconField label="Upload your icon" />
                </div>

                <div className={styles.controls}>
                  <Button
                    data-testid="create-token-create-button"
                    type="submit"
                    lg
                    primary
                    disabled={isDisabled}
                  >
                    Create token
                  </Button>
                </div>
              </Form>
            )
          }}
        </Formik>
      </div>
      <div className={cn(styles.wrapper, styles.lastWrapper)}>
        <div className={cn(styles.titleForm)}>Your own token creation</div>
        <div className={cn(styles.formDescription, styles.descriptionBlock)}>
          You can create your token that will be using a bounding curve with TEST as a collateral
          for it. After creation process you will be routed to corresponding exchange page.
        </div>
        <div className={styles.formDelimeter}></div>
        <div className={styles.descriptionField}>
          To proceed please fill in the following fields:
        </div>
        <div className={styles.fieldsBlocks}>
          <div className={styles.fieldValue}>
            <span className={styles.fieldName}>Token Name:</span>
            <span className={styles.formDescription}> Give your token a name</span>
          </div>
          <div className={styles.fieldValue}>
            <span className={styles.fieldName}>Token ID (Ticker):</span>
            <span className={styles.formDescription}>Unique identifier for your token</span>
          </div>
          <div className={styles.fieldValue}>
            <span className={styles.fieldName}>Icon:</span>
            <span className={styles.formDescription}>
              Please Upload token icon - png or svg file, 128x128 px
            </span>
          </div>
        </div>
        <a
          className={styles.link}
          href="https://docs.dapplets.org/docs/whitepapers/connected-bonding-curves"
          target="_blank"
        >
          Want to learn more aboun bonding curves and custom tokens?
        </a>
      </div>
      <Modal
        classNameWrapper={styles.wraperModal}
        visible={isModal}
        title="Transaction Confirmation"
        content={
          <div className={styles.finalWarning}>
            You are creating {valuesProps.name} {valuesProps.symbol.toUpperCase()} in GOERLI 
            network.
            <br /> It will use a bonding curve with ZOO token as the collateral. This token will be
            associated to your project {module.name}.<br />
            You won't be able to change this connection late
          </div>
        }
        footer={
          <div className={styles.footerContentModal}>
            <button
              className={cn(styles.footerContentModalButton)}
              onClick={() => {
                handleSubmit(valuesProps)
              }}
            >
              Accept
            </button>
            {/* todo: correct src */}
            <a
              href="https://docs.dapplets.org/docs/whitepapers/auge-token-usage"
              target="_blank"
              className={styles.footerContentModalLink}
            >
              F.A.Q.
            </a>
          </div>
        }
        onClose={onClose}
      />
      <Modal
        visible={isModalTransaction}
        title={'Transaction started'}
        content={''}
        footer={''}
        onClose={() => !isModalTransaction}
      />
      <Modal
        visible={isModalEndCreation}
        title={'Transaction finished'}
        content={''}
        footer={''}
        onClose={() => _updatePage()}
      />
      {message ? (
        <Modal
          visible={isModalError}
          title={message.header}
          content={
            <div className={styles.modalDefaultContent}>
              {message.message.map((m, i) => (
                <p key={i} style={{ overflowWrap: 'break-word' }}>
                  {m === `Cannot read properties of null (reading 'length')`
                    ? 'Please fill in the empty fields'
                    : m}
                </p>
              ))}
            </div>
          }
          footer={''}
          onClose={() => onCloseError()}
        />
      ) : null}
      <div className={styles.linkNavigation}>
        <button onClick={() => setNewToken(false)} className={styles.back}>
          Back
        </button>
      </div>
    </>
  )
}

//todo: empty function
function useEcosystem(): { network: any; ecosystemTokens: any } {
  return { network: 'testnet', ecosystemTokens: 'ZOO' }
}
