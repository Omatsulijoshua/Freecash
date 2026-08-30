const blockedIps = new Set<string>();

export function isIpBlocked(ip: string): boolean {
  return blockedIps.has(ip);
}

export function blockIp(ip: string) {
  blockedIps.add(ip);
}

export function unblockIp(ip: string) {
  blockedIps.delete(ip);
}
