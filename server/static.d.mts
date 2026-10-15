import type { IncomingMessage, ServerResponse } from "node:http";
export function makeStaticHandler(o: { dir: string; vapidPublicKey?: string }): (req: IncomingMessage, res: ServerResponse) => Promise<void>;
