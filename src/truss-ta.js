const trussTaTitle = t('Vertical truss walkthrough');
const trussTaPracticeTitle = t('Vertical truss practice');
const trussWorkshopTitles = { 'truss-ta': trussTaTitle, 'truss-quiz': trussQuizTitle };

function taTruss(left, right, depth, middleLoad, endLoad) {
    const span = left + right;
    const netB = middleLoad * left / span;
    const netA = middleLoad - netB;
    const chord = netB * right / depth;
    return {
        left, right, span, depth, middleLoad, endLoad, netB, netA,
        angleB: Math.atan2(right, depth) * 180 / Math.PI,
        angleC: Math.atan2(depth, left) * 180 / Math.PI,
        nodes: { A: [0, 0], D: [left, 0], B: [span, 0], C: [left, -depth] },
        members: ['AD', 'BD', 'AC', 'BC', 'CD'],
        external: {
            A: [{ name: 'Aₓ', dx: 1, dy: 0 }, { name: 'Aᵧ', dx: 0, dy: 1 }],
            B: [{ name: 'Bᵧ', dx: 0, dy: 1 }, { name: 'Pᵦ', dx: 0, dy: 1, value: -endLoad }],
            D: [{ name: 'Pᴅ', dx: 0, dy: 1, value: -middleLoad }],
        },
        forces: { Aₓ: 0, Aᵧ: netA, Bᵧ: netB + endLoad, AD: -chord, BD: -chord, CD: -middleLoad,
            AC: netA * Math.hypot(left, depth) / depth, BC: netB * Math.hypot(right, depth) / depth },
    };
}

function verticalTrussCalculations(model) {
    const { left, span, middleLoad, endLoad, angleB, angleC, forces } = model;
    const n = numberText;
    const atB = { joint: 'B', member: 'BC', angleAxis: 'y', tipTail: true };
    return {
        'Aₓ': ['ΣFₓ = Aₓ = 0 kN.', { phase: 'supports' }],
        'Bᵧ': [`ΣMₐ = Bᵧ(${n(span)} m) − (${n(middleLoad)} kN)(${n(left)} m) − (${n(endLoad)} kN)(${n(span)} m) = 0. Bᵧ = +${n(forces.Bᵧ)} kN.`, { phase: 'moment' }],
        'Aᵧ': [`ΣFᵧ = Aᵧ + ${n(forces.Bᵧ)} kN − ${n(middleLoad)} kN − ${n(endLoad)} kN = 0. Aᵧ = +${n(forces.Aᵧ)} kN.`, { phase: 'supports' }],
        BC: [`ΣFᵧ = ${n(forces.Bᵧ)} kN − ${n(endLoad)} kN − BC cos(${n(angleB)}°) = 0. BC ≈ ${n(forces.BC)} kN · ${t('Tension')}.`, { ...atB, axis: 'y' }],
        BD: [`ΣFₓ = −BC sin(${n(angleB)}°) − BD = 0. BD = ${n(forces.BD)} kN · ${t('Compression')}.`, { ...atB, axis: 'x' }],
        CD: [`ΣFᵧ = −${n(middleLoad)} kN − CD = 0. CD = ${n(forces.CD)} kN · ${t('Compression')}.`, { joint: 'D', axis: 'y' }],
        AD: [`ΣFₓ = −${n(-forces.BD)} kN − AD = 0. AD = ${n(forces.AD)} kN · ${t('Compression')}.`, { joint: 'D', axis: 'x' }],
        AC: [`ΣFₓ = ${n(-forces.BD)} kN − AC cos(${n(angleC)}°) = 0. AC ≈ ${n(forces.AC)} kN · ${t('Tension')}.`,
            { joint: 'C', axis: 'x', member: 'AC', projection: true, angle: angleC }],
    };
}

function trussTaWorkshop(attempt) {
    const model = taTruss(3, 5, 4, 24 + 8 * (attempt - 1), 8);
    const { endLoad, netA, angleB, forces } = model;
    const equations = verticalTrussCalculations(model);
    const n = numberText;
    const turns = [];
    const choose = (intro, prompt, choices, correct, solution, detail = {}, options = {}) => {
        turns.push(pick(intro, prompt, choices, correct, solution, { ...options, trussQuiz: { model, ...detail } }));
    };
    const calculate = (key, intro, prompt, options = {}) => {
        const [solution, detail] = equations[key];
        turns.push(num(intro, prompt, forces[key], 'kN', solution, { ...options, trussQuiz: { model, key, ...detail } }));
    };
    choose(t('Start with the whole truss. The downward arrows are loads at D and B. A is a pin. B is a roller on level ground.'),
        t('Which reactions belong on the whole-truss drawing?'),
        [['all', 'Aₓ, Aᵧ, Bᵧ'], ['two', 'Aᵧ, Bᵧ', t('A pin also restrains horizontal movement. Include Aₓ before checking if it is zero.')]],
        'all', t('Keep the two applied loads and the three reactions. Each member force is internal to the whole truss.'), { phase: 'whole' });
    calculate('Aₓ', t('Look at the whole truss in the horizontal direction. Every applied load is vertical.'), t('What is Aₓ?'));
    choose(t('We have two unknown vertical reactions. Choose a point for the moment equation that makes one of them disappear.'),
        t('Tap the point where Aᵧ has zero lever arm.'),
        [['A', t('Joint A')], ['D', t('Joint D'), t('D removes its own load. A removes Aᵧ because the reaction passes through A.')]],
        'A', t('About A, the two loads turn the truss clockwise and Bᵧ turns it counterclockwise. Their moment arms are horizontal.'), { phase: 'moment' }, { hot: ['A', 'D'] });
    calculate('Bᵧ', t('Take counterclockwise as positive. The load at B and Bᵧ have the same arm from A. Keep them as separate terms.'),
        t('Find Bᵧ with up as positive.'), { skill: 'reactions', units: t('A moment in kN·m divided by an arm in m gives a reaction in kN.') });
    calculate('Aᵧ', t('Go back to vertical balance on the whole truss. Add the upward reactions and subtract both downward loads.'),
        t('Find Aᵧ with up as positive.'), { skill: 'reactions' });
    choose(t('Now isolate one joint. A joint gives you two equations, one for x and one for y. Look for a known load or reaction and at most two unknown member forces. We’ll start on the right.'),
        t('Tap the right-hand joint where we can start.'),
        [['B', t('Joint B')], ['D', t('Joint D'), t('Three member forces are still unknown at D. Find one of them at B first.')],
            ['A', t('Joint A'), t('A is solvable too. For this walkthrough, start at the right support.')]],
        'B', t('Cut around B. Keep its upward reaction and downward load. Draw dashed pulls away from B along BC and BD to assume tension.'), { phase: 'supports' }, { hot: ['B', 'D', 'A'] });
    choose(t('The diagonal BC is a single force. In the inset, start at the dot, follow the horizontal component, then start the vertical component at its tip. The two components together reach the same endpoint as BC.'),
        t('Which directions make up the assumed pull along BC at B?'),
        [['ld', t('Left, then down')], ['lu', t('Left, then up'), t('BC reaches a joint below B. Follow the vertical component down from the horizontal tip.')]],
        'ld', t('The component arrows end at the diagonal arrowhead. Left and down both enter the equilibrium equations with minus signs.'), equations.BC[1]);
    choose(t('Find θ in the tip-to-tail triangle. Here it is measured from the vertical leg. The vertical component touches θ and the horizontal component is across from it.'),
        t('Which ratio gives the vertical component of BC?'),
        [['cos', 'cos θ'], ['sin', 'sin θ', t('Sine gives the leg opposite θ, which is horizontal in this drawing.')]],
        'cos', t('CAH means cosine = adjacent ÷ hypotenuse. Multiply BC by cos θ for the vertical magnitude. Its assumed arrow points down.'),
        { ...equations.BC[1], ratioQuiz: true }, { skill: 'trig' });
    calculate('BC', t('Use only the vertical column at B. Subtract the applied load from the upward reaction. The downward component of BC must balance what remains.'),
        t('Find signed BC.'), { calculation: paperCalculation('BC', t('Signed force in member BC'), 'kN',
            [['Bᵧ', t('Vertical reaction at support B'), 'kN', forces.Bᵧ], ['Pᵦ', t('Downward load at B'), 'kN', endLoad],
                ['θ', t('Angle measured from vertical'), '°', Number(fmt(angleB))]],
            ['(', 0, '−', 1, ')'], ['cos(', 2, ')'], (reaction, load, angle) => (reaction - load) / Math.cos(angle * Math.PI / 180)) });
    choose(t('Now use the horizontal column. The horizontal leg of the triangle is across from the marked vertical angle θ.'),
        t('Which ratio gives the horizontal component of BC?'),
        [['sin', 'sin θ'], ['cos', 'cos θ', t('Cosine still gives the adjacent leg, which is vertical here.')]],
        'sin', t('SOH means sine = opposite ÷ hypotenuse. The horizontal component of BC points left at B.'),
        { ...equations.BD[1], ratioQuiz: true }, { skill: 'trig' });
    calculate('BD', t('At B, BC pulls left. The assumed pull along BD also points left. Write both terms as negative in the horizontal equation, then solve for BD.'), t('Find signed BD.'));
    choose(t('Move to D, the other end of BD. Keep the member’s force magnitude and its compression label. The force on a joint points the opposite way at the other end.'),
        t('Which way does compressed BD push on joint D?'),
        [['left', t('Left')], ['right', t('Right'), t('B lies to the right of D. A compressed BD pushes D away from B.')]],
        'left', t('Compression pushes D left. On the isolated joint, draw the arrow left with the known magnitude.'), { joint: 'D', axis: 'x' });
    calculate('CD', t('At D, the load points down. CD is the only member with a vertical component. Its assumed pull points down toward C.'), t('Find signed CD.'));
    calculate('AD', t('Stay at D. Compressed BD pushes left. AD’s assumed pull also points left, and CD contributes zero in x.'), t('Find signed AD.'));
    calculate('AC', t('Move to C. The known BC force pulls to the right and up. CD is vertical. Solve for the unknown AC in the horizontal equation. This time the angle shown for AC is measured from the horizontal.'), t('Find signed AC.'));
    [
        ['x', t('Check the last joint, A. The compressed chord AD pushes left and the tensile diagonal AC pulls right. Aₓ is zero.'),
            t('What is the horizontal sum at A?'), `ΣFₓ = −${n(-forces.AD)} kN + ${n(-forces.AD)} kN = 0 kN.`],
        ['y', t('Now check vertical balance at A. AC pulls down. Aᵧ points up. AD stays horizontal.'),
            t('What is the vertical sum at A?'), `ΣFᵧ = +${n(netA)} kN − ${n(netA)} kN = 0 kN.`],
    ].forEach(([axis, intro, prompt, solution]) => turns.push(num(intro, prompt, 0, 'kN', solution, { trussQuiz: { model, joint: 'A', axis } })));
    choose(t('Gather the results on one free-body drawing. Use a positive magnitude with a label that says whether the member pulls or pushes.'),
        t('How should you label the two top chord members?'),
        [['c', t('Both in compression')], ['t', t('Both in tension'), t('Both solved forces were negative under the assumed-tension convention.')]],
        'c', t('Both top chord members are in compression. The diagonals are in tension and the centre vertical member is in compression. The summary includes the forces and their units.'), { phase: 'summary' });
    return { title: trussTaTitle, topic: 8, drawing: { caption: t('Truss analysis') }, refs: workshops[8].refs, turns,
        outcome: t('You found the support reactions, followed the forces across the joints, checked the last joint and produced a labeled summary.') };
}

function makeTrussTaPractice() {
    const model = taTruss(4, 6, 3, 30, 6);
    const equations = verticalTrussCalculations(model);
    const questions = [
        ['Bᵧ', t('Find Bᵧ with up as positive.'), t('Both downward loads turn the truss clockwise about A.'), []],
        ['Aᵧ', t('Find Aᵧ with up as positive.'), t('Balance both downward loads against the two upward reactions.'), ['Bᵧ']],
        ['BC', t('At B, use the marked angle from vertical to find signed BC.'), t('The vertical component is adjacent to the marked angle.'), ['Aₓ', 'Aᵧ', 'Bᵧ']],
        ['BD', t('Use horizontal balance at B to find signed BD.'), t('The horizontal component of BC is opposite the marked angle.'), ['Aₓ', 'Aᵧ', 'Bᵧ', 'BC']],
        ['CD', t('At D, find signed CD.'), t('Start with an assumed pull downward along CD.'), ['BD']],
        ['AD', t('Stay at D and find signed AD.'), t('Compressed BD pushes left at D, so AD must push right.'), ['BD', 'CD']],
        ['AC', t('At C, find signed AC using the horizontal equation.'), t('Use the angle from horizontal for AC. The vertical CD drops out.'), Object.keys(model.forces).filter(name => name !== 'AC')],
    ];
    return questions.map(([key, prompt, hint, known]) => {
        const [solution, detail] = equations[key];
        return { ...N(prompt, model.forces[key], solution, hint, 'kN'), key: 'truss-ta-' + key,
            method: detail.joint ? 'trussJoint' : 'reactions', topic: t('Truss analysis'),
            trussQuiz: { model, key, known, recap: key === 'AC', ...detail }, setup: detail.joint ? memberSign : '' };
    });
}
