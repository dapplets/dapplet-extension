import cn from 'classnames'
import { Form, Formik } from 'formik'
import React, { FC, useEffect, useState } from 'react'
import { Modal } from '../../components/Modal'
import Button from './Button'
import CreateTokenSchema from './CreateTokenSchema'
import Field from './Field/Field'
import IconField from './IconField/IconField'
import styles from './newToken.module.scss'
export interface NewTokenProps {

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

export const NewToken: FC<NewTokenProps> = (props) => {

  const [isPendingTx, setPendingTx] = useState(false)
  const [isModal, setModal] = useState(false)
  const { network, ecosystemTokens } = useEcosystem() //todo: mocked
  //   const { createToken, status: tokenCreatingTx } = useCreateToken()
  const [valuesProps, setValuesProps] = useState(DEFAULT_VALUES)
  const onClose = () => setModal(false)
  useEffect(
    () => {
      // if (tokenCreatingTx.status === 'Mining' || tokenCreatingTx.status === 'PendingSignature') {
      //   setPendingTx(true)
      // } else {
      //   setPendingTx(false)
      // }
    },
    [
      // tokenCreatingTx
    ]
  )
  const handleSubmit = async (values: CreateTokenForm) => {
    const { symbol, name, icon } = values
    const iconUrl = await saveBlobToIpfs(icon) // ToDo: move to hook?
    try {
      if (!icon) return
      setPendingTx(true)

      //   await createToken(symbol, name, iconUrl)
    } catch (_: any) {
      // TBD
    } finally {
      setPendingTx(false)
    }
  }
  return (
    <>
      <div className={cn(styles.wrapper)}>
        <div className={cn(styles.titleForm)}>Custom token creation</div>
        <div className={cn(styles.titleDependecies)}>
          <span className={cn(styles.dependecies)}>Dependencies:</span>
          <span className={cn(styles.ecosystem)}>{ecosystemTokens}</span>
        </div>
        <Formik
          initialValues={DEFAULT_VALUES}
          onSubmit={(values) => {
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
                    disabled={isPendingTx}
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
                    disabled={isPendingTx}
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
                  <IconField disabled={isPendingTx} label="Upload your icon" />
                </div>

                <div className={styles.controls}>
                  <Button
                    data-testid="create-token-create-button"
                    type="submit"
                    lg
                    primary
                    disabled={isDisabled || isPendingTx}
                  >
                    Create token
                  </Button>
                </div>
              </Form>
            )
          }}
        </Formik>
      </div>
      <div className={cn(styles.wrapper)}>
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
          Whant to learn more aboun bonding curves and custom tokens?
        </a>
      </div>
      <Modal
            classNameWrapper={styles.wraperModal}
            visible={isModal}
            title="Are you sure?"
            content={
              <div className={styles.finalWarning}>Final warning - you can't change it anymore</div>
            }
            footer={
              <div className={styles.footerContentModal}>
                <button
                  className={cn(styles.footerContentModalButton)}
                  onClick={() => {
                    onClose()
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
    </>
  )
}
//todo: empty function
function saveBlobToIpfs(icon: File | null) {
  // throw new Error('Function not implemented.');
  return ''
}
//todo: empty function
function useEcosystem(): { network: any; ecosystemTokens: any } {
  return { network: 'testnet', ecosystemTokens: 'ZOO' }
}
//todo: empty function
function useCreateToken(): {
  status: any
  createToken: (
    symbol: string,
    name: string,
    icon: string,
    curveTemplate?: string,
    tokenTemplate?: string,
    additionalCollaterals?: { addr: string; referenceUrl: string }[]
  ) => Promise<any | undefined>
  resetState: () => void
} {
  // throw new Error('Function not implemented.');
  return null
}
