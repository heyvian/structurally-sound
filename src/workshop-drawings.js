function workshopFigure(markup, points = {}, label = '') {
    return { markup, points, label };
}

function workshopBeam(beam, reactions = []) {
    const x = metres => (48 + metres / beam.L * 424) / 5.2;
    return workshopFigure(beamFigure(beam, reactions), {
        A: [x(beam.a), 51.6], B: [x(beam.b), 51.6],
        start: [x(4), 51.6], mid: [x(6), 51.6], end: [x(8), 51.6],
    });
}

function momentArm(aboutA) {
    const pivot = aboutA ? 68 : 388;
    const arm = aboutA ? 2 : 6;
    return workshopFigure(plate(t`A 24 kN downward force and a ${arm} m perpendicular arm measured from ${aboutA ? 'A' : 'B'}.`, `
        <path class="diagram-line" d="M68 89H388M68 89l-11 14h22zM388 89l-11 14h22z"/>
        <path class="diagram-arrow" d="M148 29V84"/><text x="158" y="36">24 kN</text>
        <text x="66" y="118" text-anchor="middle">A</text><text x="390" y="118" text-anchor="middle">B</text>
        <circle cx="${pivot}" cy="89" r="6" fill="#d6f447" stroke="#2945a7" stroke-width="2"/>
        <path class="diagram-dash" d="M${pivot} 109V145M148 89V145M${pivot} 138H148"/>
        <text x="${(pivot + 148) / 2}" y="158" text-anchor="middle">${arm} m</text>`), {},
    t`The highlighted support ${aboutA ? 'A' : 'B'} is the point we are measuring about.`);
}

function workshopTrussFigure(variant) {
    const { nodes, members, load } = workshopTruss;
    const px = x => 104 + x * 26;
    const py = y => 307 - y * 26;
    const reactions = variant === 'truss-reactions';
    const solved = variant === 'truss-solved';
    const points = {};
    const joints = Object.entries(nodes).map(([name, [x, y]]) => {
        const centerX = px(x);
        const centerY = py(y);
        points[name] = [centerX / 3.4, centerY / 3.55];
        return `<circle cx="${centerX}" cy="${centerY}" r="4"/><text x="${centerX + 10}" y="${centerY - 8}">${name}</text>`;
    }).join('');
    const rods = members.map(name => {
        const [x1, y1] = nodes[name[0]];
        const [x2, y2] = nodes[name[1]];
        const forceType = ['BC', 'BD', 'ED'].includes(name) ? 'compression' : 'tension';
        return `<path class="${solved ? forceType : 'frame'}" d="M${px(x1)} ${py(y1)}L${px(x2)} ${py(y2)}"/>`;
    }).join('');
    return workshopFigure(`<svg class="diagram truss-workshop" viewBox="0 0 340 355" role="img"
        aria-label="${t`Five-joint truss with A pinned, B on a roller, and a 90 kN rightward force at E. Supports are 5 m apart and E is 10 m above A.`}">
        <defs>
            <marker id="workshop-load" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6Z" fill="#b53726"/></marker>
            <marker id="workshop-reaction" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6Z" fill="#2945a7"/></marker>
        </defs>
        <path class="truss-dim" d="M104 336H234M104 331V341M234 331V341M285 47V307M280 47H290M280 177H290M280 307H290"/>
        <text x="167" y="349" text-anchor="middle">5 m</text><text x="292" y="116">5 m</text><text x="292" y="248">5 m</text>
        ${rods}
        <path class="support-symbol" d="M104 309l-11 14h22zM234 309l-11 14h22z"/>
        <circle class="support-symbol" cx="229" cy="327" r="2.5"/><circle class="support-symbol" cx="239" cy="327" r="2.5"/>
        <path class="given-load" d="M28 47H94" marker-end="url(#workshop-load)"/><text x="29" y="33">${load} kN</text>
        ${reactions ? `<path class="reaction-force" d="M43 307H91" marker-end="url(#workshop-reaction)"/><text x="44" y="294">Aₓ</text>
            <path class="reaction-force" d="M104 297V251" marker-end="url(#workshop-reaction)"/><text x="80" y="248">Aᵧ</text>
            <path class="reaction-force" d="M234 297V251" marker-end="url(#workshop-reaction)"/><text x="244" y="248">Bᵧ</text>` : ''}
        ${joints}
        ${solved ? `<text x="18" y="342" class="tension-text">${t("Tension")}</text><text x="246" y="342" class="compression-text">${t("Compression")}</text>` : ''}
    </svg>`, points, reactions ? t('The blue arrows show the assumed positive directions. A negative result reverses the corresponding arrow.') : '');
}

function workshopPlot(kind) {
    const moment = kind === 'M';
    const axis = 104;
    const peak = moment ? '48 kN·m' : '24 kN';
    return workshopFigure(`<svg class="diagram lesson-plot" viewBox="0 0 380 211" role="img"
        aria-label="${moment ? t('Moment is zero at each support and reaches positive 48 kilonewton metres at midspan, drawn below the axis.') : t('Shear decreases from positive 24 kilonewtons at A to negative 24 kilonewtons at B and crosses zero at midspan.')}">
        <path class="plot-axis" d="M26 ${axis}H359"/>
        <path class="plot-guide" d="M48 29V182M190 29V182M332 29V182"/>
        ${moment ? '<path class="plot-area" d="M48 104Q190 252 332 104Z"/><path class="plot-line" d="M48 104Q190 252 332 104"/>' :
            '<path class="plot-area" d="M48 104V33L190 104Z"/><path class="plot-area negative" d="M190 104L332 175V104Z"/><path class="plot-line" d="M30 104H48V33L332 175V104H353"/>'}
        <text x="32" y="19">${moment ? t('M · positive downward') : t('V · positive upward')}</text>
        <text x="${moment ? 198 : 54}" y="${moment ? 177 : 47}">+${peak}</text>
        ${moment ? '' : '<text x="264" y="170">−24 kN</text>'}
        <text x="48" y="198" text-anchor="middle">A · 0 m</text><text x="190" y="198" text-anchor="middle">4 m</text><text x="332" y="198" text-anchor="middle">B · 8 m</text>
    </svg>`, { left: [12.6,49.3], middle: [50,49.3], right: [87.4,49.3] });
}

const workshopDrawings = {
    triangle: () => workshopFigure(plates.triangle(), { run: [48,81], rise: [70,48], brace: [49,44] }),
    'load-path': () => workshopFigure(plates.load(), { deck: [44,32], soil: [46,83] }),
    vector: () => workshopFigure(plate(t('A 10 kN force at 30 degrees above positive x, with horizontal and vertical projections.'), `
        <path class="diagram-line" d="M78 148V35M78 148H329M112 148A34 34 0 0 0 107.4 131"/>
        <path class="diagram-dash" d="M290 26V148M290 26H78"/>
        <path class="diagram-arrow" d="M78 148L290 26"/>
        <text x="300" y="29">10 kN</text><text x="118" y="139">30°</text>
        <text x="173" y="168">Fₓ</text><text x="307" y="88">Fᵧ</text>`),
        { x: [40,82], y: [63,47], f: [41,46] }),
    roof: () => workshopFigure(plate(t('Roof plan with one middle beam and 4 metre bays on both sides. The middle beam gets two half-bays.'), `
        <path class="diagram-fill" d="M112 25H348V143H112Z"/>
        <path d="M112 54H348V114H112Z" fill="#99b3e5"/>
        <path class="diagram-line" d="M112 25H348M112 84H348M112 143H348M66 25V143m-4-118h8m-8 59h8m-8 59h8"/>
        <path class="diagram-dash" d="M112 54H348M112 114H348"/>
        <text x="32" y="59">4 m</text><text x="32" y="119">4 m</text><text x="357" y="88">${t`Beam`}</text>
        <text x="230" y="166" text-anchor="middle">${t`Tributary width = 2 m + 2 m`}</text>`)),
    supports: () => workshopBeam({ L: 6, a: 0, b: 6, points: [], udls: [] }),
    'support-arrows': () => workshopBeam({ L: 6, a: 0, b: 6, points: [], udls: [] }, [0,1,2]),
    'reaction-beam': () => workshopBeam(beamStart),
    'reaction-patch': () => workshopBeam(beamStart),
    'reaction-resultant': () => workshopBeam({ ...beamStart, points: [...beamStart.points, { x: 6, p: 32 }], udls: [] }, [1,2]),
    'reaction-refresher': () => workshopBeam({ L: 6, a: 0, b: 6, points: [{x: 2, p: 18}], udls: [] }),
    'moment-a': () => momentArm(true),
    'moment-b': () => momentArm(false),
    'turning-pair': () => workshopFigure(plate(t('Equal parallel forces point up at the left end and down at the right end of a seesaw.'), `
        <path class="diagram-line" d="M80 89H380M230 89l-20 34h40z"/>
        <path class="diagram-arrow" d="M100 145V94M360 32V84"/>
        <text x="112" y="141">10 kN</text><text x="371" y="38">10 kN</text>`)),
    'shear-beam': () => workshopBeam(shearBeam),
    'sketch-beam': () => workshopBeam(sketchBeam),
    'point-beam': () => workshopBeam(center),
    'shear-plot': () => workshopPlot('V'),
    'moment-plot': () => workshopPlot('M'),
    'triangle-load': () => workshopFigure(plate(t('A triangular diagram increasing from zero at the left to its peak at the right.'), `
        <path class="diagram-fill" d="M106 131L344 39V131Z"/>
        <path class="diagram-line" d="M81 131H366M106 147H344M106 142V152M344 142V152"/>
        <text x="225" y="165" text-anchor="middle">${t`Base`}</text><text x="354" y="57">${t`Peak`}</text>`)),
    bar: () => workshopFigure(plate(t('A steel bar carries tension at each end. Measure the cross-section and the original gauge length.'), `
        <path class="diagram-fill" d="M118 65H342V119H118Z"/>
        <path class="diagram-arrow" d="M117 92H55M343 92H405"/>
        <path class="diagram-dash" d="M122 130H337M122 123V137M337 123V137"/>
        <text x="230" y="153" text-anchor="middle">${t`Original gauge length L₀`}</text><text x="227" y="57" text-anchor="middle">${t`Cross-section A`}</text>`)),
    'stress-track': () => workshopFigure(stressFigure(), {
        elastic: [18.1,59.3], yield: [26.4,29.5], ultimate: [62.5,15.5], fracture: [84.7,38.6],
    }),
    section: () => workshopFigure(plates.section()),
    tee: () => workshopFigure(plates.section(), { flange: [47,21], web: [46,62] }),
    'steel-sample': () => workshopFigure(steelTable(steelSmall.slice(1,4))),
    buckling: () => {
        const points = {};
        const cases = Object.entries(bucklingCases).map(([key, restraint], i) => {
            points[key] = [12.5 + 25*i, 49];
            return `<figure>${restraintDiagram(restraint)}<figcaption>${restraint.title}<br>K ${restraint.approximate ? '≈ ' + numberText(.70) : '= ' + numberText(restraint.k)}</figcaption></figure>`;
        }).join('');
        return workshopFigure(`<div class="tutor-restraints">${cases}</div>`, points);
    },
    cantilever: () => workshopFigure(plate(t('A cantilever with a downward load at its free end.'), `
        <path class="diagram-line" d="M80 47V134M70 52l10-8M70 68l10-8M70 84l10-8M70 100l10-8M70 116l10-8M70 132l10-8M80 82H360"/>
        <path class="diagram-dash" d="M80 82C148 82 282 88 360 128"/>
        <path class="diagram-arrow" d="M360 31V79"/><text x="370" y="39">P</text><text x="365" y="127">δ</text>`)),
    truss: () => workshopTrussFigure('truss'),
    'truss-reactions': () => workshopTrussFigure('truss-reactions'),
    'truss-solved': () => workshopTrussFigure('truss-solved'),
    'joint-e': () => workshopFigure(plate(t('Isolated joint E. Applied force goes right. Assumed tension arrows point vertically down in CE and down-right in ED.'), `
        <circle class="diagram-fill" cx="180" cy="62" r="5"/>
        <path class="diagram-dash" d="M186 62H255V135"/>
        <path class="diagram-line" d="M209 62a29 29 0 0 1-8.5 20.5"/>
        <path class="diagram-arrow" d="M70 62H172M180 70V137M187 69L257 139"/>
        <text x="71" y="52">90 kN</text><text x="143" y="142">CE</text><text x="264" y="145">ED</text><text x="186" y="53">E</text>
        <text x="216" y="79">45°</text>`), {}, t('Assumed tension arrows for the two unknown members. Measure the angle from the dashed horizontal.')),
    'joint-d': () => workshopFigure(plate(t('Isolated joint D. Known compressed ED pushes down-right. Assumed CD tension points left and BD tension down.'), `
        <circle class="diagram-fill" cx="229" cy="53" r="5"/>
        <path class="diagram-arrow" d="M221 53H129M229 61V141M236 60L306 130"/>
        <text x="121" y="43">CD</text><text x="199" y="144">BD</text><text x="310" y="133">ED</text><text x="236" y="45">D</text>`)),
    'joint-b': () => workshopFigure(plate(t('Joint B. Known AB pulls left, BD pushes down, and the support reaction acts up. The assumed tension arrow for BC points up-left at 45 degrees from the leftward horizontal.'), `
        <circle class="diagram-fill" cx="245" cy="109" r="5"/>
        <path class="diagram-dash" d="M170 34V109"/>
        <path class="diagram-line" d="M216 109a29 29 0 0 1 8.5-20.5"/>
        <path class="diagram-arrow" d="M237 109H143M245 117V157M245 101V35M239 103L170 34"/>
        <text x="140" y="129">AB</text><text x="257" y="157">BD</text><text x="255" y="40">Bᵧ</text>
        <text x="143" y="33">BC</text><text x="257" y="111">B</text><text x="188" y="96">45°</text>`)),
    'zero-joint': () => workshopFigure(plate(t('Two members lie on one horizontal line through an unloaded joint. A third member meets it diagonally.'), `
        <path class="diagram-line" d="M98 116H362M230 116L306 40"/>
        <circle class="diagram-fill" cx="230" cy="116" r="6"/>
        <text x="230" y="147" text-anchor="middle">${t`Unloaded joint`}</text>`)),
    'balance-equation': () => workshopFigure(plate(t('A balanced equation is like a level scale. Apply the same operation on both sides.'), `
        <path class="diagram-line" d="M99 84H361M230 84L208 121H252ZM125 84V109M335 84V109M86 109H164M296 109H374"/>
        <text x="125" y="72" text-anchor="middle">${t`Left side`}</text><text x="335" y="72" text-anchor="middle">${t`Right side`}</text>`)),
    'unit-ruler': () => workshopFigure(plate(t('A larger unit spans 1,000 smaller units.'), `
        <path class="diagram-fill" d="M74 67H386V109H74Z"/>
        <path class="diagram-line" d="M74 67V86M386 67V86M105 67V78M136 67V78M167 67V78M198 67V78M229 67V78M260 67V78M291 67V78M322 67V78M353 67V78"/>
        <text x="230" y="53" text-anchor="middle">1 m</text><text x="230" y="132" text-anchor="middle">1,000 mm</text>`)),
    axes: () => workshopFigure(plate(t('Positive x points right. Positive y points up. Counterclockwise moment is chosen as positive.'), `
        <path class="diagram-arrow" d="M188 120H313M188 120V31M288 118A101 101 0 0 0 212 22"/>
        <text x="321" y="126">+x</text><text x="172" y="27">+y</text><text x="294" y="55">+M</text>`)),
    powers: () => workshopFigure(plate(t('A square with side 2L covers four squares with side L.'), `
        <path class="diagram-fill" d="M173 24H287V138H173Z"/>
        <path class="diagram-line" d="M230 24V138M173 81H287"/>
        <text x="230" y="161" text-anchor="middle">2L × 2L = 4L²</text>`)),
};
