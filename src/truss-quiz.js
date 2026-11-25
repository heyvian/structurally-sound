const trussQuizTitle = t('Truss quiz walkthrough');
const trussPracticeTitle = t('Truss quiz practice');

function quizTruss(load, width, bay) {
    const diagonal = Math.hypot(width, bay);
    const horizontal = width / diagonal, vertical = bay / diagonal;
    const rise = load * bay / width;
    return {
        load, width, bay, diagonal, horizontal, vertical, rise,
        angle: Math.atan2(bay, width) * 180 / Math.PI,
        nodes: { A: [0, 0], B: [width, 0], C: [0, bay], D: [width, bay], E: [0, 2 * bay] },
        forces: { 'Aₓ': -load, 'Aᵧ': -2 * rise, 'Bᵧ': 2 * rise,
            ED: -load / horizontal, CE: rise, CD: load, BD: -rise, AC: 2 * rise, AB: load, BC: -load / horizontal },
    };
}

function trussQuizWorkshop(attempt) {
    const model = quizTruss(36 + 6 * (attempt - 1), 6, 4);
    const { load, width, bay, rise, forces, angle } = model;
    const n = numberText;
    const turns = [];
    const nStep = (intro, prompt, value, solution, detail = {}, options = {}) => {
        turns.push(num(intro, prompt, value, options.unit ?? 'kN', solution, { ...options, trussQuiz: { model, ...detail } }));
    };
    const pStep = (intro, prompt, choices, correct, solution, detail = {}, options = {}) => {
        turns.push(pick(intro, prompt, choices, correct, solution, { ...options, trussQuiz: { model, ...detail } }));
    };
    const memberStep = (member, joint, axis, intro, prompt, equation, opt = {}) => {
        nStep(intro, prompt, forces[member], `${equation}  ${member} ≈ ${n(forces[member])} kN · ${forces[member] < 0 ? t('Compression') : t('Tension')}.`,
            { key: member, joint, axis, member, projection: opt.projection }, opt);
    };

    pStep(t('First draw the whole truss as one body. A pin at A prevents horizontal and vertical movement. The roller at B supplies only a vertical reaction.'),
        t('Which external reactions belong on the free-body diagram?'),
        [['all', 'Aₓ, Aᵧ, Bᵧ'], ['vertical','Aᵧ, Bᵧ', t('A pin at A also restrains horizontal movement.')],
            ['moment','Aᵧ, Bᵧ, Mₐ', t('The pin lets the truss rotate. It supplies forces without a support moment.')]],
        'all', t('Draw Aₓ, Aᵧ and Bᵧ. Member forces stay inside the full truss and cancel in pairs.'), { phase: 'whole' });

    nStep(t`The arrow at E points right with ${n(load)} kN. To balance it, the only horizontal reaction must point the other way. Take right as positive.`,
        t('With right positive, what is Aₓ?'), forces.Aₓ, `ΣFₓ = Aₓ + ${n(load)} kN = 0. Aₓ = ${n(forces.Aₓ)} kN.`,
        { key: 'Aₓ', phase: 'supports' }, { skill: 'reactions' });
    pStep(t('Taking moments about a point removes forces whose lines of action pass through that point. Both arrows at A pass through A.'),
        t('Tap the pivot that removes both unknown reactions at A.'),
        [['A', t('Joint A')], ['B', t('Joint B'), t('About B, the roller drops out. Use A to remove the two pin reactions.')]],
        'A', t('Both lever arms at A are zero. This leaves the load at E and the reaction at B in the moment equation.'),
        { phase: 'moment' }, { hot: ['A', 'B'] });
    nStep(t('Draw a line along the horizontal force at E. The shortest distance from A to that line is vertical. Use the marked vertical distance.'),
        t('What is the perpendicular arm of the load at E?'), 2 * bay, `d = ${n(bay)} m + ${n(bay)} m = ${n(2 * bay)} m.`,
        { phase: 'moment' }, { unit: 'm', skill: 'reactions' });
    nStep(t('The horizontal load tends to turn the truss clockwise about A. Multiply the force by its perpendicular arm to find the magnitude of that moment.'),
        t('What is the clockwise moment magnitude from the load?'), load * 2 * bay,
        `|Mₐ| = ${n(load)} kN × ${n(2 * bay)} m = ${n(load * 2 * bay)} kN·m.`,
        { phase: 'moment' }, { unit: 'kN·m', skill: 'reactions' });
    nStep(t('An upward force at B makes the opposite turn. Its arm from A is the horizontal support spacing. Divide the load moment by that arm.'),
        t('Find the signed vertical reaction Bᵧ, taking up as positive.'), forces.Bᵧ,
        `Bᵧ × ${n(width)} m − ${n(load * 2 * bay)} kN·m = 0. Bᵧ = +${n(forces.Bᵧ)} kN.`,
        { key: 'Bᵧ', phase: 'moment' }, { skill: 'reactions', calculation: paperCalculation('Bᵧ', t('Vertical reaction at support B'), 'kN',
            [['|Mₐ|', t('Moment magnitude from the point load'), 'kN·m', load * 2 * bay],
                ['L', t('Span between supports'), 'm', width]], [0], [1], (moment, arm) => moment / arm) });
    nStep(t`B pushes up with ${n(forces.Bᵧ)} kN. There is no applied vertical load. A must supply the force that makes the vertical sum zero.`,
        t('Find Aᵧ with up as positive.'), forces.Aᵧ, `ΣFᵧ = Aᵧ + ${n(forces.Bᵧ)} kN = 0. Aᵧ = ${n(forces.Aᵧ)} kN. ${t('The pin must hold down for this idealized load case.')}`,
        { key: 'Aᵧ', phase: 'supports' }, { skill: 'reactions' });

    pStep(t('At a single joint, use one horizontal equation and one vertical equation. Look for at most two unknown member forces. We’ll follow the applied load first.'),
        t('Tap the joint where the load enters the truss.'),
        [['E',t('Joint E')], ['A',t('Joint A'),t('A is also solvable now. To follow the applied load first, go to the joint at the head of the load arrow.')],
            ['D',t('Joint D'),t('Three members at D are still unknown. Start at the applied load.')]],
        'E', t('E has a known load and two unknown member forces, ED and CE. Only ED can balance the load horizontally.'),
        { phase: 'whole' }, { hot: ['E', 'A', 'D'] });
    const horizontalProjection = projection(
        t('Isolate E. Draw each unknown member pulling away from the dot as if it were in tension. The angle on the triangle is measured from the horizontal.'),
        'horizontal', true, 'joint-e');
    turns.push({ ...horizontalProjection, trussQuiz: { model, joint: 'E', axis: 'x', member: 'ED', projection: true, ratioQuiz: true } });
    nStep(t`CE is vertical, so its horizontal component is zero. The load is +${n(load)} kN to the right. Balance it with the horizontal component of ED.`,
        t('What is the signed horizontal component of ED at E?'), -load,
        `ΣFₓ = ${n(load)} kN + EDₓ = 0. EDₓ = −${n(load)} kN.`,
        { joint: 'E', axis: 'x', member: 'ED', projection: true });
    memberStep('ED', 'E', 'x',
        t('The assumed ED arrow goes right. Its horizontal component is ED × cos θ. Divide the signed component you just found by cos θ to get the force along the diagonal.'),
        t('Find signed ED. Positive means tension.'), `ED = −${n(load)} kN ÷ cos(${n(angle)}°).`, {
            projection: true, calculation: paperCalculation('ED', t('Signed force in truss member ED'), 'kN',
                [['EDₓ', t('Signed horizontal force component'), 'kN', -load], ['θ', t('Angle from horizontal'), '°', Number(fmt(angle))]],
                [0], ['cos(', 1, ')'], (component, theta) => component / Math.cos(theta * Math.PI / 180)),
        });
    pStep(t('The result for ED is negative. The arrow you assumed pointed away from E, down and right. Reverse that arrow for the actual force on E.'),
        t('Which way does compressed ED push on E?'),
        [['ul',t('Up and left')], ['dr',t('Down and right'),t('Down and right was the assumed pull. A negative force reverses both components.')]],
        'ul', t('The compressed member pushes on E up and left. Its horizontal component cancels the rightward load.'),
        { joint: 'E', member: 'ED', projection: true });
    turns.push({ ...projection(t('Now balance the vertical forces at E. Use the same marked angle. Match the vertical leg to the marked triangle.'),
        'vertical', false, 'joint-e'), trussQuiz: { model, joint: 'E', axis: 'y', member: 'ED', projection: true, ratioQuiz: true } });
    nStep(t('The actual ED force points up and left. Multiply its magnitude by sin θ to find its upward part. Give the part its own sign using the arrow.'),
        t('What is the signed vertical component of ED at E?'), rise,
        `EDᵧ = +|${n(forces.ED)}| kN × sin(${n(angle)}°) ≈ +${n(rise)} kN.`,
        { joint: 'E', axis: 'y', member: 'ED', projection: true }, { wrong: [[-rise, t('The diagonal is in compression, but its actual arrow at E points up. An upward component is positive.')]] });
    memberStep('CE', 'E', 'y',
        t('CE connects E to the joint below it. An assumed pull on E by CE points down. That downward force must cancel the upward part of ED.'),
        t('Find signed CE.'), `ΣFᵧ = +${n(rise)} kN − CE = 0.`, { projection: true,
            wrong: [[-rise, t('Down is the direction CE acts at E. The signed member force is positive because the assumed tension arrow already points down.')]] });

    pStep(t('Follow ED to its other end. A member has the same signed force at both ends. The force arrows on the two joints point in opposite directions.'),
        t('Tap the other end of ED.'),
        [['D',t('Joint D')], ['C',t('Joint C'),t('CE reaches C. Follow ED from E to D.')], ['B',t('Joint B')]],
        'D', t('At D, compressed ED pushes down and right. Only CD and BD are still unknown at D.'),
        { phase: 'transfer' }, { hot: ['D', 'C', 'B'] });
    memberStep('CD', 'D', 'x', t('ED pushes right at D. The CD tension arrow points left. The vertical BD arrow drops out of the horizontal equation.'),
        t('Find signed CD.'), `ΣFₓ = +${n(load)} kN − CD = 0.`, { projection: true });
    memberStep('BD', 'D', 'y', t('ED pushes down at D. A tension arrow for BD would also point down. A negative BD turns its arrow upward to create balance.'),
        t('Find signed BD.'), `ΣFᵧ = −${n(rise)} kN − BD = 0.`, { projection: true });
    memberStep('AB', 'A', 'x', t('At A, the support reaction Aₓ points left. The assumed pull along AB points right. AC is vertical and has zero horizontal component.'),
        t('Find signed force in bottom chord AB, positive for tension.'), `ΣFₓ = −${n(load)} kN + AB = 0.`);
    memberStep('AC', 'A', 'y', t('Stay at A. The support reaction Aᵧ points down. Only the assumed upward AC force can balance it vertically.'),
        t('Find signed AC.'), `ΣFᵧ = ${n(forces.Aᵧ)} kN + AC = 0.`);
    memberStep('BC', 'B', 'x', t('At B, the known AB force pulls left. An assumed tension arrow along BC also points left, giving −BC cos θ. Solve with that minus sign in the equation.'),
        t('Find signed BC.'), `ΣFₓ = −${n(load)} kN − BC cos(${n(angle)}°) = 0.`, { projection: true });
    nStep(t('Check the last joint C using forces you already found. In the horizontal column, CD pulls right and compressed BC pushes left.'),
        t('What is the signed horizontal sum at C?'), 0, `ΣFₓ = +${n(load)} kN − ${n(load)} kN = 0.`,
        { joint: 'C', axis: 'x', member: 'BC', projection: true });
    nStep(t('Check the vertical column at the same joint. AC pulls down. CE pulls up and compressed BC pushes up.'),
        t('What is the signed vertical sum at C?'), 0, `ΣFᵧ = −${n(2 * rise)} kN + ${n(rise)} kN + ${n(rise)} kN = 0.`,
        { joint: 'C', axis: 'y', member: 'BC', projection: true });
    pStep(t('Look at an unloaded joint with two bars that do not share a line. If either bar pulls or pushes, part of its force is perpendicular to the other bar. There is nothing to balance that part.'),
        t('What are the two member forces at this unloaded joint?'),
        [['zero', t('Both zero')], ['one', t('Only one is zero'), t('Each bar is alone in a direction perpendicular to the other. Both forces must vanish.')]],
        'zero', t('Both forces must be zero here. First check for an applied load or a support reaction before using this shortcut.'), { phase: 'zero-two' });
    turns.push({ ...workshops[8].turns.at(-1), trussQuiz: { model, phase: 'zero-three' } });

    return { title: trussQuizTitle, topic: 8, drawing: { caption: t('Truss analysis') },
        outcome: t('Solve external reactions before cutting. Choose a joint with a known force and at most two independent unknowns. Assume tension, keep the signs, and check a later joint in both directions.'),
        refs: workshops[8].refs, turns };
}

function makeTrussQuizPractice() {
    const model = quizTruss(28, 8, 6);
    const { forces, load, width, bay, horizontal, rise } = model;
    const n = numberText;
    const nQuestion = (key, answer, prompt, solution, hint, detail = {}) => ({
        ...N(prompt, answer, solution, hint, 'kN'), key: 'truss-quiz-' + key,
        method: detail.joint ? 'trussJoint' : 'reactions', topic: t('Truss analysis'),
        trussQuiz: { model, key, ...detail },
        setup: detail.joint ? memberSign : '',
    });
    return [
        nQuestion('Aₓ', forces.Aₓ, t('Find the signed horizontal reaction at A (right positive).'),
            `Aₓ + ${n(load)} kN = 0. Aₓ = ${n(forces.Aₓ)} kN.`, t('Only the pin can resist horizontal load.'), { phase: 'supports' }),
        nQuestion('Bᵧ', forces.Bᵧ, t('Find the signed vertical reaction Bᵧ, taking up as positive.'),
            `(${n(width)} m) Bᵧ − (${n(load)} kN)(${n(2 * bay)} m) = 0. Bᵧ = +${n(forces.Bᵧ)} kN.`, t('Take moments around A.'), { phase: 'moment' }),
        nQuestion('Aᵧ', forces.Aᵧ, t('Find Aᵧ with up as positive.'),
            `Aᵧ + ${n(forces.Bᵧ)} kN = 0. Aᵧ = ${n(forces.Aᵧ)} kN.`, t('No external vertical load.'), { phase: 'supports' }),
        nQuestion('ED', forces.ED, t('Start at E. Calculate signed member ED (tension positive).'),
            `${n(load)} kN + ${n(horizontal)} ED = 0. ED = ${n(forces.ED)} kN.`, t('Assume ED pulls down/right from E.'),
            { joint: 'E', member: 'ED', projection: true, known: [] }),
        nQuestion('CE', forces.CE, t('Find signed CE.'),
            `ΣFᵧ = +${n(rise)} kN − CE = 0. CE = +${n(forces.CE)} kN.`, t('Vertical equilibrium at E.'),
            { joint: 'E', member: 'ED', projection: true, known: ['ED'] }),
        nQuestion('CD', forces.CD, t('Find signed CD.'),
            `ΣFₓ = ${n(load)} kN − CD = 0. CD = +${n(forces.CD)} kN.`, t('Use horizontal equilibrium.'),
            { joint: 'D', member: 'ED', projection: true, known: ['ED'] }),
        nQuestion('BD', forces.BD, t('Find signed BD.'),
            `ΣFᵧ = −${n(rise)} kN − BD = 0. BD = ${n(forces.BD)} kN.`, t('Vertical equilibrium.'),
            { joint: 'D', member: 'ED', projection: true, known: ['ED','CD'] }),
        nQuestion('AB', forces.AB, t('Find signed force in bottom chord AB, positive for tension.'),
            `ΣFₓ = ${n(forces.Aₓ)} kN + AB = 0. AB = +${n(forces.AB)} kN.`, t('Horizontal equilibrium at A.'),
            { joint: 'A', known: ['Aₓ','Aᵧ'] }),
        nQuestion('AC', forces.AC, t('Find signed AC.'),
            `ΣFᵧ = ${n(forces.Aᵧ)} kN + AC = 0. AC = +${n(forces.AC)} kN.`, t('Vertical equilibrium.'),
            { joint: 'A', known: ['Aₓ','Aᵧ','AB'] }),
        nQuestion('BC', forces.BC, t('Find signed BC.'),
            `ΣFₓ = −${n(load)} kN − ${n(horizontal)} BC = 0. BC = ${n(forces.BC)} kN.`, t('Check both horizontal and vertical equations.'),
            { joint: 'B', member: 'BC', projection: true, known: ['Bᵧ','BD','AB'] }),
    ];
}
