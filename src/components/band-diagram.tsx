export default function BandDiagram() {
  return <figure className="band-diagram">
    <svg viewBox="0 0 620 420" role="img" aria-labelledby="bands-title bands-desc">
      <title id="bands-title">Allowed electronic energies in a semiconductor</title>
      <desc id="bands-desc">Energy increases upward. Valence states occupy a lower energy range; conduction states occupy a higher range. The intervening band gap is an energy interval, not a physical layer or distance.</desc>
      <defs><linearGradient id="band-fill" x2="0" y2="1"><stop stopColor="#96c4fa" stopOpacity=".4"/><stop offset="1" stopColor="#96c4fa" stopOpacity=".1"/></linearGradient></defs>
      <path d="M65 360V40l-7 14m7-14 7 14" fill="none" stroke="#c4d9ed" strokeWidth="2"/>
      <text x="25" y="210" transform="rotate(-90 25 210)" fill="#c4d9ed">Electronic energy E (eV)</text>
      <rect x="120" y="58" width="400" height="90" fill="url(#band-fill)"/>
      <rect x="120" y="270" width="400" height="90" fill="#65c9aa" opacity=".2"/>
      <path d="M120 148H520 M120 270H520" stroke="#b1e4d3" strokeWidth="2"/>
      <text x="142" y="102" fill="#c4d9ed">Conduction-band states</text><text x="142" y="316" fill="#b1e4d3">Valence-band states</text>
      <text x="535" y="154" fill="#c4d9ed">E꜀</text><text x="535" y="276" fill="#b1e4d3">Eᵥ</text>
      <path d="M160 161V258m-5-91 5-7 5 7m-10 84 5 7 5-7" stroke="#f2c48e" strokeWidth="2" fill="none"/>
      <text x="183" y="207" fill="#f2c48e">E𝗀 = E꜀ − Eᵥ</text><text x="183" y="234" fill="#adbdce">No allowed bulk states in this interval</text>
      <text x="120" y="395" fill="#adbdce">Conceptual energy diagram · no real-space axis</text>
    </svg>
    <figcaption>Gate fields, doping and temperature change band alignment or occupancy. The height here represents energy; it does not represent the thickness of silicon.</figcaption>
  </figure>;
}
