import { beadColors, type CustomRosary } from "@/lib/customizer"

/*
 * Desenho do terço montado com as escolhas do cliente.
 * Volta: 5 dezenas de 10 contas separadas por 4 contas maiores; a 3ª dezena fica no topo
 * e recebe as letras do nome (até 10). Embaixo: medalha, cauda de 5 contas e crucifixo.
 */

const W = 360
const CX = W / 2
const CY = 168
const RX = 136
const RY = 142
const GAP = 0.42 // abertura (rad) embaixo da volta, onde fica a medalha
const N = 54 // 50 contas pequenas + 4 grandes

type Bead = { x: number; y: number; big: boolean; letter?: string }

function loopBeads(name: string): Bead[] {
  const letters = [...name]
  const start = 22 + Math.floor((10 - letters.length) / 2)
  return Array.from({ length: N }, (_, i) => {
    const t = GAP / 2 + ((i + 0.5) * (2 * Math.PI - GAP)) / N
    // arredondado: seno/cosseno podem diferir na última casa entre servidor e navegador (erro de hidratação)
    const x = Math.round((CX + RX * Math.sin(t)) * 100) / 100
    const y = Math.round((CY + RY * Math.cos(t)) * 100) / 100
    const bead: Bead = { x, y, big: i === 10 || i === 21 || i === 32 || i === 43 }
    // no topo o índice cresce da direita para a esquerda: a 1ª letra fica no maior índice
    const j = letters.length - 1 - (i - start)
    if (i >= start && j >= 0 && j < letters.length && letters[j] !== " ") bead.letter = letters[j]
    return bead
  })
}

const MEDAL_Y = CY + RY + 12
const TAIL = [MEDAL_Y + 30, MEDAL_Y + 50, MEDAL_Y + 66, MEDAL_Y + 82, MEDAL_Y + 102]
const CROSS_TOP = MEDAL_Y + 118

function Medal({ medal }: { medal: CustomRosary["medal"] }) {
  const inner = {
    aparecida: "#2c3e8f",
    gracas: "#8fb3e0",
    "sagrado-coracao": "#f3e3d3",
    "sao-bento": "#e9e4d8",
    "espirito-santo": "#f6f1e3",
  }[medal]
  return (
    <g transform={`translate(${CX} ${MEDAL_Y})`}>
      <ellipse rx="13" ry="16" fill="url(#metal)" stroke="#7d7d84" strokeWidth="1" />
      <ellipse rx="9.5" ry="12.5" fill={inner} />
      {medal === "aparecida" && <path d="M0 -9 L5 7 L-5 7 Z" fill="#d9b25c" />}
      {medal === "gracas" && <path d="M0 -9 L4.5 7 L-4.5 7 Z M-6 -2 L6 -2" fill="#ffffff" stroke="#ffffff" strokeWidth="1" />}
      {medal === "sagrado-coracao" && (
        <path d="M0 7 C-9 0 -7 -8 -2.5 -6 C-1 -5.4 0 -4 0 -3 C0 -4 1 -5.4 2.5 -6 C7 -8 9 0 0 7 Z" fill="#b3202c" />
      )}
      {medal === "sao-bento" && <path d="M-1.5 -9 h3 v6.5 h6.5 v3 h-6.5 v8.5 h-3 v-8.5 h-6.5 v-3 h6.5 Z" fill="#5c5c63" />}
      {medal === "espirito-santo" && (
        <path d="M0 -2 C-4 -7 -9 -5 -8 -2 C-5 -3 -3 -1 -1 1 L0 7 L1 1 C3 -1 5 -3 8 -2 C9 -5 4 -7 0 -2 Z" fill="#c9a24f" />
      )}
    </g>
  )
}

function Crucifix({ kind }: { kind: CustomRosary["crucifix"] }) {
  const wood = kind === "madeira"
  const fill = wood ? "url(#wood)" : "url(#metal)"
  const stroke = wood ? "#5b3a1f" : "#6f6f77"
  return (
    <g transform={`translate(${CX} ${CROSS_TOP})`}>
      <circle cy="-3" r="3.5" fill="none" stroke="#8d8d94" strokeWidth="1.6" />
      <rect x="-4" y="0" width="8" height="64" rx="1.5" fill={fill} stroke={stroke} strokeWidth="0.8" />
      <rect x="-20" y="14" width="40" height="8" rx="1.5" fill={fill} stroke={stroke} strokeWidth="0.8" />
      {kind === "metal-ornamentado" &&
        [
          [0, 2],
          [-21, 18],
          [21, 18],
          [0, 64],
        ].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="4.5" fill="url(#metal)" stroke={stroke} strokeWidth="0.8" />)}
      {kind !== "metal-classico" && (
        // Cristo em metal
        <path
          d="M0 12 a2.6 2.6 0 1 1 0.01 0 Z M-14 18 L-2 17 L-1.5 30 L-2.5 46 L0 50 L2.5 46 L1.5 30 L2 17 L14 18 L14 19.5 L2 20 L-2 20 L-14 19.5 Z"
          fill={wood ? "#cfcfd4" : "#4f4f57"}
        />
      )}
    </g>
  )
}

export function RosaryPreview({ custom, className }: { custom: CustomRosary; className?: string }) {
  const color = beadColors.find((c) => c.id === custom.color)!
  const beads = loopBeads(custom.name)
  const matte = custom.color === "preto"

  return (
    <svg viewBox={`0 0 ${W} ${CROSS_TOP + 76}`} className={className} role="img" aria-label="Prévia do terço personalizado">
      <defs>
        <radialGradient id="bead" cx="35%" cy="32%" r="70%">
          <stop offset="0%" stopColor={color.shine} stopOpacity={matte ? 0.55 : 1} />
          <stop offset="55%" stopColor={color.hex} />
          <stop offset="100%" stopColor={color.hex} stopOpacity="0.85" />
        </radialGradient>
        <linearGradient id="metal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f2f2f4" />
          <stop offset="50%" stopColor="#a9a9b0" />
          <stop offset="100%" stopColor="#d8d8dc" />
        </linearGradient>
        <linearGradient id="wood" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#7a4d2b" />
          <stop offset="50%" stopColor="#a8724a" />
          <stop offset="100%" stopColor="#6d4325" />
        </linearGradient>
      </defs>

      {/* fio */}
      <ellipse cx={CX} cy={CY} rx={RX} ry={RY} fill="none" stroke="#9b9ba2" strokeWidth="1.2" />
      <line x1={CX} y1={MEDAL_Y} x2={CX} y2={CROSS_TOP} stroke="#9b9ba2" strokeWidth="1.2" />

      {beads.map((b, i) =>
        b.letter ? (
          <g key={i} transform={`translate(${b.x} ${b.y})`}>
            <rect x="-7.5" y="-7.5" width="15" height="15" rx="2.5" fill="#fbfaf7" stroke="#cfc9bd" strokeWidth="0.8" />
            <text y="4" textAnchor="middle" fontSize="10.5" fontWeight="700" fontFamily="ui-sans-serif, system-ui" fill="#1b1b1d">
              {b.letter}
            </text>
          </g>
        ) : (
          <circle key={i} cx={b.x} cy={b.y} r={b.big ? 8.5 : 6.2} fill="url(#bead)" />
        ),
      )}

      {TAIL.map((y, i) => (
        <circle key={y} cx={CX} cy={y} r={i === 0 || i === TAIL.length - 1 ? 8.5 : 6.2} fill="url(#bead)" />
      ))}

      <Medal medal={custom.medal} />
      <Crucifix kind={custom.crucifix} />
    </svg>
  )
}
