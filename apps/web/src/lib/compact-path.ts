// Rewrites absolute M, L, C, Z path data as whole-unit relative commands. The body map
// ships twice in the page (HTML and the React payload), so every byte here counts.
export function compactPath(d: string): string {
  const tokens = d.match(/[MLCZ]|-?\d*\.?\d+/g) ?? [];
  let i = 0;
  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;
  let last = '';
  let out = '';

  const isNumber = () => i < tokens.length && !/^[MLCZ]$/.test(tokens[i]);
  const next = () => Math.round(Number.parseFloat(tokens[i++]));

  const emit = (cmd: string, nums: number[]) => {
    const same = cmd === last;
    last = cmd;
    out += same ? '' : cmd;
    nums.forEach((n, index) => {
      const separator = index === 0 && !same ? '' : n < 0 ? '' : out === '' ? '' : ',';
      out += `${separator}${n}`;
    });
  };

  while (i < tokens.length) {
    const cmd = tokens[i++];
    if (cmd === 'Z') {
      emit('z', []);
      x = startX;
      y = startY;
      continue;
    }
    let first = true;
    while (isNumber()) {
      if (cmd === 'C') {
        const [x1, y1, x2, y2, nx, ny] = [next(), next(), next(), next(), next(), next()];
        emit('c', [x1 - x, y1 - y, x2 - x, y2 - y, nx - x, ny - y]);
        x = nx;
        y = ny;
      } else {
        const [nx, ny] = [next(), next()];
        if (cmd === 'M' && first) {
          emit('M', [nx, ny]);
          startX = nx;
          startY = ny;
        } else {
          emit('l', [nx - x, ny - y]);
        }
        x = nx;
        y = ny;
      }
      first = false;
    }
  }
  return out;
}
