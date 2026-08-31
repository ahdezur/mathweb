import { CALCULO_DIFERENCIAL_COURSE, getCourseContentBySlug, CourseContent, UnitData, ChapterData, ProblemItem } from './classroomData';
import type { PracticeExercise, TrueFalseExercise, SingleChoiceExercise, MultipleChoiceExercise, MatchingExercise } from '@/components/classroom/InteractivePractice';

export type ExerciseType = 'true_false' | 'single_choice' | 'multiple_choice' | 'matching' | 'desarrollo';

export type CognitiveLevel = 'Recordar' | 'Aplicar' | 'Analizar' | 'Evaluación';

export type DifficultyLevel = 'Básico' | 'Intermedio' | 'Avanzado';

export interface ExerciseTag {
  tag: string;
  mostrarAlEstudiante: boolean;
}

export interface ExerciseAssignment {
  courseSlug: string;
  chapterId: string;
  tab: 'practica' | 'ejercicios';
}

export interface ExerciseAnalytics {
  tasaAciertoHistorica: number; // 0-100%
  intentosPromedio: number;
  usoDePistaCount: number;
  dificultadPercibidaTotal: number; // Sum of student votes (1 = Easy, 2 = Medium, 3 = Hard)
  dificultadPercibidaVotos: number;
}

export interface BankExercise {
  id: string;
  tipoEjercicio: ExerciseType;
  titulo: string;
  enunciadoLatex: string;
  nivelDificultad: DifficultyLevel;
  materiaArea: string; // e.g. "Cálculo Diferencial", "Álgebra Lineal"
  temaSubtema: string; // e.g. "Derivadas > Recta Tangente"
  tags: ExerciseTag[];
  nivelCognitivo: CognitiveLevel;
  pista?: string;
  pautaDetalladaLatex?: string;
  status: 'Borrador' | 'Listo' | 'Archivado';
  asignaciones: ExerciseAssignment[];
  variantes?: string[]; // IDs of related variant exercises
  analytics: ExerciseAnalytics;

  // Type-Specific Fields
  // True / False
  correctAnswer?: boolean;
  trueFeedback?: string;
  falseFeedback?: string;

  // Single / Multiple Choice
  options?: { id: string; text: string; isCorrect?: boolean; feedback?: string }[];
  correctOptionId?: string;
  correctOptionIds?: string[];

  // Matching
  columns?: 2 | 3;
  col1Title?: string;
  col2Title?: string;
  col3Title?: string;
  col1Items?: { id: string; num: number; text: string; feedback?: string }[];
  col2Options?: { letter: string; text: string }[];
  col3Options?: { letter: string; text: string }[];
  correctMapping?: Record<string, string>;
  correctMappingCol3?: Record<string, string>;

  // Desarrollo
  conceptos?: string[];
  habilidades?: string[];
  explanation?: string;
}

const STORAGE_KEY = 'mathweb_central_exercise_bank_v1';

// Seed initial exercises from default course data
function generateInitialExercises(): BankExercise[] {
  const exercises: BankExercise[] = [];

  // Harvest exercises from CALCULO_DIFERENCIAL_COURSE
  const course = CALCULO_DIFERENCIAL_COURSE;
  
  course.units.forEach((unit: UnitData) => {
    unit.chapters.forEach((chap: ChapterData) => {
      // 1. Harvest Practice Exercises (VF, Single Choice, Multiple Choice, Matching)
      if (chap.practica && chap.practica.exercises && chap.practica.exercises.length > 0) {
        chap.practica.exercises.forEach((ex: PracticeExercise, idx: number) => {
          let tipo: ExerciseType = 'single_choice';
          if (ex.type === 'true_false') tipo = 'true_false';
          else if (ex.type === 'multiple_choice') tipo = 'multiple_choice';
          else if (ex.type === 'matching') tipo = 'matching';

          const bankEx: BankExercise = {
            id: ex.id || `bank-practica-${chap.id}-${idx + 1}`,
            tipoEjercicio: tipo,
            titulo: ex.title || `Práctica ${idx + 1} - ${chap.title}`,
            enunciadoLatex: 'question' in ex ? ex.question : ('statement' in ex ? ex.statement : ''),
            nivelDificultad: 'Intermedio',
            materiaArea: course.title,
            temaSubtema: `${unit.title} > ${chap.title}`,
            tags: [
              { tag: 'Práctica Interactiva', mostrarAlEstudiante: true },
              { tag: course.slug, mostrarAlEstudiante: false }
            ],
            nivelCognitivo: 'Aplicar',
            pautaDetalladaLatex: ex.explanation || '',
            status: 'Listo',
            asignaciones: [
              { courseSlug: course.slug, chapterId: chap.id, tab: 'practica' }
            ],
            analytics: {
              tasaAciertoHistorica: 85,
              intentosPromedio: 1.2,
              usoDePistaCount: 3,
              dificultadPercibidaTotal: 10,
              dificultadPercibidaVotos: 5,
            },
          };

          if (ex.type === 'true_false') {
            bankEx.correctAnswer = ex.correctAnswer;
            bankEx.trueFeedback = ex.trueFeedback;
            bankEx.falseFeedback = ex.falseFeedback;
          } else if (ex.type === 'single_choice') {
            bankEx.options = ex.options;
            bankEx.correctOptionId = ex.correctOptionId;
          } else if (ex.type === 'multiple_choice') {
            bankEx.options = ex.options;
            bankEx.correctOptionIds = ex.correctOptionIds;
          } else if (ex.type === 'matching') {
            bankEx.columns = ex.columns;
            bankEx.col1Title = ex.col1Title;
            bankEx.col2Title = ex.col2Title;
            bankEx.col3Title = ex.col3Title;
            bankEx.col1Items = ex.col1Items;
            bankEx.col2Options = ex.col2Options;
            bankEx.col3Options = ex.col3Options;
            bankEx.correctMapping = ex.correctMapping;
            bankEx.correctMappingCol3 = ex.correctMappingCol3;
          }

          exercises.push(bankEx);
        });
      }

      // 2. Harvest Desarrollo Exercises (ejercicios.problems)
      if (chap.ejercicios && chap.ejercicios.problems && chap.ejercicios.problems.length > 0) {
        chap.ejercicios.problems.forEach((prob: string | ProblemItem, idx: number) => {
          const isObj = typeof prob === 'object' && prob !== null;
          const statement = isObj ? prob.problem : String(prob);
          const pauta = isObj ? prob.pauta : '';
          const diffRaw = isObj ? (prob as ProblemItem).dificultad : 'Medio';
          let diff: DifficultyLevel = 'Intermedio';
          if (diffRaw === 'Básico') diff = 'Básico';
          else if (diffRaw === 'Alto') diff = 'Avanzado';

          const conceptos = isObj && prob.conceptos ? prob.conceptos : [];
          const habilidades = isObj && prob.habilidades ? prob.habilidades : [];

          const bankEx: BankExercise = {
            id: (isObj && prob.id) ? prob.id : `bank-desarrollo-${chap.id}-${idx + 1}`,
            tipoEjercicio: 'desarrollo',
            titulo: `Problema ${idx + 1}: ${statement.slice(0, 45).replace(/[\$\*\#]/g, '')}...`,
            enunciadoLatex: statement,
            nivelDificultad: diff,
            materiaArea: course.title,
            temaSubtema: `${unit.title} > ${chap.title}`,
            tags: [
              ...conceptos.map((c: string) => ({ tag: c, mostrarAlEstudiante: true })),
              ...habilidades.map((h: string) => ({ tag: h, mostrarAlEstudiante: false }))
            ],
            nivelCognitivo: diff === 'Avanzado' ? 'Analizar' : 'Aplicar',
            pautaDetalladaLatex: pauta,
            status: 'Listo',
            asignaciones: [
              { courseSlug: course.slug, chapterId: chap.id, tab: 'ejercicios' }
            ],
            conceptos,
            habilidades,
            analytics: {
              tasaAciertoHistorica: 78,
              intentosPromedio: 1.5,
              usoDePistaCount: 8,
              dificultadPercibidaTotal: 15,
              dificultadPercibidaVotos: 6,
            },
          };

          exercises.push(bankEx);
        });
      }
    });
  });

  // Add 2 Standalone / Unassigned Idea Draft Exercises for demonstration
  exercises.push({
    id: 'bank-draft-01',
    tipoEjercicio: 'desarrollo',
    titulo: 'Idea Certamen: Límite por Definición ε-δ con Radicales',
    enunciadoLatex: 'Demuestre rigurosamente mediante la definición $\\varepsilon-\\delta$ que $\\lim_{x \\to 4} \\sqrt{x} = 2$.',
    nivelDificultad: 'Avanzado',
    materiaArea: 'Cálculo Diferencial',
    temaSubtema: 'Límites > Definición Rigurosa',
    tags: [
      { tag: 'Demostración', mostrarAlEstudiante: true },
      { tag: 'Certamen 1', mostrarAlEstudiante: false }
    ],
    nivelCognitivo: 'Analizar',
    pautaDetalladaLatex: 'Dado $\\varepsilon > 0$, buscamos $\\delta > 0$ tal que $0 < |x - 4| < \\delta \\implies |\\sqrt{x} - 2| < \\varepsilon$.\nMultiplicamos por el conjugado: $|\\sqrt{x} - 2| = \\frac{|x - 4|}{\\sqrt{x} + 2} < \\frac{|x - 4|}{2}$.\nTomamos $\\delta = \\min(1, 2\\varepsilon)$.',
    status: 'Borrador',
    asignaciones: [],
    conceptos: ['Definición Epsilon-Delta', 'Racionalización'],
    habilidades: ['Demostración Rigurosa'],
    analytics: {
      tasaAciertoHistorica: 0,
      intentosPromedio: 0,
      usoDePistaCount: 0,
      dificultadPercibidaTotal: 0,
      dificultadPercibidaVotos: 0,
    }
  });

  exercises.push({
    id: 'bank-draft-02',
    tipoEjercicio: 'single_choice',
    titulo: 'Concepto VF: Derivabilidad en Esquinas de funciones absolutas',
    enunciadoLatex: '¿Es la función $f(x) = |x - 3|$ diferenciable en el punto $x = 3$?',
    nivelDificultad: 'Básico',
    materiaArea: 'Cálculo Diferencial',
    temaSubtema: 'Derivadas > Diferenciabilidad',
    tags: [
      { tag: 'Concepto Clave', mostrarAlEstudiante: true }
    ],
    nivelCognitivo: 'Recordar',
    pautaDetalladaLatex: 'Los límites laterales del cociente incremental son $-1$ por la izquierda y $+1$ por la derecha, por lo que la derivada no existe en la esquina $x=3$.',
    status: 'Borrador',
    asignaciones: [],
    options: [
      { id: 'opt-1', text: 'Sí, porque es continua en todo R', isCorrect: false, feedback: 'La continuidad es necesaria pero no suficiente.' },
      { id: 'opt-2', text: 'No, presenta una esquina y los límites laterales difieren', isCorrect: true, feedback: '¡Correcto! En $x=3$ la pendiente cambia bruscamente.' }
    ],
    correctOptionId: 'opt-2',
    analytics: {
      tasaAciertoHistorica: 0,
      intentosPromedio: 0,
      usoDePistaCount: 0,
      dificultadPercibidaTotal: 0,
      dificultadPercibidaVotos: 0,
    }
  });

  return exercises;
}

// -----------------------------------------------------------------------------
// Storage & Access API
// -----------------------------------------------------------------------------
export function getAllBankExercises(): BankExercise[] {
  if (typeof window === 'undefined') {
    return generateInitialExercises();
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = generateInitialExercises();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw) as BankExercise[];
    const seen = new Set<string>();
    const deduplicated = parsed.map((ex, i) => {
      if (seen.has(ex.id)) {
        const fixedId = `${ex.id}-uniq-${i}-${Math.random().toString(36).substring(2, 6)}`;
        return { ...ex, id: fixedId };
      }
      seen.add(ex.id);
      return ex;
    });
    return deduplicated;
  } catch (err) {
    console.error('Error reading Central Exercise Bank from localStorage:', err);
    return generateInitialExercises();
  }
}

export function syncExercisesFromAllCourses(): BankExercise[] {
  let existing = getAllBankExercises();

  // Gather courses from localStorage 'classroom_courses_v1' and predefined courses
  let coursesToScan: CourseContent[] = [];

  if (typeof window !== 'undefined') {
    try {
      const rawStored = localStorage.getItem('classroom_courses_v1');
      if (rawStored) {
        coursesToScan = JSON.parse(rawStored) as CourseContent[];
      }
    } catch (e) {
      console.error('Error parsing stored courses:', e);
    }
  }

  // Ensure default predefined courses are also scanned if not present
  const defaultSlugs = ['calculo-diferencial', 'algebra-lineal', 'calculo-integral', 'ecuaciones-diferenciales'];
  defaultSlugs.forEach((slug) => {
    if (!coursesToScan.some((c) => c.slug === slug)) {
      coursesToScan.push(getCourseContentBySlug(slug));
    }
  });

  coursesToScan.forEach((course) => {
    (course.units || []).forEach((unit: UnitData) => {
      (unit.chapters || []).forEach((chap: ChapterData) => {
        // 1. Practice Exercises
        if (chap.practica && chap.practica.exercises && chap.practica.exercises.length > 0) {
          chap.practica.exercises.forEach((ex: PracticeExercise, idx: number) => {
            const statement = 'question' in ex ? ex.question : ('statement' in ex ? ex.statement : '');
            const existingMatch = existing.find(
              (b) => (ex.id && b.id === ex.id) || (statement && b.enunciadoLatex === statement)
            );

            if (existingMatch) {
              const hasAsg = existingMatch.asignaciones.some(
                (asg) => asg.chapterId === chap.id && asg.tab === 'practica'
              );
              if (!hasAsg) {
                existingMatch.asignaciones.push({
                  courseSlug: course.slug,
                  chapterId: chap.id,
                  tab: 'practica',
                });
              }
            } else {
              let tipo: ExerciseType = 'single_choice';
              if (ex.type === 'true_false') tipo = 'true_false';
              else if (ex.type === 'multiple_choice') tipo = 'multiple_choice';
              else if (ex.type === 'matching') tipo = 'matching';

              const uniqueId = ex.id || `bank-practica-${chap.id}-${idx + 1}-${Math.random().toString(36).substring(2, 7)}`;
              const newBankEx: BankExercise = {
                id: uniqueId,
                tipoEjercicio: tipo,
                titulo: ex.title || `Práctica ${idx + 1} - ${chap.title}`,
                enunciadoLatex: statement,
                nivelDificultad: 'Intermedio',
                materiaArea: course.category || course.title,
                temaSubtema: `${unit.title} > ${chap.title}`,
                tags: [
                  { tag: 'Práctica Interactiva', mostrarAlEstudiante: true },
                  { tag: course.slug, mostrarAlEstudiante: false },
                ],
                nivelCognitivo: 'Aplicar',
                pautaDetalladaLatex: ex.explanation || '',
                status: 'Listo',
                asignaciones: [{ courseSlug: course.slug, chapterId: chap.id, tab: 'practica' }],
                analytics: {
                  tasaAciertoHistorica: 85,
                  intentosPromedio: 1.2,
                  usoDePistaCount: 3,
                  dificultadPercibidaTotal: 10,
                  dificultadPercibidaVotos: 5,
                },
              };

              if (ex.type === 'true_false') {
                newBankEx.correctAnswer = ex.correctAnswer;
                newBankEx.trueFeedback = ex.trueFeedback;
                newBankEx.falseFeedback = ex.falseFeedback;
              } else if (ex.type === 'single_choice') {
                newBankEx.options = ex.options;
                newBankEx.correctOptionId = ex.correctOptionId;
              } else if (ex.type === 'multiple_choice') {
                newBankEx.options = ex.options;
                newBankEx.correctOptionIds = ex.correctOptionIds;
              } else if (ex.type === 'matching') {
                newBankEx.columns = ex.columns;
                newBankEx.col1Title = ex.col1Title;
                newBankEx.col2Title = ex.col2Title;
                newBankEx.col3Title = ex.col3Title;
                newBankEx.col1Items = ex.col1Items;
                newBankEx.col2Options = ex.col2Options;
                newBankEx.col3Options = ex.col3Options;
                newBankEx.correctMapping = ex.correctMapping;
                newBankEx.correctMappingCol3 = ex.correctMappingCol3;
              }

              existing.push(newBankEx);
            }
          });
        }

        // 2. Development Exercises
        if (chap.ejercicios && chap.ejercicios.problems && chap.ejercicios.problems.length > 0) {
          chap.ejercicios.problems.forEach((prob: string | ProblemItem, idx: number) => {
            const isObj = typeof prob === 'object' && prob !== null;
            const statement = isObj ? prob.problem : String(prob);
            const pauta = isObj ? prob.pauta : '';
            const probId = isObj && (prob as ProblemItem).id ? (prob as ProblemItem).id : null;

            const existingMatch = existing.find(
              (b) => (probId && b.id === probId) || (statement && b.enunciadoLatex === statement)
            );

            if (existingMatch) {
              const hasAsg = existingMatch.asignaciones.some(
                (asg) => asg.chapterId === chap.id && asg.tab === 'ejercicios'
              );
              if (!hasAsg) {
                existingMatch.asignaciones.push({
                  courseSlug: course.slug,
                  chapterId: chap.id,
                  tab: 'ejercicios',
                });
              }
            } else {
              const diffRaw = isObj ? (prob as ProblemItem).dificultad : 'Medio';
              let diff: DifficultyLevel = 'Intermedio';
              if (diffRaw === 'Básico') diff = 'Básico';
              else if (diffRaw === 'Alto') diff = 'Avanzado';

              const conceptos = isObj && (prob as ProblemItem).conceptos ? (prob as ProblemItem).conceptos! : [];
              const habilidades = isObj && (prob as ProblemItem).habilidades ? (prob as ProblemItem).habilidades! : [];

              const uniqueId = probId || `bank-desarrollo-${chap.id}-${idx + 1}-${Math.random().toString(36).substring(2, 7)}`;
              const newBankEx: BankExercise = {
                id: uniqueId,
                tipoEjercicio: 'desarrollo',
                titulo: `Problema ${idx + 1}: ${statement.slice(0, 45).replace(/[\$\*\#]/g, '')}...`,
                enunciadoLatex: statement,
                nivelDificultad: diff,
                materiaArea: course.category || course.title,
                temaSubtema: `${unit.title} > ${chap.title}`,
                tags: [
                  ...conceptos.map((c: string) => ({ tag: c, mostrarAlEstudiante: true })),
                  ...habilidades.map((h: string) => ({ tag: h, mostrarAlEstudiante: false })),
                ],
                nivelCognitivo: diff === 'Avanzado' ? 'Analizar' : 'Aplicar',
                pautaDetalladaLatex: pauta,
                status: 'Listo',
                asignaciones: [{ courseSlug: course.slug, chapterId: chap.id, tab: 'ejercicios' }],
                conceptos,
                habilidades,
                analytics: {
                  tasaAciertoHistorica: 78,
                  intentosPromedio: 1.5,
                  usoDePistaCount: 8,
                  dificultadPercibidaTotal: 15,
                  dificultadPercibidaVotos: 6,
                },
              };

              existing.push(newBankEx);
            }
          });
        }
      });
    });
  });

  // Strict deduplication by ID to prevent duplicate React keys
  const uniqueMap = new Map<string, BankExercise>();
  existing.forEach((ex) => {
    if (!uniqueMap.has(ex.id)) {
      uniqueMap.set(ex.id, ex);
    } else {
      // Re-assign a guaranteed unique ID if collision occurs
      const fixId = `${ex.id}-${Math.random().toString(36).substring(2, 7)}`;
      uniqueMap.set(fixId, { ...ex, id: fixId });
    }
  });

  const deduplicated = Array.from(uniqueMap.values());
  saveAllBankExercises(deduplicated);
  return deduplicated;
}

export function saveBankExercise(exercise: BankExercise): BankExercise[] {
  const current = getAllBankExercises();
  const index = current.findIndex((ex) => ex.id === exercise.id);

  let updated: BankExercise[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = exercise;
  } else {
    updated = [exercise, ...current];
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
  return updated;
}

export function saveAllBankExercises(exercises: BankExercise[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(exercises));
  }
}

export function deleteBankExercise(id: string): BankExercise[] {
  const current = getAllBankExercises();
  const updated = current.filter((ex) => ex.id !== id);

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
  return updated;
}

export function getBankExercisesByChapter(chapterId: string, tab: 'practica' | 'ejercicios'): BankExercise[] {
  const all = getAllBankExercises();
  return all.filter((ex) =>
    ex.asignaciones.some((asg) => asg.chapterId === chapterId && asg.tab === tab)
  );
}

export function recordStudentRating(exerciseId: string, rating: 1 | 2 | 3): void {
  const all = getAllBankExercises();
  const ex = all.find((item) => item.id === exerciseId);
  if (!ex) return;

  ex.analytics.dificultadPercibidaTotal += rating;
  ex.analytics.dificultadPercibidaVotos += 1;
  saveBankExercise(ex);
}

// Convert BankExercise to PracticeExercise for InteractivePractice component
export function toPracticeExercise(ex: BankExercise): PracticeExercise | null {
  if (ex.tipoEjercicio === 'true_false') {
    const tf: TrueFalseExercise = {
      id: ex.id,
      type: 'true_false',
      title: ex.titulo,
      statement: ex.enunciadoLatex,
      correctAnswer: ex.correctAnswer ?? true,
      explanation: ex.pautaDetalladaLatex || '',
      trueFeedback: ex.trueFeedback,
      falseFeedback: ex.falseFeedback,
    };
    return tf;
  }

  if (ex.tipoEjercicio === 'single_choice') {
    const sc: SingleChoiceExercise = {
      id: ex.id,
      type: 'single_choice',
      title: ex.titulo,
      question: ex.enunciadoLatex,
      options: ex.options || [],
      correctOptionId: ex.correctOptionId || (ex.options && ex.options[0]?.id) || '',
      explanation: ex.pautaDetalladaLatex || '',
    };
    return sc;
  }

  if (ex.tipoEjercicio === 'multiple_choice') {
    const mc: MultipleChoiceExercise = {
      id: ex.id,
      type: 'multiple_choice',
      title: ex.titulo,
      question: ex.enunciadoLatex,
      options: ex.options || [],
      correctOptionIds: ex.correctOptionIds || [],
      explanation: ex.pautaDetalladaLatex || '',
    };
    return mc;
  }

  if (ex.tipoEjercicio === 'matching') {
    const mt: MatchingExercise = {
      id: ex.id,
      type: 'matching',
      title: ex.titulo,
      question: ex.enunciadoLatex,
      columns: ex.columns,
      col1Title: ex.col1Title,
      col2Title: ex.col2Title,
      col3Title: ex.col3Title,
      col1Items: ex.col1Items || [],
      col2Options: ex.col2Options || [],
      col3Options: ex.col3Options,
      correctMapping: ex.correctMapping || {},
      correctMappingCol3: ex.correctMappingCol3,
      explanation: ex.pautaDetalladaLatex || '',
    };
    return mt;
  }

  return null;
}
