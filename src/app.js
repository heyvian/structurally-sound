const app = document.getElementById('app');
const progressKey = 'structural-val-v1';
const valLines = [
    t('Nothing has been poured yet. We can revise the drawing.'),
    t('A negative sign is information. Check which way the arrow points.'),
    t('Even buildings have difficult load cases.'),
    t('Unlike a studio deadline, this can be attempted again.'),
];
const stories = [
    [t('In 1978, the Citicorp Center team reconsidered the effects of wind and reinforced the tower’s connections. Revising this calculation takes less scaffolding.'),
        'https://www.asce.org/publications-and-news/civil-engineering-source/civil-engineering-magazine/article/2007/07/william-j-lemessurier'],
    [t('The Millennium Tower in San Francisco needed a foundation retrofit to address settlement and tilt. Catching a units error on paper is considerably cheaper.'),
        'https://www.sgh.com/project-story/millennium-tower-301-mission-street/'],
];

function readProgress() {
    try {
        const saved = JSON.parse(localStorage.getItem(progressKey));
        return {
            ...saved,
            xp: Number.isFinite(saved?.xp) ? saved.xp : 0,
            miss: saved?.miss && typeof saved.miss === 'object' ? saved.miss : {},
        };
    } catch {
        return { xp: 0, miss: {} };
    }
}

const state = readProgress();
const ref = (i, j) => ({ ...units[i].q[j], key: `${i}-${j}`, topic: units[i].title, topicIndex: i });
const unitQuestions = units.map((unit, i) => unit.q.map((_, j) => ref(i, j)));
const calculationCards = lessonPlans.map((plan, i) => ({
    ...plan.calculation, key: `formula-${i}`, type: 'formula', topic: units[i].title, topicIndex: i, step: t('Formula walkthrough'),
}));
const guidedQuestions = lessonPlans.map((plan, i) => plan.guided.map((question, j) => ({
    ...question, key: `guided-${i}-${j}`, topic: units[i].title, topicIndex: i, step: t('Do it together'),
})));

function beamWorkshopQuestions(beam, key) {
    const { Mmax } = analyze(beam);
    const distributed = beam.udls.reduce((sum, { s, e, w }) => sum + (e - s) * w, 0);
    const patch = beam.udls[0];
    return [
        { type: 'fbd', b: beam, prompt: t('Select every reaction to include on the free-body diagram.'),
            setup: t('The beam rests on a pin at A and a roller on a level surface at B. Keep the applied loads and replace the supports with arrows for the reactions they can supply.'),
            opts: ['Aₓ', 'Aᵧ', 'Bᵧ', t('Moment at A'), 'Bₓ'], answer: [0, 1, 2],
            hint: t('Replace a pin with two force components and a horizontal roller with its normal reaction.'),
            explain: t('A pin provides Aₓ and Aᵧ. A horizontal roller provides Bᵧ. Initially include Aₓ even though the horizontal equilibrium equation will give zero.') },
        { ...N(t('Replace the evenly spaced load arrows with one downward force. How large is that force?'), distributed,
            t`The loaded length is ${numberText(patch.e)} m − ${numberText(patch.s)} m = ${numberText(patch.e - patch.s)} m. Multiply by ${numberText(patch.w)} kN/m to get ${numberText(distributed)} kN. The metres cancel.`,
            t('Multiply each load intensity by its loaded length.'), 'kN'), b: beam },
        { ...N(t('Where should the single force that replaces the evenly spread load act? Give its distance from A.'),
            (patch.s + patch.e) / 2 - beam.a,
            t`The force acts halfway between the start and end of the loaded patch, at ${numberText((patch.s + patch.e) / 2 - beam.a)} m from A.`,
            t('Measure the centre of the loaded interval from A.'), 'm'), b: beam },
        ...beamQs(beam),
        N(t`The largest bending moment magnitude is ${numberText(Mmax)} kN·m. What section modulus Sₓ keeps bending stress at or below 150 MPa? Give your answer in thousands of mm³.`,
            Mmax * 1000 / 150, `Sₓ = |M|/fₐ = ${numberText(Mmax * 1000 / 150)}×10³ mm³.`,
            t('Convert moment to N·mm and use the displayed units for Sₓ.'), '10³ mm³'),
        steelQ('S', Mmax * 1000 / 150, steelProfiles),
    ].map((question, j) => ({ ...question, key: `${key}-${j}`, topic: t('Integrated beam analysis') }));
}

const beamPractice = beamWorkshopQuestions(beams[0], 'workshop');
const beamExam = beamWorkshopQuestions({ L: 7, a: 0, b: 7, points: [{ x: 5, p: 15 }],
    udls: [{ s: 0, e: 4, w: 6 }] }, 'beam-exam');
const trussPractice = latqs.map((question, j) => ({
    ...question, key: `trusswork-${j}`, topic: t('Integrated truss analysis'),
}));
const trussExam = trussQs.map((question, j) => ({
    ...question, key: `truss-exam-${j}`, topic: t('Triangular truss analysis'),
}));
const diagramExercises = Object.keys(fbdCases).map(kind => ({ ...fbdQuestion(kind), key: `fbd-${kind}`, topic: units[2].title, topicIndex: 2 }));
const questionBank = new Map([
    ...unitQuestions.flat(), ...calculationCards, ...guidedQuestions.flat(),
    ...beamPractice, ...beamExam, ...trussPractice, ...trussExam, ...diagramExercises,
].map(question => [question.key, question]));

let session;
let answer;
let showGraphAnswer;
let graphDraft;
let pageRoute = ['home', ''];
let practiceResume;
const languageRoutes = new Set(['home', 'practice', 'practice-menu', 'final', 'beam', 'truss', 'exam', 'weak', 'steel', 'sheet', 'sheet-all']);
const languageResumeKey = 'structural-language-resume';

function saveProgress() {
    try {
        localStorage.setItem(progressKey, JSON.stringify(state));
    } catch {
        // The app can still run in browsers with storage disabled.
    }
    updateValGold();
    document.getElementById('xp').textContent = `${state.xp + workshopXp()} XP`;
}

function button(label, action, value = '', style = '') {
    return `<button type="button" class="${style}" data-action="${action}" data-value="${value}">${label}</button>`;
}

const list = (items, tag = 'ul') => `<${tag}>${items.map(item => `<li>${item}</li>`).join('')}</${tag}>`;

function methodPanel(method, open = false) {
    if (!method) return '';
    return `<details class="method-panel" ${open ? 'open' : ''}>
        <summary><span class="method-label">${t('Method')}</span><strong>${method.title}</strong></summary>
        <div class="method-body">
            ${method.symbols ? symbolDefinitions(method.symbols) : ''}
            ${method.formula ? `<p class="method-formula">${method.formula}</p>` : ''}
            <div class="method-grid">
                ${list(method.steps, 'ol')}
                <div class="method-example"><b>${t`Worked example`}</b><p>${method.example}</p></div>
            </div>
            <p class="method-check"><b>${t`Check your reasoning`}</b> ${method.check}</p>
        </div>
    </details>`;
}

function questionMethod(question) {
    const id = questionMethods.get(question.key);
    const guided = question.step === t('Do it together') || question.type === 'formula';
    const firstUse = !session.queue.slice(0, session.cursor).some(earlier => questionMethods.get(earlier.key) === id);
    return methodPanel(methods[id], guided || firstUse);
}

function practiceMistake(question, input) {
    if (question.type === 'number' && input * question.answer < 0 && grade(question, -input)) return 'signs';
    const method = questionMethods.get(question.key);
    if (method === 'reactions' || (method === 'balance' && question.type === 'number')) return 'reactions';
    if (method === 'trig' && question.type === 'choice') return 'trig';
    const vector = practiceVectors[question.key];
    if (question.type === 'number' && vector) {
        const [force, angle, axis] = vector;
        const radians = angle * Math.PI / 180;
        const otherComponent = force * (axis === 'x' ? Math.sin(radians) : Math.cos(radians));
        if (grade({ ...question, answer: Math.abs(otherComponent) }, Math.abs(input))) return 'trig';
    }
}

function focusPage() {
    window.scrollTo(0, 0);
    const title = app.querySelector('h1, h2');
    if (title) {
        title.tabIndex = -1;
        title.focus({ preventScroll: true });
    }
}

function show(html) {
    closeWorkshopRoute();
    app.innerHTML = html;
    focusPage();
}

function learningProgress() {
    const count = unitOrder.filter(workshopFinished).length;
    const total = unitOrder.length;
    const misses = [...questionBank.values()].filter(question => state.miss[question.key]).length;
    const levels = Math.min(6, Math.floor(count * 6 / total));
    return `<aside class="home-sidebar">
        <section class="panel" aria-labelledby="progress-title">
            <h2 id="progress-title">${t`Your study progress`}</h2>
            <div class="building-progress" aria-hidden="true">${Array.from({ length: 6 }, (_, i) =>
                `<span class="${i >= 6 - levels ? 'built' : ''}"></span>`).join('')}</div>
            <p><strong>${count} / ${total}</strong> ${t`workshops complete`}</p>
            <p class="muted">${t`Progress is saved in this browser.`}</p>
            ${button(t`Revisit mistakes${misses ? ` (${misses})` : ''}`, 'weak')}
        </section>
        <section class="panel resources" aria-labelledby="tools-title">
            <h2 id="tools-title">${t`Study references`}</h2>
            ${button(t('Practice questions'), 'practice-menu')}
            ${button(t('Cumulative study guide'), 'sheet-all')}
            ${button(t('Steel profile table'), 'steel')}
        </section>
    </aside>`;
}

function learningTile(i) {
    const total = workshops[i].turns.length;
    const records = workshopProgress.runs[i]?.records;
    const done = Array.isArray(records) ? records.slice(0, total).filter(record => ['correct', 'shown'].includes(record?.status)).length : 0;
    const state = workshopFinished(i) ? 'complete' : Array.isArray(records) ? 'in-progress' : 'not-started';
    const status = {
        complete: ['✓', t('Complete')], 'in-progress': ['◐', t('In progress')], 'not-started': ['○', t('Not started')],
    }[state];
    return `<button type="button" class="unit" data-action="unit" data-value="${i}" data-lesson-state="${state}">
        <span class="num" aria-hidden="true">${unitNumber(i)}</span>
        <span class="details"><span class="unit-name">${units[i].title}</span>
            <span class="unit-status"><span class="unit-badge"><span aria-hidden="true">${status[0]}</span> ${status[1]}</span>
                ${state === 'in-progress' ? `<small>${t`${done} of ${total} steps done`}</small>` : ''}</span>
            ${state === 'in-progress' ? `<span class="unit-meter" aria-hidden="true" style="--steps-done:${done / total * 100}%"></span>` : ''}
        </span>
        <span class="unit-arrow" aria-hidden="true">↗</span></button>`;
}

function home() {
    pageRoute = ['home', ''];
    session = undefined;
    saveProgress();
    const destination = nextWorkshop();
    const resume = Boolean(workshopProgress.runs[destination]?.records?.length && !workshopFinished(destination));
    show(`<div class="hero tutor-home">
        <div class="hero-copy">
            <div class="eyebrow">${t`ARCH 600 · Structures for Architects I`}</div>
            <h1><span class="hero-brand">Dr. FixBoi®’s</span> <span>Structurally</span> <em>Sound</em></h1>
            <p class="hero-tagline">${t`Teaching you things you don't really need to know but here we are.`}</p>
            <div class="home-start">${button(resume ? t('Resume workshop →') : t('Start learning →'), 'unit', destination, 'primary hero-link')}
                ${resume ? `<small>${workshops[destination].title}</small>` : ''}</div>
        </div>
        <figure class="hero-scene">
            ${heroVal()}
        </figure>
    </div>
    <div class="layout">
        <section aria-labelledby="path-title">
            <h2 id="path-title">${t`Learning path`}</h2>
            <div class="course-index">
            ${unitOrder.map(learningTile).join('')}
            ${button(`<span class="num" aria-hidden="true">★</span><span class="details">${t("Practice and exams")}<small>${t("Test your approach on other problems")}</small></span><span class="unit-arrow" aria-hidden="true">↗</span>`, 'final', '', 'unit capstone')}
            </div>
        </section>
        ${learningProgress()}
    </div>`);
    showValModel();
}

function practiceCards(questions, step) {
    return questions.map(question => ({ ...question, step: step ?? question.step ?? t('Practice') }));
}

function practiceMenu() {
    show(`${button(t('‹ Learning path'), 'home')}<section class="lesson">
        <h1>${t`Practice questions`}</h1><p>${t`Choose a topic to try other problems. Worked methods are available beside the questions.`}</p>
        <div class="course-index">${unitOrder.map(i => button(units[i].title, 'practice', i)).join('')}</div>
    </section>`);
}

function startPractice(i) {
    if (!unitQuestions[i]) return;
    const questions = [calculationCards[i], ...guidedQuestions[i], ...(i === 2 ? diagramExercises : []), ...unitQuestions[i]];
    begin(practiceCards(questions), { mode: 'practice', unit: i, title: t`Practice: ${units[i].title}` });
}

function finalMenu() {
    session = undefined;
    show(`${button(t('‹ Learning path'), 'home')}
        <article class="lesson final-menu">
            <div class="sectionmark"><span>${t`Final exam studio`}</span></div>
            <div class="topic-heading">
                <div><h1>${t`Put it all together`}</h1>
                    <p>${t`Review the full course or work through a beam or truss from the first sketch to the final check.`}</p></div>
                <div class="topic-val val-entrance">${valPortrait('guide')}</div>
            </div>
            <div class="studio-grid">
                <section><h2>${t`Guided review`}</h2>
                    ${button(t('Cumulative beam workshop'), 'unit', 9)}
                    ${button(t('Extra beam practice'), 'beam')}
                    ${button(t('Extra truss practice'), 'truss')}</section>
                <section><h2>${t`Independent practice`}</h2>
                    ${button(t('Practice exam A · Beam analysis'), 'exam', 'beam')}
                    ${button(t('Practice exam B · Truss analysis'), 'exam', 'truss')}
                    <small>${t`Answers and worked solutions appear after the last question.`}</small></section>
                <section><h2>${t`Focus your study`}</h2>${button(t('Target weaker topics'), 'weak')}
                    ${button(t('Cumulative study guide'), 'sheet-all')}</section>
            </div>
        </article>`);
}

function startIntegratedPractice(kind) {
    const beam = kind === 'beam';
    begin(practiceCards(beam ? beamPractice : trussPractice), {
        mode: 'practice', title: beam ? t('Integrated beam practice') : t('Integrated truss practice'),
    });
}

function startExam(kind) {
    const variant = kind === 'beam' ? 0 : 1;
    const topics = unitOrder.flatMap(i => {
        const bank = unitQuestions[i];
        const numeric = bank.filter(q => q.type === 'number');
        const concept = bank.filter(q => ['choice', 'match', 'stress', 'fbd'].includes(q.type));
        return [concept[variant % concept.length], numeric[variant % numeric.length]].filter(Boolean);
    });
    const integrated = kind === 'beam' ? beamExam : trussExam;
    begin([...topics, ...integrated], { mode: 'exam', title: t`Practice exam ${variant === 0 ? 'A' : 'B'}` });
}

function weak() {
    const questions = practiceResume ? practiceResume.keys.map(key => questionBank.get(key)).filter(Boolean) :
        [...questionBank.values()].filter(question => state.miss[question.key]);
    if (questions.length) {
        begin(practiceCards(questions, t('Revisit it')), { mode: 'weak', title: t('Revisit mistakes') });
        return;
    }
    show(`<article class="lesson"><h1>${t`Nothing to revisit yet`}</h1><p>${t`Questions you miss will appear here for another try.`}</p>
        ${button(t('Learning path'), 'home')}</article>`);
}

function begin(queue, settings) {
    session = { ...settings, queue, cursor: 0, results: new Map(), screens: new Map(), drafts: new Map() };
    if (practiceResume?.keys.every((key, i) => key === queue[i]?.key) && practiceResume.keys.length === queue.length) {
        session.cursor = Math.max(0, Math.min(practiceResume.cursor, queue.length));
        session.drafts = new Map(practiceResume.drafts);
        session.results = new Map(practiceResume.results.map(([i, result]) => [i, { ...result, question: queue[i] }]));
        session.finished = practiceResume.finished;
    }
    practiceResume = undefined;
    render();
}

function steelTable(rows) {
    return `<div class="table-wrap"><table>
        <caption>${t`Selected CISC wide-flange profiles · major x-axis properties`}</caption>
        <thead><tr><th scope="col">${t('Designation')}</th><th scope="col">${t`Nominal kg/m`}</th>
            <th scope="col">Iₓ (10⁶ mm⁴)</th><th scope="col">Sₓ (10³ mm³)</th></tr></thead>
        <tbody>${rows.map(([name, mass, inertia, modulus]) => `<tr><th scope="row">${name}</th>
            <td>${mass}</td><td>${inertia}</td><td>${modulus}</td></tr>`).join('')}</tbody>
    </table></div>`;
}

function showSteel() {
    show(`${button(t('‹ Learning path'), 'home')}
        <article class="lesson"><h1>${t`Steel profile table`}</h1>
        <p>${t`Read Iₓ for stiffness and Sₓ for elastic bending stress about the major axis. Compare candidates in the listed units, then compare nominal mass.`}</p>
        <p>${t`Example: for Sₓ ≥ 375×10³ mm³ among W200 members, W200×42 is the lightest row that passes.`}</p>
        ${steelTable(steelProfiles)}
        <p class="muted">${t`Selected reference rows for practice. A complete design requires checks for other load effects, stability and serviceability.`}</p>
        ${button(t('Practice member selection'), 'unit', 6, 'primary')}
        </article>`);
}

const demoTable = {
    S: [['A', 350, 20], ['B', 420, 27], ['C', 550, 35]],
    I: [['A', 60, 20], ['B', 85, 27], ['C', 110, 35]],
};

function options(question, multiple = false) {
    const choices = question.type === 'stress' ? ['A', 'B', 'C', 'D'] : question.opts;
    return `<div class="options" role="group" aria-label="${multiple ? t('Select all that apply') : t('Select one answer')}">
        ${choices.map((choice, i) => `<button type="button" class="option" data-choice="${i}"
            aria-pressed="false">${choice}</button>`).join('')}</div>`;
}

function interaction(question) {
    switch (question.type) {
        case 'formula':
            return `<div class="practice-formula">${paperInputs(question)}</div>`;
        case 'number':
            return `<label class="number-answer">${t`Answer ${question.unit ? `(${question.unit})` : ''}`}
                <input id="number-answer" class="study-number" type="text" inputmode="decimal"></label>`;
        case 'graph':
            return graphMarkup(question);
        case 'stress':
            return stressFigure(true) + options(question);
        case 'match': {
            const order = question.pairs.map((_, i) => (i + 1) % question.pairs.length);
            return `<fieldset class="match-fields"><legend>${t`Match each item`}</legend>${question.pairs.map(([label], i) =>
                `<label>${label}<select data-match="${i}"><option value="">${t`Choose an answer`}</option>
                ${order.map(j => `<option value="${j}">${question.pairs[j][1]}</option>`).join('')}
                </select></label>`).join('')}</fieldset>`;
        }
        case 'fbd':
            return `<figure class="practice-drawing"><figcaption>${t('Given structure')}</figcaption>${fbdDrawing(question, null, false)}</figure>
                <figure class="practice-drawing"><figcaption>${t('Your free-body diagram')}</figcaption>
                <div id="fbd-figure">${fbdDrawing(question, [])}</div></figure>
                <p>${t('Select an arrow to add or remove it from the diagram.')}</p>${options(question, true)}`;
        case 'steel':
            return `${steelTable(question.rows)}<label class="profile-answer">${t`Choose a profile`}
                <select id="profile-answer"><option value="">${t`Choose an answer`}</option>
                ${question.opts.map((option, i) => `<option value="${i}">${option}</option>`).join('')}</select></label>`;
        case 'table': {
            const property = question.tableKind === 'S' ? 'S' : 'I';
            return `<table><caption>${t`Illustrative classroom sections`}</caption>
                <thead><tr><th scope="col">${t('Section')}</th><th scope="col">${property === 'S' ? 'Sₓ (10³ mm³)' : 'Iₓ (10⁶ mm⁴)'}</th>
                <th scope="col">kg/m</th></tr></thead><tbody>${demoTable[property].map(row =>
                    `<tr><th scope="row">${row[0]}</th><td>${row[1]}</td><td>${row[2]}</td></tr>`).join('')}</tbody></table>${options(question)}`;
        }
        default:
            return options(question);
    }
}

function render() {
    if (session.cursor >= session.queue.length) {
        finish();
        return;
    }
    const saved = session.screens.get(session.cursor);
    if (saved) {
        answer = saved.answer;
        showGraphAnswer = saved.showGraphAnswer;
        graphDraft = saved.draft.graph;
        app.replaceChildren(saved.screen);
        focusPage();
        return;
    }
    const question = session.queue[session.cursor];
    const exam = session.mode === 'exam';
    const refresher = practiceReview[questionMethods.get(question.key)];
    const position = session.cursor + 1;
    answer = null;
    showGraphAnswer = null;
    graphDraft = null;
    show(`<article class="lesson study study-question">
        <div class="study-top">
            <nav class="study-nav" aria-label="${t`Question navigation`}">
                ${button(t('× Exit'), ['exam', 'final'].includes(session.mode) ? 'final' : 'home')}
                <button type="button" data-action="back" ${position === 1 ? 'disabled' : ''}>${t`‹ Back`}</button>
            </nav>
            <span>${session.title}</span></div>
        <progress aria-label="${t`Session progress`}" value="${session.cursor}" max="${session.queue.length}"></progress>
        <div class="sectionmark"><span>${t`${position} of ${session.queue.length}`}${question.topic ? ` · ${question.topic}` : ''}</span>
            <span>${exam ? t('Practice exam') : question.step || t('Practice')}</span></div>
        <div class="study-heading">
            <h1>${question.prompt}</h1>
            <div class="study-val val-entrance">${valPortrait('guide')}</div>
        </div>
        ${question.setup ? `<p class="question-setup">${question.setup}</p>` : ''}
        ${question.type === 'fbd' || question.type === 'stress' ? '' : practiceDrawingPanel(question)}
        ${exam ? '' : questionMethod(question)}
        ${interaction(question)}
        <div id="feedback" aria-live="polite" tabindex="-1"></div>
        <div class="toolbar">
            ${exam ? '' : button(t('Hint'), 'hint')}
            ${exam || !refresher ? '' : button(t('Quick refresher'), 'refresh', refresher)}
            ${exam ? button(t('Skip question'), 'skip') : ''}
            ${button(exam ? t('Record answer') : question.type === 'formula' ? t('Calculate') : t('Check answer'), 'check', '', 'primary')}
        </div>
    </article>`);
    setAnswer(null);
    const draft = session.drafts.get(session.cursor);
    if (question.type === 'graph') showGraphAnswer = bindGraph(question, setAnswer, {
        draft: draft?.graph,
        onDraft: value => { graphDraft = value; },
    });
    if (question.type === 'formula') {
        const fields = [...app.querySelectorAll('[data-formula-input]')];
        for (const field of fields) {
            field.addEventListener('input', () => {
                field.removeAttribute('aria-invalid');
                const values = fields.map(input => parseStudyNumber(input.value));
                setAnswer(values.every(Number.isFinite) ? values : null);
            });
        }
    }
    if (question.type === 'number') {
        const field = document.getElementById('number-answer');
        field.addEventListener('input', () => {
            setAnswer(parseStudyNumber(field.value));
            updatePracticeForce(app, question, field.value);
        });
    }
    app.querySelectorAll('#number-answer, [data-formula-input]').forEach(field => {
        field.addEventListener('keydown', event => {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            checkAnswer();
        });
    });
    if (question.type === 'steel') {
        const field = document.getElementById('profile-answer');
        field.addEventListener('change', () => setAnswer(field.value === '' ? null : Number(field.value)));
    }
    if (question.type === 'match') {
        const fields = [...app.querySelectorAll('[data-match]')];
        for (const field of fields) field.addEventListener('change', () =>
            setAnswer(fields.every(input => input.value !== '') ? fields.map(input => Number(input.value)) : null));
    }
    if (draft && question.type !== 'graph') restoreStudyDraft(question, draft);
    const recorded = session.results.get(session.cursor);
    if (recorded && !exam) {
        const calculation = question.type === 'formula' ? formulaSubstitution(question, recorded.input) : '';
        renderStudyFeedback(recorded, calculation);
    }
}

function studyDraft() {
    const fields = [...app.querySelectorAll('input, select')].map(field => {
        const number = field instanceof HTMLInputElement ? parseStudyNumber(field.value) : NaN;
        return { text: field.value, number: Number.isFinite(number) ? number : null };
    });
    return { fields, answer, graph: graphDraft };
}

function restoreStudyDraft(question, draft) {
    if (['choice', 'stress', 'table', 'fbd'].includes(question.type)) {
        if (Array.isArray(draft.answer)) draft.answer.forEach(choose);
        else if (Number.isInteger(draft.answer)) choose(draft.answer);
        return;
    }
    app.querySelectorAll('input, select').forEach((field, i) => {
        const saved = draft.fields[i];
        if (!saved) return;
        field.value = saved.number === null ? saved.text : studyInputText(saved.number);
        field.dispatchEvent(new Event(field instanceof HTMLSelectElement ? 'change' : 'input'));
    });
}

function setAnswer(value) {
    answer = value;
    const check = app.querySelector('[data-action="check"]');
    if (check) check.disabled = value == null || (typeof value === 'number' && !Number.isFinite(value));
}

function choose(index) {
    if (!app.querySelector('[data-action="check"]')) return;
    const question = session.queue[session.cursor];
    const multi = question.type === 'fbd';
    let picked = [index];
    if (multi && Array.isArray(answer)) {
        picked = answer.includes(index) ? answer.filter(value => value !== index) : [...answer, index];
    }
    app.querySelectorAll('[data-choice]').forEach(element =>
        element.setAttribute('aria-pressed', String(picked.includes(Number(element.dataset.choice)))));
    app.querySelectorAll('[data-point]').forEach(element =>
        element.classList.toggle('selected-point', Number(element.dataset.point) === index));
    if (multi) document.getElementById('fbd-figure').innerHTML = fbdDrawing(question, picked);
    setAnswer(multi ? (picked.length ? picked : null) : index);
}

function grade(question, input) {
    if (question.type === 'number') {
        return Number.isFinite(input) && Math.abs(input - question.answer) <= Math.max(0.000005, Math.abs(question.answer) * .005);
    }
    if (question.type === 'fbd') {
        return sameForces(question.answer, input);
    }
    if (question.type === 'match') {
        return question.answer.every((value, i) => input[i] === value);
    }
    if (question.type === 'graph') {
        return !firstGraphError(question, input);
    }
    return input === question.answer;
}

function moveSlide(offset) {
    if (session.cursor + offset < 0) return;
    // Keep the slide's fields and diagram listeners together when revisiting it.
    session.screens.set(session.cursor, { screen: app.firstElementChild, answer, showGraphAnswer, draft: studyDraft() });
    session.cursor += offset;
    render();
}

function next() {
    moveSlide(1);
}

function recordProgress(question, correct) {
    if (correct) {
        state.xp += 10;
        delete state.miss[question.key];
    } else if (questionBank.has(question.key)) {
        state.miss[question.key] = true;
    }
}

function formulaResult(question, values) {
    const fields = [...app.querySelectorAll('[data-formula-input]')];
    const invalid = fields.filter((field, i) => {
        const wrong = values[i] !== question.inputs[i][3];
        field.setAttribute('aria-invalid', String(wrong));
        return wrong;
    });
    if (invalid.length) {
        document.getElementById('feedback').innerHTML =
            `<div class="feedback bad"><div class="feedback-val val-pop">${valPortrait('think')}</div>
                <p>${t`Check the highlighted values against the problem and the units beside each field.`}</p></div>`;
        invalid[0].focus();
        return null;
    }

    return formulaSubstitution(question, values);
}

function formulaSubstitution(question, values) {
    return `<div class="formula-result lesson-paper-work">${workedCalculation(question, values)}</div>`;
}

function practiceAnswerText(question, answer) {
    if (question.type === 'number') return `${numberText(answer)}${question.unit ? ` ${question.unit}` : ''}`;
    if (question.type === 'stress') return 'ABCD'[answer];
    if (question.type === 'fbd') return answer.map(i => question.opts[i]).join(' · ');
    if (question.type === 'match') return answer.map((choice, i) => `${question.pairs[i][0]} → ${question.pairs[choice][1]}`).join(' · ');
    return question.opts?.[answer];
}

function practiceAnswerReview(result) {
    const { question, input, correct } = result;
    const expected = practiceAnswerText(question, question.answer);
    if (!expected) return '';
    const submitted = !correct && input != null ? practiceAnswerText(question, input) : '';
    return `<dl class="practice-answers">
        ${submitted ? `<div><dt>${t('Your answer')}</dt><dd>${escapeTutor(submitted)}</dd></div>` : ''}
        <div><dt>${t('Correct answer')}</dt><dd>${escapeTutor(expected)}</dd></div>
    </dl>`;
}

function checkAnswer(skipped = false) {
    const check = app.querySelector('[data-action="check"]');
    if (!check || (!skipped && check.disabled)) return;

    const question = session.queue[session.cursor];
    const calculation = question.type === 'formula' ? formulaResult(question, answer) : '';
    if (calculation === null) return;
    const correct = !skipped && (question.type === 'formula' || grade(question, answer));
    const result = { question, correct, skipped, input: answer };
    session.results.set(session.cursor, result);
    if (session.mode === 'exam') {
        next();
        return;
    }
    recordProgress(question, correct);
    saveProgress();
    if (!correct && !skipped) {
        noticeMistake(result, practiceMistake(question, answer));
        saveWorkshops();
    }
    renderStudyFeedback(result, calculation);
}

function renderStudyFeedback(result, calculation) {
    const { question, correct } = result;
    const method = app.querySelector('.method-panel');
    if (!correct && method) method.open = true;

    const count = session.results.size;
    let message = correct ? t('You can use this approach on similar problems.') : valLines[(count - 1) % valLines.length];
    if (!correct && count % 5 === 0) {
        const [story, source] = stories[(count / 5 - 1) % stories.length];
        message = `${story} <a href="${source}" target="_blank" rel="noopener noreferrer">${t`Case study`}</a>`;
    }
    const feedback = document.getElementById('feedback');
    feedback.innerHTML = `${calculation}<div class="feedback ${correct ? '' : 'bad'}">
        <div class="feedback-val val-pop">${valPortrait(correct ? 'cheer' : 'think')}</div>
        <div><p><strong>${correct ? t('Structurally sound!') : t('Here’s how to work it out')}</strong></p>
        ${practiceAnswerReview(result)}${question.work ? list(question.work, 'ol') : ''}
        <p>${question.explain}</p><small>${message}</small></div></div>${practiceDrawingPanel(question, true)}${refresherOffer(result.suggested, 'data-action')}`;
    if (showGraphAnswer) {
        showGraphAnswer();
        feedback.insertAdjacentHTML('beforeend', graphSolution(question, false));
    }
    app.querySelectorAll('input, select, .option, [data-action="hint"]').forEach(element => { element.disabled = true; });
    const check = app.querySelector('[data-action="check"]');
    check.disabled = false;
    check.dataset.action = 'next';
    check.textContent = t('Continue');
    feedback.focus();
}

function studySheetContent(i) {
    const plan = lessonPlans[i];
    const ids = new Set([calculationCards[i], ...guidedQuestions[i], ...unitQuestions[i]]
        .map(question => questionMethods.get(question.key)));
    return `<section class="sheet-topic"><h2>${units[i].title}</h2>
        <p class="formula">${plan.sheet}</p>
        ${figureFor({ b: plan.beam, fig: plan.figure })}
        <h3>${t`Calculation sequence`}</h3>${list(plan.quick, 'ol')}
        <h3>${t`Check before you submit`}</h3>${list(plan.pitfalls)}
        <details class="study-methods"><summary>${t`Worked methods for this topic`}</summary>
            ${[...ids].map(id => methodPanel(methods[id])).join('')}
        </details>
    </section>`;
}

function sheet(i) {
    const all = i == null;
    show(`${button('‹ ' + (all ? t('Final exam studio') : t('Back to topic')), all ? 'final' : 'unit', i ?? '')}
        <article class="lesson study-sheet">
            <h1>${all ? t('Cumulative study guide') : t('Handwritten study sheet')}</h1>
            <p>${t`Prioritize the formulas and one small reference sketch per topic. Check your assessment’s permitted sheet size.`}</p>
            ${button(t('Print reference'), 'print')}${(all ? unitOrder : [i]).map(studySheetContent).join('')}
        </article>`);
}

function finish() {
    const { mode, title, unit } = session;
    const results = [...session.results.values()];
    const correct = results.filter(result => result.correct).length;
    if (mode === 'exam' && !session.finished) results.forEach(result => recordProgress(result.question, result.correct));
    session.finished = true;
    saveProgress();
    const skipped = results.filter(result => result.skipped).length;
    session.screens.clear();
    show(`<article class="lesson result">
        <div class="result-val val-pop">${valPortrait('cheer')}</div>
        <h1>${t`${title} complete`}</h1>
        <p>${t`${correct} of ${results.length} correct · ${correct * 10} XP earned${skipped ? t` · ${skipped} skipped` : ''}`}</p>
        ${mode === 'exam' ? `<section class="exam-solutions"><h2>${t`Worked solutions`}</h2>
            ${results.map(result => { const { question, correct, skipped } = result; return `<details>
                <summary>${correct ? '✓' : skipped ? t('Skipped') : '↻'} · ${question.prompt}</summary>
                ${question.setup ? `<p>${question.setup}</p>` : ''}${practiceAnswerReview(result)}
                ${practiceDrawingPanel(question, true)}
                ${question.work ? list(question.work, 'ol') : ''}
                <p>${question.explain}</p>${question.type === 'graph' ? graphSolution(question) : ''}
                ${methodPanel(methods[questionMethods.get(question.key)])}
                </details>`; }).join('')}</section>` : ''}
        <div class="toolbar">${button(t('Learning path'), 'home')}${button(t('Revisit mistakes'), 'weak')}
            ${button(unit == null ? t('Cumulative study guide') : t('Study sheet'),
                unit == null ? 'sheet-all' : 'sheet', unit ?? '', 'primary')}</div>
    </article>`);
}

const actions = {
    home, unit: value => openWorkshop(Number(value)),
    practice: value => startPractice(Number(value)), 'practice-menu': practiceMenu,
    final: finalMenu, beam: () => startIntegratedPractice('beam'), truss: () => startIntegratedPractice('truss'), exam: startExam,
    weak, steel: showSteel, sheet: value => sheet(Number(value)), 'sheet-all': () => sheet(), refresh: openRefresher,
    restraint: key => {
        const comparison = app.querySelector('.buckling-comparison');
        if (!comparison || !Object.hasOwn(bucklingCases, key)) return;
        comparison.querySelectorAll('.restraint-card').forEach(card =>
            card.setAttribute('aria-pressed', String(card.dataset.value === key)));
        comparison.querySelector('.restraint-detail').innerHTML = restraintComparison(key);
    },
    hint: () => {
        const question = session.queue[session.cursor];
        const hint = question.hint || methods[questionMethods.get(question.key)]?.steps[0];
        const feedback = document.getElementById('feedback');
        feedback.innerHTML =
            `<div class="feedback"><div class="feedback-val val-pop">${valPortrait('think')}</div>
                <p>${hint || t('Sketch the load, label units, and identify the equation that governs the result.')}</p></div>`;
        feedback.focus();
    },
    check: () => checkAnswer(), skip: () => checkAnswer(true), next, back: () => moveSlide(-1), print: () => window.print(),
};

document.getElementById('home').addEventListener('click', home);
app.addEventListener('click', event => {
    const control = event.target.closest('[data-action], [data-choice], [data-point]');
    if (!control) return;
    if (control.dataset.action) {
        if (languageRoutes.has(control.dataset.action)) pageRoute = [control.dataset.action, control.dataset.value];
        actions[control.dataset.action]?.(control.dataset.value);
    } else {
        choose(Number(control.dataset.choice ?? control.dataset.point));
    }
});

function changeLanguage(language) {
    if (language === locale || !Object.hasOwn(languages, language)) return;
    try {
        localStorage.setItem(languageKey, language);
    } catch {
        // The URL still carries the selection when local storage is unavailable.
    }
    try {
        let practice = null;
        if (session && app.querySelector('.study-question, .result')) {
            const drafts = new Map(session.drafts);
            for (const [i, screen] of session.screens) drafts.set(i, screen.draft);
            if (!session.finished) drafts.set(session.cursor, studyDraft());
            const results = [...session.results].map(([i, { question, ...result }]) => [i, result]);
            practice = { cursor: session.cursor, keys: session.queue.map(question => question.key),
                drafts: [...drafts], results, finished: Boolean(session.finished) };
        }
        sessionStorage.setItem(languageResumeKey, JSON.stringify({ route: pageRoute, practice }));
    } catch {
        // Workshop progress remains available through the existing workshop link.
    }
    const url = new URL(location.href);
    url.searchParams.set('lang', language);
    location.replace(url);
}

function resumeLanguageRoute() {
    let saved;
    try {
        saved = JSON.parse(sessionStorage.getItem(languageResumeKey));
        sessionStorage.removeItem(languageResumeKey);
    } catch {
        return false;
    }
    if (!saved || !languageRoutes.has(saved.route?.[0])) return false;
    pageRoute = saved.route;
    practiceResume = saved.practice;
    actions[pageRoute[0]](pageRoute[1]);
    return true;
}

const languageSelect = document.getElementById('language');
languageSelect.setAttribute('aria-label', t('Language'));
languageSelect.value = locale;
languageSelect.addEventListener('change', () => changeLanguage(languageSelect.value));
document.getElementById('home').textContent = t('Home');
document.querySelector('meta[name="description"]').content = t("Teaching you things you don't really need to know but here we are.");
saveProgress();
const linkedWorkshop = /^#workshop-(\d+)$/.exec(location.hash);
if (linkedWorkshop && workshops[Number(linkedWorkshop[1])]) {
    try { sessionStorage.removeItem(languageResumeKey); } catch { /* Storage may be unavailable. */ }
    openWorkshop(Number(linkedWorkshop[1]));
} else if (!resumeLanguageRoute()) home();

window.addEventListener('hashchange', () => {
    const match = /^#workshop-(\d+)$/.exec(location.hash);
    if (match && workshops[Number(match[1])]) openWorkshop(Number(match[1]));
    else if (activeWorkshop !== null) home();
});
