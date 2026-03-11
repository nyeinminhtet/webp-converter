import { ConverterClient } from '@/components/converter-client';

export default function HomePage() {
  return (
    <main className="shell">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Fast image workflow</span>
          <h1>Turn heavy PNGs into portable WebP files in one step.</h1>
          <p className="lead">
            Drag in a screenshot, convert it, then download when you are ready.
            No settings maze, no extra screens.
          </p>

          <div className="feature-list" aria-label="Highlights">
            <span>Browser-based upload</span>
            <span>Preview before download</span>
            <span>PNG only, zero guesswork</span>
          </div>
        </div>

        <ConverterClient />
      </section>
    </main>
  );
}
