# PNG to WebP Converter

A small Next.js app for converting PNG images to WebP. The interface uses a dark theme, previews the uploaded PNG, shows the converted WebP file size after success, and lets the user download the result explicitly instead of auto-downloading it.

## Features

- Drag-and-drop PNG upload
- PNG preview before conversion
- Separate `Convert to WebP` and `Download WebP` actions
- Converted WebP filename and file size shown in the UI
- API route powered by `sharp`
- App metadata, `sitemap.xml`, and `robots.txt` support

## Tech Stack

- Next.js 15
- React 19
- TypeScript
- Sharp

## Getting Started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Run the production server:

```bash
npm run start
```

## Environment

Set `NEXT_PUBLIC_SITE_URL` to your deployed site URL so metadata, `sitemap.xml`, and `robots.txt` use the correct host.

Example:

```bash
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

If this variable is not set, the app falls back to `http://localhost:3000`.

## Project Structure

```text
app/
  api/convert/route.ts
  globals.css
  layout.tsx
  page.tsx
  robots.ts
  sitemap.ts
components/
  converter-client.tsx
lib/
  site.ts
```

## Notes

- `app/page.tsx` is a server component.
- Interactive upload and conversion logic lives in `components/converter-client.tsx`.
- The converter accepts PNG input only.
