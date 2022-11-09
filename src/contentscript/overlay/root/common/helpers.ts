export const getValidationAddress = (value, reg) => {
  try {
    const valueReg = value.match(reg)

    return valueReg
  } catch {}
}
