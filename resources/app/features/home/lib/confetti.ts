import { theme } from '@/theme';
import { noop } from '@/utils/function';

type PieceKind = 'rect' | 'strip' | 'dot';
type PieceState = 'fly' | 'rest' | 'tip' | 'fall';

type LandingCard = {
  element: HTMLElement;
  strayCatchesLeft: number;
};

type Piece = {
  kind: PieceKind;
  color: string;
  lander: LandingCard | null;
  x: number;
  y: number;
  vx: number;
  vy: number;
  delay: number;
  w: number;
  h: number;
  rot: number;
  rot0: number;
  vr: number;
  flip: number;
  vf: number;
  sway: number;
  vs: number;
  curl: number;
  state: PieceState;
  card: LandingCard | null;
  until: number;
  tipTo: number;
};

type Flight = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  sway: number;
  vs: number;
};

type PlayConfettiOptions = {
  cardElement: HTMLElement;
  otherCardElements: HTMLElement[];
};

const COLORS = ['#0b2bf0', '#f5b301', '#e65be6', '#62d9b4', '#4f60d6', '#74f5cf'];
const PIECE_COUNT = 150;
const GRAVITY = 0.32;
const DRAG = 0.985;
const TERMINAL_SPEED = 2.6;
const SWAY_AMPLITUDE = 1.1;
const STEP_MS = 16.67;
const MAX_STEPS_PER_FRAME = 5;
const STRAY_CATCHES_PER_CARD = 2;

const random = (min: number, max: number) => min + Math.random() * (max - min);

const pickColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

const shade = (hex: string, factor: number) => {
  const value = parseInt(hex.slice(1), 16);
  const channel = (component: number) => Math.round(component * factor);

  return `rgb(${channel(value >> 16)},${channel((value >> 8) & 255)},${channel(value & 255)})`;
};

const findLandingX = (start: Flight, topY: number) => {
  let { x, y, vx, vy, sway } = start;

  for (let step = 0; step < 900; step++) {
    vy += GRAVITY;
    vx *= DRAG;
    vy *= DRAG;

    if (vy > TERMINAL_SPEED) {
      vy = TERMINAL_SPEED;
    }

    sway += start.vs;

    const nextX = x + vx + (vy > 0 ? Math.sin(sway) * SWAY_AMPLITUDE : 0);
    const nextY = y + vy;

    if (vy > 0 && y < topY && nextY >= topY) {
      return nextX;
    }

    x = nextX;
    y = nextY;
  }

  return null;
};

type AimTarget = {
  originX: number;
  originY: number;
  targetX: number;
  topY: number;
  fromLeft: boolean;
  sway: number;
  vs: number;
};

const aimAt = (target: AimTarget) => {
  const { originX, originY, targetX, topY, fromLeft, sway, vs } = target;
  let speed = 24;

  for (let tries = 0; tries < 7; tries++, speed += 5) {
    let low = 50;
    let high = 89.5;

    for (let iteration = 0; iteration < 22; iteration++) {
      const middle = (low + high) / 2;
      const angle = (middle * Math.PI) / 180;
      const vx = Math.cos(angle) * speed * (fromLeft ? 1 : -1);
      const vy = -Math.sin(angle) * speed;
      const landingX = findLandingX({ x: originX, y: originY, vx, vy, sway, vs }, topY);

      if (landingX === null) {
        low = middle;
        continue;
      }

      const distance = fromLeft ? landingX - targetX : targetX - landingX;

      if (Math.abs(distance) < 6) {
        return { vx, vy };
      }

      if (distance > 0) {
        low = middle;
      } else {
        high = middle;
      }
    }
  }

  return null;
};

const createBurstPieces = (width: number, height: number) => {
  const pieces: Piece[] = [];

  for (let index = 0; index < PIECE_COUNT; index++) {
    const fromLeft = index % 2 === 0;
    const roll = Math.random();
    const kind: PieceKind = roll < 0.7 ? 'rect' : roll < 0.9 ? 'strip' : 'dot';
    const angle = (-random(62, 84) * Math.PI) / 180;
    const speed = random(22, 34);

    pieces.push({
      kind,
      color: pickColor(),
      lander: null,
      x: fromLeft ? random(-10, 20) : width - random(-10, 20),
      y: height + random(0, 20),
      vx: Math.cos(angle) * speed * (fromLeft ? 1 : -1),
      vy: Math.sin(angle) * speed,
      delay: random(0, 9),
      w: kind === 'rect' ? random(6, 11) : kind === 'strip' ? random(14, 20) : random(5, 7),
      h: kind === 'rect' ? random(4, 7) : 3,
      rot: random(0, 6.28),
      rot0: 0,
      vr: random(-0.15, 0.15),
      flip: random(0, 6.28),
      vf: random(0.08, 0.2),
      sway: random(0, 6.28),
      vs: random(0.03, 0.07),
      curl: random(-6, 6),
      state: 'fly',
      card: null,
      until: 0,
      tipTo: 0,
    });
  }

  return pieces;
};

const createLanderPieces = (cards: LandingCard[], width: number, height: number) => {
  const pieces: Piece[] = [];

  cards.forEach((card, cardIndex) => {
    const rect = card.element.getBoundingClientRect();
    const count = cardIndex === 0 ? 3 : 2 + (Math.random() < 0.5 ? 1 : 0);

    for (let index = 0; index < count; index++) {
      const targetX = rect.left + rect.width * random(0.12 + index * 0.3, 0.28 + index * 0.3);
      const fromLeft = targetX < width / 2;
      const originX = fromLeft ? 6 : width - 6;
      const originY = height + 6;
      const sway = random(0, 6.28);
      const vs = random(0.03, 0.05);
      const aim = aimAt({ originX, originY, targetX, topY: rect.top, fromLeft, sway, vs });

      if (!aim) {
        continue;
      }

      const isStrip = index === 2;

      pieces.push({
        kind: isStrip ? 'strip' : 'rect',
        color: pickColor(),
        lander: card,
        x: originX,
        y: originY,
        vx: aim.vx,
        vy: aim.vy,
        delay: 0,
        w: isStrip ? random(16, 20) : random(9, 12),
        h: isStrip ? 3 : random(6, 8),
        rot: random(0, 6.28),
        rot0: 0,
        vr: random(-0.12, 0.12),
        flip: random(0, 6.28),
        vf: random(0.08, 0.18),
        sway,
        vs,
        curl: random(3, 6),
        state: 'fly',
        card: null,
        until: 0,
        tipTo: 0,
      });
    }
  });

  return pieces;
};

const pickOtherCard = (elements: HTMLElement[]) => {
  const visible = elements.filter(
    (element) => element.getBoundingClientRect().top < window.innerHeight - 40,
  );

  if (visible.length === 0) {
    return [];
  }

  return [visible[Math.floor(Math.random() * visible.length)]];
};

const playConfetti = (options: PlayConfettiOptions) => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    return noop;
  }

  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, {
    position: 'fixed',
    inset: '0',
    width: '100vw',
    height: '100vh',
    zIndex: String(theme.zIndex.fullscreen),
    pointerEvents: 'none',
  });
  document.body.appendChild(canvas);

  const pixelRatio = Math.min(2, window.devicePixelRatio || 1);
  let width = 0;
  let height = 0;

  const resize = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * pixelRatio;
    canvas.height = height * pixelRatio;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  };

  resize();
  window.addEventListener('resize', resize);

  const cards: LandingCard[] = [
    options.cardElement,
    ...pickOtherCard(options.otherCardElements),
  ].map((element) => ({ element, strayCatchesLeft: STRAY_CATCHES_PER_CARD }));

  const pieces = [...createBurstPieces(width, height), ...createLanderPieces(cards, width, height)];

  let last = performance.now();
  let accumulated = 0;
  let frame = 0;
  let isStopped = false;
  const startedAt = last;

  const stop = () => {
    if (isStopped) {
      return;
    }

    isStopped = true;
    cancelAnimationFrame(frame);
    canvas.remove();
    window.removeEventListener('resize', resize);
  };

  const tick = (piece: Piece, now: number) => {
    if (piece.delay > 0) {
      piece.delay -= 1;
      return;
    }

    if ((piece.state === 'rest' || piece.state === 'tip') && piece.card) {
      const rect = piece.card.element.getBoundingClientRect();
      piece.y = rect.top - (piece.lander ? 1 : piece.h / 2);

      if (piece.state === 'rest' && now > piece.until) {
        piece.state = 'tip';
        piece.tipTo = piece.rot + (Math.random() < 0.5 ? -1 : 1) * random(0.9, 1.4);
      }

      if (piece.state === 'tip') {
        piece.rot += (piece.tipTo - piece.rot) * 0.12;

        if (Math.abs(piece.tipTo - piece.rot) < 0.08) {
          piece.state = 'fall';
          piece.vy = 0.2;
          piece.vx = Math.sign(piece.tipTo - piece.rot0 || 1) * random(0.1, 0.4);
          piece.vf = random(0.05, 0.12);
        }
      }

      return;
    }

    piece.vy += GRAVITY;
    piece.vx *= DRAG;
    piece.vy *= DRAG;

    if (piece.vy > TERMINAL_SPEED) {
      piece.vy = TERMINAL_SPEED;
    }

    piece.sway += piece.vs;

    const previousY = piece.y;
    piece.x += piece.vx + (piece.vy > 0 ? Math.sin(piece.sway) * SWAY_AMPLITUDE : 0);
    piece.y += piece.vy;
    piece.rot += piece.vr;
    piece.flip += piece.vf;

    if (piece.state !== 'fly' || piece.vy <= 0 || (!piece.lander && piece.kind === 'strip')) {
      return;
    }

    for (const card of cards) {
      if (piece.lander ? piece.lander !== card : card.strayCatchesLeft <= 0) {
        continue;
      }

      const rect = card.element.getBoundingClientRect();
      const margin = piece.lander ? 0 : 14;
      const isOverCard = piece.x > rect.left + margin && piece.x < rect.right - margin;
      const crossesTop = previousY <= rect.top + 2 && piece.y >= rect.top - piece.h - 2;

      if (isOverCard && crossesTop) {
        if (!piece.lander) {
          card.strayCatchesLeft -= 1;
        }

        piece.state = 'rest';
        piece.card = card;
        piece.until = Math.max(now + 900, startedAt + random(3200, 5600));
        piece.rot = piece.kind === 'strip' ? random(-0.15, 0.15) : random(-0.4, 0.4);
        piece.rot0 = piece.rot;
        piece.flip = random(-0.5, 0.5);
        break;
      }
    }
  };

  const draw = (piece: Piece) => {
    context.save();
    context.translate(piece.x, piece.y);
    context.rotate(piece.rot);

    const flipCos = Math.cos(piece.flip);
    const scale = Math.max(0.12, Math.abs(flipCos));
    const color = flipCos < 0 ? shade(piece.color, 0.72) : piece.color;
    context.fillStyle = color;
    context.strokeStyle = color;

    if (piece.kind === 'rect') {
      context.scale(1, scale);
      context.fillRect(-piece.w / 2, -piece.h / 2, piece.w, piece.h);
    } else if (piece.kind === 'dot') {
      context.scale(1, scale);
      context.beginPath();
      context.arc(0, 0, piece.w / 2, 0, 6.28);
      context.fill();
    } else {
      context.scale(scale, 1);
      context.lineWidth = 2.6;
      context.lineCap = 'round';
      context.beginPath();
      context.moveTo(-piece.w / 2, 0);
      context.quadraticCurveTo(0, piece.curl * Math.sin(piece.flip), piece.w / 2, 0);
      context.stroke();
    }

    context.restore();
  };

  const step = (now: number) => {
    if (isStopped) {
      return;
    }

    accumulated = Math.min(accumulated + (now - last) / STEP_MS, MAX_STEPS_PER_FRAME);
    last = now;

    while (accumulated >= 1) {
      for (const piece of pieces) {
        tick(piece, now);
      }

      accumulated -= 1;
    }

    context.clearRect(0, 0, width, height);

    let alive = 0;

    for (const piece of pieces) {
      if (piece.delay > 0) {
        alive++;
        continue;
      }

      if (piece.y < height + 30 && piece.x > -40 && piece.x < width + 40) {
        alive++;
        draw(piece);
      }
    }

    if (alive > 0) {
      frame = requestAnimationFrame(step);
    } else {
      stop();
    }
  };

  frame = requestAnimationFrame(step);

  return stop;
};

export { aimAt, findLandingX, playConfetti };
