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
    // Find next command tag (\VF, \ALT, \MATCH, \NUM)
    const match = cleanText.substring(pos).match(/\\(VF|ALT|MATCH|NUM)/);
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

        exercises.push({
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
        });
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
      }
    } catch (err: any) {
      errors.push(`Error al procesar Ejercicio ${exCount} (\\${commandTag}): ${err?.message || 'Error de sintaxis.'}`);
    }
  }

  if (exCount === 0 && errors.length === 0 && rawText.trim().length > 0) {
    errors.push('No se detectó ninguna etiqueta válida (\\VF, \\ALT, \\MATCH, \\NUM) en el texto ingresado.');
  }

  return { exercises, errors };
}

export const SAMPLE_IMPORT_TEMPLATE = `% =========================================================
% PLANTILLA DE EJERCICIOS EN SINTAXIS LATEX PARA AULAS VIRTUALES
% Usa los comandos: \\VF, \\ALT, \\MATCH, \\NUM
% =========================================================

\\VF{La derivada de $f(x) = x^2$ en $x = 3$ es igual a $6$}{V}{Derivando la función obtenemos $f'(x) = 2x$. Evaluando en $x=3$: $f'(3) = 2(3) = 6$.}

\\ALT{¿Cuál es el valor del límite trigonométrico fundamental $\\lim_{x \\to 0} \\frac{\\sin(x)}{x}$?}{A) $0$ | B) $1$* | C) $\\infty$ | D) No existe}{Es un límite fundamental demostrable geométricamente mediante el Teorema del Sándwich.}

\\MATCH{Relaciona cada función matemática con su respectiva antiderivada directa}{1. $f(x) = x^2$ -> $\\frac{x^3}{3} + C$ | 2. $f(x) = e^x$ -> $e^x + C$ | 3. $f(x) = \\frac{1}{x}$ -> \\ln|x| + C}{1.A: Aplica regla de potencia. 2.B: La función exponencial es su propia antiderivada. 3.C: Derivada de logaritmo natural.}

\\NUM{Calcule el valor de la integral definida $\\int_{0}^{2} 3x^2 \\, dx$}{8}{La antiderivada es $F(x) = x^3$. Evaluando en los límites: $F(2) - F(0) = 2^3 - 0^3 = 8$.}
`;
