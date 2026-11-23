function valPortrait(pose, label = '') {
    return `<span class="val-portrait">
        <img class="val-art" src="src/visuals/val-${pose}.webp?v=9" width="440" height="540" alt="${label}" decoding="async">
        <img class="val-art val-gold" src="src/visuals/val-${pose}-gold.webp?v=9" width="440" height="540" alt="" decoding="async">
    </span>`;
}

function heroVal() {
    return `<div class="hero-val val-entrance">
        <canvas class="val-model" aria-hidden="true"></canvas>
        ${valPortrait('hello', t('Val, a little glass tower with wide eyes'))}
    </div>`;
}

function updateValGold() {
    let done = 0;
    let total = 0;
    workshops.forEach((workshop, index) => {
        total += workshop.turns.length;
        const records = workshopProgress.runs[index]?.records;
        if (Array.isArray(records)) done += records.slice(0, workshop.turns.length).filter(record => record?.status).length;
    });
    document.documentElement.style.setProperty('--val-gold', done / total);
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
        valModelScripts ||= loadValScript('src/vendor/three-r181.min.js').then(() => loadValScript('src/val-3d.js?v=10'));
        await valModelScripts;
    } catch {
        valModelScripts = undefined;
        return;
    }
    if (!canvas.isConnected) return;
    const gold = Number(document.documentElement.style.getPropertyValue('--val-gold'));
    try {
        globalThis.mountValModel(canvas, gold);
    } catch {
        // The complete rendered portrait stays visible if WebGL is unavailable.
    }
}
