const quizTrussMembers = ['AB','AC','BC','BD','CD','CE','ED'];

function trussQuizFrame(model, phase, known) {
    const { nodes, width, bay, load } = model;
    const scale = Math.min(148 / width, 158 / (2 * bay));
    const dx = 215 - width * scale / 2;
    const coordinates = Object.fromEntries(Object.entries(nodes).map(([name, [x,y]]) => [name, [dx + x * scale, 216 - y * scale]]));
    const [ax, ay] = coordinates.A, [bx] = coordinates.B, [, ey] = coordinates.E;
    const points = Object.fromEntries(Object.entries(coordinates).map(([name, [x,y]]) => [name, [x / 4.6, y / 2.76]]));
    const showReactions = phase !== 'whole' || Object.hasOwn(known, 'Aₓ');
    const glyph = (name, x, y, vx, vy, length, labelSide) => forceGlyph({ x, y, dx: vx, dy: vy, name, length, labelSide, unit: 'kN' }, known[name]);
    const moment = phase === 'moment' ? `<path class="truss-quiz-arm" d="M${ax-50} ${ey}H${ax-6}M${ax-47} ${ey}V${ay}H${ax-5}M${ax} ${ay+29}H${bx}"/>
        <text class="truss-quiz-label" x="${ax-56}" y="${(ey+ay)/2}" text-anchor="end">${numberText(bay*2)} m</text>
        <text class="truss-quiz-label" x="${(ax+bx)/2}" y="${ay+25}" text-anchor="middle">${numberText(width)} m</text>` :
        `<path class="truss-dim" d="M${ax} ${ay+31}H${bx}m0 -4v8M${ax} ${ay+27}v8"/>
        <text x="${(ax+bx)/2}" y="${ay+47}" text-anchor="middle">${numberText(width)} m</text>`;
    const transfer = phase === 'transfer' ? `<path class="truss-quiz-arm" d="M${ax} ${ey}L${coordinates.D.join(' ')}"/>` : '';
    return workshopFigure(plate(t('Whole truss with a horizontal load at E'), `
        ${quizTrussMembers.map(name=>{
            const from=coordinates[name[0]], to=coordinates[name[1]], value=known[name];
            const state=Number.isFinite(value) ? (value<0?'compression':'tension') : 'frame';
            const midX = (from[0] + to[0]) / 2 + (from[0]===to[0] ? 6 : 0);
            const midY = (from[1] + to[1]) / 2 - 6;
            return `<path class="truss-quiz-member ${state}" d="M${from.join(' ')}L${to.join(' ')}"/>
                ${Number.isFinite(value) ? `<text class="truss-quiz-label" x="${midX}" y="${midY}">${value>0?'+':''}${numberText(value)}</text>` : ''}`;
        }).join('')}
        ${transfer}${moment}
        <path class="support-symbol" d="M${ax} ${ay}l-9 13h18zM${bx} ${ay}l-9 13h18z"/>
        <circle class="support-symbol" cx="${bx-5}" cy="${ay+17}" r="2"/><circle class="support-symbol" cx="${bx+5}" cy="${ay+17}" r="2"/>
        ${Object.entries(coordinates).map(([name,[x,y]])=>`<circle class="truss-quiz-node" cx="${x}" cy="${y}" r="4"/>
            <text class="truss-quiz-label" x="${x+8}" y="${y-6}">${name}</text>`).join('')}
        <path class="diagram-arrow" d="M${ax-64} ${ey}H${ax-9}"/>
        <text x="${ax-63}" y="${ey-8}">${numberText(load)} kN</text>
        ${showReactions ? glyph('Aₓ',ax,ay,1,0,47) + glyph('Aᵧ',ax,ay,0,-1,41,'left') + glyph('Bᵧ',bx,ay,0,-1,47) : ''}
        ${phase==='moment' ? `<circle class="moment-pivot" cx="${ax}" cy="${ay}" r="6"/>` : ''}
        <text x="${bx+24}" y="${(ey+ay)/2}">${numberText(bay)} m + ${numberText(bay)} m</text>`, 276), points);
}

function trussTaFrame(model, phase, known) {
    const { left, right, span, depth, nodes } = model;
    const scale = Math.min(284 / span, 110 / depth);
    const start = 230 - span * scale / 2;
    const top = 92;
    const coordinates = Object.fromEntries(Object.entries(nodes).map(([name, [x, y]]) => [name, [start + x * scale, top - y * scale]]));
    const [ax] = coordinates.A, [bx] = coordinates.B, [dx] = coordinates.D;
    const [, cy] = coordinates.C;
    const points = Object.fromEntries(Object.entries(coordinates).map(([name, [x, y]]) => [name, [x / 4.6, y / 2.76]]));
    const arrows = [[dx, model.middleLoad], [bx, model.endLoad]].map(([x, value]) =>
        `<path class="diagram-arrow" d="M${x} 35V${top-7}"/><text x="${x+8}" y="46">${numberText(value)} kN</text>`).join('');
    const dimension = (from, to, y, value) => `<path class="truss-dim" d="M${from} ${y}H${to}m0 -4v8M${from} ${y-4}v8"/>
        <text x="${(from+to)/2}" y="${y+16}" text-anchor="middle">${numberText(value)} m</text>`;
    const braces = model.members.map(name => {
        const [x1, y1] = coordinates[name[0]], [x2, y2] = coordinates[name[1]];
        const value = known[name];
        const state = !Number.isFinite(value) ? '' : value < 0 ? 'compression' : 'tension';
        const label = !Number.isFinite(value) ? '' : phase === 'summary' ?
            `${numberText(Math.abs(value))} kN · ${(value < 0 ? 'C' : 'T')}` : `${value > 0 ? '+' : ''}${numberText(value)}`;
        const positions = { AC: [(x1+x2)/2 - 5, 168, 'end'], BC: [(x1+x2)/2 + 6, 173, 'start'],
            CD: [x1 + 8, 139, 'start'] };
        const [labelX, labelY, align] = positions[name] ?? [(x1+x2)/2, top - 8, 'middle'];
        return `<path class="truss-quiz-member ${state}" d="M${x1} ${y1}L${x2} ${y2}"/>
            ${label ? `<text class="truss-quiz-label" x="${labelX}" y="${labelY}" text-anchor="${align}">${label}</text>` : ''}`;
    }).join('');
    const supports = phase === 'whole' ? `<path class="support-symbol" d="M${ax} ${top}l-9 13h18zM${bx} ${top}l-9 13h18z"/>
        <circle class="support-symbol" cx="${bx-5}" cy="${top+17}" r="2"/><circle class="support-symbol" cx="${bx+5}" cy="${top+17}" r="2"/>` :
        ['A', 'B'].flatMap(joint => model.external[joint].filter(arrow => arrow.value === undefined).map(arrow => {
            const [x, y] = coordinates[joint];
            if (known[arrow.name] === 0) return `<text class="truss-quiz-label" x="${x-8}" y="${y+26}" text-anchor="end">${arrow.name} = 0 kN</text>`;
            return forceGlyph({ x, y: y + (arrow.dy ? 46 : 0), dx: arrow.dx, dy: -arrow.dy,
                name: arrow.name, length: arrow.dy ? 41 : 28, labelSide: joint === 'A' ? 'left' : 'right', unit: 'kN' }, known[arrow.name]);
        })).join('');
    const moment = phase === 'moment' ? `<path class="truss-quiz-arm" d="M${ax} ${top}V224H${dx}V${top}M${bx} ${top}V250H${ax}V224"/>
        <circle class="moment-pivot" cx="${ax}" cy="${top}" r="7"/>` : '';
    const drawing = workshopFigure(plate(t('Whole truss with two downward loads'), `
        ${moment}${braces}${arrows}${supports}
        ${Object.entries(coordinates).map(([name, [x, y]]) => `<circle class="truss-quiz-node" cx="${x}" cy="${y}" r="4"/>
            <text class="truss-quiz-label" x="${x+8}" y="${y+13}">${name}</text>`).join('')}
        ${dimension(ax, dx, 224, left)}${dimension(phase === 'moment' ? ax : dx, bx, phase === 'moment' ? 250 : 224, phase === 'moment' ? span : right)}
        <path class="truss-dim" d="M414 ${top}V${cy}m-4 0h8M410 ${top}h8"/>
        <text x="422" y="${(cy+top)/2}">${numberText(depth)} m</text>`, 276), points);
    if (phase === 'summary') drawing.tools = `<p class="truss-quiz-key">${t('T = tension · C = compression · 0 = zero force')}</p>`;
    return drawing;
}

function trussTipTail(arrow, angle, active, quiz) {
    const startX = 421, startY = 91;
    const x = startX + arrow.dx * 82, y = startY - arrow.dy * 82;
    const horizontal = quiz ? t('Opposite') : 'sin θ';
    const vertical = quiz ? t('Adjacent') : 'cos θ';
    return `<g class="truss-tip-tail">
        <text x="319" y="70">${t('Tip-to-tail')}</text>
        <path class="truss-quiz-ghost ${active === 'x' ? 'truss-quiz-emph' : ''}" d="M${startX} ${startY}H${x}m5 -3l-5 3l5 3"/>
        <path class="truss-quiz-ghost ${active === 'y' ? 'truss-quiz-emph' : ''}" d="M${x} ${startY}V${y}m-3 -5l3 5l3 -5"/>
        <path class="diagram-arrow" d="M${startX} ${startY}L${x} ${y}"/>
        <circle class="truss-quiz-node" cx="${startX}" cy="${startY}" r="3"/>
        <text class="truss-quiz-label" x="${(startX+x)/2}" y="${startY-5}" text-anchor="middle">${horizontal}</text>
        <text class="truss-quiz-label" x="${x-5}" y="${(startY+y)/2+4}" text-anchor="end">${vertical}</text>
        <text class="truss-quiz-label" x="${x+6}" y="${y-5}">θ</text>
        <text x="${x-1}" y="${y+19}">θ = ${numberText(angle)}°</text>
    </g>`;
}

function trussQuizJoint(detail, known) {
    const { joint, model, member, projection, axis, ratioQuiz, tipTail, angleAxis = 'x' } = detail;
    const [fromX, fromY] = model.nodes[joint];
    const arrows = (model.members ?? quizTrussMembers).filter(name=>name.includes(joint)).map(name=>{
        const [toX,toY] = model.nodes[name.replace(joint,'')];
        const dx = toX-fromX, dy = toY-fromY, length = Math.hypot(dx,dy);
        return { name, dx:dx/length, dy:dy/length, value:known[name] };
    });
    const external = model.external || {
        A: [{name:'Aₓ',dx:1,dy:0,value:known.Aₓ},{name:'Aᵧ',dx:0,dy:1,value:known.Aᵧ}],
        B: [{name:'Bᵧ',dx:0,dy:1,value:known.Bᵧ}],
        E: [{name:'P',dx:1,dy:0,value:model.load}],
    };
    const externalForces = (external[joint] || []).map(arrow => ({ ...arrow, value: arrow.value ?? known[arrow.name] }));
    const forces = [...arrows, ...externalForces];
    const cx = tipTail ? 184 : 220, cy = 111, arrowLength = 76;
    const guideArrow = arrows.find(arrow=>arrow.name===member && arrow.dx && arrow.dy) || arrows.find(arrow=>arrow.dx && arrow.dy);
    const triangle = tipTail ? trussTipTail(guideArrow, model.angleB, axis, ratioQuiz) : projection && guideArrow?.dx && guideArrow?.dy ? (() => {
        const x = cx+guideArrow.dx*102, y=cy-guideArrow.dy*102;
        const sign=guideArrow.dy>0?-1:1;
        return `<path class="truss-quiz-ghost ${axis==='x'?'truss-quiz-emph':''}" d="M${cx} ${cy}H${x}"/>
            <path class="truss-quiz-ghost ${axis==='y'?'truss-quiz-emph':''}" d="M${x} ${cy}V${y}"/>
            <path class="truss-quiz-ghost" d="M${cx} ${cy}L${x} ${y}"/>
            <text class="truss-quiz-label" x="${cx+guideArrow.dx*44}" y="${cy+sign*16}" text-anchor="middle">θ</text>
            <text class="truss-quiz-label" x="${(cx+x)/2}" y="${cy-sign*9}" text-anchor="middle">${ratioQuiz ? t('Adjacent') : 'cos θ'}</text>
            <text class="truss-quiz-label" x="${x+(guideArrow.dx>0?8:-8)}" y="${(cy+y)/2}" text-anchor="${guideArrow.dx>0?'start':'end'}">${ratioQuiz ? t('Opposite') : 'sin θ'}</text>`;
    })() : '';
    const glyphs = forces.map(({ name, dx, dy, value }) => {
        const length = name.startsWith('A') && name.length===2 && arrows.some(a=>a.name===name) ? arrowLength :
            name.includes('ₓ') || name.includes('ᵧ') ? 63 : arrowLength;
        return `<g class="${Number.isFinite(value) ? '' : 'truss-quiz-assumed'}" data-truss-member="${name}">${forceGlyph({
            x:cx, y:cy, dx, dy:-dy, length, name, unit:'kN',
        },value)}</g>`;
    }).join('');
    const label = t`Forces on isolated joint ${joint}`;
    const drawing = workshopFigure(plate(label,`
        <text x="15" y="22">${label}</text>
        <path class="truss-quiz-axis" d="M389 45h40l-5 -4m5 4l-5 4M389 45V22l-4 5m4 -5l4 5"/>
        <text x="432" y="49">+x</text><text x="396" y="22">+y</text>
        ${triangle}${glyphs}<circle class="truss-quiz-node" cx="${cx}" cy="${cy}" r="5"/>`,222));
    const component = ({name, dx, dy, value}, coordinate) => {
        const factor = coordinate==='x'? dx : dy;
        if (!factor) return '0';
        if (ratioQuiz && Math.abs(factor) !== 1) return '—';
        if (Number.isFinite(value)) {
            const part = value * factor;
            return part>0? '+'+numberText(part) : numberText(part);
        }
        const ratio = Math.abs(factor) === 1 ? '' : coordinate === angleAxis ? ' cos θ' : ' sin θ';
        return (factor>0?'＋':'−') + name + ratio;
    };
    drawing.tools = `<table class="section-ledger truss-quiz-components">
        <thead><tr><th scope="col">${t('Force')}</th><th scope="col" ${axis==='x'?'class="truss-quiz-sum"':''}>Fₓ · kN</th>
            <th scope="col" ${axis==='y'?'class="truss-quiz-sum"':''}>Fᵧ · kN</th></tr></thead>
        <tbody>${forces.map(force=>`<tr><th scope="row">${force.name}</th><td ${axis==='x'?'class="truss-quiz-sum"':''}>${component(force,'x')}</td>
            <td ${axis==='y'?'class="truss-quiz-sum"':''}>${component(force,'y')}</td></tr>`).join('')}</tbody></table>
        <p class="truss-quiz-key">${t('Dashed arrows are assumed pulls. Solid arrows show the forces you know.')}${projection ? ` · θ = ${numberText(detail.angle ?? model.angle)}°` : ''}</p>`;
    drawing.progress = (model.members ? trussTaFrame(model, 'supports', known) : trussQuizFrame(model, 'whole', known)).markup;
    return drawing;
}

function trussQuizDrawing(detail, known) {
    if (detail.phase === 'zero-three') return workshopDrawings['zero-joint']();
    if (detail.phase === 'zero-two') return workshopFigure(plate(t('Two angled members meet at a joint with no external load'), `
        <path class="diagram-line" d="M110 110H235L340 43"/><circle class="truss-quiz-node" cx="235" cy="110" r="5"/>
        <text x="235" y="140" text-anchor="middle">${t('Unloaded joint')}</text>`));
    if (detail.joint) return trussQuizJoint(detail, known);
    const frame = detail.model.members ? trussTaFrame : trussQuizFrame;
    return frame(detail.model, detail.phase, known);
}

function trussQuizLearned(workshop, run, i) {
    const known={};
    for (let j=0;j<=i;j++) {
        const turn=workshop.turns[j], detail=turn.trussQuiz;
        if (detail?.key && run.records[j]?.status) known[detail.key]=turn.expected;
    }
    return known;
}

function trussQuizPracticeDrawing(question, solved) {
    const detail=question.trussQuiz;
    const known=Object.fromEntries((detail.known || []).map(name=>[name,detail.model.forces[name]]));
    if (solved) known[detail.key]=question.answer;
    const drawing=trussQuizDrawing(detail,known);
    if (solved && detail.recap) {
        const summary = trussTaFrame(detail.model, 'summary', known);
        return drawing.markup + (drawing.tools || '') + summary.markup + summary.tools;
    }
    return drawing.markup + (drawing.tools || '');
}
