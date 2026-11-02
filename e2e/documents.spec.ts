import { mkdirSync, readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

// The print PDFs and a screenshot per case land here, so a run can be re-inspected by hand.
const ARTIFACTS = 'test-results/artifacts';
mkdirSync(ARTIFACTS, { recursive: true });

// Made-up GSTINs with valid check characters; 27AAPFU0939F1ZV is the widely used sample one.
const MAHARASHTRA = '27AAPFU0939F1ZV';
const MAHARASHTRA_BUYER = '27ABCDE1234F1Z0';
const KARNATAKA_BUYER = '29ABCDE1234F1ZW';
const CHANDIGARH = '04AAPFU0939F1Z3';
const CHANDIGARH_BUYER = '04ABCDE1234F1Z8';

/** Counts window.print() calls instead of opening a dialog the test can't close. */
async function stubPrint(page: Page) {
  await page.addInitScript(() => {
    (window as unknown as { printed: number }).printed = 0;
    window.print = () => void (window as unknown as { printed: number }).printed++;
  });
}
const printed = (page: Page) => page.evaluate(() => (window as unknown as { printed: number }).printed);

/** Saves the print rendering as a PDF and returns its page count. The form must be gone from it. */
async function printPdf(page: Page, name: string, form: string) {
  await page.screenshot({ path: `${ARTIFACTS}/${name}.png`, fullPage: true });
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator(form)).toBeHidden();
  await expect(page.locator('header.top')).toBeHidden();
  const path = `${ARTIFACTS}/${name}.pdf`;
  await page.pdf({ path, format: 'A4' });
  await page.emulateMedia({ media: 'screen' });
  return readFileSync(path, 'latin1').match(/\/Type\s*\/Page\b/g)!.length;
}

test.describe('rent receipts', () => {
  const receipts = (page: Page) => page.locator('.receipt');
  // The screen previews only the first receipts; every one prints, so count what each would print.
  const stamps = (page: Page) => page.locator('.receipt .stamp:not([hidden])');

  test.beforeEach(async ({ page }) => {
    await stubPrint(page);
    await page.goto('/tools/rent-receipt/');
    await page.fill('#tenant', 'Priya Sharma');
    await page.fill('#landlord', 'Rajesh Gupta');
    await page.fill('#address', 'Flat 402, Sunrise Apartments,\nIndiranagar, Bengaluru 560038');
  });

  test('a financial year gives twelve receipts that print four to an A4 page', async ({ page }) => {
    await page.fill('#rent', '25000');
    await page.fill('#pan', 'ABCPG1234K');
    await page.fill('#from', '2026-04');
    await page.fill('#to', '2027-03');
    await expect(receipts(page)).toHaveCount(12);
    await expect(page.locator('#summary')).toHaveText('12 receipts, ₹3,00,000.00 in all.');
    const first = receipts(page).first();
    await expect(first).toContainText('No. R-2026-04');
    await expect(first).toContainText('the sum of ₹25,000.00 (Rupees Twenty Five Thousand Only) by cash');
    await expect(first).toContainText('Flat 402, Sunrise Apartments, Indiranagar, Bengaluru 560038');
    await expect(first).toContainText('1 April 2026 to 30 April 2026');
    await expect(first).toContainText('PAN ABCPG1234K');
    await expect(receipts(page).last()).toContainText('1 March 2027 to 31 March 2027');

    await page.getByRole('button', { name: 'Print or save as PDF' }).click();
    expect(await printed(page)).toBe(1);
    expect(await printPdf(page, 'rent-receipts-fy', '#tool')).toBe(3);
  });

  test('a range across a year end and a leap February counts its months', async ({ page }) => {
    await page.fill('#rent', '9000');
    await page.fill('#from', '2027-11');
    await page.fill('#to', '2028-02');
    await expect(receipts(page)).toHaveCount(4);
    await expect(receipts(page).last()).toContainText('1 February 2028 to 29 February 2028');
    await page.fill('#to', '2027-10');
    await expect(page.locator('#range-error')).toHaveText('The To month must be the same as or after the From month.');
    await expect(receipts(page)).toHaveCount(0);
  });

  test('the revenue stamp box shows only for cash over ₹5,000', async ({ page }) => {
    await page.fill('#from', '2026-04');
    await page.fill('#to', '2026-06');
    await page.fill('#rent', '5000');
    await expect(receipts(page)).toHaveCount(3);
    await expect(stamps(page)).toHaveCount(0);
    await page.fill('#rent', '5000.01');
    await expect(stamps(page)).toHaveCount(3);
    for (const mode of ['UPI', 'bank transfer', 'cheque']) {
      await page.locator('#mode').selectOption(mode);
      await expect(stamps(page)).toHaveCount(0);
      await expect(receipts(page).first()).toContainText(`by ${mode},`);
    }
  });

  test('lakh amounts are written out in words, with paise', async ({ page }) => {
    await page.fill('#from', '2026-04');
    await page.fill('#to', '2026-04');
    await page.fill('#rent', '1,25,000');
    await expect(receipts(page)).toContainText('₹1,25,000.00 (Rupees One Lakh Twenty Five Thousand Only)');
    await page.fill('#rent', '105000.50');
    await expect(receipts(page)).toContainText('₹1,05,000.50 (Rupees One Lakh Five Thousand and Fifty Paise Only)');
  });

  test('missing details and a bad PAN stop the print and are listed', async ({ page }) => {
    await page.fill('#tenant', '');
    await page.fill('#pan', 'ABCDE12345');
    await page.getByRole('button', { name: 'Print or save as PDF' }).click();
    await expect(page.locator('#problems')).toContainText("Enter the tenant's name.");
    await expect(page.locator('#problems')).toContainText('Enter the monthly rent.');
    await expect(page.locator('#problems')).toContainText('A PAN is 5 letters, 4 digits and a letter');
    await expect(page.locator('#tenant')).toBeFocused();
    expect(await printed(page)).toBe(0);
  });

  test('names and address are remembered for next time', async ({ page }) => {
    await page.reload();
    await expect(page.locator('#tenant')).toHaveValue('Priya Sharma');
    await expect(page.locator('#landlord')).toHaveValue('Rajesh Gupta');
    await expect(page.locator('#address')).toHaveValue('Flat 402, Sunrise Apartments,\nIndiranagar, Bengaluru 560038');
  });
});

test.describe('GST invoice', () => {
  const sheet = (page: Page) => page.locator('.invoice');
  const total = (page: Page, label: string) =>
    page.locator('.totals > div').filter({ has: page.getByText(label, { exact: true }) }).locator('dd');

  async function fill(page: Page, supplier: string, buyer: string) {
    await page.fill('#s-name', 'Sharma Electronics');
    await page.fill('#s-gstin', supplier);
    await page.fill('#s-address', 'Shop 14, Lamington Road, Mumbai 400007');
    await page.fill('#c-name', 'Kaveri Traders');
    await page.fill('#c-gstin', buyer);
    await page.fill('#c-address', '22 MG Road, Bengaluru 560001');
    await page.fill('#no', 'INV/2026-27/014');
    // 3 × ₹1,234.56 at 18% and 1 × ₹99.99 at 5%: taxable ₹3,803.67.
    const rows = page.locator('#items > fieldset');
    await rows.last().locator('[data-k=desc]').fill('LED monitor');
    await rows.last().locator('[data-k=hsn]').fill('8528');
    await rows.last().locator('[data-k=qty]').fill('3');
    await rows.last().locator('[data-k=rate]').fill('1234.56');
    await page.getByRole('button', { name: 'Add item' }).click();
    await rows.last().locator('[data-k=desc]').fill('HDMI cable');
    await rows.last().locator('[data-k=rate]').fill('99.99');
    await rows.last().locator('[data-k=gst]').selectOption('5');
  }

  test.beforeEach(async ({ page }) => {
    await stubPrint(page);
    await page.goto('/tools/gst-invoice/');
  });

  test('a sale within Maharashtra charges CGST and SGST at half the rate', async ({ page }) => {
    await fill(page, MAHARASHTRA, MAHARASHTRA_BUYER);
    await expect(page.locator('#pos')).toHaveValue('27');
    // 18% of 3,703.68 is 666.6624, so 333.33 each; 5% of 99.99 is 4.9995, so 2.50 each.
    const taxes = sheet(page).locator('.taxes tbody tr');
    await expect(taxes.nth(0).locator('td')).toHaveText(['5%', '₹99.99', '₹2.50 @ 2.5%', '₹2.50 @ 2.5%', '₹5.00']);
    await expect(taxes.nth(1).locator('td')).toHaveText(['18%', '₹3,703.68', '₹333.33 @ 9%', '₹333.33 @ 9%', '₹666.66']);
    await expect(total(page, 'Taxable value')).toHaveText('₹3,803.67');
    await expect(total(page, 'CGST')).toHaveText('₹335.83');
    await expect(total(page, 'SGST')).toHaveText('₹335.83');
    await expect(total(page, 'IGST')).toHaveCount(0);
    await expect(total(page, 'Round off')).toHaveText('-₹0.33');
    await expect(total(page, 'Total')).toHaveText('₹4,475.00');
    await expect(sheet(page)).toContainText('Rupees Four Thousand Four Hundred Seventy Five Only');

    await page.getByRole('button', { name: 'Print or save as PDF' }).click();
    expect(await printed(page)).toBe(1);
    expect(await printPdf(page, 'gst-invoice-intra-state', '#tool')).toBe(1);
  });

  test('a sale from Maharashtra to Karnataka charges IGST at the full rate', async ({ page }) => {
    await fill(page, MAHARASHTRA, KARNATAKA_BUYER);
    await expect(page.locator('#pos')).toHaveValue('29');
    await expect(sheet(page)).toContainText('Karnataka (29)');
    const taxes = sheet(page).locator('.taxes tbody tr');
    await expect(taxes.nth(0).locator('td')).toHaveText(['5%', '₹99.99', '₹5.00', '₹5.00']);
    await expect(taxes.nth(1).locator('td')).toHaveText(['18%', '₹3,703.68', '₹666.66', '₹666.66']);
    await expect(total(page, 'IGST')).toHaveText('₹671.66');
    await expect(total(page, 'CGST')).toHaveCount(0);
    await expect(total(page, 'Total')).toHaveText('₹4,475.00');
    expect(await printPdf(page, 'gst-invoice-inter-state', '#tool')).toBe(1);

    // Goods delivered inside Maharashtra make it intra-state, whatever the buyer's GSTIN says.
    await page.locator('#pos').selectOption('27');
    await expect(total(page, 'CGST')).toHaveText('₹335.83');
    await expect(total(page, 'IGST')).toHaveCount(0);
  });

  test('a sale within Chandigarh charges UTGST in place of SGST', async ({ page }) => {
    await fill(page, CHANDIGARH, CHANDIGARH_BUYER);
    await expect(total(page, 'UTGST')).toHaveText('₹335.83');
    await expect(total(page, 'SGST')).toHaveCount(0);
  });

  test('under reverse charge the customer is billed the taxable value only', async ({ page }) => {
    await fill(page, MAHARASHTRA, KARNATAKA_BUYER);
    await page.locator('#rc').selectOption('yes');
    await expect(total(page, 'Total')).toHaveText('₹3,804.00');
    await expect(sheet(page)).toContainText('GST of ₹671.66 on this invoice is payable by the recipient under reverse charge.');
  });

  test('crore amounts are written out in words', async ({ page }) => {
    await fill(page, MAHARASHTRA, KARNATAKA_BUYER);
    await page.locator('#items > fieldset').last().locator('[data-k=remove]').click();
    const row = page.locator('#items > fieldset').first();
    await row.locator('[data-k=qty]').fill('1');
    await row.locator('[data-k=rate]').fill('12345678.90');
    await row.locator('[data-k=gst]').selectOption('0');
    await expect(total(page, 'Total')).toHaveText('₹1,23,45,679.00');
    await expect(sheet(page)).toContainText(
      'Rupees One Crore Twenty Three Lakh Forty Five Thousand Six Hundred Seventy Nine Only',
    );
  });

  test('a GSTIN with a wrong check character is rejected', async ({ page }) => {
    await fill(page, '27AAPFU0939F1ZW', KARNATAKA_BUYER);
    await expect(page.locator('#s-gstin-error')).toHaveText('The last character does not match. Check the GSTIN for a typo.');
    await expect(page.locator('#s-state')).toBeHidden();
    await page.getByRole('button', { name: 'Print or save as PDF' }).click();
    await expect(page.locator('#problems')).toContainText('The last character does not match');
    expect(await printed(page)).toBe(0);
  });

  test('missing fields and an over-long invoice number stop the print', async ({ page }) => {
    await page.fill('#no', 'INV/2026-27/00001');
    await expect(page.locator('#no-error')).toHaveText(
      'An invoice number can have at most 16 characters (Rule 46). This one has 17.',
    );
    await page.getByRole('button', { name: 'Print or save as PDF' }).click();
    const problems = page.locator('#problems');
    for (const text of [
      'Enter your business name.',
      'Enter your GSTIN.',
      "Enter the customer's name.",
      'Choose the place of supply.',
      'An invoice number can have at most 16 characters',
      'Item 1: enter a description.',
      'Item 1: enter the rate.',
    ])
      await expect(problems).toContainText(text);
    await expect(page.locator('#s-name')).toBeFocused();
    expect(await printed(page)).toBe(0);

    // Fixing a field takes it off the list as you type.
    await page.fill('#s-name', 'Sharma Electronics');
    await expect(problems).not.toContainText('Enter your business name.');
  });

  test('your business details are remembered for next time', async ({ page }) => {
    await fill(page, MAHARASHTRA, KARNATAKA_BUYER);
    await page.fill('#upi', 'sharma@upi');
    await page.reload();
    await expect(page.locator('#s-name')).toHaveValue('Sharma Electronics');
    await expect(page.locator('#s-gstin')).toHaveValue(MAHARASHTRA);
    await expect(page.locator('#upi')).toHaveValue('sharma@upi');
    await expect(page.locator('#c-name')).toHaveValue('');
  });
});

test('neither page scrolls sideways on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ['/tools/rent-receipt/', '/tools/gst-invoice/']) {
    await page.goto(path);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  }
});
