import type { DenivapxOptions, Image, ImageUploadInput } from "./types.js";
import { DenivapxError } from "./types.js";

const DEFAULT_TIMEOUT_MS = 30_000;

const runtimeEnv = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;

type ApiImage = {
  id: string;
  filename: string;
  title?: string | null;
  description?: string | null;
  content_type: string;
  size_bytes: number;
  url: string;
  created_at: string;
};

function toImage(payload: ApiImage): Image {
  return {
    id: payload.id,
    filename: payload.filename,
    title: payload.title ?? null,
    description: payload.description ?? null,
    contentType: payload.content_type,
    sizeBytes: payload.size_bytes,
    url: payload.url,
    createdAt: payload.created_at,
  };
}

function toBlob(file: ImageUploadInput["file"], contentType: string): Blob {
  if (file instanceof Blob) return file;
  if (file instanceof ArrayBuffer) return new Blob([file], { type: contentType });
  return new Blob([new Uint8Array(file)], { type: contentType });
}

export class ImagesResource {
  constructor(private readonly client: Denivapx) {}

  async upload(input: ImageUploadInput): Promise<Image> {
    const form = new FormData();
    const contentType = input.contentType ?? "application/octet-stream";
    form.append("file", toBlob(input.file, contentType), input.filename);
    if (input.title !== undefined) form.append("title", input.title);
    if (input.description !== undefined) form.append("description", input.description);
    return toImage(await this.client.request<ApiImage>("/v1/images", { method: "POST", body: form }));
  }

  async uploadMany(inputs: readonly ImageUploadInput[], metadata: { title?: string; description?: string } = {}): Promise<Image[]> {
    if (inputs.length === 0) throw new Error("uploadMany requires at least one image");
    const form = new FormData();
    for (const input of inputs) {
      const contentType = input.contentType ?? "application/octet-stream";
      form.append("files", toBlob(input.file, contentType), input.filename);
    }
    if (metadata.title !== undefined) form.append("title", metadata.title);
    if (metadata.description !== undefined) form.append("description", metadata.description);
    const payload = await this.client.request<ApiImage[]>("/v1/images/bulk", { method: "POST", body: form });
    return payload.map(toImage);
  }

  async list(): Promise<Image[]> {
    const payload = await this.client.request<ApiImage[]>("/v1/images");
    return payload.map(toImage);
  }

  async delete(imageId: string): Promise<void> {
    await this.client.request<void>(`/v1/images/${encodeURIComponent(imageId)}`, { method: "DELETE" });
  }
}

export class Denivapx {
  readonly images: ImagesResource;
  private readonly baseUrl: string;
  private readonly token: string;
  private readonly timeoutMs: number;

  constructor(options: DenivapxOptions) {
    if (!options.token.trim()) throw new Error("Denivapx token is required");
    this.token = options.token;
    const resolvedBaseUrl = options.baseUrl ?? runtimeEnv?.DENIVAPX_BASE_URL;
    if (!resolvedBaseUrl) throw new Error("DENIVAPX_BASE_URL is required when baseUrl is not provided");
    this.baseUrl = resolvedBaseUrl.replace(/\/$/, "");
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.images = new ImagesResource(this);
  }

  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${this.token}`);
    if (!(init.body instanceof FormData)) headers.set("Accept", "application/json");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch(`${this.baseUrl}${path}`, { ...init, headers, signal: controller.signal });
      if (!response.ok) {
        let details: unknown;
        try { details = await response.json(); } catch { details = await response.text(); }
        throw new DenivapxError(`Denivapx request failed with ${response.status}`, response.status, details);
      }
      if (response.status === 204) return undefined as T;
      return (await response.json()) as T;
    } finally {
      clearTimeout(timeout);
    }
  }
}

export type { DenivapxOptions, Image, ImageUploadInput } from "./types.js";
export { DenivapxError } from "./types.js";
