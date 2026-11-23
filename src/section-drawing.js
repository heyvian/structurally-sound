function sectionPlate(model, kind, values = {}, { part: active, dimension, symmetry } = {}, draft) {
    const n = numberText;
    const scale = Math.min(162 / model.width, 148 / model.depth);
    const left = 143, base = 199;
    const x = value => left + value * scale;
    const y = value => base - value * scale;
    const right = x(model.width), top = y(model.depth);
    const dim = (x1, y1, x2, y2, label) => {
        const vertical = x1 === x2;
        const [dx, dy] = vertical ? [4, 0] : [0, 4];
        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
        return `<path class="section-measure" d="M${x1} ${y1}L${x2} ${y2}M${x1 - dx} ${y1 - dy}l${2 * dx} ${2 * dy}M${x2 - dx} ${y2 - dy}l${2 * dx} ${2 * dy}"/>
            <text x="${mx + (vertical ? 7 : 0)}" y="${my + (vertical ? 4 : -6)}" text-anchor="${vertical ? 'start' : 'middle'}">${label}</text>`;
    };
    const rects = model.parts.map(({ x: px, y: py, width, depth }, i) => `<rect class="section-piece section-piece-${i % 2}${active === i ? ' section-piece-active' : ''}"
        x="${x(px)}" y="${y(py + depth)}" width="${width * scale}" height="${depth * scale}"/>`).join('');
    const xAxis = symmetry || kind === 'tee' || kind === 'i' ? `<path class="section-symmetry" d="M${x(model.width / 2)} ${top - 4}V${base + 6}"/>` : '';
    const yAxis = symmetry || kind === 'i' ? `<path class="section-symmetry" d="M${left - 7} ${y(model.depth / 2)}H${right + 7}"/>` : '';
    const horizontalMidpoint = Number.isFinite(values.cy) ? y(values.cy) : null;
    const verticalMidpoint = Number.isFinite(values.cx) ? x(values.cx) : kind === 'tee' ? x(model.cx) : null;
    const axisMarkup = `${Number.isFinite(values.cx) ? `<path class="section-combined-axis" d="M${verticalMidpoint} ${top - 6}V${base + 19}"/>
        <text class="section-axis-text" x="${verticalMidpoint + 5}" y="${base + 18}">x̄ = ${n(values.cx)} mm</text>` : ''}
        ${horizontalMidpoint === null ? '' : `<path class="section-combined-axis" d="M${left - 20} ${horizontalMidpoint}H${right + 50}"/>
            <text class="section-axis-text" x="${right + 54}" y="${horizontalMidpoint + 4}">ȳ = ${n(values.cy)} mm</text>`}
        ${verticalMidpoint === null || horizontalMidpoint === null ? '' :
            `<circle class="section-centroid-mark" cx="${verticalMidpoint}" cy="${horizontalMidpoint}" r="5"/>`}`;
    const local = model.parts.map((p, i) => {
        const showY = Number.isFinite(values['y' + i]) || active === i && ['y', 'local', 'offset'].includes(dimension);
        const showX = Number.isFinite(values['x' + i]) || active === i && dimension === 'x' && kind === 'angle';
        if (!showX && !showY) return '';
        return `${showY ? `<path class="section-local-axis" d="M${x(p.x) - 7} ${y(p.cy)}H${x(p.x + p.width) + 7}"/>` : ''}
            ${showX && kind === 'angle' ? `<path class="section-local-axis" d="M${x(p.cx)} ${y(p.y + p.depth)}V${base + 9}"/>` : ''}
            <circle class="section-centre-mark" cx="${x(p.cx)}" cy="${y(p.cy)}" r="3.5"/>`;
    }).join('');
    const focus = model.parts[active];
    const dimensions = [
        dim(left, base + 38, right, base + 38, `${n(model.width)} mm`),
        dim(right + 15, top, right + 15, base, `${n(model.depth)} mm`),
    ];
    let seam = '';
    if (kind === 'tee') {
        const [web, flange] = model.parts, seamY = y(flange.y);
        seam = `M${x(web.x)} ${seamY}H${x(web.x + web.width)}`;
        dimensions.push(dim(x(web.x), base + 19, x(web.x + web.width), base + 19, `${n(web.width)} mm`),
            dim(right + 65, top, right + 65, seamY, `${n(flange.depth)} mm`),
            dim(right + 65, seamY, right + 65, base, `${n(web.depth)} mm`));
    } else if (kind === 'angle') {
        const [leg, foot] = model.parts;
        seam = `M${x(leg.width)} ${y(foot.depth)}V${base}`;
        dimensions.push(dim(left, top - 9, x(leg.width), top - 9, `${n(leg.width)} mm`),
            dim(right + 65, y(foot.depth), right + 65, base, `${n(foot.depth)} mm`));
    }
    const measurement = active !== undefined && dimension === 'y' && focus ? dim(left - 26, y(focus.cy), left - 26, base,
        Number.isFinite(values['y' + active]) ? `y${'₁₂'[active]} = ${n(focus.cy)} mm` : `y${'₁₂'[active]}`) :
        dimension === 'offset' && focus && horizontalMidpoint !== null ? dim(left - 26, y(values.cy), left - 26, y(focus.cy),
            Number.isFinite(values['d' + active]) ? `d = ${n(focus.offset)} mm` : 'd') :
        ['bottom', 'top'].includes(dimension) && horizontalMidpoint !== null ?
            dim(left - 26, y(values.cy), left - 26, dimension === 'bottom' ? base : top,
                Number.isFinite(values['c' + dimension]) ? `c = ${n(values['c' + dimension])} mm` : 'c') : '';
    const candidate = Number.isFinite(draft) && draft >= 0 && active === undefined &&
        (dimension === 'x' && draft <= model.width || dimension === 'y' && draft <= model.depth) ?
        `<path data-section-draft class="section-draft-axis" d="${dimension === 'x' ? `M${x(draft)} ${top - 6}V${base + 7}` :
            `M${left - 19} ${y(draft)}H${right + 46}`}"/>` : '';
    const points = Object.fromEntries(model.parts.map(p => [p.name, [x(p.cx) / 4.6, y(p.cy) / 2.57]]));
    const label = { rectangle: t('Rectangular section with left and bottom datums'), tee: t('T section with its flange, web, and centroid'),
        angle: t('L section split into a vertical leg and a foot extension'), i: t('Symmetric I section with left and bottom datums') }[kind];
    return { ...workshopFigure(plate(label, `
        ${rects}${seam ? `<path class="section-seam" d="${seam}"/>` : ''}
        ${xAxis}${yAxis}
        <path class="section-datum" d="M${left} ${top - 7}V${base}H${right + 10}"/>
        <text x="${left - 7}" y="${top - 10}" text-anchor="end">x = 0</text>
        <text x="${left - 8}" y="${base + 4}" text-anchor="end">y = 0</text>
        ${local}${axisMarkup}${candidate}
        ${dimensions.join('')}${measurement}
        ${['tee', 'angle'].includes(kind) ? model.parts.map((p, i) => `<text class="section-piece-label" x="${x(p.cx)}" y="${y(p.cy) - (p.depth * scale < 25 ? 3 : 11)}"
            text-anchor="middle">${i + 1}</text>`).join('') : ''}`, 257), points), title: label };
}

function sectionLessonValues(workshop, run, index) {
    const { kind } = workshop.turns[index].section;
    const result = {};
    for (let i = 0; i <= index; i++) {
        const turn = workshop.turns[i];
        if (turn.section?.kind === kind && run.records[i]?.status && turn.type === 'number') result[turn.section.key] = turn.expected;
    }
    return result;
}

function sectionLessonDrawing(workshop, run, index) {
    const detail = workshop.turns[index].section;
    const { model, kind } = detail;
    const record = run.records[index];
    const values = sectionLessonValues(workshop, run, index);
    const draft = record?.status ? undefined : diagramDraft(record?.draft, record?.draftLocale).value;
    const drawing = sectionPlate(model, kind, values, detail, draft);
    if (kind === 'rectangle') return drawing;
    const inertia = ['local', 'offset', 'bottom', 'top'].includes(detail.dimension) || detail.key === 'governing';
    const columns = inertia ? [
        ['I₀', 'mm⁴', i => values['i' + i]], ['d', 'mm', i => values['d' + i]], ['A d²', 'mm⁴', i => values['shift' + i]],
    ] : [
        ['A', 'mm²', i => values['a' + i]], ...(kind === 'angle' ? [['x', 'mm', i => values['x' + i]]] : []),
        ['y', 'mm', i => values['y' + i]], ...(kind === 'tee' ? [['Ay', 'mm³', i => values['qy' + i]]] : []),
    ];
    const number = value => Number.isFinite(value) ? numberText(value) : '—';
    drawing.tools = `<table class="section-ledger"><thead><tr>
        <th scope="col">${t('Piece')}</th>${columns.map(([name, unit]) => `<th scope="col">${name}<small>${unit}</small></th>`).join('')}
        </tr></thead><tbody>${model.parts.map((p,i) => `<tr ${i === detail.part ? 'class="section-ledger-active"' : ''}>
            <th scope="row">${i + 1} · ${sectionPartName(p.name)}</th>${columns.map(([, , value]) => `<td>${number(value(i))}</td>`).join('')}</tr>`).join('')}
        </tbody></table>`;
    const totals = inertia ? [['Iₓ', values.inertia, 'mm⁴'], ['S₁', values.sbottom, 'mm³'], ['S₂', values.stop, 'mm³']] :
        [['ΣA', values.area, 'mm²'], ['ΣAy', values.qy, 'mm³']];
    drawing.tools += `<p class="section-totals">${totals.filter(([, value]) => Number.isFinite(value))
        .map(([symbol, value, units]) => `<span>${symbol} = ${number(value)} ${units}</span>`).join('')}</p>`;
    return drawing;
}

function sectionPracticeFigure(question, solved) {
    const { model, kind } = question.sectionCase;
    const values = solved ? { cx: model.cx, cy: model.cy } : {};
    if (solved && kind === 'angle') model.parts.forEach((part, i) => {
        values['x' + i] = part.cx;
        values['y' + i] = part.cy;
    });
    return sectionPlate(model, kind, values).markup;
}
