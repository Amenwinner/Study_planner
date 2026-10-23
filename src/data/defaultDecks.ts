import { SlideDeck } from '../types';

export const DEFAULT_DECKS: SlideDeck[] = [
  {
    id: 'deck-cs229-w7',
    title: 'Neural Networks, Backpropagation & Loss Optimization',
    course: 'CS229: Machine Learning & Deep Systems',
    weekNumber: 7,
    uploadDate: '2026-10-18',
    filename: 'Lecture_07_Neural_Nets_Backprop.pdf',
    fileType: 'pdf',
    summary: 'Explores multi-layer perceptrons, forward propagation, calculus of backpropagation using the chain rule, activation functions (ReLU, GELU, Sigmoid), and gradient descent variants including Adam optimizer.',
    keyTakeaways: [
      'Backpropagation efficiently computes the gradient of the loss function with respect to every weight using reverse-mode autodiff and chain rule.',
      'Activation functions introduce non-linearity, allowing neural networks to approximate arbitrary functions (Universal Approximation Theorem).',
      'The vanishing gradient problem in deep networks using sigmoid led to modern preference for ReLU and residual connections.',
      'Adam optimizer integrates both momentum (first moment) and RMSprop (second raw moment) for adaptive learning rates.'
    ],
    keyConcepts: [
      {
        term: 'Backpropagation',
        definition: 'Algorithm using reverse-mode automatic differentiation to calculate gradients of loss with respect to all network parameters layer by layer.',
        importance: 'high',
        memoryTip: 'Think "Chain Rule in reverse": compute error at output, send blame backward.'
      },
      {
        term: 'Vanishing Gradient Problem',
        definition: 'Phenomenon where backpropagated error gradients exponentially shrink toward zero in deep networks with saturating activations like sigmoid.',
        importance: 'high',
        memoryTip: 'Sigmoid derivative caps at 0.25; multiplying decimals (<1) repeatedly vanishes to ~0.'
      },
      {
        term: 'ReLU (Rectified Linear Unit)',
        definition: 'Activation function defined as f(x) = max(0, x), which avoids saturation for positive inputs and accelerates convergence.',
        importance: 'high',
        memoryTip: 'Straight ramp for positive numbers, flat zero for negatives.'
      },
      {
        term: 'Adam Optimizer',
        definition: 'Adaptive learning rate optimization algorithm combining momentum (moving average of gradients) and RMSprop (moving average of squared gradients).',
        importance: 'medium',
        memoryTip: 'Adam = Adaptive Moment estimation (1st moment + 2nd moment).'
      },
      {
        term: 'Cross-Entropy Loss',
        definition: 'Loss function measuring the performance of a classification model whose output is a probability value between 0 and 1.',
        importance: 'medium',
        memoryTip: 'Penalizes confident wrong guesses with massive logarithmic penalties.'
      }
    ],
    flashcards: [
      {
        id: 'fc-cs-1',
        deckId: 'deck-cs229-w7',
        front: 'What mathematical principle forms the backbone of the Backpropagation algorithm?',
        back: 'The multivariable Calculus Chain Rule. It allows computing the partial derivative of the scalar loss with respect to weight matrices in preceding layers by propagating error signals backwards.',
        category: 'Calculus / Optimization',
        difficulty: 'medium',
        mnemonicOrTip: 'Chain Rule: dL/dw = (dL/dy) * (dy/dz) * (dz/dw)',
        masteryStatus: 'learning',
        repetitions: 2
      },
      {
        id: 'fc-cs-2',
        deckId: 'deck-cs229-w7',
        front: 'Why did deep networks struggle before ReLU became standard?',
        back: 'Sigmoid and Tanh activations suffer from the vanishing gradient problem. The derivative of sigmoid maxes out at 0.25; repeatedly multiplying fractions through 10+ layers drives the gradients to near-zero.',
        category: 'Architectures',
        difficulty: 'medium',
        mnemonicOrTip: '0.25^10 = 0.00000095 — weights in early layers receive no signal to update!',
        masteryStatus: 'mastered',
        repetitions: 5
      },
      {
        id: 'fc-cs-3',
        deckId: 'deck-cs229-w7',
        front: 'What is the "Dying ReLU" problem and how is it mitigated?',
        back: 'When inputs fall into the negative regime (x < 0), ReLU output is 0 and gradient is 0. If a neuron persistently receives negative activations, its weights never update. Mitigated by Leaky ReLU, Parametric ReLU (PReLU), or ELU.',
        category: 'Activation Functions',
        difficulty: 'hard',
        mnemonicOrTip: 'Leaky ReLU gives negative inputs a slight slope (e.g. 0.01x) so it never completely dies.',
        masteryStatus: 'review',
        repetitions: 1
      },
      {
        id: 'fc-cs-4',
        deckId: 'deck-cs229-w7',
        front: 'What does the momentum parameter in Gradient Descent achieve physically?',
        back: 'It acts like a heavy ball rolling down a hilly surface, dampening oscillations in high-curvature directions and accelerating progress along shallow ravines.',
        category: 'Optimization',
        difficulty: 'easy',
        mnemonicOrTip: 'Momentum builds inertia: retains a fraction of previous velocity.',
        masteryStatus: 'new',
        repetitions: 0
      },
      {
        id: 'fc-cs-5',
        deckId: 'deck-cs229-w7',
        front: 'How does Batch Normalization stabilize deep network training?',
        back: 'It normalizes layer inputs across the mini-batch to have zero mean and unit variance (scaled and shifted by learnable parameters gamma and beta), mitigating internal covariate shift.',
        category: 'Regularization',
        difficulty: 'hard',
        mnemonicOrTip: 'Normalizes each mini-batch so deep layers do not constantly chase moving targets.',
        masteryStatus: 'learning',
        repetitions: 2
      },
      {
        id: 'fc-cs-6',
        deckId: 'deck-cs229-w7',
        front: 'What is the primary difference between L1 (Lasso) and L2 (Ridge) weight regularization?',
        back: 'L1 adds the sum of absolute weight values and drives weights strictly to zero (inducing sparsity / feature selection). L2 adds sum of squared weights and shrinks weights toward zero without forcing exact zeros.',
        category: 'Regularization',
        difficulty: 'medium',
        mnemonicOrTip: 'L1 = Lines & corners (hits zero axis). L2 = Circles/spheres (smooth decay).',
        masteryStatus: 'new',
        repetitions: 0
      }
    ],
    quizQuestions: [
      {
        id: 'q-cs-1',
        deckId: 'deck-cs229-w7',
        type: 'multiple-choice',
        question: 'Which of the following activation functions is LEAST susceptible to vanishing gradients during backpropagation?',
        options: [
          'Sigmoid function: σ(x) = 1 / (1 + e^-x)',
          'Hyperbolic tangent: tanh(x)',
          'Rectified Linear Unit: ReLU(x) = max(0, x)',
          'Softmax function'
        ],
        correctAnswer: 'Rectified Linear Unit: ReLU(x) = max(0, x)',
        explanation: 'For any positive value of x, the derivative of ReLU is exactly 1.0. This prevents the gradient from diminishing as it propagates through many layers, unlike sigmoid whose maximum derivative is 0.25.',
        conceptTested: 'Vanishing Gradients & Activation Functions',
        difficulty: 'medium'
      },
      {
        id: 'q-cs-2',
        deckId: 'deck-cs229-w7',
        type: 'multiple-choice',
        question: 'In the Adam optimizer, what is the role of the second moment estimation (v_t)?',
        options: [
          'It tracks the exponential moving average of squared gradients to adapt per-parameter learning rates.',
          'It computes the Hessian matrix for second-order Newton-Raphson optimization.',
          'It adds Gaussian noise to escape saddle points.',
          'It strictly prevents weights from exceeding unit norm.'
        ],
        correctAnswer: 'It tracks the exponential moving average of squared gradients to adapt per-parameter learning rates.',
        explanation: 'Adam combines first-moment momentum with second-moment scaling (RMSprop-style). Dividing by the square root of v_t scales down updates for frequently updated parameters and scales up updates for infrequent parameters.',
        conceptTested: 'Adam Optimizer Mechanics',
        difficulty: 'hard'
      },
      {
        id: 'q-cs-3',
        deckId: 'deck-cs229-w7',
        type: 'multiple-choice',
        question: 'What happens if all weights in a multilayer feedforward neural network are initialized to the exact same constant value (e.g. 0 or 1)?',
        options: [
          'The network converges twice as fast due to symmetry.',
          'All neurons in the same layer compute identical gradients and fail to break symmetry.',
          'The loss immediately explodes to infinity.',
          'Only the bias units will receive non-zero updates.'
        ],
        correctAnswer: 'All neurons in the same layer compute identical gradients and fail to break symmetry.',
        explanation: 'Symmetry problem: When weights are identical, every hidden unit calculates the exact same activation and receives the exact same gradient during backpropagation, effectively behaving as a single neuron.',
        conceptTested: 'Weight Initialization & Symmetry Breaking',
        difficulty: 'medium'
      },
      {
        id: 'q-cs-4',
        deckId: 'deck-cs229-w7',
        type: 'true-false',
        question: 'True or False: Dropout is applied during both training forward passes and standard inference/testing.',
        options: ['True', 'False'],
        correctAnswer: 'False',
        explanation: 'Dropout randomly deactivates neurons during training to prevent co-adaptation. During inference, all neurons are kept active, and weights are scaled (or inverted dropout was applied during training) to preserve expected activation magnitudes.',
        conceptTested: 'Dropout Regularization',
        difficulty: 'easy'
      }
    ],
    studyPlan: [
      { day: 'Monday', focus: 'Forward & Backprop Derivation', action: 'Work through the matrix calculus chain rule on paper for a 2-layer MLP', estimatedMinutes: 35 },
      { day: 'Tuesday', focus: 'Activation Functions Drill', action: 'Review 6 flashcards on ReLU, Dying ReLU, GELU, and Sigmoid', estimatedMinutes: 20 },
      { day: 'Wednesday', focus: 'Practice Quiz 1', action: 'Complete 8 diagnostic questions and review remediation notes', estimatedMinutes: 25 },
      { day: 'Thursday', focus: 'Optimizers Deep Dive', action: 'Compare SGD with Momentum vs Adam vs RMSprop', estimatedMinutes: 30 },
      { day: 'Friday', focus: 'Full Deck Active Recall', action: 'Review all starred flashcards and test confidence ratings', estimatedMinutes: 25 },
      { day: 'Weekend', focus: 'Exam Simulation', action: 'Take full timed quiz with AI scoring report', estimatedMinutes: 30 }
    ],
    isPreloaded: true
  },
  {
    id: 'deck-bio101-w4',
    title: 'Cellular Respiration, Glycolysis & Chemiosmotic ATP Synthesis',
    course: 'BIOL101: Principles of Cellular Biology',
    weekNumber: 4,
    uploadDate: '2026-10-15',
    filename: 'Lecture_04_Respiration_Mitochondria.pdf',
    fileType: 'pdf',
    summary: 'Detailed examination of eukaryotic cellular metabolism: Glycolysis in the cytosol, Pyruvate oxidation, the Citric Acid (Krebs) cycle in the mitochondrial matrix, and the Electron Transport Chain with Chemiosmosis driven by ATP Synthase.',
    keyTakeaways: [
      'Cellular respiration produces ~30-32 net ATP per glucose molecule through substrate-level and oxidative phosphorylation.',
      'Glycolysis is an anaerobic pathway yielding 2 pyruvate, 2 net ATP, and 2 NADH per glucose.',
      'The electron transport chain creates an electrochemical proton gradient (proton-motive force) across the inner mitochondrial membrane.',
      'Oxygen serves as the final electron acceptor in the electron transport chain, forming H2O.'
    ],
    keyConcepts: [
      {
        term: 'Chemiosmosis',
        definition: 'Process where energy stored in a proton gradient across a membrane is used to synthesize ATP via ATP synthase rotary catalysis.',
        importance: 'high',
        memoryTip: 'Protons rush down their electrochemical gradient like water through a dam turbine.'
      },
      {
        term: 'Electron Transport Chain (ETC)',
        definition: 'Series of multi-protein complexes (I to IV) embedded in the inner mitochondrial membrane that transfer electrons from NADH/FADH2 to oxygen while pumping H+ into the intermembrane space.',
        importance: 'high',
        memoryTip: 'Electrons pass like hot potatoes down energy steps; protons get pumped outside.'
      },
      {
        term: 'Substrate-Level Phosphorylation',
        definition: 'Direct enzymatic transfer of a phosphate group from an organic substrate to ADP (occurs in Glycolysis and Krebs Cycle).',
        importance: 'medium',
        memoryTip: 'Direct handoff of phosphate without an electron transport chain.'
      },
      {
        term: 'Proton-Motive Force',
        definition: 'The combination of pH gradient (chemical) and membrane potential (electrical) across the inner mitochondrial membrane.',
        importance: 'high',
        memoryTip: 'High H+ concentration outside makes the intermembrane space acidic and positively charged.'
      }
    ],
    flashcards: [
      {
        id: 'fc-bio-1',
        deckId: 'deck-bio101-w4',
        front: 'What is the net yield of products from one molecule of glucose during Glycolysis?',
        back: '2 Pyruvate, 2 net ATP (4 produced minus 2 consumed in energy investment phase), and 2 NADH + 2 H+.',
        category: 'Glycolysis',
        difficulty: 'easy',
        mnemonicOrTip: '2-2-2 Rule: 2 Pyruvate, 2 ATP, 2 NADH',
        masteryStatus: 'mastered',
        repetitions: 4
      },
      {
        id: 'fc-bio-2',
        deckId: 'deck-bio101-w4',
        front: 'Where does each stage of cellular respiration take place in eukaryotic cells?',
        back: '• Glycolysis: Cytosol\n• Pyruvate Oxidation & Citric Acid Cycle: Mitochondrial Matrix\n• Oxidative Phosphorylation (ETC): Inner Mitochondrial Membrane',
        category: 'Cellular Geography',
        difficulty: 'medium',
        mnemonicOrTip: 'Cytosol -> Matrix -> Inner Membrane folds (Cristae)',
        masteryStatus: 'learning',
        repetitions: 2
      },
      {
        id: 'fc-bio-3',
        deckId: 'deck-bio101-w4',
        front: 'What is the exact biological consequence if Oxygen is absent in human cells?',
        back: 'The electron transport chain stalls because oxygen is the terminal electron acceptor. NADH cannot unload electrons, matrix NAD+ depletes, and cells shift to Lactic Acid Fermentation to regenerate NAD+ for glycolysis.',
        category: 'Metabolic Regulation',
        difficulty: 'hard',
        mnemonicOrTip: 'Fermentation does NOT create ATP itself; its purpose is solely to regenerate NAD+ so glycolysis can run.',
        masteryStatus: 'review',
        repetitions: 1
      },
      {
        id: 'fc-bio-4',
        deckId: 'deck-bio101-w4',
        front: 'Why does 1 FADH2 yield fewer ATP than 1 NADH?',
        back: 'NADH delivers its electrons at Complex I (pumping protons across Complexes I, III, and IV). FADH2 delivers its electrons at Complex II (which does not pump protons), resulting in fewer total pumped protons.',
        category: 'Biochemistry / Energetics',
        difficulty: 'hard',
        mnemonicOrTip: 'NADH = Complex I (~2.5 ATP). FADH2 = skips Complex I to Complex II (~1.5 ATP).',
        masteryStatus: 'new',
        repetitions: 0
      }
    ],
    quizQuestions: [
      {
        id: 'q-bio-1',
        deckId: 'deck-bio101-w4',
        type: 'multiple-choice',
        question: 'During oxidative phosphorylation, where do protons (H+) accumulate to generate the electrochemical gradient?',
        options: [
          'In the mitochondrial intermembrane space',
          'In the mitochondrial matrix',
          'In the cytosol outside the organelle',
          'Inside the endoplasmic reticulum lumen'
        ],
        correctAnswer: 'In the mitochondrial intermembrane space',
        explanation: 'Complexes I, III, and IV pump protons out of the matrix and into the narrow intermembrane space, creating a steep chemical (low pH) and electrical (+ charge) gradient.',
        conceptTested: 'Proton Gradient & Membrane Topology',
        difficulty: 'medium'
      },
      {
        id: 'q-bio-2',
        deckId: 'deck-bio101-w4',
        type: 'multiple-choice',
        question: 'Which enzyme is widely regarded as the primary rate-limiting "pacemaker" of glycolysis, inhibited by high levels of ATP and citrate?',
        options: [
          'Phosphofructokinase-1 (PFK-1)',
          'Hexokinase',
          'Pyruvate Kinase',
          'Citrate Synthase'
        ],
        correctAnswer: 'Phosphofructokinase-1 (PFK-1)',
        explanation: 'PFK-1 catalyzes the irreversible commitment step of glycolysis (fructose-6-P to fructose-1,6-bisP). When energy is abundant (high ATP/citrate), allosteric inhibition stops wasting glucose.',
        conceptTested: 'Glycolytic Regulation & Allosteric Control',
        difficulty: 'hard'
      }
    ],
    studyPlan: [
      { day: 'Monday', focus: 'Mitochondrial Anatomy & Glycolysis', action: 'Draw out carbon counts for glucose to pyruvate', estimatedMinutes: 30 },
      { day: 'Tuesday', focus: 'Krebs Cycle & Electron Carriers', action: 'Review 8 flashcards on NADH, FADH2, and CO2 release', estimatedMinutes: 20 },
      { day: 'Wednesday', focus: 'ETC Complexes & Inhibitors', action: 'Test understanding of cyanide, oligomycin, and DNP effects', estimatedMinutes: 30 },
      { day: 'Thursday', focus: 'Weekly Quiz & Review', action: 'Complete 10 question quiz and analyze explanations', estimatedMinutes: 25 }
    ],
    isPreloaded: true
  }
];
