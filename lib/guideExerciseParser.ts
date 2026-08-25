import type { ProblemItem } from './classroomData';

export interface GuideParseResult {
  problems: ProblemItem[];
  errors: string[];
}

export const SAMPLE_GUIDE_IMPORT_TEMPLATE = `% ==============================================================================
% PLANTILLA DE IMPORTACIÓN EN BLOQUE - EJERCICIOS DE LA GUÍA (PESTAÑA 4)
% ==============================================================================
% Puedes usar la etiqueta \\PROBLEMA{...} seguida de \\PAUTA{...}, \\DIFICULTAD{...}, etc.
% O también la etiqueta única \\GUIA{Enunciado}{Pauta}{Dificultad}{Conceptos}{Habilidades}
% ==============================================================================

\\PROBLEMA{Dada la función $f(x) = \\sqrt{2x + 1}$, determine $f'(x)$ utilizando la definición por límite y encuentre la ecuación de la recta tangente a la curva en el punto de abscisa $x = 4$.}
\\PAUTA{1. Planteamos el cociente incremental por definición:
$$f'(x) = \\lim_{h \\to 0} \\frac{\\sqrt{2(x+h)+1} - \\sqrt{2x+1}}{h}$$

2. Racionalizamos multiplicando por la expresión conjugada del numerador:
$$f'(x) = \\lim_{h \\to 0} \\frac{2(x+h)+1 - (2x+1)}{h(\\sqrt{2(x+h)+1} + \\sqrt{2x+1})} = \\lim_{h \\to 0} \\frac{2h}{h(\\sqrt{2(x+h)+1} + \\sqrt{2x+1})}$$

3. Cancelamos $h \\neq 0$ y evaluamos el límite cuando $h \\to 0$:
$$f'(x) = \\frac{2}{2\\sqrt{2x+1}} = \\frac{1}{\\sqrt{2x+1}}$$

4. Evaluamos la pendiente en $x=4$: $m = f'(4) = \\frac{1}{\\sqrt{9}} = \\frac{1}{3}$.
Como $f(4) = 3$, la recta tangente en $(4,3)$ es:
$$y - 3 = \\frac{1}{3}(x - 4) \\implies y = \\frac{1}{3}x + \\frac{5}{3}$$}
\\DIFICULTAD{Medio}
\\CONCEPTOS{Definición por Límite, Recta Tangente, Racionalización}
\\HABILIDADES{Cálculo Algorítmico, Razonamiento Gráfico}

\\PROBLEMA{Demuestre que la función $f(x) = x \\cdot |x|$ es diferenciable en el origen $x = 0$ y determine el valor exacto de su derivada $f'(0)$.}
\\PAUTA{1. Evaluamos el límite lateral por la izquierda ($h \\to 0^-$):
$$\\lim_{h \\to 0^-} \\frac{h(-h) - 0}{h} = \\lim_{h \\to 0^-} (-h) = 0$$

2. Evaluamos el límite lateral por la derecha ($h \\to 0^+$):
$$\\lim_{h \\to 0^+} \\frac{h(h) - 0}{h} = \\lim_{h \\to 0^+} (h) = 0$$

3. Dado que ambos límites laterales son finitos y coinciden, la función es diferenciable en el origen y $f'(0) = 0$.}
\\DIFICULTAD{Medio}
\\CONCEPTOS{Límites Laterales, Diferenciabilidad, Valor Absoluto}
\\HABILIDADES{Demostración Rigurosa, Razonamiento Gráfico}

\\PROBLEMA{Un objeto se mueve en línea recta siguiendo la ley de posición $s(t) = 4t^3 - 9t^2 + 6t + 2$ (con $s$ en metros y $t$ en segundos). Calcule la velocidad instantánea y la aceleración en el instante $t = 2\\text{ s}$.}
\\PAUTA{1. La velocidad instantánea viene dada por la primera derivada $v(t) = s'(t) = 12t^2 - 18t + 6$.
En $t=2\\text{ s}$: $v(2) = 12(4) - 18(2) + 6 = 48 - 36 + 6 = 18\\text{ m/s}$.

2. La aceleración instantánea es la segunda derivada $a(t) = v'(t) = 24t - 18$.
En $t=2\\text{ s}$: $a(2) = 24(2) - 18 = 48 - 18 = 30\\text{ m/s}^2$.}
\\DIFICULTAD{Básico}
\\CONCEPTOS{Cinemática, Velocidad Instantánea, Aceleración}
\\HABILIDADES{Modelación e Ingeniería, Cálculo Algorítmico}
`;

/**
 * Extracts nested brace parameter { ... } starting at index
 */
function extractBraceParams(str: string, startIndex: number): { params: string[]; nextIndex: number } | null {
  const params: string[] = [];
  let i = startIndex;

  while (i < str.length) {
    while (i < str.length && /\s/.test(str[i])) {
      i++;
    }
    if (i >= str.length || str[i] !== '{') {
      break;
    }

    let depth = 0;
    let content = '';
    i++; // skip '{'
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
      return null;
    }

    params.push(content);
  }

  return { params, nextIndex: i };
}

/**
 * Parses LaTeX tag-based text for Tab 4 exercises
 */
export function parseGuideExerciseSyntaxText(rawText: string): GuideParseResult {
  const problems: ProblemItem[] = [];
  const errors: string[] = [];

  const cleanText = rawText
    .split('\n')
    .filter((line) => !line.trim().startsWith('%'))
    .join('\n');

  let pos = 0;

  while (pos < cleanText.length) {
    const cmdMatch = cleanText.substring(pos).match(/\\(PROBLEMA|EJERCICIO|GUIA|PAUTA|SOLUCION|DIFICULTAD|CONCEPTOS|HABILIDADES)/i);
    if (!cmdMatch || cmdMatch.index === undefined) {
      break;
    }

    const commandName = cmdMatch[1].toUpperCase();
    const commandIndex = pos + cmdMatch.index;
    const afterCmdIndex = commandIndex + cmdMatch[0].length;

    const braceRes = extractBraceParams(cleanText, afterCmdIndex);
    if (!braceRes) {
      errors.push(`Error de llaves desbalanceadas en comando \\${cmdMatch[1]} cerca del carácter ${commandIndex}.`);
      pos = afterCmdIndex;
      continue;
    }

    pos = braceRes.nextIndex;
    const params = braceRes.params;

    if (commandName === 'GUIA') {
      if (params.length < 2) {
        errors.push(`El comando \\GUIA requiere al menos 2 parámetros: {Enunciado}{Pauta}.`);
        continue;
      }
      const problemText = params[0].trim();
      const pautaText = params[1].trim();
      const diffText = (params[2] || '').trim();
      const conceptosText = (params[3] || '').trim();
      const habsText = (params[4] || '').trim();

      let dificultad: 'Básico' | 'Medio' | 'Alto' = 'Medio';
      if (/b[áa]sico/i.test(diffText)) dificultad = 'Básico';
      else if (/alto|avanzado|certamen/i.test(diffText)) dificultad = 'Alto';

      problems.push({
        id: `prob-${Date.now()}-${problems.length + 1}`,
        problem: problemText,
        pauta: pautaText,
        dificultad,
        conceptos: conceptosText ? conceptosText.split(',').map(s => s.trim()).filter(Boolean) : [],
        habilidades: habsText ? habsText.split(',').map(s => s.trim()).filter(Boolean) : []
      });
    } else if (commandName === 'PROBLEMA' || commandName === 'EJERCICIO') {
      const problemText = (params[0] || '').trim();
      let pautaText = '';
      let dificultad: 'Básico' | 'Medio' | 'Alto' = 'Medio';
      let conceptos: string[] = [];
      let habilidades: string[] = [];

      // Look ahead for subsequent tags (\PAUTA, \DIFICULTAD, \CONCEPTOS, \HABILIDADES) before next \PROBLEMA/\EJERCICIO/\GUIA
      let subPos = pos;
      while (subPos < cleanText.length) {
        const subMatch = cleanText.substring(subPos).match(/\\(PROBLEMA|EJERCICIO|GUIA|PAUTA|SOLUCION|DIFICULTAD|CONCEPTOS|HABILIDADES)/i);
        if (!subMatch || subMatch.index === undefined) break;

        const subCmdName = subMatch[1].toUpperCase();
        if (subCmdName === 'PROBLEMA' || subCmdName === 'EJERCICIO' || subCmdName === 'GUIA') {
          // Stop; next problem begins
          break;
        }

        const subCmdIndex = subPos + subMatch.index;
        const subAfterCmd = subCmdIndex + subMatch[0].length;
        const subBrace = extractBraceParams(cleanText, subAfterCmd);
        if (!subBrace) break;

        subPos = subBrace.nextIndex;
        pos = subPos;
        const subParams = subBrace.params;

        if ((subCmdName === 'PAUTA' || subCmdName === 'SOLUCION') && subParams.length > 0) {
          pautaText = subParams[0].trim();
        } else if (subCmdName === 'DIFICULTAD' && subParams.length > 0) {
          const dStr = subParams[0].trim();
          if (/b[áa]sico/i.test(dStr)) dificultad = 'Básico';
          else if (/alto|avanzado|certamen/i.test(dStr)) dificultad = 'Alto';
          else dificultad = 'Medio';
        } else if (subCmdName === 'CONCEPTOS' && subParams.length > 0) {
          conceptos = subParams[0].split(',').map(s => s.trim()).filter(Boolean);
        } else if (subCmdName === 'HABILIDADES' && subParams.length > 0) {
          habilidades = subParams[0].split(',').map(s => s.trim()).filter(Boolean);
        }
      }

      if (!problemText) {
        errors.push(`Ejercicio #${problems.length + 1} omitido porque el enunciado está vacío.`);
        continue;
      }

      problems.push({
        id: `prob-${Date.now()}-${problems.length + 1}`,
        problem: problemText,
        pauta: pautaText || 'Solución paso a paso no especificada.',
        dificultad,
        conceptos,
        habilidades
      });
    }
  }

  return { problems, errors };
}
