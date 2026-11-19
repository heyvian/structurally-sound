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

function graphCanvas(question, values, shapes, selected = -1, showAnswer = false) {
    const moment = question.kind === 'M';
    const units = moment ? 'kN·m' : 'kN';
    const scale = Math.max(5, Math.ceil(Math.max(...question.answer.map(Math.abs),
        ...values.filter(Number.isFinite).map(Math.abs)) / 5) * 5);
    const x = position => 55 + 430 * position / question.b.L;
    const y = value => 133 + (moment ? 1 : -1) * value / scale * 94;
    const solution = showAnswer ? analyze(question.b) : null;
    const path = (ordinates, segments, exact) => ordinates.map((value, i) => {
        if (value === null) return '';
        const current = question.stations[i];
        const end = `${x(current.x)} ${y(value)}`;
        const previous = ordinates[i - 1];
        if (previous == null) return `M${end}`;
        const shape = segments[i - 1];
        if (!shape || shape === 'line') return `L${end}`;

        const midpoint = (current.x + question.stations[i - 1].x) / 2;
        const chord = (previous + value) / 2;
        const control = exact
            ? 2 * solution.M(midpoint) - chord
            : chord + scale * (shape === 'positive' ? .24 : -.24);
        return `Q${x(midpoint)} ${y(control)} ${end}`;
    }).join(' ');
    const grid = Array.from({ length: 9 }, (_, i) => scale * (i - 4) / 4).map(value => `
        <path class="${value === 0 ? 'axis' : 'grid-line'}" d="M55 ${y(value)}H485"/>
        <text x="5" y="${y(value) + 4}">${fmt(value)}</text>`).join('');
    const positions = [...new Set(question.stations.map(station => station.x))];
    return `<text x="55" y="15">${question.kind} (${units}) · + ${moment ? 'down' : 'up'}</text>
        ${grid}
        ${positions.map(position => `<path class="grid-line" d="M${x(position)} 28V230"/>`).join('')}
        ${selected >= 0 ? `<path class="active-station" d="M${x(question.stations[selected].x)} 28V236"/>` : ''}
        <path class="learner-curve" d="${path(values, shapes, false)}"/>
        ${values.map((value, i) => value === null ? '' :
            `<circle class="learner-ordinate" cx="${x(question.stations[i].x)}" cy="${y(value)}" r="4"/>`).join('')}
        ${showAnswer ? `<path class="solution-curve" d="${path(question.answer, question.shapes, true)}"/>
            <text x="485" y="252" text-anchor="end">Dashed line · solution</text>` : ''}`;
}

function graphMarkup(question) {
    return `
        <p id="graph-instructions">${question.kind === 'M' ?
            'Numerically positive sagging is drawn below the baseline.' : 'Numerically positive shear is drawn above the baseline.'}
            Enter each ordinate or focus its field and click the grid to sketch it.
            ${question.shapes.length ? 'Choose the geometry of each moment segment.' : 'The diagram joins ordinates at load changes and support reactions.'}</p>
        <svg id="graph-plot" class="diagram graph" viewBox="0 0 520 263" role="img"
            aria-label="Your diagram sketch" aria-describedby="graph-instructions"></svg>
        <fieldset class="diagram-fields"><legend>${question.kind === 'M' ? 'Moment ordinates · kN·m' : 'Shear ordinates · kN'}</legend>
            <div class="station-grid">${question.stations.map((_, i) =>
                `<label>${stationLabel(question.stations, i)}<input type="number" step="any" inputmode="decimal" data-station="${i}"></label>`).join('')}</div>
        </fieldset>
        ${question.shapes.length ? `<fieldset class="diagram-fields"><legend>Segment geometry</legend><div class="station-grid">
            ${question.shapes.map((_, i) => `<label>${fmt(question.stations[i].x)}–${fmt(question.stations[i + 1].x)} m
                <select data-segment="${i}"><option value="">Choose a shape</option>
                ${Object.entries(shapeLabels).map(([value, label]) => `<option value="${value}">${label}</option>`).join('')}
                </select></label>`).join('')}</div></fieldset>` : ''}`;
}

function bindGraph(question, onChange) {
    const plot = document.getElementById('graph-plot');
    const inputs = [...document.querySelectorAll('[data-station]')];
    const answer = {
        values: question.stations.map(() => null),
        shapes: question.shapes.map(() => null),
        sketched: question.stations.map(() => false),
    };
    let selected = 0;
    const paint = (showAnswer = false) => {
        plot.innerHTML = graphCanvas(question, answer.values, answer.shapes, showAnswer ? -1 : selected, showAnswer);
    };
    const update = () => {
        onChange(answer.values.every(Number.isFinite) && answer.shapes.every(Boolean) ? answer : null);
        paint();
    };
    inputs.forEach((input, i) => {
        input.addEventListener('focus', () => { selected = i; paint(); });
        input.addEventListener('input', () => {
            answer.values[i] = input.value === '' ? null : input.valueAsNumber;
            answer.sketched[i] = false;
            update();
        });
    });
    document.querySelectorAll('[data-segment]').forEach(select => {
        select.addEventListener('change', () => {
            answer.shapes[Number(select.dataset.segment)] = select.value || null;
            update();
        });
    });
    const sketchAt = event => {
        const svgPoint = plot.createSVGPoint();
        svgPoint.x = event.clientX;
        svgPoint.y = event.clientY;
        const point = svgPoint.matrixTransform(plot.getScreenCTM().inverse());
        if (point.y < 38 || point.y > 228) return;
        const scale = Math.max(5, Math.ceil(Math.max(...question.answer.map(Math.abs),
            ...answer.values.filter(Number.isFinite).map(Math.abs)) / 5) * 5);
        const value = (point.y - 133) * scale / ((question.kind === 'M' ? 1 : -1) * 94);
        answer.values[selected] = Number(fmt(value));
        inputs[selected].value = fmt(value);
        answer.sketched[selected] = true;
        const next = answer.values.findIndex(value => value === null);
        if (next >= 0) selected = next;
        update();
    };
    plot.addEventListener('click', sketchAt);
    paint();
    return () => {
        plot.removeEventListener('click', sketchAt);
        paint(true);
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
