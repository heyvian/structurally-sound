function valPortrait(pose, label = '') {
    return `<span class="val-portrait">
        <img class="val-art" src="src/visuals/val-${pose}.webp?v=9" width="440" height="540" alt="${label}" decoding="async">
        <img class="val-art val-gold" src="src/visuals/val-${pose}-gold.webp?v=9" width="440" height="540" alt="" decoding="async">
    </span>`;
}

function starCount(count) {
    return `<span aria-hidden="true">★</span> ${count === 1 ? t('1 star') : t`${count} stars`}`;
}

function heroVal() {
    const stars = totalStars();
    return `<div class="hero-val val-entrance">
        <canvas class="val-model" aria-hidden="true"></canvas>
        ${valPortrait('hello', t('Val, a little glass tower with wide eyes'))}
        ${stars ? `<span class="hero-star-count earned-stars">${starCount(stars)}</span>` : ''}
    </div>`;
}

function updateValGold() {
    let done = 0;
    let total = 0;
    workshops.forEach((workshop, index) => {
        total += workshop.turns.length;
        const run = workshopProgress.runs[index];
        const records = run?.records;
        if (workshopStars(index)) done += workshop.turns.length;
        else if (run?.sectionRevision && Array.isArray(records)) {
            const length = workshopVersion(index, attemptNumber(run), run).turns.length;
            const completed = records.slice(0, length).filter(record => record?.status).length;
            done += workshop.turns.length * Math.max(run.sectionProgressFloor ?? 0, completed / length);
        } else if (Array.isArray(records)) done += records.slice(0, workshop.turns.length).filter(record => record?.status).length;
    });
    document.documentElement.style.setProperty('--val-gold', done / total);
    document.documentElement.style.setProperty('--val-blue-rows', `${100 * (1 - Math.floor(done / total * 21) / 21)}%`);
}

let valModelScripts;
function loadValScript(path) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = path;
        script.onload = resolve;
        script.onerror = () => {
            script.remove();
            reject(new Error(`Unable to load ${path}`));
        };
        document.head.append(script);
    });
}

async function showValModel() {
    const canvas = document.querySelector('.val-model');
    if (!canvas || !globalThis.WebGL2RenderingContext) return;
    try {
        valModelScripts ||= loadValScript('src/vendor/three-r181.min.js').then(() => loadValScript('src/val-3d.js?v=14'));
        await valModelScripts;
    } catch {
        valModelScripts = undefined;
        return;
    }
    if (!canvas.isConnected) return;
    const gold = Number(document.documentElement.style.getPropertyValue('--val-gold'));
    try {
        globalThis.mountValModel(canvas, gold, totalStars());
    } catch {
        // The complete rendered portrait stays visible if WebGL is unavailable.
    }
}
