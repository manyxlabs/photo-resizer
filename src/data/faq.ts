// Answers to what people search before using a tool. They are shown on the page and marked
// up as FAQPage, so each must stay true to what the tool does and to the linked notices.
type Faq = [question: string, answer: string][];

const PRIVATE: Faq[number] = [
  'Is my photo uploaded anywhere?',
  'No. The photo is opened, resized and saved by your own browser. Nothing is sent to a server, so it works the same with your internet switched off once the page has loaded.',
];

export const RESIZER_FAQ: Faq = [
  [
    'How do I reduce a photo to 20 KB or 50 KB?',
    'Pick the photo, pick your form (or Custom and type the KB limit), and download. The tool finds the highest JPG quality that stays under the limit, and if the picture is too simple to reach a minimum size, it pads the file without changing the picture.',
  ],
  [
    'Why does my form reject a photo that looks right?',
    'Forms check three things: the pixel size, the file size in KB and the file type. A photo from a phone is usually far too large on all three. Choosing the form here sets all three from its official notice.',
  ],
  [
    'Can I upload an iPhone HEIC photo or a scanner TIFF?',
    'Yes. HEIC, TIFF, WebP, AVIF, PNG, GIF and BMP files open here and come back as a JPG, which every form accepts.',
  ],
  [
    'What is the difference between pixels, cm and DPI?',
    'Pixels are the size of the file. A notice that gives a size in cm also implies a DPI (dots per inch): 3.5 cm at 300 DPI is 413 pixels. When you choose cm, the tool works out the pixels and writes the DPI into the file.',
  ],
  PRIVATE,
];

export const SIGNATURE_FAQ: Faq = [
  [
    'How do I make a signature image for an online form?',
    'Sign on plain white paper with a dark pen, take a photo of it in good light, and pick it here with your form. The tool whitens the paper, trims to your signature and saves it at the size the form asks for.',
  ],
  [
    'How do I resize a signature to 10 to 20 KB?',
    'Choose your form (for example IBPS or SSC), and the KB range is set from its notice. For any other form, choose Custom and type the size and KB limits.',
  ],
  [
    'Can I change the ink colour to black?',
    'Yes. After the paper is cleaned up, pick Black or Blue under Ink. Some forms, such as IBPS, ask for a signature in black ink.',
  ],
  ['Does it work for a thumb impression or a declaration?', 'Yes. Pick the matching preset, such as IBPS left thumb impression or hand-written declaration, and the same clean-up applies.'],
  PRIVATE,
];

export const PASSPORT_FAQ: Faq = [
  [
    'What size is an Indian passport photo?',
    'The guidelines for Passport Seva 2.0 ask for a colour photo of 630 × 810 pixels on a white background, with the face taking up 80 to 85% of it. Choose "Indian passport: Photo" to get exactly that.',
  ],
  [
    'Can I make a passport size photo at home?',
    'Yes. Stand against a plain white wall in even light, have someone take the photo from about 1.5 metres away, and pick it here. The tool frames it on your face and gives you both the upload file and a sheet to print.',
  ],
  [
    'How do I print passport photos on a 6 × 4 inch sheet?',
    'Download the print sheet. It has as many copies as fit on a 6 × 4 inch (4R) print at 300 DPI, with light lines to cut along. Ask the photo shop to print it at 100%, without cropping.',
  ],
  [
    'Can I change the photo background to white?',
    'Yes: tick "Replace the background with white". Check the edges around your hair afterwards. For a passport, the notice asks for photos unaltered by software, so a real white wall is the safer choice.',
  ],
  PRIVATE,
];

export const PDF_FAQ: Faq = [
  [
    'How do I compress a PDF to 200 KB?',
    'Add your PDF, pick 200 KB as the max size, and download the result. If the PDF does not fit as it is, its pages are turned into images at the highest sharpness that stays under 200 KB.',
  ],
  [
    'Will the text in my PDF stay selectable?',
    'Yes, if the PDF already fits the limit when merged as it is. If it has to be shrunk further, the pages become images and the text can no longer be selected or searched. The tool says when this happens.',
  ],
  [
    'Is my file uploaded anywhere?',
    'No. The PDF is read, merged and compressed in your browser, and never leaves your device.',
  ],
  [
    'How do I merge PDFs and photos into one PDF?',
    'Add all the files at once or one after another, put them in order with the up and down buttons, and download. Each photo is placed on its own A4 page.',
  ],
  [
    'Does a form count a KB as 1000 or 1024 bytes?',
    'Portals differ, so the tool counts a KB as 1000 bytes. A file under 200 KB here is under 200,000 bytes, which passes either way.',
  ],
  [
    'Why does it say my PDF cannot get small enough?',
    'Some limits are too small for the number of pages, even as small, blurry images. The tool tells you how small it could get; remove some pages or check whether your form allows a bigger file.',
  ],
];
