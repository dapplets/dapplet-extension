import cn from 'classnames'
import React, { FC } from 'react'
import styles from './InputGroup.module.scss'
import { ReactComponent as Plus } from '../../assets/svg/plus.svg'
import { ReactComponent as Delete } from '../../assets/svg/garbage.svg'
export interface InputGroupProps {
  newArray: any
  _deleteItem: any
  _addItem: any
  nodeInput: any
  nodeBtn: any
  isDisabledAdd: any
  addDisabled: any
  editLoading: any
  editInput: any
  setEditInput: any
  visibleArray: any
  setVisibleArray: any
  title: any
  setEditLoading: any
  parameters: any
  setAddDisabled: any
  containsValue: any
  setDisabledAdd: any
  targetRegistry: any
  mi: any
  getParameters
}
export const InputGroup: FC<InputGroupProps> = (props: InputGroupProps) => {
  const {
    newArray,
    _deleteItem,
    _addItem,
    nodeInput,
    nodeBtn,
    isDisabledAdd,
    addDisabled,
    editLoading,
    visibleArray,
    setVisibleArray,
    editInput,
    setEditInput,
    title,
    setEditLoading,
    parameters,
    setAddDisabled,
    containsValue,
    setDisabledAdd,
    targetRegistry,
    mi,
    getParameters,
  } = props

  return (
    <div className={styles.wrapperAdmins}>
      <div className={cn(styles.blockAdmins)}>
        <h3 className={styles.adminsTitle}>{title}</h3>
        <button
          onClick={(e) => {
            setVisibleArray(!visibleArray)
          }}
          className={cn(styles.adminsButton, {})}
        ><Plus/></button>
      </div>
      {visibleArray && (
        <div className={styles.wrapperContext}>
          <div
            className={cn(styles.blockContext, {
              [styles.inputAdminInvalid]: isDisabledAdd,
            })}
          >
            <input
              ref={nodeInput}
              className={cn(styles.blockContextTitle, {})}
              value={editInput}
              onChange={(e) => {
                setEditInput(e.target.value)
              }}
            />

            <button
              ref={nodeBtn}
              onClick={() => {
                setEditInput('')
              }}
              className={cn(styles.contextDelete)}
            ><Delete/></button>
          </div>
          <button
            disabled={editInput.length < 2 || addDisabled}
            onClick={() => {
              nodeBtn.current?.classList.add('valid')
              _addItem(
                editInput,
                setEditLoading,
                setAddDisabled,
                containsValue,
                newArray,
                setDisabledAdd,
                targetRegistry,
                mi,
                setVisibleArray,
                nodeBtn,
                setEditInput,
                parameters
              )
            }}
            className={cn(styles.addContext, {
              [styles.addContextDisabled]: nodeInput.current?.value.length < 2 || addDisabled,
            })}
          >
            ADD
          </button>
        </div>
      )}
      {editLoading ? (
        <div className={styles.editContextIdLoading}></div>
      ) : (
        <>
          {newArray &&
            newArray.map((x, i) => (
              <div key={i} className={styles.blockAuthors}>
                <input
                  className={cn(styles.blockContext, styles.blockContextValue, styles.adminsInput)}
                  placeholder={x}
                  value={x}
                  readOnly
                />
                <button
                  onClick={() =>
                    _deleteItem(
                      x,
                      setEditLoading,
                      setAddDisabled,
                      targetRegistry,
                      mi,
                      setVisibleArray,
                      nodeBtn,
                      setEditInput,
                      parameters,
                      getParameters
                    )
                  }
                  className={styles.authorDelete}
                ><Delete/></button>
              </div>
            ))}
        </>
      )}
    </div>
  )
}
