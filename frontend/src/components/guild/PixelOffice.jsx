import { useRef, useEffect } from 'react';

// ── Constants ──────────────────────────────────────────────────
const TILE = 16;
const COLS = 28;
const ROWS = 18;
const SCALE = 3;
const FPS = 8;
const FRAME_MS = 1000 / FPS;

// ── Sprite Config ──────────────────────────────────────────────
// MetroCity spritesheets: 32x32 per frame
const SPRITE_W = 32;
const SPRITE_H = 32;

// Character Model.png: 768x192 → 24 cols x 6 rows
// Layout per direction: 6 frames (idle + 5 walk)
//   Columns 0-5:   Walk Down  (col 0 = idle, col 1-5 = walk)
//   Columns 6-11:  Walk Left  (col 6 = idle, col 7-11 = walk)
//   Columns 12-17: Walk Right (col 12 = idle, col 13-17 = walk)
//   Columns 18-23: Walk Up    (col 18 = idle, col 19-23 = walk)
const DIR_COL_OFFSET = { down: 0, left: 6, right: 12, up: 18 };
const WALK_FRAMES = [1, 2, 3, 4, 5]; // 5 walk frames per direction (skip idle frame 0)
const IDLE_FRAME = 0;

// ── Agent Definitions ───────────────────────────────────────
const AGENT_DEFS = [
  {
    id: 'orchestrator', name: 'Maestro',
    color: '#ff5555',
    skinRow: 0,   // Row in character_model.png
    hairRow: 6,   // Row in hairs.png (dark hair)
    outfit: 1,    // Outfit file number
    deskCol: 3, deskRow: 4,
  },
  {
    id: 'planner', name: 'Stratego',
    color: '#55aaff',
    skinRow: 0,
    hairRow: 0,   // Brown hair
    outfit: 3,
    deskCol: 15, deskRow: 4,
  },
  {
    id: 'blog_writer', name: 'Scribe',
    color: '#55ff55',
    skinRow: 4,   // Dark skin
    hairRow: 7,   // Black curly
    outfit: 2,
    deskCol: 3, deskRow: 11,
  },
  {
    id: 'designer', name: 'Pixel',
    color: '#ffaa55',
    skinRow: 2,   // Medium skin
    hairRow: 2,   // Orange/red hair
    outfit: 4,
    deskCol: 15, deskRow: 11,
  },
];

// ── Per-agent walk state ────────────────────────────────────
const agentWalkState = {};
AGENT_DEFS.forEach(a => {
  agentWalkState[a.id] = {
    x: 0, y: 0,
    targetX: 0, targetY: 0,
    walking: false,
    direction: 'down',
    walkTimer: 60 + Math.floor(Math.random() * 120),
    atDesk: true,
    thinkTimer: 40 + Math.floor(Math.random() * 80),
    thought: null,
    thoughtTimer: 0,
    walkAnimFrame: 0,
  };
});

const THOUGHTS = ['💡', '📋', '🎮', '☕', '🤔', '📊', '✏️', '🎨', '🚀', '🎯'];

// ── Draw Utilities ──────────────────────────────────────────
function fill(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}
function px(ctx, x, y, color) { fill(ctx, x, y, 1, 1, color); }
function lighten(hex, a) {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgb(${Math.min(255, (n >> 16) + a)},${Math.min(255, ((n >> 8) & 0xff) + a)},${Math.min(255, (n & 0xff) + a)})`;
}
function darken(hex, a) { return lighten(hex, -a); }

// ════════════════════════════════════════════════════════════
//  INTERIOR TILE BACKGROUND (rendered once, uses Interior sprites)
// ════════════════════════════════════════════════════════════

// TilesHouse.png tile extraction helper (16x16 per tile, 32 cols in 512px)
function drawTile(ctx, tilesImg, srcCol, srcRow, destX, destY, tileSize = 16) {
  ctx.drawImage(
    tilesImg,
    srcCol * tileSize, srcRow * tileSize, tileSize, tileSize,
    destX, destY, tileSize, tileSize
  );
}

// Draw a region from any spritesheet
function drawRegion(ctx, img, sx, sy, sw, sh, dx, dy, dw, dh) {
  if (!img) return;
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw || sw, dh || sh);
}

function buildStaticBg(interiorSprites) {
  const W = COLS * TILE, H = ROWS * TILE;
  const off = document.createElement('canvas');
  off.width = W; off.height = H;
  const ctx = off.getContext('2d');

  const tiles = interiorSprites.tiles;
  const cupboard = interiorSprites.cupboard;
  const windows = interiorSprites.windows;
  const paintings = interiorSprites.paintings;
  const flowers = interiorSprites.flowers;
  const tv = interiorSprites.tv;
  const lights = interiorSprites.lights;
  const livingroom = interiorSprites.livingroom;
  const carpet = interiorSprites.carpet;
  const misc = interiorSprites.misc;
  const doors = interiorSprites.doors;

  // ─── Background fill ───
  fill(ctx, 0, 0, W, H, '#2a2018');

  // ─── Floor & Wall from TilesHouse.png ───
  // TilesHouse.png is 512x512 = 32 cols × 32 rows at 16px per tile.
  // Wood floor tiles: we draw them procedurally for a warm wood look since
  // the tile sheet's grid positions are hard to map visually. We paint a
  // wood-tone floor and overlay grain lines for a pixel-art plank effect.
  if (tiles) {
    // Fill the floor area (rows 2-17) with a warm brown base
    for (let r = 2; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const light = (r + c) % 2 === 0;
        fill(ctx, c * TILE, r * TILE, TILE, TILE, light ? '#b8885a' : '#a87848');
        // Horizontal wood grain lines
        fill(ctx, c * TILE, r * TILE + 5, TILE, 1, light ? '#a87848' : '#986838');
        fill(ctx, c * TILE, r * TILE + 11, TILE, 1, light ? '#a87848' : '#986838');
        // Subtle vertical plank seam every 4 tiles
        if (c % 4 === 0) {
          fill(ctx, c * TILE, r * TILE, 1, TILE, '#986838');
        }
      }
    }

    // Wall: use solid brown wall panels matching the Interior style
    // Upper wall (row 0) - darker wood panel
    for (let c = 0; c < COLS; c++) {
      fill(ctx, c * TILE, 0, TILE, TILE, '#7a5a3a');
      // Horizontal panel lines
      fill(ctx, c * TILE, 4, TILE, 1, '#6a4a2a');
      fill(ctx, c * TILE, 8, TILE, 1, '#6a4a2a');
      fill(ctx, c * TILE, 12, TILE, 1, '#6a4a2a');
    }
    // Lower wall (row 1) - slightly lighter
    for (let c = 0; c < COLS; c++) {
      fill(ctx, c * TILE, TILE, TILE, TILE, '#8a6a4a');
      fill(ctx, c * TILE, TILE + 4, TILE, 1, '#7a5a3a');
      fill(ctx, c * TILE, TILE + 8, TILE, 1, '#7a5a3a');
      fill(ctx, c * TILE, TILE + 12, TILE, 1, '#7a5a3a');
    }

    // Wall baseboard / trim
    fill(ctx, 0, TILE * 2 - 3, W, 3, '#5a3a1a');
    fill(ctx, 0, TILE * 2 - 1, W, 1, '#4a2a0a');
  } else {
    // Fallback: solid color floor and wall
    fill(ctx, 0, 0, W, TILE * 2, '#7a5a3a');
    for (let r = 2; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        fill(ctx, c * TILE, r * TILE, TILE, TILE, (r + c) % 2 === 0 ? '#b8885a' : '#a87848');
  }

  // ─── Carpets from Carpet-Sheet.png ───
  // Carpet-Sheet: 320x64, each carpet is ~64x64 with different colors by column
  if (carpet) {
    // Draw carpet under each desk area (4 workspace carpets)
    // Each carpet sprite is roughly 64x64 (4 tiles x 4 tiles)
    const carpetW = 64, carpetH = 64;
    // Carpet 1 - under left-top workspace
    drawRegion(ctx, carpet, 0, 0, carpetW, carpetH,
      2 * TILE, 3 * TILE, carpetW, carpetH);
    // Carpet 2 - under right-top workspace (different color)
    drawRegion(ctx, carpet, carpetW, 0, carpetW, carpetH,
      14 * TILE, 3 * TILE, carpetW, carpetH);
    // Carpet 3 - under left-bottom workspace
    drawRegion(ctx, carpet, carpetW * 2, 0, carpetW, carpetH,
      2 * TILE, 10 * TILE, carpetW, carpetH);
    // Carpet 4 - under right-bottom workspace
    drawRegion(ctx, carpet, carpetW * 3, 0, carpetW, carpetH,
      14 * TILE, 10 * TILE, carpetW, carpetH);
  }

  // ─── Windows from Windows-Sheet.png ───
  // Windows-Sheet: 896x64, each window is ~64x64
  if (windows) {
    // Place windows on the wall (row 0)
    drawRegion(ctx, windows, 0, 0, 64, 64,
      0 * TILE, 0, 64, 32); // Left window
    drawRegion(ctx, windows, 64, 0, 64, 64,
      24 * TILE, 0, 64, 32); // Right window
    drawRegion(ctx, windows, 128, 0, 64, 64,
      12 * TILE, 0, 64, 32); // Center window
  }

  // ─── Bookshelves from Cupboard-Sheet.png ───
  // Cupboard-Sheet: 576x96, bookshelves are ~48-64px objects
  // The bookshelf with books is at roughly col 4-5 (indices), about 48x64 or 64x96
  if (cupboard) {
    // Bookshelves on the wall
    drawRegion(ctx, cupboard, 192, 0, 64, 96,
      1 * TILE, -4, 48, 36); // Left bookshelf 1
    drawRegion(ctx, cupboard, 256, 0, 64, 96,
      5 * TILE, -4, 48, 36); // Left bookshelf 2
    drawRegion(ctx, cupboard, 192, 0, 64, 96,
      17 * TILE, -4, 48, 36); // Right bookshelf 1
    drawRegion(ctx, cupboard, 320, 0, 64, 96,
      21 * TILE, -4, 48, 36); // Right bookshelf 2
  }

  // ─── Paintings from Paintings-Sheet.png ───
  // Paintings-Sheet: 320x32, each painting is ~32x32
  if (paintings) {
    drawRegion(ctx, paintings, 0, 0, 32, 32,
      8 * TILE, 0, 24, 24); // Wall painting 1
    drawRegion(ctx, paintings, 32, 0, 32, 32,
      10 * TILE, 0, 24, 24); // Wall painting 2
    drawRegion(ctx, paintings, 96, 0, 32, 32,
      19 * TILE, 0, 24, 24); // Wall painting 3
  }

  // ─── TV / Monitors from TV-Sheet.png ───
  // TV-Sheet: 256x96, monitors are ~64x32 range
  if (tv) {
    drawRegion(ctx, tv, 128, 0, 64, 48,
      9 * TILE, 0, 48, 32); // Whiteboard area - use TV as big screen
  }

  // ─── Flowers / plants from Flowers-Sheet.png ───
  // Flowers-Sheet: 384x96, each plant is ~48x96 (tall) or ~48x64
  if (flowers) {
    const plantPositions = [
      [0, 3], [10, 3], [12, 3], [22, 3],
      [0, 10], [10, 10], [12, 10], [22, 10],
      [0, 16], [10, 16]
    ];
    plantPositions.forEach(([c, r], i) => {
      // Cycle through different plant types
      const plantIdx = i % 6;
      drawRegion(ctx, flowers, plantIdx * 64, 0, 64, 96,
        c * TILE, r * TILE - 8, 20, 28);
    });
  }

  // ─── Lights / lamps from Lights-Sheet.png ───
  if (lights) {
    // Wall lamps
    drawRegion(ctx, lights, 0, 0, 48, 64,
      4 * TILE, -2, 18, 24);
    drawRegion(ctx, lights, 48, 0, 48, 64,
      16 * TILE, -2, 18, 24);
    drawRegion(ctx, lights, 96, 0, 48, 64,
      26 * TILE, -2, 18, 24);
  }

  // ─── Door from Doors-Sheet.png ───
  if (doors) {
    // Place a door on the left side
    drawRegion(ctx, doors, 0, 0, 64, 128,
      26 * TILE, TILE - 4, 28, 22);
  }

  // ─── Desks, chairs, monitors, keyboard overlays (procedural details) ───
  // These remain procedural on top of the tile background for pixel-perfect desk placement
  const C = {
    deskWood: '#9c7a52', deskTop: '#b8956a', deskShadow: '#7a5e3e', deskLeg: '#6a4e30',
    monitor: '#2a2a3e', monitorScreen: '#1a3a2a',
    keyboard: '#3a3a4e',
    chairSeat: '#4a5a8a', chairBack: '#3a4a7a', chairWheel: '#555',
    coffeeCup: '#e8e8e8', coffee: '#6a4a2a',
  };

  AGENT_DEFS.forEach(agent => {
    const dx = agent.deskCol * TILE, dy = agent.deskRow * TILE;

    // Chair
    const cx = dx + TILE + 4, cy = dy + TILE * 2 + 2;
    px(ctx, cx + 1, cy + 9, C.chairWheel); px(ctx, cx + 7, cy + 9, C.chairWheel); px(ctx, cx + 4, cy + 10, C.chairWheel);
    fill(ctx, cx + 3, cy + 7, 3, 3, '#444');
    fill(ctx, cx, cy + 4, 9, 4, C.chairSeat); fill(ctx, cx + 1, cy + 5, 7, 2, lighten(C.chairSeat, 15));
    fill(ctx, cx + 1, cy, 7, 4, C.chairBack); fill(ctx, cx + 2, cy + 1, 5, 2, lighten(C.chairBack, 12));

    // Desk
    fill(ctx, dx, dy, TILE * 4, 2, lighten(C.deskTop, 15));
    fill(ctx, dx, dy + 2, TILE * 4, TILE - 4, C.deskTop);
    fill(ctx, dx, dy + TILE - 2, TILE * 4, TILE + 2, C.deskWood);
    fill(ctx, dx + 1, dy + TILE, TILE * 4 - 2, TILE - 2, C.deskShadow);
    fill(ctx, dx + TILE * 2 - 3, dy + TILE + 3, 6, 1, lighten(C.deskWood, 30));
    fill(ctx, dx + 2, dy + TILE * 2 - 2, 2, 4, C.deskLeg);
    fill(ctx, dx + TILE * 4 - 4, dy + TILE * 2 - 2, 2, 4, C.deskLeg);

    // Monitor
    const mx = dx + TILE + 6, my = dy - 12;
    fill(ctx, mx + 6, my + 12, 2, 3, '#555'); fill(ctx, mx + 4, my + 14, 6, 2, '#666');
    fill(ctx, mx, my, 14, 12, C.monitor); fill(ctx, mx + 1, my + 1, 12, 10, C.monitorScreen);
    px(ctx, mx + 2, my + 2, 'rgba(255,255,255,0.12)');
    if (agent.id === 'designer') {
      const m2x = dx + TILE * 2 + 6;
      fill(ctx, m2x + 6, my + 12, 2, 3, '#555'); fill(ctx, m2x + 4, my + 14, 6, 2, '#666');
      fill(ctx, m2x, my, 14, 12, C.monitor); fill(ctx, m2x + 1, my + 1, 12, 10, C.monitorScreen);
    }

    // Keyboard
    fill(ctx, dx + 12, dy + 4, 12, 6, C.keyboard);
    fill(ctx, dx + 13, dy + 5, 10, 4, lighten(C.keyboard, 12));

    // Coffee cup
    fill(ctx, dx + TILE * 3 + 2, dy + 2, 4, 5, C.coffeeCup);
    fill(ctx, dx + TILE * 3 + 3, dy + 3, 2, 3, C.coffee);
  });

  // ─── Misc coffee machine area ───
  if (misc) {
    // Coffee machine from Miscellaneous  - small object ~32x32
    // Place in break area
    drawRegion(ctx, misc, 0, 0, 32, 64,
      24 * TILE + 2, 4 * TILE, 14, 16);
    drawRegion(ctx, misc, 0, 0, 32, 64,
      24 * TILE + 2, 11 * TILE, 14, 16);
  }

  // ─── Floor scuffs (subtle detail) ───
  ctx.fillStyle = 'rgba(0,0,0,0.04)';
  [[3, 8], [7, 9], [15, 7], [19, 12], [11, 8], [23, 6], [25, 13]].forEach(([c, r]) =>
    ctx.fillRect(c * TILE + 2, r * TILE + 4, 6, 2));

  return off;
}

// ════════════════════════════════════════════════════════════
//  SPRITE LOADING & DRAWING
// ════════════════════════════════════════════════════════════
function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// Draw one 32x32 sprite frame from a spritesheet
function drawSpriteFrame(ctx, sheet, col, row, destX, destY) {
  if (!sheet) return;
  ctx.drawImage(
    sheet,
    col * SPRITE_W, row * SPRITE_H, SPRITE_W, SPRITE_H,
    destX, destY, SPRITE_W, SPRITE_H
  );
}

// Get the column for a given direction and walk frame
function getSpriteCol(direction, walkAnimFrame, isWalking) {
  const offset = DIR_COL_OFFSET[direction] || 0;
  if (!isWalking) return offset + IDLE_FRAME;
  // Cycle through walk frames 1-5 (skip idle frame 0)
  return offset + WALK_FRAMES[walkAnimFrame % WALK_FRAMES.length];
}

// ── Status Bubble (procedural) ──────────────────────────────
function drawStatusBubble(ctx, x, y, state, color, frame) {
  fill(ctx, x, y, 10, 7, '#fff');
  fill(ctx, x + 1, y - 1, 8, 1, '#fff');
  px(ctx, x + 4, y + 7, '#fff'); px(ctx, x + 5, y + 8, '#fff');
  fill(ctx, x, y - 1, 10, 1, color);
  fill(ctx, x - 1, y, 1, 7, color); fill(ctx, x + 10, y, 1, 7, color);
  fill(ctx, x, y + 7, 4, 1, color); fill(ctx, x + 6, y + 7, 4, 1, color);
  if (state === 'typing') {
    const d = frame % 3;
    for (let i = 0; i < 3; i++) px(ctx, x + 2 + i * 2, y + 3 + (i === d ? -1 : 0), color);
  } else if (state === 'reading') {
    fill(ctx, x + 2, y + 2, 3, 4, color); fill(ctx, x + 5, y + 2, 3, 4, darken(color, 30));
  } else if (state === 'waiting') {
    fill(ctx, x + 3, y + 1, 4, 1, color); fill(ctx, x + 4, y + 2, 2, 1, color);
    px(ctx, x + 5, y + 3, color); fill(ctx, x + 4, y + 4, 2, 1, color); fill(ctx, x + 3, y + 5, 4, 1, color);
  }
}

// ── Thought Bubble ──────────────────────────────────────────
function drawThoughtBubble(ctx, x, y, thought, color) {
  px(ctx, x + 6, y + 10, '#fff');
  fill(ctx, x + 4, y + 7, 3, 2, '#fff');
  fill(ctx, x - 1, y - 1, 16, 9, '#fff');
  fill(ctx, x, y - 2, 14, 1, '#fff');
  fill(ctx, x, y + 8, 14, 1, '#fff');
  // Border
  fill(ctx, x, y - 2, 14, 1, color + '44');
  fill(ctx, x, y + 8, 14, 1, color + '44');
  fill(ctx, x - 1, y - 1, 1, 9, color + '44');
  fill(ctx, x + 14, y - 1, 1, 9, color + '44');
  ctx.fillStyle = color;
  ctx.font = '6px monospace';
  ctx.textBaseline = 'top';
  ctx.fillText(thought, x + 2, y + 1);
}

// ── Name Label ──────────────────────────────────────────────
function drawNameLabel(ctx, cx, y, name, color) {
  ctx.font = '5px monospace';
  const tw = Math.ceil(ctx.measureText(name).width);
  const lx = cx - Math.floor(tw / 2) - 2;
  fill(ctx, lx, y, tw + 4, 8, 'rgba(0,0,0,0.6)');
  fill(ctx, lx, y + 7, tw + 4, 1, color + '88');
  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'top';
  ctx.fillText(name, lx + 2, y + 1);
}

// ── Active monitor glow ─────────────────────────────────────
const C_MON = { monitorGlow: '#3aff7a' };
function drawActiveMonitor(ctx, col, row, frame, color) {
  const mx = col * TILE + 7, my = row * TILE - 11;
  const gc = color || C_MON.monitorGlow;
  fill(ctx, mx, my, 5, 1, gc); fill(ctx, mx, my + 2, 8, 1, darken(gc, 40));
  fill(ctx, mx, my + 4, 4, 1, gc); fill(ctx, mx, my + 6, 6, 1, darken(gc, 20));
  if (frame % 4 < 2) px(ctx, mx + 6, my + 6, gc);
  ctx.fillStyle = gc + '10';
  ctx.fillRect(col * TILE + 4, row * TILE - 14, 18, 16);
}

// ── Walk logic ──────────────────────────────────────────────
function updateWalkState(ws, state) {
  // Working agents stay at desk
  if (state !== 'idle') {
    if (!ws.atDesk) {
      ws.targetX = 0; ws.targetY = 0; ws.walking = true;
    }
    ws.walkTimer = 60 + Math.floor(Math.random() * 120);
    ws.thinkTimer = 30 + Math.floor(Math.random() * 60);
    return;
  }

  // Thoughts
  ws.thinkTimer--;
  if (ws.thinkTimer <= 0 && !ws.thought) {
    ws.thought = THOUGHTS[Math.floor(Math.random() * THOUGHTS.length)];
    ws.thoughtTimer = 25 + Math.floor(Math.random() * 20);
    ws.thinkTimer = 80 + Math.floor(Math.random() * 80);
  }
  if (ws.thought) {
    ws.thoughtTimer--;
    if (ws.thoughtTimer <= 0) ws.thought = null;
  }

  // Walk timer
  ws.walkTimer--;
  if (ws.walkTimer <= 0 && !ws.walking) {
    const range = TILE * 3;
    ws.targetX = (Math.random() - 0.5) * range * 2;
    ws.targetY = (Math.random() - 0.5) * range;
    ws.targetX = Math.max(-TILE * 3, Math.min(TILE * 3, ws.targetX));
    ws.targetY = Math.max(-TILE * 1, Math.min(TILE * 2, ws.targetY));
    ws.walking = true;
    ws.atDesk = false;
    ws.walkTimer = 100 + Math.floor(Math.random() * 150);
  }

  // Move
  if (ws.walking) {
    const dx = ws.targetX - ws.x;
    const dy = ws.targetY - ws.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1.5) {
      ws.x = ws.targetX; ws.y = ws.targetY;
      ws.walking = false;
      if (ws.targetX === 0 && ws.targetY === 0) ws.atDesk = true;
      if (!ws.atDesk) ws.walkTimer = 30 + Math.floor(Math.random() * 40);
      else ws.walkTimer = 80 + Math.floor(Math.random() * 160);
    } else {
      const speed = 0.7;
      ws.x += (dx / dist) * speed;
      ws.y += (dy / dist) * speed;
      // Determine direction based on the dominant axis of movement
      if (Math.abs(dx) > Math.abs(dy)) {
        ws.direction = dx > 0 ? 'right' : 'left';
      } else {
        ws.direction = dy > 0 ? 'down' : 'up';
      }
    }
  }
}

// ════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ════════════════════════════════════════════════════════════
export default function PixelOffice({ agentStatuses = {}, onAgentClick }) {
  const canvasRef = useRef(null);
  const frameRef = useRef(0);
  const animRef = useRef(null);
  const lastFrameTime = useRef(0);
  const statusesRef = useRef(agentStatuses);
  const onClickRef = useRef(onAgentClick);
  const bgRef = useRef(null);
  const spritesRef = useRef({
    loaded: false,
    charModel: null,
    shadow: null,
    hairs: null,
    outfits: {},
  });
  const interiorRef = useRef({
    loaded: false,
    tiles: null, cupboard: null, windows: null, paintings: null,
    flowers: null, tv: null, lights: null, livingroom: null,
    carpet: null, misc: null, doors: null,
  });

  statusesRef.current = agentStatuses;
  onClickRef.current = onAgentClick;

  function getAgentState(agentId) {
    const s = statusesRef.current[agentId];
    if (s === 'in_progress') return 'typing';
    if (s === 'in_review') return 'waiting';
    if (s === 'reading') return 'reading';
    return 'idle';
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const W = COLS * TILE, H = ROWS * TILE;
    canvas.width = W; canvas.height = H;

    // Load interior sprites and build background
    async function loadInteriorAndBuildBg() {
      const ir = interiorRef.current;
      if (ir.loaded) return;
      const [tiles, cupboard, windows, paintings, flowers, tv, lights, livingroom, carpet, misc, doors] = await Promise.all([
        loadImage('/sprites/metro/interior/TilesHouse.png'),
        loadImage('/sprites/metro/interior/Cupboard-Sheet.png'),
        loadImage('/sprites/metro/interior/Windows-Sheet.png'),
        loadImage('/sprites/metro/interior/Paintings-Sheet.png'),
        loadImage('/sprites/metro/interior/Flowers-Sheet.png'),
        loadImage('/sprites/metro/interior/TV-Sheet.png'),
        loadImage('/sprites/metro/interior/Lights-Sheet.png'),
        loadImage('/sprites/metro/interior/LivingRoom1-Sheet.png'),
        loadImage('/sprites/metro/interior/Carpet-Sheet.png'),
        loadImage('/sprites/metro/interior/Miscellaneous-Sheet.png'),
        loadImage('/sprites/metro/interior/Doors-Sheet.png'),
      ]);
      ir.tiles = tiles; ir.cupboard = cupboard; ir.windows = windows;
      ir.paintings = paintings; ir.flowers = flowers; ir.tv = tv;
      ir.lights = lights; ir.livingroom = livingroom; ir.carpet = carpet;
      ir.misc = misc; ir.doors = doors;
      ir.loaded = true;

      // Build the background with loaded interior sprites
      bgRef.current = buildStaticBg(ir);
    }

    // Build fallback background immediately (solid colors)
    if (!bgRef.current) {
      bgRef.current = buildStaticBg(interiorRef.current);
    }

    // Then load interior sprites and rebuild
    loadInteriorAndBuildBg();

    // Load character sprite assets
    async function loadSprites() {
      const sp = spritesRef.current;
      if (sp.loaded) return;
      const [charModel, shadow, hairs, ...outfits] = await Promise.all([
        loadImage('/sprites/metro/character_model.png'),
        loadImage('/sprites/metro/shadow.png'),
        loadImage('/sprites/metro/hairs.png'),
        loadImage('/sprites/metro/outfit1.png'),
        loadImage('/sprites/metro/outfit2.png'),
        loadImage('/sprites/metro/outfit3.png'),
        loadImage('/sprites/metro/outfit4.png'),
        loadImage('/sprites/metro/outfit5.png'),
        loadImage('/sprites/metro/outfit6.png'),
      ]);
      sp.charModel = charModel;
      sp.shadow = shadow;
      sp.hairs = hairs;
      outfits.forEach((img, i) => { sp.outfits[i + 1] = img; });
      sp.loaded = true;
    }

    loadSprites();

    // Tick walk anim counter globally
    let walkAnimTick = 0;

    function loop(timestamp) {
      if (timestamp - lastFrameTime.current >= FRAME_MS) {
        lastFrameTime.current = timestamp;
        const frame = ++frameRef.current;
        walkAnimTick++;

        // Draw cached static background
        ctx.drawImage(bgRef.current, 0, 0);

        // Clock
        const now = Date.now() / 1000;
        const clkx = 13 * TILE + 2, clky = 1;
        fill(ctx, clkx, clky, 12, 12, '#5a4a3a');
        fill(ctx, clkx + 1, clky + 1, 10, 10, '#eee');
        px(ctx, clkx + 5, clky + 5, '#333'); px(ctx, clkx + 6, clky + 5, '#333');
        const hA = ((now / 3600) % 12) / 12 * Math.PI * 2 - Math.PI / 2;
        px(ctx, Math.round(clkx + 5.5 + Math.cos(hA) * 2), Math.round(clky + 5.5 + Math.sin(hA) * 2), '#333');
        const mA = ((now / 60) % 60) / 60 * Math.PI * 2 - Math.PI / 2;
        px(ctx, Math.round(clkx + 5.5 + Math.cos(mA) * 3), Math.round(clky + 5.5 + Math.sin(mA) * 3), '#cc3333');

        const sp = spritesRef.current;

        // Render agents
        AGENT_DEFS.forEach(agent => {
          const state = getAgentState(agent.id);
          const ws = agentWalkState[agent.id];
          updateWalkState(ws, state);

          // Update walk anim frame (cycle every 2 ticks for smoothness)
          if (ws.walking) {
            ws.walkAnimFrame = Math.floor(walkAnimTick / 2) % WALK_FRAMES.length;
          }

          const isActive = state === 'typing' || state === 'reading';

          // Active monitor glow
          if (isActive) {
            drawActiveMonitor(ctx, agent.deskCol + 1, agent.deskRow, frame, agent.color);
            if (agent.id === 'designer') {
              drawActiveMonitor(ctx, agent.deskCol + 2, agent.deskRow, frame, '#aa55ff');
            }
            // Animated keyboard keys
            const kx = agent.deskCol * TILE + 12, ky = agent.deskRow * TILE + 4;
            for (let r = 0; r < 3; r++) for (let k = 0; k < 4; k++) {
              const pressed = state === 'typing' && frame % 4 === (r + k) % 4;
              px(ctx, kx + 2 + k * 2, ky + 1 + r * 1.5 | 0, pressed ? '#aaa' : '#666');
            }
          }

          // Character position
          const charX = Math.floor(agent.deskCol * TILE + TILE - 8 + ws.x);
          const charY = Math.floor(agent.deskRow * TILE + TILE + 2 + ws.y);
          // When walking, use walk direction; when working at desk, face up (toward monitor);
          // when idle and not walking, preserve last direction
          const dir = ws.walking ? ws.direction : (state !== 'idle' ? 'up' : ws.direction);

          if (sp.loaded) {
            // Get spritesheet column based on direction and animation state
            const sprCol = getSpriteCol(dir, ws.walkAnimFrame, ws.walking);

            // Draw shadow
            if (sp.shadow) {
              ctx.globalAlpha = 0.3;
              ctx.drawImage(sp.shadow, charX + 4, charY + 24, 24, 8);
              ctx.globalAlpha = 1;
            }

            // Draw character body (from character_model.png)
            drawSpriteFrame(ctx, sp.charModel, sprCol, agent.skinRow, charX, charY);

            // Draw outfit overlay
            const outfitSheet = sp.outfits[agent.outfit];
            if (outfitSheet) {
              drawSpriteFrame(ctx, outfitSheet, sprCol, 0, charX, charY);
            }

            // Draw hair overlay
            if (sp.hairs) {
              drawSpriteFrame(ctx, sp.hairs, sprCol, agent.hairRow, charX, charY);
            }
          } else {
            // Fallback: colored rectangle while loading
            fill(ctx, charX + 8, charY + 4, 16, 24, agent.color);
          }

          // Status bubble (work states)
          if (state !== 'idle') {
            drawStatusBubble(ctx, charX + 12, charY - 8, state, agent.color, frame);
          }

          // Thought bubble (idle)
          if (state === 'idle' && ws.thought) {
            drawThoughtBubble(ctx, charX + 10, charY - 12, ws.thought, agent.color);
          }

          // Name label
          drawNameLabel(ctx, charX + 16, charY + 34, agent.name, agent.color);
        });

        // Ambient particles
        for (let i = 0; i < 3; i++) {
          const ppx = ((frame * 0.4 + i * 97) % W);
          const ppy = ((frame * 0.25 + i * 143) % (H - TILE * 3)) + TILE * 2;
          ctx.fillStyle = 'rgba(255,255,255,0.03)';
          ctx.fillRect(Math.floor(ppx), Math.floor(ppy), 1, 1);
        }
      }
      animRef.current = requestAnimationFrame(loop);
    }

    animRef.current = requestAnimationFrame(loop);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClick = (e) => {
    if (!onClickRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * sx;
    const my = (e.clientY - rect.top) * sy;

    // Check character position first
    for (const agent of AGENT_DEFS) {
      const ws = agentWalkState[agent.id];
      const ax = agent.deskCol * TILE + TILE - 8 + ws.x;
      const ay = agent.deskRow * TILE + TILE + 2 + ws.y;
      if (mx >= ax && mx < ax + SPRITE_W && my >= ay && my < ay + SPRITE_H + 8) {
        onClickRef.current(agent.id);
        return;
      }
    }
    // Check desk area
    for (const agent of AGENT_DEFS) {
      const ax = agent.deskCol * TILE;
      const ay = agent.deskRow * TILE;
      if (mx >= ax && mx < ax + TILE * 5 && my >= ay && my < ay + TILE * 5) {
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
