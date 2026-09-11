import type { PracticeExercise } from '@/components/classroom/InteractivePractice';

export interface ParseResult {
  exercises: PracticeExercise[];
  errors: string[];
}

/**
 * Helper to extract brace-enclosed parameters from a LaTeX string starting at a given position.
 * Handles nested braces like \VF{...}{...}{...}
 */
function extractBraceParams(str: string, startIndex: number): { params: string[]; nextIndex: number } | null {
  const params: string[] = [];
  let i = startIndex;

  while (i < str.length) {
    // Skip whitespace or comments between braces
    while (i < str.length && /\s/.test(str[i])) {
      i++;
    }
    if (i >= str.length || str[i] !== '{') {
      break;
    }

    // Read content inside braces matching nested { }
    let depth = 0;
    let content = '';
    const paramStart = i;
    i++; // Skip opening '{'
    depth = 1;

    while (i < str.length && depth > 0) {
      const char = str[i];
      if (char === '{' && str[i - 1] !== '\\') {
        depth++;
      } else if (char === '}' && str[i - 1] !== '\\') {
        depth--;
      }

      if (depth > 0) {
        content += char;
      }
      i++;
    }

    if (depth !== 0) {
      // Unmatched brace
      return null;
    }

    params.push(content);
  }

  return { params, nextIndex: i };
}

/**
 * Parses LaTeX tag-based text containing \VF, \ALT, \MATCH, \NUM definitions
 */
export function parseExerciseSyntaxText(rawText: string): ParseResult {
  const exercises: PracticeExercise[] = [];
  const errors: string[] = [];

  // Remove lines starting with % (LaTeX comments)
  const cleanText = rawText
    .split('\n')
    .filter((line) => !line.trim().startsWith('%'))
    .join('\n');

  let pos = 0;
  let exCount = 0;

  while (pos < cleanText.length) {
    // Find next command tag (\VF, \ALT, \MATCH, \NUM, \MULT)
    const match = cleanText.substring(pos).match(/\\(VF|ALT|MATCH|NUM|MULT)/);
    if (!match || match.index === undefined) {
      break;
    }

    const commandTag = match[1];
    const commandStart = pos + match.index;
    const braceStart = commandStart + match[0].length;

    const extracted = extractBraceParams(cleanText, braceStart);
    if (!extracted) {
      const lineNumber = cleanText.substring(0, commandStart).split('\n').length;
      errors.push(`Línea ${lineNumber}: Llaves de apertura/cierre inconclusas en comando \\${commandTag}.`);
      pos = commandStart + match[0].length;
      continue;
    }

    const { params, nextIndex } = extracted;
    pos = nextIndex;
    exCount++;
    const uniqueId = `imported-ex-${Date.now()}-${exCount}-${Math.random().toString(36).substring(2, 7)}`;

    // Parse according to tag type
    try {
      if (commandTag === 'VF') {
        if (params.length < 3) {
          errors.push(`Ejercicio ${exCount} (\\VF): Se requieren al menos 3 parámetros {Enunciado}{V o F}{Explicación}. Se recibieron ${params.length}.`);
          continue;
        }

        const [statement, veracity, explanation, customTrueFb, customFalseFb] = params;
        const vClean = veracity.trim().toUpperCase();
        const isTrue = vClean === 'V' || vClean === 'VERDADERO' || vClean === 'TRUE' || vClean === '1';

        exercises.push({
          id: uniqueId,
          type: 'true_false',
          title: `Ejercicio ${exCount}: Verdadero o Falso`,
          statement: statement.trim(),
          correctAnswer: isTrue,
          explanation: explanation.trim(),
          trueFeedback: customTrueFb?.trim() || (isTrue ? '¡Correcto! La afirmación es verdadera.' : '¡Incorrecto! La afirmación es falsa.'),
          falseFeedback: customFalseFb?.trim() || (!isTrue ? '¡Correcto! La afirmación es falsa.' : '¡Incorrecto! La afirmación es verdadera.')
        });
      } else if (commandTag === 'ALT') {
        if (params.length < 3) {
          errors.push(`Ejercicio ${exCount} (\\ALT): Se requieren 3 parámetros {Pregunta}{A) Op1 | B) Op2* | ...}{Explicación}. Se recibieron ${params.length}.`);
          continue;
        }

        const [question, optionsRaw, explanation] = params;
        const rawOptions = optionsRaw.split('|').map((s) => s.trim()).filter(Boolean);

        if (rawOptions.length < 2) {
          errors.push(`Ejercicio ${exCount} (\\ALT): Debe incluir al menos 2 alternativas separadas por el caracter '|'.`);
          continue;
        }

        let correctOptId = 'A';
        let foundCorrect = false;

        const options = rawOptions.map((optStr, idx) => {
          const letter = String.fromCharCode(65 + idx); // A, B, C, D...
          let isCorrect = false;
          let cleanOptText = optStr;

          // Check if marked correct with * or [OK] or (Correcta)
          if (cleanOptText.includes('*') || /\[OK\]/i.test(cleanOptText) || /\(Correcta\)/i.test(cleanOptText)) {
            isCorrect = true;
            cleanOptText = cleanOptText
              .replace(/\*/g, '')
              .replace(/\[OK\]/gi, '')
              .replace(/\(Correcta\)/gi, '')
              .trim();
          }

          // Strip A), B), C)... prefix if user wrote it explicitly
          cleanOptText = cleanOptText.replace(/^[A-Za-z][\)\.\-]\s*/, '').trim();

          if (isCorrect) {
            correctOptId = letter;
            foundCorrect = true;
          }

          return {
            id: letter,
            text: cleanOptText,
            feedback: isCorrect ? '¡Excelente! Respuesta correcta.' : 'Incorrecto. Revisa el procedimiento.'
          };
        });

        if (!foundCorrect) {
          // Default first option to correct if missing marker and warn
          correctOptId = 'A';
          errors.push(`Ejercicio ${exCount} (\\ALT): No se encontró ninguna opción marcada con '*' (se asignó 'A' por defecto).`);
        }

        exercises.push({
          id: uniqueId,
          type: 'single_choice',
          title: `Ejercicio ${exCount}: Selección Múltiple`,
          question: question.trim(),
          options,
          correctOptionId: correctOptId,
          explanation: explanation.trim()
        });
      } else if (commandTag === 'MATCH') {
        if (params.length < 3) {
          errors.push(`Ejercicio ${exCount} (\\MATCH): Se requieren 3 parámetros {Instrucción}{Item1 -> RespA | Item2 -> RespB}{Explicación}. Se recibieron ${params.length}.`);
          continue;
        }

        const [statement, pairsRaw, explanation] = params;
        const pairLines = pairsRaw.split('|').map((s) => s.trim()).filter(Boolean);

        if (pairLines.length < 1) {
          errors.push(`Ejercicio ${exCount} (\\MATCH): Debe incluir al menos 1 pareja de relación (ej: Item1 -> RespA).`);
          continue;
        }

        const col1Items: { id: string; num: number; text: string }[] = [];
        const col2Options: { letter: string; text: string }[] = [];
        const correctMapping: Record<string, string> = {};

        pairLines.forEach((pairStr, idx) => {
          const parts = pairStr.split(/->|=>|:/).map((s) => s.trim());
          const leftText = parts[0] ? parts[0].replace(/^[0-9]+[\)\.\-]\s*/, '').trim() : `Ítem ${idx + 1}`;
          const rightText = parts[1] ? parts[1].replace(/^[A-Za-z][\)\.\-]\s*/, '').trim() : `Respuesta ${idx + 1}`;

          const itemId = String(idx + 1);
          const targetLetter = String.fromCharCode(65 + idx); // A, B, C...

          col1Items.push({ id: itemId, num: idx + 1, text: leftText });
          col2Options.push({ letter: targetLetter, text: rightText });
          correctMapping[itemId] = targetLetter;
        });

        exercises.push(
          shuffleMatchingExerciseOptions({
            id: uniqueId,
            type: 'matching',
            title: `Ejercicio ${exCount}: Casillas de Relación`,
            question: statement.trim(),
            columns: 2,
            col1Title: 'Ítem / Concepto',
            col2Title: 'Respuesta / Expresión',
            col1Items,
            col2Options,
            correctMapping,
            explanation: explanation.trim()
          })
        );
      } else if (commandTag === 'NUM') {
        if (params.length < 3) {
          errors.push(`Ejercicio ${exCount} (\\NUM): Se requieren 3 parámetros {Enunciado}{Valor Exacto}{Explicación}. Se recibieron ${params.length}.`);
          continue;
        }

        const [question, expectedValue, explanation] = params;
        const valClean = expectedValue.trim();

        exercises.push({
          id: uniqueId,
          type: 'single_choice',
          title: `Ejercicio ${exCount}: Respuesta Exacta`,
          question: question.trim(),
          options: [
            { id: 'A', text: valClean, feedback: '¡Correcto! Respuesta numérica exacta.' },
            { id: 'B', text: `-${valClean}`, feedback: 'Incorrecto. Revisa el signo del resultado.' },
            { id: 'C', text: `0`, feedback: 'Incorrecto.' }
          ],
          correctOptionId: 'A',
          explanation: explanation.trim()
        });
      } else if (commandTag === 'MULT') {
        if (params.length < 2) {
          errors.push(`Ejercicio ${exCount} (\\MULT): Se requieren al menos 2 parámetros {Pregunta}{Opciones o bloques \\casilla{...}}. Se recibieron ${params.length}.`);
          continue;
        }

        const [question, optionsRaw, explanationRaw] = params;
        const explanation = explanationRaw?.trim() || '';
        const options: { id: string; text: string; feedback?: string; isCorrect?: boolean }[] = [];
        const correctOptionIds: string[] = [];

        // Check if options contains \casilla{Texto}{V/F}{Retroalimentación}
        if (optionsRaw.includes('\\casilla')) {
          let posCasilla = 0;
          let casillaIdx = 0;

          while (posCasilla < optionsRaw.length) {
            const cMatch = optionsRaw.substring(posCasilla).match(/\\casilla/);
            if (!cMatch || cMatch.index === undefined) break;

            const cStart = posCasilla + cMatch.index + cMatch[0].length;
            const cExtracted = extractBraceParams(optionsRaw, cStart);
            if (!cExtracted) break;

            const { params: cParams, nextIndex } = cExtracted;
            posCasilla = nextIndex;

            if (cParams.length >= 2) {
              const [optText, veracity, customFb] = cParams;
              const letter = String.fromCharCode(65 + casillaIdx);
              const vClean = veracity.trim().toUpperCase();
              const isCorrect = vClean === 'V' || vClean === 'VERDADERO' || vClean === 'TRUE' || vClean === '1' || vClean === 'CORRECTO';

              if (isCorrect) {
                correctOptionIds.push(letter);
              }

              options.push({
                id: letter,
                text: optText.trim(),
                isCorrect,
                feedback: customFb?.trim() || (isCorrect ? '¡Correcto! Afirmación acertada.' : 'Incorrecto.')
              });
              casillaIdx++;
            }
          }
        } else {
          // Pipeline-separated options: Opción A* -> FB | Opción B -> FB
          const rawOptions = optionsRaw.split('|').map((s) => s.trim()).filter(Boolean);
          rawOptions.forEach((optStr, idx) => {
            const letter = String.fromCharCode(65 + idx);
            let isCorrect = false;
            let cleanText = optStr;

            if (cleanText.includes('*') || /\[OK\]/i.test(cleanText) || /\(Correcta\)/i.test(cleanText)) {
              isCorrect = true;
              cleanText = cleanText.replace(/\*/g, '').replace(/\[OK\]/gi, '').replace(/\(Correcta\)/gi, '').trim();
            }

            let fb = isCorrect ? '¡Excelente! Respuesta correcta.' : 'Incorrecto. Revisa la opción.';
            if (cleanText.includes('->') || cleanText.includes('::')) {
              const parts = cleanText.split(/->|::/).map((s) => s.trim());
              cleanText = parts[0];
              if (parts[1]) fb = parts[1];
            }

            cleanText = cleanText.replace(/^[A-Za-z][\)\.\-]\s*/, '').trim();

            if (isCorrect) {
              correctOptionIds.push(letter);
            }

            options.push({
              id: letter,
              text: cleanText,
              isCorrect,
              feedback: fb
            });
          });
        }

        if (options.length === 0) {
          errors.push(`Ejercicio ${exCount} (\\MULT): No se encontraron opciones o bloques \\casilla válidos.`);
          continue;
        }

        if (correctOptionIds.length === 0) {
          correctOptionIds.push('A');
          if (options[0]) options[0].isCorrect = true;
          errors.push(`Ejercicio ${exCount} (\\MULT): No se marcó ninguna opción como correcta (se asignó 'A' por defecto).`);
        }

        exercises.push({
          id: uniqueId,
          type: 'multiple_choice',
          title: `Ejercicio ${exCount}: Selección Múltiple (Casillas)`,
          question: question.trim(),
          options,
          correctOptionIds,
          explanation: explanation.trim()
        });
      }
    } catch (err: any) {
      errors.push(`Error al procesar Ejercicio ${exCount} (\\${commandTag}): ${err?.message || 'Error de sintaxis.'}`);
    }
  }

  if (exCount === 0 && errors.length === 0 && rawText.trim().length > 0) {
    errors.push('No se detectó ninguna etiqueta válida (\\VF, \\ALT, \\MATCH, \\NUM, \\MULT) en el texto ingresado.');
  }

  return { exercises, errors };
}

export const SAMPLE_IMPORT_TEMPLATE = `% =========================================================
% PLANTILLA DE EJERCICIOS EN SINTAXIS LATEX PARA AULAS VIRTUALES
% Usa los comandos: \\VF, \\ALT, \\MATCH, \\NUM, \\MULT
% =========================================================

\\VF{La derivada de $f(x) = x^2$ en $x = 3$ es igual a $6$}{V}{Derivando la función obtenemos $f'(x) = 2x$. Evaluando en $x=3$: $f'(3) = 2(3) = 6$.}

\\ALT{¿Cuál es el valor del límite trigonométrico fundamental $\\lim_{x \\to 0} \\frac{\\sin(x)}{x}$?}{A) $0$ | B) $1$* | C) $\\infty$ | D) No existe}{Es un límite fundamental demostrable geométricamente mediante el Teorema del Sándwich.}

\\MATCH{Relaciona cada función matemática con su respectiva antiderivada directa}{1. $f(x) = x^2$ -> $\\frac{x^3}{3} + C$ | 2. $f(x) = e^x$ -> $e^x + C$ | 3. $f(x) = \\frac{1}{x}$ -> \\ln|x| + C}{1.A: Aplica regla de potencia. 2.B: La función exponencial es su propia antiderivada. 3.C: Derivada de logaritmo natural.}

\\NUM{Calcule el valor de la integral definida $\\int_{0}^{2} 3x^2 \\, dx$}{8}{La antiderivada es $F(x) = x^3$. Evaluando en los límites: $F(2) - F(0) = 2^3 - 0^3 = 8$.}

\\MULT{Se requiere evaluar el límite $\\lim_{(x,y) \\to (0,0)} \\arccos\\left(\\frac{x}{\\sqrt{x^2 + y^2}}\\right)$. Selecciona todas las afirmaciones correctas:}{
  \\casilla{La expresión se reduce algebraicamente a $\\arccos(\\cos\\theta)$.}{V}{¡Correcto! Sustituyendo $x=r\\cos\\theta$ y $\\sqrt{x^2+y^2}=r$.}
  \\casilla{Como $\\arccos(\\cos\\theta)=\\theta$, el límite no existe por depender de $\\theta$.}{V}{¡Exacto! El resultado depende del ángulo de aproximación.}
  \\casilla{El límite existe y vale $1$.}{F}{Falso. Se confunde con el Teorema de Cero por Acotado.}
  \\casilla{Por $\\theta=0$ el límite da $0$, pero por $\\theta=\\pi/2$ da $\\pi/2$.}{V}{¡Correcto! Caminos distintos entregan valores distintos.}
}
`;

/**
 * Helper to scramble/shuffle the options (Col 2 and Col 3) of a matching exercise
 * and automatically update the correct mapping so answers are never sequentially ordered (1A, 2B, 3C).
 */
export function shuffleMatchingExerciseOptions<T extends PracticeExercise>(ex: T): T {
  if (ex.type !== 'matching' || !ex.col1Items || ex.col1Items.length <= 1 || !ex.col2Options || ex.col2Options.length <= 1) {
    return ex;
  }

  // 1. Map itemId -> correct text for Col 2
  const itemIdToCol2Text: Record<string, string> = {};
  ex.col1Items.forEach((item) => {
    const currentLetter = ex.correctMapping?.[item.id];
    const opt = ex.col2Options.find((o) => o.letter === currentLetter) || ex.col2Options.find((o) => o.letter === item.id);
    if (opt) {
      itemIdToCol2Text[item.id] = opt.text;
    }
  });

  const col2Texts = ex.col2Options.map((o) => o.text);

  let shuffledCol2Texts = [...col2Texts];
  for (let i = shuffledCol2Texts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledCol2Texts[i], shuffledCol2Texts[j]] = [shuffledCol2Texts[j], shuffledCol2Texts[i]];
  }

  // Ensure order changed if length > 1
  if (shuffledCol2Texts.every((t, i) => t === col2Texts[i]) && col2Texts.length > 1) {
    const first = shuffledCol2Texts.shift()!;
    shuffledCol2Texts.push(first);
  }

  const newCol2Options = shuffledCol2Texts.map((text, idx) => ({
    letter: String.fromCharCode(65 + idx),
    text
  }));

  const newCorrectMapping: Record<string, string> = {};
  ex.col1Items.forEach((item) => {
    const targetText = itemIdToCol2Text[item.id];
    const newOpt = newCol2Options.find((o) => o.text === targetText) || newCol2Options[0];
    if (newOpt) {
      newCorrectMapping[item.id] = newOpt.letter;
    }
  });

  let newCol3Options = ex.col3Options;
  let newCorrectMappingCol3 = ex.correctMappingCol3;

  if (ex.columns === 3 && ex.col3Options && ex.col3Options.length > 1) {
    const itemIdToCol3Text: Record<string, string> = {};
    ex.col1Items.forEach((item) => {
      const currentLetter = ex.correctMappingCol3?.[item.id];
      const opt = ex.col3Options?.find((o) => o.letter === currentLetter);
      if (opt) {
        itemIdToCol3Text[item.id] = opt.text;
      }
    });

    const col3Texts = ex.col3Options.map((o) => o.text);
    let shuffledCol3Texts = [...col3Texts];
    for (let i = shuffledCol3Texts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledCol3Texts[i], shuffledCol3Texts[j]] = [shuffledCol3Texts[j], shuffledCol3Texts[i]];
    }

    if (shuffledCol3Texts.every((t, i) => t === col3Texts[i]) && col3Texts.length > 1) {
      const first = shuffledCol3Texts.shift()!;
      shuffledCol3Texts.push(first);
    }

    const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
    newCol3Options = shuffledCol3Texts.map((text, idx) => ({
      letter: romanNumerals[idx] || String(idx + 1),
      text
    }));

    newCorrectMappingCol3 = {};
    ex.col1Items.forEach((item) => {
      const targetText = itemIdToCol3Text[item.id];
      const newOpt = newCol3Options?.find((o) => o.text === targetText) || newCol3Options?.[0];
      if (newOpt) {
        newCorrectMappingCol3![item.id] = newOpt.letter;
      }
    });
  }

  return {
    ...ex,
    col2Options: newCol2Options,
    correctMapping: newCorrectMapping,
    col3Options: newCol3Options,
    correctMappingCol3: newCorrectMappingCol3
  };
}
