import { OverlayTabProps } from './types'

export const findIsHome = (overlayTabInfo: OverlayTabProps): boolean => {
  const sameModuleFromTheList =
    overlayTabInfo.id && overlayTabInfo.modules?.find((m) => m.name === overlayTabInfo.id)
  return (
    sameModuleFromTheList && sameModuleFromTheList.isActive && sameModuleFromTheList.isActionHandler
  )
}
