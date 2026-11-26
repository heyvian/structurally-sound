// Arrow lengths are schematic. Direction follows the learner's sign, while the
// label carries the actual value and unit.
function forceGlyph({ x, y, dx, dy, name, unit = '', length = 43, labelSide, showValue = true }, value, negativeDraft = false) {
    const negative = value < 0 || negativeDraft;
    const norm = Math.hypot(dx, dy);
    const u = dx / norm * (negative ? -1 : 1);
    const v = dy / norm * (negative ? -1 : 1);
    const tipX = x + u * length, tipY = y + v * length;
    const wing = (side) => `${tipX - 9 * u - side * 4 * v},${tipY - 9 * v + side * 4 * u}`;
    const label = showValue && Number.isFinite(value) ? `${name} = ${value > 0 ? '+' : ''}${numberText(value)}${unit ? ` ${unit}` : ''}` : name;
    const path = value === 0 ? `<circle cx="${x}" cy="${y}" r="5"/>` :
        `<path d="M${x} ${y}L${tipX} ${tipY}"/><polygon points="${tipX},${tipY} ${wing(1)} ${wing(-1)}"/>`;
    const textX = labelSide ? x + (labelSide === 'left' ? -8 : 8) : tipX + (u > .25 ? 3 : u < -.25 ? -3 : 8);
    const alignment = labelSide ? (labelSide === 'left' ? 'end' : 'start') : (u < -.25 ? 'end' : 'start');
    return `<g class="force-glyph${negative ? ' force-negative' : ''}" data-force-direction="${value === 0 ? 'zero' : negative ? 'negative' : 'positive'}">
        ${path}<text x="${textX}" y="${tipY + (v > .25 ? 14 : -6)}" text-anchor="${alignment}">${label}</text></g>`;
}

function momentGlyph(x, y, name, value, negativeDraft = false) {
    const negative = value < 0 || negativeDraft;
    const sign = negative ? 'negative' : 'positive';
    const id = `moment-${plateNumber++}`;
    const label = Number.isFinite(value) ? `${name} = ${value > 0 ? '+' : ''}${numberText(value)} kN·m` : name;
    return `<g class="force-glyph${negative ? ' force-negative' : ''}" data-force-direction="${sign}">
        <defs><marker id="${id}" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7Z"/></marker></defs>
        ${value === 0 ? '' : `<path d="M${x + 22} ${y + 13}A25 25 0 1 ${negative ? 1 : 0} ${x - 15} ${y - 21}" marker-end="url(#${id})"/>`}
        <text x="${x > 300 ? x - 32 : x + 32}" y="${y - 13}" text-anchor="${x > 300 ? 'end' : 'start'}">${label}</text></g>`;
}

const fbdCases = {
    cantilever: {
        context: t('A cantilever is fixed at A. A downward point force P acts at the free end. Draw the force and the reactions on the isolated beam.'),
        names: [t('Aₓ · right at A'), t('Aᵧ · up at A'), t('Mₐ · counterclockwise at A'), t('P · down at the free end'), t('P · up at the free end')],
        answer: [0, 1, 2, 3],
        solution: t('The fixed end supplies two force components and a reaction moment. The downward load stays on the diagram. Its clockwise moment is balanced by the counterclockwise moment at A.'),
    },
    incline: {
        context: t('A pin at A carries two force components. At B the frictionless surface slopes up to the right. Add the support reactions to the isolated beam.'),
        names: [t('Aₓ · right at A'), t('Aᵧ · up at A'), t('B · perpendicular to the slope'), t('B · straight up'), t('Mₐ · counterclockwise at A')],
        answer: [0, 1, 2],
        solution: t('At A, the pin can react in both axes. At B, the roller can only push perpendicular to the slope, so the reaction points up and left.'),
    },
};

function fbdQuestion(kind) {
    const model = fbdCases[kind];
    return { type: 'fbd', fbd: kind, prompt: model.context, opts: model.names, answer: model.answer,
        explain: model.solution, hint: t('Replace each support with the forces or moment it can supply.') };
}

function fixedDiagram(shown, isolated, load = 'P', length = 'L', values = {}) {
    const arrows = [forceGlyph({ x: 97, y: 96, dx: 1, dy: 0, name: 'Aₓ' }, values[0]),
        forceGlyph({ x: 97, y: 96, dx: 0, dy: -1, name: 'Aᵧ' }, values[1]), momentGlyph(97, 96, 'Mₐ', values[2]),
        `<path class="diagram-arrow" d="M361 30V90"/><text x="370" y="35">${load}</text>`,
        `<path class="diagram-arrow" d="M361 139V101"/><text x="374" y="136">${load}</text>`];
    return plate(shown.includes(3) || shown.includes(4) ? t('Cantilever and applied tip force') : t('Cantilever fixed at A'), `
        <path class="diagram-line" d="M97 96H361"/>
        ${isolated ? '<circle cx="97" cy="96" r="4"/>' : '<path class="diagram-line" d="M97 58V130M86 64l11-7m-11 20 11-7m-11 20 11-7m-11 20 11-7m-11 20 11-7m-11 20 11-7"/>'}
        ${shown.map(i => arrows[i]).join('')}
        <path class="diagram-dash" d="M97 144V155M361 144V155M97 150H361"/><text x="229" y="169" text-anchor="middle">${length}</text>
        <text x="97" y="126" text-anchor="middle">A</text>`);
}

function inclinedFbd(shown, isolated, loaded = true) {
    const arrows = [forceGlyph({ x: 88, y: 91, dx: 1, dy: 0, name: 'Aₓ' }),
        forceGlyph({ x: 88, y: 91, dx: 0, dy: -1, name: 'Aᵧ' }),
        forceGlyph({ x: 359, y: 91, dx: -.6, dy: -.8, name: 'B' }),
        forceGlyph({ x: 359, y: 91, dx: 0, dy: -1, name: 'Bᵧ' }), momentGlyph(88, 91, 'Mₐ')];
    return plate(t('Beam with a pin and a roller on a slope'), `
        <path class="diagram-line" d="M88 91H359"/>
        ${isolated ? '<circle cx="88" cy="91" r="4"/><circle cx="359" cy="91" r="4"/>' :
            '<path class="diagram-fill" d="M88 91l-14 18h28zM359 91l-18 24 31-16z"/><path class="diagram-line" d="M315 135L397 86"/><circle cx="354" cy="111" r="4"/><circle cx="368" cy="103" r="4"/>'}
        ${loaded ? '<path class="diagram-arrow" d="M228 28V85"/><text x="234" y="35">P</text>' : ''}${shown.map(i => arrows[i]).join('')}
        <text x="88" y="134" text-anchor="middle">A</text><text x="359" y="142" text-anchor="middle">B</text>`);
}

function fbdDrawing(question, choices, isolated = true) {
    if (question.fbd === 'cantilever') return fixedDiagram(choices ?? [3], isolated);
    if (question.fbd === 'incline') return inclinedFbd(choices || [], isolated);
    return beamFigure(question.b || center, choices || [], { isolated });
}

function sameForces(expected, input) {
    return Array.isArray(input) && input.length === expected.length && expected.every(value => input.includes(value));
}
