import { EMAIL } from '../site';

export type FormSpec = {
  id: string;
  label: string;
  width: number;
  height: number;
  /** Set when the notice states a size in cm: the DPI is written into the file so it measures that. */
  physical?: { w: number; h: number; dpi: number };
  minKB: number;
  maxKB: number;
  /** Signatures and thumbs are scans on white paper, so the background clean-up starts on. */
  scan: boolean;
  /** Some portals reject a file not named as they ask. */
  fileName?: string;
};

export type Exam = {
  id: string;
  name: string;
  covers: string;
  source: { label: string; url: string };
  notes: string[];
  specs: FormSpec[];
};

const atCm = (w: number, h: number, dpi: number) => ({
  width: Math.round((w / 2.54) * dpi),
  height: Math.round((h / 2.54) * dpi),
  physical: { w, h, dpi },
});

export const CHECKED = { month: 'November', year: 2026 };

// Every number below is quoted from the linked official source. Where a source gives
// no pixel size, the note on the exam says what was chosen and why.
export const exams: Exam[] = [
  {
    id: 'ibps',
    name: 'IBPS',
    covers: 'PO/MT, SO, Clerk (CSA) and RRB 2026',
    source: {
      label: 'IBPS CRP PO/MT-XVI notice (1 July 2026), Annexure III',
      url: 'https://www.ibps.in/wp-content/uploads/Detailed-Notification_CRP-PO-XVI_Final_V1_30.06.2026.pdf',
    },
    notes: [
      'The PO/MT, SO, CSA (Clerk) and RRB 2026 notices all give the same sizes. Pixel sizes are what IBPS calls preferred; the KB ranges are hard limits.',
      'Photo: a recent colour passport-style picture on a light, preferably white, background. No caps, hats or dark glasses; religious headwear is fine if your face is uncovered. The form also takes a live photo.',
      'Signature: black ink on white paper, and not in capital letters.',
      'Left thumb: black or blue ink on white paper.',
      'Declaration: in English, in black ink on white paper, not in capitals: "I, (your name), hereby declare that all the information submitted by me in the application form is correct, true and valid. I will present the supporting documents as and when required." The RRB notice says "submit" instead of "present".',
    ],
    specs: [
      { id: 'ibps-photo', label: 'Photo', width: 200, height: 230, minKB: 20, maxKB: 50, scan: false },
      { id: 'ibps-sign', label: 'Signature', width: 140, height: 60, minKB: 10, maxKB: 20, scan: true },
      {
        id: 'ibps-thumb',
        label: 'Left thumb impression',
        width: 240,
        height: 240,
        physical: { w: 3, h: 3, dpi: 200 },
        minKB: 20,
        maxKB: 50,
        scan: true,
      },
      {
        id: 'ibps-declaration',
        label: 'Hand-written declaration',
        width: 800,
        height: 400,
        physical: { w: 10, h: 5, dpi: 200 },
        minKB: 50,
        maxKB: 100,
        scan: true,
      },
    ],
  },
  {
    id: 'ssc',
    name: 'SSC',
    covers: 'CGL, CHSL, JE and Stenographer 2026',
    source: {
      label: 'SSC CGL 2026 notice, para 9.6',
      url: 'https://ssc.gov.in/api/attachment/uploads/masterData/NoticeBoards/Notice_of_adv_cgl_2026.pdf',
    },
    notes: [
      'There is no photo to upload. The form takes a live photo with your webcam or phone: find good light and a plain background, and take off any cap, mask or glasses.',
      'The notices give no pixel size. The preset writes 200 DPI into the file, so it measures 6.0\u00a0×\u00a02.0 cm.',
      'The annexure of the CGL and CHSL 2026 notices says 4.0 cm wide, while their main text and the newer JE 2026 notice say 6.0 cm. The preset follows 6.0 cm; pick Custom for 4.0\u00a0×\u00a02.0 cm if your notice asks for that.',
    ],
    specs: [{ id: 'ssc-sign', label: 'Signature', ...atCm(6, 2, 200), minKB: 10, maxKB: 20, scan: true }],
  },
  {
    id: 'upsc',
    name: 'UPSC',
    covers: 'CSE, ESE and other UPSC exams',
    source: {
      label: 'UPSC instructions for photo and signature upload (February 2026)',
      url: 'https://upsconline.nic.in/candidate/resources/bzh30/login/upsc-candidates-portal/dist/assets/instruction-photo-signature-upload-upsc-CCLCIgId.pdf',
    },
    notes: [
      'Photo: in colour, on a plain white background, with your face covering at least 75% of it, and not signed. The form also takes a live photo and matches it against this one.',
      'UPSC gives no pixel size for the photo, so the preset uses passport size, 3.5\u00a0×\u00a04.5 cm.',
      'Signature: sign three times, one below the other, in black ink on plain white paper, and scan all three as one image. UPSC asks for 350 to 500 pixels without saying which side, so the preset keeps both sides in that range.',
      'Files must be named photo.jpg and signature.jpg; the download already is.',
    ],
    specs: [
      { id: 'upsc-photo', label: 'Photo', ...atCm(3.5, 4.5, 300), minKB: 20, maxKB: 200, scan: false, fileName: 'photo' },
      { id: 'upsc-sign', label: 'Signature (three in one image)', width: 400, height: 500, minKB: 20, maxKB: 100, scan: true, fileName: 'signature' },
    ],
  },
  {
    id: 'pan',
    name: 'PAN card (Protean)',
    covers: 'New PAN and changes, through Protean (formerly NSDL)',
    source: {
      label: 'Protean guidelines for a new PAN application',
      url: 'https://tin.tin.proteantech.in/pan/form49Adsc.html',
    },
    notes: [
      'Protean states 200 DPI and sizes in cm; the preset writes 200 DPI into the file.',
      'The limits are those of the DSC route. Protean allows up to 50 KB on the e-Sign route, so these files pass both.',
      'Applying through UTIITSL instead? It has its own limits; see the UTIITSL guide.',
    ],
    specs: [
      { id: 'pan-photo', label: 'Photo', ...atCm(2.5, 3.5, 200), minKB: 0, maxKB: 20, scan: false },
      { id: 'pan-sign', label: 'Signature', ...atCm(4.5, 2, 200), minKB: 0, maxKB: 10, scan: true },
    ],
  },
  {
    id: 'pan-utiitsl',
    name: 'PAN card (UTIITSL)',
    covers: 'New PAN (Form 93) through UTIITSL',
    source: {
      label: "UTIITSL's online PAN form, which checks the file type and size",
      url: 'https://www.pan.utiitsl.com/PAN/newA.html',
    },
    notes: [
      "UTIITSL's form accepts JPG or PNG under 30 KB for the photo and under 60 KB for the signature, and checks nothing else.",
      'It states no pixel size. The photo preset uses the 3.5\u00a0×\u00a04.5 cm its Form 93 instructions give for photos, and the signature uses the 4.5\u00a0×\u00a02 cm PAN signature size Protean states, both at 200 DPI.',
      'Photos should be recent and in colour, on a white background.',
    ],
    specs: [
      { id: 'pan-uti-photo', label: 'Photo', ...atCm(3.5, 4.5, 200), minKB: 0, maxKB: 30, scan: false },
      { id: 'pan-uti-sign', label: 'Signature', ...atCm(4.5, 2, 200), minKB: 0, maxKB: 60, scan: true },
    ],
  },
];

export const examOf = (spec: FormSpec) => exams.find((e) => e.specs.includes(spec))!;

export const kbRange = ({ minKB, maxKB }: Pick<FormSpec, 'minKB' | 'maxKB'>) => (minKB ? `${minKB} to ${maxKB} KB` : `up to ${maxKB} KB`);

export function reportHref(spec?: FormSpec) {
  const what = spec ? `${examOf(spec).name} ${spec.label.toLowerCase()}` : 'a form';
  const body = spec
    ? `The preset says ${spec.width} × ${spec.height} px, ${kbRange(spec)}.\n\nWhat the form asks for now:\n\nLink to the notice:\n`
    : 'Form:\n\nWhat it asks for:\n\nLink to the notice:\n';
  return `mailto:${EMAIL}?subject=${encodeURIComponent(`Spec wrong: ${what}`)}&body=${encodeURIComponent(body)}`;
}
