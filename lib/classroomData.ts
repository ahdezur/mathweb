import type { PracticeExercise } from '@/components/classroom/InteractivePractice';

export interface ProblemItem {
  id?: string;
  problem: string;
  pauta: string;
  dificultad?: 'Básico' | 'Medio' | 'Alto';
  conceptos?: string[];
  habilidades?: string[];
}

export interface FormulaItem {
  label: string;
  latex: string;
  description?: string;
}

export interface ChapterData {
  id: string;
  number: number;
  displayNumber?: string;
  title: string;
  summary: string;
  mathKey: string;
  motivacion: string;
  teoria: string;
  practica: {
    text: string;
    videoUrl?: string;
    pdfUrl?: string;
    exercises?: PracticeExercise[];
  };
  ejercicios: {
    problems: (string | ProblemItem)[];
    formulasClave: FormulaItem[];
  };
}

export interface UnitData {
  id: string;
  number: number;
  title: string;
  summary?: string;
  chapters: ChapterData[];
}

export interface CourseContent {
  id: string;
  slug: string;
  number?: number;
  title: string;
  category: string;
  level: string;
  description: string;
  mathFormulaLatex?: string;
  units: UnitData[];
  chapters: ChapterData[];
}

const CALCULO_DIFERENCIAL_COURSE: CourseContent = {
  id: 'c1',
  slug: 'calculo-diferencial',
  title: 'Cálculo Diferencial',
  category: 'Cálculo',
  level: 'Pregrado',
  description: 'Curso completo de cálculo diferencial de una variable para carreras de ingeniería.',
    units: [
      {
        id: 'u-1',
        number: 1,
        title: 'Unidad 1: Fundamentos y Reglas de Derivación',
        summary: 'Concepto de razón de cambio instantánea, límites e intuición geométrica de la recta tangente.',
        chapters: [
          {
            id: 'cap-1',
            number: 1,
            title: 'Derivada y Recta Tangente: Intuición Geométrica',
            summary: 'Concepto de razón de cambio instantánea y aproximación lineal mediante la recta secante.',
            mathKey: '\\frac{dy}{dx} = \\lim_{\\Delta x \\to 0} \\frac{f(x + \\Delta x) - f(x)}{\\Delta x}',
            motivacion: `
              <h3>¿Por qué estudiamos la Derivada?</h3>
              <p>En ingeniería y física, la mayoría de los fenómenos dinámicos no ocurren a velocidad constante. La velocidad de un cohete espacial en ascenso, la tasa de enfriamiento de un motor térmico o la oscilación armónica de un puente frente a ráfagas de viento se caracterizan por <strong>razones de cambio instantáneas</strong> que varían segundo a segundo.</p>
              <p>La derivada nos proporciona el lenguaje matemático preciso para cuantificar cómo responde una variable dependiente frente a perturbaciones infinitesimales en sus parámetros de control.</p>

              <div style="background: rgba(6,182,212,0.1); border-left: 5px solid #06b6d4; padding: 20px 24px; border-radius: 16px; margin: 28px 0;">
                <strong>Aplicación en Ingeniería:</strong> Optimización de trayectorias aeroespaciales, análisis de respuesta transitoria en circuitos RLC (corriente $i(t) = \\frac{dq}{dt}$) y modelos de crecimiento logístico en dinámica de poblaciones.
              </div>

              <h3>Intuición Geométrica: De la Secante a la Tangente</h3>
              <p>Imaginemos una curva arbitraria $y = f(x)$ en el plano cartesiano. Si tomamos dos puntos distintos $P(x_0, f(x_0))$ y $Q(x_0 + \\Delta x, f(x_0 + \\Delta x))$, la recta que pasa por ambos puntos es una <em>recta secante</em> cuya pendiente representa la tasa de cambio promedio:</p>

              <div style="text-align: center; margin: 24px 0; font-size: 1.15em;">
                $$m_{\\text{sec}} = \\frac{f(x_0 + \\Delta x) - f(x_0)}{\\Delta x}$$
              </div>

              <p>A medida que el incremento $\\Delta x$ tiende a cero, el punto $Q$ se desplaza a lo largo de la curva aproximándose indefinidamente al punto $P$. En el límite cuando $\\Delta x \\to 0$, la recta secante se transforma en la <strong>recta tangente</strong> a la curva en el punto $P$. La pendiente de esta recta es la <em>derivada</em> $f'(x_0)$.</p>

              <h3>Interpretación Física y Modelación de Procesos</h3>
              <p>En el estudio del movimiento unidimensional, si $s(t)$ representa la posición de una partícula en el tiempo $t$:</p>
              <ul style="padding-left: 24px; display: flex; flex-direction: column; gap: 10px; margin: 20px 0;">
                <li><strong>Velocidad Instantánea:</strong> $v(t) = s'(t) = \\frac{ds}{dt}$, que indica la rapidez y dirección del movimiento en cada instante.</li>
                <li><strong>Aceleración Instantánea:</strong> $a(t) = v'(t) = s''(t) = \\frac{d^2s}{dt^2}$, que cuantifica el cambio de velocidad por unidad de tiempo.</li>
                <li><strong>Tirón o Jerk:</strong> $j(t) = a'(t) = s'''(t)$, crucial en el diseño de transporte ferroviario de alta velocidad para garantizar el confort de los pasajeros.</li>
              </ul>

              <div style="background: rgba(99,102,241,0.08); border-left: 5px solid #6366f1; padding: 20px 24px; border-radius: 16px; margin: 28px 0;">
                <strong>Nota de Modelación:</strong> Cuando una magnitud física crece o decrece a una tasa proporcional a su valor actual (como la desintegración radiactiva o el interés compuesto), la ecuación diferencial fundamental resultante es $\\frac{dy}{dt} = k \\cdot y$.
              </div>

              <p>Comprender esta transición conceptual del promediado continuo al límite instantáneo es la piedra angular que permite a los ingenieros abordar problemas de cálculo avanzado, teoría de control autoguiado y simulación computacional de fluidos.</p>
            `,
            teoria: `
              <h3>Definición Rigurosa de Derivada</h3>
              <p>Sea $f: I \\subset \\mathbb{R} \\to \\mathbb{R}$ una función definida en un intervalo abierto $I$. Decimos que $f$ es diferenciable en $x_0 \\in I$ si el siguiente límite existe y es finito:</p>
              
              <div style="text-align: center; margin: 20px 0; font-size: 1.15em;">
                $$f'(x_0) = \\lim_{h \\to 0} \\frac{f(x_0 + h) - f(x_0)}{h}$$
              </div>

              <h3>Ecuación de la Recta Tangente</h3>
              <p>La recta tangente a la gráfica de $y = f(x)$ en el punto $(x_0, f(x_0))$ viene dada por:</p>
              <p>$$y - f(x_0) = f'(x_0)(x - x_0)$$</p>

              <h3>Teorema: Diferenciabilidad e Implica Continuidad</h3>
              <p>Si una función $f$ es diferenciable en $x_0$, entonces $f$ es continua en $x_0$. El reciproco no necesariamente se cumple (ejemplo: $f(x) = |x|$ en $x=0$).</p>
            `,
            practica: {
              text: `
                <h3>Ejemplo Resuelto Paso a Paso</h3>
                <p><strong>Problema:</strong> Calcule la derivada de la función $f(x) = x^2 + 3x$ directamente a partir de la definición de límite.</p>
                
                <p><strong>Solución:</strong></p>
                <ol style="padding-left: 20px; display: flex; flex-direction: column; gap: 8px;">
                  <li>Evaluamos $f(x+h) = (x+h)^2 + 3(x+h) = x^2 + 2xh + h^2 + 3x + 3h$.</li>
                  <li>Formamos la diferencia: $f(x+h) - f(x) = (x^2 + 2xh + h^2 + 3x + 3h) - (x^2 + 3x) = 2xh + h^2 + 3h$.</li>
                  <li>Dividimos por $h \\neq 0$: $\\frac{2xh + h^2 + 3h}{h} = 2x + h + 3$.</li>
                  <li>Tomamos el límite cuando $h \\to 0$: $\\lim_{h \\to 0} (2x + h + 3) = 2x + 3$.</li>
                </ol>
                <p style="margin-top: 10px;">Por lo tanto, $f'(x) = 2x + 3$.</p>
              `,
              videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
              pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
            },
            ejercicios: {
              problems: [
                {
                  problem: 'Dada $f(x) = \\sqrt{2x + 1}$, determine $f\'(x)$ utilizando la definición por límite y encuentre la ecuación de la recta tangente en $x = 4$.',
                  pauta: '1. Plantea el cociente incremental: $f\'(x) = \\lim_{h \\to 0} \\frac{\\sqrt{2(x+h)+1} - \\sqrt{2x+1}}{h}$.\n2. Racionaliza multiplicando por el conjugado: $\\lim_{h \\to 0} \\frac{2h}{h(\\sqrt{2(x+h)+1} + \\sqrt{2x+1})} = \\frac{1}{\\sqrt{2x+1}}$.\n3. Evaluando en $x=4$: $f(4) = 3$ y $f\'(4) = \\frac{1}{3}$.\n4. Ecuación de la recta tangente: $y - 3 = \\frac{1}{3}(x - 4) \\implies y = \\frac{1}{3}x + \\frac{5}{3}$.',
                  dificultad: 'Medio',
                  conceptos: ['Definición por Límite', 'Recta Tangente', 'Racionalización'],
                  habilidades: ['Cálculo Algorítmico', 'Razonamiento Gráfico']
                },
                {
                  problem: 'Demuestre que la función $f(x) = x \\cdot |x|$ es diferenciable en $x = 0$ y calcule $f\'(0)$.',
                  pauta: '1. Evalúa el límite por la izquierda: $\\lim_{h \\to 0^-} \\frac{h(-h) - 0}{h} = \\lim_{h \\to 0^-} (-h) = 0$.\n2. Evalúa por la derecha: $\\lim_{h \\to 0^+} \\frac{h(h) - 0}{h} = \\lim_{h \\to 0^+} (h) = 0$.\n3. Como ambos límites laterales coinciden, la función es diferenciable en el origen y $f\'(0) = 0$.',
                  dificultad: 'Medio',
                  conceptos: ['Límites Laterales', 'Diferenciabilidad', 'Valor Absoluto'],
                  habilidades: ['Demostración Rigurosa', 'Razonamiento Gráfico']
                },
                {
                  problem: 'Un objeto se mueve a lo largo de una línea recta según la ecuación de posición $s(t) = 4t^3 - 9t^2 + 6t + 2$. Encuentre la velocidad instantánea y la aceleración en $t = 2$.',
                  pauta: '1. Velocidad: $v(t) = s\'(t) = 12t^2 - 18t + 6$. En $t=2$: $v(2) = 12(4) - 36 + 6 = 18\\text{ m/s}$.\n2. Aceleración: $a(t) = v\'(t) = 24t - 18$. En $t=2$: $a(2) = 24(2) - 18 = 30\\text{ m/s}^2$.',
                  dificultad: 'Básico',
                  conceptos: ['Cinemática', 'Velocidad Instantánea', 'Aceleración'],
                  habilidades: ['Modelación e Ingeniería', 'Cálculo Algorítmico']
                },
                {
                  problem: 'Aplica la regla de la cadena para hallar la derivada de $g(x) = \\sin^3(4x^2 + 1)$.',
                  pauta: '1. Capa externa (potencia): $3\\sin^2(4x^2+1)$.\n2. Capa intermedia (trigonométrica): $\\cos(4x^2+1)$.\n3. Capa interna (polinómica): $8x$.\n4. Resultado simplificado: $g\'(x) = 24x \\sin^2(4x^2+1) \\cos(4x^2+1)$.',
                  dificultad: 'Medio',
                  conceptos: ['Regla de la Cadena', 'Funciones Trigonométricas'],
                  habilidades: ['Cálculo Algorítmico', 'Elección de Método']
                },
                {
                  problem: 'Calcule la derivada de la función implícita $x^3 + y^3 = 6xy$ (Folium de Descartes) en el punto $(3,3)$.',
                  pauta: '1. Derivación implícita respecto a $x$: $3x^2 + 3y^2 y\' = 6y + 6x y\'$.\n2. Despeje de $y\'$: $y\'(3y^2 - 6x) = 6y - 3x^2 \\implies y\' = \\frac{2y - x^2}{y^2 - 2x}$.\n3. Sustitución en el punto $(3,3)$: $y\'(3,3) = \\frac{6 - 9}{9 - 6} = -1$.',
                  dificultad: 'Alto',
                  conceptos: ['Derivación Implícita', 'Folium de Descartes', 'Recta Tangente'],
                  habilidades: ['Cálculo Algorítmico', 'Razonamiento Gráfico']
                },
                {
                  problem: 'Encuentre la ecuación de la recta normal a la curva $y = x \\ln(x)$ en el punto donde $x = e$.',
                  pauta: '1. Coordenada $y$: $y(e) = e \\ln(e) = e \\implies (e, e)$.\n2. Pendiente tangente: $y\' = \\ln(x) + 1 \\implies m_t = y\'(e) = 1 + 1 = 2$.\n3. Pendiente normal perpendicular: $m_n = -\\frac{1}{m_t} = -\\frac{1}{2}$.\n4. Ecuación normal: $y - e = -\\frac{1}{2}(x - e) \\implies y = -\\frac{1}{2}x + \\frac{3e}{2}$.',
                  dificultad: 'Medio',
                  conceptos: ['Recta Normal', 'Regla del Producto', 'Logaritmo Natural'],
                  habilidades: ['Cálculo Algorítmico', 'Razonamiento Gráfico']
                },
                {
                  problem: 'Utilice derivación logarítmica para determinar $y\'$ si $y = \\frac{(x+1)^4 \\cdot \\sqrt{x-2}}{(3x-5)^2}$.',
                  pauta: '1. Tomando logaritmo natural: $\\ln y = 4\\ln(x+1) + \\frac{1}{2}\\ln(x-2) - 2\\ln(3x-5)$.\n2. Derivando respecto a $x$: $\\frac{y\'}{y} = \\frac{4}{x+1} + \\frac{1}{2(x-2)} - \\frac{6}{3x-5}$.\n3. Despeje final: $y\' = y \\left[ \\frac{4}{x+1} + \\frac{1}{2(x-2)} - \\frac{6}{3x-5} \\right]$.',
                  dificultad: 'Alto',
                  conceptos: ['Derivación Logarítmica', 'Propiedades de Logaritmos'],
                  habilidades: ['Cálculo Algorítmico', 'Elección de Método']
                },
                {
                  problem: 'Un tanque cónico invertido de $4\\text{ m}$ de altura y $2\\text{ m}$ de radio superior se llena de agua a razón constante de $0.5\\text{ m}^3/\\text{min}$. ¿A qué velocidad sube el nivel del agua cuando la profundidad es de $3\\text{ m}$?',
                  pauta: '1. Relación de semejanza geométrica: $\\frac{r}{h} = \\frac{2}{4} \\implies r = \\frac{h}{2}$.\n2. Volumen cónico: $V = \\frac{1}{3}\\pi r^2 h = \\frac{\\pi}{12} h^3$.\n3. Derivada respecto al tiempo: $\\frac{dV}{dt} = \\frac{\\pi}{4} h^2 \\frac{dh}{dt}$.\n4. Reemplazando $\\frac{dV}{dt} = 0.5$ y $h = 3$: $0.5 = \\frac{9\\pi}{4} \\frac{dh}{dt} \\implies \\frac{dh}{dt} = \\frac{2}{9\\pi} \\approx 0.0707\\text{ m/min}$.',
                  dificultad: 'Alto',
                  conceptos: ['Razones de Cambio Relacionadas', 'Geometría Cónica'],
                  habilidades: ['Modelación e Ingeniería', 'Abstracción Paramétrica']
                },
                {
                  problem: 'Determine los puntos sobre la hipérbola $x^2 - 2y^2 = 1$ donde la recta tangente es paralela a la recta $y = 2x + 5$.',
                  pauta: '1. Pendiente de la recta de referencia: $m = 2$.\n2. Derivada implícita de la hipérbola: $2x - 4y y\' = 0 \\implies y\' = \\frac{x}{2y}$.\n3. Condición de paralelismo: $\\frac{x}{2y} = 2 \\implies x = 4y$.\n4. Sustitución en la curva: $(4y)^2 - 2y^2 = 1 \\implies 14y^2 = 1 \\implies y = \\pm \\frac{1}{\\sqrt{14}}$.\n5. Puntos buscados: $\\left(\\frac{4}{\\sqrt{14}}, \\frac{1}{\\sqrt{14}}\\right)$ y $\\left(-\\frac{4}{\\sqrt{14}}, -\\frac{1}{\\sqrt{14}}\\right)$.',
                  dificultad: 'Alto',
                  conceptos: ['Derivación Implícita', 'Paralelismo de Tangentes', 'Geometría Analítica'],
                  habilidades: ['Problema Inverso', 'Cálculo Algorítmico']
                },
                {
                  problem: 'Calcule el límite $\\lim_{x \\to 0} \\frac{\\tan(x) - x}{x^3}$ mediante la Regla de L\'Hôpital.',
                  pauta: '1. Indeterminación $\\frac{0}{0}$. Primera aplicación: $\\lim_{x \\to 0} \\frac{\\sec^2(x) - 1}{3x^2} = \\lim_{x \\to 0} \\frac{\\tan^2(x)}{3x^2}$.\n2. Aplicando límites notables: $\\frac{1}{3} \\left( \\lim_{x \\to 0} \\frac{\\tan(x)}{x} \\right)^2 = \\frac{1}{3}(1)^2 = \\frac{1}{3}$.',
                  dificultad: 'Medio',
                  conceptos: ['Regla de L\'Hôpital', 'Límites Indeterminados', 'Límites Notables'],
                  habilidades: ['Cálculo Algorítmico', 'Elección de Método']
                },
                {
                  problem: 'Halle la derivada n-ésima de orden superior $f^{(50)}(x)$ para la función $f(x) = x \\cdot e^x$.',
                  pauta: '1. Secuencia de derivadas: $f\'(x) = (x+1)e^x$, $f\'\'(x) = (x+2)e^x$, $f\'\'\'(x) = (x+3)e^x$.\n2. Patrón por inducción: $f^{(n)}(x) = (x + n)e^x$.\n3. Para orden 50: $f^{(50)}(x) = (x + 50)e^x$.',
                  dificultad: 'Alto',
                  conceptos: ['Derivadas de Orden Superior', 'Patrón de Inducción'],
                  habilidades: ['Abstracción Paramétrica', 'Demostración Rigurosa']
                },
                {
                  problem: 'Demuestre mediante el Teorema del Valor Medio que para todo $x > 0$ se cumple la desigualdad $\\ln(1 + x) < x$.',
                  pauta: '1. Considera $f(t) = \\ln(1+t)$ en $[0, x]$.\n2. Por TVM, existe $c \\in (0, x)$ tal que $\\frac{\\ln(1+x) - \\ln(1)}{x - 0} = f\'(c) = \\frac{1}{1+c}$.\n3. Como $c > 0 \\implies 1+c > 1 \\implies \\frac{1}{1+c} < 1$.\n4. Conclusión: $\\frac{\\ln(1+x)}{x} < 1 \\implies \\ln(1+x) < x$.',
                  dificultad: 'Alto',
                  conceptos: ['Teorema del Valor Medio', 'Desigualdades Analíticas'],
                  habilidades: ['Demostración Rigurosa', 'Abstracción Paramétrica']
                }
              ],
              formulasClave: [
                { label: 'Definición por Límite', latex: 'f\'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}', description: 'Expresión fundamental para calcular la razón de cambio instantánea mediante el límite del cociente incremental $\\lim_{h \\to 0} \\frac{\\Delta y}{\\Delta x}$.' },
                { label: 'Recta Tangente', latex: 'y - y_0 = f\'(x_0)(x - x_0)', description: 'Ecuación punto-pendiente de la recta tangente a la curva en el punto de contacto $(x_0, y_0)$ con pendiente $m = f\'(x_0)$.' },
                { label: 'Regla del Producto', latex: '(u \\cdot v)\' = u\'v + uv\'', description: 'Fórmula de derivación directa para determinar el cambio del producto de dos funciones $u(x)$ y $v(x)$.' },
                { label: 'Regla del Cociente', latex: '\\left(\\frac{u}{v}\\right)\' = \\frac{u\'v - uv\'}{v^2}', description: 'Regla para derivar la división de dos funciones diferenciables con denominador $v(x) \\neq 0$.' },
                { label: 'Regla de la Cadena', latex: '\\frac{d}{dx}[f(g(x))] = f\'(g(x)) \\cdot g\'(x)', description: 'Regla fundamental de composición para diferenciar funciones compuestas complejas $f(g(x))$.' }
              ]
            }
          }
        ]
      },
      {
        id: 'u-2',
        number: 2,
        title: 'Unidad 2: Aplicaciones Avanzadas y Optimización',
        summary: 'Criterios de la primera y segunda derivada, trazado de curvas y máximos/mínimos aplicados.',
        chapters: [
          {
            id: 'cap-2',
            number: 2,
            title: 'Optimización y Trazado Curvilíneo Avanzado',
            summary: 'Puntos críticos, criterio de la primera y segunda derivada, concavidad e inflexión.',
            mathKey: 'f\'\'(x) > 0 \\implies \\text{Concavidad hacia arriba}',
            motivacion: `
              <h3>Aplicaciones Reales de Optimización</h3>
              <p>¿Cómo minimizar el consumo de combustible de un avión? ¿Cómo diseñar un contenedor cilíndrico de volumen máximo minimizando la cantidad de metal utilizado?</p>
              <p>Los problemas de optimización constituyen una de las herramientas más valiosas de la matemática aplicada para maximizar eficiencia y reducir costos en ingeniería.</p>
            `,
            teoria: `
              <h3>Puntos Críticos y Criterio de la Primera Derivada</h3>
              <p>Un punto $x_c$ en el dominio de $f$ es un <strong>punto crítico</strong> si $f'(x_c) = 0$ o si $f'(x_c)$ no existe.</p>
              <ul>
                <li>Si $f'$ cambia de positiva a negativa en $x_c$, $f$ alcanza un <strong>máximo local</strong>.</li>
                <li>Si $f'$ cambia de negativa a positiva en $x_c$, $f$ alcanza un <strong>mínimo local</strong>.</li>
              </ul>

              <h3>Concavidad y Puntos de Inflexión</h3>
              <p>La gráfica de $f$ es concava hacia arriba en un intervalo si $f''(x) > 0$, y cóncava hacia abajo si $f''(x) < 0$.</p>
            `,
            practica: {
              text: `
                <h3>Ejemplo de Optimización Cilíndrica</h3>
                <p>Se desea construir una lata cilíndrica cerrada de volumen fijo $V = 1000\\text{ cm}^3$. Determine el radio $r$ y la altura $h$ que minimizan la superficie total de material.</p>
                <p><strong>Ecuación de Superficie:</strong> $A = 2\\pi r^2 + 2\\pi r h$. Dado $V = \\pi r^2 h = 1000 \\implies h = \\frac{1000}{\\pi r^2}$.</p>
                <p>Sustituyendo: $A(r) = 2\\pi r^2 + \\frac{2000}{r}$. Derivando: $A'(r) = 4\\pi r - \\frac{2000}{r^2} = 0 \\implies r = \\sqrt[3]{\\frac{500}{\\pi}} \\approx 5.42\\text{ cm}$.</p>
              `
            },
            ejercicios: {
              problems: [
                {
                  problem: 'Encuentre las dimensiones del rectángulo de mayor área inscrito en un semicírculo de radio $R = 10$ con su base sobre el diámetro del semicírculo.',
                  pauta: '1. Sea la base del rectángulo $2x$ y la altura $y$. La ecuación del semicírculo es $x^2 + y^2 = 100 \\implies y = \\sqrt{100 - x^2}$.\n2. Área del rectángulo: $A(x) = 2x y = 2x \\sqrt{100 - x^2}$ para $0 < x < 10$.\n3. Derivando $A(x)$: $A\'(x) = 2\\sqrt{100 - x^2} + 2x \\cdot \\frac{-x}{\\sqrt{100 - x^2}} = \\frac{2(100 - 2x^2)}{\\sqrt{100 - x^2}}$.\n4. Punto crítico $A\'(x) = 0 \\implies 100 - 2x^2 = 0 \\implies x = 5\\sqrt{2} \\approx 7.07$.\n5. Sustituyendo: $y = \\sqrt{100 - 50} = 5\\sqrt{2}$.\n6. Las dimensiones de área máxima son base $2x = 10\\sqrt{2}$ y altura $y = 5\\sqrt{2}$ con área máxima $A_{\\max} = 100$.',
                  dificultad: 'Alto',
                  conceptos: ['Optimización Geométrica', 'Círculos y Rectángulos'],
                  habilidades: ['Modelación e Ingeniería', 'Abstracción Paramétrica']
                },
                {
                  problem: 'Determine los intervalos de concavidad y los puntos de inflexión de la función polinómica $f(x) = x^4 - 4x^3 + 10$.',
                  pauta: '1. Primera derivada: $f\'(x) = 4x^3 - 12x^2$.\n2. Segunda derivada: $f\'\'(x) = 12x^2 - 24x = 12x(x - 2)$.\n3. Ceros de $f\'\'(x)$: $x = 0$ y $x = 2$.\n4. Análisis de signos de $f\'\'(x)$:\n   - Para $x < 0$: $f\'\'(x) > 0 \\implies$ Cóncava hacia arriba en $(-\\infty, 0)$.\n   - Para $0 < x < 2$: $f\'\'(x) < 0 \\implies$ Cóncava hacia abajo en $(0, 2)$.\n   - Para $x > 2$: $f\'\'(x) > 0 \\implies$ Cóncava hacia arriba en $(2, \\infty)$.\n5. Puntos de inflexión en $x = 0 \\implies (0, 10)$ y en $x = 2 \\implies (2, -6)$.',
                  dificultad: 'Medio',
                  conceptos: ['Concavidad', 'Puntos de Inflexión', 'Criterio Segunda Derivada'],
                  habilidades: ['Razonamiento Gráfico', 'Cálculo Algorítmico']
                },
                {
                  problem: 'Un fabricante desea diseñar una caja rectangular abierta sin tapa superior utilizando una lámina cuadrada de cartón de $12\\text{ cm}$ de lado, recortando cuadrados iguales de lado $x$ en cada esquina y doblando los lados hacia arriba. Determine el valor de $x$ que maximiza el volumen de la caja.',
                  pauta: '1. Las dimensiones de la base de la caja son $(12 - 2x)$ por $(12 - 2x)$ y la altura es $x$, donde $0 < x < 6$.\n2. Función de volumen: $V(x) = x(12 - 2x)^2 = 4x^3 - 48x^2 + 144x$.\n3. Derivando $V\'(x) = 12x^2 - 96x + 144 = 12(x^2 - 8x + 12) = 12(x - 2)(x - 6)$.\n4. Puntos críticos en $x = 2$ y $x = 6$.\n5. Dado que $x \\in (0, 6)$, el único punto admisible es $x = 2\\text{ cm}$.\n6. Segunda derivada: $V\'\'(x) = 24x - 96 \\implies V\'\'(2) = -48 < 0$, confirmando un máximo local con volumen máximo $V(2) = 2(8)^2 = 128\\text{ cm}^3$.',
                  dificultad: 'Medio',
                  conceptos: ['Optimización de Volumen', 'Puntos Críticos'],
                  habilidades: ['Modelación e Ingeniería', 'Cálculo Algorítmico']
                },
                {
                  problem: 'Determine el punto sobre la parábola $y = x^2$ que se encuentra más cercano al punto $(3, 0)$.',
                  pauta: '1. Distancia al cuadrado entre $(x, y)$ y $(3,0)$: $D(x) = (x - 3)^2 + (y - 0)^2$.\n2. Sustituyendo $y = x^2$: $D(x) = (x - 3)^2 + x^4 = x^4 + x^2 - 6x + 9$.\n3. Derivando $D\'(x) = 4x^3 + 2x - 6 = 2(2x^3 + x - 3)$.\n4. Inspeccionando ceros: $x = 1$ es solución pues $2(1)^3 + 1 - 3 = 0$.\n5. Factorizando: $2(x - 1)(2x^2 + 2x + 3)$. El polinomio cuadrático no tiene más raíces reales.\n6. Para $x = 1 \\implies y = 1^2 = 1$. El punto más cercano es $(1, 1)$ con distancia mínima $d = \\sqrt{(1-3)^2 + 1^2} = \\sqrt{5}$.',
                  dificultad: 'Alto',
                  conceptos: ['Optimización de Distancia', 'Minimización'],
                  habilidades: ['Modelación e Ingeniería', 'Razonamiento Gráfico']
                },
                {
                  problem: 'Halle las asíntotas horizontales, verticales u oblicuas y bosqueje el comportamiento extremo de la función racional $f(x) = \\frac{2x^2 + 3x + 1}{x - 1}$.',
                  pauta: '1. Asíntota Vertical: El denominador se anula en $x = 1$. Calculando límites laterales: $\\lim_{x \\to 1^+} f(x) = +\\infty$ y $\\lim_{x \\to 1^-} f(x) = -\\infty$.\n2. Asíntota Oblicua: Como el grado del numerador es mayor en 1 que el del denominador, realizamos división polinómica: $f(x) = 2x + 5 + \\frac{6}{x-1}$.\n3. Por lo tanto, la recta asíntota oblicua es $y = 2x + 5$.\n4. No existen asíntotas horizontales ya que $\\lim_{x \\to \\pm\\infty} f(x) = \\pm\\infty$.',
                  dificultad: 'Medio',
                  conceptos: ['Asíntotas Oblicuas', 'Trazado de Curvas', 'División Polinómica'],
                  habilidades: ['Razonamiento Gráfico', 'Cálculo Algorítmico']
                },
                {
                  problem: 'Un bote se encuentra a $4\\text{ km}$ del punto $A$ en una costa recta y desea llegar a un pueblo $B$ ubicado a $10\\text{ km}$ a lo largo de la costa desde $A$. Si el remero puede remar a $3\\text{ km/h}$ y caminar a $5\\text{ km/h}$, ¿en qué punto de la playa debe desembarcar para minimizar el tiempo total de viaje?',
                  pauta: '1. Sea $x$ la distancia desde $A$ hasta el punto de desembarque $P$ sobre la costa ($0 \\le x \\le 10$).\n2. Distancia remada: $\\sqrt{4^2 + x^2} = \\sqrt{16 + x^2}$. Distancia caminada: $10 - x$.\n3. Tiempo total de viaje: $T(x) = \\frac{\\sqrt{16 + x^2}}{3} + \\frac{10 - x}{5}$.\n4. Derivando $T\'(x) = \\frac{x}{3\\sqrt{16 + x^2}} - \\frac{1}{5} = 0 \\implies 5x = 3\\sqrt{16 + x^2}$.\n5. Elevando al cuadrado: $25x^2 = 9(16 + x^2) = 144 + 9x^2 \\implies 16x^2 = 144 \\implies x = 3\\text{ km}$.\n6. El remero debe desembarcar a $3\\text{ km}$ del punto $A$ (a $7\\text{ km}$ del pueblo $B$) logrando el tiempo mínimo de $T(3) = \\frac{5}{3} + \\frac{7}{5} = \\frac{46}{15} \\approx 3.07\\text{ horas}$.',
                  dificultad: 'Alto',
                  conceptos: ['Optimización de Tiempo', 'Geometría y Cinemática'],
                  habilidades: ['Modelación e Ingeniería', 'Elección de Método']
                },
                {
                  problem: 'Determine el valor absoluto máximo y mínimo de la función $f(x) = 2x^3 - 3x^2 - 12x + 1$ en el intervalo cerrado $[-2, 3]$.',
                  pauta: '1. Derivada: $f\'(x) = 6x^2 - 6x - 12 = 6(x^2 - x - 2) = 6(x - 2)(x + 1)$.\n2. Puntos críticos en el intervalo: $x = -1$ y $x = 2$.\n3. Evaluando la función en puntos críticos y extremos del intervalo:\n   - $f(-2) = 2(-8) - 3(4) - 12(-2) + 1 = -16 - 12 + 24 + 1 = -3$.\n   - $f(-1) = 2(-1) - 3(1) - 12(-1) + 1 = -2 - 3 + 12 + 1 = 8$.\n   - $f(2) = 2(8) - 3(4) - 12(2) + 1 = 16 - 12 - 24 + 1 = -19$.\n   - $f(3) = 2(27) - 3(9) - 12(3) + 1 = 54 - 27 - 36 + 1 = -8$.\n4. Conclusión: El valor máximo absoluto es $8$ (en $x = -1$) y el valor mínimo absoluto es $-19$ (en $x = 2$).',
                  dificultad: 'Básico',
                  conceptos: ['Extremos Absolutos', 'Teorema de Valor Extremo'],
                  habilidades: ['Cálculo Algorítmico', 'Razonamiento Gráfico']
                },
                {
                  problem: 'Se desea construir un silo de granos en forma de cilindro circular recto coronado por una semiesfera superior. Si el costo por metro cuadrado del techo semiesférico es el doble que el del lateral cilíndrico, encuentre la relación entre la altura del cilindro $h$ y su radio $r$ que minimiza el costo total para un volumen fijo $V$.',
                  pauta: '1. Volumen total: $V = \\pi r^2 h + \\frac{2}{3}\\pi r^3 \\implies h = \\frac{V - \\frac{2}{3}\\pi r^3}{\\pi r^2} = \\frac{V}{\\pi r^2} - \\frac{2}{3}r$.\n2. Sea $C_0$ el costo base por $\\text{m}^2$ del cilindro. Área lateral cilindro = $2\\pi r h$. Área semiesfera = $2\\pi r^2$.\n3. Función de costo total: $C(r) = C_0(2\\pi r h) + 2C_0(2\\pi r^2) = C_0 \\left[ 2\\pi r \\left( \\frac{V}{\\pi r^2} - \\frac{2}{3}r \\right) + 4\\pi r^2 \\right] = C_0 \\left[ \\frac{2V}{r} + \\frac{8}{3}\\pi r^2 \\right]$.\n4. Derivando respecto a $r$: $C\'(r) = C_0 \\left[ -\\frac{2V}{r^2} + \\frac{16}{3}\\pi r \\right] = 0 \\implies V = \\frac{8}{3}\\pi r^3$.\n5. Igualando las expresiones de volumen: $\\pi r^2 h + \\frac{2}{3}\\pi r^3 = \\frac{8}{3}\\pi r^3 \\implies \\pi r^2 h = 2\\pi r^3 \\implies h = 2r$.\n6. La relación óptima exige que la altura del cilindro sea igual a su diámetro $h = 2r$.',
                  dificultad: 'Alto',
                  conceptos: ['Optimización de Costos', 'Geometría 3D'],
                  habilidades: ['Modelación e Ingeniería', 'Abstracción Paramétrica']
                }
              ],
              formulasClave: [
                { label: 'Punto Crítico', latex: 'f\'(x_c) = 0 \\quad \\text{o} \\quad f\'(x_c) \\text{ indefinido}' },
                { label: 'Criterio 2da Derivada', latex: 'f\'\'(x_c) > 0 \\implies \\text{Mínimo Local}' },
                { label: 'Punto de Inflexión', latex: 'f\'\'(x_i) = 0 \\quad \\text{con cambio de signo}' }
              ]
            }
          }
        ]
      },
      {
        id: 'u-3',
        number: 3,
        title: 'Unidad 3: Cálculo Integral y Teoremas Fundamentales',
        summary: 'Sumas de Riemann, antiderivación y Teorema Fundamental del Cálculo.',
        chapters: [
          {
            id: 'cap-3',
            number: 3,
            title: 'La Integral Definida y Sumas de Riemann',
            summary: 'Teorema Fundamental del Cálculo, cálculo de áreas y particiones de intervalos.',
            mathKey: '\\int_{a}^{b} f(x)dx = F(b) - F(a)',
            motivacion: `
              <h3>El Desafío de la Acumulación</h3>
              <p>Calcular el área de un polígono regular es sencillo, pero ¿cómo calculamos el área encerrada por una trayectoria parabólica o una forma geométrica irregular?</p>
              <p>La integral definida nos permite sumar infinitas contribuciones infinitesimales para calcular áreas, volúmenes de revolución, trabajo físico y carga eléctrica acumulada.</p>
            `,
            teoria: `
              <h3>Teorema Fundamental del Cálculo (Parte I y II)</h3>
              <p><strong>Parte I:</strong> Sea $f$ continua en $[a,b]$. La función $g(x) = \\int_{a}^{x} f(t)dt$ es diferenciable en $(a,b)$ y $g'(x) = f(x)$.</p>
              <p><strong>Parte II:</strong> Si $F$ es cualquier antiderivada de $f$, entonces:</p>
              <p>$$\\int_{a}^{b} f(x)dx = F(b) - F(a)$$</p>
            `,
            practica: {
              text: `
                <h3>Ejemplo de Área Bajo la Curva</h3>
                <p>Evalúe la integral $\\int_{1}^{3} (x^2 - 2x + 1)\\,dx$.</p>
                <p>Antiderivada: $F(x) = \\frac{x^3}{3} - x^2 + x$. Evaluando en límites: $F(3) - F(1) = \\left(9 - 9 + 3\\right) - \\left(\\frac{1}{3} - 1 + 1\\right) = 3 - \\frac{1}{3} = \\frac{8}{3}$.</p>
              `
            },
            ejercicios: {
              problems: [
                'Calcule el área encerrada entre las curvas $y = x^2$ e $y = 2x - x^2$.',
                'Evalúe la integral definida $\\int_{0}^{\\pi/2} \\sin^2(x) \\cos(x)\\,dx$ mediante sustitución $u = \\sin(x)$.'
              ],
              formulasClave: [
                { label: 'Teorema Fundamental', latex: '\\int_{a}^{b} f(x)dx = F(b) - F(a)' },
                { label: 'Derivada de la Integral', latex: '\\frac{d}{dx} \\int_{a}^{x} f(t)dt = f(x)' },
                { label: 'Sustitución', latex: '\\int f(g(x)) g\'(x) dx = \\int f(u) du' }
              ]
            }
          }
        ]
      }
    ],
    chapters: []
};

export const MOCK_CLASSROOM_DATA: Record<string, CourseContent> = {
  'calculo-diferencial': CALCULO_DIFERENCIAL_COURSE,
  'fundamentos-calculo-diferencial': CALCULO_DIFERENCIAL_COURSE,
};

export function getCourseContentBySlug(slug: string): CourseContent {
  const canonicalSlug = slug && slug.includes('algebra-lineal')
    ? 'algebra-lineal'
    : slug && slug.includes('calculo-multivariable')
    ? 'calculo-multivariable'
    : slug;

  const course = MOCK_CLASSROOM_DATA[canonicalSlug] || MOCK_CLASSROOM_DATA[slug];
  if (course) {
    const unitsWithFormattedChapters = (course.units || []).map((unit) => ({
      ...unit,
      chapters: unit.chapters.map((chap, cIdx) => ({
        ...chap,
        displayNumber: `${unit.number}.${cIdx + 1}`
      }))
    }));

    const flatChapters = unitsWithFormattedChapters.length > 0
      ? unitsWithFormattedChapters.flatMap(u => u.chapters)
      : (course.chapters || []).map((chap, idx) => ({ ...chap, displayNumber: `1.${idx + 1}` }));

    return {
      ...course,
      units: unitsWithFormattedChapters,
      chapters: flatChapters
    };
  }

  // Fallback dynamic generator for any course slug
  const titleFormatted = slug
    .split('-')
    .map(w => {
      const lower = w.toLowerCase();
      if (lower === 'calculo') return 'Cálculo';
      if (lower === 'algebra') return 'Álgebra';
      if (lower === 'introduccion') return 'Introducción';
      if (lower === 'topologia') return 'Topología';
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(' ');

  const defaultChapters: ChapterData[] = [
    {
      id: 'cap-1',
      number: 1,
      displayNumber: '1.1',
      title: `Fundamentos y Definiciones de ${titleFormatted}`,
      summary: 'Introducción a conceptos clave y planteamiento de hipótesis principales.',
      mathKey: 'f(x) = \\sum_{n=0}^{\\infty} a_n (x - c)^n',
      motivacion: `
        <h3>Motivación e Importancia en la Ciencia</h3>
        <p>Este capítulo introduce las herramientas analíticas necesarias para abordar los problemas de ${titleFormatted} con rigor académico y visión intuitiva.</p>
      `,
      teoria: `
        <h3>Teoremas Principales</h3>
        <p>Consideremos la estructura formal definida por el conjunto de hipótesis básicas. El resultado central establece que:</p>
        <p>$$\\lim_{n \\to \\infty} a_n = L \\quad \\implies \\quad \\forall \\varepsilon > 0, \\exists N \\in \\mathbb{N}$$</p>
      `,
      practica: {
        text: `
          <h3>Desarrollo Práctico Guiado</h3>
          <p>Revisión paso a paso de los teoremas aplicados a ejercicios típicos de certámenes universitarios.</p>
        `
      },
      ejercicios: {
        problems: [
          `Demuestre la propiedad fundamental del capítulo 1 de ${titleFormatted}.`,
          `Resuelva el problema de frontera aplicando los criterios teóricos expuestos.`
        ],
        formulasClave: [
          { label: 'Fórmula Principal', latex: 'A = P D P^{-1}' },
          { label: 'Criterio de Convergencia', latex: '\\lim_{n \\to \\infty} \\left| \\frac{a_{n+1}}{a_n} \\right| < 1' }
        ]
      }
    },
    {
      id: 'cap-2',
      number: 2,
      displayNumber: '1.2',
      title: `Aplicaciones Avanzadas en ${titleFormatted}`,
      summary: 'Técnicas avanzadas de resolución y problemas aplicados a ingeniería.',
      mathKey: '\\mathbf{A}\\mathbf{x} = \\mathbf{b}',
      motivacion: '<h3>Motivación de Aplicación Real</h3><p>Estudio de modelos matemáticos y simulaciones computacionales.</p>',
      teoria: '<h3>Ecuaciones de Estado</h3><p>$$\\det(A - \\lambda I) = 0$$</p>',
      practica: { text: '<p>Resolución detallada de ejercicios complejos.</p>' },
      ejercicios: {
        problems: ['Desarrolle el cálculo matricial para el sistema 3x3.'],
        formulasClave: [
        ]
      }
    }
  ];

  const defaultUnits: UnitData[] = [
    {
      id: 'u-1',
      number: 1,
      title: `Unidad 1: Módulos Principales de ${titleFormatted}`,
      summary: `Contenido estructurado del curso de ${titleFormatted}.`,
      chapters: defaultChapters
    }
  ];

  let customUnits = defaultUnits;
  let customChapters = defaultChapters;

  if (canonicalSlug === 'algebra-lineal') {
    const luCap: ChapterData = {
      id: 'cap-3',
      number: 3,
      displayNumber: '2.1',
      title: 'Factorización $A = LU$ y Matrices Triangulares',
      summary: 'Descomposición de matrices cuadradas en producto de matriz triangular inferior L y superior U.',
      mathKey: 'A = L U',
      motivacion: '\\begin{card}\nEn la ingeniería computacional y optimización numérica, resolver $A\\vec{x} = \\vec{b}$ mediante la inversión directa de matrices es costoso e inestable. La factorización $LU$ permite descomponer el problema en dos sistemas triangulares triviales de resolver.\n\\end{card}',
      teoria: '\\begin{card}\n\\begin{definicion}{Descomposición LU}\nDada una matriz $A \\in M_{n \\times n}$, la factorización $LU$ la expresa como el producto:\n$$A = L U$$\ndonde $L$ es una matriz triangular inferior con unos en la diagonal principal (unitriangular inferior) y $U$ es una matriz triangular superior escalonada.\n\\end{definicion}\n\\end{card}\n\\begin{card}\n\\begin{metodo}{Reducción a la forma triangular superior: Matriz $U$}\n\\problema{Dada la matriz $A = \\begin{pmatrix} 2 & 1 \\\\ 6 & 8 \\end{pmatrix}$, halle su descomposición $A = LU$.}\n\\paso{1}{Eliminación Gaussiana para hallar $U$}\nAplicamos $F_2 \\rightarrow F_2 - 3F_1$ para obtener la matriz triangular superior $U$:\n$U = \\begin{pmatrix} 2 & 1 \\\\ 0 & 5 \\end{pmatrix}$.\n\\paso{2}{Construcción de la matriz $L$}\nColocamos en la matriz $L$ los multiplicadores utilizados en las operaciones elementales de fila.\n$L = \\begin{pmatrix} 1 & 0 \\\\ 3 & 1 \\end{pmatrix}$.\n\\end{metodo}\n\\end{card}',
      practica: { text: '<p>Práctica interactiva guiada de factorización LU.</p>' },
      ejercicios: {
        problems: [
          'Calcule la factorización LU de una matriz de 3x3 utilizando operaciones elementales por fila.',
          'Demuestre que si A es invertible y tiene descomposición LU, entonces L y U son únicas.'
        ],
        formulasClave: [
          { label: 'Ecuación LU', latex: 'A = L U' },
          { label: 'Sistema Escalonado', latex: 'L\\vec{y} = \\vec{b}, \\quad U\\vec{x} = \\vec{y}' }
        ]
      }
    };

    const sysCap: ChapterData = {
      id: 'cap-4',
      number: 4,
      displayNumber: '2.2',
      title: 'Resolución de Sistemas Simultáneos $A\\vec{x} = \\vec{b}_k$',
      summary: 'Algoritmos para resolver múltiples vectores de términos independientes con la misma matriz de coeficientes.',
      mathKey: 'A\\vec{x}_i = \\vec{b}_i, \\quad i = 1, \\dots, k',
      motivacion: '\\begin{card}\nSistemas dinámicos y análisis estructural donde una misma estructura física comparte la matriz principal $A$ bajo distintos escenarios de carga $\\vec{b}_1, \\vec{b}_2, \\dots, \\vec{b}_k$.\n\\end{card}',
      teoria: '\\begin{card}\n\\begin{metodo}{Resolución de Sistemas Simultáneos}\n\\problema{Un ingeniero evalúa las fuerzas en una estructura bajo dos escenarios de carga, los cuales comparten la matriz principal $A$:\nEscenario 1: $x + y + z = 3, 2y + z = 3, x + z = 2$\nEscenario 2: $x + y + z = 0, 2y + z = -1, x + z = 0$\nResuelva ambos sistemas simultáneamente.}\n\\paso{1}{Planteamiento de la matriz expandida}\nConstruimos la matriz extendida $[A \\mid \\vec{b}_1 \\ \\vec{b}_2]$.\n\\paso{2}{Escalonamiento Gauss-Jordan}\nAplicamos operaciones elementales por fila hasta transformar $A$ en la matriz identidad $I$.\n\\paso{3}{Interpretación del resultado}\nLas columnas del lado derecho corresponden directamente a los vectores solución $\\vec{x}_1$ y $\\vec{x}_2$.\n\\end{metodo}\n\\end{card}',
      practica: { text: '<p>Resolución práctica de sistemas simultáneos.</p>' },
      ejercicios: {
        problems: [
          'Plantee la matriz aumentada extendida para 3 escenarios simultáneos y halle las soluciones.'
        ],
        formulasClave: [
          { label: 'Matriz Extendida', latex: '[A \\mid \\vec{b}_1 \\ \\vec{b}_2 \\dots \\vec{b}_k]' }
        ]
      }
    };

    customChapters = [...defaultChapters, luCap, sysCap];
    customUnits = [
      defaultUnits[0],
      {
        id: 'u-2',
        number: 2,
        title: 'Unidad 2: Factorización $A = LU$ y Sistemas Simultáneos',
        summary: 'Métodos de descomposición matricial y resolución de sistemas simultáneos de ecuaciones lineales.',
        chapters: [luCap, sysCap]
      }
    ];
  }

  let category = 'Cálculo';
  let level: 'Pregrado' | 'Intermedio' | 'Avanzado' = 'Pregrado';

  if (slug.includes('algebra')) {
    category = 'Álgebra Lineal';
  } else if (slug.includes('ecuaciones')) {
    category = 'Ecuaciones Diferenciales';
  } else if (slug.includes('topologia')) {
    category = 'Topología';
  }

  if (slug.includes('multivariable') || slug.includes('avanzado') || slug.includes('topologia')) {
    level = 'Avanzado';
  } else if (slug.includes('ecuaciones') || slug.includes('lineal') || slug.includes('integral')) {
    level = 'Intermedio';
  }

  return {
    id: `course_${slug}`,
    slug: slug,
    title: titleFormatted,
    category: category,
    level: level,
    description: `Programa de estudio completo e interactivo para ${titleFormatted}.`,
    units: customUnits,
    chapters: customChapters
  };
}
