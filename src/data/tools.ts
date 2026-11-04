// Every tool this repo serves under /tools/. The website Worker forwards all of /tools*
// here, so a new tool needs only an entry and a page.
export type Tool = { path: string; name: string; blurb: string };

export const tools: Tool[] = [
  {
    path: '/tools/photo-resizer/',
    name: 'Photo & signature resizer',
    blurb: 'Exact pixels and KB for SSC, IBPS, UPSC and PAN forms.',
  },
  {
    path: '/tools/signature-resizer/',
    name: 'Signature cleaner',
    blurb: 'A phone photo of your signature, turned into a clean scan at the size your form asks for.',
  },
  {
    path: '/tools/passport-photo/',
    name: 'Passport photo maker',
    blurb: 'A 630 × 810 passport upload, a white background, and a 6 × 4 inch print sheet.',
  },
  {
    path: '/tools/pdf-compressor/',
    name: 'PDF compressor & merger',
    blurb: 'Merge PDFs and photos into one PDF and get it under the KB your form allows.',
  },
  {
    path: '/tools/aadhaar-masker/',
    name: 'Aadhaar masker',
    blurb: 'Hide the first 8 digits of your Aadhaar, or anything else, before you share a copy.',
  },
  {
    path: '/tools/rent-receipt/',
    name: 'Rent receipt generator',
    blurb: 'Monthly rent receipts for HRA, ready to print or save as PDF.',
  },
  {
    path: '/tools/gst-invoice/',
    name: 'GST invoice generator',
    blurb: 'A tax invoice with CGST, SGST or IGST worked out from the GSTINs.',
  },
];

export const toolAt = (path: string) => {
  const tool = tools.find((t) => t.path === path);
  if (!tool) throw new Error(`No tool at ${path}; add it to src/data/tools.ts`);
  return tool;
};

/** The last segment of a tool's path, which also names its share image. */
export const slugOf = (tool: Tool) => tool.path.split('/')[2]!;

// The file size limits people search for most; each gets a landing page that opens on it.
export const PHOTO_KB = [20, 50, 100, 200];
export const SIGN_KB = [10, 20];
export const PDF_KB = [100, 200, 300, 500, 1000];

export const sizeLabel = (kb: number) => (kb >= 1000 ? `${kb / 1000} MB` : `${kb} KB`);
export const sizeSlug = (kb: number) => sizeLabel(kb).toLowerCase().replace(' ', '-');
