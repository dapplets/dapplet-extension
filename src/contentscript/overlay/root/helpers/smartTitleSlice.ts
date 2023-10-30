/**
 * Returns a string, shortened to 50 or n letters by reducing the title/name, not the address!
 *
 * Examples:
 *
 * "Chalice Gianna (98793cd91a3f8706cfc4ed)"
 * "Chalice Gianna (98793cd91a3f870fb126f6cfc4jhamsed)"
 * "Chalice Gi… (98793cd91a3f870fb126sklf6cfc4jhamsed)"
 * "Cha… (98793cd91a3f870fb126f66285808c7e094afcfc4ed)"
 * "98793cd91a3f870fb126f66285808c7e094afcfc4ed876"
 * "98793cd91a3f870fb126f66285808c7e094afcfc4e72bkdfw6kjd68qd876"
 */
const smartTitleSlice = (title: string, address: string, n = 50): string => {
  if (address.length >= n - 5) {
    return address
  } else if ((title + ' (' + address + ')').length > n) {
    const l = (title + ' (' + address + ')').length - n
    return title.slice(0, -(l + 1)) + '… (' + address + ')'
  } else {
    return title + ' (' + address + ')'
  }
}

export default smartTitleSlice
