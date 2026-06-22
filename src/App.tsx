import { useState, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { PlayerList } from './components/PlayerList';
import { TeamList } from './components/TeamList';
import { PlayerDetail } from './components/PlayerDetail';
import { QuickAddModal } from './components/QuickAddModal';
import { MatchList } from './components/MatchList';
import { MatchDetail } from './components/MatchDetail';
import { ReportList } from './components/ReportList';
import { ReportForm } from './components/ReportForm';
import { SettingsPanel } from './components/SettingsPanel';
import { Plus } from 'lucide-react';
import { MOCK_PLAYERS, MOCK_REPORTS, MOCK_MATCHES, MOCK_VIDEOS } from './mockData';
import { Player, Match, Report, Video, HistoryLog } from './types';
import { supabase } from './lib/supabase';
import { useEffect } from 'react';

const isValidUUID = (str: string) => {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
};

export default function App() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [history, setHistory] = useState<HistoryLog[]>([]);
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedPlayerTab, setSelectedPlayerTab] = useState('resumen');
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [reportToCreate, setReportToCreate] = useState<{playerId?: string, matchId?: string, mode?: 'RAPID' | 'COMPLETE'} | null>(null);
  
  const [userRole] = useState('SUPERADMIN');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bootstrapAndFetch();
  }, []);

  const bootstrapAndFetch = async () => {
    setLoading(true);
    try {
      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const isConfigured = supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co';
      
      if (!isConfigured) {
        alert('ADVERTENCIA: Supabase no está configurado. Ve a Ajustes (icono engranaje) y añade VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY para activar la base de datos.');
        setLoading(false);
        return;
      }

      // Check if players table exists and is accessible
      const { error: healthError } = await supabase.from('players').select('id').limit(1);
      if (healthError) {
        console.error('Table access error:', healthError);
        alert('ADVERTENCIA: No se puede acceder a la tabla "players" en Supabase. Asegúrate de haber ejecutado el script SQL en el editor de Supabase.');
      }

      // 1. Ensure a club exists
      let clubId = null;
      const { data: clubs } = await supabase.from('clubs').select('id').limit(1);
      if (clubs && clubs.length > 0) {
        clubId = clubs[0].id;
      } else {
        const { data: newClub } = await supabase.from('clubs').insert([
          { name: 'U.D. SANTA MARIÑA', current_season: '2026/2027' }
        ]).select().single();
        if (newClub) clubId = newClub.id;
      }

      // 2. Ensure a team exists
      let teamId = null;
      const { data: teams } = await supabase.from('teams').select('id').limit(1);
      if (teams && teams.length > 0) {
        teamId = teams[0].id;
      } else {
        const { data: newTeam } = await supabase.from('teams').insert([
          { name: 'Primer Equipo', club_name: 'U.D. SANTA MARIÑA', category_id: 'cat-all', season: '2026/2027' }
        ]).select().single();
        if (newTeam) teamId = newTeam.id;
      }

      // 3. Fetch Players
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('*')
        .order('created_at', { ascending: false });

      if (playersError) {
        console.error('Fetch players error:', playersError);
        throw playersError;
      }
      
      console.log('Fetched players count:', playersData?.length || 0);
      
      if (playersData) {
        setPlayers(playersData as Player[]);
      }

      // 4. Fetch other data
      const { data: matchesData } = await supabase.from('matches').select('*');
      if (matchesData && matchesData.length > 0) setMatches(matchesData as Match[]);

      const { data: reportsData } = await supabase.from('reports').select('*');
      if (reportsData && reportsData.length > 0) setReports(reportsData as Report[]);

    } catch (err) {
      console.error('Bootstrap error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlayer = (player: Player, tab: string = 'resumen') => {
    const freshPlayer = players.find(p => p.id === player.id) || player;
    setSelectedPlayer(freshPlayer);
    setSelectedPlayerTab(tab);
    setActiveTab('player_detail');
  };

  const handleSelectMatch = (match: Match) => {
    setSelectedMatch(match);
    setActiveTab('match_detail');
  };

  // Helper to clean player data for Supabase
  const preparePlayerForDB = async (player: Player) => {
    // Define exact fields allowed in the DB to avoid "column does not exist" errors
    const allowedFields = [
      'id', 'club_id', 'first_name', 'last_name', 'full_name', 'birth_year', 'calculated_age',
      'birth_date', 'nationality', 'category_id', 'current_team_id', 'club_name', 'league',
      'usual_number', 'main_position', 'secondary_positions', 'dominant_foot',
      'approximate_height', 'approximate_weight', 'area', 'source', 'avatar_url',
      'status', 'interest_level', 'global_rating', 'potential_rating', 'strengths',
      'weaknesses', 'why_interested', 'main_strength', 'main_doubt', 'differential_talent',
      'club_fit', 'risk_level', 'next_step', 'has_video', 'has_images', 'short_name',
      'competition', 'lateralidad', 'tracking_history', 'rating_technical', 'rating_tactical',
      'rating_physical', 'rating_mental', 'rating_velo_despl', 'rating_acel', 'rating_fuerza',
      'rating_resis', 'rating_agil', 'rating_coord', 'rating_velo_reac', 'rating_poten',
      'rating_recup_fatiga', 'rating_tenden_lesion', 'rating_pase_corto', 'rating_pase_largo',
      'rating_ctrl_balon', 'rating_tiro', 'rating_regate', 'rating_conduc', 'rating_superf_cont',
      'rating_despeje', 'rating_entrada', 'rating_pierna_menos', 'rating_posic', 'rating_cobertura',
      'rating_repliegue', 'rating_ayuda_def', 'rating_marcajes', 'rating_dom_espacios',
      'rating_vigilancias', 'rating_apoyos_off', 'rating_desmarques', 'rating_temporiz',
      'rating_liderazgo', 'rating_caracter', 'rating_competitiv', 'rating_companerismo',
      'rating_mentalidad', 'rating_agresividad', 'rating_polivalencia', 'rating_inteligencia',
      'rating_comunicacion', 'rating_personalidad', 'rating_juego_aereo', 'custom_ratings',
      'rating_club_fit', 'risks_analysis', 'improvement_margin', 'player_type', 'ideal_role',
      'current_level_club', 'future_level_estimated', 'comparison_players', 'technical_profile',
      'tactical_profile', 'physical_profile', 'mental_profile', 'birth_place', 'passport',
      'agent_name', 'weight_kg', 'info_source', 'general_observations', 'verification_status',
      'created_by', 'decision_final', 'decision_date'
    ];

    const cleaned: any = {};
    allowedFields.forEach(field => {
      if ((player as any)[field] !== undefined) {
        cleaned[field] = (player as any)[field];
      }
    });

    if (!isValidUUID(cleaned.id)) delete cleaned.id;
    
    // Fix foreign keys
    if (cleaned.club_id && !isValidUUID(cleaned.club_id)) {
      const { data: clubs } = await supabase.from('clubs').select('id').limit(1);
      if (clubs && clubs[0]) cleaned.club_id = clubs[0].id;
      else delete cleaned.club_id;
    }
    
    if (cleaned.current_team_id && !isValidUUID(cleaned.current_team_id)) {
      const { data: teams } = await supabase.from('teams').select('id').limit(1);
      if (teams && teams[0]) cleaned.current_team_id = teams[0].id;
      else delete cleaned.current_team_id;
    }

    return cleaned;
  };

  // Helper to clean report data for Supabase
  const prepareReportForDB = async (report: Report) => {
    const allowedFields = [
      'id', 'player_id', 'match_id', 'observer_id', 'report_date', 'category_id', 
      'position_played', 'minutes_observed', 'match_context', 'technical_comment', 
      'tactical_comment', 'physical_comment', 'mental_comment', 'strengths', 
      'weaknesses', 'key_actions', 'doubts', 'recommendation', 'next_step', 
      'match_rating', 'rating_physical', 'rating_technical', 'rating_tactical', 
      'rating_mental', 'custom_ratings', 'video_urls'
    ];

    const cleaned: any = {};
    allowedFields.forEach(field => {
      if ((report as any)[field] !== undefined) {
        cleaned[field] = (report as any)[field];
      }
    });

    if (!isValidUUID(cleaned.id)) delete cleaned.id;
    
    // player_id MUST be a valid UUID
    if (!cleaned.player_id || !isValidUUID(cleaned.player_id)) {
      if (cleaned.player_id && !isValidUUID(cleaned.player_id)) {
        const realPlayer = players.find(p => p.id === cleaned.player_id);
        if (realPlayer && isValidUUID(realPlayer.id)) {
          cleaned.player_id = realPlayer.id;
        }
      }
    }

    if (cleaned.match_id && !isValidUUID(cleaned.match_id)) {
      const { data: matchesData } = await supabase.from('matches').select('id').limit(1);
      if (matchesData && matchesData[0]) cleaned.match_id = matchesData[0].id;
      else delete cleaned.match_id;
    }

    if (cleaned.observer_id && !isValidUUID(cleaned.observer_id)) {
      delete cleaned.observer_id;
    }

    return cleaned;
  };

  const handleSavePlayer = async (newPlayerData: any) => {
    if (editingPlayer) {
      const updatedPlayer = { 
        ...editingPlayer, 
        full_name: newPlayerData.name, 
        first_name: newPlayerData.name?.split(' ')[0] || '',
        last_name: newPlayerData.name?.split(' ').slice(1).join(' ') || '',
        main_position: newPlayerData.position,
        birth_year: Number(newPlayerData.birth_year),
        calculated_age: new Date().getFullYear() - Number(newPlayerData.birth_year),
        dominant_foot: newPlayerData.dominant_foot,
        status: newPlayerData.status,
        interest_level: Number(newPlayerData.rating),
        global_rating: Number(newPlayerData.rating),
        potential_rating: Number(newPlayerData.potential_rating),
        club_name: newPlayerData.team || editingPlayer.club_name,
        category_id: newPlayerData.category || editingPlayer.category_id,
        strengths: typeof newPlayerData.strengths === 'string' 
          ? newPlayerData.strengths.split(',').map((s: string) => s.trim()).filter(Boolean)
          : newPlayerData.strengths || editingPlayer.strengths,
        weaknesses: typeof newPlayerData.weaknesses === 'string'
          ? newPlayerData.weaknesses.split(',').map((w: string) => w.trim()).filter(Boolean)
          : newPlayerData.weaknesses || editingPlayer.weaknesses,
        why_interested: newPlayerData.why_interested || editingPlayer.why_interested,
        main_strength: newPlayerData.main_strength || editingPlayer.main_strength,
        main_doubt: newPlayerData.main_doubt || editingPlayer.main_doubt,
        differential_talent: newPlayerData.differential_talent || editingPlayer.differential_talent,
        risk_level: newPlayerData.risk_level || editingPlayer.risk_level,
        club_fit: newPlayerData.club_fit || editingPlayer.club_fit,
        next_step: newPlayerData.next_step || editingPlayer.next_step,
        updated_at: new Date().toISOString()
      };

      const updatedPlayers = players.map(p => p.id === editingPlayer.id ? updatedPlayer : p);
      setPlayers(updatedPlayers);
      if (selectedPlayer?.id === editingPlayer.id) {
        setSelectedPlayer(updatedPlayer);
      }
      setEditingPlayer(null);

      // Supabase Update
      try {
        const cleaned = await preparePlayerForDB(updatedPlayer);
        const { error } = await supabase.from('players').update(cleaned).eq('id', updatedPlayer.id);
        if (error) console.error('Supabase update error:', error);
      } catch (err) {
        console.error('Supabase update failed:', err);
      }

    } else {
      const birthYear = Number(newPlayerData.birth_year) || 2005;
      const newPlayer: Player = {
        id: (window.crypto && window.crypto.randomUUID) ? window.crypto.randomUUID() : '00000000-0000-0000-0000-000000000000', // Placeholder or omitted
        club_id: undefined, // Will be fixed in preparePlayerForDB
        first_name: newPlayerData.name?.split(' ')[0] || '',
        last_name: newPlayerData.name?.split(' ').slice(1).join(' ') || '',
        full_name: newPlayerData.name || 'Sin Nombre',
        birth_year: birthYear,
        calculated_age: new Date().getFullYear() - birthYear,
        category_id: undefined,
        current_team_id: undefined,
        club_name: newPlayerData.team || 'Equipo Demo',
        main_position: newPlayerData.position || '',
        dominant_foot: newPlayerData.dominant_foot || 'RIGHT',
        status: newPlayerData.status || 'TRACKING',
        interest_level: Number(newPlayerData.rating) || 3,
        global_rating: Number(newPlayerData.rating) || 3,
        potential_rating: Number(newPlayerData.potential_rating) || (Number(newPlayerData.rating || 3) + 1),
        short_name: newPlayerData.name?.toUpperCase() || 'SIN NOMBRE',
        lateralidad: newPlayerData.dominant_foot === 'RIGHT' ? 'DIESTRO' : newPlayerData.dominant_foot === 'LEFT' ? 'ZURDO' : 'AMBIDIESTRO',
        competition: 'GENERAL',
        strengths: typeof newPlayerData.strengths === 'string'
          ? newPlayerData.strengths.split(',').map((s: string) => s.trim()).filter(Boolean)
          : (newPlayerData.reason ? [newPlayerData.reason] : []),
        weaknesses: typeof newPlayerData.weaknesses === 'string'
          ? newPlayerData.weaknesses.split(',').map((w: string) => w.trim()).filter(Boolean)
          : [],
        why_interested: newPlayerData.why_interested || '',
        main_strength: newPlayerData.main_strength || '',
        main_doubt: newPlayerData.main_doubt || '',
        differential_talent: newPlayerData.differential_talent || '',
        risk_level: newPlayerData.risk_level || 'LOW',
        club_fit: newPlayerData.club_fit || '',
        next_step: newPlayerData.next_step || '',
        has_video: !!newPlayerData.videoUrl,
        has_images: false,
        possible_duplicate: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (newPlayer.id === '00000000-0000-0000-0000-000000000000') {
        const fallbackId = `temp-${Date.now()}`;
        (newPlayer as any).id = fallbackId;
      }
      
      setPlayers([newPlayer, ...players]);
      
      // Supabase Insert
      try {
        const cleaned = await preparePlayerForDB(newPlayer);
        // If we have a temp ID, omit it so Supabase generates a real UUID
        if (newPlayer.id.startsWith('temp-')) {
          delete cleaned.id;
        }

        const { data, error } = await supabase.from('players').insert([cleaned]).select();
        
        if (error) {
          console.error('Supabase player insert error:', error);
          alert('Error al guardar en la base de datos: ' + error.message);
        } else if (data && data[0]) {
          setPlayers(prev => [data[0], ...prev.filter(p => p.id !== newPlayer.id)]);
          console.log('Player persisted successfully in Supabase');
        }
      } catch (err) {
        console.error('Supabase insert failed:', err);
      }

      if (newPlayerData.matchId) {
        setMatches(prevMatches => prevMatches.map(m => 
          m.id === newPlayerData.matchId 
            ? { ...m, observed_players_ids: [...m.observed_players_ids, newPlayer.id] } 
            : m
        ));
      }

      if (newPlayerData.videoUrl) {
        const newVideo: Video = {
          id: `v-${Date.now()}`,
          player_id: newPlayer.id,
          match_id: newPlayerData.matchId,
          url: newPlayerData.videoUrl,
          platform: 'URL',
          title: 'Vídeo Inicial',
          is_key: true,
          pending_review: true,
          created_at: new Date().toISOString(),
        };
        setVideos([newVideo, ...videos]);
      }
    }
    setIsQuickAddOpen(false);
  };

  const handleDeletePlayer = async (playerId: string) => {
    setPlayers(players.filter(p => p.id !== playerId));
    setSelectedPlayer(null);
    setActiveTab('players');

    // Supabase
    await supabase.from('players').delete().eq('id', playerId);
  };

  const handleEditPlayer = (player: Player) => {
    setEditingPlayer(player);
    setIsQuickAddOpen(true);
  };

  const handleUpdatePlayer = async (updatedPlayer: Player) => {
    // Local update for immediate feedback
    setPlayers(prev => prev.map(p => p.id === updatedPlayer.id ? updatedPlayer : p));
    if (selectedPlayer?.id === updatedPlayer.id) {
      setSelectedPlayer(updatedPlayer);
    }

    // Persist to Supabase
    try {
      if (isValidUUID(updatedPlayer.id)) {
        const cleaned = await preparePlayerForDB(updatedPlayer);
        console.log('Updating player in Supabase with data:', cleaned);
        
        const { error } = await supabase
          .from('players')
          .update(cleaned)
          .eq('id', updatedPlayer.id);

        if (error) {
          console.error('Error updating player in Supabase:', error);
          alert('Error al actualizar en la base de datos: ' + error.message);
        } else {
           console.log('Player updated successfully in Supabase');
        }
      } else {
        console.warn('Cannot update player with non-UUID id in Supabase');
        alert('ADVERTENCIA: El ID del jugador no es válido para Supabase. Intenta añadirlo de nuevo.');
      }
    } catch (err) {
      console.error('Supabase update exception:', err);
    }
  };

  const handleCreateReport = (playerId?: string, matchId?: string, mode: 'RAPID' | 'COMPLETE' = 'RAPID') => {
    setEditingReport(null);
    setReportToCreate({ playerId, matchId, mode });
    setActiveTab('report_form');
  };

  const handleEditReport = (report: Report) => {
    setEditingReport(report);
    setReportToCreate({ 
      playerId: report.player_id, 
      matchId: report.match_id, 
      mode: report.technical_comment || report.tactical_comment ? 'COMPLETE' : 'RAPID' 
    });
    setActiveTab('report_form');
  };

  const handleDeleteReport = async (reportId: string) => {
    setReports(prev => prev.filter(r => r.id !== reportId));
    // Supabase
    await supabase.from('reports').delete().eq('id', reportId);
  };

  const handleSaveMatch = async (matchData: any) => {
    const newMatch: Match = {
      id: `m-${Date.now()}`,
      date: matchData.date || new Date().toISOString(),
      home_team: matchData.home_team,
      away_team: matchData.away_team,
      competition: matchData.competition,
      venue: matchData.venue,
      score: matchData.score,
      observed_players_ids: [],
      created_at: new Date().toISOString(),
    };

    setMatches([newMatch, ...matches]);
    
    // Supabase
    await supabase.from('matches').insert([newMatch]);
  };

  const handleMergeReports = async (reportIds: string[]) => {
    const reportsToMerge = reports.filter(r => reportIds.includes(r.id));
    if (reportsToMerge.length < 2) return;

    const firstReport = reportsToMerge[0];
    const player = players.find(p => p.id === firstReport.player_id);
    if (!player) return;

    // Simplified merge: take average rating and concatenated comments
    const mergedReport: Report = {
      ...firstReport,
      id: `r-merged-${Date.now()}`,
      report_date: new Date().toISOString(),
      match_rating: Math.round(reportsToMerge.reduce((acc, r) => acc + r.match_rating, 0) / reportsToMerge.length),
      technical_comment: reportsToMerge.map(r => r.technical_comment).filter(Boolean).join('\n---\n'),
      tactical_comment: reportsToMerge.map(r => r.tactical_comment).filter(Boolean).join('\n---\n'),
      physical_comment: reportsToMerge.map(r => r.physical_comment).filter(Boolean).join('\n---\n'),
      mental_comment: reportsToMerge.map(r => r.mental_comment).filter(Boolean).join('\n---\n'),
      strengths: Array.from(new Set(reportsToMerge.flatMap(r => r.strengths))),
      weaknesses: Array.from(new Set(reportsToMerge.flatMap(r => r.weaknesses))),
      created_at: new Date().toISOString(),
    };

    setReports([mergedReport, ...reports.filter(r => !reportIds.includes(r.id))]);
    
    // Supabase (transaction-like)
    for (const id of reportIds) {
      await supabase.from('reports').delete().eq('id', id);
    }
    await supabase.from('reports').insert([mergedReport]);
  };

  const handleSaveReport = async (data: any) => {
    // 1. Create or Update Report object
    const reportData: Report = {
      ...(editingReport || {}),
      id: editingReport?.id || (window.crypto.randomUUID ? window.crypto.randomUUID() : `r-${Date.now()}`),
      player_id: data.player_id!,
      match_id: data.match_id,
      observer_id: editingReport?.observer_id, // Leave null for now if not UUID
      report_date: data.report_date || new Date().toISOString(),
      recommendation: data.recommendation || 'TRACKING',
      match_rating: Number(data.match_rating) || 3,
      technical_comment: data.technical_comment,
      tactical_comment: data.tactical_comment,
      physical_comment: data.physical_comment,
      mental_comment: data.mental_comment,
      strengths: typeof data.strengths === 'string' ? data.strengths.split(',').map((s: any) => s.trim()).filter(Boolean) : data.strengths,
      weaknesses: typeof data.weaknesses === 'string' ? data.weaknesses.split(',').map((s: any) => s.trim()).filter(Boolean) : data.weaknesses,
      key_actions: data.key_actions,
      doubts: data.doubts,
      next_step: data.next_step,
      rating_physical: Number(data.rating_physical) || 0,
      rating_technical: Number(data.rating_technical) || 0,
      rating_tactical: Number(data.rating_tactical) || 0,
      rating_mental: Number(data.rating_mental) || 0,
      custom_ratings: data.custom_ratings || [],
      created_at: editingReport?.created_at || new Date().toISOString(),
    };

    // Prepare report for DB
    try {
      const cleanedReport = await prepareReportForDB(reportData);
      
      let finalReportId = reportData.id;

      if (editingReport && isValidUUID(editingReport.id)) {
        const { error } = await supabase.from('reports').update(cleanedReport).eq('id', editingReport.id);
        if (error) throw error;
        setReports(prev => prev.map(r => r.id === editingReport.id ? reportData : r));
      } else {
        const { data: inserted, error } = await supabase.from('reports').insert([cleanedReport]).select();
        if (error) throw error;
        if (inserted && inserted[0]) {
          finalReportId = inserted[0].id;
          setReports(prev => [{ ...reportData, id: finalReportId }, ...prev.filter(r => r.id !== reportData.id)]);
        } else {
          setReports(prev => [reportData, ...prev]);
        }
      }
    } catch (err: any) {
      console.error('Error saving report to Supabase:', err);
      alert('Error al guardar el informe: ' + (err.message || 'Error desconocido'));
      // We don't return here so we still try to update local state if possible, or at least player data
    }

    // 2. Update Player Profile with new ratings and data
    const playerToUpdate = players.find(p => p.id === data.player_id);
    if (playerToUpdate) {
      const updatedPlayer: Player = {
        ...playerToUpdate,
        short_name: data.short_name || playerToUpdate.short_name,
        competition: data.competition || playerToUpdate.competition,
        lateralidad: data.lateralidad || playerToUpdate.lateralidad,
        approximate_height: data.approximate_height ? Number(data.approximate_height) : playerToUpdate.approximate_height,
        weight_kg: data.weight_kg ? Number(data.weight_kg) : playerToUpdate.weight_kg,
        status: data.recommendation || playerToUpdate.status,
        next_step: data.next_step || playerToUpdate.next_step,
        
        rating_physical: Number(data.rating_physical) || playerToUpdate.rating_physical,
        rating_technical: Number(data.rating_technical) || playerToUpdate.rating_technical,
        rating_tactical: Number(data.rating_tactical) || playerToUpdate.rating_tactical,
        rating_mental: Number(data.rating_mental) || playerToUpdate.rating_mental,
        custom_ratings: data.custom_ratings || playerToUpdate.custom_ratings,
        
        rating_velo_despl: Number(data.rating_velo_despl) || playerToUpdate.rating_velo_despl,
        rating_acel: Number(data.rating_acel) || playerToUpdate.rating_acel,
        rating_fuerza: Number(data.rating_fuerza) || playerToUpdate.rating_fuerza,
        rating_resis: Number(data.rating_resis) || playerToUpdate.rating_resis,
        rating_agil: Number(data.rating_agil) || playerToUpdate.rating_agil,
        rating_coord: Number(data.rating_coord) || playerToUpdate.rating_coord,
        rating_velo_reac: Number(data.rating_velo_reac) || playerToUpdate.rating_velo_reac,
        rating_poten: Number(data.rating_poten) || playerToUpdate.rating_poten,
        rating_recup_fatiga: Number(data.rating_recup_fatiga) || playerToUpdate.rating_recup_fatiga,
        rating_tenden_lesion: Number(data.rating_tenden_lesion) || playerToUpdate.rating_tenden_lesion,

        rating_pase_corto: Number(data.rating_pase_corto) || playerToUpdate.rating_pase_corto,
        rating_pase_largo: Number(data.rating_pase_largo) || playerToUpdate.rating_pase_largo,
        rating_ctrl_balon: Number(data.rating_ctrl_balon) || playerToUpdate.rating_ctrl_balon,
        rating_tiro: Number(data.rating_tiro) || playerToUpdate.rating_tiro,
        rating_regate: Number(data.rating_regate) || playerToUpdate.rating_regate,
        rating_conduc: Number(data.rating_conduc) || playerToUpdate.rating_conduc,
        rating_superf_cont: Number(data.rating_superf_cont) || playerToUpdate.rating_superf_cont,
        rating_despeje: Number(data.rating_despeje) || playerToUpdate.rating_despeje,
        rating_entrada: Number(data.rating_entrada) || playerToUpdate.rating_entrada,
        rating_pierna_menos: Number(data.rating_pierna_menos) || playerToUpdate.rating_pierna_menos,

        rating_posic: Number(data.rating_posic) || playerToUpdate.rating_posic,
        rating_cobertura: Number(data.rating_cobertura) || playerToUpdate.rating_cobertura,
        rating_repliegue: Number(data.rating_repliegue) || playerToUpdate.rating_repliegue,
        rating_ayuda_def: Number(data.rating_ayuda_def) || playerToUpdate.rating_ayuda_def,
        rating_marcajes: Number(data.rating_marcajes) || playerToUpdate.rating_marcajes,
        rating_dom_espacios: Number(data.rating_dom_espacios) || playerToUpdate.rating_dom_espacios,
        rating_vigilancias: Number(data.rating_vigilancias) || playerToUpdate.rating_vigilancias,
        rating_apoyos_off: Number(data.rating_apoyos_off) || playerToUpdate.rating_apoyos_off,
        rating_desmarques: Number(data.rating_desmarques) || playerToUpdate.rating_desmarques,
        rating_temporiz: Number(data.rating_temporiz) || playerToUpdate.rating_temporiz,

        rating_liderazgo: Number(data.rating_liderazgo) || playerToUpdate.rating_liderazgo,
        rating_caracter: Number(data.rating_caracter) || playerToUpdate.rating_caracter,
        rating_competitiv: Number(data.rating_competitiv) || playerToUpdate.rating_competitiv,
        rating_companerismo: Number(data.rating_companerismo) || playerToUpdate.rating_companerismo,
        rating_mentalidad: Number(data.rating_mentalidad) || playerToUpdate.rating_mentalidad,
        rating_agresividad: Number(data.rating_agresividad) || playerToUpdate.rating_agresividad,
        rating_polivalencia: Number(data.rating_polivalencia) || playerToUpdate.rating_polivalencia,
        rating_inteligencia: Number(data.rating_inteligencia) || playerToUpdate.rating_inteligencia,
        rating_comunicacion: Number(data.rating_comunicacion) || playerToUpdate.rating_comunicacion,
        rating_personalidad: Number(data.rating_personalidad) || playerToUpdate.rating_personalidad,

        rating_juego_aereo: Number(data.rating_juego_aereo) || playerToUpdate.rating_juego_aereo,
        
        updated_at: new Date().toISOString()
      };

      setPlayers(prev => prev.map(p => p.id === updatedPlayer.id ? updatedPlayer : p));
      if (selectedPlayer?.id === updatedPlayer.id) {
        setSelectedPlayer(updatedPlayer);
      }

      // Persist Player update using the proper cleaning helper
      try {
        const cleanedPlayer = await preparePlayerForDB(updatedPlayer);
        if (isValidUUID(updatedPlayer.id)) {
          const { error } = await supabase.from('players').update(cleanedPlayer).eq('id', updatedPlayer.id);
          if (error) console.error('Error updating player from report:', error);
        } else {
          console.warn('Cannot update player in Supabase because ID is not a UUID:', updatedPlayer.id);
        }
      } catch (err) {
        console.error('Failed to persist player update in report save:', err);
      }
    }

    setActiveTab('reports');
    setReportToCreate(null);
    setEditingReport(null);
  };

  const handleAddVideo = async (videoData: Partial<Video>) => {
    const newVideo: Video = {
      id: `v-${Date.now()}`,
      player_id: videoData.player_id!,
      match_id: videoData.match_id,
      url: videoData.url!,
      platform: 'URL',
      title: videoData.title || 'Vídeo Scouting',
      is_key: videoData.is_key || false,
      pending_review: true,
      created_at: new Date().toISOString(),
    };
    setVideos([newVideo, ...videos]);
    setPlayers(prev => prev.map(p => p.id === videoData.player_id ? { ...p, has_video: true } : p));

    // Supabase
    await supabase.from('videos').insert([newVideo]);
  };

  const playerDetailProps = useMemo(() => {
    if (!selectedPlayer) return null;
    return {
      player: players.find(p => p.id === selectedPlayer.id) || selectedPlayer,
      reports: reports.filter(r => r.player_id === selectedPlayer.id),
      matches: matches.filter(m => (m.observed_players_ids || []).includes(selectedPlayer.id)),
      videos: videos.filter(v => v.player_id === selectedPlayer.id)
    };
  }, [selectedPlayer, players, reports, matches, videos]);

  const matchDetailProps = useMemo(() => {
    if (!selectedMatch) return null;
    return {
      match: selectedMatch,
      players: players.filter(p => p && (selectedMatch.observed_players_ids || []).includes(p.id)),
      reports: reports.filter(r => r.match_id === selectedMatch.id),
      videos: videos.filter(v => v.match_id === selectedMatch.id)
    };
  }, [selectedMatch, players, reports, videos]);

  const renderContent = () => {
    if (activeTab === 'player_detail' && selectedPlayer && playerDetailProps) {
      return <PlayerDetail 
        player={playerDetailProps.player} 
        reports={playerDetailProps.reports}
        matches={playerDetailProps.matches}
        videos={playerDetailProps.videos}
        initialTab={selectedPlayerTab}
        onBack={() => {
          setSelectedPlayer(null);
          setActiveTab('players');
        }} 
        onDelete={() => handleDeletePlayer(selectedPlayer.id)}
        onEdit={() => handleEditPlayer(selectedPlayer)}
        onCreateReport={() => handleCreateReport(selectedPlayer.id)}
        onAddVideo={(v) => handleAddVideo({ ...v, player_id: selectedPlayer.id })}
        onUpdatePlayer={handleUpdatePlayer}
      />;
    }

    if (activeTab === 'match_detail' && selectedMatch && matchDetailProps) {
      return <MatchDetail 
        match={matchDetailProps.match}
        players={matchDetailProps.players}
        reports={matchDetailProps.reports}
        videos={matchDetailProps.videos}
        onBack={() => setActiveTab('matches')}
        onAddPlayer={() => setIsQuickAddOpen(true)}
        onCreateReport={(pId) => handleCreateReport(pId, selectedMatch.id)}
        onAddVideo={(v) => handleAddVideo({ ...v, match_id: selectedMatch.id })}
        onSelectPlayer={handleSelectPlayer}
      />;
    }

    if (activeTab === 'report_form') {
      return <ReportForm 
        initialPlayerId={reportToCreate?.playerId}
        initialMatchId={reportToCreate?.matchId}
        initialMode={reportToCreate?.mode}
        initialReport={editingReport}
        players={players}
        matches={matches}
        onSave={handleSaveReport}
        onCancel={() => {
          setReportToCreate(null);
          setEditingReport(null);
          setActiveTab('reports');
        }}
      />;
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard 
          onSelectPlayer={handleSelectPlayer} 
          onSelectMatch={handleSelectMatch}
          onTabChange={setActiveTab}
          players={players} 
          matches={matches}
          reports={reports}
          videos={videos}
        />;
      case 'players':
        return <PlayerList 
          players={players} 
          onSelectPlayer={handleSelectPlayer} 
          onNewPlayer={() => setIsQuickAddOpen(true)} 
        />;
      case 'teams':
        return <TeamList />;
      case 'matches':
        return <MatchList 
          matches={matches} 
          onSelectMatch={handleSelectMatch}
          onNewMatch={() => {}} // TODO
        />;
      case 'reports':
        return <ReportList 
          reports={reports} 
          players={players} 
          matches={matches}
          onNewReport={() => handleCreateReport()}
          onEditReport={handleEditReport}
          onDeleteReport={handleDeleteReport}
          onMergeReports={handleMergeReports}
          onSelectPlayer={handleSelectPlayer}
        />;
      case 'settings':
      case 'users':
        return <SettingsPanel />;
      default:
        return <Dashboard 
          onSelectPlayer={handleSelectPlayer} 
          onSelectMatch={handleSelectMatch}
          onTabChange={setActiveTab}
          players={players} 
          matches={matches} 
          reports={reports} 
          videos={videos} 
        />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex text-slate-200 selection:bg-emerald-500/30">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} role={userRole} />
      
      <main className="flex-1 min-w-0 flex flex-col lg:h-screen bg-dot-pattern">
        <header className="h-20 border-b border-slate-800 flex items-center justify-between px-10 shrink-0 bg-slate-950/40 backdrop-blur-xl sticky top-0 z-30">
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-3 lg:hidden">
                <div className="w-9 h-9 bg-slate-900 rounded-lg flex items-center justify-center font-black text-emerald-500 italic border border-slate-800">U</div>
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-100 italic">U.D. SANTA MARIÑA</h2>
             </div>
             <div className="hidden lg:flex items-center gap-3">
                <div className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-[9px] font-black text-slate-500 uppercase tracking-widest">System</div>
                <div className="text-slate-800">/</div>
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">{activeTab}</span>
             </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-black text-slate-100 uppercase tracking-widest mb-0.5">Admin Session</p>
              <div className="flex items-center justify-end gap-2">
                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[9px] font-black text-emerald-500 uppercase tracking-tighter opacity-80">Online Tracking</p>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-black text-slate-100 italic cursor-pointer hover:border-emerald-500/50 transition-all shadow-inner">
              AU
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </div>

        <button 
          onClick={() => setIsQuickAddOpen(true)}
          className="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-emerald-600 text-slate-900 rounded-full shadow-2xl flex items-center justify-center z-40 active:scale-95 transition-transform"
        >
          <Plus size={28} strokeWidth={3} />
        </button>
      </main>

      <QuickAddModal 
        isOpen={isQuickAddOpen} 
        onClose={() => {
          setIsQuickAddOpen(false);
          setEditingPlayer(null);
        }} 
        onSave={handleSavePlayer}
        initialData={editingPlayer}
        matches={matches}
        currentMatchId={selectedMatch?.id}
      />
    </div>
  );
}
