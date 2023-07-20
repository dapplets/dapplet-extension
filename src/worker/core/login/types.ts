export type LoginRequestSettings = {}

export type LoginHooks = {
  onLogin?: (ls: any) => void
  onLogout?: (ls: any) => void
  // onReject?: (ls: any) => void // ToDo: implement
  // onSwitch?: (ls: any) => void // ToDo: implement
}
