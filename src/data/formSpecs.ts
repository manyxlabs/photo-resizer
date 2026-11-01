export type FormSpec = {
  id: string;
  label: string;
  width: number;
  height: number;
  minKB: number;
  maxKB: number;
  /** Signatures and thumbs are scans on white paper, so the background clean-up starts on. */
  scan: boolean;
};

// From IBPS notifications (Annexure: guidelines for scanning and upload of documents),
// the same for PO, Clerk and RRB. Pixel sizes there are "preferred"; KB ranges are hard limits.
export const formSpecs: FormSpec[] = [
  { id: 'ibps-photo', label: 'IBPS / bank exams: photo', width: 200, height: 230, minKB: 20, maxKB: 50, scan: false },
  { id: 'ibps-sign', label: 'IBPS / bank exams: signature', width: 140, height: 60, minKB: 10, maxKB: 20, scan: true },
  { id: 'ibps-thumb', label: 'IBPS / bank exams: left thumb', width: 240, height: 240, minKB: 20, maxKB: 50, scan: true },
];

export const SPECS_CHECKED = 'November 2026';
