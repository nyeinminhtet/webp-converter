import { ConverterClient } from '@/components/converter-client';

export default function HomePage() {
  return (
    <main className="shell">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Webply</span>
          <h1>Turn up to 5 PNGs into portable WebP files in one step.</h1>
          <p className="lead">
            Queue a small batch, convert everything together, then download each
            file separately or grab the whole set as a ZIP.
          </p>
          <p className="creator-credit">
            Created by{' '}
            <a
              href="https://github.com/nyeinminhtet"
              target="_blank"
              rel="noreferrer"
              className="creator-link"
            >
              nyeinminhtet
            </a>
          </p>

          <div className="feature-list" aria-label="Highlights">
            <span>Up to 5 PNG files</span>
            <span>One-by-one downloads</span>
            <span>Download all as ZIP</span>
          </div>
        </div>

        <ConverterClient />
      </section>
    </main>
  );
}
