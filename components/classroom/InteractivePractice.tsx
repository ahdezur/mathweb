'use client';

import React, { useState } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

// -----------------------------------------------------------------------------
// Helper para Sanitización y Renderizado KaTeX
// -----------------------------------------------------------------------------
function sanitizeLaTeX(str: string): string {
  if (!str) return '';
  return str
    .replace(/\x0C/g, '\\f')
    .replace(/\x0D/g, '\\r')
    .replace(/\x09/g, '\\t')
    .replace(/\x08/g, '\\b')
    .replace(/\x0B/g, '\\v')
    .replace(/[\r\n]eq/g, '\\neq ')
    .replace(/[\r\n]notin/g, '\\notin ')
    .replace(/[\r\n]nabla/g, '\\nabla ')
    .replace(/[\r\n]nu/g, '\\nu ')
    .replace(/[\r\n]neg/g, '\\neg ')
    .replace(/\\n/g, '\n')
    .replace(/\\\\([a-zA-Z]+)/g, '\\$1');
}

function renderKaTeX(text: string) {
  if (!text) return null;

  const cleanText = sanitizeLaTeX(text);
  const parts = cleanText.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g);

  return parts.map((part, index) => {
    if (part.startsWith('$$') && part.endsWith('$$')) {
      const math = part.slice(2, -2).trim();
      try {
        const html = katex.renderToString(math, { displayMode: true, throwOnError: false });
        return <span key={index} dangerouslySetInnerHTML={{ __html: html }} className="my-3 block overflow-x-auto" />;
      } catch (e) {
        return <code key={index} className="text-rose-500">{part}</code>;
      }
    } else if (part.startsWith('$') && part.endsWith('$')) {
      const math = part.slice(1, -1).trim();
      try {
        const html = katex.renderToString(math, { displayMode: false, throwOnError: false });
        return <span key={index} dangerouslySetInnerHTML={{ __html: html }} className="inline-block px-0.5" />;
      } catch (e) {
        return <code key={index} className="text-rose-500">{part}</code>;
      }
    }

    const lines = part.split('\n');
    return (
      <React.Fragment key={index}>
        {lines.map((line, lIdx) => (
          <React.Fragment key={lIdx}>
            {lIdx > 0 && <br />}
            {line}
          </React.Fragment>
        ))}
      </React.Fragment>
    );
  });
}

// -----------------------------------------------------------------------------
// Interfaces de Tipos de Pregunta
// -----------------------------------------------------------------------------
export interface TrueFalseExercise {
  id: string;
  type: 'true_false';
  title: string;
  statement: string;
  correctAnswer: boolean;
  explanation: string;
  trueFeedback?: string;
  falseFeedback?: string;
}

export interface PracticeOption {
  id: string;
  text: string;
  feedback?: string;
}

export interface SingleChoiceExercise {
  id: string;
  type: 'single_choice';
  title: string;
  question: string;
  options: PracticeOption[];
  correctOptionId: string;
  explanation: string;
}

export interface MultipleChoiceExercise {
  id: string;
  type: 'multiple_choice';
  title: string;
  question: string;
  options: PracticeOption[];
  correctOptionIds: string[];
  explanation: string;
}

export interface MatchingExercise {
  id: string;
  type: 'matching';
  title: string;
  question: string;
  columns?: 2 | 3;
  col1Title?: string;
  col2Title?: string;
  col3Title?: string;
  col1Items: { id: string; num: number; text: string; feedback?: string }[];
  col2Options: { letter: string; text: string }[];
  col3Options?: { letter: string; text: string }[];
  correctMapping: Record<string, string>;
  correctMappingCol3?: Record<string, string>;
  explanation: string;
}

export type PracticeExercise =
  | TrueFalseExercise
  | SingleChoiceExercise
  | MultipleChoiceExercise
  | MatchingExercise;

export interface InteractivePracticeProps {
  exercises: PracticeExercise[];
  fontScale?: number;
}

// -----------------------------------------------------------------------------
// Componente Principal de Práctica Interactiva
// -----------------------------------------------------------------------------
export function InteractivePractice({ exercises, fontScale = 1.0 }: InteractivePracticeProps) {
  // Estado de respuestas del usuario
  const [answers, setAnswers] = useState<Record<string, any>>({});
  // Estado de si la pregunta fue comprobada
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  // Manejador de actualización de respuesta
  const handleAnswerChange = (id: string, value: any) => {
    if (checked[id]) return; // Bloquear si ya fue comprobada
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  // Manejador de comprobación individual
  const handleCheckAnswer = (id: string) => {
    setChecked((prev) => ({ ...prev, [id]: true }));
  };

  // Calcular estadísticas de progreso
  const completedCount = Object.keys(checked).filter((id) => checked[id]).length;
  const totalCount = exercises.length;

  let correctCount = 0;
  exercises.forEach((ex) => {
    if (!checked[ex.id]) return;

    const userAns = answers[ex.id];
    if (ex.type === 'true_false' && userAns === ex.correctAnswer) {
      correctCount++;
    } else if (ex.type === 'single_choice' && userAns === ex.correctOptionId) {
      correctCount++;
    } else if (ex.type === 'multiple_choice' && Array.isArray(userAns)) {
      const isExact =
        userAns.length === ex.correctOptionIds.length &&
        userAns.every((val) => ex.correctOptionIds.includes(val));
      if (isExact) correctCount++;
    } else if (ex.type === 'matching' && typeof userAns === 'object' && userAns !== null) {
      const isAllPairsCorrect = ex.col1Items.every((item) => {
        const sel = userAns[item.id];
        if (!sel) return false;

        if (ex.columns === 3) {
          const match2 = (typeof sel === 'object' ? sel.col2 : sel) === ex.correctMapping[item.id];
          const match3 = (typeof sel === 'object' ? sel.col3 : '') === (ex.correctMappingCol3?.[item.id] || '');
          return match2 && match3;
        } else {
          const selectedCol2 = typeof sel === 'object' ? sel.col2 : sel;
          return selectedCol2 === ex.correctMapping[item.id];
        }
      });
      if (isAllPairsCorrect) correctCount++;
    }
  });

  const accuracy = completedCount > 0 ? Math.round((correctCount / completedCount) * 100) : 0;

  // Reiniciar ejercicio completo
  const handleResetAll = () => {
    setAnswers({});
    setChecked({});
  };

  return (
    <div className="space-y-6">
      {/* 📌 Header Sticky Unificado: Título a la izquierda, Precisión y Reiniciar a la derecha (Tamaño Fijo) */}
      <div className="sticky top-0 z-30 backdrop-blur-md bg-white/90 dark:bg-slate-950/90 border-b border-slate-200 dark:border-slate-800 pb-4 pt-2.5 transition-all shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Izquierda: Icono + Título + Subtítulo */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-xl font-bold font-title shrink-0">
              <i className="fa-solid fa-pen-ruler"></i>
            </div>
            <div>
              <h2 className="text-2xl font-bold font-title text-slate-900 dark:text-slate-100">Práctica Guiada e Interactiva</h2>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Ejercicios interactivos con comprobación instantánea y explicaciones en KaTeX
              </p>
            </div>
          </div>

          {/* Derecha: Barra de Precisión + Botón Reiniciar */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end gap-1">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>Precisión: {accuracy}% ({completedCount}/{totalCount})</span>
                {completedCount > 0 && accuracy >= 80 && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                    🎯 ¡Excelente!
                  </span>
                )}
              </div>
              <div className="w-40 h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-500 rounded-full"
                  style={{ width: `${(completedCount / totalCount) * 100}%` }}
                />
              </div>
            </div>

            {/* Botón Reiniciar */}
            <button
              onClick={handleResetAll}
              className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all flex items-center gap-2 cursor-pointer font-title shadow-xs"
            >
              <i className="fa-solid fa-rotate-left"></i>
              <span>Reiniciar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Ejercicios (Escalable con fontScale) */}
      <div style={{ zoom: fontScale }} className="space-y-8 transition-all duration-200">
        {exercises.map((ex, idx) => (
          <ExerciseCard
            key={ex.id}
            index={idx + 1}
            exercise={ex}
            userAnswer={answers[ex.id]}
            isChecked={!!checked[ex.id]}
            onAnswerChange={(val) => handleAnswerChange(ex.id, val)}
            onCheck={() => handleCheckAnswer(ex.id)}
          />
        ))}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Componente de Tarjeta de Ejercicio Individual
// -----------------------------------------------------------------------------
interface ExerciseCardProps {
  index: number;
  exercise: PracticeExercise;
  userAnswer: any;
  isChecked: boolean;
  onAnswerChange: (val: any) => void;
  onCheck: () => void;
}

function ExerciseCard({
  index,
  exercise,
  userAnswer,
  isChecked,
  onAnswerChange,
  onCheck,
}: ExerciseCardProps) {
  // Determinar si el ejercicio se respondió correctamente
  let isCorrect = false;
  if (isChecked) {
    if (exercise.type === 'true_false' && userAnswer === exercise.correctAnswer) {
      isCorrect = true;
    } else if (exercise.type === 'single_choice' && userAnswer === exercise.correctOptionId) {
      isCorrect = true;
    } else if (exercise.type === 'multiple_choice' && Array.isArray(userAnswer)) {
      isCorrect =
        userAnswer.length === exercise.correctOptionIds.length &&
        userAnswer.every((val) => exercise.correctOptionIds.includes(val));
    } else if (exercise.type === 'matching' && typeof userAnswer === 'object' && userAnswer !== null) {
      isCorrect = exercise.col1Items.every((item) => {
        const sel = userAnswer[item.id];
        if (!sel) return false;

        const targetCol2 = exercise.correctMapping?.[item.id] || exercise.col2Options?.[0]?.letter || 'A';
        const targetCol3 = exercise.correctMappingCol3?.[item.id] || exercise.col3Options?.[0]?.letter || 'I';

        if (exercise.columns === 3) {
          const match2 = (typeof sel === 'object' ? sel.col2 : sel) === targetCol2;
          const match3 = (typeof sel === 'object' ? sel.col3 : '') === targetCol3;
          return match2 && match3;
        } else {
          const selectedCol2 = typeof sel === 'object' ? sel.col2 : sel;
          return selectedCol2 === targetCol2;
        }
      });
    }
  }

  // Obtener estilos y etiquetas según la categoría del ejercicio
  const getCategoryStyle = () => {
    switch (exercise.type) {
      case 'true_false':
        return {
          badgeBg: 'bg-amber-500 text-white shadow-xs',
          tagBg: 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300',
          label: '1. Verdadero / Falso',
        };
      case 'single_choice':
        return {
          badgeBg: 'bg-blue-600 text-white shadow-xs',
          tagBg: 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300',
          label: '2. Selección Única',
        };
      case 'multiple_choice':
        return {
          badgeBg: 'bg-purple-600 text-white shadow-xs',
          tagBg: 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300',
          label: '3. Casillas Múltiples',
        };
      case 'matching':
        return {
          badgeBg: 'bg-emerald-600 text-white shadow-xs',
          tagBg: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300',
          label: `4. Términos Pareados (${exercise.columns === 3 ? '3 Columnas' : '2 Columnas'})`,
        };
    }
  };

  const catStyle = getCategoryStyle();

  return (
    <div
      style={{ padding: '36px 40px' }}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-6 transition-all"
    >
      {/* Cabecera del Ejercicio */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <span className={`w-8 h-8 rounded-xl font-black flex items-center justify-center text-sm ${catStyle.badgeBg}`}>
            {index}
          </span>
          <h4 className="font-bold text-base md:text-lg text-slate-900 dark:text-slate-100">
            {exercise.title}
          </h4>
        </div>
        <div>
          <span className={`px-3 py-1 rounded-lg text-xs font-bold ${catStyle.tagBg}`}>
            {catStyle.label}
          </span>
        </div>
      </div>

      {/* Cuerpo del Ejercicio según Tipo */}
      <div>
        {exercise.type === 'true_false' && (
          <TrueFalseView
            exercise={exercise}
            userAnswer={userAnswer}
            isChecked={isChecked}
            onSelect={onAnswerChange}
          />
        )}
        {exercise.type === 'single_choice' && (
          <SingleChoiceView
            exercise={exercise}
            userAnswer={userAnswer}
            isChecked={isChecked}
            onSelect={onAnswerChange}
          />
        )}
        {exercise.type === 'multiple_choice' && (
          <MultipleChoiceView
            exercise={exercise}
            userAnswer={userAnswer}
            isChecked={isChecked}
            onSelect={onAnswerChange}
          />
        )}
        {exercise.type === 'matching' && (
          <MatchingView
            exercise={exercise}
            userAnswer={userAnswer}
            isChecked={isChecked}
            onSelect={onAnswerChange}
          />
        )}
      </div>

      {/* Botón Comprobar Respuesta */}
      {!isChecked && (
        <div className="pt-2 flex justify-end">
          <button
            onClick={onCheck}
            disabled={userAnswer === undefined || userAnswer === null}
            className={`px-6 py-3 rounded-2xl text-sm font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer ${
              userAnswer === undefined || userAnswer === null
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-lg active:scale-95'
            }`}
          >
            <i className="fa-solid fa-circle-check"></i>
            <span>Verificar Asociaciones</span>
          </button>
        </div>
      )}

      {/* Caja de Retroalimentación y Solución */}
      {isChecked && (
        <div
          style={{ padding: '28px 32px' }}
          className={`rounded-2xl border transition-all animate-fadeIn space-y-3 ${
            isCorrect
              ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100'
              : 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-100'
          }`}
        >
          <div className="flex items-center gap-2.5 font-bold text-base">
            <i className={`fa-solid ${isCorrect ? 'fa-circle-check text-emerald-600' : 'fa-circle-xmark text-rose-600'}`}></i>
            <span>{isCorrect ? '¡Respuesta Correcta! 🎉' : 'Respuesta Incorrecta'}</span>
          </div>

          {/* Explicación Detallada Unificada */}
          <div className="text-slate-800 dark:text-slate-200 text-sm md:text-base leading-relaxed space-y-3 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
            <div className="font-bold text-xs uppercase tracking-wider font-title opacity-80">
              Explicación Detallada:
            </div>
            
            {/* Explicación general para ejercicios de F/V o Selección Única */}
            {exercise.type !== 'multiple_choice' && exercise.type !== 'matching' && exercise.explanation && exercise.explanation.trim().length > 0 && (
              <div>{renderKaTeX(exercise.explanation)}</div>
            )}

            {/* Desglose por Casilla con la misma tipografía [A] [B] [C] y fondo verde/rojo */}
            {exercise.type === 'multiple_choice' && (
              <MultipleChoiceOptionBreakdown exercise={exercise} isCorrectOverall={isCorrect} />
            )}

            {/* Desglose por Ítem para Emparejamiento con insignias [1] [2] [3] y fondo verde/rojo */}
            {exercise.type === 'matching' && (
              <MatchingBreakdown exercise={exercise} isCorrectOverall={isCorrect} userAnswer={userAnswer} />
            )}

            {/* Retroalimentación para V/F o Selección Única si existe */}
            {exercise.type !== 'multiple_choice' && exercise.type !== 'matching' && (() => {
              const optFeedback = getOptionFeedback(exercise, userAnswer);
              if (!optFeedback) return null;
              return (
                <div className={`p-4 rounded-xl text-sm font-medium border mt-2 ${
                  isCorrect
                    ? 'bg-emerald-100/60 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100'
                    : 'bg-rose-100/60 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-100'
                }`}>
                  <div className="leading-relaxed whitespace-pre-line">{renderKaTeX(optFeedback)}</div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

// Subcomponente de Desglose por Ítem para Emparejamiento con insignias [1], [2], [3]
function MatchingBreakdown({
  exercise,
  isCorrectOverall,
  userAnswer,
}: {
  exercise: MatchingExercise;
  isCorrectOverall: boolean;
  userAnswer: any;
}) {
  return (
    <div className="space-y-3 mt-2">
      {exercise.col1Items.map((item) => {
        const col2TargetLetter = exercise.correctMapping[item.id] || exercise.col2Options[0]?.letter || 'A';
        const col2TargetOpt = exercise.col2Options.find((o) => o.letter === col2TargetLetter) || exercise.col2Options[0];
        const col3TargetLetter = exercise.correctMappingCol3?.[item.id] || exercise.col3Options?.[0]?.letter || 'I';
        const col3TargetOpt = exercise.col3Options?.find((o) => o.letter === col3TargetLetter) || exercise.col3Options?.[0];

        const rawSel = userAnswer?.[item.id];
        const selectedCol2 = typeof rawSel === 'object' ? rawSel?.col2 : rawSel;
        const selectedCol3 = typeof rawSel === 'object' ? rawSel?.col3 : '';

        const isCol2Ok = selectedCol2 === col2TargetLetter;
        const isCol3Ok = exercise.columns !== 3 || selectedCol3 === col3TargetLetter;
        const isThisItemCorrect = isCol2Ok && isCol3Ok;

        let rawFb = item.feedback ? item.feedback.trim() : '';
        rawFb = rawFb.replace(/^(correcto|incorrecto|falso|verdadero)[\.\:\,\s\-]+/i, '');

        const pairLabel = exercise.columns === 3 && col3TargetOpt
          ? `${item.num}.${col2TargetOpt.letter}-${col3TargetOpt.letter}`
          : `${item.num}.${col2TargetOpt.letter}`;

        return (
          <div
            key={item.id}
            className={`p-3.5 rounded-2xl border flex items-center gap-3.5 transition-all ${
              isThisItemCorrect
                ? 'bg-emerald-100/70 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-700 text-emerald-950 dark:text-emerald-100'
                : 'bg-rose-100/70 dark:bg-rose-950/70 border-rose-300 dark:border-rose-700 text-rose-950 dark:text-rose-100'
            }`}
          >
            <div className="flex-1 text-xs md:text-sm leading-relaxed">
              {/* '1.A' al comienzo dentro de la casilla + Explicación del Ítem */}
              <div className="flex flex-wrap items-center gap-2.5">
                <span
                  className={`px-2.5 py-1 rounded-xl text-xs md:text-sm font-black font-title tracking-wide text-white shadow-2xs shrink-0 ${
                    isThisItemCorrect ? 'bg-emerald-600' : 'bg-rose-600'
                  }`}
                >
                  {pairLabel}
                </span>
                <div className="text-slate-800 dark:text-slate-200 font-medium text-sm md:text-base">
                  {renderKaTeX(rawFb.length > 0 ? rawFb : col2TargetOpt ? `Opción ${col2TargetOpt.letter} (${col2TargetOpt.text})` : '')}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Subcomponente de Desglose por Casilla con insignia [A] [B] [C] oficial y colores Verde/Rojo
function MultipleChoiceOptionBreakdown({
  exercise,
  isCorrectOverall,
}: {
  exercise: MultipleChoiceExercise;
  isCorrectOverall: boolean;
}) {
  return (
    <div className="space-y-3 mt-2">
      {exercise.options.map((o) => {
        const isTargetCorrect = exercise.correctOptionIds.includes(o.id);
        const actionTag = isTargetCorrect ? 'Debe marcarse' : 'Debe dejar en blanco';
        let rawFb = o.feedback ? o.feedback.trim() : '';

        // Limpiar prefijos redundantes
        rawFb = rawFb.replace(/^(correcto|incorrecto|falso|verdadero)[\.\:\,\s\-]+/i, '');

        const fbText =
          rawFb.length > 0
            ? rawFb
            : isTargetCorrect
            ? 'Esta afirmación es verdadera.'
            : 'Esta afirmación es un distractor / falsa.';

        return (
          <div
            key={o.id}
            className={`p-3.5 rounded-2xl border flex items-start gap-3.5 transition-all ${
              isCorrectOverall
                ? 'bg-emerald-100/70 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-700 text-emerald-950 dark:text-emerald-100'
                : 'bg-rose-100/70 dark:bg-rose-950/70 border-rose-300 dark:border-rose-700 text-rose-950 dark:text-rose-100'
            }`}
          >
            {/* Insignia Oficial de la Casilla [A], [B], [C] */}
            <span className="w-8 h-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-sm font-black shrink-0 font-title shadow-2xs text-slate-900 dark:text-slate-100">
              {o.id}
            </span>

            <div className="flex-1 text-xs md:text-sm leading-relaxed space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-extrabold uppercase font-title tracking-wider ${
                    isTargetCorrect
                      ? 'bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100 border border-emerald-300 dark:border-emerald-700'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {actionTag}
                </span>
              </div>
              <div className="pt-0.5">{renderKaTeX(fbText)}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Helper to extract option-level feedback
function getOptionFeedback(exercise: PracticeExercise, userAnswer: any): string | null {
  if (userAnswer === undefined || userAnswer === null) return null;

  if (exercise.type === 'true_false') {
    if (userAnswer === true && exercise.trueFeedback) return exercise.trueFeedback;
    if (userAnswer === false && exercise.falseFeedback) return exercise.falseFeedback;
  }

  if (exercise.type === 'single_choice') {
    const opt = exercise.options?.find((o) => o.id === userAnswer);
    if (opt && opt.feedback && opt.feedback.trim().length > 0) return opt.feedback;
  }

  return null;
}

// -----------------------------------------------------------------------------
// 1. Vista Verdadero / Falso
// -----------------------------------------------------------------------------
function TrueFalseView({
  exercise,
  userAnswer,
  isChecked,
  onSelect,
}: {
  exercise: TrueFalseExercise;
  userAnswer: boolean | undefined;
  isChecked: boolean;
  onSelect: (val: boolean) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="text-slate-800 dark:text-slate-200 text-sm md:text-base leading-relaxed font-medium">
        {renderKaTeX(exercise.statement)}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[true, false].map((val) => {
          const isSelected = userAnswer === val;
          const isTargetCorrect = exercise.correctAnswer === val;

          let btnClass = 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-indigo-400';
          if (isSelected) {
            btnClass = 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/30';
          }

          if (isChecked) {
            if (isTargetCorrect) {
              btnClass = 'bg-emerald-100 dark:bg-emerald-950/80 border-emerald-500 text-emerald-950 dark:text-emerald-100 font-bold';
            } else if (isSelected && !isTargetCorrect) {
              btnClass = 'bg-rose-100 dark:bg-rose-950/80 border-rose-500 text-rose-950 dark:text-rose-100 font-bold line-through';
            }
          }

          return (
            <button
              key={String(val)}
              onClick={() => onSelect(val)}
              disabled={isChecked}
              className={`p-4 md:p-5 rounded-2xl border-2 font-bold text-sm md:text-base transition-all flex items-center justify-center gap-3 cursor-pointer ${btnClass}`}
            >
              <i className={`fa-solid ${val ? 'fa-check text-emerald-600' : 'fa-xmark text-rose-600'}`}></i>
              <span>{val ? 'Verdadero' : 'Falso'}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 2. Vista Selección Única
// -----------------------------------------------------------------------------
function SingleChoiceView({
  exercise,
  userAnswer,
  isChecked,
  onSelect,
}: {
  exercise: SingleChoiceExercise;
  userAnswer: string | undefined;
  isChecked: boolean;
  onSelect: (val: string) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="text-slate-800 dark:text-slate-200 text-sm md:text-base leading-relaxed font-medium">
        {renderKaTeX(exercise.question)}
      </div>

      <div className="grid grid-cols-1 gap-3.5">
        {exercise.options.map((opt) => {
          const isSelected = userAnswer === opt.id;
          const isTargetCorrect = exercise.correctOptionId === opt.id;

          let cardClass = 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-indigo-400';
          if (isSelected) {
            cardClass = 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/30';
          }

          if (isChecked) {
            if (isTargetCorrect) {
              cardClass = 'bg-emerald-100 dark:bg-emerald-950/80 border-emerald-500 text-emerald-950 dark:text-emerald-100 font-bold';
            } else if (isSelected && !isTargetCorrect) {
              cardClass = 'bg-rose-100 dark:bg-rose-950/80 border-rose-500 text-rose-950 dark:text-rose-100 font-bold line-through';
            }
          }

          let feedbackBadge: { label: string; style: string } | null = null;
          if (isChecked) {
            if (isSelected && isTargetCorrect) {
              feedbackBadge = {
                label: '✓ Marcada y Correcta',
                style: 'bg-emerald-100 dark:bg-emerald-950/80 border-emerald-500 text-emerald-950 dark:text-emerald-100'
              };
            } else if (isSelected && !isTargetCorrect) {
              feedbackBadge = {
                label: '✕ Marcada pero es Incorrecto',
                style: 'bg-rose-100 dark:bg-rose-950/80 border-rose-500 text-rose-950 dark:text-rose-100'
              };
            } else if (!isSelected && isTargetCorrect && userAnswer !== undefined) {
              feedbackBadge = {
                label: '💡 Esta era la Opción Correcta',
                style: 'bg-blue-100 dark:bg-blue-950/80 border-blue-500 text-blue-950 dark:text-blue-100'
              };
            }
          }

          return (
            <div key={opt.id} className="space-y-2">
              <button
                onClick={() => onSelect(opt.id)}
                disabled={isChecked}
                className={`w-full p-4 md:p-5 rounded-2xl border-2 text-left transition-all flex items-center gap-4 cursor-pointer ${cardClass}`}
              >
                <span className="w-8 h-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-sm font-black shrink-0 font-title">
                  {opt.id}
                </span>
                <div className="flex-1 text-sm md:text-base leading-relaxed">
                  {renderKaTeX(opt.text)}
                </div>
              </button>

              {feedbackBadge && (
                <div className="ml-3 md:ml-6 pt-0.5">
                  <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs md:text-sm font-bold shadow-2xs font-title ${feedbackBadge.style}`}>
                    {feedbackBadge.label}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 3. Vista Selección Múltiple (Casillas)
// -----------------------------------------------------------------------------
function MultipleChoiceView({
  exercise,
  userAnswer,
  isChecked,
  onSelect,
}: {
  exercise: MultipleChoiceExercise;
  userAnswer: string[] | undefined;
  isChecked: boolean;
  onSelect: (val: string[]) => void;
}) {
  const currentSelected = userAnswer || [];

  const toggleOption = (id: string) => {
    if (currentSelected.includes(id)) {
      onSelect(currentSelected.filter((val) => val !== id));
    } else {
      onSelect([...currentSelected, id]);
    }
  };

  return (
    <div className="space-y-5">
      <div className="text-slate-800 dark:text-slate-200 text-sm md:text-base leading-relaxed font-medium">
        {renderKaTeX(exercise.question)}
      </div>

      <div className="grid grid-cols-1 gap-3.5">
        {exercise.options.map((opt) => {
          const isSelected = currentSelected.includes(opt.id);
          const isTargetCorrect = exercise.correctOptionIds.includes(opt.id);

          let cardClass = 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-indigo-400';
          if (isSelected) {
            cardClass = 'bg-purple-50 dark:bg-purple-950/60 border-purple-500 text-purple-900 dark:text-purple-200 ring-2 ring-purple-500/30';
          }

          if (isChecked) {
            if (isTargetCorrect && isSelected) {
              cardClass = 'bg-emerald-100 dark:bg-emerald-950/80 border-emerald-500 text-emerald-950 dark:text-emerald-100 font-bold';
            } else if (!isTargetCorrect && !isSelected) {
              cardClass = 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100 font-medium';
            } else if (isTargetCorrect && !isSelected) {
              cardClass = 'bg-amber-50 dark:bg-amber-950/60 border-amber-400 text-amber-950 dark:text-amber-100 font-bold';
            } else if (isSelected && !isTargetCorrect) {
              cardClass = 'bg-rose-100 dark:bg-rose-950/80 border-rose-500 text-rose-950 dark:text-rose-100 font-bold';
            }
          }

          let feedbackBadge: { label: string; style: string } | null = null;
          if (isChecked) {
            if (isSelected && isTargetCorrect) {
              feedbackBadge = {
                label: '✓ Marcada y Correcta',
                style: 'bg-emerald-100 dark:bg-emerald-950/80 border-emerald-500 text-emerald-950 dark:text-emerald-100'
              };
            } else if (!isSelected && !isTargetCorrect) {
              feedbackBadge = {
                label: '✓ No Marcada y Correcta',
                style: 'bg-emerald-100 dark:bg-emerald-950/80 border-emerald-500 text-emerald-950 dark:text-emerald-100'
              };
            } else if (!isSelected && isTargetCorrect) {
              feedbackBadge = {
                label: '⚠️ Te faltó marcar esta casilla',
                style: 'bg-amber-100 dark:bg-amber-950/80 border-amber-500 text-amber-950 dark:text-amber-100'
              };
            } else if (isSelected && !isTargetCorrect) {
              feedbackBadge = {
                label: '✕ Marcada pero es Incorrecto',
                style: 'bg-rose-100 dark:bg-rose-950/80 border-rose-500 text-rose-950 dark:text-rose-100'
              };
            }
          }

          return (
            <div key={opt.id} className="space-y-2">
              <button
                onClick={() => toggleOption(opt.id)}
                disabled={isChecked}
                className={`w-full p-4 md:p-5 rounded-2xl border-2 text-left transition-all flex items-center gap-4 cursor-pointer ${cardClass}`}
              >
                <div
                  className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${
                    isSelected
                      ? isChecked && !isTargetCorrect
                        ? 'bg-rose-600 border-rose-600 text-white'
                        : 'bg-purple-600 border-purple-600 text-white'
                      : 'border-slate-400 dark:border-slate-600 bg-white dark:bg-slate-900'
                  }`}
                >
                  {isSelected && <i className="fa-solid fa-check text-xs"></i>}
                </div>
                <span className="w-8 h-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-sm font-black shrink-0 font-title">
                  {opt.id}
                </span>
                <div className="flex-1 text-sm md:text-base leading-relaxed">
                  {renderKaTeX(opt.text)}
                </div>
              </button>

              {feedbackBadge && (
                <div className="ml-3 md:ml-6 pt-0.5">
                  <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs md:text-sm font-bold shadow-2xs font-title ${feedbackBadge.style}`}>
                    {feedbackBadge.label}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 4. Vista Términos Pareados (Soporta 2 o 3 Columnas Dinámicas)
// -----------------------------------------------------------------------------
function MatchingView({
  exercise,
  userAnswer,
  isChecked,
  onSelect,
}: {
  exercise: MatchingExercise;
  userAnswer: any;
  isChecked: boolean;
  onSelect: (val: any) => void;
}) {
  const is3Cols = exercise.columns === 3;
  const currentMap = userAnswer || {};

  const col1Title = exercise.col1Title || 'Columna 1: Expresiones';
  const col2Title = exercise.col2Title || 'Columna 2: Clasificación';
  const col3Title = exercise.col3Title || 'Columna 3: Interpretación';

  const handleSelection = (itemId: string, colKey: 'col2' | 'col3', value: string) => {
    if (!is3Cols) {
      onSelect({
        ...currentMap,
        [itemId]: value,
      });
    } else {
      const prevItem = typeof currentMap[itemId] === 'object' ? currentMap[itemId] : { col2: currentMap[itemId] || '', col3: '' };
      onSelect({
        ...currentMap,
        [itemId]: {
          ...prevItem,
          [colKey]: value,
        },
      });
    }
  };

  const gridColsClass = is3Cols ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2';

  return (
    <div className="flex flex-col">
      {/* 📌 1. Pregunta del Ejercicio */}
      <div className="text-slate-800 dark:text-slate-200 text-sm md:text-base leading-relaxed font-medium mb-6">
        {renderKaTeX(exercise.question)}
      </div>

      {/* 📌 2. Columnas de Visualización Alineadas Fila por Fila (2 o 3 Columnas) */}
      <div style={{ marginTop: '20px', marginBottom: '14px' }} className="space-y-4">
        {/* Encabezados de Columna */}
        <div className={`grid ${gridColsClass} gap-6 pb-1`}>
          <h5 className="font-bold text-sm md:text-base text-blue-600 dark:text-blue-400">
            {col1Title}
          </h5>
          <h5 className="font-bold text-sm md:text-base text-blue-600 dark:text-blue-400 hidden md:block">
            {col2Title}
          </h5>
          {is3Cols && (
            <h5 className="font-bold text-sm md:text-base text-blue-600 dark:text-blue-400 hidden md:block">
              {col3Title}
            </h5>
          )}
        </div>

        {/* Filas pareadas a la misma altura horizontal considerando la columna más larga */}
        <div className="space-y-4">
          {(() => {
            const maxRows = Math.max(
              exercise.col1Items?.length || 0,
              exercise.col2Options?.length || 0,
              is3Cols ? (exercise.col3Options?.length || 0) : 0
            );
            const rowIndices = Array.from({ length: maxRows });

            return rowIndices.map((_, idx) => {
              const item = exercise.col1Items?.[idx];
              const opt2 = exercise.col2Options?.[idx];
              const opt3 = exercise.col3Options?.[idx];

              return (
                <div key={item?.id || `row-${idx}`} className={`grid ${gridColsClass} gap-6 items-stretch`}>
                  {/* Caja Ítem Columna 1 */}
                  {item ? (
                    <div className="p-4 md:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs flex items-center gap-3 h-full">
                      <span className="font-bold text-sm md:text-base text-slate-900 dark:text-slate-100 shrink-0">
                        {item.num}.
                      </span>
                      <div className="text-sm md:text-base leading-relaxed text-slate-800 dark:text-slate-200">
                        {renderKaTeX(item.text)}
                      </div>
                    </div>
                  ) : (
                    <div className="hidden md:block"></div>
                  )}

                  {/* Caja Opción Columna 2 */}
                  {opt2 ? (
                    <div className="p-4 md:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs flex items-center gap-3 h-full">
                      <span className="font-bold text-sm md:text-base text-slate-900 dark:text-slate-100 shrink-0">
                        {opt2.letter}.
                      </span>
                      <div className="text-sm md:text-base leading-relaxed text-slate-800 dark:text-slate-200">
                        {renderKaTeX(opt2.text)}
                      </div>
                    </div>
                  ) : (
                    <div className="hidden md:block"></div>
                  )}

                  {/* Caja Opción Columna 3 (Si aplica) */}
                  {is3Cols && (
                    opt3 ? (
                      <div className="p-4 md:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs flex items-center gap-3 h-full">
                        <span className="font-bold text-sm md:text-base text-slate-900 dark:text-slate-100 shrink-0">
                          {opt3.letter}.
                        </span>
                        <div className="text-sm md:text-base leading-relaxed text-slate-800 dark:text-slate-200">
                          {renderKaTeX(opt3.text)}
                        </div>
                      </div>
                    ) : (
                      <div className="hidden md:block"></div>
                    )
                  )}
                </div>
              );
            });
          })()}
        </div>
      </div>

      {/* 📌 3. Sección de Listas Desplegables de Asociación */}
      <div
        style={{ marginTop: '0px', paddingTop: '14px' }}
        className="space-y-4 border-t border-slate-200 dark:border-slate-800"
      >
        <h5 className="font-bold text-sm md:text-base text-slate-900 dark:text-slate-100">
          {is3Cols
            ? 'Asocia cada Número de la Columna 1 con su Letra de la Columna 2 y Opción de la Columna 3:'
            : 'Asocia cada Número de la Columna 1 con su Letra de la Columna 2:'}
        </h5>

        <div className="space-y-3">
          {exercise.col1Items.map((item) => {
            const rawSel = currentMap[item.id];
            const selectedCol2 = typeof rawSel === 'object' ? rawSel?.col2 || '' : rawSel || '';
            const selectedCol3 = typeof rawSel === 'object' ? rawSel?.col3 || '' : '';

            const targetCol2 = exercise.correctMapping?.[item.id] || exercise.col2Options[0]?.letter || 'A';
            const targetCol3 = exercise.correctMappingCol3?.[item.id] || exercise.col3Options?.[0]?.letter || 'I';

            const isCol2Ok = selectedCol2 === targetCol2;
            const isCol3Ok = !is3Cols || selectedCol3 === targetCol3;
            const isItemCorrect = isChecked && isCol2Ok && isCol3Ok;

            const targetLabel = is3Cols ? `${targetCol2} - ${targetCol3}` : targetCol2;

            return (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-4 py-1.5"
              >
                <div className="flex flex-wrap items-center gap-4">
                  <span className="font-bold text-sm md:text-base text-slate-900 dark:text-slate-100">
                    Ítem {item.num}:
                  </span>

                  {/* Selector Columna 2 */}
                  <div className="flex items-center gap-2">
                    {is3Cols && <span className="text-xs font-bold text-slate-500">Col 2:</span>}
                    <select
                      disabled={isChecked}
                      value={selectedCol2}
                      onChange={(e) => handleSelection(item.id, 'col2', e.target.value)}
                      className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm md:text-base font-semibold focus:ring-2 focus:ring-blue-500 shadow-2xs cursor-pointer"
                    >
                      <option value="">-- Elegir --</option>
                      {exercise.col2Options.map((opt) => (
                        <option key={opt.letter} value={opt.letter}>
                          {opt.letter}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Selector Columna 3 (Si aplica) */}
                  {is3Cols && exercise.col3Options && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500">Col 3:</span>
                      <select
                        disabled={isChecked}
                        value={selectedCol3}
                        onChange={(e) => handleSelection(item.id, 'col3', e.target.value)}
                        className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm md:text-base font-semibold focus:ring-2 focus:ring-blue-500 shadow-2xs cursor-pointer"
                      >
                        <option value="">-- Elegir --</option>
                        {exercise.col3Options.map((opt) => (
                          <option key={opt.letter} value={opt.letter}>
                            {opt.letter}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {isChecked && (
                  <div className="flex items-center gap-2 text-sm md:text-base font-bold">
                    {isItemCorrect ? (
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <i className="fa-solid fa-circle-check"></i> Correcto ({targetLabel})
                      </span>
                    ) : (
                      <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                        <i className="fa-solid fa-circle-xmark"></i> Incorrecto (Era {targetLabel})
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
