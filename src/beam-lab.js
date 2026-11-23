const beamLabStages = [
    t('Read the load'), t('Find the equivalent forces'), t('Solve the support reactions'),
    t('Start the shear diagram'), t('Carry shear to the next station'), t('Locate zero shear'),
    t('Find signed shear areas'), t('Add areas to build moment'), t('Draw the moment diagram'), t('Check the ends'),
];

const beamLabTitles = {
    'beam-a': t('A · One partial uniform load'),
    'beam-b': t('B · Two uniform load intensities'),
    'beam-ramp': t('Advanced · A gradually increasing load'),
};

function beamLabMath(beam) {
    const result = analyze(beam);
    const stations = [...new Set([0, beam.L, ...beam.udls.flatMap(({ s, e }) => [s, e])])].sort((a, b) => a - b);
    const zero = result.ms.find(({ x }) => !stations.includes(x)).x;
    const sections = stations.slice(1).map((end, i) => ({
        start: stations[i], end,
        w: beam.udls.find(({ s, e }) => s <= stations[i] && end <= e)?.w ?? 0,
    }));
    const momentStations = result.ms.map(({ x }) => x);
    const areas = momentStations.slice(1).map((end, i) => {
        const start = momentStations[i], length = end - start;
        const left = result.V(start, true), right = result.V(end, false);
        return { start, end, length, left, right, value: length * (left + right) / 2 };
    });
    return { ...result, stations, sections, momentStations, areas, zero };
}

function beamLabDefinition(key, attempt) {
    const drawing = { caption: t('Linked load, shear and moment diagrams') };
    if (key === 'beam-ramp') return rampBeamLab(drawing, attempt);
    const first = key === 'beam-a';
    const start = 2 + (attempt - 1) % 3;
    const beam = first
        ? { L: 10, a: 0, b: 10, points: [], udls: [{ s: start, e: start + 5, w: 4 * attempt }] }
        : { L: 12, a: 0, b: 12, points: [], udls: [{ s: 0, e: 6, w: 4 * attempt }, { s: 6, e: 12, w: 10 * attempt - 2 }] };
    const model = beamLabMath(beam);
    const turns = [];
    const n = numberText;
    const step = (stage, id, focus, intro, prompt, expected, unit, solution, extra = {}) => {
        turns.push(num(intro, prompt, expected, unit, solution, { stage, labId: id, labFocus: focus, ...extra }));
    };

    beam.udls.forEach(({ s, e, w }, i) => {
        const length = e - s;
        step(1, `intensity-${i}`, s, t('Start with the highlighted strip of the load drawing. The arrows push down. The label in kN/m says how many kilonewtons act on each metre of beam.'),
            t('What is the load intensity w on this strip?'), w, 'kN/m', t`Each metre of this strip carries ${n(w)} kN downward.`, { patch: i });
        step(1, `length-${i}`, s, t('Use the two beam coordinates at the ends of the highlighted strip. Subtract the start from the end to get the length that carries the load.'),
            t('How many metres does this load cover?'), length, 'm', `${n(e)} m − ${n(s)} m = ${n(length)} m.`, { patch: i });
    });

    beam.udls.forEach(({ s, e, w }, i) => {
        const length = e - s, { x, p } = model.forces[i];
        step(2, `force-${i}`, s, t('For the reactions, replace this uniform strip with one downward force W. Multiply the load per metre by the number of metres carrying it.'),
            t('What is the equivalent downward force W?'), p, 'kN', `${n(w)} kN/m × ${n(length)} m = ${n(p)} kN.`, {
                patch: i, units: t('Multiplying kN/m by m cancels the metres and leaves kN.'),
                calculation: i === 0 ? paperCalculation('W', t('Total equivalent force'), 'kN',
                    [['w', t('Load per metre of beam'), 'kN/m', w], ['L', t('Loaded length'), 'm', length]], [0, '×', 1], null,
                    (intensity, distance) => intensity * distance) : undefined,
            });
        step(2, `centroid-${i}`, s, t('The equivalent arrow acts midway along this strip. Find half the loaded length, then add the coordinate where the strip begins.'),
            t('At what beam coordinate does the equivalent force act?'), x, 'm',
            `x = ${n(s)} m + (${n(length)} m ÷ 2) = ${n(x)} m.`, { patch: i });
    });

    const loadMoment = model.forces.reduce((sum, { x, p }) => sum + x * p, 0);
    step(3, 'load-moment', 0, t('Take moments about A. A’s reaction has zero lever arm. Each equivalent downward force turns the beam clockwise. Use each force times its distance from A, then add their magnitudes.'),
        t('What is the total clockwise moment magnitude about A?'), loadMoment, 'kN·m',
        `${model.forces.map(({ x, p }) => `(${n(p)} kN × ${n(x)} m)`).join(' + ')} = ${n(loadMoment)} kN·m.`);
    step(3, 'reaction-b', beam.L, t`B’s reaction must produce the same moment counterclockwise. Its lever arm from A is ${n(beam.L)} m.`,
        t('What is the upward reaction at B?'), model.RB, 'kN',
        `Bᵧ = ${n(loadMoment)} kN·m ÷ ${n(beam.L)} m = ${n(model.RB)} kN.`,
        { skill: 'reactions', units: t('Dividing a moment in kN·m by a distance in m leaves a force in kN.') });
    const totalLoad = model.RA + model.RB;
    step(3, 'reaction-a', 0, t('Now use vertical force balance. The two upward reactions must add up to the total downward load.'),
        t('What is the upward reaction at A?'), model.RA, 'kN',
        `Aᵧ = ${n(totalLoad)} kN − ${n(model.RB)} kN = ${n(model.RA)} kN.`, { skill: 'reactions' });

    step(4, 'v-0', 0, t('Begin just outside A, where V = 0. Moving past A’s upward reaction makes the shear jump up by that force.'),
        t('What is the shear just to the right of A?'), model.RA, 'kN', `V = 0 + ${n(model.RA)} kN = ${n(model.RA)} kN.`);
    model.sections.forEach(({ start, end, w }, i) => {
        const initial = model.V(start, true), final = model.V(end, false);
        const atB = end === beam.L;
        const intro = w
            ? t`Start this section at V = ${n(initial)} kN. The downward load removes ${n(w)} kN of shear per metre. Its rectangle has width ${n(end - start)} m. Subtract the rectangle’s area from the starting shear.`
            : t`The starting shear is ${n(initial)} kN. There is no distributed load within this section, so the shear line is horizontal.`;
        const boundary = i > 0 ? `${t('The load intensity changes here, but there is no point force. Carry the same shear into the next section.')} ` : '';
        const values = `V<sub>end</sub> = (${n(initial)} kN) − (${n(w)} kN/m) × (${n(end - start)} m)`;
        step(5, `v-${i + 1}`, end, boundary + intro,
            atB ? t('What is the signed shear just before support B?') : t`What is the signed shear at x = ${n(end)} m?`, final, 'kN',
            `V = (${n(initial)} kN) − (${n(w)} kN/m)(${n(end - start)} m) = ${n(final)} kN.`,
            { hint: t('An intensity change changes the slope. A concentrated force causes a shear jump.'),
                patch: beam.udls.findIndex(load => load.s === start && load.e === end),
                algebra: [
                    ['V<sub>end</sub> = V<sub>start</sub> − wL', t('L is the length of this section. Multiply w in kN/m by L in m to find the shear drop in kN.')],
                    [values, t('Use the shear at the start of this section. Subtract the downward load over this section.')],
                ] });
    });

    const section = model.sections.find(({ start, end }) => start < model.zero && model.zero < end);
    const entering = model.V(section.start, true), base = model.zero - section.start;
    step(6, 'zero-base', section.start, t`Look at the segment that crosses the axis. It begins at x = ${n(section.start)} m with V = +${n(entering)} kN. The load rectangle must take away exactly that much shear. Set its area wd equal to the starting shear.`,
        t('How far from this segment’s start does shear reach zero?'), base, 'm',
        `d = ${n(entering)} kN ÷ (${n(section.w)} kN/m) = ${n(base)} m.`, {
            units: t('kN ÷ (kN/m) = m. A force divided by a force per metre gives a distance.'),
            hint: t('The base starts where this slope begins. Add the segment’s starting coordinate only when asked for x.'),
            wrong: section.start ? [[model.zero, t('That is the coordinate measured from the beam’s left end. The triangle’s base starts at the loaded segment.')]] : [],
            calculation: first ? paperCalculation('d', t('Triangle base to zero shear'), 'm',
                [['V₀', t('Shear at the start of the loaded segment'), 'kN', entering], ['w', t('Downward load intensity'), 'kN/m', section.w]],
                [0], [1], (shear, intensity) => shear / intensity) : undefined,
        });
    step(6, 'zero', section.start, t`You found a local base of ${n(base)} m. Add the segment’s starting coordinate to locate the crossing on the beam. You can place a marker on the drawing or type its exact x-coordinate.`,
        t('At what x-coordinate does shear cross zero? Measure x from the left end of the beam.'), model.zero, 'm',
        `x = ${n(section.start)} m + ${n(base)} m = ${n(model.zero)} m. ${t('Moment rises while shear is positive and falls once shear turns negative. This crossing gives a local maximum. A negative-to-positive crossing gives a local minimum.')}`,
        { labPlot: true, tolerance: .061 });

    const areaGuides = {
        rectangle: t('The shear has one constant height across this interval. Its signed area is a rectangle: width times signed height.'),
        triangle: t('One end of this interval is at zero shear. Its signed area is a triangle: half the width times the signed height at the other end.'),
        trapezoid: t('Both shear heights have the same sign and are different. For this trapezoid, average the two signed heights and multiply by the width.'),
    };
    model.areas.forEach(({ start, end, length, left, right, value }, i) => {
        const shape = Math.abs(left - right) < 1e-7 ? 'rectangle' :
            Math.min(Math.abs(left), Math.abs(right)) < 1e-7 ? 'triangle' : 'trapezoid';
        const product = shape === 'rectangle' ? `${n(length)} m × (${n(left)} kN)` :
            shape === 'triangle' ? `½ × ${n(length)} m × (${n(Math.abs(left) > Math.abs(right) ? left : right)} kN)` :
            `${n(length)} m × [(${n(left)} kN + ${n(right)} kN) ÷ 2]`;
        step(7, `area-${i}`, end, areaGuides[shape], t`What is the signed shear area from x = ${n(start)} m to x = ${n(end)} m?`,
            value, 'kN·m', `ΔM = ${product} = ${n(value)} kN·m.`,
            { areaIndex: i, units: t('The base is in m and the signed height is in kN. Their product is in kN·m.') });
    });

    step(8, 'm-0', 0, t('A is a pin at the end of the beam. There is no applied couple there. This gives us a known starting point for the moment diagram.'),
        t('What is the bending moment at A?'), 0, 'kN·m', t('A pin or roller at a beam end has zero moment when no end couple is applied.'));
    model.areas.forEach(({ start, end, value }, i) => {
        const initial = model.M(start), final = model.M(end);
        step(8, `m-${i + 1}`, end, t`The previous bending moment is ${n(initial)} kN·m. Add the signed shear area of ${n(value)} kN·m over the highlighted interval.`,
            t`What is the bending moment at x = ${n(end)} m?`, final, 'kN·m',
            `M = (${n(initial)} kN·m) + (${n(value)} kN·m) = ${n(final)} kN·m.`, { areaIndex: i });
    });

    turns.push(sketch(beam, 'M', t('Transfer the moment ordinates you found to the plot. A flat shear line gives a straight moment segment. A sloped shear line gives a parabola. The course plots positive sagging downward.'),
        t('Read the moment diagram along the same beam coordinates as the other two drawings. The moment slope is zero at the shear crossing.'),
        { stage: 9, labId: 'moment-sketch', labFocus: model.zero }));
    step(10, 'after-b', beam.L, t('At the right support, add its upward reaction to the signed shear just before B. Outside the beam, equilibrium requires zero shear.'),
        t('What is the shear just after B?'), 0, 'kN',
        `V = (${n(-model.RB)} kN) + (${n(model.RB)} kN) = 0 kN.`);
    step(10, 'end-check', beam.L, t('The roller at the right end cannot supply a couple. Compare the endpoint of your moment diagram with this known boundary condition.'),
        t('What bending moment must the diagram reach at B?'), 0, 'kN·m',
        t('Adding the signed shear areas brings the moment back to zero at B. The last reaction also brings shear back to zero outside the span.'));

    return {
        title: beamLabTitles[key], drawing, beam, model, turns,
        outcome: t('You used loads and reactions to draw shear, then used signed areas to draw bending moment.'),
        refs: ['reactions', 'zero-shear', 'area'],
    };
}

function rampBeamLab(drawing, attempt) {
    const L = 6, w = 12 * attempt, reaction = w * L / 6;
    const zero = L / Math.sqrt(3);
    const V = x => reaction - w * x ** 2 / (2 * L);
    const M = x => reaction * x - w * x ** 3 / (6 * L);
    const beam = { L, a: 0, b: L, ramp: w, udls: [], points: [] };
    const model = { RA: reaction, RB: 2 * reaction, V, M, Vmax: 2 * reaction, Mmax: M(zero), zero,
        stations: [0, L], momentStations: [0, zero, L], areas: [], forces: [] };
    return {
        title: beamLabTitles['beam-ramp'], drawing, beam, model, refs: ['area'],
        outcome: t('A straight ramp in the load diagram produces curved shear. The area of the ramp up to your cut still gives the change in shear.'),
        turns: [
            num(t`The load rises linearly from 0 to ${numberText(w)} kN/m across the 6 m span. Its full load diagram is a triangle.`,
                t('What is the equivalent downward force W?'), w * L / 2, 'kN',
                `W = ½ × 6 m × ${numberText(w)} kN/m = ${numberText(w * L / 2)} kN.`, { labId: 'force-0', labFocus: 3 }),
            num(t('The equivalent force is one-third of the span from the heavy end, so it acts 4 m from A. Take moments about A.'),
                t('What is the upward reaction at B?'), 2 * reaction, 'kN',
                `Bᵧ = ${numberText(w * L / 2)} kN × 4 m ÷ 6 m = ${numberText(2 * reaction)} kN.`, { labId: 'reaction-b', labFocus: 6 }),
            num(t('Subtract the right reaction from the full downward load. At A the shear jumps up by the left reaction.'),
                t('What is the shear just to the right of A?'), reaction, 'kN',
                `V = Aᵧ = ${numberText(reaction)} kN.`, { labId: 'v-0', labFocus: 0 }),
            num(t`At d metres from A, load intensity is (${numberText(w)} kN/m) × (d ÷ 6 m). The load area to that cut is triangular, so the lost shear grows with d². Set V = 0 when that area equals ${numberText(reaction)} kN.`,
                t('At what x-coordinate does shear cross zero? Measure x from the left end of the beam.'), zero, 'm',
                `0 = ${numberText(reaction)} − ${numberText(w / (2 * L))}d². d = √12 m ≈ ${numberText(zero)} m.`,
                { labId: 'zero', labFocus: 0, labPlot: true, tolerance: .061 }),
        ],
    };
}
