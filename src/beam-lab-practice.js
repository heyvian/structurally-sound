const beamPracticeTitle = t('Independent beam practice');

function beamLabNavigation(active) {
    const options = [
        ['beam-a', beamLabTitles['beam-a']], ['beam-b', beamLabTitles['beam-b']],
        ['beam-practice', beamPracticeTitle], ['beam-ramp', beamLabTitles['beam-ramp']],
    ];
    return `<nav class="beam-lab-nav" aria-label="${t('Beam drawing workshops')}">
        ${options.map(([id, label]) => id === active
            ? `<span aria-current="page">${label}</span>`
            : `<a href="#workshop-${id}">${label}</a>`).join('')}
    </nav>`;
}

function refreshBeamLabPlot(root, workshop, run) {
    const plot = root.querySelector('[data-lesson-live] [data-lab-plot]');
    if (!plot) return;
    plot.outerHTML = beamLabDrawing(workshop, run, run.cursor).markup;
    if (Number.isFinite(run.guide)) {
        root.querySelector('[data-lab-range]').value = run.guide;
        root.querySelector('[data-lab-coordinate]').textContent = `x = ${numberText(run.guide)} m`;
    }
}

function openBeamPractice() {
    session = undefined;
    activeWorkshop = 'beam-practice';
    archiveAttempt = null;
    history.replaceState(null, '', '#workshop-beam-practice');
    const beam = { L: 10, a: 0, b: 10, points: [], udls: [{ s: 1, e: 5, w: 5 }, { s: 5, e: 9, w: 10 }] };
    const model = beamLabMath(beam);
    const workshop = { beam, model };
    const state = workshopProgress.beamPractice ||= { answers: {} };
    const raw = state.answers;
    const fields = [];
    const number = (id, label, unit, expected, plotScale) => fields.push({ id, label, unit, expected, plotScale });
    const at = x => `x = ${numberText(x)} m`;
    const pointNames = model.momentStations.map(x => x === model.zero ? t('Shear crossing') : at(x));
    number('reaction-a', 'Aᵧ', 'kN', model.RA, model.Vmax);
    number('reaction-b', 'Bᵧ', 'kN', model.RB, model.Vmax);
    const reactions = fields.slice();
    model.stations.forEach((x, i) => {
        const label = i === 0 ? t('Just after A') : x === beam.L ? t('Just before B') : at(x);
        number(`v-${i}`, label, 'kN', model.V(x, x !== beam.L), model.Vmax);
    });
    number('after-b', t('Just after B'), 'kN', 0, model.Vmax);
    number('zero', t('x at zero shear'), 'm', model.zero, beam.L);
    const shear = fields.slice(reactions.length);
    model.momentStations.forEach((x, i) => number(`m-${i}`, pointNames[i], 'kN·m', model.M(x), model.Mmax));
    const moment = fields.slice(reactions.length + shear.length);
    const shapes = graphQuestion(beam, 'M').shapes.map((expected, i) => {
        const label = `${pointNames[i]} → ${pointNames[i + 1]}`;
        return { id: `shape-${i}`, label, expected };
    });
    const totals = [1, -1].map((sign, i) => {
        const expected = model.areas.filter(area => Math.sign(area.value) === sign).reduce((sum, area) => sum + area.value, 0);
        number(i ? 'area-negative' : 'area-positive', i ? t('Total negative shear area') : t('Total positive shear area'), 'kN·m', expected);
        return fields.at(-1);
    });
    const all = [...fields, ...shapes];
    let guide = 0, showSolution = false;
    const shapeField = ({ id, label }) => `<label>${label}<select data-lab-field="${id}">
        <option value="">${t('Choose a shape')}</option>
        ${Object.entries(shapeLabels).map(([value, name]) => `<option value="${value}" ${raw[id] === value ? 'selected' : ''}>${name}</option>`).join('')}
        </select></label>`;
    const valueField = ({ id, label, unit }) => `<label>${label} · ${unit}
        <input class="study-number" type="text" inputmode="decimal" data-lab-field="${id}"
            value="${escapeTutor(Number.isFinite(raw[id]) ? studyInputText(raw[id]) : '')}"></label>`;
    const group = (title, entries, render = valueField) => `<fieldset class="diagram-fields">
        <legend>${title}</legend><div class="station-grid">${entries.map(render).join('')}</div></fieldset>`;
    app.innerHTML = `<section class="tutor-session beam-lab-practice">
        <div class="tutor-session-heading"><div>${button(`‹ ${units[4].title}`, 'unit', 4)}
            <p class="eyebrow">ARCH 600 · ${units[4].title}</p><h1>${beamPracticeTitle}</h1></div></div>
        ${beamLabNavigation('beam-practice')}
        <div class="tutor-board">
            <aside class="tutor-drawing">
                <div class="tutor-drawing-title"><span>${t('Linked load, shear and moment diagrams')}</span></div>
                <div data-lab-practice-plot></div>
                <label class="beam-lab-explore">${t('Move the guide along the beam')}
                    <input type="range" min="0" max="${beam.L}" step=".01" value="0" data-lab-range>
                    <output data-lab-coordinate>x = 0 m</output></label>
            </aside>
            <form class="tutor-thread tutor-problem">
                <p>${t('Use the beam and load drawing to complete the worksheet in any order. The plotted lines follow your entries. Check the whole worksheet when you are ready.')}</p>
                ${group(t('Support reactions'), reactions)}
                ${group(t('Shear ordinates and crossing'), shear)}
                ${group(t('Signed shear areas'), totals)}
                ${group(t('Moment ordinates'), moment)}
                ${group(t('Segment geometry'), shapes, shapeField)}
                <div class="toolbar">
                    <button class="primary" type="submit">${t('Check my sketch')}</button>
                    <button type="button" data-lab-solution hidden>${t('Show worked drawing')}</button>
                </div>
                <p data-lab-practice-status role="status"></p>
                <dl class="beam-lab-answers" data-lab-answers hidden>${all.map(({ label, unit, expected }) =>
                    `<div><dt>${label}${unit ? ` · ${unit}` : ''}</dt><dd>${typeof expected === 'number' ? numberText(expected) : shapeLabels[expected]}</dd></div>`).join('')}</dl>
            </form>
        </div>
    </section>`;
    const root = app.querySelector('.beam-lab-practice');
    const controls = [...root.querySelectorAll('[data-lab-field]')];
    const status = root.querySelector('[data-lab-practice-status]');
    const reveal = root.querySelector('[data-lab-solution]');
    const worked = Object.fromEntries(fields.map(({ id, expected }) => [id, expected]));
    worked['moment-sketch'] = true;
    const draw = () => {
        const plotted = Object.fromEntries(fields.filter(({ id, plotScale }) => plotScale && Number.isFinite(raw[id]) &&
            Math.abs(raw[id]) <= 1.6 * plotScale && (id !== 'zero' || raw[id] >= 0 && raw[id] <= beam.L)).map(({ id }) => [id, raw[id]]));
        root.querySelector('[data-lab-practice-plot]').innerHTML = beamLabPlot(workshop, showSolution ? worked : plotted, {
            guide, sketchShapes: shapes.map(({ id }) => raw[id]),
        });
    };
    draw();
    bindBeamLabGuide(root, beam.L, value => { guide = value; });
    controls.forEach(control => control.addEventListener('input', () => {
        const id = control.dataset.labField;
        const value = control.tagName === 'SELECT' ? control.value : parseStudyNumber(control.value);
        if (value === '' || Number.isNaN(value)) delete raw[id]; else raw[id] = value;
        control.removeAttribute('aria-invalid');
        showSolution = false;
        reveal.hidden = true;
        reveal.textContent = t('Show worked drawing');
        root.querySelector('[data-lab-answers]').hidden = true;
        status.textContent = '';
        draw();
        saveWorkshops();
    }));
    root.querySelector('form').addEventListener('submit', event => {
        event.preventDefault();
        let total = 0;
        all.forEach(({ id, expected }) => {
            const value = raw[id];
            const correct = typeof expected === 'number' ? Number.isFinite(value) &&
                Math.abs(value - expected) <= Math.max(.025, Math.abs(expected) * .004) : value === expected;
            root.querySelector(`[data-lab-field="${id}"]`).setAttribute('aria-invalid', String(!correct));
            total += Number(correct);
        });
        status.textContent = t`${total} of ${all.length} entries correct.`;
        reveal.hidden = false;
    });
    reveal.addEventListener('click', () => {
        showSolution = !showSolution;
        reveal.textContent = showSolution ? t('Show my drawing') : t('Show worked drawing');
        root.querySelector('[data-lab-answers]').hidden = !showSolution;
        draw();
    });
    focusPage();
}
