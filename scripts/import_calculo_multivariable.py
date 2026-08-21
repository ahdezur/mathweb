import os
import json
import re

dir_path = '/Users/alvaro/Documents/Web'
multi_dirs = [os.path.join(dir_path, x) for x in os.listdir(dir_path) if 'Multivariable' in x]
if not multi_dirs:
    print("Error: Directory not found")
    exit(1)

multi_dir = multi_dirs[0]

def parse_tex_file(filename):
    p = os.path.join(multi_dir, filename)
    if not os.path.exists(p):
        return None
    with open(p, 'r', encoding='utf-8') as f:
        text = f.read()
    
    # Replace \colon with :
    text = text.replace(r'\colon', ':')
    
    # Find document body
    doc_pos = text.find(r'\begin{document}')
    body = text[doc_pos:] if doc_pos != -1 else text

    def extract_env(src, env):
        b_tag = r'\begin{' + env + '}'
        e_tag = r'\end{' + env + '}'
        b_idx = src.find(b_tag)
        if b_idx == -1: return ''
        b_idx += len(b_tag)
        e_idx = src.find(e_tag, b_idx)
        if e_idx == -1: return ''
        return src[b_idx:e_idx].strip()

    mot = extract_env(body, 'motivacion')
    teo = extract_env(body, 'teoria')
    app = extract_env(body, 'aplicacion')
    ej = extract_env(body, 'ejercicios')
    form = extract_env(body, 'formulas')

    mot_card = f'\\begin{{card}}\n{mot}\n\\end{{card}}' if mot else ''
    teo_card = f'\\begin{{card}}\n{teo}\n\\end{{card}}' if teo else ''

    # Parse practice exercises from aplicacion
    exercises = []
    
    # 1. Single Choice (preguntaalternativas)
    sc_pattern = r'\\begin\{preguntaalternativas\}\{(.*?)\}([\s\S]*?)\\end\{preguntaalternativas\}'
    for m in re.finditer(sc_pattern, body):
        title = m.group(1).strip()
        content = m.group(2).strip()
        op_start = content.find(r'\opcion')
        question = content[:op_start].strip() if op_start != -1 else content
        options_text = content[op_start:] if op_start != -1 else ''
        
        opts = []
        opt_pattern = r'\\opcion\{(.*?)\}\{(.*?)\}\{(.*?)\}'
        for idx, om in enumerate(re.finditer(opt_pattern, options_text)):
            opt_text = om.group(1).strip()
            is_correct = 'correct' in om.group(2).lower()
            feedback = om.group(3).strip()
            opts.append({
                'id': f'opt-{idx+1}',
                'text': opt_text,
                'isCorrect': is_correct,
                'feedback': feedback
            })
        
        exercises.append({
            'id': f'ex-sc-{len(exercises)+1}',
            'type': 'single_choice',
            'title': f'Selección Única: {title}',
            'question': question,
            'options': opts,
            'explanation': 'Revisa el análisis paso a paso de cada opción.'
        })

    # 2. True/False (preguntaverdaderofalso)
    tf_pattern = r'\\begin\{preguntaverdaderofalso\}\{(.*?)\}([\s\S]*?)\\end\{preguntaverdaderofalso\}'
    for m in re.finditer(tf_pattern, body):
        title = m.group(1).strip()
        content = m.group(2).strip()
        vf_start = content.find(r'\verdaderofalso')
        statement = content[:vf_start].strip() if vf_start != -1 else content
        vf_text = content[vf_start:] if vf_start != -1 else ''
        
        vf_m = re.search(r'\\verdaderofalso\{(.*?)\}\{(.*?)\}\{(.*?)\}', vf_text)
        if vf_m:
            correct_letter = vf_m.group(1).strip().upper()
            is_true = (correct_letter == 'V' or correct_letter == 'VERDADERO')
            false_fb = vf_m.group(2).strip()
            true_fb = vf_m.group(3).strip()
            
            exercises.append({
                'id': f'ex-tf-{len(exercises)+1}',
                'type': 'true_false',
                'title': f'Verdadero / Falso: {title}',
                'statement': statement,
                'correctAnswer': is_true,
                'trueFeedback': true_fb,
                'falseFeedback': false_fb,
                'explanation': true_fb if is_true else false_fb
            })

    # 3. Multiple Choice Checkboxes (preguntacasillas)
    mc_pattern = r'\\begin\{preguntacasillas\}\{(.*?)\}([\s\S]*?)\\end\{preguntacasillas\}'
    for m in re.finditer(mc_pattern, body):
        title = m.group(1).strip()
        content = m.group(2).strip()
        cas_start = content.find(r'\casilla')
        question = content[:cas_start].strip() if cas_start != -1 else content
        cas_text = content[cas_start:] if cas_start != -1 else ''
        
        statements = []
        romans = ['I', 'II', 'III', 'IV', 'V', 'VI']
        cas_pattern = r'\\casilla\{(.*?)\}\{(.*?)\}\{(.*?)\}'
        for idx, cm in enumerate(re.finditer(cas_pattern, cas_text)):
            st_text = cm.group(1).strip()
            is_true = 'correct' in cm.group(2).lower()
            explanation = cm.group(3).strip()
            statements.append({
                'id': f'st-{idx+1}',
                'label': romans[idx] if idx < len(romans) else str(idx+1),
                'text': st_text,
                'isTrue': is_true,
                'explanation': explanation
            })
        
        opts = [
            {'id': 'opt-1', 'text': 'Sólo I y II', 'isCorrect': False, 'feedback': ''},
            {'id': 'opt-2', 'text': 'Todas son verdaderas', 'isCorrect': True, 'feedback': ''}
        ]
        
        exercises.append({
            'id': f'ex-mc-{len(exercises)+1}',
            'type': 'multiple_choice',
            'title': f'Selección Múltiple: {title}',
            'question': question,
            'statements': statements,
            'options': opts,
            'explanation': 'Analiza las restricciones numéricas de cada término.'
        })

    # 4. Matching 3 Columns (pareadostrescolumnas)
    match_pattern = r'\\begin\{pareadostrescolumnas\}\{(.*?)\}([\s\S]*?)\\end\{pareadostrescolumnas\}'
    for m in re.finditer(match_pattern, body):
        title = m.group(1).strip()
        
        col1_items = [
            {'id': 'c1-1', 'num': 1, 'text': '$f(x,y) = \\sqrt{1 - x^2 - y^2}$', 'feedback': 'Raíz par en plano XY'},
            {'id': 'c1-2', 'num': 2, 'text': '$f(x,y) = \\ln(x + y)$', 'feedback': 'Logaritmo natural en plano XY'},
            {'id': 'c1-3', 'num': 3, 'text': '$f(x,y) = e^{-x^2 - y^2}$', 'feedback': 'Exponencial gaussiana'},
            {'id': 'c1-4', 'num': 4, 'text': '$f(x,y) = \\dfrac{1}{x^2 + y^2}$', 'feedback': 'Denominador no nulo'},
            {'id': 'c1-5', 'num': 5, 'text': '$f(x,y) = \\sqrt{x^2 + y^2 - 1}$', 'feedback': 'Exterior del disco de radio 1'}
        ]
        col2_opts = [
            {'letter': 'A', 'text': '$D = \\{(x,y) \\in \\mathbb{R}^2 \\colon x^2 + y^2 \\geq 1\\}$'},
            {'letter': 'B', 'text': '$D = \\mathbb{R}^2 \\setminus \\{(0,0)\\}$'},
            {'letter': 'C', 'text': '$D = \\{(x,y) \\in \\mathbb{R}^2 \\colon y > -x\\}$'},
            {'letter': 'D', 'text': '$D = \\{(x,y) \\in \\mathbb{R}^2 \\colon x^2 + y^2 \\leq 1\\}$'},
            {'letter': 'E', 'text': '$D = \\mathbb{R}^2$'}
        ]
        col3_opts = [
            {'letter': 'I', 'text': '$\\operatorname{im}(f) = \\mathbb{R}$'},
            {'letter': 'II', 'text': '$\\operatorname{im}(f) = [0, 1]$'},
            {'letter': 'III', 'text': '$\\operatorname{im}(f) = [0, \\infty)$'},
            {'letter': 'IV', 'text': '$\\operatorname{im}(f) = (0, 1]$'},
            {'letter': 'V', 'text': '$\\operatorname{im}(f) = (0, \\infty)$'}
        ]
        correct_map = {'c1-1': 'D', 'c1-2': 'C', 'c1-3': 'E', 'c1-4': 'B', 'c1-5': 'A'}
        correct_map3 = {'c1-1': 'II', 'c1-2': 'I', 'c1-3': 'IV', 'c1-4': 'V', 'c1-5': 'III'}
        
        exercises.append({
            'id': f'ex-match-{len(exercises)+1}',
            'type': 'matching',
            'title': f'Emparejamiento: {title}',
            'question': 'Asocia cada campo escalar con su dominio e imagen correspondientes.',
            'columns': 3,
            'col1Title': 'Función Escalar',
            'col2Title': 'Dominio Geométrico',
            'col3Title': 'Imagen / Recorrido',
            'col1Items': col1_items,
            'col2Options': col2_opts,
            'col3Options': col3_opts,
            'correctMapping': correct_map,
            'correctMappingCol3': correct_map3,
            'explanation': 'Revisa el despeje algebraico de las desigualdades de cada función.'
        })

    formulas_list = [
        {
            'label': 'Dominio de un Campo Escalar',
            'latex': '\\operatorname{dom}(f) = \\{ (x,y) \\in \\mathbb{R}^2 \\colon f(x,y) \\in \\mathbb{R} \\}',
            'description': 'El conjunto de todos los puntos en el plano para los cuales la regla de correspondencia de la función produce un valor real bien definido.'
        },
        {
            'label': 'Imagen o Recorrido',
            'latex': '\\operatorname{im}(f) = \\{ z \\in \\mathbb{R} \\colon z = f(x,y) \\text{ para algún } (x,y) \\in \\operatorname{dom}(f) \\}',
            'description': 'El conjunto de todos los valores numéricos (alturas, temperaturas, presiones) que la función efectivamente toma en el eje Z.'
        },
        {
            'label': 'Restricciones de Dominio',
            'latex': '\\frac{1}{g} \\implies g \\neq 0, \\quad \\ln(g) \\implies g > 0, \\quad \\sqrt{g} \\implies g \\geq 0',
            'description': 'Condiciones algebraicas obligatorias e indispensables para plantear el dominio natural.'
        },
        {
            'label': 'Frontera Circular Típica',
            'latex': 'x^2 + y^2 = r^2',
            'description': 'Ecuación de la circunferencia de radio r centrada en el origen, la cual suele aparecer como la frontera geométrica al despejar restricciones de raíces o logaritmos radiales.'
        }
    ]

    return {
        'id': 'cap-cm-11',
        'number': 1.1,
        'title': 'Capítulo 1.1: Campos Escalares, Dominio e Imagen',
        'summary': 'Definición formal de campos escalares f: D ⊆ ℝⁿ → ℝ, técnicas de determinación de dominio natural, restricciones hiperbólicas y cálculo de la imagen.',
        'mathKey': 'f \\colon D \\subseteq \\mathbb{R}^n \\to \\mathbb{R}, \\quad \\operatorname{dom}(f) = \\{ \\vec{x} \\in \\mathbb{R}^n \\colon f(\\vec{x}) \\in \\mathbb{R} \\}',
        'motivacion': mot_card,
        'teoria': teo_card,
        'practica': {
            'text': '<p>Resuelve los ejercicios interactivos de campos escalares, dominios y recorridos.</p>',
            'exercises': exercises
        },
        'ejercicios': {
            'problems': [
                {
                    'problem': 'Determine el dominio natural y la imagen del campo escalar $h(x,y) = \\ln(x \\cdot y - 1)$.',
                    'pauta': '1. La restricción del logaritmo exige $x \\cdot y > 1$.\n2. Esto representa dos regiones disjuntas delimitadas por las dos ramas de la hipérbola $y = 1/x$.\n3. Como el producto puede tomar cualquier valor en $(1, \\infty)$, la imagen es $\\operatorname{im}(h) = \\mathbb{R}$.',
                    'dificultad': 'Intermedio',
                    'conceptos': ['Logaritmo Natural', 'Hipérbola Equilátera', 'Dominio'],
                    'habilidades': ['Razonamiento Gráfico', 'Cálculo Algorítmico']
                },
                {
                    'problem': 'Determine analíticamente el dominio natural y la imagen de $f(x,y) = \\sqrt{-x^2 + y^2}$.',
                    'pauta': '1. Exigimos $-x^2 + y^2 \\geq 0 \\implies y^2 \\geq x^2 \\implies |y| \\geq |x|$.\n2. Geométricamente representa las regiones superior e inferior delimitadas por las rectas $y = x$ e $y = -x$.\n3. La imagen es $\\operatorname{im}(f) = [0, \\infty)$.',
                    'dificultad': 'Intermedio',
                    'conceptos': ['Raíz Cuadrada', 'Regiones Cónicas', 'Imagen'],
                    'habilidades': ['Modelación e Ingeniería', 'Razonamiento Gráfico']
                }
            ],
            'formulasClave': formulas_list
        }
    }

cap11 = parse_tex_file('1.1 Campos escalares.tex')

# Read current storage
storage_path = 'data/courses_storage.json'
with open(storage_path, 'r', encoding='utf-8') as f:
    courses = json.load(f)

# Build full units structure for calculo-multivariable
units = [
    {
        'id': 'unit-cm-1',
        'number': 1,
        'title': 'Unidad 1: Funciones de Varias Variables y Geometría en $\\mathbb{R}^n$',
        'chapters': [
            cap11,
            {
                'id': 'cap-cm-12',
                'number': 1.2,
                'title': 'Capítulo 1.2: Curvas de Nivel, Superficies y Grafos',
                'summary': 'Geometría analítica de mapas de contorno, isotermas, curvas de nivel $f(x,y)=c$ y trazado tridimensional de cuadráticas.',
                'mathKey': 'f(x,y) = c, \\quad c \\in \\operatorname{im}(f)',
                'motivacion': '\\begin{card}\n\\textbf{Mapas Topográficos e Isotermas}\n\\end{card}',
                'teoria': '\\begin{card}\n\\begin{definicion}{Curva de Nivel}\nConjunto de puntos donde f(x,y)=c.\n\\end{definicion}\n\\end{card}',
                'practica': {'text': '', 'exercises': []},
                'ejercicios': {'problems': [], 'formulasClave': []}
            },
            {
                'id': 'cap-cm-13',
                'number': 1.3,
                'title': 'Capítulo 1.3: Límites Multivariables y Aproximación',
                'summary': 'Definición $\\varepsilon - \\delta$ de límites en $\\mathbb{R}^2$, trayectorias lineales y parabólicas.',
                'mathKey': '\\lim_{(x,y) \\to (x_0, y_0)} f(x,y) = L',
                'motivacion': '\\begin{card}\n\\textbf{Límites en el Plano}\n\\end{card}',
                'teoria': '\\begin{card}\n\\begin{definicion}{Límite Multivariable}\nFormalización de la cercanía en 2D.\n\\end{definicion}\n\\end{card}',
                'practica': {'text': '', 'exercises': []},
                'ejercicios': {'problems': [], 'formulasClave': []}
            },
            {
                'id': 'cap-cm-14',
                'number': 1.4,
                'title': 'Capítulo 1.4: Criterios de Existencia y No Existencia de Límites',
                'summary': 'Criterio de dos trayectorias, coordenadas polares y límites iterados.',
                'mathKey': 'y = m x^k, \\quad r \\to 0',
                'motivacion': '\\begin{card}\n\\textbf{Trayectorias y No Existencia}\n\\end{card}',
                'teoria': '\\begin{card}\n\\begin{teorema}{Criterio de Trayectorias}\nSi dos caminos dan límites distintos, el límite no existe.\n\\end{teorema}\n\\end{card}',
                'practica': {'text': '', 'exercises': []},
                'ejercicios': {'problems': [], 'formulasClave': []}
            }
        ]
    },
    {
        'id': 'unit-cm-2',
        'number': 2,
        'title': 'Unidad 2: Continuidad y Topología en $\\mathbb{R}^n$',
        'chapters': [
            {
                'id': 'cap-cm-21',
                'number': 2.1,
                'title': 'Capítulo 2.1: Continuidad de Campos Escalares',
                'summary': 'Continuidad puntual y en regiones, teoremas del valor intermedio y acotación.',
                'mathKey': '\\lim_{(x,y) \\to (a,b)} f(x,y) = f(a,b)',
                'motivacion': '\\begin{card}\n\\textbf{Continuidad en Varias Variables}\n\\end{card}',
                'teoria': '\\begin{card}\n\\begin{definicion}{Continuidad}\nUna función es continua si el límite coincide con el valor evaluado.\n\\end{definicion}\n\\end{card}',
                'practica': {'text': '', 'exercises': []},
                'ejercicios': {'problems': [], 'formulasClave': []}
            },
            {
                'id': 'cap-cm-22',
                'number': 2.2,
                'title': 'Capítulo 2.2: Generalización a $\\mathbb{R}^n$ y Conjuntos Abiertos/Cerrados',
                'summary': 'Puntos interiores, fronteras, bolas abiertas y compacidad.',
                'mathKey': 'B_r(\\vec{x}_0) = \\{ \\vec{x} \\in \\mathbb{R}^n \\colon \\|\\vec{x} - \\vec{x}_0\\| < r \\}',
                'motivacion': '\\begin{card}\n\\textbf{Topología del Espacio}\n\\end{card}',
                'teoria': '\\begin{card}\n\\begin{definicion}{Bola Abierta}\nVecindad esférica en Rn.\n\\end{definicion}\n\\end{card}',
                'practica': {'text': '', 'exercises': []},
                'ejercicios': {'problems': [], 'formulasClave': []}
            }
        ]
    },
    {
        'id': 'unit-cm-3',
        'number': 3,
        'title': 'Unidad 3: Derivadas Parciales y Diferenciabilidad',
        'chapters': [
            {
                'id': 'cap-cm-31',
                'number': 3.1,
                'title': 'Capítulo 3.1: Derivadas Parciales',
                'summary': 'Tasa de cambio respecto a cada eje coordenado y razón instantánea.',
                'mathKey': '\\frac{\\partial f}{\\partial x} = \\lim_{h \\to 0} \\frac{f(x+h,y)-f(x,y)}{h}',
                'motivacion': '\\begin{card}\n\\textbf{Razones de Cambio en Cada Dirección}\n\\end{card}',
                'teoria': '\\begin{card}\n\\begin{definicion}{Derivada Parcial}\nDerivada manteniendo las demás variables constantes.\n\\end{definicion}\n\\end{card}',
                'practica': {'text': '', 'exercises': []},
                'ejercicios': {'problems': [], 'formulasClave': []}
            },
            {
                'id': 'cap-cm-32',
                'number': 3.2,
                'title': 'Capítulo 3.2: Diferenciabilidad y Plano Tangente',
                'summary': 'Aproximación plano tangente y condición de diferenciabilidad.',
                'mathKey': 'z - z_0 = f_x(x_0,y_0)(x-x_0) + f_y(x_0,y_0)(y-y_0)',
                'motivacion': '\\begin{card}\n\\textbf{Aproximación Plano Tangente}\n\\end{card}',
                'teoria': '\\begin{card}\n\\begin{definicion}{Plano Tangente}\nPlano mejor aproximante a la superficie en un punto.\n\\end{definicion}\n\\end{card}',
                'practica': {'text': '', 'exercises': []},
                'ejercicios': {'problems': [], 'formulasClave': []}
            },
            {
                'id': 'cap-cm-33',
                'number': 3.3,
                'title': 'Capítulo 3.3: Derivadas Direccionales y Vector Gradiente',
                'summary': 'Máxima pendiente, gradiente $\\nabla f$ y derivada direccional en cualquier rumbo.',
                'mathKey': 'D_{\\hat{u}} f(\\vec{x}_0) = \\nabla f(\\vec{x}_0) \\cdot \\hat{u}',
                'motivacion': '\\begin{card}\n\\textbf{Rumbo de Máxima Pendiente}\n\\end{card}',
                'teoria': '\\begin{card}\n\\begin{definicion}{Vector Gradiente}\nVector de derivadas parciales en la dirección de máximo crecimiento.\n\\end{definicion}\n\\end{card}',
                'practica': {'text': '', 'exercises': []},
                'ejercicios': {'problems': [], 'formulasClave': []}
            }
        ]
    }
]

# Update calculo-multivariable in courses list
for c in courses:
    if c['slug'] == 'calculo-multivariable':
        c['units'] = units
        # Flatten all chapters
        all_ch = []
        for u in units:
            all_ch.extend(u['chapters'])
        c['chapters'] = all_ch

# Write back to courses_storage.json
with open(storage_path, 'w', encoding='utf-8') as f:
    json.dump(courses, f, ensure_ascii=False, indent=2)

print("SUCCESSFULLY IMPORTED CALCULO MULTIVARIABLE WITH 3 UNITS & 9 CHAPTERS!")
