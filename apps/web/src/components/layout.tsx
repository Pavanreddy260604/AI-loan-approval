import React, { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard,
  Database,
  BrainCircuit,
  Zap,
  LogOut,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Search,
  Bell,
  User,
  type LucideIcon,
  Menu,
  X
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AuthSession } from "../lib/api";

import { useBreakpoint } from "../hooks/useBreakpoint";
import { variants as eliteVariants } from "../lib/animations/transitions";

interface NavItemProps {
  to: string;
  icon: LucideIcon;
  label: string;
  active: boolean;
  collapsed: boolean;
  onClick?: () => void;
}

function NavItem({ to, icon: Icon, label, active, collapsed, onClick }: NavItemProps) {
  return (
    <Link to={to} className="block group" onClick={onClick}>
      <div className={`
        flex items-center gap-3 rounded-pro px-3 py-2 text-sm transition-all duration-200
        ${active
          ? "bg-primary/10 text-primary font-medium"
          : "text-base-400 hover:bg-base-900 hover:text-base-50"}
      `}>
        <Icon className={`shrink-0 ${active ? "text-primary" : "text-base-500 group-hover:text-base-300"} h-4 w-4`} />
        {!collapsed && <span className="truncate">{label}</span>}
      </div>
    </Link>
  );
}

function getNavigation(role: string | undefined) {
  const nav = [
    { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/app/datasets", label: "Datasets", icon: Database },
    { to: "/app/models", label: "Models", icon: BrainCircuit },
    { to: "/app/predict", label: "Predictions", icon: Zap },
  ];

  if (role === "ADMIN" || role === "OFFICER") {
    nav.push({ to: "/app/admin", label: "Admin", icon: ShieldAlert });
  }

  return nav;
}

interface AppSidebarProps {
  auth: {
    session: AuthSession | null;
  };
  onLogout?: () => void;
}

export function AppSidebar({ auth, onLogout }: AppSidebarProps) {
  const location = useLocation();
  const { isDesktop, isMobile } = useBreakpoint();
  const nav = getNavigation(auth.session?.user.role);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const userInitial = auth.session?.user.fullName?.[0] || "?";

  // Auto-close mobile sidebar on navigation or when switching to desktop
  useEffect(() => {
    if (isDesktop && mobileOpen) {
      setMobileOpen(false);
    }
  }, [isDesktop, mobileOpen]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Close mobile menu on Escape key
  useEffect(() => {
    if (!mobileOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [mobileOpen]);

  return (
    <>
      {/* Mobile Top Bar */}
      <AnimatePresence>
        {isMobile && (
          <motion.div
            initial={{ y: -60 }}
            animate={{ y: 0 }}
            exit={{ y: -60 }}
            className="lg:hidden flex items-center justify-between px-4 h-14 bg-base-950/80 backdrop-blur-md border-b border-base-800 sticky top-0 z-50 w-full"
          >
            <Link to="/" className="flex items-center gap-2">
              <div className="h-7 w-7 rounded bg-primary flex items-center justify-center">
                <Zap size={14} className="text-white" />
              </div>
              <span className="font-bold text-base-50 text-sm tracking-tight">ORIGINATE</span>
            </Link>
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 text-base-400 hover:text-base-50 transition-colors"
              aria-label="Open mobile menu"
            >
              <Menu size={20} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              className="absolute left-0 top-0 h-full w-64 bg-base-950 border-r border-base-800 flex flex-col"
            >
              <div className="p-4 border-b border-base-800 flex items-center justify-between">
                <span className="font-bold text-base-50 text-sm tracking-tight">ORIGINATE</span>
                <button onClick={() => setMobileOpen(false)} className="text-base-400" aria-label="Close menu"><X size={20} /></button>
              </div>
              <div className="flex-1 p-4 space-y-1">
                {nav.map((item) => (
                  <NavItem key={item.to} {...item} active={location.pathname === item.to} collapsed={false} />
                ))}
              </div>
              <div className="p-4 border-t border-base-800">
                <button onClick={onLogout} className="flex items-center gap-2 text-danger text-sm font-medium w-full px-3 py-2 rounded-pro hover:bg-danger/10">
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 240 }}
        transition={{ type: "tween", duration: 0.2 }}
        className={`${isDesktop ? 'flex' : 'hidden'} flex-col bg-base-950 border-r border-base-800 h-screen sticky top-0 z-40 will-change-[width]`}
      >
        <div className="h-14 flex items-center justify-between px-6 border-b border-base-800">
          {!collapsed && (
            <Link to="/" className="flex items-center gap-2">
              <div className="h-7 w-7 rounded bg-primary flex items-center justify-center">
                <Zap size={14} className="text-white" />
              </div>
              <span className="font-bold text-base-50 text-sm tracking-tight uppercase">Originate</span>
            </Link>
          )}
          {collapsed && (
            <div className="h-7 w-7 rounded bg-primary flex items-center justify-center mx-auto">
              <Zap size={14} className="text-white" />
            </div>
          )}
        </div>

        <div className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          <p className={`px-3 mb-4 text-[10px] font-bold text-base-600 uppercase tracking-widest ${collapsed ? 'text-center' : ''}`}>
            {collapsed ? 'MENU' : 'Main Menu'}
          </p>
          {nav.map((item) => (
            <NavItem
              key={item.to}
              {...item}
              active={location.pathname === item.to}
              collapsed={collapsed}
            />
          ))}
        </div>

        <div className="mt-auto border-t border-base-800 p-4 space-y-4">
          <div className={`flex items-center gap-3 px-2 py-1.5 rounded-pro ${collapsed ? 'justify-center' : ''}`}>
            <div className="h-8 w-8 rounded-full bg-base-900 border border-base-800 flex items-center justify-center text-xs font-bold text-primary shrink-0">
              {userInitial}
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-base-50">{auth.session?.user.fullName}</p>
                <p className="truncate text-[10px] text-base-500 font-mono uppercase tabular-nums">{auth.session?.user.role}</p>
              </div>
            )}
          </div>

          <button
                onClick={() => setCollapsed(!collapsed)}
                className="w-full flex items-center justify-center h-8 text-base-500 hover:text-base-300 hover:bg-base-900 rounded-pro transition-colors"
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>

          {!collapsed && (
            <button
              onClick={onLogout}
              className="flex w-full items-center gap-3 rounded-pro px-3 py-2 text-sm text-base-400 hover:bg-danger/5 hover:text-danger transition-all group"
            >
              <LogOut size={16} className="group-hover:translate-x-0.5 transition-transform" />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </motion.aside>
    </>
  );
}

export function AppShell({ children, auth, onLogout }: { children: React.ReactNode, auth: any, onLogout: () => void }) {
  const { isDesktop } = useBreakpoint();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/app/predict?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  }, [searchQuery, navigate]);

  // Focus search on "/" key
  useEffect(() => {
    const handleSlash = (e: KeyboardEvent) => {
      if (e.key === "/" && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        document.getElementById("global-search")?.focus();
      }
    };
    window.addEventListener("keydown", handleSlash);
    return () => window.removeEventListener("keydown", handleSlash);
  }, []);

  return (
    <div className="flex min-h-screen bg-base-950">
      <AppSidebar auth={auth} onLogout={onLogout} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-base-800 flex items-center justify-between px-4 lg:px-8 bg-base-950/50 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-4 flex-1">
             {isDesktop && (
               <form onSubmit={handleSearch} className="flex items-center gap-2 max-w-sm w-full bg-base-900 border border-base-800 rounded-pro px-3 py-1.5 text-base-500 focus-within:border-primary/50 transition-colors">
                   <Search size={14} />
                   <input
                     id="global-search"
                     type="text"
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     placeholder="Search loans or datasets..."
                     className="bg-transparent border-none text-xs focus:ring-0 w-full outline-none"
                     aria-label="Search loans or datasets"
                   />
                   <span className="text-[10px] font-mono border border-base-800 rounded px-1" aria-hidden="true">/</span>
               </form>
             )}
          </div>
          <div className="flex items-center gap-4">
             <button
                className="text-base-400 hover:text-base-50 transition-colors p-2 relative"
                aria-label="Notifications"
             >
                <Bell size={18} />
                <span className="absolute top-2 right-2 h-1.5 w-1.5 bg-primary rounded-full" aria-hidden="true" />
             </button>
             <div className="h-8 w-[1px] bg-base-800 mx-2" aria-hidden="true" />
             <div
               className="h-8 w-8 rounded-full bg-base-900 border border-base-800 flex items-center justify-center cursor-pointer"
               role="button"
               aria-label="User profile"
               tabIndex={0}
             >
                <User size={16} />
             </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={eliteVariants.fadeInUp}
              initial="initial"
              animate="animate"
              exit="exit"
              className="decision-engine-grid py-8"
            >
              <>{children}</>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
