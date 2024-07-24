declare global {
	namespace NodeJS {
		interface ProcessEnv {
			NODE_ENV: "development" | "production";
			AZURE_TENANT_ID: string;
			AZURE_CLIENT_ID: string;
			AZURE_CLIENT_SECRET: string;
			DEFAULT_STATUS: string | null;
			REFRESH_MINUTES: number | null;
			PROCESS_DELAY: number | null;
		}
	}
}
export {}