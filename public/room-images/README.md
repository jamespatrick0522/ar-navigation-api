# Imported Room Photos

These 27 JPEG files were downloaded from the publicly shared Drive links in `MINOT34_PUBLIC_LINKS.xlsx`. They contain 25 room photos and two staff portraits.

Keep this directory in the deployed API source. Nest serves the images under `/media/room-images/`. The database stores those public HTTPS image URLs rather than Google Drive preview-page links.

The import data and original source links are in `src/scripts/data/minot34-public-links.json`.

To repeat the non-destructive import with the confirmed staff policy:

```text
npm run seed:minot34-media -- --staff-mode=primary-keep
```

Add `--dry-run` to preview. Existing room IDs, building/floor assignments, and AR routes are preserved. School of Business is added only if missing, with its location marked to be confirmed. Imported staff become primary contacts while existing staff remain active. Repeat runs do not duplicate imported gallery entries or matching people.

The original room names are preserved in the source data; aliases map spelling variants to existing rooms. Source staff spellings are retained, including names that may need later confirmation. Existing longer full names are kept when the source uses a shorter matching name.

Deploy both the API code and this directory for the seeded image URLs to work. Do not run the destructive full demo seed to import media.
