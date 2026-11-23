// Workshop and turn positions are stable so earlier saved work still lines up
// with the drawing and any values already found.
const lessonSymbols = [
    { 3: t('Strip width bₜ'), 4: t('Load per metre of beam'), 5: t('Total load on the middle beam'),
        6: t('Total load on the edge beam'), 7: t('Rooftop unit weight') },
    { 2: 'Fₓ', 4: 'Fᵧ', 5: 'Rₓ', 6: 'R' },
    { 3: 'Aₓ' },
    { 0: 'W', 3: 'Mₐ', 4: 'Mᵦ', 6: 'Bᵧ', 7: 'Aᵧ', 9: 'd' },
    { 0: 'Aᵧ = Bᵧ', 2: 'V(2)', 5: 'M(4)', 9: 'Bᵧ' },
    { 1: 'σ', 2: 'ε', 4: 'E', 6: 'Amin' },
    { 1: 'ȳ', 2: 'Iweb', 3: 'd', 4: 'Iₓ', 5: 'Sₓ' },
    { 2: 'Pcr (K = 1)', 4: 'Pcr (K = 2)', 5: 'r', 6: 'KL/r', 7: 'δ' },
    { 1: 'Aₓ', 2: 'Bᵧ', 3: 'Aᵧ', 6: 'ED', 8: 'CE', 10: 'CD', 11: 'BD', 12: 'AC', 14: 'BC', 15: 'ΣFᵧ' },
    { 1: 'Aᵧ = Bᵧ', 3: 'Mmax', 4: 'Sreq' },
    { 0: 'b', 2: 'L', 4: 'θ', 5: 'x' },
];

const lessonForces = {
    '1-2': [78, 148, 1, 0, 73], '1-4': [78, 148, 0, -1, 64], '1-5': [175, 142, 1, 0, 73],
    '2-3': [85, 98, 1, 0, 49],
    '3-6': [472, 82, 0, -1, 51], '3-7': [48, 82, 0, -1, 51],
    '4-0': [472, 82, 0, -1, 44], '4-2': [347, 93, 0, 1, 33], '4-9': [472, 82, 0, -1, 42],
    '8-1': [104, 307, 1, 0, 57], '8-2': [234, 307, 0, -1, 48], '8-3': [104, 307, 0, -1, 32],
    '8-6': [180, 62, 1, 1, 63], '8-8': [180, 62, 0, 1, 57],
    '8-10': [229, 53, -1, 0, 55], '8-11': [229, 53, 0, 1, 55],
    '8-12': [104, 307, 0, -1, 49], '8-14': [245, 109, -1, -1, 68],
    '9-1': [472, 82, 0, -1, 44],
};

function completedNumber(workshop, run, i) {
    return run.records[i]?.status ? workshop.turns[i]?.expected : undefined;
}

function diagramDraft(raw, language) {
    const value = parseStudyNumber(raw || '', language);
    return { value: Number.isFinite(value) ? value : undefined, negative: /^[−-]$/.test((raw || '').trim()) };
}

function lessonForce(workshop, index, i, value, negative) {
    if (workshop.repeat) {
        const { arrow, unit, momentAt, symbol } = workshop.turns[i];
        if (momentAt) return momentGlyph(momentAt, 89, symbol, value, negative);
        return arrow ? forceGlyph({ ...arrow, unit }, value, negative) : '';
    }
    if (index === 3 && (i === 3 || i === 4)) return momentGlyph(i === 3 ? 68 : 388, 89, lessonSymbols[3][i], value, negative);
    const force = lessonForces[`${index}-${i}`];
    if (!force) return '';
    const [x, y, dx, dy, length] = force;
    const flipped = value < 0 || negative;
    const safeLength = index === 1 && dy < 0 && flipped ? 16 : Math.min(length, dy > 0 && !flipped ? 155 - y : 64);
    return forceGlyph({ x, y, dx, dy, name: lessonSymbols[index][i], unit: workshop.turns[i].unit,
        length: Math.max(safeLength, 16), labelSide: x > 270 ? 'left' : 'right' }, value, negative);
}

function addSvgLayer(markup, layer) { return markup.replace(/<\/svg>\s*$/, `${layer}</svg>`); }

function teeProgress(value, scale = 1) {
    const axis = Number.isFinite(value) && value >= 0 && value <= 100 * scale ? 148 - 1.2 * value / scale : null;
    return plate(t('T section with its flange, web, and centroid'), `
        <path class="diagram-fill" d="M151 28H271V52H223V148H199V52H151Z"/>
        <path class="diagram-dash" d="M151 20H271M281 28V52M292 52V148M151 148H318"/>
        <text x="210" y="16" text-anchor="middle">${numberText(100 * scale)} mm</text><text x="288" y="43">${numberText(20 * scale)} mm</text><text x="299" y="104">${numberText(80 * scale)} mm</text>
        <text x="142" y="43" text-anchor="end">${t('Flange')}</text><text x="190" y="112" text-anchor="end">${t('Web')}</text>
        <path class="diagram-line" d="M199 157H223M199 154V160M223 154V160"/>
        <text x="211" y="174" text-anchor="middle">${numberText(20 * scale)} mm</text><text x="324" y="152">y = 0</text>
        ${axis === null ? '' : `<path class="centroid-line" d="M95 ${axis}H318"/><circle class="moment-pivot" cx="211" cy="${axis}" r="4"/>
            <text x="101" y="${axis - 6}">ȳ = ${numberText(value)} mm</text>`}`);
}

function shearCut() {
    return plate(t('Left free body at x = 2 m, with the support reaction, distributed load and cut forces'), `
        <path class="diagram-line" d="M82 93H347"/><path class="diagram-dash" d="M347 40V148"/>
        <path class="diagram-dash" d="M82 143V156M347 143V156M82 150H347"/><text x="207" y="168">2 m</text>
        <path class="diagram-line" d="M82 33H347"/><path class="diagram-arrow" d="M82 34V88M135 34V88M188 34V88M241 34V88M294 34V88M347 34V88"/>
        <text x="224" y="25">6 kN/m</text><text x="66" y="117">A</text>
        ${forceGlyph({ x: 82, y: 93, dx: 0, dy: -1, length: 44, name: 'Aᵧ', unit: 'kN' }, 24)}
        ${momentGlyph(347, 92, 'M(2)')}`);
}

function knownTruss(workshop, run, i) {
    const known = {};
    for (const key of [1, 2, 3, 6, 8, 10, 11, 12, 14]) {
        if (key > i) break;
        const value = completedNumber(workshop, run, key);
        if (!Number.isFinite(value)) continue;
        known[lessonSymbols[8][key]] = value;
        if (key === 12) known.AB = 90;
    }
    return known;
}

function progressiveLessonDrawing(workshop, run, i) {
    const index = workshop.index ?? workshops.indexOf(workshop);
    const turn = workshop.turns[i];
    const record = run.records[i] || {};
    if (turn.section) return sectionLessonDrawing(workshop, run, i);
    if (workshop.beam) return beamLabDrawing(workshop, run, i);
    if (turn.shearSegment) return workshopFigure(lessonShearSegment(turn, record.status, diagramDraft(record.draft, record.draftLocale).value));
    if (turn.type === 'fbd') {
        return workshopFigure(fbdDrawing(turn, record.status ? turn.answer : record.draft || [], true));
    }
    if (workshop.repeat) {
        const drawing = turn.figure?.(record, run) || workshopDrawings[turn.drawing || workshop.drawing.drawing]();
        const draft = record.status ? { value: turn.expected } : diagramDraft(typeof record.draft === 'string' ? record.draft : '', record.draftLocale);
        const glyph = lessonForce(workshop, index, i, draft.value, draft.negative);
        return glyph ? { ...drawing, markup: addSvgLayer(drawing.markup, `<g data-lesson-force>${glyph}</g>`) } : drawing;
    }
    const name = index === 8 && i === 14 ? 'joint-b' : turn.drawing || workshop.drawing.drawing;
    let drawing = workshopDrawings[name](name.startsWith('joint') ? lessonSymbols[index]?.[i] : undefined);
    if (index === 8 && name.startsWith('truss')) {
        const known = knownTruss(workshop, run, i);
        if (i >= 1 && i <= 3) delete known[lessonSymbols[8][i]];
        drawing = workshopTrussFigure('truss', known);
    }
    if (index === 3 && name === 'reaction-resultant') {
        const values = {};
        if (i > 6 && completedNumber(workshop, run, 6) !== undefined) values[2] = 30;
        if (i > 7 && completedNumber(workshop, run, 7) !== undefined) values[1] = 26;
        const beam = practiceReactionResultant();
        const reactions = [1, 2].filter(force => !(i === 6 && force === 2) && !(i === 7 && force === 1));
        drawing = { ...drawing, markup: beamFigure(beam, reactions, { isolated: true, values, pivot: i < 8 ? 0 : 8 }) };
    }
    if (index === 2 && i === 3) drawing = { ...drawing, markup: horizontalBeam(9, false, false) };
    if (name === 'triangle-load' && record.status) drawing = workshopFigure(triangleLoadPractice('12 kN/m', true, 6));
    if (index === 4 && i === 6 && !record.status) drawing = workshopPlot('V');
    if (index === 10 && name === 'triangle') {
        const diagonal = i > 2 || (i === 2 && record.status) ? 5 : undefined;
        const angle = i === 4 && record.status ? 36.9 : undefined;
        drawing = { ...drawing, markup: rightTrianglePlate({ run: 4, rise: 3, diagonal, angle, unit: 'm' }) };
    }
    if (index === 6 && name === 'tee') {
        const value = i === 1 ? completedNumber(workshop, run, 1) ?? diagramDraft(record.draft, record.draftLocale).value :
            completedNumber(workshop, run, 1);
        drawing = { ...drawing, markup: teeProgress(value) };
    }
    if (index === 4 && i === 2) drawing = workshopFigure(shearCut());
    if (index === 4 && name === 'shear-beam' && i > 2 && completedNumber(workshop, run, 0) !== undefined) {
        drawing = { ...drawing, markup: beamFigure(shearBeam, [0, 1, 2], { isolated: true, values: { 0: 0, 1: 24, 2: 24 } }) };
    }
    if (index === 4 && name === 'sketch-beam' && i > 9 && completedNumber(workshop, run, 9) !== undefined) {
        drawing = { ...drawing, markup: beamFigure(sketchBeam, [0, 1, 2], { isolated: true, values: { 0: 0, 1: 8, 2: 4 } }) };
    }
    if (index === 9 && name === 'shear-beam' && i <= 1) {
        drawing = { ...drawing, markup: beamFigure(shearBeam, i === 1 ? [0, 1] : [], { isolated: i === 1 }) };
    }
    if (index === 8 && name.startsWith('joint')) {
        const known = knownTruss(workshop, run, i - 1);
        // Keep the whole structure visible alongside the new joint cut.
        drawing.progress = workshopTrussFigure('truss', known).markup;
    }
    const draft = record.status ? { value: turn.expected, negative: false } : diagramDraft(record.draft && typeof record.draft === 'string' ? record.draft : '', record.draftLocale);
    const glyph = lessonForce(workshop, index, i, draft.value, draft.negative);
    if (glyph) drawing.markup = addSvgLayer(drawing.markup, `<g data-lesson-force>${glyph}</g>`);
    return drawing;
}

function practiceReactionResultant() {
    return { ...beamStart, points: [...beamStart.points, { x: 6, p: 32 }], udls: [] };
}

function lessonValues(workshop, run, i, all) {
    const index = workshop.index ?? workshops.indexOf(workshop);
    const first = Math.max(0, workshop.turns.findLastIndex((turn, step) => step <= i && turn.newExample));
    const symbols = workshop.turns.map((turn, j) => turn.symbol || (!workshop.repeat && lessonSymbols[index]?.[j]));
    const entries = Object.entries(symbols).filter(([step, symbol]) => symbol && Number(step) >= first && Number(step) <= i)
        .filter(([step]) => run.records[step]?.status || Number(step) === i);
    const rows = (all ? entries : entries.filter(([step]) => Number(step) === i)).map(([step, name]) => {
        const turn = workshop.turns[step], record = run.records[step] || {};
        const draft = record.status ? { value: turn.expected, negative: false } : diagramDraft(record.draft, record.draftLocale);
        return `<div><dt>${name}</dt><dd ${Number(step) === i && !record.status ? 'data-lesson-value' : ''}>${diagramValue(draft, turn.unit)}</dd></div>`;
    }).join('');
    return rows ? `<dl class="lesson-values">${rows}</dl>` : '';
}

function diagramValue({ value, negative }, unit) {
    return Number.isFinite(value) ? `${numberText(value)}${unit ? ` ${unit}` : ''}` : (negative ? '−' : '—');
}

function updateLessonDrawing(root, workshop, i, raw, run) {
    const draft = diagramDraft(raw, locale);
    const turn = workshop.turns[i];
    if (turn.section) {
        const svg = root.querySelector('[data-lesson-live] svg');
        if (svg) svg.outerHTML = sectionLessonDrawing(workshop, run, i).markup;
        return;
    }
    const label = root.querySelector('[data-lesson-value]');
    if (label) label.textContent = diagramValue(draft, turn.unit);
    if (turn.shearSegment) {
        const svg = root.querySelector('[data-lesson-live] svg');
        if (svg) svg.outerHTML = lessonShearSegment(turn, false, draft.value);
        return;
    }
    const arrow = root.querySelector('[data-lesson-live] [data-lesson-force]');
    const mini = root.querySelector('[data-lesson-mini]');
    const index = workshop.index ?? workshops.indexOf(workshop);
    if (arrow) arrow.innerHTML = lessonForce(workshop, index, i, draft.value, draft.negative);
    if (mini) mini.innerHTML = miniForce(workshop, i, draft);
    if (index === 6 && i === 1) {
        const svg = root.querySelector('[data-lesson-live] svg');
        if (svg) svg.outerHTML = teeProgress(draft.value);
    }
}

function lessonShearSegment(turn, solved, draft) {
    const { shearSegment, shearTarget } = turn;
    return shearSegmentFigure(shearSegment, {
        base: solved || shearTarget !== 'run',
        crossing: shearTarget === 'area' || (solved && shearTarget === 'zero'),
        area: shearTarget === 'area',
        draft: solved || shearTarget === 'area' ? undefined : shearTarget === 'zero' ? draft - shearSegment.start : draft,
    });
}

function miniForce(workshop, i, { value, negative }) {
    if (workshop.repeat) {
        const { arrow, unit, momentAt, symbol } = workshop.turns[i];
        if (momentAt) return momentGlyph(59, 51, symbol, value, negative);
        return arrow ? forceGlyph({ ...arrow, x: 62, y: 52, length: 27, unit, labelSide: 'right' }, value, negative) : '';
    }
    const index = workshop.index ?? workshops.indexOf(workshop);
    const name = lessonSymbols[index]?.[i];
    if (index === 3 && (i === 3 || i === 4)) return momentGlyph(59, 51, name, value, negative);
    const force = lessonForces[`${index}-${i}`];
    if (!force) return '';
    return forceGlyph({ x: 62, y: 52, dx: force[2], dy: force[3], name, unit: workshop.turns[i].unit,
        length: 27, labelSide: 'right' }, value, negative);
}
