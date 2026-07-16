/**
 * seed-demo-coruxo.mjs
 * Ejecutar: node seed-demo-coruxo.mjs
 * Genera 14 jugadores demo (inventados) + 1 informe cada uno, para el
 * cliente "CORUXO F.C." (tabla clients). Usa la service role key para
 * saltarse RLS y asigna owner_club_id explícitamente.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const envRaw = readFileSync(join(__dir, '.env'), 'utf-8');
const env = Object.fromEntries(
  envRaw.split('\n')
    .filter(l => l.includes('=') && !l.trim().startsWith('#'))
    .map(l => {
      const i = l.indexOf('=');
      const key = l.slice(0, i).trim();
      const val = l.slice(i + 1).trim().replace(/^["']|["']$/g, '');
      return [key, val];
    })
);

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SERVICE_KEY = env.VITE_SUPABASE_SERVICE_KEY;
const TARGET_CLIENT_NAME = 'CORUXO F.C.';

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌  Falta VITE_SUPABASE_URL o VITE_SUPABASE_SERVICE_KEY en el .env');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SERVICE_KEY);

const r = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const rr = (vals) => vals[Math.floor(Math.random() * vals.length)];

function ratings(base, spread = 1) {
  const clamp = (v) => Math.max(1, Math.min(5, v));
  const keys = [
    'rating_velo_despl','rating_acel','rating_fuerza','rating_resis','rating_agil','rating_coord',
    'rating_velo_reac','rating_poten','rating_recup_fatiga','rating_tenden_lesion','rating_pase_corto',
    'rating_pase_largo','rating_ctrl_balon','rating_tiro','rating_regate','rating_conduc',
    'rating_superf_cont','rating_despeje','rating_entrada','rating_pierna_menos','rating_posic',
    'rating_cobertura','rating_repliegue','rating_ayuda_def','rating_marcajes','rating_dom_espacios',
    'rating_vigilancias','rating_apoyos_off','rating_desmarques','rating_temporiz','rating_liderazgo',
    'rating_caracter','rating_competitiv','rating_companerismo','rating_mentalidad','rating_agresividad',
    'rating_polivalencia','rating_inteligencia','rating_comunicacion','rating_personalidad',
  ];
  const out = {};
  keys.forEach(k => { out[k] = clamp(base + r(-spread, spread)); });
  return out;
}

const PLAYERS_TEMPLATE = [
  { first_name: 'Diego', last_name: 'Martínez', full_name: 'Diego Martínez', birth_date: '2011-03-14', calculated_age: 14, nationality: 'Española', main_position: 'DC', secondary_positions: ['DI'], dominant_foot: 'RIGHT', approximate_height: 162, approximate_weight: 52, club_name: 'SD Portonovo', league: 'Liga Galega Infantil', category: 'Infantil', status: 'INTERESTING', interest_level: 3, global_rating: 3, potential_rating: 4, strengths: ['Velocidad', 'Regate', 'Desequilibrio en 1vs1'], weaknesses: ['Pierna izquierda', 'Trabajo defensivo'], why_interested: 'Destaca en su categoría por velocidad y capacidad de desequilibrio', main_strength: 'Desborde por banda con cambio de ritmo', main_doubt: 'Rendimiento defensivo bajo presión', differential_talent: 'Cambio de ritmo y aceleración a la espalda de los defensas', player_type: 'Extremo dinámico con proyección ofensiva', ideal_role: 'Extremo en 4-3-3 o carrilero en 4-2-3-1', technical_profile: 'Buen primer control, regate funcional, pase corto correcto', tactical_profile: 'Entiende los espacios en ataque, poco riguroso en repliegue', physical_profile: 'Muy rápido para su categoría, delgado, pendiente de ganar masa muscular', mental_profile: 'Competitivo, puede frustrarse ante la adversidad', ratingBase: 3, ratingSpread: 1 },
  { first_name: 'Pablo', last_name: 'Rodríguez', full_name: 'Pablo Rodríguez', birth_date: '2010-07-22', calculated_age: 15, nationality: 'Española', main_position: 'MCD', secondary_positions: ['MC'], dominant_foot: 'RIGHT', approximate_height: 170, approximate_weight: 62, club_name: 'Coruxo FC', league: 'Liga Galega Cadete', category: 'Cadete', status: 'TRACKING', interest_level: 4, global_rating: 4, potential_rating: 4, strengths: ['Visión de juego', 'Presión alta', 'Recuperación de balón'], weaknesses: ['Golpeo de larga distancia', 'Juego aéreo'], why_interested: 'Pivote completo con lectura de juego muy por encima de su edad', main_strength: 'Anticipación y recuperación en el centro del campo', main_doubt: 'Le cuesta imponer físico en duelos aéreos', differential_talent: 'Capacidad de leer la presión rival y salir jugando', player_type: 'Pivote defensivo con salida de balón', ideal_role: 'MCD en 4-2-3-1 o doble pivote', technical_profile: 'Pase corto preciso, buen control en zona de presión', tactical_profile: 'Posicionalmente muy maduro, entiende cuándo presionar y cuándo replegarse', physical_profile: 'Buena resistencia, falta explosividad para 1vs1', mental_profile: 'Muy calmado, líder silencioso en el vestuario', ratingBase: 4, ratingSpread: 1 },
  { first_name: 'Marcos', last_name: 'Fernández', full_name: 'Marcos Fernández', birth_date: '2009-11-05', calculated_age: 16, nationality: 'Española', main_position: 'DC', secondary_positions: ['SD'], dominant_foot: 'LEFT', approximate_height: 175, approximate_weight: 68, club_name: 'RC Celta Vigo B', league: 'Liga Galega Juvenil', category: 'Juvenil', status: 'VERY_INTERESTING', interest_level: 4, global_rating: 4, potential_rating: 5, strengths: ['Remate', 'Movimiento sin balón', 'Presión alta'], weaknesses: ['Salida de balón', 'Repliegue'], why_interested: 'Delantero con olfato goleador y movilidad constante', main_strength: 'Movimiento en el área y anticipación en el segundo palo', main_doubt: 'Participación en juego combinativo cuando el equipo no tiene balón alto', differential_talent: 'Rematador nato con ambas piernas dentro del área', player_type: 'Delantero centro referencia con capacidad de segunda punta', ideal_role: 'DC puro en 4-3-3 o en pareja con un segundo delantero', technical_profile: 'Remate técnico, buen control de espaldas, conducción mejorable', tactical_profile: 'Ocupa muy bien los espacios interiores, fuerte en pressing', physical_profile: 'Buena envergadura, fuerza en duelos, arrancada media', mental_profile: 'Muy competitivo, mentalidad ganadora', ratingBase: 4, ratingSpread: 1 },
  { first_name: 'Adrián', last_name: 'López', full_name: 'Adrián López', birth_date: '2008-09-18', calculated_age: 17, nationality: 'Española', main_position: 'LD', secondary_positions: ['LI'], dominant_foot: 'LEFT', approximate_height: 173, approximate_weight: 67, club_name: 'Pontevedra CF', league: 'División de Honor Juvenil', category: 'Juvenil', status: 'PRIORITY', interest_level: 5, global_rating: 5, potential_rating: 5, strengths: ['Proyección ofensiva', 'Centro al área', 'Recuperación defensiva'], weaknesses: ['Pierna derecha en el uno contra uno'], why_interested: 'Lateral completo con calidad muy superior al nivel Juvenil', main_strength: 'Combinación de aporte ofensivo y solidez defensiva', main_doubt: 'Puede ser superado con cambio de orientación a su pierna mala', differential_talent: 'Llegada al área con remate y asistencia de gol', player_type: 'Lateral ofensivo moderno', ideal_role: 'Lateral izquierdo en sistema de 4 o carrilero en 3-5-2', technical_profile: 'Centro al área preciso, buen pase corto, conducción limpia', tactical_profile: 'Sincronía perfecta con el extremo de su banda', physical_profile: 'Atlético, resistente, capacidad de repetir carreras', mental_profile: 'Muy maduro para su edad, toma buenas decisiones bajo presión', ratingBase: 5, ratingSpread: 0 },
  { first_name: 'Iván', last_name: 'García', full_name: 'Iván García', birth_date: '2008-02-28', calculated_age: 17, nationality: 'Española', main_position: 'PO', secondary_positions: [], dominant_foot: 'RIGHT', approximate_height: 185, approximate_weight: 78, club_name: 'SD Compostela', league: 'División de Honor Juvenil', category: 'Juvenil', status: 'INTERESTING', interest_level: 3, global_rating: 3, potential_rating: 4, strengths: ['Bajo palos', 'Juego aéreo', 'Liderazgo de la defensa'], weaknesses: ['Salida de balón con el pie', 'Uno contra uno fuera del área'], why_interested: 'Portero con buenas condiciones físicas y reflejos', main_strength: 'Estatura y dominio del área propia', main_doubt: 'Poca confianza con el pie, no encaja en sistema de juego con portero jugador', differential_talent: 'Paradas bajo el palo con reacción rápida', player_type: 'Portero clásico orientado a la parada', ideal_role: 'Portero en sistema sin salida de balón por el portero', technical_profile: 'Bajo palos muy seguro, poca técnica de pase', tactical_profile: 'Bien situado en los saques de esquina, organiza la línea defensiva', physical_profile: 'Alto, fuerte en el salto, buen envergadura', mental_profile: 'Líder vocal en la portería, se mantiene concentrado', ratingBase: 3, ratingSpread: 1 },
  { first_name: 'Carlos', last_name: 'Suárez', full_name: 'Carlos Suárez', birth_date: '2007-06-10', calculated_age: 18, nationality: 'Española', main_position: 'MC', secondary_positions: ['MCD', 'MCO'], dominant_foot: 'RIGHT', approximate_height: 178, approximate_weight: 72, club_name: 'Arosa SC', league: 'Tercera RFEF', category: 'Senior', status: 'TRACKING', interest_level: 4, global_rating: 4, potential_rating: 4, strengths: ['Box-to-box', 'Llegada al área', 'Recuperación de balón'], weaknesses: ['Definición', 'Descanso defensivo'], why_interested: 'Medio completo con capacidad de aparecer en zona de finalización', main_strength: 'Dinamismo y presencia en ambas fases del juego', main_doubt: 'Tendencia a no recuperar posición tras llegadas al área', differential_talent: 'Llegada al segundo palo desde segunda línea', player_type: 'Mediocentro box-to-box con vocación ofensiva', ideal_role: 'MC en doble pivote con compañero más posicional', technical_profile: 'Pase corto y medio bueno, necesita mejorar la definición', tactical_profile: 'Lectura de segunda jugada, llegada sin balón bien cronometrada', physical_profile: 'Muy resistente, motor del equipo en distancias largas', mental_profile: 'Trabajador, actitud destacable en entrenamiento', ratingBase: 4, ratingSpread: 1 },
  { first_name: 'Rubén', last_name: 'Castro', full_name: 'Rubén Castro', birth_date: '2006-12-03', calculated_age: 19, nationality: 'Española', main_position: 'EI', secondary_positions: ['SD', 'MCO'], dominant_foot: 'RIGHT', approximate_height: 172, approximate_weight: 68, club_name: 'Rapid de Bouzas', league: 'Segunda Federación', category: 'Senior', status: 'VERY_INTERESTING', interest_level: 5, global_rating: 4, potential_rating: 5, strengths: ['Regate', 'Conducción', 'Definición con pierna buena'], weaknesses: ['Consistencia defensiva', 'Toma de decisiones bajo presión alta'], why_interested: 'Extremo desequilibrante con capacidad de gol directo', main_strength: 'Capacidad de aislar al defensa y generar superioridad numérica', main_doubt: 'Rendimiento irregular en partidos de alta intensidad rival', differential_talent: 'Regate en velocidad y finalización en diagonal desde banda izquierda', player_type: 'Extremo desequilibrante con llegada al gol', ideal_role: 'Extremo izquierdo en 4-3-3 o segunda punta en 4-2-3-1', technical_profile: 'Muy técnico, control exquisito, necesita mejorar el pase largo', tactical_profile: 'Intuitivo en ataque, pendiente de mejorar participación sin balón', physical_profile: 'Ágil y explosivo, puede mejorar en duelos físicos', mental_profile: 'Creativo, puede desengancharse del partido cuando las cosas no salen', ratingBase: 4, ratingSpread: 1 },
  { first_name: 'Sergio', last_name: 'Torres', full_name: 'Sergio Torres', birth_date: '2005-04-25', calculated_age: 20, nationality: 'Española', main_position: 'CB', secondary_positions: ['LD'], dominant_foot: 'RIGHT', approximate_height: 183, approximate_weight: 80, club_name: 'Pontevedra CF', league: 'Primera RFEF', category: 'Senior', status: 'PRIORITY', interest_level: 5, global_rating: 5, potential_rating: 5, strengths: ['Anticipación', 'Duelos aéreos', 'Salida de balón'], weaknesses: ['Velocidad en carrera larga'], why_interested: 'Central de primer nivel con liderazgo y calidad en salida', main_strength: 'Lectura defensiva y anticipación a la primera línea de presión rival', main_doubt: 'Puede ser superado en velocidad en campo abierto', differential_talent: 'Capacidad de dirigir la línea defensiva y salir jugando', player_type: 'Central organizador con capacidad de distribución', ideal_role: 'CB en línea de 4 o central derecho en línea de 3', technical_profile: 'Excelente pase largo, buena salida en corto, lectura táctica avanzada', tactical_profile: 'Organiza la línea, anticipa el juego rival con facilidad', physical_profile: 'Fuerte en duelos, salta bien, falta velocidad en profundidad', mental_profile: 'Líder natural, comunicativo, mentalidad ganadora', ratingBase: 5, ratingSpread: 0 },
  { first_name: 'Javier', last_name: 'Iglesias', full_name: 'Javier Iglesias', birth_date: '2004-08-14', calculated_age: 21, nationality: 'Española', main_position: 'MCO', secondary_positions: ['SD', 'EI'], dominant_foot: 'LEFT', approximate_height: 176, approximate_weight: 70, club_name: 'CD Lugo Polvorín', league: 'Segunda Federación', category: 'Senior', status: 'CONTACTED', interest_level: 4, global_rating: 4, potential_rating: 4, strengths: ['Último pase', 'Lectura de juego', 'Pierna izquierda'], weaknesses: ['Recuperación defensiva', 'Duelos físicos'], why_interested: 'Mediapunta creativo con gran visión y calidad en el último tercio', main_strength: 'Asociación y pase entre líneas en espacios reducidos', main_doubt: 'Rinde menos cuando el rival presiona alto y anula su espacio', differential_talent: 'Asistencia de gol desde posición de mediapunta con pierna izquierda', player_type: 'Mediapunta creativo', ideal_role: 'MCO en 4-2-3-1 o segunda punta en un 4-3-1-2', technical_profile: 'Técnica depurada, regate elegante, visión periférica destacada', tactical_profile: 'Inteligente entre líneas, ocupa bien el espacio libre', physical_profile: 'Ligero, no destaca en lo físico, compensa con inteligencia', mental_profile: 'Creativo y confiado, gestiona bien los partidos de tensión', ratingBase: 4, ratingSpread: 1 },
  { first_name: 'Miguel', last_name: 'Pérez', full_name: 'Miguel Pérez', birth_date: '2003-01-19', calculated_age: 22, nationality: 'Española', main_position: 'ED', secondary_positions: ['DC'], dominant_foot: 'LEFT', approximate_height: 174, approximate_weight: 71, club_name: 'Alondras CF', league: 'Tercera RFEF', category: 'Senior', status: 'NEW', interest_level: 2, global_rating: 3, potential_rating: 3, strengths: ['Velocidad', 'Capacidad de desmarque'], weaknesses: ['Definición', 'Pierna derecha', 'Trabajo defensivo'], why_interested: 'Extremo rápido detectado en partido de copa, pendiente de seguimiento', main_strength: 'Profundidad por banda derecha', main_doubt: 'Falta de consistencia en el último pase y definición', differential_talent: 'Carrera a la espalda de la defensa rival', player_type: 'Extremo de desborde y velocidad', ideal_role: 'Extremo derecho en un sistema de 4-3-3', technical_profile: 'Necesita mejorar el control y la definición', tactical_profile: 'Buen posicionamiento en transición ofensiva', physical_profile: 'Muy rápido, resistencia mejorable', mental_profile: 'Joven, necesita ganar madurez competitiva', ratingBase: 3, ratingSpread: 1 },
  { first_name: 'Ángel', last_name: 'Vázquez', full_name: 'Ángel Vázquez', birth_date: '2002-05-07', calculated_age: 23, nationality: 'Española', main_position: 'CB', secondary_positions: ['MCD'], dominant_foot: 'RIGHT', approximate_height: 186, approximate_weight: 83, club_name: 'CD Betanzos', league: 'Tercera RFEF', category: 'Senior', status: 'TRACKING', interest_level: 3, global_rating: 3, potential_rating: 3, strengths: ['Fortaleza física', 'Duelos aéreos', 'Entrada'], weaknesses: ['Velocidad', 'Salida de balón', 'Pie izquierdo'], why_interested: 'Central con buenas condiciones físicas y solidez en el marcaje', main_strength: 'Dominio aéreo y solidez en duelos de segunda jugada', main_doubt: 'Poco cómodo en sistemas con salida de balón desde atrás', differential_talent: 'Liderazgo defensivo en balón parado', player_type: 'Central físico y destructor', ideal_role: 'CB en línea de 4, zaguero en sistema directo', technical_profile: 'Despeje largo, poco con el pie, necesita mejorar la salida', tactical_profile: 'Sólido en sistemas de defensa en bloque medio-bajo', physical_profile: 'Imponente físicamente, muy fuerte en duelos', mental_profile: 'Duro, competitivo, puede impacientarse con el juego combinativo', ratingBase: 3, ratingSpread: 1 },
  { first_name: 'Tomás', last_name: 'Silva', full_name: 'Tomás Silva', birth_date: '2001-10-30', calculated_age: 24, nationality: 'Portuguesa', main_position: 'DC', secondary_positions: ['SD', 'EI'], dominant_foot: 'RIGHT', approximate_height: 180, approximate_weight: 76, club_name: 'Tui CF', league: 'Segunda Federación', category: 'Senior', status: 'ON_TRIAL', interest_level: 5, global_rating: 4, potential_rating: 4, strengths: ['Remate de cabeza', 'Protección de balón', 'Presión'], weaknesses: ['Velocidad en campo abierto'], why_interested: 'Delantero de área completo, en período de prueba en el club', main_strength: 'Referencia en el área, gana duelos físicos a los centrales', main_doubt: 'Velocidad para jugar en equipos con transición rápida', differential_talent: 'Remate de cabeza en córner y jugadas de estrategia', player_type: 'Delantero referencia, nueve clásico', ideal_role: 'DC en 4-4-2 o punto de apoyo en 4-3-3', technical_profile: 'Control de espaldas bueno, remate técnico con ambas piernas', tactical_profile: 'Organiza el pressing alto, muy útil en balón parado', physical_profile: 'Fuerte, potente en el salto, velocidad limitada', mental_profile: 'Maduro, buen comunicador en campo, carácter competitivo', ratingBase: 4, ratingSpread: 1 },
  // 2 jugadores nuevos, para llegar a 14
  { first_name: 'Hugo', last_name: 'Domínguez', full_name: 'Hugo Domínguez', birth_date: '2010-02-11', calculated_age: 15, nationality: 'Española', main_position: 'LI', secondary_positions: ['CB'], dominant_foot: 'LEFT', approximate_height: 168, approximate_weight: 58, club_name: 'Choco CF', league: 'Liga Galega Cadete', category: 'Cadete', status: 'INTERESTING', interest_level: 3, global_rating: 3, potential_rating: 4, strengths: ['Salida de balón', 'Cobertura', 'Pierna zurda natural'], weaknesses: ['Juego aéreo', 'Duelos físicos'], why_interested: 'Lateral zurdo con proyección, poco habitual en su categoría', main_strength: 'Naturalidad para salir jugando desde atrás con pierna izquierda', main_doubt: 'Físico todavía por desarrollar para el nivel senior', differential_talent: 'Zurdo natural con criterio en la salida de balón', player_type: 'Lateral/central zurdo con proyección de futuro', ideal_role: 'Lateral izquierdo o central zurdo en línea de 4', technical_profile: 'Buen primer control, pase con criterio, mejorable en el centro al área', tactical_profile: 'Se posiciona bien en cobertura, entiende las basculaciones', physical_profile: 'Delgado, necesita ganar fuerza para el salto de categoría', mental_profile: 'Tranquilo, escucha bien las indicaciones del cuerpo técnico', ratingBase: 3, ratingSpread: 1 },
  { first_name: 'Nicolás', last_name: 'Otero', full_name: 'Nicolás Otero', birth_date: '2006-09-02', calculated_age: 19, nationality: 'Española', main_position: 'PO', secondary_positions: [], dominant_foot: 'RIGHT', approximate_height: 188, approximate_weight: 80, club_name: 'Somozas CF', league: 'Preferente Autonómica', category: 'Senior', status: 'CONTACTED', interest_level: 4, global_rating: 4, potential_rating: 4, strengths: ['Reflejos', 'Juego con los pies', 'Salidas aéreas'], weaknesses: ['Comunicación con la defensa'], why_interested: 'Portero moderno, cómodo jugando con los pies y buenos reflejos', main_strength: 'Capacidad para iniciar la jugada con el pie con seguridad', main_doubt: 'Todavía debe mejorar el mando de área en centros laterales', differential_talent: 'Portero-jugador, útil en sistemas de salida corta', player_type: 'Portero moderno orientado al juego con los pies', ideal_role: 'Portero titular en sistema con salida corta desde atrás', technical_profile: 'Muy seguro con los pies, buena colocación en el mano a mano', tactical_profile: 'Achica bien los espacios, participa activamente en la salida', physical_profile: 'Buena envergadura, explosivo en el salto', mental_profile: 'Seguro de sí mismo, transmite calma al equipo', ratingBase: 4, ratingSpread: 1 },
];

const REPORT_TEMPLATES = [
  { tc: 'Técnicamente muy por encima de la media. Primer control y salida de balón sobresalientes.', tacc: 'Lectura táctica correcta. Bien posicionado en las transiciones.', pc: 'Físicamente sólido durante todo el partido. Buena gestión de esfuerzos.', mc: 'Actitud competitiva alta. Se mantiene concentrado en los momentos clave.', rec: 'FICHAR', next: 'Convocar para prueba en el primer equipo', rating: 4 },
  { tc: 'Buena técnica individual. Pase corto y control correctos.', tacc: 'Participación activa en la construcción del juego.', pc: 'Buen nivel físico, aunque la intensidad bajó en el último tramo.', mc: 'Mentalidad positiva, se recupera bien de los errores.', rec: 'SEGUIR', next: 'Seguimiento en próximos 3 partidos', rating: 3 },
  { tc: 'Técnica individual brillante. Desequilibró constantemente a su rival directo.', tacc: 'Participó activamente en la presión alta y en la transición ataque-defensa.', pc: 'Explosivo, rápido y con mucho recorrido. Excelente físico para su categoría.', mc: 'Liderazgo claro. Animó al equipo en los momentos de dificultad.', rec: 'FICHAR', next: 'Reunión urgente con agente/familia', rating: 5 },
  { tc: 'Técnicamente correcto pero sin brillar en los momentos de exigencia.', tacc: 'Necesita mejorar la lectura táctica en situaciones de transición.', pc: 'Físico correcto para su categoría, sin destacar especialmente.', mc: 'Se nota joven, puede mejorar la gestión emocional del partido.', rec: 'AMPLIAR_INFO', next: 'Ver otro partido antes de tomar decisión', rating: 3 },
];

async function main() {
  console.log('🚀  Iniciando seed de datos demo para CORUXO F.C....');

  const { data: clientRow, error: clientErr } = await sb
    .from('clients').select('id, name').ilike('name', TARGET_CLIENT_NAME).maybeSingle();
  if (clientErr || !clientRow) {
    console.error(`❌  No se encontró el cliente "${TARGET_CLIENT_NAME}" en la tabla clients.`, clientErr?.message || '');
    process.exit(1);
  }
  const ownerClubId = clientRow.id;
  console.log(`✅  Cliente destino: ${clientRow.name} (${ownerClubId})`);

  const insertedPlayers = [];

  for (const [i, tmpl] of PLAYERS_TEMPLATE.entries()) {
    const { ratingBase, ratingSpread, category, ...rest } = tmpl;
    const playerRatings = ratings(ratingBase, ratingSpread);

    const player = {
      ...rest,
      ...playerRatings,
      owner_club_id: ownerClubId,
      category_id: category,
      competition: rest.league,
      lateralidad: rest.dominant_foot === 'LEFT' ? 'Zurdo' : rest.dominant_foot === 'BOTH' ? 'Ambidiestro' : 'Diestro',
      has_video: false,
      has_images: false,
      possible_duplicate: false,
      source: 'Observación directa',
      area: 'Galicia',
      rating_technical: ratingBase,
      rating_tactical: Math.max(1, ratingBase - (i % 2 === 0 ? 0 : 1)),
      rating_physical: Math.max(1, ratingBase - (i % 3 === 0 ? 0 : 1)),
      rating_mental: ratingBase,
    };

    const { data, error } = await sb.from('players').insert([player]).select('id, full_name').single();
    if (error) {
      console.error(`❌  Error insertando ${rest.full_name}:`, error.message);
    } else {
      insertedPlayers.push(data);
      console.log(`  ✔  Jugador ${i + 1}/${PLAYERS_TEMPLATE.length}: ${data.full_name} (${data.id.slice(0, 8)}…)`);
    }
  }

  console.log(`\n📋  Insertados ${insertedPlayers.length} jugadores. Creando informes...\n`);

  for (const [i, p] of insertedPlayers.entries()) {
    const tpl = REPORT_TEMPLATES[i % REPORT_TEMPLATES.length];
    const today = new Date();
    today.setDate(today.getDate() - r(1, 30));
    const reportDate = today.toISOString().split('T')[0];

    const report = {
      player_id: p.id,
      report_date: reportDate,
      position_played: PLAYERS_TEMPLATE[i].main_position,
      minutes_observed: rr([60, 70, 80, 90]),
      match_context: `${PLAYERS_TEMPLATE[i].club_name} vs rival. ${rr(['Victoria', 'Empate', 'Derrota'])} ${r(0, 3)}-${r(0, 3)}.`,
      technical_comment: tpl.tc,
      tactical_comment: tpl.tacc,
      physical_comment: tpl.pc,
      mental_comment: tpl.mc,
      strengths: PLAYERS_TEMPLATE[i].strengths,
      weaknesses: PLAYERS_TEMPLATE[i].weaknesses,
      key_actions: `Acción destacada en min. ${r(15, 85)}: ${rr(['Gol', 'Asistencia', 'Parada clave', 'Recuperación decisiva', 'Regate en área'])}`,
      doubts: PLAYERS_TEMPLATE[i].main_doubt,
      recommendation: tpl.rec,
      next_step: tpl.next,
      match_rating: tpl.rating,
      rating_technical: PLAYERS_TEMPLATE[i].ratingBase,
      rating_tactical: Math.max(1, PLAYERS_TEMPLATE[i].ratingBase - 1),
      rating_physical: PLAYERS_TEMPLATE[i].ratingBase,
      rating_mental: PLAYERS_TEMPLATE[i].ratingBase,
    };

    const { error } = await sb.from('reports').insert([report]);
    if (error) {
      console.error(`  ❌  Informe para ${p.full_name}:`, error.message);
    } else {
      console.log(`  ✔  Informe ${i + 1}/${insertedPlayers.length}: ${p.full_name}`);
    }
  }

  console.log('\n🎉  Seed completado. Recarga la app (viendo como Coruxo FC) para ver los datos.');
}

main().catch(e => { console.error('Error fatal:', e); process.exit(1); });
