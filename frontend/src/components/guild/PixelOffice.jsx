import { useRef, useEffect } from 'react';
import { AGENTS } from '../../config/agents';

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
// Layout per row pair (2 rows per skin):
//   Row 0: down(6) left(6) right(6) up(6) → but 24 cols with 4 dirs = 6 frames/dir... 
//   Actually the typical MetroCity layout:
//     Columns 0-5:  Walk Down  (idle + 5 walk)
//     Columns 6-11: Walk Left  (idle + 5 walk)
//     Columns 12-17: Walk Right (idle + 5 walk)
//     Columns 18-23: Walk Up    (idle + 5 walk)
//   Rows 0-1: Skin 1/Skin 2, Rows 2-3: Skin 2/3, Rows 4-5: Skin 3/variants
// We use row 0 for skin1, row 2 for skin2, row 4 for skin3
const DIR_COL_OFFSET = { down: 0, left: 6, right: 12, up: 18 };
const WALK_FRAMES = [0, 1, 2, 3, 4, 5]; // 6 frames per direction
const IDLE_FRAME = 0;

// Hairs.png: 768x256 → 24 cols x 8 rows (same col layout as character)
// Each row = one hair style, with directional frames matching character
// Outfits: 768x32 → 24 cols x 1 row (same col layout)

// ── Agent Definitions ───────────────────────────────────────
const AGENT_DEFS = [
  {
    id: 'orchestrator', name: AGENTS.orchestrator.name,
    color: AGENTS.orchestrator.color,
    skinRow: 0,   // Row in character_model.png
    hairRow: -1,  // No hair (hat from Suit.png covers head)
    suitRow: 0,   // Row in Suit.png
    deskCol: 3, deskRow: 4,
  },
  {
    id: 'planner', name: AGENTS.planner.name,
    color: AGENTS.planner.color,
    skinRow: 0,
    hairRow: -1,  // No hair (hat from Suit.png covers head)
    suitRow: 0,   // Row in Suit.png
    deskCol: 15, deskRow: 4,
  },
  {
    id: 'blog_writer', name: AGENTS.blog_writer.name,
    color: AGENTS.blog_writer.color,
    skinRow: 4,   // Dark skin
    hairRow: 7,   // Black curly
    suitRow: 2,   // Row in Suit.png (second style)
    deskCol: 3, deskRow: 11,
  },
  {
    id: 'designer', name: AGENTS.designer.name,
    color: AGENTS.designer.color,
    skinRow: 2,   // Medium skin
    hairRow: 2,   // Orange/red hair
    suitRow: 2,   // Row in Suit.png (second style)
    deskCol: 15, deskRow: 11,
  },
];

// ── Palette (for environment) ──────────────────────────────
const C = {
  floorA: '#c8b89a', floorB: '#bfae8e', floorTrim: '#a8977a',
  wallTop: '#7a8b9a', wallFace: '#9aacbe', wallBase: '#6a7a8a', wallAccent: '#5a6a7a',
  deskWood: '#9c7a52', deskTop: '#b8956a', deskShadow: '#7a5e3e', deskLeg: '#6a4e30',
  monitor: '#2a2a3e', monitorScreen: '#1a3a2a', monitorScreenActive: '#2a5a3a', monitorGlow: '#3aff7a',
  keyboard: '#3a3a4e',
  chairSeat: '#4a5a8a', chairBack: '#3a4a7a', chairWheel: '#555',
  carpet: '#5a3e6a', carpetLight: '#6a4e7a', carpetBorder: '#7a5e8a',
  plantGreen: '#4a8a3a', plantDark: '#3a6a2a', pot: '#c8845a', potDark: '#a8643a',
  shelf: '#8a6a4a', shelfDark: '#6a4a2a',
  bookRed: '#c85454', bookBlue: '#5478c8', bookGreen: '#54a854', bookYellow: '#c8a854',
  whiteboard: '#e8e8e8', wbBorder: '#888',
  coffee: '#6a4a2a', coffeeCup: '#e8e8e8',
  windowGlass: '#6aaace', windowFrame: '#9aacbe',
};

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

const THOUGHTS = ['💡','📋','🎮','☕','🤔','📊','✏️','🎨','🚀','🎯'];

// ── Draw Utilities ──────────────────────────────────────────
function fill(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}
function px(ctx, x, y, color) { fill(ctx, x, y, 1, 1, color); }
function lighten(hex, a) {
  const n = parseInt(hex.replace('#',''),16);
  return `rgb(${Math.min(255,(n>>16)+a)},${Math.min(255,((n>>8)&0xff)+a)},${Math.min(255,(n&0xff)+a)})`;
}
function darken(hex, a) { return lighten(hex, -a); }

// ════════════════════════════════════════════════════════════
//  STATIC BACKGROUND (rendered once)
// ════════════════════════════════════════════════════════════
function buildStaticBg() {
  const W = COLS * TILE, H = ROWS * TILE;
  const off = document.createElement('canvas');
  off.width = W; off.height = H;
  const ctx = off.getContext('2d');

  // Background
  fill(ctx, 0, 0, W, H, '#2a2a3a');

  // Floor
  for (let r = 2; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      fill(ctx, c*TILE, r*TILE, TILE, TILE, (r+c)%2===0 ? C.floorA : C.floorB);
      fill(ctx, c*TILE, r*TILE+TILE-1, TILE, 1, C.floorTrim);
      if (c%3===0) fill(ctx, c*TILE+TILE-1, r*TILE, 1, TILE, C.floorTrim);
    }

  // Wall
  fill(ctx, 0, 0, W, TILE*2, C.wallTop);
  fill(ctx, 0, TILE, W, TILE, C.wallFace);
  fill(ctx, 0, TILE*2-2, W, 2, C.wallBase);
  fill(ctx, 0, TILE*2-1, W, 1, C.wallAccent);

  // Carpets
  const drawCarpet = (col, row, w, h) => {
    const x=col*TILE, y=row*TILE, pw=w*TILE, ph=h*TILE;
    fill(ctx,x,y,pw,ph,C.carpet);
    for(let r2=0;r2<h;r2++) for(let c2=0;c2<w;c2++)
      if((r2+c2)%2===0) fill(ctx,x+c2*TILE+4,y+r2*TILE+4,8,8,C.carpetLight);
    fill(ctx,x,y,pw,2,C.carpetBorder); fill(ctx,x,y+ph-2,pw,2,C.carpetBorder);
    fill(ctx,x,y,2,ph,C.carpetBorder); fill(ctx,x+pw-2,y,2,ph,C.carpetBorder);
  };
  drawCarpet(2,3,6,5); drawCarpet(14,3,6,5);
  drawCarpet(2,10,6,5); drawCarpet(14,10,6,5);

  // Shelves
  const drawShelf = (col, row) => {
    const x=col*TILE, y=row*TILE;
    fill(ctx,x,y,TILE*2,TILE*2,C.shelf);
    fill(ctx,x+1,y+1,TILE*2-2,7,C.shelfDark);
    fill(ctx,x+1,y+10,TILE*2-2,7,C.shelfDark);
    [C.bookRed,C.bookBlue,C.bookGreen,C.bookYellow,C.bookRed,C.bookBlue].forEach((c,i)=>fill(ctx,x+2+i*4,y+2,3,6,c));
    [C.bookYellow,C.bookGreen,C.bookBlue,C.bookRed,C.bookGreen,C.bookYellow].forEach((c,i)=>fill(ctx,x+2+i*4,y+11,3,6,c));
  };
  drawShelf(1,0); drawShelf(5,0); drawShelf(17,0); drawShelf(21,0);

  // Whiteboard
  const wx=9*TILE, wy=0;
  fill(ctx,wx,wy,TILE*3,TILE+8,C.wbBorder);
  fill(ctx,wx+2,wy+2,TILE*3-4,TILE+4,C.whiteboard);
  fill(ctx,wx+4,wy+4,14,1,'#5578aa'); fill(ctx,wx+4,wy+7,10,1,'#aa5555');
  fill(ctx,wx+4,wy+10,18,1,'#55aa55'); fill(ctx,wx+4,wy+13,12,1,'#8855aa');

  // Window
  const winx=24*TILE;
  fill(ctx,winx,0,TILE*3,TILE*2,C.windowFrame);
  fill(ctx,winx+2,2,TILE*3-4,TILE*2-4,C.windowGlass);
  fill(ctx,winx+TILE+7,2,2,TILE*2-4,C.windowFrame);
  fill(ctx,winx+2,TILE-1,TILE*3-4,2,C.windowFrame);
  px(ctx,winx+5,4,'#fff'); px(ctx,winx+TILE*2,6,'#ffe088');

  // Plants
  const drawPlant = (col, row) => {
    const x=col*TILE+2, y=row*TILE;
    fill(ctx,x+3,y+10,8,5,C.pot); fill(ctx,x+2,y+9,10,2,C.pot); fill(ctx,x+4,y+11,6,3,C.potDark);
    fill(ctx,x+4,y+4,6,6,C.plantGreen); fill(ctx,x+2,y+3,4,4,C.plantGreen);
    fill(ctx,x+8,y+3,4,4,C.plantGreen); fill(ctx,x+3,y+1,3,3,C.plantDark);
    fill(ctx,x+8,y+1,3,3,C.plantGreen); fill(ctx,x+5,y,4,2,C.plantDark);
  };
  [[0,3],[10,3],[12,3],[22,3],[0,10],[10,10],[12,10],[22,10],[0,16],[10,16]].forEach(([c,r])=>drawPlant(c,r));

  // Coffee machines
  const drawCM = (col,row) => {
    const x=col*TILE+2, y=row*TILE;
    fill(ctx,x,y+2,12,12,'#4a4a5a'); fill(ctx,x+1,y+3,10,5,'#2a2a3a');
    px(ctx,x+2,y+10,'#55ff55');
    fill(ctx,x+4,y+10,6,4,C.coffeeCup); fill(ctx,x+5,y+11,4,2,C.coffee);
  };
  drawCM(24,4); drawCM(24,11);

  // Desks, chairs, monitors, keyboards
  AGENT_DEFS.forEach(agent => {
    const dx = agent.deskCol*TILE, dy = agent.deskRow*TILE;

    // Chair
    const cx=dx+TILE+4, cy=dy+TILE*2+2;
    px(ctx,cx+1,cy+9,C.chairWheel); px(ctx,cx+7,cy+9,C.chairWheel); px(ctx,cx+4,cy+10,C.chairWheel);
    fill(ctx,cx+3,cy+7,3,3,'#444');
    fill(ctx,cx,cy+4,9,4,C.chairSeat); fill(ctx,cx+1,cy+5,7,2,lighten(C.chairSeat,15));
    fill(ctx,cx+1,cy,7,4,C.chairBack); fill(ctx,cx+2,cy+1,5,2,lighten(C.chairBack,12));

    // Desk
    fill(ctx,dx,dy,TILE*4,2,lighten(C.deskTop,15));
    fill(ctx,dx,dy+2,TILE*4,TILE-4,C.deskTop);
    fill(ctx,dx,dy+TILE-2,TILE*4,TILE+2,C.deskWood);
    fill(ctx,dx+1,dy+TILE,TILE*4-2,TILE-2,C.deskShadow);
    fill(ctx,dx+TILE*2-3,dy+TILE+3,6,1,lighten(C.deskWood,30));
    fill(ctx,dx+2,dy+TILE*2-2,2,4,C.deskLeg);
    fill(ctx,dx+TILE*4-4,dy+TILE*2-2,2,4,C.deskLeg);

    // Monitor
    const mx=dx+TILE+6, my=dy-12;
    fill(ctx,mx+6,my+12,2,3,'#555'); fill(ctx,mx+4,my+14,6,2,'#666');
    fill(ctx,mx,my,14,12,C.monitor); fill(ctx,mx+1,my+1,12,10,C.monitorScreen);
    px(ctx,mx+2,my+2,'rgba(255,255,255,0.12)');
    if (agent.id === 'designer') {
      const m2x=dx+TILE*2+6;
      fill(ctx,m2x+6,my+12,2,3,'#555'); fill(ctx,m2x+4,my+14,6,2,'#666');
      fill(ctx,m2x,my,14,12,C.monitor); fill(ctx,m2x+1,my+1,12,10,C.monitorScreen);
    }

    // Keyboard
    fill(ctx,dx+12,dy+4,12,6,C.keyboard);
    fill(ctx,dx+13,dy+5,10,4,lighten(C.keyboard,12));

    // Coffee cup
    fill(ctx,dx+TILE*3+2,dy+2,4,5,C.coffeeCup);
    fill(ctx,dx+TILE*3+3,dy+3,2,3,C.coffee);
  });

  // Floor scuffs
  ctx.fillStyle='rgba(0,0,0,0.04)';
  [[3,8],[7,9],[15,7],[19,12],[11,8],[23,6],[25,13]].forEach(([c,r])=>
    ctx.fillRect(c*TILE+2,r*TILE+4,6,2));

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
  // Cycle through walk frames 0-5
  return offset + WALK_FRAMES[walkAnimFrame % WALK_FRAMES.length];
}

// ── Status Bubble (procedural) ──────────────────────────────
function drawStatusBubble(ctx, x, y, state, color, frame) {
  fill(ctx,x,y,10,7,'#fff');
  fill(ctx,x+1,y-1,8,1,'#fff');
  px(ctx,x+4,y+7,'#fff'); px(ctx,x+5,y+8,'#fff');
  fill(ctx,x,y-1,10,1,color);
  fill(ctx,x-1,y,1,7,color); fill(ctx,x+10,y,1,7,color);
  fill(ctx,x,y+7,4,1,color); fill(ctx,x+6,y+7,4,1,color);
  if (state==='typing') {
    const d=frame%3;
    for(let i=0;i<3;i++) px(ctx,x+2+i*2,y+3+(i===d?-1:0),color);
  } else if (state==='reading') {
    fill(ctx,x+2,y+2,3,4,color); fill(ctx,x+5,y+2,3,4,darken(color,30));
  } else if (state==='waiting') {
    fill(ctx,x+3,y+1,4,1,color); fill(ctx,x+4,y+2,2,1,color);
    px(ctx,x+5,y+3,color); fill(ctx,x+4,y+4,2,1,color); fill(ctx,x+3,y+5,4,1,color);
  }
}

// ── Thought Bubble ──────────────────────────────────────────
function drawThoughtBubble(ctx, x, y, thought, color) {
  px(ctx,x+6,y+10,'#fff');
  fill(ctx,x+4,y+7,3,2,'#fff');
  fill(ctx,x-1,y-1,16,9,'#fff');
  fill(ctx,x,y-2,14,1,'#fff');
  fill(ctx,x,y+8,14,1,'#fff');
  // Border
  fill(ctx,x,y-2,14,1,color+'44');
  fill(ctx,x,y+8,14,1,color+'44');
  fill(ctx,x-1,y-1,1,9,color+'44');
  fill(ctx,x+14,y-1,1,9,color+'44');
  ctx.fillStyle=color;
  ctx.font='6px monospace';
  ctx.textBaseline='top';
  ctx.fillText(thought,x+2,y+1);
}

// ── Name Label ──────────────────────────────────────────────
function drawNameLabel(ctx, cx, y, name, color) {
  ctx.font='5px monospace';
  const tw=Math.ceil(ctx.measureText(name).width);
  const lx=cx-Math.floor(tw/2)-2;
  fill(ctx,lx,y,tw+4,8,'rgba(0,0,0,0.6)');
  fill(ctx,lx,y+7,tw+4,1,color+'88');
  ctx.fillStyle='#fff';
  ctx.textBaseline='top';
  ctx.fillText(name,lx+2,y+1);
}

// ── Active monitor glow ─────────────────────────────────────
function drawActiveMonitor(ctx, col, row, frame, color) {
  const mx=col*TILE+7, my=row*TILE-11;
  const gc=color||C.monitorGlow;
  fill(ctx,mx,my,5,1,gc); fill(ctx,mx,my+2,8,1,darken(gc,40));
  fill(ctx,mx,my+4,4,1,gc); fill(ctx,mx,my+6,6,1,darken(gc,20));
  if(frame%4<2) px(ctx,mx+6,my+6,gc);
  ctx.fillStyle=gc+'10';
  ctx.fillRect(col*TILE+4,row*TILE-14,18,16);
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
    ws.targetX = (Math.random()-0.5)*range*2;
    ws.targetY = (Math.random()-0.5)*range;
    ws.targetX = Math.max(-TILE*3, Math.min(TILE*3, ws.targetX));
    ws.targetY = Math.max(-TILE*1, Math.min(TILE*2, ws.targetY));
    ws.walking = true;
    ws.atDesk = false;
    ws.walkTimer = 100 + Math.floor(Math.random() * 150);
    // Set direction immediately toward target
    const tdx = ws.targetX - ws.x;
    const tdy = ws.targetY - ws.y;
    if (Math.abs(tdx) > Math.abs(tdy)) ws.direction = tdx > 0 ? 'right' : 'left';
    else ws.direction = tdy > 0 ? 'down' : 'up';
  }

  // Move
  if (ws.walking) {
    const dx = ws.targetX - ws.x;
    const dy = ws.targetY - ws.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist < 1.5) {
      ws.x = ws.targetX; ws.y = ws.targetY;
      ws.walking = false;
      if (ws.targetX === 0 && ws.targetY === 0) ws.atDesk = true;
      if (!ws.atDesk) ws.walkTimer = 30 + Math.floor(Math.random() * 40);
      else ws.walkTimer = 80 + Math.floor(Math.random() * 160);
    } else {
      const speed = 0.7;
      ws.x += (dx/dist)*speed;
      ws.y += (dy/dist)*speed;
      if (Math.abs(dx) > Math.abs(dy)) ws.direction = dx > 0 ? 'right' : 'left';
      else ws.direction = dy > 0 ? 'down' : 'up';
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
    suit: null,
    outfits: {},
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

    // Build static background once
    if (!bgRef.current) bgRef.current = buildStaticBg();

    // Load sprite assets
    async function loadSprites() {
      const sp = spritesRef.current;
      if (sp.loaded) return;
      const [charModel, shadow, hairs, suit, ...outfits] = await Promise.all([
        loadImage('/sprites/metro/character_model.png'),
        loadImage('/sprites/metro/shadow.png'),
        loadImage('/sprites/metro/hairs.png'),
        loadImage('/sprites/metro/Suit.png'),
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
      sp.suit = suit;
      outfits.forEach((img, i) => { sp.outfits[i+1] = img; });
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
        const clkx=13*TILE+2, clky=1;
        fill(ctx,clkx,clky,12,12,'#5a4a3a');
        fill(ctx,clkx+1,clky+1,10,10,'#eee');
        px(ctx,clkx+5,clky+5,'#333'); px(ctx,clkx+6,clky+5,'#333');
        const hA=((now/3600)%12)/12*Math.PI*2-Math.PI/2;
        px(ctx,Math.round(clkx+5.5+Math.cos(hA)*2),Math.round(clky+5.5+Math.sin(hA)*2),'#333');
        const mA=((now/60)%60)/60*Math.PI*2-Math.PI/2;
        px(ctx,Math.round(clkx+5.5+Math.cos(mA)*3),Math.round(clky+5.5+Math.sin(mA)*3),'#cc3333');

        const sp = spritesRef.current;

        // Render agents
        AGENT_DEFS.forEach(agent => {
          const state = getAgentState(agent.id);
          const ws = agentWalkState[agent.id];
          updateWalkState(ws, state);

          // Update walk anim frame (cycle every 3 ticks)
          if (ws.walking) {
            ws.walkAnimFrame = Math.floor(walkAnimTick / 2) % WALK_FRAMES.length;
          }

          const isActive = state === 'typing' || state === 'reading';

          // Active monitor glow
          if (isActive) {
            drawActiveMonitor(ctx, agent.deskCol+1, agent.deskRow, frame, agent.color);
            if (agent.id === 'designer') {
              drawActiveMonitor(ctx, agent.deskCol+2, agent.deskRow, frame, '#aa55ff');
            }
            // Animated keyboard keys
            const kx = agent.deskCol*TILE+12, ky = agent.deskRow*TILE+4;
            for(let r=0;r<3;r++) for(let k=0;k<4;k++) {
              const pressed = state==='typing' && frame%4===(r+k)%4;
              px(ctx,kx+2+k*2,ky+1+r*1.5|0, pressed?'#aaa':'#666');
            }
          }

          // Character position
          const charX = Math.floor(agent.deskCol*TILE + TILE - 8 + ws.x);
          const charY = Math.floor(agent.deskRow*TILE + TILE + 2 + ws.y);
          // NPCs face their movement direction; at desk they face up (toward monitor)
          const dir = ws.walking ? ws.direction : (ws.atDesk ? 'up' : ws.direction);

          if (sp.loaded) {
            // Get spritesheet column
            const sprCol = getSpriteCol(dir, ws.walkAnimFrame, ws.walking);

            // Draw shadow
            if (sp.shadow) {
              // Shadow is a single small image, draw it under the character
              ctx.globalAlpha = 0.3;
              ctx.drawImage(sp.shadow, charX + 4, charY + 24, 24, 8);
              ctx.globalAlpha = 1;
            }

            // Draw character body (from character_model.png)
            drawSpriteFrame(ctx, sp.charModel, sprCol, agent.skinRow, charX, charY);

            // Draw Suit.png overlay (clothing for all agents)
            if (sp.suit) {
              drawSpriteFrame(ctx, sp.suit, sprCol, agent.suitRow, charX, charY);
            }

            // Draw hair overlay (skip agents with hairRow < 0, they wear hats)
            if (sp.hairs && agent.hairRow >= 0) {
              drawSpriteFrame(ctx, sp.hairs, sprCol, agent.hairRow, charX, charY);
            }
          } else {
            // Fallback: colored rectangle while loading
            fill(ctx, charX+8, charY+4, 16, 24, agent.color);
          }

          // Status bubble (work states)
          if (state !== 'idle') {
            drawStatusBubble(ctx, charX+12, charY-8, state, agent.color, frame);
          }

          // Thought bubble (idle)
          if (state === 'idle' && ws.thought) {
            drawThoughtBubble(ctx, charX+10, charY-12, ws.thought, agent.color);
          }

          // Name label
          drawNameLabel(ctx, charX+16, charY+34, agent.name, agent.color);
        });

        // Ambient particles
        for (let i = 0; i < 3; i++) {
          const ppx = ((frame*0.4+i*97)%W);
          const ppy = ((frame*0.25+i*143)%(H-TILE*3))+TILE*2;
          ctx.fillStyle='rgba(255,255,255,0.03)';
          ctx.fillRect(Math.floor(ppx),Math.floor(ppy),1,1);
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
      const ax = agent.deskCol*TILE + TILE - 8 + ws.x;
      const ay = agent.deskRow*TILE + TILE + 2 + ws.y;
      if (mx >= ax && mx < ax+SPRITE_W && my >= ay && my < ay+SPRITE_H+8) {
        onClickRef.current(agent.id);
        return;
      }
    }
    // Check desk area
    for (const agent of AGENT_DEFS) {
      const ax = agent.deskCol * TILE;
      const ay = agent.deskRow * TILE;
      if (mx >= ax && mx < ax+TILE*5 && my >= ay && my < ay+TILE*5) {
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
