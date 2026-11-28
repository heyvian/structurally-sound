const flashcardStorageKey = 'structural-theory-flashcards-v1';
const theoryCards = new Map(unitOrder.flatMap(topic => theoryDecks[topic].map(([id, prompt, answer, drawing]) =>
    [id, { id, topic, prompt, answer, drawing }])));
const flashcardTopics = ['all', ...unitOrder.map(String), 'review'];

function readFlashcardProgress() {
    let saved;
    try {
        saved = JSON.parse(localStorage.getItem(flashcardStorageKey));
    } catch {
        // The deck also works without browser storage.
    }
    const validIds = ids => Array.isArray(ids) ? [...new Set(ids.filter(id => theoryCards.has(id)))] : [];
    return {
        topic: flashcardTopics.includes(saved?.topic) ? saved.topic : 'all',
        order: validIds(saved?.order),
        active: theoryCards.has(saved?.active) ? saved.active : null,
        revealed: saved?.revealed === true,
        review: validIds(saved?.review),
    };
}

function saveFlashcardProgress(progress) {
    try {
        localStorage.setItem(flashcardStorageKey, JSON.stringify(progress));
    } catch {
        // Keep the current deck in memory if storage is unavailable.
    }
}

function flashcardsInTopic({ topic, review }) {
    if (topic === 'all') return [...theoryCards.keys()];
    if (topic === 'review') return review;
    return theoryDecks[topic].map(([id]) => id);
}

function shuffleFlashcards(ids) {
    const order = [...ids];
    for (let last = order.length - 1; last > 0; last--) {
        const next = Math.floor(Math.random() * (last + 1));
        [order[last], order[next]] = [order[next], order[last]];
    }
    return order;
}

function flashcardWords(text) {
    return text.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase(locale).match(/[\p{L}\p{N}]+/gu) ?? [];
}

function openTheoryFlashcards() {
    session = undefined;
    pageRoute = ['flashcards', ''];
    const progress = readFlashcardProgress();
    show(`<section class="theory-flashcards">
        ${button(t('‹ Learning path'), 'home')}
        <h1>${theoryFlashcardTitle}</h1>
        <p>${t('Answer from memory, then reveal the card.')}</p>
        <div class="flashcard-toolbar">
            <label for="flashcard-topic">${t('Choose a topic')}</label>
            <select id="flashcard-topic">
                <option value="all">${t('All topics')}</option>
                ${unitOrder.map(topic => `<option value="${topic}">${units[topic].title}</option>`).join('')}
                <option value="review" data-flash-review-option></option>
            </select>
            <button type="button" data-flash-shuffle>${t('Shuffle cards')}</button>
        </div>
        <label class="flashcard-search">${t('Search cards')}
            <input type="search" placeholder="${t('Try period, tributary width, or equations')}">
        </label>
        <article class="flashcard-panel" aria-live="polite" data-flash-panel></article>
        <div class="flashcard-controls">
            <button type="button" class="primary" data-flash-reveal aria-expanded="false" aria-controls="flashcard-answer"></button>
            <button type="button" data-flash-previous>${t('Previous card')}</button>
            <button type="button" data-flash-next>${t('Next card')}</button>
        </div>
    </section>`, '#flashcards');
    const root = app.querySelector('.theory-flashcards');
    const topic = root.querySelector('#flashcard-topic');
    const panel = root.querySelector('[data-flash-panel]');
    const controls = root.querySelector('.flashcard-controls');
    const previous = root.querySelector('[data-flash-previous]');
    const next = root.querySelector('[data-flash-next]');
    const reveal = root.querySelector('[data-flash-reveal]');
    const shuffle = root.querySelector('[data-flash-shuffle]');
    const search = root.querySelector('.flashcard-search input');
    let visibleOrder = [];

    const render = () => {
        const available = flashcardsInTopic(progress);
        const order = progress.order.filter(id => available.includes(id));
        progress.order = [...order, ...available.filter(id => !order.includes(id))];
        const query = flashcardWords(search.value);
        visibleOrder = query.length ? progress.order.filter(id => {
            const { prompt, answer } = theoryCards.get(id);
            const words = flashcardWords(`${prompt} ${answer}`);
            return query.every(term => words.some(word => word.startsWith(term)));
        }) : progress.order;
        if (!visibleOrder.includes(progress.active)) {
            progress.active = visibleOrder[0] ?? null;
            progress.revealed = false;
        }
        const card = theoryCards.get(progress.active);
        root.querySelector('[data-flash-review-option]').textContent = t`Review later (${progress.review.length})`;
        controls.hidden = !card;
        shuffle.disabled = visibleOrder.length < 2;
        previous.disabled = visibleOrder.length < 2;
        next.disabled = previous.disabled;
        reveal.textContent = progress.revealed ? t('Hide answer') : t('Reveal answer');
        reveal.setAttribute('aria-expanded', String(progress.revealed));

        if (card) {
            const position = visibleOrder.indexOf(card.id) + 1;
            const marked = progress.review.includes(card.id);
            const drawing = card.drawing === 'zero-two' ? trussQuizDrawing({ phase: 'zero-two' }, {}).markup :
                card.drawing ? conceptPlate(card.drawing) : '';
            panel.innerHTML = `<div class="flashcard-meta">
                <span>${units[card.topic].title}</span><span>${t`Card ${position} of ${visibleOrder.length}`}</span>
                </div>
                <h2>${card.prompt}</h2>
                <div id="flashcard-answer" class="flashcard-answer" ${progress.revealed ? '' : 'hidden'}>
                    <p>${card.answer}</p>${drawing ? `<figure>${drawing}</figure>` : ''}
                </div>
                <button class="flashcard-mark" type="button" data-flash-mark aria-pressed="${marked}">${t('Review later')}</button>`;
        } else {
            panel.innerHTML = `<p>${query.length ? t('No cards matched your search in this topic.') :
                t('No cards marked for review yet. Choose a topic and use Review later on any card you want to revisit.')}</p>`;
        }
        saveFlashcardProgress(progress);
    };

    const move = direction => {
        const length = visibleOrder.length;
        const index = visibleOrder.indexOf(progress.active);
        progress.active = visibleOrder[(index + direction + length) % length];
        progress.revealed = false;
        render();
    };
    topic.value = progress.topic;
    topic.addEventListener('change', () => {
        progress.topic = topic.value;
        progress.active = null;
        progress.order = [];
        render();
    });
    search.addEventListener('input', render);
    previous.addEventListener('click', () => move(-1));
    next.addEventListener('click', () => move(1));
    reveal.addEventListener('click', () => {
        progress.revealed = !progress.revealed;
        render();
    });
    shuffle.addEventListener('click', () => {
        const shuffled = shuffleFlashcards(visibleOrder);
        let nextIndex = 0;
        progress.order = progress.order.map(id => visibleOrder.includes(id) ? shuffled[nextIndex++] : id);
        progress.active = shuffled[0];
        progress.revealed = false;
        render();
    });
    panel.addEventListener('click', event => {
        if (!event.target.closest('[data-flash-mark]')) return;
        const id = progress.active;
        if (progress.review.includes(id)) progress.review = progress.review.filter(mark => mark !== id);
        else progress.review.push(id);
        render();
        (panel.querySelector('[data-flash-mark]') ?? topic).focus();
    });
    render();
}
