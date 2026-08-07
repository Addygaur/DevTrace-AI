import type { NextConfig } from "next";
import path from "node:path";
import { config as loadEnv } from "dotenv";

loadEnv({ path: path.resolve(__dirname, "../../.env.local"), override: true });
loadEnv({ path: path.resolve(__dirname, "../../.env"), override: true });

const nextConfig: NextConfig = {
  transpilePackages: ["@devtrace/agent", "@devtrace/db"],
  serverExternalPackages: ["pg", "@aws-sdk/client-bedrock-runtime"],
  env: {
    SHOPFLOW_ROOT: path.resolve(__dirname, "../../demo/shopflow"),
  },
};

export default nextConfig;
