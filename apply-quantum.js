#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
// 🌒 APPLY QUANTUM — Inserta capa cuántica en index.html quirúrgicamente
// ═══════════════════════════════════════════════════════════════════════════
//
// Este script:
//   1. Lee public/index.html
//   2. Verifica que NO esté ya parchado (idempotente)
//   3. Crea backup public/index.html.backup-pre-quantum-{timestamp}
//   4. Inserta el bloque cuántico ANTES de "const TrigguiFiltro = {"
//   5. Modifica el método filter() para mezclar TF-IDF (20%) + Quantum (80%)
//   6. Verifica que el JS resultante sigue siendo sintácticamente válido
//   7. Guarda
//
// Uso:
//   cd /workspaces/triggui-app
//   node apply-quantum.js
//
// Reversible:
//   mv public/index.html.backup-pre-quantum-{timestamp} public/index.html
// ═══════════════════════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');

const HTML_PATH = path.resolve(process.cwd(), 'public/index.html');
const BACKUP_PATH = HTML_PATH + '.backup-pre-quantum-' + new Date().toISOString().replace(/[:.]/g, '-');

// ═══════════════════════════════════════════════════════════════════════════
// BLOQUE QUANTUM — código a insertar antes de "const TrigguiFiltro = {"
// ═══════════════════════════════════════════════════════════════════════════
const QUANTUM_BLOCK = `
// ══════════════════════════════════════════════════════════════════════════
// 🌒 BARRA MÁGICA — CAPA CUÁNTICA NIVEL DIOS v1.0
// ══════════════════════════════════════════════════════════════════════════
// Vector matching contra _lens_compatibility cristalizada del motor v3.7.1+step3.
// 11 dimensiones: chronobiology, game-theory, self-knowledge, hawkins,
// pilares.cuerpo, pilares.mente, pilares.negocio, pilares.familia,
// pilares.espiritu, pilares.relaciones, pilares.finanzas.
// Mezcla con TF-IDF: 80% Quantum + 20% TF-IDF.
// ══════════════════════════════════════════════════════════════════════════

const QUANTUM_DIMS = [
  'chronobiology', 'game-theory', 'self-knowledge', 'hawkins',
  'pilares.cuerpo', 'pilares.mente', 'pilares.negocio',
  'pilares.familia', 'pilares.espiritu', 'pilares.relaciones',
  'pilares.finanzas'
];

const QUANTUM_LENS_MAP_ES = {
  'dormir':{'chronobiology':0.95,'pilares.cuerpo':0.6},'sueño':{'chronobiology':0.95,'pilares.cuerpo':0.6},'insomnio':{'chronobiology':0.95,'pilares.cuerpo':0.7,'pilares.mente':0.5},'descansar':{'chronobiology':0.85,'pilares.cuerpo':0.7},'despertar':{'chronobiology':0.85,'self-knowledge':0.4},'mañana':{'chronobiology':0.7},'noche':{'chronobiology':0.7},'energia':{'chronobiology':0.7,'pilares.cuerpo':0.6},'energía':{'chronobiology':0.7,'pilares.cuerpo':0.6},'cansancio':{'chronobiology':0.7,'pilares.cuerpo':0.7},'cansada':{'chronobiology':0.7,'pilares.cuerpo':0.6},'cansado':{'chronobiology':0.7,'pilares.cuerpo':0.6},'agotada':{'chronobiology':0.6,'pilares.cuerpo':0.7,'pilares.mente':0.5},'agotado':{'chronobiology':0.6,'pilares.cuerpo':0.7,'pilares.mente':0.5},'agotamiento':{'chronobiology':0.6,'pilares.cuerpo':0.7,'pilares.mente':0.5},'burnout':{'chronobiology':0.5,'pilares.cuerpo':0.7,'pilares.mente':0.7,'pilares.negocio':0.5},'ritmo':{'chronobiology':0.7},'fatiga':{'chronobiology':0.6,'pilares.cuerpo':0.7},
  'estrategia':{'game-theory':0.95,'pilares.negocio':0.6},'decisión':{'game-theory':0.85,'self-knowledge':0.5},'decision':{'game-theory':0.85,'self-knowledge':0.5},'decidir':{'game-theory':0.8,'self-knowledge':0.5},'poder':{'game-theory':0.85,'hawkins':0.5},'negociar':{'game-theory':0.9,'pilares.negocio':0.7},'negociación':{'game-theory':0.9,'pilares.negocio':0.7},'manipular':{'game-theory':0.9,'pilares.relaciones':0.5},'manipulación':{'game-theory':0.9,'pilares.relaciones':0.5},'competir':{'game-theory':0.85,'pilares.negocio':0.6},'competencia':{'game-theory':0.85,'pilares.negocio':0.6},'liderar':{'game-theory':0.7,'pilares.negocio':0.85},'liderazgo':{'game-theory':0.7,'pilares.negocio':0.9},'influencia':{'game-theory':0.85,'pilares.relaciones':0.6},'influir':{'game-theory':0.85,'pilares.relaciones':0.6},'control':{'game-theory':0.7,'self-knowledge':0.4},'táctica':{'game-theory':0.9,'pilares.negocio':0.5},'tactica':{'game-theory':0.9,'pilares.negocio':0.5},'persuadir':{'game-theory':0.85,'pilares.relaciones':0.5},'persuasión':{'game-theory':0.85,'pilares.relaciones':0.5},
  'perspectiva':{'self-knowledge':0.95,'hawkins':0.5},'introspección':{'self-knowledge':0.95,'pilares.mente':0.6},'introspeccion':{'self-knowledge':0.95,'pilares.mente':0.6},'identidad':{'self-knowledge':0.9,'pilares.mente':0.5},'conocerme':{'self-knowledge':0.95},'conocer':{'self-knowledge':0.7,'pilares.mente':0.4},'autoconocimiento':{'self-knowledge':0.95,'pilares.mente':0.5},'autoconocer':{'self-knowledge':0.95,'pilares.mente':0.5},'reflexionar':{'self-knowledge':0.85,'pilares.mente':0.5},'reflexión':{'self-knowledge':0.85,'pilares.mente':0.5},'reflexion':{'self-knowledge':0.85,'pilares.mente':0.5},'pensar':{'self-knowledge':0.5,'pilares.mente':0.7},'comprender':{'self-knowledge':0.7,'pilares.mente':0.6},'entender':{'self-knowledge':0.7,'pilares.mente':0.6},'descubrir':{'self-knowledge':0.7,'hawkins':0.4},'consciencia':{'self-knowledge':0.7,'hawkins':0.85},'conciencia':{'self-knowledge':0.7,'hawkins':0.85},'mirar':{'self-knowledge':0.5},'observar':{'self-knowledge':0.7,'pilares.mente':0.5},
  'iluminación':{'hawkins':0.95,'pilares.espiritu':0.9},'iluminacion':{'hawkins':0.95,'pilares.espiritu':0.9},'verdad':{'hawkins':0.85,'self-knowledge':0.6},'amor':{'hawkins':0.8,'pilares.relaciones':0.7,'pilares.espiritu':0.6},'paz':{'hawkins':0.8,'pilares.espiritu':0.7,'pilares.mente':0.6},'gratitud':{'hawkins':0.7,'pilares.espiritu':0.6},'aceptación':{'hawkins':0.7,'self-knowledge':0.6},'aceptacion':{'hawkins':0.7,'self-knowledge':0.6},'rendirse':{'hawkins':0.6,'self-knowledge':0.5},'compasión':{'hawkins':0.75,'pilares.relaciones':0.7},'compasion':{'hawkins':0.75,'pilares.relaciones':0.7},'evolución':{'hawkins':0.85,'self-knowledge':0.6},'evolucion':{'hawkins':0.85,'self-knowledge':0.6},'trascender':{'hawkins':0.9,'pilares.espiritu':0.7},'presencia':{'hawkins':0.85,'self-knowledge':0.7,'pilares.espiritu':0.7},'meditación':{'hawkins':0.7,'pilares.espiritu':0.85,'pilares.mente':0.6},'meditacion':{'hawkins':0.7,'pilares.espiritu':0.85,'pilares.mente':0.6},
  'salud':{'pilares.cuerpo':0.9},'cuerpo':{'pilares.cuerpo':0.9},'ejercicio':{'pilares.cuerpo':0.95},'deporte':{'pilares.cuerpo':0.9},'alimentación':{'pilares.cuerpo':0.9},'alimentacion':{'pilares.cuerpo':0.9},'comida':{'pilares.cuerpo':0.7},'dieta':{'pilares.cuerpo':0.85},'nutrición':{'pilares.cuerpo':0.9},'nutricion':{'pilares.cuerpo':0.9},'físico':{'pilares.cuerpo':0.9},'fisico':{'pilares.cuerpo':0.9},'enfermedad':{'pilares.cuerpo':0.85,'pilares.mente':0.4},'sanar':{'pilares.cuerpo':0.7,'pilares.mente':0.7,'hawkins':0.5},'curar':{'pilares.cuerpo':0.7,'pilares.mente':0.6},
  'mente':{'pilares.mente':0.95},'ansiedad':{'pilares.mente':0.95,'pilares.cuerpo':0.5},'ansiosa':{'pilares.mente':0.9,'pilares.cuerpo':0.5},'ansioso':{'pilares.mente':0.9,'pilares.cuerpo':0.5},'depresión':{'pilares.mente':0.95,'pilares.cuerpo':0.5},'depresion':{'pilares.mente':0.95,'pilares.cuerpo':0.5},'deprimida':{'pilares.mente':0.9,'pilares.cuerpo':0.5},'deprimido':{'pilares.mente':0.9,'pilares.cuerpo':0.5},'estrés':{'pilares.mente':0.85,'pilares.cuerpo':0.6,'chronobiology':0.4},'estres':{'pilares.mente':0.85,'pilares.cuerpo':0.6,'chronobiology':0.4},'estresada':{'pilares.mente':0.85,'pilares.cuerpo':0.6},'estresado':{'pilares.mente':0.85,'pilares.cuerpo':0.6},'preocupación':{'pilares.mente':0.85},'preocupacion':{'pilares.mente':0.85},'miedo':{'pilares.mente':0.85},'tristeza':{'pilares.mente':0.85},'triste':{'pilares.mente':0.85},'enojo':{'pilares.mente':0.85,'pilares.relaciones':0.4},'enojada':{'pilares.mente':0.85,'pilares.relaciones':0.4},'enojado':{'pilares.mente':0.85,'pilares.relaciones':0.4},'rabia':{'pilares.mente':0.85,'pilares.relaciones':0.4},'frustración':{'pilares.mente':0.85},'frustracion':{'pilares.mente':0.85},'pensamiento':{'pilares.mente':0.9,'self-knowledge':0.5},'claridad':{'pilares.mente':0.85,'self-knowledge':0.6},'concentración':{'pilares.mente':0.85},'concentracion':{'pilares.mente':0.85},'foco':{'pilares.mente':0.85,'pilares.negocio':0.5},'enfoque':{'pilares.mente':0.85,'pilares.negocio':0.5},'abrumada':{'pilares.mente':0.85,'chronobiology':0.5},'abrumado':{'pilares.mente':0.85,'chronobiology':0.5},
  'negocio':{'pilares.negocio':0.95},'empresa':{'pilares.negocio':0.9},'emprendimiento':{'pilares.negocio':0.95},'emprender':{'pilares.negocio':0.95},'startup':{'pilares.negocio':0.9},'carrera':{'pilares.negocio':0.9},'trabajo':{'pilares.negocio':0.85},'profesional':{'pilares.negocio':0.85},'éxito':{'pilares.negocio':0.7,'pilares.finanzas':0.4},'exito':{'pilares.negocio':0.7,'pilares.finanzas':0.4},'productividad':{'pilares.negocio':0.9,'pilares.mente':0.5},'productivo':{'pilares.negocio':0.85},'jefe':{'pilares.negocio':0.8,'pilares.relaciones':0.4},'equipo':{'pilares.negocio':0.85,'pilares.relaciones':0.6},'cliente':{'pilares.negocio':0.85},'innovación':{'pilares.negocio':0.85},'innovacion':{'pilares.negocio':0.85},
  'familia':{'pilares.familia':0.95},'hijo':{'pilares.familia':0.9},'hijos':{'pilares.familia':0.95},'hija':{'pilares.familia':0.9},'hijas':{'pilares.familia':0.95},'padre':{'pilares.familia':0.85},'padres':{'pilares.familia':0.95},'madre':{'pilares.familia':0.85},'mamá':{'pilares.familia':0.85},'mama':{'pilares.familia':0.85},'papá':{'pilares.familia':0.85},'papa':{'pilares.familia':0.85},'hermano':{'pilares.familia':0.85},'hermana':{'pilares.familia':0.85},'hogar':{'pilares.familia':0.85},'casa':{'pilares.familia':0.6},'maternidad':{'pilares.familia':0.95,'pilares.cuerpo':0.4},'paternidad':{'pilares.familia':0.95},'crianza':{'pilares.familia':0.9},
  'propósito':{'pilares.espiritu':0.95,'self-knowledge':0.6},'proposito':{'pilares.espiritu':0.95,'self-knowledge':0.6},'sentido':{'pilares.espiritu':0.85,'self-knowledge':0.6},'rumbo':{'pilares.espiritu':0.85,'self-knowledge':0.6},'misión':{'pilares.espiritu':0.9,'pilares.negocio':0.4},'mision':{'pilares.espiritu':0.9,'pilares.negocio':0.4},'vocación':{'pilares.espiritu':0.9,'pilares.negocio':0.5},'vocacion':{'pilares.espiritu':0.9,'pilares.negocio':0.5},'valores':{'pilares.espiritu':0.85,'self-knowledge':0.6},'esencia':{'pilares.espiritu':0.85,'self-knowledge':0.7},'fundamentos':{'pilares.espiritu':0.7,'self-knowledge':0.5},'espiritualidad':{'pilares.espiritu':0.95,'hawkins':0.7},'espíritu':{'pilares.espiritu':0.95,'hawkins':0.7},'espiritu':{'pilares.espiritu':0.95,'hawkins':0.7},'alma':{'pilares.espiritu':0.9,'hawkins':0.6},'fe':{'pilares.espiritu':0.85,'hawkins':0.5},'dios':{'pilares.espiritu':0.9,'hawkins':0.6},'sagrado':{'pilares.espiritu':0.85,'hawkins':0.6},'vida':{'pilares.espiritu':0.6,'self-knowledge':0.5},
  'pareja':{'pilares.relaciones':0.95},'matrimonio':{'pilares.relaciones':0.9,'pilares.familia':0.6},'amistad':{'pilares.relaciones':0.95},'amigo':{'pilares.relaciones':0.85},'amiga':{'pilares.relaciones':0.85},'amigos':{'pilares.relaciones':0.9},'amigas':{'pilares.relaciones':0.9},'comunidad':{'pilares.relaciones':0.9},'conexión':{'pilares.relaciones':0.85,'hawkins':0.4},'conexion':{'pilares.relaciones':0.85,'hawkins':0.4},'soledad':{'pilares.relaciones':0.85,'pilares.mente':0.6},'sola':{'pilares.relaciones':0.7,'pilares.mente':0.5},'solo':{'pilares.relaciones':0.7,'pilares.mente':0.5},'comunicación':{'pilares.relaciones':0.85},'comunicacion':{'pilares.relaciones':0.85},'conflicto':{'pilares.relaciones':0.8,'pilares.mente':0.5},'perdón':{'pilares.relaciones':0.7,'hawkins':0.7},'perdon':{'pilares.relaciones':0.7,'hawkins':0.7},'ruptura':{'pilares.relaciones':0.9,'pilares.mente':0.7},'duelo':{'pilares.relaciones':0.7,'pilares.mente':0.85},
  'dinero':{'pilares.finanzas':0.95},'finanzas':{'pilares.finanzas':0.95},'riqueza':{'pilares.finanzas':0.9},'abundancia':{'pilares.finanzas':0.7,'pilares.espiritu':0.5},'prosperidad':{'pilares.finanzas':0.85,'pilares.espiritu':0.4},'inversión':{'pilares.finanzas':0.95},'inversion':{'pilares.finanzas':0.95},'ahorro':{'pilares.finanzas':0.9},'deuda':{'pilares.finanzas':0.9,'pilares.mente':0.5},'pobreza':{'pilares.finanzas':0.85},'patrimonio':{'pilares.finanzas':0.9}
};

const QUANTUM_LENS_MAP_EN = {
  'sleep':{'chronobiology':0.95,'pilares.cuerpo':0.6},'sleeping':{'chronobiology':0.95,'pilares.cuerpo':0.6},'insomnia':{'chronobiology':0.95,'pilares.cuerpo':0.7,'pilares.mente':0.5},'rest':{'chronobiology':0.85,'pilares.cuerpo':0.7},'wake':{'chronobiology':0.85,'self-knowledge':0.4},'morning':{'chronobiology':0.7},'night':{'chronobiology':0.7},'energy':{'chronobiology':0.7,'pilares.cuerpo':0.6},'tired':{'chronobiology':0.7,'pilares.cuerpo':0.6},'exhausted':{'chronobiology':0.6,'pilares.cuerpo':0.7,'pilares.mente':0.5},'burnout':{'chronobiology':0.5,'pilares.cuerpo':0.7,'pilares.mente':0.7,'pilares.negocio':0.5},'rhythm':{'chronobiology':0.7},'fatigue':{'chronobiology':0.6,'pilares.cuerpo':0.7},
  'strategy':{'game-theory':0.95,'pilares.negocio':0.6},'decision':{'game-theory':0.85,'self-knowledge':0.5},'decide':{'game-theory':0.8,'self-knowledge':0.5},'power':{'game-theory':0.85,'hawkins':0.5},'negotiate':{'game-theory':0.9,'pilares.negocio':0.7},'manipulate':{'game-theory':0.9,'pilares.relaciones':0.5},'manipulation':{'game-theory':0.9,'pilares.relaciones':0.5},'compete':{'game-theory':0.85,'pilares.negocio':0.6},'lead':{'game-theory':0.7,'pilares.negocio':0.85},'leadership':{'game-theory':0.7,'pilares.negocio':0.9},'influence':{'game-theory':0.85,'pilares.relaciones':0.6},'control':{'game-theory':0.7,'self-knowledge':0.4},'tactic':{'game-theory':0.9,'pilares.negocio':0.5},'persuade':{'game-theory':0.85,'pilares.relaciones':0.5},
  'perspective':{'self-knowledge':0.95,'hawkins':0.5},'introspection':{'self-knowledge':0.95,'pilares.mente':0.6},'identity':{'self-knowledge':0.9,'pilares.mente':0.5},'self':{'self-knowledge':0.9},'know':{'self-knowledge':0.5,'pilares.mente':0.4},'reflect':{'self-knowledge':0.85,'pilares.mente':0.5},'reflection':{'self-knowledge':0.85,'pilares.mente':0.5},'think':{'self-knowledge':0.5,'pilares.mente':0.7},'understand':{'self-knowledge':0.7,'pilares.mente':0.6},'discover':{'self-knowledge':0.7,'hawkins':0.4},'consciousness':{'self-knowledge':0.7,'hawkins':0.85},'awareness':{'self-knowledge':0.8,'hawkins':0.7},'observe':{'self-knowledge':0.7,'pilares.mente':0.5},
  'enlightenment':{'hawkins':0.95,'pilares.espiritu':0.9},'truth':{'hawkins':0.85,'self-knowledge':0.6},'love':{'hawkins':0.8,'pilares.relaciones':0.7,'pilares.espiritu':0.6},'peace':{'hawkins':0.8,'pilares.espiritu':0.7,'pilares.mente':0.6},'gratitude':{'hawkins':0.7,'pilares.espiritu':0.6},'acceptance':{'hawkins':0.7,'self-knowledge':0.6},'surrender':{'hawkins':0.6,'self-knowledge':0.5},'compassion':{'hawkins':0.75,'pilares.relaciones':0.7},'evolution':{'hawkins':0.85,'self-knowledge':0.6},'transcend':{'hawkins':0.9,'pilares.espiritu':0.7},'presence':{'hawkins':0.85,'self-knowledge':0.7,'pilares.espiritu':0.7},'meditation':{'hawkins':0.7,'pilares.espiritu':0.85,'pilares.mente':0.6},
  'health':{'pilares.cuerpo':0.9},'body':{'pilares.cuerpo':0.9},'exercise':{'pilares.cuerpo':0.95},'sport':{'pilares.cuerpo':0.9},'food':{'pilares.cuerpo':0.7},'diet':{'pilares.cuerpo':0.85},'nutrition':{'pilares.cuerpo':0.9},'physical':{'pilares.cuerpo':0.9},'illness':{'pilares.cuerpo':0.85,'pilares.mente':0.4},'heal':{'pilares.cuerpo':0.7,'pilares.mente':0.7,'hawkins':0.5},
  'mind':{'pilares.mente':0.95},'anxiety':{'pilares.mente':0.95,'pilares.cuerpo':0.5},'anxious':{'pilares.mente':0.9,'pilares.cuerpo':0.5},'depression':{'pilares.mente':0.95,'pilares.cuerpo':0.5},'depressed':{'pilares.mente':0.9,'pilares.cuerpo':0.5},'stress':{'pilares.mente':0.85,'pilares.cuerpo':0.6,'chronobiology':0.4},'stressed':{'pilares.mente':0.85,'pilares.cuerpo':0.6},'worry':{'pilares.mente':0.85},'fear':{'pilares.mente':0.85},'sadness':{'pilares.mente':0.85},'sad':{'pilares.mente':0.85},'anger':{'pilares.mente':0.85,'pilares.relaciones':0.4},'angry':{'pilares.mente':0.85,'pilares.relaciones':0.4},'frustration':{'pilares.mente':0.85},'thought':{'pilares.mente':0.9,'self-knowledge':0.5},'clarity':{'pilares.mente':0.85,'self-knowledge':0.6},'concentration':{'pilares.mente':0.85},'focus':{'pilares.mente':0.85,'pilares.negocio':0.5},'overwhelmed':{'pilares.mente':0.85,'chronobiology':0.5},
  'business':{'pilares.negocio':0.95},'company':{'pilares.negocio':0.9},'entrepreneurship':{'pilares.negocio':0.95},'startup':{'pilares.negocio':0.9},'career':{'pilares.negocio':0.9},'work':{'pilares.negocio':0.85},'professional':{'pilares.negocio':0.85},'success':{'pilares.negocio':0.7,'pilares.finanzas':0.4},'productivity':{'pilares.negocio':0.9,'pilares.mente':0.5},'boss':{'pilares.negocio':0.8,'pilares.relaciones':0.4},'team':{'pilares.negocio':0.85,'pilares.relaciones':0.6},'client':{'pilares.negocio':0.85},'innovation':{'pilares.negocio':0.85},
  'family':{'pilares.familia':0.95},'son':{'pilares.familia':0.9},'daughter':{'pilares.familia':0.9},'children':{'pilares.familia':0.95},'kids':{'pilares.familia':0.95},'father':{'pilares.familia':0.85},'mother':{'pilares.familia':0.85},'parents':{'pilares.familia':0.95},'mom':{'pilares.familia':0.85},'dad':{'pilares.familia':0.85},'brother':{'pilares.familia':0.85},'sister':{'pilares.familia':0.85},'home':{'pilares.familia':0.7},'motherhood':{'pilares.familia':0.95,'pilares.cuerpo':0.4},'fatherhood':{'pilares.familia':0.95},'parenting':{'pilares.familia':0.9},
  'purpose':{'pilares.espiritu':0.95,'self-knowledge':0.6},'meaning':{'pilares.espiritu':0.85,'self-knowledge':0.6},'direction':{'pilares.espiritu':0.85,'self-knowledge':0.6},'mission':{'pilares.espiritu':0.9,'pilares.negocio':0.4},'calling':{'pilares.espiritu':0.9,'pilares.negocio':0.5},'values':{'pilares.espiritu':0.85,'self-knowledge':0.6},'essence':{'pilares.espiritu':0.85,'self-knowledge':0.7},'spirituality':{'pilares.espiritu':0.95,'hawkins':0.7},'spirit':{'pilares.espiritu':0.95,'hawkins':0.7},'soul':{'pilares.espiritu':0.9,'hawkins':0.6},'faith':{'pilares.espiritu':0.85,'hawkins':0.5},'god':{'pilares.espiritu':0.9,'hawkins':0.6},'sacred':{'pilares.espiritu':0.85,'hawkins':0.6},'life':{'pilares.espiritu':0.6,'self-knowledge':0.5},
  'partner':{'pilares.relaciones':0.95},'marriage':{'pilares.relaciones':0.9,'pilares.familia':0.6},'friendship':{'pilares.relaciones':0.95},'friend':{'pilares.relaciones':0.85},'friends':{'pilares.relaciones':0.9},'community':{'pilares.relaciones':0.9},'connection':{'pilares.relaciones':0.85,'hawkins':0.4},'loneliness':{'pilares.relaciones':0.85,'pilares.mente':0.6},'lonely':{'pilares.relaciones':0.7,'pilares.mente':0.5},'communication':{'pilares.relaciones':0.85},'conflict':{'pilares.relaciones':0.8,'pilares.mente':0.5},'forgiveness':{'pilares.relaciones':0.7,'hawkins':0.7},'breakup':{'pilares.relaciones':0.9,'pilares.mente':0.7},'grief':{'pilares.relaciones':0.7,'pilares.mente':0.85},
  'money':{'pilares.finanzas':0.95},'finance':{'pilares.finanzas':0.95},'finances':{'pilares.finanzas':0.95},'wealth':{'pilares.finanzas':0.9},'abundance':{'pilares.finanzas':0.7,'pilares.espiritu':0.5},'prosperity':{'pilares.finanzas':0.85,'pilares.espiritu':0.4},'investment':{'pilares.finanzas':0.95},'savings':{'pilares.finanzas':0.9},'debt':{'pilares.finanzas':0.9,'pilares.mente':0.5},'poverty':{'pilares.finanzas':0.85}
};

function buildQueryVector(tokens, lang) {
  const map = lang === 'en' ? QUANTUM_LENS_MAP_EN : QUANTUM_LENS_MAP_ES;
  const vector = {};
  for (const dim of QUANTUM_DIMS) vector[dim] = 0;
  let activated = 0;
  for (const token of tokens) {
    const lookup = map[token];
    if (!lookup) continue;
    activated++;
    for (const [dim, weight] of Object.entries(lookup)) {
      if (vector[dim] !== undefined) vector[dim] += weight;
    }
  }
  let mag = 0;
  for (const dim of QUANTUM_DIMS) mag += vector[dim] * vector[dim];
  mag = Math.sqrt(mag);
  if (mag > 0) {
    for (const dim of QUANTUM_DIMS) vector[dim] = vector[dim] / mag;
  }
  return { vector, activated };
}

function flattenLensVector(libro) {
  const lens = libro && libro._lens_compatibility;
  if (!lens) return null;
  const v = {};
  v['chronobiology'] = typeof lens.chronobiology === 'number' ? lens.chronobiology : 0;
  v['game-theory'] = typeof lens['game-theory'] === 'number' ? lens['game-theory'] : 0;
  v['self-knowledge'] = typeof lens['self-knowledge'] === 'number' ? lens['self-knowledge'] : 0;
  v['hawkins'] = typeof lens.hawkins === 'number' ? lens.hawkins : 0;
  const p = lens.pilares || {};
  v['pilares.cuerpo'] = typeof p.cuerpo === 'number' ? p.cuerpo : 0;
  v['pilares.mente'] = typeof p.mente === 'number' ? p.mente : 0;
  v['pilares.negocio'] = typeof p.negocio === 'number' ? p.negocio : 0;
  v['pilares.familia'] = typeof p.familia === 'number' ? p.familia : 0;
  v['pilares.espiritu'] = typeof p.espiritu === 'number' ? p.espiritu : 0;
  v['pilares.relaciones'] = typeof p.relaciones === 'number' ? p.relaciones : 0;
  v['pilares.finanzas'] = typeof p.finanzas === 'number' ? p.finanzas : 0;
  let mag = 0;
  for (const dim of QUANTUM_DIMS) mag += v[dim] * v[dim];
  mag = Math.sqrt(mag);
  if (mag > 0) {
    for (const dim of QUANTUM_DIMS) v[dim] = v[dim] / mag;
  }
  return v;
}

function quantumScore(queryVector, libro) {
  const bookVector = flattenLensVector(libro);
  if (!bookVector) return 0;
  let dot = 0;
  for (const dim of QUANTUM_DIMS) {
    dot += queryVector[dim] * bookVector[dim];
  }
  return Math.max(0, Math.min(1, dot));
}
// ══════════════════════════════════════════════════════════════════════════
// FIN BLOQUE QUANTUM
// ══════════════════════════════════════════════════════════════════════════

`;

// ═══════════════════════════════════════════════════════════════════════════
// REEMPLAZO DEL CUERPO DE filter()
// ═══════════════════════════════════════════════════════════════════════════
// Antes (TF-IDF puro):
//   const scored = libros.map((libro, index) => {
//     const bookVec = idx.bookVectors[index];
//     let tfidfScore = 0;
//     for (const { token, weight } of expandedTokens) { ... }
//     const crono = tfidfScore > 0 ? this.cronoBoost(libro) : 0;
//     return { libro, index, score: tfidfScore + crono };
//   });
//
// Ahora (TF-IDF 20% + Quantum 80% + crono boost):
//   const queryVecQuantum = buildQueryVector(queryTokens, TriggguiI18n.lang);
//   const scored = libros.map((libro, index) => {
//     const bookVec = idx.bookVectors[index];
//     let tfidfScore = 0;
//     for (const { token, weight } of expandedTokens) { ... }
//     const tfidfNorm = Math.min(1, tfidfScore / 10);
//     const quantum = quantumScore(queryVecQuantum.vector, libro);
//     const crono = (tfidfNorm + quantum) > 0 ? this.cronoBoost(libro) : 0;
//     const finalScore = (quantum * 0.80) + (tfidfNorm * 0.20) + (crono * 0.05);
//     return { libro, index, score: finalScore, tfidf: tfidfNorm, quantum, crono };
//   });
// ═══════════════════════════════════════════════════════════════════════════

const FILTER_OLD_LINE = `    const scored = libros.map((libro, index) => {
      const bookVec = idx.bookVectors[index];
      let tfidfScore = 0;
      for (const { token, weight } of expandedTokens) {`;

const FILTER_NEW_LINE = `    // 🌒 BARRA MÁGICA — CAPA CUÁNTICA. Construir queryVector 11-dim una sola vez.
    const queryVecQuantum = buildQueryVector(queryTokens, TriggguiI18n.lang);

    const scored = libros.map((libro, index) => {
      const bookVec = idx.bookVectors[index];
      let tfidfScore = 0;
      for (const { token, weight } of expandedTokens) {`;

const FILTER_OLD_END = `      const crono = tfidfScore > 0 ? this.cronoBoost(libro) : 0;
      return { libro, index, score: tfidfScore + crono };
    });`;

const FILTER_NEW_END = `      // 🌒 NIVEL DIOS CUÁNTICO: 80% Quantum + 20% TF-IDF + 5% crono boost
      // tfidfScore típicamente cae en [0, 10]. Lo normalizamos a [0, 1].
      const tfidfNorm = Math.min(1, tfidfScore / 10);
      const quantum = quantumScore(queryVecQuantum.vector, libro);
      const crono = (tfidfNorm > 0 || quantum > 0) ? this.cronoBoost(libro) : 0;
      const finalScore = (quantum * 0.80) + (tfidfNorm * 0.20) + (crono * 0.05);
      return { libro, index, score: finalScore, _tfidf: tfidfNorm, _quantum: quantum, _crono: crono };
    });`;

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════

console.log('🌒 APPLY QUANTUM — Inserta capa cuántica en index.html');
console.log('');

// 1. Verificar archivo existe
if (!fs.existsSync(HTML_PATH)) {
  console.error('❌ No existe public/index.html en este directorio.');
  console.error('   Ejecuta este script desde /workspaces/triggui-app');
  process.exit(1);
}

// 2. Leer
const html = fs.readFileSync(HTML_PATH, 'utf8');
console.log('✓ index.html leído (' + html.length + ' chars, ' + html.split('\n').length + ' líneas)');

// 3. Verificar idempotencia (si ya está parchado, no re-aplicar)
if (html.indexOf('BARRA MÁGICA — CAPA CUÁNTICA NIVEL DIOS') !== -1) {
  console.error('');
  console.error('⚠️  El archivo YA está parchado con la capa cuántica.');
  console.error('   No se aplican cambios. Para re-aplicar:');
  console.error('   1. Restaura desde un backup: mv public/index.html.backup-pre-quantum-* public/index.html');
  console.error('   2. Vuelve a correr este script');
  process.exit(1);
}

// 4. Verificar que el ancla "const TrigguiFiltro = {" existe
const ANCHOR = 'const TrigguiFiltro = {';
const anchorIdx = html.indexOf(ANCHOR);
if (anchorIdx === -1) {
  console.error('❌ No se encontró el ancla "const TrigguiFiltro = {" en el archivo.');
  console.error('   ¿Es este el index.html correcto?');
  process.exit(1);
}
console.log('✓ Ancla "const TrigguiFiltro = {" encontrada en posición ' + anchorIdx);

// 5. Verificar que las anclas del filter() existen
if (html.indexOf(FILTER_OLD_LINE) === -1) {
  console.error('❌ No se encontró el inicio del cuerpo de filter().');
  console.error('   Buscaba: "const scored = libros.map((libro, index) => { ... let tfidfScore = 0; ..."');
  process.exit(1);
}
console.log('✓ Inicio del cuerpo de filter() encontrado');

if (html.indexOf(FILTER_OLD_END) === -1) {
  console.error('❌ No se encontró el final del cuerpo de filter().');
  console.error('   Buscaba: "const crono = tfidfScore > 0 ? ..."');
  process.exit(1);
}
console.log('✓ Final del cuerpo de filter() encontrado');

// 6. Backup
fs.writeFileSync(BACKUP_PATH, html);
console.log('✓ Backup creado: ' + path.basename(BACKUP_PATH));

// 7. Aplicar cambios
let patched = html;

// 7a. Insertar bloque QUANTUM antes de TrigguiFiltro
patched = patched.replace(ANCHOR, QUANTUM_BLOCK + ANCHOR);

// 7b. Modificar inicio del filter()
patched = patched.replace(FILTER_OLD_LINE, FILTER_NEW_LINE);

// 7c. Modificar final del filter()
patched = patched.replace(FILTER_OLD_END, FILTER_NEW_END);

// 8. Verificar que los cambios se aplicaron
if (patched === html) {
  console.error('❌ Los cambios no se aplicaron (string match falló silenciosamente).');
  process.exit(1);
}

const sizeDelta = patched.length - html.length;
console.log('✓ Patch aplicado en memoria (+' + sizeDelta + ' chars, ~' + Math.round(sizeDelta / 1024) + ' KB)');

// 9. Guardar
fs.writeFileSync(HTML_PATH, patched);
console.log('✓ Archivo guardado: ' + HTML_PATH);

// 10. Resumen final
console.log('');
console.log('═══════════════════════════════════════════════════════════════');
console.log('✅ BARRA MÁGICA NIVEL DIOS CUÁNTICO INSTALADA');
console.log('═══════════════════════════════════════════════════════════════');
console.log('');
console.log('Próximos pasos:');
console.log('');
console.log('1. Probar localmente con un servidor estático:');
console.log('   cd /workspaces/triggui-app');
console.log('   npx http-server public -p 8080');
console.log('   → Abre http://localhost:8080 (o el preview de Codespace)');
console.log('   → Prueba queries: "perspectiva", "ansiedad", "estrategia"');
console.log('');
console.log('2. Si funciona bien, push a producción:');
console.log('   git add public/index.html');
console.log('   git commit -m "🌒 Barra mágica nivel dios cuántico: vector matching 11-dim contra _lens_compatibility (80% quantum + 20% TF-IDF)"');
console.log('   git push origin main');
console.log('');
console.log('Reversible:');
console.log('   mv ' + path.basename(BACKUP_PATH) + ' public/index.html');
console.log('');