const beamLabLeft = 53, beamLabRight = 435;
const beamLabX = (length, position) => beamLabLeft + (beamLabRight - beamLabLeft) * position / length;

function beamLabPlot({ beam, model }, learned, { guide = 0, patch, areaIndex, draftZero, sketchShapes } = {}) {
    const { L, udls, ramp } = beam;
    const x = position => beamLabX(L, position);
    const shearDatum = 214;
    const shearY = value => shearDatum - value / model.Vmax * 48;
    const momentY = value => 288 + value / model.Mmax * 63;
    const loadY = value => 109 - (value / Math.max(ramp || 0, ...udls.map(item => item.w))) * 53;
    const pin = x(0), roller = x(L), beamY = 109;
    const zero = Number.isFinite(draftZero) ? draftZero : learned.zero;
    const stations = model.stations;
    const accepted = key => Number.isFinite(learned[key]);
    const displayedShear = stations.map((station, i) => ({ x: station, value: learned[`v-${i}`] }));
    if (Number.isFinite(learned.zero)) displayedShear.push({ x: learned.zero, value: 0 });
    displayedShear.sort((a, b) => a.x - b.x);
    const momentStations = model.momentStations.map((station, i) => ({
        x: station === model.zero ? learned.zero : station, value: learned[`m-${i}`],
    }));
    const dot = (station, height, label, leftLabel = station > L * .83) => `<g class="beam-lab-dot"><circle cx="${x(station)}" cy="${height}" r="3.6"/>
        <text x="${x(station) + (leftLabel ? -7 : 7)}" y="${height - 7}" text-anchor="${leftLabel ? 'end' : 'start'}">${label}</text></g>`;
    const datum = y => `<path class="beam-lab-axis" d="M39 ${y}H448"/><text x="31" y="${y + 4}" text-anchor="end">0</text>`;
    const shearLine = displayedShear.slice(1).map((end, i) => {
        const start = displayedShear[i];
        return Number.isFinite(start.value) && Number.isFinite(end.value)
            ? `M${x(start.x)} ${shearY(start.value)}L${x(end.x)} ${shearY(end.value)}` : '';
    }).filter(Boolean).join(' ');
    const momentLine = momentStations.slice(1).map((end, i) => {
        const start = momentStations[i];
        const shape = learned['moment-sketch'] ? (Math.abs(model.V(start.x, true) - model.V(end.x, false)) < 1e-7 ? 'line' : 'curve') :
            sketchShapes?.[i];
        if (!shape || ![start.x, end.x, start.value, end.value].every(Number.isFinite)) return '';
        const a = x(start.x), b = x(end.x), y1 = momentY(start.value), y2 = momentY(end.value);
        if (shape === 'line') return `M${a} ${y1}L${b} ${y2}`;
        const interval = end.x - start.x;
        const midpoint = (start.x + end.x) / 2;
        const bow = Math.abs(model.M(midpoint) - (model.M(start.x) + model.M(end.x)) / 2) || model.Mmax * .06;
        const middle = (start.value + end.value) / 2 + (shape === 'negative' ? -bow : bow);
        const control = learned['moment-sketch'] ? start.value + model.V(start.x, true) * interval / 2 :
            2 * middle - (start.value + end.value) / 2;
        return `M${a} ${y1}Q${(a + b) / 2} ${momentY(control)} ${b} ${y2}`;
    }).filter(Boolean).join(' ');
    const area = model.areas[areaIndex];
    const areaX = pos => pos === model.zero ? learned.zero : pos;
    const shownArea = area && [areaX(area.start), areaX(area.end)].every(Number.isFinite) ?
        `<path class="beam-lab-area ${area.value < 0 ? 'beam-lab-negative' : ''}" d="M${x(areaX(area.start))} ${shearDatum}V${shearY(area.left)}
            L${x(areaX(area.end))} ${shearY(area.right)}V${shearDatum}Z"/>` : '';
    const patchDrawings = udls.map(({ s, e, w }, i) => {
        const top = loadY(w), width = x(e) - x(s), arrows = Math.max(3, Math.round(width / 35));
        const result = model.forces[i];
        const centroid = accepted(`centroid-${i}`) ? learned[`centroid-${i}`] : null;
        return `<path class="beam-lab-load ${patch === i ? 'beam-lab-highlight' : ''}" d="M${x(s)} ${beamY}V${top}H${x(e)}V${beamY}Z"/>
            <text x="${x((s + e) / 2)}" y="${top - 5}" text-anchor="middle">${numberText(w)} kN/m</text>
            ${Array.from({ length: arrows }, (_, j) => `<path class="diagram-arrow" d="M${x(s) + (j + .5) * width / arrows} ${top + 4}V${beamY - 4}"/>`).join('')}
            ${centroid === null ? '' : `<circle class="beam-lab-resultant" cx="${x(centroid)}" cy="99" r="4"/>
                <text x="${x(centroid)}" y="129" text-anchor="middle">W${udls.length > 1 ? i === 0 ? '₁' : '₂' : ''} = ${numberText(learned[`force-${i}`] ?? result.p)} kN</text>`}`;
    }).join('');
    const rampV = ramp && accepted('v-0') ? `M${pin} ${shearY(model.V(0))}Q${x(L / 2)} ${shearY(model.V(0))} ${roller} ${shearY(model.V(L))}` : '';
    const rampM = ramp && accepted('zero') ? `M${pin} ${momentY(0)}C${x(L / 3)} ${momentY(model.RA * L / 3)}
        ${x(2 * L / 3)} ${momentY(model.RA * 2 * L / 3)} ${roller} ${momentY(0)}` : '';
    const support = (px, rollerSupport) => `<path class="beam-lab-support" d="M${px} 111l-9 12h18Z"/>
        ${rollerSupport ? `<circle class="beam-lab-support" cx="${px - 5}" cy="126" r="2.4"/><circle class="beam-lab-support" cx="${px + 5}" cy="126" r="2.4"/>` : ''}
        <text x="${px}" y="141" text-anchor="middle">${rollerSupport ? 'B' : 'A'}</text>`;
    const reaction = (station, side, value) => Number.isFinite(value) ? `<path class="beam-lab-reaction" d="M${x(station)} 100V73m-4 5 4-5 4 5"/>
        <text class="beam-lab-reaction-label" x="${x(station) + side * 7}" y="97" text-anchor="${side === 1 ? 'start' : 'end'}">${side === 1 ? 'Aᵧ' : 'Bᵧ'} = ${numberText(value)} kN</text>` : '';
    const crossing = Number.isFinite(zero) && zero >= 0 && zero <= L;
    const label = t('Linked load, shear and moment diagrams');
    const svg = plate(label, `
        <text class="beam-lab-row" x="13" y="21">${t('Load')} · kN/m</text>
        <text class="beam-lab-row" x="13" y="151">${t('Shear')} V · kN</text>
        <text class="beam-lab-row" x="13" y="270">${t('Moment')} M · kN·m</text>
        ${stations.map(position => `<path class="beam-lab-grid" d="M${x(position)} 108V362"/>`).join('')}
        ${patchDrawings}
        ${ramp ? `<path class="beam-lab-load beam-lab-highlight" d="M${pin} ${beamY}L${roller} ${loadY(ramp)}V${beamY}Z"/>
            <text x="${roller}" y="${loadY(ramp)-5}" text-anchor="end">${numberText(ramp)} kN/m</text>` : ''}
        <path class="beam-lab-axis" d="M${pin} ${beamY}H${roller}"/>
        ${support(pin, false)}${support(roller, true)}
        ${reaction(0, 1, learned['reaction-a'] ?? (ramp ? learned['v-0'] : undefined))}${reaction(L, -1, learned['reaction-b'])}
        ${shownArea}${datum(shearDatum)}${datum(288)}
        <path class="beam-lab-shear" d="${shearLine}${rampV}
            ${accepted('v-0') ? `M${pin} ${shearDatum}V${shearY(learned['v-0'])}` : ''}
            ${accepted('after-b') && Number.isFinite(displayedShear.at(-1).value) ? `M${roller} ${shearY(displayedShear.at(-1).value)}V${shearY(learned['after-b'])}` : ''}"/>
        ${displayedShear.filter(({ value }) => Number.isFinite(value) && value !== 0).map(({ x: position, value }) =>
            dot(position, shearY(value), numberText(value))).join('')}
        <path class="beam-lab-moment" data-lab-moment-curve d="${momentLine}${rampM}"/>
        ${momentStations.filter(({ x, value }) => Number.isFinite(x) && Number.isFinite(value))
            .map(({ x: position, value }) => dot(position, momentY(value), numberText(value),
                position > L * .83 || (position < zero && zero - position < L * .14))).join('')}
        ${crossing ? `<g class="beam-lab-crossing${Number.isFinite(draftZero) ? ' beam-lab-proposed' : ''}" data-lab-crossing="${fmt(zero)}">
            <path d="M${x(zero)} 115V352"/><circle cx="${x(zero)}" cy="${shearDatum}" r="5"/>
            <text x="${x(zero)}" y="395" text-anchor="middle">x = ${numberText(zero)} m</text></g>` : ''}
        ${stations.map(position => `<text x="${x(position)}" y="377" text-anchor="middle">${numberText(position)}</text>`).join('')}
        <text x="450" y="377">m</text>
        <path class="beam-lab-guide" data-lab-guide d="M${x(guide)} 33V357"/>
    `, 405);
    return svg.replace('class="diagram plate"', 'class="diagram plate beam-lab-plot" data-lab-plot');
}

function beamLabLearned(workshop, run, index) {
    const learned = {};
    for (let i = 0; i <= index; i++) {
        const turn = workshop.turns[i], record = run.records[i];
        if (record?.status) learned[turn.labId] = turn.type === 'sketch' ? true : turn.expected;
    }
    return learned;
}

function beamLabDrawing(workshop, run, index) {
    const turn = workshop.turns[index], record = run.records[index];
    const guide = run.guide ?? turn.labFocus ?? 0;
    const draftZero = turn.labPlot && !record?.status ? parseStudyNumber(record?.draft ?? '', record?.draftLocale) : undefined;
    const markup = beamLabPlot(workshop, beamLabLearned(workshop, run, index), {
        guide, patch: turn.patch, areaIndex: turn.areaIndex, draftZero,
        sketchShapes: turn.type === 'sketch' ? record?.draft?.shapes : undefined,
    });
    return {
        ...workshopFigure(markup),
        tools: `<label class="beam-lab-explore">${t('Move the guide along the beam')}
            <input type="range" min="0" max="${workshop.beam.L}" step=".01" value="${guide}" data-lab-range>
            <output data-lab-coordinate>x = ${numberText(guide)} m</output></label>`,
    };
}

function bindBeamLabGuide(root, length, onGuide) {
    const range = root.querySelector('[data-lab-range]');
    if (!range) return;
    const move = value => {
        root.querySelector('[data-lab-guide]')?.setAttribute('d', `M${beamLabX(length, value)} 33V357`);
        root.querySelector('[data-lab-coordinate]').textContent = `x = ${numberText(value)} m`;
        range.value = value;
    };
    range.addEventListener('input', () => { move(Number(range.value)); onGuide(Number(range.value), false); });
    root.addEventListener('click', event => {
        const svg = event.target.closest('[data-lab-plot]');
        if (!svg) return;
        const matrix = svg.getScreenCTM();
        if (!matrix) return;
        const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
        if (point.x < beamLabLeft - 3 || point.x > beamLabRight + 3 || point.y < 30 || point.y > 365) return;
        const value = Math.round(Math.max(0, Math.min(length, (point.x - beamLabLeft) * length / (beamLabRight - beamLabLeft))) * 100) / 100;
        move(value);
        onGuide(value, point.y >= 152 && point.y <= 249);
    });
}
