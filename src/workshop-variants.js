// Saved attempt numbers select a stable set of problem data.
const repeatScenarios = [
    roofRepeat, forcesRepeat, supportRepeat, n => beamRepeat(n, 'reactions'),
    n => beamRepeat(n, 'diagrams'), stressRepeat, sectionRepeat, columnRepeat,
    trussRepeat, n => beamRepeat(n, 'review'), mathRepeat,
];

const repeatVersions = new Map();
const shearVersions = new Map();

function workshopVersion(index, attempt = 1, run) {
    if (Object.hasOwn(beamLabTitles, index)) {
        const key = `${index}/${attempt}`;
        if (!repeatVersions.has(key)) repeatVersions.set(key, beamLabDefinition(index, attempt));
        return repeatVersions.get(key);
    }
    let workshop = workshops[index];
    if (attempt > 1) {
        const key = `${index}/${attempt}`;
        if (!repeatVersions.has(key)) {
            repeatVersions.set(key, { ...workshop, repeat: true, turns: repeatScenarios[index](attempt - 1) });
        }
        workshop = repeatVersions.get(key);
    }
    // Completed attempts keep their original length and star. In-progress work
    // keeps the same step positions, with the new exercise added at the end.
    if (index !== 4 || (run?.finished && run.cursor === workshop.turns.length)) return workshop;
    if (!shearVersions.has(attempt)) {
        const w = 5 + attempt;
        const run = 2 + (attempt % 5) / 2;
        const segment = attempt === 1 ? zeroShearLesson : uniformShearSegment(2 + attempt, 8 + attempt, w * run, w);
        shearVersions.set(attempt, { ...workshop, index, turns: [...workshop.turns, ...shearCrossingLesson(segment)] });
    }
    return shearVersions.get(attempt);
}

function repeatNumber(intro, prompt, expected, unit, solution, figure, extra = {}) {
    return num(intro, prompt, expected, unit, solution, { figure, ...extra });
}

function repeatProblem(question, intro, extra = {}) {
    const solution = [...(question.work || []), question.explain].join(' ');
    const shared = { ...extra, hint: extra.hint || question.hint };
    if (question.type === 'number') return num(intro, question.prompt, question.answer, question.unit, solution, shared);
    if (question.type === 'graph') return { ...question, ...shared, type: 'sketch', intro, solution };
    if (question.type === 'fbd') return { ...question, ...shared, intro, solution };
    const choices = question.opts.map((label, i) => [String(i), label]);
    return pick(intro, question.prompt, choices, String(question.answer), solution, shared);
}

function roofRepeat(n) {
    const bay = 4 + n, length = 6 + n, pressure = 2 + n / 2;
    const line = bay * pressure;
    const figure = () => roofPlan({ bay, length });
    const intro = t`The next beam is ${numberText(bay)} m away on each side. The shaded strip runs halfway to each neighboring beam.`;
    const original = workshops[0].turns;
    return [
        ...original.slice(0, 3),
        repeatNumber(intro, original[3].prompt, bay, 'm',
            t`Add one half-gap on each side. The total width is ${numberText(bay)} m.`, figure, { symbol: t('Strip width bₜ') }),
        repeatNumber(t`The roof pressure is q = ${numberText(pressure)} kPa. Multiply by the shaded width bₜ = ${numberText(bay)} m to get w, the load per metre of beam.`,
            original[4].prompt, line, 'kN/m', `(${numberText(pressure)} kN/m²) × (${numberText(bay)} m) = ${numberText(line)} kN/m.`,
            () => roofPlan({ bay, length, oneMetre: true }), {
                symbol: 'w', units: original[4].units,
                calculation: { ...roofLineLoad, inputs: [['q', t('Roof pressure'), 'kPa', pressure], ['bₜ', t('Tributary width'), 'm', bay]] },
            }),
        repeatNumber(t`Each metre carries ${numberText(line)} kN. The beam is ${numberText(length)} m long.`, original[5].prompt,
            line * length, 'kN', `(${numberText(line)} kN/m) × (${numberText(length)} m) = ${numberText(line * length)} kN.`, figure, { symbol: 'W' }),
        repeatNumber(t`The edge beam has roof on one side. The next beam is ${numberText(bay)} m inward. Take half that gap, then use the same length of ${numberText(length)} m and pressure of ${numberText(pressure)} kPa.`,
            original[6].prompt, line * length / 2, 'kN',
            `(${numberText(pressure)} kN/m²) × (${numberText(bay / 2)} m) × (${numberText(length)} m) = ${numberText(line * length / 2)} kN.`,
            () => roofPlan({ edge: true, bay, length }), { symbol: 'W', newExample: true }),
        ...original.slice(7),
    ];
}

function forcesRepeat(n) {
    const force = 12 + 2 * n, left = 2 + n;
    const horizontal = force * Math.cos(Math.PI / 6), vertical = force / 2;
    const net = horizontal - left;
    const original = workshops[1].turns;
    const figure = () => workshopDrawings.vector(force);
    const combined = () => workshopFigure(componentVectorPlate(net, vertical, null, 'angle'));
    const xArrow = { x: 78, y: 148, dx: 1, dy: 0, length: 60, name: 'Fₓ' };
    const yArrow = { x: 78, y: 148, dx: 0, dy: -1, length: 46, name: 'Fᵧ' };
    return [
        ...original.slice(0, 2).map(turn => ({ ...turn, figure })),
        repeatNumber(t`The cable pulls with ${force} kN at 30° above the horizontal. Use cosine for the leg beside the angle.`, original[2].prompt,
            horizontal, 'kN', `Fₓ = (${force} kN) × cos 30° ≈ +${numberText(horizontal)} kN.`, figure, {
                symbol: 'Fₓ', arrow: xArrow, units: original[2].units, skill: 'trig',
                wrong: [[vertical, t('That is the vertical component. For the horizontal leg use cosine.'), 'trig']],
                calculation: paperCalculation('Fₓ', t('Signed horizontal force component'), 'kN',
                    [['F', t('Force magnitude'), 'kN', force], ['θ', t('Angle from +x'), '°', 30]],
                    [0, '× cos(', 1, ')'], null, (f, degrees) => f * Math.cos(degrees * Math.PI / 180)),
            }),
        { ...original[3], figure },
        repeatNumber(t`The same ${force} kN arrow points up. The vertical leg is across from 30°, so use sine.`, original[4].prompt,
            vertical, 'kN', `Fᵧ = (${force} kN) × sin 30° = +${numberText(vertical)} kN.`, figure, {
                symbol: 'Fᵧ', arrow: yArrow, wrong: [[horizontal, t('That is the horizontal component. For the vertical leg use sine.'), 'trig']],
            }),
        repeatNumber(t`A second cable pulls left with ${left} kN. Add its signed horizontal force to the first cable’s rightward ${numberText(horizontal)} kN.`,
            original[5].prompt, net, 'kN', `Rₓ = ${numberText(horizontal)} kN − ${left} kN ≈ ${numberText(net)} kN.`,
            () => workshopDrawings['vector-sum'](horizontal, left), { symbol: 'Rₓ' }),
        repeatNumber(t`The combined arrow has ${numberText(net)} kN across and ${numberText(vertical)} kN up. Treat those as the legs of a right triangle.`,
            original[6].prompt, Math.hypot(net, vertical), 'kN',
            `R = √(${numberText(net)}² + ${numberText(vertical)}²) kN ≈ ${numberText(Math.hypot(net, vertical))} kN.`, combined, { symbol: 'R' }),
        pick(t('Use the angle from the horizontal. Compare the vertical and horizontal legs of the combined arrow.'),
            original[7].prompt, [['tan', t('Tangent')], ['sin', t('Sine')], ['cos', t('Cosine')]], 'tan',
            `tan θ = ${numberText(vertical)} ÷ ${numberText(net)}. θ ≈ ${numberText(Math.atan2(vertical, net) * 180 / Math.PI)}°.`,
            { skill: 'trig', figure: combined }),
        original[8],
    ];
}

function supportRepeat(n) {
    const force = 10 + 2 * n;
    const original = workshops[2].turns;
    return [
        ...original.slice(0, 3),
        repeatNumber(t`The applied push is ${force} kN to the right. Only the pin at A can balance it. Take right as positive.`,
            original[3].prompt, -force, 'kN', t`Subtract ${force} kN from both sides. Aₓ = −${force} kN, so the pin pushes left.`,
            () => workshopFigure(horizontalBeam(force, false, false)), {
                symbol: 'Aₓ', arrow: { x: 85, y: 98, dx: 1, dy: 0, length: 43, name: 'Aₓ' },
                algebra: [
                    [`Aₓ + ${force} kN = 0`, original[3].algebra[0][1]],
                    [`Aₓ + ${force} kN − ${force} kN = 0 − ${force} kN`, t('Subtract the same force from both sides.')],
                    [`Aₓ = −${force} kN`, t('The minus sign means the reaction points left.')],
                ],
            }),
        original[4],
        repeatProblem(fbdQuestion('incline'), t('This time the roller rests on a slope. Look at the surface in the upper drawing.')),
    ];
}

function beamRepeat(n, focus) {
    const [point, intensity] = { reactions: [17, 4], diagrams: [22, 6], review: [27, 8] }[focus];
    const beam = { L: 8, a: 0, b: 8, points: [{ x: n % 2 ? 3 : 2, p: point + 3 * n }],
        udls: [{ s: 4, e: 8, w: intensity + n }] };
    const model = analyze(beam);
    const questions = beamWorkshopQuestions(beam, 'redo');
    const indices = focus === 'review' ? [0,1,2,3,4,5,6,7,8,9,10] : focus === 'reactions' ? [0,1,2,3,4] : [3,4,5,6,7,8];
    const methodsForSteps = ['support', 'distributed', 'distributed', 'reactions', 'balance', 'shear', 'bendingDiagram', 'shear', 'bendingDiagram', 'bendingStress', 'steel'];
    const turns = indices.map(j => {
        const question = questions[j];
        const intro = question.setup || methods[methodsForSteps[j]].steps[0];
        const reaction = j === 3 ? 2 : j === 4 ? 1 : 0;
        const symbol = j === 1 ? 'W' : j === 2 ? 'x' : j === 3 ? 'Bᵧ' : j === 4 ? 'Aᵧ' : j === 7 ? 'Vmax' : j === 8 ? 'Mmax' : j === 9 ? 'Sₓ' : '';
        const arrow = reaction ? { x: reaction === 2 ? 472 : 48, y: 82, dx: 0, dy: -1, length: 44,
            labelSide: reaction === 2 ? 'left' : 'right', name: symbol } : undefined;
        const figure = () => {
            if (j === 10) return workshopFigure(steelTable(question.rows));
            if (j === 9) return workshopFigure(graphSolution(graphQuestion(beam, 'M')));
            const reactions = j > 2 ? [0, 1, 2].filter(i => i !== reaction) : [];
            const values = j >= 4 ? { 2: model.RB, ...(j > 4 ? { 1: model.RA, 0: 0 } : {}) } : {};
            return workshopFigure(beamFigure(beam, reactions, { isolated: j > 2, values, pivot: j === 3 ? 0 : undefined }));
        };
        return repeatProblem(question, intro, { figure, symbol, arrow, skill: reaction ? 'reactions' : undefined });
    });
    if (focus === 'reactions') {
        const [{ p, x }] = beam.points;
        for (const [i, support, distance, sign, pivot, symbol] of [[3, 'A', x, -1, 68, 'Mₐ'], [4, 'B', beam.L - x, 1, 388, 'Mᵦ']]) {
            turns.splice(i, 0, repeatNumber(t`The highlighted pivot is ${support}. Use the perpendicular distance shown. Take counterclockwise as positive.`,
                t`What is the signed moment of the ${p} kN force about ${support}?`, sign * p * distance, 'kN·m',
                `${symbol} = (${numberText(sign * p)} kN) × (${distance} m) = ${numberText(sign * p * distance)} kN·m.`,
                () => momentArm(support === 'A', p, x, beam.L), { momentAt: pivot, symbol, skill: 'reactions', units: workshops[3].turns[3].units }));
        }
    }
    return turns;
}

function stressRepeat(n) {
    const force = 30 + 3 * n, area = 200 + 5 * n, length = 400 + 40 * n, extension = 1 + n / 10;
    const stress = force * 1000 / area;
    const original = workshops[5].turns;
    const bar = () => workshopDrawings.bar();
    return [
        original[0],
        repeatNumber(t`This steel bar carries ${force} kN in tension. Its cross-sectional area is ${area} mm². Convert the force to newtons before dividing.`,
            original[1].prompt, stress, 'MPa', `σ = ${force * 1000} N ÷ ${area} mm² ≈ ${numberText(stress)} MPa.`, bar, {
                symbol: 'σ', units: original[1].units,
                calculation: paperCalculation('σ', t('Axial stress'), 'MPa', [['F', t('Axial force in newtons'), 'N', force * 1000],
                    ['A', t('Cross-sectional area'), 'mm²', area]], [0], [1], (f, a) => f / a),
            }),
        repeatNumber(t`The original length is ${length} mm. The bar extends by ${numberText(extension)} mm. Divide the extension by the original length.`,
            original[2].prompt, extension / length, '', `ε = ${numberText(extension)} mm ÷ ${length} mm ≈ ${numberText(extension / length)}.`,
            bar, { symbol: 'ε', tolerance: .00001 }),
        original[3], original[4],
        pick(t`The bar’s working stress is ${numberText(stress)} MPa. The allowable stress for this check is 150 MPa.`, original[5].prompt,
            [['no', t('No')], ['yes', t('Yes')]], stress > 150 ? 'no' : 'yes',
            t`Compare ${numberText(stress)} MPa with the 150 MPa limit.`),
        repeatNumber(t`Keep the ${force} kN force. To find the smallest area, set the working stress equal to the allowable 150 MPa.`,
            original[6].prompt, force * 1000 / 150, 'mm²', `Amin = ${force * 1000} N ÷ (150 N/mm²) = ${numberText(force * 1000 / 150)} mm².`,
            bar, { symbol: 'Amin' }),
    ];
}

function sectionRepeat(n) {
    const scale = 1 + n / 10;
    const wb = 20 + 2 * n, wh = 80 + 8 * n, fb = 100 + 10 * n, fh = wb;
    const a = wb * wh, b = fb * fh, y1 = wh / 2, y2 = wh + fh / 2;
    const centroid = (a * y1 + b * y2) / (a + b);
    const localI = wb * wh ** 3 / 12;
    const inertia = localI + a * (centroid - y1) ** 2 + fb * fh ** 3 / 12 + b * (y2 - centroid) ** 2;
    const original = workshops[6].turns;
    const figure = (record, run) => workshopFigure(teeProgress(run.records[0]?.status ? centroid : undefined, scale));
    const table = steelQ('S', 325 + 20 * n, steelSmall);
    return [
        repeatNumber(t`The web is ${numberText(wb)} × ${numberText(wh)} mm and the flange is ${numberText(fb)} × ${numberText(fh)} mm. Measure both centres up from the bottom, then weight each height by its area.`,
            original[1].prompt, centroid, 'mm',
            `ȳ = (${numberText(a)} × ${numberText(y1)} + ${numberText(b)} × ${numberText(y2)}) ÷ ${numberText(a + b)} ≈ ${numberText(centroid)} mm.`,
            figure, { symbol: 'ȳ', units: original[1].units }),
        repeatNumber(original[2].intro, t('What is the second moment of area of the web about its own centreline?'), localI, 'mm⁴',
            `Iweb = ${numberText(wb)} × ${numberText(wh)}³ ÷ 12 ≈ ${numberText(localI)} mm⁴.`, figure, {
                symbol: 'Iweb', calculation: paperCalculation('Iweb', t('Second moment of area of the web about its own horizontal centreline'), 'mm⁴',
                    [['b', t('Width of the web'), 'mm', wb], ['h', t('Depth of the web'), 'mm', wh]],
                    [0, '× (', 1, ')³'], ['12'], (width, depth) => width * depth ** 3 / 12),
            }),
        repeatNumber(t`The web’s centre is ${numberText(y1)} mm above the bottom and the combined axis is at ${numberText(centroid)} mm.`,
            original[3].prompt, centroid - y1, 'mm', `d = ${numberText(centroid)} − ${numberText(y1)} ≈ ${numberText(centroid - y1)} mm.`, figure, { symbol: 'd' }),
        repeatNumber(t`For each rectangle, add its own bh³/12 and the shift A × d². The flange’s centre is at ${numberText(y2)} mm. Measure its distance to the same combined axis.`,
            original[4].prompt, inertia, 'mm⁴',
            `Iₓ = (${numberText(wb)} × ${numberText(wh)}³ ÷ 12) + ${numberText(a)} × ${numberText(centroid - y1)}² + (${numberText(fb)} × ${numberText(fh)}³ ÷ 12) + ${numberText(b)} × ${numberText(y2 - centroid)}² ≈ ${numberText(inertia)} mm⁴.`,
            figure, { symbol: 'Iₓ', units: original[4].units }),
        repeatNumber(t`The combined Iₓ is about ${numberText(inertia)} mm⁴. The bottom edge is farther from the axis and sets c = ${numberText(centroid)} mm.`,
            original[5].prompt, inertia / centroid, 'mm³', `Sₓ = Iₓ ÷ c ≈ ${numberText(inertia / centroid)} mm³.`, figure, { symbol: 'Sₓ' }),
        repeatProblem(table, methods.steel.steps[0], { figure: () => workshopFigure(steelTable(table.rows)), newExample: true }),
    ];
}

function columnRepeat(n) {
    const E = 200000, I = 600000 + 60000 * n, L = 3000 + 100 * n, A = 2000 + 100 * n;
    const load = Math.PI ** 2 * E * I / L ** 2 / 1000;
    const radius = Math.sqrt(I / A);
    const original = workshops[7].turns;
    const pinned = () => workshopFigure(plates.column());
    return [
        ...original.slice(0, 2),
        repeatNumber(t`Both ends are pinned, so K = 1. The column has E = ${E} N/mm², I = ${I} mm⁴ and physical length L = ${L} mm.`,
            original[2].prompt, load, 'kN', `Pcr = π² × ${E} × ${I} ÷ ${L}² ≈ ${numberText(load * 1000)} N = ${numberText(load)} kN.`,
            pinned, {
                symbol: 'Pcr', units: original[2].units,
                calculation: { ...eulerCalculation, inputs: eulerCalculation.inputs.map(([symbol, label, unit], i) => [symbol, label, unit, [E, I, 1, L][i]]) },
            }),
        { ...original[3], prompt: t('What factor multiplies the original buckling load?'), figure: () => workshopFigure(restraintPair(['pin-pin', 'fixed-free'])) },
        repeatNumber(original[4].intro, original[4].prompt, load / 4, 'kN', `(${numberText(load)} kN) × (1 ÷ 2)² ≈ ${numberText(load / 4)} kN.`,
            () => workshopFigure(restraintPair(['pin-pin', 'fixed-free'])), { symbol: 'Pcr' }),
        repeatNumber(t`At the weaker axis, I = ${I} mm⁴ and the cross-sectional area A = ${A} mm². Use r = √(I/A).`,
            original[5].prompt, radius, 'mm', `r = √(${I} ÷ ${A}) ≈ ${numberText(radius)} mm.`, pinned, { symbol: 'r', units: original[5].units }),
        repeatNumber(t`Return to the pin-ended column. Its effective length KL is ${L} mm and the radius r is ${numberText(radius)} mm.`,
            original[6].prompt, L / radius, '', `KL/r ≈ ${numberText(L / radius)}.`, pinned, { symbol: 'KL/r', units: original[6].units }),
        original[7],
    ];
}

function trussRepeat(n) {
    const load = 34 + 8 * n, reaction = load / 2;
    const diagonal = -reaction / Math.sin(Math.PI / 4);
    const whole = record => workshopFigure(triangularFbd(load, Boolean(record.status)));
    const joint = record => workshopFigure(apexJointPlate(load, 45, Boolean(record.status)));
    const original = workshops[8].turns;
    return [
        { ...original[0], figure: whole },
        repeatNumber(t`The ${load} kN load acts down at the centre of this symmetric truss. A is a pin and B is a roller. The two vertical reactions split the load.`,
            t('Find the upward reaction at B.'), reaction, 'kN', `Bᵧ = ${load} kN ÷ 2 = ${reaction} kN.`, whole, { symbol: 'Bᵧ', skill: 'reactions' }),
        pick(t('At the top joint C, the applied load is known. The only unknowns are the two diagonal forces.'),
            t('How many force equations are available at this joint?'), [['two', '2'], ['three', '3']], 'two',
            t('Use one horizontal and one vertical force equation. All the arrows go through the joint.'), { figure: joint }),
        { ...projection(t('The diagonal is at 45° from the horizontal. Identify the component that balances the downward load.'), 'vertical', false, undefined), figure: joint },
        repeatNumber(t`Both diagonal forces are equal by symmetry. Under the tension assumption they pull down from C. Their combined vertical components must balance the ${load} kN downward load.`,
            t('Find the signed force in diagonal AC. Take tension as positive.'), diagonal, 'kN',
            t`From vertical balance, 2F sin 45° = −${load} kN. F ≈ ${numberText(diagonal)} kN, so the diagonals are in compression.`, joint, {
                symbol: 'AC', calculation: paperCalculation('AC', t('Signed force in each diagonal'), 'kN',
                    [['P', t('Downward load magnitude'), 'kN', load], ['θ', t('Diagonal angle from horizontal'), '°', 45]], ['−', 0],
                    ['2 × sin(', 1, ')'], (p, angle) => -p / (2 * Math.sin(angle * Math.PI / 180))),
            }),
        repeatNumber(t`At the left support A, compressed AC pushes left by ${reaction} kN. There is no horizontal support force. The bottom chord AB must balance that push.`,
            t('Find the signed force in the horizontal chord AB. Take tension as positive.'), reaction, 'kN',
            t`AB pulls right with ${reaction} kN. The positive sign means tension.`, whole, { symbol: 'AB' }),
        original.at(-1),
    ];
}

function mathRepeat(n) {
    const run = 4 + 4 * n, rise = 3 + 3 * n, diagonal = Math.hypot(run, rise);
    const original = workshops[10].turns;
    const brace = (_, progress) => workshopFigure(rightTrianglePlate({ run, rise, unit: 'm', diagonal: progress.records[2]?.status ? diagonal : undefined }),
        workshopDrawings.triangle().points);
    const x = 5 + n, right = 3 * x + 4;
    return [
        repeatNumber(t`The brace has a horizontal run of ${run} m and a vertical rise of ${rise} m. Use 1,000 mm for every metre.`,
            t('Write the horizontal run in millimetres.'), run * 1000, 'mm', `${run} m × 1,000 mm/m = ${run * 1000} mm.`, brace, { symbol: 'b', units: original[0].units }),
        { ...original[1], figure: brace },
        repeatNumber(original[2].intro, original[2].prompt, diagonal, 'm', `L = √(${run}² + ${rise}²) = ${numberText(diagonal)} m.`, brace,
            { symbol: 'L', calculation: paperCalculation('L', t('Length of the diagonal'), 'm',
                [['b', t('Horizontal run'), 'm', run], ['h', t('Vertical rise'), 'm', rise]], ['√((', 0, ')² + (', 1, ')²)'], null, Math.hypot) }),
        pick(original[3].intro, original[3].prompt,
            [['rise-run', `${rise} ÷ ${run}`], ['run-rise', `${run} ÷ ${rise}`], ['rise-brace', `${rise} ÷ ${diagonal}`]],
            'rise-run', t('Tangent compares the opposite leg with the adjacent leg.'), { skill: 'trig', figure: brace }),
        { ...original[4], figure: brace },
        repeatNumber(t`The original equation is 3x + 4 = ${right}. Undo the addition on both sides, then undo multiplication.`,
            original[5].prompt, x, '', `3x = ${right} − 4 = ${3 * x}. x = ${x}.`, () => workshopDrawings['balance-equation'](), {
                symbol: 'x', newExample: true, algebra: [
                    [`3x + 4 = ${right}`, original[5].algebra[0][1]],
                    [`3x + 4 − 4 = ${right} − 4`, original[5].algebra[1][1]],
                    [`3x = ${3 * x}`, t('The added and subtracted 4 cancel on the left.')],
                    [`3x ÷ 3 = ${3 * x} ÷ 3`, original[5].algebra[3][1]],
                    [`x = ${x}`, t('Put the result back into the original equation to check it.')],
                ],
            }),
    ];
}
