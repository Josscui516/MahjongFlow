import { describe, expect, it } from "vitest";
import { isLocalPreviewRequest, localNetworkHosts, localQrHosts, resolveCheckInOrigin } from "./check-in-origin";

describe("check-in origin", () => {
  const defaults = { canonicalOrigin: "http://localhost:3000", development: true,
    requestHost: "localhost:3000", hosts: ["192.168.1.8"] };

  it.each(["localhost:3000", "127.0.0.1:3100", "192.168.1.8:3000"])(
    "allows a local production preview at %s to generate a LAN QR", requestHost => {
      const input = { ...defaults, requestHost };
      const local = isLocalPreviewRequest(input);
      expect(local).toBe(true);
      expect(resolveCheckInOrigin({ ...input, development: local })).toBe(
        `http://192.168.1.8:${requestHost.endsWith(":3100") ? "3100" : "3000"}`,
      );
    },
  );

  it.each(["production.example.test", "192.168.9.99:3000", "user@localhost:3000", "localhost:3000/path", "localhost:3000?query", null])(
    "never treats a public, foreign or malformed request as local preview: %s", requestHost => {
      expect(isLocalPreviewRequest({ ...defaults, requestHost })).toBe(false);
    },
  );

  it("never enables local preview for a deployed domain even when its request Host is loopback", () => {
    for (const canonicalOrigin of ["https://production.example.test", "http://production.example.test"]) {
      expect(isLocalPreviewRequest({ ...defaults, canonicalOrigin })).toBe(false);
    }
  });

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

it("uses an explicitly configured public IPv4 host on campus Wi-Fi instead of Docker interfaces", () => {
  const hosts = localQrHosts("49.100.10.20", { eth0: [{ address:"172.20.0.9",family:"IPv4",internal:false }] }, true);
  expect(resolveCheckInOrigin({ canonicalOrigin:"http://localhost:3000", development:true, requestHost:"localhost:3000", hosts })).toBe("http://49.100.10.20:3000");
});
it("refuses to advertise a container address without an explicit host setting", () => {
  expect(() => localQrHosts(undefined,{ eth0:[{address:"172.20.0.9",family:"IPv4",internal:false}] },true)).toThrow("host LAN address");
});
it.each(["127.0.0.1","0.0.0.0","169.254.1.2","224.1.2.3","999.1.2.3","host.example"])("rejects unusable configured hosts: %s", host => {
  expect(() => localQrHosts(host,{},true)).toThrow("Invalid configured");
});
it("recognises public IPv4 addresses assigned to a physical adapter", () => {
  expect(localNetworkHosts({ WLAN:[{address:"49.100.10.20",family:"IPv4",internal:false}] })).toEqual(["49.100.10.20"]);
});
