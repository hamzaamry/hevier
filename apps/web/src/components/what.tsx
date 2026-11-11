const FACTS = [
  { n: '5,500+', label: 'exercises with muscles and instructions' },
  { n: '4', label: 'home-screen widgets' },
  { n: '0', label: 'accounts, ads or trackers' },
  { n: 'AGPL-3.0', label: 'open source, read every line' },
];

export function What() {
  return (
    <section id="what" data-section="what" className="section what" aria-labelledby="what-title">
      <div className="wrap">
        <h2 id="what-title" className="eyebrow">
          What it is
        </h2>
        <p className="statement" data-reveal>
          Hevier is a free workout tracker.
          <span>
            It shows which muscles have recovered, counts the sets that build muscle, and keeps everything on your
            phone.
          </span>
        </p>
        <dl className="facts" data-reveal>
          {FACTS.map((fact) => (
            <div key={fact.n}>
              <dt>{fact.n}</dt>
              <dd>{fact.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
