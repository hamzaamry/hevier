import { MALE_BACK, MALE_FRONT, type BodyDiagram } from '@musclemap/assets';
import { compactPath } from '@/lib/compact-path';

// Path data from @musclemap/assets (MIT, https://github.com/Jsplice/MuscleMap), the same body
// the app draws, rewritten as whole-unit relative paths. Every path is written once in BodyDefs
// and each figure on the page is a <use> of it, so a figure only costs a few bytes. Fills read
// --f-GROUP custom properties, which inherit into the <use> from the figure's wrapper.
export type BodyView = 'front' | 'back';

const DIAGRAMS: Record<BodyView, BodyDiagram> = { front: MALE_FRONT, back: MALE_BACK };

function ViewDefs({ view }: { view: BodyView }) {
  const diagram = DIAGRAMS[view];
  const muscles = diagram.muscles.map((muscle, index) => ({ ...muscle, key: `${view}-${index}` }));
  return (
    <>
      {diagram.outline.map((part) => (
        <path key={part.id} id={`hv-${view}-outline-${part.id}`} d={compactPath(part.d)} />
      ))}
      {muscles.map((m) => (
        <path key={m.key} id={`hv-m-${m.key}`} d={compactPath(m.d)} />
      ))}
      <g id={`hv-${view}`}>
        {diagram.outline.map((part) => (
          <use key={part.id} href={`#hv-${view}-outline-${part.id}`} className="body-outline" />
        ))}
        {muscles.map((m) => (
          <use key={m.key} href={`#hv-m-${m.key}`} className="m" style={{ fill: `var(--f-${m.group})` }} />
        ))}
        {muscles.map((m) => (
          <use key={`${m.key}-g`} href={`#hv-m-${m.key}`} className="gloss" fill="url(#hv-shine)" />
        ))}
      </g>
      <g id={`hv-${view}-halo`}>
        {muscles.map((m) => (
          <use key={m.key} href={`#hv-m-${m.key}`} />
        ))}
      </g>
    </>
  );
}

export function BodyDefs() {
  return (
    <svg width="0" height="0" aria-hidden focusable="false" className="defs-svg">
      <defs>
        <linearGradient id="hv-shine" x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.6" />
          <stop offset="0.45" stopColor="#fff" stopOpacity="0.04" />
          <stop offset="1" stopColor="#0a1030" stopOpacity="0.22" />
        </linearGradient>
        <ViewDefs view="front" />
        <ViewDefs view="back" />
      </defs>
    </svg>
  );
}
