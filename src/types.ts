export interface DenivapxOptions {
  token: string;
  baseUrl?: string;
  timeoutMs?: number;
}

export interface Image {
  id: string;
  filename: string;
  title: string | null;
  description: string | null;
  contentType: string;
  sizeBytes: number;
  url: string;
  createdAt: string;
}

export interface ImageUploadInput {
  file: Blob | ArrayBuffer | Uint8Array;
  filename: string;
  contentType?: string;
  title?: string;
  description?: string;
}

export class DenivapxError extends Error {
  readonly status: number;
  readonly details: unknown;

  constructor(message: string, status: number, details: unknown = undefined) {
    super(message);
    this.name = "DenivapxError";
    this.status = status;
    this.details = details;
  }
}
