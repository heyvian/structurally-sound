const pointSpan = (L, x, p, b = L) => ({ L, a: 0, b, points: [{ x, p }], udls: [] });
const loadedSpan = (L, w, end = L) => ({ L, a: 0, b: L, points: [], udls: [{ s: 0, e: end, w }] });
const centralPracticeBeam = pointSpan(6, 3, 12);
const shortPracticeBeam = pointSpan(6, 2, 12);
const fullPracticeLoad = loadedSpan(8, 3);
const patchPracticeLoad = loadedSpan(8, 6, 4);
const practiceBeams = {
    '2-5': centralPracticeBeam,
    '3-1': shortPracticeBeam, '3-2': shortPracticeBeam, '3-3': fullPracticeLoad, '3-4': fullPracticeLoad,
    '3-9': patchPracticeLoad, '3-10': patchPracticeLoad, '3-11': pointSpan(9, 9, 200, 6),
    'guided-3-1': pointSpan(6, 4, 27),
    '4-4': centralPracticeBeam, '4-5': centralPracticeBeam,
    '9-3': loadedSpan(5, 4), '9-5': loadedSpan(8, 6),
};
const practiceReactionIndex = {
    '3-1': 2, '3-2': 1, '3-4': 2, '3-9': 2, '3-10': 1, '3-11': 1, '3-12': 2, '3-13': 1,
    'guided-3-1': 2, 'workshop-3': 2, 'workshop-4': 1, 'beam-exam-3': 2, 'beam-exam-4': 1,
};
const practiceVectors = {
    '1-1': [10, 30, 'y'], '1-5': [20, 60, 'x'], '1-7': [125, 30, 'x'], '1-8': [125, 30, 'y'],
    '1-9': [40, 150, 'x', '−x'], 'guided-1-0': [20, 150, 'x', '−x'], 'formula-1': [18, 120, 'x'],
};
const practiceComponentVectors = {
    '1-2': [3, 4, null, 'resultant'], '1-3': [5, 12, 13, 'vertical'],
    '1-10': [60, 80, null, 'resultant'], '1-11': [60, 80, null, 'angle'],
};
const practiceTriangles = {
    '10-1': { run: 4, rise: 3 }, '10-2': { run: 8, rise: 6 }, '10-4': { angle: 30 },
    'formula-10': { run: 15, rise: 8, unit: 'm' }, 'guided-10-0': { run: 12, rise: 5, unit: 'm' },
};
const practiceMoments = { '3-0': [6, 2], '3-5': [10, 3] };
const practiceTrussLoads = { '8-3': 20, '8-4': 20, '8-5': null, '8-6': 20, '9-1': 24 };
const practiceTrussJoints = {
    '8-19': 'E', '8-20': 'E', '9-7': 'D', '9-8': 'D', '9-9': 'A', '9-10': 'A', '9-11': 'B',
    'trusswork-3': 'E', 'trusswork-4': 'E', 'trusswork-5': 'D', 'trusswork-6': 'D',
    'trusswork-7': 'A', 'trusswork-8': 'A', 'trusswork-9': 'B',
};
const practiceTopics = ['load-path', 'triangle', 'pin-roller', 'moment-reference', 'shear-reference', 'bar', 'tee', 'buckling', 'truss', 'reaction-reference', 'triangle'];
const practiceRoofAreas = { '0-2': [4, '20 m²'], '0-3': [2.5, '16 m²'], '0-8': [6, '5 m × 4 m'] };
const practiceShearAreas = { '4-10': [8, 2.5], 'formula-4': [-8, 2.5] };
const methodDrawings = {
    loadType: 'load-path', loadPath: 'load-path', tributary: 'roof-strip', vibration: 'vibration', weight: 'hanging-weight',
    units: 'unit-ruler', trig: 'triangle', triangleLength: 'triangle', obliqueTriangle: 'cosine-triangle',
    vector: 'vector-frame', vectorAngle: 'vector-frame', vectorSum: 'vector-frame', forceLine: 'line-of-action',
    support: 'pin-roller', balance: 'balance-equation', moment: 'moment-reference', reactions: 'reaction-reference',
    distributed: 'load-resultant', shear: 'shear-reference', bendingDiagram: 'moment-reference-plot', simpleBeam: 'moment-reference-plot',
    axialStress: 'bar', strain: 'strain-reference', stressCurve: 'stress-track', stressConcentration: 'stress-notch',
    allowable: 'stress-track', bendingStress: 'bend-reference', bendingSense: 'bend-reference',
    sectionModulus: 'tee', steel: 'tee', rectangleInertia: 'rectangle-section', centroid: 'tee', parallelAxis: 'tee',
    eulerScale: 'buckling', euler: 'buckling', restraintScale: 'buckling', slenderness: 'buckling', deflection: 'cantilever',
    trussModel: 'truss', trussJoint: 'joint-reference', zeroMember: 'zero-joint', fractions: 'fraction-reference',
    angleUnits: 'triangle', isolate: 'balance-equation',
};

function vectorPlate(F, angle, axis, reference, solution, answer) {
    const radians = angle * Math.PI / 180;
    const x = 229, y = 139;
    const tipX = x + Math.cos(radians) * 118;
    const tipY = y - Math.sin(radians) * 118;
    const fromLeft = reference === '−x';
    const midway = (radians + (fromLeft ? Math.PI : 0)) / 2;
    const radius = 38;
    const component = axis && { x, y, dx: axis === 'x' ? 1 : 0, dy: axis === 'y' ? -1 : 0,
        name: axis === 'x' ? 'Fₓ' : 'Fᵧ', unit: 'kN', length: 59 };
    return plate(t('Force vector and perpendicular components'), `
        <path class="diagram-line" d="M68 ${y}H391M${x} 24V156"/><text x="398" y="${y + 5}">+x</text><text x="${x + 5}" y="24">+y</text>
        <path class="diagram-dash" d="M${tipX} ${y}V${tipY}H${x}"/>
        <path class="diagram-arrow" d="M${x} ${y}L${tipX} ${tipY}"/>
        <text x="${tipX + (angle > 90 ? -6 : 6)}" y="${tipY - 7}" text-anchor="${angle > 90 ? 'end' : 'start'}">${F == null ? 'F' : `${numberText(F)} kN`}</text>
        <path class="diagram-line" d="M${x + (fromLeft ? -radius : radius)} ${y}A${radius} ${radius} 0 0 ${fromLeft ? 1 : 0} ${x + radius * Math.cos(radians)} ${y - radius * Math.sin(radians)}"/>
        <text x="${x + 58 * Math.cos(midway)}" y="${y - 58 * Math.sin(midway) - 4}" text-anchor="middle">${numberText(fromLeft ? 180 - angle : angle)}°</text>
        ${component ? `<g data-study-force>${forceGlyph(component, solution ? answer : undefined)}</g>` : ''}`);
}

function componentVectorPlate(horizontal, vertical, magnitude, find, solved = false) {
    const scale = Math.min(205 / horizontal, 102 / vertical);
    const x = 115, y = 143, tipX = x + horizontal * scale, tipY = y - vertical * scale;
    const theta = Math.atan2(vertical, horizontal);
    return plate(t('Resultant force as a right triangle with horizontal and vertical components'), `
        <path class="diagram-line" d="M${x} ${y}H${tipX}V${tipY}M${tipX - 10} ${y}v-10h10"/>
        <path class="diagram-arrow" d="M${x} ${y}L${tipX} ${tipY}"/>
        <text x="${(x + tipX) / 2}" y="164" text-anchor="middle">${numberText(horizontal)} kN</text>
        <text x="${tipX + 10}" y="${(y + tipY) / 2}">${find === 'vertical' && !solved ? 'Fᵧ' : `${numberText(vertical)} kN`}</text>
        <text x="${tipX - 6}" y="${tipY - 8}" text-anchor="end">${magnitude || solved ? `${numberText(magnitude || Math.hypot(horizontal, vertical))} kN` : 'R'}</text>
        ${find === 'angle' ? `<path class="diagram-line" d="M${x + 35} ${y}A35 35 0 0 0 ${x + 35 * Math.cos(theta)} ${y - 35 * Math.sin(theta)}"/>
            <text x="${x + 40}" y="${y - 12}">${solved ? `${numberText(theta * 180 / Math.PI)}°` : 'θ'}</text>` : ''}`);
}

function vectorSketch() {
    return plate(t('Force vector and perpendicular components'), `
        <path class="diagram-line" d="M98 139H378M139 159V24"/><path class="diagram-arrow" d="M139 139L293 52"/>
        <path class="diagram-dash" d="M139 52H293V139"/><path class="diagram-line" d="M173 139A34 34 0 0 0 168 122"/>
        <text x="307" y="52">F</text><text x="210" y="159">Fₓ</text><text x="112" y="85">Fᵧ</text><text x="176" y="127">θ</text>`);
}

function roofAreaPlate(pressure, area) {
    return plate(t('Uniform pressure over a shaded area viewed from above'), `
        <rect class="roof-deck" x="109" y="41" width="242" height="99"/>
        <rect class="roof-strip" x="111" y="43" width="238" height="95"/>
        <text x="230" y="84" text-anchor="middle">${t('Loaded area')} · ${area}</text>
        <text x="230" y="110" text-anchor="middle">q = ${numberText(pressure)} kN/m²</text>`);
}

function shearAreaPlate(shear, length) {
    const axis = 84, y = axis - Math.sign(shear) * 47;
    return plate(t('Signed rectangular area between the shear line and zero'), `
        <path class="diagram-line" d="M63 ${axis}H407M90 16V148"/>
        <rect class="roof-strip" x="90" y="${Math.min(y, axis)}" width="250" height="47"/>
        <path class="diagram-line" d="M90 ${y}H340"/><path class="diagram-dash" d="M340 ${axis}V${y}"/>
        <text x="98" y="19">${t('Shear')} V</text><text x="78" y="${axis + 4}">0</text>
        <text x="215" y="${(axis + y) / 2 + 4}" text-anchor="middle">${numberText(shear)} kN</text>
        <path class="diagram-line" d="M90 153H340M90 148V158M340 148V158"/>
        <text x="215" y="171" text-anchor="middle">${numberText(length)} m</text>`);
}

function leverPlate(force = 'F', distance = 'd', value) {
    return plate(t('Force, pivot, and perpendicular lever arm'), `
        <path class="diagram-line" d="M96 99H355"/><circle class="moment-pivot" cx="96" cy="99" r="6"/>
        <path class="diagram-arrow" d="M355 24V93"/><text x="367" y="35">${force}</text>
        <path class="diagram-line" d="M346 99V90H355"/><path class="diagram-dash" d="M96 112V147M355 109V147M96 140H355"/>
        <text x="226" y="162" text-anchor="middle">${distance}</text><text x="91" y="121">A</text>
        ${momentGlyph(96, 99, 'Mₐ', value, value === undefined)}`);
}

function triangularFbd(load, values = false, angle = true) {
    return plate(t('Free-body diagram of a symmetric triangular truss'), `
        <path class="diagram-line" d="M74 132L230 38L386 132Z"/>
        <path class="diagram-arrow" d="M230 7V32"/><text x="240" y="17">${load == null ? 'P' : `${numberText(load)} kN`}</text>
        <text x="66" y="153">A</text><text x="383" y="153">B</text><text x="216" y="34">C</text>
        ${angle ? '<text x="112" y="124">45°</text><text x="325" y="124">45°</text>' : ''}
        ${forceGlyph({ x: 74, y: 132, dx: 0, dy: -1, name: 'Aᵧ', unit: 'kN', labelSide: 'right' }, values && load != null ? load / 2 : undefined)}
        ${forceGlyph({ x: 386, y: 132, dx: 0, dy: -1, name: 'Bᵧ', unit: 'kN', labelSide: 'left' }, values && load != null ? load / 2 : undefined)}
        ${forceGlyph({ x: 74, y: 132, dx: 1, dy: 0, name: 'Aₓ', unit: 'kN', labelSide: 'right' }, values ? 0 : undefined)}`);
}

function lateralReactionPlate(knownRoller, solved) {
    const left = 132, right = 300, base = 192, top = 54;
    return plate(t('Truss with a rightward load above the pin and a roller to the right'), `
        <path class="diagram-line" d="M${left} ${top}H${right}V${base}H${left}ZM${left} ${top}L${right} ${base}"/>
        <path class="diagram-arrow" d="M57 ${top}H${left - 5}"/><text x="58" y="43">${knownRoller ? 'P' : '72 kN'}</text>
        <path class="diagram-line" d="M${left} ${base}l-10 15h20ZM${right} ${base}l-10 15h20Z"/>
        <circle cx="${right - 5}" cy="212" r="3"/><circle cx="${right + 5}" cy="212" r="3"/>
        <text x="111" y="209">A</text><text x="319" y="210">B</text>
        ${forceGlyph({ x: left, y: base, dx: 0, dy: -1, name: 'Aᵧ', unit: 'kN', length: 27, labelSide: 'left' }, solved ? -96 : undefined)}
        ${forceGlyph({ x: left, y: base, dx: 1, dy: 0, name: 'Aₓ', unit: 'kN' }, solved && !knownRoller ? -72 : undefined)}
        ${forceGlyph({ x: right, y: base, dx: 0, dy: -1, name: 'Bᵧ', unit: 'kN' }, knownRoller || solved ? 96 : undefined)}
        ${knownRoller ? '' : `<path class="diagram-dash" d="M${left} 232H${right}M${left} 226V238M${right} 226V238M370 ${top}V${base}M363 ${top}H377M363 ${base}H377"/>
            <text x="216" y="248" text-anchor="middle">6 m</text><text x="380" y="125">8 m</text>`}`, 260);
}

function horizontalBeam(p, solved, showHorizontal = true) {
    return plate(t('Horizontal applied force and support reactions'), `
        <path class="diagram-line" d="M85 98H384"/><path class="diagram-arrow" d="M223 98H288"/>
        <text x="234" y="86">${p} kN</text><text x="79" y="128">A</text><text x="379" y="128">B</text>
        ${showHorizontal ? forceGlyph({ x: 85, y: 98, dx: 1, dy: 0, name: 'Aₓ', unit: 'kN', labelSide: 'right' }, solved ? -p : undefined) : ''}
        ${forceGlyph({ x: 85, y: 98, dx: 0, dy: -1, name: 'Aᵧ' }, solved ? 0 : undefined)}
        ${forceGlyph({ x: 384, y: 98, dx: 0, dy: -1, name: 'Bᵧ' }, solved ? 0 : undefined)}`);
}

function conceptPlate(id) {
    const drawings = {
        triangle: () => rightTrianglePlate(),
        'pin-roller': () => beamFigure({ L: 1, a: 0, b: 1, points: [], udls: [] }).replace(/>1 m</g, '>L<'),
        truss: () => triangularFbd(null, false, false),
        tee: () => plate(t('T section with the flange above the web'), `
            <path class="diagram-fill" d="M119 33H332V61H244V151H207V61H119Z"/>
            <path class="diagram-dash" d="M97 51H349M224 13V166"/>
            <text x="120" y="26">${t('Flange')}</text><text x="253" y="113">${t('Web')}</text>`),
        'vector-frame': vectorSketch,
        'moment-reference': () => leverPlate(),
        'reaction-reference': () => beamFigure(loadedSpan(1, 'w'), [0, 1, 2], { isolated: true }).replace(/>1 m</g, '>L<'),
        'load-resultant': () => plate(t('Distributed load and equivalent point force'), `
            <path class="diagram-line" d="M92 80H367M92 140H367M92 26H367"/>
            <path class="diagram-arrow" d="M94 28V76M139 28V76M184 28V76M230 28V76M276 28V76M321 28V76M365 28V76M230 93V136"/>
            <text x="237" y="23">w</text><text x="239" y="107">W = wL</text><text x="234" y="163">L/2</text>`),
        'cosine-triangle': () => plate(t('Non-right triangle and its included angle'), `
            <path class="diagram-fill" d="M92 135H361L186 42Z"/><path class="diagram-line" d="M123 135a31 31 0 0 0-9-22"/>
            <text x="129" y="126">C</text><text x="211" y="154">a</text><text x="127" y="83">b</text><text x="287" y="85">c</text>`),
        'line-of-action': () => plate(t('Same line of action, two points of application'), `
            <path class="diagram-fill" d="M124 64H335V132H124Z"/><path class="diagram-dash" d="M87 97H384"/>
            <path class="diagram-arrow" d="M141 97H209M242 97H310"/><text x="157" y="87">F</text><text x="260" y="87">F</text>`),
        'vibration': () => plate(t('One complete cycle of vibration'), `<path class="diagram-line" d="M56 94H414M71 28V151"/>
            <path class="diagram-line" d="M71 94C108 28 133 28 170 94S232 160 269 94S331 28 368 94"/>
            <path class="diagram-dash" d="M71 130V155M269 118V155M71 149H269"/><text x="164" y="168">T</text><text x="412" y="108">t</text>`),
        'hanging-weight': () => plate(t('A hanging mass and its two external forces'), `<path class="diagram-fill" d="M187 68H270V121H187Z"/>
            <path class="diagram-arrow" d="M228 68V26M228 121V160"/><text x="239" y="35">T</text><text x="239" y="155">W = mg</text><text x="215" y="100">m</text>`),
        'strain-reference': () => plate(t('Original length and extension of a bar'), `<path class="diagram-fill" d="M86 63H359V112H86Z"/>
            <path class="diagram-dash" d="M317 61V144M359 110V144M86 138H359"/><text x="198" y="155">L₀</text><text x="326" y="132">ΔL</text>`),
        'stress-notch': () => plate(t('Stress concentration near a sudden change in section'), `<path class="diagram-fill" d="M92 55H218V70Q230 83 242 70V55H367V129H92Z"/>
            <path class="diagram-arrow" d="M92 97H40M367 97H420"/><path class="diagram-dash" d="M179 93Q228 67 281 93M184 105Q228 82 277 105"/>
            <text x="218" y="47">σmax</text>`),
        'bend-reference': () => plate(t('Bending, compression at the top and tension at the bottom'), `<path class="diagram-fill" d="M78 56Q230 143 382 56L382 93Q230 180 78 93Z"/>
            <path class="diagram-dash" d="M78 74Q230 161 382 74"/><text x="230" y="74" text-anchor="middle">${t('Compression')}</text>
            <text x="230" y="161" text-anchor="middle">${t('Tension')}</text>`),
        'rectangle-section': () => plate(t('Rectangular section and centroidal axes'), `<path class="diagram-fill" d="M173 37H293V135H173Z"/>
            <path class="diagram-dash" d="M135 86H331M233 22V166M173 149H293M315 37V135"/><text x="338" y="91">x</text><text x="226" y="166">b</text><text x="320" y="90">h</text>`),
        'joint-reference': () => plate(t('An isolated truss joint and two unknown member directions'), `<circle class="diagram-fill" cx="230" cy="88" r="6"/>
            <path class="diagram-arrow" d="M225 88H118M235 85L324 32M230 94V152"/><text x="117" y="77">F₁</text><text x="331" y="37">F₂</text><text x="240" y="150">P</text>`),
        'fraction-reference': () => plate(t('A whole split into halves and quarters'), `<path class="diagram-fill" d="M95 56H365V112H95Z"/>
            <path class="diagram-line" d="M162.5 56V112M230 56V112M297.5 56V112"/><text x="126" y="87">¼</text><text x="195" y="87">¼</text><text x="263" y="87">¼</text><text x="330" y="87">¼</text>
            <path class="diagram-dash" d="M95 127H230"/><text x="153" y="150">½</text>`),
        'shear-reference': () => plate(t('Shear diagram with a force jump and a linear segment'), `<path class="diagram-dash" d="M54 96H405"/>
            <path class="diagram-line" d="M54 96H79V53H179V77L310 126H385V96H405"/><text x="48" y="41">V</text><text x="406" y="110">x</text>`),
        'moment-reference-plot': () => plate(t('Moment diagram with positive sagging below the axis'), `<path class="diagram-dash" d="M62 71H397"/>
            <path class="diagram-line" d="M77 71Q230 213 382 71"/><text x="52" y="59">M</text><text x="402" y="82">x</text><text x="225" y="159">+M</text>`),
    };
    return drawings[id]?.() || workshopDrawings[id]?.().markup || vectorSketch();
}

function practiceDrawing(question, solved = false) {
    if (question.type === 'fbd') return fbdDrawing(question, solved ? question.answer : undefined, solved);
    const key = question.key;
    if (practiceRoofAreas[key]) return roofAreaPlate(...practiceRoofAreas[key]);
    if (practiceShearAreas[key]) return shearAreaPlate(...practiceShearAreas[key]);
    if (key === '0-7' || key === 'formula-0') return roofPlan({ width: key === '0-7' ? 4 : 3, floor: key === 'formula-0' }).markup;
    if (key === 'guided-0-0') return roofPlan({ edge: true, bay: 3, floor: true }).markup;
    if (key === 'guided-2-1') return workshopDrawings['two-rollers']().markup;
    if (key === '8-10' || key === '8-11') return lateralReactionPlate(key === '8-11', solved);
    if (key === '2-6') return fixedDiagram(solved ? [0, 1, 2] : [], solved);
    if (key === '2-7') return inclinedFbd(solved ? [0, 1, 2] : [], solved, false);
    const beam = question.b || practiceBeams[key];
    if (beam) {
        const { RA, RB } = analyze(beam);
        const values = solved ? { 0: 0, 1: RA, 2: RB } : {};
        return beamFigure(beam, [0, 1, 2], { isolated: true, values, live: solved ? undefined : practiceReactionIndex[key] });
    }
    if (practiceMoments[key]) {
        const [force, distance] = practiceMoments[key];
        return leverPlate(`${force} kN`, `${distance} m`, solved ? -force * distance : undefined);
    }
    if (practiceVectors[key]) {
        const [force, angle, axis, reference] = practiceVectors[key];
        const answer = solved && question.type === 'formula'
            ? question.calculate(...question.inputs.map(input => input[3])) : question.answer;
        return vectorPlate(force, angle, axis, reference, solved, answer);
    }
    if (practiceComponentVectors[key]) return componentVectorPlate(...practiceComponentVectors[key], solved);
    if (practiceTriangles[key]) {
        const triangle = practiceTriangles[key];
        const diagonal = solved && ['10-2', 'formula-10'].includes(key) ? Math.hypot(triangle.run, triangle.rise) : undefined;
        return rightTrianglePlate({ ...triangle, diagonal });
    }
    if (key === '2-10' || key === 'formula-2') return horizontalBeam(key === '2-10' ? 15 : 12, solved);
    if (key === '3-8') return fixedDiagram(solved ? [0, 1, 2, 3] : [3], solved, '15 kN', '4 m', { 0: 0, 1: 15, 2: 60 });
    if (key === '3-6' || key === '3-7') return triangleLoadPractice(key === '3-6' ? '12 kN/m' : 'wmax', solved);
    if (key === 'formula-3' || key === 'guided-3-0') return triangleLoadPractice(key === 'formula-3' ? '7 kN/m' : '9 kN/m', solved, key === 'formula-3' ? 8 : 6);
    if (Object.hasOwn(practiceTrussLoads, key)) return triangularFbd(practiceTrussLoads[key], solved, key !== '9-1');
    if (question.fig === 'truss') return triangularFbd(40, solved);
    if (question.fig === 'lateral') {
        const focus = practiceTrussJoints[key];
        const values = solved ? { Aₓ: -90, Aᵧ: -180, Bᵧ: 180 } : {};
        return workshopTrussFigure(focus || solved ? 'truss' : 'truss-reactions', values, focus).markup;
    }
    if (question.type === 'stress') return solved ? stressFigure() : '';
    return question.fig || question.restraints ? figureFor(question) : '';
}

function triangleLoadPractice(peak, solved, length = 6) {
    return plate(t('Triangular load and the location of its resultant'), `
        <path class="diagram-fill" d="M96 101L365 33V101Z"/><path class="diagram-line" d="M84 101H380"/>
        <text x="362" y="25" text-anchor="end">${peak}</text><path class="diagram-dash" d="M96 136V147M365 136V147M96 142H365"/>
        <text x="228" y="162" text-anchor="middle">${length} m</text>${solved ? `<path class="diagram-arrow" d="M275 43V96"/>
            <text x="258" y="36">W</text><text x="305" y="129">${numberText(length / 3)} m</text>` : ''}`);
}

function practiceDrawingPanel(question, solved = false) {
    const figure = practiceDrawing(question, solved);
    if (!figure && question.type === 'stress') return '';
    const method = questionMethods.get(question.key);
    const markup = figure || conceptPlate(methodDrawings[method] || practiceTopics[question.topicIndex] || 'balance-equation');
    const exact = question.b || practiceBeams[question.key] || Object.hasOwn(practiceTrussLoads, question.key) ||
        ['lateral', 'truss'].includes(question.fig) || ['3-8', '2-10', 'formula-2', '8-10', '8-11'].includes(question.key);
    return `<figure class="practice-drawing${solved ? ' worked-drawing' : ''}"><figcaption>${exact || question.type === 'fbd' ?
        (solved ? t('Worked free-body diagram') : t('Free-body diagram')) :
        figure ? (solved ? t('Worked drawing') : t('Problem drawing')) : t('Concept sketch')}</figcaption>${markup}</figure>`;
}

function updatePracticeForce(root, question, raw) {
    const draft = diagramDraft(raw, locale);
    const force = root.querySelector('[data-draft-force], [data-study-force]');
    if (!force) return;
    const axis = practiceVectors[question.key]?.[2];
    if (axis) {
        force.innerHTML = forceGlyph({ x: 229, y: 139, dx: axis === 'x' ? 1 : 0, dy: axis === 'y' ? -1 : 0,
            name: axis === 'x' ? 'Fₓ' : 'Fᵧ', unit: 'kN', length: axis === 'y' && (draft.negative || draft.value < 0) ? 22 : 59 }, draft.value, draft.negative);
        return;
    }
    const beam = question.b || practiceBeams[question.key];
    const right = practiceReactionIndex[question.key] === 2;
    const x = 48 + 424 * (right ? beam.b : beam.a) / beam.L;
    force.innerHTML = forceGlyph({ x, y: 82, dx: 0, dy: -1, unit: 'kN', name: right ? 'Bᵧ' : 'Aᵧ',
        labelSide: x > 400 ? 'left' : 'right' }, draft.value, draft.negative);
}
