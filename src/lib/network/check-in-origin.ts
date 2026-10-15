type InterfaceAddress = Readonly<{ address: string; family: string | number; internal: boolean }>;
type Interfaces = Readonly<Record<string, readonly InterfaceAddress[] | undefined>>;

export function isPrivateIPv4(host: string): boolean {
  const octets = host.split(".").map(Number);
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host)
    && octets.every((octet) => octet >= 0 && octet <= 255)
    && (octets[0] === 10
      || (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31)
      || (octets[0] === 192 && octets[1] === 168));
}

export function localNetworkHosts(interfaces: Interfaces): string[] {
  return [...new Set(Object.entries(interfaces)
    .filter(([name]) => !/virtual|vethernet|wsl|docker|vmware|vbox|loopback|tailscale/i.test(name))
    .flatMap(([, addresses]) => (addresses ?? [])
      .filter(({ address, family, internal }) => !internal
        && (family === "IPv4" || family === 4) && isPrivateIPv4(address))
      .map(({ address }) => address)))];
}

export function resolveCheckInOrigin({ canonicalOrigin, development, requestHost, hosts }: Readonly<{
  canonicalOrigin: string;
  development: boolean;
  requestHost: string | null;
  hosts: readonly string[];
}>): string {
  const canonical = new URL(canonicalOrigin);
  // Deployment uses its trusted public configuration, never a client-supplied Host.
  if (!development || canonical.protocol === "https:") {
    if (canonical.protocol !== "https:") throw new Error("Deployed check-in requires a public HTTPS origin.");
    return canonical.origin;
  }

  let requested: URL | null = null;
  try {
    requested = requestHost ? new URL(`http://${requestHost}`) : null;
  } catch {
    // A malformed Host must not become a QR destination.
  }
  const requestIsLocal = requested && !requested.username && !requested.password
    && requested.pathname === "/" && !requested.search && !requested.hash
    && (["localhost", "127.0.0.1", "[::1]"].includes(requested.hostname)
      || hosts.includes(requested.hostname));
  const localRequest = requestIsLocal ? requested : null;
  const host = localRequest && hosts.includes(localRequest.hostname)
    ? localRequest.hostname : hosts[0];
  if (!host) throw new Error("No LAN interface is available for local check-in.");
  const port = localRequest ? localRequest.port : canonical.port;
  return `http://${host}${port ? `:${port}` : ""}`;
}
