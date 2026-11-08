// The English copy, and the shape every other language's catalogue must match key for key.
// {name} is filled in by fmt() or <Copy>; each language must use the same names (the build checks).
// A string with a {link} or similar is rendered by <Copy>, which puts the element there.

const PRIVATE: [string, string] = [
  'Is my photo uploaded anywhere?',
  'No. The photo is opened, resized and saved by your own browser. Nothing is sent to a server, so it works the same with your internet switched off once the page has loaded.',
];

const en = {
  /** Shown in the language menu of every page. */
  language: 'Language',
  onDevice: 'It all happens on your device; nothing is uploaded.',

  header: {
    home: 'Manyx Labs home',
    nav: 'Main',
    products: 'Products',
    work: 'Work with us',
    theme: 'Switch theme',
    toLight: 'Switch to light theme',
    toDark: 'Switch to dark theme',
  },

  footer: {
    place: 'Manyx Labs, Bengaluru',
    nav: 'Elsewhere',
    tools: 'Free tools',
    guides: 'Size guides',
    source: 'Source',
    issue: 'Report an issue',
    contribute: 'Contribute',
    founder: 'Founder',
    email: 'Email',
  },

  crumbs: { home: 'Manyx Labs', tools: 'Tools', guides: 'Size guides' },

  tool: { questions: 'Questions', more: 'More free tools', howItWorks: 'How it works' },

  tools: {
    'photo-resizer': { name: 'Photo & signature resizer', blurb: 'Exact pixels and KB for SSC, IBPS, UPSC and PAN forms.' },
    'signature-resizer': {
      name: 'Signature cleaner',
      blurb: 'A phone photo of your signature, turned into a clean scan at the size your form asks for.',
    },
    'passport-photo': {
      name: 'Passport photo maker',
      blurb: 'A 630 × 810 passport upload, a white background, and a 6 × 4 inch print sheet.',
    },
    'pdf-compressor': {
      name: 'PDF compressor & merger',
      blurb: 'Merge PDFs and photos into one PDF and get it under the KB your form allows.',
    },
    'aadhaar-masker': {
      name: 'Aadhaar masker',
      blurb: 'Hide the first 8 digits of your Aadhaar, or anything else, before you share a copy.',
    },
    'rent-receipt': { name: 'Rent receipt generator', blurb: 'Monthly rent receipts for HRA, ready to print or save as PDF.' },
    'gst-invoice': { name: 'GST invoice generator', blurb: 'A tax invoice with CGST, SGST or IGST worked out from the GSTINs.' },
  },

  hub: {
    title: 'Free tools for Indian forms and paperwork',
    description:
      'Free tools that run in your browser: photo, signature and passport photo resizing, PDF compression, Aadhaar masking, rent receipts and GST invoices.',
    heading: 'Free tools for forms and paperwork',
    lede: 'Everything runs in your browser. Your files and details never leave your device.',
  },

  notFound: {
    title: 'Page not found',
    description: 'This page does not exist.',
    heading: "This page doesn't exist.",
    tools: 'See all free tools',
    guides: 'Photo and signature size guides',
  },

  /** Sizes and limits, shared by the pages and the resizer's script. */
  sizes: {
    kbBetween: '{min} to {max} KB',
    kbUpTo: 'up to {max} KB',
    output: 'Output: {width} × {height} px, {kb}, JPG{named}.',
    outputCm: 'Output: {width} × {height} px ({w} × {h} cm at {dpi} DPI), {kb}, JPG{named}.',
    named: ', named {file}',
    photoUnder: 'Photo under {kb} KB',
    signUnder: 'Signature under {kb} KB',
    pdfUnder: 'PDF under {size}',
  },

  sizeLinks: { heading: 'Size guides', under: 'Just need it under a size?' },

  formsAt: {
    files: 'Forms that cap a file at {kb} KB:',
    signatures: 'Forms that cap the signature at {kb} KB:',
    item: '{exam} {spec} ({width} × {height} px, {range})',
    pick: '. Pick yours from the list below to get its exact size.',
  },

  // Exam and organisation names are written as they officially are.
  exams: {
    ibps: {
      name: 'IBPS',
      title: 'IBPS photo and signature size {year}',
      covers: 'PO/MT, SO, Clerk (CSA) and RRB 2026',
      source: 'IBPS CRP PO/MT-XVI notice (1 July 2026), Annexure III',
      notes: [
        'The PO/MT, SO, CSA (Clerk) and RRB 2026 notices all give the same sizes. Pixel sizes are what IBPS calls preferred; the KB ranges are hard limits.',
        'Photo: a recent colour passport-style picture on a light, preferably white, background. No caps, hats or dark glasses; religious headwear is fine if your face is uncovered. The form also takes a live photo.',
        'Signature: black ink on white paper, and not in capital letters.',
        'Left thumb: black or blue ink on white paper.',
        // The declaration itself must be written in English, so {declaration} is always the English text.
        'Declaration: in English, in black ink on white paper, not in capitals: {declaration} The RRB notice says "submit" instead of "present".',
      ],
    },
    ssc: {
      name: 'SSC',
      title: 'SSC CGL photo and signature size {year}',
      covers: 'CGL, CHSL, JE and Stenographer 2026',
      source: 'SSC CGL 2026 notice, para 9.6',
      notes: [
        'There is no photo to upload. The form takes a live photo with your webcam or phone: find good light and a plain background, and take off any cap, mask or glasses.',
        'The notices give no pixel size. The preset writes 200 DPI into the file, so it measures 6.0 × 2.0 cm.',
        'The annexure of the CGL and CHSL 2026 notices says 4.0 cm wide, while their main text and the newer JE 2026 notice say 6.0 cm. The preset follows 6.0 cm; pick Custom for 4.0 × 2.0 cm if your notice asks for that.',
      ],
    },
    upsc: {
      name: 'UPSC',
      title: 'UPSC photo and signature size {year}',
      covers: 'CSE, ESE and other UPSC exams',
      source: 'UPSC instructions for photo and signature upload (February 2026)',
      notes: [
        'Photo: in colour, on a plain white background, with your face covering at least 75% of it, and not signed. The form also takes a live photo and matches it against this one.',
        'UPSC gives no pixel size for the photo, so the preset uses passport size, 3.5 × 4.5 cm.',
        'Signature: sign three times, one below the other, in black ink on plain white paper, and scan all three as one image. UPSC asks for 350 to 500 pixels without saying which side, so the preset keeps both sides in that range.',
        'Files must be named photo.jpg and signature.jpg; the download already is.',
      ],
    },
    passport: {
      name: 'Indian passport',
      title: 'Indian passport photo size {year}',
      covers: 'Fresh and reissue applications on Passport Seva 2.0, from 1 December 2025',
      source: 'High Commission of India, Gaborone: ICAO photo guidelines for Passport Seva 2.0',
      notes: [
        'Since Passport Seva moved to version 2.0, applicants upload an ICAO-compliant photo and a scanned signature themselves. The notice gives no size for the signature.',
        'Photo: in colour, 630 × 810 pixels, on a white background. A close-up of the head and the top of the shoulders, with the face taking up 80 to 85% of the picture, looking straight at the camera with eyes open and mouth closed. Take off glasses, and keep hair away from your eyes.',
        'The notice also asks for photos unaltered by computer software, so stand against a plain white wall rather than replacing the background.',
        'The notice gives no file size limit. The preset keeps the file under 250 KB.',
      ],
    },
    pan: {
      name: 'PAN card (Protean)',
      title: 'PAN card (Protean) photo and signature size {year}',
      covers: 'New PAN and changes, through Protean (formerly NSDL)',
      source: 'Protean guidelines for a new PAN application',
      notes: [
        'Protean states 200 DPI and sizes in cm; the preset writes 200 DPI into the file.',
        'The limits are those of the DSC route. Protean allows up to 50 KB on the e-Sign route, so these files pass both.',
        'Applying through UTIITSL instead? It has its own limits; see the UTIITSL guide.',
      ],
    },
    'pan-utiitsl': {
      name: 'PAN card (UTIITSL)',
      title: 'PAN card (UTIITSL) photo and signature size {year}',
      covers: 'New PAN (Form 93) through UTIITSL',
      source: "UTIITSL's online PAN form, which checks the file type and size",
      notes: [
        "UTIITSL's form accepts JPG or PNG under 30 KB for the photo and under 60 KB for the signature, and checks nothing else.",
        'It states no pixel size. The photo preset uses the 3.5 × 4.5 cm its Form 93 instructions give for photos, and the signature uses the 4.5 × 2 cm PAN signature size Protean states, both at 200 DPI.',
        'Photos should be recent and in colour, on a white background.',
      ],
    },
  },

  /** Each preset as a heading (label) and inside a sentence (noun). */
  specs: {
    'ibps-photo': { label: 'Photo', noun: 'photo' },
    'ibps-sign': { label: 'Signature', noun: 'signature' },
    'ibps-thumb': { label: 'Left thumb impression', noun: 'left thumb impression' },
    'ibps-declaration': { label: 'Hand-written declaration', noun: 'hand-written declaration' },
    'ssc-sign': { label: 'Signature', noun: 'signature' },
    'upsc-photo': { label: 'Photo', noun: 'photo' },
    'upsc-sign': { label: 'Signature (three in one image)', noun: 'signature' },
    'passport-photo': { label: 'Photo', noun: 'photo' },
    'pan-photo': { label: 'Photo', noun: 'photo' },
    'pan-sign': { label: 'Signature', noun: 'signature' },
    'pan-uti-photo': { label: 'Photo', noun: 'photo' },
    'pan-uti-sign': { label: 'Signature', noun: 'signature' },
  },

  guides: {
    title: 'Photo and signature size for Indian forms {year}',
    description: 'The pixels, KB and format {exams} ask for, taken from the official notices, with a free tool to resize your files.',
    listName: 'Photo and signature size guides',
    heading: 'Photo and signature sizes for forms',
    lede: 'Taken from each official notice and checked in {checked}. {resizer} gets your file to fit.',
    resizer: 'The resizer',
    spec: '{spec}: {width} × {height} px, {range}',
  },

  guide: {
    eyebrow: 'Form size guide',
    lede: 'What {exam} asks for ({covers}), taken from the official notice and checked in {checked}.',
    /** The longest description that fits a search result is used: with {covers} if it fits, else with the year. */
    description: '{who}: {summary}. From the official notice, with a free tool to resize yours.',
    descriptionMore: '{who}: {summary}, and more. From the official notice, with a free tool to resize yours.',
    whoCovers: '{exam} ({covers})',
    whoYear: '{exam} {year}',
    summary: '{spec} {width} × {height} px, {range}',
    size: 'Size',
    pixels: '{width} × {height} pixels',
    pixelsCm: '{width} × {height} pixels ({w} × {h} cm at {dpi} DPI)',
    fileSize: 'File size',
    format: 'Format',
    jpg: 'JPG',
    jpgNamed: 'JPG, named {file}',
    resize: 'Resize your {exam} {spec}',
    howTo: 'How to make your {exam} {specs}',
    steps: {
      picture: 'Take the picture',
      pictureText: 'For the photo, stand against a plain white wall in even light and have someone take it from about 1.5 metres away.',
      pictureScans: 'For the {specs}, use plain white paper and dark ink, and photograph it from straight above in good light.',
      open: 'Open it with the {exam} preset',
      openText: 'Press the button under each size above. It opens the tool on that preset, which sets the pixels and KB from the notice.',
      openTextDpi: 'Press the button under each size above. It opens the tool on that preset, which sets the pixels, DPI and KB from the notice.',
      adjust: 'Adjust and download',
      adjustText: 'Drag or zoom to frame it, then download the JPG. It already fits the KB range.',
      adjustTextNamed: 'Drag or zoom to frame it, then download the JPG. It already fits the KB range and is named {files}.',
      upload: 'Upload and check',
      uploadText: 'Upload it to the {exam} form and check the preview before you submit.',
    },
    good: 'Good to know',
    source: 'Source: {source}. Rules change between notices, so check the one for your exam before you submit. {report}',
    report: 'Spec wrong or changed?',
    others: 'Other forms:',
  },

  resizer: {
    pickScan: 'Pick a photo or scan of your signature',
    pickPhoto: 'Pick your photo',
    pickAny: 'Pick a photo or scan',
    choose: 'Choose an image',
    drop: 'or drop it here. JPG, PNG, WebP, HEIC (iPhone), AVIF, TIFF, GIF or BMP.',
    ask: 'What does your form ask for?',
    form: 'Form',
    option: '{exam}: {spec}',
    custom: "Custom size (type it from your form's notice)",
    width: 'Width',
    height: 'Height',
    unit: 'Unit',
    cm: 'cm',
    pixels: 'pixels',
    dpi: 'DPI',
    minKB: 'Min KB',
    maxKB: 'Max KB',
    source: 'Source: {source}, checked {checked}.',
    rules: 'Rules change, so check yours before you submit.',
    report: 'Spec wrong or changed?',
    adjust: 'Adjust and download',
    preview: 'Preview. Drag or use arrow keys to move the image.',
    zoom: 'Zoom',
    clean: 'Clean up the paper background',
    ink: 'Ink',
    asWritten: 'As written',
    black: 'Black',
    blue: 'Blue',
    white: 'Replace the background with white',
    sheet: 'Download 6 × 4 in print sheet',
    download: 'Download JPG',
    /** Used by the tool's script as the picture is worked on. */
    js: {
      opening: 'Opening "{name}"…',
      cantOpen: 'Couldn\'t open "{name}". Use a photo or scan: JPG, PNG, WebP, HEIC, AVIF, TIFF, GIF or BMP.',
      dpiRange: 'DPI must be a whole number from 72 to 1200.',
      sizeRange: 'Width and height must each come to between 16 and 6000 pixels.',
      needKB: 'Enter the KB limits from your form.',
      minUnderMax: 'Min KB must be smaller than max KB.',
      tooBig: 'Even at the lowest quality this is {size}, over the limit. Use fewer pixels or a higher max KB.',
      result: '{width} × {height} px · {size} · JPG',
      resultDpi: ' · {dpi} DPI',
      padded: ' · padded to reach the minimum size',
      quality: ' · quality {quality}%',
      findingBackground: 'Finding the background… (the first time fetches about 13 MB)',
      findingFace: 'Finding the face…',
      backgroundFailed: "Couldn't replace the background. Check your connection and try again.",
    },
  },

  photoResizer: {
    title: 'Photo & signature resizer in KB for exam forms',
    description:
      'Resize a photo or signature to the exact pixels and KB SSC, UPSC, IBPS or PAN forms ask for, from JPG, PNG, HEIC or TIFF. Free, and nothing is uploaded.',
    heading: 'Photo & signature resizer for exam forms',
    lede: 'Get your photo or signature to the exact size and KB your form asks for.',
    faq: [
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
    ],
    under: {
      title: 'Resize photo to {kb} KB online, free',
      description:
        'Reduce a photo or signature to under {kb} KB at the exact pixel or cm size your exam or job form asks for. Free, and nothing is uploaded.',
      heading: 'Resize a photo to {kb} KB',
      lede: 'Get any photo under {kb} KB at the size your form asks for. Set the width and height below (in cm or pixels), or pick your exam from the list.',
    },
  },

  signatureResizer: {
    title: 'Signature resizer & cleaner for exam and PAN forms',
    description:
      'Turn a phone photo of your signature into a clean scan at the exact size and KB SSC, IBPS, UPSC or PAN asks for. Free, and nothing is uploaded.',
    heading: 'Signature cleaner & resizer',
    lede: 'Sign on white paper, take a photo with your phone, and get a clean scan at the size your form asks for.',
    how: [
      'Shadows and uneven light on the paper are evened out, so the paper turns pure white and the ink stays sharp.',
      "The picture is trimmed to your signature, so you don't need to crop it yourself. Drag or zoom to adjust.",
      'Pick black ink if your form asks for it: IBPS, for example, wants a signature in black ink on white paper.',
      'The same steps work for a thumb impression or a hand-written declaration.',
    ],
    faq: [
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
      [
        'Does it work for a thumb impression or a declaration?',
        'Yes. Pick the matching preset, such as IBPS left thumb impression or hand-written declaration, and the same clean-up applies.',
      ],
      PRIVATE,
    ],
    under: {
      title: 'Resize signature to {kb} KB online, free',
      description:
        'Turn a phone photo of your signature into a clean scan under {kb} KB, at the exact size your exam or PAN form asks for. Free, and nothing is uploaded.',
      heading: 'Resize a signature to {kb} KB',
      lede: 'Sign on white paper, take a photo with your phone, and get a clean scan under {kb} KB. Set the size below, or pick your form from the list.',
    },
  },

  passportPhoto: {
    title: 'Passport size photo maker online, free',
    description:
      'Make a 630 × 810 px Indian passport photo or exam photo from any picture, framed on your face, with a white background and a 6 × 4 inch print sheet. Free.',
    heading: 'Passport size photo maker',
    lede: 'For the Indian passport and exam forms: framed on your face, at the exact size and KB, with a sheet of copies to print.',
    how: [
      'The photo is framed on your face the way passport photos are: head and top of the shoulders, with a little room above your hair. Drag or zoom to adjust.',
      '"Replace the background with white" finds you in the picture and paints the rest white. Check the result around your hair before you use it. The passport notice asks for photos unaltered by software, so for a passport, a plain white wall behind you is the safer choice.',
      'The print sheet fits as many copies as it can on a 6 × 4 inch photo print, at 300 DPI, with light lines to cut along. Any photo shop or home printer can print it.',
      'The face finder and background tool run in your browser; the photo never leaves your device.',
    ],
    faq: [
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
    ],
  },

  pdf: {
    title: 'Compress PDF to 100 KB, 200 KB or any size',
    description:
      'Shrink a PDF under the KB limit your exam, job or government form allows, and merge PDFs and photos into one. Free, no signup, and nothing is uploaded.',
    heading: 'Compress a PDF to any size, and merge PDFs',
    lede: 'Merge PDFs and photos into one PDF and get it under the KB your form allows.',
    sizes: 'Need a specific size?',
    otherSizes: 'Other sizes:',
    how: [
      'Your files are joined into one PDF in the order you set, with each photo placed on its own A4 page.',
      'Nothing is uploaded. The work happens in your browser, so it is safe for Aadhaar, marksheets and other private documents.',
      'It first tries to keep your PDFs exactly as they are. If that is already small enough, the text stays sharp and can still be selected and searched.',
      'If not, every page is turned into a picture at the highest sharpness that fits your limit. The pages look the same when printed, but the text can no longer be selected, searched or copied. The result tells you when this has happened.',
    ],
    faq: [
      [
        'How do I compress a PDF to 200 KB?',
        'Add your PDF, pick 200 KB as the max size, and download the result. If the PDF does not fit as it is, its pages are turned into images at the highest sharpness that stays under 200 KB.',
      ],
      [
        'Will the text in my PDF stay selectable?',
        'Yes, if the PDF already fits the limit when merged as it is. If it has to be shrunk further, the pages become images and the text can no longer be selected or searched. The tool says when this happens.',
      ],
      ['Is my file uploaded anywhere?', 'No. The PDF is read, merged and compressed in your browser, and never leaves your device.'],
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
    ],
    under: {
      title: 'Compress PDF to {size} online, free',
      description:
        'Reduce a PDF to under {size} for an exam, job or government form, and merge PDFs and photos into one. Free, no signup, and nothing is uploaded.',
      heading: 'Compress a PDF to {size}',
      lede: 'Get your PDF under {size}, or join several PDFs and photos into one that fits.',
    },
    tool: {
      add: 'Add your PDFs and photos',
      choose: 'Choose files',
      drop: 'or drop them here. PDF, JPG, PNG, WebP, HEIC (iPhone), TIFF and more.',
      files: 'Files, in page order',
      howBig: 'How big can the PDF be?',
      maxSize: 'Max size',
      custom: 'Custom',
      maxKB: 'Max KB',
      hint: "Check your form's notice for the limit. Pages come out in the order of the list above.",
      download: 'Download',
      downloadPdf: 'Download PDF',
      js: {
        pages: { one: '{n} page', other: '{n} pages' },
        files: { one: '{n} file', other: '{n} files' },
        photo: 'Photo, on an A4 page',
        up: 'Move up',
        down: 'Move down',
        remove: 'Remove',
        needKB: 'Enter the KB limit from your form.',
        trying: 'Trying {dpi} DPI: page {n} of {total}…',
        assembling: 'Putting the PDF together…',
        working: 'Working…',
        tooBig: 'Even as small, blurry images these {pages} come to about {size}, over the {max} KB limit. Remove some pages or use a higher limit.',
        was: ' (was {size})',
        kept: ' · text kept, so it can still be selected',
        raster: ' · {dpi} DPI, quality {quality}%',
        rasterNote: '. To fit, the pages were turned into images, so the text can no longer be selected or searched.',
        failed: "Couldn't compress these files. Try removing them one at a time to find the one that fails.",
        opening: 'Opening "{name}"…',
        locked: '"{name}" is password-protected. Open it, save a copy without the password, and add that instead.',
        cantOpen: 'Couldn\'t open "{name}". Use a PDF or a photo or scan: JPG, PNG, WebP, HEIC, AVIF, TIFF, GIF or BMP.',
        tooMany: '"{name}" would take this to {pages} pages. The limit is {max}, so split it or leave some files out.',
      },
    },
  },

  aadhaar: {
    title: 'Mask Aadhaar online: hide the first 8 digits',
    description:
      'Hide the first 8 digits of your Aadhaar number, or anything else on an ID, before you share a copy. Works on photos, scans and e-Aadhaar PDFs. Free.',
    heading: 'Mask your Aadhaar number',
    lede: 'Hide the first 8 digits of your Aadhaar number, or anything else, before you share a copy.',
    faq: [
      [
        'What is a masked Aadhaar?',
        'A copy of your Aadhaar where the first 8 digits of the number are replaced, for example with X, and only the last 4 digits can be read. UIDAI offers it as an option when you download your e-Aadhaar.',
      ],
      [
        'Is a masked Aadhaar valid for KYC?',
        'UIDAI issues masked e-Aadhaar itself, but whether a masked copy is enough is up to the organisation asking. Some services need your full number to verify it. If you are not sure, ask them before you send a copy.',
      ],
      [
        'Is my Aadhaar uploaded anywhere?',
        'No. The file is opened, read and masked in your browser, and never leaves your device. The text recognition that finds the number also runs on your device.',
      ],
      [
        'Can I mask a PAN card or other ID too?',
        'Yes. Drag over anything you want hidden on a PAN card, passport, voter ID, driving licence or bank statement. Only Aadhaar numbers are found automatically.',
      ],
      [
        'Why does my PDF come back as images?',
        'A black box drawn on top of a PDF leaves the text underneath, where anyone can copy it out. Turning each page into an image with the box burned in removes the hidden text for good.',
      ],
    ],
    pick: 'Pick your Aadhaar or other ID',
    choose: 'Choose a photo, scan or PDF',
    drop: 'or drop it here. JPG, PNG, WebP, HEIC (iPhone), AVIF, TIFF, GIF, BMP or PDF.',
    check: "Check what's hidden",
    dragHint: 'Drag over anything else to hide it. Tap a box to remove it.',
    undo: 'Undo',
    clear: 'Clear',
    qr: "Older Aadhaar letters and cards have a QR code that holds the full number. If yours predates UIDAI's Secure QR code, or you aren't sure, drag a box over the QR code too.",
    finish: 'Add a note and download',
    note: 'Add a note across the copy (optional)',
    notePlaceholder: 'For KYC with ABC Bank only, 2 Nov 2026',
    noteHint: "Write who the copy is for and today's date, so it can't easily be reused for anything else.",
    pdfHint:
      'Each page comes back as a picture. A box drawn over a PDF in an editor leaves the text underneath it, where anyone can copy it out; turning the page into a picture removes it.',
    download: 'Download',
    what: 'What is masked Aadhaar?',
    how: [
      "UIDAI, which issues Aadhaar, defines masked Aadhaar as a copy where the first 8 digits of the number are replaced and only the last 4 stay visible. A hotel, a landlord or a bank can still tell which Aadhaar it is, but whoever gets hold of the copy doesn't have your full number. If you have an e-Aadhaar, you can also {link}.",
      'Nothing is uploaded. Your file is opened, read and masked in your browser, and the text recognition that finds the number runs on your device too.',
      'A PDF comes back as pictures of its pages. Drawing a black box over a PDF in most editors only adds a shape on top: the number is still in the file as text, and copying it gets it back. Here every page becomes a picture with the box burned in, put back together at its original size, so there is no text left to copy.',
      'It works on any ID: PAN, passport, voter ID, driving licence or a bank statement. Automatic detection only looks for Aadhaar numbers, so on anything else, drag over what you want hidden.',
    ],
    myAadhaar: 'download a masked one from myAadhaar',
    js: {
      making: 'Making your copy…',
      downloadAs: 'Download {type}',
      hidden: { one: '{n} area hidden', other: '{n} areas hidden' },
      pages: { one: '{n} page', other: '{n} pages' },
      lookingPage: 'Looking for the Aadhaar number on page {n} of {total}…',
      looking: 'Looking for the Aadhaar number…',
      noDetection: "Automatic detection didn't load. Drag over the number to hide it yourself.",
      notFound: "Couldn't find an Aadhaar number. Drag over it to hide it yourself.",
      found: {
        one: 'Found the Aadhaar number in one place and hid its first 8 digits. Check the preview below.',
        other: 'Found the Aadhaar number in {n} places and hid its first 8 digits. Check the preview below.',
      },
      tooManyPages: '"{name}" has {pages} pages; this tool takes up to {max}. Save just the pages with your ID as a new PDF, then pick that.',
      openingPage: 'Opening page {n} of {total}…',
      opening: 'Opening "{name}"…',
      locked:
        '"{name}" is locked with a password, as e-Aadhaar PDFs are. Open it in your PDF viewer, then print or save it as a PDF without the password, or take a screenshot, and pick that here.',
      cantOpen: 'Couldn\'t open "{name}". Pick a photo, scan or PDF of your ID: JPG, PNG, WebP, HEIC, AVIF, TIFF, GIF, BMP or PDF.',
      page: 'Page {n}. Drag to hide an area; tap a box to remove it.',
    },
  },

  rent: {
    title: 'Rent receipt generator for HRA, free PDF',
    description:
      'Make a rent receipt for every month you paid, with the amount in words and a revenue stamp box for cash over ₹5,000. Print or save as PDF for HRA. Free.',
    heading: 'Rent receipt generator for HRA',
    lede: 'One receipt for each month you paid rent, ready to sign and hand to your employer for HRA.',
    faq: [
      [
        'Is landlord PAN mandatory for HRA?',
        "Only if the rent you pay in the year is over ₹1,00,000. Then your employer needs your landlord's PAN, under CBDT Circular 8/2013 and now Form 124. If your landlord has no PAN, a declaration from them with their name and address is accepted instead.",
      ],
      [
        'Do rent receipts need a revenue stamp?',
        'Article 53 of the Indian Stamp Act, 1899 charges ₹1 stamp duty on a receipt for more than ₹5,000. Employers usually ask for a ₹1 revenue stamp, signed across by the landlord, on receipts for rent paid in cash.',
      ],
      [
        'Can I pay rent to my parents and claim HRA?',
        "Usually, if you really pay them rent for a home they own, and they show it as income in their tax return. Keep proof of the payments, such as bank transfers, since this is often checked. Form 124, which replaced Form 12BB from 1 April 2026, asks for your relationship with the landlord, so say that it's a parent.",
      ],
      [
        'How many rent receipts do I need to give my employer?',
        'Usually one for each month you claim HRA for, which is what this tool makes. Your employer decides, so check its HRA proof checklist.',
      ],
      [
        'Do I need a rent receipt if I pay rent by UPI or bank transfer?',
        'Most employers still ask for a receipt signed by the landlord. The receipt states the payment mode, and a bank or UPI statement backs it up.',
      ],
    ],
    parties: 'Tenant, landlord and home',
    tenant: "Tenant's name",
    landlord: "Landlord's name",
    pan: "Landlord's PAN (optional)",
    panHint: "Your employer will ask for it if the rent you pay in the year is over ₹1,00,000, under the CBDT's rules for HRA.",
    address: 'Address of the rented home',
    rentAndMonths: 'Rent and months',
    monthly: 'Monthly rent (₹)',
    paidBy: 'Paid by',
    cash: 'Cash',
    upi: 'UPI',
    bank: 'Bank transfer',
    cheque: 'Cheque',
    from: 'From',
    to: 'To',
    print: 'Print or save as PDF',
    printHint:
      'To get a PDF, pick "Save as PDF" as the printer in the print dialog. Sign each receipt, and on cash receipts with a revenue stamp box, have your landlord sign across a ₹1 revenue stamp.',
    /** The receipts themselves stay in English, as employers expect, with the amount in English words. */
    english: 'The receipts are in English, as employers expect.',
    preview: 'Receipt preview',
    rules: 'The rules these receipts follow',
    how: [
      "Employers ask for rent receipts to allow the HRA exemption. If the rent you pay in a year is over ₹1,00,000, they also need your landlord's PAN. The {tax} has asked for it since CBDT Circular 8/2013, and from 1 April 2026 it is part of {form}, which replaced Form 12BB under the Income-tax Act, 2025. If your landlord has no PAN, the department accepts a declaration from them with their name and address instead.",
      'Under {act}, a receipt for more than ₹5,000 carries a ₹1 stamp duty, paid by fixing a revenue stamp that the landlord signs across. The box appears on cash receipts over ₹5,000, the ones employers check for it; a UPI, bank or cheque payment has a bank record of its own. If your employer wants stamps on those too, add one.',
      'Each receipt is numbered by its month, so printing them again gives the same numbers.',
      "This is a convenience, not tax advice. Your employer decides what it accepts, so check with them if you're unsure. Your names and address are remembered in this browser to save typing next time; nothing leaves your device.",
    ],
    taxDept: 'Income Tax Department',
    form124: 'Form 124',
    stampAct: 'Article 53 of the Indian Stamp Act, 1899',
    js: {
      monthFormat: 'Enter months as YYYY-MM, for example 2026-04.',
      monthOrder: 'The To month must be the same as or after the From month.',
      tooManyMonths: 'Pick at most {max} months at a time.',
      rent: 'Enter the monthly rent in rupees, like 15000 or 15000.50.',
      pan: 'A PAN is 5 letters, 4 digits and a letter, like ABCDE1234F.',
      more: 'and {n} more like these, all of which print',
      summary: { one: '{n} receipt{total}.', other: '{n} receipts{total}.' },
      total: ', {total} in all',
      needTenant: "Enter the tenant's name.",
      needLandlord: "Enter the landlord's name.",
      needAddress: 'Enter the address of the rented home.',
      needRent: 'Enter the monthly rent.',
      needFrom: 'Pick the first month.',
      needTo: 'Pick the last month.',
    },
  },

  gst: {
    title: 'GST invoice generator, free online PDF',
    description:
      'Make a GST tax invoice with CGST and SGST or IGST worked out from the GSTINs, the new GST rates, the total in words and a print-ready PDF. Free, no signup.',
    heading: 'GST invoice generator',
    lede: 'A tax invoice with CGST and SGST or IGST worked out for you, ready to print or save as PDF.',
    faq: [
      [
        'What must a GST tax invoice contain?',
        "Under Rule 46 of the CGST Rules, 2017: the supplier's name, address and GSTIN; a serial number of up to 16 characters; the date; the recipient's name, address and GSTIN if registered; the HSN or SAC code, description, quantity and unit; the taxable value; the tax rate and amount of each tax; the place of supply with the state's name for inter-state supplies; whether tax is payable on reverse charge; and the supplier's signature.",
      ],
      [
        'When do I charge IGST instead of CGST and SGST?',
        "When the supplier's state and the place of supply are different, the supply is inter-state and carries IGST at the full rate. When they are the same, it carries CGST and SGST at half the rate each, or CGST and UTGST in a union territory without a legislature.",
      ],
      [
        'How long can a GST invoice number be?',
        'At most 16 characters, using letters, digits, hyphens and slashes, and unique within a financial year. That is Rule 46(b) of the CGST Rules, 2017.',
      ],
      [
        'What are the GST rates after September 2025?',
        'From 22 September 2025, most goods and services are taxed at 5% or 18%, with 40% for a few luxury and sin goods. Special rates remain, such as 3% for gold, silver and jewellery and 0.25% for rough diamonds.',
      ],
      [
        'Do I need the GSTIN of an unregistered customer?',
        'No, an unregistered customer has none. If the taxable value is ₹50,000 or more, Rule 46(e) asks for their name, address, and the state and its code instead.',
      ],
    ],
    business: 'Your business',
    businessName: 'Business name',
    gstin: 'GSTIN',
    address: 'Address',
    customer: 'Customer',
    name: 'Name',
    customerGstin: 'GSTIN (blank if unregistered)',
    details: 'Invoice details',
    number: 'Invoice number',
    date: 'Date',
    place: 'Place of supply',
    chooseState: 'Choose a state',
    reverse: 'Reverse charge',
    no: 'No',
    yes: 'Yes',
    items: 'Items',
    addItem: 'Add item',
    payment: 'Payment and notes (optional)',
    bank: 'Bank details',
    bankPlaceholder: 'Bank, account number and IFSC',
    notes: 'Notes',
    notesPlaceholder: 'Payment due in 15 days',
    upi: 'UPI ID',
    print: 'Print or save as PDF',
    printHint: 'To get a PDF, pick "Save as PDF" as the printer in the print dialog.',
    /** The invoice itself stays in English, with the total in English words. */
    english: 'The invoice is in English, with the total in words.',
    item: 'Item',
    remove: 'Remove',
    itemDescription: 'Description',
    hsn: 'HSN/SAC',
    quantity: 'Quantity',
    unit: 'Unit',
    rate: 'Rate (₹)',
    gstRate: 'GST',
    rates: 'Rates',
    specialRates: 'Special rates',
    nil: '0% (nil rated)',
    exporters: '0.1% (supply to merchant exporters)',
    diamonds: '0.25% (rough diamonds and precious stones)',
    polished: '1.5% (cut and polished diamonds)',
    gold: '3% (gold, silver and jewellery)',
    preview: 'Invoice preview',
    rules: 'The rules this invoice follows',
    how: [
      'The fields are the ones {rule46} asks a tax invoice to carry, including a serial number of at most 16 characters (letters, digits, "-" and "/"), unique for the financial year, and whether tax is payable on reverse charge.',
      "When your state, taken from the first two digits of your GSTIN, is the same as the place of supply, the invoice charges CGST and SGST at half the rate each; in a union territory without a legislature, UTGST takes the place of SGST. Otherwise it charges IGST at the full rate. The place of supply starts as your customer's state; change it if the goods are delivered, or the service is supplied, somewhere else.",
      'The rates are the ones in force since 22 September 2025, after the {council} cut the main rates to 5% and 18%, with 40% for a few goods, plus the special rates kept for precious metals, diamonds and stones and supplies to merchant exporters.',
      "Tax is worked out on the taxable value of each rate, rounded to the paisa, and the total is rounded to the nearest rupee, with the difference shown as round off. GSTINs are checked for their format, state code and check character, which catches most typos; it can't tell you whether a GSTIN is active.",
      "This is a convenience, not tax advice. Check anything you're unsure of with your accountant. Your business details are remembered in this browser to save typing next time; nothing leaves your device.",
    ],
    rule46: 'Rule 46 of the CGST Rules, 2017',
    council: '56th GST Council meeting',
    js: {
      qty: 'Enter the quantity as a number, up to 3 decimals.',
      rate: 'Enter the rate in rupees, like 1250 or 1250.50.',
      hsn: 'An HSN or SAC code is 4, 6 or 8 digits.',
      gstinFormat: 'A GSTIN is 15 characters: a 2-digit state code, a 10-character PAN, an entity number, Z and a check character.',
      gstinState: '{code} is not a GST state code.',
      gstinCheck: 'The last character does not match. Check the GSTIN for a typo.',
      state: 'State: {state}',
      noLong: 'An invoice number can have at most 16 characters (Rule 46). This one has {n}.',
      noChars: 'Use only letters, digits, "-" and "/" in the invoice number (Rule 46).',
      inter: 'Inter-state supply: IGST at the full rate.',
      intra: 'Intra-state supply: CGST and {local} at half the rate each.',
      needPlace: 'Enter your GSTIN and the place of supply to work out the tax.',
      total: 'Total {total}',
      tooLarge: 'The amounts are too large to total.',
      needName: 'Enter your business name.',
      needGstin: 'Enter your GSTIN.',
      needAddress: 'Enter your business address.',
      needCustomer: "Enter the customer's name.",
      needCustomerAddress: "Enter the customer's address. Rule 46 asks for it from a registered customer, or for ₹50,000 or more.",
      needNo: 'Enter the invoice number.',
      needDate: 'Enter the invoice date.',
      needPlaceOfSupply: 'Choose the place of supply.',
      itemDesc: 'Item {n}: enter a description.',
      itemQty: 'Item {n}: enter the quantity.',
      itemRate: 'Item {n}: enter the rate.',
      itemError: 'Item {n}: {error}',
    },
  },
};

export default en;

/** Every catalogue has this shape: the same keys, each a string (or list or plural forms) in its language. */
export type Messages = typeof en;
