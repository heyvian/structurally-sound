const beamDrawingTitle = t('Diagram drawing drills');
const classDrawingBeam = {
    L: 8, a: 3, b: 8,
    points: [{ x: 0, p: 30 }, { x: 6, p: 40 }],
    udls: [{ s: 0, e: 8, w: 20 }],
};

function generateDrawingBeam(round, random = Math.random) {
    const integer = (min, max) => min + Math.floor(random() * (max - min + 1));
    const L = 2 * integer(3, 8);
    const beam = { L, a: 0, b: L, points: [], udls: [] };
    const w = integer(2, 10);
    switch (round % 7) {
        case 0: {
            const x = L * integer(1, 3) / 4;
            beam.points = [{ x, p: 4 * integer(2, 12) }];
            break;
        }
        case 1:
            beam.points = [{ x: L / 4, p: 4 * integer(2, 10) }, { x: 3 * L / 4, p: 4 * integer(2, 10) }];
            break;
        case 2:
            beam.udls = [{ s: L / 4, e: 3 * L / 4, w }];
            break;
        case 3:
            beam.points = [{ x: L / 4, p: w * L / 8 }];
            beam.udls = [{ s: L / 2, e: L, w }];
            break;
        case 4:
            beam.a = L / 4;
            beam.points = [{ x: 0, p: 3 * w * L / 8 }];
            beam.udls = [{ s: beam.a, e: L, w }];
            break;
        case 5:
            beam.couples = [{ x: L * integer(1, 3) / 4, m: L * integer(2, 8) * (random() < .5 ? -1 : 1) }];
            break;
        case 6:
            beam.a = 3 * L / 8;
            beam.points = [{ x: 0, p: integer(2, 5) * w * L / 16 }, { x: 3 * L / 4, p: integer(3, 6) * w * L / 16 }];
            beam.udls = [{ s: 0, e: L, w }];
            break;
    }
    return beam;
}

function openBeamDrawingDrill() {
    session = undefined;
    activeWorkshop = 'beam-draw';
    archiveAttempt = null;
    history.replaceState(null, '', '#workshop-beam-draw');
    const state = workshopProgress.beamDrawing ??= { round: 0, beam: generateDrawingBeam(0), kind: 'V', drafts: {} };
    renderBeamDrawingDrill(state);
}

function drawingDrillQuestion(beam, kind, positiveMomentUp) {
    const question = { ...graphQuestion(beam, kind), givenOrdinates: true, positiveMomentUp };
    if (kind === 'V') {
        // Give the zero crossing as a station so it can be marked on the sketch.
        const { ms, vs } = analyze(beam);
        const crossings = ms.filter(({ x }) => !vs.some(station => Math.abs(station.x - x) < 1e-7));
        question.stations = [...vs, ...crossings.map(({ x }) => ({ x, v: 0 }))].sort((a, b) => a.x - b.x);
        question.answer = question.stations.map(({ v }) => v);
    }
    return question;
}

function renderBeamDrawingDrill(state) {
    const { kind, showClass } = state;
    const beam = showClass ? classDrawingBeam : state.beam;
    const drafts = showClass ? (state.classDrafts ??= {}) : state.drafts;
    const { RA, RB, Vmax, Mmax } = analyze(beam);
    const question = drawingDrillQuestion(beam, kind, showClass);
    const labels = { V: t('Shear diagram'), M: t('Bending moment diagram') };
    const signed = value => `${value > 0 ? '+' : ''}${numberText(value)} kN`;
    app.innerHTML = `<section class="tutor-session beam-drawing-drill">
        <div class="tutor-session-heading"><div>${button(`‹ ${units[4].title}`, 'unit', 4)}
            <p class="eyebrow">ARCH 600 · ${units[4].title}</p><h1 tabindex="-1">${beamDrawingTitle}</h1></div></div>
        <div class="drill-toolbar">
            <div class="drill-modes" role="group" aria-label="${t('Diagram to draw')}">
                ${Object.entries(labels).map(([id, label]) => `<button type="button" data-drill-kind="${id}" aria-pressed="${kind === id}">${label}</button>`).join('')}
            </div>
            <div class="drill-modes">
                <button type="button" data-drill-example>${showClass ? t('Back to generated beam') : t('Class example')}</button>
                <button class="primary" type="button" data-drill-new>${t('New beam')}</button>
            </div>
        </div>
        <div class="tutor-board">
            <aside class="tutor-drawing">
                <div class="tutor-drawing-title"><span>${t('Loads and reactions')}</span>${showClass ? `<span>${t('Class example')}</span>` : ''}</div>
                <div class="tutor-drawing-frame">${beamFigure(beam, [1, 2], { isolated: true, values: { 1: RA, 2: RB }, showReactionValues: false })}</div>
                <dl class="drill-reactions">
                    <div><dt>Aₓ</dt><dd>0 kN</dd></div><div><dt>Aᵧ</dt><dd>${signed(RA)}</dd></div><div><dt>Bᵧ</dt><dd>${signed(RB)}</dd></div>
                </dl>
                ${kind === 'M' ? `<details class="drill-shear-reference"><summary>${t('See the shear diagram')}</summary>
                    ${graphSolution(drawingDrillQuestion(beam, 'V'))}</details>` : ''}
            </aside>
            <section class="tutor-thread tutor-problem drill-problem" aria-label="${labels[kind]}">
                ${graphMarkup(question)}
                <div class="toolbar drill-check">
                    <button class="primary" type="button" data-drill-check disabled>${t('Check my sketch')}</button>
                    <button type="button" data-drill-next hidden>${t('New beam')}</button>
                </div>
                <p class="drill-feedback" data-drill-feedback role="status"></p>
                <details class="drill-worked"><summary>${t('Show worked drawing')}</summary>${graphSolution(question)}
                    ${showClass ? `<p class="section-totals">|V|<sub>max</sub> = ${numberText(Vmax)} kN · |M|<sub>max</sub> = ${numberText(Mmax)} kN·m</p>` : ''}</details>
            </section>
        </div>
    </section>`;
    const root = app.querySelector('.beam-drawing-drill');
    const check = root.querySelector('[data-drill-check]');
    const next = root.querySelector('[data-drill-next]');
    const feedback = root.querySelector('[data-drill-feedback]');
    let answer;

    bindGraph(question, entered => {
        answer = entered;
        check.disabled = !entered;
        next.hidden = true;
        root.querySelector('[aria-invalid="true"]')?.removeAttribute('aria-invalid');
        feedback.textContent = '';
        delete feedback.dataset.result;
    }, {
        root, draft: drafts[kind],
        onDraft: draft => {
            drafts[kind] = draft;
            saveWorkshops();
        },
    });

    check.addEventListener('click', () => {
        if (!answer) return;
        root.querySelector('[aria-invalid="true"]')?.removeAttribute('aria-invalid');
        const problem = firstGraphError(question, { ...answer, sketched: [] });
        feedback.dataset.result = problem ? 'retry' : 'correct';
        if (!problem) {
            next.hidden = false;
            feedback.textContent = t('Your drawing is correct. Try the other diagram or start a new beam.');
        } else if (problem.station !== undefined) {
            const label = stationLabel(question.stations, problem.station);
            root.querySelector(`[data-plot-station="${problem.station}"]`).setAttribute('aria-invalid', 'true');
            feedback.textContent = t`Check the plotted height at ${label}.`;
        } else {
            const range = graphSegmentLabel(question, problem.segment);
            root.querySelector(`[data-shape-cycle="${problem.segment}"]`).setAttribute('aria-invalid', 'true');
            feedback.textContent = t`Check the shape of this segment: ${range}.`;
        }
    });

    root.querySelectorAll('[data-drill-kind]').forEach(control => control.addEventListener('click', () => {
        if (state.kind === control.dataset.drillKind) return;
        state.kind = control.dataset.drillKind;
        renderBeamDrawingDrill(state);
        app.querySelector(`[data-drill-kind="${state.kind}"]`).focus();
    }));
    const newBeam = () => {
        state.round += 1;
        state.beam = generateDrawingBeam(state.round);
        state.drafts = {};
        state.showClass = false;
        renderBeamDrawingDrill(state);
        app.querySelector('[data-drill-new]').focus();
    };
    root.querySelector('[data-drill-new]').addEventListener('click', newBeam);
    next.addEventListener('click', newBeam);
    root.querySelector('[data-drill-example]').addEventListener('click', () => {
        state.showClass = !state.showClass;
        renderBeamDrawingDrill(state);
        app.querySelector('[data-drill-example]').focus();
    });
    focusPage();
}
