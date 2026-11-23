function valPortrait(pose, label = '') {
    return `<span class="val-portrait">
        <img class="val-art" src="src/visuals/val-${pose}.webp?v=7" width="440" height="540" alt="${label}" decoding="async">
        <img class="val-art val-gold" src="src/visuals/val-${pose}-gold.webp" width="440" height="540" alt="" decoding="async">
    </span>`;
}

function heroVal() {
    return `<div class="hero-val val-entrance"><div class="val-gaze">
        ${valPortrait('hello', t('Val, a little glass tower with wide eyes'))}
        <span class="val-eye val-eye-left" aria-hidden="true"></span>
        <span class="val-eye val-eye-right" aria-hidden="true"></span>
    </div></div>`;
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

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let gazeFrame;
let pointer;
function resetValGaze() {
    pointer = undefined;
    const gaze = document.querySelector('.val-gaze');
    if (gaze) ['--look-x', '--look-y', '--yaw', '--pitch'].forEach(property => gaze.style.removeProperty(property));
}

window.addEventListener('pointermove', event => {
    if (reducedMotion.matches || event.pointerType !== 'mouse') return;
    pointer = { x: event.clientX, y: event.clientY };
    if (gazeFrame) return;
    gazeFrame = requestAnimationFrame(() => {
        gazeFrame = undefined;
        const gaze = document.querySelector('.val-gaze');
        if (!pointer || !gaze || reducedMotion.matches) return;
        const { x, y, width, height } = gaze.parentElement.getBoundingClientRect();
        const clamp = value => Math.max(-1, Math.min(1, value));
        const horizontal = clamp((pointer.x - x - width * .35) / Math.max(105, width * .76));
        const vertical = clamp((pointer.y - y - height * .38) / Math.max(80, height * .56));
        gaze.style.setProperty('--look-x', `${horizontal * 28}%`);
        gaze.style.setProperty('--look-y', `${vertical * 16}%`);
        gaze.style.setProperty('--yaw', `${horizontal * 4}deg`);
        gaze.style.setProperty('--pitch', `${vertical * -3}deg`);
    });
}, { passive: true });
document.documentElement.addEventListener('pointerleave', resetValGaze);
window.addEventListener('blur', resetValGaze);
reducedMotion.addEventListener('change', resetValGaze);
