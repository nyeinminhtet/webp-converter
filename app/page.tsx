import { ConverterClient } from '@/components/converter-client';

export default function HomePage() {
  return (
    <main className="shell">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">PNG to WebP</span>
          <h1>Convert PNG files to WebP in a cleaner batch workflow.</h1>
          <p className="lead">
            Upload up to five PNG files, follow each conversion as it happens,
            and download the results one by one or as a ZIP when ready.
          </p>

          <div className="feature-list" aria-label="Highlights">
            <span>Batch up to 5 files</span>
            <span>Per-file progress</span>
            <span>ZIP download when ready</span>
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
