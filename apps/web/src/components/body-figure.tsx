const VIEWBOX = '195 60 634 1390';

export type BodyView = 'front' | 'back';

interface BodyProps {
  view: BodyView;
  className?: string;
}

// A figure is a <use> of the paths written once in BodyDefs, so it adds almost nothing to the page.
export function Body({ view, className }: BodyProps) {
  return (
    <svg viewBox={VIEWBOX} className={`body ${className ?? ''}`} aria-hidden focusable="false">
      <use href={`#hv-${view}`} />
    </svg>
  );
}

// A blurred, single-colour copy of the muscles, used as a halo behind a figure.
export function Halo({ view, className }: BodyProps) {
  return (
    <svg viewBox={VIEWBOX} className={`body halo ${className ?? ''}`} aria-hidden focusable="false">
      <use href={`#hv-${view}-halo`} />
    </svg>
  );
}
