import { useRef, useEffect } from 'react';

// ── Constants ──────────────────────────────────────────────────
const TILE = 16;
const COLS = 24;
const ROWS = 16;
const SCALE = 3;
const FPS = 12;
const FRAME_MS = 1000 / FPS;

// ── Palette ────────────────────────────────────────────────────
const C = {
  bg: '#2a1f1a',
  floorLight: '#6b4c30',
  floorDark: '#5a3d26',
  wallTop: '#3d2b1a',
  wallFace: '#4a3422',
  wallTrim: '#7a5a3a',
  desk: '#5c3e28',
  deskTop: '#7a5636',
  deskFront: '#4a2f1c',
  deskLeg: '#3d2518',
  monitor: '#1a1a2e',
  monitorScreen: '#0d3b0d',
  monitorScreenLight: '#1a5c1a',
  monitorFrame: '#333',
  chair: '#4a2f1c',
  plant: '#2d5a1e',
  plantDark: '#1f4015',
  plantPot: '#8b5e3c',
  shelf: '#6b4c30',
  shelfBook1: '#c44',
  shelfBook2: '#48c',
  shelfBook3: '#c84',
  shelfBook4: '#6a4',
  carpet: '#3d2244',
  carpetBorder: '#5a3366',
  clockFace: '#ddd',
  clockHand: '#333',
  lampPost: '#666',
  lampLight: '#ffd700',
  crate: '#8b6c42',
  crateDark: '#6b4c22',
};

// ── Agent Definitions ────────────────────────────────────────
const AGENT_DEFS = [
  { id: 'orchestrator', name: 'Maestro',   role: 'Orchestrator', color: '#ff5555', skinTone: '#c68642', hairColor: '#1a1a1a', deskCol: 4,  deskRow: 4 },
  { id: 'planner',      name: 'Stratego',  role: 'Planner',      color: '#55aaff', skinTone: '#f1c27d', hairColor: '#4a2f1c', deskCol: 12, deskRow: 4 },
  { id: 'blog_writer',  name: 'Scribe',    role: 'Writer',       color: '#55ff55', skinTone: '#8d5524', hairColor: '#0a0a0a', deskCol: 4,  deskRow: 10 },
  { id: 'designer',     name: 'Pixel',     role: 'Designer',     color: '#ffaa55', skinTone: '#e0ac69', hairColor: '#6b3a2a', deskCol: 12, deskRow: 10 },
];

// ── Office Map (0=floor, 1=wall, 2=void) ────────────────────
function buildMap() {
  const map = [];
  for (let r = 0; r < ROWS; r++) {
    const row = [];
    for (let c = 0; c < COLS; c++) {
      if (r < 2) row.push(1); // top wall
      else row.push(0);       // floor
    }
    map.push(row);
  }
  return map;
}

// ── Draw Utilities ──────────────────────────────────────────
function drawRect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function drawPixel(ctx, x, y, color) {
  drawRect(ctx, x, y, 1, 1, color);
}

// ── Draw Office Furniture ────────────────────────────────────
function drawDesk(ctx, col, row) {
  const x = col * TILE;
  const y = row * TILE;

  // Desk surface (3 tiles wide, 2 tiles tall)
  drawRect(ctx, x, y, TILE * 3, TILE - 2, C.deskTop);
  drawRect(ctx, x, y + TILE - 2, TILE * 3, TILE, C.deskFront);

  // Desk legs
  drawRect(ctx, x + 1, y + TILE + TILE - 4, 2, 4, C.deskLeg);
  drawRect(ctx, x + TILE * 3 - 3, y + TILE + TILE - 4, 2, 4, C.deskLeg);

  // Desk trim
  drawRect(ctx, x, y + TILE - 3, TILE * 3, 1, C.wallTrim);
}

function drawMonitor(ctx, col, row, screenColor) {
  const x = col * TILE + 5;
  const y = row * TILE - 11;

  // Stand
  drawRect(ctx, x + 5, y + 10, 2, 3, C.monitorFrame);
  drawRect(ctx, x + 3, y + 12, 6, 1, C.monitorFrame);

  // Frame
  drawRect(ctx, x, y, 12, 10, C.monitorFrame);
  // Screen
  drawRect(ctx, x + 1, y + 1, 10, 8, screenColor || C.monitorScreen);

  // Screen reflection
  drawPixel(ctx, x + 2, y + 2, 'rgba(255,255,255,0.15)');
  drawPixel(ctx, x + 3, y + 2, 'rgba(255,255,255,0.1)');
}

function drawChair(ctx, col, row) {
  const x = col * TILE + 4;
  const y = row * TILE + 2;

  // Seat
  drawRect(ctx, x, y + 4, 8, 3, C.chair);
  // Back
  drawRect(ctx, x + 1, y, 6, 4, C.chair);
  // Legs
  drawPixel(ctx, x + 1, y + 7, C.deskLeg);
  drawPixel(ctx, x + 6, y + 7, C.deskLeg);
}

function drawPlant(ctx, col, row) {
  const x = col * TILE + 3;
  const y = row * TILE;

  // Pot
  drawRect(ctx, x + 2, y + 9, 6, 5, C.plantPot);
  drawRect(ctx, x + 1, y + 8, 8, 2, C.plantPot);

  // Plant
  drawRect(ctx, x + 3, y + 4, 4, 5, C.plant);
  drawRect(ctx, x + 1, y + 3, 3, 3, C.plant);
  drawRect(ctx, x + 6, y + 3, 3, 3, C.plant);
  drawPixel(ctx, x + 4, y + 2, C.plant);
  drawPixel(ctx, x + 5, y + 1, C.plantDark);
  drawPixel(ctx, x + 3, y + 5, C.plantDark);
  drawPixel(ctx, x + 6, y + 5, C.plantDark);
}

function drawShelf(ctx, col, row) {
  const x = col * TILE;
  const y = row * TILE;

  // Shelf structure (2 tiles wide)
  drawRect(ctx, x, y, TILE * 2, TILE * 2, C.shelf);
  drawRect(ctx, x + 1, y + 1, TILE * 2 - 2, 6, '#5a3d26');
  drawRect(ctx, x + 1, y + 9, TILE * 2 - 2, 6, '#5a3d26');

  // Books top row
  const books1 = [C.shelfBook1, C.shelfBook2, C.shelfBook3, C.shelfBook4, C.shelfBook1, C.shelfBook3];
  books1.forEach((c, i) => {
    drawRect(ctx, x + 2 + i * 4, y + 2, 3, 5, c);
  });

  // Books bottom row
  const books2 = [C.shelfBook4, C.shelfBook2, C.shelfBook1, C.shelfBook3, C.shelfBook2, C.shelfBook4];
  books2.forEach((c, i) => {
    drawRect(ctx, x + 2 + i * 4, y + 10, 3, 5, c);
  });
}

function drawCrate(ctx, col, row) {
  const x = col * TILE;
  const y = row * TILE;

  drawRect(ctx, x + 1, y + 2, 14, 12, C.crate);
  drawRect(ctx, x + 2, y + 3, 12, 10, C.crateDark);
  // Cross planks
  drawRect(ctx, x + 1, y + 7, 14, 1, C.crate);
  drawRect(ctx, x + 7, y + 2, 2, 12, C.crate);
}

function drawClock(ctx, col, row, time) {
  const x = col * TILE + 3;
  const y = row * TILE + 2;

  // Clock body
  drawRect(ctx, x, y, 10, 10, '#5a3d26');
  drawRect(ctx, x + 1, y + 1, 8, 8, C.clockFace);

  // Clock center
  drawPixel(ctx, x + 4, y + 4, C.clockHand);
  drawPixel(ctx, x + 5, y + 4, C.clockHand);

  // Hour hand
  const hAngle = ((time / 3600) % 12) / 12 * Math.PI * 2 - Math.PI / 2;
  const hx = Math.round(x + 4.5 + Math.cos(hAngle) * 2);
  const hy = Math.round(y + 4.5 + Math.sin(hAngle) * 2);
  drawPixel(ctx, hx, hy, C.clockHand);

  // Minute hand
  const mAngle = ((time / 60) % 60) / 60 * Math.PI * 2 - Math.PI / 2;
  const mx = Math.round(x + 4.5 + Math.cos(mAngle) * 3);
  const my = Math.round(y + 4.5 + Math.sin(mAngle) * 3);
  drawPixel(ctx, mx, my, '#c44');
}

function drawCarpet(ctx, col, row, w, h) {
  const x = col * TILE;
  const y = row * TILE;
  const pw = w * TILE;
  const ph = h * TILE;

  drawRect(ctx, x, y, pw, ph, C.carpet);
  // Border
  drawRect(ctx, x, y, pw, 1, C.carpetBorder);
  drawRect(ctx, x, y + ph - 1, pw, 1, C.carpetBorder);
  drawRect(ctx, x, y, 1, ph, C.carpetBorder);
  drawRect(ctx, x + pw - 1, y, 1, ph, C.carpetBorder);
}

function drawLamp(ctx, col, row, on) {
  const x = col * TILE + 5;
  const y = row * TILE;

  // Post
  drawRect(ctx, x + 2, y + 4, 2, 10, C.lampPost);
  // Base
  drawRect(ctx, x, y + 13, 6, 2, C.lampPost);
  // Lampshade
  drawRect(ctx, x - 1, y + 1, 8, 4, on ? C.lampLight : '#555');

  if (on) {
    // Glow effect
    ctx.fillStyle = 'rgba(255, 215, 0, 0.05)';
    ctx.fillRect(x - 10, y - 5, 26, 25);
  }
}

// ── Draw Character (Procedural Pixel Art) ────────────────────
function drawCharacter(ctx, x, y, agent, frame, state) {
  const { color, skinTone, hairColor } = agent;
  
  // Bobbing when typing
  const bob = state === 'typing' ? (frame % 2 === 0 ? -1 : 0) : 0;
  const ay = y + bob;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(x + 2, y + 14, 8, 2);

  // Body / shirt
  drawRect(ctx, x + 3, ay + 7, 6, 5, color);
  // Shirt highlight
  drawPixel(ctx, x + 4, ay + 8, lightenColor(color, 30));
  
  // Head
  drawRect(ctx, x + 3, ay + 2, 6, 5, skinTone);
  
  // Hair
  drawRect(ctx, x + 3, ay + 1, 6, 2, hairColor);
  drawPixel(ctx, x + 2, ay + 2, hairColor);
  drawPixel(ctx, x + 9, ay + 2, hairColor);

  // Eyes
  drawPixel(ctx, x + 4, ay + 4, '#1a1a1a');
  drawPixel(ctx, x + 7, ay + 4, '#1a1a1a');

  // Arms (animated when typing)
  if (state === 'typing') {
    const armOff = frame % 2 === 0 ? 0 : 1;
    drawRect(ctx, x + 1, ay + 8 + armOff, 2, 3, skinTone);
    drawRect(ctx, x + 9, ay + 8 + (1 - armOff), 2, 3, skinTone);
  } else if (state === 'walking') {
    const legFrame = frame % 4;
    const lOff = legFrame < 2 ? 0 : 1;
    drawRect(ctx, x + 1, ay + 8 + lOff, 2, 3, skinTone);
    drawRect(ctx, x + 9, ay + 8 + (1 - lOff), 2, 3, skinTone);
  } else {
    // Idle
    drawRect(ctx, x + 1, ay + 8, 2, 3, skinTone);
    drawRect(ctx, x + 9, ay + 8, 2, 3, skinTone);
  }

  // Legs
  drawRect(ctx, x + 4, ay + 12, 2, 3, '#2a2a3a');
  drawRect(ctx, x + 6, ay + 12, 2, 3, '#2a2a3a');

  // Status indicator bubble
  if (state === 'typing') {
    drawBubble(ctx, x + 3, ay - 5, '⌨', color);
  } else if (state === 'reading') {
    drawBubble(ctx, x + 3, ay - 5, '📖', '#55aaff');
  } else if (state === 'waiting') {
    drawBubble(ctx, x + 3, ay - 5, '?', '#ffaa00');
  }
}

function drawBubble(ctx, x, y, _icon, borderColor) {
  // Small speech bubble
  drawRect(ctx, x, y, 7, 5, '#fff');
  drawPixel(ctx, x + 3, y + 5, '#fff');

  // Border
  ctx.fillStyle = borderColor;
  ctx.fillRect(x, y, 7, 1);
  ctx.fillRect(x, y + 4, 7, 1);
  ctx.fillRect(x, y, 1, 5);
  ctx.fillRect(x + 6, y, 1, 5);

  // Dots inside (animated thinking/typing indicator)
  drawPixel(ctx, x + 2, y + 2, borderColor);
  drawPixel(ctx, x + 4, y + 2, borderColor);
}

function lightenColor(hex, amount) {
  const num = parseInt(hex.replace('#', ''), 16);
  let r = Math.min(255, (num >> 16) + amount);
  let g = Math.min(255, ((num >> 8) & 0xff) + amount);
  let b = Math.min(255, (num & 0xff) + amount);
  return `rgb(${r},${g},${b})`;
}

// ── Monitor Screen Animation ─────────────────────────────────
function drawActiveScreen(ctx, col, row, frame, agentColor) {
  const x = col * TILE + 6;
  const y = row * TILE - 10;

  // Typing cursor blinks
  const cursorOn = frame % 4 < 2;
  
  // Code lines
  const lineColors = ['#4a8', '#88c', '#cc8', '#4a8'];
  for (let i = 0; i < 4; i++) {
    const lw = 3 + (i * 2) % 5;
    drawRect(ctx, x, y + i * 2, lw, 1, lineColors[i]);
  }

  if (cursorOn) {
    drawPixel(ctx, x + 6, y + 6, agentColor);
  }
}

// ── Main Component ───────────────────────────────────────────
export default function PixelOffice({ agentStatuses = {}, onAgentClick }) {
  const canvasRef = useRef(null);
  const frameRef = useRef(0);
  const animRef = useRef(null);
  const lastFrameTime = useRef(0);
  const statusesRef = useRef(agentStatuses);
  const onClickRef = useRef(onAgentClick);

  // Keep refs in sync without triggering re-renders
  statusesRef.current = agentStatuses;
  onClickRef.current = onAgentClick;

  function getAgentState(agentId) {
    const status = statusesRef.current[agentId];
    if (!status) return 'idle';
    if (status === 'in_progress') return 'typing';
    if (status === 'in_review')   return 'waiting';
    if (status === 'reading')     return 'reading';
    return 'idle';
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const W = COLS * TILE;
    const H = ROWS * TILE;
    canvas.width = W;
    canvas.height = H;

    function renderFrame(frame) {
      const now = Date.now() / 1000;

      // Background
      drawRect(ctx, 0, 0, W, H, C.bg);

      // ── Floor ──
      for (let r = 2; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const isLight = (r + c) % 2 === 0;
          drawRect(ctx, c * TILE, r * TILE, TILE, TILE, isLight ? C.floorLight : C.floorDark);
        }
      }

      // ── Wall ──
      drawRect(ctx, 0, 0, W, TILE * 2, C.wallTop);
      drawRect(ctx, 0, TILE, W, TILE, C.wallFace);
      drawRect(ctx, 0, TILE * 2 - 1, W, 2, C.wallTrim);

      // ── Carpets ──
      drawCarpet(ctx, 3, 3, 5, 5);
      drawCarpet(ctx, 11, 3, 5, 5);
      drawCarpet(ctx, 3, 9, 5, 5);
      drawCarpet(ctx, 11, 9, 5, 5);

      // ── Shelves on wall ──
      drawShelf(ctx, 2, 0);
      drawShelf(ctx, 6, 0);
      drawShelf(ctx, 14, 0);
      drawShelf(ctx, 18, 0);

      // ── Clock ──
      drawClock(ctx, 10, 0, now);

      // ── Crates / decoration ──
      drawCrate(ctx, 20, 3);
      drawCrate(ctx, 21, 4);
      drawCrate(ctx, 20, 10);

      // ── Plants ──
      drawPlant(ctx, 0, 3);
      drawPlant(ctx, 9, 3);
      drawPlant(ctx, 17, 3);
      drawPlant(ctx, 0, 9);
      drawPlant(ctx, 9, 9);
      drawPlant(ctx, 17, 9);
      drawPlant(ctx, 0, 14);
      drawPlant(ctx, 9, 14);

      // ── Lamps ──
      drawLamp(ctx, 22, 2, true);
      drawLamp(ctx, 22, 9, true);

      // ── Draw desks, monitors, chairs & agents ──
      AGENT_DEFS.forEach((agent) => {
        const state = getAgentState(agent.id);

        drawChair(ctx, agent.deskCol + 1, agent.deskRow + 2);
        drawDesk(ctx, agent.deskCol, agent.deskRow);

        const screenColor = state === 'typing' || state === 'reading'
          ? C.monitorScreenLight : C.monitorScreen;
        drawMonitor(ctx, agent.deskCol + 1, agent.deskRow, screenColor);

        if (state === 'typing' || state === 'reading') {
          drawActiveScreen(ctx, agent.deskCol + 1, agent.deskRow, frame, agent.color);
        }

        if (agent.id === 'designer') {
          drawMonitor(ctx, agent.deskCol + 2, agent.deskRow,
            state !== 'idle' ? '#2a1a3a' : C.monitorScreen);
        }

        drawRect(ctx, agent.deskCol * TILE + TILE * 2 + 6, agent.deskRow * TILE - 2, 3, 4, '#e8d5b7');
        drawRect(ctx, agent.deskCol * TILE + TILE * 2 + 5, agent.deskRow * TILE - 2, 5, 1, '#e8d5b7');

        const charX = agent.deskCol * TILE + TILE + 1;
        const charY = agent.deskRow * TILE + TILE + 6;
        drawCharacter(ctx, charX, charY, agent, frame, state);
      });

      // ── Window ──
      drawRect(ctx, 21 * TILE, 0, TILE * 3, TILE * 2, '#1a2a3a');
      drawRect(ctx, 21 * TILE + 2, 2, TILE * 3 - 4, TILE * 2 - 4, '#2a4a6a');
      drawRect(ctx, 21 * TILE + TILE + 6, 2, 2, TILE * 2 - 4, '#5a3d26');
      drawRect(ctx, 21 * TILE + 2, TILE - 1, TILE * 3 - 4, 2, '#5a3d26');
      drawPixel(ctx, 22 * TILE, 5, '#fff');
      drawPixel(ctx, 23 * TILE - 3, 8, '#ffd700');
      drawPixel(ctx, 22 * TILE + 4, 3, '#aaf');

      // ── Floor details ──
      ctx.fillStyle = 'rgba(0,0,0,0.03)';
      [
        [3, 8], [7, 10], [15, 6], [19, 11], [11, 8], [8, 5], [16, 12],
      ].forEach(([c, r]) => {
        ctx.fillRect(c * TILE + 3, r * TILE + 5, 4, 2);
      });
    }

    function loop(timestamp) {
      if (timestamp - lastFrameTime.current >= FRAME_MS) {
        lastFrameTime.current = timestamp;
        frameRef.current++;
        renderFrame(frameRef.current);
      }
      animRef.current = requestAnimationFrame(loop);
    }

    animRef.current = requestAnimationFrame(loop);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Click handling - detect which agent was clicked
  const handleClick = (e) => {
    if (!onClickRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    for (const agent of AGENT_DEFS) {
      const ax = agent.deskCol * TILE;
      const ay = agent.deskRow * TILE;
      if (mx >= ax && mx < ax + TILE * 3 && my >= ay && my < ay + TILE * 4) {
        onClickRef.current(agent.id);
        return;
      }
    }
  };

  return (
    <div className="pixel-office-wrapper" id="pixel-office">
      <canvas
        ref={canvasRef}
        className="pixel-office-canvas"
        onClick={handleClick}
        style={{
          width: COLS * TILE * SCALE,
          height: ROWS * TILE * SCALE,
          imageRendering: 'pixelated',
          cursor: 'pointer',
        }}
      />
    </div>
  );
}
