const workshopStorageKey = 'structural-workshops-v1';

function readWorkshops() {
    try {
        const saved = JSON.parse(localStorage.getItem(workshopStorageKey));
        if (saved?.runs && typeof saved.runs === 'object' && !Array.isArray(saved.runs)) {
            return { runs: saved.runs, archives: saved.archives || {}, recent: saved.recent, signals: saved.signals || {}, beamPractice: saved.beamPractice };
        }
    } catch {
        // A workshop can still run when browser storage is unavailable.
    }
    return { runs: {}, archives: {}, recent: null, signals: {} };
}

const workshopProgress = readWorkshops();
let activeWorkshop = null;
let archiveAttempt = null;

function saveWorkshops() {
    updateValGold();
    try {
        localStorage.setItem(workshopStorageKey, JSON.stringify(workshopProgress));
    } catch {
        // Keep working with the current session in memory.
    }
}

function workshopRun(i) {
    const saved = workshopProgress.runs[i];
    if (i === 6 && !saved?.finished && !saved?.sectionRevision) {
        const attempt = attemptNumber(saved);
        const records = [];
        workshopVersion(i, attempt).turns.forEach((turn, index) => {
            if (turn.legacy === undefined) return;
            const record = saved?.records?.[turn.legacy];
            if (record?.status || record?.draft) records[index] = record;
        });
        const previous = Array.isArray(saved?.records) ? saved.records : [];
        const priorCorrect = previous.filter(record => record?.status === 'correct').length -
            records.filter(record => record?.status === 'correct').length;
        const sectionProgressFloor = previous.length ? previous.filter(record => record?.status).length /
            workshopVersion(i, attempt, { finished: true }).turns.length : 0;
        return workshopProgress.runs[i] = { cursor: 0, records, attempt, sectionRevision: true, sectionVisual: true, priorCorrect, sectionProgressFloor };
    }
    if (i === 6 && saved?.sectionRevision && !saved.sectionVisual && !saved.finished && Array.isArray(saved.records)) {
        const updated = workshopVersion(i, attemptNumber(saved));
        const bridge = updated.turns.findIndex(turn => turn.section?.concept);
        let previous = 0;
        const records = updated.turns.map(turn => turn.section?.concept ? undefined : saved.records[previous++]);
        const progress = saved.records.filter(record => record?.status).length / sectionLessonVersion(attemptNumber(saved), false).turns.length;
        const sectionProgressFloor = Math.max(saved.sectionProgressFloor ?? 0, progress);
        return workshopProgress.runs[i] = { ...saved, records, cursor: Math.min(saved.cursor, bridge), sectionVisual: true, sectionProgressFloor };
    }
    if (saved && Array.isArray(saved.records) && Number.isInteger(saved.cursor) &&
        saved.cursor >= 0 && saved.cursor <= workshopVersion(i, attemptNumber(saved), saved).turns.length) return saved;
    return workshopProgress.runs[i] = { cursor: 0, records: [] };
}

const attemptNumber = run => run?.attempt || 1;
const archivedRuns = i => Array.isArray(workshopProgress.archives[i]) ? workshopProgress.archives[i] : [];

function workshopFinished(i) {
    const run = workshopProgress.runs[i];
    return Boolean(run?.finished && run.records?.[workshopVersion(i, attemptNumber(run), run).turns.length - 1]?.status);
}

function workshopStars(i) {
    return archivedRuns(i).length + Number(workshopFinished(i));
}

function totalStars() {
    return [...workshops.keys(), ...Object.keys(beamLabTitles), ...Object.keys(trussWorkshopTitles)].reduce((sum, i) => sum + workshopStars(i), 0);
}

function workshopXp() {
    const runs = [...workshops.keys(), ...Object.keys(beamLabTitles), ...Object.keys(trussWorkshopTitles)].flatMap(i => [...archivedRuns(i), workshopProgress.runs[i]]);
    return runs.reduce((sum, run) => sum +
        (Array.isArray(run?.records) ? (run.records.filter(record => record?.status === 'correct').length + (run.priorCorrect ?? 0)) * 10 : 0), 0);
}

function nextWorkshop() {
    const recent = workshopProgress.recent;
    if ((workshops[recent] || Object.hasOwn(beamLabTitles, recent) || Object.hasOwn(trussWorkshopTitles, recent)) && !workshopFinished(recent)) return recent;
    return unitOrder.find(i => !workshopStars(i)) ?? unitOrder[0];
}

const escapeTutor = value => String(value ?? '').replace(/[&<>"']/g, character =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);

function judgeTurn(turn, input) {
    if (turn.type === 'fbd') {
        const correct = sameForces(turn.answer, input);
        return { correct, answer: t('My free-body diagram'), message: correct ? turn.solution : turn.hint };
    }
    if (turn.type === 'pick') {
        const choice = turn.choices.find(([value]) => value === input);
        if (!choice) return null;
        const correct = turn.correct.includes(input);
        return { correct, message: choice[2] || (correct ? turn.solution : t('Take another look at the drawing and the condition Val described.')),
            skill: correct ? undefined : turn.skill, answer: choice[1] };
    }
    if (turn.type === 'sketch') {
        const error = firstGraphError(turn, input);
        if (!error) return { correct: true, answer: t('My sketch'), message: turn.solution };
        if (error.station !== undefined) {
            const i = error.station;
            const signError = turn.answer[i] * input.values[i] < 0 && Math.abs(turn.answer[i] + input.values[i]) < .051;
            const advice = signError ? t('The height has the right size. Check which side of zero the sign calls for.') : turn.kind === 'M' ?
                t('Start with the previous moment and add the signed shear area over this interval.') :
                t('Start with the previous shear. Add any force jump and subtract the accumulated downward load.');
            return { correct: false, answer: t('My sketch'), skill: signError ? 'signs' : undefined,
                message: t`Let’s revisit ${stationLabel(turn.stations, i)}. ${advice}` };
        }
        const i = error.segment;
        return { correct: false, answer: t('My sketch'), message: t`Your points check out. Look at the segment from ${numberText(turn.stations[i].x)} to ${numberText(turn.stations[i + 1].x)} m. Constant shear gives a straight segment. Changing shear gives a curve. Check which way the shear slopes.` };
    }
    const value = typeof input === 'number' ? input : parseStudyNumber(input);
    if (!Number.isFinite(value)) return null;
    const tolerance = turn.tolerance ?? Math.max(.025, Math.abs(turn.expected) * .004);
    const correct = Math.abs(value - turn.expected) <= tolerance;
    const reversed = !correct && value * turn.expected < 0 && Math.abs(-value - turn.expected) <= tolerance;
    const known = turn.wrong?.find(([candidate]) => Math.abs(candidate - value) <= Math.max(.00002, Math.abs(candidate) * .005));
    return {
        correct, skill: correct ? undefined : reversed ? 'signs' : known?.[2] || turn.skill,
        answer: `${studyInputText(value).replace(/^-/, '−')}${turn.unit ? ' ' + turn.unit : ''}`,
        message: correct ? turn.solution : known?.[1] || (reversed
            ? t('Your magnitude is right. Check which direction you called positive and which way this term acts.')
            : (turn.section && turn.hint) || t('Try that again. Keep the givens and their units beside your equation, and follow the steps one at a time.')),
    };
}

function noticeMistake(record, skill) {
    if (!refreshers[skill]) return;
    record.skills ||= [];
    if (record.skills.includes(skill)) return;
    record.skills.push(skill);
    const hits = Number(workshopProgress.signals[skill]) || 0;
    if (hits + 1 >= 2) {
        record.suggested = skill;
        workshopProgress.signals[skill] = 0;
    } else {
        workshopProgress.signals[skill] = hits + 1;
    }
}

function valNote(content, pose = 'guide', label = 'Val') {
    return `<div class="tutor-note"><div class="tutor-portrait">${valPortrait(pose)}</div>
        <div class="tutor-speech"><b class="tutor-speaker">${label}</b>${content}</div></div>`;
}

function localizedFeedback(turn, record) {
    if (!record?.feedback) return null;
    if (record.status === 'shown') return { message: turn.solution };
    let input = record.submitted;
    if (input === undefined) {
        if (turn.type === 'pick') input = record.lastChoice;
        else if (turn.type === 'sketch' || turn.type === 'fbd') input = record.draft;
        else input = parseStudyNumber(record.feedback.answer?.split(' ')[0] || '', 'en');
    }
    if (input == null) return record.feedback;
    return judgeTurn(turn, input) || record.feedback;
}

function tutorFeedback(turn, record) {
    const feedback = localizedFeedback(turn, record);
    if (!feedback) return '';
    const { answer, message, correct } = feedback;
    const soft = record.status === 'shown' ? t('Let’s work it out') : correct ? t('That’s right') : t('Not quite yet');
    return `${answer ? `<div class="tutor-reply"><b>${t('You')}</b><span>${escapeTutor(answer)}</span></div>` : ''}
        <div class="tutor-feedback ${correct || record.status === 'shown' ? '' : 'tutor-retry'}" tabindex="-1">
            ${valNote(`<strong>${soft}</strong><p>${escapeTutor(message)}</p>`, correct ? 'cheer' : 'think')}
        </div>${refresherOffer(record.suggested)}`;
}

function refresherOffer(skill, action = 'data-tutor') {
    const offer = refreshers[skill];
    if (!offer) return '';
    const copy = {
        signs: t('You’ve found the right magnitude twice. Want to practice which direction gets the minus sign?'),
        reactions: t('The reactions have been tricky. We can practice choosing a pivot and solving the two equations before coming back.'),
        trig: t('The angle has caught you twice. A quick look at the triangle can help.'),
        'zero-shear': t('Let’s look at where the shear line hits zero and how that gives us the triangle’s base.'),
    };
    return `<aside class="refresher-offer"><p>${copy[skill]}</p>
        <button type="button" ${action}="refresh" data-value="${skill}">${t`Try ${offer.title.toLowerCase()}`}</button></aside>`;
}

function lessonStepRecord(workshop, run, i) {
    const turn = workshop.turns[i];
    const feedback = localizedFeedback(turn, run.records[i]);
    return `<section class="lesson-record" data-lesson-step="${i}" tabindex="-1">
        <div class="lesson-record-copy"><p class="tutor-step">${t`Step ${i + 1} of ${workshop.turns.length}`}</p>
        ${turn.stage ? `<p class="beam-lab-phase">${beamLabStages[turn.stage - 1]}</p>` : ''}
        <h3>${turn.prompt}</h3><p>${turn.intro}</p>
        ${algebraWalkthrough(turn, run.records[i], true)}${recordedCalculation(turn, run.records[i])}
        ${feedback?.answer ? `<p class="lesson-answer">${escapeTutor(feedback.answer)}</p>` : ''}
        <p>${escapeTutor(feedback?.message || turn.solution)}</p>
        ${turn.units ? `<p class="tutor-units"><b>${t('Follow the units')}</b> ${turn.units}</p>` : ''}</div>
        <figure class="lesson-record-figure">${tutorDrawing(workshop, run, i, false, false)}
            ${turn.type === 'sketch' ? graphSolution(turn) : ''}</figure>
    </section>`;
}

function tutorHistory(workshop, run) {
    return `<div class="tutor-history">${workshop.turns.slice(0, run.cursor).map((_, i) => lessonStepRecord(workshop, run, i)).join('')}</div>`;
}

function tutorDrawing(workshop, run, i, interactive, current) {
    const turn = workshop.turns[i];
    const record = run.records[i];
    const drawing = progressiveLessonDrawing(workshop, run, i);
    const hotspots = interactive ? (turn.hot || []).map(key => {
        const point = drawing.points[key];
        const choice = turn.choices.find(([value]) => value === key);
        return point && choice ? `<button class="tutor-hotspot" type="button" data-tutor="pick" data-value="${key}"
            aria-label="${escapeTutor(choice[1])}" title="${escapeTutor(choice[1])}" style="--point-x:${point[0]}%;--point-y:${point[1]}%">
            <span aria-hidden="true">${key.length === 1 ? key : '＋'}</span></button>` : '';
    }).join('') : '';
    const choice = record?.status === 'shown' ? turn.correct?.[0] : record?.lastChoice;
    const picked = record?.status && turn.hot?.includes(choice) ? drawing.points[choice] : null;
    const marker = picked ? `<span class="lesson-point-mark" style="--point-x:${picked[0]}%;--point-y:${picked[1]}%" aria-hidden="true">✓</span>` : '';
    let pastSketch = null;
    if (current && workshop.repeat && turn.type === 'sketch' && turn.kind === 'M') {
        pastSketch = workshop.turns.slice(0, i).findLast((previous, j) => previous.type === 'sketch' && previous.kind === 'V' && run.records[j]?.status);
    } else if (current && !turn.taDrawing && !turn.shearSegment && (workshop.index === 4 || workshop === workshops[4])) {
        const from = i > 9 ? 10 : 3;
        pastSketch = workshop.turns.slice(from, i).findLast((previous, j) => previous.type === 'sketch' && run.records[from + j]?.status);
    }
    return `<div class="${current ? 'tutor-drawing' : 'lesson-record-drawing'}">
        <div class="tutor-drawing-title"><span>${drawing.title ?? (turn.drawing ? t('Drawing') : workshop.drawing.caption)}</span>${hotspots ? `<span>${t("Tap a point")}</span>` : ''}</div>
        ${turn.type === 'fbd' && !record?.status ? `<figure class="lesson-given"><figcaption>${t('Given structure')}</figcaption>${fbdDrawing(turn, null, false)}</figure>` : ''}
        <div class="tutor-drawing-frame" ${current ? 'data-lesson-live' : ''}>${drawing.markup}${hotspots}${marker}</div>
        ${current || turn.section || turn.trussQuiz || turn.taDrawing ? drawing.tools || '' : ''}
        ${drawing.label ? `<p>${drawing.label}</p>` : ''}
        ${workshop.sectionLesson ? '' : lessonValues(workshop, run, i, current)}
        ${(current || turn.taDrawing) && (drawing.progress || pastSketch) ? `<details class="lesson-drawing-progress" open><summary>${t('Drawing so far')}</summary>
            ${drawing.progress || graphSolution(pastSketch)}</details>` : ''}
    </div>`;
}

function tutorInputs(workshop, i, record, isRefresher) {
    const turn = workshop.turns[i];
    if (record.status) {
        return turn.type === 'sketch' ? `<div class="tutor-solution-plot">${graphSolution(turn)}</div>` : '';
    }
    if (turn.type === 'pick') {
        return `<div class="tutor-choices" aria-label="${t`Answer choices`}" role="group">
            ${turn.choices.map(([id, name]) => `<button type="button" data-tutor="pick" data-value="${id}"
                ${record.lastChoice === id ? 'class="previous-choice"' : ''}>${name}</button>`).join('')}
        </div>`;
    }
    if (turn.type === 'fbd') return `<fieldset class="lesson-fbd-options"><legend>${t('Build the free-body diagram')}</legend>
        ${turn.opts.map((option, i) => `<button data-tutor="fbd-option" data-value="${i}" type="button"
            aria-pressed="${record.draft?.includes(i) || false}">${option}</button>`).join('')}
        <button class="primary" data-tutor="check-fbd" type="button" ${record.draft?.length ? '' : 'disabled'}>${t('Check my sketch')}</button>
    </fieldset>`;
    if (turn.type === 'sketch') return `<div class="tutor-sketch">${graphMarkup(turn)}</div>
        <button class="primary" type="button" data-tutor="check-sketch" disabled>${t`Check my sketch`}</button>`;
    const fieldId = isRefresher ? 'refresher-answer' : 'workshop-answer';
    const calculator = turn.calculation ? guidedCalculation(turn.calculation) : '';
    const direction = miniForce(workshop, i, diagramDraft(record.draft, record.draftLocale));
    return `${calculator}<form class="tutor-number-form">
        ${direction ? `<svg class="lesson-mini-force" data-lesson-mini viewBox="0 0 185 96" aria-hidden="true">${direction}</svg>` : ''}
        <div class="tutor-answer-field">
            <label for="${fieldId}">${turn.unit ? t`Answer in ${turn.unit}` : t('Answer')}</label>
            <div><input name="tutor-answer" type="text" inputmode="decimal" autocomplete="off"
                id="${fieldId}" value="${escapeTutor(localizeDraft(record.draft, record.draftLocale))}">
                <button type="button" data-tutor="sign" aria-label="${t`Toggle minus sign`}">±</button></div>
        </div>
        <button class="primary" type="submit">${t`Check`}</button>
        <p class="tutor-input-error" role="status"></p>
    </form>`;
}

function localizeDraft(value, from = 'en') {
    if (typeof value !== 'string') return '';
    const number = parseStudyNumber(value, from);
    return from !== locale && Number.isFinite(number) ? studyInputText(number) : value;
}

function refresherLinks(ids) {
    return `<div class="tutor-refresh-links">${ids.filter(id => refreshers[id]).map(id =>
        `<button type="button" data-tutor="refresh" data-value="${id}">${refreshers[id].title} ↗</button>`).join('')}</div>`;
}

function tutorTurn(workshop, run, isRefresher) {
    const turn = workshop.turns[run.cursor];
    const record = run.records[run.cursor] ||= {};
    const refs = [...new Set([...(turn.refs || []), ...(workshop.refs || [])])];
    return `<div class="tutor-board" data-active-step="${run.cursor}">
        ${tutorDrawing(workshop, run, run.cursor, !record.status, true)}
        <section class="tutor-thread" aria-label="${t`Conversation with Val`}">
            <div class="tutor-active">
                <p class="tutor-step">${t`Step ${run.cursor + 1} of ${workshop.turns.length}`}</p>
                ${turn.stage ? `<p class="beam-lab-phase">${t`Part ${turn.stage} of ${beamLabStages.length}`} · ${beamLabStages[turn.stage - 1]}</p>` : ''}
                ${valNote(`<p>${turn.intro}</p>`)}
                <section class="tutor-problem" aria-labelledby="${isRefresher ? 'refresher-question' : 'workshop-question'}">
                    <p class="tutor-question-label">${t('Your question')}</p>
                    <h2 id="${isRefresher ? 'refresher-question' : 'workshop-question'}" class="tutor-prompt" tabindex="-1">${turn.prompt}</h2>
                    ${turn.units ? `<p class="tutor-units"><b>${t`Follow the units`}</b> ${turn.units}</p>` : ''}
                    ${algebraWalkthrough(turn, record, Boolean(record.status))}
                    ${tutorInputs(workshop, run.cursor, record, isRefresher)}
                    ${tutorFeedback(turn, record)}
                    ${record.status ? recordedCalculation(turn, record) : ''}
                </section>
                <div class="tutor-controls">
                    ${run.cursor > 0 ? `<button type="button" data-tutor="back">${t("‹ Previous step")}</button>` : ''}
                    ${record.status ? `<button type="button" class="primary" data-tutor="next">${run.cursor + 1 === workshop.turns.length ? t('Finish') : t('Continue')} →</button>` :
                        `<details class="tutor-help"><summary>${t`Help with this step`}</summary>${turn.hint ? `<p>${turn.hint}</p>` : ''}
                            <button type="button" data-tutor="reveal">${t`Show me how`}</button></details>`}
                </div>
                ${!isRefresher && refs.length ? `<aside class="tutor-refresh"><h3>${t`Need a refresher?`}</h3>${refresherLinks(refs)}</aside>` : ''}
            </div>
        </section>
    </div>`;
}

function renderTutor(index, focus = 'title') {
    const current = workshopRun(index);
    const previous = archivedRuns(index);
    const reviewing = archiveAttempt !== null;
    const run = reviewing ? previous.find(attempt => attemptNumber(attempt) === archiveAttempt) : current;
    const attempt = attemptNumber(run);
    const workshop = workshopVersion(index, attempt, run);
    const complete = run.cursor === workshop.turns.length;
    const expanded = workshop.turns.length < workshopVersion(index, attempt).turns.length;
    const redoLabel = expanded ? t('Start the expanded lesson') : t('Redo with new problems');
    const topic = workshop.beam ? 4 : workshop.topic ?? index;
    const title = units[topic].title;
    const following = unitOrder[unitOrder.indexOf(topic) + 1];
    app.innerHTML = `<section class="tutor-session">
        <div class="tutor-session-heading">
            <div>${topic !== index ? button(`‹ ${title}`, 'unit', topic) : button(t('‹ Learning path'), 'home')}<p class="eyebrow">ARCH 600 · ${title}</p>
                <h1 tabindex="-1">${workshop.title}</h1></div>
            ${workshopStars(index) ? `<div class="tutor-attempts">
                <span class="earned-stars">${starCount(workshopStars(index))}</span>
                <p>${t`Attempt ${attempt}`}</p>
                ${reviewing ? button(t('Current attempt'), 'unit', index) : complete ? button(redoLabel, 'redo-workshop', index, 'primary') : ''}
                ${index === 4 && complete ? button(refreshers['zero-shear'].title, 'refresh', 'zero-shear') : ''}
                ${previous.length ? `<details class="tutor-attempt-list"><summary>${t('Past attempts')}</summary>
                    ${previous.slice().reverse().map(saved => {
                        const number = attemptNumber(saved);
                        return number === attempt && reviewing ? `<strong>${t`Attempt ${number}`}</strong>` :
                            button(t`Review attempt ${number}`, 'review-workshop', `${index}/${number}`);
                    }).join('')}</details>` : ''}
            </div>` : ''}
            <progress value="${run.cursor}" max="${workshop.turns.length}" aria-label="${t`Workshop steps complete`}"></progress>
        </div>
        ${index === 4 || workshop.beam ? beamLabNavigation(index) : ''}
        ${topic === 8 ? `<nav class="beam-lab-nav" aria-label="${t('Truss analysis')}">
            ${Object.entries(trussWorkshopTitles).map(([key, name]) =>
                index === key ? `<span aria-current="page">${name}</span>` : `<a href="#workshop-${key}">${name}</a>`).join('')}
            ${button(trussTaPracticeTitle, 'quiz-truss-practice', 'vertical')}${button(trussPracticeTitle, 'quiz-truss-practice')}
        </nav>` : ''}
        ${tutorHistory(workshop, run)}
        ${complete ? `<article class="tutor-finish" tabindex="-1"><div class="tutor-celebrate val-pop">${valPortrait('cheer')}</div>
            <h2>${reviewing ? t`Reviewing attempt ${attempt}` : t('Workshop complete')}</h2>
            ${reviewing ? '' : `<p class="attempt-reward"><span aria-hidden="true">★</span> ${t('You earned a star for Val!')}</p>`}<p>${workshop.outcome}</p>
            <div class="toolbar"><button data-tutor="review" type="button">${t`Review our conversation`}</button>
                <button data-tutor="print-workshop" type="button">${t('Print lesson')}</button>
                ${reviewing ? button(t('Current attempt'), 'unit', index) : button(redoLabel, 'redo-workshop', index, 'primary')}
                ${workshop.beam ? button(index === 'beam-a' ? beamLabTitles['beam-b'] : t('Independent beam practice'), 'unit',
                    index === 'beam-a' ? 'beam-b' : 'beam-practice', 'primary') : index === 'truss-ta' ? button(trussTaPracticeTitle, 'quiz-truss-practice', 'vertical', 'primary') : index === 'truss-quiz' ? button(trussPracticeTitle, 'quiz-truss-practice', '', 'primary') : button(t('Try practice questions'), 'practice', index)}
                ${workshop.beam ? '' : following === undefined ? button(t('Practice exams'), 'final', '', 'primary') :
                    button(t('Next topic →'), 'unit', following, 'primary')}</div>
        </article>` : tutorTurn(workshop, run, false)}
    </section>`;
    const root = app.querySelector('.tutor-session');
    bindTutor(root, workshop, run, target => renderTutor(index, target), index);
    if (focus === 'title') focusPage();
    else if (focus === 'feedback') {
        const target = root.querySelector('.tutor-feedback');
        target?.focus({ preventScroll: true });
        target?.scrollIntoView({ block: 'nearest' });
    } else {
        const prompt = root.querySelector('.tutor-prompt, .tutor-finish') || root.querySelector('h1');
        prompt?.focus({ preventScroll: true });
        root.querySelector('.tutor-board, .tutor-finish')?.scrollIntoView({ block: 'start' });
        prompt?.scrollIntoView({ block: 'nearest' });
    }
}

function openWorkshop(index, review = null) {
    if (index === 'beam-practice') { openBeamPractice(); return; }
    if (!workshops[index] && !Object.hasOwn(beamLabTitles, index) && !Object.hasOwn(trussWorkshopTitles, index)) return;
    session = undefined;
    activeWorkshop = index;
    archiveAttempt = archivedRuns(index).some(run => attemptNumber(run) === review) ? review : null;
    if (archiveAttempt === null) workshopProgress.recent = index;
    workshopRun(index);
    saveWorkshops();
    history.replaceState(null, '', `#workshop-${index}${archiveAttempt === null ? '' : `/attempt-${archiveAttempt}`}`);
    renderTutor(index);
}

function redoWorkshop(index) {
    if (!workshopFinished(index)) return;
    const completed = workshopRun(index);
    workshopProgress.archives[index] = [...archivedRuns(index), completed];
    workshopProgress.runs[index] = { cursor: 0, records: [], attempt: attemptNumber(completed) + 1 };
    openWorkshop(index);
}

function workshopLink() {
    const match = /^#workshop-(\d+|beam-a|beam-b|beam-ramp|beam-practice|truss-quiz|truss-ta)(?:\/attempt-(\d+))?$/.exec(location.hash);
    if (!match) return null;
    const index = workshopKey(match[1]);
    return workshops[index] || Object.hasOwn(beamLabTitles, index) || index === 'beam-practice' || Object.hasOwn(trussWorkshopTitles, index) ? [index, match[2] ? Number(match[2]) : null] : null;
}

const workshopKey = value => /^\d+$/.test(value) ? Number(value) : value;

function closeWorkshopRoute() {
    if (activeWorkshop === null) return;
    activeWorkshop = null;
    archiveAttempt = null;
    history.replaceState(null, '', location.pathname + location.search);
}

function openRefresher(key) {
    const workshop = refreshers[key];
    if (!workshop) return;
    const run = { cursor: 0, records: [] };
    const dialog = document.createElement('dialog');
    dialog.className = 'tutor-dialog';
    dialog.setAttribute('aria-label', `${t`Refresher: ${workshop.title}`}`);
    document.body.append(dialog);
    dialog.addEventListener('close', () => dialog.remove(), { once: true });
    const draw = () => {
        const done = run.cursor === workshop.turns.length;
        dialog.innerHTML = `<div class="tutor-dialog-head"><div><p class="eyebrow">${t`Quick refresher`}</p><h2>${workshop.title}</h2></div>
            <button type="button" data-tutor="close" aria-label="${t`Close refresher`}">×</button></div>
            ${done ? `<p>${t`You’ve worked through the refresher. Let’s use it on the problem you were solving.`}</p>
                <button class="primary" type="button" data-tutor="close">${t`Back to my problem`}</button>` : tutorTurn(workshop, run, true)}`;
        const view = dialog.querySelector('.tutor-board');
        if (view) bindTutor(view, workshop, run, draw, null);
        dialog.querySelector('.tutor-feedback, .tutor-prompt, .primary')?.focus({ preventScroll: true });
        dialog.scrollTop = 0;
    };
    dialog.addEventListener('click', event => {
        if (event.target.closest('[data-tutor="close"]')) dialog.close();
    });
    draw();
    dialog.showModal();
}

function bindTutor(root, workshop, run, redraw, workshopIndex) {
    const turn = workshop.turns[run.cursor];
    const persist = workshopIndex == null ? () => {} : saveWorkshops;
    const record = run.records[run.cursor];
    let currentSketch = null;
    function submit(input) {
        if (!turn || record.status) return;
        const feedback = judgeTurn(turn, input);
        if (!feedback) {
            const error = root.querySelector('.tutor-input-error');
            if (error) error.textContent = t('Enter a number. Include a minus sign if your answer points in the negative direction.');
            return;
        }
        record.feedback = feedback;
        record.submitted = turn.type === 'number' ? parseStudyNumber(input) : input;
        if (turn.type === 'pick') record.lastChoice = input;
        if (feedback.correct) {
            record.status = 'correct';
            if (workshopIndex != null) saveProgress();
        } else if (workshopIndex != null && feedback.skill) {
            noticeMistake(record, feedback.skill);
        }
        persist();
        redraw('feedback');
    }
    const form = root.querySelector('.tutor-number-form');
    if (form) {
        const input = form.elements['tutor-answer'];
        input.addEventListener('input', () => {
            record.draft = input.value;
            record.draftLocale = locale;
            updateLessonDrawing(root, workshop, run.cursor, input.value, run);
            if (workshop.beam && turn.labPlot) {
                const value = parseStudyNumber(input.value);
                if (Number.isFinite(value) && value >= 0 && value <= workshop.beam.L) run.guide = value;
                refreshBeamLabPlot(root, workshop, run);
            }
            persist();
        });
        form.addEventListener('submit', event => {
            event.preventDefault();
            submit(input.value);
        });
    }
    const calculator = root.querySelector('.tutor-calculator form');
    if (calculator) {
        const result = calculator.querySelector('[data-tutor-result]');
        const calculation = turn.calculation;
        if (record.substitution) result.innerHTML = paperResult(calculation, record.substitution);
        const fields = [...calculator.querySelectorAll('[data-formula-input]')];
        fields.forEach((field, i) => {
            field.value = localizeDraft(record.givens?.[i], record.givenLocale);
            field.addEventListener('input', () => {
                record.givens = fields.map(input => input.value);
                record.givenLocale = locale;
                field.removeAttribute('aria-invalid');
                result.textContent = '';
                delete record.substitution;
                persist();
            });
        });
        calculator.addEventListener('submit', event => {
            event.preventDefault();
            const values = fields.map(field => parseStudyNumber(field.value));
            const invalid = fields.filter((field, i) => {
                const wrong = values[i] !== calculation.inputs[i][3];
                field.setAttribute('aria-invalid', String(wrong));
                return wrong;
            });
            if (invalid.length) {
                result.textContent = t('Check the highlighted givens and the units beside them.');
                invalid[0].focus();
                return;
            }
            record.substitution = values;
            result.innerHTML = paperResult(calculation, values);
            if (form) {
                const input = form.elements['tutor-answer'];
                input.value = studyInputText(calculation.calculate(...values));
                input.dispatchEvent(new Event('input', { bubbles: true }));
            }
            persist();
        });
    }
    if (turn?.type === 'sketch' && !record.status) {
        const check = root.querySelector('[data-tutor="check-sketch"]');
        bindGraph(turn, answer => {
            currentSketch = answer;
            check.disabled = !answer;
        }, { root, draft: record.draft, onDraft: draft => {
            record.draft = draft;
            if (workshop.beam) refreshBeamLabPlot(root, workshop, run);
            persist();
        } });
    }
    const board = root.querySelector('[data-active-step]');
    if (turn?.section?.key === 'weight') bindSectionBalance(root, turn.section.model);
    if (workshop.beam && board) bindBeamLabGuide(board, workshop.beam.L, (value, onShear) => {
        run.guide = value;
        if (!record.status && turn.labPlot && onShear) {
            const input = form.elements['tutor-answer'];
            const picked = Math.abs(value - turn.expected) < .12 ? turn.expected : value;
            input.value = studyInputText(Number(fmt(picked)));
            input.dispatchEvent(new Event('input', { bubbles: true }));
        } else persist();
    });
    root.addEventListener('click', event => {
        const control = event.target.closest('[data-tutor]');
        if (!control) return;
        switch (control.dataset.tutor) {
            case 'pick': submit(control.dataset.value); break;
            case 'check-sketch': if (currentSketch) submit(currentSketch); break;
            case 'fbd-option': {
                const chosen = new Set(record.draft || []);
                const value = Number(control.dataset.value);
                if (chosen.has(value)) chosen.delete(value); else chosen.add(value);
                record.draft = [...chosen];
                control.setAttribute('aria-pressed', String(chosen.has(value)));
                root.querySelector('[data-lesson-live]').innerHTML = fbdDrawing(turn, record.draft);
                root.querySelector('[data-tutor="check-fbd"]').disabled = !chosen.size;
                persist();
                break;
            }
            case 'check-fbd': submit(record.draft); break;
            case 'algebra-next': {
                record.algebra = Math.min(turn.algebra.length, (record.algebra || 1) + 1);
                root.querySelector('[data-algebra-work]').outerHTML = algebraWalkthrough(turn, record);
                root.querySelector('[data-tutor="algebra-next"]')?.focus({ preventScroll: true });
                persist();
                break;
            }
            case 'sign': {
                const input = form?.elements['tutor-answer'];
                if (!input) break;
                const value = input.value.trim();
                input.value = /^[−-]/.test(value) ? value.slice(1) : '-' + value.replace(/^\+/, '');
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.focus();
                break;
            }
            case 'refresh': openRefresher(control.dataset.value); break;
            case 'reveal':
                if (!turn || record.status) break;
                record.status = 'shown';
                record.feedback = { message: turn.solution };
                persist();
                redraw('feedback');
                break;
            case 'next':
                if (!record?.status) break;
                delete run.guide;
                run.cursor++;
                if (run.cursor === workshop.turns.length) run.finished = true;
                persist();
                redraw('turn');
                break;
            case 'back':
                if (workshopIndex == null) { run.cursor--; redraw('turn'); }
                else scrollLessonStep(root, run.cursor - 1);
                break;
            case 'review':
                scrollLessonStep(root, 0);
                break;
            case 'print-workshop': printWorkshop(workshop, run); break;
        }
    });
}

function scrollLessonStep(root, index) {
    const section = root.querySelector(`[data-lesson-step="${index}"]`);
    section?.focus({ preventScroll: true });
    section?.scrollIntoView({ block: 'start' });
}

function printWorkshop(workshop, run) {
    const print = document.createElement('article');
    print.className = 'lesson-print';
    print.innerHTML = `<h1>${workshop.title}</h1><p>${t`Attempt ${attemptNumber(run)}`}</p><p>${workshop.outcome}</p>
        ${workshop.turns.map((_, i) => lessonStepRecord(workshop, run, i)).join('')}`;
    document.body.append(print);
    document.body.classList.add('printing-lesson');
    window.addEventListener('afterprint', () => {
        print.remove();
        document.body.classList.remove('printing-lesson');
    }, { once: true });
    window.print();
}
