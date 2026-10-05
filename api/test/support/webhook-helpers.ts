import { createHmac } from 'node:crypto';
import { createServer, IncomingHttpHeaders, Server } from 'node:http';
import { AddressInfo } from 'node:net';

/** One HTTP request the receiver saw, with its JSON body parsed. */
export interface ReceivedWebhook {
	path: string;
	headers: IncomingHttpHeaders;
	body: any;
}

export interface WebhookReceiver {
	/** Absolute URL for `path` on this receiver, e.g. `url('/signups')`. */
	url(path?: string): string;
	/** Everything received so far, in arrival order. */
	received: ReceivedWebhook[];
	/** Requests received on `path`. */
	on(path: string): ReceivedWebhook[];
	/**
	 * Status to answer the next requests on `path` with; each entry is used
	 * once, then the receiver falls back to 200.
	 */
	respondWith(path: string, ...statuses: number[]): void;
	/** Forgets received requests and scripted responses. */
	reset(): void;
	close(): Promise<void>;
}

/**
 * A local endpoint for the BullMQ consumer to deliver to. Listens on an
 * ephemeral port on loopback so parallel runs never collide.
 */
export async function startWebhookReceiver(): Promise<WebhookReceiver> {
	const received: ReceivedWebhook[] = [];
	const scripted = new Map<string, number[]>();

	const server: Server = createServer((req, res) => {
		const chunks: Buffer[] = [];
		req.on('data', (chunk: Buffer) => chunks.push(chunk));
		req.on('end', () => {
			const raw = Buffer.concat(chunks).toString('utf8');
			const path = req.url ?? '/';
			received.push({
				path,
				headers: req.headers,
				body: raw ? JSON.parse(raw) : undefined,
			});

			const status = scripted.get(path)?.shift() ?? 200;
			res.writeHead(status, { 'content-type': 'application/json' });
			res.end('{}');
		});
	});

	await new Promise<void>((resolve) => {
		server.listen(0, '127.0.0.1', resolve);
	});
	const { port } = server.address() as AddressInfo;

	return {
		url: (path = '/') => `http://127.0.0.1:${port}${path}`,
		received,
		on: (path) => received.filter((r) => r.path === path),
		respondWith: (path, ...statuses) => {
			scripted.set(path, statuses);
		},
		reset: () => {
			received.length = 0;
			scripted.clear();
		},
		close: () =>
			new Promise<void>((resolve, reject) => {
				server.closeAllConnections();
				server.close((error) => (error ? reject(error) : resolve()));
			}),
	};
}

/**
 * The signature a receiver should compute to verify a delivery: HMAC-SHA256
 * (hex) of the JSON-serialized `data` member of the event, keyed with the
 * webhook secret. Mirrors src/utils/generateSignature.util.ts, written out
 * independently so the test does not just call the code under test.
 */
export function expectedSignature(data: unknown, secret: string): string {
	return createHmac('sha256', secret)
		.update(JSON.stringify(data))
		.digest('hex');
}

/** Resolves after `ms`; used to give stray deliveries a chance to arrive. */
export const settle = (ms = 750) =>
	new Promise<void>((resolve) => setTimeout(resolve, ms));
