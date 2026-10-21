/** Load .env / .env.local the same way Next.js does, for scripts run with tsx. */
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());
