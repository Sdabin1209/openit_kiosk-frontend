import type { IncomingMessage, ServerResponse } from "node:http";
export function makeStaticHandler(o: { dir: string; configFile?: string | null }): (req: IncomingMessage, res: ServerResponse) => Promise<void>;
