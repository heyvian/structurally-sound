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
    '1-9': [40, 150, 'x'], 'guided-1-0': [20, 150, 'x'], 'formula-1': [18, 120, 'x'],
    '1-2': [5, Math.atan2(4, 3) * 180 / Math.PI], '1-3': [13, Math.atan2(12, 5) * 180 / Math.PI, 'y'],
    '1-10': [100, Math.atan2(80, 60) * 180 / Math.PI], '1-11': [100, Math.atan2(80, 60) * 180 / Math.PI],
};
const practiceMoments = { '3-0': [6, 2], '3-5': [10, 3] };
const practiceTrussLoads = { '8-3': 20, '8-4': 20, '8-5': null, '8-6': 20, '9-1': 24 };
const practiceTopics = ['load-path', 'triangle', 'supports', 'moment-a', 'shear-plot', 'bar', 'tee', 'buckling', 'truss', 'shear-beam', 'triangle'];
const methodDrawings = {
    loadType: 'load-path', loadPath: 'load-path', tributary: 'roof', vibration: 'vibration', weight: 'hanging-weight',
    units: 'unit-ruler', trig: 'triangle', triangleLength: 'triangle', obliqueTriangle: 'cosine-triangle',
    vector: 'vector-frame', vectorAngle: 'vector-frame', vectorSum: 'vector-frame', forceLine: 'line-of-action',
    support: 'supports', balance: 'balance-equation', moment: 'moment-reference', reactions: 'reaction-reference',
    distributed: 'load-resultant', shear: 'shear-reference', bendingDiagram: 'moment-reference-plot', simpleBeam: 'moment-reference-plot',
    axialStress: 'bar', strain: 'strain-reference', stressCurve: 'stress-track', stressConcentration: 'stress-notch',
    allowable: 'stress-track', bendingStress: 'bend-reference', bendingSense: 'bend-reference',
    sectionModulus: 'tee', steel: 'tee', rectangleInertia: 'rectangle-section', centroid: 'tee', parallelAxis: 'tee',
    eulerScale: 'buckling', euler: 'buckling', restraintScale: 'buckling', slenderness: 'buckling', deflection: 'cantilever',
    trussModel: 'truss', trussJoint: 'joint-reference', zeroMember: 'zero-joint', fractions: 'fraction-reference',
    angleUnits: 'triangle', isolate: 'balance-equation',
};

function vectorPlate(F, angle, axis, solution = false, answer) {
    const radians = angle * Math.PI / 180;
    const x = 229, y = 139;
    const tipX = x + Math.cos(radians) * 118;
    const tipY = y - Math.sin(radians) * 118;
    const angleLabel = angle > 90 ? 180 - angle : angle;
    const component = axis && { x, y, dx: axis === 'x' ? 1 : 0, dy: axis === 'y' ? -1 : 0,
        name: axis === 'x' ? 'Fₓ' : 'Fᵧ', unit: 'kN', length: 59 };
    return plate(t('Force vector and perpendicular components'), `
        <path class="diagram-line" d="M68 ${y}H391M${x} 24V156"/><text x="398" y="${y + 5}">+x</text><text x="${x + 5}" y="24">+y</text>
        <path class="diagram-dash" d="M${tipX} ${y}V${tipY}H${x}"/>
        <path class="diagram-arrow" d="M${x} ${y}L${tipX} ${tipY}"/>
        <text x="${tipX + (angle > 90 ? -6 : 6)}" y="${tipY - 7}" text-anchor="${angle > 90 ? 'end' : 'start'}">${F == null ? 'F' : `${numberText(F)} kN`}</text>
        ${angle != null ? `<text x="${x + (angle > 90 ? -52 : 33)}" y="${y - 12}">${numberText(angleLabel)}°</text>` : ''}
        ${component ? `<g data-study-force>${forceGlyph(component, solution ? answer : undefined)}</g>` : ''}`);
}

function vectorSketch() {
    return plate(t('Force vector and perpendicular components'), `
        <path class="diagram-line" d="M98 139H378M139 159V24"/><path class="diagram-arrow" d="M139 139L293 52"/>
        <path class="diagram-dash" d="M139 52H293V139"/><path class="diagram-line" d="M173 139A34 34 0 0 0 168 122"/>
        <text x="307" y="52">F</text><text x="210" y="159">Fₓ</text><text x="112" y="85">Fᵧ</text><text x="176" y="127">θ</text>`);
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

function horizontalBeam(p, solved, showHorizontal = true) {
    return plate(t('Horizontal applied force and support reactions'), `
        <path class="diagram-line" d="M85 98H384"/><path class="diagram-arrow" d="M223 98H288"/>
        <text x="234" y="86">${p} kN</text><text x="79" y="128">A</text><text x="379" y="128">B</text>
        ${showHorizontal ? forceGlyph({ x: 85, y: 98, dx: 1, dy: 0, name: 'Aₓ', unit: 'kN', labelSide: 'right' }, solved ? -p : undefined) : ''}
        ${forceGlyph({ x: 85, y: 98, dx: 0, dy: -1, name: 'Aᵧ' }, solved ? 0 : undefined)}
        ${forceGlyph({ x: 384, y: 98, dx: 0, dy: -1, name: 'Bᵧ' }, solved ? 0 : undefined)}`);
}

function conceptPlate(id) {
    if (workshopDrawings[id]) return workshopDrawings[id]().markup;
    const drawings = {
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
    return (drawings[id] || vectorSketch)();
}

function practiceDrawing(question, solved = false) {
    if (question.type === 'fbd') return fbdDrawing(question, solved ? question.answer : undefined, solved);
    const key = question.key;
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
        const [force, angle, axis] = practiceVectors[key];
        return vectorPlate(force, angle, axis, solved, question.answer);
    }
    if (key === '2-10' || key === 'formula-2') return horizontalBeam(key === '2-10' ? 15 : 12, solved);
    if (key === '3-8') return fixedDiagram(solved ? [0, 1, 2, 3] : [3], solved, '15 kN', '4 m', { 0: 0, 1: 15, 2: 60 });
    if (key === '3-6' || key === '3-7') return triangleLoadPractice(key === '3-6' ? '12 kN/m' : 'wmax', solved);
    if (key === 'formula-3' || key === 'guided-3-0') return triangleLoadPractice(key === 'formula-3' ? '7 kN/m' : '9 kN/m', solved, key === 'formula-3' ? 8 : 6);
    if (Object.hasOwn(practiceTrussLoads, key)) return triangularFbd(practiceTrussLoads[key], solved, key !== '9-1');
    if (question.fig === 'truss') return triangularFbd(40, solved);
    if (question.fig === 'lateral') return workshopTrussFigure('truss', solved ? { Aₓ: -90, Aᵧ: -180, Bᵧ: 180 } : {}).markup;
    if (question.type === 'stress') return solved ? stressFigure() : '';
    if (question.fig || question.restraints) return figureFor(question);
    const method = questionMethods.get(key);
    return conceptPlate(methodDrawings[method] || practiceTopics[question.topicIndex] || 'balance-equation');
}

function triangleLoadPractice(peak, solved, length = 6) {
    return plate(t('Triangular load and the location of its resultant'), `
        <path class="diagram-fill" d="M96 101L365 33V101Z"/><path class="diagram-line" d="M84 101H380"/>
        <text x="362" y="25" text-anchor="end">${peak}</text><path class="diagram-dash" d="M96 136V147M365 136V147M96 142H365"/>
        <text x="228" y="162" text-anchor="middle">${length} m</text>${solved ? `<path class="diagram-arrow" d="M275 43V96"/>
            <text x="258" y="36">W</text><text x="305" y="129">${numberText(length / 3)} m</text>` : ''}`);
}

function practiceDrawingPanel(question, solved = false) {
    const markup = practiceDrawing(question, solved);
    if (!markup) return '';
    const exact = question.b || practiceBeams[question.key] || Object.hasOwn(practiceTrussLoads, question.key) ||
        ['lateral', 'truss'].includes(question.fig) || ['3-8', '2-10', 'formula-2'].includes(question.key);
    return `<figure class="practice-drawing${solved ? ' worked-drawing' : ''}"><figcaption>${exact || question.type === 'fbd' ?
        (solved ? t('Worked free-body diagram') : t('Free-body diagram')) : (solved ? t('Worked drawing') : t('Problem drawing'))}</figcaption>${markup}</figure>`;
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
