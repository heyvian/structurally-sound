const finalWorkshopTitles = {
    'final-forces': t('Resolve forces across two joints'),
    'final-axial': t('Axial tension at yield'),
    'final-bearing': t('Compression and soil bearing'),
    'final-beam': t('Overhang beam and steel section'),
    'final-truss': t('Truss with mixed loads'),
};
const fullFinalTitle = t('Full final practice exam');

const finalTheoryCards = ['equilibrium','dead-live','load-arrows','period','resonance','force-vector','force-components',
    'strength-stiffness','strain-sign','mass-centroid','area-inertia','buckling','components','sine-law','beam-system',
    'axial-yield','bearing-pressure','pressure-conversion','jumps','zero-shear-distance','moment-area','peak-moment',
    'yield-modulus','steel-table','truss-start','truss-sign','zero-collinear'];

function finalTheoryQuestions() {
    const question = (id, prompt, options) => ({ ...Q(prompt, options, 0, theoryCards.get(id).answer),
        key: 'final-theory-' + id, topic: t('Theory flashcards') });
    return [
        question('equilibrium', t('Which sums must be zero for a body in planar static equilibrium?'),
            ['ΣFₓ, ΣFᵧ, ΣM', 'ΣFₓ, ΣFᵧ', 'ΣM']),
        question('dead-live', t('Which pair lists a dead load first and a live load second?'),
            [t('Fixed slab, then occupants'), t('Occupants, then fixed slab'), t('Movable chairs, then a fixed wall')]),
        question('load-arrows', t('How would you draw a uniform beam load and an applied couple?'),
            [t('A row of arrows and a curved arrow'), t('Two curved arrows'), t('Two horizontal arrows')]),
        question('resonance', t('A structure’s natural period is 0.5 s. Which repeated loading is closest to resonance?'),
            ['2 Hz', '0.5 Hz', '5 Hz']),
        question('force-vector', t('What does a force arrow show at its tail?'),
            [t('The point of application'), t('The force magnitude'), t('The sense of rotation')]),
        question('strength-stiffness', t('Two brackets resist the same load. One deflects less. Which property does that directly show?'),
            [t('Greater stiffness'), t('Greater strength'), t('Greater strain')]),
        question('strain-sign', t('A bar shortens. What sign and units does its normal strain have?'),
            [t('Negative and dimensionless'), t('Positive and in mm'), t('Negative and in MPa')]),
        question('mass-centroid', t('For a section made from one uniform material, what coincides with the area centroid?'),
            [t('The centre of mass'), t('The farthest edge'), t('The bottom datum')]),
        question('area-inertia', t('Which property measures how a section’s area is spread about an axis?'),
            [t('Second moment of area'), t('Axial strain'), t('Effective length')]),
        question('buckling', t('A long compressed column suddenly bends sideways. What happened?'),
            [t('Buckling'), t('Resonance'), t('Uniform axial yield')]),
    ].map((problem, i) => {
        const offset = i % problem.opts.length;
        return { ...problem, opts: [...problem.opts.slice(offset), ...problem.opts.slice(0, offset)],
            answer: (problem.opts.length - offset) % problem.opts.length,
            ...(i === 3 ? { explain: 'f = 1 ÷ T = 1 ÷ 0.5 s = 2 Hz. ' + problem.explain, fig: 'vibration' } : {}) };
    });
}

function linkedForceModel(scale, slope) {
    const across = 5;
    const left = 15 * scale, right = 20 * scale;
    const AB = 25 * scale;
    const angle = Math.atan2(slope, across) * 180 / Math.PI;
    const forces = { AB, BC: AB * Math.hypot(slope, across) / slope, BD: -AB * across / slope };
    return {
        finalLink: true, members: ['AB', 'BC', 'BD'],
        nodes: { A: [0, 0], B: [0, 4], C: [-across, 4 + slope], D: [-across, 4] },
        external: { A: [{ name: 'P₁', dx: -.8, dy: -.6, value: left }, { name: 'P₂', dx: .6, dy: -.8, value: right }] },
        left, right, angle, forces,
    };
}

function linkedForceFrame(model, known) {
    const p = Object.fromEntries(Object.entries(model.nodes).map(([name, [x, y]]) => [name, [264 + 18 * x, 173 - 18 * y]]));
    return workshopFigure(plate(t('Connected joints A and B with two applied pulls'), `
        ${model.members.map(id => `<path class="truss-quiz-member" d="M${p[id[0]].join(' ')}L${p[id[1]].join(' ')}"/>`).join('')}
        <path class="diagram-arrow" d="M260 176L200 221M267 177L303 225"/>
        <text x="40" y="227">P₁ = ${numberText(model.left)} kN</text><text x="320" y="228">P₂ = ${numberText(model.right)} kN</text>
        <path class="section-measure section-link" d="M264 178V226"/>
        <text x="204" y="199">53.13°</text><text x="276" y="201">36.87°</text>
        <path class="section-measure section-link" d="M234 101A30 30 0 0 1 ${264-30*Math.cos(model.angle*Math.PI/180)} ${101-30*Math.sin(model.angle*Math.PI/180)}"/>
        <text x="190" y="93">${numberText(model.angle)}°</text>
        ${Object.entries(p).map(([id,[x,y]]) => `<circle class="truss-quiz-node" cx="${x}" cy="${y}" r="4"/>
            <text x="${x+7}" y="${y-6}">${id}</text>`).join('')}
        ${Number.isFinite(known.AB) ? `<text x="276" y="136">AB = ${numberText(known.AB)} kN · T</text>` : ''}`, 248));
}

function linkedForceTasks(model) {
    const { left, right, angle, forces } = model;
    const n = numberText;
    const theta = n(angle);
    const nt = (key, value, prompt, explain, intro, detail = {}) =>
        ({ ...N(prompt, value, explain, '', 'kN'), intro, trussQuiz: { model, key, ...detail }, setup: detail.joint ? memberSign : '' });
    return [
        nt('sum-x', 0, t('What is the signed horizontal sum of the applied pulls at A?'),
            `ΣFₓ ≈ (${n(right)} kN)sin 36.87° − (${n(left)} kN)sin 53.13° = 0 kN.`,
            t('Start with A. Both given angles are measured from the vertical. The horizontal legs are opposite those angles. Assign right positive and left negative.'), { joint: 'A', axis: 'x' }),
        nt('AB', forces.AB, t('What is the signed force in AB?'),
            `ΣFᵧ = AB − (${n(right)} kN)cos 36.87° − (${n(left)} kN)cos 53.13° = 0. AB = +${n(forces.AB)} kN · ${t('Tension')}.`,
            t('Still at A, both applied pulls have downward vertical components. The assumed pull of AB points up. Use cosine for the legs next to the angles.'), { joint: 'A', axis: 'y' }),
        nt('BC', forces.BC, t('What is the signed force in BC?'),
            `ΣFᵧ = BC sin ${theta}° − ${n(forces.AB)} kN = 0. BC ≈ +${n(forces.BC)} kN · ${t('Tension')}.`,
            t('Move to B. The same tensile AB now pulls down. The new angle for BC is measured from horizontal, so its vertical leg uses sine. BD lies along the horizontal.'), { joint: 'B', member: 'BC', projection: true, axis: 'y', known: ['AB'], angle }),
        nt('BD', forces.BD, t('What is the signed force in BD?'),
            `ΣFₓ = −BC cos ${theta}° − BD = 0. BD ≈ ${n(forces.BD)} kN · ${t('Compression')}.`,
            t('Stay at B. The horizontal part of BC pulls left. The assumed pull of BD also points left. A negative value reverses the assumed arrow.'), { joint: 'B', member: 'BC', projection: true, axis: 'x', known: ['AB','BC'], angle }),
    ];
}

function axialFinalTasks(variant) {
    const [side, blocks, weight, live, width, capacity] = [
        [2.4, 8, .75, 42, 32, 500],
        [2.6, 7, .65, 35, 31, 450],
        [2.8, 9, .8, 47, 35, 425],
    ][variant];
    const area = (side * 10) ** 2;
    const yieldStress = 250;
    const load = yieldStress * area / 1000;
    const total = blocks * weight + live;
    const pressure = total / width ** 2;
    const kPa = pressure * 1e4;
    const n = numberText;
    const tension = t`A square A36 steel tension bar is ${n(side)} cm on each side. Use first yield at 250 MPa and assume uniform axial stress.`;
    const bearing = t`A square column is stacked from ${blocks} blocks, each weighing ${n(weight)} kN. It carries an additional ${n(live)} kN live load. Its square base measures ${width} cm on each side. The stated soil bearing capacity is ${capacity} kPa.`;
    const axialCalculation = paperCalculation('P', t('Tensile force'), 'kN', [['σᵧ', t('Yield stress'), 'N/mm²', yieldStress],
        ['A', t('Cross-sectional area'), 'mm²', area]], [0, '×', 1], null, (stress, section) => stress * section / 1000);
    axialCalculation.paper.conversion = '÷ (1,000 N/kN)';
    const question = (prompt, expected, unit, explain, setup, figure) => ({
        ...N(prompt, expected, explain, '', unit), setup, method: 'axialStress', finalDiagram: figure,
        ...(unit === 'kN/cm²' ? { tolerance: .00005 } : {}),
    });
    return [
        question(t('What is the bar’s cross-sectional area in mm²?'), area, 'mm²',
            `(${n(side * 10)} mm)² = ${n(area)} mm².`, tension, 'rectangle-section'),
        { ...question(t('What tensile load causes first yield? Give the result in kN.'), load, 'kN',
            `P = σA = (250 N/mm²)(${n(area)} mm²) = ${n(load * 1000)} N = ${n(load)} kN.`, tension, 'bar'),
            calculation: axialCalculation },
        question(t('What total vertical load reaches the column base?'), total, 'kN',
            `P = (${blocks} × ${n(weight)} kN) + ${live} kN = ${n(total)} kN.`, bearing, 'bearing'),
        question(t('What is the average compression stress at the base in kN/cm²? Give at least four decimal places.'), pressure, 'kN/cm²',
            `σ = (${n(total)} kN) ÷ (${width} cm × ${width} cm) ≈ ${pressure.toFixed(6).replace('.', locale === 'en' ? '.' : ',')} kN/cm².`,
            bearing, 'bearing'),
        { ...question(t('Express the same bearing pressure in kPa.'), kPa, 'kPa',
            `σ = (${n(total)} kN) ÷ (${n(width / 100)} m)² ≈ ${n(kPa)} kN/m² = ${n(kPa)} kPa.`, bearing, 'bearing'),
            calculation: paperCalculation('σ', t('Average soil pressure'), 'kPa', [['P', t('Total load'), 'kN', total],
                ['b', t('Side of the square base'), 'm', width / 100]], [0], ['(', 1, ')²'], (force, side) => force / side ** 2) },
        { ...Q(t('Does the average pressure exceed the stated bearing capacity?'), [t('Yes'), t('No')],
            Number(kPa <= capacity), t('Compare both values in kPa. A check of average bearing pressure alone does not predict settlement.')),
            setup: bearing, finalDiagram: 'bearing' },
    ];
}

function finalTopicFigure(name) {
    if (name === 'bearing') return plate(t('A loaded column transfers force through its square base to soil'), `
        <path class="diagram-fill" d="M199 62H261V127H199Z"/><path class="diagram-line" d="M199 83H261M199 105H261M106 130H354"/>
        <path class="diagram-dash" d="M106 144H354M139 157H321"/>
        <path class="diagram-arrow" d="M230 26V55"/><text x="239" y="36">P</text>
        <path class="section-measure" d="M199 162H261m0 -4v8M199 158v8"/>
        <text x="230" y="177" text-anchor="middle">b</text><text x="268" y="121">A = b²</text>`, 187);
    return conceptPlate(name);
}

function finalBeamTasks(beam) {
    const model = analyze(beam);
    const { RA, RB, Vmax, Mmax } = model;
    const [right, left, shear, moment, maxShear, maxMoment] = beamQs(beam);
    const { s, e, w } = beam.udls[0];
    const total = w * (e - s), resultant = (s + e) / 2;
    const crossing = model.ms.find(({ x }) => !model.vs.some(s => Math.abs(s.x - x) < 1e-8)).x;
    const start = beam.points.at(-1).x;
    const sRequired = Mmax * 1000 / 250;
    const n = numberText;
    const ordinates = model.vs.map(({ v }) => v);
    const [minV, maxV] = [Math.min(...ordinates), Math.max(...ordinates)];
    const rows = [
        ...steelProfiles.filter(([name]) => ['W200×42','W200×59','W360×64'].includes(name)),
        ['W310×52', 52, '—', 747],
    ];
    const numeric = (prompt, value, unit, explain, intro) =>
        ({ ...N(prompt, value, explain, '', unit), b: beam, intro });
    const solved = turn => ({ ...turn, b: beam, finalReactions: { RA, RB } });
    const shearDrawing = { ...shear, stations: [...shear.stations, { x: crossing, v: 0 }].sort((a, b) => a.x - b.x) };
    shearDrawing.answer = shearDrawing.stations.map(({ v }) => v);
    return [
        numeric(t('What is the signed horizontal reaction Aₓ?'), 0, 'kN', 'ΣFₓ = Aₓ = 0 kN.',
            t('Start with the whole beam. A is a pin and B is a roller on level ground. All applied loads are vertical.')),
        numeric(t('What equivalent force replaces the full uniform load for the reaction equations?'), total, 'kN',
            `W = (${n(w)} kN/m)(${n(e-s)} m) = ${n(total)} kN.`,
            t('Use the area of the load rectangle. The point loads stay separate.')),
        numeric(t('How far to the right of A does the uniform load resultant act?'), resultant - beam.a, 'm',
            `d = ${n(resultant)} m − ${n(beam.a)} m = ${n(resultant - beam.a)} m.`,
            t('Locate the middle of the loaded beam, then measure from A. The beam extends to the left of A.')),
        { ...right, intro: t('Take counterclockwise moments about A as positive. The left-tip force turns the beam the opposite way from the loads to the right of A.') },
        { ...left, intro: t('The two upward reactions must balance the two downward point loads and the distributed load. Use vertical equilibrium.') },
        solved(numeric(t('At what x-coordinate does the shear reach zero after the last point load?'), crossing, 'm',
            `V(${n(start)}⁺) = +${n(model.V(start, true))} kN. d = ${n(model.V(start, true))} kN ÷ (${n(w)} kN/m). x = ${n(start)} m + d = ${n(crossing)} m.`,
            t('Find the shear just after the interior point-load jump. The uniform load then takes away w kilonewtons per metre. First find the local distance and then add the beam coordinate.'))),
        solved({ ...shearDrawing, intro: t('Draw the shear from just outside the left end. Vertical forces cause jumps. The uniform load gives every segment between jumps the same downward slope.') }),
        solved(numeric(t('What is the signed bending moment at A?'), model.M(beam.a), 'kN·m',
            `M(A) = 0 + ${n(beam.a)} m × [${n(model.V(0, true))} kN + (${n(model.V(beam.a, false))} kN)]/2 = ${n(model.M(beam.a))} kN·m.`,
            t('Start at zero at the free left tip. The shear over the overhang forms a negative trapezoid. Its area sets the moment at the interior support.'))),
        solved({ ...moment, positiveMomentUp: true, intro: t('Plot positive moment above zero for this example. Add signed areas between your shear stations. A point force changes the slope of moment. There is no applied couple here, so the moment stays continuous.') }),
        solved({ ...maxShear, work: [`max |V| = max(|${n(minV)}|, ${n(maxV)}) kN = ${n(Vmax)} kN.`],
            intro: t('Compare the magnitude of the largest upward and downward ordinates. Check both sides of the support and point-load jumps.') }),
        solved({ ...maxMoment, work: [`M(A) = ${n(model.M(beam.a))} kN·m. M(x = ${n(crossing)} m) = ${n(model.M(crossing))} kN·m.`],
            intro: t('Compare the hogging moment at the interior support with the sagging peak at zero shear. Use the larger magnitude.') }),
        solved(numeric(t('At first yield, what section modulus Sₓ is required in cm³?'), sRequired, 'cm³',
            `Sₓ = (${n(Mmax)} × 10⁶ N·mm) ÷ (250 N/mm²) = ${n(sRequired * 1000)} mm³ = ${n(sRequired)} cm³.`,
            t('Use 250 MPa as the bending limit for this yield-based exercise. Convert kN·m to N·mm first, then convert mm³ to cm³.'))),
        { ...steelQ('S', sRequired, rows), intro: t('Each table entry for Sₓ is in thousands of mm³, the same size as one cm³. Filter by Sₓ before comparing member masses.') },
    ];
}

function mixedFinalTruss(width, lower, upper, push, topLoad, sideLoad) {
    const depth = lower + upper;
    const By = (push * depth + sideLoad * width) / width;
    const Ay = topLoad + sideLoad - By;
    const ced = push * upper / width;
    return {
        mixed: true, width, bay: lower, upper, depth, load: push, topLoad, sideLoad, ced,
        nodes: { A: [0,0], B: [width,0], C: [0,lower], D: [width,lower], E: [0,depth] },
        external: {
            A: [{ name:'Aₓ', dx:1, dy:0 }, { name:'Aᵧ', dx:0, dy:1 }],
            B: [{ name:'Bᵧ', dx:0, dy:1 }],
            E: [{ name:'Pₓ', dx:1, dy:0, value:push }, { name:'Pᵧ', dx:0, dy:1, value:-topLoad }],
            D: [{ name:'Pᴅ', dx:0, dy:1, value:-sideLoad }],
        },
        forces: { Aₓ:-push, Aᵧ:Ay, Bᵧ:By, ED:-push * Math.hypot(width,upper) / width,
            CE:ced-topLoad, CD:push, BD:-ced-sideLoad, AB:push, AC:-Ay, BC:-push*Math.hypot(width,lower)/width },
    };
}

function mixedTrussTasks(model) {
    const { load, topLoad, sideLoad, width, bay, upper, depth, ced, forces } = model;
    const n = numberText;
    const thetaE = Math.atan2(upper, width) * 180 / Math.PI;
    const thetaB = Math.atan2(bay, width) * 180 / Math.PI;
    const tasks = [];
    const add = (key, prompt, intro, equation, detail = {}) => {
        const known = tasks.map(turn => turn.trussQuiz.key);
        const value = forces[key];
        const classification = detail.joint ? ` · ${value < 0 ? t('Compression') : t('Tension')}` : '';
        tasks.push({ ...N(prompt, value, `${equation} ${key} = ${value > 0 ? '+' : ''}${n(value)} kN${classification}.`,
            intro, 'kN'), intro, setup: detail.joint ? memberSign : '',
            trussQuiz: { model, key, known, ...detail } });
    };
    add('Aₓ', t('What is the signed horizontal reaction Aₓ?'),
        t('Start with the whole truss. Take right and up as positive. Only the pin can balance the horizontal push at E.'),
        `ΣFₓ = Aₓ + ${n(load)} kN = 0.`, { phase:'supports' });
    add('Bᵧ', t('Find Bᵧ with up as positive.'),
        t('Take moments about A. The horizontal push at E uses a vertical arm. The vertical load at E passes through A. The vertical load at D uses the horizontal arm.'),
        `ΣMₐ = (${width} m)Bᵧ − (${load} kN)(${depth} m) − (${sideLoad} kN)(${width} m) = 0.`, { phase:'moment' });
    add('Aᵧ', t('Find Aᵧ with up as positive.'),
        t('Vertical equilibrium includes the loads at both E and D. Keep both signs when you add the loads to the support reactions.'),
        `ΣFᵧ = Aᵧ + ${n(forces.Bᵧ)} kN − ${topLoad} kN − ${sideLoad} kN = 0.`, { phase:'supports' });
    add('ED', t('Find signed ED. Positive means tension.'),
        t('Start at E. It has two unknown members. CE is vertical, so only ED can balance the horizontal push. Assume both members pull away from E.'),
        `ΣFₓ = ${load} kN + ED cos(${n(thetaE)}°) = 0.`, { joint:'E', member:'ED', projection:true, axis:'x', angle:thetaE });
    add('CE', t('Find signed CE.'),
        t('Compressed ED pushes up and left at E. Keep the downward applied load as well as the assumed downward pull of CE.'),
        `ΣFᵧ = +${n(ced)} kN − ${topLoad} kN − CE = 0.`, { joint:'E', member:'ED', projection:true, axis:'y', angle:thetaE });
    add('CD', t('Find signed CD.'),
        t('Move to D. Compressed ED now pushes down and right. The applied load at D has no horizontal component.'),
        `ΣFₓ = +${load} kN − CD = 0.`, { joint:'D', member:'ED', projection:true, axis:'x', angle:thetaE });
    add('BD', t('Find signed BD.'),
        t('Stay at D. Both the applied load and the vertical component of ED point down. BD must balance their combined effect.'),
        `ΣFᵧ = −${n(ced)} kN − ${sideLoad} kN − BD = 0.`, { joint:'D', member:'ED', projection:true, axis:'y', angle:thetaE });
    add('AB', t('Find signed force in bottom chord AB, positive for tension.'),
        t('Move to A. The pin pulls left. AB is the only member here with a horizontal component.'),
        `ΣFₓ = ${n(forces.Aₓ)} kN + AB = 0.`, { joint:'A', axis:'x' });
    add('AC', t('Find signed AC.'),
        t('Use the vertical equation at A. The actual direction of the Aᵧ reaction comes from its signed value.'),
        `ΣFᵧ = (${n(forces.Aᵧ)} kN) + AC = 0.`, { joint:'A', axis:'y' });
    add('BC', t('Find signed BC.'),
        t('Only BC remains unknown at B. Use its own slope. The lower diagonal can have a different angle from the upper one.'),
        `ΣFₓ = −${load} kN − BC cos(${n(thetaB)}°) = 0.`, { joint:'B', member:'BC', projection:true, axis:'x', angle:thetaB, recap:true });
    return tasks;
}

function finalWorkshop(key, attempt) {
    const alternate = attempt % 2 === 0;
    const problemSets = {
        'final-forces': () => linkedForceTasks(linkedForceModel(alternate ? .9 : 1, alternate ? 5 : 3)),
        'final-axial': () => axialFinalTasks(Number(alternate)).slice(0,2),
        'final-bearing': () => axialFinalTasks(Number(alternate)).slice(2),
        'final-beam': () => finalBeamTasks(alternate ? repeatFinalBeam : classDrawingBeam),
        'final-truss': () => mixedTrussTasks(alternate ? mixedFinalTruss(7,7,5,56,23,31) : mixedFinalTruss(6,8,4,60,25,35)),
    };
    const topic = { 'final-forces': 1, 'final-axial': 5, 'final-bearing':5, 'final-beam': 4, 'final-truss': 8 }[key];
    const turns = problemSets[key]().map(problem => {
        const intro = (problem.setup && !problem.trussQuiz ? problem.setup + ' ' : '') + (problem.intro || '');
        const figure = problem.rows ? () => workshopFigure(steelTable(problem.rows)) :
            problem.b ? () => {
                const { RA, RB } = analyze(problem.b);
                const values = problem.finalReactions ? { 0:0, 1:RA, 2:RB } : {};
                return workshopFigure(beamFigure(problem.b, [0,1,2], { isolated: true, values }));
            } : problem.finalDiagram ? () => workshopFigure(finalTopicFigure(problem.finalDiagram)) : undefined;
        return repeatProblem(problem, intro, { taDrawing: figure, trussQuiz: problem.trussQuiz,
            tolerance: problem.tolerance, calculation: problem.calculation });
    });
    if (key === 'final-truss') {
        const model = turns[0].trussQuiz.model;
        turns.splice(3, 0, pick(t('With the reactions known, compare the two loaded joints at the top. Each joint gives a horizontal and a vertical equation.'),
            t('Tap E or D to choose a starting joint.'),
            [['E',t('Joint E')],['D',t('Joint D'),t('Three member forces at D are unknown. Solve one of those forces at E first.')]], 'E',
            t('E has two unknown members, ED and CE. The two joint equations can determine them.'),
            { trussQuiz:{ model, phase:'supports' }, hot:['E','D'] }));
        turns.push(num(t('Check C with the forces you already found. AC pulls down, CE acts along the vertical, and the compressed BC contributes an upward component.'),
            t('What is the signed vertical sum at C?'), 0, 'kN',
            `ΣFᵧ = (${numberText(-model.forces.AC)} kN) + (${numberText(model.forces.CE)} kN) + (${numberText(model.load * model.bay / model.width)} kN) = 0 kN.`,
            { trussQuiz: { model, joint:'C', axis:'y', summary:true } }));
    }
    return { topic, title: finalWorkshopTitles[key], turns, drawing: { caption: t('Drawing') },
        outcome: t('Review the worked steps, then test the same skills with different numbers in the full final practice exam.') };
}

const repeatFinalBeam = { L:10, a:3, b:10, points:[{ x:0,p:32 },{ x:7,p:25 }], udls:[{ s:0,e:10,w:18 }] };
const alternateFinalBeam = { L:9, a:3, b:9, points:[{ x:0,p:24 },{ x:6,p:30 }], udls:[{ s:0,e:9,w:16 }] };

function makeFullFinalQuestions() {
    const sections = [
        [t('Theory flashcards'), finalTheoryQuestions()],
        [finalWorkshopTitles['final-forces'], linkedForceTasks(linkedForceModel(.8,4)).slice(1)],
        [t('Axial tension at yield'), axialFinalTasks(2).slice(0,2)],
        [t('Compression and soil bearing'), axialFinalTasks(2).slice(2)],
        [finalWorkshopTitles['final-beam'], finalBeamTasks(alternateFinalBeam)],
        [finalWorkshopTitles['final-truss'], mixedTrussTasks(mixedFinalTruss(8,6,6,48,20,32))],
    ];
    return sections.flatMap(([topic, questions], i) => questions.map((q, j) =>
        ({ ...q, key: q.key || `full-final-${i}-${j}`, topic })));
}

function finalTopicNavigation(topic) {
    const keys = { 1:['final-forces'], 4:['final-beam'], 5:['final-axial','final-bearing'], 8:['final-truss'], 9:['final-beam'] }[topic];
    return keys ? `<nav class="beam-lab-nav" aria-label="${t('Final exam review')}">
        ${keys.map(key => `<a href="#workshop-${key}">${finalWorkshopTitles[key]}</a>`).join('')}
        <a href="#final-review">${t('Final exam review')}</a></nav>` : '';
}
