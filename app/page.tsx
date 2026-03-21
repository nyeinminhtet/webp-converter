import { ConverterClient } from '@/components/converter-client';

export default function HomePage() {
  return (
    <main className="shell">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Image Converter</span>
          <h1>Convert PNG to JPG or JPG to WebP in one batch workflow.</h1>
          <p className="lead">
            Pick a conversion mode, upload up to five matching files, then
            follow each item from upload to completion before downloading
            individually or as a ZIP.
          </p>

          <div className="feature-list" aria-label="Highlights">
            <span>Batch up to 5 files</span>
            <span>PNG to JPG</span>
            <span>JPG to WebP</span>
          </div>
        </div>

        <ConverterClient />
      </section>

      <footer className="site-footer">
        <p>
          © 2026 Webply. Created by{' '}
          <a
            href="https://github.com/nyeinminhtet"
            target="_blank"
            rel="noreferrer"
            className="creator-link"
          >
            nyeinminhtet
          </a>
          .
        </p>
      </footer>
    </main>
  );
}
