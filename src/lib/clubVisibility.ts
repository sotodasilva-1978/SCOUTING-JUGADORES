import { supabase } from './supabase';

export type ClubVisibilityRow = {
  club_id: string;
  is_visible: boolean;
};

export type VisibleClubRecord = {
  id: string;
  name: string;
  location?: string | null;
  province?: string | null;
  autonomous_community?: string | null;
  country?: string | null;
  logo_url?: string | null;
  ref_code?: string | null;
  is_visible: boolean;
};

export async function fetchClubVisibilityMap(clientId?: string | null) {
  if (!clientId) return new Map<string, boolean>();

  const { data, error } = await supabase
    .from('client_club_visibility')
    .select('club_id, is_visible')
    .eq('client_id', clientId);

  if (error) {
    console.error('Error cargando visibilidad de clubes:', error);
    return new Map<string, boolean>();
  }

  return new Map(
    ((data || []) as ClubVisibilityRow[]).map((row) => [row.club_id, row.is_visible]),
  );
}

export async function fetchClubsWithVisibility(clientId?: string | null): Promise<VisibleClubRecord[]> {
  const visibilityMap = await fetchClubVisibilityMap(clientId);

  const extended = await supabase
    .from('clubs')
    .select('id, name, location, province, autonomous_community, country, logo_url, ref_code')
    .order('name', { ascending: true });

  let clubsData: any[] | null = null;
  if (extended.error) {
    console.warn('Columnas extendidas de clubs no disponibles. Usando consulta basica.', extended.error);
    const basic = await supabase
      .from('clubs')
      .select('id, name, location, logo_url, ref_code')
      .order('name', { ascending: true });
    clubsData = basic.data;
  } else {
    clubsData = extended.data;
  }

  return ((clubsData || []) as any[]).map((club) => ({
    ...club,
    is_visible: visibilityMap.get(club.id) ?? true,
  }));
}

export async function fetchVisibleClubNames(clientId?: string | null) {
  const clubs = await fetchClubsWithVisibility(clientId);
  return clubs.filter((club) => club.is_visible).map((club) => club.name);
}

export async function setClubVisibilityForClient(clientId: string, clubId: string, isVisible: boolean) {
  const { error } = await supabase
    .from('client_club_visibility')
    .upsert(
      [{ client_id: clientId, club_id: clubId, is_visible: isVisible }],
      { onConflict: 'client_id,club_id' },
    );

  if (error) throw error;
}
