const quickDecisionTitle = t('Quick decisions');

function makeQuickDecisionCards(seed) {
    const pick = (stride, size) => Math.floor(seed / stride) % size;
    const amount = 5 + pick(1, 26);
    const compression = pick(3, 2) === 0;
    const arrowCompression = pick(5, 2) === 0;
    const otherSide = pick(7, 2) === 0;
    const member = otherSide ? 'BC' : 'AB';
    const signed = (compression ? '−' : '+') + numberText(amount) + ' kN';
    const fromHorizontal = pick(11, 2) === 0;
    const decideVertical = pick(13, 2) === 0;
    const startTop = pick(17, 2) === 0;
    const model = mixedFinalTruss(5+pick(19,4), 4+pick(23,4), 3+pick(29,3), 30+amount, amount, amount+4);
    const frontArrows = () => {
        const x = otherSide ? 306 : 154;
        const adjacent = otherSide ? -1 : 1;
        const direction = adjacent * (arrowCompression ? -1 : 1);
        return plate(t('One joint and the force exerted on it by a member'), `
            <path class="diagram-dash" d="M154 91H306"/>
            ${forceGlyph({x:arrowCompression ? x + adjacent * 55 : x,y:91,dx:direction,dy:0,length:51,name:member})}
            <circle class="truss-quiz-node" cx="${x}" cy="91" r="5"/>
            <text x="${x}" y="115" text-anchor="middle">${otherSide ? member[1] : member[0]}</text>`, 141);
    };
    const angleFigure = () => {
        const run = 75 + 9 * pick(31,5), rise = 46 + 8 * pick(41,4);
        const angle = Math.atan2(fromHorizontal ? rise : run, fromHorizontal ? run : rise) * 180 / Math.PI;
        const [ox,oy] = [126,118], hx=ox+run, hy=oy-rise;
        const length = Math.hypot(run, rise), r = 23;
        const arc = fromHorizontal ? `M${ox+r} ${oy}A${r} ${r} 0 0 0 ${ox+r*run/length} ${oy-r*rise/length}` :
            `M${hx} ${hy+r}A${r} ${r} 0 0 1 ${hx-r*run/length} ${hy+r*rise/length}`;
        const ax = fromHorizontal ? ox+32 : hx-9;
        const ay = fromHorizontal ? oy-7 : hy+24;
        return plate(t('A force arrow and its horizontal and vertical components'), `
            <path class="diagram-dash" d="M${ox} ${oy}H${hx}V${hy}"/>
            <path class="diagram-arrow" d="M${ox} ${oy}L${hx} ${hy}"/>
            <path class="section-measure section-link" d="${arc}"/>
            <text x="${ax}" y="${ay}" text-anchor="${fromHorizontal ? 'start' : 'end'}">θ = ${numberText(angle)}°</text>
            <text x="${(ox+hx)/2}" y="${oy+19}">Fₓ</text><text x="${hx+9}" y="${(oy+hy)/2}">Fᵧ</text>`, 150);
    };
    const adjacent = decideVertical !== fromHorizontal;
    const inspectJoint = startTop ? 'E' : 'A';
    const other = startTop ? 'D' : 'B';
    const pivot = otherSide ? 'B' : 'A';
    const otherPivot = otherSide ? 'A' : 'B';
    const beam = { L: 6 + pick(43,6), a: 0, b: 6 + pick(43,6),
        points: [{x:2,p:amount}], udls:[] };
    const concentrated = pick(47,2) === 0;
    const drawnLoad = concentrated ? beam : { ...beam, points:[], couples:[{x:2,m:(compression?-1:1)*amount}] };
    return [
        { id:'quick-start', topic:8, prompt:t`Which joint would you solve first, ${inspectJoint} or ${other}? The support reactions are known.`,
            answer:t`Start at ${inspectJoint}. It has two unknown member forces. There are three at ${other}, and the two joint equations cannot find all three yet.`,
            front:() => trussQuizOverview(model, 'supports', Object.fromEntries(Object.entries(model.forces).slice(0,3))).markup },
        { id:'quick-sign', topic:8, prompt:t`You assumed tension and found ${member} = ${signed}. Is the member in tension or compression?`,
            answer:compression ? t`Compression, ${numberText(amount)} kN. The negative result reverses the assumed pull, so the member pushes on the joint.` :
                t`Tension, ${numberText(amount)} kN. The positive result confirms the member is pulling on the joint.` },
        { id:'quick-arrows', topic:8, prompt:t`Look at the force that member ${member} exerts on the drawn joint. Is the member pulling or pushing?`,
            answer:arrowCompression ? t('It acts toward the joint from the member side. That is a push, so the member is in compression.') :
                t('It points away from the joint along the member. That is a pull, so the member is in tension.'), front:frontArrows },
        { id:'quick-projection', topic:1, prompt:decideVertical ? t('For the marked angle θ, do you use sine or cosine to find the vertical component?') :
                t('For the marked angle θ, do you use sine or cosine to find the horizontal component?'),
            answer:adjacent ? t('Use cosine. That component is the leg beside the marked angle.') : t('Use sine. That component is the leg across from the marked angle.'),
            front:angleFigure },
        { id:'quick-pivot', topic:3, prompt:t`Which point would you take moments about to eliminate the vertical reaction at ${pivot}?`,
            answer:t`Take moments about ${pivot}. Its reaction goes through that point, so its lever arm is zero. The reaction at ${otherPivot} keeps its lever arm.`,
            front:() => beamFigure(beam) },
        { id:'quick-jump', topic:4, prompt:t('At the marked applied load, which diagram jumps, shear or moment?'),
            answer:concentrated ? t('The straight downward arrow is a point force. Shear jumps down by the force magnitude. Moment stays continuous.') :
                t('The curved arrow is an applied couple. The moment diagram jumps. The couple adds no vertical force, so shear stays continuous there.'),
            front:() => beamFigure(drawnLoad) },
    ];
}

const quickDecisionIds = makeQuickDecisionCards(1).map(card => card.id);
