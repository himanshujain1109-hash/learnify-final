import { LectureData, TeacherPersona } from '../types';

export const TEACHER_PERSONAS: TeacherPersona[] = [
  {
    id: 'clara',
    name: 'Dr. Clara Vance',
    title: 'Professor of Cellular & Molecular Biology',
    subjectExpertise: 'Sciences, Biology & Medicine',
    avatarColor: 'emerald',
    avatarStyle: 'clara',
    toneDescription: 'Clear, encouraging, pedagogical, and visual breakdown specialist',
    voiceGender: 'female',
    speechRate: 1.0,
    speechPitch: 1.05
  },
  {
    id: 'marcus',
    name: 'Prof. Marcus Sterling',
    title: 'Senior Fellow in Computer Science & AI',
    subjectExpertise: 'Engineering, Tech & Algorithms',
    avatarColor: 'indigo',
    avatarStyle: 'marcus',
    toneDescription: 'Intuitive analogies, systemic thinking, high-yield conceptual clarity',
    voiceGender: 'male',
    speechRate: 0.98,
    speechPitch: 0.95
  },
  {
    id: 'maya',
    name: 'Ms. Maya Lin',
    title: 'Lead Educator in Economics & Social Sciences',
    subjectExpertise: 'Economics, Business & History',
    avatarColor: 'amber',
    avatarStyle: 'maya',
    toneDescription: 'Dynamic, engaging storytelling, real-world case studies',
    voiceGender: 'female',
    speechRate: 1.05,
    speechPitch: 1.1
  },
  {
    id: 'alan',
    name: 'Dr. Alan Ross',
    title: 'Theoretical Physics & Applied Mathematics Chair',
    subjectExpertise: 'Mathematics, Physics & Data Science',
    avatarColor: 'cyan',
    avatarStyle: 'alan',
    toneDescription: 'Step-by-step rigorous deduction, first-principles logic',
    voiceGender: 'male',
    speechRate: 0.95,
    speechPitch: 0.92
  }
];

export const PRESET_NOTES = [
  {
    id: 'bio-atp',
    title: 'Cellular Respiration & ATP Production',
    category: 'Biology & Life Sciences',
    icon: 'Activity',
    summary: 'Glycolysis, Krebs cycle, electron transport chain, and ATP synthase mechanisms.',
    content: `# Cellular Respiration & ATP Synthesis
Overview:
Cellular respiration is the fundamental metabolic process through which eukaryotic cells convert biochemical energy from glucose into adenosine triphosphate (ATP), while releasing carbon dioxide and water as waste products.

Phase 1: Glycolysis (Cytoplasm)
- Takes place entirely in the cytosol without requiring molecular oxygen (anaerobic).
- One 6-carbon glucose molecule is enzymatically cleaved into two 3-carbon pyruvate molecules.
- Net energy yield: 2 ATP (via substrate-level phosphorylation) and 2 NADH high-energy electron carriers.
- Key regulatory checkpoint: Phosphofructokinase-1 (PFK-1), allosterically inhibited by high ATP levels.

Phase 2: Pyruvate Decarboxylation & The Citric Acid (Krebs) Cycle (Mitochondrial Matrix)
- Pyruvate crosses the inner mitochondrial membrane and is converted to Acetyl-CoA by Pyruvate Dehydrogenase, yielding 1 NADH and 1 CO2 per pyruvate.
- Acetyl-CoA combines with 4-carbon Oxaloacetate to form 6-carbon Citrate.
- Through sequential oxidation steps, the cycle regenerates oxaloacetate while producing: 6 NADH, 2 FADH2, 2 GTP/ATP, and 4 CO2 per original glucose.

Phase 3: Oxidative Phosphorylation & The Electron Transport Chain (Inner Membrane)
- High-energy electrons from NADH and FADH2 pass through transmembrane Complexes I, II, III, and IV.
- Protons (H+) are pumped against their gradient from the matrix into the intermembrane space, creating a steep electrochemical proton-motive force (ΔpH + electrical potential).
- Complex V (ATP Synthase) acts like a molecular rotary motor. Protons flow back into the matrix through the F0 rotor, driving conformational rotation in the F1 subunit to synthesize ~26-28 ATP.
- Molecular oxygen serves as the terminal electron acceptor, reduced to H2O.`
  },
  {
    id: 'cs-neural-nets',
    title: 'Neural Networks & Deep Learning Core',
    category: 'Computer Science & AI',
    icon: 'Cpu',
    summary: 'Perceptrons, forward propagation, loss functions, backpropagation and gradient descent.',
    content: `# Deep Learning & Artificial Neural Networks: Architectural Foundations
1. The Artificial Neuron (Perceptron Model)
- Inspired by biological dendrites, soma, and axons.
- Inputs x_i are multiplied by learnable synaptic weights w_i and summed with an additive bias term b: z = Σ(w_i * x_i) + b.
- Activation Functions introduce crucial non-linearity:
  * ReLU (Rectified Linear Unit): f(z) = max(0, z) - mitigates vanishing gradient.
  * Sigmoid / Softmax: map outputs to probability distributions.
  * GELU: modern transformer architecture standard.

2. Feedforward Propagation
- Layers are stacked in sequence: Input Layer -> Hidden Representation Layers -> Output Prediction Layer.
- Vectorized computation: a^[l] = σ(W^[l] * a^[l-1] + b^[l]).
- Deep representations learn hierarchical abstractions: early layers detect edges/frequencies, middle layers capture motifs/textures, deep layers represent semantic concepts.

3. Loss Computation & Objective Optimization
- Quantifies discrepancy between prediction ŷ and ground truth y.
- Regression: Mean Squared Error (MSE).
- Classification: Categorical Cross-Entropy Loss: L = -Σ y_i log(ŷ_i).

4. Backpropagation & Gradient Descent
- Uses multivariate Calculus Chain Rule to compute partial derivative of Loss with respect to every weight: ∂L/∂w_ij.
- Optimization update rule: w := w - η * ∇_w L, where η represents the learning rate.
- Modern optimizers like Adam combine momentum with root mean square adaptive learning rates.`
  },
  {
    id: 'physics-quantum',
    title: 'Quantum Mechanics: Superposition & Measurement',
    category: 'Physics',
    icon: 'Atom',
    summary: 'Wave-particle duality, Schrödinger equation, wave function collapse, and quantum spin.',
    content: `# Foundations of Quantum Mechanics
1. Wave-Particle Duality & De Broglie Hypothesis
- Matter exhibits both localized particle characteristics and delocalized wave properties.
- De Broglie relation: λ = h / p, where matter wavelength relates directly to Planck's constant divided by momentum.

2. State Vectors & The Superposition Principle
- A quantum state is described by a normalized state vector |ψ⟩ in a complex Hilbert space.
- Principle of Superposition: If |0⟩ and |1⟩ are valid orthogonal basis states, any linear combination |ψ⟩ = α|0⟩ + β|1⟩ is also a valid state, where |α|^2 + |β|^2 = 1.
- Before measurement, quantum systems exist in an objective superposition of multiple potential outcomes simultaneously.

3. The Measurement Problem & Born Rule
- The Copenhagen interpretation posits that physical observation causes wave function collapse to an eigenstate.
- Born's Probability Rule: The probability P of measuring outcome k is the square of amplitude: P(k) = |⟨k|ψ⟩|^2.

4. Quantum Entanglement & Non-Locality
- When two particles interact, their states can become non-separable: |ψ_AB⟩ ≠ |ψ_A⟩ ⊗ |ψ_B⟩ (e.g. Bell State).
- Measuring particle A instantly determines the correlated state of particle B across arbitrary cosmological distances, verified empirically through Bell inequality violations.`
  }
];

export const DEMO_LECTURE: LectureData = {
  id: 'lecture-demo-cellular-respiration',
  title: 'Cellular Respiration & The ATP Energy Factory',
  subject: 'Cellular Biology & Biochemistry',
  targetAudience: 'Undergraduate & AP Biology Students',
  totalDurationSeconds: 155,
  overviewSummary: 'A complete pedagogical walkthrough of how living cells break down glucose into universal cellular energy currency (ATP) across Glycolysis, the Citric Acid Cycle, and Oxidative Phosphorylation.',
  keyTermsGlossary: [
    { term: 'ATP (Adenosine Triphosphate)', definition: 'The universal energy currency of the cell, storing energy in high-energy phosphate anhydride bonds.' },
    { term: 'Proton-Motive Force (PMF)', definition: 'Electrochemical potential gradient generated by proton pumping across the inner mitochondrial membrane.' },
    { term: 'Substrate-Level Phosphorylation', definition: 'Direct synthesis of ATP from ADP by transfer of a phosphate group from a phosphorylated metabolic intermediate.' },
    { term: 'ATP Synthase', definition: 'Molecular rotary turbine enzyme that couples spontaneous proton influx to ATP synthesis.' }
  ],
  suggestedReviewQuestions: [
    'Why is oxygen strictly required for oxidative phosphorylation if it only interacts at Complex IV?',
    'What would occur if an uncoupling protein created pores in the inner mitochondrial membrane?',
    'How does ATP act as an allosteric inhibitor of Phosphofructokinase (PFK-1)?'
  ],
  slides: [
    {
      id: 'slide-1',
      slideNumber: 1,
      totalSlides: 4,
      chapterTitle: 'Phase I: The Energy Equation',
      topicTitle: 'The Cellular Energy Challenge: What is Respiration?',
      subtitle: 'Converting Dietary Glucose into High-Yield Cellular Currency',
      blackboardSummarySnippet: 'C₆H₁₂O₆ + 6O₂ ➔ 6CO₂ + 6H₂O + ~30-32 ATP',
      estimatedDurationSeconds: 38,
      bullets: [
        {
          id: 'b1-1',
          heading: 'Thermodynamic Goal',
          content: 'Cells cannot directly burn glucose explosively; energy must be harvested incrementally in controlled micro-steps.',
          emphasis: 'Controlled enzymatic harvesting',
          highlightKeyword: 'energy'
        },
        {
          id: 'b1-2',
          heading: 'High-Energy Electron Carriers',
          content: 'NAD⁺ and FAD act as biological rechargeable batteries, stripping electrons from carbon bonds to form NADH and FADH₂.',
          emphasis: 'NADH and FADH₂ shuttles',
          highlightKeyword: 'carriers'
        },
        {
          id: 'b1-3',
          heading: 'Three Distinct Zones',
          content: 'Glycolysis occurs in the cytosol, the Krebs cycle in the mitochondrial matrix, and electron transport on the inner cristae folds.',
          emphasis: 'Cytoplasm ➔ Matrix ➔ Cristae',
          highlightKeyword: 'mitochondria'
        }
      ],
      calloutBox: {
        type: 'mental_model',
        title: 'Teacher Analogy',
        text: 'Think of glucose as a gold bullion bar, and ATP as $1 bills. Cellular respiration is the banking facility converting the raw gold into convenient, spendable currency.'
      },
      visualDiagram: {
        type: 'flow',
        title: 'Metabolic Pathway Flow',
        elements: [
          { id: 'v1', label: 'Glucose (6C)', sublabel: 'Cytosol', badge: 'Input', color: 'amber' },
          { id: 'v2', label: 'Glycolysis', sublabel: '+2 Net ATP & 2 NADH', badge: 'Stage 1', color: 'emerald' },
          { id: 'v3', label: 'Pyruvate Decarb', sublabel: 'Enters Matrix', badge: '+2 NADH', color: 'sky' },
          { id: 'v4', label: 'Krebs Cycle', sublabel: '+2 ATP, 6 NADH, 2 FADH₂', badge: 'Stage 2', color: 'indigo' },
          { id: 'v5', label: 'ATP Synthase', sublabel: '~28 ATP Yield', badge: 'Stage 3', color: 'rose' }
        ],
        connections: [
          { from: 'v1', to: 'v2', label: 'Cleaved' },
          { from: 'v2', to: 'v3', label: 'Pyruvate' },
          { from: 'v3', to: 'v4', label: 'Acetyl-CoA' },
          { from: 'v4', to: 'v5', label: 'e⁻ carriers' }
        ],
        summaryFootnote: 'Overall theoretical yield: 30 to 32 ATP per oxidized glucose molecule.'
      },
      teacherScript: 'Welcome everyone! Look up at the board. When you eat breakfast, your body receives glucose, but your cells cannot use raw glucose directly. If we burned it all at once, the energy would be lost as heat! Instead, cellular respiration extracts energy in precise, controlled steps. Notice our equation: glucose and oxygen yield carbon dioxide, water, and around thirty to thirty-two ATP molecules. Today, we will track the electron journey across all three stages.',
      scriptSegments: [
        {
          text: 'Welcome everyone! Look up at the board. When you eat breakfast, your body receives glucose, but your cells cannot use raw glucose directly.',
          focusBulletId: 'b1-1',
          teacherGesture: 'pointing'
        },
        {
          text: 'Notice our equation: glucose and oxygen yield carbon dioxide, water, and around thirty to thirty-two ATP molecules.',
          focusBulletId: 'b1-1',
          teacherGesture: 'writing'
        },
        {
          text: 'NAD-plus and FAD act like biological rechargeable batteries, stripping high-energy electrons from carbon bonds.',
          focusBulletId: 'b1-2',
          teacherGesture: 'explaining'
        },
        {
          text: 'And watch the geography here: we start in the cytoplasm, move inside the mitochondrial matrix, and finish on the cristae membranes.',
          focusBulletId: 'b1-3',
          teacherGesture: 'nodding'
        }
      ]
    },
    {
      id: 'slide-2',
      slideNumber: 2,
      totalSlides: 4,
      chapterTitle: 'Phase II: Glycolysis & The Matrix',
      topicTitle: 'Splitting Glucose & Entering The Mitochondrial Core',
      subtitle: 'Anaerobic Breakdown & The Citric Acid Turnstiles',
      blackboardSummarySnippet: 'Glucose (6C) ➔ 2 Pyruvate (3C) + 2 NADH + 2 ATP (net)',
      estimatedDurationSeconds: 42,
      bullets: [
        {
          id: 'b2-1',
          heading: 'Investment Before Profit',
          content: 'Glycolysis initially consumes 2 ATP to phosphorylate glucose, locking it inside the cell and destabilizing its structure.',
          emphasis: '2 ATP Invested ➔ 4 ATP Generated (Net +2)',
          highlightKeyword: 'investment'
        },
        {
          id: 'b2-2',
          heading: 'The Gateway Enzyme',
          content: 'Pyruvate Dehydrogenase strips a carboxyl group as CO₂, attaching Coenzyme A to yield Acetyl-CoA.',
          emphasis: 'Irreversible commitment step',
          highlightKeyword: 'Acetyl-CoA'
        },
        {
          id: 'b2-3',
          heading: 'The Krebs Wheel',
          content: '4-carbon Oxaloacetate joins with 2-carbon Acetyl-CoA to build Citrate. Each turn produces 3 NADH, 1 FADH₂, and 1 GTP/ATP.',
          emphasis: 'Fully oxidizes remaining carbons to CO₂',
          highlightKeyword: 'Krebs'
        }
      ],
      calloutBox: {
        type: 'exam_tip',
        title: 'Common Exam Trap',
        text: 'Remember that one glucose yields TWO pyruvates. Therefore, you must multiply the output of the Krebs cycle by two for every original glucose molecule!'
      },
      visualDiagram: {
        type: 'cycle',
        title: 'Citric Acid Cycle Turnover',
        elements: [
          { id: 'c1', label: 'Oxaloacetate (4C)', sublabel: 'Starting Acceptor', color: 'sky' },
          { id: 'c2', label: 'Citrate (6C)', sublabel: 'Formed with Acetyl-CoA', color: 'emerald' },
          { id: 'c3', label: 'Isocitrate (6C)', sublabel: 'CO₂ & NADH released', color: 'indigo' },
          { id: 'c4', label: 'α-Ketoglutarate (5C)', sublabel: 'CO₂ & NADH released', color: 'amber' },
          { id: 'c5', label: 'Succinyl-CoA (4C)', sublabel: 'GTP / ATP synthesized', color: 'rose' }
        ],
        connections: [
          { from: 'c1', to: 'c2' },
          { from: 'c2', to: 'c3' },
          { from: 'c3', to: 'c4' },
          { from: 'c4', to: 'c5' },
          { from: 'c5', to: 'c1', label: 'Regenerates' }
        ],
        summaryFootnote: 'Two full turns per glucose molecule liberate all remaining carbons as waste CO₂.'
      },
      teacherScript: 'Now, class, examine the second slide carefully. In glycolysis, notice something paradoxical: you have to spend two ATP upfront before you can make any profit! It is just like starting a business. Once split into pyruvate, the molecules cross into the mitochondrial matrix. Here, the Krebs cycle turns like a merry-go-round, systematically stripping high-energy electrons and loading them onto NADH and FADH-two.',
      scriptSegments: [
        {
          text: 'Now, class, examine the second slide carefully. In glycolysis, notice something paradoxical: you have to spend two ATP upfront before you can make any profit!',
          focusBulletId: 'b2-1',
          teacherGesture: 'pointing'
        },
        {
          text: 'Once split into pyruvate, the molecules cross into the mitochondrial matrix through the pyruvate dehydrogenase gateway.',
          focusBulletId: 'b2-2',
          teacherGesture: 'explaining'
        },
        {
          text: 'Here, the Krebs cycle turns like a merry-go-round, systematically stripping high-energy electrons and loading them onto NADH and FADH-two.',
          focusBulletId: 'b2-3',
          teacherGesture: 'writing'
        },
        {
          text: 'Keep that exam tip in mind: because one glucose yielded two pyruvates, this entire wheel turns twice!',
          focusBulletId: 'b2-3',
          teacherGesture: 'nodding'
        }
      ]
    },
    {
      id: 'slide-3',
      slideNumber: 3,
      totalSlides: 4,
      chapterTitle: 'Phase III: The Power Plant',
      topicTitle: 'The Electron Transport Chain & Proton Pumps',
      subtitle: 'Building The Electrochemical Dam Across The Inner Membrane',
      blackboardSummarySnippet: 'High-energy e⁻ flow ➔ H⁺ pumped to IMS ➔ Steep Δψ gradient',
      estimatedDurationSeconds: 40,
      bullets: [
        {
          id: 'b3-1',
          heading: 'Electron Relay Stations',
          content: 'Complexes I, III, and IV act as active proton pumps, shuttling H⁺ ions from the matrix into the narrow intermembrane space.',
          emphasis: 'Complexes I, III, IV pump protons',
          highlightKeyword: 'proton pump'
        },
        {
          id: 'b3-2',
          heading: 'Mobile Carriers',
          content: 'Coenzyme Q (Ubiquinone) and Cytochrome c carry electrons between embedded protein complexes like ferryboats.',
          emphasis: 'Lipid-soluble & aqueous shuttles',
          highlightKeyword: 'carriers'
        },
        {
          id: 'b3-3',
          heading: 'The Final Breath: Oxygen',
          content: 'Oxygen sits at Complex IV as the terminal electron acceptor. It pulls electrons downhill and bonds with protons to form water.',
          emphasis: '½ O₂ + 2H⁺ + 2e⁻ ➔ H₂O',
          highlightKeyword: 'oxygen'
        }
      ],
      calloutBox: {
        type: 'mental_model',
        title: 'Hydroelectric Dam Analogy',
        text: 'The electron transport chain is pumping water up into a reservoir behind a dam. The protons in the intermembrane space are under intense pressure to rush back down!'
      },
      visualDiagram: {
        type: 'comparison',
        title: 'Inner Membrane Respiratory Complexes',
        elements: [
          { id: 'cx1', label: 'Complex I', sublabel: 'NADH Dehydrogenase', badge: '4 H⁺ pumped', color: 'indigo' },
          { id: 'cx2', label: 'Complex II', sublabel: 'Succinate Dehydr.', badge: 'No H⁺ pumped', color: 'amber' },
          { id: 'cx3', label: 'Complex III', sublabel: 'Cytochrome bc₁', badge: '4 H⁺ pumped', color: 'emerald' },
          { id: 'cx4', label: 'Complex IV', sublabel: 'Cytochrome c Oxidase', badge: '2 H⁺ pumped + H₂O', color: 'rose' }
        ],
        connections: [
          { from: 'cx1', to: 'cx3', label: 'via CoQ' },
          { from: 'cx2', to: 'cx3', label: 'via CoQ' },
          { from: 'cx3', to: 'cx4', label: 'via Cyt c' }
        ],
        summaryFootnote: 'Protons accumulate in the intermembrane space, creating both a chemical pH gradient and an electrical charge difference.'
      },
      teacherScript: 'Here is where the real magic happens: the electron transport chain! Imagine the inner membrane as a massive hydroelectric dam. As electrons cascade down through Complexes I, III, and IV, the energy released is used to pump protons uphill into the intermembrane space. And why do we breathe oxygen? Because oxygen has the highest electronegativity—it pulls the electrons to the very end. Without oxygen, the entire conveyor belt jams!',
      scriptSegments: [
        {
          text: 'Here is where the real magic happens: the electron transport chain! Imagine the inner membrane as a massive hydroelectric dam.',
          focusBulletId: 'b3-1',
          teacherGesture: 'pointing'
        },
        {
          text: 'As electrons cascade down through Complexes I, III, and IV, the energy released is used to pump protons uphill into the intermembrane space.',
          focusBulletId: 'b3-1',
          teacherGesture: 'explaining'
        },
        {
          text: 'And why do we breathe oxygen? Because oxygen has the highest electronegativity—it pulls the electrons to the very end.',
          focusBulletId: 'b3-3',
          teacherGesture: 'writing'
        },
        {
          text: 'Without oxygen acting as the terminal acceptor, the entire electron conveyor belt jams in seconds.',
          focusBulletId: 'b3-3',
          teacherGesture: 'nodding'
        }
      ]
    },
    {
      id: 'slide-4',
      slideNumber: 4,
      totalSlides: 4,
      chapterTitle: 'Phase IV: The ATP Turbine',
      topicTitle: 'Chemiosmosis & The ATP Synthase Rotary Motor',
      subtitle: 'Peter Mitchell\'s Chemiosmotic Hypothesis in Action',
      blackboardSummarySnippet: 'H⁺ Proton Influx ➔ F₀ Rotor Spin ➔ F₁ Catalytic ATP Synthesis',
      estimatedDurationSeconds: 35,
      bullets: [
        {
          id: 'b4-1',
          heading: 'Chemiosmosis Mechanism',
          content: 'Protons cannot cross the lipid bilayer directly; they can only rush back through the central channel of ATP Synthase.',
          emphasis: 'Converts potential energy to kinetic work',
          highlightKeyword: 'chemiosmosis'
        },
        {
          id: 'b4-2',
          heading: 'A Biological Rotary Turbine',
          content: 'The F₀ subunit embedded in the membrane physically spins as protons bind, turning an internal shaft inside the catalytic F₁ headpiece.',
          emphasis: 'Genuine nanoscale molecular motor',
          highlightKeyword: 'rotary'
        },
        {
          id: 'b4-3',
          heading: 'Grand Energy Accounting',
          content: 'Each NADH yields ~2.5 ATP, while each FADH₂ yields ~1.5 ATP. The total haul per glucose reaches approximately 30 to 32 ATP.',
          emphasis: 'Efficiency rate of ~34% (superior to car engines)',
          highlightKeyword: 'yield'
        }
      ],
      calloutBox: {
        type: 'takeaway',
        title: 'Core Takeaway',
        text: 'Cellular respiration demonstrates nature\'s pinnacle of bioenergetics: turning chemical bonds into a proton battery, which then physically turns an electrical turbine to charge ATP!'
      },
      visualDiagram: {
        type: 'hierarchy',
        title: 'ATP Synthase Rotary Subunits',
        elements: [
          { id: 'f0', label: 'F₀ Subunit (Stator & Ring)', sublabel: 'Membrane-embedded rotor', badge: 'Proton Channel', color: 'sky' },
          { id: 'shaft', label: 'Central γ-Shaft', sublabel: 'Camshaft coupling rotation', badge: 'Mechanical Drive', color: 'amber' },
          { id: 'f1', label: 'F₁ Catalytic Head (α₃β₃)', sublabel: 'Three conformational states', badge: 'ADP + Pi ➔ ATP', color: 'emerald' },
          { id: 'yield', label: 'Final Net Yield', sublabel: '~32 ATP Total', badge: 'Complete Harvest', color: 'indigo' }
        ],
        connections: [
          { from: 'f0', to: 'shaft', label: 'spins shaft' },
          { from: 'shaft', to: 'f1', label: 'drives conformation' },
          { from: 'f1', to: 'yield', label: 'mass production' }
        ],
        summaryFootnote: 'Paul Boyer and John Walker received the Nobel Prize in Chemistry for elucidating this rotary binding-change mechanism.'
      },
      teacherScript: 'Finally, let us look at nature\'s most marvelous nanoscale engine: ATP Synthase. Those trapped protons want back into the matrix so badly! The only door open is through the F-zero rotor of ATP Synthase. As protons flow through, the rotor physically spins at thousands of revolutions per minute! That mechanical rotation forces ADP and inorganic phosphate together into fresh ATP. That is how your body produces over fifty kilograms of ATP every single day!',
      scriptSegments: [
        {
          text: 'Finally, let us look at nature\'s most marvelous nanoscale engine: ATP Synthase. Those trapped protons want back into the matrix so badly!',
          focusBulletId: 'b4-1',
          teacherGesture: 'pointing'
        },
        {
          text: 'As protons flow through, the F-zero rotor physically spins at thousands of revolutions per minute!',
          focusBulletId: 'b4-2',
          teacherGesture: 'writing'
        },
        {
          text: 'That mechanical rotation forces ADP and inorganic phosphate together into fresh, high-energy ATP.',
          focusBulletId: 'b4-2',
          teacherGesture: 'explaining'
        },
        {
          text: 'That is how your body produces over fifty kilograms of ATP every single day! Outstanding work today, class.',
          focusBulletId: 'b4-3',
          teacherGesture: 'nodding'
        }
      ]
    }
  ],
  quizzes: [
    {
      id: 'q-1',
      question: 'Where do the high-energy electrons transferred during cellular respiration ultimately end up?',
      options: [
        'They are accepted by Oxygen to form water (H₂O)',
        'They are pumped back into the intermembrane space as free radicals',
        'They combine with Carbon Dioxide to form glucose',
        'They remain permanently bound inside Complex I'
      ],
      correctAnswerIndex: 0,
      explanation: 'Oxygen acts as the final electron acceptor at Complex IV due to its high electronegativity, reacting with protons to form harmless water (H₂O).'
    },
    {
      id: 'q-2',
      question: 'What directly powers the rotation of the F₀ subunit rotor in ATP Synthase?',
      options: [
        'The rush of protons flowing down their electrochemical concentration gradient',
        'Direct combustion of glucose in the matrix',
        'Solar photons striking chlorophyll molecules',
        'Direct hydrolysis of GTP without proton involvement'
      ],
      correctAnswerIndex: 0,
      explanation: 'Chemiosmosis: Protons accumulated in the intermembrane space can only cross back through the F₀ channel, which mechanically rotates like a water turbine.'
    },
    {
      id: 'q-3',
      question: 'Why does one glucose molecule cause the Krebs (Citric Acid) Cycle to complete two full turns?',
      options: [
        'Because glycolysis splits one 6-carbon glucose into two 3-carbon pyruvates',
        'Because the mitochondrion requires a backup turn for security',
        'Because oxygen only binds on every alternate turn',
        'Because oxaloacetate contains 8 carbons initially'
      ],
      correctAnswerIndex: 0,
      explanation: 'One 6C glucose splits into two 3C pyruvates during glycolysis. Each pyruvate yields one Acetyl-CoA, thus powering two full turns of the Krebs wheel.'
    },
    {
      id: 'q-4',
      question: 'What is the net ATP yield produced directly by substrate-level phosphorylation in glycolysis alone?',
      options: [
        'Net +2 ATP (2 invested, 4 generated)',
        'Net +32 ATP total',
        '0 ATP (glycolysis does not yield ATP)',
        'Net +12 ATP'
      ],
      correctAnswerIndex: 0,
      explanation: 'Glycolysis has an energy investment phase consuming 2 ATP, followed by a payoff phase producing 4 ATP, resulting in a net profit of +2 ATP.'
    }
  ],
  flashcards: [
    {
      id: 'fc-1',
      front: 'Chemiosmosis',
      back: 'The movement of ions (protons) across a semipermeable membrane down their electrochemical gradient, used by ATP Synthase to generate ATP.',
      category: 'Bioenergetics'
    },
    {
      id: 'fc-2',
      front: 'Oxidative Phosphorylation',
      back: 'The metabolic pathway in which cells use enzymes to oxidize nutrients, releasing energy used to reform ATP via the Electron Transport Chain.',
      category: 'Metabolism'
    },
    {
      id: 'fc-3',
      front: 'ATP Synthase (F₀F₁)',
      back: 'A biological rotary nanomotor. F₀ rotates as protons flow through, and the central γ-shaft drives catalytic conformational changes in the F₁ head to synthesize ATP.',
      category: 'Molecular Machine'
    },
    {
      id: 'fc-4',
      front: 'Final Electron Acceptor',
      back: 'Molecular Oxygen (O₂). With the highest electronegativity in the chain, it pulls electrons through Complex IV and binds protons to yield H₂O.',
      category: 'Respiration'
    },
    {
      id: 'fc-5',
      front: 'Proton Motive Force (PMF)',
      back: 'The electrochemical potential energy stored across the inner mitochondrial membrane due to the unequal distribution of H⁺ ions.',
      category: 'Thermodynamics'
    }
  ]
};
