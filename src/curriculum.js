// Existing question order is preserved for saved completion and mistake records.

const Q = (prompt, opts, answer, explain, hint = '') => ({ prompt, opts, answer, explain, hint, type: 'choice' });
const N = (prompt, answer, explain, hint = '', unit = '') => ({ prompt, answer, explain, hint, unit, type: 'number' });
const center={L:6,a:0,b:6,points:[{x:3,p:12}],udls:[]};

const units = [
    {
        title: 'Loads on structures',
        date: 'Foundations',
        intro: 'Loads are actions on a structure. A load path carries them through structural elements to the ground.',
        q: [
            Q('Which is typically a dead load?',['Concrete slab','People in a classroom','Snow on a roof'],0,'The permanent slab contributes its own weight.'),
            Q('What ultimately receives the building’s gravity loads?',['The facade','The ground','The ceiling'],1,'Loads must travel through a continuous path to the ground.'),
            N('A floor has a uniform load of 4 kN/m² over 20 m². Total load in kN?',80,'4 × 20 = 80 kN.','Multiply load intensity by area.','kN'),
        ],
    },
    {
        title: 'Static fundamentals & forces',
        date: 'Sep 17 · Quiz 1',
        intro: 'Forces are vectors. Resolve them into perpendicular components using SOH CAH TOA. If the angle is measured from +x, Fx = F cos θ and Fy = F sin θ.',
        q: [
            Q('Which ratio equals sine?',['Adjacent / hypotenuse','Opposite / hypotenuse','Opposite / adjacent'],1,'SOH: sine = opposite / hypotenuse.'),
            N('A 10 kN force acts at 30° above +x. Find Fy.',5,'10 sin 30° = 5 kN.','The vertical component is opposite the angle.','kN'),
            N('Find the magnitude of a resultant with components 3 and 4 kN.',5,'√(3² + 4²) = 5 kN.','Use Pythagoras.','kN'),
        ],
    },
    {
        title: 'Equilibrium & free-body diagrams',
        date: 'Sep 24 · Quiz 2',
        intro: 'Isolate the body, replace supports with reactions, and show all external loads. In planar static equilibrium, ΣFx = ΣFy = ΣM = 0.',
        q: [
            Q('Which reactions does an ideal planar pin provide?',['Vertical only','Horizontal and vertical','Horizontal, vertical and moment'],1,'A pin allows rotation but prevents translation.'),
            Q('Which belongs on an isolated beam free-body diagram?',['Only applied loads','Applied loads and support reactions','Only internal stresses'],1,'Show all external forces and moments.'),
            N('A 12 kN downward force is balanced by one vertical reaction. Magnitude?',12,'ΣFy = 0 gives an upward 12 kN reaction.','Upward balances downward.','kN'),
        ],
    },
    {
        title: 'Moments & reaction forces',
        date: 'Oct 1 · Quiz 3',
        intro: 'A moment is a force times its perpendicular lever arm. Taking moments about a support removes unknown reactions at that point from the moment equation.',
        q: [
            N('A 6 kN force acts perpendicular to a 2 m lever. Moment magnitude?',12,'6 × 2 = 12 kN·m.','Force times perpendicular distance.','kN·m'),
            N('A 6 m simply supported beam has a 12 kN point load 2 m from A. Find vertical reaction B.',4,'Taking moments about A: B × 6 = 12 × 2, so B = 4 kN.','Take moments about A.','kN'),
            N('On a 6 m simple span a 12 kN downward load acts 2 m from A. Given Rᵦ = 4 kN, find Rₐ.',8,'A + 4 − 12 = 0, giving A = 8 kN.','Use vertical equilibrium.','kN'),
        ],
    },
    {
        title: 'Shear & moment diagrams',
        date: 'Oct 8 · Quiz 4',
        intro: 'Shear describes internal transverse force; bending moment describes internal rotational effect. With the convention used here, dM/dx = V. A point load changes shear abruptly.',
        q: [
            Q('Between point loads with no distributed load, shear is…',['Constant','Parabolic','Always zero'],0,'No distributed load means no change in shear.'),
            graphQuestion(center, 'V'),
            graphQuestion(center, 'M'),
        ],
    },
    {
        title: 'Stress, strain & material capacity',
        date: 'Oct 15 · Quiz 5',
        intro: 'Stress is force per area; strain is relative deformation. The initial slope of an idealized stress–strain curve is elastic modulus E.',
        q: [
            N('A 20,000 N axial force acts on 100 mm². Stress in MPa?',200,'20,000 / 100 = 200 N/mm² = 200 MPa.','Divide force by area.','MPa'),
            {type:'stress',prompt:'Select the approximate yield point on this idealized ductile steel stress–strain curve.',answer:1,explain:'Yield marks the onset of significant plastic deformation. The plotted curve is schematic.',hint:'Look near the end of the initial elastic rise.'},
            Q('What does the initial stress–strain slope represent?',['Density','Elastic modulus','Ultimate strength'],1,'Elastic modulus describes stiffness in the linear elastic range.'),
        ],
    },
    {
        title: 'Centroids, section properties & member selection',
        date: 'Oct 22 · Quiz 6',
        intro: 'The centroid is an area-weighted location. The second moment of area describes how area is distributed about an axis, influencing bending stiffness.',
        q: [
            N('A rectangle is 20 mm wide and 30 mm deep. Find centroidal Ix in mm⁴.',45000,'20 × 30³ / 12 = 45,000 mm⁴.','Cube the depth, not the width.','mm⁴'),
            {type:'table',prompt:'Required Ix ≥ 80 × 10⁶ mm⁴. Select the lightest illustrative section satisfying this criterion alone.',opts:['A','B','C'],answer:1,explain:'B is the lightest candidate meeting the stated inertia. Real selection also requires other strength, stability and serviceability checks.',hint:'Eliminate insufficient Ix, then compare mass.'},
            N('Two areas of 10 and 30 mm² have centroid heights 0 and 20 mm. Combined centroid height?',15,'(10×0 + 30×20)/40 = 15 mm.','Use an area-weighted average.','mm'),
        ],
    },
    {
        title: 'Buckling',
        date: 'Oct 29 · Quiz 7',
        intro: 'Slender compression members can become unstable. Ideal Euler buckling load Pcr = π²EI/(KL)².',
        q: [
            Q('If effective length doubles, ideal Euler load becomes…',['Twice as large','One half','One quarter'],2,'The effective length is squared in the denominator.'),
            Q('Which member is generally more susceptible to buckling, all else equal?',['Long slender column','Short stocky column'],0,'Slenderness increases instability risk.'),
            Q('Which section property appears in Euler’s formula?',['Second moment of area','Volume','Mass'],0,'EI governs flexural stiffness.'),
        ],
    },
    {
        title: 'Truss analysis',
        date: 'Nov 19 · Quiz 8',
        intro: 'Ideal pin-jointed truss members carry axial tension or compression. Start with whole-truss reactions, then isolate joints or sections.',
        q: [
            Q('Ideal truss members primarily carry…',['Axial tension or compression','Bending only','Torsion only'],0,'Ideal pin-jointed members are two-force members.'),
            N('At an isolated joint, a member at 30° must supply 5 kN upward. Find its axial force magnitude.',10,'F sin 30° = 5, giving F = 10 kN.','Resolve the member force vertically.','kN'),
            Q('You assumed tension and calculated −8 kN. What is the actual state?',['8 kN tension','8 kN compression','Zero force'],1,'A negative result reverses the assumed direction.'),
        ],
    },
    {
        title: 'Cumulative course review',
        date: 'Nov 26 · Quiz 9',
        intro: 'Integrate load paths, equilibrium, section properties and truss behavior. Start by identifying the structural model, then choose equations.',
        q: [
            Q('Before solving a truss joint, what is often useful to determine?',['Support reactions','Paint colour','Elastic strain in every member'],0,'Whole-structure equilibrium provides the external reactions.'),
            N('A symmetric simply supported truss carries a central 24 kN vertical load. Each vertical reaction?',12,'Symmetry and vertical equilibrium give 12 kN each.','Divide the central load equally.','kN'),
        ],
    }
];

const adds = [
    [
        N('A roof load is 2.5 kN/m² on 16 m². Find the total load.',40,'2.5×16 = 40 kN.','Use tributary area.','kN'),
        Q('Which load acts horizontally on a vertical facade?',['Self-weight of slab','Wind pressure normal to the facade','Vertical occupancy load'],1,'Wind pressure can act laterally on a facade.'),
    ],
    [
        N('A 13 kN resultant has horizontal component 5 kN. Find the positive vertical component.',12,'√(13²−5²) = 12 kN.','Use the right triangle.','kN'),
        N('Convert 2.4 kN to N.',2400,'1 kN = 1000 N.','Multiply by 1000.','N'),
        N('A 20 kN force points 60° above positive x. Find Fx.',10,'20 cos 60° = 10 kN.','Adjacent to the angle.','kN'),
        Q('Which is an appropriate method for a non-right triangle with two known sides and their included angle?',['SOH CAH TOA alone','Cosine law','Sum of horizontal forces alone'],1,'Cosine law relates two sides and their included angle to the third side.'),
    ],
    [
        Q('How many planar degrees of freedom does a free rigid body have?',['2','3','6'],1,'There are two translations and one rotation.'),
        Q('An assumed upward reaction solves to −5 kN. What does this mean?',['5 kN downward','5 kN upward','No reaction'],0,'The sign reverses the assumed direction.'),
        {type:'fbd',prompt:'For the beam with a pin at A, horizontal roller at B and downward point load, select all support reactions to show on its free-body diagram.',opts:['Ax: horizontal at A','Ay: vertical at A','By: vertical at B','MA: moment at A','Bx: horizontal at B'],answer:[0,1,2],explain:'Pin A restrains both translations; roller B on a horizontal surface restrains vertical translation. Neither resists a moment.',hint:'Which translations and rotations does each support restrain?'},
    ],
    [
        N('An 8 m simple beam carries a uniform 3 kN/m load over its entire span. Find the equivalent resultant.',24,'3×8 = 24 kN at the midpoint.','Intensity × length.','kN'),
        N('An 8 m simple span carries a downward 3 kN/m load along its full length. Find the upward reaction at B.',12,'Taking moments about A: RB×8 = 24×4, so RB=12 kN.','Use the equivalent load at x=4 m.','kN'),
        N('A 10 kN force has a 3 m perpendicular lever arm about the pivot. Find its moment magnitude.',30,'10×3=30 kN·m.','Perpendicular lever arm.','kN·m'),
    ],
    [
        Q('For a uniformly distributed downward load, what shape does the bending moment diagram take?',['Constant','Linear','Quadratic parabola'],2,'Constant distributed load → linear shear → quadratic moment.'),
        N('A 6 m simple beam has a central 12 kN downward load. What is the maximum absolute shear?',6,'Both reactions are 6 kN; the shear magnitude is 6 kN on either side.','Use symmetry.','kN'),
        N('Find the maximum positive moment on a 6 m simple span with a 12 kN downward midpoint load.',18,'6 × 3 = 18 kN·m.','Find area under positive shear.','kN·m'),
    ],
    [
        N('A bar 400 mm long elongates by 0.8 mm. Find strain as a decimal.',.002,'0.8/400 = 0.002.','Divide extension by original length.',''),
        {type:'stress',prompt:'Identify the ultimate tensile strength on this idealized steel stress–strain curve.',answer:2,explain:'The ultimate tensile stress is the maximum engineering stress on the curve.',hint:'Find the highest stress rather than the largest strain.'},
        {type:'stress',prompt:'Identify fracture on the idealized stress–strain curve.',answer:3,explain:'Fracture occurs at the termination of the curve.',hint:'Look for the end of the test.'},
    ],
    [
        N('A section has Iₓₓ = 45×10⁶ mm⁴ and c = 150 mm. Calculate elastic section modulus S in mm³.',300000,'S=I/c = 45,000,000/150=300,000 mm³.','Divide by distance to extreme fibre.','mm³'),
        N('A beam has Mmax = 60 kN·m and allowable bending stress 150 MPa. Find required S in mm³.',400000,'60×10⁶ N·mm / 150 N/mm² = 400,000 mm³.','Convert kN·m to N·mm.','mm³'),
        {type:'table',tableKind:'S',prompt:'Select the lightest illustrative beam with Sₓ ≥ 400×10³ mm³, considering only this sizing criterion.',opts:['A','B','C'],answer:1,explain:'B meets the required section modulus with the lowest mass among qualifying options. Real selection requires checks beyond bending stress.',hint:'Compare S first, then mass.'},
        N('A component has area 200 mm², local Iₓₓ=2,000 mm⁴, and centroid 10 mm from the combined neutral axis. Find its contribution to Iₓₓ.',22000,'I = Ic+Ad² = 2,000 + 200×100 = 22,000 mm⁴.','Use the parallel-axis theorem.','mm⁴'),
    ],
    [
        Q('What happens to ideal Euler buckling capacity if E doubles, with I and effective length unchanged?',['Doubles','Halves','Stays unchanged'],0,'Pcr is directly proportional to E.'),
        Q('What is the primary loading associated with column buckling?',['Axial compression','Pure tension','Unloaded rotation'],0,'A slender member under compression may become unstable.'),
    ],
    [
        N('A symmetric triangular truss has a 20 kN downward load at its apex and both inclined members at 45° to horizontal. Each support vertical reaction?',10,'Symmetry: 20/2=10 kN.','Solve the whole truss first.','kN'),
        N('A symmetric triangular truss has a 20 kN downward apex load and 45° diagonals. Find the axial force magnitude in one diagonal.',14.1421356,'2 F sin 45° = 20, so F=14.14 kN; both are in compression.','Resolve vertical components; horizontal components cancel.','kN'),
        Q('A downward load acts at the apex of a triangular truss. Are its two downward-sloping diagonals in tension or compression?',['Tension','Compression','Zero force'],1,'They must push upward on the apex to balance the downward load.'),
        N('At the left support of a triangular truss, a diagonal slopes up to the right at 45° and carries 14.14 kN in compression. With no horizontal reaction, find the tension in the horizontal bottom chord.',10,'14.14 cos 45° ≈ 10 kN.','Use horizontal equilibrium.','kN'),
    ],
    [
        Q('Which step detects an inconsistent reaction solution?',['Check ΣFx, ΣFy and ΣM','Round reactions before solving','Ignore negative results'],0,'The full set of equilibrium equations checks the external force solution.'),
        N('A 5 m beam with 4 kN/m uniform load has maximum positive moment wL²/8. Calculate Mmax.',12.5,'4×25/8=12.5 kN·m.','Substitute with consistent units.','kN·m'),
    ]
];

units.forEach((unit, i) => unit.q.push(...adds[i]));

// Pre-course warm-up is separate to retain the original saved question IDs.
const foundation = {
    title: 'Pre-course math & trigonometry',
    date: 'Pre-course · Optional',
    intro: 'Refresh fractions, units, and triangle geometry before structures. A scientific calculator in degree mode is your friend.',
    q: [
        N('Convert 2.5 m to mm.',2500,'2.5×1000 = 2500 mm.','Multiply by 1000.','mm'),
        N('A triangle has opposite side 3 and adjacent side 4. Find tan θ.',.75,'tan θ = 3/4 = 0.75.','TOA.',''),
        N('What is the hypotenuse of a right triangle with legs 6 and 8?',10,'√(36+64)=10.','Pythagoras.',''),
        N('Convert 1 kN·m to N·mm.',1000000,'1000 N × 1000 mm = 1,000,000 N·mm.','Convert both units.','N·mm'),
        Q('What calculator angular mode should you use for 30°?',['Radians','Degrees','Gradians'],1,'The degree symbol means degrees.'),
        N('Calculate 1/2 ÷ 1/4.',2,'Keep, flip, multiply: 1/2 × 4/1 = 2.','Take the reciprocal of the divisor.',''),
    ],
};
units.push(foundation);

const extra = [
    [
        Q('Wind pulling away from cladding is called…',['Pressure','Suction','Dead load'],1,'Suction acts outward from the surface.'),
        Q('Which is a line load?',['A wall bearing continuously on a beam','A column bearing at one spot','Snow over a roof area'],0,'The wall distributes force along a length.'),
        N('Roof area load 3 kPa; tributary width 4 m. Line load?',12,'3 kN/m² × 4 m = 12 kN/m.','Multiply by tributary width.','kN/m'),
        N('A column receives 6 kPa from a 5 m × 4 m tributary area. Total force?',120,'6 × 20 = 120 kN.','Area × pressure.','kN'),
        Q('Which is the usual gravity load path?',['Deck → beam → girder → column → foundation','Deck → foundation → girder → column','Column → beam → deck → soil'],0,'Loads flow to supports and then the ground.'),
        Q('A periodic excitation near the natural frequency can cause…',['Resonance','Reduced mass','Zero acceleration'],0,'Dynamic response can be amplified.'),
        N('Natural frequency is 2 Hz. Period?',.5,'T=1/f=0.5 s.','Reciprocal of frequency.','s'),
        N('A stationary 300 kg mass hangs from one vertical cable. With g = 9.81 m/s², find cable tension.',2.943,'300×9.81/1000=2.943 kN. kg measures mass, not force.','Convert weight to force.','kN'),
    ],
    [
        N('A force of 125 kN acts at 30° above +x. Horizontal component?',125*Math.cos(Math.PI/6),'125 cos 30° = 108.25 kN.','Adjacent projection.','kN'),
        N('A 125 kN force points 30° above +x. Find its vertical component.',62.5,'125 sin 30° = 62.50 kN.','Opposite projection.','kN'),
        N('A 40 kN force points 30° above −x. Signed Fx?',-40*Math.cos(Math.PI/6),'Fx=−40cos30°=−34.64 kN.','Leftward is negative.','kN'),
        N('Two perpendicular forces +60 kN x and +80 kN y combine. Resultant magnitude?',100,'√(60²+80²)=100 kN.','Pythagoras.','kN'),
        N('Find the angle above +x of a vector with Fx=60 kN and Fy=80 kN.',Math.atan2(80,60)*180/Math.PI,'atan(80/60)=53.13°.','Use inverse tangent in degrees.','°'),
        Q('A force vector can slide along its line of action on an ideal rigid body without changing…',['Its external equilibrium effect','Local stress everywhere','Its magnitude and direction independently'],0,'Transmissibility preserves the external rigid-body effect, not necessarily local stresses.'),
    ],
    [
        Q('A fixed support in 2D develops which reactions?',['Ax and Ay only','Ax, Ay and a moment','Ay only'],1,'A fixed support restrains both translations and rotation.'),
        Q('A roller on an inclined frictionless surface reacts…',['Always vertically','Normal to the surface','Parallel to the surface'],1,'A frictionless roller restrains motion normal to its supporting surface.'),
        Q('Two vertical forces are equal and opposite but on different lines of action. What can remain?',['A couple moment','An unbalanced vertical resultant','No external effect'],0,'Their net force is zero, but they produce a couple.'),
        Q('Three planar reactions guarantee stability?',['Yes, always','No, geometry matters','Only for timber'],1,'Parallel or concurrent lines of action can leave a mechanism.'),
        N('A horizontal load of 15 kN acts rightward on a beam with a pin and a horizontal roller. Find the horizontal pin reaction, taking right as positive.',-15,'Only the pin provides a horizontal reaction. ΣFₓ = 0 gives Aₓ + 15 = 0, so Aₓ = −15 kN.','The roller cannot supply a horizontal reaction.','kN'),
    ],
    [
        N('A triangular load goes from zero to 12 kN/m over 6 m. Resultant magnitude?',36,'½×12×6=36 kN.','Area of triangle.','kN'),
        N('A triangular load rises linearly from zero to its peak over 6 m. How far from the heavy end is its resultant?',2,'L/3=2 m from the heavy end.','Centroid of a triangle.','m'),
        N('A 4 m cantilever has a 15 kN downward tip load. Fixed-end reaction moment magnitude?',60,'15×4=60 kN·m.','Take moments at the fixed support.','kN·m'),
        N('An 8 m simple beam carries 6 kN/m over the leftmost 4 m. Find RB.',6,'Resultant 24 kN at x=2; RB=24×2/8=6 kN.','First replace the UDL.','kN'),
        N('An 8 m simple span carries 6 kN/m over the leftmost 4 m. The right reaction is 6 kN. Find the left reaction.',18,'RA=24−6=18 kN.','Vertical equilibrium.','kN'),
        N('A pin at x=0 and roller at x=6 support a 200 kN downward load at x=9 (overhang). Find signed RA.',-100,'RB×6=200×9, RB=300. RA=200−300=−100 kN.','Upward positive.','kN'),
    ],
    [
        Q('A downward point load changes a shear diagram how?',['Vertical drop','Parabolic jump','Continuous rising line'],0,'A concentrated downward force creates an abrupt downward jump.'),
        Q('Under uniform downward load, M is…',['Linear','Quadratic','Constant'],1,'V varies linearly; integrating it produces quadratic moment.'),
        Q('Where do you look for an interior extremum of a smooth moment diagram?',['V=0','M=0 only','Every support only'],0,'dM/dx=V; also check discontinuities and boundary points.'),
        Q('At an unloaded free end with no applied couple, V and M are…',['Both zero','Both maximum','Always opposite'],0,'No resultant internal shear or bending moment at the free end.'),
        N('Constant shear +8 kN over 2.5 m. Change in M?',20,'ΔM=8×2.5=20 kN·m.','Area under V.','kN·m'),
    ],
    [
        Q('What is permanent deformation after unloading called?',['Elastic','Plastic','Resonant'],1,'Plastic deformation remains after unloading.'),
        Q('A sharp notch can create…',['Stress concentration','Constant stress everywhere','A zero force reaction'],0,'Abrupt geometry can amplify local stress.'),
        N('Steel fy=250 MPa, course allowable factor 0.60. Find fa.',150,'0.60×250=150 MPa.','Multiply by the specified factor.','MPa'),
        N('Steel fy=350 MPa, factor 0.60. Find fa.',210,'0.60×350=210 MPa.','Use the stated yield strength.','MPa'),
        N('A 45 kN axial force and 150 MPa allowable stress. Minimum area?',300,'45,000/150=300 mm².','A=P/fa.','mm²'),
        N('For a rectangular section b=50 mm, h=100 mm, calculate Sx.',50*100**2/6,'S=bh²/6=83,333.33 mm³.','Cube is for I; square is for S.','mm³'),
        N('M=60 kN·m and S=400,000 mm³. Maximum bending stress?',150,'60×10⁶/400,000=150 MPa.','M/S.','MPa'),
        Q('In simple positive sagging bending, the top of a homogeneous beam is generally…',['In compression','In tension','Unstressed everywhere'],0,'Sagging shortens the top fibres and lengthens lower fibres.'),
    ],
    [
        N('A rectangle b=100 mm, h=200 mm. Find Ix in millions of mm⁴.',100*200**3/12/1e6,'100×200³/12=66.667×10⁶ mm⁴.','Depth is cubed.','10⁶ mm⁴'),
        N('A T-section has a 100×20 mm flange over a centered 20×80 mm web. Centroid measured from bottom?',(2000*90+1600*40)/3600,'(2000×90+1600×40)/3600=67.78 mm.','Use non-overlapping rectangles.','mm'),
        N('A T has a 100×20 mm flange over a centred 20×80 mm web. Its centroid is 67.778 mm above the bottom. Find Iₓ in millions of mm⁴.',(100*20**3/12+2000*(90-67.7777777778)**2+20*80**3/12+1600*(40-67.7777777778)**2)/1e6,'Sum local I + Ad² for flange and web = 3.209×10⁶ mm⁴ (approximately).','Use each distance to combined neutral axis.','10⁶ mm⁴'),
        Q('For a non-symmetric section, which c governs maximum absolute bending stress?',['Distance to farther extreme fibre','Distance to centroid from any origin','Half the width'],0,'S=I/c; the larger c produces the smaller section modulus.'),
    ],
    [
        N('A pin-ended square steel post measures 60 × 60 mm. Find centroidal I in mm⁴.',60**4/12,'I = 60⁴/12 = 1,080,000 mm⁴.','Rectangle formula.','mm⁴'),
        N('A pin-ended column has I = 1.08×10⁶ mm⁴, L = 4,500 mm and E = 200,000 MPa. Find its Euler load.',Math.PI**2*200000*(60**4/12)/4500**2/1000,'Pcr = π²EI/L² = 105.276 kN.','Use consistent N and mm.','kN'),
        N('A 2 m cantilever has a 1.5 kN tip load, E = 12,000,000 kPa and I = 0.00004 m⁴. Find tip deflection in mm.',1.5*2**3/(3*12000000*.00004)*1000,'PL³/(3EI) = 0.00833 m = 8.33 mm.','Solve in metres, then multiply by 1000.','mm'),
        Q('A fixed-free ideal column has effective length factor K…',['0.5','1','2'],2,'A cantilever has effective length 2L.'),
        N('I=400,000 mm⁴ and A=1000 mm². Radius of gyration?',20,'√(400000/1000)=20 mm.','r=√(I/A).','mm'),
        N('Pin-ended member L=3000 mm and r=20 mm. Slenderness ratio?',150,'KL/r=1×3000/20=150.','Dimensionless.',''),
    ],
    [
        Q('Which joint is best to start solving?',['A joint with four unknown member forces','A joint with at most two independent unknowns','An arbitrary unsupported joint'],1,'Two planar force equations are available per joint.'),
        Q('Two non-collinear members meet at an unloaded joint with no support. Their forces are…',['Both zero','Both compression','Equal nonzero tension'],0,'Independent directional equilibrium requires each to be zero.'),
        Q('Three members meet at an unloaded joint; two are collinear. The third is…',['Zero-force','Always in tension','Always in compression'],0,'There is no other force balancing its perpendicular component.'),
        N('A rightward force of 72 kN acts 8 m above a truss pin. A roller is 6 m to the right of the pin. Find the roller reaction, up positive.',96,'Taking moments about the pin gives Rᵦ × 6 − 72 × 8 = 0. Rᵦ = 96 kN.','Use the full truss FBD.','kN'),
        N('A truss carries a horizontal load only. Its roller reacts upward by 96 kN. What is the signed vertical reaction at its pin?',-96,'ΣFᵧ = 0 gives Rₐ + 96 = 0. Rₐ = −96 kN, so the pin must resist uplift.','No external vertical load.','kN'),
    ],
    [
        Q('What distinguishes Ix from Sx?',['Ix governs stiffness, Sx relates bending moment to extreme-fibre stress','They have the same units','Ix directly equals allowable stress'],0,'Ix in mm⁴, Sx in mm³.'),
        N('A simply supported 8 m span has 6 kN/m throughout. Maximum moment?',48,'wL²/8=6×64/8=48 kN·m.','Symmetric uniform load.','kN·m'),
        N('The governing beam moment is 48 kN·m and allowable bending stress is 150 MPa. Find the minimum elastic section modulus.',320000,'48×10⁶/150=320,000 mm³.','Convert moment.','mm³'),
    ]
];
extra.forEach((a,i)=>units[i].q.push(...a));

const tq=units[6].q.find(q=>q.prompt.startsWith('A T has a 100×20 mm flange'));tq.explain='Σ(Ic+Ad²) = '+tq.answer.toFixed(3)+' ×10⁶ mm⁴. Use full precision until the final answer.';


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
        prompt: `Select the lightest listed section with ${property} ≥ ${required} × ${unit}.`,
        opts: [...rows.map(row => row[0]), 'None meets the requirement'],
        hint: `Eliminate rows that fail the ${property} threshold, then compare mass per metre.`,
        explain: answer === -1
            ? `Every listed candidate has ${property} below ${required} × ${unit}.`
            : `${rows[answer][0]} is ${rows[answer][1]} kg/m and has ${property} = ${rows[answer][column]} × ${unit}. It is the lightest row that meets the stated requirement.`,
    };
}
units[6].q.push(steelQ('S', 320, steelSmall), steelQ('I', 215), steelQ('S', 1400));
units[5].q.push(steelQ('S', 1200));


const beams=[{L:8,a:0,b:8,points:[{x:2,p:24}],udls:[{s:4,e:8,w:8}]},{L:10,a:0,b:7,points:[{x:10,p:18}],udls:[{s:0,e:7,w:6}]},{L:8,a:0,b:8,points:[],udls:[{s:0,e:8,w:6}]}];

units[3].q.push(...beamQs(beams[0]).slice(0,2));units[4].q.push(...beamQs(beams[2]).slice(2),...beamQs(beams[1]).slice(2));

const trussQs = [
    {...N('Find vertical reaction at B.',20,'Symmetry implies RA=RB=20 kN.','Start with whole truss.','kN'),fig:'truss'},
    {...N('At joint C, calculate signed force in AC. Positive tension; negative compression.',-40/(2*Math.sin(Math.PI/4)),'2Fsin45°=−40, hence F=−28.284 kN (compression).','Assume forces pull away from C.','kN'),fig:'truss'},
    {...N('Find signed force in bottom chord AB, positive for tension.',20,'At A, compressed AC pushes left by 20 kN. AB pulls right by 20 kN.','Horizontal equilibrium at A.','kN'),fig:'truss'},
    {...Q('Which classification is correct?',['AC and BC compression; AB tension','AC and BC tension; AB compression','All members in tension'],0,'The diagonals push upward at C; the bottom chord ties supports together.'),fig:'truss'},
];
units[8].q.push(...trussQs);


const latqs = [
    {...N('Find the signed horizontal reaction at A (right positive).',-90,'ΣFx=0: Ax+90=0, so Ax=−90 kN.','Only the pin can resist horizontal load.','kN'),fig:'lateral'},
    {...N('Calculate the signed vertical reaction at B (up positive).',180,'ΣMA=0: 5By−90×10=0, so By=180 kN.','Take moments around A.','kN'),fig:'lateral'},
    {...N('Calculate signed vertical reaction at A (up positive).',-180,'ΣFy=0: Ay+180=0. Negative means uplift restraint is needed.','No external vertical load.','kN'),fig:'lateral'},
    {...N('Start at E. Calculate signed member ED (tension positive).',-90*Math.SQRT2,'ΣFx=0: 90+ED cos45°=0. ED=−127.28 kN, compression.','Assume ED pulls down/right from E.','kN'),fig:'lateral'},
    {...N('At E, ED=−127.279 kN. Find signed CE (tension positive).',90,'ED produces an upward 90 kN component at E. CE must pull downward by 90 kN.','Vertical equilibrium at E.','kN'),fig:'lateral'},
    {...N('Move to joint D. ED=−127.279 kN. Find signed CD (tension positive).',90,'At D, ED pushes right and down by 90 kN each. CD must pull left by 90 kN.','Use horizontal equilibrium.','kN'),fig:'lateral'},
    {...N('At D, with ED=−127.279 kN and CD=+90 kN, find signed BD.',-90,'ED pushes down by 90 kN at D; BD must push up (compression). BD=−90 kN.','Vertical equilibrium.','kN'),fig:'lateral'},
    {...N('At joint A, Ax=−90 kN, Ay=−180 kN. Find signed member AC.',180,'AC must pull vertically up by 180 kN.','Use ΣFy=0.','kN'),fig:'lateral'},
    {...N('At joint A, Ax=−90 kN. Find signed member AB.',90,'AB pulls to the right by 90 kN.','Use ΣFx=0.','kN'),fig:'lateral'},
    {...N('At joint B, RB=+180 kN, AB=+90 kN and BD=−90 kN. Find signed BC.',-90*Math.SQRT2,'BC pushes down/right at B by 90 kN in each direction. BC=−127.28 kN.','Check both horizontal and vertical equations.','kN'),fig:'lateral'},
    {...Q('Which members are in compression?',['ED, BD and BC','AC, CD and CE','AB, AC and CE'],0,'The three negative forces ED, BD and BC indicate compression; other members here are in tension.'),fig:'lateral'},
];
units[8].q.push(...latqs.slice(0,5));units[9].q.push(...latqs.slice(5));
