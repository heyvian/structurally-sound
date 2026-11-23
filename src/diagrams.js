function stationLabel(stations, index) {
    const station = stations[index];
    let side = '';
    if (stations[index - 1]?.x === station.x) side = ' · right';
    else if (stations[index + 1]?.x === station.x) side = ' · left';
    return `x = ${fmt(station.x)} m${side}`;
}

const shapeLabels = {
    line: 'Straight',
    positive: 'Parabola bows toward positive M',
    negative: 'Parabola bows toward negative M',
};

function graphScale(question, values) {
    return Math.max(5, Math.ceil(Math.max(...question.answer.map(Math.abs),
        ...values.filter(Number.isFinite).map(Math.abs)) / 5) * 5);
}

function graphX(question, position) { return 55 + 430 * position / question.b.L; }
function graphY(question, scale, value) { return 133 + (question.kind === 'M' ? 1 : -1) * value / scale * 94; }

function firstGraphError(question, input) {
    const scale = graphScale(question, []);
    const station = question.answer.findIndex((value, i) => !Number.isFinite(input.values[i]) ||
        Math.abs(input.values[i] - value) > Math.max(.05, Math.abs(value) * .005, input.sketched[i] ? scale * .045 : 0));
    if (station >= 0) return { station };
    const segment = question.shapes.findIndex((shape, i) => shape !== input.shapes[i]);
    return segment >= 0 ? { segment } : null;
}

function graphCanvas(question, values, shapes, selected = -1, showAnswer = false) {
    const moment = question.kind === 'M';
    const units = moment ? 'kN·m' : 'kN';
    const scale = graphScale(question, values);
    const x = position => graphX(question, position);
    const y = value => graphY(question, scale, value);
    const solution = showAnswer ? analyze(question.b) : null;
    const segment = (value, previous, index, shape, exact) => {
        const current = question.stations[index];
        const end = `${x(current.x)} ${y(value)}`;
        if (!shape || shape === 'line') return `L${end}`;

        const start = question.stations[index - 1].x;
        const midpoint = (current.x + start) / 2;
        const chord = (previous + value) / 2;
        const intensity = question.b.udls.reduce((sum, load) =>
            midpoint > load.s && midpoint < load.e ? sum + load.w : sum, 0);
        // The quadratic control point is twice the midpoint offset from the chord.
        const bend = Math.abs(intensity) * (current.x - start) ** 2 / 4 || scale * .24;
        const control = exact
            ? 2 * solution.M(midpoint) - chord
            : chord + (shape === 'positive' ? bend : -bend);
        return `Q${x(midpoint)} ${y(control)} ${end}`;
    };
    const path = (ordinates, segments, exact) => ordinates.map((value, i) => {
        if (value === null) return '';
        const previous = ordinates[i - 1];
        if (previous == null) return `M${x(question.stations[i].x)} ${y(value)}`;
        return segment(value, previous, i, segments[i - 1], exact);
    }).join(' ');
    const grid = Array.from({ length: 9 }, (_, i) => scale * (i - 4) / 4).map(value => `
        <path class="${value === 0 ? 'axis' : 'grid-line'}" d="M55 ${y(value)}H485"/>
        <text x="5" y="${y(value) + 4}">${fmt(value)}</text>`).join('');
    const positions = [...new Set(question.stations.map(station => station.x))];
    const shapeTargets = !showAnswer && selected === -1 && values.every(Number.isFinite) ? shapes.map((shape, i) =>
        `<path class="graph-shape-hit" data-shape-hit="${i}" d="M${x(question.stations[i].x)} ${y(values[i])}${segment(values[i + 1], values[i], i + 1, shape, false)}"/>`).join('') : '';
    return `<text x="55" y="15">${question.kind} (${units}) · + ${moment ? 'down' : 'up'}</text>
        ${grid}
        ${positions.map(position => `<path class="grid-line" d="M${x(position)} 28V230"/>`).join('')}
        ${positions.filter((position, i) => i === 0 || x(position) - x(positions[i - 1]) >= 31).map(position =>
            `<text x="${x(position)}" y="244" text-anchor="middle">${fmt(position)}</text>`).join('')}
        <text x="515" y="244" text-anchor="end">m</text>
        ${selected >= 0 ? `<path class="active-station" d="M${x(question.stations[selected].x)} 28V236"/>` : ''}
        <path class="learner-curve" d="${path(values, shapes, false)}"/>
        ${values.map((value, i) => value === null ? '' :
            `<circle class="learner-ordinate" cx="${x(question.stations[i].x)}" cy="${y(value)}" r="4"/>`).join('')}
        ${shapeTargets}
        ${showAnswer ? `<path class="solution-curve" d="${path(question.answer, question.shapes, true)}"/>
            <text x="485" y="258" text-anchor="end">Dashed line · solution</text>` :
        '<g class="plot-preview" visibility="hidden" aria-hidden="true"><path/><circle r="6"/></g>'}`;
}

function graphMarkup(question) {
    return `
        <p id="graph-instructions">${question.kind === 'M' ?
            'Positive sagging goes below the baseline.' : 'Positive shear goes above the baseline.'}
            Choose a station, then tap the grid at its height. A mouse previews the snapped point. You can also type exact values below.</p>
        <div class="graph-station-buttons" role="group" aria-label="Stations to plot">${question.stations.map((_, i) =>
            `<button type="button" data-plot-station="${i}" aria-pressed="false">${stationLabel(question.stations, i)}</button>`).join('')}</div>
        <svg id="graph-plot" class="diagram graph" viewBox="0 0 520 263" role="img"
            aria-label="Your diagram sketch" aria-describedby="graph-instructions"></svg>
        <p class="graph-placement" data-graph-placement></p>
        <p class="graph-announcement" role="status" data-graph-announcement></p>
        <fieldset class="diagram-fields"><legend>${question.kind === 'M' ? 'Moment ordinates · kN·m' : 'Shear ordinates · kN'}</legend>
            <div class="station-grid">${question.stations.map((_, i) =>
                `<label>${stationLabel(question.stations, i)}<input type="number" step="any" inputmode="decimal" data-station="${i}"></label>`).join('')}</div>
        </fieldset>
        ${question.shapes.length ? `<fieldset class="diagram-fields"><legend>Segment geometry</legend>
            <p>After placing the points, tap a line or its button to cycle through shapes. A positive bow curves downward from the straight line between the points.</p>
            <div class="graph-station-buttons" role="group" aria-label="Cycle segment shapes">
            ${question.shapes.map((_, i) => `<button type="button" data-shape-cycle="${i}"></button>`).join('')}</div>
            <div class="station-grid">
            ${question.shapes.map((_, i) => `<label>${fmt(question.stations[i].x)}–${fmt(question.stations[i + 1].x)} m
                <select data-segment="${i}"><option value="">Choose a shape</option>
                ${Object.entries(shapeLabels).map(([value, label]) => `<option value="${value}">${label}</option>`).join('')}
                </select></label>`).join('')}</div></fieldset>` : ''}`;
}

function bindGraph(question, onChange, { root = document, draft, onDraft } = {}) {
    const plot = root.querySelector('#graph-plot');
    const inputs = [...root.querySelectorAll('[data-station]')];
    const stations = [...root.querySelectorAll('[data-plot-station]')];
    const segments = [...root.querySelectorAll('[data-segment]')];
    const cycles = [...root.querySelectorAll('[data-shape-cycle]')];
    const placement = root.querySelector('[data-graph-placement]');
    const announcement = root.querySelector('[data-graph-announcement]');
    const units = question.kind === 'M' ? 'kN·m' : 'kN';
    const answer = {
        values: question.stations.map((_, i) => Number.isFinite(draft?.values?.[i]) ? draft.values[i] : null),
        shapes: question.shapes.map((_, i) => Object.hasOwn(shapeLabels, draft?.shapes?.[i]) ? draft.shapes[i] : null),
        sketched: question.stations.map((_, i) => draft?.sketched?.[i] === true),
    };
    const firstEmpty = () => answer.values.findIndex(value => value === null);
    let selected = firstEmpty();
    const stationStatus = () => {
        placement.textContent = selected < 0 ? 'All stations placed. Select any station to move its point.' :
            `Placing ${stationLabel(question.stations, selected)}. Height snaps to ${fmt(graphScale(question, answer.values) / 25)} ${units}.`;
    };
    const paint = (showAnswer = false) => {
        plot.classList.toggle('placing-station', !showAnswer && selected >= 0);
        plot.innerHTML = graphCanvas(question, answer.values, answer.shapes, showAnswer ? -1 : selected, showAnswer);
        stations.forEach((button, i) => {
            button.setAttribute('aria-pressed', selected === i);
            const value = answer.values[i];
            button.textContent = `${stationLabel(question.stations, i)}${value === null ? '' : ` · ${fmt(value)} ${units}`}`;
        });
        cycles.forEach((button, i) => {
            const range = `${fmt(question.stations[i].x)}–${fmt(question.stations[i + 1].x)} m`;
            button.textContent = `${range} · ${shapeLabels[answer.shapes[i]] ?? 'Choose shape'}`;
        });
        stationStatus();
    };
    const update = () => {
        if (onDraft) onDraft({ values: [...answer.values], shapes: [...answer.shapes], sketched: [...answer.sketched] });
        onChange(answer.values.every(Number.isFinite) && answer.shapes.every(Boolean) ? answer : null);
        paint();
    };
    inputs.forEach((input, i) => {
        input.value = answer.values[i] ?? '';
        input.addEventListener('focus', () => { selected = i; paint(); });
        input.addEventListener('input', () => {
            answer.values[i] = Number.isFinite(input.valueAsNumber) ? input.valueAsNumber : null;
            answer.sketched[i] = false;
            if (firstEmpty() === -1) selected = -1;
            update();
        });
    });
    stations.forEach((button, i) => button.addEventListener('click', () => { selected = i; paint(); }));
    segments.forEach((select, i) => {
        select.value = answer.shapes[i] ?? '';
        select.addEventListener('change', () => {
            answer.shapes[i] = select.value || null;
            selected = firstEmpty();
            update();
        });
    });
    const shapeKeys = Object.keys(shapeLabels);
    const cycleShape = i => {
        answer.shapes[i] = shapeKeys[(shapeKeys.indexOf(answer.shapes[i]) + 1) % shapeKeys.length];
        segments[i].value = answer.shapes[i];
        selected = firstEmpty();
        announcement.textContent = `Segment from ${stationLabel(question.stations, i)}: ${shapeLabels[answer.shapes[i]]}.`;
        update();
    };
    cycles.forEach((button, i) => button.addEventListener('click', () => cycleShape(i)));
    const snappedHeight = event => {
        if (selected < 0) return null;
        const matrix = plot.getScreenCTM();
        if (!matrix) return null;
        const svgPoint = plot.createSVGPoint();
        svgPoint.x = event.clientX;
        svgPoint.y = event.clientY;
        const point = svgPoint.matrixTransform(matrix.inverse());
        if (point.x < 44 || point.x > 495 || point.y < 32 || point.y > 234) return null;
        const scale = graphScale(question, answer.values);
        const value = (point.y - 133) * scale / ((question.kind === 'M' ? 1 : -1) * 94);
        const step = scale / 25;
        return Math.max(-scale, Math.min(scale, Number(fmt(Math.round(value / step) * step))));
    };
    const clearPreview = () => {
        plot.querySelector('.plot-preview')?.setAttribute('visibility', 'hidden');
        stationStatus();
    };
    const previewAt = event => {
        const value = snappedHeight(event);
        if (value === null) { clearPreview(); return; }
        const x = graphX(question, question.stations[selected].x);
        const y = graphY(question, graphScale(question, answer.values), value);
        const preview = plot.querySelector('.plot-preview');
        preview.setAttribute('visibility', 'visible');
        preview.querySelector('path').setAttribute('d', `M55 ${y}H485`);
        const dot = preview.querySelector('circle');
        dot.setAttribute('cx', x);
        dot.setAttribute('cy', y);
        placement.textContent = `${stationLabel(question.stations, selected)} · ${fmt(value)} ${units}. Click to place.`;
    };
    const sketchAt = event => {
        const hit = event.target.closest('[data-shape-hit]');
        if (hit) { cycleShape(Number(hit.dataset.shapeHit)); return; }
        const value = snappedHeight(event);
        if (value === null) return;
        announcement.textContent = `${stationLabel(question.stations, selected)} placed at ${fmt(value)} ${units}.`;
        answer.values[selected] = value;
        inputs[selected].value = fmt(value);
        answer.sketched[selected] = true;
        selected = firstEmpty();
        update();
    };
    plot.addEventListener('pointermove', previewAt);
    plot.addEventListener('pointerleave', clearPreview);
    plot.addEventListener('click', sketchAt);
    update();
    return () => {
        plot.removeEventListener('click', sketchAt);
        plot.removeEventListener('pointermove', previewAt);
        plot.removeEventListener('pointerleave', clearPreview);
        [...stations, ...cycles, ...inputs, ...segments].forEach(control => { control.disabled = true; });
        paint(true);
        placement.textContent = '';
    };
}

function graphSolution(question, includePlot = true) {
    const units = question.kind === 'M' ? 'kN·m' : 'kN';
    return `${includePlot ? `<svg class="diagram graph" viewBox="0 0 520 263" role="img" aria-label="Solution diagram">
            ${graphCanvas(question, question.stations.map(() => null), [], -1, true)}
        </svg>` : ''}
        <details class="ordinates"><summary>Solution ordinates and segment shapes</summary><ul>
            ${question.stations.map((_, i) => `<li>${stationLabel(question.stations, i)} = ${fmt(question.answer[i])} ${units}${i < question.shapes.length ?
                ` · next segment: ${shapeLabels[question.shapes[i]]}` : ''}</li>`).join('')}
        </ul></details>`;
}
