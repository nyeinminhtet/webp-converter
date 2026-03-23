import { ConverterClient } from '@/components/converter-client';

export default function HomePage() {
  return (
    <main className="shell">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Image Converter</span>
          <h1>Choose the image extension you want and convert in one batch workflow.</h1>
          <p className="lead">
            Upload PNG, JPG, or WebP files, pick the output extension you want,
            then follow each item through conversion before downloading files
            one by one or as a ZIP.
          </p>

          <div className="feature-list" aria-label="Highlights">
            <span>Batch up to 5 files</span>
            <span>Convert to JPG</span>
            <span>Convert to PNG</span>
            <span>Convert to WebP</span>
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
