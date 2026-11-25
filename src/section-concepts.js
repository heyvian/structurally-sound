function bentBeamPlate(model) {
    const depth = 70;
    const neutralOffset = depth * (1 - model.cy / model.depth);
    const shape = height => `M25 ${height}Q160 ${height+53} 293 ${height}`;
    const top = 52, bottom = top + depth, middle = top + neutralOffset;
    const onCurve = (level, fraction) => {
        const rest = 1 - fraction;
        const x = 25 * rest ** 2 + 320 * rest * fraction + 293 * fraction ** 2;
        const y = level + 106 * rest * fraction;
        return [x / 4.6, y / 2];
    };
    const aria = t('Side view of a bending beam and its T cross-section');
    return workshopFigure(plate(aria,`
        <path class="section-bending-fill" d="${shape(top)}L293 ${bottom}Q160 ${bottom+53} 25 ${bottom}Z"/>
        <path class="section-combined-axis" d="${shape(middle)}"/>
        <path class="section-compress" d="${shape(top)}"/><path class="section-stretch" d="${shape(bottom)}"/>
        <path class="section-compress" d="M85 28h35m-6 -4l6 4l-6 4m120 -4h-35m6 -4l-6 4l6 4"/>
        <path class="section-stretch" d="M119 170H84m6 -4l-6 4l6 4m110 -4h35m-6 -4l6 4l-6 4"/>
        <text x="160" y="20" text-anchor="middle">${t('Compression')}</text>
        <text x="160" y="188" text-anchor="middle">${t('Tension')}</text>
        <path class="section-measure section-link" d="M293 ${middle}L370 ${middle}"/>
        <path class="section-piece" d="M347 ${top}h78v14h-32v56h-14v-56h-32Z"/>
        <path class="section-combined-axis" d="M339 ${middle}h96"/><circle class="section-centroid-mark" cx="386" cy="${middle}" r="4"/>
        <text x="386" y="${bottom+20}" text-anchor="middle">${t('Cross-section')}</text>`, 200),
    { mid: onCurve(middle, .5), top: onCurve(top, .19), bottom: onCurve(bottom, .81) });
}

function squaredDistancePlate(solved) {
    return workshopFigure(plate(t('Equal small areas at different distances from the same bending axis'), `
        <path class="section-combined-axis" d="M26 144H218"/><text x="27" y="162">x–x</text>
        <rect class="section-piece section-piece-active" x="62" y="106" width="16" height="16"/>
        <rect class="section-piece section-piece-active" x="154" y="46" width="16" height="16"/>
        <path class="section-measure section-link" d="M82 114H93V144M174 54H184V144"/>
        <text x="98" y="134">1 mm</text><text x="189" y="101">3 mm</text>
        <text x="46" y="96">1 mm²</text><text x="138" y="36">1 mm²</text>
        <text x="255" y="34">A × d²</text>
        <text x="255" y="62">1 mm² × (1 mm)²</text><text x="255" y="81">= 1 mm⁴</text>
        <text x="255" y="114">1 mm² × (3 mm)²</text><text x="255" y="133">= ${solved ? '9 mm⁴' : '?'}</text>`, 174));
}

function sectionStrips(x, y, width, height) {
    return Array.from({ length: 9 }, (_, i) => {
        const distance = Math.abs(i - 4) / 4;
        const opacity = .08 + .6 * distance ** 2;
        return `<rect class="section-strip" x="${x}" y="${y+i*height/9}" width="${width}" height="${height/9}" opacity="${opacity}"/>`;
    }).join('');
}

function orientationPlate(solved) {
    return workshopFigure(plate(t('The same rectangle flat and on edge about a horizontal axis'), `
        <text x="126" y="24" text-anchor="middle">${t('Flat')}</text><text x="333" y="24" text-anchor="middle">${t('On edge')}</text>
        <rect class="section-piece" x="61" y="84" width="126" height="42"/><rect class="section-piece" x="312" y="42" width="42" height="126"/>
        ${sectionStrips(61,84,126,42)}${sectionStrips(312,42,42,126)}
        <path class="section-combined-axis" d="M39 105H203M273 105H404"/>
        <text x="206" y="109">x–x</text><text x="408" y="109">x–x</text>
        <text x="124" y="146" text-anchor="middle">60 × 20 mm</text><text x="333" y="182" text-anchor="middle">20 × 60 mm</text>
        ${solved ? '<text x="124" y="207" text-anchor="middle">I₀ = 40000 mm⁴</text><text x="333" y="207" text-anchor="middle">I₀ = 360000 mm⁴</text>' : ''}`, solved ? 222 : 197));
}

function localStripPlate(part, showFormula = true) {
    const scale = Math.min(127/part.width, 102/part.depth);
    const width = part.width*scale, height = part.depth*scale;
    const left = 146-width/2, top = 74-height/2;
    const right = left+width, bottom=top+height;
    const reference = t('The width runs along the local axis. The height crosses it.');
    return plate(reference,`
        <rect class="section-piece" x="${left}" y="${top}" width="${width}" height="${height}"/>
        ${sectionStrips(left,top,width,height)}
        <path class="section-local-axis" d="M${left-13} 74H${right+10}"/>
        <text x="${right+13}" y="78">x₀</text>
        <path class="section-measure section-link" d="M${left} ${bottom+9}H${right}M${left} ${bottom+5}v8M${right} ${bottom+5}v8
            M${left-14} ${top}V${bottom}m-4 0h8M${left-18} ${top}h8"/>
        <text x="146" y="${bottom+24}" text-anchor="middle">b = ${numberText(part.width)} mm</text>
        <text x="${left-20}" y="78" text-anchor="end">h = ${numberText(part.depth)} mm</text>
        ${showFormula ? `<text x="263" y="58">I₀ = bh³/12</text>
            <text x="263" y="86">I₀ = (${numberText(part.width)} mm) ×</text>
            <text x="303" y="105">(${numberText(part.depth)} mm)³ / 12</text>` : ''}`,156);
}

function sectionShiftPlate(model, part, knownDistance) {
    const centre=60;
    const axis=part.cy < model.cy ? 29 : 94;
    const lower = part.cy < model.cy;
    const n=numberText;
    return plate(t('The same rectangle with its own axis and the whole T axis marked'),`
        <rect class="section-piece section-piece-active" x="53" y="42" width="90" height="36"/>
        <path class="section-local-axis" d="M36 ${centre}H222"/>
        <path class="section-combined-axis" d="M36 ${axis}H222"/>
        <text x="232" y="${centre+4}">x₀ · ${n(part.cy)} mm</text><text x="232" y="${axis+4}">x · ${n(model.cy)} mm</text>
        <path class="section-measure section-link" d="M157 ${centre}V${axis}m-4 0h8M153 ${centre}h8"/>
        <text x="164" y="${(axis+centre)/2+4}">d${knownDistance ? ' = '+n(part.offset)+' mm' : ''}</text>
        <text x="296" y="${lower?95:112}" text-anchor="middle">I = I₀ + A d²</text>`,126);
}

function sectionStressPlate(model, values) {
    const top=21, base=109, axis=base-(base-top)*model.cy/model.depth, zero=192;
    const slope=.96, xTop=zero-(axis-top)*slope, xBottom=zero+(base-axis)*slope;
    return plate(t('Bending stress increases with distance from the combined axis'),`
        <path class="section-combined-axis" d="M32 ${axis}H272"/>
        <path class="section-measure" d="M${zero} ${top}V${base}M38 ${top}H${zero}M38 ${base}H${zero}"/>
        <path class="section-compress-fill" d="M${zero} ${axis}L${xTop} ${top}H${zero}Z"/>
        <path class="section-stretch-fill" d="M${zero} ${axis}L${xBottom} ${base}H${zero}Z"/>
        <text x="32" y="${top+15}">${t('Compression')}</text><text x="32" y="${base-7}">${t('Tension')}</text>
        <text x="285" y="36">|σ| = |M|c / Iₓ</text><text x="285" y="65">Sₓ = Iₓ / c</text>
        ${Number.isFinite(values.ctop) ? `<text x="285" y="20">c₂ = ${numberText(values.ctop)} mm</text>` : ''}
        ${Number.isFinite(values.cbottom) ? `<text x="285" y="103">c₁ = ${numberText(values.cbottom)} mm</text>` : ''}`
        ,123);
}

function sectionCoordinatePlate(model, part, axis, checked) {
    const start = part[axis];
    const vertical = axis === 'y';
    const size = vertical ? part.depth : part.width;
    const extent = vertical ? model.depth : model.width;
    const coordinate = part['c' + axis];
    const point = distance => vertical ? [67, 121 - 99 * distance / extent] : [32 + 345 * distance / extent, 45];
    const span = (from, to) => `M${point(from).join(' ')}L${point(to).join(' ')}`;
    const [cx, cy] = point(coordinate);
    const formula = `${axis}ᵢ = ${numberText(start)} mm + (${numberText(size)} mm ÷ 2)`;
    return plate(t('Measure the distance from the datum to the centre in two parts'), `
        <path class="section-measure" d="${span(0, extent)}"/>
        <path class="section-measure section-origin-run" d="${span(0, start)}"/>
        <path class="section-measure section-half-run" d="${span(start, coordinate)}"/>
        <circle class="section-centre-mark" cx="${cx}" cy="${cy}" r="4"/>
        <text x="${vertical ? 48 : 32}" y="${vertical ? 138 : 65}">${axis} = 0</text>
        <text x="${vertical ? 110 : 28}" y="${vertical ? 58 : 22}">${formula}${checked ? ' = ' + numberText(coordinate) + ' mm' : ''}</text>`, vertical ? 147 : 76);
}

function balanceDiagram(model, height) {
    const [low,high] = model.parts;
    const x = value => 91 + 278 * (value - low.cy) / (high.cy-low.cy);
    const pivot = x(height);
    return plate(t('The two areas balance about the movable reference line'),`
        <text x="91" y="17" text-anchor="middle">${sectionPartName(low.name)} · ${numberText(low.area)} mm²</text>
        <text x="369" y="17" text-anchor="middle">${sectionPartName(high.name)} · ${numberText(high.area)} mm²</text>
        <circle class="section-piece" cx="91" cy="39" r="${18*Math.sqrt(low.area/high.area)}"/>
        <circle class="section-piece section-piece-1" cx="369" cy="39" r="18"/>
        <path class="section-measure" d="M91 61H369"/>
        <path class="section-measure section-origin-run" d="M91 61H${pivot}"/>
        <path class="section-measure section-half-run" d="M${pivot} 61H369"/>
        <path class="section-balance-pivot" d="M${pivot} 61l-11 17h22Z"/>
        <text x="91" y="84" text-anchor="middle">y₁ · ${numberText(low.cy)} mm</text><text x="369" y="84" text-anchor="middle">y₂ · ${numberText(high.cy)} mm</text>`,96);
}

function balanceProducts(model, height) {
    const [low,high]=model.parts;
    const first=low.area*(height-low.cy), second=high.area*(high.cy-height);
    const gap = Math.abs(first - second);
    const state = gap < .001 ? t('The two sides are in balance.') :
        gap < model.area * .015 ? t('The two sides are nearly in balance.') :
        first > second ? t('The web side has the larger area × distance.') : t('The flange side has the larger area × distance.');
    return `<p><strong>y = ${numberText(height)} mm</strong></p>
        <p>A₁ × (y − y₁) = ${numberText(first)} mm³</p>
        <p>A₂ × (y₂ − y) = ${numberText(second)} mm³</p>
        <p>${state}</p>`;
}

function centroidBalance(model, interactive, height = (model.parts[0].cy+model.parts[1].cy)/2) {
    const [web,flange]=model.parts;
    return `<div class="section-balance" data-centroid-balance>
        <strong>${t('Why area changes the balance point')}</strong><div data-balance-figure>${balanceDiagram(model,height)}</div>
        ${interactive ? `<label>${t('Move the reference line')}
            <input data-balance-slider type="range" min="${web.cy}" max="${flange.cy}" value="${height}" step=".01"></label>` : ''}
        <div class="section-balance-products" data-balance-products>${balanceProducts(model,height)}</div></div>`;
}

function bindSectionBalance(root, model) {
    const block=root.querySelector('[data-active-step] [data-centroid-balance]');
    const slider=block?.querySelector('[data-balance-slider]');
    slider?.addEventListener('input', ()=> {
        const height=Number(slider.value);
        block.querySelector('[data-balance-figure]').innerHTML=balanceDiagram(model,height);
        block.querySelector('[data-balance-products]').innerHTML=balanceProducts(model,height);
    });
}

function sectionConceptDrawing(detail, solved) {
    const { concept, model } = detail;
    if (concept === 'neutral') return bentBeamPlate(model);
    const drawing = concept === 'squares' ? squaredDistancePlate(solved) :
        concept === 'orientation' ? orientationPlate(solved) : workshopFigure(localStripPlate(model.parts[0], solved));
    return { ...drawing, title: t('Drawing') };
}
