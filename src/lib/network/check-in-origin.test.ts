import { describe, expect, it } from "vitest";
import { localNetworkHosts, resolveCheckInOrigin } from "./check-in-origin";

describe("check-in origin", () => {
  const defaults = { canonicalOrigin: "http://localhost:3000", development: true,
    requestHost: "localhost:3000", hosts: ["192.168.1.8"] };

  it("detects physical private interfaces and excludes loopback and virtual adapters", () => {
    expect(localNetworkHosts({
      Ethernet: [{ address: "192.168.1.8", family: "IPv4", internal: false }],
      "vEthernet (WSL)": [{ address: "172.18.48.1", family: "IPv4", internal: false }],
      Loopback: [{ address: "127.0.0.1", family: "IPv4", internal: true }],
    })).toEqual(["192.168.1.8"]);
  });

  it("uses the current LAN address and active server port instead of a stale configured IP", () => {
    expect(resolveCheckInOrigin({ ...defaults, canonicalOrigin: "http://192.168.50.228:3000",
      hosts: ["10.0.0.23"], requestHost: "localhost:3100" })).toBe("http://10.0.0.23:3100");
  });

  it("keeps the actual local interface used to open the page on multihomed hosts", () => {
    expect(resolveCheckInOrigin({ ...defaults, hosts: ["192.168.1.8", "10.0.0.23"],
      requestHost: "10.0.0.23:3000" })).toBe("http://10.0.0.23:3000");
  });

  it.each(["attacker.example:9999", "192.168.9.99:9999", "user@192.168.1.8:9999", "bad/host"])(
    "does not trust a foreign or malformed request Host: %s", (requestHost) => {
      expect(resolveCheckInOrigin({ ...defaults, requestHost })).toBe("http://192.168.1.8:3000");
    },
  );

  it("uses each deployment's configured HTTPS domain independently of the server IP or Host", () => {
    for (const canonicalOrigin of ["https://production.example.test", "https://preview.example.test"]) {
      expect(resolveCheckInOrigin({ ...defaults, development: false, canonicalOrigin,
        requestHost: "attacker.example" })).toBe(canonicalOrigin);
    }
  });

  it("fails explicitly instead of generating an unusable localhost QR when no LAN exists", () => {
    expect(() => resolveCheckInOrigin({ ...defaults, hosts: [] })).toThrow("No LAN interface");
  });

  it("rejects a local HTTP origin in a deployed environment", () => {
    expect(() => resolveCheckInOrigin({ ...defaults, development: false })).toThrow("public HTTPS");
  });
});
