import { useId } from 'react';
import './garden-illustration.css';

type Plant = { name: string; icon: string; level: number };
type Decoration = { id: string; decorId: string };
type SpriteKind = 'sprout' | 'daisy' | 'tulip' | 'tree' | 'lotus' | 'cat' | 'bird' | 'lantern';
const kinds: Record<string, SpriteKind> = {
  '🌱': 'sprout', '🌼': 'daisy', '🌷': 'tulip', '🌳': 'tree',
  '🪷': 'lotus', '🐈': 'cat', '🕊️': 'bird', '🏮': 'lantern',
};
const decorKinds: Record<string, { kind: SpriteKind; name: string; x: number; y: number; size: number }> = {
  cat_sleeping: { kind: 'cat', name: 'Mèo lười', x: 730, y: 357, size: 155 },
  bird: { kind: 'bird', name: 'Chim họa mi', x: 620, y: 100, size: 80 },
  lantern: { kind: 'lantern', name: 'Đèn lồng đom đóm', x: 125, y: 102, size: 95 },
};

function Leaf({ x, y, angle = 0, color = '#799859', size = 1 }: { x: number; y: number; angle?: number; color?: string; size?: number }) {
  return <g transform={`translate(${x} ${y}) rotate(${angle}) scale(${size})`}>
    <path d="M0 0C-28-2-35-20-34-37C-13-36 4-20 0 0Z" fill={color}/>
    <path d="M0 0L-25-27" stroke="#365d43" strokeWidth="1.3" fill="none"/>
  </g>;
}
function Blossom({ x, y, color = '#f5eac3', scale = 1 }: { x: number; y: number; color?: string; scale?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    {Array.from({ length: 9 }, (_, i) => <ellipse key={i} cx="0" cy="-17" rx="6" ry="14" fill={color} transform={`rotate(${i * 40})`}/>)}
    <circle r="10" fill="#d4a94e"/><circle cx="-2" cy="-2" r="3" fill="#f2ce73"/>
  </g>;
}
function Pot({ color = '#b96f4b' }: { color?: string }) {
  return <g><path d="M47 144H113L104 187Q80 196 56 187Z" fill={color}/><path d="M44 141H116V152H44Z" fill="#d2936a"/><path d="M57 180Q80 186 103 180" stroke="#985437" strokeWidth="2" fill="none"/></g>;
}
function Sprite({ kind }: { kind: SpriteKind }) {
  if (kind === 'cat') return <g className="garden-cat-breathe">
    <path d="M137 159C170 160 166 120 143 127" fill="none" stroke="#bc8c68" strokeWidth="15" strokeLinecap="round"/>
    <ellipse cx="99" cy="157" rx="47" ry="29" fill="#d4ad83"/>
    <path d="M29 143L29 112L48 128L70 122L85 111L89 145Q90 174 59 176Q29 177 29 143Z" fill="#e0bf97"/>
    <path d="M35 123L45 133L35 138M76 125L69 134L80 138" fill="#c89080"/>
    <path d="M39 150Q45 155 51 150M66 150Q72 155 78 150" stroke="#644f41" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    <path d="M55 157L61 157L58 161Z" fill="#986b61"/>
    <path d="M24 155L39 158M24 163L40 162M77 159L94 155M77 164L94 167" stroke="#967556" strokeWidth="1.5"/>
    <path d="M104 131L99 140M119 134L115 144" stroke="#b78d65" strokeWidth="5" strokeLinecap="round"/>
    <ellipse cx="72" cy="180" rx="20" ry="7" fill="#e0bf97"/>
  </g>;
  if (kind === 'bird') return <g>
    <path d="M36 106L12 85L18 119L44 129" fill="#467783"/>
    <path d="M34 111Q40 73 89 97Q104 66 125 84Q143 103 119 117Q91 160 53 137Z" fill="#75a5ab"/>
    <path className="garden-bird-wing" d="M89 113Q64 52 37 67Q38 103 67 127Z" fill="#aac2b3"/>
    <path d="M130 93L153 102L129 107" fill="#d9ae54"/>
    <circle cx="120" cy="94" r="3" fill="#294841"/>
    <path d="M87 139L81 150M98 135L97 148" stroke="#b5a16c" strokeWidth="3" strokeLinecap="round"/>
  </g>;
  if (kind === 'lantern') return <g>
    <path d="M80 2V39M61 73V54Q80 33 99 54V73" stroke="#536050" strokeWidth="5" fill="none"/>
    <path d="M54 74H106L113 154H47Z" fill="#526154"/>
    <path d="M59 83H101L105 143H55Z" fill="#edcb75"/>
    <path d="M80 82V144" stroke="#b89850" strokeWidth="3"/>
    <circle cx="70" cy="106" r="3" fill="#fff0b6"/><circle cx="90" cy="127" r="3" fill="#fff0b6"/>
    <path d="M45 150H115V160H45ZM55 67H105V77H55Z" fill="#344f47"/>
  </g>;
  if (kind === 'tree') return <g>
    <path d="M76 181L80 49L87 181Z" fill="#956344"/>
    {[[-32, 90], [31, 85], [-23, 45], [26, 33]].map(([x,y], i) => <path key={i} d={`M82 ${y + 49}L${82 + x} ${y}`} stroke="#956344" strokeWidth="5"/>)}
    {[[46,70,31],[107,63,34],[77,35,34],[38,103,28],[113,100,31],[78,85,33]].map(([x,y,r], i) => <g key={i}><circle cx={x} cy={y} r={r} fill={i % 2 ? '#6c9255' : '#8ba761'}/><path d={`M${x-7} ${y+12}Q${x+9} ${y} ${x+5} ${y-12}`} stroke="#a7bd77" strokeWidth="3" fill="none"/></g>)}
    <Pot color="#a98658"/>
  </g>;
  if (kind === 'lotus') return <g>
    <path d="M15 155Q80 138 145 155L135 181Q80 198 25 181Z" fill="#679698"/>
    <ellipse cx="80" cy="154" rx="64" ry="14" fill="#9ab9a6"/>
    <ellipse cx="54" cy="148" rx="29" ry="10" fill="#608a55"/>
    <path d="M82 149V110" stroke="#527849" strokeWidth="4"/>
    <path d="M80 132Q43 128 39 92Q68 91 80 115Q92 86 122 92Q115 131 80 132Z" fill="#d68b9b"/>
    <path d="M80 128Q52 103 80 68Q108 104 80 128Z" fill="#efb8bc"/>
    <path d="M80 134Q49 140 39 116Q64 107 80 134Q95 106 122 116Q112 141 80 134Z" fill="#e8a5af"/>
  </g>;
  return <g>
    <Pot/>
    <g className="garden-stems">
      {kind === 'sprout' ? <>
        <path d="M80 144Q76 116 80 90" stroke="#466d43" strokeWidth="4" fill="none"/>
        <Leaf x={80} y={112} size={1.05}/><Leaf x={80} y={95} angle={95} color="#a5b977"/>
        <path d="M53 140Q80 129 107 140" fill="#6f5840"/>
      </> : kind === 'tulip' ? <>
        {[[-27,38], [0,5], [29,27]].map(([x,y], i) => <g key={i} transform={`translate(${x} ${y})`}>
          <path d={`M80 ${144-y}Q83 105 80 70`} stroke="#587d4b" strokeWidth="3" fill="none"/>
          <Leaf x={80} y={119-y/2} angle={i % 2 ? 90 : 0} size={.85} color="#8ca762"/>
          <path d="M80 81Q52 77 59 42L72 51L80 36L89 51L102 43Q110 78 80 81Z" fill={i % 2 ? '#edb1b4' : '#d98e9f'}/>
          <path d="M80 80Q70 65 73 53" stroke="#bf7386" fill="none" strokeWidth="1.5"/>
        </g>)}
      </> : <>
        {[[52,64],[83,37],[111,81]].map(([x,y], i) => <g key={i}>
          <path d={`M80 144Q${x} 105 ${x} ${y}`} fill="none" stroke="#527747" strokeWidth="3"/>
          <Leaf x={x} y={y+48} angle={i % 2 ? 100 : 0} size={.7}/>
          <Blossom x={x} y={y} scale={i === 1 ? .86 : .68}/>
        </g>)}
      </>}
    </g>
  </g>;
}

export function GardenSprite({ icon, label, className = '' }: { icon: string; label: string; className?: string }) {
  return <svg viewBox="0 0 160 200" className={`garden-sprite ${className}`} role="img" aria-label={label}><Sprite kind={kinds[icon] ?? 'sprout'}/></svg>;
}

export function GardenIllustration({ level, plants, decor = [], rain = false, cloudy = false }: {
  level: number; plants: Plant[]; decor?: Decoration[]; rain?: boolean; cloudy?: boolean;
}) {
  const titleId = useId();
  const positions: Record<SpriteKind, { x: number; y: number; size: number }> = {
    sprout: { x: 238, y: 310, size: 130 }, daisy: { x: 345, y: 240, size: 185 },
    tulip: { x: 510, y: 268, size: 180 }, tree: { x: 870, y: 159, size: 258 },
    lotus: { x: 660, y: 325, size: 160 }, cat: { x: 0, y: 0, size: 1 },
    bird: { x: 0, y: 0, size: 1 }, lantern: { x: 0, y: 0, size: 1 },
  };
  return <figure className="living-garden">
    <svg className="living-garden-canvas" viewBox="0 0 1200 560" role="img" aria-labelledby={titleId}>
      <title id={titleId}>{'Khu vườn cấp ' + level + ': ' + plants.map(p => p.name).join(', ') + (decor.length > 0 ? '; ' + decor.map(d => decorKinds[d.decorId]?.name).filter(Boolean).join(', ') : '')}</title>
      <path fill={rain ? '#627e83' : cloudy ? '#819b9d' : '#bcd9d0'} d="M0 0H1200V560H0Z"/>
      <circle cx="897" cy="93" r="38" fill={rain ? '#afbca6' : '#f1d493'}/>
      <g fill="#e6ece0"><path d="M170 92Q172 73 190 76Q197 48 221 68Q243 60 250 84Q274 78 279 94Z"/><path d="M658 141Q660 121 680 126Q692 97 713 119Q740 115 744 140Z"/></g>
      <path d="M0 244Q128 156 277 226T577 234T850 208T1200 220V371H0Z" fill="#91b29a"/>
      <path d="M0 301Q136 237 295 277T552 261T808 275T1200 254V401H0Z" fill="#709582"/>
      <path d="M0 319H1200V560H0Z" fill="#a1b285"/>
      <path d="M0 455Q242 367 485 430T1200 395V560H0Z" fill="#8a9f72"/>
      <g fill="#ddcfac">
        {Array.from({ length: 35 }, (_, i) => <path key={i} d={`M${i*36} 365V269L${i*36+12} 253L${i*36+24} 269V365Z`}/>)}
        <path d="M0 290H1200V300H0ZM0 336H1200V345H0Z" fill="#c4b591"/>
      </g>
      <path d="M0 508Q336 471 621 499T1200 481V560H0Z" fill="#cbb795"/>
      <path d="M0 541H1200V560H0Z" fill="#af9472"/>
      <g fill="#487358">
        <path d="M0 369Q20 282 53 299Q74 246 101 290Q124 266 148 324Q175 295 197 357L191 463H0Z"/>
        <path d="M1100 432Q1074 348 1111 330Q1112 278 1138 305Q1165 248 1181 307Q1202 286 1220 318V486Z"/>
      </g>
      <g stroke="#a37350" strokeWidth="11" fill="none"><path d="M77 494V123H201M142 123V101"/></g>
      <g>
        {Array.from({ length: 10 }, (_, i) => <Leaf key={i} x={81 + (i%2)*4} y={162+i*25} angle={i%2 ? 90 : -12} color={i%2 ? '#9eb36f' : '#779951'} size={.75}/>)}
        <path d="M20 500H177L163 463H33Z" fill="#a86847"/><path d="M17 458H181V470H17Z" fill="#c6885e"/>
        {[29,63,97,133,163].map((x,i) => <g key={x}><path d={`M${x} 460Q${x+15} 423 ${x} 389`} stroke="#688e51" strokeWidth="4" fill="none"/><Leaf x={x} y={430} size={.7} angle={i%2 ? 90 : 0}/><Blossom x={x} y={387+i%2*22} color={i%2 ? '#e5ab91' : '#e9ca75'} scale={.44}/></g>)}
      </g>
      <g stroke="#476f53" strokeWidth="4" fill="none" strokeLinecap="round">
        {[194,214,846,864,1150,1170].map((x,i) => <path key={x} d={`M${x} 491L${x-8} ${465-i%2*12}M${x} 491L${x+10} 470`}/>)}
      </g>
      <g transform="translate(1010 425)"><path d="M0 15Q-21-18-28 13Q-28 31 0 34" fill="none" stroke="#5f8e8a" strokeWidth="7"/><path d="M0 0H52L49 65H3Z" fill="#699d96"/><path d="M48 22L76 3L90 9L50 43Z" fill="#699d96"/><path d="M78 0L92 5L97 17L88 21Z" fill="#aac1a5"/><path d="M3 3H49V12H3Z" fill="#9ebbad"/></g>
      {plants.map(plant => {
        const kind = kinds[plant.icon] ?? 'sprout';
        const { x, y, size } = positions[kind];
        return <svg key={plant.name} data-garden-plant={kind} x={x} y={y} width={size} height={size*1.25} viewBox="0 0 160 200" overflow="visible" role="img" aria-label={plant.name}><title>{plant.name}</title><Sprite kind={kind}/></svg>;
      })}
      {decor.map(item => {
        const spec = decorKinds[item.decorId];
        if (!spec) return null;
        return <g key={item.id} data-garden-decor={item.decorId} className={spec.kind === 'bird' ? 'garden-bird-flight' : undefined}>
          <svg x={spec.x} y={spec.y} width={spec.size} height={spec.size*1.25} viewBox="0 0 160 200" overflow="visible" role="img" aria-label={spec.name}><title>{spec.name}</title><Sprite kind={spec.kind}/></svg>
        </g>;
      })}
      {rain && <g className="garden-rain" aria-hidden="true" stroke="#dfebe3" strokeLinecap="round">
        {Array.from({ length: 52 }, (_, i) => {
          const duration = 0.85 + ((i * 17) % 65) / 100;
          const length = 12 + ((i * 7) % 15);
          return <path key={i} className="garden-raindrop"
            d={`M${(i * 137) % 1264} 0l${-length * 0.103} ${length}`}
            strokeWidth={i % 3 === 0 ? 1.6 : 1}
            opacity={0.22 + (i % 4) * 0.08}
            style={{ animationDuration: duration + 's', animationDelay: -(i * 0.618 % 1) * duration + 's' }}/>;
        })}
      </g>}
    </svg>
    <figcaption><span>Một góc xanh, lớn lên cùng bạn.</span><span>{plants.length} cây · {decor.length} đồ trang trí</span></figcaption>
  </figure>;
}
