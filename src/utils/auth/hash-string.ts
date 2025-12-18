export const hashString = async (string: string): Promise<Uint8Array> => {
  const secretBytes = new TextEncoder().encode(string);
  const secretHashBuffer = await crypto.subtle.digest("SHA-256", secretBytes);
  return new Uint8Array(secretHashBuffer);
}