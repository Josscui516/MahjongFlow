import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runtimePath = path.join(root, "supabase/.temp/compose.runtime.json");
const envPath = path.join(root, "compose.local.env");
const services = ["db", "inbucket", "auth", "rest", "kong", "pg_meta", "studio"];
const retired = ["realtime", "storage", "edge_runtime", "analytics"];
const containerName = (service) => `supabase_${service}_MahjongFlow`;
export function frontendComposeArgs(mode = "production") {
  if (!["development", "production"].includes(mode)) throw new Error("Mode must be development or production.");
  return ["compose", "--project-name", "mahjongflow", "--env-file", envPath,
    "-f", path.join(root, "compose.yaml"), "-f", runtimePath,
    ...(mode === "development" ? ["-f", path.join(root, "compose.dev.yaml")] : [])];
}

function docker(args, { input, allowFailure = false } = {}) {
  const result = spawnSync("docker", args, { cwd: root, encoding: "utf8", input,
    maxBuffer: 16 * 1024 * 1024, windowsHide: true });
  if (result.error || result.status !== 0) {
    if (allowFailure) return null;
    // Inspect/config output can contain credentials. Never echo it on failure.
    throw new Error(`Docker ${args[0]} failed; private command output was suppressed.`);
  }
  return result.stdout;
}

function inspect(name) {
  const value = docker(["container", "inspect", name], { allowFailure: true });
  return value ? JSON.parse(value)[0] : null;
}

// Compose single-quoted dotenv values preserve dollar signs and multiline commands.
export function dotenvValue(value) {
  return `'${String(value).replaceAll("'", "\\'")}'`;
}

export function makeService(snapshot, service, variables, bindSource) {
  let index = 0;
  const variable = (value) => {
    const key = `LOCAL_STACK_${service.toUpperCase()}_${index++}`;
    variables[key] = value;
    return `\${${key}}`;
  };
  const config = snapshot.Config;
  const network = snapshot.NetworkSettings.Networks.supabase_network_MahjongFlow;
  if (!network) throw new Error(`Unexpected network for ${service}.`);
  const result = {
    image: config.Image,
    container_name: containerName(service),
    restart: "unless-stopped",
    environment: Object.fromEntries((config.Env ?? []).map((entry) => {
      const separator = entry.indexOf("=");
      return [entry.slice(0, separator), variable(entry.slice(separator + 1))];
    })),
    networks: { supabase: { aliases: [...new Set((network.Aliases ?? [])
      .filter((alias) => alias !== containerName(service)))] } },
    labels: Object.fromEntries(Object.entries(config.Labels ?? {})
      .filter(([key]) => key.startsWith("com.supabase.cli."))),
  };
  for (const [field, source] of [["entrypoint", "Entrypoint"], ["command", "Cmd"]]) {
    if (config[source]) result[field] = config[source].map(variable);
  }
  if (config.User) result.user = config.User;
  if (config.WorkingDir) result.working_dir = config.WorkingDir;
  if (snapshot.HostConfig.ShmSize) result.shm_size = snapshot.HostConfig.ShmSize;
  result.volumes = snapshot.Mounts.map((mount) => {
    if (mount.Type === "volume") {
      if (mount.Name !== "supabase_db_MahjongFlow") throw new Error("Unexpected named volume.");
      return { type: "volume", source: "existing_database", target: mount.Destination,
        read_only: !mount.RW };
    }
    if (mount.Type !== "bind") throw new Error("Unexpected mount type.");
    return { type: "bind", source: bindSource(mount.Source), target: mount.Destination,
      read_only: !mount.RW, bind: { create_host_path: false } };
  });
  result.ports = Object.entries(snapshot.HostConfig.PortBindings ?? {}).flatMap(([port, bindings]) =>
    (bindings ?? []).map((binding) => ({ target: Number(port.split("/")[0]),
      published: binding.HostPort, protocol: port.split("/")[1],
      ...(binding.HostIp ? { host_ip: binding.HostIp } : {}) })));
  if (config.Healthcheck) {
    const health = config.Healthcheck;
    result.healthcheck = { test: health.Test.map(variable) };
    for (const [field, source] of [["interval", "Interval"], ["timeout", "Timeout"],
      ["start_period", "StartPeriod"], ["start_interval", "StartInterval"]]) {
      if (health[source]) result.healthcheck[field] = `${health[source]}ns`;
    }
    if (health.Retries) result.healthcheck.retries = health.Retries;
  }
  return result;
}

function bindSource(source) {
  // Docker Desktop reports some Windows mounts using its Linux VM path.
  const windowsPath = source.replace(/^\/run\/desktop\/mnt\/host\/([a-z])\//i, "$1:/");
  const absolute = path.resolve(windowsPath);
  const relative = path.relative(root, absolute);
  if (relative.startsWith("..") || path.isAbsolute(relative) || !existsSync(absolute)) {
    throw new Error("Required local Supabase bind mount is missing or outside this workspace.");
  }
  return absolute;
}

function start(build, checkOnly = false, mode = "production") {
  const composeArgs = frontendComposeArgs(mode);
  const snapshots = services.map((service) => {
    const snapshot = inspect(containerName(service));
    if (!snapshot) throw new Error(`Existing ${service} container missing; refusing to create a new database.`);
    return snapshot;
  });
  const variables = {};
  const overlay = { services: {}, volumes: {
    existing_database: { external: true, name: "supabase_db_MahjongFlow" },
  } };
  services.forEach((service, index) => {
    overlay.services[service] = makeService(snapshots[index], service, variables, bindSource);
  });
  const healthyDb = { db: { condition: "service_healthy" } };
  overlay.services.auth.depends_on = { ...healthyDb, inbucket: { condition: "service_started" } };
  overlay.services.rest.depends_on = healthyDb;
  overlay.services.pg_meta.depends_on = healthyDb;
  overlay.services.kong.depends_on = { auth: { condition: "service_healthy" }, rest: { condition: "service_started" } };
  overlay.services.studio.depends_on = { pg_meta: { condition: "service_healthy" }, kong: { condition: "service_healthy" } };
  overlay.services.studio.environment.NEXT_PUBLIC_ENABLE_LOGS = "false";
  overlay.services.frontend = { depends_on: { kong: { condition: "service_healthy" } } };

  const baseEnv = readFileSync(envPath, "utf8").split(/\r?\n/)
    .filter((line) => /^(NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY|SUPABASE_SECRET_KEY|LOCAL_DOCKER_HOST_IP)=/.test(line));
  writeFileSync(envPath, `${baseEnv.join("\n")}\n${Object.entries(variables)
    .map(([key, value]) => `${key}=${dotenvValue(value)}`).join("\n")}\n`);
  writeFileSync(runtimePath, `${JSON.stringify(overlay, null, 2)}\n`);

  // Validate interpolation privately BEFORE stopping/removing any running container.
  const resolved = JSON.parse(docker([...composeArgs, "config", "--format", "json"]));
  services.forEach((service, index) => {
    const expected = makeService(snapshots[index], service, {}, (source) => source);
    const actual = resolved.services[service];
    const originalEnv = Object.fromEntries(snapshots[index].Config.Env.map((entry) => {
      const separator = entry.indexOf("=");
      return [entry.slice(0, separator), entry.slice(separator + 1)];
    }));
    if (service === "studio") originalEnv.NEXT_PUBLIC_ENABLE_LOGS = "false";
    if (Object.entries(originalEnv).some(([key, value]) => actual.environment[key] !== value)
      || ["command", "entrypoint"].some((field) => expected[field]
        && JSON.stringify(actual[field].map((value) => value.replaceAll("$$", "$")))
          !== JSON.stringify(snapshots[index].Config[field === "command" ? "Cmd" : "Entrypoint"]))) {
      throw new Error(`Compose round-trip validation failed for ${service}; containers were not changed.`);
    }
  });
  if (checkOnly) {
    console.log("Compose validation passed for all 7 existing Supabase services; no containers changed.");
    return;
  }
  if (build) {
    console.log("Building the frontend image before changing containers...");
    docker([...composeArgs, "build", "frontend"]);
  }
  const legacy = snapshots.filter((snapshot) => snapshot.Config.Labels?.["com.docker.compose.project"] !== "mahjongflow");
  if (legacy.length) {
    console.log("Moving existing Supabase containers into the unified Compose project; retaining the database volume...");
    const names = legacy.map((snapshot) => snapshot.Name.slice(1));
    docker(["stop", "--time", "30", ...names]);
    docker(["rm", ...names]);
  }
  console.log("Starting the unified stack and waiting for health checks...");
  docker([...composeArgs, "up", "-d", "--wait", "--wait-timeout", "180"]);
  const oldNames = retired.map(containerName).filter((name) => inspect(name));
  if (oldNames.length) {
    docker(["stop", "--time", "30", ...oldNames]);
    docker(["rm", ...oldNames]);
  }
  console.log(`MahjongFlow: ${mode} mode, one Compose project, 8 containers. Database and other existing volumes retained.`);
}

function stop() {
  const names = [...services.map(containerName), "mahjongflow-frontend"].filter((name) => inspect(name));
  if (names.length) docker(["stop", "--time", "30", ...names]);
  console.log("MahjongFlow stopped. Containers and database volumes retained.");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv[2] === "start") {
      const modeIndex = process.argv.indexOf("--mode");
      const mode = modeIndex < 0 ? "production" : process.argv[modeIndex + 1];
      if (!mode) throw new Error("--mode requires development or production.");
      start(process.argv.includes("--build"), process.argv.includes("--check"), mode);
    }
    else if (process.argv[2] === "stop") stop();
    else throw new Error("Usage: node supabase/local-stack.mjs start [--build] [--check] [--mode development|production] | stop");
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
