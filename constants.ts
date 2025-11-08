

import { PhysicsSubject, ChemistrySubject, MathSubject, TopicStatus, ChapterProgress, MajorTopic, User, Chapter } from './types';

export const staticQuotes = [
    "The secret to getting ahead is getting started.",
    "The expert in anything was once a beginner.",
    "Believe you can and you're halfway there.",
    "Success is the sum of small efforts, repeated day in and day out.",
    "Don't watch the clock; do what it does. Keep going.",
    "The only way to do great work is to love what you do.",
    "It does not matter how slowly you go as long as you do not stop.",
    "The future belongs to those who believe in the beauty of their dreams.",
    "Strive for progress, not perfection.",
    "The harder you work for something, the greater you'll feel when you achieve it."
];

// --- Gamification Constants ---
export const achievementDefinitions: { id: string; name: string; description: string; icon: string; check: (user: User, context?: any) => boolean }[] = [
    // Streak Achievements
    { id: 'streak-3', name: 'Triple Threat', description: 'Maintain a 3-day study streak.', icon: '🥉', check: (user) => user.studyStreak >= 3 },
    { id: 'streak-7', name: 'Week Warrior', description: 'Maintain a 7-day study streak.', icon: '🥈', check: (user) => user.studyStreak >= 7 },
    { id: 'streak-30', name: 'Consistency King', description: 'Maintain a 30-day study streak.', icon: '👑', check: (user) => user.studyStreak >= 30 },
    // Time-based Achievements
    { id: 'early-bird', name: 'Early Bird', description: 'Wake up before 5 AM to start your day.', icon: '☀️', check: (user, context) => context?.type === 'WAKE_UP_UPDATE' && parseInt(context.wakeUpTime.split(':')[0]) < 5 },
    { id: 'night-owl', name: 'Night Owl', description: 'Complete a study session after 11 PM.', icon: '🦉', check: (user, context) => context?.type === 'COMPLETE_SLOT' && parseInt(context.slot.startTime.split(':')[0]) >= 23 },
    { id: 'marathon-studier', name: 'Marathon Studier', description: 'Study for more than 8 hours in a single day.', icon: '🏃‍♂️', check: (user, context) => context?.type === 'REVIEW_DAY' && context.dailyHours > 8 },
    { id: 'personal-best', name: 'Personal Best!', description: 'Set a new personal record for single-day study hours.', icon: '📈', check: (user, context) => context?.type === 'REVIEW_DAY' && context.isNewBest },
    { id: 'perfect-day', name: 'Perfect Day', description: 'Achieve 100% efficiency in a daily plan.', icon: '✅', check: (user, context) => context?.type === 'REVIEW_DAY' && context.efficiency === 100 },
    // Topic Completion Achievements
    { id: 'first-chapter', name: 'Off the Blocks', description: 'Complete your first chapter.', icon: '🎓', check: (user) => (user.topics.physics.chapters.filter(c => c.status === TopicStatus.Completed).length + user.topics.chemistry.sections.flatMap(s => s.chapters).filter(c => c.status === TopicStatus.Completed).length + user.topics.math.chapters.filter(c => c.status === TopicStatus.Completed).length) >= 1 },
    { id: 'physics-10', name: 'Physics Slayer', description: 'Complete 10 Physics chapters.', icon: '⚛️', check: (user) => user.topics.physics.chapters.filter(c => c.status === TopicStatus.Completed).length >= 10 },
    { id: 'chemistry-10', name: 'Chem Catalyst', description: 'Complete 10 Chemistry chapters.', icon: '🧪', check: (user) => user.topics.chemistry.sections.flatMap(s => s.chapters).filter(c => c.status === TopicStatus.Completed).length >= 10 },
    { id: 'math-10', name: 'Math Magician', description: 'Complete 10 Math chapters.', icon: '➗', check: (user) => user.topics.math.chapters.filter(c => c.status === TopicStatus.Completed).length >= 10 },
    // Test Achievements
    { id: 'test-5', name: 'Test Taker', description: 'Complete 5 mock tests.', icon: '📝', check: (user) => user.tests.length >= 5 },
    { id: 'test-20', name: 'Mock Test Beast', description: 'Complete 20 mock tests.', icon: ' Beast', check: (user) => user.tests.length >= 20 },
    { id: 'score-90-percent', name: 'High Scorer', description: 'Score over 90% in any test.', icon: '🎯', check: (user, context) => context?.type === 'ADD_TEST' && (context.test.marks.physics + context.test.marks.chemistry + context.test.marks.math - (context.test.negativeMarks.physics + context.test.negativeMarks.chemistry + context.test.negativeMarks.math)) / context.test.totalMarks >= 0.9 },
    { id: 'score-200-mains', name: 'Double Century!', description: 'Score over 200 marks in a JEE Mains test.', icon: '💯', check: (user, context) => { if (context?.type !== 'ADD_TEST' || context.test.type !== 'JEE Mains') return false; const score = (context.test.marks.physics + context.test.marks.chemistry + context.test.marks.math - (context.test.negativeMarks.physics + context.test.negativeMarks.chemistry + context.test.negativeMarks.math)); return score > 200; }},
    { id: 'score-170-advanced', name: 'Advanced Ace', description: 'Score over 170 marks in a JEE Advanced test.', icon: '🌟', check: (user, context) => { if (context?.type !== 'ADD_TEST' || context.test.type !== 'JEE Advanced') return false; const score = (context.test.marks.physics + context.test.marks.chemistry + context.test.marks.math - (context.test.negativeMarks.physics + context.test.negativeMarks.chemistry + context.test.negativeMarks.math)); return score > 170; }},
    { id: 'class-topper', name: 'Top of the Class', description: 'Achieve Rank 1 in any mock test.', icon: '🏆', check: (user, context) => context?.type === 'ADD_TEST' && context.test.classRank === 1 },
    // Question Achievements
    { id: 'questions-500', name: 'Question Quasher', description: 'Solve a total of 500 questions.', icon: '🔥', check: (user) => (user.dailyPlans.reduce((sum, p) => sum + (p.questionsSolved?.reduce((s, q) => s + q.count, 0) || 0), 0)) >= 500 },
    { id: 'questions-1000', name: 'Question Annihilator', description: 'Solve a total of 1000 questions.', icon: '💥', check: (user) => (user.dailyPlans.reduce((sum, p) => sum + (p.questionsSolved?.reduce((s, q) => s + q.count, 0) || 0), 0)) >= 1000 },
    { id: 'questions-1500', name: 'Question Conqueror', description: 'Solve a total of 1500 questions.', icon: '🚀', check: (user) => (user.dailyPlans.reduce((sum, p) => sum + (p.questionsSolved?.reduce((s, q) => s + q.count, 0) || 0), 0)) >= 1500 },
    { id: 'questions-2500', name: 'Question Juggernaut', description: 'Solve a total of 2500 questions.', icon: '💫', check: (user) => (user.dailyPlans.reduce((sum, p) => sum + (p.questionsSolved?.reduce((s, q) => s + q.count, 0) || 0), 0)) >= 2500 },
];


const defaultProgress: ChapterProgress = {
    level1: false,
    level2: false,
    mains: false,
    advanced: false,
    pyqs: false,
    pyqsCount: 0
};

const capitalize = (s: string) => {
    if (!s) return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
}

const createMajorTopics = (syllabus: string): MajorTopic[] => {
    if (!syllabus) return [];
    // Each string separated by a semicolon is a "Major Topic".
    return syllabus.split(';').map((majorTopicString, index) => {
        const trimmedMajorTopic = majorTopicString.trim();
        if (!trimmedMajorTopic) return null;

        const subtopicNames = trimmedMajorTopic.includes(',') 
            ? trimmedMajorTopic.split(',').map(s => capitalize(s.trim()))
            : [capitalize(trimmedMajorTopic)];

        return {
            name: `Part ${index + 1}`, // Simplified name
            subtopics: subtopicNames.filter(Boolean).map(name => ({
                name: name,
                status: TopicStatus.NotStarted,
                coachingStatus: TopicStatus.NotStarted
            }))
        };
    }).filter((topic): topic is MajorTopic => topic !== null);
};

const createChapters = (chaptersData: { [key: string]: string }): Chapter[] => {
    return Object.entries(chaptersData).map(([chapterName, syllabus]) => ({
        name: chapterName,
        status: TopicStatus.NotStarted,
        coachingStatus: TopicStatus.NotStarted,
        progress: { ...defaultProgress },
        majorTopics: createMajorTopics(syllabus)
    }));
};

const physicsData = {
    'Units and Measurements': 'Units of measurements, System of units, SI Units, fundamental and derived units, least count, significant figures, Errors in measurements; Dimensions of Physics quantities, dimensional analysis and its applications.',
    'Kinematics': 'The frame of reference, motion in a straight line, speed and velocity, uniform and non-uniform motion, average speed and instantaneous velocity, uniformly accelerated motion, velocity-time, position-time graph, relations for uniformly accelerated motion, relative velocity; Motion in a plane, projectile motion, uniform circular motion.',
    'Laws of Motion': "Force and inertia, Newton's first law of motion, momentum, Newton's second Law of motion, impulse, Newton's third Law of motion; Law of conservation of linear momentum and its applications, equilibrium of concurrent forces; Static and Kinetic friction, laws of friction, rolling friction; Dynamics of uniform circular motion, centripetal force and its applications: vehicle on a level circular road, vehicle on a banked road.",
    'Work, Energy and Power': 'Work done by a constant force and a variable force, kinetic and potential energies, work-energy theorem, power; The potential energy of a spring, conservation of mechanical energy, conservative and non-conservative forces, motion in a vertical circle; Elastic and inelastic collisions in one and two dimensions.',
    'Rotational Motion': 'Centre of mass of a two-particle system, centre of mass of a rigid body; Basic concepts of rotational motion, moment of a force, torque, angular momentum, conservation of angular momentum and its applications; The moment of inertia, the radius of gyration, values of moments of inertia for simple geometrical objects, parallel and perpendicular axes theorems and their applications; Equilibrium of rigid bodies, rigid body rotation and equations of rotational motion, comparison of linear and rotational motions.',
    'Gravitation': "The universal law of gravitation; Acceleration due to gravity and its variation with altitude and depth; Kepler's law of planetary motion; Gravitational potential energy, gravitational potential; Escape velocity, motion of a satellite, orbital velocity, time period and energy of satellite.",
    'Properties of Solids and Liquids': "Elastic behaviour, stress-strain relationship, Hooke's Law, Young's modulus, bulk modulus and modulus of rigidity; Pressure due to a fluid column, Pascal's law and its applications, effect of gravity on fluid pressure, viscosity, Stoke's law, terminal velocity, streamline and turbulent flow, critical velocity, Bernoulli's principle and its applications; Surface energy and surface tension, angle of contact, excess of pressure across a curved surface, application of surface tension: drops, bubbles and capillary rise.",
    'Thermodynamics': 'Heat, temperature, thermal expansion, specific heat capacity, calorimetry, change of state, latent heat; Heat transfer: conduction, convection and radiation; Thermal equilibrium and the concept of temperature, zeroth law of thermodynamics, heat, work and internal energy; The first law of thermodynamics, isothermal and adiabatic processes; The second law of thermodynamics: reversible and irreversible processes.',
    'Kinetic Theory of Gases': 'Equation of state of a perfect gas, work done on compressing a gas; kinetic theory of gases: assumptions, the concept of pressure, kinetic interpretation of temperature, RMS speed of gas molecules, degrees of freedom, law of equipartition of energy and applications to specific heat capacities of gases, mean free path, Avogadro\'s number.',
    'Oscillations and Waves': 'Oscillations and periodic motion: time period, frequency, displacement as a function of time, periodic functions; Simple harmonic motion (S.H.M.) and its equation, phase, oscillations of a spring: restoring force and force constant, energy in S.H.M.: kinetic and potential energies, simple pendulum: derivation of expression for its time period; Wave motion, longitudinal and transverse waves, speed of the travelling wave, displacement relation for a progressive wave; principle of superposition of waves, reflection of waves, standing waves in strings and organ pipes, fundamental mode and harmonics, beats.',
    'Electrostatics': "Electric charges: conservation of charge, Coulomb's law forces between two point charges, forces between multiple charges, superposition principle and continuous charge distribution; Electric field: electric field due to a point charge, electric field lines, electric dipole, electric field due to a dipole, torque on a dipole in a uniform electric field; Electric flux, Gauss's law and its applications to find field due to infinitely long uniformly charged straight wire, uniformly charged infinite plane sheet and uniformly charged thin spherical shell; Electric potential and its calculation for a point charge, electric dipole and system of charges, potential difference, equipotential surfaces, electrical potential energy of a system of two point charges and of electric dipole in an electrostatic field; Conductors and insulators, dielectrics and electric polarization, capacitors and capacitance, the combination of capacitors in series and parallel and capacitance of a parallel plate capacitor with and without dielectric medium between the plates, energy stored in a capacitor.",
    'Current Electricity': "Electric current: drift velocity, mobility and their relation with electric current, Ohm's law, electrical resistance, I-V characteristics of Ohmic and non-ohmic conductors, electrical energy and power, electrical resistivity and conductivity, series and parallel combinations of resistors, temperature dependence of resistance; Internal resistance, potential difference and emf of a cell, a combination of cells in series and parallel; Kirchhoff's laws and their applications, Wheatstone bridge, Metre Bridge.",
    'Magnetic Effects of Current and Magnetism': "Biot - Savart law and its application to the current carrying circular loop; Ampere's law and its applications to infinitely long current carrying straight wire and solenoid; Force on a moving charge in uniform magnetic and electric fields, force on a current-carrying conductor in a uniform magnetic field, the force between two parallel currents carrying conductors-definition of ampere, torque experienced by a current loop in a uniform magnetic field: Moving coil galvanometer, its sensitivity and conversion to ammeter and voltmeter; Current loop as a magnetic dipole and its magnetic dipole moment, bar magnet as an equivalent solenoid, magnetic field lines, magnetic field due to a magnetic dipole (bar magnet) along its axis and perpendicular to its axis, torque on a magnetic dipole in a uniform magnetic field, para-, dia- and ferromagnetic substances with examples, the effect of temperature on magnetic properties.",
    'Electromagnetic Induction and Alternating Currents': "Electromagnetic induction: Faraday's law, induced emf and current, Lenz's law, eddy currents, self and mutual inductance; Alternating currents, peak and RMS value of alternating current/voltage, reactance and impedance, LCR series circuit, resonance, power in AC circuits, wattless current, AC generator and transformer.",
    'Electromagnetic Waves': 'Displacement current, electromagnetic waves and their characteristics, transverse nature of electromagnetic waves, electromagnetic spectrum (radio waves, microwaves, infrared, visible, ultraviolet, X-rays, Gamma rays), applications of electromagnetic waves.',
    'Optics': 'Reflection of light, spherical mirrors, mirror formula; Refraction of light at plane and spherical surfaces, thin lens formula and lens maker formula, total internal reflection and its applications, magnification, power of a lens, combination of thin lenses in contact, refraction of light through a prism, microscope and astronomical telescope (reflecting and refracting) and their magnifying powers; Wave optics: wavefront and Huygens ‘Principle, laws of reflection and refraction using Huygens principle; Interference: Young\'s double-slit experiment and expression for fringe width, coherent sources and sustained interference of light; Diffraction due to a single slit, width of central maximum; Polarization: plane-polarized light, Brewster\'s law, uses of plane- polarized light and Polaroid.',
    'Dual Nature of Matter and Radiation': "Dual nature of radiation, Photoelectric effect, Hertz and Lenard's observations, Einstein's photoelectric equation, particle nature of light; Matter waves: wave nature of particle, de- Broglie relation.",
    'Atoms and Nuclei': "Alpha-particle scattering experiment, Rutherford's model of atom, Bohr model, energy levels, hydrogen spectrum; Composition and size of nucleus, atomic masses, mass-energy relation, mass defect, binding energy per nucleon and its variation with mass number, nuclear fission and fusion.",
    'Electronic Devices': 'Semiconductors, semiconductor diode: I-V characteristics in forward and reverse bias, diode as a rectifier; I-V characteristics of LED, the photodiode, solar cell, Zener diode, Zener diode as a voltage regulator; Logic gates (OR, AND, NOT, NAND and NOR).',
    'Experimental Skills': 'Vernier calipers, Screw gauge, Simple pendulum, Metre scale, Young\'s modulus, Surface tension, Viscosity, Speed of sound, Specific heat, Resistivity, Ohm\'s law, Galvanometer, Focal length of mirrors and lens, Refractive index of prism and slab, P-N junction diode characteristics, Zener diode characteristics, Identification of electronic components.',
};

const physicalChemistryData = {
    'Some Basic Concepts in Chemistry': "Matter and its nature, Dalton's atomic theory, Concept of atom, molecule, element and compound; Laws of chemical combination; Atomic and molecular masses, mole concept, molar mass, percentage composition, empirical and molecular formulae; Chemical equations and stoichiometry.",
    'Atomic Structure': "Nature of electromagnetic radiation, photoelectric effect, spectrum of the hydrogen atom, Bohr model of a hydrogen atom; dual nature of matter, de Broglie's relationship, Heisenberg uncertainty principle; elementary ideas of quantum mechanics, the quantum mechanical model of the atom and its important features, concept of atomic orbitals as one-electron wave functions; various quantum numbers (principal, angular momentum and magnetic quantum numbers) and their significance, shapes of s, p and d - orbitals, electron spin and spin quantum number; rules for filling electrons in orbitals – Aufbau principle, Pauli's exclusion principle and Hund's rule, electronic configuration of elements and extra stability of half-filled and completely filled orbitals.",
    'Chemical Bonding and Molecular Structure': "Kossel-Lewis approach to chemical bond formation, the concept of ionic and covalent bonds; Ionic Bonding: Formation of ionic bonds, factors affecting the formation of ionic bonds, calculation of lattice enthalpy; Covalent Bonding: Concept of electronegativity, Fajan's rule, dipole moment, Valence Shell Electron Pair Repulsion (VSEPR) theory and shapes of simple molecules; Quantum mechanical approach to covalent bonding: Valence bond theory, the concept of hybridization involving s, p and d orbitals, resonance; Molecular Orbital Theory, LCAOs, types of molecular orbitals (bonding, antibonding), sigma and pi-bonds, molecular orbital electronic configurations of homonuclear diatomic molecules, the concept of bond order, bond length and bond energy; Elementary idea of metallic bonding, hydrogen bonding and its applications.",
    'Chemical Thermodynamics': "Fundamentals of thermodynamics: System and surroundings, extensive and intensive properties, state functions, entropy, types of processes; The first law of thermodynamics - Concept of work, heat, internal energy and enthalpy, heat capacity, molar heat capacity, Hess's law of constant heat summation, Enthalpies of bond dissociation, combustion, formation, atomization, sublimation, phase transition, hydration, ionization and solution; The second law of thermodynamics - Spontaneity of processes, ΔS of the universe and ΔG of the system as criteria for spontaneity, ΔG°(Standard Gibbs energy change) and equilibrium constant.",
    'Solutions': "Different methods for expressing the concentration of solution - molality, molarity, mole fraction, percentage (by volume and mass both); the vapour pressure of solutions and Raoult's Law - Ideal and non-ideal solutions, vapour pressure - composition, plots for ideal and non- ideal solutions; Colligative properties of dilute solutions - a relative lowering of vapour pressure, depression of freezing point, the elevation of boiling point and osmotic pressure; determination of molecular mass using colligative properties, abnormal value of molar mass, van't Hoff factor and its significance.",
    'Equilibrium': "Meaning of equilibrium is the concept of dynamic equilibrium; Equilibria involving physical processes: Solid-liquid, liquid-gas, gas-gas and solid-gas equilibria, Henry's law; Equilibrium involving chemical processes: Law of chemical equilibrium, equilibrium constants (Kp and Kc) and their significance, the significance of ΔG and ΔG° in chemical equilibrium, factors affecting equilibrium concentration, pressure, temperature, the effect of catalyst, Le Chatelier's principle; Ionic equilibrium: Weak and strong electrolytes, ionization of electrolytes, various concepts of acids and bases (Arrhenius, Bronsted - Lowry and Lewis) and their ionization, acid-base equilibria (including multistage ionization) and ionization constants, ionization of water, pH scale, common ion effect, hydrolysis of salts and pH of their solutions, the solubility of sparingly soluble salts, solubility products and buffer solutions.",
    'Redox Reactions and Electrochemistry': 'Electronic concepts of oxidation and reduction, redox reactions, oxidation number, rules for assigning oxidation number and balancing of redox reactions; Electrolytic and metallic conduction, conductance in electrolytic solutions, molar conductivities and their variation with concentration, Kohlrausch\'s law and its applications; Electrochemical cells - Electrolytic and Galvanic cells, different types of electrodes, electrode potentials including standard electrode potential, half-cell and cell reactions, emf of a Galvanic cell and its measurement, Nernst equation and its applications, relationship between cell potential and Gibbs\' energy change, dry cell and lead accumulator, fuel cells.',
    'Chemical Kinetics': 'Rate of a chemical reaction, factors affecting the rate of reactions: concentration, temperature, pressure and catalyst; elementary and complex reactions, order and molecularity of reactions, rate law, rate constant and its units, differential and integral forms of zero and first-order reactions, their characteristics and half-lives, the effect of temperature on the rate of reactions, Arrhenius theory, activation energy and its calculation, collision theory of bi-molecular gaseous reactions (no derivation).',
};

const inorganicChemistryData = {
    'Classification of Elements and Periodicity in Properties': 'Modern periodic law and present form of the periodic table, s, p, d and f block elements; periodic trends in properties of elements atomic and ionic radii, ionization enthalpy, electron gain enthalpy, valence, oxidation states and chemical reactivity.',
    'p-Block Elements': 'Group -13 to Group 18 Elements: General Introduction: Electronic configuration and general trends in physical and chemical properties of elements across the periods and down the groups, unique behaviour of the first element in each group.',
    'd- and f- Block Elements': "Transition Elements - General introduction, electronic configuration, occurrence and characteristics, general trends in properties of the first-row transition elements - physical properties, ionization enthalpy, oxidation states, atomic radii, colour, catalytic behaviour, magnetic properties, complex formation, interstitial compounds, alloy formation, preparation, properties and uses of K2Cr2O7 and KMnO4; Inner Transition Elements: Lanthanoids - Electronic configuration, oxidation states and Lanthanoid contraction. Actinoids - Electronic configuration and oxidation states.",
    'Coordination Compounds': "Introduction to coordination compounds, Werner's theory, ligands, coordination number, denticity, chelation, IUPAC nomenclature of mononuclear co-ordination compounds, isomerism; Bonding: Valence bond approach and basic ideas of Crystal field theory, colour and magnetic properties; importance of coordination compounds (in qualitative analysis, extraction of metals and in biological systems).",
};

const organicChemistryData = {
    'Purification and Characterisation of Organic Compounds': 'Purification - Crystallization, sublimation, distillation, differential extraction and chromatography; Qualitative analysis - Detection of nitrogen, sulphur, phosphorus and halogens; Quantitative analysis (basic principles only) - Estimation of carbon, hydrogen, nitrogen, halogens, sulphur and phosphorus; Calculations of empirical formulae and molecular formulae, numerical problems in organic quantitative analysis.',
    'Some Basic Principles of Organic Chemistry': 'Tetravalency of carbon, shapes of simple molecules - hybridization (s and p); classification of organic compounds based on functional groups and those containing halogens, oxygen, nitrogen and sulphur, homologous series; Isomerism - structural and stereoisomerism; Nomenclature (Trivial and IUPAC); Covalent bond fission - Homolytic and heterolytic, free radicals, carbocations and carbanions, stability of carbocations and free radicals, electrophiles and nucleophiles; Electronic displacement in a covalent bond - Inductive effect, electromeric effect, resonance and hyperconjugation; Common types of organic reactions- Substitution, addition, elimination and rearrangement.',
    'Hydrocarbons': 'Classification, isomerism, IUPAC nomenclature, general methods of preparation, properties and reactions; Alkanes - Conformations: Sawhorse and Newman projections (of ethane), mechanism of halogenation of alkanes; Alkenes - Geometrical isomerism, mechanism of electrophilic addition, addition of hydrogen, halogens, water, hydrogen halides (Markownikoffs and peroxide effect), Ozonolysis and polymerization; Alkynes - Acidic character, addition of hydrogen, halogens, water and hydrogen halides, polymerization; Aromatic hydrocarbons - Nomenclature, benzene - structure and aromaticity, mechanism of electrophilic substitution, halogenation, nitration, Friedel-Craft\'s alkylation and acylation, directive influence of the functional group in mono- substituted benzene.',
    'Organic Compounds Containing Halogens': 'General methods of preparation, properties and reactions, nature of C-X bond, mechanisms of substitution reactions; Uses, environmental effects of chloroform, iodoform, freons and DDT.',
    'Organic Compounds Containing Oxygen': 'Alcohols, Phenols and Ethers; Aldehyde and Ketones; Carboxylic Acids.',
    'Organic Compounds Containing Nitrogen': 'Amines; Diazonium Salts.',
    'Biomolecules': 'Carbohydrates; Proteins; Vitamins; Nucleic Acids; Hormones.',
    'Principles Related to Practical Chemistry': 'Detection of extra elements (Nitrogen, sulphur, halogens) in organic compounds, detection of functional groups; Chemistry involved in the preparation of inorganic and organic compounds; Chemistry involved in the titrimetric exercises; Chemical principles involved in the qualitative salt analysis; Chemical principles involved in experiments like enthalpy of solution, neutralization, and reaction kinetics.',
};

const mathData = {
    'Sets, Relations and Functions': 'Sets and their representation; Union, intersection and complement of sets and their algebraic properties; Power set; Relations, type of relations, equivalence relations, functions; one-one, into and onto functions, the composition of functions.',
    'Complex Numbers and Quadratic Equations': 'Complex numbers as ordered pairs of reals, Representation of complex numbers in the form a + ib and their representation in a plane, Argand diagram, algebra of complex numbers, modulus and argument (or amplitude) of a complex number; Quadratic equations in real and complex number systems and their solutions; Relations between roots and coefficients, nature of roots, the formation of quadratic equations with given roots.',
    'Matrices and Determinants': 'Matrices, algebra of matrices, type of matrices, determinants and matrices of order two and three, evaluation of determinants, area of triangles using determinants; Adjoint and inverse of a square matrix; Test of consistency and solution of simultaneous linear equations in two or three variables using matrices.',
    'Permutations and Combinations': 'The fundamental principle of counting, permutations and combinations; Meaning of P(n, r) and C(n, r), Simple applications.',
    'Binomial Theorem and its Simple Applications': 'Binomial theorem for a positive integral index, general term and middle term and simple applications.',
    'Sequence and Series': 'Arithmetic and Geometric progressions, insertion of arithmetic, geometric means between two given numbers, Relation between A.M and G.M.',
    'Limit, Continuity and Differentiability': 'Real-valued functions, algebra of functions; polynomial, rational, trigonometric, logarithmic and exponential functions; inverse functions; Graphs of simple functions; Limits, continuity and differentiability; Differentiation of the sum, difference, product and quotient of two functions; Differentiation of trigonometric, inverse trigonometric, logarithmic, exponential, composite and implicit functions; derivatives of order upto two; Applications of derivatives: Rate of change of quantities, monotonic-Increasing and decreasing functions, Maxima and minima of functions of one variable.',
    'Integral Calculus': 'Integral as an anti-derivative; Fundamental integrals involving algebraic, trigonometric, exponential and logarithmic functions; Integration by substitution, by parts and by partial fractions; Integration using trigonometric identities; Evaluation of simple integrals; The fundamental theorem of calculus, properties of definite integrals; Evaluation of definite integrals, determining areas of the regions bounded by simple curves in standard forms.',
    'Differential Equations': 'Ordinary differential equations, their order and degree; the solution of differential equation by the method of separation of variables, solution of a homogeneous and linear differential equation.',
    'Co-ordinate Geometry': 'Cartesian system of rectangular coordinates in a plane, distance formula, sections formula, locus and its equation, the slope of a line, parallel and perpendicular lines, intercepts of a line on the co-ordinate axis; Straight line; Circle, conic sections.',
    'Three Dimensional Geometry': 'Coordinates of a point in space, the distance between two points, section formula, direction ratios and direction cosines and the angle between two intersecting lines; Equation of a line; Skew lines, the shortest distance between them and its equation.',
    'Vector Algebra': 'Vectors and scalars, the addition of vectors, components of a a vector in two dimensions and three-dimensional spaces, scalar and vector products.',
    'Statistics and Probability': 'Measures of dispersion; calculation of mean, median, mode of grouped and ungrouped data, calculation of standard deviation, variance and mean deviation for grouped and ungrouped data; Probability: Probability of an event, addition and multiplication theorems of probability, Baye\'s theorem, probability distribution of a random variable.',
    'Trigonometry': 'Trigonometrical identities and trigonometrical functions, inverse trigonometrical functions their properties.',
};

const physics: PhysicsSubject = {
    name: 'Physics',
    chapters: createChapters(physicsData)
};

const chemistry: ChemistrySubject = {
    name: 'Chemistry',
    sections: [
        { name: 'Physical Chemistry', chapters: createChapters(physicalChemistryData) },
        { name: 'Inorganic Chemistry', chapters: createChapters(inorganicChemistryData) },
        { name: 'Organic Chemistry', chapters: createChapters(organicChemistryData) }
    ]
};

const math: MathSubject = {
    name: 'Math',
    chapters: createChapters(mathData)
};

export const initialTopics = {
    physics,
    chemistry,
    math,
};