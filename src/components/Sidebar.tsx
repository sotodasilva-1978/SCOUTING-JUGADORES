import React from 'react';
import { LayoutDashboard, Users, ClipboardList, Shield, Settings, LogOut, ChevronRight, Trophy, Crosshair, Building2, KeyRound, LayoutTemplate } from 'lucide-react';
import { motion } from 'motion/react';
import { cn, getRoleLabel } from '../lib/utils';
import type { Profile, Client } from '../types';
import { ChangePasswordModal } from './ChangePasswordModal';

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  onClick: () => void;
  collapsed?: boolean;
}

function NavItem({ icon: Icon, label, isActive, onClick, collapsed }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center w-full px-3 py-3 my-1 transition-all duration-300 rounded-xl group relative overflow-hidden",
        isActive
          ? "bg-[var(--club-primary,#10b981)]/10 text-[var(--club-primary,#10b981)]"
          : "text-slate-500 hover:bg-slate-900 hover:text-slate-200"
      )}
    >
      {isActive && (
        <motion.div layoutId="active-rail" className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-[var(--club-primary,#10b981)]" />
      )}
      <Icon className={cn("w-5 h-5 flex-shrink-0 transition-transform duration-300 group-hover:scale-110", isActive ? "text-[var(--club-primary,#10b981)]" : "text-slate-600 group-hover:text-slate-400")} />
      {!collapsed && (
        <span className={cn("ml-4 text-xs font-black uppercase tracking-widest transition-colors", isActive ? "text-[var(--club-primary,#10b981)]" : "group-hover:text-slate-200")}>
          {label}
        </span>
      )}
    </button>
  );
}

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  role: string;
  userProfile: Profile | null;
  client?: Client | null;
  allClients?: Client[];
  viewAsClubId?: string | null;
  onChangeViewAsClub?: (clubId: string) => void;
  onLogout: () => void;
}

function BrandMark({ size = 44, logoUrl }: { size?: number; logoUrl?: string | null }) {
  return (
    <img
      src={logoUrl || '/icon-master.png'}
      alt="Escudo del club"
      className="rounded-2xl shrink-0 object-cover shadow-lg shadow-slate-950/40"
      style={{ width: size, height: size }}
      onError={(e) => { e.currentTarget.src = '/icon-master.png'; }}
    />
  );
}

export const Sidebar = React.memo(function Sidebar({ activeTab, setActiveTab, role, userProfile, client, allClients, viewAsClubId, onChangeViewAsClub, onLogout }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [showChangePassword, setShowChangePassword] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Drag-to-scroll state
  const isDragging = React.useRef(false);
  const startX = React.useRef(0);
  const scrollLeft = React.useRef(0);
  const dragMoved = React.useRef(false);

  const ALL_ROLES = ['ADMIN', 'COORD', 'COORD_F11', 'COORD_F8', 'PRESID', 'ENTREN', 'SCOUT', 'SCOUT_F11', 'SCOUT_F8', 'SUPERADMIN'];
  const SCOUTS_AND_UP = ['ADMIN', 'COORD', 'COORD_F11', 'COORD_F8', 'PRESID', 'SCOUT', 'SCOUT_F11', 'SCOUT_F8', 'SUPERADMIN'];

  const navItems = [
    { id: 'dashboard',    label: 'Dashboard', icon: LayoutDashboard, roles: ALL_ROLES },
    { id: 'players',      label: 'Jugadores', icon: Users,           roles: ALL_ROLES },
    { id: 'comparativas', label: 'Comparar',  icon: Crosshair,       roles: SCOUTS_AND_UP },
    { id: 'mbt',          label: 'MBT',       icon: LayoutTemplate,  roles: ALL_ROLES },
    { id: 'matches',      label: 'Agenda',    icon: Trophy,          roles: ALL_ROLES },
    { id: 'reports',      label: 'Archivo',   icon: ClipboardList,   roles: ALL_ROLES },
    { id: 'teams',        label: 'Clubes',    icon: Shield,          roles: ['ADMIN', 'COORD', 'COORD_F11', 'COORD_F8', 'SUPERADMIN'] },
    { id: 'settings',     label: 'Config.',   icon: Settings,        roles: ['ADMIN', 'SUPERADMIN'] },
    { id: 'platform',     label: 'Plataforma', icon: Building2,      roles: ['SUPERADMIN'] },
  ];

  const filteredNav = navItems.filter(item => item.roles.includes(role));

  // Scroll active item into view when tab changes
  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const activeEl = el.querySelector<HTMLElement>('[data-active="true"]');
    if (activeEl) {
      const elLeft = activeEl.offsetLeft;
      const elWidth = activeEl.offsetWidth;
      const containerWidth = el.offsetWidth;
      el.scrollTo({ left: elLeft - containerWidth / 2 + elWidth / 2, behavior: 'smooth' });
    }
  }, [activeTab]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!scrollRef.current) return;
    isDragging.current = true;
    dragMoved.current = false;
    startX.current = e.clientX;
    scrollLeft.current = scrollRef.current.scrollLeft;
    scrollRef.current.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current || !scrollRef.current) return;
    const dx = e.clientX - startX.current;
    if (Math.abs(dx) > 4) dragMoved.current = true;
    scrollRef.current.scrollLeft = scrollLeft.current - dx;
  };

  const handlePointerUp = () => { isDragging.current = false; };

  const handleItemClick = (id: string) => {
    if (dragMoved.current) return;
    setActiveTab(id);
  };

  return (
    <>
      {/* ── Sidebar Escritorio ─────────────────────────────────────────── */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? '84px' : '264px' }}
        className="hidden lg:flex flex-col h-screen sticky top-0 bg-slate-950/80 backdrop-blur-xl border-r border-slate-800/80 transition-all duration-300 z-40 overflow-hidden"
      >
        <div className={cn("px-5 pt-7 pb-5 flex items-center gap-3", isCollapsed && "justify-center px-0")}>
          <BrandMark size={isCollapsed ? 46 : 54} logoUrl={client?.logo_url} />
          {!isCollapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0">
              <span className="font-black text-[15px] text-white italic tracking-tighter block leading-none uppercase truncate">{client?.name || 'AS Pro Scout'}</span>
              <span className="text-[10px] font-black uppercase tracking-[0.28em] block mt-1" style={{ color: 'var(--club-primary, #10b981)' }}>AS Pro Scout</span>
            </motion.div>
          )}
        </div>

        {role === 'SUPERADMIN' && allClients && allClients.length > 0 && !isCollapsed && (
          <div className="px-5 pb-4">
            <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-1">Ver como cliente</label>
            <select
              value={viewAsClubId ?? ''}
              onChange={(e) => onChangeViewAsClub?.(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-2 text-[11px] font-bold text-slate-200 outline-none focus:border-emerald-500/60"
            >
              {allClients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        <nav className="flex-1 px-4 mt-2 overflow-y-auto overflow-x-hidden" style={{ scrollbarWidth: 'none' }}>
          <div className="space-y-1">
            {filteredNav.map(item => (
              <NavItem key={item.id} icon={item.icon} label={item.label}
                isActive={activeTab === item.id} onClick={() => setActiveTab(item.id)} collapsed={isCollapsed} />
            ))}
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800/80">
          {!isCollapsed && userProfile && (
            <div className="mb-3 px-2 py-2 rounded-xl bg-slate-900/60 border border-slate-800">
              <p className="text-xs font-bold text-slate-200 truncate">{userProfile.full_name}</p>
              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">{getRoleLabel(userProfile.role)}</span>
            </div>
          )}
          <button onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full flex items-center justify-center p-2 text-slate-500 hover:text-slate-200 transition-colors">
            <ChevronRight className={cn("w-5 h-5 transition-transform duration-300", isCollapsed ? "rotate-0" : "rotate-180")} />
          </button>
          <button
            onClick={() => setShowChangePassword(true)}
            className={cn("w-full flex items-center mt-3 p-2 text-slate-500 hover:bg-slate-800/60 hover:text-slate-200 rounded-lg transition-all", isCollapsed && "justify-center")}>
            <KeyRound className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="ml-3 text-xs font-black uppercase tracking-widest">Contraseña</span>}
          </button>
          <button
            onClick={onLogout}
            className={cn("w-full flex items-center mt-1 p-2 text-rose-500/80 hover:bg-rose-500/10 rounded-lg transition-all", isCollapsed && "justify-center")}>
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="ml-3 text-xs font-black uppercase tracking-widest">Salir</span>}
          </button>
        </div>
      </motion.aside>

      {/* ── Barra inferior móvil con scroll + drag ─────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 safe-pb">
        {/* Fade izquierda */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 z-10 bg-gradient-to-r from-slate-950 to-transparent" />
        {/* Fade derecha */}
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 z-10 bg-gradient-to-l from-slate-950 to-transparent" />

        <div
          ref={scrollRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="flex overflow-x-auto select-none cursor-grab active:cursor-grabbing px-3 py-1.5 gap-1"
          style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          {filteredNav.map(item => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                data-active={active}
                onClick={() => handleItemClick(item.id)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2.5 rounded-2xl transition-all active:scale-95 flex-shrink-0 relative",
                  active ? "bg-emerald-500/10" : "hover:bg-slate-800/60"
                )}
                style={{ minWidth: 68 }}
              >
                {active && (
                  <motion.div
                    layoutId="mobile-active-pill"
                    className="absolute inset-0 rounded-2xl bg-emerald-500/10 border border-emerald-500/20"
                    transition={{ type: 'spring', stiffness: 380, damping: 36 }}
                  />
                )}
                <Icon
                  size={20}
                  className={cn("relative z-10 transition-colors", active ? "text-emerald-400" : "text-slate-500")}
                  strokeWidth={active ? 2.6 : 2}
                />
                <span className={cn("relative z-10 text-[9px] font-black uppercase tracking-wider leading-none", active ? "text-emerald-400" : "text-slate-600")}>
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* Botón Contraseña */}
          <button
            onClick={() => setShowChangePassword(true)}
            className="flex flex-col items-center justify-center gap-1 py-2.5 px-3 rounded-2xl flex-shrink-0 text-slate-500 hover:bg-slate-800/60 hover:text-slate-200 transition-all active:scale-95"
            style={{ minWidth: 60 }}
          >
            <KeyRound size={18} strokeWidth={2} />
            <span className="text-[9px] font-black uppercase tracking-wider leading-none">Clave</span>
          </button>

          {/* Botón Salir al final */}
          <button
            onClick={onLogout}
            className="flex flex-col items-center justify-center gap-1 py-2.5 px-3 rounded-2xl flex-shrink-0 text-rose-500/60 hover:bg-rose-500/10 hover:text-rose-400 transition-all active:scale-95"
            style={{ minWidth: 60 }}
          >
            <LogOut size={18} strokeWidth={2} />
            <span className="text-[9px] font-black uppercase tracking-wider leading-none">Salir</span>
          </button>
        </div>
      </nav>

      {showChangePassword && userProfile && (
        <ChangePasswordModal email={userProfile.email} onClose={() => setShowChangePassword(false)} />
      )}
    </>
  );
});
