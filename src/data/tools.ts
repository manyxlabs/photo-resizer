// Every tool this repo serves under /tools/. The website Worker forwards all of /tools* here,
// so a new tool needs an id here, its copy in each catalogue (src/i18n/) and a page.
export const tools = ['photo-resizer', 'signature-resizer', 'passport-photo', 'pdf-compressor', 'aadhaar-masker', 'rent-receipt', 'gst-invoice'] as const;

/** A tool's path segment, which also names its share image. */
export type ToolId = (typeof tools)[number];

export const toolPath = (tool: ToolId) => `/tools/${tool}/`;

// The file size limits people search for most; each gets a landing page that opens on it.
export const PHOTO_KB = [20, 50, 100, 200];
export const SIGN_KB = [10, 20];
export const PDF_KB = [100, 200, 300, 500, 1000];

export const sizeLabel = (kb: number) => (kb >= 1000 ? `${kb / 1000} MB` : `${kb} KB`);
export const sizeSlug = (kb: number) => sizeLabel(kb).toLowerCase().replace(' ', '-');
