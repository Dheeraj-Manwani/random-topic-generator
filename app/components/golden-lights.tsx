import type { CSSProperties } from "react";

// Fixed irregular arrangements avoid hydration shifts while looking loosely placed.
const bulbs = [
  [18, 37, -22], [48, 58, 19], [88, 62, -12], [123, 42, 28],
  [155, 22, -17], [182, 47, 15], [165, 89, -28], [128, 118, 12],
  [78, 127, -18], [54, 160, 23], [87, 188, -9], [138, 191, 27],
];

function LightCluster({ variant }: { variant: number }) {
  return <svg viewBox="0 0 220 230" fill="none">
    <path className="gold-wire" d="M-12 18C12 25 31 64 68 65S108 55 135 30S189 23 184 59S150 108 118 122S52 118 54 157S101 198 136 192S185 208 197 246"/>
    {bulbs.map(([x, y, rotation], index) => <g key={index} transform={`translate(${x} ${y}) rotate(${rotation})`} style={{ "--gold-delay": `${-((index * .73 + variant * 1.3) % 6)}s`, "--gold-duration": `${3.8 + (index % 4) * .65}s` } as CSSProperties} className={`gold-fairy-bulb pattern-${(index + variant) % 3}`}>
      <path d="M0 -2v7" stroke="#ad8c48" strokeWidth="1"/>
      <rect x="-2.2" y="4" width="4.4" height="4" rx="1" fill="#b49450"/>
      <ellipse className="gold-halo" cx="0" cy="12" rx="11" ry="15" fill="#f6c55d"/>
      <ellipse className="gold-bulb" cx="0" cy="12" rx="3.4" ry="6" fill="#f6d68a"/>
      <ellipse className="gold-core" cx="-.5" cy="11" rx="1.4" ry="3.6" fill="#fffbe0"/>
    </g>)}
  </svg>;
}

export default function GoldenLights() {
  return <div className="golden-lights" aria-hidden="true">
    <div className="gold-cluster corner-left"><LightCluster variant={0}/></div>
    <div className="gold-cluster corner-right"><LightCluster variant={1}/></div>
    <div className="gold-cluster scatter-left"><LightCluster variant={2}/></div>
    <div className="gold-cluster scatter-right"><LightCluster variant={3}/></div>
    <div className="gold-cluster scatter-bottom"><LightCluster variant={4}/></div>
  </div>;
}
