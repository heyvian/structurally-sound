// Each workshop follows one structure. A turn introduces one idea, then asks the
// learner to use it. Explanations for common errors are authored with the turn.
const pick = (intro, prompt, choices, correct, solution, extra = {}) =>
    ({ type: 'pick', intro, prompt, choices, correct: [].concat(correct), solution, ...extra });
const num = (intro, prompt, expected, unit, solution, extra = {}) =>
    ({ type: 'number', intro, prompt, expected, unit, solution, ...extra });
const projection = (intro, direction, adjacent, drawing) => pick(intro, t`Which ratio gives the ${direction} component?`, [
    ['cos', t('Cosine'), adjacent ? '' : t('Cosine goes with the leg beside the marked angle. We want the leg across from it.')],
    ['sin', t('Sine'), adjacent ? t('Sine gives the leg across from the angle. We want the leg beside it.') : ''],
    ['tan', t('Tangent'), t('Tangent relates the two legs. Here the given full force is the hypotenuse.')],
], adjacent ? 'cos' : 'sin', t`The ${direction} leg is ${adjacent ? t('adjacent to the marked angle, so multiply the full force by cosine') :
    t('opposite the marked angle, so multiply the full force by sine')}. Handle the force direction separately.`, {
    skill: 'trig', drawing, refs: ['trig'],
    hint: t('SOH CAH TOA means sine = opposite/hypotenuse, cosine = adjacent/hypotenuse, and tangent = opposite/adjacent. First find the marked angle, then name the leg you need.'),
});
const scene = (caption, drawing) => ({ caption, drawing });
const beamStart = { L: 8, a: 0, b: 8, points: [{ x: 2, p: 24 }], udls: [{ s: 4, e: 8, w: 8 }] };
const shearBeam = { L: 8, a: 0, b: 8, points: [], udls: [{ s: 0, e: 8, w: 6 }] };
const sketchBeam = { L: 6, a: 0, b: 6, points: [{ x: 2, p: 12 }], udls: [] };
const workshopTruss = {
    nodes: { A: [0, 0], B: [5, 0], C: [0, 5], D: [5, 5], E: [0, 10] },
    members: ['AC', 'AB', 'BC', 'BD', 'CE', 'CD', 'ED'],
    load: 90,
};

const roofLineLoad = {
    symbol: 'w', label: t('Load per metre of beam'), unit: 'kN/m',
    inputs: [['q', t('Roof pressure'), 'kPa', 3], ['bₜ', t('Tributary width'), 'm', 4]],
    calculate: (q, width) => q * width,
    paper: { numerator: [0, '×', 1] },
};
const eulerCalculation = {
    symbol: 'Pcr', label: t('Critical buckling load'), unit: 'kN',
    inputs: [['E', t('Elastic modulus'), 'N/mm²', 200000], ['I', t('Second moment of area'), 'mm⁴', 800000],
        ['K', t('End restraint factor'), '', 1], ['L', t('Physical unbraced length'), 'mm', 4000]],
    calculate: (elasticity, inertia, k, length) => Math.PI ** 2 * elasticity * inertia / (k * length) ** 2 / 1000,
    paper: { numerator: ['π² ×', 0, '×', 1], denominator: ['(', 2, '×', 3, ')²'], conversion: '÷ (1,000 N/kN)' },
};

// Reuse the beam solver for sketch stations and worked solutions.
const sketch = (beam, kind, intro, solution, extra = {}) => ({
    ...graphQuestion(beam, kind), type: 'sketch', intro, solution, ...extra,
});

const workshops = [
    {
        title: t('Follow the weight of a roof'), drawing: scene(t('Gravity load path'), 'load-path'),
        outcome: t('Describe the load by source and units. Multiply an area pressure by the tributary width to find the line load, then by the loaded length to find the supported force.'),
        refs: ['units', 'area'],
        turns: [
            pick(t('Imagine setting a planter on a roof. The roof pushes back up on it. The planter pushes down equally on the roof. To find what carries that weight, follow each contact downward.'), t('Where does a gravity load ultimately go?'), [
                ['deck', t('The deck'), t('The deck receives it first and then passes it to framing. Keep tracing.')],
                ['soil', t('The ground through the footing')],
                ['air', t('The air above the roof'), t('Air can apply pressure to a roof. It does not carry this planter’s weight.')],
            ], 'soil', t('The deck passes the weight to the beam, then the column, then the footing. The footing spreads it into the ground.'), { hot: ['deck', 'soil'] }),
            pick(t('A load source and a load shape answer different questions. Dead describes something permanently attached. Live describes changing occupancy. A force can act at a point, be spread along a line, or be spread over an area.'), t('How would you classify a fixed concrete roof slab?'), [
                ['dead', t('Permanent dead load')], ['live', t('Occupancy live load'), t('Occupants come and go. The slab remains part of the structure.')],
                ['wind', t('Wind pressure'), t('Wind is air pressure on the surface. The slab creates a load by its own weight.')],
            ], 'dead', t('The slab is a permanent gravity load. The intensity of its weight across the deck can be expressed in kN/m².')),
            pick(t('On a vertical wall, wind acts normal to the face. A push goes toward the wall. A pull points away from it.'), t('Which term describes wind pulling outward?'), [
                ['pressure', t('Pressure pushing inward'), t('The prompt describes a pull away from the surface.')],
                ['suction', t('Suction')],
            ], 'suction', t('Outward wind action is suction. It needs a lateral load path through suitable connections and bracing.')),
            num(t('Look down on the roof from above. A beam is a long member under the roof that carries its weight. Find the highlighted middle beam and the next beam on each side. Each gap is 4 m. The two beams on either side of a gap share the roof across it, so each beam carries up to the dashed halfway line.'), t('How wide is the shaded roof strip carried by the middle beam?'), 4, 'm',
                t('Half of each 4 m gap is 2 m. Add the 2 m on either side of the middle beam. Its tributary width bₜ is 2 m + 2 m = 4 m.'), { drawing: 'roof', wrong: [[8, t('8 m counts the full bay on both sides. Each neighboring beam shares the load.')]], hint: t('Add two half-bays.') }),
            num(t('We write the roof pressure as q = 3 kPa. Each square metre of roof puts 3 kN of load on the framing. The tributary width bₜ is the width of roof this beam carries. We found bₜ = 4 m in the last step. Each metre of beam carries a 4 m × 1 m strip, so multiply the pressure by the 4 m width to find w, the load per metre of beam.'), t('Find the load per metre along the beam.'), 12, 'kN/m',
                t('Multiply 3 kN/m² × 4 m = 12 kN/m. The unit of width cancels one of the two metres in the pressure.'), { drawing: 'roof-line-load', calculation: roofLineLoad, hint: t('To get kN/m, cancel only one metre in kN/m².'), units: t('1 kPa = 1 kN/m². Multiplying kN/m² by m leaves kN/m.') }),
            num(t('The beam is 6 m long, and every metre carries 12 kN. We can now add up the six metres.'), t('How much total roof force does the beam carry?'), 72, 'kN',
                t('12 kN/m × 6 m = 72 kN. Equivalently, 3 kN/m² × 4 m × 6 m = 72 kN.'), { drawing: 'roof', wrong: [[12, t('That is the line load, in kN for each metre. Multiply by the 6 m loaded length for the total.')]] }),
            num(t('Find the highlighted edge beam in the new roof plan. The roof stops at that beam. The next beam is 4 m in toward the roof, so the shaded strip goes only from the edge beam to the dashed halfway line. Use the strip width, the 6 m beam length, and the same roof pressure of 3 kPa.'), t('Find the total force on the edge beam.'), 36, 'kN',
                t('The strip is 4 m ÷ 2 = 2 m wide and 6 m long, so it covers 12 m². Multiply 3 kN/m² × 12 m² = 36 kN. That is half the load on the middle beam.'), { drawing: 'roof-edge', newExample: true, hint: t('Take half the 4 m gap to get the strip width. Multiply width by length for area, then multiply by the pressure.') }),
            num(t('A rooftop unit has a mass of 400 kg. Mass tells us how much matter it contains. Weight is the force of gravity on it. Take g = 9.81 N/kg, so each kilogram contributes 9.81 N of weight.'), t('How much weight does the unit add, in kN?'), 3.924, 'kN',
                t('400 kg × 9.81 N/kg = 3,924 N = 3.924 kN downward. Use kN when adding it to the other gravity forces.'), { drawing: 'hanging-weight', newExample: true, units: t('kg × N/kg = N. Divide by 1,000 N/kN to report kN.'), wrong: [[400,t('400 is the mass in kg. Convert to a gravity force before reporting kN.')]] }),
            pick(t('An earthquake shakes the ground and the building resists the change in motion. A structure has a natural frequency, measured in cycles per second. Its period is the time for one cycle. Shaking near that frequency can build up motion like pushing a swing at the right time.'), t('Which forcing frequency is most likely to amplify motion if the building’s natural frequency is 2 Hz?'), [
                ['near', t('About 2 Hz')], ['fast', t('About 20 Hz'), t('The frequency here is ten times the natural frequency. In this example look for a close match.')],
            ], 'near', t('The close match can cause resonance. At 2 cycles per second, the period is 1 ÷ 2 = 0.5 seconds per cycle.'), { drawing: 'vibration', newExample: true, units: t('1 Hz = 1 cycle per second. The inverse frequency gives seconds per cycle.') }),
        ],
    },
    {
        title: t('Break one pull into two'), drawing: scene(t('Cable force and projections'), 'vector'),
        outcome: t('Use axes to set signs, cosine for the adjacent projection, and sine for the opposite projection. Add like components before finding the resultant.'),
        refs: ['trig', 'signs', 'units'],
        turns: [
            pick(t('A force is a push or a pull. An arrow tells us the direction, and a value in kN tells us how big it is. This cable pulls up and to the right at 30° above horizontal. We can describe the same pull as two straight arrows.'), t('Tap the part of the drawing that represents Fₓ.'), [
                ['x', t('Horizontal leg')], ['y', t('Vertical leg'), t('That leg is along the y-axis. The x-axis runs horizontally.')],
                ['f', t('Diagonal force'), t('That is the full pull. Its horizontal projection is the x component.')],
            ], 'x', t('Fₓ is the horizontal projection. It is positive because it points right.'), { hot: ['x','y','f'] }),
            pick(t('The 30° angle is between the diagonal and the horizontal leg. That makes the horizontal leg adjacent to the angle. In a right triangle, cosine is adjacent divided by the diagonal.'), t('Which relationship gives Fₓ from the full force F?'), [
                ['cos', t('Fₓ = F cos 30°')], ['sin', t('Fₓ = F sin 30°'), t('Sine gives the leg opposite the drawn angle, which is vertical here.')],
                ['div', t('Fₓ = F ÷ cos 30°'), t('Dividing by a number smaller than one would make the projection bigger than the full arrow.')],
            ], 'cos', t('cos 30° = Fₓ/F. Multiply both sides by F to isolate Fₓ.'), { skill: 'trig' }),
            num(t('The cable pull is 10 kN. In degree mode, cos 30° ≈ 0.866. A component should be smaller than 10 kN.'), t('Compute the signed horizontal component.'), 10 * Math.cos(Math.PI / 6), 'kN',
                t('Fₓ = +10 cos 30° ≈ +8.66 kN. If your calculator gave another value, check that it is in degrees.'), { wrong: [[5, t('5 kN is the vertical projection. Use cosine for the horizontal leg here.'), 'trig']], hint: t('Multiply 10 by 0.866.'), units: t('Cosine is a ratio of lengths, so its units cancel. Multiplying kN by the ratio keeps the answer in kN.') }),
            projection(t('Now look at the vertical leg on the same drawing. The angle is still measured from horizontal, and the full arrow is still the hypotenuse.'), 'vertical', false, 'vector'),
            num(t('The vertical leg is opposite the 30° angle, and sin 30° = 0.5. The arrow points upward, so its vertical component is positive.'), t('Compute the signed vertical component.'), 5, 'kN',
                t('Fᵧ = +10 sin 30° = +5 kN. Both components together describe the original 10 kN arrow.')),
            num(t('Now add a second cable pulling straight left with 3 kN. We already found the first cable pulls +8.66 kN to the right. Let left be negative.'), t('What is the new horizontal total Rₓ?'), 10 * Math.cos(Math.PI / 6) - 3, 'kN',
                t('Rₓ = 8.66 − 3 = +5.66 kN. Rᵧ stays +5 kN because the second cable has no vertical component.'), { drawing: 'vector-sum', wrong: [[11.66, t('Add the leftward 3 kN with a negative sign. Its direction partly cancels the first pull.')]] }),
            num(t('To turn those two totals into one arrow, treat 5.66 and 5 as the legs of a right triangle. The length of the diagonal is √(Rₓ² + Rᵧ²).'), t('Find the magnitude of the combined pull.'), Math.hypot(10 * Math.cos(Math.PI / 6) - 3, 5), 'kN',
                t('√(5.66² + 5²) ≈ 7.55 kN. It is smaller than the first 10 kN pull because the second pull partly cancels the horizontal component.'), { drawing: 'vector-resultant', refs: ['trig'], hint: t('Square each component, add the squares, then take the square root.') }),
            pick(t('To find the new direction above +x, you know the two legs, 5.00 kN up and 5.66 kN right. You want the angle measured from horizontal.'), t('Which ratio directly compares those two known legs?'), [
                ['tan', t('Tangent · 5.00/5.66')], ['sin', t('Sine · 5.00/5.66'), t('Sine needs the diagonal as the denominator. 5.66 is the horizontal leg.')],
                ['cos', t('Cosine · 5.66/5.00'), t('Cosine needs the diagonal as the denominator. These two numbers are both legs.')],
            ], 'tan', t('Use inverse tangent in degree mode. tan⁻¹(5.00/5.66) ≈ 41.5°. The two positive components put it in the upper-right quadrant.'), { drawing: 'vector-resultant', skill: 'trig' }),
            pick(t('A triangle drawn by placing force arrows head to tail might have a corner other than 90°. If you know two sides a and b and the angle C between them, you can find the third side c with a relation that accounts for that angle.'), t('What relation works when the included angle is 120°?'), [
                ['cosine', t('Cosine law · c² = a² + b² − 2ab cos C')], ['right', t('Pythagoras · c² = a² + b²'), t('That formula applies when the sides meet at 90°. At 120° the extra term is needed.')],
            ], 'cosine', t('Use the angle inside the head-to-tail triangle. After finding the third side, you can use the sine law by matching each side with the angle opposite it.'), { drawing: 'oblique-vector', newExample: true }),
        ],
    },
    {
        title: t('Redraw a beam with just its forces'), drawing: scene(t('Pin A and roller B'), 'supports'),
        outcome: t('Isolate a single object. Draw all applied forces and replace each connection by the forces and moments it can transmit.'),
        refs: ['signs', 'reactions'],
        turns: [
            pick(t('A beam at rest still has forces acting on it. To analyze it, sketch just the beam and replace every connection to the outside by its push, pull or resisting moment. That sketch is a free-body diagram.'), t('Tap the pin support, which prevents both horizontal and vertical movement.'), [
                ['A', t('Support A')], ['B', t('Support B'), t('B has small wheels below its triangle. It can roll horizontally.')],
            ], 'A', t('A is a pin. It blocks horizontal and vertical movement but lets the beam rotate. Draw Aₓ and Aᵧ, with no reaction moment.'), { hot: ['A','B'] }),
            pick(t('B is an ideal frictionless roller on level ground. Imagine moving it sideways. Its contact pushes perpendicular to the ground, while the roller can still travel along it.'), t('Which arrow belongs at B?'), [
                ['vertical', t('Vertical Bᵧ')], ['horizontal', t('Horizontal Bₓ'), t('A horizontal push would require resistance along the surface. The ideal roller has none.')],
                ['moment', t('A reaction moment'), t('The roller also lets the beam rotate, so it supplies no reaction moment.')],
            ], 'vertical', t('The level roller provides only Bᵧ. On an incline the reaction would follow the normal to that incline.'), { drawing: 'support-arrows' }),
            pick(t('Switch to a cantilever. In this drawing, the beam is built into the wall at A and free at the other end. The wall stops the beam from shifting in either direction and keeps it from turning.'), t('Which reactions should a fixed end have in this plane?'), [
                ['three', t('Two force components and a moment')], ['two', t('Two force components'), t('Those two are enough for a pin. The fixed end also restrains rotation.')],
                ['one', t('One vertical force'), t('That is a horizontal roller. A fixed end restrains three planar motions.')],
            ], 'three', t('The fixed end reacts with a horizontal force, a vertical force, and a moment.'), { drawing: 'fixed-support' }),
            num(t('Return to our pin and roller. A 9 kN horizontal push acts to the right. B cannot supply a horizontal force, so only the pin can cancel it. Right is positive.'), t('What signed force is Aₓ?'), -9, 'kN',
                t('ΣFₓ = 0 gives Aₓ + 9 = 0, so Aₓ = −9 kN. The minus sign tells us the force points left.'), { drawing: 'support-arrows', units: t('Aₓ and the applied push are both forces in kN and can be added directly.'), wrong: [[9, t('That magnitude is right. Two rightward forces would add. The pin must push left.')]] }),
            pick(t('Now imagine making both ends rollers on level ground. The two upward arrows can balance weight, but check each possible rigid motion separately.'), t('What motion is left unrestrained?'), [
                ['slide', t('Sliding sideways')], ['lift', t('Moving vertically downward through the ground'), t('The rollers resist motion normal to the ground.')],
                ['none', t('The beam cannot move'), t('Both reactions are parallel. Neither opposes sideways motion.')],
            ], 'slide', t('Horizontal sliding is still possible. Count independent directions of restraint, rather than the number of supports alone.'), { drawing: 'two-rollers' }),
        ],
    },
    {
        title: t('Find who carries the beam'), drawing: scene(t('Beam for the reaction calculation'), 'reaction-beam'),
        outcome: t('Find equivalent loads and their locations. Take moments about the support with the reaction you want to eliminate. Then balance the forces.'),
        refs: ['reactions', 'equations', 'signs', 'units'],
        turns: [
            num(t('A 24 kN force acts 2 m from A. The load over the last 4 m is spread at 8 kN for each metre. For support reactions we can replace that spread by one force with the same weight and turning effect.'), t('What is the total of the spread load?'), 32, 'kN',
                t('8 kN/m × 4 m = 32 kN. The load diagram is a rectangle and its area gives this total.'), { wrong: [[64, t('The entire beam is 8 m long, but only the last 4 m carry this distributed load.')]], units: t('(kN/m) × m = kN. The loaded length cancels the “per metre”.') }),
            pick(t('The uniform patch extends from x = 4 m to x = 8 m. Think of balancing that rectangle on a pencil. Its centre lies halfway between its two ends.'), t('Tap where the equivalent 32 kN force acts.'), [
                ['mid', 'x = 6 m'], ['start', 'x = 4 m', t('That is the beginning of the patch. There is still load to its right.')],
                ['end', 'x = 8 m', t('That is the right edge. Take the midpoint of the whole patch.')],
            ], 'mid', t('The centre is (4 + 8)/2 = 6 m from A. The original 8 kN/m distribution still matters for the shear and moment diagrams.'), { drawing: 'reaction-patch', hot: ['start','mid','end'] }),
            pick(t('Imagine holding a seesaw still. Push down on the right while someone else pushes up on the left, equally hard. The two forces add up to zero, yet both try to turn the seesaw clockwise. A beam at rest needs both zero net push and zero net turn.'), t('If the forces add up to zero, what else do we need to check?'), [
                ['turn', t('That the turning effects add to zero')], ['done', t('The beam is already balanced'), t('The pushes cancel as forces, but both contributions turn the seesaw the same way. The beam can still start rotating.')],
            ], 'turn', t('That second condition is ΣM = 0. It gives us information that adding up forces alone leaves out.'), { drawing: 'turning-pair' }),
            num(t('A moment measures how hard a force tries to turn something. Push a door farther from the hinge and it turns more easily. “About A” means measure the perpendicular distance from A to the force’s line of action. Picture the 24 kN arrow pushing down on the right of A. Counterclockwise is positive.'), t('What is the signed moment of the 24 kN force about A?'), -48, 'kN·m',
                t('The arm is 2 m. The downward push on the right tends to turn clockwise, so M about A = −24 kN × 2 m = −48 kN·m.'), { drawing: 'moment-a', skill: 'reactions', units: t('Force (kN) × perpendicular distance (m) gives moment (kN·m).') }),
            num(t('Leave the same 24 kN arrow in place. Now imagine measuring the turning effect about B. The beam is 8 m long, and the arrow is 2 m from A. From B the arrow is on your left, so pushing down makes that end drop counterclockwise.'), t('What is the signed moment of the same 24 kN force about B?'), 144, 'kN·m',
                t('The arm is 8 − 2 = 6 m. M about B = +24 kN × 6 m = +144 kN·m. Changing the reference point changes this force’s moment even though the force and beam are unchanged.'), { drawing: 'moment-b', skill: 'reactions', wrong: [[48, t('The 2 m dimension measures from A. From B the perpendicular distance is 8 − 2 = 6 m.')]], units: t('Subtract metres from metres to get the new arm. Then multiply kN by m.') }),
            pick(t('Both unknown reactions at A act through A. If you push right at a door hinge, your turning arm is zero. The force can still push on the hinge. Taking moments about a support uses that zero distance to leave its reactions out of one equation.'), t('Tap the point to take moments about if we want to eliminate A’s reactions.'), [
                ['A', t('Support A')], ['B', t('Support B'), t('Moments about B would eliminate Bᵧ. To eliminate A’s forces, use A.')],
            ], 'A', t('The reaction arrows at A pass through A. Aᵧ × 0 m and Aₓ × 0 m are both zero. Aᵧ will appear again when we add the vertical forces.'), { hot: ['A','B'], skill: 'reactions', drawing: 'reaction-resultant' }),
            num(t('Counterclockwise is positive. B’s upward reaction 8 m to the right turns counterclockwise. Both downward loads turn clockwise. Write 8Bᵧ − 24×2 − 32×6 = 0.'), t('Solve for Bᵧ.'), 30, 'kN',
                t('8Bᵧ = 48 + 192 = 240 kN·m. Divide by 8 m to find Bᵧ = +30 kN.'), { drawing: 'reaction-resultant', skill: 'reactions', units: t('(kN·m) ÷ m = kN. The answer is a force.'), wrong: [[240, t('240 is the moment in kN·m. Divide by B’s 8 m lever arm to get a force.')]], hint: t('Isolate 8Bᵧ first, then divide both sides by 8.') }),
            num(t('The vertical force equation alone says Aᵧ + Bᵧ = 56 kN. Many pairs add to 56. The moment equation told us which Bᵧ also prevents turning. Together these equations are a system. Substitute the known Bᵧ = 30 kN into the vertical force equation.'), t('Find Aᵧ.'), 26, 'kN',
                t('Aᵧ + 30 − 56 = 0, so Aᵧ = +26 kN. Horizontal balance also gives Aₓ = 0.'), { drawing: 'reaction-resultant', skill: 'reactions', units: t('All terms in ΣFᵧ are in kN. The known upward reaction subtracts from the total upward force we need.') }),
            pick(t('We solved with moments about A. Verify with moments about B. Aᵧ has an 8 m lever arm, the 24 kN load is 6 m from B, and the 32 kN resultant is 2 m from B.'), t('Which check confirms the answer?'), [
                ['ok', '−26×8 + 24×6 + 32×2 = 0'], ['bad', '26×8 + 24×6 + 32×2 = 0', t('Aᵧ acts upward to the left of B, giving a clockwise or negative moment.')],
            ], 'ok', t('−208 + 144 + 64 = 0. You can also start at B to eliminate Bᵧ, solve for Aᵧ first, and use ΣFᵧ for Bᵧ. Both routes give the same reactions.'), { drawing: 'reaction-resultant', skill: 'reactions' }),
            num(t('A triangular load uses a different centre. Its equivalent force lies one-third of the loaded span from the heavy end. A triangle with a 12 kN/m peak over 6 m has area ½ × 12 × 6 = 36 kN.'), t('How far from the heavy end does the 36 kN resultant act?'), 2, 'm',
                t('6/3 = 2 m from the heavy end. A uniform patch would have its resultant at the midpoint instead.'), { drawing: 'triangle-load', newExample: true, wrong: [[4, t('4 m is measured from the light end. This question measures from the heavy end.')]] }),
        ],
    },
    {
        title: t('Draw the invisible forces in a beam'), drawing: scene(t('Uniformly loaded simple span'), 'shear-beam'),
        outcome: t('Start with reactions. A point force jumps the shear, distributed load changes its slope, and the signed area under shear changes moment. For ARCH 600, plot positive sagging below zero.'),
        refs: ['reactions', 'area', 'signs'],
        turns: [
            num(t('Slice an imaginary beam. The two cut faces must still push and turn against each other for each half to balance. Those internal effects are shear V and bending moment M. Start with the external reactions. Our 8 m beam has 6 kN/m evenly along its span.'), t('What upward force does each support carry?'), 24, 'kN',
                t('The total is 6 × 8 = 48 kN. Symmetry splits it equally, so Aᵧ = Bᵧ = 24 kN.'), { skill: 'reactions', units: t('(6 kN/m) × (8 m) = 48 kN. Dividing by two supports keeps the unit in kN.') }),
            pick(t('Walk from just outside A to just inside the beam. Shear starts at zero outside. Aᵧ is a concentrated upward force, so the shear increases all at once.'), t('What happens at A?'), [
                ['jump', t('V jumps from 0 to +24 kN')], ['ramp', t('V rises gradually from 0'), t('A gradual change needs a load spread over distance. A support reaction acts at one point.')],
                ['drop', t('V jumps from 0 to −24 kN'), t('An upward point force jumps the shear upward in this convention.')],
            ], 'jump', t('V is +24 kN just to the right of A. Positive shear appears above the axis.'), { drawing: 'shear-plot' }),
            num(t('From A onward, every metre adds 6 kN downward. Over 2 m that removes 12 kN from the +24 kN we started with.'), t('What is the shear at x = 2 m?'), 12, 'kN',
                t('V = 24 − 6×2 = +12 kN. Uniform downward load gives a straight line with slope −6 kN per metre.'), { drawing: 'shear-beam' }),
            sketch(shearBeam, 'V', t('Let’s put those decisions onto a plot. The shear just inside A is +24 kN, and it loses 6 kN per metre over 8 m. The upward reaction at B brings it back to zero outside the beam. Enter the values on both sides of the support jumps.'),
                t('From left to right the shear values are 0, +24, −24 and 0 kN. The span segment slopes down, and the support jumps are vertical.'),
                { hint: t('Use zero outside either support. Enter the left and right sides of each jump separately.') }),
            pick(t('Moment changes by the signed area under the shear plot. While V is positive, M grows. Once V goes negative, M falls. Look where the shear changes sign.'), t('Tap where the bending moment reaches its largest positive value.'), [
                ['left', t('Support A at x = 0 m'), t('At this simple end without an applied couple, moment is zero.')],
                ['middle', t('Midspan at x = 4 m')],
                ['right', t('Support B at x = 8 m'), t('The negative shear after midspan has already reduced the moment back to zero at B.')],
            ], 'middle', t('At x = 4 m, 24 − 6x = 0. Moment changes from growing to falling there.'), { drawing: 'shear-plot', hot: ['left','middle','right'] }),
            num(t('At A, M starts at zero. The positive shear from A to midspan is a triangle with base 4 m and height 24 kN. Its signed area is the increase in moment.'), t('Find the moment at midspan.'), 48, 'kN·m',
                t('½ × 4 m × 24 kN = +48 kN·m. You can also use wL²/8 = 6×8²/8 = 48 for this particular simple-span UDL.'), { drawing: 'positive-shear', units: t('The graph’s width is in m and its height is in kN. Graph area is m × kN = kN·m.'), wrong: [[96, t('96 kN·m is the full rectangle. The shear falls to zero, so the area is only half that.')]] }),
            pick(t('The shear line slopes down uniformly, so moment changes quickly at first, then more slowly, with zero slope at midspan. On our course drawings positive sagging is drawn below the datum.'), t('What should the moment diagram look like?'), [
                ['curve', t('A smooth parabola below the datum')], ['flat', t('A flat line below the datum'), t('Moment changes anywhere V is nonzero. A constant moment would need zero shear throughout.')],
                ['triangle', t('Two straight lines meeting at the middle'), t('That comes from constant shear on each half. Here V varies linearly along the span.')],
            ], 'curve', t('The moment is zero at both ends and +48 kN·m at midspan. The positive shape is drawn below the baseline.'), { drawing: 'moment-plot' }),
            sketch(shearBeam, 'M', t('Now build M from the areas you found. Put zero at the two simple ends and +48 kN·m at midspan. For both segments, the parabola bows below the straight chord in the course drawing because positive sagging plots downward.'),
                t('The ordinates are 0, +48 and 0 kN·m. Both segments bow toward positive M. The change from positive to negative shear makes the middle the peak.'),
                { hint: t('Use M = 0 at the supports and +48 at the middle. The curve bows toward positive M.') }),
            pick(t('Try a different load. A downward point force in the middle of a simple beam produces a jump in V. On either side of that load there is no distributed load.'), t('What happens to M at the point force?'), [
                ['bend', t('The slope changes, and M stays continuous')], ['jump', t('M jumps by the size of the force'), t('Force has units of kN, while moment has units of kN·m. A concentrated couple can jump M.')],
            ], 'bend', t('The shear jumps, so the slope of M changes abruptly. The moment itself stays continuous unless there is an applied couple.'), { drawing: 'point-beam', newExample: true }),
            num(t('Time to draw a fresh beam. It spans 6 m. A 12 kN point load acts 2 m from A, so the reactions are unequal. Take moments about A first.'), t('What is Bᵧ?'), 4, 'kN',
                t('Bᵧ × 6 m = 12 kN × 2 m, so Bᵧ = 4 kN. Force balance gives Aᵧ = 12 − 4 = 8 kN.'),
                { drawing: 'sketch-beam', newExample: true, skill: 'reactions', hint: t('Divide the load moment about A by the span to get Bᵧ.') }),
            sketch(sketchBeam, 'V', t('Sketch the shear on your own. Work left to right. There are three places where a concentrated force changes the shear. Between those locations the beam has no distributed loading.'),
                t('V jumps by +8 kN at A, by −12 kN at x = 2 m, and by +4 kN at B. The span values are +8 kN and −4 kN, with horizontal lines between the jumps.'),
                { drawing: 'sketch-beam', hint: t('Start at zero. Add the signed force at each station and carry that result to the next one.') }),
            sketch(sketchBeam, 'M', t('Use the shear you just drew to sketch M. Start at zero at A and add the two signed rectangular shear areas. Decide whether each segment should be straight or curved.'),
                t('M rises by (+8 kN) × (2 m) = +16 kN·m between A and the load. It then falls by 16 kN·m because the second rectangle is (−4 kN) × (4 m). The ordinates are 0, +16, 0 kN·m. Constant shear gives a straight segment on each side of the load.'),
                { drawing: 'sketch-beam', hint: t('Each M change is the signed shear height multiplied by the interval length. Zero at B is a check.') }),
        ],
    },
    {
        title: t('From a force to a material check'), drawing: scene(t('Steel bar and stress–strain curve'), 'bar'),
        outcome: t('Convert forces to newtons and cross-sections to mm² before using σ = F/A. Use the original length for strain and read E from the initial slope of the curve.'),
        refs: ['units', 'algebra'],
        turns: [
            pick(t('Imagine pulling two bars with the same force. One is thick and one is thin. Stress asks how much force is shared by each square millimetre of cross-section.'), t('Which bar has greater average stress?'), [
                ['thin', t('The thinner bar')], ['thick', t('The thicker bar'), t('The larger area gives the same force more material to spread through.')],
            ], 'thin', t('A smaller load-carrying area gives higher average stress for the same force. This axial model assumes a concentric pull.')),
            num(t('A steel bar carries 24 kN and has area 150 mm². In our units 24 kN = 24,000 N. Divide that force by area. One N/mm² is one MPa.'), t('Find the average axial stress.'), 160, 'MPa',
                localizedEquation('σ = 24,000/150 = 160 N/mm² = 160 MPa.'), { units: t('Multiply kN by 1,000 N/kN, then divide by mm². The result N/mm² is called MPa.'), wrong: [[0.16, t('That is 24/150. Convert kN to N first.')]], hint: t('Divide 24,000 N by 150 mm².') }),
            num(t('The bar starts 400 mm long and stretches by 0.8 mm. Strain is the fraction of its original length it gained. Divide two lengths in the same units.'), t('Find the strain as a decimal.'), .002, '',
                t('ε = 0.8/400 = 0.002. The lengths cancel. As a percentage it would be 0.2%, but here we want the decimal.'), { tolerance: .00001, wrong: [[0.2, t('0.2% is equivalent, but a decimal is 100 times smaller.')]], drawing: 'bar' }),
            pick(t('Plot stress vertically and strain horizontally. A steeper initial line means more stress is required for a given small strain. E is the slope of that straight, elastic part.'), t('Tap the start of yielding on the idealized curve.'), [
                ['elastic', t('A · Initial straight line'), t('A is still on the linear elastic part. Look for where the curve begins to depart from that initial slope.')],
                ['yield', t('B · End of the initial straight line')],
                ['ultimate', t('C · Highest stress'), t('C is ultimate strength. The material started yielding earlier.')],
                ['fracture', t('D · End of the curve'), t('D is fracture. Yield comes before the peak and before fracture.')],
            ], 'yield', t('B marks the approximate start of irreversible deformation. C is the greatest stress in the test, while D is fracture.'), { drawing: 'stress-track', hot: ['elastic','yield','ultimate','fracture'] }),
            num(t('Suppose the initial elastic line passes through 100 MPa at strain 0.0005. Slope means rise over run, so divide the stress by the strain.'), t('Calculate E in MPa.'), 200000, 'MPa',
                t('E = 100/0.0005 = 200,000 MPa. Strain has no unit, so E has stress units.'), { drawing: 'stress-track' }),
            pick(t('Return to the working stress of 160 MPa. The problem gives a yield stress of 250 MPa and asks us to take 60% of it as the allowable stress. That gives 150 MPa.'), t('Does the section pass this allowable-stress check?'), [
                ['no', t('No, 160 MPa exceeds 150 MPa')], ['yes', t('Yes, it is below the 250 MPa yield stress'), t('The problem asks for the allowable limit, which is lower than yield.')],
            ], 'no', t('It fails the stated allowable-stress check by 10 MPa. That result is about the check, rather than proof that the bar has fractured.')),
            num(t('Suppose we can choose a new area for the same 24 kN load. The stress F/A needs to be at most 150 N/mm². Solve the boundary case F/A = 150 to find the smallest area that meets it.'), t('What is the minimum area?'), 160, 'mm²',
                t('Amin = 24,000 N ÷ 150 N/mm² = 160 mm². An area any smaller gives stress above the allowable value.'), { units: 'N ÷ (N/mm²) = mm².' }),
        ],
    },
    {
        title: t('Find the axis, then choose a section'), drawing: scene(t('Flange, web, and reference axis'), 'section'),
        outcome: t('Find the area-weighted centroid first. Add each local inertia and shift term to get I, divide by the farthest fibre distance to get S, and compare table values in consistent units.'),
        refs: ['units', 'area', 'algebra'],
        turns: [
            pick(t('The centroid is the balance point of a flat shape of uniform density. Break this T into two rectangles without double-counting the web under the flange. Use the bottom as y = 0. The web is 20×80 mm and the flange is 100×20 mm above it.'), t('Tap the piece whose centre is at y = 90 mm.'), [
                ['flange', t('The top flange')], ['web', t('The web'), t('The web runs from 0 to 80 mm, so its midpoint is 40 mm.')],
            ], 'flange', t('The flange runs from y = 80 to 100 mm, so its centre is halfway up at y = 90 mm.'), { drawing: 'tee', hot: ['flange','web'] }),
            num(t('The web area is 1,600 mm² at y = 40 mm. The flange area is 2,000 mm² at y = 90 mm. Weight each height by its area, add the products, and divide by the total area.'), t('Find the combined centroid height from the bottom.'), (1600*40+2000*90)/3600, 'mm',
                t('ȳ = (1600×40 + 2000×90)/3600 ≈ 67.78 mm. It is between the two centroids and closer to the larger flange.'), { drawing: 'tee', units: t('(mm² × mm) ÷ mm² = mm. A centroid coordinate is a length.'), wrong: [[65, t('65 mm is the average of the two heights. The flange area is bigger, so its height gets more weight.')]] }),
            num(t('Second moment of area I measures how far area is spread from an axis. For one rectangle about its own horizontal centroidal axis, I = bh³/12. Here h is the depth perpendicular to that axis.'), t('Compute the web’s local I using b = 20 mm and h = 80 mm.'), 20*80**3/12, 'mm⁴',
                t('20×80³/12 ≈ 853,333 mm⁴. Cubing the depth reflects how strongly material far from the axis contributes.'), { drawing: 'tee', hint: t('Cube the 80 mm depth before multiplying by 20.') }),
            num(t('The web’s own centre is at 40 mm, but our combined axis is at 67.78 mm. To move to that axis, add the shift term A d². Use the full centroid value when you can.'), t('How far is the web centroid from the combined axis?'), (1600*40+2000*90)/3600-40, 'mm',
                t('d = 67.78 − 40 ≈ 27.78 mm. Add 1600d² to the web’s local I. Repeat with the flange, whose offset is 90 − 67.78.'), { drawing: 'tee' }),
            num(t('Now put all four terms together. The web has 853,333 + 1,600×27.78². The flange has 100×20³/12 + 2,000×22.22². Keep the centroid unrounded until you finish.'), t('Find the combined Iₓ to three significant figures.'), 3142222.22222222, 'mm⁴',
                t('Iₓ ≈ 3,142,222 mm⁴. Both shapes contribute their local inertia and the extra effect of being offset from the combined axis.'), { drawing: 'tee', units: t('Both bh³ and A d² are in mm⁴. The terms can be added directly.') }),
            num(t('With Iₓ ≈ 3.142×10⁶ mm⁴, find the distance c to the controlling outside edge. The bottom is 67.78 mm from the centroid and the top is 32.22 mm away. Dividing by the larger c gives the smaller S.'), t('Find Sₓ = Iₓ/c in mm³.'), 3142222.22222222 / (244000 / 3600), 'mm³',
                t('3.142×10⁶/67.78 ≈ 46,360 mm³. Keep track of the powers of length. Dividing mm⁴ by mm gives mm³.'), { drawing: 'tee' }),
            pick(t('A different beam needs Sₓ of at least 340×10³ mm³. In the table, the column stores S in thousands of mm³. Filter by that column first, then compare kg/m.'), t('Which of these listed sections is the lightest that passes?'), [
                ['31', 'W200×31 · Sₓ = 299', t('299 is below the required 340, so this lighter option must be ruled out.')],
                ['36', 'W200×36 · Sₓ = 342'],
                ['42', 'W200×42 · Sₓ = 399', t('It passes the modulus check, but the lighter W200×36 is already above the threshold.')],
            ], '36', t('342 ≥ 340 and 36 kg/m is the lowest mass among these eligible sections. This is the stated bending property check.'), { drawing: 'steel-sample' }),
        ],
    },
    {
        title: t('Compare how columns buckle'), drawing: scene(t('Same length, different end restraints'), 'buckling'),
        outcome: t('Compare effective lengths KL, square their ratio in Euler’s load equation, and use a separate stiffness formula for a cantilever tip deflection.'),
        refs: ['units', 'powers', 'buckling'],
        turns: [
            pick(t('Push a slender ruler lengthwise. It may bow sideways before its material crushes. That sudden sideways change is buckling. The restraint at each end changes how easily it bows.'), t('Which change usually makes a member with the same section easier to buckle?'), [
                ['length', t('Increase its unbraced length')], ['short', t('Make it shorter'), t('Bracing or shortening the unbraced length makes sideways bowing harder in the Euler model.')],
                ['tension', t('Pull it into tension'), t('Euler buckling describes instability caused by compressive load.')],
            ], 'length', t('A longer unbraced length makes the ideal column less stable under compression.')),
            pick(t('K turns the physical length into an equivalent pin-ended length. A fixed end holds its angle. A pinned end can rotate, and a free end can also move sideways.'), t('Tap the restraint arrangement for a column fixed at its base and free at the top.'), [
                ['pin-pin', 'Pin–pin', t('Both ends can rotate, and their positions are restrained. A cantilever’s tip can move.')],
                ['fixed-fixed', 'Fixed–fixed', t('Both end rotations are held. The cantilever has only one fixed end.')],
                ['fixed-pin', 'Fixed–pin', t('The top pin can rotate but stays in place. A free tip can translate.')],
                ['fixed-free', 'Fixed–free'],
            ], 'fixed-free', t('For this ideal fixed–free column, K = 2. The effective length is 2L even though the column’s physical height is still L.'), { hot: ['pin-pin','fixed-fixed','fixed-pin','fixed-free'] }),
            num(t('Start with a steel column pinned at both ends. E = 200,000 N/mm², I = 800,000 mm⁴, L = 4,000 mm and K = 1. Euler’s equation is Pcr = π²EI/(KL)². Compute it in N, then divide by 1,000 for kN.'), t('Find the pin–pin critical load to about one decimal place.'), Math.PI**2*200000*800000/4000**2/1000, 'kN',
                localizedEquation('π²×200,000×800,000/(1×4,000)² ≈ 98,696 N = 98.70 kN.'), { calculation: eulerCalculation, units: t('(N/mm² × mm⁴) ÷ mm² = N. K and π are dimensionless. Divide the newtons by 1,000 to report kN.'), hint: t('Square the whole effective length in the denominator, then convert N to kN.'), wrong: [[98696, t('That is the load in N. Divide by 1,000 to report kN.')]] }),
            pick(t('Now change only the end restraints to fixed–free. E, I and L stay the same, so those terms cancel when we divide the new Euler equation by the old one. All that remains is (Kold/Knew)².'), t('What factor multiplies the original 98.70 kN?'), [
                ['quarter', t('¼, because (1/2)² = ¼')], ['half', t('½, because K doubles'), t('This is an inverse-square law. Square the factor 1/2.')],
                ['four', t('4, because K² is 4'), t('K² is in the denominator. A larger K reduces the load.')],
            ], 'quarter', t('The new effective length is twice as large. For the same E and I the critical load is one-quarter as large.')),
            num(t('Apply the factor to the known load, keeping the unit in kN. You could also substitute 2L directly into the full Euler formula.'), t('Find the fixed–free critical load.'), 98.70/4, 'kN',
                t('98.70 × (1/2)² = 24.675 kN, about 24.7 kN. That is much smaller than 98.70, as we expect.'), { wrong: [[49.35, t('49.35 kN uses half. Doubling effective length quarters the Euler load.')]] }),
            num(t('Even with the same restraints, the column can buckle about different axes. A section resists sideways bending less well about its smaller I, all else equal. Radius of gyration r = √(I/A) expresses the spread of the area as a length. About the weaker axis, take I = 800,000 mm⁴ and A = 2,000 mm².'), t('Find r about the weaker axis.'), 20, 'mm',
                t('r = √(800,000/2,000) = 20 mm. The weak-axis r is smaller if the area is the same.'), { units: t('Inside the root, mm⁴ ÷ mm² = mm². Its square root is mm.') }),
            num(t('Slenderness compares effective column length to that cross-sectional spread. On the pinned column, KL = 4,000 mm and r = 20 mm about the weak axis. Larger KL/r makes buckling more important.'), t('What is KL/r?'), 200, '',
                t('4,000/20 = 200. This ratio has no units. Check both axes if the section or bracing differs by direction.'), { units: t('mm ÷ mm cancels. Use the same length units in both places.') }),
            num(t('Buckling is a stability check. Deflection is movement under an applied load. For a 2,000 mm cantilever with a 3,000 N tip load, E = 200,000 N/mm² and I = 6×10⁶ mm⁴, use δ = PL³/(3EI).'), t('Find the elastic tip deflection.'), 3000*2000**3/(3*200000*6e6), 'mm',
                t('δ = 3000×2000³/(3×200,000×6×10⁶) ≈ 6.67 mm. Here the physical length is cubed in the numerator.'), { drawing: 'cantilever', newExample: true, refs: ['powers','units'], units: t('(N × mm³) ÷ (N/mm² × mm⁴) = mm. Deflection is a distance.'), hint: t('Calculate L³ separately before substituting. The result is already in millimetres.') }),
        ],
    },
    {
        title: t('Solve a truss one joint at a time'), drawing: scene(t('Lateral load on a five-joint truss'), 'truss'),
        outcome: t('Solve external reactions before cutting. Choose a joint with a known force and at most two independent unknowns. Assume tension, keep the signs, and check a later joint in both directions.'),
        refs: ['reactions', 'equations', 'trig', 'signs', 'trussJoint'],
        turns: [
            pick(t('A truss is a set of straight members meeting at joints. Ideal truss loads go into the joints. A member with just a pin at each end can push or pull along its own line. Before we take apart any joint, treat the whole truss as a single body.'), t('What should we find first?'), [
                ['reactions', t('The support reactions')], ['members', t('Every member force'), t('Those forces are internal to the whole truss. Finding reactions first gives you known forces at the supports.')],
            ], 'reactions', t('Draw the pin reactions Aₓ and Aᵧ, and the roller reaction Bᵧ. Member forces cancel in pairs on the whole-body diagram.')),
            num(t('The load at E pushes right with 90 kN. A is a pin and can push horizontally. B is a roller on horizontal ground and has no horizontal reaction.'), t('With right positive, what is Aₓ?'), -90, 'kN',
                t('ΣFₓ = Aₓ + 90 = 0, so Aₓ = −90 kN. A pushes left against the load.'), { drawing: 'truss-reactions', skill: 'reactions', wrong: [[90, t('Use −90 for a leftward reaction. A rightward reaction would add to the applied load.')]] }),
            num(t('Take moments about A to eliminate both A reactions. The 90 kN force at E has a perpendicular arm of 10 m. Bᵧ acts 5 m to the right of A and has an opposite turning effect.'), t('Find the signed vertical reaction Bᵧ, taking up as positive.'), 180, 'kN',
                t('ΣM about A = 5Bᵧ − 90×10 = 0. Bᵧ = +180 kN.'), { drawing: 'truss-reactions', skill: 'reactions', units: t('(90 kN × 10 m) ÷ 5 m = 180 kN. The numerator is a moment and dividing by the arm gives a force.'), wrong: [[18, t('90×10 is 900 kN·m. Divide by 5 m.')], [900, t('900 is the load moment. Divide by the 5 m lever arm to get Bᵧ.')]], hint: t('Measure perpendicular to each force arrow. The horizontal arrow uses the vertical distance.') }),
            num(t('There is no vertical applied force. One support pushes up with 180 kN. Something must balance that upward force.'), t('Find Aᵧ with up as positive.'), -180, 'kN',
                t('ΣFᵧ = Aᵧ + 180 = 0 gives −180 kN. The pin needs to hold the truss down in this idealization.'), { drawing: 'truss-reactions', skill: 'reactions' }),
            pick(t('Now isolate one joint. A joint has two force equations, one horizontal and one vertical. Look for a known force and no more than two unknown member directions that are independent.'), t('Tap a joint you could solve first.'), [
                ['A', t('Joint A'), t('A also works. Its reactions are known, and AB and AC are its only unknown member forces. We’ll follow the load at E first, then come back to A.')],
                ['B', t('Joint B'), t('AB, BC and BD are three unknowns here. Two independent equations cannot determine all three yet.')],
                ['C', t('Joint C'), t('AC, BC, CD and CE meet here. That is four unknown forces, and there is no applied load at C.')],
                ['D', t('Joint D'), t('BD, CD and ED are all unknown. Solve ED at E first and D will become useful.')],
                ['E', t('Joint E')],
            ], ['A','E'], t('At E we know the 90 kN load and have only ED and CE to find. CE is vertical. Start with horizontal balance to find ED on its own.'), { hot: ['A','B','C','D','E'] }),
            projection(t('At E, the assumed tension arrow along ED points down and right. Use its 45° angle measured from the horizontal. CE is vertical, so ED is the only unknown in the horizontal equation.'), 'horizontal', true, 'joint-e'),
            num(t('At E, draw unknown tension along ED pointing away from E, down and right. The horizontal part is ED × cos 45°. CE is vertical and contributes nothing to this equation. Balance 90 + ED cos 45° = 0.'), t('Find signed ED. Positive means tension.'), -90*Math.SQRT2, 'kN',
                t('ED = −90/cos 45° ≈ −127.28 kN. The negative sign says compression. At E the actual force pushes up and left.'), { drawing: 'joint-e', wrong: [[127.28, t('The magnitude is right. But our assumed tension pulled right, and the force must balance the applied rightward load.')],[-90,t('−90 kN is the horizontal component. Divide its magnitude by cos 45° for the full diagonal force.')]] }),
            projection(t('Stay at joint E and switch to the vertical balance. Even though sine and cosine give the same number at 45°, choose the one that goes with the vertical leg. That choice matters at other angles.'), 'vertical', false, 'joint-e'),
            num(t('ED is diagonal at 45°, so its actual upward component at E is 90 kN. Under a tension assumption, CE points straight down from E toward C.'), t('Find signed CE.'), 90, 'kN',
                t('ΣFᵧ = 90 − CE = 0. CE = +90 kN, so CE is in tension.'), { drawing: 'joint-e', wrong: [[-90,t('Down is the direction CE acts at E. The signed member force is positive because the assumed tension arrow already points down.')]] }),
            pick(t('We know both forces at E. Carry each result to the neighboring joint with the arrow reversed. At D, ED is now known and only CD and BD remain unknown.'), t('Tap the joint that becomes solvable after finding ED.'), [
                ['D',t('Joint D')], ['B',t('Joint B'),t('At B, none of AB, BC or BD has been found yet.')],
                ['C',t('Joint C'),t('CE is now known, but C still has three other unknown members.')],
            ], 'D', t('D is ready. At D, compressed ED pushes down and right with components of 90 kN each.'), { hot: ['B','C','D'] }),
            num(t('At D, ED pushes 90 kN right. A tension arrow for CD pulls left, and BD is vertical.'), t('Find signed CD.'), 90, 'kN',
                t('ΣFₓ = 90 − CD = 0, so CD = +90 kN in tension.'), { drawing: 'joint-d' }),
            num(t('ED pushes 90 kN down at D. A positive tension arrow for BD would also point down from D to B.'), t('Find signed BD.'), -90, 'kN',
                t('ΣFᵧ = −90 − BD = 0, so BD = −90 kN in compression. Its actual contribution at D is upward.'), { drawing: 'joint-d' }),
            num(t('Return to A, the other place we could have started. The reactions are Aₓ = −90 kN and Aᵧ = −180 kN. AC acts vertically and AB horizontally. Both assumed tension arrows point away from A.'), t('Find signed AC.'), 180, 'kN',
                t('−180 + AC = 0 gives +180 kN of tension. In the horizontal direction, −90 + AB = 0 gives AB = +90 kN of tension.'), { drawing: 'truss-reactions' }),
            projection(t('At B, the diagonal BC is the only unknown. Its line rises at 45° from the leftward horizontal toward C. We are going to use the horizontal equation first.'), 'horizontal', true, 'joint-b'),
            num(t('At B, AB pulls 90 kN left and compressed BD pushes 90 kN down. The diagonal BC is the only remaining unknown. Under a tension assumption it points up and left, so its horizontal contribution is −BC cos 45°.'), t('Find signed BC.'), -90*Math.SQRT2, 'kN',
                t('−90 − BC cos 45° = 0 gives BC ≈ −127.28 kN. Its actual force at B is down and right. Vertically, +180 − 90 − 90 = 0 checks the result.'), { drawing: 'truss-solved' }),
            num(t('Check the last joint C without solving a new unknown. AC in tension pulls down 180 kN. CE in tension pulls up 90 kN. CD in tension pulls right 90 kN. The compressed diagonal BC pushes up and left with components of 90 kN each.'), t('What is the signed vertical sum at C?'), 0, 'kN',
                t('ΣFᵧ = −180 + 90 + 90 = 0 kN. The horizontal sum is also zero because CD’s +90 kN cancels BC’s −90 kN.'), { drawing: 'truss-solved' }),
            pick(t('An unloaded joint with two collinear members and one diagonal can often be solved without numbers. Any force along the diagonal has a component perpendicular to the line of the other two members.'), t('If there is no load or reaction at such a joint, what must the diagonal force be?'), [
                ['zero',t('Zero')], ['tension',t('Always in tension'),t('Tension would give a perpendicular component that nothing could balance.')],
                ['compression',t('Always in compression'),t('Compression would still give a perpendicular component that nothing could balance.')],
            ], 'zero', t('The perpendicular components must sum to zero. With only one member able to provide one, that member must carry zero force in this load case.'), { drawing: 'zero-joint' }),
        ],
    },
    {
        title: t('Bring it together on one beam'), drawing: scene(t('Start with the same beam throughout'), 'shear-beam'),
        outcome: t('Keep the applied loads, reactions, and internal diagrams together. Convert the peak moment before computing required S and compare the table in its displayed units.'),
        refs: ['reactions', 'area', 'units', 'section'],
        turns: [
            pick(t('Here is one study problem from start to finish. The 8 m beam carries 6 kN/m over its full length. Imagine cutting it free from the building. An ideal pin is at A and an ideal roller on a horizontal surface is at B.'), t('Which external reactions belong on the free-body diagram?'), [
                ['right',t('Aₓ, Aᵧ and Bᵧ')], ['moments',t('Aᵧ, Bᵧ and two end moments'),t('These supports can rotate. A pin also restrains horizontal translation.')],
                ['vertical',t('Just Aᵧ and Bᵧ'),t('Aₓ is a valid reaction even though the horizontal force equation will give it a value of zero.')],
            ], 'right', t('Aₓ, Aᵧ and Bᵧ belong on the diagram. Use the equations to find their values.')),
            num(t('The uniform 6 kN/m acts over 8 m. Its resultant is at midspan, so the two supports split it equally.'), t('Find either vertical reaction.'), 24, 'kN',
                t('6×8 = 48 kN. Half is 24 kN upward at each end, and the horizontal pin reaction is zero.'), { skill: 'reactions' }),
            pick(t('On the shear diagram, V = 24 − 6x in the span. Locate the point where V crosses zero. The positive shear before it increases M, and negative shear after it decreases M.'), t('Tap the position of the largest positive moment.'), [
                ['left',t('Support A'),t('V has just jumped here, but there is no accumulated shear area and M is zero.')],
                ['middle','Midspan'], ['right',t('Support B'),t('The signed positive and negative shear areas have cancelled by this point.')],
            ], 'middle', t('At midspan, the shear is 24 − 6×4 = 0, so this is the peak.'), { drawing: 'shear-plot', hot: ['left','middle','right'] }),
            num(t('From A to midspan the positive shear area is a triangle of base 4 m and height 24 kN. Starting from zero moment, its area gives the peak.'), t('Find Mmax.'), 48, 'kN·m',
                t('½×4×24 = 48 kN·m. Plot the positive sagging peak below the datum as in the course diagrams.'), { drawing: 'positive-shear' }),
            num(t('We want the peak bending stress to stay at or below 150 MPa. MPa means N/mm². To use Sreq = Mmax/σallow we first convert 48 kN·m to 48,000,000 N·mm.'), t('Find the required section modulus in mm³.'), 320000, 'mm³',
                t('48,000,000 ÷ 150 = 320,000 mm³. On a table in 10³ mm³, compare against 320.'), { drawing: 'moment-plot', units: t('Multiply kN·m by 1,000 N/kN and 1,000 mm/m. Then (N·mm) ÷ (N/mm²) = mm³.'), wrong: [[320, t('320 is the value in thousands of mm³. This entry asks for mm³.')]] }),
            pick(t('Use the listed nominal masses and compare Sₓ with the threshold of 320 in the table’s displayed units.'), t('Which is the lightest listed section that passes?'), [
                ['31','W200×31 · Sₓ = 299',t('299 is below 320. This lighter shape does not pass.')],
                ['36','W200×36 · Sₓ = 342'], ['42','W200×42 · Sₓ = 399',t('This passes, but the lighter W200×36 also passes.')],
            ], '36', t('W200×36 is the lightest listed option meeting the stated major-axis elastic section modulus. Other checks would follow in a full design.'), { drawing: 'steel-sample' }),
        ],
    },
    {
        title: t('Get comfortable with the numbers'), drawing: scene(t('Right triangle for a brace'), 'triangle'),
        outcome: t('Write the units, sketch the right triangle, and isolate the unknown before reaching for the calculator.'),
        refs: ['units', 'trig', 'signs', 'algebra', 'equations', 'powers'],
        turns: [
            num(t('We’ll use a simple diagonal brace as our first problem. Its horizontal run is 4 m and its rise is 3 m. When you change units the brace stays the same size. One metre is 1,000 millimetres.'), t('Write the 4 m run in millimetres.'), 4000, 'mm',
                t('4 m × 1,000 mm/m = 4,000 mm. The metre units cancel. A smaller unit needs a larger number.'), { units: t('Use mm/m so the m cancels and mm stays. The conversion factor changes how we write the length.'), wrong: [[.004, t('That divides when you need to multiply. There are 1,000 mm in each metre.')]] }),
            pick(t('A triangle has a right angle if two sides meet at 90°. The side across from that corner is called the hypotenuse. It is always the longest side of a right triangle.'), t('Tap the hypotenuse of the brace triangle.'), [
                ['run',t('Horizontal leg'),t('That leg meets the vertical one at the right angle.')],
                ['rise',t('Vertical leg'),t('That leg also meets the right angle. Look across the triangle.')],
                ['brace',t('Diagonal brace')],
            ], 'brace', t('The diagonal sits across from the 90° corner. The run and rise are its two perpendicular legs.'), { hot: ['run','rise','brace'] }),
            num(t('To find the diagonal, square each leg. Squaring means multiplying the number by itself. Add the two squares, then undo the square with a square root.'), t('How long is the diagonal?'), 5, 'm',
                t('4² + 3² = 16 + 9 = 25 m². √25 = 5, so the brace is 5 m long.'), { wrong: [[7,t('Adding 4 + 3 follows the two sides of the triangle. The diagonal takes a shorter path.')],[25,t('25 is the squared length. Take its square root to get metres.')]] }),
            pick(t('Imagine standing at the left end and looking up along the brace. The angle θ is measured from the ground. The side across from θ is the rise, and the side next to θ is the run.'), t('Which ratio gives tan θ for this brace?'), [
                ['rise-run','3 ÷ 4'], ['run-rise','4 ÷ 3',t('That reverses the order. Tangent is opposite over adjacent.')],
                ['rise-brace','3 ÷ 5',t('That is the opposite-to-hypotenuse ratio, which is sine.')],
            ], 'rise-run', t('tan θ = opposite/adjacent = 3/4. With θ measured from the ground, the run is adjacent and the rise is opposite.'), { skill: 'trig' }),
            num(t('Tangent takes an angle and returns a ratio. Inverse tangent goes the other way. On a calculator in degree mode, use tan⁻¹(0.75), also written arctan(0.75).'), t('Find θ to the nearest tenth of a degree.'), Math.atan(3/4)*180/Math.PI, '°',
                t('θ ≈ 36.87°, or 36.9°. Because the rise is smaller than the run, a tilt less than 45° makes sense.'), { tolerance: .1, wrong: [[.644,t('That is the same angle in radians. Use degree mode to answer in degrees.')]] }),
            num(t('One last tool before forces. An equation is like a balanced scale. If 3x + 4 = 19, subtract 4 from both sides first. That leaves 3x = 15. Then undo multiplication.'), t('What is x?'), 5, '',
                t('Divide both sides by 3. x = 5, and 3×5 + 4 = 19 checks it.'), { drawing: 'balance-equation', newExample: true, wrong: [[15,t('15 is the value of 3x. Divide by 3 to find a single x.')]] }),
        ],
    },
];

const refreshers = {
    units: {
        title: t('Track the units'),
        drawing: scene(t('Force × distance'), 'unit-ruler'),
        turns: [
            num(t('There are 1,000 newtons in one kilonewton. Convert before combining force with area in mm².'), t('Convert 2.5 kN to N.'), 2500, 'N', localizedEquation('2.5 × 1,000 = 2,500 N.')),
            num(t('A moment has both force and distance in it. Since 1 kN is 1,000 N and 1 m is 1,000 mm, 1 kN·m is 1,000×1,000 = 1,000,000 N·mm.'), t('Convert 4 kN·m to N·mm.'), 4e6, 'N·mm', localizedEquation('4 × 1,000,000 = 4,000,000 N·mm.'), { wrong: [[4000,t('That converts only one of the units. Convert both force and distance.')]] }),
        ],
    },
    signs: {
        title: t('Signed forces and algebra'),
        drawing: scene(t('Positive axes and turn direction'), 'axes'),
        turns: [
            num(t('First choose what is positive. Here right is positive. A leftward arrow of 6 kN points in the negative x direction.'), t('Enter the signed x component.'), -6, 'kN', t('Left is negative, so Fₓ = −6 kN.'), { wrong: [[6, t('6 kN is the magnitude. Give it a minus sign to say left.')]] }),
            num(t('To balance a +18 kN force, write R + 18 = 0. Subtract 18 from both sides to find R.'), t('Enter the signed reaction R.'), -18, 'kN', t('R = 0 − 18 = −18 kN. Substitute it back to check that −18 + 18 = 0.')),
            pick(t('For moments we choose counterclockwise as positive. Picture pushing down on the right side of a seesaw while pivoting about its centre.'), t('What sign is that moment?'), [
                ['negative',t('Negative, clockwise')], ['positive',t('Positive, counterclockwise'),t('The right side goes down and the left side goes up, a clockwise turn.')],
            ], 'negative', t('Clockwise is negative with our chosen convention.')),
        ],
    },
    trig: {
        title: 'SOH CAH TOA',
        drawing: scene(t('Angle measured from horizontal'), 'vector'),
        turns: [
            pick(t('SOH CAH TOA is a memory aid for the three ratios in a right triangle. Start with the marked angle. The leg beside it is adjacent. The leg across from it is opposite. The longest side, across from 90°, is the hypotenuse.'), t('Tap the adjacent leg for the marked 30° angle.'), [
                ['x',t('Horizontal leg')], ['y',t('Vertical leg'),t('The vertical leg is across from the angle, so it is opposite.')], ['f',t('Diagonal'),t('The diagonal is the hypotenuse.')],
            ], 'x', t('The horizontal component is adjacent, so use cosine for it.'), { hot: ['x','y','f'] }),
            projection(t('Now find the ratio for the vertical leg. SOH is sine = opposite/hypotenuse. CAH is cosine = adjacent/hypotenuse. TOA is tangent = opposite/adjacent.'), 'vertical', false, 'vector'),
            num(t('To get the vertical component of a 10 kN force at 30° above horizontal, multiply by sin 30°. In degree mode that is 0.5.'), t('Find the vertical component.'), 5, 'kN', t('10 × 0.5 = 5 kN upward.')),
        ],
    },
    algebra: {
        title: t('Isolate the unknown'),
        drawing: scene(t('Equal expressions on both sides'), 'balance-equation'),
        turns: [
            num(t('An equation is balanced like a scale. In R + 7 = 19, subtract the same 7 from both sides to leave R by itself.'), t('What is R?'), 12, '', t('R = 19 − 7 = 12. Check: 12 + 7 = 19.')),
            num(t('If 5B = 40, 5B means five times B. Undo multiplication by dividing both sides by 5.'), t('What is B?'), 8, '', t('B = 40/5 = 8. Check: 5×8 = 40.')),
        ],
    },
    equations: {
        title: t('Solve two equations together'),
        drawing: scene(t('Two constraints on the same two forces'), 'balance-equation'),
        turns: [
            num(t('Two supports carry 30 kN in total. Write Aᵧ + Bᵧ = 30 kN. That leaves many possibilities until we add a second condition. A moment equation about A already gave Bᵧ = 10 kN.'), t('Replace Bᵧ by 10 kN. What is Aᵧ?'), 20, 'kN', t('Aᵧ + 10 = 30. Subtract 10 kN on both sides to get Aᵧ = 20 kN. Using a known value in another equation is called substitution.')),
            num(t('Sometimes neither equation has a variable by itself. Take X + Y = 14 kN and X − Y = 4 kN. Add left sides and right sides. The +Y and −Y cancel, leaving 2X = 18 kN.'), t('What is X?'), 9, 'kN', t('X = 9 kN. Substituting into X + Y = 14 gives Y = 5 kN. The other equation checks: 9 − 5 = 4. Cancelling the Y terms is called elimination.')),
        ],
    },
    powers: {
        title: t('Squares, cubes and inverse effects'),
        drawing: scene(t('Compare the factors'), 'powers'),
        turns: [
            num(t('A square means multiply the value by itself. A cube uses it three times.'), t('If length doubles, what factor multiplies L³?'), 8, '',
                'Use (2L)³ = 2×2×2×L³ = 8L³.', { wrong: [[6,t('Six comes from 2×3. Cubing 2 is 2×2×2.')]] }),
            num(t('If L² is in the denominator and L doubles, the denominator becomes four times larger. Dividing by four gives one-quarter of the original.'), t('An 80 kN value follows 1/L². What is it after L doubles?'), 20, 'kN', t('80/4 = 20 kN. The other quantities must stay fixed for this comparison.')),
        ],
    },
    area: {
        title: t('Read area under a diagram'),
        drawing: scene(t('Base, height, and mathematical area'), 'triangle-load'),
        turns: [
            num(t('The area of a rectangular loading patch is its horizontal width times its vertical intensity.'), t('Find the total force for 3 kN/m spread over 4 m.'), 12, 'kN', t('3 kN/m × 4 m = 12 kN. Metres cancel.')),
            num(t('A triangle with the same base and height has half the area of a rectangle. On a shear diagram, base is in metres and height is in kN.'), t('A positive shear triangle is 3 m long and 8 kN high. How much does it add to moment?'), 12, 'kN·m', t('½ × 3 × 8 = +12 kN·m. Area below zero would count negatively.')),
        ],
    },
    reactions: {
        title: t('Find the support reactions'),
        drawing: scene(t('Beam with one point force'), 'reaction-refresher'),
        turns: [
            pick(t('This 6 m beam has a pin at A and a roller at B. The 18 kN applied load is 2 m from A. To solve Bᵧ first, choose the pivot that makes A’s force lever arms zero.'), t('Tap your moment centre.'), [
                ['A',t('Support A')], ['B',t('Support B'),t('At B it is Bᵧ that disappears. To solve for Bᵧ, take moments about A.')],
            ], 'A', t('Both A reactions act through A, so their moments about A are zero.'), { hot: ['A','B'] }),
            num(t('The 18 kN arrow turns clockwise with a 2 m arm. Bᵧ turns counterclockwise with a 6 m arm. Use 6Bᵧ − 18×2 = 0.'), t('Find Bᵧ.'), 6, 'kN', t('6Bᵧ = 36 kN·m. Divide by 6 m to get +6 kN.')),
            num(t('The two supports together carry 18 kN. That force equation alone cannot tell us the split. The moment equation found Bᵧ = 6 kN, so substitute 6 kN into the force equation to find the rest.'), t('Find Aᵧ.'), 12, 'kN', t('Aᵧ + 6 − 18 = 0 gives +12 kN. The two equations now check for the same pair of reactions.')),
        ],
    },
    section: {
        title: t('Convert moment into section modulus'),
        drawing: scene(t('Read the Sₓ column and its units'), 'steel-sample'),
        turns: [
            num(t('Use S = M/σ. Convert M to N·mm so it matches MPa as N/mm².'), t('For 30 kN·m and 150 MPa, what S is required?'), 200000, 'mm³', localizedEquation('30×10⁶/150 = 200,000 mm³.')),
            num(t('The sample table displays S in thousands of mm³. In that column one unit stands for 1,000 mm³.'), t('What number in the table represents 200,000 mm³?'), 200, '×10³ mm³', t('200,000/1,000 = 200. Compare thresholds using the table scale.')),
        ],
    },
    buckling: {
        title: t('Keep L and KL distinct'),
        drawing: scene(t('Same height, different restraint'), 'buckling'),
        turns: [
            num(t('L is the physical unbraced length. K is a factor for the restraints. A 3 m fixed–free column has K = 2.'), t('What is KL?'), 6, 'm', t('K×L = 2×3 = 6 m. The actual column is still 3 m long.')),
            num(t('With E and I unchanged, each doubling of KL gives one-quarter of the Euler load.'), t('A column’s original load was 60 kN. What is it if KL doubles?'), 15, 'kN', '60×(1/2)² = 15 kN.'),
        ],
    },
    trussJoint: {
        title: t('Choose a joint you can solve'),
        drawing: scene(t('Five joints, with reactions known'), 'truss'),
        turns: [
            pick(t('The external reactions are known. Each planar joint gives two independent force equations at most. Look for a known force and no more than two independent unknown directions.'), t('Which of E and D can you solve immediately?'), [
                ['E',t('Joint E')], ['D',t('Joint D'),t('At this point D has three unknown member forces. At E, the applied load is already known.')],
            ], 'E', t('E has one applied load and two unknowns. Start by resolving the diagonal and balancing the horizontal direction.'), { hot: ['E','D'] }),
            pick(t('Assume an unknown tension arrow pulls away from the joint. Solving its equilibrium equation gives a negative coefficient.'), t('What does the negative result mean?'), [
                ['compression',t('The member is in compression')], ['tension',t('The member is still in tension'),t('The sign reverses the assumed arrow. The member actually pushes on the joint.')],
            ], 'compression', t('A negative value under a tension assumption is compression. Transfer the force to the next joint in the opposite direction.')),
        ],
    },
};

workshops[2].turns.push({ ...fbdQuestion('cantilever'),
    intro: t('Now put the support rules into practice. Start with the fixed beam in the upper drawing. Then use the buttons to build the isolated beam below.'),
    solution: fbdCases.cantilever.solution,
});

// The first numerical use of each method includes a guided substitution.
workshops[1].turns[2].calculation = paperCalculation('Fₓ', t('Signed horizontal force component'), 'kN',
    [['F', t('Force magnitude'), 'kN', 10], ['θ', t('Angle from +x'), '°', 30]],
    [0, '× cos(', 1, ')'], null, (force, angle) => force * Math.cos(angle * Math.PI / 180));
workshops[3].turns[3].calculation = paperCalculation('Mₐ', t('Moment about support A'), 'kN·m',
    [['Fᵧ', t('Signed vertical force'), 'kN', -24], ['d', t('Perpendicular lever arm'), 'm', 2]],
    [0, '×', 1], null, (force, arm) => force * arm);
workshops[3].turns[6].calculation = paperCalculation('Bᵧ', t('Vertical reaction at support B'), 'kN',
    [['|M₁|', t('Moment magnitude from the point load'), 'kN·m', 48], ['|M₂|', t('Moment magnitude from the distributed load'), 'kN·m', 192],
        ['L', t('Span between supports'), 'm', 8]],
    [0, '+', 1], [2], (first, second, length) => (first + second) / length);
workshops[4].turns[5].calculation = paperCalculation('M(4)', t('Bending moment at x = 4 m'), 'kN·m',
    [['Δx', t('Base of the shear triangle'), 'm', 4], ['V₀', t('Height of the shear triangle'), 'kN', 24]],
    ['½ ×', 0, '×', 1], null, (base, height) => .5 * base * height);
workshops[5].turns[1].calculation = paperCalculation('σ', t('Axial stress'), 'MPa',
    [['F', t('Axial force in newtons'), 'N', 24000], ['A', t('Cross-sectional area'), 'mm²', 150]],
    [0], [1], (force, area) => force / area);
workshops[6].turns[2].calculation = paperCalculation('Iweb', t('Second moment of area of the web about its own horizontal centreline'), 'mm⁴',
    [['b', t('Width of the web'), 'mm', 20], ['h', t('Depth of the web'), 'mm', 80]],
    [0, '× (', 1, ')³'], ['12'], (width, depth) => width * depth ** 3 / 12);
workshops[8].turns[6].calculation = paperCalculation('ED', t('Signed force in truss member ED'), 'kN',
    [['P', t('Rightward load at E'), 'kN', 90], ['θ', t('Angle from horizontal'), '°', 45]],
    ['−', 0], ['cos(', 1, ')'], (load, angle) => -load / Math.cos(angle * Math.PI / 180));
workshops[10].turns[2].calculation = paperCalculation('L', t('Length of the diagonal'), 'm',
    [['b', t('Horizontal run'), 'm', 4], ['h', t('Vertical rise'), 'm', 3]],
    ['√((', 0, ')² + (', 1, ')²)'], null, Math.hypot);

workshops[10].turns[5].algebra = [
    ['3x + 4 = 19', t('Start with the equation as given.')],
    ['3x + 4 − 4 = 19 − 4', t('Subtract 4 from both sides. The operations keep the two sides equal.')],
    ['3x = 15', t('On the left, +4 and −4 cancel. On the right, 19 − 4 gives 15.')],
    ['3x ÷ 3 = 15 ÷ 3', t('Divide both sides by 3 to undo multiplication by 3.')],
    ['x = 5', t('Check by putting 5 back into the original equation. 3 × 5 + 4 = 19.')],
];
workshops[2].turns[3].algebra = [
    ['Aₓ + 9 kN = 0', t('Write the assumed support force plus the rightward applied force.')],
    ['Aₓ + 9 kN − 9 kN = 0 − 9 kN', t('Subtract 9 kN on both sides. That is why the term on the right is negative.')],
    ['Aₓ = −9 kN', t('The minus sign reverses the assumed arrow. Aₓ points left.')],
];
workshops[3].turns[6].algebra = [
    ['(8 m) Bᵧ − 48 kN·m − 192 kN·m = 0', t('Start with moment equilibrium about A.')],
    ['(8 m) Bᵧ − 240 kN·m = 0', t('Combine the two clockwise moments on the left.')],
    ['(8 m) Bᵧ − 240 kN·m + 240 kN·m = 0 + 240 kN·m', t('Add the same moment to both sides to cancel the negative term on the left.')],
    ['Bᵧ = (240 kN·m) ÷ (8 m) = 30 kN', t('Divide both sides by the 8 m arm. The metres cancel and the result is a force.')],
];
