import type { Messages } from '../i18n/en';
import { fmt } from '../i18n/format';
import { intlTag, type Locale } from '../i18n/locales';
import { EMAIL } from '../site';

type SpecData = {
  id: string;
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

const atCm = (w: number, h: number, dpi: number) => ({
  width: Math.round((w / 2.54) * dpi),
  height: Math.round((h / 2.54) * dpi),
  physical: { w, h, dpi },
});

export const CHECKED = { month: 11, year: 2026 };

export const checkedOn = (locale: Locale) =>
  new Intl.DateTimeFormat(intlTag(locale), { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(Date.UTC(CHECKED.year, CHECKED.month - 1));

// Every number below is quoted from the linked official source. Where a source gives no pixel
// size, the exam's notes (in each language's catalogue, src/i18n/) say what was chosen and why.
const EXAMS = [
  {
    id: 'ibps',
    source: 'https://www.ibps.in/wp-content/uploads/Detailed-Notification_CRP-PO-XVI_Final_V1_30.06.2026.pdf',
    specs: [
      { id: 'ibps-photo', width: 200, height: 230, minKB: 20, maxKB: 50, scan: false },
      { id: 'ibps-sign', width: 140, height: 60, minKB: 10, maxKB: 20, scan: true },
      { id: 'ibps-thumb', width: 240, height: 240, physical: { w: 3, h: 3, dpi: 200 }, minKB: 20, maxKB: 50, scan: true },
      { id: 'ibps-declaration', width: 800, height: 400, physical: { w: 10, h: 5, dpi: 200 }, minKB: 50, maxKB: 100, scan: true },
    ],
  },
  {
    id: 'ssc',
    source: 'https://ssc.gov.in/api/attachment/uploads/masterData/NoticeBoards/Notice_of_adv_cgl_2026.pdf',
    specs: [{ id: 'ssc-sign', ...atCm(6, 2, 200), minKB: 10, maxKB: 20, scan: true }],
  },
  {
    id: 'upsc',
    source: 'https://upsconline.nic.in/candidate/resources/bzh30/login/upsc-candidates-portal/dist/assets/instruction-photo-signature-upload-upsc-CCLCIgId.pdf',
    specs: [
      { id: 'upsc-photo', ...atCm(3.5, 4.5, 300), minKB: 20, maxKB: 200, scan: false, fileName: 'photo' },
      { id: 'upsc-sign', width: 400, height: 500, minKB: 20, maxKB: 100, scan: true, fileName: 'signature' },
    ],
  },
  {
    id: 'passport',
    source: 'https://www.hcigaborone.gov.in/docs/1764218847Notice%20_%20New%20ICAO-Guidelines.pdf',
    specs: [{ id: 'passport-photo', width: 630, height: 810, minKB: 0, maxKB: 250, scan: false }],
  },
  {
    id: 'pan',
    source: 'https://tin.tin.proteantech.in/pan/form49Adsc.html',
    specs: [
      { id: 'pan-photo', ...atCm(2.5, 3.5, 200), minKB: 0, maxKB: 20, scan: false },
      { id: 'pan-sign', ...atCm(4.5, 2, 200), minKB: 0, maxKB: 10, scan: true },
    ],
  },
  {
    id: 'pan-utiitsl',
    source: 'https://www.pan.utiitsl.com/PAN/newA.html',
    specs: [
      { id: 'pan-uti-photo', ...atCm(3.5, 4.5, 200), minKB: 0, maxKB: 30, scan: false },
      { id: 'pan-uti-sign', ...atCm(4.5, 2, 200), minKB: 0, maxKB: 60, scan: true },
    ],
  },
] as const satisfies readonly { id: string; source: string; specs: readonly SpecData[] }[];

/** Every catalogue in src/i18n/ names each exam and preset by these, so a new one fails the type check until it has copy. */
export type ExamId = (typeof EXAMS)[number]['id'];
export type SpecId = (typeof EXAMS)[number]['specs'][number]['id'];
export type FormSpec = Omit<SpecData, 'id'> & { id: SpecId };
export type Exam = { id: ExamId; source: string; specs: readonly FormSpec[] };

export const exams: readonly Exam[] = EXAMS;

export const guideTitle = (t: Messages, exam: Exam) => fmt(t.exams[exam.id].title, { year: CHECKED.year });

export const examOf = (spec: FormSpec) => exams.find((e) => e.specs.includes(spec))!;

/** The presets an "under N KB" page serves: those whose limit is exactly N, of one kind or both. */
export const specsCapped = (kb: number, scan?: boolean) =>
  exams.flatMap((exam) => exam.specs.filter((s) => s.maxKB === kb && (scan === undefined || s.scan === scan)).map((spec) => ({ exam, spec })));

// Client scripts get these strings as JSON, so these take that part of the catalogue only.
type Sizes = Messages['sizes'];

export const kbRange = (t: Sizes, { minKB, maxKB }: Pick<FormSpec, 'minKB' | 'maxKB'>) =>
  minKB ? fmt(t.kbBetween, { min: minKB, max: maxKB }) : fmt(t.kbUpTo, { max: maxKB });

/** What a download will be, as the tool states it under the form picker. */
export const outputLine = (t: Sizes, s: Pick<FormSpec, 'width' | 'height' | 'minKB' | 'maxKB' | 'physical' | 'fileName'>) =>
  fmt(s.physical ? t.outputCm : t.output, {
    width: s.width,
    height: s.height,
    ...(s.physical && { w: s.physical.w, h: s.physical.h, dpi: s.physical.dpi }),
    kb: kbRange(t, s),
    named: s.fileName ? fmt(t.named, { file: `${s.fileName}.jpg` }) : '',
  });

/** A report reaches the maintainer, so it is written in English whatever the page's language. */
export function reportHref(en: Messages, spec?: FormSpec) {
  const what = spec ? `${en.exams[examOf(spec).id].name} ${en.specs[spec.id].noun}` : 'a form';
  const body = spec
    ? `The preset says ${spec.width} × ${spec.height} px, ${kbRange(en.sizes, spec)}.\n\nWhat the form asks for now:\n\nLink to the notice:\n`
    : 'Form:\n\nWhat it asks for:\n\nLink to the notice:\n';
  return `mailto:${EMAIL}?subject=${encodeURIComponent(`Spec wrong: ${what}`)}&body=${encodeURIComponent(body)}`;
}
