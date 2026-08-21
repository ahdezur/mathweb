'use client';

import React from 'react';
import {
  WhiteBaseCard,
  DefinicionCard,
  TheoreticalCard,
  MetodoResolucionCard,
  TrampaCognitivaCard,
  PreguntaGuiaCard,
  EjercicioClaveCard
} from '@/components/classroom/PedagogicalCards';
import { MathFormula, MathText } from '@/components/math/MathFormula';

interface LaTeXPedagogicalParserProps {
  content: string;
}

export function LaTeXPedagogicalParser({ content }: LaTeXPedagogicalParserProps) {
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!content || content.trim().length === 0) {
    return (
      <div className="text-slate-400 italic text-xs py-4 text-center">
        No hay contenido redactado todavía. Utiliza los botones de la barra de herramientas para agregar bloques pedagógicos.
      </div>
    );
  }

  if (!isMounted) {
    return (
      <div className="space-y-6 animate-pulse">
        <WhiteBaseCard>
          <div className="h-20 bg-slate-100 dark:bg-slate-800/50 rounded-xl"></div>
        </WhiteBaseCard>
      </div>
    );
  }

  // Split content by \begin{card} ... \end{card} blocks or parse as cards
  const cardRegex = /\\begin\{card\}([\s\S]*?)\\end\{card\}/g;
  const cards: string[] = [];
  let match;
  let lastIndex = 0;

  while ((match = cardRegex.exec(content)) !== null) {
    // If there is text before this card, collect it as a card
    const preText = content.slice(lastIndex, match.index).trim();
    if (preText.length > 0) {
      cards.push(preText);
    }
    cards.push(match[1].trim());
    lastIndex = cardRegex.lastIndex;
  }

  const remainingText = content.slice(lastIndex).trim();
  if (remainingText.length > 0) {
    cards.push(remainingText);
  }

  // If no explicit \begin{card} was found, process the entire content inside a single WhiteBaseCard or split by double newlines
  const cardList = cards.length > 0 ? cards : [content.trim()];

  return (
    <div suppressHydrationWarning className="space-y-6">
      {cardList.map((cardContent, idx) => (
        <WhiteBaseCard key={idx}>
          {parseCardInnerContent(cardContent)}
        </WhiteBaseCard>
      ))}
    </div>
  );
}

// Function to parse the inner elements of a WhiteBaseCard
function parseCardInnerContent(text: string) {
  const elements: React.ReactNode[] = [];

  // Tokenize by environment regexes or display math
  const envRegex = /(\\begin\{(definicion|teorema|lema|corolario|propiedades|metodo|trampa|pregunta|ejercicio|aplicacion)\}[\s\S]*?\\end\{\2\}|\$\$[\s\S]*?\$\$)/g;

  let lastIndex = 0;
  let match;

  while ((match = envRegex.exec(text)) !== null) {
    const plainSegment = text.slice(lastIndex, match.index).trim();
    if (plainSegment.length > 0) {
      elements.push(
        <div key={`text-${lastIndex}`} suppressHydrationWarning className="text-slate-800 dark:text-slate-200 text-sm md:text-base leading-relaxed">
          <MathText text={plainSegment} />
        </div>
      );
    }

    const matchedStr = match[1];
    elements.push(renderPedagogicalEnvironment(matchedStr, `env-${match.index}`));
    lastIndex = envRegex.lastIndex;
  }

  const remainingSegment = text.slice(lastIndex).trim();
  if (remainingSegment.length > 0) {
    elements.push(
      <div key={`text-${lastIndex}`} suppressHydrationWarning className="text-slate-800 dark:text-slate-200 text-sm md:text-base leading-relaxed">
        <MathText text={remainingSegment} />
      </div>
    );
  }

  return elements;
}

/**
 * Helper to extract the content inside a LaTeX macro like \demostracion{...} or \solucion{...}
 * correctly handling arbitrarily nested curly braces { ... }.
 */
function extractBalancedBraces(text: string, macroName: string): { matchedContent: string | null; remainingText: string } {
  const targetTag = `\\${macroName}{`;
  const startIndex = text.indexOf(targetTag);
  if (startIndex === -1) {
    return { matchedContent: null, remainingText: text };
  }

  let braceCount = 0;
  let contentStart = startIndex + targetTag.length;
  let contentEnd = -1;

  for (let i = contentStart - 1; i < text.length; i++) {
    if (text[i] === '{') {
      braceCount++;
    } else if (text[i] === '}') {
      braceCount--;
      if (braceCount === 0) {
        contentEnd = i;
        break;
      }
    }
  }

  if (contentEnd === -1) {
    return { matchedContent: null, remainingText: text };
  }

  const matchedContent = text.slice(contentStart, contentEnd);
  const remainingText = text.slice(0, startIndex) + text.slice(contentEnd + 1);

  return { matchedContent, remainingText };
}

/**
 * Helper to extract the title from \begin{envName}{Title} ... \end{envName}
 * handling nested curly braces in Title cleanly.
 */
function extractEnvironmentTitle(rawText: string, envName: string): { title: string | null; body: string } {
  const prefix = `\\begin{${envName}}`;
  if (!rawText.startsWith(prefix)) {
    return { title: null, body: rawText };
  }

  let rest = rawText.slice(prefix.length).trim();
  let title: string | null = null;

  // Check if title argument exists: {Title}
  if (rest.startsWith('{')) {
    let braceCount = 0;
    let endIdx = -1;
    for (let i = 0; i < rest.length; i++) {
      if (rest[i] === '{') braceCount++;
      else if (rest[i] === '}') {
        braceCount--;
        if (braceCount === 0) {
          endIdx = i;
          break;
        }
      }
    }

    if (endIdx !== -1) {
      title = rest.slice(1, endIdx);
      rest = rest.slice(endIdx + 1);
    }
  }

  // Remove trailing \end{envName}
  const suffix = `\\end{${envName}}`;
  if (rest.endsWith(suffix)) {
    rest = rest.slice(0, rest.length - suffix.length);
  }

  return { title, body: rest.trim() };
}

// Function to render a specific LaTeX environment string
function renderPedagogicalEnvironment(raw: string, key: string): React.ReactNode {
  // 1. Display Math Formula: $$ ... $$
  if (raw.startsWith('$$') && raw.endsWith('$$')) {
    const latex = raw.slice(2, -2).trim();
    return (
      <div key={key} className="bg-slate-50/90 dark:bg-slate-950/70 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 my-4 text-center shadow-xs flex items-center justify-center overflow-x-auto">
        <MathFormula latex={latex} block />
      </div>
    );
  }

  // Extract environment type
  const envTypeMatch = raw.match(/\\begin\{([a-z]+)\}/);
  if (!envTypeMatch) return null;
  const envType = envTypeMatch[1];

  // 2. Definición: \begin{definicion}{Title} content \end{definicion}
  if (envType === 'definicion') {
    const { title, body } = extractEnvironmentTitle(raw, 'definicion');
    return <DefinicionCard key={key} title={title || 'Definición'} content={body} />;
  }

  // 3. Teorema / Lema / Corolario
  if (envType === 'teorema' || envType === 'lema' || envType === 'corolario') {
    const { title, body } = extractEnvironmentTitle(raw, envType);
    let content = body;
    let demostration: string | undefined = undefined;

    const demoExtraction = extractBalancedBraces(content, 'demostracion');
    if (demoExtraction.matchedContent !== null) {
      demostration = demoExtraction.matchedContent.trim();
      content = demoExtraction.remainingText.trim();
    }

    const defaultTitles: Record<string, string> = {
      teorema: 'Teorema',
      lema: 'Lema',
      corolario: 'Corolario'
    };

    return (
      <TheoreticalCard
        key={key}
        type={envType as 'teorema' | 'lema' | 'corolario'}
        title={title || defaultTitles[envType]}
        content={content}
        demostration={demostration}
      />
    );
  }

  // 4. Propiedades: \begin{propiedades}{Title} \propiedad{P1}{Content1} \demostracionPropiedad{P1}{Demo1} ... \end{propiedades}
  if (envType === 'propiedades') {
    const { title, body } = extractEnvironmentTitle(raw, 'propiedades');
    const propertyList: Array<{ title: string; content: string; demostration?: string }> = [];

    // Parse \propiedad{Title}{Content} and associated \demostracionPropiedad
    let rest = body;
    let generalDemo: string | undefined = undefined;

    // Check if general \demostracion{...} exists
    const genDemoExt = extractBalancedBraces(rest, 'demostracion');
    if (genDemoExt.matchedContent !== null) {
      generalDemo = genDemoExt.matchedContent.trim();
      rest = genDemoExt.remainingText.trim();
    }

    // Extract properties sequentially
    while (rest.includes('\\propiedad{')) {
      const pTitleExt = extractBalancedBraces(rest, 'propiedad');
      if (pTitleExt.matchedContent === null) break;

      const propTitle = pTitleExt.matchedContent.trim();
      rest = pTitleExt.remainingText.trim();

      let propContent = '';
      if (rest.startsWith('{')) {
        let bCount = 0;
        let eIdx = -1;
        for (let i = 0; i < rest.length; i++) {
          if (rest[i] === '{') bCount++;
          else if (rest[i] === '}') {
            bCount--;
            if (bCount === 0) {
              eIdx = i;
              break;
            }
          }
        }
        if (eIdx !== -1) {
          propContent = rest.slice(1, eIdx).trim();
          rest = rest.slice(eIdx + 1).trim();
        }
      }

      // Check for matching \demostracionPropiedad{PropTitle}{DemoText} or \demostracionPropiedad{DemoText}
      let propDemo: string | undefined = undefined;
      if (rest.includes('\\demostracionPropiedad')) {
        const demoExt = extractBalancedBraces(rest, 'demostracionPropiedad');
        if (demoExt.matchedContent !== null) {
          const firstArg = demoExt.matchedContent.trim();
          rest = demoExt.remainingText.trim();

          // Check if there is a second argument {DemoText}
          if (rest.startsWith('{')) {
            let bCount = 0;
            let eIdx = -1;
            for (let i = 0; i < rest.length; i++) {
              if (rest[i] === '{') bCount++;
              else if (rest[i] === '}') {
                bCount--;
                if (bCount === 0) {
                  eIdx = i;
                  break;
                }
              }
            }
            if (eIdx !== -1) {
              propDemo = rest.slice(1, eIdx).trim();
              rest = rest.slice(eIdx + 1).trim();
            }
          } else {
            propDemo = firstArg;
          }
        }
      }

      propertyList.push({
        title: propTitle,
        content: propContent,
        demostration: propDemo
      });
    }

    return (
      <TheoreticalCard
        key={key}
        type="propiedades"
        title={title || 'Propiedades'}
        content={rest}
        demostration={generalDemo}
        properties={propertyList}
      />
    );
  }

function extractBraceContentAt(text: string, startBraceIndex: number): { content: string; endIndex: number } | null {
  if (text[startBraceIndex] !== '{') return null;
  let depth = 1;
  let content = '';
  let i = startBraceIndex + 1;

  while (i < text.length && depth > 0) {
    const char = text[i];
    if (char === '{' && text[i - 1] !== '\\') {
      depth++;
    } else if (char === '}' && text[i - 1] !== '\\') {
      depth--;
    }

    if (depth > 0) {
      content += char;
    }
    i++;
  }

  if (depth !== 0) return null;
  return { content, endIndex: i - 1 };
}

  // 4. Método de Resolución: \begin{metodo}{Title} \problema{...} \paso{N}{Title} body \ejemplo{...} \end{metodo}
  if (envType === 'metodo') {
    const { title, body: initialBody } = extractEnvironmentTitle(raw, 'metodo');
    let body = initialBody;

    let problemaHeader = '';
    const probExtraction = extractBalancedBraces(body, 'problema');
    if (probExtraction.matchedContent !== null) {
      problemaHeader = `Problema: ${probExtraction.matchedContent.trim()}`;
      body = probExtraction.remainingText.trim();
    }

    const steps: { step: number; stepLabel?: string; title: string; description: string }[] = [];
    const exampleParts: string[] = [];

    if (problemaHeader) {
      exampleParts.push(problemaHeader);
    }

    // Parse \paso{Label}{Title} description \ejemplo{...} with balanced brace extraction
    let pos = 0;
    let defaultStepNum = 1;

    while (pos < body.length) {
      const pasoIndex = body.indexOf('\\paso', pos);
      if (pasoIndex === -1) break;

      let curr = pasoIndex + 5;
      while (curr < body.length && /\s/.test(body[curr])) curr++;

      if (curr >= body.length || body[curr] !== '{') {
        pos = pasoIndex + 5;
        continue;
      }

      const arg1 = extractBraceContentAt(body, curr);
      if (!arg1) { pos = pasoIndex + 5; continue; }
      curr = arg1.endIndex + 1;

      while (curr < body.length && /\s/.test(body[curr])) curr++;

      let arg2Content = '';
      if (curr < body.length && body[curr] === '{') {
        const arg2 = extractBraceContentAt(body, curr);
        if (arg2) {
          arg2Content = arg2.content;
          curr = arg2.endIndex + 1;
        }
      }

      const nextPasoIndex = body.indexOf('\\paso', curr);
      const stepBodyRaw = nextPasoIndex !== -1 ? body.substring(curr, nextPasoIndex) : body.substring(curr);

      const rawLabel = arg1.content.trim();
      const parsedNum = parseInt(rawLabel, 10);
      const stepNum = isNaN(parsedNum) ? defaultStepNum : parsedNum;
      const stepLabel = isNaN(parsedNum) ? rawLabel : undefined;
      const stepTitle = arg2Content.trim();

      let stepDesc = stepBodyRaw.trim();
      let stepExample = '';

      const ejExtraction = extractBalancedBraces(stepDesc, 'ejemplo');
      if (ejExtraction.matchedContent !== null) {
        stepExample = ejExtraction.matchedContent.trim();
        stepDesc = ejExtraction.remainingText.trim();
      }

      steps.push({
        step: stepNum,
        stepLabel,
        title: stepTitle,
        description: stepDesc
      });

      if (stepExample) {
        exampleParts.push(`Paso ${stepNum}: ${stepExample}`);
      }

      defaultStepNum++;
      pos = nextPasoIndex !== -1 ? nextPasoIndex : body.length;
    }

    const fullExample = exampleParts.length > (problemaHeader ? 1 : 0) ? exampleParts.join('\n\n') : undefined;

    return (
      <MetodoResolucionCard
        key={key}
        title={title || 'Método de Resolución'}
        steps={steps.length > 0 ? steps : [{ step: 1, title: 'Procedimiento General', description: body }]}
        fullExample={fullExample}
      />
    );
  }

  // 5. Trampa Cognitiva: \begin{trampa}{Title} \error{...} \correct{...} \end{trampa}
  if (envType === 'trampa') {
    const { title, body: initialBody } = extractEnvironmentTitle(raw, 'trampa');
    let body = initialBody;
    let errorDescription = '';
    let correctApproach = '';

    const errExtraction = extractBalancedBraces(body, 'error');
    if (errExtraction.matchedContent !== null) {
      errorDescription = errExtraction.matchedContent.trim();
      body = errExtraction.remainingText.trim();
    }

    const corrExtraction = extractBalancedBraces(body, 'correct');
    if (corrExtraction.matchedContent !== null) {
      correctApproach = corrExtraction.matchedContent.trim();
      body = corrExtraction.remainingText.trim();
    }

    return (
      <TrampaCognitivaCard
        key={key}
        title={title || 'Error Frecuente de Certamen'}
        errorDescription={errorDescription || body}
        correctApproach={correctApproach || 'Aplicar la regla matemática correspondiente.'}
      />
    );
  }

  // 6. Pregunta Guía: \begin{pregunta} question \end{pregunta}
  if (envType === 'pregunta') {
    const { body } = extractEnvironmentTitle(raw, 'pregunta');
    return <PreguntaGuiaCard key={key} question={body} />;
  }

  // 7. Ejercicio Clave: \begin{ejercicio}{Title} problem \solucion{...} \end{ejercicio}
  if (envType === 'ejercicio') {
    const { title, body: initialBody } = extractEnvironmentTitle(raw, 'ejercicio');
    let body = initialBody;
    let solucion = '';

    const solExtraction = extractBalancedBraces(body, 'solucion');
    if (solExtraction.matchedContent !== null) {
      solucion = solExtraction.matchedContent.trim();
      body = solExtraction.remainingText.trim();
    }

    return (
      <EjercicioClaveCard
        key={key}
        title={title || 'Ejercicio Demostrativo'}
        problem={body}
        solucion={solucion || 'Revisar procedimiento en la pauta.'}
      />
    );
  }

  // 8. Aplicación en Ingeniería: \begin{aplicacion}{Title} content \end{aplicacion}
  if (envType === 'aplicacion') {
    const { title, body } = extractEnvironmentTitle(raw, 'aplicacion');
    return (
      <div
        key={key}
        style={{ marginTop: '36px', marginBottom: '36px', padding: '36px 40px' }}
        className="bg-emerald-50/70 dark:bg-emerald-950/30 border-l-4 border-emerald-500 dark:border-emerald-400 rounded-2xl shadow-sm space-y-4"
      >
        <div className="flex items-center gap-3 mb-2">
          <h4 className="font-bold text-base md:text-lg text-emerald-900 dark:text-emerald-200 tracking-tight">
            💡 Aplicación en Ingeniería: <span className="font-medium">{title || 'Caso Práctico'}</span>
          </h4>
        </div>
        <div className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed pl-1">
          <MathText text={body} />
        </div>
      </div>
    );
  }

  return null;
}
