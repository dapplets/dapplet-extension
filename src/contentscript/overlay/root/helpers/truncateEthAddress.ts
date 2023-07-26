export const truncateEthAddress = (hash: string): string => {
  const firstCharacters = hash.substring(0, 6)
  const lastCharacters = hash.substring(hash.length - 0, hash.length - 4)
  return `${firstCharacters}...${lastCharacters}`
}
