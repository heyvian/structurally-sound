const fmt = value => Number(value.toFixed(3)).toString();

// Planar pin and roller, vertical point loads and piecewise uniform loads.
// A positive load magnitude acts down. Positive moment is sagging.
function analyze(beam) {
    const forces = beam.points.concat(beam.udls.map(({ s, e, w }) => ({
        x: (s + e) / 2,
        p: w * (e - s),
    })));
    const total = forces.reduce((sum, force) => sum + force.p, 0);
    const momentAboutA = forces.reduce((sum, { p, x }) => sum + p * (x - beam.a), 0);
    const RB = momentAboutA / (beam.b - beam.a);
    const RA = total - RB;
    const jumps = [
        { x: beam.a, p: RA },
        { x: beam.b, p: RB },
        ...beam.points.map(({ x, p }) => ({ x, p: -p })),
    ];
    const V = (x, right) => jumps.reduce((sum, jump) =>
        sum + (jump.x < x || (right && jump.x === x) ? jump.p : 0), 0)
        - beam.udls.reduce((sum, { s, e, w }) => sum + w * Math.max(0, Math.min(x, e) - s), 0);
    const M = x => jumps.reduce((sum, jump) => sum + jump.p * Math.max(0, x - jump.x), 0)
        - beam.udls.reduce((sum, { s, e, w }) =>
            sum + w * (Math.max(0, x - s) ** 2 - Math.max(0, x - e) ** 2) / 2, 0);
    const breaks = [...new Set([
        0, beam.L, ...jumps.map(({ x }) => x), ...beam.udls.flatMap(({ s, e }) => [s, e]),
    ])].sort((a, b) => a - b);
    const roots = [];
    for (let i = 0; i < breaks.length - 1; i++) {
        const start = breaks[i];
        const end = breaks[i + 1];
        const left = V(start, true);
        const right = V(end, false);
        if (left * right < 0) roots.push(start + (end - start) * left / (left - right));
    }

    const vs = breaks.flatMap(x => {
        const left = { x, v: V(x, false) };
        const right = { x, v: V(x, true) };
        return Math.abs(left.v - right.v) < 1e-8 ? [left] : [left, right];
    });
    const ms = [...breaks, ...roots].sort((a, b) => a - b).map(x => ({ x, v: M(x) }));
    return {
        RA, RB, vs, ms, M, V,
        Vmax: Math.max(...vs.map(({ v }) => Math.abs(v))),
        Mmax: Math.max(...ms.map(({ v }) => Math.abs(v))),
    };
}

function graphQuestion(beam, kind) {
    const result = analyze(beam);
    const moment = kind === 'M';
    const stations = moment ? result.ms : result.vs;
    const shapes = moment ? stations.slice(1).map((right, i) => {
        const left = stations[i];
        const midpoint = (left.x + right.x) / 2;
        const offset = result.M(midpoint) - (left.v + right.v) / 2;
        if (Math.abs(offset) < 1e-8) return 'line';
        return offset > 0 ? 'positive' : 'negative';
    }) : [];
    return {
        type: 'graph', kind, b: beam, stations, shapes,
        answer: stations.map(({ v }) => v),
        prompt: t`Construct the ${moment ? t('bending moment') : 'shear'} diagram.`,
        hint: moment
            ? t('Use signed area under V. A smooth extremum occurs where V crosses zero.')
            : t('Start at zero outside the beam. Jump at point forces and slope under distributed loads.'),
        explain: moment
            ? t('The change in M equals the area under V. Constant V gives a straight segment. Linear V gives a parabola.')
            : t('An upward point force jumps V up, a downward point force jumps it down, and a uniform downward load decreases V linearly.'),
    };
}

function beamQs(beam) {
    const { RA, RB, Vmax, Mmax } = analyze(beam);
    const total = RA + RB;
    const arm = beam.b - beam.a;
    const loadMoment = RB * arm;
    const withBeam = question => ({ ...question, b: beam });
    return [
        withBeam(N(t('Find the signed vertical reaction at B. Upward is positive.'), RB,
            t`Take moments about A. Rᵦ × ${numberText(arm)} m = ${numberText(loadMoment)} kN·m, giving Rᵦ = ${numberText(RB)} kN.`,
            t('Replace each distributed load with its resultant at the centre of the loaded length.'), 'kN')),
        withBeam(N(t('Find the signed vertical reaction at A. Upward is positive.'), RA,
            t`Force balance gives Rₐ = ${numberText(total)} − (${numberText(RB)}) = ${numberText(RA)} kN.`,
            t('The sum of upward reactions balances the downward loads.'), 'kN')),
        graphQuestion(beam, 'V'),
        graphQuestion(beam, 'M'),
        withBeam(N(t('Find the maximum absolute shear.'), Vmax,
            t`Check both sides of each force jump. The largest magnitude is ${numberText(Vmax)} kN.`,
            t('Compare positive and negative ordinates by magnitude.'), 'kN')),
        withBeam(N(t('Find the maximum absolute bending moment.'), Mmax,
            t`Check endpoints, force jumps and points where V crosses zero. The largest magnitude is ${numberText(Mmax)} kN·m.`,
            t('Compare the extremes of the moment diagram.'), 'kN·m')),
    ];
}
