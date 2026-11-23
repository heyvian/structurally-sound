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
        RA, RB, forces, vs, ms, M, V,
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
    const { RA, RB, forces, Vmax, Mmax } = analyze(beam);
    const total = RA + RB;
    const arm = beam.b - beam.a;
    const loadMoment = RB * arm;
    const withBeam = question => ({ ...question, b: beam });
    const loadTerms = forces.map(({ x, p }) => `(${numberText(p)} kN × ${numberText(x - beam.a)} m)`).join(' + ');
    const forceTerms = forces.map(({ p }) => `${numberText(p)} kN`).join(' + ');
    return [
        withBeam({ ...N(t('Find the signed vertical reaction at B, the right-hand support. Take up as positive.'), RB,
            t('Dividing a moment in kN·m by its lever arm in m leaves a force in kN.'),
            t('Replace each distributed load with its resultant at the centre of the loaded length.'), 'kN'),
            work: [t('Take moments about A. The reaction at A has a zero lever arm, so it drops out of this equation.'),
                t`Balance the effects of the downward loads about A. Bᵧ × ${numberText(arm)} m = ${loadTerms} = ${numberText(loadMoment)} kN·m.`,
                t`Divide both sides by ${numberText(arm)} m to get Bᵧ = ${numberText(RB)} kN.`] }),
        withBeam({ ...N(t('Find the signed vertical reaction at A, the left-hand support. Take up as positive.'), RA,
            t('Both sides of the vertical force equation have units of kN.'),
            t('The sum of upward reactions balances the downward loads.'), 'kN'),
            work: [t`Add the downward loads. Their total is ${forceTerms} = ${numberText(total)} kN.`,
                t`The reaction at B is ${numberText(RB)} kN. Balance vertical forces with Aᵧ + (${numberText(RB)} kN) = ${numberText(total)} kN.`,
                t`Subtract Bᵧ from both sides. Aᵧ = ${numberText(total)} kN − (${numberText(RB)} kN) = ${numberText(RA)} kN.`] }),
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
