const fixedPinRoot = 4.4934094579;
const bucklingCases = {
    'pin-pin': {
        title: t('Pin–pin'), k: 1, base: 'pin', top: 'pin',
        shape: t => Math.sin(Math.PI * t),
        behavior: t('Both ends stay in place and can rotate. The column bows between the two pins.'),
    },
    'fixed-fixed': {
        title: t('Fixed–fixed'), k: .5, base: 'fixed', top: 'fixed', inflections: [.25, .75],
        shape: t => 1 - Math.cos(2 * Math.PI * t),
        behavior: t('Both ends resist rotation. The curve changes concavity at the quarter points, leaving half a span between those points.'),
    },
    'fixed-pin': {
        title: t('Fixed–pin'), k: Math.PI / fixedPinRoot, base: 'fixed', top: 'pin', approximate: true,
        inflections: [1 - Math.PI / fixedPinRoot],
        shape: t => Math.sin(fixedPinRoot * t) + fixedPinRoot * (1 - t - Math.cos(fixedPinRoot * t)),
        behavior: t('The base holds its angle. The effective length runs from the point where the curve changes concavity to the pin above it.'),
    },
    'fixed-free': {
        title: t('Fixed–free'), k: 2, base: 'fixed', top: 'free',
        shape: t => 1 - Math.cos(Math.PI * t / 2),
        behavior: t('The base holds its angle. The free tip can translate and rotate, so the column acts like half of an equivalent pin-ended column.'),
    },
};

function restraintDiagram(restraint) {
    const center = 59;
    const height = 128;
    const base = 157;
    const samples = Array.from({ length: 33 }, (_, i) => restraint.shape(i / 32));
    const amplitude = Math.max(...samples);
    const x = value => fmt(center + 41 * value / amplitude);
    const y = t => fmt(base - height * t);
    const points = samples.map((value, i) =>
        `${x(value)},${y(i / 32)}`).join(' ');
    const inflections = restraint.inflections || [];
    const lower = inflections[0];
    const equivalentSpan = inflections.length ?
        `<path class="restraint-effective" d="M104 ${y(lower)}h8m-4 0V${y(lower + restraint.k)}m-4 0h8"/>
            <text class="restraint-kl" x="115" y="${y(lower + restraint.k / 2)}">KL</text>` : '';
    const end = restraint.top === 'free' ? center + 41 : center;
    const support = (kind, y, flip = 1) => {
        if (kind === 'free') return `<circle cx="${end}" cy="${y}" r="3" class="restraint-tip"/>`;
        return `<g class="restraint-support" transform="translate(${center} ${y}) scale(1 ${flip})">
            ${kind === 'pin' ? '<path d="M0 0l-9 11H9zM-14 12H14"/>' : '<path d="M-14 0H14M-12 0l-4 6m10-6l-4 6m10-6l-4 6m10-6l-4 6m10-6l-4 6"/>'}
        </g>`;
    };
    return `<svg viewBox="0 0 132 180" class="restraint-figure" aria-hidden="true">
        <path class="restraint-length" d="M28 29V157m-4-124 8-8m-8 136 8-8M24 29H43M24 157H43"/>
        <text x="16" y="97">L</text>
        <path class="restraint-axis" d="M${center} 29V157"/>
        <polyline class="restraint-bow" points="${points}"/>
        ${inflections.map(t => `<circle class="restraint-point" cx="${x(restraint.shape(t))}" cy="${y(t)}" r="2.8"/>`).join('')}
        ${equivalentSpan}
        ${support(restraint.base, base)}
        ${support(restraint.top, base - height, -1)}
        ${restraint.top === 'free'
            ? `<path class="restraint-support" d="M${end} 7V22m-3-4 3 4 3-4"/><text x="${end + 7}" y="14">P</text>` : ''}
    </svg>`;
}

function restraintPair(keys) {
    return `<div class="restraint-pair" role="group" aria-label="${t`End restraints before and after the change`}">
        ${keys.map((key, i) => {
            const restraint = bucklingCases[key];
            const length = restraint.k === 1 ? 'L' : `${numberText(restraint.k)}L`;
            return `<figure>
                ${restraintDiagram(restraint)}
                <figcaption><small>${i === 0 ? t('Before') : t('After')}</small>
                    <strong>${restraint.title}</strong>
                    <span>K = ${numberText(restraint.k)} · KL = ${length}</span>
                </figcaption>
            </figure>`;
        }).join('')}
    </div>`;
}

function restraintComparison(key) {
    const { k, behavior, approximate } = bucklingCases[key];
    const factor = Number((1 / k ** 2).toFixed(2));
    const mark = approximate ? '≈' : '=';
    return `<p>${behavior}</p><div class="restraint-results">
        <span>${t`Effective length`} <strong>KL ${mark} ${approximate ? numberText(.70) : numberText(k)}L</strong></span>
        <span>${t`Critical load`} <strong>${t`${approximate ? '≈ ' : ''}${factor}× pin–pin`}</strong></span>
    </div>`;
}

function bucklingComparison() {
    return `<section class="buckling-comparison" aria-labelledby="restraint-title">
        <h2 id="restraint-title">${t`Compare end restraints`}</h2>
        <p>${t`Same physical length L, material and section. Select a column to compare its effective length and buckling load.`}</p>
        <div class="restraint-grid" role="group" aria-label="${t`Column end restraints`}">
            ${Object.entries(bucklingCases).map(([key, restraint]) => `<button type="button" class="restraint-card"
                data-action="restraint" data-value="${key}" aria-pressed="${key === 'pin-pin'}">
                ${restraintDiagram(restraint)}
                <b>${restraint.title}</b>
                <span>K ${restraint.approximate ? '≈ 0.70' : '= ' + numberText(restraint.k)}</span>
            </button>`).join('')}
        </div>
        <div class="restraint-detail" aria-live="polite">${restraintComparison('pin-pin')}</div>
        <small class="restraint-legend"><span>${t`Original axis`}</span><span>${t`Buckled shape, exaggerated`}</span><span>${t`Effective span`}</span></small>
    </section>`;
}

let beamFigureNumber = 0;
function beamFigure(beam, reactions = [], { isolated = false, values = {}, pivot, live, rollerAtA = false } = {}) {
    const { L, a, b, points, udls, couples = [] } = beam;
    const id = `beam-${beamFigureNumber++}`;
    const x = position => 48 + position / L * 424;
    const y = 82;
    const label = [
        rollerAtA ? t`Span ${L} metres with roller A at ${a} and roller B at ${b}` : t`Span ${L} metres, pin A at ${a}, roller B at ${b}`,
        ...points.map(p => t`${p.p} kilonewtons downward at ${p.x} metres`),
        ...udls.map(w => t`${w.w} kilonewtons per metre downward from ${w.s} to ${w.e} metres`),
        ...couples.map(({ x: station, m }) => t`${numberText(m)} kN·m applied couple at ${numberText(station)} m, counterclockwise positive`),
    ].join('. ');
    const supports = [a, b].map((position, i) => `
        ${isolated ? `<circle cx="${x(position)}" cy="${y}" r="3" fill="#23343a"/>` : `<path d="M${x(position)} ${y + 1}l-12 17h24Z" fill="#fff9e8" stroke="#23343a" stroke-width="1.6"/>
        ${i || rollerAtA ? [-6, 6].map(offset => `<circle cx="${x(position) + offset}" cy="${y + 23}" r="3"
                fill="white" stroke="#23343a"/>`).join('')
            : `<rect x="${x(position) - 14}" y="${y + 18}" width="28" height="7" fill="url(#${id}-ground)"/>`}`}
        <text x="${x(position)}" y="${y + 37}" text-anchor="middle" font-size="11">${'AB'[i]}</text>`).join('');
    const positions = [...new Set([0, a, b, L, ...points.map(p => p.x), ...udls.flatMap(w => [w.s, w.e]), ...couples.map(c => c.x)])]
        .sort((left, right) => left - right);
    const loadArrow = `stroke="#a7462e" stroke-width="1.9" marker-end="url(#${id}-load)"`;
    const reactionArrow = `stroke="#155d68" stroke-width="2" fill="none" marker-end="url(#${id}-reaction)"`;
    const drafts = [
        [`M${x(a) - 35} 82H${x(a) - 4}`, x(a) - 35, 75, 'Aₓ'],
        [`M${x(a)} 62V25`, x(a) - 7, 17, 'Aᵧ'],
        [`M${x(b)} 62V25`, x(b) - 7, 17, 'Bᵧ'],
        [`M${x(a) + 17} 100A16 16 0 1 0 ${x(a) + 20} 69`, x(a) + 32, 65, 'Mₐ'],
        [`M${x(b) - 35} 82H${x(b) - 4}`, x(b) - 30, 75, 'Bₓ'],
    ];
    return `<svg class="diagram beam-figure" viewBox="0 0 520 159" role="img"
        aria-label="${label}${reactions.length ? t('. Reactions drawn: ') + reactions.map(i => drafts[i][3]).join(', ') : ''}">
        <defs>
            <marker id="${id}-load" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <path d="M0 0L6 3L0 6Z" fill="#a7462e"/>
            </marker>
            <marker id="${id}-reaction" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <path d="M0 0L6 3L0 6Z" fill="#155d68"/>
            </marker>
            <pattern id="${id}-ground" width="5" height="5" patternUnits="userSpaceOnUse">
                <path d="M0 5L5 0" stroke="#26343b" stroke-width=".8"/>
            </pattern>
        </defs>
        <path d="M${x(0)} ${y}H${x(L)}" stroke="#23343a" stroke-width="4"/>
        ${supports}
        ${points.map(({ x: position, p }) => `
            <path d="M${x(position)} 20V${y - 4}" ${loadArrow}/>
            <text x="${x(position)}" y="15" text-anchor="middle" fill="#a33a25" font-size="12">${p} kN</text>`).join('')}
        ${udls.map(({ s, e, w }) => `
            <path d="M${x(s)} 41H${x(e)}" stroke="#a7462e" stroke-width="1.8"/>
            ${Array.from({ length: 9 }, (_, i) => `<path d="M${x(s + (e - s) * i / 8)} 41V${y - 4}" ${loadArrow}/>`).join('')}
            <text x="${x((s + e) / 2)}" y="35" text-anchor="middle" fill="#a33a25" font-size="12">${w} kN/m</text>`).join('')}
        ${couples.map(({ x: position, m }) => momentGlyph(x(position), y - 5, 'C', m)).join('')}
        ${reactions.map(i => {
            const [path, tx, ty, name] = drafts[i];
            if (Object.hasOwn(values, i) || live === i) {
                const position = i === 2 || i === 4 ? b : a;
                const horizontal = i === 0 || i === 4;
                return `<g ${live === i ? 'data-draft-force' : ''}>${forceGlyph({ x: x(position), y, dx: horizontal ? 1 : 0,
                    dy: horizontal ? 0 : -1, name, unit: 'kN', labelSide: x(position) > 400 ? 'left' : 'right' }, values[i])}</g>`;
            }
            return `<path d="${path}" ${reactionArrow}/><text x="${tx}" y="${ty}" fill="#155d68" font-size="12">${name}</text>`;
        }).join('')}
        ${pivot !== undefined ? `<circle class="moment-pivot" cx="${x(pivot)}" cy="${y}" r="6"/>` : ''}
        <path d="M${x(0)} 138H${x(L)}" stroke="#65766b"/>
        ${positions.map(position => `<path d="M${x(position)} 130V144m-4-2 8-8" stroke="#65766b"/>
            <text x="${x(position)}" y="155" text-anchor="middle" font-size="11">${position} m</text>`).join('')}
    </svg>`;
}

function trussFig(){return `<svg class="diagram" viewBox="0 0 420 240" role="img" aria-label="${t`Triangular truss with pin A, roller B and a 40 kilonewton load downward at apex C. Diagonals are inclined at 45 degrees.`}"><defs><marker id="ta" orient="auto" markerWidth="7" markerHeight="7" refX="6" refY="3"><path d="M0 0L6 3L0 6" fill="#bd5237"/></marker></defs><path d="M60 182L210 32L360 182Z" fill="none" stroke="#26343b" stroke-width="4"/><path d="M210 2V26" stroke="#bd5237" stroke-width="2" marker-end="url(#ta)"/><text x="220" y="13" font-size="12" fill="#a33a25">40 kN</text><path d="M60 184l-12 15h24ZM360 184l-12 15h24Z" fill="white" stroke="#26343b"/><circle cx="354" cy="203" r="3" fill="none" stroke="#26343b"/><circle cx="366" cy="203" r="3" fill="none" stroke="#26343b"/>${[[60,182,'A'],[210,32,'C'],[360,182,'B']].map(([x,y,t])=>`<circle cx="${x}" cy="${y}" r="4" fill="#fff" stroke="#26343b"/><text x="${x-12}" y="${y-9}" font-size="12">${t}</text>`).join('')}<text x="85" y="175" font-size="12">45°</text><text x="315" y="175" font-size="12">45°</text><path d="M60 221H360M60 216V227M360 216V227" stroke="#65766b"/><text x="210" y="236" text-anchor="middle" font-size="12">8 m</text></svg>`}

const lateralNodes={A:[0,0],B:[5,0],C:[0,5],D:[5,5],E:[0,10]},lateralMembers=['AC','AB','BC','BD','CE','CD','ED'];
function lateralFig(){let px=x=>96+x*29,py=y=>338-y*29;return `<svg class="diagram" viewBox="0 0 340 395" role="img" aria-label="${t`Five joint truss, two 5 metre bays vertically and 5 metre width, 90 kN to the right at E`}"><defs><marker id="latArrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="#b84d34"/></marker></defs>${lateralMembers.map(m=>{let a=lateralNodes[m[0]],b=lateralNodes[m[1]];return `<path d="M${px(a[0])} ${py(a[1])}L${px(b[0])} ${py(b[1])}" stroke="#26343b" stroke-width="3"/>`}).join('')}${Object.entries(lateralNodes).map(([name,[x,y]])=>`<circle cx="${px(x)}" cy="${py(y)}" r="4" fill="white" stroke="#26343b"/><text x="${px(x)+(x===0?-16:10)}" y="${py(y)-8}" font-size="13" font-weight="bold">${name}</text>`).join('')}<path d="M20 48H89" stroke="#b84d34" stroke-width="2.6" marker-end="url(#latArrow)"/><text x="18" y="37" fill="#a43b27" font-size="13">90 kN</text><path d="M96 340l-12 17h24ZM241 340l-12 17h24Z" fill="#f9f4e5" stroke="#26343b"/><circle cx="235" cy="361" r="3" fill="white" stroke="#26343b"/><circle cx="247" cy="361" r="3" fill="white" stroke="#26343b"/><path d="M96 375H241M96 369V381M241 369V381M281 48V338M275 48H287M275 193H287M275 338H287" stroke="#65766b"/><g font-size="11" fill="#26343b"><text x="168" y="391" text-anchor="middle">5 m</text><text x="289" y="125">5 m</text><text x="289" y="270">5 m</text><text x="159" y="210">45°</text></g></svg>`}

let plateNumber = 0;
function plate(label, drawing, height = 180) {
    const arrow = `plate-arrow-${plateNumber++}`;
    return `<svg class="diagram plate" viewBox="0 0 460 ${height}" role="img" aria-label="${label}">
        <defs><marker id="${arrow}" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0 0L6 3L0 6Z" fill="#a7462e"/>
        </marker></defs><g style="--diagram-arrow:url(#${arrow})">${drawing}</g></svg>`;
}

function shearSegmentFigure(segment, { base, crossing, area, draft } = {}) {
    const { start, end, w, initial, final, run, zero } = segment;
    const left = 76, right = 417, axis = 140;
    const scale = Math.max(initial, Math.abs(final));
    const x = distance => left + distance / (end - start) * (right - left);
    const y = shear => axis - shear / scale * 55;
    const vertex = x(run);
    const label = base ? `d = ${numberText(run)} m` : 'd = ?';
    const hasRoot = run > 0 && run < end - start;
    const candidate = Number.isFinite(draft) && draft >= 0 && draft <= end - start ? x(draft) : null;
    const loadWidth = candidate ?? (base && hasRoot ? vertex : left);
    return plate(t`Shear diagram for the highlighted load segment from ${numberText(start)} m to ${numberText(end)} m. Shear changes from +${numberText(initial)} kN to ${numberText(final)} kN.`, `
        <text x="246" y="20" text-anchor="middle">w = ${numberText(w)} kN/m</text>
        <path class="diagram-dash" d="M${left} 60V30H${right}V60"/>
        ${loadWidth > left ? `<rect data-shear-load-area class="shear-load-area" x="${left}" y="30" width="${loadWidth - left}" height="30"/>` : ''}
        <path class="diagram-line" d="M${left} 60H${right}"/>
        ${Array.from({ length: 7 }, (_, i) => `<path class="diagram-arrow" d="M${left + i * (right - left) / 6} 30v23"/>`).join('')}
        <path class="diagram-dash" d="M${left} 64V234M${right} 64V234"/>
        <text x="12" y="83">V (kN)</text>
        ${area && hasRoot ? `<path data-shear-triangle class="diagram-fill" d="M${left} ${axis}V${y(initial)}L${vertex} ${axis}Z"/>` : ''}
        <path class="diagram-line" d="M46 ${axis}H443"/>
        <text x="34" y="${axis + 4}">0</text><text x="447" y="${axis + 4}">x</text>
        <path class="shear-segment-line" d="M${left} ${y(initial)}L${right} ${y(final)}"/>
        <text x="${left + 8}" y="${y(initial) - 8}">+${numberText(initial)} kN</text>
        <text x="${right - 6}" y="${y(final) + 17}" text-anchor="end">${final > 0 ? '+' : ''}${numberText(final)} kN</text>
        ${hasRoot ? `<circle data-shear-zero="${crossing ? fmt(zero) : ''}" cx="${vertex}" cy="${axis}" r="5"/>
            ${base ? `<path class="diagram-dash" d="M${vertex} 60V${axis - 6}"/>` : ''}
            <path class="diagram-dash" d="M${vertex} ${axis + 7}V204M${left} 204H${vertex}"/>
            <text x="${(left + vertex) / 2}" y="221" text-anchor="middle">${label}</text>` : ''}
        ${crossing && hasRoot ? `<text x="${vertex}" y="251" text-anchor="middle">x = ${numberText(zero)} m</text>` : ''}
        ${candidate === null ? '' : `<path data-shear-draft class="shear-segment-draft" d="M${candidate} 30V195"/><circle cx="${candidate}" cy="${axis}" r="4" class="shear-segment-draft"/>`}
        <text x="${left}" y="251" text-anchor="middle">x = ${numberText(start)} m</text>
        <text x="${right}" y="251" text-anchor="middle">x = ${numberText(end)} m</text>`, 264);
}

function rightTrianglePlate({ run, rise, diagonal, unit = '', angle } = {}) {
    const side = (name, length) => length == null ? name : `${name} · ${numberText(length)}${unit ? ` ${unit}` : ''}`;
    const left = 140, base = 145;
    const width = run ?? 4;
    const height = rise ?? (angle ? width * Math.tan(angle * Math.PI / 180) : 3);
    const scale = Math.min(180 / width, 135 / height);
    const right = left + width * scale;
    const top = base - height * scale;
    const theta = Math.atan2(height, width);
    return plate(t('Right triangle with the horizontal, vertical, and diagonal sides labeled'), `
        <path class="diagram-fill" d="M${left} ${base}H${right}V${top}Z"/>
        <path class="diagram-line" d="M${right - 13} ${base}v-13h13M${left + 34} ${base}A34 34 0 0 0 ${left + 34 * Math.cos(theta)} ${base - 34 * Math.sin(theta)}"/>
        <text x="${left + 42}" y="${base - 6}">${angle ? `${numberText(angle)}°` : 'θ'}</text>
        <text x="${(left + right) / 2}" y="165" text-anchor="middle">${side(t('adjacent'), run)}</text>
        <text x="${right + 8}" y="${(top + base) / 2}">${side(t('opposite'), rise)}</text>
        <text x="${(left + right) / 2 - 10}" y="${(top + base) / 2 - 18}" text-anchor="end">${side(t('hypotenuse'), diagonal)}</text>`);
}

const plates = {
    triangle: () => plate(t('Right triangle with adjacent leg 4, opposite leg 3, and hypotenuse 5.'), `
        <path class="diagram-fill" d="M140 145H320V10Z"/>
        <path class="diagram-line" d="M304 145V129H320M177 145A37 37 0 0 0 169.6 122.8"/>
        <text x="183" y="135">θ</text><text x="181" y="161">${t`adjacent · 4 m`}</text>
        <text x="328" y="87">${t`opposite · 3 m`}</text><text x="145" y="70">${t`hypotenuse · 5 m`}</text>`),
    load: () => plate(t('Roof pressure passes to roof beams, columns, and foundations.'), `
        <path class="diagram-fill" d="M60 59L181 38H397L275 59Z"/>
        <path class="diagram-line" d="M60 59H275L397 38M80 68H275M93 70V138M263 70V138M85 141H104M254 141H273M71 150H286"/>
        <path class="diagram-arrow" d="M124 13V49M176 12V41M227 12V42M278 12V42M329 12V41"/>
        <text x="345" y="22">${t('Pressure')}</text><text x="300" y="71">${t`roof / beams`}</text>
        <text x="291" y="116">${t('Columns')}</text><text x="288" y="154">${t('Foundations')}</text>`),
    vector: () => plate(t('A force points up and right. Its horizontal projection is F x and its vertical projection is F y.'), `
        <path class="diagram-line" d="M80 138V22M80 138H348M123 138A43 43 0 0 0 119 120"/>
        <path class="diagram-dash" d="M303 37V138M303 37H80"/>
        <path class="diagram-arrow" d="M80 138L303 37"/>
        <text x="309" y="39">F</text><text x="132" y="130">θ</text>
        <text x="177" y="161">${t`Fₓ = F cos θ`}</text><text x="6" y="85">Fᵧ</text>`),
    supports: () => plate(t('A pin resists two translations, a roller reacts normal to its surface, and a fixed support also resists rotation.'), `
        <path class="diagram-line" d="M34 71H120M75 71L58 99H92ZM51 104H99M175 71H263M220 71L204 97H236ZM199 110H241M329 55V106M329 71H420M317 62L329 55M317 72L329 65M317 82L329 75M317 92L329 85M317 102L329 95"/>
        <circle class="diagram-fill" cx="211" cy="103" r="5"/><circle class="diagram-fill" cx="229" cy="103" r="5"/>
        <path class="diagram-arrow" d="M75 71V31M75 71H111M220 71V31M329 71V31M329 71H374M388 114A18 18 0 1 0 359 116"/>
        <text x="62" y="143">${t`Pin`}</text><text x="200" y="143">${t`Roller`}</text><text x="349" y="143">${t`Fixed`}</text>`),
    section: () => plate(t('A T section with a 100 millimetre flange, 80 millimetre web below the flange, and centroid 67.778 millimetres from bottom.'), `
        <path class="diagram-fill" d="M140 24H280V52H224V164H196V52H140Z"/>
        <path class="diagram-dash" d="M112 69.11H318M111 164H319"/>
        <path class="diagram-line" d="M311 69.11V164M305 69.11H317M305 164H317"/>
        <text x="175" y="17">100 mm</text><text x="325" y="78">x–x</text>
        <text x="325" y="113">${numberText(67.778)} mm</text><text x="117" y="177">${t('Datum')}</text>`),
    column: () => plate(t('A pin-ended column shown straight and with its first buckled shape.'), `
        <path class="diagram-line" d="M111 37V151M95 36H127M95 152H127M309 37Q394 95 309 151M295 36H323M295 152H323"/>
        <path class="diagram-dash" d="M309 41V149"/>
        <path class="diagram-arrow" d="M111 8V32M309 8V32"/>
        <text x="39" y="97">${t`Unbraced L`}</text><text x="355" y="103">${t('Buckled')}</text><text x="121" y="24">P</text>`),
};

const stressPoints = [[65, 130.45], [95, 65], [225, 34], [305, 85]];
function stressFigure(selectable = false) {
    return `<svg class="diagram plate" viewBox="0 0 360 220" role="img" aria-label="${t`Engineering stress versus strain. A is on the initial straight rise, B at the first bend, C at the peak, and D at the end after the drop.`}">
        <path class="diagram-line" d="M40 19V185H333"/>
        <text x="44" y="22">${t`σ · Stress`}</text><text x="263" y="206">${t`ε · Strain`}</text>
        <path d="M40 185L95 65L117 68C156 64 171 34 225 34C252 34 284 54 305 85" class="diagram-line"/>
        ${stressPoints.map(([x, y], i) => `<g class="curve-point" ${selectable ? `data-point="${i}"` : ''}>
            <circle cx="${x}" cy="${y}" r="11"/><text x="${x}" y="${y + 4}" text-anchor="middle">${'ABCD'[i]}</text>
        </g>`).join('')}
    </svg>`;
}

function figureFor({ b, fig, restraints }) {
    if (b) return beamFigure(b);
    if (restraints) return restraintPair(restraints);
    if (fig === 'truss') return trussFig();
    if (fig === 'lateral') return lateralFig();
    if (fig === 'stress') return stressFigure();
    if (fig === 'column-restraints') return bucklingComparison();
    return plates[fig]?.() || '';
}
