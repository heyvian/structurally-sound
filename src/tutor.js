const workshopStorageKey = 'structural-workshops-v1';

function readWorkshops() {
    try {
        const saved = JSON.parse(localStorage.getItem(workshopStorageKey));
        if (saved?.runs && typeof saved.runs === 'object' && !Array.isArray(saved.runs)) {
            return { runs: saved.runs, recent: saved.recent, signals: saved.signals || {} };
        }
    } catch {
        // A workshop can still run when browser storage is unavailable.
    }
    return { runs: {}, recent: null, signals: {} };
}

const workshopProgress = readWorkshops();
let activeWorkshop = null;

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
    if (saved && Array.isArray(saved.records) && Number.isInteger(saved.cursor) &&
        saved.cursor >= 0 && saved.cursor <= workshops[i].turns.length) return saved;
    return workshopProgress.runs[i] = { cursor: 0, records: [] };
}

function workshopFinished(i) {
    return Boolean(workshopProgress.runs[i]?.finished);
}

function workshopXp() {
    return Object.values(workshopProgress.runs).reduce((sum, run) => sum +
        (Array.isArray(run?.records) ? run.records.filter(record => record?.status === 'correct').length * 10 : 0), 0);
}

function nextWorkshop() {
    const recent = workshopProgress.recent;
    if (Number.isInteger(recent) && workshops[recent] && !workshopFinished(recent)) return recent;
    return unitOrder.find(i => !workshopFinished(i)) ?? unitOrder[0];
}

const escapeTutor = value => String(value ?? '').replace(/[&<>"']/g, character =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);

function judgeTurn(turn, input) {
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
            : t('Try that again. Keep the givens and their units beside your equation, and follow the steps one at a time.')),
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
        else if (turn.type === 'sketch') input = record.draft;
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
    };
    return `<aside class="refresher-offer"><p>${copy[skill]}</p>
        <button type="button" ${action}="refresh" data-value="${skill}">${t`Try ${offer.title.toLowerCase()}`}</button></aside>`;
}

function tutorHistory(workshop, run) {
    const earlier = workshop.turns.slice(0, run.cursor);
    if (!earlier.length) return '';
    const archive = earlier.slice(0, -1);
    return `${archive.length ? `<details class="tutor-archive"><summary>${t`Earlier turns (${archive.length})`}</summary>
        ${archive.map((turn, i) => `<details><summary>${turn.prompt}</summary><p>${turn.intro}</p>
            <p>${escapeTutor(localizedFeedback(turn, run.records[i])?.message || turn.solution)}</p></details>`).join('')}</details>` : ''}
        <div class="tutor-previous"><p>${escapeTutor(localizedFeedback(earlier.at(-1), run.records[run.cursor - 1])?.message || earlier.at(-1).solution)}</p></div>`;
}

function tutorDrawing(workshop, turn, interactive) {
    const drawing = workshopDrawings[turn.drawing || workshop.drawing.drawing]();
    const hotspots = interactive ? (turn.hot || []).map(key => {
        const point = drawing.points[key];
        const choice = turn.choices.find(([value]) => value === key);
        return point && choice ? `<button class="tutor-hotspot" type="button" data-tutor="pick" data-value="${key}"
            aria-label="${escapeTutor(choice[1])}" title="${escapeTutor(choice[1])}" style="--point-x:${point[0]}%;--point-y:${point[1]}%">
            <span aria-hidden="true">${key.length === 1 ? key : '＋'}</span></button>` : '';
    }).join('') : '';
    return `<aside class="tutor-drawing">
        <div class="tutor-drawing-title"><span>${turn.drawing ? t('Drawing') : workshop.drawing.caption}</span>${hotspots ? `<span>${t("Tap a point")}</span>` : ''}</div>
        <div class="tutor-drawing-frame">${drawing.markup}${hotspots}</div>
        ${drawing.label ? `<p>${drawing.label}</p>` : ''}
    </aside>`;
}

function tutorInputs(turn, record, isRefresher) {
    if (record.status) {
        return turn.type === 'sketch' ? `<div class="tutor-solution-plot">${graphSolution(turn)}</div>` : '';
    }
    if (turn.type === 'pick') {
        return `<div class="tutor-choices" aria-label="${t`Answer choices`}" role="group">
            ${turn.choices.map(([id, name]) => `<button type="button" data-tutor="pick" data-value="${id}"
                ${record.lastChoice === id ? 'class="previous-choice"' : ''}>${name}</button>`).join('')}
        </div>`;
    }
    if (turn.type === 'sketch') return `<div class="tutor-sketch">${graphMarkup(turn)}</div>
        <button class="primary" type="button" data-tutor="check-sketch" disabled>${t`Check my sketch`}</button>`;
    const fieldId = isRefresher ? 'refresher-answer' : 'workshop-answer';
    const calculator = turn.calculation ? `<details class="tutor-calculator"><summary>${t`Try it in the formula`}</summary>
        <form>${formulaFields(turn.calculation)}<button type="submit">${t`Calculate`}</button><div role="status" data-tutor-result></div></form></details>` : '';
    return `${calculator}<form class="tutor-number-form">
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
    return `<div class="tutor-board">
        ${tutorDrawing(workshop, turn, !record.status)}
        <section class="tutor-thread" aria-label="${t`Conversation with Val`}">
            ${isRefresher ? '' : tutorHistory(workshop, run)}
            <div class="tutor-active">
                <p class="tutor-step">${t`Step ${run.cursor + 1} of ${workshop.turns.length}`}</p>
                ${valNote(`<p>${turn.intro}</p>`)}
                <h2 class="tutor-prompt" tabindex="-1">${turn.prompt}</h2>
                ${turn.units ? `<p class="tutor-units"><b>${t`Follow the units`}</b> ${turn.units}</p>` : ''}
                ${!record.status ? tutorFeedback(turn, record) : ''}
                ${tutorInputs(turn, record, isRefresher)}
                ${record.status ? tutorFeedback(turn, record) : ''}
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
    const workshop = workshops[index];
    const run = workshopRun(index);
    const complete = run.cursor === workshop.turns.length;
    const title = units[index].title;
    const following = unitOrder[unitOrder.indexOf(index) + 1];
    app.innerHTML = `<section class="tutor-session">
        <div class="tutor-session-heading">
            <div>${button(t('‹ Learning path'), 'home')}<p class="eyebrow">ARCH 600 · ${title}</p>
                <h1 tabindex="-1">${workshop.title}</h1></div>
            <progress value="${run.cursor}" max="${workshop.turns.length}" aria-label="${t`Workshop steps complete`}"></progress>
        </div>
        ${complete ? `<article class="tutor-finish"><div class="tutor-celebrate val-pop">${valPortrait('cheer')}</div>
            <h2>${t`Workshop complete`}</h2><p>${workshop.outcome}</p>
            <div class="toolbar"><button data-tutor="review" type="button">${t`Review our conversation`}</button>
                ${button(t('Try practice questions'), 'practice', index)}
                ${following === undefined ? button(t('Practice exams'), 'final', '', 'primary') :
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
        const prompt = root.querySelector('.tutor-prompt') || root.querySelector('h1');
        prompt?.focus({ preventScroll: true });
        root.querySelector('.tutor-board')?.scrollIntoView({ block: 'start' });
        if (complete) window.scrollTo(0, 0);
    }
}

function openWorkshop(index) {
    if (!workshops[index]) return;
    session = undefined;
    activeWorkshop = index;
    workshopProgress.recent = index;
    workshopRun(index);
    saveWorkshops();
    history.replaceState(null, '', `#workshop-${index}`);
    renderTutor(index);
}

function closeWorkshopRoute() {
    if (activeWorkshop === null) return;
    activeWorkshop = null;
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
        const fields = [...calculator.querySelectorAll('[data-formula-input]')];
        fields.forEach((field, i) => {
            field.value = localizeDraft(record.givens?.[i], record.givenLocale);
            field.addEventListener('input', () => {
                record.givens = fields.map(input => input.value);
                record.givenLocale = locale;
                field.removeAttribute('aria-invalid');
                result.textContent = '';
                persist();
            });
        });
        calculator.addEventListener('submit', event => {
            event.preventDefault();
            const values = fields.map(field => parseStudyNumber(field.value));
            const invalid = fields.filter((field, i) => {
                const wrong = values[i] !== turn.calculation.inputs[i][3];
                field.setAttribute('aria-invalid', String(wrong));
                return wrong;
            });
            if (invalid.length) {
                result.textContent = t('Check the highlighted givens and the units beside them.');
                invalid[0].focus();
                return;
            }
            result.innerHTML = formulaSubstitution(turn.calculation, values);
        });
    }
    if (turn?.type === 'sketch' && !record.status) {
        const check = root.querySelector('[data-tutor="check-sketch"]');
        bindGraph(turn, answer => {
            currentSketch = answer;
            check.disabled = !answer;
        }, { root, draft: record.draft, onDraft: draft => { record.draft = draft; persist(); } });
    }
    root.addEventListener('click', event => {
        const control = event.target.closest('[data-tutor]');
        if (!control) return;
        switch (control.dataset.tutor) {
            case 'pick': submit(control.dataset.value); break;
            case 'check-sketch': if (currentSketch) submit(currentSketch); break;
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
                run.cursor++;
                if (run.cursor === workshop.turns.length) run.finished = true;
                persist();
                redraw('turn');
                break;
            case 'back':
                run.cursor--;
                persist();
                redraw('turn');
                break;
            case 'review':
                run.cursor = 0;
                persist();
                redraw('turn');
                break;
        }
    });
}
