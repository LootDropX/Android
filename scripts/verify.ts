const fs = require("node:fs") as typeof import("node:fs");
const path = require("node:path") as typeof import("node:path");
require("dotenv/config");

type SupportedNetwork = "fuji" | "avalanche";

interface Artifact {
  contractName: string;
  sourceName: string;
  inputSourceName?: string;
  buildInfoId: string;
}

interface BuildInfo {
  solcLongVersion: string;
  input: {
    language: string;
    settings: {
      evmVersion?: string;
      optimizer?: {
        enabled?: boolean;
        runs?: number;
      };
    };
    sources: Record<string, { content?: string }>;
  };
}

interface SnowtraceResponse {
  status: string;
  message: string;
  result: string;
}

interface CliOptions {
  address?: string;
  constructorArgs?: string;
  dryRun: boolean;
  help: boolean;
  network: SupportedNetwork;
  pollIntervalMs: number;
  timeoutMs: number;
}

const DEFAULT_ARTIFACT_PATH = path.join(
  "artifacts",
  "contracts",
  "LootDrop.sol",
  "LootDrop.json",
);

const EXPLORER_CONFIG: Record<
  SupportedNetwork,
  { apiUrl: string; browserUrl: string }
> = {
  fuji: {
    apiUrl: "https://api-testnet.snowtrace.io/api",
    browserUrl: "https://testnet.snowtrace.io",
  },
  avalanche: {
    apiUrl: "https://api.snowtrace.io/api",
    browserUrl: "https://snowtrace.io",
  },
};

const SPDX_TO_LICENSE_TYPE: Record<string, string> = {
  UNLICENSED: "1",
  MIT: "3",
  "GPL-2.0": "4",
  "GPL-3.0": "5",
  "LGPL-2.1": "6",
  "LGPL-3.0": "7",
  "BSD-2-Clause": "8",
  "BSD-3-Clause": "9",
  "MPL-2.0": "10",
  "OSL-3.0": "11",
  "Apache-2.0": "12",
  "AGPL-3.0": "13",
  "BUSL-1.1": "14",
};

function printUsage(): void {
  console.log(`Usage: npx hardhat run scripts/verify.ts --network fuji

Options:
  --address <0x...>             Override EXPO_PUBLIC_CONTRACT_ADDRESS
  --constructor-args <hex>      ABI-encoded constructor args (without 0x is fine)
  --network <fuji|avalanche>    Explorer to submit to
  --dry-run                     Print the verification payload without submitting
  --help                        Show this message
`);
}

function parseArgs(argv: string[]): CliOptions {
  const hardhatNetwork = process.env.HARDHAT_NETWORK;
  const defaultNetwork: SupportedNetwork =
    hardhatNetwork === "avalanche" ? "avalanche" : "fuji";

  const options: CliOptions = {
    dryRun: false,
    help: false,
    network: defaultNetwork,
    pollIntervalMs: 5_000,
    timeoutMs: 120_000,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (!arg.startsWith("--")) {
      continue;
    }

    switch (arg) {
      case "--address":
        options.address = argv[index + 1];
        index += 1;
        break;
      case "--constructor-args":
        options.constructorArgs = argv[index + 1];
        index += 1;
        break;
      case "--network": {
        const network = argv[index + 1];
        if (network === "fuji" || network === "avalanche") {
          options.network = network;
        } else {
          throw new Error(`Unsupported network: ${network}`);
        }
        index += 1;
        break;
      }
      case "--dry-run":
        options.dryRun = true;
        break;
      case "--help":
        options.help = true;
        break;
      default:
        break;
    }
  }

  return options;
}

function readJsonFile<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function getBuildInfo(artifact: Artifact): BuildInfo {
  const buildInfoPath = path.join(
    "artifacts",
    "build-info",
    `${artifact.buildInfoId}.json`,
  );

  return readJsonFile<BuildInfo>(buildInfoPath);
}

function resolveSourceKey(
  artifact: Artifact,
  buildInfo: BuildInfo,
): string {
  const candidates = [artifact.inputSourceName, artifact.sourceName].filter(
    (value): value is string => Boolean(value),
  );

  const sourceKeys = Object.keys(buildInfo.input.sources);
  const match = sourceKeys.find((sourceKey) =>
    candidates.some(
      (candidate) =>
        sourceKey === candidate || sourceKey.endsWith(`/${candidate}`),
    ),
  );

  if (match) {
    return match;
  }

  if (sourceKeys.length === 1) {
    return sourceKeys[0];
  }

  throw new Error("Could not resolve the compiled source path for verification.");
}

function detectLicenseType(sourceCode?: string): string {
  if (!sourceCode) {
    return "1";
  }

  const match = sourceCode.match(/SPDX-License-Identifier:\s*([^\s*]+)/);
  if (!match) {
    return "1";
  }

  return SPDX_TO_LICENSE_TYPE[match[1]] ?? "1";
}

function assertAddress(address: string): void {
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    throw new Error(`Invalid contract address: ${address}`);
  }
}

async function parseResponse(response: Response): Promise<SnowtraceResponse> {
  const raw = await response.text();

  try {
    return JSON.parse(raw) as SnowtraceResponse;
  } catch {
    throw new Error(
      `Snowtrace returned an unexpected response (${response.status}): ${raw}`,
    );
  }
}

async function submitVerification(
  apiUrl: string,
  params: URLSearchParams,
): Promise<SnowtraceResponse> {
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
    body: params.toString(),
  });

  return parseResponse(response);
}

async function checkVerificationStatus(
  apiUrl: string,
  guid: string,
  apiKey: string,
): Promise<SnowtraceResponse> {
  const statusUrl = new URL(apiUrl);
  statusUrl.search = new URLSearchParams({
    module: "contract",
    action: "checkverifystatus",
    guid,
    apikey: apiKey,
  }).toString();

  const response = await fetch(statusUrl);
  return parseResponse(response);
}

function isAlreadyVerified(result: string): boolean {
  const normalized = result.toLowerCase();
  return (
    normalized.includes("already verified") ||
    normalized.includes("source code already verified")
  );
}

function isPending(result: string): boolean {
  const normalized = result.toLowerCase();
  return (
    normalized.includes("pending in queue") ||
    normalized.includes("in queue") ||
    normalized.includes("processing")
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printUsage();
    return;
  }

  const apiKey = process.env.SNOWTRACE_API_KEY;
  if (!apiKey) {
    throw new Error("SNOWTRACE_API_KEY is missing from .env");
  }

  const address = options.address ?? process.env.EXPO_PUBLIC_CONTRACT_ADDRESS;
  if (!address) {
    throw new Error(
      "No contract address found. Pass --address or set EXPO_PUBLIC_CONTRACT_ADDRESS.",
    );
  }
  assertAddress(address);

  const artifact = readJsonFile<Artifact>(DEFAULT_ARTIFACT_PATH);
  const buildInfo = getBuildInfo(artifact);
  const sourceKey = resolveSourceKey(artifact, buildInfo);
  const sourceEntry = buildInfo.input.sources[sourceKey];
  const licenseType = detectLicenseType(sourceEntry?.content);
  const compilerVersion = `v${buildInfo.solcLongVersion}`;
  const optimizerEnabled = buildInfo.input.settings.optimizer?.enabled
    ? "1"
    : "0";
  const optimizerRuns = String(
    buildInfo.input.settings.optimizer?.runs ?? 200,
  );
  const evmVersion = buildInfo.input.settings.evmVersion ?? "default";
  const constructorArgs = options.constructorArgs?.replace(/^0x/, "") ?? "";
  const { apiUrl, browserUrl } = EXPLORER_CONFIG[options.network];

  const standardJsonInput = JSON.stringify({
    language: buildInfo.input.language,
    sources: buildInfo.input.sources,
    settings: buildInfo.input.settings,
  });

  const params = new URLSearchParams({
    apikey: apiKey,
    module: "contract",
    action: "verifysourcecode",
    contractaddress: address,
    sourceCode: standardJsonInput,
    codeformat: "solidity-standard-json-input",
    contractname: `${sourceKey}:${artifact.contractName}`,
    compilerversion: compilerVersion,
    optimizationUsed: optimizerEnabled,
    runs: optimizerRuns,
    licenseType,
    evmVersion,
    evmversion: evmVersion,
  });

  if (constructorArgs.length > 0) {
    params.set("constructorArguments", constructorArgs);
    params.set("constructorArguements", constructorArgs);
  }

  const codeUrl = `${browserUrl}/address/${address}#code`;
  console.log(`Preparing verification for ${artifact.contractName} at ${address}`);
  console.log(`Network: ${options.network}`);
  console.log(`Compiler: ${compilerVersion}`);
  console.log(`Source: ${sourceKey}:${artifact.contractName}`);

  if (options.dryRun) {
    console.log(
      JSON.stringify(
        {
          apiUrl,
          address,
          contractName: `${sourceKey}:${artifact.contractName}`,
          compilerVersion,
          optimizationUsed: optimizerEnabled,
          runs: optimizerRuns,
          evmVersion,
          licenseType,
          constructorArguments: constructorArgs || null,
          browserUrl: codeUrl,
        },
        null,
        2,
      ),
    );
    return;
  }

  const submission = await submitVerification(apiUrl, params);
  if (submission.status !== "1") {
    if (isAlreadyVerified(submission.result)) {
      console.log(`Contract is already verified: ${codeUrl}`);
      return;
    }

    throw new Error(
      `Snowtrace rejected the verification request: ${submission.result}`,
    );
  }

  const guid = submission.result.trim();
  const deadline = Date.now() + options.timeoutMs;
  console.log(`Verification submitted. GUID: ${guid}`);

  while (Date.now() < deadline) {
    await sleep(options.pollIntervalMs);
    const status = await checkVerificationStatus(apiUrl, guid, apiKey);
    console.log(`Snowtrace status: ${status.result}`);

    if (status.status === "1" || isAlreadyVerified(status.result)) {
      console.log(`Verification complete: ${codeUrl}`);
      return;
    }

    if (isPending(status.result)) {
      continue;
    }

    throw new Error(`Verification failed: ${status.result}`);
  }

  throw new Error(
    `Timed out waiting for Snowtrace to finish verification. Check ${codeUrl}`,
  );
}

main().catch((error: unknown) => {
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(error);
  }

  process.exit(1);
});
