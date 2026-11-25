# Denivapx JavaScript SDK

Type-safe JavaScript/TypeScript client for Denivapx. It uses the platform `fetch`, `FormData`, and `Blob` APIs and supports Node.js 18+.

## Install

Once published:

```bash
npm install denivapx
```

For local development:

```bash
npm install ./denivapx-js
```

Copy `.env.example` into the consuming application and configure `DENIVAPX_BASE_URL` and `DENIVAPX_TOKEN`. `baseUrl` remains available as an explicit per-client override.

## Usage

```ts
import { Denivapx } from "denivapx";
import { readFile } from "node:fs/promises";

const client = new Denivapx({
  token: process.env.DENIVAPX_TOKEN!,
});

const bytes = await readFile("./cover.jpg");
const image = await client.images.upload({
  file: bytes,
  filename: "cover.jpg",
  contentType: "image/jpeg",
  title: "Summer studio",
});

console.log(image.url);

const images = await client.images.uploadMany([
  { file: await readFile("./one.jpg"), filename: "one.jpg", contentType: "image/jpeg" },
  { file: await readFile("./two.jpg"), filename: "two.jpg", contentType: "image/jpeg" },
], { title: "Lookbook" });
console.log(images.map((item) => item.url));
```

All public methods and response fields are typed. The SDK currently exposes `images.upload`, `images.uploadMany`, `images.list`, and `images.delete`.
