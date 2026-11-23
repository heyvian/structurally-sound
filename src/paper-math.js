function paperCalculation(symbol, label, unit, inputs, numerator, denominator, calculate) {
    return { symbol, label, unit, inputs, calculate, paper: { numerator, denominator } };
}

function paperSymbols({ symbol, label, unit, inputs }) {
    return symbolDefinitions([[symbol, label, unit], ...inputs]);
}

function symbolDefinitions(entries) {
    return `<dl class="paper-symbols" aria-label="${t('What the symbols mean')}">
        ${entries.map(([name, meaning, units]) => `<div>
            <dt><var>${escapeTutor(name)}</var></dt><dd>${escapeTutor(meaning)}${units ? ` (${escapeTutor(units)})` : ''}</dd>
        </div>`).join('')}
    </dl>`;
}

function paperEquation(calculation, mode, values = calculation.inputs.map(input => input[3])) {
    const { symbol, paper, inputs } = calculation;
    const atoms = tokens => tokens.map(token => {
        if (typeof token === 'string') return `<span>${token}</span>`;
        const [variable, label, unit, expected] = inputs[token];
        if (mode === 'symbol') return `<var>${variable}</var>`;
        if (mode === 'value') {
            const valueUnit = paper.valueUnits?.[token] ?? unit;
            return `<span class="math-term">(${numberText(values[token])}${valueUnit ? ` ${valueUnit}` : ''})</span>`;
        }
        return `<label class="math-slot">
            <span class="math-slot-key" aria-hidden="true">${variable}</span>
            <input class="study-number" type="text" inputmode="${expected < 0 ? 'text' : 'decimal'}" size="6"
                aria-label="${escapeTutor(unit ? `${variable} · ${label} (${unit})` : `${variable} · ${label}`)}"
                placeholder="${variable}" data-formula-input="${token}">
            ${unit ? `<span>${unit}</span>` : ''}
        </label>`;
    }).join('');
    const numerator = `<span class="math-part">${atoms(paper.numerator)}</span>`;
    const formula = paper.denominator ? `<span class="math-fraction">${numerator}<span class="math-part">${atoms(paper.denominator)}</span></span>` : numerator;
    const conversion = mode !== 'symbol' && paper.conversion ? `<span class="math-conversion">${localizedEquation(paper.conversion)}</span>` : '';
    return `<div class="math-equation"><var>${symbol}</var><span>=</span>${formula}${conversion}</div>`;
}

function paperResult(calculation, values) {
    const result = calculation.calculate(...values);
    return `<div class="math-result"><var>${calculation.symbol}</var> = <strong>${numberText(result)} ${calculation.unit}</strong></div>`;
}

function recordedCalculation(turn, record) {
    const calculation = turn.calculation;
    if (!calculation?.paper) return '';
    const values = record?.substitution || calculation.inputs.map(input => input[3]);
    return `<div class="lesson-paper-work"><h4>${t('Formula substitution')}</h4>${paperSymbols(calculation)}${paperEquation(calculation, 'symbol')}
        ${workedCalculation(calculation, values)}</div>`;
}

function workedCalculation(calculation, values) {
    return `${paperEquation(calculation, 'value', values)}${paperResult(calculation, values)}`;
}

function paperInputs(calculation) {
    return `${paperSymbols(calculation)}${paperEquation(calculation, 'symbol')}
        <p>${t('Put each given value in its place in the equation. Check the units beside the fields.')}</p>${paperEquation(calculation, 'edit')}`;
}

function guidedCalculation(calculation) {
    return `<details class="tutor-calculator" ${calculation.paper ? 'open' : ''}><summary>${t('Try it in the formula')}</summary>
        <form>${paperInputs(calculation)}
            <button type="submit">${t('Calculate')}</button><div role="status" data-tutor-result></div></form></details>`;
}

function algebraWalkthrough(turn, record, complete = false) {
    if (!turn.algebra) return '';
    const visible = complete ? turn.algebra.length : (record?.algebra || 1);
    return `<section class="algebra-work" aria-label="${t('Watch the algebra')}" ${complete ? '' : 'data-algebra-work'}>
        <h4>${t('Watch the algebra')}</h4>
        <ol>${turn.algebra.map(([equation, explanation], i) => `<li ${i >= visible ? 'hidden' : ''}>
            <div class="algebra-equation">${equation}</div><p>${explanation}</p></li>`).join('')}</ol>
        ${visible < turn.algebra.length ? `<button data-tutor="algebra-next" type="button">${t('Next algebra line')} ›</button>` : ''}
    </section>`;
}
