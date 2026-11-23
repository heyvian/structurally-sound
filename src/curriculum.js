// Existing question order is preserved for saved completion and mistake records.

const Q = (prompt, opts, answer, explain, hint = '') => ({ prompt, opts, answer, explain, hint, type: 'choice' });
const N = (prompt, answer, explain, hint = '', unit = '') => ({ prompt, answer, explain, hint, unit, type: 'number' });
const center={L:6,a:0,b:6,points:[{x:3,p:12}],udls:[]};

const units = [
    {
        title: t('Loads on structures'),
        date: t('Foundations'),
        intro: t('Loads are actions on a structure. A load path carries them through structural elements to the ground.'),
        q: [
            Q(t('Which is typically a dead load?'),[t('Concrete slab'),t('People in a classroom'),t('Snow on a roof')],0,t('The permanent slab contributes its own weight.')),
            Q(t('What ultimately receives the building’s gravity loads?'),[t('The facade'),t('The ground'),t('The ceiling')],1,t('Loads must travel through a continuous path to the ground.')),
            N(t('A floor has a uniform load of 4 kN/m² over 20 m². Total load in kN?'),80,'4 × 20 = 80 kN.',t('Multiply load intensity by area.'),'kN'),
        ],
    },
    {
        title: t('Static fundamentals & forces'),
        date: t('Sep 17 · Quiz 1'),
        intro: t('Forces are vectors. Resolve them into perpendicular components using SOH CAH TOA. If the angle is measured from +x, Fx = F cos θ and Fy = F sin θ.'),
        q: [
            Q(t('Which ratio equals sine?'),[t('Adjacent / hypotenuse'),t('Opposite / hypotenuse'),t('Opposite / adjacent')],1,t('SOH: sine = opposite / hypotenuse.')),
            N(t('The 14 kN arrow points 30° above the positive horizontal axis (+x). Find its vertical component, Fᵧ.'),7,t('14 sin 30° = 7 kN.'),t('The vertical component is opposite the angle.'),'kN'),
            N(t('Find the magnitude of a resultant with components 3 and 4 kN.'),5,'√(3² + 4²) = 5 kN.',t('Use Pythagoras.'),'kN'),
        ],
    },
    {
        title: t('Equilibrium & free-body diagrams'),
        date: t('Sep 24 · Quiz 2'),
        intro: t('Isolate the body, replace supports with reactions, and show all external loads. In planar static equilibrium, ΣFx = ΣFy = ΣM = 0.'),
        q: [
            Q(t('Which reactions does an ideal planar pin provide?'),[t('Vertical only'),t('Horizontal and vertical'),t('Horizontal, vertical and moment')],1,t('A pin allows rotation but prevents translation.')),
            Q(t('Which belongs on an isolated beam free-body diagram?'),[t('Only applied loads'),t('Applied loads and support reactions'),t('Only internal stresses')],1,t('Show all external forces and moments.')),
            N(t('A 12 kN downward force is balanced by one vertical reaction. Magnitude?'),12,t('ΣFy = 0 gives an upward 12 kN reaction.'),t('Upward balances downward.'),'kN'),
        ],
    },
    {
        title: t('Moments & reaction forces'),
        date: t('Oct 1 · Quiz 3'),
        intro: t('A moment is a force times its perpendicular lever arm. Taking moments about a support removes unknown reactions at that point from the moment equation.'),
        q: [
            N(t('A 6 kN force acts perpendicular to a 2 m lever. Moment magnitude?'),12,'6 × 2 = 12 kN·m.',t('Force times perpendicular distance.'),'kN·m'),
            N(t('A 6 m beam rests on a pin at A and a roller at B. A 12 kN load acts down, 2 m to the right of A. Find the upward reaction at B.'),4,t('Taking moments about A: B × 6 = 12 × 2, so B = 4 kN.'),t('Take moments about A.'),'kN'),
            N(t('On the 6 m beam, a 12 kN load acts down and support B pushes up with 4 kN. What upward force does support A supply?'),8,t('A + 4 − 12 = 0, giving A = 8 kN.'),t('Use vertical equilibrium.'),'kN'),
        ],
    },
    {
        title: t('Shear & moment diagrams'),
        date: t('Oct 8 · Quiz 4'),
        intro: t('Shear describes internal transverse force; bending moment describes internal rotational effect. With the convention used here, dM/dx = V. A point load changes shear abruptly.'),
        q: [
            Q(t('Between point loads with no distributed load, shear is…'),[t('Constant'),t('Parabolic'),t('Always zero')],0,t('No distributed load means no change in shear.')),
            graphQuestion(center, 'V'),
            graphQuestion(center, 'M'),
        ],
    },
    {
        title: t('Stress, strain & material capacity'),
        date: t('Oct 15 · Quiz 5'),
        intro: t('Stress is force per area; strain is relative deformation. The initial slope of an idealized stress–strain curve is elastic modulus E.'),
        q: [
            N(t('A 20,000 N axial force acts on 100 mm². Stress in MPa?'),200,localizedEquation('20,000 / 100 = 200 N/mm² = 200 MPa.'),t('Divide force by area.'),'MPa'),
            {type:'stress',prompt:t('Select the approximate yield point on this idealized ductile steel stress–strain curve.'),answer:1,explain:t('Yield marks the onset of significant plastic deformation. The plotted curve is schematic.'),hint:t('Look near the end of the initial elastic rise.')},
            Q(t('What does the initial stress–strain slope represent?'),[t('Density'),t('Elastic modulus'),t('Ultimate strength')],1,t('Elastic modulus describes stiffness in the linear elastic range.')),
        ],
    },
    {
        title: t('Centroids, section properties & member selection'),
        date: t('Oct 22 · Quiz 6'),
        intro: t('The centroid is an area-weighted location. The second moment of area describes how area is distributed about an axis, influencing bending stiffness.'),
        q: [
            N(t('A rectangular section is 20 mm wide and 30 mm tall. Find Iₓ, its second moment of area about the horizontal line through its centre, in mm⁴.'),45000,localizedEquation('20 × 30³ / 12 = 45,000 mm⁴.'),t('Cube the depth, not the width.'),'mm⁴'),
            {type:'table',prompt:t('Required Ix ≥ 80 × 10⁶ mm⁴. Select the lightest illustrative section satisfying this criterion alone.'),opts:['A','B','C'],answer:1,explain:t('B is the lightest candidate meeting the stated inertia. Real selection also requires other strength, stability and serviceability checks.'),hint:t('Eliminate insufficient Ix, then compare mass.')},
            N(t('Two areas of 10 and 30 mm² have centroid heights 0 and 20 mm. Combined centroid height?'),15,'(10×0 + 30×20)/40 = 15 mm.',t('Use an area-weighted average.'),'mm'),
        ],
    },
    {
        title: t('Buckling'),
        date: t('Oct 29 · Quiz 7'),
        intro: t('Slender compression members can become unstable. Ideal Euler buckling load Pcr = π²EI/(KL)².'),
        q: [
            Q(t('A column keeps the same material and cross-section. Its effective length KL doubles. What happens to its ideal buckling load?'),[t('Twice as large'),t('One half'),t('One quarter')],2,t('The new load is the old load divided by 2². The column’s material and shape stay the same, so the only change is from (KL)² to (2KL)² in the denominator.')),
            Q(t('Which member is generally more susceptible to buckling, all else equal?'),[t('Long slender column'),t('Short stocky column')],0,t('Slenderness increases instability risk.')),
            Q(t('Which section property appears in Euler’s formula?'),[t('Second moment of area'),t('Volume'),t('Mass')],0,t('EI governs flexural stiffness.')),
        ],
    },
    {
        title: t('Truss analysis'),
        date: t('Nov 19 · Quiz 8'),
        intro: t('Ideal pin-jointed truss members carry axial tension or compression. Start with whole-truss reactions, then isolate joints or sections.'),
        q: [
            Q(t('Ideal truss members primarily carry…'),[t('Axial tension or compression'),t('Bending only'),t('Torsion only')],0,t('Ideal pin-jointed members are two-force members.')),
            N(t('At the isolated joint, a member slopes up to the right at 30° from horizontal. Its vertical force component is 5 kN upward. How large is the force along the member?'),10,t('The 5 kN vertical component lies across from the 30° angle. Sine is opposite over hypotenuse, so 5 kN = F × sin 30°. Divide by sin 30° = 0.5 to get F = 10 kN.'),t('Resolve the member force vertically.'),'kN'),
            Q(t('You assumed tension and calculated −8 kN. What is the actual state?'),[t('8 kN tension'),t('8 kN compression'),t('Zero force')],1,t('A negative result reverses the assumed direction.')),
        ],
    },
    {
        title: t('Cumulative course review'),
        date: t('Nov 26 · Quiz 9'),
        intro: t('Integrate load paths, equilibrium, section properties and truss behavior. Start by identifying the structural model, then choose equations.'),
        q: [
            Q(t('Before solving a truss joint, what is often useful to determine?'),[t('Support reactions'),t('Paint colour'),t('Elastic strain in every member')],0,t('Whole-structure equilibrium provides the external reactions.')),
            N(t('A symmetric simply supported truss carries a central 24 kN vertical load. Each vertical reaction?'),12,t('Symmetry and vertical equilibrium give 12 kN each.'),t('Divide the central load equally.'),'kN'),
        ],
    }
];

const adds = [
    [
        N(t('A roof load is 2.5 kN/m² on 16 m². Find the total load.'),40,localizedEquation('2.5×16 = 40 kN.'),t('Use tributary area.'),'kN'),
        Q(t('Which load acts horizontally on a vertical facade?'),[t('Self-weight of slab'),t('Wind pressure normal to the facade'),t('Vertical occupancy load')],1,t('Wind pressure can act laterally on a facade.')),
    ],
    [
        N(t('A 13 kN resultant has horizontal component 5 kN. Find the positive vertical component.'),12,'√(13²−5²) = 12 kN.',t('Use the right triangle.'),'kN'),
        N(t('Convert 2.4 kN to N.'),2400,'1 kN = 1000 N.',t('Multiply by 1000.'),'N'),
        N(t('A 20 kN force points 60° above positive x. Find Fx.'),10,t('20 cos 60° = 10 kN.'),t('Adjacent to the angle.'),'kN'),
        Q(t('Which is an appropriate method for a non-right triangle with two known sides and their included angle?'),[t('SOH CAH TOA alone'),t('Cosine law'),t('Sum of horizontal forces alone')],1,t('Cosine law relates two sides and their included angle to the third side.')),
    ],
    [
        Q(t('How many independent ways can a rigid object move in a plane when nothing holds it in place? These are its degrees of freedom.'),['2','3','6'],1,t('There are two translations and one rotation.')),
        Q(t('An assumed upward reaction solves to −5 kN. What does this mean?'),[t('5 kN downward'),t('5 kN upward'),t('No reaction')],0,t('The sign reverses the assumed direction.')),
        {type:'fbd',prompt:t('For the beam with a pin at A, horizontal roller at B and downward point load, select all support reactions to show on its free-body diagram.'),opts:[t('Ax: horizontal at A'),t('Ay: vertical at A'),t('By: vertical at B'),t('MA: moment at A'),t('Bx: horizontal at B')],answer:[0,1,2],explain:t('Pin A restrains both translations; roller B on a horizontal surface restrains vertical translation. Neither resists a moment.'),hint:t('Which translations and rotations does each support restrain?')},
    ],
    [
        N(t('An 8 m simple beam carries a uniform 3 kN/m load over its entire span. Find the equivalent resultant.'),24,t('3×8 = 24 kN at the midpoint.'),t('Intensity × length.'),'kN'),
        N(t('An 8 m simple span carries a downward 3 kN/m load along its full length. Find the upward reaction at B.'),12,t('Taking moments about A: RB×8 = 24×4, so RB=12 kN.'),t('Use the equivalent load at x=4 m.'),'kN'),
        N(t('A 10 kN force has a 3 m perpendicular lever arm about the pivot. Find its moment magnitude.'),30,'10×3=30 kN·m.',t('Perpendicular lever arm.'),'kN·m'),
    ],
    [
        Q(t('For a uniformly distributed downward load, what shape does the bending moment diagram take?'),[t('Constant'),t('Linear'),t('Quadratic parabola')],2,t('Constant distributed load → linear shear → quadratic moment.')),
        N(t('A 6 m simple beam has a central 12 kN downward load. What is the maximum absolute shear?'),6,t('Both reactions are 6 kN; the shear magnitude is 6 kN on either side.'),t('Use symmetry.'),'kN'),
        N(t('Find the maximum positive moment on a 6 m simple span with a 12 kN downward midpoint load.'),18,'6 × 3 = 18 kN·m.',t('Find area under positive shear.'),'kN·m'),
    ],
    [
        N(t('A bar 400 mm long elongates by 0.8 mm. Find strain as a decimal.'),.002,localizedEquation('0.8/400 = 0.002.'),t('Divide extension by original length.'),''),
        {type:'stress',prompt:t('Identify the ultimate tensile strength on this idealized steel stress–strain curve.'),answer:2,explain:t('The ultimate tensile stress is the maximum engineering stress on the curve.'),hint:t('Find the highest stress rather than the largest strain.')},
        {type:'stress',prompt:t('Identify fracture on the idealized stress–strain curve.'),answer:3,explain:t('Fracture occurs at the termination of the curve.'),hint:t('Look for the end of the test.')},
    ],
    [
        N(t('A section has second moment of area Iₓ = 45×10⁶ mm⁴ about its neutral axis. The farthest edge is c = 150 mm from that axis. Find the elastic section modulus Sₓ in mm³.'),300000,localizedEquation('S=I/c = 45,000,000/150=300,000 mm³.'),t('Divide by distance to extreme fibre.'),'mm³'),
        N(t('A beam has Mmax = 60 kN·m and allowable bending stress 150 MPa. Find required S in mm³.'),400000,localizedEquation('60×10⁶ N·mm / 150 N/mm² = 400,000 mm³.'),t('Convert kN·m to N·mm.'),'mm³'),
        {type:'table',tableKind:'S',prompt:t('Select the lightest illustrative beam with Sₓ ≥ 400×10³ mm³, considering only this sizing criterion.'),opts:['A','B','C'],answer:1,explain:t('B meets the required section modulus with the lowest mass among qualifying options. Real selection requires checks beyond bending stress.'),hint:t('Compare S first, then mass.')},
        N(t('A component has area 200 mm², local Iₓₓ=2,000 mm⁴, and centroid 10 mm from the combined neutral axis. Find its contribution to Iₓₓ.'),22000,localizedEquation('I = Ic+Ad² = 2,000 + 200×100 = 22,000 mm⁴.'),t('Use the parallel-axis theorem.'),'mm⁴'),
    ],
    [
        Q(t('The elastic modulus E doubles. The second moment of area I and the effective length KL stay the same. What happens to the ideal Euler buckling load?'),['Doubles','Halves',t('Stays unchanged')],0,t('Pcr is directly proportional to E.')),
        Q(t('What is the primary loading associated with column buckling?'),[t('Axial compression'),t('Pure tension'),t('Unloaded rotation')],0,t('A slender member under compression may become unstable.')),
    ],
    [
        N(t('A symmetric triangular truss has a 20 kN downward load at its apex and both inclined members at 45° to horizontal. Each support vertical reaction?'),10,t('Symmetry: 20/2=10 kN.'),t('Solve the whole truss first.'),'kN'),
        N(t('A symmetric triangular truss has a 20 kN downward apex load and 45° diagonals. Find the axial force magnitude in one diagonal.'),14.1421356,t('2 F sin 45° = 20, so F=14.14 kN; both are in compression.'),t('Resolve vertical components; horizontal components cancel.'),'kN'),
        Q(t('A downward load acts at the apex of a triangular truss. Are its two downward-sloping diagonals in tension or compression?'),[t('Tension'),t('Compression'),t('Zero force')],1,t('They must push upward on the apex to balance the downward load.')),
        N(t('At the left support of a triangular truss, a diagonal slopes up to the right at 45° and carries 14.14 kN in compression. With no horizontal reaction, find the tension in the horizontal bottom chord.'),10,t('14.14 cos 45° ≈ 10 kN.'),t('Use horizontal equilibrium.'),'kN'),
    ],
    [
        Q(t('Which step detects an inconsistent reaction solution?'),[t('Check ΣFx, ΣFy and ΣM'),t('Round reactions before solving'),t('Ignore negative results')],0,t('The full set of equilibrium equations checks the external force solution.')),
        N(t('A 5 m beam with 4 kN/m uniform load has maximum positive moment wL²/8. Calculate Mmax.'),12.5,localizedEquation('4×25/8=12.5 kN·m.'),t('Substitute with consistent units.'),'kN·m'),
    ]
];

units.forEach((unit, i) => unit.q.push(...adds[i]));

// Pre-course warm-up is separate to retain the original saved question IDs.
const foundation = {
    title: t('Pre-course math & trigonometry'),
    date: t('Pre-course · Optional'),
    intro: t('Refresh fractions, units, and triangle geometry before structures. A scientific calculator in degree mode is your friend.'),
    q: [
        N(t('Convert 2.5 m to mm.'),2500,localizedEquation('2.5×1000 = 2500 mm.'),t('Multiply by 1000.'),'mm'),
        N(t('A triangle has opposite side 3 and adjacent side 4. Find tan θ.'),.75,t('tan θ = 3/4 = 0.75.'),'TOA.',''),
        N(t('What is the hypotenuse of a right triangle with legs 6 and 8?'),10,'√(36+64)=10.',t('Pythagoras.'),''),
        N(t('Convert 1 kN·m to N·mm.'),1000000,localizedEquation('1000 N × 1000 mm = 1,000,000 N·mm.'),t('Convert both units.'),'N·mm'),
        Q(t('What calculator angular mode should you use for 30°?'),['Radians','Degrees','Gradians'],1,t('The degree symbol means degrees.')),
        N(t('Calculate 1/2 ÷ 1/4.'),2,t('Keep, flip, multiply: 1/2 × 4/1 = 2.'),t('Take the reciprocal of the divisor.'),''),
    ],
};
units.push(foundation);

const extra = [
    [
        Q(t('Wind pulling away from cladding is called…'),[t('Pressure'),t('Suction'),t('Dead load')],1,t('Suction acts outward from the surface.')),
        Q(t('Which is a line load?'),[t('A wall bearing continuously on a beam'),t('A column bearing at one spot'),t('Snow over a roof area')],0,t('The wall distributes force along a length.')),
        N(t('The highlighted beam carries a 5 m-wide strip of roof. The roof pressure is 2.6 kPa. How much force does each metre of beam carry?'),13,localizedEquation('2.6 kN/m² × 5 m = 13 kN/m.'),t('Multiply by tributary width.'),'kN/m'),
        N(t('A column receives 6 kPa from a 5 m × 4 m tributary area. Total force?'),120,'6 × 20 = 120 kN.',t('Area × pressure.'),'kN'),
        Q(t('Which is the usual gravity load path?'),[t('Deck → beam → girder → column → foundation'),t('Deck → foundation → girder → column'),t('Column → beam → deck → soil')],0,t('Loads flow to supports and then the ground.')),
        Q(t('A periodic excitation near the natural frequency can cause…'),[t('Resonance'),t('Reduced mass'),t('Zero acceleration')],0,t('Dynamic response can be amplified.')),
        N(t('A member vibrates twice per second at its natural frequency of 2 Hz. How long does one complete cycle take?'),.5,localizedEquation('T=1/f=0.5 s.'),t('Reciprocal of frequency.'),'s'),
        N(t('A stationary 300 kg mass hangs from one vertical cable. With g = 9.81 m/s², find cable tension.'),2.943,t('300×9.81/1000=2.943 kN. kg measures mass, not force.'),t('Convert weight to force.'),'kN'),
    ],
    [
        N(t('A force of 125 kN acts at 30° above +x. Horizontal component?'),125*Math.cos(Math.PI/6),t('125 cos 30° = 108.25 kN.'),t('Adjacent projection.'),'kN'),
        N(t('A 125 kN force points 30° above +x. Find its vertical component.'),62.5,t('125 sin 30° = 62.50 kN.'),t('Opposite projection.'),'kN'),
        N(t('A 40 kN force points up and left, at 30° above the leftward horizontal (−x). Find the horizontal component Fₓ, taking right as positive.'),-40*Math.cos(Math.PI/6),t('Fx=−40cos30°=−34.64 kN.'),t('Leftward is negative.'),'kN'),
        N(t('Two perpendicular forces +60 kN x and +80 kN y combine. Resultant magnitude?'),100,'√(60²+80²)=100 kN.',t('Pythagoras.'),'kN'),
        N(t('Find the angle above +x of a vector with Fx=60 kN and Fy=80 kN.'),Math.atan2(80,60)*180/Math.PI,t('atan(80/60)=53.13°.'),t('Use inverse tangent in degrees.'),'°'),
        Q(t('A force vector can slide along its line of action on an ideal rigid body without changing…'),[t('Its external equilibrium effect'),t('Local stress everywhere'),t('Its magnitude and direction independently')],0,t('Transmissibility preserves the external rigid-body effect, not necessarily local stresses.')),
    ],
    [
        Q(t('A fixed support in 2D develops which reactions?'),[t('Ax and Ay only'),t('Ax, Ay and a moment'),t('Ay only')],1,t('A fixed support restrains both translations and rotation.')),
        Q(t('A roller on an inclined frictionless surface reacts…'),[t('Always vertically'),t('Normal to the surface'),t('Parallel to the surface')],1,t('A frictionless roller restrains motion normal to its supporting surface.')),
        Q(t('Two vertical forces are equal and opposite but on different lines of action. What can remain?'),[t('A couple moment'),t('An unbalanced vertical resultant'),t('No external effect')],0,t('Their net force is zero, but they produce a couple.')),
        Q(t('Three planar reactions guarantee stability?'),[t('Yes, always'),t('No, geometry matters'),t('Only for timber')],1,t('Parallel or concurrent lines of action can leave a mechanism.')),
        N(t('A horizontal load of 15 kN acts rightward on a beam with a pin and a horizontal roller. Find the horizontal pin reaction, taking right as positive.'),-15,t('Only the pin provides a horizontal reaction. ΣFₓ = 0 gives Aₓ + 15 = 0, so Aₓ = −15 kN.'),t('The roller cannot supply a horizontal reaction.'),'kN'),
    ],
    [
        N(t('A triangular load goes from zero to 12 kN/m over 6 m. Resultant magnitude?'),36,'½×12×6=36 kN.',t('Area of triangle.'),'kN'),
        N(t('A triangular load rises linearly from zero to its peak over 6 m. How far from the heavy end is its resultant?'),2,t('L/3=2 m from the heavy end.'),t('Centroid of a triangle.'),'m'),
        N(t('A 4 m cantilever has a 15 kN downward tip load. Fixed-end reaction moment magnitude?'),60,'15×4=60 kN·m.',t('Take moments at the fixed support.'),'kN·m'),
        N(t('An 8 m beam has a pin at A on the left and a roller at B on the right. Only the first 4 m from A carry a downward load of 6 kN/m. Find the upward force at B.'),6,t('Resultant 24 kN at x=2; RB=24×2/8=6 kN.'),t('First replace the UDL.'),'kN'),
        N(t('An 8 m simple span carries 6 kN/m over the leftmost 4 m. The right reaction is 6 kN. Find the left reaction.'),18,'RA=24−6=18 kN.',t('Vertical equilibrium.'),'kN'),
        N(t('The beam extends past roller B. From pin A, the roller is 6 m away and the 200 kN downward load is 9 m away. Find the signed vertical reaction at A. Take up as positive.'),-100,'RB×6=200×9, RB=300. RA=200−300=−100 kN.',t('Upward positive.'),'kN'),
    ],
    [
        Q(t('A downward point load changes a shear diagram how?'),[t('Vertical drop'),t('Parabolic jump'),t('Continuous rising line')],0,t('A concentrated downward force creates an abrupt downward jump.')),
        Q(t('Under uniform downward load, M is…'),[t('Linear'),t('Quadratic'),t('Constant')],1,t('V varies linearly; integrating it produces quadratic moment.')),
        Q(t('On a smooth part of the bending moment diagram, where can the moment change from rising to falling or vice versa?'),['V=0',t('M=0 only'),t('Every support only')],0,t('dM/dx=V; also check discontinuities and boundary points.')),
        Q(t('At an unloaded free end with no applied couple, V and M are…'),[t('Both zero'),t('Both maximum'),t('Always opposite')],0,t('No resultant internal shear or bending moment at the free end.')),
        N(t('Constant shear +8 kN over 2.5 m. Change in M?'),20,localizedEquation('ΔM=8×2.5=20 kN·m.'),t('Area under V.'),'kN·m'),
    ],
    [
        Q(t('What is permanent deformation after unloading called?'),[t('Elastic'),t('Plastic'),t('Resonant')],1,t('Plastic deformation remains after unloading.')),
        Q(t('A sharp notch can create…'),[t('Stress concentration'),t('Constant stress everywhere'),t('A zero force reaction')],0,t('Abrupt geometry can amplify local stress.')),
        N(t('The steel’s yield strength fᵧ is 250 MPa. In this exercise, the allowable stress fₐ is 60% of that strength. Find fₐ in MPa.'),150,localizedEquation('0.60×250=150 MPa.'),t('Multiply by the specified factor.'),'MPa'),
        N(t('This steel has a yield strength of 350 MPa. For this exercise, use 60% of that strength as the allowable stress. What is that stress in MPa?'),210,localizedEquation('0.60×350=210 MPa.'),t('Use the stated yield strength.'),'MPa'),
        N(t('A 45 kN axial force and 150 MPa allowable stress. Minimum area?'),300,localizedEquation('45,000/150=300 mm².'),'A=P/fa.','mm²'),
        N(t('For a rectangular section b=50 mm, h=100 mm, calculate Sx.'),50*100**2/6,localizedEquation('S=bh²/6=83,333.33 mm³.'),t('Cube is for I; square is for S.'),'mm³'),
        N(t('M=60 kN·m and S=400,000 mm³. Maximum bending stress?'),150,localizedEquation('60×10⁶/400,000=150 MPa.'),'M/S.','MPa'),
        Q(t('In simple positive sagging bending, the top of a homogeneous beam is generally…'),[t('In compression'),t('In tension'),t('Unstressed everywhere')],0,t('Sagging shortens the top fibres and lengthens lower fibres.')),
    ],
    [
        N(t('A rectangle b=100 mm, h=200 mm. Find Ix in millions of mm⁴.'),100*200**3/12/1e6,localizedEquation('100×200³/12=66.667×10⁶ mm⁴.'),t('Depth is cubed.'),'10⁶ mm⁴'),
        N(t('A T-section has a 100×20 mm flange over a centered 20×80 mm web. Centroid measured from bottom?'),(2000*90+1600*40)/3600,localizedEquation('(2000×90+1600×40)/3600=67.78 mm.'),t('Use non-overlapping rectangles.'),'mm'),
        N(t('A T has a 100×20 mm flange over a centred 20×80 mm web. Its centroid is 67.778 mm above the bottom. Find Iₓ in millions of mm⁴.'),(100*20**3/12+2000*(90-67.7777777778)**2+20*80**3/12+1600*(40-67.7777777778)**2)/1e6,t('Add I + Ad² for the flange and web. The result is about 3.142×10⁶ mm⁴. Keep full precision until the final answer.'),t('Use each distance to combined neutral axis.'),'10⁶ mm⁴'),
        Q(t('A T section bends about its horizontal centroidal axis. Which value of c gives the larger absolute bending stress?'),[t('Distance to farther extreme fibre'),t('Distance to centroid from any origin'),t('Half the width')],0,t('S=I/c; the larger c produces the smaller section modulus.')),
    ],
    [
        N(t('A pin-ended square steel post measures 60 × 60 mm. Find centroidal I in mm⁴.'),60**4/12,localizedEquation('I = 60⁴/12 = 1,080,000 mm⁴.'),t('Rectangle formula.'),'mm⁴'),
        N(t('A pin-ended column has I = 1.08×10⁶ mm⁴, L = 4,500 mm and E = 200,000 MPa. Find its Euler load.'),Math.PI**2*200000*(60**4/12)/4500**2/1000,localizedEquation('Pcr = π²EI/L² = 105.276 kN.'),t('Use consistent N and mm.'),'kN'),
        N(t('A 2 m cantilever has a 1.5 kN tip load, E = 12,000,000 kPa and I = 0.00004 m⁴. Find tip deflection in mm.'),1.5*2**3/(3*12000000*.00004)*1000,localizedEquation('PL³/(3EI) = 0.00833 m = 8.33 mm.'),t('Solve in metres, then multiply by 1000.'),'mm'),
        Q(t('A fixed-free ideal column has effective length factor K…'),[localizedEquation('0.5'),'1','2'],2,t('A cantilever has effective length 2L.')),
        N(t('I=400,000 mm⁴ and A=1000 mm². Radius of gyration?'),20,'√(400000/1000)=20 mm.','r=√(I/A).','mm'),
        N(t('Pin-ended member L=3000 mm and r=20 mm. Slenderness ratio?'),150,'KL/r=1×3000/20=150.',t('Dimensionless.'),''),
    ],
    [
        Q(t('Which joint is best to start solving?'),[t('A joint with four unknown member forces'),t('A joint with at most two independent unknowns'),t('An arbitrary unsupported joint')],1,t('Two planar force equations are available per joint.')),
        Q(t('Two non-collinear members meet at an unloaded joint with no support. Their forces are…'),[t('Both zero'),t('Both compression'),t('Equal nonzero tension')],0,t('Independent directional equilibrium requires each to be zero.')),
        Q(t('Three members meet at an unloaded joint; two are collinear. The third is…'),[t('Zero-force'),t('Always in tension'),t('Always in compression')],0,t('There is no other force balancing its perpendicular component.')),
        N(t('A rightward force of 72 kN acts 8 m above a truss pin. A roller is 6 m to the right of the pin. Find the roller reaction, up positive.'),96,t('Taking moments about the pin gives Rᵦ × 6 − 72 × 8 = 0. Rᵦ = 96 kN.'),t('Use the full truss FBD.'),'kN'),
        N(t('A truss carries a horizontal load only. Its roller reacts upward by 96 kN. What is the signed vertical reaction at its pin?'),-96,t('ΣFᵧ = 0 gives Rₐ + 96 = 0. Rₐ = −96 kN, so the pin must resist uplift.'),t('No external vertical load.'),'kN'),
    ],
    [
        Q(t('What distinguishes Ix from Sx?'),[t('Ix governs stiffness, Sx relates bending moment to extreme-fibre stress'),t('They have the same units'),t('Ix directly equals allowable stress')],0,'Ix in mm⁴, Sx in mm³.'),
        N(t('A simply supported 8 m span has 6 kN/m throughout. Maximum moment?'),48,'wL²/8=6×64/8=48 kN·m.',t('Symmetric uniform load.'),'kN·m'),
        N(t('The governing beam moment is 48 kN·m and allowable bending stress is 150 MPa. Find the minimum elastic section modulus.'),320000,localizedEquation('48×10⁶/150=320,000 mm³.'),t('Convert moment.'),'mm³'),
    ]
];
extra.forEach((a,i)=>units[i].q.push(...a));

// Selected CISC W-shape properties, verified against the metric table.
const steel = [
    ['W360×72', 72, 201, 1150],
    ['W360×79', 79, 226, 1280],
    ['W360×91', 91, 267, 1510],
    ['W360×101', 101, 301, 1690],
];
const steelSmall = [
    ['W200×27', 27, 25.8, 249],
    ['W200×31', 31, 31.4, 299],
    ['W200×36', 36, 34.4, 342],
    ['W200×42', 42, 40.9, 399],
    ['W200×46', 46, 45.4, 448],
];
const steelProfiles = [
    ['W200×15', 15, 12.7, 127], ['W200×19', 19, 16.6, 163],
    ['W200×22', 22, 20.0, 194], ...steelSmall,
    ['W200×52', 52, 52.7, 512], ['W200×59', 59, 61.1, 582],
    ['W250×25', 25, 34.2, 266], ['W250×28', 28, 40.0, 307],
    ['W250×33', 33, 48.9, 379], ['W250×39', 39, 60.1, 459],
    ['W360×64', 64, 178, 1030], ...steel,
    ['W360×110', 110, 331, 1840], ['W360×122', 122, 365, 2010],
];

function steelQ(kind, requirement, rows = steel) {
    const column = kind === 'I' ? 2 : 3;
    const property = kind === 'I' ? 'Iₓ' : 'Sₓ';
    const unit = kind === 'I' ? '10⁶ mm⁴' : '10³ mm³';
    const answer = rows.reduce((best, row, i) => {
        if (row[column] < requirement) return best;
        return best === -1 || row[1] < rows[best][1] ? i : best;
    }, -1);
    const required = fmt(requirement);
    return {
        type: 'steel', kind, rows, answer: answer === -1 ? rows.length : answer,
        prompt: t`Select the lightest listed section with ${property} ≥ ${required} × ${unit}.`,
        opts: [...rows.map(row => row[0]), t('None meets the requirement')],
        hint: t`Eliminate rows that fail the ${property} threshold, then compare mass per metre.`,
        explain: answer === -1
            ? t`Every listed candidate has ${property} below ${required} × ${unit}.`
            : t`${rows[answer][0]} is ${rows[answer][1]} kg/m and has ${property} = ${rows[answer][column]} × ${unit}. It is the lightest row that meets the stated requirement.`,
    };
}
units[6].q.push(steelQ('S', 320, steelSmall), steelQ('I', 215), steelQ('S', 1400));
units[6].q.push(sectionCentroidPractice('x', sectionPracticeSymmetric, 'i'),
    sectionCentroidPractice('x', sectionPracticeAngle, 'angle'), sectionCentroidPractice('y', sectionPracticeAngle, 'angle'));
units[5].q.push(steelQ('S', 1200));


const beams=[{L:8,a:0,b:8,points:[{x:2,p:24}],udls:[{s:4,e:8,w:8}]},{L:10,a:0,b:7,points:[{x:10,p:18}],udls:[{s:0,e:7,w:6}]},{L:8,a:0,b:8,points:[],udls:[{s:0,e:8,w:6}]}];
const reviewBeam = { L: 6, a: 0, b: 6, points: [{ x: 2, p: 15 }], udls: [{ s: 2, e: 5, w: 4 }] };

units[3].q.push(...beamQs(reviewBeam).slice(0,2));units[4].q.push(...beamQs(beams[2]).slice(2),...beamQs(beams[1]).slice(2));
const positiveShearPatch = uniformShearSegment(10, 12, 13, 4);
units[4].q.push(
    shearTriangleQuestion(uniformShearSegment(2, 9, 21, 7)),
    { ...Q(t('Does shear reach zero within the highlighted loaded segment?'),
        [t('Yes, partway through the segment'), t('No, shear stays positive throughout the segment'), t('Yes, exactly at the right end')], 1,
        t('The segment is 2 m long. Shear falls by (4 kN/m) × (2 m) = 8 kN, leaving +5 kN at the end. The computed zero would be 3.25 m from the start, beyond the segment, so use the actual shear shape here.'),
        t('Compare the distance needed to reach zero with the length over which this slope applies.')),
        setup: shearSegmentSetup(positiveShearPatch), shearSegment: positiveShearPatch, method: 'zeroShear' },
);

const memberSign = t('For member forces, give a positive number in tension (pulling) or a negative number in compression (pushing).');
const trussQs = [
    {...N(t('Find vertical reaction at B.'),20,t('Symmetry implies RA=RB=20 kN.'),t('Start with whole truss.'),'kN'),fig:'truss'},
    {...N(t('At joint C, calculate signed force in AC. Positive tension; negative compression.'),-40/(2*Math.sin(Math.PI/4)),t('2Fsin45°=−40, hence F=−28.284 kN (compression).'),t('Assume forces pull away from C.'),'kN'),fig:'truss'},
    {...N(t('Find signed force in bottom chord AB, positive for tension.'),20,t('At A, compressed AC pushes left by 20 kN. AB pulls right by 20 kN.'),t('Horizontal equilibrium at A.'),'kN'),fig:'truss'},
    {...Q(t('Which classification is correct?'),[t('AC and BC compression; AB tension'),t('AC and BC tension; AB compression'),t('All members in tension')],0,t('The diagonals push upward at C; the bottom chord ties supports together.')),fig:'truss'},
].map((question, i) => i === 1 || i === 2 ? { ...question, setup: memberSign } : question);
units[8].q.push(...trussQs);


const practiceTrussLoad = 75;
const latqs = practiceTrussQuestions(practiceTrussLoad);

function practiceTrussQuestions(load) {
    const vertical = 2 * load, diagonal = -load * Math.SQRT2;
    const negative = numberText(diagonal);
    return [
        N(t('Find the signed horizontal reaction at A (right positive).'), -load, `ΣFₓ = Aₓ + ${load} kN = 0. Aₓ = −${load} kN.`, t('Only the pin can resist horizontal load.'), 'kN'),
        N(t('Calculate the signed vertical reaction at B (up positive).'), vertical,
            `ΣMₐ = (5 m)Bᵧ − (${load} kN)(10 m) = 0. Bᵧ = +${vertical} kN.`, t('Take moments around A.'), 'kN'),
        N(t('Calculate signed vertical reaction at A (up positive).'), -vertical, `ΣFᵧ = Aᵧ + ${vertical} kN = 0. Aᵧ = −${vertical} kN.`, t('No external vertical load.'), 'kN'),
        N(t('Start at E. Calculate signed member ED (tension positive).'), diagonal,
            `ΣFₓ = ${load} kN + ED cos 45° = 0. ED ≈ ${negative} kN.`, t('Assume ED pulls down/right from E.'), 'kN'),
        N(t`At joint E, ED is ${negative} kN. Find the signed force in CE.`, load,
            `ΣFᵧ = ${load} kN − CE = 0. CE = +${load} kN.`, t('Vertical equilibrium at E.'), 'kN'),
        N(t`At joint D, ED is ${negative} kN. Find the signed force in CD.`, load, `ΣFₓ = ${load} kN − CD = 0. CD = +${load} kN.`, t('Use horizontal equilibrium.'), 'kN'),
        N(t`At joint D, ED is ${negative} kN and CD is +${load} kN. Find the signed force in BD.`, -load, `ΣFᵧ = −${load} kN − BD = 0. BD = −${load} kN.`, t('Vertical equilibrium.'), 'kN'),
        N(t`At pin A, the reactions are Aₓ = −${load} kN and Aᵧ = −${vertical} kN. Find the signed force in AC.`, vertical,
            `ΣFᵧ = −${vertical} kN + AC = 0. AC = +${vertical} kN.`, 'ΣFᵧ = 0.', 'kN'),
        N(t`The horizontal reaction at A is −${load} kN. Find the signed force in AB.`, load,
            `ΣFₓ = −${load} kN + AB = 0. AB = +${load} kN.`, 'ΣFₓ = 0.', 'kN'),
        N(t`At roller B, Bᵧ is +${vertical} kN, AB is +${load} kN, and BD is −${load} kN. Find the signed force in BC.`, diagonal,
            `ΣFₓ = −${load} kN − BC cos 45° = 0. BC ≈ ${negative} kN.`, t('Check both horizontal and vertical equations.'), 'kN'),
        Q(t('Which members are in compression?'), [t('ED, BD and BC'), t('AC, CD and CE'), t('AB, AC and CE')], 0,
            t('The three negative forces ED, BD and BC indicate compression; other members here are in tension.')),
    ].map((question, i) => ({ ...question, fig: 'lateral', ...(i >= 3 && i <= 9 ? { setup: memberSign } : {}) }));
}
units[8].q.push(...latqs.slice(0,5));units[9].q.push(...latqs.slice(5));
