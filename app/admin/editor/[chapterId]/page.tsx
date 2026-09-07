'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChapterData, ProblemItem, FormulaItem, getCourseContentBySlug } from '@/lib/classroomData';
import { MathFormula, MathText } from '@/components/math/MathFormula';
import { TagAutocompleteSelector } from '@/components/admin/TagAutocompleteSelector';
import { PedagogicalToolbar } from '@/components/admin/PedagogicalToolbar';
import { LaTeXPedagogicalParser } from '@/components/math/LaTeXPedagogicalParser';
import { renderKaTeX } from '@/components/classroom/PedagogicalCards';
import { InteractivePractice, PracticeExercise } from '@/components/classroom/InteractivePractice';
import { ExerciseImportModal } from '@/components/admin/ExerciseImportModal';
import { GuideExerciseImportModal } from '@/components/admin/GuideExerciseImportModal';
import { CentralBankImportModal } from '@/components/admin/CentralBankImportModal';
import { GutterCodeEditor } from '@/components/admin/GutterCodeEditor';
import { EnvironmentFoldBar, ensureUnfoldedContent } from '@/components/admin/EnvironmentFoldBar';

function getOptionLabel(optId: string, index: number): string {
  if (!optId) return String.fromCharCode(65 + index);
  const clean = String(optId).trim();
  if (/^[A-Z]$/i.test(clean)) return clean.toUpperCase();

  const matchNum = clean.match(/\d+/);
  if (matchNum) {
    const num = parseInt(matchNum[0], 10);
    if (num >= 1 && num <= 26) {
      return String.fromCharCode(64 + num);
    }
  }

  return String.fromCharCode(65 + (index % 26));
}

export default function ChapterEditorPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const chapterId = (params.chapterId as string) || 'cap-1';
  const courseSlug = searchParams.get('slug') || 'calculo-diferencial';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Textarea Refs for Cursor-Position Insertion
  const motivacionRef = React.useRef<HTMLTextAreaElement>(null);
  const teoriaRef = React.useRef<HTMLTextAreaElement>(null);

  const insertSnippetAtCaret = (
    textarea: HTMLTextAreaElement | null,
    currentValue: string,
    snippet: string,
    onUpdate: (newVal: string) => void
  ) => {
    if (!textarea) {
      const nextVal = currentValue ? `${currentValue}\n\n${snippet}` : snippet;
      onUpdate(nextVal);
      return;
    }

    const savedScrollTop = textarea.scrollTop;
    const start = textarea.selectionStart ?? currentValue.length;
    const end = textarea.selectionEnd ?? currentValue.length;

    const before = currentValue.slice(0, start);
    const after = currentValue.slice(end);

    const prefix = before.length > 0 && !before.endsWith('\n') ? '\n\n' : '';
    const suffix = after.length > 0 && !after.startsWith('\n') ? '\n\n' : '';

    const newValue = before + prefix + snippet + suffix + after;
    onUpdate(newValue);

    setTimeout(() => {
      textarea.focus({ preventScroll: true });
      const newPos = start + prefix.length + snippet.length;
      textarea.setSelectionRange(newPos, newPos);
      textarea.scrollTop = savedScrollTop;
    }, 10);
  };

  const handlePreviewDoubleClick = (
    textarea: HTMLTextAreaElement | null,
    fullContent: string,
    clickedSnippet: string
  ) => {
    if (!textarea || !fullContent || !clickedSnippet) return;

    let clickedWord = clickedSnippet;
    let contextBlock = '';

    if (clickedSnippet.includes('|||')) {
      const parts = clickedSnippet.split('|||');
      clickedWord = parts[0].trim();
      contextBlock = parts[1].trim();
    }

    const cleanWord = clickedWord.replace(/\s+/g, ' ').trim();
    if (!cleanWord) return;

    let matchIndex = -1;
    let matchLength = cleanWord.length;

    // 1. If contextBlock is available, build sequence matching across embedded LaTeX markup
    if (contextBlock) {
      const wordsInContext = contextBlock
        .replace(/\\(mathbb|vec|textbf|textit|frac|dfrac|times|cdot|begin|end|[\w]+)/g, ' ')
        .replace(/[$#{}\\()[\]]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .split(' ')
        .filter((w) => w.length > 2);

      const wordIdx = wordsInContext.findIndex((w) => w.toLowerCase() === cleanWord.toLowerCase());
      const startW = Math.max(0, (wordIdx !== -1 ? wordIdx : 0) - 2);
      const endW = Math.min(wordsInContext.length, (wordIdx !== -1 ? wordIdx : 0) + 3);
      const windowWords = wordsInContext.slice(startW, endW);

      if (windowWords.length > 1) {
        const escWords = windowWords.map((w) => w.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'));
        const sequencePattern = escWords.join('[\\s\\S]*?');
        try {
          const reg = new RegExp(sequencePattern, 'i');
          const m = fullContent.match(reg);
          if (m && m.index !== undefined) {
            const matchRegion = m[0];
            const wordOffsetInRegion = matchRegion.toLowerCase().indexOf(cleanWord.toLowerCase());
            if (wordOffsetInRegion !== -1) {
              matchIndex = m.index + wordOffsetInRegion;
              matchLength = cleanWord.length;
            } else {
              matchIndex = m.index;
              matchLength = matchRegion.length;
            }
          }
        } catch (e) {}
      }
    }

    // 2. Direct exact match fallback
    if (matchIndex === -1) {
      matchIndex = fullContent.indexOf(cleanWord);
    }

    // 3. First word fallback
    if (matchIndex === -1 && cleanWord.length > 3) {
      const longWords = cleanWord.split(/\s+/).filter((w) => w.length > 3);
      for (const word of longWords) {
        const idx = fullContent.indexOf(word);
        if (idx !== -1) {
          matchIndex = idx;
          matchLength = word.length;
          break;
        }
      }
    }

    if (matchIndex !== -1) {
      textarea.focus();
      textarea.setSelectionRange(matchIndex, matchIndex + matchLength);

      const linesBefore = fullContent.slice(0, matchIndex).split('\n').length - 1;
      const targetScrollTop = linesBefore * 21; // 21px per line in GutterCodeEditor

      textarea.scrollTop = Math.max(0, targetScrollTop - 42);
      textarea.dispatchEvent(new Event('scroll'));
    }
  };

  // Active Editor Tab & Per-Tab Scroll Memory
  const [editorTab, setEditorTab] = useState<'general' | 'motivacion' | 'teoria' | 'practica' | 'ejercicios' | 'formulas'>('motivacion');
  const editorTabScrollMemoryRef = React.useRef<Record<string, number>>({});

  const handleEditorTabChange = (
    newTab: 'general' | 'motivacion' | 'teoria' | 'practica' | 'ejercicios' | 'formulas'
  ) => {
    editorTabScrollMemoryRef.current[editorTab] = window.scrollY;
    setEditorTab(newTab);
    setTimeout(() => {
      const savedScroll = editorTabScrollMemoryRef.current[newTab] ?? 0;
      window.scrollTo({ top: savedScroll, behavior: 'auto' });
    }, 10);
  };

  // Tag Pools State
  const [availableConceptos, setAvailableConceptos] = useState<string[]>([
    'Definición por Límite',
    'Recta Tangente',
    'Racionalización',
    'Límites Laterales',
    'Diferenciabilidad',
    'Valor Absoluto',
    'Cinemática',
    'Velocidad Instantánea',
    'Aceleración',
    'Regla de la Cadena',
    'Funciones Trigonométricas',
    'Derivación Implícita',
    'Folium de Descartes',
    'Optimización',
    'Trazado Curvilíneo',
    'Criterio de la Primera Derivada',
    'Criterio de la Segunda Derivada',
    'Concavidad y Puntos de Inflexión',
    'Integral Definida',
    'Sumas de Riemann',
    'Teorema Fundamental del Cálculo',
    'Métodos de Integración'
  ]);

  const [availableHabilidades, setAvailableHabilidades] = useState<string[]>([
    'Cálculo Algorítmico',
    'Razonamiento Gráfico',
    'Demostración Rigurosa',
    'Modelación e Ingeniería',
    'Elección de Método',
    'Análisis Crítico',
    'Interpretación Física'
  ]);

  // Chapter State
  const [chapter, setChapter] = useState<ChapterData>({
    id: chapterId,
    number: 1,
    title: '',
    summary: '',
    mathKey: '\\frac{dy}{dx} = \\lim_{\\Delta x \\to 0} \\frac{f(x+\\Delta x)-f(x)}{\\Delta x}',
    motivacion: '',
    teoria: '',
    practica: { text: '', videoUrl: '', pdfUrl: '' },
    ejercicios: {
      problems: [],
      formulasClave: []
    }
  });

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [guideImportModalOpen, setGuideImportModalOpen] = useState(false);
  const [bankImportModalOpen, setBankImportModalOpen] = useState(false);
  const [bankImportTab, setBankImportTab] = useState<'practica' | 'ejercicios'>('practica');
  const [allChaptersList, setAllChaptersList] = useState<ChapterData[]>([]);

  // 3-Layer Draft Protection & Dirty State
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [hasDraft, setHasDraft] = useState<boolean>(false);
  const draftKey = `editor_draft_${chapterId}`;
  const isLoadedRef = React.useRef<boolean>(false);
  const currentChapterIdRef = React.useRef<string>(chapterId);

  // Reset loaded ref when chapterId changes
  if (currentChapterIdRef.current !== chapterId) {
    currentChapterIdRef.current = chapterId;
    isLoadedRef.current = false;
  }

  // Auto-save local draft whenever chapter state changes
  useEffect(() => {
    if (!isLoadedRef.current) return;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(draftKey, JSON.stringify(chapter));
        setIsDirty(true);
        setHasDraft(true);
      } catch (e) {}
    }
  }, [chapter, draftKey]);

  // Warn user before closing tab if there are unsaved edits
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = 'Tienes cambios no guardados en este capítulo. ¿Seguro que deseas salir?';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const syncAvailableTags = (chData: ChapterData) => {
    if (!chData.ejercicios?.problems) return;
    const extractedConceptos: string[] = [];
    const extractedHabilidades: string[] = [];

    chData.ejercicios.problems.forEach((p) => {
      if (typeof p !== 'string') {
        if (p.conceptos) extractedConceptos.push(...p.conceptos);
        if (p.habilidades) extractedHabilidades.push(...p.habilidades);
      }
    });

    setAvailableConceptos((prev) => Array.from(new Set([...prev, ...extractedConceptos])));
    setAvailableHabilidades((prev) => Array.from(new Set([...prev, ...extractedHabilidades])));
  };

  const handleDeleteConcepto = (tagToDelete: string) => {
    setAvailableConceptos((prev) => prev.filter((t) => t !== tagToDelete));
    setChapter((prev) => ({
      ...prev,
      ejercicios: {
        ...prev.ejercicios,
        problems: prev.ejercicios?.problems?.map((p) => {
          if (typeof p !== 'string' && p.conceptos?.includes(tagToDelete)) {
            return { ...p, conceptos: p.conceptos.filter((c) => c !== tagToDelete) };
          }
          return p;
        }) || []
      }
    }));
  };

  const handleEditConcepto = (oldTag: string, newTag: string) => {
    const trimmed = newTag.trim();
    if (!trimmed || trimmed === oldTag) return;
    setAvailableConceptos((prev) => prev.map((t) => (t === oldTag ? trimmed : t)));
    setChapter((prev) => ({
      ...prev,
      ejercicios: {
        ...prev.ejercicios,
        problems: prev.ejercicios?.problems?.map((p) => {
          if (typeof p !== 'string' && p.conceptos?.includes(oldTag)) {
            return { ...p, conceptos: p.conceptos.map((c) => (c === oldTag ? trimmed : c)) };
          }
          return p;
        }) || []
      }
    }));
  };

  const handleDeleteHabilidad = (tagToDelete: string) => {
    setAvailableHabilidades((prev) => prev.filter((t) => t !== tagToDelete));
    setChapter((prev) => ({
      ...prev,
      ejercicios: {
        ...prev.ejercicios,
        problems: prev.ejercicios?.problems?.map((p) => {
          if (typeof p !== 'string' && p.habilidades?.includes(tagToDelete)) {
            return { ...p, habilidades: p.habilidades.filter((h) => h !== tagToDelete) };
          }
          return p;
        }) || []
      }
    }));
  };

  const handleEditHabilidad = (oldTag: string, newTag: string) => {
    const trimmed = newTag.trim();
    if (!trimmed || trimmed === oldTag) return;
    setAvailableHabilidades((prev) => prev.map((t) => (t === oldTag ? trimmed : t)));
    setChapter((prev) => ({
      ...prev,
      ejercicios: {
        ...prev.ejercicios,
        problems: prev.ejercicios?.problems?.map((p) => {
          if (typeof p !== 'string' && p.habilidades?.includes(oldTag)) {
            return { ...p, habilidades: p.habilidades.map((h) => (h === oldTag ? trimmed : h)) };
          }
          return p;
        }) || []
      }
    }));
  };

  useEffect(() => {
    // Auth Guard
    const session = localStorage.getItem('admin_session');
    if (!session) {
      router.push('/admin/login');
      return;
    }
    if (!isLoadedRef.current) {
      loadChapterData();
    }
  }, [chapterId]);

  const loadChapterData = async () => {
    // Protect unsaved local edits from being overwritten by background fetches
    if (isLoadedRef.current) {
      return;
    }

    // Check if local draft exists first BEFORE setting loading state to avoid DOM unmounting
    let draftData: ChapterData | null = null;
    if (typeof window !== 'undefined') {
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
        try {
          draftData = JSON.parse(savedDraft);
          setHasDraft(true);
        } catch (e) {}
      }
    }

    // Helper to fetch and populate chapter list for navigation buttons (Anterior / Siguiente)
    const fetchChapterList = async (): Promise<ChapterData[]> => {
      try {
        const res = await fetch(`/api/admin/courses?t=${Date.now()}`, { cache: 'no-store' });
        const data = await res.json();
        if (data.success && Array.isArray(data.courses)) {
          const course = data.courses.find((c: any) => c.slug === courseSlug) || data.courses[0];
          if (course) {
            let chaptersOrdered: ChapterData[] = [];
            if (course.units && course.units.length > 0) {
              const sortedUnits = course.units.slice().sort((a: any, b: any) => a.number - b.number);
              sortedUnits.forEach((u: any) => {
                const unitChs = (u.chapters || []).slice().sort((a: any, b: any) => a.number - b.number);
                chaptersOrdered.push(...unitChs);
              });
            } else if (course.chapters) {
              chaptersOrdered = (course.chapters || []).slice().sort((a: any, b: any) => a.number - b.number);
            }
            setAllChaptersList(chaptersOrdered);
            return chaptersOrdered;
          }
        }
      } catch (err) {
        console.error('Error loading chapter list in editor:', err);
      }

      // Fallback lookup from default course content
      const defaultCourse = getCourseContentBySlug(courseSlug);
      let fallbackOrdered: ChapterData[] = [];
      if (defaultCourse.units && defaultCourse.units.length > 0) {
        const sortedUnits = defaultCourse.units.slice().sort((a: any, b: any) => a.number - b.number);
        sortedUnits.forEach((u) => {
          const unitChs = (u.chapters || []).slice().sort((a, b) => a.number - b.number);
          fallbackOrdered.push(...unitChs);
        });
      } else if (defaultCourse.chapters) {
        fallbackOrdered = (defaultCourse.chapters || []).slice().sort((a, b) => a.number - b.number);
      }
      setAllChaptersList(fallbackOrdered);
      return fallbackOrdered;
    };

    if (draftData) {
      setChapter(draftData);
      setIsDirty(true);
      setLoading(false);
      isLoadedRef.current = true;
      fetchChapterList();
      return;
    }

    setLoading(true);
    const chaptersList = await fetchChapterList();
    const foundChapter = chaptersList.find((ch: any) => ch.id === chapterId);
    if (foundChapter) {
      setChapter(foundChapter);
    }
    setLoading(false);
    isLoadedRef.current = true;
  };

  const handleDiscardDraft = () => {
    if (confirm('¿Descartar el borrador local y recargar la versión guardada del servidor?')) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(draftKey);
      }
      setIsDirty(false);
      setHasDraft(false);
      isLoadedRef.current = false;
      loadChapterData();
    }
  };

  const handleSaveChapter = async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      const cleanChapter = {
        ...chapter,
        motivacion: ensureUnfoldedContent(chapter.motivacion || ''),
        teoria: ensureUnfoldedContent(chapter.teoria || ''),
        practica: {
          ...chapter.practica,
          text: ensureUnfoldedContent(chapter.practica?.text || '')
        }
      };

      const res = await fetch('/api/admin/chapters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseSlug, chapter: cleanChapter })
      });
      const data = await res.json();
      if (data.success) {
        setSaveMessage('¡Capítulo guardado con éxito!');
        setIsDirty(false);
        setHasDraft(false);
        if (typeof window !== 'undefined') {
          localStorage.removeItem(draftKey);
        }
        setTimeout(() => setSaveMessage(null), 3500);
      } else {
        alert('Error al guardar: ' + (data.error || 'Intente nuevamente'));
      }
    } catch (err) {
      console.error('Error saving chapter:', err);
      alert('Error de conexión al guardar capítulo');
    }
    setSaving(false);
  };

  // Helper Handlers for Problems & Technical Cards
  const handleAddProblem = () => {
    const newProblem: ProblemItem = {
      problem: 'Nuevo problema propuesto en LaTeX: $f(x) = ...$',
      pauta: '1. Solución paso a paso...',
      dificultad: 'Medio',
      conceptos: ['Concepto Clave'],
      habilidades: ['Cálculo Algorítmico']
    };
    setChapter((prev) => ({
      ...prev,
      ejercicios: {
        ...prev.ejercicios,
        problems: [...prev.ejercicios.problems, newProblem]
      }
    }));
  };

  const handleUpdateProblem = (index: number, updatedProps: Partial<ProblemItem>) => {
    setChapter((prev) => {
      const newProblems = [...prev.ejercicios.problems];
      const existing = typeof newProblems[index] === 'string'
        ? { problem: newProblems[index] as string, pauta: '' }
        : (newProblems[index] as ProblemItem);

      newProblems[index] = { ...existing, ...updatedProps };
      return {
        ...prev,
        ejercicios: { ...prev.ejercicios, problems: newProblems }
      };
    });
  };

  const handleDeleteProblem = (index: number) => {
    if (!confirm('¿Eliminar este ejercicio de la guía?')) return;
    setChapter((prev) => {
      const newProblems = [...prev.ejercicios.problems];
      newProblems.splice(index, 1);
      return {
        ...prev,
        ejercicios: { ...prev.ejercicios, problems: newProblems }
      };
    });
  };

  const handleMoveProblem = (index: number, direction: 'up' | 'down') => {
    setChapter((prev) => {
      if (!prev?.ejercicios?.problems) return prev;
      const newProblems = [...prev.ejercicios.problems];
      const targetIdx = direction === 'up' ? index - 1 : index + 1;
      if (targetIdx < 0 || targetIdx >= newProblems.length) return prev;

      const temp = newProblems[index];
      newProblems[index] = newProblems[targetIdx];
      newProblems[targetIdx] = temp;

      return {
        ...prev,
        ejercicios: { ...prev.ejercicios, problems: newProblems }
      };
    });
  };

  // Helper Handlers for Key Formulas
  const handleAddFormula = () => {
    const newFormula: FormulaItem = {
      label: 'Nueva Fórmula',
      latex: 'y = mx + b',
      description: 'Ecuación general'
    };
    setChapter((prev) => ({
      ...prev,
      ejercicios: {
        ...prev.ejercicios,
        formulasClave: [...prev.ejercicios.formulasClave, newFormula]
      }
    }));
  };

  const handleUpdateFormula = (index: number, updatedProps: Partial<FormulaItem>) => {
    setChapter((prev) => {
      const newFormulas = [...prev.ejercicios.formulasClave];
      newFormulas[index] = { ...newFormulas[index], ...updatedProps };
      return {
        ...prev,
        ejercicios: { ...prev.ejercicios, formulasClave: newFormulas }
      };
    });
  };

  const handleDeleteFormula = (index: number) => {
    setChapter((prev) => {
      const newFormulas = [...prev.ejercicios.formulasClave];
      newFormulas.splice(index, 1);
      return {
        ...prev,
        ejercicios: { ...prev.ejercicios, formulasClave: newFormulas }
      };
    });
  };

  const handleMoveFormula = (index: number, direction: 'up' | 'down') => {
    setChapter((prev) => {
      if (!prev?.ejercicios?.formulasClave) return prev;
      const newFormulas = [...prev.ejercicios.formulasClave];
      const targetIdx = direction === 'up' ? index - 1 : index + 1;
      if (targetIdx < 0 || targetIdx >= newFormulas.length) return prev;

      const temp = newFormulas[index];
      newFormulas[index] = newFormulas[targetIdx];
      newFormulas[targetIdx] = temp;

      return {
        ...prev,
        ejercicios: { ...prev.ejercicios, formulasClave: newFormulas }
      };
    });
  };

  // Helper Handlers for Interactive Practice Exercises (Pestaña 3)
  const handleAddPracticeExercise = (type: 'true_false' | 'single_choice' | 'multiple_choice' | 'matching') => {
    setChapter((prev) => {
      const currentList: PracticeExercise[] = prev.practica?.exercises || [];
      const id = `ex-${Date.now()}`;
      let newEx: PracticeExercise;

      if (type === 'true_false') {
        newEx = {
          id,
          type: 'true_false',
          title: `Ejercicio ${currentList.length + 1}: Verdadero o Falso`,
          statement: 'Si $f(x)$ es continua en $x_0$, entonces es diferenciable en $x_0$.',
          correctAnswer: false,
          explanation: 'Falso. Un contraejemplo clásico es $f(x) = |x|$ en $x = 0$.',
          trueFeedback: '¡Incorrecto! La continuidad no garantiza la diferenciabilidad.',
          falseFeedback: '¡Correcto! La continuidad es necesaria pero no suficiente.'
        };
      } else if (type === 'single_choice') {
        newEx = {
          id,
          type: 'single_choice',
          title: `Ejercicio ${currentList.length + 1}: Selección Única`,
          question: '¿Cuál es la derivada de $f(x) = \\sin(x^2)$?',
          options: [
            { id: 'A', text: '$2x \\cos(x^2)$', feedback: '¡Excelente! Aplicaste correctamente la regla de la cadena.' },
            { id: 'B', text: '$\\cos(x^2)$', feedback: 'Incorrecto. Olvidaste derivar la función interna $x^2$.' },
            { id: 'C', text: '$2x \\sin(x^2)$', feedback: 'Incorrecto. La derivada del seno es el coseno.' }
          ],
          correctOptionId: 'A',
          explanation: 'Por la regla de la cadena: $\\frac{d}{dx}[\\sin(u)] = \\cos(u) \\cdot u\'$.'
        };
      } else if (type === 'multiple_choice') {
        newEx = {
          id,
          type: 'multiple_choice',
          title: `Ejercicio ${currentList.length + 1}: Selección Múltiple`,
          question: 'Selecciona todas las propiedades afines a las funciones derivables:',
          options: [
            { id: 'A', text: 'Tienen recta tangente única no vertical.', feedback: 'Correcto. Es la definición geométrica.' },
            { id: 'B', text: 'Son necesariamente continuas en ese punto.', feedback: 'Correcto. Diferenciabilidad implica continuidad.' },
            { id: 'C', text: 'Tienen derivada infinita en puntos angulosos.', feedback: 'Incorrecto. En puntos angulosos las derivadas laterales difieren.' }
          ],
          correctOptionIds: ['A', 'B'],
          explanation: 'Las opciones A y B son teoremas fundamentales.'
        };
      } else {
        newEx = {
          id,
          type: 'matching',
          title: `Ejercicio ${currentList.length + 1}: Emparejamiento de Columnas`,
          columns: 2,
          question: 'Relaciona cada límite con su resultado:',
          col1Title: 'Columna 1: Límite',
          col2Title: 'Columna 2: Resultado',
          col1Items: [
            { id: '1', num: 1, text: '$\\lim_{x \\to 0} \\frac{\\sin x}{x}$' },
            { id: '2', num: 2, text: '$\\lim_{x \\to 0} \\frac{1 - \\cos x}{x}$' }
          ],
          col2Options: [
            { letter: 'A', text: '$1$' },
            { letter: 'B', text: '$0$' }
          ],
          correctMapping: { '1': 'A', '2': 'B' },
          explanation: 'Límites trigonométricos notables.'
        };
      }

      return {
        ...prev,
        practica: {
          ...prev.practica,
          exercises: [...currentList, newEx]
        }
      };
    });
  };

  const handleBatchImportExercises = (newExercises: PracticeExercise[]) => {
    setChapter((prev) => {
      if (!prev) return null as any;
      const currentList: PracticeExercise[] = prev.practica?.exercises || [];
      return {
        ...prev,
        practica: {
          ...prev.practica,
          exercises: [...currentList, ...newExercises]
        }
      };
    });
  };

  const handleBatchImportGuideExercises = (newProblems: ProblemItem[]) => {
    setChapter((prev) => {
      if (!prev) return null as any;
      const currentList = prev.ejercicios?.problems || [];
      return {
        ...prev,
        ejercicios: {
          ...prev.ejercicios,
          problems: [...currentList, ...newProblems]
        }
      };
    });
  };

  const handleUpdatePracticeExercise = (index: number, updatedEx: PracticeExercise) => {
    setChapter((prev) => {
      const currentList: PracticeExercise[] = [...(prev.practica?.exercises || [])];
      currentList[index] = updatedEx;
      return {
        ...prev,
        practica: {
          ...prev.practica,
          exercises: currentList
        }
      };
    });
  };

  const handleDeletePracticeExercise = (index: number) => {
    if (!confirm('¿Eliminar este ejercicio práctico?')) return;
    setChapter((prev) => {
      const currentList: PracticeExercise[] = [...(prev.practica?.exercises || [])];
      currentList.splice(index, 1);
      return {
        ...prev,
        practica: {
          ...prev.practica,
          exercises: currentList
        }
      };
    });
  };

  const handleMovePracticeExercise = (index: number, direction: 'up' | 'down') => {
    setChapter((prev) => {
      const currentList: PracticeExercise[] = [...(prev.practica?.exercises || [])];
      const targetIdx = direction === 'up' ? index - 1 : index + 1;
      if (targetIdx < 0 || targetIdx >= currentList.length) return prev;

      const temp = currentList[index];
      currentList[index] = currentList[targetIdx];
      currentList[targetIdx] = temp;

      return {
        ...prev,
        practica: {
          ...prev.practica,
          exercises: currentList
        }
      };
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-title text-slate-700">
        <div className="flex items-center gap-3">
          <i className="fa-solid fa-circle-notch fa-spin text-cyan-600 text-2xl"></i>
          <span className="font-bold">Cargando Editor de Capítulo...</span>
        </div>
      </div>
    );
  }

  const currentChapterIndex = allChaptersList.findIndex((ch) => ch.id === chapterId);
  const prevChapter = currentChapterIndex > 0 ? allChaptersList[currentChapterIndex - 1] : null;
  const nextChapter = currentChapterIndex >= 0 && currentChapterIndex < allChaptersList.length - 1 ? allChaptersList[currentChapterIndex + 1] : null;

  const handleNavigateWithAutoSave = async (targetChapterId?: string | null, targetUrl?: string) => {
    try {
      const cleanChapter = {
        ...chapter,
        motivacion: ensureUnfoldedContent(chapter.motivacion || ''),
        teoria: ensureUnfoldedContent(chapter.teoria || ''),
        practica: {
          ...chapter.practica,
          text: ensureUnfoldedContent(chapter.practica?.text || '')
        }
      };

      await fetch('/api/admin/chapters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseSlug, chapter: cleanChapter })
      });
    } catch (err) {
      console.error('Auto-save on navigate error:', err);
    }
    if (targetChapterId) {
      if (typeof window !== 'undefined') {
        window.location.href = `/admin/editor/${targetChapterId}?slug=${courseSlug}`;
      } else {
        router.push(`/admin/editor/${targetChapterId}?slug=${courseSlug}`);
      }
    } else if (targetUrl) {
      if (typeof window !== 'undefined') {
        window.location.href = targetUrl;
      } else {
        router.push(targetUrl);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans overflow-x-hidden">
      {/* Header Bar */}
      <header className="h-16 border-b border-slate-200 bg-white sticky top-0 z-50 shadow-sm" style={{ paddingLeft: '48px', paddingRight: '48px' }}>
        <div className="w-full max-w-[1800px] mx-auto h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => handleNavigateWithAutoSave(null, '/admin/dashboard')}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              title="Guardar automáticamente y volver al Dashboard"
            >
              <i className="fa-solid fa-arrow-left text-sm"></i>
            </button>

            {/* Selector de Navegación Capítulo Anterior / Siguiente */}
            <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => prevChapter && handleNavigateWithAutoSave(prevChapter.id)}
                disabled={!prevChapter}
                className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-700 hover:bg-white hover:shadow-2xs disabled:opacity-30 disabled:hover:bg-transparent transition-all flex items-center gap-1.5 font-title cursor-pointer"
                title={prevChapter ? `Guardar e ir a Capítulo ${prevChapter.number}: ${prevChapter.title}` : 'Primer capítulo'}
              >
                <i className="fa-solid fa-chevron-left text-[10px] text-cyan-600"></i>
                <span>Anterior</span>
              </button>

              <span className="text-slate-300 font-light text-xs">|</span>

              <button
                type="button"
                onClick={() => nextChapter && handleNavigateWithAutoSave(nextChapter.id)}
                disabled={!nextChapter}
                className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-700 hover:bg-white hover:shadow-2xs disabled:opacity-30 disabled:hover:bg-transparent transition-all flex items-center gap-1.5 font-title cursor-pointer"
                title={nextChapter ? `Guardar e ir a Capítulo ${nextChapter.number}: ${nextChapter.title}` : 'Último capítulo'}
              >
                <span>Siguiente</span>
                <i className="fa-solid fa-chevron-right text-[10px] text-cyan-600"></i>
              </button>
            </div>

            <div>
              <h1 className="font-extrabold text-base text-slate-900 font-title">
                Editor de Capítulo {chapter.number}: {chapter.title || 'Sin Título'}
              </h1>
              <span className="text-xs text-slate-500 font-title">Curso: {courseSlug}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isDirty && (
              <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/80 px-2.5 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800 font-title flex items-center gap-1.5 shadow-2xs">
                <i className="fa-solid fa-pen-line text-amber-600 dark:text-amber-400"></i> Borrador no guardado (Auto-guardado local)
                <button
                  type="button"
                  onClick={handleDiscardDraft}
                  className="ml-1 text-[10px] text-amber-900 dark:text-amber-200 underline hover:text-rose-600 transition-colors cursor-pointer"
                  title="Descartar borrador local y recargar versión guardada del servidor"
                >
                  Descartar
                </button>
              </span>
            )}

            {saveMessage && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-300 font-title">
                <i className="fa-solid fa-circle-check mr-1.5"></i> {saveMessage}
              </span>
            )}

            <Link
              href={`/curso/${courseSlug}`}
              target="_blank"
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-2 border border-slate-200 font-title"
            >
              <i className="fa-solid fa-eye text-cyan-600"></i> Ver Alumno
            </Link>

            <button
              onClick={handleSaveChapter}
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 font-title disabled:opacity-50 cursor-pointer"
            >
              <i className={`fa-solid ${saving ? 'fa-circle-notch fa-spin' : 'fa-floppy-disk'}`}></i>
              <span>{saving ? 'Guardando...' : '💾 Guardar Capítulo'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Editor Main Content */}
      <div className="flex-1 w-full max-w-[1800px] mx-auto py-6" style={{ paddingLeft: '48px', paddingRight: '48px' }}>
        {/* Editor Tabs Navigation */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 mb-8 pb-1">
          <button
            className={`px-4 py-2.5 text-xs md:text-sm font-bold rounded-t-xl transition-all flex items-center gap-2 border-b-2 font-title cursor-pointer ${
              editorTab === 'motivacion'
                ? 'border-cyan-600 text-cyan-600 bg-white shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
            onClick={() => handleEditorTabChange('motivacion')}
          >
            <i className="fa-solid fa-lightbulb text-cyan-600"></i> Pestaña 1: Motivación
          </button>

          <button
            className={`px-4 py-2.5 text-xs md:text-sm font-bold rounded-t-xl transition-all flex items-center gap-2 border-b-2 font-title cursor-pointer ${
              editorTab === 'teoria'
                ? 'border-cyan-600 text-cyan-600 bg-white shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
            onClick={() => handleEditorTabChange('teoria')}
          >
            <i className="fa-solid fa-book-open text-indigo-600"></i> Pestaña 2: Teoría
          </button>

          <button
            className={`px-4 py-2.5 text-xs md:text-sm font-bold rounded-t-xl transition-all flex items-center gap-2 border-b-2 font-title cursor-pointer ${
              editorTab === 'practica'
                ? 'border-cyan-600 text-cyan-600 bg-white shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
            onClick={() => handleEditorTabChange('practica')}
          >
            <i className="fa-solid fa-person-chalkboard text-emerald-600"></i> Pestaña 3: Práctica Interactiva ({chapter.practica?.exercises?.length || 0})
          </button>

          <button
            className={`px-4 py-2.5 text-xs md:text-sm font-bold rounded-t-xl transition-all flex items-center gap-2 border-b-2 font-title cursor-pointer ${
              editorTab === 'ejercicios'
                ? 'border-cyan-600 text-cyan-600 bg-white shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
            onClick={() => handleEditorTabChange('ejercicios')}
          >
            <i className="fa-solid fa-calculator text-amber-600"></i> Pestaña 4: Ejercicios ({chapter.ejercicios?.problems?.length || 0})
          </button>

          <button
            className={`px-4 py-2.5 text-xs md:text-sm font-bold rounded-t-xl transition-all flex items-center gap-2 border-b-2 font-title cursor-pointer ${
              editorTab === 'formulas'
                ? 'border-cyan-600 text-cyan-600 bg-white shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
            onClick={() => handleEditorTabChange('formulas')}
          >
            <i className="fa-solid fa-square-root-variable text-purple-600"></i> Fórmulas Clave ({chapter.ejercicios?.formulasClave?.length || 0})
          </button>

          <button
            className={`px-4 py-2.5 text-xs md:text-sm font-bold rounded-t-xl transition-all flex items-center gap-2 border-b-2 font-title cursor-pointer ${
              editorTab === 'general'
                ? 'border-cyan-600 text-cyan-600 bg-white shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
            onClick={() => handleEditorTabChange('general')}
          >
            <i className="fa-solid fa-gear text-slate-600"></i> Datos Generales
          </button>
        </div>

        {/* TAB: EJERCICIOS Y FICHAS TÉCNICAS */}
        {editorTab === 'ejercicios' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 font-title">Gestión de Ejercicios y Fichas Técnicas</h2>
                <p className="text-xs text-slate-500 mt-0.5">Edita enunciados en KaTeX, soluciones y asigna dificultad, conceptos clave y habilidades cognitivas.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAddProblem}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer font-title"
                >
                  <i className="fa-solid fa-plus"></i> + Agregar Ejercicio
                </button>
                <button
                  onClick={() => {
                    setBankImportTab('ejercicios');
                    setBankImportModalOpen(true);
                  }}
                  className="px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer font-title shadow-xs"
                  title="Seleccionar ejercicios de desarrollo del Banco Central"
                >
                  <i className="fa-solid fa-vault"></i> 🏛️ + Desde Banco Central
                </button>
                <button
                  onClick={() => setGuideImportModalOpen(true)}
                  className="px-3.5 py-2 bg-gradient-to-r from-amber-600 via-purple-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer font-title shadow-xs"
                  title="Importar varios ejercicios resueltos en bloque usando sintaxis LaTeX"
                >
                  <i className="fa-solid fa-file-import"></i> 📥 Importar en Bloque (LaTeX)
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {chapter.ejercicios?.problems?.map((pItem, idx) => {
                const prob = typeof pItem === 'string' ? { problem: pItem, pauta: '' } : (pItem as ProblemItem);
                const dificultad = prob.dificultad || 'Medio';
                const conceptosStr = (prob.conceptos || []).join(', ');
                const habilidadesStr = (prob.habilidades || []).join(', ');

                return (
                  <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
                    {/* Header Ejercicio */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-cyan-600 text-white font-bold text-xs flex items-center justify-center font-title">
                          {idx + 1}
                        </span>
                        <span className="font-extrabold text-sm text-slate-800 font-title">Ejercicio #{idx + 1}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleMoveProblem(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1.5 text-xs text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer font-bold"
                          title="Mover arriba"
                        >
                          <i className="fa-solid fa-arrow-up"></i>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveProblem(idx, 'down')}
                          disabled={idx === (chapter.ejercicios?.problems?.length || 0) - 1}
                          className="p-1.5 text-xs text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer font-bold"
                          title="Mover abajo"
                        >
                          <i className="fa-solid fa-arrow-down"></i>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProblem(idx)}
                          className="text-xs px-3 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold transition-colors cursor-pointer font-title ml-1"
                        >
                          <i className="fa-solid fa-trash mr-1"></i> Eliminar
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Formulario Inputs Ejercicio */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 font-title">
                            Enunciado del Problema (LaTeX / Texto)
                          </label>
                          <textarea
                            rows={4}
                            value={prob.problem}
                            onChange={(e) => handleUpdateProblem(idx, { problem: e.target.value })}
                            className="w-full p-3 rounded-xl border border-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-sm font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 font-title">
                            Pauta / Solución Paso a Paso (LaTeX / Texto)
                          </label>
                          <textarea
                            rows={4}
                            value={prob.pauta}
                            onChange={(e) => handleUpdateProblem(idx, { pauta: e.target.value })}
                            className="w-full p-3 rounded-xl border border-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-sm font-mono"
                          />
                        </div>

                        {/* Ficha Técnica Metadata Inputs (Predictive Autocomplete Selectors) */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 font-title">
                              Dificultad
                            </label>
                            <select
                              value={dificultad}
                              onChange={(e) => handleUpdateProblem(idx, { dificultad: e.target.value as any })}
                              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white"
                            >
                              <option value="Básico">🟢 Básico</option>
                              <option value="Medio">🟡 Medio</option>
                              <option value="Alto">🔴 Alto</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 font-title">
                              Conceptos Clave (Desplegable y Predecible)
                            </label>
                            <TagAutocompleteSelector
                              selectedTags={prob.conceptos || []}
                              availableTags={availableConceptos}
                              onChange={(newTags) => handleUpdateProblem(idx, { conceptos: newTags })}
                              onAddNewTag={(newTag) =>
                                setAvailableConceptos((prev) => Array.from(new Set([...prev, newTag])))
                              }
                              onDeleteTag={handleDeleteConcepto}
                              onEditTag={handleEditConcepto}
                              placeholder="Buscar o seleccionar concepto..."
                              colorTheme="cyan"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 font-title">
                              Habilidades Cognitivas (Desplegable y Predecible)
                            </label>
                            <TagAutocompleteSelector
                              selectedTags={prob.habilidades || []}
                              availableTags={availableHabilidades}
                              onChange={(newTags) => handleUpdateProblem(idx, { habilidades: newTags })}
                              onAddNewTag={(newTag) =>
                                setAvailableHabilidades((prev) => Array.from(new Set([...prev, newTag])))
                              }
                              onDeleteTag={handleDeleteHabilidad}
                              onEditTag={handleEditHabilidad}
                              placeholder="Buscar o seleccionar habilidad..."
                              colorTheme="purple"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Preview en Tiempo Real KaTeX */}
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-title">
                          <i className="fa-solid fa-eye text-cyan-600 mr-1"></i> Vista Previa en Vivo (Estudiante)
                        </span>

                        {/* Enunciado */}
                        <div className="bg-white border border-slate-200/90 rounded-xl p-4 text-sm leading-relaxed">
                          {renderKaTeX(prob.problem)}
                        </div>

                        {/* Pauta / Solución Paso a Paso */}
                        {prob.pauta && prob.pauta.trim().length > 0 && (
                          <div className="bg-emerald-50/90 border-l-4 border-emerald-500 rounded-r-xl p-4 text-xs leading-relaxed text-slate-800 space-y-2">
                            <div className="flex items-center gap-2 font-bold text-emerald-800 font-title border-b border-emerald-200/60 pb-1.5">
                              <i className="fa-solid fa-square-check text-emerald-600"></i>
                              <span>Indicaciones / Solución Paso a Paso:</span>
                            </div>
                            <div className="font-medium">
                              {renderKaTeX(prob.pauta)}
                            </div>
                          </div>
                        )}

                        {/* Ficha Técnica Card Preview */}
                        <div className="bg-slate-100/90 border border-slate-200 rounded-xl p-3.5 space-y-2.5 text-xs">
                          <div className="text-center pb-1.5 border-b border-slate-200">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 font-title">
                              📋 Ficha Técnica
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold uppercase text-slate-400 block">Dificultad:</span>
                            <span className="font-bold text-cyan-700">{dificultad}</span>
                          </div>
                          {prob.conceptos && prob.conceptos.length > 0 && (
                            <div>
                              <span className="text-[9px] font-bold uppercase text-slate-400 block font-title">Conceptos:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {prob.conceptos.map((c, cIdx) => (
                                  <span key={cIdx} className="px-2 py-0.5 rounded bg-cyan-100 text-cyan-800 text-[10px] font-bold font-title">
                                    {c}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {prob.habilidades && prob.habilidades.length > 0 && (
                            <div>
                              <span className="text-[9px] font-bold uppercase text-slate-400 block font-title">Habilidades Cognitivas:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {prob.habilidades.map((h, hIdx) => (
                                  <span key={hIdx} className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-bold font-title">
                                    {h}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB: FÓRMULAS CLAVE */}
        {editorTab === 'formulas' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 font-title">Fórmulas Clave (Pantalla Dividida)</h2>
                <p className="text-xs text-slate-500 mt-0.5">Agrega las expresiones en LaTeX que se muestran al presionar el botón "Dividir Pantalla".</p>
              </div>
              <button
                onClick={handleAddFormula}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer font-title"
              >
                <i className="fa-solid fa-plus"></i> + Agregar Fórmula
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {chapter.ejercicios?.formulasClave?.map((f, fIdx) => (
                <div key={fIdx} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-purple-700 font-title">Fórmula #{fIdx + 1}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleMoveFormula(fIdx, 'up')}
                        disabled={fIdx === 0}
                        className="p-1 text-xs text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer font-bold"
                        title="Mover arriba"
                      >
                        <i className="fa-solid fa-arrow-up"></i>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveFormula(fIdx, 'down')}
                        disabled={fIdx === (chapter.ejercicios?.formulasClave?.length || 0) - 1}
                        className="p-1 text-xs text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer font-bold"
                        title="Mover abajo"
                      >
                        <i className="fa-solid fa-arrow-down"></i>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteFormula(fIdx)}
                        className="text-xs text-rose-600 hover:text-rose-800 font-bold ml-1 cursor-pointer"
                        title="Eliminar fórmula"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase font-title">Nombre / Etiqueta</label>
                    <input
                      type="text"
                      value={f.label}
                      onChange={(e) => handleUpdateFormula(fIdx, { label: e.target.value })}
                      className="w-full p-2 text-xs border border-slate-200 rounded-lg font-bold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase font-title">Expresión en LaTeX</label>
                    <input
                      type="text"
                      value={f.latex}
                      onChange={(e) => handleUpdateFormula(fIdx, { latex: e.target.value })}
                      className="w-full p-2 text-xs border border-slate-200 rounded-lg font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase font-title">
                      Comentario / Explicación Pedagógica (Soporta LaTeX $...$)
                    </label>
                    <textarea
                      rows={2}
                      value={f.description || ''}
                      onChange={(e) => handleUpdateFormula(fIdx, { description: e.target.value })}
                      placeholder="Ej: Representa la razón de cambio instantánea cuando $h \to 0$."
                      className="w-full p-2 text-xs border border-slate-200 rounded-lg font-medium"
                    />
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2 text-center">
                    <MathFormula latex={f.latex} block />
                    {f.description && f.description.trim().length > 0 && (
                      <div className="text-xs text-slate-600 border-t border-slate-200/80 pt-2 font-medium">
                        <MathText text={f.description} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: PESTAÑA 3 - PRÁCTICA INTERACTIVA */}
        {editorTab === 'practica' && (
          <div className="space-y-6 min-w-0">
            {/* Top Control Bar Panel */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 space-y-4 shadow-xs min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 font-title mb-0.5">
                    Editor de Pestaña 3: Práctica Interactiva
                  </h2>
                  <p className="text-xs text-slate-500">
                    Crea y administra ejercicios interactivos con vista previa paralela en vivo ejercicio por ejercicio.
                  </p>
                </div>

                {/* Add Exercise Buttons */}
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => handleAddPracticeExercise('true_false')}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 font-title cursor-pointer"
                  >
                    <i className="fa-solid fa-plus"></i> V/F
                  </button>
                  <button
                    onClick={() => handleAddPracticeExercise('single_choice')}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 font-title cursor-pointer"
                  >
                    <i className="fa-solid fa-plus"></i> Selec. Única
                  </button>
                  <button
                    onClick={() => handleAddPracticeExercise('multiple_choice')}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 font-title cursor-pointer"
                  >
                    <i className="fa-solid fa-plus"></i> Selec. Múltiple
                  </button>
                  <button
                    onClick={() => handleAddPracticeExercise('matching')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 font-title cursor-pointer"
                  >
                    <i className="fa-solid fa-plus"></i> Emparejamiento
                  </button>
                  <button
                    onClick={() => {
                      setBankImportTab('practica');
                      setBankImportModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 font-title cursor-pointer"
                    title="Seleccionar ejercicios interactivos del Banco Central"
                  >
                    <i className="fa-solid fa-vault"></i> 🏛️ + Desde Banco Central
                  </button>
                  <button
                    onClick={() => setImportModalOpen(true)}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 font-title cursor-pointer ml-1"
                    title="Importar varios ejercicios en bloque usando etiquetas LaTeX"
                  >
                    <i className="fa-solid fa-file-import"></i> 📥 Importar en Bloque (LaTeX)
                  </button>
                </div>
              </div>
            </div>

            {/* Exercise List with Parallel Preview per Card */}
            {(!chapter.practica?.exercises || chapter.practica.exercises.length === 0) ? (
              <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center text-slate-400 space-y-2">
                <i className="fa-solid fa-gamepad text-4xl text-slate-300"></i>
                <p className="text-sm font-bold text-slate-600 font-title">No hay ejercicios prácticos agregados aún.</p>
                <p className="text-xs">Utiliza los botones superiores para agregar ejercicios interactivos o importar en bloque.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {chapter.practica.exercises.map((ex, exIdx) => (
                  <div
                    key={ex.id || exIdx}
                    className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-5"
                  >
                    {/* Exercise Card Header */}
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3.5">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-xl bg-gradient-to-br from-cyan-600 to-indigo-600 text-white text-xs font-bold flex items-center justify-center font-title shadow-2xs">
                          {exIdx + 1}
                        </span>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-700 font-title">
                          {ex.type === 'true_false' && '🟡 Verdadero / Falso'}
                          {ex.type === 'single_choice' && '🔵 Selección Única'}
                          {ex.type === 'multiple_choice' && '🟣 Selección Múltiple'}
                          {ex.type === 'matching' && '🟢 Emparejamiento'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleMovePracticeExercise(exIdx, 'up')}
                          disabled={exIdx === 0}
                          className="p-1.5 text-xs text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                          title="Mover arriba"
                        >
                          <i className="fa-solid fa-arrow-up"></i>
                        </button>
                        <button
                          onClick={() => handleMovePracticeExercise(exIdx, 'down')}
                          disabled={exIdx === (chapter.practica?.exercises?.length || 0) - 1}
                          className="p-1.5 text-xs text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                          title="Mover abajo"
                        >
                          <i className="fa-solid fa-arrow-down"></i>
                        </button>
                        <button
                          onClick={() => handleDeletePracticeExercise(exIdx)}
                          className="p-1.5 text-xs text-rose-600 hover:text-rose-800 font-bold cursor-pointer ml-1"
                          title="Eliminar ejercicio"
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </div>
                    </div>

                    {/* 2-Column Side-by-Side (Parallel) Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                      {/* Column 1: Form Inputs */}
                      <div className="space-y-5 min-w-0">

                      {/* Common Title & Statement */}
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[11px] font-bold uppercase text-slate-600 font-title mb-1">
                            Título del Ejercicio
                          </label>
                          <input
                            type="text"
                            value={ex.title}
                            onChange={(e) =>
                              handleUpdatePracticeExercise(exIdx, { ...ex, title: e.target.value })
                            }
                            className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold uppercase text-slate-600 font-title mb-1">
                            {ex.type === 'true_false' ? 'Afirmación (LaTeX)' : 'Pregunta / Enunciado (LaTeX)'}
                          </label>
                          <textarea
                            rows={2}
                            value={ex.type === 'true_false' ? ex.statement : ex.question}
                            onChange={(e) => {
                              if (ex.type === 'true_false') {
                                handleUpdatePracticeExercise(exIdx, { ...ex, statement: e.target.value });
                              } else {
                                handleUpdatePracticeExercise(exIdx, { ...ex, question: e.target.value });
                              }
                            }}
                            className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono bg-white"
                          />
                        </div>
                      </div>

                      {/* 1. TRUE/FALSE EDIT FORM */}
                      {ex.type === 'true_false' && (
                        <div className="space-y-3 pt-2 border-t border-slate-200/80">
                          <div>
                            <label className="block text-[11px] font-bold uppercase text-slate-600 font-title mb-1">
                              Respuesta Correcta
                            </label>
                            <div className="flex items-center gap-4">
                              <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                                <input
                                  type="radio"
                                  name={`tf-${ex.id}`}
                                  checked={ex.correctAnswer === true}
                                  onChange={() => handleUpdatePracticeExercise(exIdx, { ...ex, correctAnswer: true })}
                                  className="text-amber-500 focus:ring-amber-500"
                                />
                                <span>Verdadero</span>
                              </label>
                              <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                                <input
                                  type="radio"
                                  name={`tf-${ex.id}`}
                                  checked={ex.correctAnswer === false}
                                  onChange={() => handleUpdatePracticeExercise(exIdx, { ...ex, correctAnswer: false })}
                                  className="text-amber-500 focus:ring-amber-500"
                                />
                                <span>Falso</span>
                              </label>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase font-title mb-1">
                                Retroalimentación si elige Verdadero
                              </label>
                              <input
                                type="text"
                                value={ex.trueFeedback || ''}
                                onChange={(e) => handleUpdatePracticeExercise(exIdx, { ...ex, trueFeedback: e.target.value })}
                                placeholder="Ej: ¡Correcto! Cumple el teorema."
                                className="w-full p-2 rounded-lg border border-slate-200 text-xs bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase font-title mb-1">
                                Retroalimentación si elige Falso
                              </label>
                              <input
                                type="text"
                                value={ex.falseFeedback || ''}
                                onChange={(e) => handleUpdatePracticeExercise(exIdx, { ...ex, falseFeedback: e.target.value })}
                                placeholder="Ej: Incorrecto. Revisa el contraejemplo."
                                className="w-full p-2 rounded-lg border border-slate-200 text-xs bg-white"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 2. SINGLE CHOICE EDIT FORM */}
                      {ex.type === 'single_choice' && (
                        <div className="space-y-3 pt-2 border-t border-slate-200/80">
                          <div className="flex items-center justify-between">
                            <label className="block text-[11px] font-bold uppercase text-slate-600 font-title">
                              Opciones de Selección (Marca la Opción Correcta)
                            </label>
                            <button
                              onClick={() => {
                                const newOpts = [
                                  ...(ex.options || []),
                                  { id: String.fromCharCode(65 + (ex.options?.length || 0)), text: 'Nueva opción', feedback: '' }
                                ];
                                handleUpdatePracticeExercise(exIdx, { ...ex, options: newOpts });
                              }}
                              className="text-xs text-blue-600 hover:text-blue-800 font-bold"
                            >
                              + Agregar Opción
                            </button>
                          </div>

                          <div className="space-y-2">
                            {ex.options?.map((opt, optIdx) => (
                              <div key={`sc-opt-${optIdx}-${opt.id || ''}`} className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="radio"
                                      name={`sc-${ex.id}`}
                                      checked={ex.correctOptionId === opt.id}
                                      onChange={() => handleUpdatePracticeExercise(exIdx, { ...ex, correctOptionId: opt.id })}
                                      className="text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    />
                                    <span className="font-bold text-xs text-blue-700 font-title">Opción {getOptionLabel(opt.id, optIdx)} ({opt.id})</span>
                                  </div>
                                  {ex.options.length > 2 && (
                                    <button
                                      onClick={() => {
                                        const filteredOpts = ex.options.filter((_, i) => i !== optIdx);
                                        const newOpts = filteredOpts.map((opt, idx) => ({
                                          ...opt,
                                          id: String.fromCharCode(65 + idx),
                                        }));
                                        const idMap: Record<string, string> = {};
                                        ex.options.forEach((opt) => {
                                          const newIndex = filteredOpts.findIndex((o) => o.text === opt.text);
                                          if (newIndex !== -1) {
                                            idMap[opt.id] = String.fromCharCode(65 + newIndex);
                                          }
                                        });
                                        const newCorrectId = ex.correctOptionId ? idMap[ex.correctOptionId] || 'A' : 'A';
                                        handleUpdatePracticeExercise(exIdx, { ...ex, options: newOpts, correctOptionId: newCorrectId });
                                      }}
                                      className="text-[10px] text-rose-600 hover:text-rose-800 font-bold"
                                    >
                                      Eliminar
                                    </button>
                                  )}
                                </div>

                                <input
                                  type="text"
                                  value={opt.text || ''}
                                  onChange={(e) => {
                                    const newOpts = [...ex.options];
                                    newOpts[optIdx] = { ...newOpts[optIdx], text: e.target.value };
                                    handleUpdatePracticeExercise(exIdx, { ...ex, options: newOpts });
                                  }}
                                  placeholder="Texto de la alternativa (LaTeX $...$)"
                                  className="w-full p-2 rounded-lg border border-slate-200 text-xs font-mono"
                                />

                                <input
                                  type="text"
                                  value={opt.feedback || ''}
                                  onChange={(e) => {
                                    const newOpts = [...ex.options];
                                    newOpts[optIdx] = { ...newOpts[optIdx], feedback: e.target.value };
                                    handleUpdatePracticeExercise(exIdx, { ...ex, options: newOpts });
                                  }}
                                  placeholder="Retroalimentación específica al elegir esta alternativa..."
                                  className="w-full p-2 rounded-lg border border-slate-200 text-xs bg-slate-50"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 3. MULTIPLE CHOICE EDIT FORM */}
                      {ex.type === 'multiple_choice' && (
                        <div className="space-y-3 pt-2 border-t border-slate-200/80">
                          <div className="flex items-center justify-between">
                            <label className="block text-[11px] font-bold uppercase text-slate-600 font-title">
                              Opciones Múltiples (Marca todas las Correctas)
                            </label>
                            <button
                              onClick={() => {
                                const newOpts = [
                                  ...(ex.options || []),
                                  { id: String.fromCharCode(65 + (ex.options?.length || 0)), text: 'Nueva opción', feedback: '' }
                                ];
                                handleUpdatePracticeExercise(exIdx, { ...ex, options: newOpts });
                              }}
                              className="text-xs text-purple-600 hover:text-purple-800 font-bold"
                            >
                              + Agregar Opción
                            </button>
                          </div>

                          <div className="space-y-2">
                            {ex.options?.map((opt, optIdx) => {
                              const isChecked = Boolean((ex.correctOptionIds || []).includes(opt.id) || (opt as any).isCorrect);
                              return (
                                <div key={`mc-opt-${optIdx}-${opt.id || ''}`} className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={(e) => {
                                          let newIds = [...(ex.correctOptionIds || [])];
                                          if (e.target.checked) {
                                            newIds.push(opt.id);
                                          } else {
                                            newIds = newIds.filter((id) => id !== opt.id);
                                          }
                                          handleUpdatePracticeExercise(exIdx, { ...ex, correctOptionIds: newIds });
                                        }}
                                        className="text-purple-600 focus:ring-purple-500 cursor-pointer"
                                      />
                                      <span className="font-bold text-xs text-purple-700 font-title">Opción {getOptionLabel(opt.id, optIdx)} ({opt.id})</span>
                                    </div>
                                    {ex.options.length > 2 && (
                                      <button
                                        onClick={() => {
                                          const filteredOpts = ex.options.filter((_, i) => i !== optIdx);
                                          const newOpts = filteredOpts.map((opt, idx) => ({
                                            ...opt,
                                            id: String.fromCharCode(65 + idx),
                                          }));
                                          const idMap: Record<string, string> = {};
                                          ex.options.forEach((opt) => {
                                            const newIndex = filteredOpts.findIndex((o) => o.text === opt.text);
                                            if (newIndex !== -1) {
                                              idMap[opt.id] = String.fromCharCode(65 + newIndex);
                                            }
                                          });
                                          const newIds = (ex.correctOptionIds || [])
                                            .map((id) => idMap[id])
                                            .filter(Boolean);

                                          handleUpdatePracticeExercise(exIdx, { ...ex, options: newOpts, correctOptionIds: newIds });
                                        }}
                                        className="text-[10px] text-rose-600 hover:text-rose-800 font-bold"
                                      >
                                        Eliminar
                                      </button>
                                    )}
                                  </div>

                                  <input
                                    type="text"
                                    value={opt.text || ''}
                                    onChange={(e) => {
                                      const newOpts = [...ex.options];
                                      newOpts[optIdx] = { ...newOpts[optIdx], text: e.target.value };
                                      handleUpdatePracticeExercise(exIdx, { ...ex, options: newOpts });
                                    }}
                                    placeholder="Texto de la alternativa (LaTeX $...$)"
                                    className="w-full p-2 rounded-lg border border-slate-200 text-xs font-mono"
                                  />

                                  <div className="pt-1">
                                    <label className="block text-[10px] font-bold uppercase text-purple-800 font-title mb-1">
                                      📝 Explicación de esta Casilla (para la Explicación Detallada):
                                    </label>
                                    <textarea
                                      rows={2}
                                      value={opt.feedback || ''}
                                      onChange={(e) => {
                                        const newOpts = [...ex.options];
                                        newOpts[optIdx] = { ...newOpts[optIdx], feedback: e.target.value };
                                        handleUpdatePracticeExercise(exIdx, { ...ex, options: newOpts });
                                      }}
                                      placeholder="Ej: Es la definición geométrica fundamental."
                                      className="w-full p-2 rounded-lg border border-purple-200 text-xs bg-purple-50/40 font-mono focus:bg-white transition-all"
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* 4. MATCHING EDIT FORM */}
                      {ex.type === 'matching' && (
                        <div className="space-y-4 pt-2 border-t border-slate-200/80">
                          <div>
                            <label className="block text-[11px] font-bold uppercase text-slate-600 font-title mb-1">
                              Número de Columnas
                            </label>
                            <div className="flex gap-4">
                              <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                                <input
                                  type="radio"
                                  name={`numCols-${ex.id}`}
                                  checked={(ex.columns || 2) === 2}
                                  onChange={() => handleUpdatePracticeExercise(exIdx, { ...ex, columns: 2 })}
                                  className="text-purple-600 focus:ring-purple-500"
                                />
                                2 Columnas (Bipartito)
                              </label>
                              <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                                <input
                                  type="radio"
                                  name={`numCols-${ex.id}`}
                                  checked={ex.columns === 3}
                                  onChange={() => {
                                    const col3 = ex.col3Options && ex.col3Options.length > 0 ? ex.col3Options : [
                                      { letter: 'I', text: 'Clasificación I' },
                                      { letter: 'II', text: 'Clasificación II' }
                                    ];
                                    handleUpdatePracticeExercise(exIdx, { ...ex, columns: 3, col3Title: ex.col3Title || 'Clasificación III', col3Options: col3 });
                                  }}
                                  className="text-purple-600 focus:ring-purple-500"
                                />
                                3 Columnas (Tripartito)
                              </label>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold uppercase text-slate-500 font-title mb-0.5">
                                Título Columna 1:
                              </label>
                              <input
                                type="text"
                                value={ex.col1Title || ''}
                                onChange={(e) => handleUpdatePracticeExercise(exIdx, { ...ex, col1Title: e.target.value })}
                                placeholder="Ej: Función / Expresión"
                                className="w-full p-2 rounded-lg border border-slate-200 text-xs font-title font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold uppercase text-slate-500 font-title mb-0.5">
                                Título Columna 2:
                              </label>
                              <input
                                type="text"
                                value={ex.col2Title || ''}
                                onChange={(e) => handleUpdatePracticeExercise(exIdx, { ...ex, col2Title: e.target.value })}
                                placeholder="Ej: Derivada Correcta"
                                className="w-full p-2 rounded-lg border border-slate-200 text-xs font-title font-bold"
                              />
                            </div>
                            {ex.columns === 3 && (
                              <div className="md:col-span-2">
                                <label className="block text-[10px] font-bold uppercase text-purple-700 font-title mb-0.5">
                                  Título Columna 3:
                                </label>
                                <input
                                  type="text"
                                  value={ex.col3Title || ''}
                                  onChange={(e) => handleUpdatePracticeExercise(exIdx, { ...ex, col3Title: e.target.value })}
                                  placeholder="Ej: Tipo de Regla / Clasificación"
                                  className="w-full p-2 rounded-lg border border-purple-200 text-xs font-title font-bold bg-purple-50/30"
                                />
                              </div>
                            )}
                          </div>

                          {/* Items Columna 1 Builder */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <label className="block text-[11px] font-bold uppercase text-slate-600 font-title">
                                Términos / Expresiones (Columna 1)
                              </label>
                              <button
                                onClick={() => {
                                  const nextNum = (ex.col1Items?.length || 0) + 1;
                                  const newItem = { id: `c1-${Date.now()}-${nextNum}`, text: `Expresión ${nextNum}`, num: nextNum };
                                  const newItems = [...(ex.col1Items || []), newItem];
                                  const defaultCol2Letter = ex.col2Options?.[0]?.letter || 'A';
                                  const defaultCol3Letter = ex.col3Options?.[0]?.letter || 'I';
                                  const newMapping = { ...(ex.correctMapping || {}), [newItem.id]: defaultCol2Letter };
                                  const newMappingCol3 = ex.columns === 3 ? { ...(ex.correctMappingCol3 || {}), [newItem.id]: defaultCol3Letter } : ex.correctMappingCol3;
                                  handleUpdatePracticeExercise(exIdx, { ...ex, col1Items: newItems, correctMapping: newMapping, correctMappingCol3: newMappingCol3 });
                                }}
                                className="text-xs text-emerald-600 hover:text-emerald-800 font-bold"
                              >
                                + Agregar Ítem Columna 1
                              </button>
                            </div>
                            {ex.col1Items?.map((item, itemIdx) => (
                              <div key={`c1-${itemIdx}-${item.id || item.num}`} className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-bold text-xs text-emerald-700 font-title">Ítem #{item.num}</span>
                                  {ex.col1Items.length > 1 && (
                                    <button
                                      onClick={() => {
                                        const newItems = ex.col1Items
                                          .filter((_, i) => i !== itemIdx)
                                          .map((it, idx) => ({ ...it, num: idx + 1 }));
                                        handleUpdatePracticeExercise(exIdx, { ...ex, col1Items: newItems });
                                      }}
                                      className="text-[10px] text-rose-600 hover:text-rose-800 font-bold"
                                    >
                                      Eliminar
                                    </button>
                                  )}
                                </div>
                                <input
                                  type="text"
                                  value={item.text}
                                  onChange={(e) => {
                                    const newItems = [...ex.col1Items];
                                    newItems[itemIdx] = { ...newItems[itemIdx], text: e.target.value };
                                    handleUpdatePracticeExercise(exIdx, { ...ex, col1Items: newItems });
                                  }}
                                  placeholder="Texto de Columna 1 (LaTeX $...$)"
                                  className="w-full p-2 rounded-lg border border-slate-200 text-xs font-mono"
                                />

                                <div className="pt-1">
                                  <label className="block text-[10px] font-bold uppercase text-emerald-800 font-title mb-1">
                                    📝 Explicación de este Ítem (para la Explicación Detallada):
                                  </label>
                                  <textarea
                                    rows={2}
                                    value={item.feedback || ''}
                                    onChange={(e) => {
                                      const newItems = [...ex.col1Items];
                                      newItems[itemIdx] = { ...newItems[itemIdx], feedback: e.target.value };
                                      handleUpdatePracticeExercise(exIdx, { ...ex, col1Items: newItems });
                                    }}
                                    placeholder="Ej: Por el límite trigonométrico fundamental..."
                                    className="w-full p-2 rounded-lg border border-emerald-200 text-xs bg-emerald-50/40 font-mono focus:bg-white transition-all"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Options Columna 2 Builder */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <label className="block text-[11px] font-bold uppercase text-slate-600 font-title">
                                Opciones de Columna 2
                              </label>
                              <button
                                onClick={() => {
                                  const nextLetter = String.fromCharCode(65 + (ex.col2Options?.length || 0));
                                  const newOpt = { letter: nextLetter, text: `Opción ${nextLetter}` };
                                  const newOpts = [...(ex.col2Options || []), newOpt];
                                  handleUpdatePracticeExercise(exIdx, { ...ex, col2Options: newOpts });
                                }}
                                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold"
                              >
                                + Agregar Opción Columna 2
                              </button>
                            </div>
                            {ex.col2Options?.map((opt, optIdx) => (
                              <div key={`c2-${optIdx}-${opt.letter || ''}`} className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-bold text-xs text-indigo-700 font-title">Opción {opt.letter}</span>
                                  {ex.col2Options.length > 1 && (
                                    <button
                                      onClick={() => {
                                        const filteredOpts = ex.col2Options.filter((_, i) => i !== optIdx);
                                        const newOpts = filteredOpts.map((o, idx) => ({
                                          ...o,
                                          letter: String.fromCharCode(65 + idx),
                                        }));
                                        const letterMap: Record<string, string> = {};
                                        ex.col2Options.forEach((o) => {
                                          const newIndex = filteredOpts.findIndex((f) => f.text === o.text);
                                          if (newIndex !== -1) {
                                            letterMap[o.letter] = String.fromCharCode(65 + newIndex);
                                          }
                                        });
                                        const newCorrectMap: Record<string, string> = {};
                                        if (ex.correctMapping) {
                                          Object.keys(ex.correctMapping).forEach((k) => {
                                            const oldVal = ex.correctMapping[k];
                                            if (letterMap[oldVal]) {
                                              newCorrectMap[k] = letterMap[oldVal];
                                            } else {
                                              newCorrectMap[k] = 'A';
                                            }
                                          });
                                        }
                                        handleUpdatePracticeExercise(exIdx, { ...ex, col2Options: newOpts, correctMapping: newCorrectMap });
                                      }}
                                      className="text-[10px] text-rose-600 hover:text-rose-800 font-bold"
                                    >
                                      Eliminar
                                    </button>
                                  )}
                                </div>
                                <input
                                  type="text"
                                  value={opt.text}
                                  onChange={(e) => {
                                    const newOpts = [...ex.col2Options];
                                    newOpts[optIdx] = { ...newOpts[optIdx], text: e.target.value };
                                    handleUpdatePracticeExercise(exIdx, { ...ex, col2Options: newOpts });
                                  }}
                                  placeholder="Texto de Opción Columna 2 (LaTeX $...$)"
                                  className="w-full p-2 rounded-lg border border-slate-200 text-xs font-mono"
                                />
                              </div>
                            ))}
                          </div>

                          {/* Options Columna 3 Builder (Tripartito) */}
                          {ex.columns === 3 && (
                            <div className="space-y-3 pt-2 border-t border-purple-200">
                              <div className="flex items-center justify-between">
                                <label className="block text-[11px] font-bold uppercase text-purple-700 font-title">
                                  Opciones de Columna 3
                                </label>
                                <button
                                  onClick={() => {
                                    const romans = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
                                    const nextLetter = romans[ex.col3Options?.length || 0] || `C${(ex.col3Options?.length || 0) + 1}`;
                                    const newOpt = { letter: nextLetter, text: `Clasificación ${nextLetter}` };
                                    const newOpts = [...(ex.col3Options || []), newOpt];
                                    handleUpdatePracticeExercise(exIdx, { ...ex, col3Options: newOpts });
                                  }}
                                  className="text-xs text-purple-600 hover:text-purple-800 font-bold"
                                >
                                  + Agregar Opción Columna 3
                                </button>
                              </div>
                              {ex.col3Options?.map((opt, optIdx) => (
                                <div key={`c3-${optIdx}-${opt.letter || ''}`} className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-bold text-xs text-purple-700 font-title">Opción {opt.letter}</span>
                                    {ex.col3Options && ex.col3Options.length > 1 && (
                                      <button
                                        onClick={() => {
                                          const romans = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
                                          const filteredOpts = ex.col3Options!.filter((_, i) => i !== optIdx);
                                          const newOpts = filteredOpts.map((o, idx) => ({
                                            ...o,
                                            letter: romans[idx] || `C${idx + 1}`,
                                          }));
                                          const letterMap: Record<string, string> = {};
                                          ex.col3Options!.forEach((o) => {
                                            const newIndex = filteredOpts.findIndex((f) => f.text === o.text);
                                            if (newIndex !== -1) {
                                              letterMap[o.letter] = romans[newIndex] || `C${newIndex + 1}`;
                                            }
                                          });
                                          const newCorrectMapCol3: Record<string, string> = {};
                                          if (ex.correctMappingCol3) {
                                            Object.keys(ex.correctMappingCol3).forEach((k) => {
                                              const oldVal = ex.correctMappingCol3![k];
                                              if (letterMap[oldVal]) {
                                                newCorrectMapCol3[k] = letterMap[oldVal];
                                              } else {
                                                newCorrectMapCol3[k] = 'I';
                                              }
                                            });
                                          }
                                          handleUpdatePracticeExercise(exIdx, { ...ex, col3Options: newOpts, correctMappingCol3: newCorrectMapCol3 });
                                        }}
                                        className="text-[10px] text-rose-600 hover:text-rose-800 font-bold"
                                      >
                                        Eliminar
                                      </button>
                                    )}
                                  </div>
                                  <input
                                    type="text"
                                    value={opt.text}
                                    onChange={(e) => {
                                      const newOpts = [...(ex.col3Options || [])];
                                      newOpts[optIdx] = { ...newOpts[optIdx], text: e.target.value };
                                      handleUpdatePracticeExercise(exIdx, { ...ex, col3Options: newOpts });
                                    }}
                                    placeholder="Texto de Opción Columna 3 (LaTeX $...$)"
                                    className="w-full p-2 rounded-lg border border-slate-200 text-xs font-mono"
                                  />
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Correct Mappings Matrix */}
                          <div className="space-y-3 pt-2 border-t border-slate-200/80">
                            <label className="block text-[11px] font-bold uppercase text-slate-600 font-title">
                              Mapeo y Asociación Correcta (Respuestas)
                            </label>
                            {ex.col1Items?.map((item) => (
                              <div key={item.id} className="bg-slate-100 dark:bg-slate-800 p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
                                <span className="font-bold text-slate-800 dark:text-slate-200 font-title">
                                  Ítem #{item.num} ({item.text.slice(0, 25)}...):
                                </span>
                                <div className="flex flex-wrap items-center gap-3">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-semibold text-slate-500">Col 2:</span>
                                    <select
                                      value={ex.correctMapping?.[item.id] || 'A'}
                                      onChange={(e) => {
                                        const newMap = { ...(ex.correctMapping || {}), [item.id]: e.target.value };
                                        handleUpdatePracticeExercise(exIdx, { ...ex, correctMapping: newMap });
                                      }}
                                      className="p-1 rounded-lg border border-slate-300 font-bold bg-white"
                                    >
                                      {ex.col2Options?.map((o) => (
                                        <option key={o.letter} value={o.letter}>Opción {o.letter}</option>
                                      ))}
                                    </select>
                                  </div>
                                  {ex.columns === 3 && (
                                    <div className="flex items-center gap-1.5 border-l border-slate-300 pl-3">
                                      <span className="font-semibold text-purple-600 font-title">Col 3:</span>
                                      <select
                                        value={ex.correctMappingCol3?.[item.id] || 'I'}
                                        onChange={(e) => {
                                          const newMap = { ...(ex.correctMappingCol3 || {}), [item.id]: e.target.value };
                                          handleUpdatePracticeExercise(exIdx, { ...ex, correctMappingCol3: newMap });
                                        }}
                                        className="p-1 rounded-lg border border-purple-300 font-bold bg-purple-50 text-purple-900"
                                      >
                                        {ex.col3Options?.map((o) => (
                                          <option key={o.letter} value={o.letter}>Opción {o.letter}</option>
                                        ))}
                                      </select>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Explanation only for non-multiple choice exercise types */}
                      {ex.type !== 'multiple_choice' && (
                        <div className="pt-2 border-t border-slate-200/80">
                          <label className="block text-[11px] font-bold uppercase text-slate-600 font-title mb-1">
                            Explicación General / Pauta Detallada (LaTeX)
                          </label>
                          <textarea
                            rows={3}
                            value={ex.explanation}
                            onChange={(e) =>
                              handleUpdatePracticeExercise(exIdx, { ...ex, explanation: e.target.value })
                            }
                            className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono bg-white"
                            placeholder="Demostración paso a paso..."
                          />
                        </div>
                      )}
                    </div>

                      {/* Column 2: Live Parallel Interactive Student Preview of THIS Exercise */}
                      <div className="lg:sticky lg:top-6 bg-slate-50/90 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-3 min-w-0">
                        <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-title flex items-center gap-1.5">
                            <i className="fa-solid fa-eye text-emerald-600"></i> Vista Previa en Vivo — Ejercicio #{exIdx + 1}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 font-title">
                            Estudiante
                          </span>
                        </div>

                        <InteractivePractice exercises={[ex]} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: DATOS GENERALES */}
        {editorTab === 'general' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs max-w-2xl">
            <h2 className="text-lg font-bold text-slate-900 font-title mb-2">Datos Principales del Capítulo</h2>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1 font-title">Título del Capítulo</label>
              <input
                type="text"
                value={chapter.title}
                onChange={(e) => setChapter({ ...chapter, title: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 text-sm font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1 font-title">Resumen Breve</label>
              <textarea
                rows={2}
                value={chapter.summary}
                onChange={(e) => setChapter({ ...chapter, summary: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1 font-title">Fórmula Destacada de Portada (LaTeX)</label>
              <input
                type="text"
                value={chapter.mathKey}
                onChange={(e) => setChapter({ ...chapter, mathKey: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 text-sm font-mono"
              />
              <div className="mt-3 bg-slate-50 p-3 rounded-xl border text-center">
                <MathFormula latex={chapter.mathKey} block />
              </div>
            </div>
          </div>
        )}

        {/* TAB: PESTAÑA 1 - MOTIVACIÓN */}
        {editorTab === 'motivacion' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0">
            <div className="bg-white border border-slate-200 rounded-2xl p-8 md:p-10 space-y-6 shadow-xs min-w-0">
              <div>
                <h2 className="text-lg font-bold text-slate-900 font-title mb-1">Editor de Pestaña 1: Motivación</h2>
                <p className="text-xs text-slate-500 mb-3">Redacta en código LaTeX nativo. Utiliza los botones para insertar las tarjetas pedagógicas y componentes visuales.</p>
              </div>

              {/* Botonera Pedagógica en LaTeX */}
              <PedagogicalToolbar
                onInsertSnippet={(snippet) => {
                  insertSnippetAtCaret(
                    motivacionRef.current,
                    chapter.motivacion || '',
                    snippet,
                    (val) => setChapter((prev) => ({ ...prev, motivacion: val }))
                  );
                }}
              />

              <GutterCodeEditor
                textareaRef={motivacionRef}
                value={chapter.motivacion || ''}
                onChange={(val) => setChapter((prev) => ({ ...prev, motivacion: val }))}
                rows={16}
                placeholder="Utiliza la botonera superior o escribe en LaTeX nativo..."
              />
            </div>

            <div className="bg-slate-100/70 border border-slate-200 rounded-2xl p-6 space-y-3 max-h-[850px] overflow-y-auto custom-scrollbar min-w-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-title">
                  <i className="fa-solid fa-eye text-cyan-600 mr-1"></i> Vista Previa en Vivo (Estudiante)
                </span>
                <span className="text-[10px] font-bold text-cyan-700 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded-full font-title">
                  💡 Doble clic para ir a esa línea
                </span>
              </div>
              <LaTeXPedagogicalParser
                content={chapter.motivacion || ''}
                onElementDoubleClick={(snippet) =>
                  handlePreviewDoubleClick(motivacionRef.current, chapter.motivacion || '', snippet)
                }
              />
            </div>
          </div>
        )}

        {/* TAB: PESTAÑA 2 - TEORÍA */}
        {editorTab === 'teoria' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0">
            <div className="bg-white border border-slate-200 rounded-2xl p-8 md:p-10 space-y-6 shadow-xs min-w-0">
              <div>
                <h2 className="text-lg font-bold text-slate-900 font-title mb-1">Editor de Pestaña 2: Teoría y Teoremas</h2>
                <p className="text-xs text-slate-500 mb-3">Redacta las definiciones, teoremas, métodos y trampas en LaTeX nativo con inserción rápida a un clic.</p>
              </div>

              {/* Botonera Pedagógica en LaTeX */}
              <PedagogicalToolbar
                onInsertSnippet={(snippet) => {
                  insertSnippetAtCaret(
                    teoriaRef.current,
                    chapter.teoria || '',
                    snippet,
                    (val) => setChapter((prev) => ({ ...prev, teoria: val }))
                  );
                }}
              />

              <GutterCodeEditor
                textareaRef={teoriaRef}
                value={chapter.teoria || ''}
                onChange={(val) => setChapter((prev) => ({ ...prev, teoria: val }))}
                rows={16}
                placeholder="Utiliza la botonera superior o escribe en LaTeX nativo..."
              />
            </div>

            <div className="bg-slate-100/70 border border-slate-200 rounded-2xl p-6 space-y-3 max-h-[850px] overflow-y-auto custom-scrollbar min-w-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-title">
                  <i className="fa-solid fa-eye text-cyan-600 mr-1"></i> Vista Previa en Vivo (Estudiante)
                </span>
                <span className="text-[10px] font-bold text-cyan-700 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded-full font-title">
                  💡 Doble clic para ir a esa línea
                </span>
              </div>
              <LaTeXPedagogicalParser
                content={chapter.teoria || ''}
                onElementDoubleClick={(snippet) =>
                  handlePreviewDoubleClick(teoriaRef.current, chapter.teoria || '', snippet)
                }
              />
            </div>
          </div>
        )}
      </div>

      {/* Modal de Importación Masiva por Sintaxis LaTeX */}
      <ExerciseImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImportExercises={handleBatchImportExercises}
      />

      {/* Modal de Importación Masiva de Ejercicios de la Guía (Pestaña 4) */}
      <GuideExerciseImportModal
        isOpen={guideImportModalOpen}
        onClose={() => setGuideImportModalOpen(false)}
        onImportProblems={handleBatchImportGuideExercises}
      />

      {/* Modal de Importación desde el Banco Central */}
      <CentralBankImportModal
        isOpen={bankImportModalOpen}
        onClose={() => setBankImportModalOpen(false)}
        chapterId={chapterId}
        courseSlug={courseSlug}
        tab={bankImportTab}
        onExercisesImported={() => {
          loadChapterData();
        }}
      />
    </div>
  );
}
