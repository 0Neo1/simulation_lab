// Comprehensive experiment content for the dynamic Theory / Procedure / Observation
// templates. Each entry describes one experiment by its simulationId.
//
// Shape per experiment:
// {
//   id: string,
//   name: string,
//   classLevel: 'Class 9' | 'Class 10' | 'Class 11' | 'Class 12',
//   subject: 'Physics' | 'Chemistry',
//   theory: {
//     aim: string,
//     principle: string[],          // paragraphs
//     keyConcepts: string[],
//     formulae: { label: string, expression: string, description?: string }[],
//     learningOutcomes: string[],
//   },
//   procedure: {
//     apparatus: string[],
//     realLab: string[],            // ordered steps for real lab
//     simulator: string[],          // ordered steps inside the embedded simulation
//     safety: string[],
//   },
//   observation: {
//     intro: string,
//     columns: { key, label, placeholder, unit, sample }[],
//     rows: number,                 // count of input rows
//     metrics: {                    // computed/derived metrics from inputs
//       key, label, unit, formula, computeFromMeans?, placeholder
//     }[],
//     resultStatement: (metrics) => string,
//   }
// }

// ----------------------------------------------------------------------------
// PHYSICS EXPERIMENTS
// ----------------------------------------------------------------------------

const physicsContent = {
  // -------------------- Class 12 --------------------
  phy121: {
    id: 'phy121',
    name: 'Determine the specific resistance of a wire using a meter bridge.',
    classLevel: 'Class 12',
    subject: 'Physics',
    theory: {
      aim:
        'Determine the unknown resistance of a given wire and the specific resistance (resistivity) of its material using a meter bridge.',
      principle: [
        'A meter bridge works on the principle of a balanced Wheatstone bridge. Four resistors P, Q, R and S are arranged in a quadrilateral and a galvanometer is connected across one diagonal while a battery is connected across the other.',
        'When the bridge is balanced, no current flows through the galvanometer and the ratio P/Q equals R/S. The meter bridge replaces two of the resistors by a uniform wire of length 100 cm, so balance lengths l and (100 - l) are read directly.',
        'From the balance condition, the unknown resistance X = R · (100 - l) / l. The specific resistance (resistivity) of the wire is ρ = X · A / L, where A = πr² is the cross-sectional area and L is the length of the wire.',
      ],
      keyConcepts: [
        'Wheatstone bridge balance condition',
        'Slide-wire (meter) bridge construction and use',
        'Use of jockey to find the null point',
        'Cross-sectional area from screw gauge measurements',
        'Specific resistance (resistivity) of a material',
      ],
      formulae: [
        { label: 'Unknown resistance', expression: 'X = R · (100 − l) / l', description: 'l is balance length in cm.' },
        { label: 'Resistivity', expression: 'ρ = (X · π · r²) / L', description: 'r is wire radius, L is its length.' },
      ],
      learningOutcomes: [
        'Verify the working of a Wheatstone bridge experimentally.',
        'Locate a null point and read balance length accurately.',
        'Calculate resistance and resistivity from observed data.',
        'Interpret error sources and improve precision.',
      ],
    },
    procedure: {
      apparatus: [
        'Meter bridge (slide-wire bridge)',
        'Resistance wire of unknown resistance',
        'Resistance box',
        'Galvanometer',
        'Jockey',
        'Battery / battery eliminator',
        'One-way key',
        'Screw gauge and meter scale',
        'Connecting wires',
      ],
      realLab: [
        'Make all connections according to the circuit diagram with a clean, low-resistance contact.',
        'Insert a known resistance R from the resistance box and close the key.',
        'Place the jockey at one end of the wire and note the deflection direction in the galvanometer.',
        'Move the jockey slowly until the galvanometer shows zero deflection — this is the null point.',
        'Note the balance length l from the left end (A to B).',
        'Record three sets of readings with different values of R for both wires.',
        'Measure the diameter of the wire at three positions using a screw gauge.',
        'Measure the total length L of the wire using a meter scale.',
      ],
      simulator: [
        'Open the simulator tab and place the battery, key and resistance box on the bridge.',
        'Drag the unknown wire into the right gap of the meter bridge.',
        'Click "Insert Key" and select a value of R from the resistance box.',
        'Move the jockey or use the slider until the galvanometer reads zero.',
        'Read the balance length l displayed on the wire scale.',
        'Repeat for at least three values of R and record each reading.',
        'Use the screw gauge tool to measure wire diameter and the scale to measure its length.',
      ],
      safety: [
        'Do not press the jockey too hard — it can scratch the wire and cause uneven contact.',
        'Disconnect the battery between successive readings to avoid heating the wire.',
        'Take readings only after the deflection is completely stable.',
      ],
    },
    observation: {
      intro:
        'Record balance lengths for at least three values of R, and the screw gauge readings of wire diameter.',
      columns: [
        { key: 'R', label: 'Resistance R (Ω)', placeholder: '2.0', unit: 'Ω' },
        { key: 'l', label: 'Balance length l (cm)', placeholder: '52.0', unit: 'cm' },
        { key: 'X', label: 'X = R(100-l)/l (Ω)', placeholder: '1.84', unit: 'Ω' },
      ],
      rows: 3,
      metrics: [
        {
          key: 'X_avg',
          label: 'Mean unknown resistance, X',
          unit: 'Ω',
          formula: 'X = R(100 − l) / l (averaged)',
        },
        {
          key: 'd',
          label: 'Diameter of wire, d',
          unit: 'mm',
          formula: 'Mean of screw gauge readings',
          isInput: true,
          placeholder: '0.42',
        },
        {
          key: 'L',
          label: 'Length of wire, L',
          unit: 'cm',
          isInput: true,
          placeholder: '50.0',
        },
        {
          key: 'rho',
          label: 'Resistivity, ρ',
          unit: 'Ω·m',
          formula: 'ρ = X · π · (d/2)² / L',
        },
      ],
      resultStatement:
        'The unknown resistance X and the specific resistance ρ of the given wire have been determined.',
    },
  },

  phy122: {
    id: 'phy122',
    name: 'Determine focal length and power of a convex lens.',
    classLevel: 'Class 12',
    subject: 'Physics',
    theory: {
      aim: 'Determine the focal length f and power P of a given convex lens by the u – v method.',
      principle: [
        'A convex lens converges parallel rays of light to a real focus. For an object placed at distance u and image formed at distance v from the optical center, the lens formula relates u, v and the focal length f.',
        'The power of a lens is the reciprocal of its focal length expressed in meters and is measured in diopters.',
      ],
      keyConcepts: [
        'Sign convention for u and v',
        'Real and virtual images',
        'Position of object versus image properties',
        'Difference between focal length and power',
      ],
      formulae: [
        { label: 'Lens formula', expression: '1/f = 1/v − 1/u' },
        { label: 'Power', expression: 'P = 1 / f(m)', description: 'Unit: Diopter (D)' },
      ],
      learningOutcomes: [
        'Set up an optical bench and locate sharp images.',
        'Apply the sign convention correctly.',
        'Compute focal length and power from u and v values.',
      ],
    },
    procedure: {
      apparatus: [
        'Convex lens with stand',
        'Optical bench / metric scale',
        'Illuminated object (cross-wire / lamp)',
        'White screen',
        'Lens holder',
      ],
      realLab: [
        'Mount the lens, object and screen on the optical bench so that they are coaxial.',
        'Place the object at a distance greater than 2f from the lens.',
        'Move the screen until a sharp image is formed.',
        'Note the object distance u and image distance v from the lens.',
        'Repeat for five different positions of the object.',
      ],
      simulator: [
        'Drag the lens, object and screen onto the optical bench.',
        'Use the slider to change the object distance u.',
        'Move the screen until the simulated image becomes sharp.',
        'Read u and v from the labelled scale.',
        'Click "Add Reading" to record each set of values.',
      ],
      safety: [
        'Avoid looking directly at the bright light source through the lens.',
        'Keep the lens free of fingerprints — wipe gently with a soft cloth.',
      ],
    },
    observation: {
      intro: 'Record object and image distances for five different positions.',
      columns: [
        { key: 'u', label: 'Object distance u (cm)', placeholder: '30.0', unit: 'cm' },
        { key: 'v', label: 'Image distance v (cm)', placeholder: '60.0', unit: 'cm' },
        { key: 'f', label: 'Focal length f (cm)', placeholder: '20.0', unit: 'cm', formula: 'f = uv / (u + v)' },
      ],
      rows: 5,
      metrics: [
        { key: 'f_mean', label: 'Mean focal length, f', unit: 'cm' },
        { key: 'P', label: 'Power, P', unit: 'D', formula: 'P = 100 / f(cm)' },
      ],
      resultStatement: 'The focal length and the power of the convex lens have been determined.',
    },
  },

  phy123: {
    id: 'phy123',
    name: 'Comparison of EMF of two cells using a potentiometer.',
    classLevel: 'Class 12',
    subject: 'Physics',
    theory: {
      aim: 'Compare the EMFs of two given primary cells using a potentiometer.',
      principle: [
        'A potentiometer is a long, uniform-resistance wire across which a steady current flows. The potential difference along its length is proportional to length.',
        'When a cell is balanced against a length l of the wire, the EMF is proportional to l. So E₁/E₂ = l₁/l₂ where l₁ and l₂ are balancing lengths for the two cells.',
      ],
      keyConcepts: [
        'Steady current along potentiometer wire',
        'Null point detection with galvanometer',
        'EMF vs terminal voltage',
        'Why a potentiometer is more accurate than a voltmeter',
      ],
      formulae: [
        { label: 'EMF ratio', expression: 'E₁ / E₂ = l₁ / l₂' },
      ],
      learningOutcomes: [
        'Use a potentiometer to compare EMFs without drawing current from the cell.',
        'Identify reasons for non-uniform potentiometer wire and correct them.',
      ],
    },
    procedure: {
      apparatus: [
        'Potentiometer (10-wire)',
        'Driver cell / accumulator',
        'Two primary cells (e.g., Daniell, Leclanché)',
        'Galvanometer',
        'Two-way key',
        'Resistance box',
        'Jockey, connecting wires',
      ],
      realLab: [
        'Set up the circuit with the driver cell, key and rheostat across the potentiometer wire.',
        'Connect cell 1 in the secondary circuit through the galvanometer.',
        'Slide the jockey until the galvanometer shows zero deflection. Note balancing length l₁.',
        'Replace cell 1 with cell 2 and repeat to find l₂.',
        'Take three sets of readings.',
      ],
      simulator: [
        'Click "Connect" to wire up the potentiometer.',
        'Use the cell-selector switch to choose cell 1.',
        'Drag the jockey along the wire until the galvanometer needle is at 0.',
        'Note l₁ shown on the wire scale.',
        'Switch to cell 2 and find l₂.',
      ],
      safety: [
        'Do not allow the jockey to slide along the wire under pressure.',
        'Use a resistance box to limit current through the galvanometer.',
      ],
    },
    observation: {
      intro: 'Record three pairs of balancing lengths.',
      columns: [
        { key: 'l1', label: 'Balancing length l₁ for cell 1 (cm)', placeholder: '420', unit: 'cm' },
        { key: 'l2', label: 'Balancing length l₂ for cell 2 (cm)', placeholder: '300', unit: 'cm' },
        { key: 'ratio', label: 'Ratio l₁ / l₂', placeholder: '1.40' },
      ],
      rows: 3,
      metrics: [
        { key: 'ratio_mean', label: 'Mean ratio E₁ / E₂', formula: 'l₁ / l₂' },
      ],
      resultStatement: 'The ratio of the EMFs of the two cells has been determined.',
    },
  },

  phy124: {
    id: 'phy124',
    name: "Verification of Ohm's law and resistance laws.",
    classLevel: 'Class 12',
    subject: 'Physics',
    theory: {
      aim: "Verify Ohm's law for a metallic conductor and determine its resistance.",
      principle: [
        "Ohm's law states that the current I through a conductor is directly proportional to the potential difference V across it, provided the temperature and other physical conditions are constant.",
        'V = IR. A V vs I graph should be a straight line passing through the origin with slope equal to the resistance R.',
      ],
      keyConcepts: [
        'Ohmic and non-ohmic conductors',
        'Slope of V vs I graph as resistance',
        'Effect of temperature on resistance',
        'Series and parallel combination of resistors',
      ],
      formulae: [
        { label: "Ohm's law", expression: 'V = IR' },
        { label: 'Slope', expression: 'R = ΔV / ΔI' },
      ],
      learningOutcomes: [
        'Construct a simple electrical circuit and take consistent readings.',
        'Plot and interpret a V vs I graph.',
        'Calculate resistance from graph slope.',
      ],
    },
    procedure: {
      apparatus: [
        'Resistance wire',
        'Battery / battery eliminator',
        'Voltmeter and ammeter',
        'Rheostat',
        'One-way key',
        'Connecting wires',
      ],
      realLab: [
        'Connect the resistor, ammeter, key and rheostat in series across the battery.',
        'Connect the voltmeter in parallel across the resistor.',
        'Vary the rheostat to change current, record corresponding I and V.',
        'Take five sets of readings.',
        'Plot V vs I and find slope = R.',
      ],
      simulator: [
        'Drag wires to build the circuit shown in the diagram.',
        'Use the rheostat slider to change the current.',
        'Record the digital ammeter and voltmeter readings.',
      ],
      safety: [
        'Do not exceed the safe current rating of the wire.',
        'Open the key when not taking readings to prevent heating.',
      ],
    },
    observation: {
      intro: 'Record five sets of V and I and compute R for each.',
      columns: [
        { key: 'V', label: 'Voltage V (V)', placeholder: '1.0', unit: 'V' },
        { key: 'I', label: 'Current I (A)', placeholder: '0.20', unit: 'A' },
        { key: 'R', label: 'R = V / I (Ω)', placeholder: '5.0', unit: 'Ω' },
      ],
      rows: 5,
      metrics: [
        { key: 'R_mean', label: 'Mean resistance, R', unit: 'Ω' },
      ],
      resultStatement: "Ohm's law has been verified and the resistance of the conductor has been determined.",
    },
  },

  // -------------------- Class 11 --------------------
  phy111: {
    id: 'phy111',
    name: 'Determine radius of curvature of a convex and concave surface using spherometer.',
    classLevel: 'Class 11',
    subject: 'Physics',
    theory: {
      aim: 'Determine the radius of curvature R of given convex and concave surfaces using a spherometer.',
      principle: [
        'A spherometer measures the height (sagitta) h of a spherical cap above the plane formed by its three legs spaced at distance l on a circle.',
        'For a curved surface, R = l² / (6h) + h/2.',
      ],
      keyConcepts: [
        'Pitch and least count of a spherometer',
        'Sagitta of a spherical surface',
        'Convex vs concave surface direction',
      ],
      formulae: [
        { label: 'Radius of curvature', expression: 'R = l² / (6h) + h/2' },
        { label: 'Least count', expression: 'LC = pitch / number of divisions' },
      ],
      learningOutcomes: [
        'Read pitch and least count of a spherometer.',
        'Use the spherometer to find sagitta accurately.',
        'Compute radius of curvature for spherical surfaces.',
      ],
    },
    procedure: {
      apparatus: [
        'Spherometer',
        'Convex and concave mirrors / lenses',
        'Plane glass plate',
        'Meter scale',
      ],
      realLab: [
        'Find the pitch and least count of the spherometer.',
        'Place the spherometer on a plane glass plate and note the reading.',
        'Place it on the convex surface and note the new reading; difference gives h.',
        'Take impressions of the three legs on paper and measure mean leg distance l.',
        'Repeat for the concave surface.',
      ],
      simulator: [
        'Click "Place on Plane" to record the zero reading.',
        'Switch to convex/concave surface and click "Measure".',
        'Read displayed h and l.',
      ],
      safety: ['Place the spherometer gently to avoid scratches on the optical surface.'],
    },
    observation: {
      intro: 'Record sagitta h and leg distance l for both surfaces.',
      columns: [
        { key: 'h', label: 'Sagitta h (mm)', placeholder: '0.6', unit: 'mm' },
        { key: 'l', label: 'Leg distance l (mm)', placeholder: '24.0', unit: 'mm' },
        { key: 'R', label: 'R = l²/(6h) + h/2 (mm)', placeholder: '160.3', unit: 'mm' },
      ],
      rows: 3,
      metrics: [
        { key: 'R_mean', label: 'Mean radius of curvature, R', unit: 'mm' },
      ],
      resultStatement: 'The radius of curvature of the given surface has been determined.',
    },
  },

  phy112: {
    id: 'phy112',
    name: "Determine Young's modulus of a wire using Vernier scale.",
    classLevel: 'Class 11',
    subject: 'Physics',
    theory: {
      aim: "Determine Young's modulus Y of the material of a given wire using Searle's apparatus and a Vernier scale.",
      principle: [
        "Young's modulus is defined as the ratio of longitudinal stress to longitudinal strain within the elastic limit.",
        'Y = (F · L) / (A · ΔL), where F = mg is the applied load, L is the original length, A is the cross-section and ΔL is the elongation.',
      ],
      keyConcepts: [
        'Stress and strain',
        'Elastic limit and Hooke’s law',
        'Why Searle’s apparatus uses a reference wire',
      ],
      formulae: [
        { label: "Young's modulus", expression: 'Y = (M · g · L) / (π · r² · ΔL)' },
      ],
      learningOutcomes: [
        'Measure small elongation precisely with a Vernier scale.',
        'Apply the definition of stress and strain.',
        "Compute Young's modulus.",
      ],
    },
    procedure: {
      apparatus: [
        "Searle's apparatus",
        'Slotted weights with hanger',
        'Vernier scale',
        'Screw gauge',
        'Meter scale',
        'Test wire of given material',
      ],
      realLab: [
        'Suspend the wire from a rigid support and attach a hanger at the bottom.',
        'Add a small dead load to remove kinks and note the initial Vernier reading.',
        'Add weights one at a time and record the new Vernier reading after each.',
        'Decrease load similarly to take "unloading" readings.',
        'Measure wire length L and diameter d (and hence radius r).',
      ],
      simulator: [
        'Use the slider to hang weights and observe elongation.',
        'Read the Vernier scale to record ΔL for each load.',
      ],
      safety: ['Do not load beyond the elastic limit of the wire.'],
    },
    observation: {
      intro: 'Record load M and corresponding elongation ΔL.',
      columns: [
        { key: 'M', label: 'Load M (kg)', placeholder: '0.5', unit: 'kg' },
        { key: 'dL', label: 'Elongation ΔL (mm)', placeholder: '0.32', unit: 'mm' },
        { key: 'ratio', label: 'M / ΔL (kg/mm)', placeholder: '1.56' },
      ],
      rows: 5,
      metrics: [
        { key: 'L', label: 'Length of wire, L', unit: 'm', isInput: true, placeholder: '1.50' },
        { key: 'r', label: 'Radius of wire, r', unit: 'mm', isInput: true, placeholder: '0.25' },
        {
          key: 'Y',
          label: "Young's modulus, Y",
          unit: 'N/m²',
          formula: 'Y = M·g·L / (π·r²·ΔL)',
        },
      ],
      resultStatement: "Young's modulus of the material of the wire has been determined.",
    },
  },

  phy113: {
    id: 'phy113',
    name: 'Determine spring constant of a helical spring.',
    classLevel: 'Class 11',
    subject: 'Physics',
    theory: {
      aim: 'Determine the spring constant k of a given helical spring using the loading method.',
      principle: [
        'When a load F is applied to a spring, the extension x is directly proportional to F (Hooke’s law): F = kx.',
        'A graph of F versus x gives a straight line whose slope is the spring constant k.',
      ],
      keyConcepts: ['Hooke’s law', 'Restoring force', 'Slope as spring constant'],
      formulae: [{ label: 'Hooke’s law', expression: 'F = k · x' }],
      learningOutcomes: [
        'Determine the spring constant from F vs x graph.',
        'Identify the elastic region of the spring.',
      ],
    },
    procedure: {
      apparatus: ['Helical spring', 'Slotted weights', 'Meter scale', 'Pointer'],
      realLab: [
        'Suspend the spring from a rigid stand and attach a pointer at its lower end.',
        'Note the initial pointer position.',
        'Add weights step by step and note the new pointer position after each.',
        'Compute extension x = current position − initial position.',
        'Plot F vs x and find slope = k.',
      ],
      simulator: [
        'Drag a weight onto the spring hanger.',
        'Read the new pointer position from the displayed scale.',
      ],
      safety: ['Do not exceed the elastic limit; remove loads when finished.'],
    },
    observation: {
      intro: 'Record load and corresponding extension for at least 5 readings.',
      columns: [
        { key: 'F', label: 'Force F = mg (N)', placeholder: '1.0', unit: 'N' },
        { key: 'x', label: 'Extension x (cm)', placeholder: '4.0', unit: 'cm' },
        { key: 'k', label: 'k = F/x (N/m)', placeholder: '25', unit: 'N/m' },
      ],
      rows: 5,
      metrics: [{ key: 'k_mean', label: 'Mean spring constant, k', unit: 'N/m' }],
      resultStatement: 'The spring constant k of the given helical spring has been determined.',
    },
  },

  phy114: {
    id: 'phy114',
    name: "Determine frequency of tuning fork using Melde's experiment.",
    classLevel: 'Class 11',
    subject: 'Physics',
    theory: {
      aim: "Determine the frequency of a tuning fork using Melde's experiment.",
      principle: [
        'A vibrating tuning fork sets up transverse stationary waves in a stretched string. The relation between frequency f, tension T, length L and number of loops p is:',
        'f = (p / 2L) · √(T / μ), where μ is mass per unit length.',
      ],
      keyConcepts: ['Stationary waves', 'Loops and antinodes', 'Linear mass density μ'],
      formulae: [
        { label: 'Frequency', expression: 'f = (p / 2L) · √(T / μ)' },
      ],
      learningOutcomes: [
        'Measure linear mass density of the string.',
        'Identify number of loops accurately.',
        'Use stationary wave formula to compute frequency.',
      ],
    },
    procedure: {
      apparatus: ['Tuning fork', 'String', 'Pulley and weights', 'Meter scale', 'Sonometer board'],
      realLab: [
        'Attach a string to the prong of the tuning fork; pass over a pulley to a weight pan.',
        'Energize the fork and adjust tension until clear loops are seen.',
        'Count loops p and measure length L.',
        'Note tension T = mg of the weight on the pan.',
        'Repeat for different tensions.',
        'Measure mass per unit length μ separately by weighing a known length of string.',
      ],
      simulator: [
        'Adjust tension slider and observe the loops form.',
        'Use the loop counter and length scale to record p and L.',
      ],
      safety: ['Avoid sudden release of tension when removing weights.'],
    },
    observation: {
      intro: 'Record loop count and length for various tensions.',
      columns: [
        { key: 'T', label: 'Tension T (N)', placeholder: '0.5', unit: 'N' },
        { key: 'L', label: 'Length L (m)', placeholder: '0.80', unit: 'm' },
        { key: 'p', label: 'Loops p', placeholder: '4' },
        { key: 'f', label: 'Frequency f (Hz)', placeholder: '256', unit: 'Hz' },
      ],
      rows: 4,
      metrics: [
        { key: 'mu', label: 'Linear mass density μ', unit: 'kg/m', isInput: true, placeholder: '5e-4' },
        { key: 'f_mean', label: 'Mean frequency, f', unit: 'Hz' },
      ],
      resultStatement: 'The frequency of the tuning fork has been determined experimentally.',
    },
  },

  // -------------------- Class 10 --------------------
  phy101: {
    id: 'phy101',
    name: 'Determine area and volume of a rectangular block.',
    classLevel: 'Class 10',
    subject: 'Physics',
    theory: {
      aim: 'Use slide (vernier) calipers to measure dimensions of a rectangular block and compute its surface area and volume.',
      principle: [
        'Vernier calipers can measure lengths to a fraction of a millimeter using the principle that one division of the vernier scale is slightly less than one division of the main scale.',
        'Total reading = main scale reading + (coinciding vernier division × least count).',
      ],
      keyConcepts: ['Main scale and vernier scale', 'Least count', 'Zero error correction'],
      formulae: [
        { label: 'Volume', expression: 'V = l · b · h' },
        { label: 'Total surface area', expression: 'A = 2(lb + bh + hl)' },
      ],
      learningOutcomes: ['Read a vernier caliper accurately.', 'Apply zero error correction.'],
    },
    procedure: {
      apparatus: ['Vernier calipers', 'Rectangular block'],
      realLab: [
        'Determine least count of the vernier calipers.',
        'Measure length, breadth and height of the block at three positions and average.',
        'Compute volume and surface area.',
      ],
      simulator: [
        'Use the on-screen calipers to measure each dimension.',
        'Note three readings for each side and take the mean.',
      ],
      safety: ['Handle calipers gently; do not force the jaws.'],
    },
    observation: {
      intro: 'Record three readings for each dimension.',
      columns: [
        { key: 'l', label: 'Length l (cm)', placeholder: '5.20', unit: 'cm' },
        { key: 'b', label: 'Breadth b (cm)', placeholder: '3.10', unit: 'cm' },
        { key: 'h', label: 'Height h (cm)', placeholder: '2.05', unit: 'cm' },
      ],
      rows: 3,
      metrics: [
        { key: 'V', label: 'Volume, V', unit: 'cm³', formula: 'V = mean(l)·mean(b)·mean(h)' },
        { key: 'A', label: 'Surface area, A', unit: 'cm²', formula: 'A = 2(lb + bh + hl)' },
      ],
      resultStatement: 'Surface area and volume of the rectangular block have been determined.',
    },
  },

  phy102: {
    id: 'phy102',
    name: 'Determine cross-sectional area of a circular wire.',
    classLevel: 'Class 10',
    subject: 'Physics',
    theory: {
      aim: 'Use a screw gauge to measure the diameter of a circular wire and calculate its cross-sectional area.',
      principle: [
        'A screw gauge can measure very small lengths (~0.01 mm) using a calibrated screw.',
        'Reading = pitch scale reading + (head scale reading × least count).',
        'Cross-sectional area A = π · (d/2)².',
      ],
      keyConcepts: ['Pitch and least count of screw gauge', 'Zero error', 'Cross-sectional area'],
      formulae: [{ label: 'Area', expression: 'A = π · d² / 4' }],
      learningOutcomes: [
        'Read a screw gauge accurately.',
        'Compute area from diameter measurements.',
      ],
    },
    procedure: {
      apparatus: ['Screw gauge', 'Circular wire'],
      realLab: [
        'Find the least count of the screw gauge.',
        'Note any zero error.',
        'Measure the diameter at five different positions and average.',
        'Compute cross-sectional area.',
      ],
      simulator: [
        'Rotate the on-screen screw gauge until it just grips the wire.',
        'Read pitch scale and head scale readings.',
      ],
      safety: ['Use the ratchet to avoid over-tightening.'],
    },
    observation: {
      intro: 'Record diameter at five positions.',
      columns: [
        { key: 'd', label: 'Diameter d (mm)', placeholder: '0.42', unit: 'mm' },
      ],
      rows: 5,
      metrics: [
        { key: 'd_mean', label: 'Mean diameter, d', unit: 'mm' },
        { key: 'A', label: 'Cross-sectional area, A', unit: 'mm²', formula: 'A = π·d²/4' },
      ],
      resultStatement: 'The cross-sectional area of the wire has been determined.',
    },
  },

  phy103: {
    id: 'phy103',
    name: 'Creation and display of image using convex lens.',
    classLevel: 'Class 10',
    subject: 'Physics',
    theory: {
      aim: 'Study the position, size and nature of images formed by a convex lens for various object distances.',
      principle: [
        'A convex lens forms a real or virtual image depending on whether the object is beyond, at, or within the focal length.',
        'Using the lens formula 1/f = 1/v − 1/u and magnification m = v/u, image properties can be predicted.',
      ],
      keyConcepts: ['Real and virtual images', 'Magnification', 'Image positions for different u'],
      formulae: [
        { label: 'Lens formula', expression: '1/f = 1/v − 1/u' },
        { label: 'Magnification', expression: 'm = v / u = h_image / h_object' },
      ],
      learningOutcomes: ['Identify image type from u and f.', 'Compute magnification.'],
    },
    procedure: {
      apparatus: ['Convex lens', 'Object pin', 'Screen', 'Optical bench'],
      realLab: [
        'Place the object at distances u = f/2, f, 1.5f, 2f and 3f from the lens.',
        'Locate the image on the screen and note v.',
        'Note the nature (real / virtual), size and orientation.',
      ],
      simulator: [
        'Use the slider to change object distance.',
        'Observe the image and read v from the scale.',
      ],
      safety: ['Avoid scratching the lens with the object pin.'],
    },
    observation: {
      intro: 'Record image distance and nature for each object position.',
      columns: [
        { key: 'u', label: 'Object distance u (cm)', placeholder: '20', unit: 'cm' },
        { key: 'v', label: 'Image distance v (cm)', placeholder: '30', unit: 'cm' },
        { key: 'm', label: 'Magnification m = v/u', placeholder: '1.5' },
        { key: 'nature', label: 'Image nature', placeholder: 'Real, inverted', isText: true },
      ],
      rows: 5,
      metrics: [],
      resultStatement: 'Image positions and natures for various u have been recorded.',
    },
  },

  phy104: {
    id: 'phy104',
    name: 'Determine average speed by rolling a marble on an inclined plane.',
    classLevel: 'Class 10',
    subject: 'Physics',
    theory: {
      aim: 'Determine the average speed of a marble rolling down an inclined plane.',
      principle: [
        'Average speed v_avg = total distance / total time. By measuring the distance covered on an inclined plane and the time taken, we can calculate v_avg.',
      ],
      keyConcepts: ['Distance, time, speed', 'Acceleration on inclined planes'],
      formulae: [{ label: 'Average speed', expression: 'v_avg = d / t' }],
      learningOutcomes: ['Make precise time measurements.', 'Compute average speed.'],
    },
    procedure: {
      apparatus: ['Smooth inclined plane', 'Marble', 'Stop watch', 'Meter scale'],
      realLab: [
        'Set the inclined plane at a fixed angle.',
        'Mark a starting point and an end point on the plane.',
        'Release the marble from rest and record the time taken.',
        'Repeat three times and average.',
      ],
      simulator: [
        'Adjust angle of inclination.',
        'Click "Release" and read time on the digital timer.',
      ],
      safety: ['Catch the marble at the end of the plane to prevent it from falling.'],
    },
    observation: {
      intro: 'Record distance and time for several trials.',
      columns: [
        { key: 'd', label: 'Distance d (m)', placeholder: '1.0', unit: 'm' },
        { key: 't', label: 'Time t (s)', placeholder: '0.85', unit: 's' },
        { key: 'v', label: 'v = d/t (m/s)', placeholder: '1.18', unit: 'm/s' },
      ],
      rows: 3,
      metrics: [{ key: 'v_mean', label: 'Mean average speed, v_avg', unit: 'm/s' }],
      resultStatement: 'The average speed of the marble on the inclined plane has been determined.',
    },
  },

  // -------------------- Class 9 --------------------
  phy091: {
    id: 'phy091',
    name: 'Measure force applied on an object using spring balance.',
    classLevel: 'Class 9',
    subject: 'Physics',
    theory: {
      aim: 'Measure the force needed to lift / pull an object using a spring balance.',
      principle: [
        'A spring balance shows force directly because spring extension is proportional to applied force (Hooke’s law).',
        'Force F = mg for an object of mass m at rest.',
      ],
      keyConcepts: ['Force, weight, mass', 'Spring balance', 'Newton as unit of force'],
      formulae: [{ label: 'Weight', expression: 'W = m · g' }],
      learningOutcomes: ['Measure force in newtons.', 'Differentiate weight from mass.'],
    },
    procedure: {
      apparatus: ['Spring balance', 'Different objects', 'Hook'],
      realLab: [
        'Hang the object on the spring balance.',
        'Wait until the pointer becomes steady.',
        'Read the force directly in newtons.',
        'Repeat for several objects.',
      ],
      simulator: [
        'Drag an object onto the hook of the spring balance.',
        'Read the displayed force in newtons.',
      ],
      safety: ['Do not exceed maximum capacity printed on the spring balance.'],
    },
    observation: {
      intro: 'Record the spring balance reading for each object.',
      columns: [
        { key: 'object', label: 'Object', placeholder: 'Stone', isText: true },
        { key: 'F', label: 'Force F (N)', placeholder: '2.0', unit: 'N' },
      ],
      rows: 4,
      metrics: [],
      resultStatement: 'The force needed to support each object has been measured.',
    },
  },

  phy092: {
    id: 'phy092',
    name: "Proof of Newton's second law of motion.",
    classLevel: 'Class 9',
    subject: 'Physics',
    theory: {
      aim: "Verify Newton's second law by varying applied force on a trolley of fixed mass.",
      principle: [
        "Newton's second law states that the rate of change of momentum is proportional to the applied force, i.e. F = ma.",
        'For a constant mass, acceleration is directly proportional to force.',
      ],
      keyConcepts: ['Mass and inertia', 'Acceleration', 'Net external force'],
      formulae: [{ label: "Newton's second law", expression: 'F = m · a' }],
      learningOutcomes: ['Plot F vs a graph and identify proportionality.'],
    },
    procedure: {
      apparatus: ['Trolley', 'Pulley and string', 'Hanging weights', 'Stop watch', 'Meter scale'],
      realLab: [
        'Set up a trolley on a smooth track with a string passing over a pulley to a hanger.',
        'Place a small mass on the hanger to provide force F.',
        'Release the trolley and measure time t for it to travel a fixed distance s.',
        'Compute a = 2s / t².',
        'Repeat for several values of F.',
      ],
      simulator: ['Use sliders to set hanging mass and trolley mass.', 'Observe acceleration on the on-screen meter.'],
      safety: ['Catch the falling weight to prevent damage.'],
    },
    observation: {
      intro: 'Record force and corresponding acceleration.',
      columns: [
        { key: 'F', label: 'Force F (N)', placeholder: '0.2', unit: 'N' },
        { key: 't', label: 'Time t (s)', placeholder: '1.6', unit: 's' },
        { key: 's', label: 'Distance s (m)', placeholder: '0.8', unit: 'm' },
        { key: 'a', label: 'a = 2s/t² (m/s²)', placeholder: '0.625', unit: 'm/s²' },
      ],
      rows: 4,
      metrics: [{ key: 'm', label: 'Mass of trolley, m = F/a', unit: 'kg' }],
      resultStatement: "Newton's second law has been verified within experimental limits.",
    },
  },
};

// ----------------------------------------------------------------------------
// CHEMISTRY EXPERIMENTS
// ----------------------------------------------------------------------------

const chemistryContent = {
  // -------------------- Class 12 --------------------
  che121: {
    id: 'che121',
    name: 'Determination of ferrous ion in an unknown solution using KMnO4.',
    classLevel: 'Class 12',
    subject: 'Chemistry',
    theory: {
      aim:
        'Determine the amount of Fe²⁺ in a given solution by titration against a standard KMnO₄ solution in acidic medium.',
      principle: [
        'In acidic medium, MnO₄⁻ is a strong oxidizing agent and oxidises Fe²⁺ to Fe³⁺ while itself being reduced to Mn²⁺.',
        'KMnO₄ acts as a self-indicator: the end point is signalled by the appearance of a permanent pale pink colour.',
        'Balanced equation: MnO₄⁻ + 8H⁺ + 5Fe²⁺ → Mn²⁺ + 5Fe³⁺ + 4H₂O',
      ],
      keyConcepts: [
        'Redox titration',
        'Self-indicator',
        'Use of dilute H₂SO₄ to provide acidic medium',
        'Equivalence factor between KMnO₄ and Fe²⁺',
      ],
      formulae: [
        { label: 'Concentration of Fe²⁺', expression: 'M_Fe = (5 · M_KMnO₄ · V_KMnO₄) / V_Fe' },
      ],
      learningOutcomes: [
        'Perform redox titration.',
        'Identify the colour-change end point.',
        'Calculate the strength of an unknown solution.',
      ],
    },
    procedure: {
      apparatus: [
        'Burette and pipette',
        'Conical flask',
        'KMnO₄ solution (titrant)',
        'Fe²⁺ unknown solution',
        'Dilute H₂SO₄',
        'Funnel and stand',
      ],
      realLab: [
        'Rinse and fill the burette with KMnO₄ solution; set initial reading at 0.',
        'Pipette 20 mL of the unknown Fe²⁺ solution into a conical flask.',
        'Add about 20 mL dilute H₂SO₄ to the flask.',
        'Titrate against KMnO₄ until a pale pink colour persists for ~30 s.',
        'Record final burette reading and repeat for three concordant readings.',
      ],
      simulator: [
        'Click "Fill Burette" to load KMnO₄.',
        'Pipette the Fe²⁺ solution and add H₂SO₄ as instructed.',
        'Drag the stopcock slider to add titrant slowly while swirling.',
        'Stop when the pink colour persists; record the volume.',
      ],
      safety: [
        'KMnO₄ stains skin and clothes; handle with care.',
        'Add acid to water — never the other way around.',
      ],
    },
    observation: {
      intro: 'Record three concordant burette readings of KMnO₄ used.',
      columns: [
        { key: 'V_Fe', label: 'Volume of Fe²⁺ solution (mL)', placeholder: '20.0', unit: 'mL' },
        { key: 'init', label: 'Initial burette reading (mL)', placeholder: '0.0', unit: 'mL' },
        { key: 'final', label: 'Final burette reading (mL)', placeholder: '11.4', unit: 'mL' },
        { key: 'V_KMnO4', label: 'V_KMnO₄ used (mL)', placeholder: '11.4', unit: 'mL' },
      ],
      rows: 3,
      metrics: [
        { key: 'V_avg', label: 'Mean V_KMnO₄', unit: 'mL' },
        { key: 'M_KMnO4', label: 'Molarity of KMnO₄', unit: 'M', isInput: true, placeholder: '0.02' },
        {
          key: 'M_Fe',
          label: 'Molarity of Fe²⁺',
          unit: 'M',
          formula: '5 · M_KMnO₄ · V_KMnO₄ / V_Fe',
        },
        {
          key: 'g_Fe_per_L',
          label: 'g of Fe²⁺ per litre',
          unit: 'g/L',
          formula: 'M_Fe · 55.85',
        },
      ],
      resultStatement: 'The amount of Fe²⁺ in the given unknown solution has been determined.',
    },
  },

  che122: {
    id: 'che122',
    name: 'Determination of concentration of unknown HCl solution using 0.1M Na2CO3.',
    classLevel: 'Class 12',
    subject: 'Chemistry',
    theory: {
      aim: 'Determine the molarity of a given HCl solution by titrating against a 0.1 M Na₂CO₃ standard solution using methyl orange.',
      principle: [
        'Na₂CO₃ + 2 HCl → 2 NaCl + H₂O + CO₂',
        'Methyl orange shows red in acid and yellow in base, so end point is when colour just turns from yellow to faint pink.',
      ],
      keyConcepts: ['Acid–base titration', 'Indicator selection', 'Stoichiometry'],
      formulae: [
        { label: 'Molarity of HCl', expression: 'M_HCl = 2 · M_Na₂CO₃ · V_Na₂CO₃ / V_HCl' },
      ],
      learningOutcomes: ['Standardise an acid against a primary standard base.'],
    },
    procedure: {
      apparatus: [
        'Burette, pipette, conical flask',
        '0.1 M Na₂CO₃ solution',
        'HCl unknown solution',
        'Methyl orange indicator',
      ],
      realLab: [
        'Fill the burette with HCl and set initial reading at 0.',
        'Pipette 20 mL of Na₂CO₃ into the conical flask.',
        'Add 2–3 drops of methyl orange — solution turns yellow.',
        'Add HCl slowly until colour changes from yellow to faint pink.',
        'Record reading; repeat for concordant values.',
      ],
      simulator: ['Drag stopcock slider while swirling the flask.', 'Stop at the colour change and record V_HCl.'],
      safety: ['Use a pipette filler — never pipette by mouth.'],
    },
    observation: {
      intro: 'Record three concordant burette readings.',
      columns: [
        { key: 'V_Na2CO3', label: 'V Na₂CO₃ (mL)', placeholder: '20.0', unit: 'mL' },
        { key: 'init', label: 'Initial reading (mL)', placeholder: '0.0', unit: 'mL' },
        { key: 'final', label: 'Final reading (mL)', placeholder: '20.6', unit: 'mL' },
        { key: 'V_HCl', label: 'V_HCl used (mL)', placeholder: '20.6', unit: 'mL' },
      ],
      rows: 3,
      metrics: [
        { key: 'V_avg', label: 'Mean V_HCl', unit: 'mL' },
        {
          key: 'M_HCl',
          label: 'Molarity of HCl',
          unit: 'M',
          formula: '2 · 0.1 · V_Na₂CO₃ / V_HCl',
        },
      ],
      resultStatement: 'The molarity of the given HCl solution has been determined.',
    },
  },

  che123: {
    id: 'che123',
    name: 'Determination of concentration of unknown NaOH solution using 0.5M Oxalic acid.',
    classLevel: 'Class 12',
    subject: 'Chemistry',
    theory: {
      aim: 'Determine the molarity of a given NaOH solution by titrating against 0.5 M oxalic acid using phenolphthalein.',
      principle: [
        '2 NaOH + H₂C₂O₄ → Na₂C₂O₄ + 2 H₂O',
        'Phenolphthalein is colourless in acid, pink in base. End point: solution turns just permanently pink.',
      ],
      keyConcepts: ['Acid–base titration', 'Phenolphthalein range', 'Stoichiometry'],
      formulae: [{ label: 'Molarity of NaOH', expression: 'M_NaOH = 2 · M_Ox · V_Ox / V_NaOH' }],
      learningOutcomes: ['Standardise a base against a primary standard acid.'],
    },
    procedure: {
      apparatus: ['Burette, pipette, flask', 'Oxalic acid 0.5 M', 'NaOH unknown', 'Phenolphthalein'],
      realLab: [
        'Fill burette with NaOH; pipette 20 mL of oxalic acid into flask.',
        'Add 2 drops of phenolphthalein.',
        'Titrate until faint pink colour persists.',
      ],
      simulator: ['Adjust stopcock and observe colour change.', 'Record volumes for three concordant readings.'],
      safety: ['NaOH is corrosive — wear gloves.'],
    },
    observation: {
      intro: 'Record three concordant burette readings.',
      columns: [
        { key: 'V_Ox', label: 'V Oxalic acid (mL)', placeholder: '20.0', unit: 'mL' },
        { key: 'init', label: 'Initial reading (mL)', placeholder: '0.0', unit: 'mL' },
        { key: 'final', label: 'Final reading (mL)', placeholder: '20.4', unit: 'mL' },
        { key: 'V_NaOH', label: 'V_NaOH used (mL)', placeholder: '20.4', unit: 'mL' },
      ],
      rows: 3,
      metrics: [
        { key: 'V_avg', label: 'Mean V_NaOH', unit: 'mL' },
        {
          key: 'M_NaOH',
          label: 'Molarity of NaOH',
          unit: 'M',
          formula: '2 · 0.5 · V_Ox / V_NaOH',
        },
      ],
      resultStatement: 'The molarity of the given NaOH solution has been determined.',
    },
  },

  che124: {
    id: 'che124',
    name: 'Functional group identification in supplied organic sample.',
    classLevel: 'Class 12',
    subject: 'Chemistry',
    theory: {
      aim: 'Identify the functional group in the supplied organic sample by simple group-tests.',
      principle: [
        'Each functional group shows a characteristic chemical reaction. By performing systematic tests for unsaturation, alcohols, phenols, aldehydes, ketones, carboxylic acids and amines, the group present can be deduced.',
      ],
      keyConcepts: [
        'Bromine water test for unsaturation',
        'Sodium metal test for alcohols and acids',
        'Tollen’s test for aldehydes',
        'NaHCO₃ test for carboxylic acid',
        'FeCl₃ test for phenols',
      ],
      formulae: [],
      learningOutcomes: ['Use observation to deduce functional group.', 'Document chemical evidence.'],
    },
    procedure: {
      apparatus: ['Test tubes', 'Reagents (Br₂, Na, Tollen’s, FeCl₃, NaHCO₃)', 'Sample organic compound'],
      realLab: [
        'Take small portions of the sample in clean test tubes.',
        'Perform the tests one by one; record observations after each.',
        'Identify the group based on positive tests.',
      ],
      simulator: ['Drag the sample onto each reagent tile and observe colour / gas change.'],
      safety: ['Many reagents are corrosive; use gloves and goggles.'],
    },
    observation: {
      intro: 'Record observation and inference for each test.',
      columns: [
        { key: 'test', label: 'Test', placeholder: 'Br₂ / CCl₄', isText: true },
        { key: 'observation', label: 'Observation', placeholder: 'Decolourisation', isText: true },
        { key: 'inference', label: 'Inference', placeholder: 'Unsaturation present', isText: true },
      ],
      rows: 5,
      metrics: [],
      resultStatement: 'The functional group present in the supplied organic sample has been identified.',
    },
  },

  // -------------------- Class 11 --------------------
  che111: {
    id: 'che111',
    name: 'Identification of different metallic ions using flame test.',
    classLevel: 'Class 11',
    subject: 'Chemistry',
    theory: {
      aim: 'Identify metallic ions in a salt by the colour they impart to a non-luminous flame.',
      principle: [
        'When metal ions are heated in a flame, electrons are excited to higher levels and emit characteristic colours when they fall back.',
        'Sodium → golden yellow, Potassium → lilac, Calcium → brick red, Strontium → crimson, Copper → green, Barium → apple green.',
      ],
      keyConcepts: ['Atomic emission', 'Energy levels', 'Excitation and de-excitation'],
      formulae: [],
      learningOutcomes: ['Identify metal ions by flame colour.'],
    },
    procedure: {
      apparatus: ['Bunsen burner', 'Platinum wire (or cleaned nichrome)', 'HCl', 'Various salts'],
      realLab: [
        'Clean the platinum wire by dipping in HCl and heating until no colour is imparted.',
        'Make a paste of the salt with HCl on the wire.',
        'Hold in non-luminous flame; observe colour.',
        'Repeat for each sample.',
      ],
      simulator: ['Drag a salt onto the flame and observe the resulting colour.'],
      safety: ['Keep hair tied back; use heat-resistant tongs.'],
    },
    observation: {
      intro: 'Record colour and metal ion for each sample.',
      columns: [
        { key: 'sample', label: 'Sample', placeholder: 'NaCl', isText: true },
        { key: 'colour', label: 'Flame colour', placeholder: 'Golden yellow', isText: true },
        { key: 'ion', label: 'Inferred metal ion', placeholder: 'Na⁺', isText: true },
      ],
      rows: 5,
      metrics: [],
      resultStatement: 'Metallic ions in the given samples have been identified by flame test.',
    },
  },

  che112: {
    id: 'che112',
    name: 'Separation of compound from mixture using paper chromatography.',
    classLevel: 'Class 11',
    subject: 'Chemistry',
    theory: {
      aim: 'Separate the components of a given mixture (e.g., ink) using paper chromatography and find their R_f values.',
      principle: [
        'Components of a mixture move at different speeds along the paper because of differential affinity to the stationary (paper) and mobile (solvent) phases.',
        'R_f = distance moved by component / distance moved by solvent front.',
      ],
      keyConcepts: ['Adsorption chromatography', 'Stationary and mobile phase', 'R_f value'],
      formulae: [{ label: 'R_f', expression: 'R_f = d_component / d_solvent' }],
      learningOutcomes: ['Run a paper chromatogram.', 'Compute R_f.'],
    },
    procedure: {
      apparatus: ['Filter paper strip', 'Beaker / chromatography jar', 'Solvent', 'Capillary tube', 'Sample mixture'],
      realLab: [
        'Spot the mixture on the paper 1 cm above the bottom edge.',
        'Suspend the paper in the jar with the spot just above the solvent.',
        'Allow the solvent to rise and mark the front when it nears the top.',
        'Measure distances of each spot and the solvent front.',
        'Compute R_f for each component.',
      ],
      simulator: ['Click "Run" and observe components separate.', 'Use the on-screen ruler to measure distances.'],
      safety: ['Solvents are volatile; ensure ventilation.'],
    },
    observation: {
      intro: 'Record distances for each component and the solvent.',
      columns: [
        { key: 'component', label: 'Component', placeholder: 'Spot 1', isText: true },
        { key: 'd_c', label: 'd_component (cm)', placeholder: '4.5', unit: 'cm' },
        { key: 'd_s', label: 'd_solvent (cm)', placeholder: '7.5', unit: 'cm' },
        { key: 'Rf', label: 'R_f', placeholder: '0.60' },
      ],
      rows: 4,
      metrics: [],
      resultStatement: 'Components of the mixture have been separated and their R_f values calculated.',
    },
  },

  che113: {
    id: 'che113',
    name: 'Determination of acid-base nature of soluble oxides of elements.',
    classLevel: 'Class 11',
    subject: 'Chemistry',
    theory: {
      aim: 'Classify oxides as acidic, basic, amphoteric or neutral based on their reaction with water and indicators.',
      principle: [
        'Oxides of metals (Na₂O, MgO, CaO) form basic solutions; oxides of non-metals (CO₂, SO₂, P₂O₅) form acidic solutions.',
        'Some oxides (Al₂O₃, ZnO) are amphoteric — they react with both acids and bases.',
      ],
      keyConcepts: ['Basic, acidic, amphoteric, neutral oxides', 'pH and indicators'],
      formulae: [],
      learningOutcomes: ['Classify oxides by their behaviour in water.'],
    },
    procedure: {
      apparatus: ['Test tubes', 'Various oxides', 'Litmus paper / universal indicator', 'Distilled water', 'NaOH, HCl'],
      realLab: [
        'Dissolve a small quantity of each oxide in distilled water.',
        'Test the solution with red and blue litmus paper.',
        'Test reactivity with both NaOH and HCl for amphoteric behaviour.',
      ],
      simulator: ['Drag the oxide onto the water beaker and observe pH change.'],
      safety: ['Wear gloves; some oxides are caustic.'],
    },
    observation: {
      intro: 'Record observations and classification for each oxide.',
      columns: [
        { key: 'oxide', label: 'Oxide', placeholder: 'Na₂O', isText: true },
        { key: 'litmus', label: 'Effect on litmus', placeholder: 'Red → Blue', isText: true },
        { key: 'pH', label: 'pH', placeholder: '12', unit: '' },
        { key: 'class', label: 'Classification', placeholder: 'Basic', isText: true },
      ],
      rows: 4,
      metrics: [],
      resultStatement: 'Acid–base nature of the oxides has been determined.',
    },
  },

  che114: {
    id: 'che114',
    name: 'Preparation of pure salt crystals from impure sample using crystallization.',
    classLevel: 'Class 11',
    subject: 'Chemistry',
    theory: {
      aim: 'Purify a given impure salt sample by recrystallisation.',
      principle: [
        'A pure substance has a definite melting point and crystalline form. By dissolving the impure salt in hot solvent and cooling slowly, soluble impurities are left in the mother liquor while pure crystals separate.',
      ],
      keyConcepts: ['Solubility vs temperature', 'Saturation point', 'Filtration'],
      formulae: [{ label: 'Yield', expression: 'Yield (%) = mass of pure crystals / mass of impure sample × 100' }],
      learningOutcomes: ['Perform recrystallisation.', 'Compute % yield.'],
    },
    procedure: {
      apparatus: ['Beaker', 'Glass rod', 'Funnel and filter paper', 'Bunsen burner', 'Impure salt'],
      realLab: [
        'Weigh the impure salt sample.',
        'Dissolve it in minimum hot water with constant stirring.',
        'Filter the hot solution to remove insoluble impurities.',
        'Cool the filtrate slowly to allow crystals to form.',
        'Filter, dry and weigh the pure crystals.',
      ],
      simulator: [
        'Click "Heat" then add salt; observe dissolution.',
        'Cool the simulated beaker and watch crystals appear.',
      ],
      safety: ['Handle hot solutions with care; use a holder.'],
    },
    observation: {
      intro: 'Record masses to compute yield.',
      columns: [
        { key: 'm_impure', label: 'Mass of impure salt (g)', placeholder: '5.00', unit: 'g' },
        { key: 'm_pure', label: 'Mass of pure crystals (g)', placeholder: '3.40', unit: 'g' },
        { key: 'yield', label: 'Yield (%)', placeholder: '68.0', unit: '%' },
      ],
      rows: 1,
      metrics: [],
      resultStatement: 'Pure crystals have been obtained from the impure salt sample.',
    },
  },

  // -------------------- Class 10 --------------------
  che101: {
    id: 'che101',
    name: 'Preparation of acid and base from food using Litmus paper and pH.',
    classLevel: 'Class 10',
    subject: 'Chemistry',
    theory: {
      aim: 'Identify whether common food samples are acidic, basic or neutral using litmus paper and pH paper.',
      principle: [
        'Acids turn blue litmus red and have pH < 7. Bases turn red litmus blue and have pH > 7. Neutral substances do not change litmus colour.',
      ],
      keyConcepts: ['pH scale', 'Indicators', 'Acidic and basic foods'],
      formulae: [],
      learningOutcomes: ['Use litmus and pH paper to classify substances.'],
    },
    procedure: {
      apparatus: ['Litmus paper (red and blue)', 'Universal pH paper', 'Food samples (lemon, soap, milk, etc.)', 'Test tubes'],
      realLab: [
        'Take small samples of each food in a test tube.',
        'Dip a strip of litmus paper into each.',
        'Note any colour change.',
        'Confirm by dipping pH paper and matching colour to chart.',
      ],
      simulator: ['Drag the food sample onto the litmus tile and read pH.'],
      safety: ['Do not taste the samples.'],
    },
    observation: {
      intro: 'Record observation for each sample.',
      columns: [
        { key: 'sample', label: 'Food sample', placeholder: 'Lemon juice', isText: true },
        { key: 'litmus', label: 'Effect on litmus', placeholder: 'Blue → Red', isText: true },
        { key: 'pH', label: 'pH', placeholder: '2', unit: '' },
        { key: 'class', label: 'Acid / Base / Neutral', placeholder: 'Acid', isText: true },
      ],
      rows: 4,
      metrics: [],
      resultStatement: 'Acid–base nature of food samples has been determined.',
    },
  },

  che102: {
    id: 'che102',
    name: 'Observation of reaction changes of ammonia salt with base.',
    classLevel: 'Class 10',
    subject: 'Chemistry',
    theory: {
      aim: 'Observe and record the products formed when an ammonium salt is heated with a base.',
      principle: [
        'NH₄Cl + NaOH → NaCl + NH₃ + H₂O. The pungent gas evolved is ammonia, which turns red litmus blue.',
      ],
      keyConcepts: ['Salt + base reaction', 'Identification of ammonia', 'Acid–base products'],
      formulae: [{ label: 'Equation', expression: 'NH₄Cl + NaOH → NaCl + NH₃↑ + H₂O' }],
      learningOutcomes: ['Identify ammonia by its smell and litmus action.'],
    },
    procedure: {
      apparatus: ['Test tube', 'Spirit lamp / burner', 'NH₄Cl', 'NaOH', 'Red and blue litmus paper'],
      realLab: [
        'Mix NH₄Cl with NaOH solution in a test tube.',
        'Warm gently and waft the gas towards moist red litmus paper.',
        'Observe colour change to blue, confirming NH₃.',
      ],
      simulator: ['Click "Heat" and watch gas evolve; drag litmus near the mouth.'],
      safety: ['Ammonia is irritating; do not inhale directly.'],
    },
    observation: {
      intro: 'Record observations of gas evolved and litmus reaction.',
      columns: [
        { key: 'observation', label: 'Observation', placeholder: 'Pungent gas', isText: true },
        { key: 'inference', label: 'Inference', placeholder: 'Ammonia (NH₃)', isText: true },
      ],
      rows: 2,
      metrics: [],
      resultStatement: 'Ammonia has been confirmed as the product of NH₄Cl with a strong base.',
    },
  },

  che103: {
    id: 'che103',
    name: 'Observation of changes by adding NaOH to two known salt solutions.',
    classLevel: 'Class 10',
    subject: 'Chemistry',
    theory: {
      aim: 'Observe and record the precipitates formed when NaOH is added to FeSO₄ and CuSO₄ solutions.',
      principle: [
        'FeSO₄ + 2 NaOH → Fe(OH)₂ (dirty green) + Na₂SO₄',
        'CuSO₄ + 2 NaOH → Cu(OH)₂ (blue gel) + Na₂SO₄',
      ],
      keyConcepts: ['Double displacement', 'Precipitation', 'Identification of metal ions'],
      formulae: [],
      learningOutcomes: ['Identify metal ions from precipitate colour.'],
    },
    procedure: {
      apparatus: ['Test tubes', 'NaOH solution', 'FeSO₄ solution', 'CuSO₄ solution', 'Dropper'],
      realLab: [
        'Take 2 mL of each salt solution in separate test tubes.',
        'Add NaOH solution dropwise.',
        'Observe colour and texture of any precipitate.',
      ],
      simulator: ['Drop NaOH onto each solution and observe.'],
      safety: ['NaOH is corrosive — use gloves.'],
    },
    observation: {
      intro: 'Record colour of precipitate for each salt.',
      columns: [
        { key: 'salt', label: 'Salt solution', placeholder: 'FeSO₄', isText: true },
        { key: 'observation', label: 'Observation', placeholder: 'Dirty green ppt', isText: true },
        { key: 'inference', label: 'Inference', placeholder: 'Fe²⁺ ion', isText: true },
      ],
      rows: 2,
      metrics: [],
      resultStatement: 'Metal ions have been identified from precipitate observations.',
    },
  },

  che104: {
    id: 'che104',
    name: 'Experiment on reaction rate of carbonate salt with water and acid.',
    classLevel: 'Class 10',
    subject: 'Chemistry',
    theory: {
      aim: 'Compare the rates of reaction of a carbonate salt with water and with dilute acid.',
      principle: [
        'CaCO₃ is sparingly soluble in water but reacts vigorously with dilute HCl giving CO₂ effervescence.',
        'CaCO₃ + 2 HCl → CaCl₂ + H₂O + CO₂↑',
      ],
      keyConcepts: ['Reaction rate', 'Effervescence', 'Acid–carbonate reaction'],
      formulae: [],
      learningOutcomes: ['Compare reaction rates qualitatively.'],
    },
    procedure: {
      apparatus: ['Test tubes', 'CaCO₃', 'Distilled water', 'Dilute HCl', 'Stopwatch'],
      realLab: [
        'Take equal amounts of CaCO₃ in two test tubes.',
        'Add water to one and HCl to the other; start the stopwatch.',
        'Observe and time the production of bubbles.',
      ],
      simulator: ['Drag CaCO₃ into each beaker and start the timer.'],
      safety: ['Dilute acid only; avoid spillage.'],
    },
    observation: {
      intro: 'Record observations for each.',
      columns: [
        { key: 'medium', label: 'Medium', placeholder: 'Dilute HCl', isText: true },
        { key: 'observation', label: 'Observation', placeholder: 'Rapid CO₂ bubbles', isText: true },
        { key: 'time', label: 'Time for visible reaction (s)', placeholder: '5', unit: 's' },
      ],
      rows: 2,
      metrics: [],
      resultStatement: 'Reaction of carbonate is much faster with dilute acid than with water.',
    },
  },

  // -------------------- Class 9 --------------------
  che091: {
    id: 'che091',
    name: 'Separation of two components from a mixture using sublimation.',
    classLevel: 'Class 9',
    subject: 'Chemistry',
    theory: {
      aim: 'Separate ammonium chloride (sublimable) from common salt (non-sublimable) using sublimation.',
      principle: [
        'Sublimation is the process by which a solid changes directly to vapour on heating, without passing through liquid state. Substances such as NH₄Cl, camphor, naphthalene sublime.',
      ],
      keyConcepts: ['Sublimation', 'Phase change', 'Separation of mixtures'],
      formulae: [],
      learningOutcomes: ['Apply sublimation to separate suitable mixtures.'],
    },
    procedure: {
      apparatus: ['China dish', 'Inverted funnel with cotton plug', 'Mixture of NH₄Cl and salt', 'Stand and clamp'],
      realLab: [
        'Place the mixture in the china dish.',
        'Cover with an inverted funnel; plug the funnel stem with cotton.',
        'Heat slowly. NH₄Cl sublimes and deposits on the cooler walls of the funnel.',
        'Allow to cool and collect the sublimate.',
      ],
      simulator: ['Click "Heat" and observe the sublimate forming on the funnel.'],
      safety: ['Heat gently; avoid breakage of the dish.'],
    },
    observation: {
      intro: 'Record masses before and after.',
      columns: [
        { key: 'm_mix', label: 'Mass of mixture (g)', placeholder: '5.00', unit: 'g' },
        { key: 'm_nh4cl', label: 'Mass of sublimate (g)', placeholder: '2.10', unit: 'g' },
        { key: 'm_salt', label: 'Mass of residue (g)', placeholder: '2.85', unit: 'g' },
      ],
      rows: 1,
      metrics: [],
      resultStatement: 'Sublimable component has been separated from the mixture.',
    },
  },

  che092: {
    id: 'che092',
    name: 'Gas identification by reaction of dilute acid with metallic carbonate.',
    classLevel: 'Class 9',
    subject: 'Chemistry',
    theory: {
      aim: 'Identify the gas evolved when a metallic carbonate reacts with a dilute acid.',
      principle: [
        'CaCO₃ + 2 HCl → CaCl₂ + H₂O + CO₂',
        'CO₂ turns lime water [Ca(OH)₂] milky due to formation of CaCO₃.',
      ],
      keyConcepts: ['Gas evolution', 'Lime-water test', 'Acid + carbonate reaction'],
      formulae: [],
      learningOutcomes: ['Identify CO₂ by its action on lime water.'],
    },
    procedure: {
      apparatus: ['Test tube', 'Delivery tube', 'Lime water', 'CaCO₃', 'Dilute HCl'],
      realLab: [
        'Place CaCO₃ in a test tube and add dilute HCl.',
        'Lead the evolved gas through a delivery tube into a test tube containing lime water.',
        'Observe lime water turning milky.',
      ],
      simulator: ['Click "Add Acid" and watch lime water become milky.'],
      safety: ['Dilute acid only; avoid splashes.'],
    },
    observation: {
      intro: 'Record observations and inference.',
      columns: [
        { key: 'observation', label: 'Observation', placeholder: 'Lime water turns milky', isText: true },
        { key: 'inference', label: 'Inference', placeholder: 'Gas is CO₂', isText: true },
      ],
      rows: 1,
      metrics: [],
      resultStatement: 'Gas evolved has been identified as CO₂.',
    },
  },
};

const allContent = { ...physicsContent, ...chemistryContent };

export const getExperimentContent = (id) => allContent[id] || null;

export default allContent;
