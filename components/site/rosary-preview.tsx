"use client"

import { useId } from "react"
import { beadColors, cords, type CustomRosary } from "@/lib/customizer"

/*
 * Desenho do terço montado com as escolhas do cliente.
 * Volta: 5 dezenas de 10 contas separadas por 4 contas maiores; a 3ª dezena fica no topo
 * e recebe as letras do nome (até 10). Embaixo: medalha, cauda de 5 contas e crucifixo.
 * A volta tem forma de gota (como o terço cai quando é segurado) e as contas ficam
 * igualmente espaçadas ao longo da corrente.
 */

const W = 360
const CX = W / 2
const CY = 170
const RX = 150
const RY = 140
const N = 54 // 50 contas pequenas + 4 grandes
const R_SMALL = 5.6
const R_BIG = 7.8
const BOTTOM_GAP = 26 // corrente livre (em comprimento) de cada lado da base, antes das contas

const round = (n: number, p = 100) => Math.round(n * p) / p

type Bead = {
  x: number
  y: number
  r: number
  big: boolean
  /** ângulo da corrente nesta conta (graus) */
  tan: number
  /** ângulo para as letras ficarem de pé (-90° a 90°) */
  angle: number
  letter?: string
}

/** Curva em gota: base estreita (de onde a corrente desce até a medalha), topo arredondado */
function curve(t: number) {
  return {
    x: CX + RX * Math.sin(t) * Math.sqrt(Math.max(0, Math.sin(t / 2))),
    y: CY + RY * Math.cos(t),
  }
}

const SAMPLES = 900
const PTS = Array.from({ length: SAMPLES + 1 }, (_, k) => curve((2 * Math.PI * k) / SAMPLES))
const LEN = PTS.reduce<number[]>((acc, p, k) => {
  acc.push(k === 0 ? 0 : acc[k - 1] + Math.hypot(p.x - PTS[k - 1].x, p.y - PTS[k - 1].y))
  return acc
}, [])
const TOTAL = LEN[SAMPLES]

/** Ponto e ângulo (graus) a uma distância `s` ao longo da curva */
function pointAt(s: number) {
  let k = 1
  while (k < SAMPLES && LEN[k] < s) k++
  const a = PTS[k - 1]
  const b = PTS[k]
  const f = (s - LEN[k - 1]) / (LEN[k] - LEN[k - 1] || 1)
  return {
    x: a.x + (b.x - a.x) * f,
    y: a.y + (b.y - a.y) * f,
    angle: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI,
  }
}

const isBig = (i: number) => i === 10 || i === 21 || i === 32 || i === 43

// posições fixas, calculadas uma vez; arredondadas porque seno/cosseno podem diferir na
// última casa entre servidor e navegador (erro de hidratação)
const LOOP: Omit<Bead, "letter">[] = (() => {
  const sizes = Array.from({ length: N }, (_, i) => (isBig(i) ? 2 * R_BIG : 2 * R_SMALL))
  const usable = TOTAL - 2 * BOTTOM_GAP
  const gap = (usable - sizes.reduce((a, b) => a + b, 0)) / (N - 1)
  let s = BOTTOM_GAP
  return sizes.map((d, i) => {
    const p = pointAt(s + d / 2)
    s += d + gap
    // leve irregularidade, como num terço de verdade (fixa, para não mudar a cada render)
    const jitter = Math.sin(i * 12.9898) * 0.6
    const rad = (p.angle * Math.PI) / 180
    // letras sempre de pé: ângulo entre -90° e 90°
    let angle = p.angle
    if (angle > 90) angle -= 180
    if (angle < -90) angle += 180
    return {
      x: round(p.x - Math.sin(rad) * jitter),
      y: round(p.y + Math.cos(rad) * jitter),
      r: d / 2,
      big: isBig(i),
      tan: round(p.angle, 10),
      angle: round(angle, 10),
    }
  })
})()

const TIP_Y = CY + RY + 8 // argola de cima da medalha, onde as duas pontas da corrente se encontram
const MEDAL_RX = 13
const MEDAL_RY = 16.5
const MEDAL_Y = TIP_Y + 1.5 + MEDAL_RY
const TAIL: { y: number; r: number }[] = (() => {
  const radii = [R_BIG, R_SMALL, R_SMALL, R_SMALL, R_BIG]
  let y = MEDAL_Y + MEDAL_RY + 4
  return radii.map((r) => {
    y += 4.5 + r
    const bead = { y: round(y), r }
    y += r
    return bead
  })
})()
const CROSS_TOP = TAIL[TAIL.length - 1].y + R_BIG + 8
const H = CROSS_TOP + 84

/** Partes do terço que a prévia pode aproximar */
export type PreviewFocus = "geral" | "contas" | "nome" | "medalha" | "cruz"

const FOCUS: Record<PreviewFocus, { x: number; y: number; s: number }> = {
  geral: { x: W / 2, y: H / 2, s: 1 },
  contas: { x: LOOP[4].x, y: LOOP[4].y - 10, s: 2.6 },
  nome: { x: CX, y: CY - RY + 12, s: 3.6 },
  medalha: { x: CX, y: MEDAL_Y + 4, s: 3 },
  cruz: { x: CX, y: CROSS_TOP + 36, s: 2.3 },
}

/** Onde cada parte aparece na prévia geral, em % da largura/altura (para os marcadores) */
export const PREVIEW_SPOTS: Record<Exclude<PreviewFocus, "geral">, { x: number; y: number }> = {
  contas: {
    x: round((LOOP[4].x / W) * 100, 10),
    y: round((LOOP[4].y / H) * 100, 10),
  },
  nome: { x: 50, y: round(((CY - RY) / H) * 100, 10) },
  medalha: { x: 50, y: round((MEDAL_Y / H) * 100, 10) },
  cruz: { x: 50, y: round(((CROSS_TOP + 40) / H) * 100, 10) },
}

type Link = { x: number; y: number; angle: number; flat: boolean }

/** Elos de corrente entre dois pontos, alternando de frente e de lado */
function chainLinks(x1: number, y1: number, x2: number, y2: number): Link[] {
  const dist = Math.hypot(x2 - x1, y2 - y1)
  const n = Math.max(1, Math.round(dist / 2.6))
  const angle = round((Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI, 10)
  return Array.from({ length: n }, (_, k) => ({
    x: round(x1 + ((x2 - x1) * (k + 0.5)) / n),
    y: round(y1 + ((y2 - y1) * (k + 0.5)) / n),
    angle,
    flat: k % 2 === 0,
  }))
}

/** Ponto na borda de uma conta, na direção de outro ponto */
function edge(b: { x: number; y: number; r: number }, tx: number, ty: number, extra = 0.4) {
  const d = Math.hypot(tx - b.x, ty - b.y) || 1
  return { x: b.x + ((tx - b.x) / d) * (b.r + extra), y: b.y + ((ty - b.y) / d) * (b.r + extra) }
}

const LINKS: Link[] = (() => {
  const links: Link[] = []
  const join = (a: { x: number; y: number; r: number }, b: { x: number; y: number; r: number }) => {
    const p = edge(a, b.x, b.y)
    const q = edge(b, a.x, a.y)
    links.push(...chainLinks(p.x, p.y, q.x, q.y))
  }
  const tip = { x: CX, y: TIP_Y, r: 2.4 }
  join(tip, LOOP[0])
  for (let i = 0; i < N - 1; i++) join(LOOP[i], LOOP[i + 1])
  join(LOOP[N - 1], tip)
  const tail = TAIL.map((t) => ({ x: CX, y: t.y, r: t.r }))
  join({ x: CX, y: MEDAL_Y + MEDAL_RY + 1.5, r: 2.4 }, tail[0])
  for (let i = 0; i < tail.length - 1; i++) join(tail[i], tail[i + 1])
  join(tail[tail.length - 1], { x: CX, y: CROSS_TOP - 4, r: 2.4 })
  return links
})()

/** Caminho do cordão de algodão: passa pelo centro das contas (fica escondido por elas) */
const CORD_PATH = [
  `M${CX} ${TIP_Y}`,
  ...LOOP.map((b) => `L${b.x} ${b.y}`),
  `L${CX} ${TIP_Y}`,
  `M${CX} ${MEDAL_Y + MEDAL_RY + 1.5} V${CROSS_TOP - 4}`,
].join(" ")

/** Nós do cordão: um entre cada par de contas, como nos terços de cordão amarrado */
const KNOTS = LOOP.slice(0, -1).map((b, i) => {
  const n = LOOP[i + 1]
  const p = edge(b, n.x, n.y, 0)
  const q = edge(n, b.x, b.y, 0)
  return { x: round((p.x + q.x) / 2), y: round((p.y + q.y) / 2) }
})

function loopBeads(name: string): Bead[] {
  const letters = [...name]
  const start = 22 + Math.floor((10 - letters.length) / 2)
  return LOOP.map((b, i) => {
    // no topo o índice cresce da direita para a esquerda: a 1ª letra fica no maior índice
    const j = letters.length - 1 - (i - start)
    return i >= start && j >= 0 && j < letters.length && letters[j] !== " " ? { ...b, letter: letters[j] } : b
  })
}

/** Mistura duas cores hex (t = 0 → a, t = 1 → b) */
function mix(a: string, b: string, t: number) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16))
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16))
  return `#${pa
    .map((v, i) =>
      Math.round(v + (pb[i] - v) * t)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`
}

type Material = "vidro" | "fosco" | "perola" | "madeira"
const MATERIAL: Record<CustomRosary["color"], Material> = {
  azul: "vidro",
  rosa: "vidro",
  vermelho: "vidro",
  preto: "fosco",
  perola: "perola",
  madeira: "madeira",
}

/** Prefixo único para os ids dos gradientes: várias prévias convivem na mesma página */
function useSvgIds() {
  const p = useId().replace(/[^a-zA-Z0-9_-]/g, "")
  const id = (name: string) => `${p}-${name}`
  return {
    bead: id("bead"),
    glow: id("glow"),
    pearl: id("pearl"),
    metal: id("metal"),
    metalDark: id("metal-dark"),
    metalRim: id("metal-rim"),
    wood: id("wood"),
    corpus: id("corpus"),
    shadow: id("shadow"),
  }
}
type SvgIds = ReturnType<typeof useSvgIds>
const url = (id: string) => `url(#${id})`

function MetalDefs({ ids }: { ids: SvgIds }) {
  return (
    <>
      {/* prata polida, com faixa de reflexo */}
      <linearGradient id={ids.metal} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#f7f7f8" />
        <stop offset="35%" stopColor="#c3c3c9" />
        <stop offset="55%" stopColor="#8d8d95" />
        <stop offset="75%" stopColor="#d6d6db" />
        <stop offset="100%" stopColor="#9a9aa1" />
      </linearGradient>
      {/* prata envelhecida */}
      <linearGradient id={ids.metalDark} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#d9d9dd" />
        <stop offset="40%" stopColor="#9b9ba2" />
        <stop offset="60%" stopColor="#6c6c74" />
        <stop offset="100%" stopColor="#a6a6ad" />
      </linearGradient>
      <radialGradient id={ids.metalRim} cx="35%" cy="28%" r="80%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="45%" stopColor="#bdbdc4" />
        <stop offset="100%" stopColor="#77777f" />
      </radialGradient>
      <linearGradient id={ids.wood} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#5e3a1e" />
        <stop offset="30%" stopColor="#9a6640" />
        <stop offset="55%" stopColor="#b07b52" />
        <stop offset="100%" stopColor="#6a4224" />
      </linearGradient>
      <linearGradient id={ids.corpus} x1="0" y1="0" x2="1" y2="0.4">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="45%" stopColor="#d4d4da" />
        <stop offset="100%" stopColor="#8a8a92" />
      </linearGradient>
      <filter id={ids.shadow} x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="1" dy="2.2" stdDeviation="1.6" floodColor="#000000" floodOpacity="0.28" />
      </filter>
    </>
  )
}

/** Argola de metal (liga medalha e crucifixo à corrente) */
function JumpRing({ x, y, ids }: { x: number; y: number; ids: SvgIds }) {
  return <ellipse cx={x} cy={y} rx="2.4" ry="3" fill="none" stroke={url(ids.metal)} strokeWidth="1.4" />
}

function Medal({
  medal,
  ids,
  x = CX,
  y = MEDAL_Y,
}: {
  medal: CustomRosary["medal"]
  ids: SvgIds
  x?: number
  y?: number
}) {
  const enamel = {
    aparecida: "#24367f",
    gracas: "#7fa6d8",
    "sagrado-coracao": "#f1e4d4",
    "sao-bento": "#cfcfd5",
    "espirito-santo": "#f3ecda",
  }[medal]
  const gold = "#d6ad55"
  return (
    <g transform={`translate(${x} ${y})`}>
      <JumpRing x={0} y={-MEDAL_RY - 1.5} ids={ids} />
      <JumpRing x={0} y={MEDAL_RY + 1.5} ids={ids} />
      {/* borda chanfrada */}
      <ellipse rx={MEDAL_RX} ry={MEDAL_RY} fill={url(ids.metalRim)} stroke="#6c6c74" strokeWidth="0.7" />
      <ellipse
        rx={MEDAL_RX - 1.6}
        ry={MEDAL_RY - 1.6}
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.55"
        strokeWidth="0.6"
      />
      <ellipse rx={MEDAL_RX - 2.6} ry={MEDAL_RY - 2.6} fill={enamel} stroke="#5d5d65" strokeWidth="0.6" />

      {medal === "aparecida" && (
        <g>
          {/* manto em triângulo, coroa e rosto */}
          <path
            d="M0 -8 C2.5 -8 3 -5.6 2.4 -4 C4.6 0.5 5.6 4.8 6 9.4 C2 10.6 -2 10.6 -6 9.4 C-5.6 4.8 -4.6 0.5 -2.4 -4 C-3 -5.6 -2.5 -8 0 -8 Z"
            fill={gold}
          />
          <path d="M-1.6 -7.4 C-1.6 -3 1.6 -3 1.6 -7.4 Z" fill="#3a2a1d" />
          <path d="M-2.6 -8.4 L-2 -11 L-1 -9.4 L0 -11.8 L1 -9.4 L2 -11 L2.6 -8.4 Z" fill="#f1d68a" />
          <path d="M-3 2 C-1 3 1 3 3 2 M-4 6 C-1.4 7 1.4 7 4 6" fill="none" stroke="#a8812f" strokeWidth="0.5" />
        </g>
      )}
      {medal === "gracas" && (
        <g>
          {/* Nossa Senhora com raios saindo das mãos */}
          <circle cy="-7.2" r="1.9" fill="#ffffff" />
          <path d="M-2 -5 L2 -5 L3.6 9.6 L-3.6 9.6 Z" fill="#ffffff" />
          <path d="M-2 -3 L-4.6 1 M2 -3 L4.6 1" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" />
          <path
            d="M-4.6 1.6 L-7 7 M-4.4 1.8 L-5.8 8.6 M4.6 1.6 L7 7 M4.4 1.8 L5.8 8.6"
            stroke={gold}
            strokeWidth="0.55"
          />
          <path
            d="M-5 -10.5 A6 6 0 0 1 5 -10.5"
            fill="none"
            stroke="#ffffff"
            strokeOpacity="0.7"
            strokeWidth="0.5"
            strokeDasharray="0.6 0.9"
          />
        </g>
      )}
      {medal === "sagrado-coracao" && (
        <g>
          {/* coração com chamas, cruz e coroa de espinhos */}
          <path d="M0 -6 C-1.4 -8.4 -0.6 -10 0 -11.4 C0.6 -10 1.4 -8.4 0 -6 Z" fill="#e38b2c" />
          <path d="M-0.4 -9.6 h0.8 v-2 h-0.8 Z M-1.2 -10.8 h2.4 v0.6 h-2.4 Z" fill={gold} />
          <path
            d="M0 8 C-10 1 -8 -7.5 -3 -6 C-1.4 -5.5 0 -4 0 -3 C0 -4 1.4 -5.5 3 -6 C8 -7.5 10 1 0 8 Z"
            fill="#a51c2a"
          />
          <path
            d="M-5.6 -1.4 C-2 0.4 2 0.4 5.6 -1.4"
            fill="none"
            stroke="#3f5a2a"
            strokeWidth="0.9"
            strokeDasharray="0.8 0.5"
          />
          <ellipse cx="-2.6" cy="-3.2" rx="1.4" ry="0.8" fill="#ffffff" opacity="0.35" />
        </g>
      )}
      {medal === "sao-bento" && (
        <g>
          {/* cruz de São Bento dentro de um círculo, em relevo */}
          <circle r="7.6" fill="none" stroke="#7a7a82" strokeWidth="0.8" />
          <circle r="6.2" fill="none" stroke="#f2f2f4" strokeOpacity="0.8" strokeWidth="0.4" />
          <path
            d="M-1.4 -6 h2.8 v4.6 h4.6 v2.8 h-4.6 v4.6 h-2.8 v-4.6 h-4.6 v-2.8 h4.6 Z"
            fill={url(ids.metalDark)}
            stroke="#55555c"
            strokeWidth="0.4"
          />
          <circle cx="-4.4" cy="-4.4" r="0.6" fill="#55555c" />
          <circle cx="4.4" cy="-4.4" r="0.6" fill="#55555c" />
          <circle cx="-4.4" cy="4.4" r="0.6" fill="#55555c" />
          <circle cx="4.4" cy="4.4" r="0.6" fill="#55555c" />
        </g>
      )}
      {medal === "espirito-santo" && (
        <g>
          {/* pomba descendo com raios */}
          <path d="M0 1 L-6 9 M0 1 L-2.2 10 M0 1 L2.2 10 M0 1 L6 9" stroke={gold} strokeWidth="0.55" />
          <path
            d="M0 -1 C-2 -5 -6 -8 -9 -6.4 C-6.4 -5.6 -4.6 -3.6 -2.6 -1.2 C-1.6 0 -1 1.4 -1 3 L0 4.6 L1 3 C1 1.4 1.6 0 2.6 -1.2 C4.6 -3.6 6.4 -5.6 9 -6.4 C6 -8 2 -5 0 -1 Z"
            fill="#ffffff"
            stroke="#c9a24f"
            strokeWidth="0.45"
          />
          <circle cy="-3.2" r="1.3" fill="#ffffff" stroke="#c9a24f" strokeWidth="0.4" />
        </g>
      )}

      {/* brilho do metal/esmalte */}
      <path
        d={`M${-MEDAL_RX + 3.4} -4 A${MEDAL_RX - 3} ${MEDAL_RY - 3} 0 0 1 2 ${-MEDAL_RY + 3.2}`}
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.45"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </g>
  )
}

/** Cristo, desenhado com o centro do braço da cruz em y ≈ 20 */
const CORPUS =
  "M-2.8 18 C-8 17.6 -14 16.6 -20.6 16 L-21.6 17.2 L-20.6 18.6 C-14 19.2 -8 20.2 -3 21.2 L-2.3 30 L-3.3 31 L-2.5 36.6 C-2.1 41 -1.9 45 -1.3 49 L-0.4 56.4 L0.9 57.6 L1.5 56.2 L1.9 49 C2.3 45 2.5 41 2.7 36.6 L3.3 31 L2.3 30 L3 21.2 C8 20.2 14 19.2 20.6 18.6 L21.6 17.2 L20.6 16 C14 16.6 8 17.6 2.8 18 Z"

function Crucifix({
  kind,
  ids,
  x = CX,
  y = CROSS_TOP,
}: {
  kind: CustomRosary["crucifix"]
  ids: SvgIds
  x?: number
  y?: number
}) {
  const wood = kind === "madeira"
  const fill = wood ? url(ids.wood) : kind === "metal-classico" ? url(ids.metalDark) : url(ids.metal)
  const stroke = wood ? "#4a2d16" : "#5d5d65"
  const BEAM = { x: -4.6, y: 0, w: 9.2, h: 74 }
  const BAR = { x: -25, y: 15.6, w: 50, h: 8.8 }
  // pontas trabalhadas (botões em trevo) do modelo ornamentado
  const tips = [
    { x: 0, y: 0, dx: 0, dy: -1 },
    { x: -25, y: 20, dx: -1, dy: 0 },
    { x: 25, y: 20, dx: 1, dy: 0 },
    { x: 0, y: 74, dx: 0, dy: 1 },
  ]
  return (
    <g transform={`translate(${x} ${y})`}>
      <JumpRing x={0} y={-4} ids={ids} />
      {kind === "metal-ornamentado" &&
        tips.map((t) => (
          <g key={`${t.x}-${t.y}`} fill={fill} stroke={stroke} strokeWidth="0.6">
            <circle cx={t.x + t.dx * 2.2 - t.dy * 3.4} cy={t.y + t.dy * 2.2 + t.dx * 3.4} r="2.6" />
            <circle cx={t.x + t.dx * 2.2 + t.dy * 3.4} cy={t.y + t.dy * 2.2 - t.dx * 3.4} r="2.6" />
            <circle cx={t.x + t.dx * 4.2} cy={t.y + t.dy * 4.2} r="3.6" />
          </g>
        ))}
      <rect
        x={BEAM.x}
        y={BEAM.y}
        width={BEAM.w}
        height={BEAM.h}
        rx="1.2"
        fill={fill}
        stroke={stroke}
        strokeWidth="0.7"
      />
      <rect x={BAR.x} y={BAR.y} width={BAR.w} height={BAR.h} rx="1.2" fill={fill} stroke={stroke} strokeWidth="0.7" />
      {wood ? (
        // veios da madeira
        <g fill="none" stroke="#3d2412" strokeOpacity="0.35" strokeWidth="0.5">
          <path d="M-2 1 C-1 20 -2.6 40 -1.4 73 M1.8 1 C2.6 26 1 48 2.2 73" />
          <path d="M-24 18.4 C-12 17.6 4 19.6 24 18.2 M-24 21.8 C-8 22.6 10 21 24 22" />
        </g>
      ) : (
        // chanfro: linha clara por dentro das bordas
        <g fill="none" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="0.5">
          <rect x={BEAM.x + 1.5} y={BEAM.y + 1.5} width={BEAM.w - 3} height={BEAM.h - 3} rx="0.6" />
          <path d={`M${BAR.x + 1.5} ${BAR.y + 1.5} H${BEAM.x} M${-BEAM.x} ${BAR.y + 1.5} H${-BAR.x - 1.5}`} />
        </g>
      )}
      {kind !== "metal-classico" && (
        <g>
          {/* placa INRI e Cristo em relevo */}
          <rect
            x="-4"
            y="5.2"
            width="8"
            height="4"
            rx="0.5"
            fill={url(ids.corpus)}
            stroke="#5d5d65"
            strokeWidth="0.3"
          />
          <g transform="translate(0 20) scale(1.14 1) translate(0 -20)">
            {/* sombra que destaca o relevo */}
            <g transform="translate(0.9 1.1)" fill="#1f1f24" opacity="0.4">
              <path d={CORPUS} />
              <circle cx="0.8" cy="14.4" r="2.6" />
            </g>
            <path d={CORPUS} fill={url(ids.corpus)} stroke="#3f3f46" strokeWidth="0.5" />
            <circle cx="0.8" cy="14.4" r="2.6" fill={url(ids.corpus)} stroke="#3f3f46" strokeWidth="0.5" />
          </g>
        </g>
      )}
    </g>
  )
}

/** Uma conta redonda, com o acabamento do material */
function RoundBead({
  x,
  y,
  r,
  material,
  ids,
  seed,
  tan = 90,
  pins = true,
  letter,
  angle = 0,
}: {
  x: number
  y: number
  r: number
  material: Material
  ids: SvgIds
  seed: number
  /** direção do furo (graus), onde aparecem as pontas do pino de metal */
  tan?: number
  /** pino de metal aparente (só na corrente; no cordão o fio passa por dentro) */
  pins?: boolean
  /** letra gravada em dourado */
  letter?: string
  angle?: number
}) {
  const spec = { vidro: 0.9, perola: 0.75, madeira: 0.22, fosco: 0.12 }[material]
  const light = material === "perola"
  return (
    <g transform={`translate(${x} ${y})`}>
      {pins && (
        // pontas do pino de metal saindo do furo
        <g transform={`rotate(${tan})`} fill={url(ids.metal)} stroke="#6c6c74" strokeWidth="0.3">
          <ellipse cx={-r - 0.2} rx="0.9" ry="1.1" />
          <ellipse cx={r + 0.2} rx="0.9" ry="1.1" />
        </g>
      )}
      <circle r={r} fill={url(ids.bead)} />
      {material === "vidro" && <circle r={r} fill={url(ids.glow)} />}
      {material === "perola" && <circle r={r} fill={url(ids.pearl)} />}
      {material === "madeira" && (
        <path
          transform={`rotate(${(seed * 47) % 180})`}
          d={`M${-r * 0.8} ${-r * 0.35} Q0 ${-r * 0.05} ${r * 0.8} ${-r * 0.4} M${-r * 0.75} ${r * 0.3} Q0 ${r * 0.6} ${r * 0.7} ${r * 0.25}`}
          fill="none"
          stroke="#3d2412"
          strokeOpacity="0.4"
          strokeWidth="0.5"
        />
      )}
      <ellipse
        cx={-r * 0.34}
        cy={-r * 0.4}
        rx={r * 0.3}
        ry={r * 0.2}
        transform={`rotate(-30 ${-r * 0.34} ${-r * 0.4})`}
        fill="#ffffff"
        opacity={spec}
      />
      {material === "vidro" && (
        // reflexo secundário da janela e borda mais escura do vidro
        <>
          <path
            d={`M${r * 0.15} ${r * 0.78} A${r * 0.8} ${r * 0.8} 0 0 0 ${r * 0.74} ${r * 0.2}`}
            fill="none"
            stroke="#ffffff"
            strokeOpacity="0.35"
            strokeWidth={r * 0.1}
            strokeLinecap="round"
          />
          <circle r={r - 0.15} fill="none" stroke="#000000" strokeOpacity="0.18" strokeWidth="0.3" />
        </>
      )}
      {letter && (
        <text
          transform={`rotate(${angle})`}
          y={r * 0.42}
          textAnchor="middle"
          fontSize={r * 1.2}
          fontWeight="700"
          fontFamily="ui-serif, Georgia, serif"
          fill={light ? "#8a6a33" : "#f3d48a"}
          stroke={light ? "#ffffff" : "#3a2a10"}
          strokeOpacity="0.55"
          strokeWidth={r * 0.08}
          paintOrder="stroke"
        >
          {letter}
        </text>
      )}
    </g>
  )
}

export function RosaryPreview({
  custom,
  focus = "geral",
  className,
}: {
  custom: CustomRosary
  /** Parte aproximada (a troca é animada) */
  focus?: PreviewFocus
  className?: string
}) {
  const f = FOCUS[focus]
  const color = beadColors.find((c) => c.id === custom.color)!
  const material = MATERIAL[custom.color]
  const beads = loopBeads(custom.name)
  const ids = useSvgIds()
  const dark = mix(color.hex, "#000000", material === "vidro" ? 0.45 : 0.35)
  // pedidos antigos não têm cordão: vale a corrente
  const cord = cords.find((c) => c.id === custom.cord) ?? cords[0]
  const chain = cord.id === "corrente"

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} role="img" aria-label="Prévia do terço personalizado">
      <defs>
        <radialGradient id={ids.bead} cx="36%" cy="32%" r="72%">
          <stop offset="0%" stopColor={material === "fosco" ? mix(color.shine, color.hex, 0.4) : color.shine} />
          <stop offset="50%" stopColor={color.hex} />
          <stop offset="100%" stopColor={dark} />
        </radialGradient>
        {/* luz que atravessa o vidro e reaparece embaixo */}
        <radialGradient id={ids.glow} cx="66%" cy="76%" r="45%">
          <stop offset="0%" stopColor={color.shine} stopOpacity="0.75" />
          <stop offset="100%" stopColor={color.shine} stopOpacity="0" />
        </radialGradient>
        {/* reflexo furta-cor da pérola */}
        <linearGradient id={ids.pearl} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f6dfe9" stopOpacity="0.5" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="100%" stopColor="#d6e6f4" stopOpacity="0.55" />
        </linearGradient>
        <MetalDefs ids={ids} />
      </defs>

      <g
        style={{
          transform: `translate(${round(W / 2 - f.s * f.x)}px, ${round(H / 2 - f.s * f.y)}px) scale(${f.s})`,
          transformOrigin: "0 0",
          transition: "transform 500ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <g filter={url(ids.shadow)}>
          {chain ? (
            // corrente: elos alternando de frente e de lado
            <g fill="none" stroke="#7d7d85" strokeLinecap="round">
              {LINKS.map((l, i) =>
                l.flat ? (
                  <ellipse
                    key={i}
                    cx={l.x}
                    cy={l.y}
                    rx="1.45"
                    ry="0.85"
                    strokeWidth="0.55"
                    transform={`rotate(${l.angle} ${l.x} ${l.y})`}
                  />
                ) : (
                  <path
                    key={i}
                    d={`M${l.x - 1.3} ${l.y} H${l.x + 1.3}`}
                    strokeWidth="0.75"
                    transform={`rotate(${l.angle} ${l.x} ${l.y})`}
                  />
                ),
              )}
            </g>
          ) : (
            // cordão de algodão torcido, com nós entre as contas
            <g fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d={CORD_PATH} stroke={mix(cord.hex, "#000000", 0.35)} strokeWidth="2.3" />
              <path d={CORD_PATH} stroke={cord.hex} strokeWidth="1.7" />
              <path d={CORD_PATH} stroke={mix(cord.hex, "#ffffff", 0.35)} strokeWidth="1.7" strokeDasharray="0.7 1.3" />
              {KNOTS.map((k, i) => (
                <circle
                  key={i}
                  cx={k.x}
                  cy={k.y}
                  r="1.5"
                  fill={cord.hex}
                  stroke={mix(cord.hex, "#000000", 0.4)}
                  strokeWidth="0.45"
                />
              ))}
            </g>
          )}

          {beads.map((b, i) => (
            <RoundBead
              key={i}
              x={b.x}
              y={b.y}
              r={b.r}
              material={material}
              ids={ids}
              seed={i}
              tan={b.tan}
              pins={chain}
              letter={b.letter}
              angle={b.angle}
            />
          ))}

          {TAIL.map((b, i) => (
            <RoundBead key={b.y} x={CX} y={b.y} r={b.r} material={material} ids={ids} seed={i + N} pins={chain} />
          ))}

          <Medal medal={custom.medal} ids={ids} />
          <Crucifix kind={custom.crucifix} ids={ids} />
        </g>
      </g>
    </svg>
  )
}

/** Miniatura da medalha, usada nos cartões de escolha */
export function MedalIcon({ medal, className }: { medal: CustomRosary["medal"]; className?: string }) {
  const ids = useSvgIds()
  return (
    <svg viewBox="-16 -22 32 44" className={className} aria-hidden>
      <defs>
        <MetalDefs ids={ids} />
      </defs>
      <Medal medal={medal} ids={ids} x={0} y={0} />
    </svg>
  )
}

/** Miniatura do crucifixo, usada nos cartões de escolha */
export function CrucifixIcon({ kind, className }: { kind: CustomRosary["crucifix"]; className?: string }) {
  const ids = useSvgIds()
  return (
    <svg viewBox="-31 -10 62 92" className={className} aria-hidden>
      <defs>
        <MetalDefs ids={ids} />
      </defs>
      <Crucifix kind={kind} ids={ids} x={0} y={0} />
    </svg>
  )
}
