import React, { FC } from 'react'
import { StorageRef } from '../../../../../common/types'
import { useStorageRef } from '../../utils/useStorageRef'

interface PropsStorageRefImage
  extends React.DetailedHTMLProps<React.ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement> {
  storageRef: StorageRef | string
  noImgSrc: string
}

// ToDo: the following component repeats the same logic as in StorageRefImage. Need to unify them

export const StorageRefImg: FC<PropsStorageRefImage> = (props) => {
  const { storageRef, noImgSrc, ...anotherProps } = props

  const { data: dataUri } = useStorageRef(storageRef)

  return dataUri ? (
    <img src={dataUri} {...anotherProps} />
  ) : (
    <img src={noImgSrc} {...anotherProps} />
  )
}
