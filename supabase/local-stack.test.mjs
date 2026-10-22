import assert from "node:assert/strict";
import test from "node:test";
import { dotenvValue, makeService, frontendComposeArgs } from "./local-stack.mjs";

const fixture = () => ({
  Config: {
    Image: "example.invalid/postgres:17",
    Env: ["JWT_SECRET=fictional$secret", "EMPTY=", "SETTING=one=two"],
    Entrypoint: ["sh"], Cmd: ["-c", "echo '$VALUE'\nprintf 'fictional'"],
    Labels: { "com.supabase.cli.project": "MahjongFlow", "com.docker.compose.project": "MahjongFlow" },
    Healthcheck: { Test: ["CMD-SHELL", "pg_isready"], Interval: 1_000_000_000, Retries: 3 },
  },
  HostConfig: { PortBindings: { "5432/tcp": [{ HostIp: "127.0.0.1", HostPort: "45322" }] } },
  Mounts: [{ Type: "volume", Name: "supabase_db_MahjongFlow", Destination: "/var/lib/postgresql/data", RW: true }],
  NetworkSettings: { Networks: { supabase_network_MahjongFlow: { Aliases: ["db", "db.supabase.internal"] } } },
});

test("retains the existing database volume, internal aliases and port binding", () => {
  const service = makeService(fixture(), "db", {}, (value) => value);
  assert.deepEqual(service.volumes, [{ type: "volume", source: "existing_database", target: "/var/lib/postgresql/data", read_only: false }]);
  assert.deepEqual(service.networks.supabase.aliases, ["db", "db.supabase.internal"]);
  assert.equal(service.ports[0].published, "45322");
  assert.equal(service.ports[0].host_ip, "127.0.0.1");
  assert.equal(service.labels["com.docker.compose.project"], undefined);
  assert.equal(service.restart, "unless-stopped");
});

test("keeps credentials and shell commands out of the generated Compose file", () => {
  const variables = {};
  const service = makeService(fixture(), "db", variables, (value) => value);
  assert.ok(!JSON.stringify(service).includes("fictional"));
  const resolve = (reference) => variables[reference.slice(2, -1)];
  assert.equal(resolve(service.environment.JWT_SECRET), "fictional$secret");
  assert.equal(resolve(service.environment.EMPTY), "");
  assert.equal(resolve(service.environment.SETTING), "one=two");
  assert.deepEqual(service.command.map(resolve), fixture().Config.Cmd);
  assert.equal(service.healthcheck.interval, "1000000000ns");
});

test("refuses unrelated volumes or networks before changing containers", () => {
  const otherVolume = fixture();
  otherVolume.Mounts[0].Name = "another-project-data";
  assert.throws(() => makeService(otherVolume, "db", {}, (value) => value), /Unexpected named volume/);
  const otherNetwork = fixture();
  otherNetwork.NetworkSettings.Networks = {};
  assert.throws(() => makeService(otherNetwork, "db", {}, (value) => value), /Unexpected network/);
});

test("does not accumulate automatic Compose aliases across repeated starts", () => {
  const snapshot = fixture();
  snapshot.NetworkSettings.Networks.supabase_network_MahjongFlow.Aliases = [
    "supabase_db_MahjongFlow", "db", "db", "db.supabase.internal",
  ];
  const service = makeService(snapshot, "db", {}, (value) => value);
  assert.deepEqual(service.networks.supabase.aliases, ["db", "db.supabase.internal"]);
});

test("quotes dotenv values without expanding dollar signs or losing multiline commands", () => {
  assert.equal(dotenvValue("a'$b\nsecond line"), "'a\\'$b\nsecond line'");
});

test("development adds its overlay without changing the production stack files", () => {
  const production = frontendComposeArgs();
  const development = frontendComposeArgs("development");
  assert.deepEqual(frontendComposeArgs("production"), production);
  assert.deepEqual(development.slice(0, -2), production);
  assert.equal(development.at(-2), "-f");
  assert.ok(development.at(-1).endsWith("compose.dev.yaml"));
  assert.throws(() => frontendComposeArgs("invalid"), /Mode must be/);
});
