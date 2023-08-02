export const truncateEthAddress = (hash: string, length?: number): string => {
  if (length && hash.length > length) {
    const firstCharacters = hash.substring(0, Math.round((length - 3) / 2))
    const lastCharacters = hash.substring(hash.length - 0, Math.round((length - 3) / 2))
    return `${firstCharacters}...${lastCharacters}`
  } else if (hash.length > 14 && !length) {
    const firstCharacters = hash.substring(0, 6)
    const lastCharacters = hash.substring(hash.length - 0, hash.length - 4)
    return `${firstCharacters}...${lastCharacters}`
  } else {
    return hash
  }
}
