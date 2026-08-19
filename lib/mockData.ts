export interface Course {
  id: string;
  slug: string;
  title: string;
  category: 'Cálculo' | 'Álgebra Lineal' | 'Ecuaciones Diferenciales' | 'Topología' | 'Multivariable';
  level: 'Pregrado' | 'Intermedio' | 'Avanzado';
  description: string;
  mathFormulaLatex: string;
  modulesCount: number;
  durationHours: number;
  featured: boolean;
  imageBg: string;
  chapters: string[];
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  content: string;
  date: string;
  readTime: string;
  author: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface SubjectItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  iconClass: string;
  latexFormula?: string;
}

export const MOCK_SUBJECTS: SubjectItem[] = [
  {
    id: 'intro-calculo',
    slug: 'introduccion-calculo',
    title: 'Introducción al Cálculo',
    description: 'Fundamentos matemáticos, funciones, límites, continuidad, sucesiones. La base crítica para toda la matemática superior.',
    iconClass: 'fa-solid fa-plus-minus'
  },
  {
    id: 'intro-algebra',
    slug: 'introduccion-algebra',
    title: 'Introducción al Álgebra',
    description: 'Fundamentos algebraicos, inducción, sumatorias, binomio de newton, números complejos, polinomios y geometría analítica.',
    iconClass: 'fa-solid fa-square-root-variable'
  },
  {
    id: 'calculo-diferencial',
    slug: 'calculo-diferencial',
    title: 'Cálculo Diferencial',
    description: 'Estudio de la derivada, razones de cambio, optimización y trazado de curvas. Entendimiento visual e intuitivo.',
    iconClass: 'fa-solid fa-chart-line'
  },
  {
    id: 'calculo-integral',
    slug: 'calculo-integral',
    title: 'Cálculo Integral',
    description: 'La integral definida, técnicas de integración, áreas, volúmenes e integrales impropias. Estrategias efectivas de resolución.',
    iconClass: 'fa-solid fa-calculator'
  },
  {
    id: 'algebra-lineal',
    slug: 'algebra-lineal',
    title: 'Álgebra Lineal',
    description: 'Matrices, sistemas de ecuaciones, espacios vectoriales, transformaciones lineales, autovalores y autovectores.',
    iconClass: 'fa-solid fa-border-all'
  },
  {
    id: 'calculo-multivariable',
    slug: 'calculo-multivariable',
    title: 'Cálculo Multivariable',
    description: 'Cálculo en varias variables: límites, derivadas parciales, integrales dobles y triples, y teoremas de Green, Stokes y Gauss.',
    iconClass: 'fa-solid fa-layer-group'
  },
  {
    id: 'ecuaciones-diferenciales',
    slug: 'ecuaciones-diferenciales',
    title: 'Ecuaciones Diferenciales Ordinarias',
    description: 'Ecuaciones diferenciales ordinarias de primer y segundo orden, transformada de Laplace y modelación matemática.',
    iconClass: 'fa-solid fa-bezier-curve'
  },
  {
    id: 'topologia-rn',
    slug: 'topologia-rn',
    title: 'Topología en \\mathbb{R}^n',
    description: 'Espacios métricos, conjuntos abiertos y cerrados, compacidad, conexidad y continuidad en \\mathbb{R}^n.',
    iconClass: 'fa-solid fa-diagram-project'
  },
  {
    id: 'calculo-avanzado',
    slug: 'calculo-avanzado',
    title: 'Cálculo Avanzado',
    description: 'Series de Fourier, variables complejas, análisis vectorial avanzado y aplicaciones avanzadas de ingeniería.',
    iconClass: 'fa-solid fa-infinity'
  }
];

export const MOCK_COURSES: Course[] = [
  {
    id: 'c1',
    slug: 'calculo-diferencial',
    title: 'Cálculo Diferencial',
    category: 'Cálculo',
    level: 'Pregrado',
    description: 'Curso fundamental estructurado desde los límites en \\varepsilon - \\delta hasta derivadas, recta tangente, optimización y aplicaciones.',
    mathFormulaLatex: 'f\'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}',
    modulesCount: 6,
    durationHours: 32,
    featured: true,
    imageBg: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(99, 102, 241, 0.3) 100%)',
    chapters: [
      'Límites, Continuidad y Teorema del Valor Intermedio',
      'Derivadas, Regla de la Cadena e Implícita',
      'Optimización y Trazado Curvilíneo',
      'La Integral Definida y Sumas de Riemann',
      'Métodos Avanzados de Integración',
      'Integrales Impropias y Criterios de Convergencia'
    ]
  },
  {
    id: 'c2',
    slug: 'algebra-lineal',
    title: 'Álgebra Lineal',
    category: 'Álgebra Lineal',
    level: 'Intermedio',
    description: 'Comprensión conceptual y geométrica profunda de subespacios vectoriales, bases, dimensión, ortogonalización de Gram-Schmidt y diagonalización de matrices.',
    mathFormulaLatex: 'A\\mathbf{v} = \\lambda \\mathbf{v} \\quad \\implies \\quad \\det(A - \\lambda I) = 0',
    modulesCount: 5,
    durationHours: 28,
    featured: true,
    imageBg: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.3) 100%)',
    chapters: [
      'Sistemas de Ecuaciones y Operaciones Matriciales',
      'Espacios y Subespacios Vectoriales',
      'Transformaciones Lineales y Núcleo/Imagen',
      'Producto Interno y Proyecciones Ortogonales',
      'Valores, Vectores Propios y Diagonalización'
    ]
  },
  {
    id: 'c3',
    slug: 'calculo-multivariable',
    title: 'Cálculo Multivariable',
    category: 'Multivariable',
    level: 'Avanzado',
    description: 'Estudio de funciones de varias variables, derivadas parciales, optimización con multiplicadores de Lagrange, integrales múltiples y teoremas vectoriales de Green, Gauss y Stokes.',
    mathFormulaLatex: '\\iint_{S} (\\nabla \\times \\mathbf{F}) \\cdot d\\mathbf{S} = \\oint_{C} \\mathbf{F} \\cdot d\\mathbf{r}',
    modulesCount: 6,
    durationHours: 36,
    featured: true,
    imageBg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(6, 182, 212, 0.3) 100%)',
    chapters: [
      'Geometría Analítica en \\mathbb{R}^3 y Funciones Vectoriales',
      'Derivadas Parciales, Gradiente y Dirección',
      'Optimización y Multiplicadores de Lagrange',
      'Integrales Dobles y Triples en Diferentes Coordenadas',
      'Campos Vectoriales e Integrales de Línea',
      'Teoremas Integrales de Green, Stokes y Divergencia'
    ]
  },
  {
    id: 'c4',
    slug: 'ecuaciones-diferenciales',
    title: 'Ecuaciones Diferenciales Ordinarias',
    category: 'Ecuaciones Diferenciales',
    level: 'Intermedio',
    description: 'Resolución de EDOs de 1er y 2do orden, coeficientes indeterminados, variación de parámetros, transformada de Laplace y modelación de sistemas dinámicos.',
    mathFormulaLatex: '\\mathcal{L}\\{f\'\'(t)\\} = s^2 F(s) - s f(0) - f\'(0)',
    modulesCount: 5,
    durationHours: 30,
    featured: false,
    imageBg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(239, 68, 68, 0.3) 100%)',
    chapters: [
      'EDO de Primer Orden (Variables Separables, Exactas, Lineales)',
      'EDO Lineales de Orden Superior',
      'Transformada de Laplace y Propiedades',
      'Sistemas de Ecuaciones Diferenciales Lineales',
      'Modelación de Sistemas Físicos e Ingeniería'
    ]
  },
  {
    id: 'c5',
    slug: 'topologia-rn',
    title: 'Topología en \\mathbb{R}^n',
    category: 'Topología',
    level: 'Avanzado',
    description: 'Curso riguroso para matemáticas y ciencias puras: espacios métricos, conjuntos abiertos/cerrados, compacidad por cubrimientos y conexidad.',
    mathFormulaLatex: 'd(x, z) \\le d(x, y) + d(y, z), \\quad \\forall x,y,z \\in X',
    modulesCount: 4,
    durationHours: 24,
    featured: false,
    imageBg: 'linear-gradient(135deg, rgba(217, 70, 239, 0.2) 0%, rgba(99, 102, 241, 0.3) 100%)',
    chapters: [
      'Definición de Espacios Métricos y Distancias',
      'Bolas Abiertas, Puntos Interiores y Conjuntos Abiertos',
      'Sucesiones, Convergencia y Espacios Completos',
      'Compacidad (Heine-Borel) y Conexidad'
    ]
  }
];

export const MOCK_BLOG_POSTS: BlogPost[] = [
  {
    id: 'post-1',
    slug: 'intuicion-geometrica-suma-riemann',
    title: 'La Intuición Geométrica Detrás de las Sumas de Riemann',
    category: 'Cálculo Integral',
    date: '2026-06-15',
    readTime: '6 min',
    author: 'Dr. Álvaro Hernández',
    excerpt: '¿Por qué la aproximación de rectángulos converge al área exacta bajo la curva? Analizamos visualmente el concepto de límite cuando el ancho del intervalo tiende a cero.',
    content: `
      <p>Uno de los mayores desafíos al estudiar Cálculo Integral por primera vez es comprender por qué la suma finita de áreas de rectángulos se transforma mágicamente en el área exacta encerrada por una curva continua.</p>
      
      <h3>1. La Construcción de Riemann</h3>
      <p>Consideremos una función continua $f:[a,b] \\to \\mathbb{R}$. Al dividir el intervalo $[a,b]$ en $n$ subintervalos de ancho $\\Delta x = \\frac{b-a}{n}$, elegimos un punto muestral $x_i^*$ en cada subintervalo $[x_{i-1}, x_i]$.</p>
      
      <p>La suma de Riemann se define como:</p>
      <div style="text-align: center; margin: 20px 0; font-size: 1.1em; background: rgba(99,102,241,0.1); padding: 15px; border-radius: 8px;">
        $$S_n = \\sum_{i=1}^{n} f(x_i^*) \\Delta x$$
      </div>

      <h3>2. El Paso al Límite</h3>
      <p>Cuando $n \\to \\infty$, el número de rectángulos crece indefinidamente mientras su base $\\Delta x \\to 0$. Bajo la condición de integrabilidad de Riemann, este límite existe y se denota mediante el símbolo de integración:</p>
      
      <p>$$\\int_{a}^{b} f(x)\\,dx = \\lim_{n \\to \\infty} \\sum_{i=1}^{n} f(x_i^*) \\Delta x$$</p>

      <h3>3. Consejos Prácticos para Exámenes</h3>
      <ul>
        <li>Distingue siempre entre la suma izquierda, derecha y del punto medio.</li>
        <li>Recuerda que para funciones monótonas crecientes, la suma por la derecha sobreestima el área real.</li>
        <li>Utiliza la interpretación geométrica para verificar el signo del resultado antes de hacer álgebra.</li>
      </ul>
    `
  },
  {
    id: 'post-2',
    slug: 'diagonalizacion-matrices-explicada',
    title: 'Diagonalización de Matrices: ¿Por Qué es Tan Importante?',
    category: 'Álgebra Lineal',
    date: '2026-05-28',
    readTime: '8 min',
    author: 'Dr. Álvaro Hernández',
    excerpt: 'Una explicación clara de cómo la matriz de cambio de base transforma un operador complejo en una multiplicación por escalares a lo largo de los ejes de los autovectores.',
    content: `
      <p>En Álgebra Lineal, diagonalizar una matriz $A \\in \\mathbb{R}^{n \\times n}$ consiste en expresarla en la forma:</p>
      <p>$$A = P D P^{-1}$$</p>
      <p>donde $D$ es una matriz diagonal que contiene los autovalores $\\lambda_1, \\dots, \\lambda_n$, y $P$ es la matriz cuyas columnas son los autovectores correspondientes.</p>
      
      <h3>¿Para qué sirve en la práctica?</h3>
      <p>Calcular la potencia $A^{100}$ de una matriz común requiere miles de multiplicaciones. Sin embargo, si la matriz es diagonalizable:</p>
      <p>$$A^{100} = P D^{100} P^{-1}$$</p>
      <p>lo cual se reduce a elevar cada escalar $\\lambda_i$ a la potencia 100.</p>
    `
  },
  {
    id: 'post-3',
    slug: 'estrategia-preparacion-certamenes-matematica',
    title: 'Guía de Estudio Efectiva para Certámenes de Exigencia Universitaria',
    category: 'Metodología',
    date: '2026-04-10',
    readTime: '5 min',
    author: 'Dr. Álvaro Hernández',
    excerpt: 'Recomendaciones pedagógicas basadas en 10+ años de experiencia docente para estructurar tu estudio, evitar bloqueos en certámenes y dominar demostraciones.',
    content: `
      <p>Estudiar matemática universitaria no es memorizar fórmulas, sino entrenar la capacidad de razonamiento deductivo bajo presión.</p>
      
      <h3>Principios Clave:</h3>
      <ol>
        <li><strong>Escribe cada paso con justificación teórica:</strong> No saltes pasos algebraicos sin saber qué propiedad estás aplicando.</li>
        <li><strong>Estudia activamente:</strong> Resolver un ejercicio con la pauta al lado da una falsa sensación de dominio. Intenta resolverlo sin mirar la solución.</li>
        <li><strong>Identifica patrones de error:</strong> Mantén un cuaderno de fallos frecuentes para revisar 24 horas antes de cada certamen.</li>
      </ol>
    `
  }
];
