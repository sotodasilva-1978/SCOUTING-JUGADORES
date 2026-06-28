import React from 'react';
import { LayoutDashboard, Users, ClipboardList, Shield, Settings, LogOut, X, ChevronRight, Trophy, Crosshair, MoreHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, getRoleLabel } from '../lib/utils';
import type { Profile } from '../types';

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  onClick: () => void;
  collapsed?: boolean;
  key?: string;
}

function NavItem({ icon: Icon, label, isActive, onClick, collapsed }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center w-full px-3 py-3 my-1 transition-all duration-300 rounded-xl group relative overflow-hidden",
        isActive
          ? "bg-emerald-500/10 text-emerald-500"
          : "text-slate-500 hover:bg-slate-900 hover:text-slate-200"
      )}
    >
      {isActive && (
        <motion.div layoutId="active-rail" className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-emerald-500" />
      )}
      <Icon className={cn("w-5 h-5 flex-shrink-0 transition-transform duration-300 group-hover:scale-110", isActive ? "text-emerald-500" : "text-slate-600 group-hover:text-slate-400")} />
      {!collapsed && (
        <span className={cn("ml-4 text-xs font-black uppercase tracking-widest transition-colors", isActive ? "text-emerald-500" : "group-hover:text-slate-200")}>
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
  onLogout: () => void;
}

// Ítems principales mostrados en la barra inferior móvil (máx. 4 + "Más")
const MOBILE_PRIMARY = ['dashboard', 'players', 'matches', 'reports'];

function BrandMark({ size = 44 }: { size?: number }) {
  return (
    <img
      src="/icon-master.png"
      alt="AS PRO SCOUT"
      className="rounded-2xl shrink-0 object-cover shadow-lg shadow-slate-950/40"
      style={{ width: size, height: size }}
    />
  );
}

export const Sidebar = React.memo(function Sidebar({ activeTab, setActiveTab, role, userProfile, onLogout }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const ALL_ROLES = ['ADMIN', 'COORD', 'COORD_F11', 'COORD_F8', 'PRESID', 'ENTREN', 'SCOUT', 'SCOUT_F11', 'SCOUT_F8'];
  const SCOUTS_AND_UP = ['ADMIN', 'COORD', 'COORD_F11', 'COORD_F8', 'PRESID', 'SCOUT', 'SCOUT_F11', 'SCOUT_F8'];

  const navItems = [
    { id: 'dashboard',    label: 'Dashboard', icon: LayoutDashboard, roles: ALL_ROLES },
    { id: 'players',      label: 'Jugadores', icon: Users,           roles: ALL_ROLES },
    { id: 'comparativas', label: 'Comparar',  icon: Crosshair,       roles: SCOUTS_AND_UP },
    { id: 'matches',      label: 'Agenda',    icon: Trophy,          roles: ALL_ROLES },
    { id: 'reports',      label: 'Archivo',   icon: ClipboardList,   roles: ALL_ROLES },
    { id: 'teams',        label: 'Clubes',    icon: Shield,          roles: ['ADMIN', 'COORD', 'COORD_F11', 'COORD_F8'] },
  ];

  const adminItems = [
    { id: 'settings', label: 'Configuración', icon: Settings, roles: ['ADMIN'] },
  ];

  const filteredNav = navItems.filter(item => item.roles.includes(role));
  const filteredAdmin = adminItems.filter(item => item.roles.includes(role));

  const mobilePrimary = filteredNav.filter(i => MOBILE_PRIMARY.includes(i.id));
  const mobileExtra = [...filteredNav.filter(i => !MOBILE_PRIMARY.includes(i.id)), ...filteredAdmin];

  const go = (id: string) => { setActiveTab(id); setIsMobileMenuOpen(false); };

  return (
    <>
      {/* ── Sidebar Escritorio ─────────────────────────────────────────── */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? '84px' : '264px' }}
        className="hidden lg:flex flex-col h-screen sticky top-0 bg-slate-950/80 backdrop-blur-xl border-r border-slate-800/80 transition-all duration-300 z-40 overflow-hidden"
      >
        <div className={cn("px-5 pt-7 pb-5 flex items-center gap-3", isCollapsed && "justify-center px-0")}>
          <BrandMark size={isCollapsed ? 46 : 54} />
          {!isCollapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0">
              <span className="font-black text-[15px] text-white italic tracking-tighter block leading-none uppercase truncate">U.D. Santa Mariña</span>
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.28em] block mt-1">AS Pro Scout</span>
            </motion.div>
          )}
        </div>

        <nav className="flex-1 px-4 mt-2">
          <div className="space-y-1">
            {filteredNav.map(item => (
              <NavItem key={item.id} icon={item.icon} label={item.label}
                isActive={activeTab === item.id} onClick={() => setActiveTab(item.id)} collapsed={isCollapsed} />
            ))}
          </div>

          {filteredAdmin.length > 0 && (
            <div className="mt-8">
              {!isCollapsed && <p className="px-3 mb-2 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Administración</p>}
              <div className="space-y-1">
                {filteredAdmin.map(item => (
                  <NavItem key={item.id} icon={item.icon} label={item.label}
                    isActive={activeTab === item.id} onClick={() => setActiveTab(item.id)} collapsed={isCollapsed} />
                ))}
              </div>
            </div>
          )}
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
            onClick={onLogout}
            className={cn("w-full flex items-center mt-3 p-2 text-rose-500/80 hover:bg-rose-500/10 rounded-lg transition-all", isCollapsed && "justify-center")}>
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="ml-3 text-xs font-black uppercase tracking-widest">Salir</span>}
          </button>
        </div>
      </motion.aside>

      {/* ── Barra de navegación inferior (Móvil/Tablet) ────────────────── */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800 safe-pb">
        <div className="grid grid-cols-5 px-1 pt-1">
          {mobilePrimary.map(item => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button key={item.id} onClick={() => go(item.id)}
                className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl active:scale-95 transition-transform">
                <Icon size={21} className={cn("transition-colors", active ? "text-emerald-500" : "text-slate-500")} strokeWidth={active ? 2.6 : 2} />
                <span className={cn("text-[9px] font-black uppercase tracking-wider", active ? "text-emerald-500" : "text-slate-600")}>{item.label}</span>
              </button>
            );
          })}
          <button onClick={() => setIsMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl active:scale-95 transition-transform">
            <MoreHorizontal size={21} className={cn(mobileExtra.some(i => i.id === activeTab) ? "text-emerald-500" : "text-slate-500")} strokeWidth={2} />
            <span className={cn("text-[9px] font-black uppercase tracking-wider", mobileExtra.some(i => i.id === activeTab) ? "text-emerald-500" : "text-slate-600")}>Más</span>
          </button>
        </div>
      </nav>

      {/* ── Hoja "Más" (Móvil) ──────────────────────────────────────────── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 280 }}
              className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-slate-900 border-t border-slate-800 rounded-t-3xl p-5 safe-pb"
            >
              <div className="flex items-center gap-3 mb-5">
                <BrandMark size={44} />
                <div className="min-w-0">
                  <p className="font-black text-sm text-white italic uppercase tracking-tighter leading-none">U.D. Santa Mariña</p>
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.28em] mt-1">Pro Scout</p>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="ml-auto p-2 text-slate-500 hover:text-white"><X size={20} /></button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {mobileExtra.map(item => {
                  const Icon = item.icon;
                  const active = activeTab === item.id;
                  return (
                    <button key={item.id} onClick={() => go(item.id)}
                      className={cn("flex flex-col items-center gap-2 py-4 rounded-2xl border transition-all active:scale-95",
                        active ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-500" : "bg-slate-950/60 border-slate-800 text-slate-400")}>
                      <Icon size={22} strokeWidth={2.2} />
                      <span className="text-[10px] font-black uppercase tracking-wider text-center leading-tight">{item.label}</span>
                    </button>
                  );
                })}
              </div>
              <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 mt-4 p-3 text-rose-500 bg-rose-500/5 border border-rose-500/20 rounded-2xl transition-all active:scale-95">
                <LogOut className="w-4 h-4" />
                <span className="text-xs font-black uppercase tracking-widest">Cerrar sesión</span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
});
