# Contributing

Bug reports, changed form rules and pull requests are all welcome.

## Reporting a problem

[Open an issue](https://github.com/manyxlabs/photo-resizer/issues/new) with the exam or form, the file type you used and what went wrong.
Photos stay in your browser, so describe the image rather than attaching a personal photo.
If an exam's size rules have changed, link the official notice that says so.

## Sending a change

1. Fork the repository and create a branch from `main`.
2. Run `npm install`, then `npm run dev` to work on it locally.
3. Make the change, then run `npm run check` and `npm run test:e2e` and fix anything they report.
4. Open a pull request that says what changed and why, with a screenshot for anything visible.

A new or changed preset goes in `src/data/formSpecs.ts` with a link to the official source it comes from.
Keep each pull request to one change.
