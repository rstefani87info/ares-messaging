/** 
* @author Roberto Stefani 
**/ 

const FileCtor =
	typeof globalThis !== "undefined" && typeof globalThis.File === "function"
		? globalThis.File
		: class File {
				constructor(parts = [], name = "file", options = {}) {
					this.name = String(name ?? "file");
					this.type = options?.type ? String(options.type) : "";
					this.lastModified =
						typeof options?.lastModified === "number"
							? options.lastModified
							: Date.now();

					const bytes = [];
					for (const part of parts ?? []) {
						if (part == null) continue;
						if (part instanceof Uint8Array) bytes.push(part);
						else if (typeof part === "string")
							bytes.push(new TextEncoder().encode(part));
						else if (part instanceof ArrayBuffer)
							bytes.push(new Uint8Array(part));
						else if (ArrayBuffer.isView(part))
							bytes.push(new Uint8Array(part.buffer));
						else
							throw new TypeError(
								"File: unsupported part type for polyfill constructor",
							);
					}

					let size = 0;
					for (const b of bytes) size += b.byteLength;
					this.size = size;
					this._bytes = bytes;
				}

				async arrayBuffer() {
					const out = new Uint8Array(this.size);
					let offset = 0;
					for (const chunk of this._bytes) {
						out.set(chunk, offset);
						offset += chunk.byteLength;
					}
					return out.buffer;
				}
		  };

function normalizeRecipientList(value) {
	if (value == null) return [];
	if (typeof value === "string") {
		const v = value.trim();
		return v ? [v] : [];
	}
	if (value instanceof Set) return [...value].map((v) => String(v).trim()).filter(Boolean);
	if (Array.isArray(value))
		return value.map((v) => String(v).trim()).filter(Boolean);
	return [String(value).trim()].filter(Boolean);
}

function normalizeFrom(from, alias) {
	if (from == null) return null;

	if (typeof from === "object") {
		const out = { ...from };
		if (out.alias != null && out.name == null && out.displayName == null) {
			out.name = out.alias;
		}
		if (alias != null && out.alias == null && out.name == null && out.displayName == null) {
			out.alias = String(alias);
			out.name = String(alias);
		}
		return out;
	}

	if (alias != null && String(alias).trim()) {
		return { address: String(from), alias: String(alias), name: String(alias) };
	}

	return from;
}

function normalizeAttachments(value) {
	if (value == null) return [];
	const list = Array.isArray(value) ? value : [value];

	return list
		.filter((v) => v != null)
		.map((v) => {
			if (typeof globalThis !== "undefined" && typeof globalThis.File === "function") {
				if (v instanceof globalThis.File) return v;
			}
			if (v instanceof FileCtor) return v;

			if (typeof v === "object") {
				const name = v.name ?? v.filename ?? v.fileName ?? v.originalname;
				const type = v.type ?? v.mimeType ?? v.mimetype;
				const lastModified = v.lastModified ?? v.mtimeMs ?? v.mtime;

				const bytes =
					v.bytes ??
					v.data ??
					v.buffer ??
					v.content ??
					v.body ??
					v.arrayBuffer ??
					null;

				if (name != null && bytes != null) {
					if (typeof bytes === "function") {
						throw new TypeError(
							"Attachment normalization does not accept lazy/async byte providers. Provide bytes directly.",
						);
					}

					if (bytes instanceof Uint8Array) {
						return new FileCtor([bytes], String(name), {
							type: type ? String(type) : undefined,
							lastModified:
								typeof lastModified === "number"
									? lastModified
									: lastModified
										? new Date(lastModified).getTime()
										: undefined,
						});
					}

					if (bytes instanceof ArrayBuffer) {
						return new FileCtor([new Uint8Array(bytes)], String(name), {
							type: type ? String(type) : undefined,
							lastModified:
								typeof lastModified === "number"
									? lastModified
									: lastModified
										? new Date(lastModified).getTime()
										: undefined,
						});
					}

					if (ArrayBuffer.isView(bytes)) {
						return new FileCtor([new Uint8Array(bytes.buffer)], String(name), {
							type: type ? String(type) : undefined,
							lastModified:
								typeof lastModified === "number"
									? lastModified
									: lastModified
										? new Date(lastModified).getTime()
										: undefined,
						});
					}

					if (typeof bytes === "string") {
						return new FileCtor([bytes], String(name), {
							type: type ? String(type) : undefined,
							lastModified:
								typeof lastModified === "number"
									? lastModified
									: lastModified
										? new Date(lastModified).getTime()
										: undefined,
						});
					}
				}
			}

			throw new TypeError(
				"Unsupported attachment type. Provide a File or an object with at least { name, bytes } (Uint8Array/ArrayBuffer/string).",
			);
		});
}

function createId() {
	if (typeof globalThis !== "undefined" && globalThis.crypto?.randomUUID) {
		return globalThis.crypto.randomUUID();
	}
	return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function isChannelLike(value) {
	return (
		value != null &&
		typeof value === "object" &&
		typeof value.send === "function" &&
		typeof value.receive === "function"
	);
}

function normalizeChannels(value, { required } = { required: true }) {
	let list = [];

	if (value == null) list = [];
	else if (Array.isArray(value)) list = value;
	else if (value instanceof Set) list = [...value];
	else list = [value];

	list = list.filter((v) => v != null);

	for (const ch of list) {
		if (!isChannelLike(ch)) {
			throw new TypeError(
				"Invalid channel. Provide one or more Channel instances (objects implementing send(message) and receive()).",
			);
		}
	}

	if (required && list.length === 0) {
		throw new TypeError("Missing channels. Provide one or more channel to the constructor.");
	}

	return list;
}

export class Topic {
	constructor(init = {}) {
		this.channels = normalizeChannels(
			init.channels ?? init.channels ?? init.channel ?? init.channel,
			{ required: true },
		);

		this.id = init.id ?? createId();
		this.createdAt = init.createdAt ? new Date(init.createdAt) : new Date();
		this.messages = [];

		const initialMessages = Array.isArray(init.messages) ? init.messages : [];
		for (const msg of initialMessages) this.addMessage(msg);
	}

	addMessage(message) {
		const msg = message instanceof Message ? message : new Message({ ...message, topic: this });

		if (msg.topic !== this) msg.topic = this;
		if (!this.messages.includes(msg)) this.messages.push(msg);

		this.messages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
		return msg;
	}

	getLastMessage() {
		return this.messages.length ? this.messages[this.messages.length - 1] : null;
	}
}

export class Message {
	constructor(init = {}) {
		const initChannels = init.channels ?? init.channels ?? init.channel ?? init.channel;

		const topic = (() => {
			if (init.topic instanceof Topic) return init.topic;

			if (init.topic) {
				const t = typeof init.topic === "object" ? init.topic : {};
				const topicChannels =
					t.channels ?? t.channels ?? t.channel ?? t.channel ?? initChannels;
				return new Topic({ ...t, channels: topicChannels });
			}

			return new Topic({ channels: initChannels });
		})();

		this.channels = normalizeChannels(initChannels ?? topic.channels, {
			required: true,
		});

		const parent =
			init.parent !== undefined ? init.parent : topic.getLastMessage();

		this.id = init.id ?? createId();
		this.createdAt = init.createdAt ? new Date(init.createdAt) : new Date();

		this.from = normalizeFrom(init.from ?? null, init.fromAlias ?? init.alias ?? null);
		this.to = normalizeRecipientList(init.to);
		this.cc = normalizeRecipientList(init.cc);
		this.bcc = normalizeRecipientList(init.bcc);

		this.title = init.title ?? "";
		this.body = init.body ?? "";
		this.attachments = normalizeAttachments(init.attachments ?? init.allegati);

		this.topic = topic;
		this.parent = parent ?? null;

		this.topic.addMessage(this);
	}

	async send() {
		const results = [];
		for (const channel of this.channels) {
			results.push(await channel.send(this));
		}
		return results;
	}

	async receive() {
		const results = [];
		for (const channel of this.channels) {
			results.push(await channel.receive());
		}
		return results;
	}
}

export class Channel {
	constructor(options = {}) {
		if (new.target === Channel) {
			throw new TypeError("Channel is abstract and cannot be instantiated directly");
		}
		this.options = options;
	}

	async send(_message) {
		throw new Error("send(message) not implemented");
	}

	async receive() {
		throw new Error("receive() not implemented");
	}
}

export { FileCtor as File };
