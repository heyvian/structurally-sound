function compositeSection(rectangles) {
    const parts = rectangles.map(({ name, x = 0, y = 0, width, depth }) => ({
        name, x, y, width, depth, area: width * depth, cx: x + width / 2, cy: y + depth / 2,
    }));
    const width = Math.max(...parts.map(part => part.x + part.width));
    const depth = Math.max(...parts.map(part => part.y + part.depth));
    const area = parts.reduce((sum, part) => sum + part.area, 0);
    const qx = parts.reduce((sum, part) => sum + part.area * part.cx, 0);
    const qy = parts.reduce((sum, part) => sum + part.area * part.cy, 0);
    const cx = qx / area, cy = qy / area;
    for (const part of parts) {
        part.localI = part.width * part.depth ** 3 / 12;
        part.offset = Math.abs(part.cy - cy);
        part.shift = part.area * part.offset ** 2;
    }
    const inertia = parts.reduce((sum, part) => sum + part.localI + part.shift, 0);
    return { parts, width, depth, area, qx, qy, cx, cy, inertia };
}

function teeSection(width, depth, flangeWidth, flangeDepth) {
    return compositeSection([
        { name: 'web', x: (flangeWidth - width) / 2, width, depth },
        { name: 'flange', y: depth, width: flangeWidth, depth: flangeDepth },
    ]);
}

function angleSection(width, depth, leg, foot) {
    return compositeSection([
        { name: 'leg', width: leg, depth },
        { name: 'foot', x: leg, width: width - leg, depth: foot },
    ]);
}

const sectionPracticeAngle = angleSection(90, 120, 24, 18);
const sectionPracticeSymmetric = compositeSection([
    { name: 'flange', width: 90, depth: 15 },
    { name: 'web', x: 35, y: 15, width: 20, depth: 110 },
    { name: 'flange', y: 125, width: 90, depth: 15 },
]);

function sectionPartName(name) {
    return { web: t('Web'), flange: t('Flange'), leg: t('Vertical leg'), foot: t('Foot extension'), rectangle: t('Rectangle') }[name];
}

function sectionCentroidPractice(axis, model, kind) {
    const coordinate = 'c' + axis;
    const symbol = axis === 'x' ? 'x̄' : 'ȳ';
    const prompt = axis === 'x' ? t('How far right of x = 0 is the centroid?') : t('How far above y = 0 is the centroid?');
    const solution = kind === 'i' ? t('The I section has two symmetry lines, so its centroid is at half the width and half the depth.') +
        ` ${symbol} = ${numberText(axis === 'x' ? model.width : model.depth)} mm ÷ 2 = ${numberText(model[coordinate])} mm.` :
        `${symbol} = [${model.parts.map(part => `(${numberText(part.area)} mm² × ${numberText(part[coordinate])} mm)`).join(' + ')}] ÷ ${numberText(model.area)} mm² ≈ ${numberText(model[coordinate])} mm.`;
    return { ...N(prompt, model[coordinate], solution, kind === 'i' ? t('Find where the two symmetry lines cross.') :
        t('Use area × centre coordinate for each rectangle. Add those products and divide by the total area.'), 'mm'),
        setup: kind === 'i' ? t('The two flanges of this I section have the same dimensions. Read the width and depth from the drawing.') :
            t('Use the two rectangles shown in this L section. The seam separates the full-height leg from the foot extension.'),
        method: 'centroid', sectionCase: { model, kind } };
}

function centroidCalculation(model, axis, short = false) {
    const symbol = axis === 'x' ? 'x̄' : 'ȳ';
    const productSum = axis === 'x' ? model.qx : model.qy;
    const label = axis === 'x' ? t('Centroid distance from the left datum') : t('Centroid height from the bottom datum');
    const inputs = short ? [['ΣA' + axis, t('Sum of area × centre coordinate'), 'mm³', productSum]] :
        model.parts.flatMap((part, i) => [
            ['A' + '₁₂'[i], t`${sectionPartName(part.name)} · Area`, 'mm²', part.area],
            [axis + '₁₂'[i], t`${sectionPartName(part.name)} · Centre coordinate`, 'mm', part['c' + axis]],
        ]);
    inputs.push(['ΣA', t('Total area'), 'mm²', model.area]);
    const numerator = short ? [0] : [0, '×', 1, '+', 2, '×', 3];
    return paperCalculation(symbol, label, 'mm', inputs, numerator, [inputs.length - 1],
        short ? (sum, area) => sum / area : (a1, c1, a2, c2, area) => (a1 * c1 + a2 * c2) / area);
}

function sectionLessonVersion(attempt, visuals = true) {
    const n = numberText;
    const repeat = attempt - 1;
    const table = repeat ? steelQ('S', 325 + 20 * repeat, steelSmall) : null;
    const rectangle = compositeSection([{ name: 'rectangle', width: 60 + 10 * repeat, depth: 40 + 6 * repeat }]);
    const tee = teeSection(20 + 2 * repeat, 80 + 8 * repeat, 100 + 10 * repeat, 20 + 2 * repeat);
    const angle = angleSection(70 + 8 * repeat, 100 + 10 * repeat, 20 + 2 * repeat, 20 + 2 * repeat);
    const original = workshops[6];
    const turns = [];
    let model = rectangle, kind = 'rectangle';
    const step = (key, intro, prompt, expected, unit, solution, extra = {}) => {
        const { part, dimension, symmetry, concept, ...exercise } = extra;
        turns.push(num(intro, prompt, expected, unit, solution, { section: { model, kind, key, part, dimension, symmetry, concept }, ...exercise }));
    };
    const choice = (key, intro, prompt, choices, answer, solution, detail = {}) => {
        turns.push(pick(intro, prompt, choices, answer, solution, { section: { model, kind, key, ...detail } }));
    };
    const sectionAreaUnits = t('A width in mm times a height in mm gives an area in mm².');
    const contributionUnits = t('Area times a distance gives mm² × mm = mm³.');
    const centroidUnits = original.turns[1].units;
    const bottomHint = t('Measure from the same bottom line for both pieces.');
    const formulas = axis => axis === 'x' ? 'x̄ = Σ(Aᵢxᵢ) ÷ ΣAᵢ' : 'ȳ = Σ(Aᵢyᵢ) ÷ ΣAᵢ';

    choice('symmetry', t('The centroid is where a thin cutout of uniform thickness and density would balance. Start with a rectangle. The left edge is x = 0 and the bottom edge is y = 0. A symmetry line divides the section into matching halves.'),
        t('Which lines divide this rectangle into matching halves?'),
        [['both',t('Both centre lines')], ['x',t('Only the horizontal centre line'),t('The left and right halves also match across the vertical line.')],
            ['y',t('Only the vertical centre line'),t('The top and bottom halves also match across the horizontal line.')]],
        'both', t('The rectangle has two symmetry lines. Its centroid is where they cross.'), { symmetry: true });
    step('cx', t('The vertical symmetry line runs halfway between the left and right edges. Use the full width marked under the section.'),
        t('How far right of x = 0 is the centroid?'), rectangle.cx, 'mm',
        `x̄ = ${n(rectangle.width)} mm ÷ 2 = ${n(rectangle.cx)} mm.`, { symmetry: true, dimension: 'x' });
    step('cy', t('The horizontal symmetry line sits halfway up the section. Measure from the bottom line, the same place we called y = 0.'),
        t('How far above y = 0 is the centroid?'), rectangle.cy, 'mm',
        `ȳ = ${n(rectangle.depth)} mm ÷ 2 = ${n(rectangle.cy)} mm.`, { symmetry: true, dimension: 'y' });

    model = tee;
    kind = 'tee';
    const [web, flange] = tee.parts;
    choice('part', t('A T has a wide cap called the flange and a narrow stem called the web. The drawing marks the seam. Treat them as two rectangles that touch along the seam, with each bit of area counted once.'),
        t('Tap the web on the drawing.'),
        [['web',t('The web')], ['flange',t('The top flange'),t('That is the wide upper rectangle. The web is the narrow stem below the seam.')]],
        'web', t('Use the web below the seam and the flange above it. Left and right still mirror each other, but the top and bottom do not. We need to find the height of the centroid.'));
    turns.at(-1).hot = ['web','flange'];
    for (const [i, part] of tee.parts.entries()) {
        const name = sectionPartName(part.name);
        const areaSymbol = 'A' + '₁₂'[i];
        step('a' + i, t`Start with the shaded rectangle, ${name}. To find its area, multiply its horizontal width by its vertical height. Read those two dimensions from the drawing.`,
            t('What is the area of the highlighted rectangle?'), part.area, 'mm²',
            `${areaSymbol} = ${n(part.width)} mm × ${n(part.depth)} mm = ${n(part.area)} mm².`,
            { part: i, dimension: 'area', units: sectionAreaUnits,
                calculation: i === 0 ? paperCalculation(areaSymbol, t('Area of the rectangle'), 'mm²',
                    [['b', t('Width of the web'), 'mm', part.width], ['h', t('Depth of the web'), 'mm', part.depth]],
                    [0, '×', 1], null, (width, depth) => width * depth) : undefined });
        step('y' + i, i === 0 ? t('The middle of this rectangle sits halfway up its own height. Since the web starts at y = 0, that halfway distance is also its height above the datum.') :
            t`The flange starts ${n(part.y)} mm above the bottom datum. Go up half the flange thickness from this seam, then include the distance from the seam to the datum.`,
            t('How high is the highlighted rectangle’s centre above y = 0?'), part.cy, 'mm',
            `y${'₁₂'[i]} = ${n(part.y)} mm + (${n(part.depth)} mm ÷ 2) = ${n(part.cy)} mm.`,
            { part: i, dimension: 'y', hint: bottomHint, wrong: i ? [[part.depth / 2, t('That is half the flange thickness. Add the height of the seam above the bottom datum.')]] : [] });
    }
    choice('weight', t`Imagine a dot of equal size in every square millimetre. More dots belong to the flange (${n(flange.area)} mm²) than to the web (${n(web.area)} mm²). The balance height must be between the two centres.`,
        t('Which centre will the balance height be closer to?'),
        [['flange',t('The top flange')], ['web',t('The web'),t('The flange has more area. Its height has the greater influence.')],
            ['middle',t('Exactly halfway between them'),t('The halfway point would work if their areas were equal.')]],
        'flange', t('Each square millimetre counts equally. The larger rectangle has more area, so it has more influence on the balance point.'));
    for (const [i, part] of tee.parts.entries()) {
        const name = sectionPartName(part.name);
        step('qy' + i, t`For ${name}, replace all its square millimetres by the total area at its centre height. Multiply the area by the height. This gives its contribution to the numerator of the weighted average.`,
            t('What is Aᵢyᵢ for the highlighted piece?'), part.area * part.cy, 'mm³',
            `A${'₁₂'[i]}y${'₁₂'[i]} = ${n(part.area)} mm² × ${n(part.cy)} mm = ${n(part.area * part.cy)} mm³.`,
            { part: i, dimension: 'y', units: contributionUnits });
    }
    step('qy', t('Add the two area × height products from the table. The sum tells how much height all the area contributes, before dividing by the number of square millimetres.'),
        t('What is the sum of the area × height products?'), tee.qy, 'mm³',
        `ΣAy = ${n(web.area * web.cy)} mm³ + ${n(flange.area * flange.cy)} mm³ = ${n(tee.qy)} mm³.`);
    step('area', t('The denominator is all the area in the section. Add the areas in the first column of the table.'),
        t('What is the total cross-sectional area?'), tee.area, 'mm²',
        `ΣA = ${n(web.area)} mm² + ${n(flange.area)} mm² = ${n(tee.area)} mm².`);
    step('cy', t('Divide the total area × height by the total area. This gives one height that represents the balance of all the square millimetres. The line on the drawing follows the height you enter.'),
        original.turns[1].prompt, tee.cy, 'mm',
        `${formulas('y')} = ${n(tee.qy)} mm³ ÷ ${n(tee.area)} mm² ≈ ${n(tee.cy)} mm. ${t('The answer is between the two local centres and closer to the flange.')}`,
        { dimension: 'y', units: centroidUnits, calculation: centroidCalculation(tee, 'y', true),
            wrong: [[(web.cy + flange.cy) / 2, t('That averages the two heights equally. Give the larger flange more weight by using the areas.')]],
            legacy: repeat ? 0 : 1 });

    model = angle;
    kind = 'angle';
    const [leg, foot] = angle.parts;
    choice('symmetry', t('Here is an unequal-leg L. There is no mirror line to locate the centroid. Split along the dotted seam into a full-height leg and a short foot extension. Use the left and bottom edges as the two datums.'),
        t('Which piece reaches all the way to x = 0?'),
        [['leg',t('The full-height leg')], ['foot',t('The foot extension'),t('The extension starts at the dotted seam. The full-height leg already includes the corner area.')]],
        'leg', t('Count the corner as part of the leg. Then the extension starts at the seam, so none of the section is counted twice.'));
    turns.at(-1).hot = ['leg', 'foot'];
    step('width-foot', t('The full width is marked along the bottom. The extension starts at the seam, to the right of the vertical leg. Subtract the leg width from the full width.'),
        t('How wide is the foot extension by itself?'), foot.width, 'mm',
        `${n(angle.width)} mm − ${n(leg.width)} mm = ${n(foot.width)} mm.`, { part: 1, dimension: 'x' });
    for (const [i, part] of angle.parts.entries()) {
        const name = sectionPartName(part.name);
        step('a' + i, t`Now work with the shaded rectangle, ${name}. Multiply only this piece’s width by its height.`,
            t('What is the area of the highlighted rectangle?'), part.area, 'mm²',
            `A${'₁₂'[i]} = ${n(part.width)} mm × ${n(part.depth)} mm = ${n(part.area)} mm².`, { part: i, dimension: 'area', units: sectionAreaUnits });
        step('x' + i, t('Measure the piece’s centre from x = 0 on the left. Go to the piece’s left edge, then go another half of its width.'),
            t('How far right of x = 0 is the highlighted rectangle’s centre?'), part.cx, 'mm',
            `x${'₁₂'[i]} = ${n(part.x)} mm + (${n(part.width)} mm ÷ 2) = ${n(part.cx)} mm.`, { part: i, dimension: 'x' });
        step('y' + i, t('The bottom edge of this piece is at y = 0. Its centre is half its own height above the datum.'),
            t('How high is the highlighted rectangle’s centre above y = 0?'), part.cy, 'mm',
            `y${'₁₂'[i]} = ${n(part.depth)} mm ÷ 2 = ${n(part.cy)} mm.`, { part: i, dimension: 'y' });
    }
    step('area', t('Add the areas of the two non-overlapping rectangles. Use the same total area when you find x̄ and ȳ.'),
        t('What is the total cross-sectional area?'), angle.area, 'mm²', `ΣA = ${n(leg.area)} mm² + ${n(foot.area)} mm² = ${n(angle.area)} mm².`);
    for (const axis of ['x', 'y']) {
        const key = 'c' + axis;
        const loc = axis === 'x' ? 'x̄' : 'ȳ';
        const terms = angle.parts.map(part => `(${n(part.area)} mm² × ${n(part[key])} mm)`);
        step(key, axis === 'x' ? t('Use the x column. Multiply each area by its horizontal centre coordinate, add both products, and divide by the total area.') :
            t('Repeat using the y column. This time the products use the heights above the bottom. The two calculated lines cross at the centroid.'),
            axis === 'x' ? t('How far right of x = 0 is the centroid?') : t('How far above y = 0 is the centroid?'),
            angle[key], 'mm', `${loc} = [${terms.join(' + ')}] ÷ ${n(angle.area)} mm² ≈ ${n(angle[key])} mm. ${axis === 'y' && angle.cx > leg.width && angle.cy > foot.depth
                ? t('Here the balance point lies in the open corner. A centroid can lie outside the material.') : ''}`,
            { dimension: axis, units: centroidUnits, calculation: centroidCalculation(angle, axis) });
    }

    model = tee;
    kind = 'tee';
    if (visuals) {
        choice('neutral-axis', t('Picture the T as the cross-section of a beam that bends downward. Look at the beam from the side. Material near the top shortens and material near the bottom stretches. The line through the centroid keeps its length in this bending example.'),
            t('Which line is the neutral axis in this bend?'),
            [['mid',t('The dashed line through the centroid')], ['top',t('The top edge'),t('The top is changing length. Look for the line between shortening and stretching.')],
                ['bottom',t('The bottom edge'),t('The bottom stretches. The neutral axis is where the length stays the same.')]],
            'mid', t('The dashed line is where the bending strain is zero. On the section drawing it passes through the centroid. Now we can measure how far the material is from that line.'), { concept: 'neutral' });
        turns.at(-1).hot = ['mid', 'top', 'bottom'];
        step('square-distance', t('Moment of inertia here means second moment of area. Think of tiny pieces of area. Measure the perpendicular distance d from the bending axis to each piece. The distance term in the drawing multiplies each area by d². Add up this effect across the section to understand why material far from the axis matters more.'),
            t('What is A × d² for 1 mm² of area at 3 mm from the axis?'), 9, 'mm⁴',
            t('At 1 mm the distance term is 1 × 1² = 1 mm⁴. At 3 mm it is 1 × 3² = 9 mm⁴. For equal areas, tripling the distance makes this term nine times as large.'),
            { concept: 'squares', units: t('An area in mm² times a squared distance in mm² gives mm⁴.'),
                wrong: [[3, t('Multiply the area by the distance squared. The distance contributes 3 × 3.')]] });
        choice('turn-rectangle', t('Look at two copies of the same rectangle. The horizontal bending axis runs through the centre of each. On edge, more material sits far above or below that line.'),
            t('Which orientation gives a larger I about the horizontal axis?'),
            [['tall',t('On edge')], ['flat',t('Flat'),t('The flat rectangle keeps more of its area close to the horizontal axis.')],
                ['same',t('They are equal'),t('Both have the same area. Compare how far that area reaches from the axis.')]],
            'tall', t('The taller orientation gives a larger I. With the same material, a larger I means a stiffer beam in this direction. It takes more moment to make the same bend.'), { concept: 'orientation' });
        choice('depth-direction', t('For a rectangle, add the contributions of all its strips about its own horizontal centreline. The result is I₀ = bh³/12. The width b counts how much area is in each strip. The height h governs both the number of strips and how far they reach from the axis.'),
            t('Which dimension is cubed for this horizontal axis?'),
            [['height',t('The height h across the axis')], ['width',t('The width b along the axis'),t('Width multiplies every strip once. The squared distances are across the height.')]],
            'height', t('Use the dimension perpendicular to the axis for h. The drawing now connects the marked b and h to the formula you will use on the web and flange.'),
            { concept: 'depth' });
    }
    const localUnits = t('b × h³ has units mm × mm³ = mm⁴.');
    for (const [i, part] of tee.parts.entries()) {
        const id = '₁₂'[i];
        const label = i ? t('Second moment of area of the flange about its own horizontal centreline') :
            t('Second moment of area of the web about its own horizontal centreline');
        step('i' + i, (i === 0 ? t('Return to the T. Now locate each rectangle’s own horizontal centreline. The second moment of area I measures how far the material is spread from an axis. For a rectangle, use bh³/12 about its own centreline. Cube the height perpendicular to the axis.') :
            t('Use the same formula for the flange about its own horizontal centreline. Cube its small vertical thickness. The much larger horizontal dimension is the width b.')),
            t('Find the local I of the highlighted rectangle about its horizontal centreline.'), part.localI, 'mm⁴',
            `I₀,${id} = ${n(part.width)} mm × (${n(part.depth)} mm)³ ÷ 12 ≈ ${n(part.localI)} mm⁴.`,
            { part: i, dimension: 'local', units: localUnits, legacy: i === 0 ? repeat ? 1 : 2 : undefined,
                calculation: i === 0 ? paperCalculation('I₀', label, 'mm⁴',
                    [['b', t('Width parallel to the axis'), 'mm', part.width], ['h', t('Depth perpendicular to the axis'), 'mm', part.depth]],
                    [0, '× (', 1, ')³'], ['12'], (width, depth) => width * depth ** 3 / 12) : undefined });
        step('d' + i, t('Keep this rectangle in place and change the line you measure from. Its own centreline gives the local I₀. To use the T’s combined axis, measure the vertical gap d between the two lines.'),
            t('What is the distance d from the highlighted rectangle’s centre to the combined axis?'), part.offset, 'mm',
            `d${id} = |${n(tee.cy)} mm − ${n(part.cy)} mm| ≈ ${n(part.offset)} mm.`,
            { part: i, dimension: 'offset', legacy: i === 0 ? repeat ? 2 : 3 : undefined });
        step('shift' + i, t('The local I₀ already counts the spread within the rectangle. Add A d² to count the effect of the whole rectangle being offset from the combined axis. If the two lines coincide, d = 0 and the extra term vanishes.'),
            t('What is the shift term A d² for the highlighted rectangle?'), part.shift, 'mm⁴',
            `A${id}d${id}² ≈ (${n(part.area)} mm²) × (${n(part.offset)} mm)² ≈ ${n(part.shift)} mm⁴.`,
            { part: i, dimension: 'offset', units: t('An area in mm² times a squared distance in mm² gives mm⁴.') });
    }
    step('inertia', t('For each rectangle you have a local I and a shift term. Add all four entries in the table to get the T’s second moment of area about the combined horizontal axis.'),
        t('What is the total Iₓ about the combined horizontal axis?'), tee.inertia, 'mm⁴',
        `Iₓ = (I₀,₁ + A₁d₁²) + (I₀,₂ + A₂d₂²) ≈ ${n(tee.inertia)} mm⁴.`,
        { dimension: 'local', units: original.turns[4].units, legacy: repeat ? 3 : 4 });
    const distances = [tee.cy, tee.depth - tee.cy];
    for (const [i, edge] of ['bottom', 'top'].entries()) {
        const bottom = edge === 'bottom', c = distances[i];
        step('c' + edge, bottom ? t('Section modulus S gives the relationship between bending moment and stress at an edge. Start by measuring the distance c from the combined axis down to the bottom edge.') :
            t('Now measure c up to the top edge. Use the full depth minus the height of the combined axis.'),
            bottom ? t('How far is the bottom edge from the combined axis?') : t('How far is the top edge from the combined axis?'),
            c, 'mm', bottom ? `c₁ = ${n(tee.cy)} mm.` : `c₂ = ${n(tee.depth)} mm − ${n(tee.cy)} mm ≈ ${n(c)} mm.`,
            { dimension: edge });
        step('s' + edge, t('Use the same combined Iₓ for both sides. Divide it by the distance to the edge you just measured. This gives the elastic section modulus for that edge.'),
            bottom ? t('What is the section modulus for the bottom edge?') : t('What is the section modulus for the top edge?'),
            tee.inertia / c, 'mm³', `S${'₁₂'[i]} = Iₓ ÷ c${'₁₂'[i]} ≈ ${n(tee.inertia)} mm⁴ ÷ ${n(c)} mm ≈ ${n(tee.inertia / c)} mm³.`,
            { dimension: edge, units: t('Dividing mm⁴ by mm leaves mm³.'), legacy: bottom ? repeat ? 4 : 5 : undefined });
    }
    choice('governing', t('For the same bending moment, the edge with the smaller section modulus has the larger bending stress magnitude. Compare the two section moduli you just found.'),
        t('Which edge governs if both sides have the same allowable stress?'),
        [['bottom',t('Bottom edge')], ['top',t('Top edge'),t('The top edge is closer to the axis. Its larger section modulus gives a smaller bending stress magnitude.')]],
        'bottom', t('The bottom edge is farther from the axis. It has the smaller section modulus and takes the larger absolute bending stress.'));

    const target = repeat ? 325 + 20 * repeat : 340;
    turns.push(num(t`For a separate steel beam, a bending calculation gave a required modulus of ${n(target * 1000)} mm³. The steel table’s Sₓ column is in thousands of mm³, so divide by 1,000 to compare on the same scale.`,
        t('What number should you compare with the table’s Sₓ column?'), target, '10³ mm³',
        `${n(target * 1000)} mm³ = ${n(target)} × 10³ mm³.`,
        { drawing: 'steel-sample', figure: repeat ? () => workshopFigure(steelTable(table.rows)) : undefined, newExample: true }));
    const final = repeat ? repeatProblem(table, t`Keep rows with Sₓ at least ${n(target)} in the table units, then compare their mass per metre.`,
        { figure: () => workshopFigure(steelTable(table.rows)) }) : original.turns.at(-1);
    turns.push({ ...final, legacy: repeat ? 5 : 6 });
    return { ...original, index: 6, sectionLesson: true, sectionVisual: visuals, repeat: Boolean(repeat), turns };
}
