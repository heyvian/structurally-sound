function taForceTriangle(solved) {
    return plate(t('Two forces laid tip-to-tail and their diagonal resultant'), `
        <path class="diagram-dash" d="M96 142H316M96 142L39 44H188"/>
        <path class="diagram-arrow" d="M96 142H246"/><path class="diagram-arrow" d="M246 142L189 44"/>
        <path class="diagram-line" d="M96 142L189 44"/>
        <path class="section-measure" d="M218 142A28 28 0 0 1 232 118M274 142A28 28 0 0 0 232 118"/>
        <text x="165" y="161">8 kN</text><text x="225" y="84">6 kN</text><text x="251" y="115">120°</text>
        <text x="196" y="132">${solved ? '60°' : 'φ'}</text><text x="120" y="86">R</text><text x="116" y="134">θ</text>`, 177);
}

function taForcesTurns() {
    const resultant = Math.sqrt(52);
    const direction = Math.atan2(3 * Math.sqrt(3), 5) * 180 / Math.PI;
    const figure = (record, n) => workshopFigure(taForceTriangle(n > 0 || record?.status));
    return [
        num(t('Draw the 8 kN pull first. Move the tail of the 6 kN arrow to its tip while keeping the 120° direction from right. Close the triangle with the resultant R. The inside angle φ is measured back along the first pull.'),
            t('What is the inside angle φ?'), 60, '°',
            t('The backward direction is 180° from right. The triangle’s inside angle is 180° − 120° = 60°.'), { taDrawing: record => figure(record, 0) }),
        num(t('This triangle does not have a right angle. The two known sides meet at 60°. Use the cosine law with that inside angle to find the side across from it.'),
            t('What is the magnitude of the resultant R?'), resultant, 'kN',
            `R² = 8² + 6² − 2 × 8 × 6 cos 60° = 52 kN². R ≈ ${numberText(resultant)} kN.`, { taDrawing: record => figure(record, 1), skill: 'trig' }),
        num(t('The 6 kN side is opposite θ. The resultant R is opposite 60°. Match those pairs in the sine law. The sketch shows θ is acute and points above the horizontal.'),
            t('How many degrees above horizontal does R point?'), direction, '°',
            `sin θ / (6 kN) = sin 60° / (${numberText(resultant)} kN). θ ≈ ${numberText(direction)}°.`,
            { taDrawing: record => figure(record, 2), skill: 'trig', hint: t('First get sin θ by multiplying the right side by 6 kN. Then use inverse sine in degrees.') }),
    ];
}

function taMathTurns() {
    const diagram = () => workshopFigure(plate(t('A square with one-metre sides'), `
        <rect class="section-piece" x="171" y="25" width="111" height="111"/>
        <path class="section-measure" d="M171 149H282m0 -4v8M171 145v8M296 25V136m-4 0h8M292 25h8"/>
        <text x="226" y="165" text-anchor="middle">1 m</text><text x="305" y="82">1 m</text><text x="226" y="85" text-anchor="middle">1 m²</text>`));
    return [
        num(t('A square that is one metre on each side has area 1 m². In millimetres, each side measures 1,000 mm. Convert both sides before multiplying them.'),
            t('How many square millimetres are in 1 m²?'), 1000000, 'mm²',
            t('Multiply (1,000 mm) × (1,000 mm) = 1,000,000 mm². An area has two length factors.'), {
                taDrawing: diagram, wrong: [[1000, t('That changes one side of the square. Change both lengths, then multiply them.')]],
                units: t('For an area, square the length conversion factor. For a volume, cube it.'),
            }),
    ];
}

function taReactionTurns(attempt) {
    const force = 18 + 3 * (attempt - 1), arm = 5;
    const n = numberText;
    const drawing = (record, stage) => workshopFigure(fixedDiagram(stage ? [0, 1, 2, 3] : [3], Boolean(stage),
        n(force) + ' kN', n(arm) + ' m', stage ? { 0: 0, 1: force, ...(record?.status ? { 2: force * arm } : {}) } : {}));
    return [
        pick(t('Switch to a beam built into a wall at A. The free tip carries a downward point load. Draw the beam by itself and replace the wall by the reactions it can supply.'),
            t('What does the fixed wall supply in this plane?'),
            [['all', 'Aₓ, Aᵧ, Mₐ'], ['pin', 'Aₓ, Aᵧ', t('The wall also restrains rotation, so include a reaction moment.')]],
            'all', t('The wall supplies two force components and a moment. Horizontal force balance gives Aₓ = 0. Vertical force balance gives an upward reaction equal to the load.'),
            { newExample: true, taDrawing: record => drawing(record, record?.status ? 1 : 0) }),
        num(t('The downward load turns the cantilever clockwise. The fixed end supplies a counterclockwise couple. Aᵧ also acts, but its arm about A is zero.'),
            t('What is the positive wall moment Mₐ?'), force * arm, 'kN·m',
            `ΣMₐ = Mₐ − (${n(force)} kN × ${n(arm)} m) = 0. Mₐ = +${n(force * arm)} kN·m.`,
            { taDrawing: record => drawing(record, 1), skill: 'reactions',
                calculation: paperCalculation('Mₐ', t('Moment supplied by the wall'), 'kN·m',
                    [['P', t('Downward tip force'), 'kN', force], ['d', t('Perpendicular lever arm'), 'm', arm]],
                    [0, '×', 1], null, (p, d) => p * d) }),
    ];
}

function taBeamDrawing(beam, reactions, extra = {}) {
    const result = analyze(beam);
    const values = { 0: 0 };
    if (reactions >= 1) values[2] = result.RB;
    if (reactions >= 2) values[1] = result.RA;
    return workshopFigure(beamFigure(beam, [0, 1, 2], { isolated: true, values, ...extra }));
}

function taCoupleTurns(attempt) {
    const magnitude = 24 * attempt, shear = magnitude / 6;
    const beam = { L: 6, a: 0, b: 6, points: [], udls: [], couples: [{ x: 3, m: magnitude }] };
    const n = numberText;
    const drawing = show => () => taBeamDrawing(beam, show);
    return [
        num(t('The circular arrow at midspan applies a counterclockwise couple. It turns without an accompanying vertical force. Take moments about A and keep counterclockwise positive.'),
            t('What is the signed vertical reaction at B?'), -shear, 'kN',
            `ΣMₐ = Bᵧ × 6 m + ${n(magnitude)} kN·m = 0. Bᵧ = ${n(-shear)} kN. Aᵧ = +${n(shear)} kN.`,
            { newExample: true, taDrawing: record => taBeamDrawing(beam, record?.status ? 2 : 0, { pivot: 0 }), skill: 'reactions' }),
        pick(t('Redraw the beam with both reactions. Move past the counterclockwise couple. Ask whether a vertical force has appeared at that station.'),
            t('What happens to the shear at the couple?'),
            [['same', t('Shear stays at the same height')], ['jump', t('Shear jumps at the couple'), t('A couple adds kN·m without adding any vertical force in kN.')]],
            'same', t('Only a vertical point force jumps shear. Here V is constant from A to B and returns to zero after the downward B reaction.'),
            { taDrawing: drawing(2) }),
        num(t('Add the positive shear area from A to just before the couple. Constant positive shear gives a rectangle. The width is 3 m.'),
            t('What is M just to the left of the couple?'), magnitude / 2, 'kN·m',
            `M = 0 + (${n(shear)} kN)(3 m) = +${n(magnitude / 2)} kN·m.`, { taDrawing: drawing(2) }),
        num(t('Now cross the couple. With positive sagging, the moment just to its right equals the moment just to its left minus the applied counterclockwise couple. This happens at the same beam coordinate.'),
            t('What is M just to the right of the couple?'), -magnitude / 2, 'kN·m',
            `M = +${n(magnitude / 2)} kN·m − ${n(magnitude)} kN·m = ${n(-magnitude / 2)} kN·m.`, { taDrawing: drawing(2) }),
        sketch(beam, 'M', t('Plot the two heights at x = 3 m and connect them with a straight vertical jump. Start and end at zero. Constant shear gives straight slopes on each side.'),
            t('The ordinates on either side of the couple are different at the same x. The rest of each segment rises at the constant shear slope.'), { taDrawing: drawing(2) }),
    ];
}

function taOverhangTurns(attempt) {
    const beam = { L: 8, a: 2, b: 8, points: [{ x: 0, p: 36 * attempt }], udls: [{ s: 2, e: 8, w: 12 * attempt }] };
    const { RA, RB, V, M, Mmax } = analyze(beam);
    const n = numberText;
    const p = beam.points[0].p, w = beam.udls[0].w, zeroLength = V(2, true) / w, zero = 2 + zeroLength;
    const limit = 150;
    const modulus = Mmax * 1e6 / limit;
    const candidates = steelProfiles.filter(row => row[1] >= 39);
    const table = steelQ('S', modulus / 1000, candidates);
    const drawing = show => () => taBeamDrawing(beam, show);
    const known = { taDrawing: drawing(2) };
    const shearPlot = graphQuestion(beam, 'V');
    const momentPlot = graphQuestion(beam, 'M');
    const withPlot = plot => () => ({ ...taBeamDrawing(beam, 2), progress: graphSolution(plot) });
    return [
        num(t('Our next beam extends left of support A. Its loaded left tip is free, and the uniform load runs from A to B. Replace the uniform load by its 6 m rectangle’s area for the reaction calculation.'),
            t('What is the downward resultant of the uniform load?'), w * 6, 'kN',
            `W = ${n(w)} kN/m × 6 m = ${n(w * 6)} kN.`, { newExample: true, taDrawing: drawing(0) }),
        num(t('Take moments about A. The uniform load acts 3 m to the right. The tip load acts 2 m to the left, so it creates the opposite turn. B is 6 m from A.'),
            t('Find Bᵧ with up as positive.'), RB, 'kN',
            `ΣMₐ = Bᵧ(6 m) + (${n(p)} kN)(2 m) − (${n(w * 6)} kN)(3 m) = 0. Bᵧ = +${n(RB)} kN.`,
            { taDrawing: record => taBeamDrawing(beam, record?.status ? 1 : 0, { pivot: 2 }), skill: 'reactions' }),
        num(t('Use vertical balance now. The two reactions must carry both the free-tip load and the equivalent uniform load.'),
            t('Find Aᵧ with up as positive.'), RA, 'kN',
            `Aᵧ = ${n(p)} kN + ${n(w * 6)} kN − ${n(RB)} kN = +${n(RA)} kN.`,
            { taDrawing: record => taBeamDrawing(beam, record?.status ? 2 : 1), skill: 'reactions' }),
        pick(t('Redraw the original distributed load and the solved reactions. Mark the free tip, A and B as stations. Walk left to right. At the free tip, the first force is the downward point load.'),
            t('What does the shear do at the free tip?'),
            [['drop', t('It jumps down')], ['zero', t('It stays zero'), t('The concentrated load at the left end gives a jump from zero outside to the negative load just inside.')]],
            'drop', t('Carry that negative shear to A, jump up by Aᵧ, then subtract the uniform load as you move toward B.'), known),
        num(t('Just right of A, the shear is the tip load plus the reaction at A, with signs. Within the uniform load V loses w kilonewtons per metre. Divide the positive starting shear by w to find the local distance to zero.'),
            t('How far to the right of A does V first reach zero within the span?'), zeroLength, 'm',
            `d = (${n(RA)} kN − ${n(p)} kN) ÷ (${n(w)} kN/m) = ${n(zeroLength)} m. x = 2 m + ${n(zeroLength)} m = ${n(zero)} m.`,
            { ...known, units: t('kN ÷ (kN/m) = m. A force divided by a force per metre gives a distance.') }),
        sketch(beam, 'V', t('Sketch V. Put the point-force jumps at the tip, A and B. The line is flat over the overhang and slopes down under the uniform load.'),
            t('The tip and the two supports cause the only jumps. The uniform-load segment crosses zero before B, and the jump at B returns shear to zero.'), known),
        num(t('Use the finished shear diagram. At the free tip there is no applied couple, so M starts at zero. The shear rectangle over the overhang has negative height.'),
            t('What is the bending moment at support A?'), M(2), 'kN·m',
            `M(A) = 0 + (2 m)(${n(-p)} kN) = ${n(M(2))} kN·m.`, { taDrawing: withPlot(shearPlot) }),
        num(t('Start at the moment you found at A. Add the positive shear triangle from A to the zero-shear point. Its base is the local distance from A.'),
            t('What is the moment at the zero-shear point?'), M(zero), 'kN·m',
            `M = ${n(M(2))} kN·m + ½(${n(zeroLength)} m)(${n(V(2, true))} kN) = +${n(M(zero))} kN·m.`, { taDrawing: withPlot(shearPlot) }),
        sketch(beam, 'M', t('Plot M at the free tip, A, the shear crossing, and B. Constant shear makes the overhang line straight. Linearly varying shear makes the two loaded segments parabolic.'),
            t('The moment at A is continuous across the support. A is inside the beam. B is at the end and returns to zero.'), { taDrawing: withPlot(shearPlot) }),
        num(t('Compare the magnitude of the negative moment at A with the positive peak in the span. The larger absolute moment sets the bending demand for this section comparison.'),
            t('What is the largest absolute bending moment?'), Mmax, 'kN·m',
            `max(|${n(M(2))}|, |${n(M(zero))}|) = ${n(Mmax)} kN·m.`, { taDrawing: withPlot(momentPlot) }),
        num(t('The exercise gives a bending stress of 250 MPa and asks us to use 60% of that value as the allowable stress. Write 60% as 0.60 and multiply before sizing the section.'),
            t('What is the allowable bending stress?'), limit, 'MPa', 'σallow = 250 MPa × 0.60 = 150 MPa.',
            { taDrawing: withPlot(momentPlot), wrong: [[250, t('250 MPa is the starting value. The exercise sets the allowable stress at 60% of it.')]] }),
        num(t('The allowable bending stress for this exercise is 150 MPa. That is 150 N/mm². Convert the maximum moment from kN·m to N·mm, then divide by this stress to find the minimum elastic section modulus.'),
            t('What is the required Sₓ in mm³?'), modulus, 'mm³',
            `Sₓ,req = (${n(Mmax)} × 10⁶ N·mm) ÷ (150 N/mm²) = ${n(modulus)} mm³.`,
            { taDrawing: withPlot(momentPlot), units: t('1 kN·m = 10⁶ N·mm. Dividing N·mm by N/mm² gives mm³.') }),
        repeatProblem(table, t('The table gives Sₓ in thousands of mm³. A cubic centimetre is also 1,000 mm³. Convert to the table’s scale, filter for adequate Sₓ, then compare the remaining masses per metre.'),
            { taDrawing: () => workshopFigure(steelTable(table.rows)) }),
    ];
}

function lInertiaTerms(model, axis) {
    const horizontal = axis === 'x';
    const centre = horizontal ? 'cy' : 'cx';
    return model.parts.map(part => {
        const b = horizontal ? part.width : part.depth;
        const h = horizontal ? part.depth : part.width;
        const d = Math.abs(part[centre] - model[centre]);
        return { b, h, d, local: b * h ** 3 / 12, shift: part.area * d ** 2 };
    });
}

function lInertiaDrawing(model, axis, stage, solved) {
    const values = { cx: model.cx, cy: model.cy };
    model.parts.forEach((part, i) => { values['x' + i] = part.cx; values['y' + i] = part.cy; });
    const drawing = sectionPlate(model, 'angle', values, {
        inertiaAxis: axis, offsetKnown: Boolean(stage || solved),
    });
    const n = numberText;
    const terms = lInertiaTerms(model, axis);
    const name = axis === 'x' ? 'Iₓ' : 'Iᵧ';
    drawing.tools = `<div class="table-wrap"><table class="section-ledger ta-inertia-ledger"><thead><tr><th scope="col">${t('Piece')}</th>
        <th scope="col">b · mm</th><th scope="col">h · mm</th><th scope="col">d · mm</th>
        <th scope="col">I₀ · mm⁴</th><th scope="col">Ad² · mm⁴</th></tr></thead>
        <tbody>${terms.map(({ b, h, d, local, shift }, i) => `<tr><th scope="row">${i + 1} · ${sectionPartName(model.parts[i].name)}</th>
            <td>${n(b)}</td><td>${n(h)}</td><td>${stage || solved || i ? n(d) : '—'}</td>
            <td>${stage || solved ? n(local) : '—'}</td><td>${stage ? n(shift) : '—'}</td></tr>`).join('')}</tbody></table></div>
        ${solved && stage ? `<p class="section-totals">${name} = ${n(terms.reduce((sum, term) => sum + term.local + term.shift, 0))} mm⁴</p>` : ''}`;
    return drawing;
}

function taSectionTurns(workshop) {
    const model = workshop.turns.find(turn => turn.section?.kind === 'angle').section.model;
    const x = lInertiaTerms(model, 'x'), y = lInertiaTerms(model, 'y');
    const n = numberText;
    const horizontal = x.reduce((sum, term) => sum + term.local + term.shift, 0);
    const vertical = y.reduce((sum, term) => sum + term.local + term.shift, 0);
    return [
        num(t('Return to the L section and use the centroid you found earlier. For Iₓ the reference is the horizontal line through that centroid. Measure the vertical gap between the leg’s centre and this line.'),
            t('What is the leg’s perpendicular distance d to the horizontal axis?'), x[0].d, 'mm',
            `d = |${n(model.parts[0].cy)} mm − ${n(model.cy)} mm| ≈ ${n(x[0].d)} mm.`,
            { newExample: true, taDrawing: record => lInertiaDrawing(model, 'x', 0, record?.status) }),
        num(t('Use the table for Iₓ. Each piece has a local I₀ about its own horizontal centreline and a shift term Ad² to the combined horizontal axis. Add the two entries in each row, then add both rows.'),
            t('What is Iₓ for the L about its horizontal centroidal axis?'), horizontal, 'mm⁴',
            `Iₓ = ${x.map(({ local, shift }) => `(${n(local)} + ${n(shift)})`).join(' + ')} ≈ ${n(horizontal)} mm⁴.`,
            { taDrawing: record => lInertiaDrawing(model, 'x', 1, record?.status) }),
        num(t('Now use the vertical centroidal axis for Iᵧ. The perpendicular gap d is horizontal. The rectangle dimension that is cubed is now its horizontal width. Use the updated table to add the local and shift terms.'),
            t('What is Iᵧ for the L about its vertical centroidal axis?'), vertical, 'mm⁴',
            `Iᵧ = ${y.map(({ local, shift }) => `(${n(local)} + ${n(shift)})`).join(' + ')} ≈ ${n(vertical)} mm⁴.`,
            { taDrawing: record => lInertiaDrawing(model, 'y', 1, record?.status) }),
    ];
}

function taCourseTurns(index, attempt, workshop) {
    if (index === 1) return taForcesTurns();
    if (index === 3) return taReactionTurns(attempt);
    if (index === 4) return taCoupleTurns(attempt);
    if (index === 6) return taSectionTurns(workshop);
    if (index === 9) return taOverhangTurns(attempt);
    if (index === 10) return taMathTurns();
    return [];
}

function makeCourseTaPractice() {
    const couple = { L: 8, a: 0, b: 8, points: [], udls: [], couples: [{ x: 2, m: -32 }] };
    const overhang = { L: 10, a: 2, b: 10, points: [{ x: 0, p: 42 }], udls: [{ s: 2, e: 10, w: 8 }] };
    const angle = angleSection(84, 110, 18, 16);
    const [leg, foot] = lInertiaTerms(angle, 'x');
    return [
        { ...N(t('Find Iₓ for this L section about its horizontal centroidal axis.'), leg.local + foot.local + leg.shift + foot.shift,
            `Iₓ = (${numberText(leg.local)} + ${numberText(leg.shift)}) + (${numberText(foot.local)} + ${numberText(foot.shift)}) ≈ ${numberText(angle.inertia)} mm⁴.`,
            t('Add the local inertia and the offset contribution for each rectangle.'), 'mm⁴'),
            key: 'ta-inertia-angle', topicIndex: 6, sectionCase: { model: angle, kind: 'angle', inertia: 'x' },
            setup: t('Use the marked centroid and the table of terms. The gap d is measured vertically for this horizontal reference axis.') },
        { ...graphQuestion(couple, 'M'), key: 'ta-beam-couple', topicIndex: 4,
            setup: t('Use the clockwise applied couple. Aᵧ = −4 kN and Bᵧ = +4 kN. Plot a vertical moment jump at the couple and check that both ends return to zero.'),
            explain: t('The clockwise couple jumps M up by 32 kN·m in sagging sign. The constant −4 kN shear makes M fall on both sides.'), method: 'bendingDiagram' },
        { ...graphQuestion(overhang, 'M'), key: 'ta-beam-overhang', topicIndex: 9,
            setup: t('The point load acts at the free tip left of A. Solve the reactions first. Plot moment through the internal support and the shear crossing inside the loaded span.'),
            explain: t('At A, the moment is negative because of the tip load. It stays continuous at this internal support. Compare the absolute values at A and at the zero-shear point.'), method: 'bendingDiagram' },
    ];
}
