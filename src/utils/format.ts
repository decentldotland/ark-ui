/**
 * Beautify addresses
 *
 * @param address Address to beautify
 *
 * @returns Formatted address
 */
 export function formatAddress(address: string, length = 26) {
  if (!address) return "";

  return (
    address.substring(0, length / 2) +
    "..." +
    address.substring(address.length - length / 2, address.length)
  );
}
