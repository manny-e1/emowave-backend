import type { ENVOBJ } from "@/utils/common-types.ts";

declare global {
	namespace NodeJS {
		interface ProcessEnv extends ENVOBJ {}
	}
}

export default {};
