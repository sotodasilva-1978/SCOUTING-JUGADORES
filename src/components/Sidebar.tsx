import React from 'react';
import { LayoutDashboard, Users, UserPlus, ClipboardList, Shield, Settings, LogOut, Menu, X, ChevronRight, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

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
      <Icon className={cn("w-5 h-5 flex-shrink-0 transition-transform duration-300 group-hover:scale-110", isActive ? "text-emerald-500" : "text-slate-600 group-hover:text-slate-400")} />
      {!collapsed && (
        <span className={cn("ml-4 text-xs font-black uppercase tracking-widest transition-colors", isActive ? "text-emerald-500" : "group-hover:text-slate-200")}>
          {label}
        </span>
      )}
      {isActive && !collapsed && (
        <motion.div 
          layoutId="active-indicator"
          className="ml-auto w-1 h-1 rounded-full bg-emerald-500"
        />
      )}
    </button>
  );
}

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  role: string;
}

export const Sidebar = React.memo(function Sidebar({ activeTab, setActiveTab, role }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['SUPERADMIN', 'ADMIN_CLUB', 'SCOUT', 'GUEST'] },
    { id: 'players', label: 'Jugadores', icon: Users, roles: ['SUPERADMIN', 'ADMIN_CLUB', 'SCOUT', 'GUEST'] },
    { id: 'matches', label: 'Agenda', icon: Trophy, roles: ['SUPERADMIN', 'ADMIN_CLUB', 'SCOUT'] },
    { id: 'reports', label: 'Archivo', icon: ClipboardList, roles: ['SUPERADMIN', 'ADMIN_CLUB', 'SCOUT'] },
    { id: 'teams', label: 'Estructura', icon: Shield, roles: ['SUPERADMIN', 'ADMIN_CLUB'] },
  ];

  const adminItems = [
    { id: 'settings', label: 'Configuración', icon: Settings, roles: ['SUPERADMIN', 'ADMIN_CLUB'] },
  ];

  const filteredNav = navItems.filter(item => item.roles.includes(role));
  const filteredAdmin = adminItems.filter(item => item.roles.includes(role));

  return (
    <>
      {/* Mobile Trigger */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button 
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400"
        >
          {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Desktop */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? '80px' : '260px' }}
        className={cn(
          "hidden lg:flex flex-col h-screen sticky top-0 bg-slate-950 border-r border-slate-800 transition-all duration-300 z-40 overflow-hidden"
        )}
      >
        <div className="p-8 flex flex-col items-center text-center">
          {!isCollapsed && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-2"
            >
              <span className="font-black text-[16px] text-white italic tracking-tighter block leading-none uppercase">U.D. SANTA MARIÑA</span>
              <span className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.25em] opacity-90 block"> - AS SCOUT - </span>
            </motion.div>
          )}
          {isCollapsed && (
             <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center font-black text-emerald-500 italic text-xl shadow-lg border border-slate-800">U</div>
          )}
        </div>

        <nav className="flex-1 px-4 mt-4">
          <div className="space-y-1">
            {filteredNav.map(item => (
              <NavItem
                key={item.id}
                icon={item.icon}
                label={item.label}
                isActive={activeTab === item.id}
                onClick={() => setActiveTab(item.id)}
                collapsed={isCollapsed}
              />
            ))}
          </div>

          {(filteredAdmin.length > 0) && (
            <div className="mt-8">
              {!isCollapsed && <p className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Administración</p>}
              <div className="space-y-1">
                {filteredAdmin.map(item => (
                  <NavItem
                    key={item.id}
                    icon={item.icon}
                    label={item.label}
                    isActive={activeTab === item.id}
                    onClick={() => setActiveTab(item.id)}
                    collapsed={isCollapsed}
                  />
                ))}
              </div>
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-slate-800">
           <button 
             onClick={() => setIsCollapsed(!isCollapsed)}
             className="w-full flex items-center justify-center p-2 text-slate-500 hover:text-slate-200 transition-colors"
           >
             <ChevronRight className={cn("w-5 h-5 transition-transform duration-300", isCollapsed ? "rotate-0" : "rotate-180")} />
           </button>
           <button className="w-full flex items-center mt-4 p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all group">
             <LogOut className="w-5 h-5 flex-shrink-0" />
             {!isCollapsed && <span className="ml-3 font-medium">Cerrar sesión</span>}
           </button>
        </div>
      </motion.aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed inset-y-0 left-0 w-[280px] bg-slate-950 border-r border-slate-800 z-50 flex flex-col"
            >
              <div className="p-6 flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-slate-950">CS</div>
                <span className="font-bold text-xl text-slate-200">ClubScout</span>
                <button onClick={() => setIsMobileOpen(false)} className="ml-auto p-1 text-slate-500"><X size={20} /></button>
              </div>
              <nav className="flex-1 px-4 mt-4">
                <div className="space-y-1">
                  {navItems.map(item => (
                    <NavItem
                      key={item.id}
                      icon={item.icon}
                      label={item.label}
                      isActive={activeTab === item.id}
                      onClick={() => { setActiveTab(item.id); setIsMobileOpen(false); }}
                    />
                  ))}
                </div>
                <div className="mt-8">
                  <p className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Administración</p>
                  <div className="space-y-1">
                    {filteredAdmin.map(item => (
                      <NavItem
                        key={item.id}
                        icon={item.icon}
                        label={item.label}
                        isActive={activeTab === item.id}
                        onClick={() => { setActiveTab(item.id); setIsMobileOpen(false); }}
                      />
                    ))}
                  </div>
                </div>
              </nav>
              <div className="p-4 border-t border-slate-800">
                 <button className="w-full flex items-center p-3 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all">
                   <LogOut className="w-5 h-5" />
                   <span className="ml-3 font-medium">Cerrar sesión</span>
                 </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
});
