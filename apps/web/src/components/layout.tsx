import React, { useState, useEffect, useCallback, useRef, createContext, useContext } from "react";
import {
  LayoutDashboard,
  Database,
  BrainCircuit,
  Zap,
  LogOut,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Bell,
  User,
  Settings,
  Menu,
  X,
  CheckCheck,
  Check,
  Moon,
  Sun,
  Trash2,
  Sparkles,
  AlertTriangle,
  Mail,
  Info,
  type LucideIcon,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AuthSession } from "../lib/api";
import { Portal } from "./ui/atoms/Portal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import { useToast } from "./ui";
import { useTheme } from "../lib/theme-provider";
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
        flex items-center gap-3 rounded-pro px-3 py-3 text-sm transition-all duration-200 min-h-[44px]
        ${active
          ? "bg-primary/10 text-primary font-medium"
          : "text-base-400 hover:bg-base-900 hover:text-base-50"}
      `}>
        <Icon className={`shrink-0 ${active ? "text-primary" : "text-base-500 group-hover:text-base-300"} h-5 w-5`} />
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
              className="p-3 text-base-400 hover:text-base-50 transition-colors touch-target flex items-center justify-center"
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
                <button 
                  onClick={() => setMobileOpen(false)} 
                  className="text-base-400 touch-target p-2 flex items-center justify-center" 
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 p-4 space-y-1">
                {nav.map((item) => (
                  <NavItem key={item.to} {...item} active={location.pathname === item.to} collapsed={false} />
                ))}
              </div>
              <div className="p-4 border-t border-base-800">
                <button 
                  onClick={onLogout} 
                  className="flex items-center gap-2 text-danger text-sm font-medium w-full px-3 py-3 rounded-pro hover:bg-danger/10 min-h-[44px]"
                >
                  <LogOut size={18} /> Sign Out
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
        <div className={`h-14 flex items-center justify-between border-b border-base-800 ${collapsed ? "px-2" : "px-4"}`}>
          <Link to="/" className={`flex min-w-0 items-center ${collapsed ? "" : "gap-2"}`}>
            <div className="h-7 w-7 rounded bg-primary flex items-center justify-center shrink-0">
              <Zap size={14} className="text-white" />
            </div>
            {!collapsed && <span className="font-bold text-base-50 text-sm tracking-tight uppercase truncate">Originate</span>}
          </Link>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-pro border border-base-800 bg-base-900 text-base-500 transition-colors hover:border-primary/40 hover:text-base-50"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
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
            onClick={onLogout}
            className={`flex w-full items-center rounded-pro py-3 text-sm text-base-400 hover:bg-danger/5 hover:text-danger transition-all group min-h-[44px] ${collapsed ? "justify-center px-0" : "gap-3 px-3"}`}
            aria-label="Sign out"
          >
            <LogOut size={18} className="group-hover:translate-x-0.5 transition-transform" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </motion.aside>
    </>
  );
}

// Lightweight popover: closes on outside click + Escape.
function usePopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const portalRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideTrigger = ref.current?.contains(target);
      const insidePortal = portalRef.current?.contains(target);
      if (!insideTrigger && !insidePortal) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return { open, setOpen, ref, portalRef };
}

// Notification Types
type NotificationType = 'training' | 'fraud' | 'email' | 'system' | 'success' | 'warning' | 'info';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  created_at: string;
  read: boolean;
  link?: string;
}

// Notification Context
interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}

export function NotificationProvider({ children, authToken }: { children: React.ReactNode; authToken?: string }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const shownNotificationIds = useRef<Set<string>>(new Set());

  // Fetch notifications
  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      if (!authToken) return { notifications: [], unreadCount: 0 };
      return apiFetch('/notifications', { token: authToken });
    },
    enabled: !!authToken,
    refetchInterval: 10000, // Poll every 10 seconds for new notifications
  });

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  // Show toast for new unread notifications
  useEffect(() => {
    if (!notifications.length) return;
    
    const unreadNotifications = notifications.filter((n: Notification) => !n.read);
    
    unreadNotifications.forEach((notif: Notification) => {
      // Only show toast if we haven't shown this notification before
      if (!shownNotificationIds.current.has(notif.id)) {
        shownNotificationIds.current.add(notif.id);
        
        const message = `${notif.title}: ${notif.message}`;
        
        switch (notif.type) {
          case 'training':
            toast.success(message, 6000);
            break;
          case 'fraud':
            toast.warning(message, 8000);
            break;
          case 'success':
            toast.success(message, 6000);
            break;
          case 'warning':
            toast.warning(message, 7000);
            break;
          case 'email':
          default:
            toast.info(message, 6000);
        }
      }
    });
  }, [notifications, toast]);

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!authToken) return;
      return apiFetch(`/notifications/${id}/read`, { method: 'PATCH', token: authToken });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!authToken) return;
      return apiFetch('/notifications/mark-all-read', { method: 'PATCH', token: authToken });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Delete notification mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!authToken) return;
      return apiFetch(`/notifications/${id}`, { method: 'DELETE', token: authToken });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAsRead = useCallback((id: string) => {
    markAsReadMutation.mutate(id);
  }, [markAsReadMutation]);

  const markAllAsRead = useCallback(() => {
    markAllAsReadMutation.mutate();
  }, [markAllAsReadMutation]);

  const clearNotification = useCallback((id: string) => {
    deleteMutation.mutate(id);
  }, [deleteMutation]);

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      unreadCount, 
      isLoading,
      markAsRead, 
      markAllAsRead,
      clearNotification,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

function NotificationsMenu() {
  const { open, setOpen, ref, portalRef } = usePopover();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotification } = useNotifications();
  const navigate = useNavigate();

  const handleNotificationClick = (notif: Notification) => {
    markAsRead(notif.id);
    if (notif.link) {
      navigate(notif.link);
    }
    setOpen(false);
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'training': return <Sparkles size={16} className="text-primary" />;
      case 'fraud': return <AlertTriangle size={16} className="text-warning" />;
      case 'email': return <Mail size={16} className="text-info" />;
      case 'success': return <Check size={16} className="text-success" />;
      default: return <Info size={16} className="text-base-400" />;
    }
  };

  const formatTime = (date: string) => {
    const now = new Date();
    const dateObj = new Date(date);
    const diff = now.getTime() - dateObj.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return dateObj.toLocaleDateString();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-base-400 hover:text-base-50 transition-colors p-2.5 relative touch-target flex items-center justify-center"
        aria-label="Notifications"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <motion.span 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-1.5 right-1.5 h-4 min-w-4 px-1 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>
      {open && (
        <Portal>
          <div
            ref={portalRef}
            role="menu"
            className="absolute right-0 mt-2 w-96 rounded-pro border border-base-800 bg-base-950 shadow-2xl z-50 overflow-hidden"
            style={{ top: 'var(--notifications-top, 60px)', right: 'var(--notifications-right, 16px)' }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-base-800 bg-base-900/30">
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-base-50 uppercase tracking-widest">Notifications</p>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 bg-primary/20 text-primary text-[10px] font-bold rounded">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold text-primary hover:text-primary/80 disabled:text-base-600 disabled:cursor-not-allowed transition-colors"
              >
                <CheckCheck size={12} /> Mark all read
              </button>
            </div>
            
            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-12 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-base-900 flex items-center justify-center">
                    <Bell size={20} className="text-base-600" />
                  </div>
                  <p className="text-sm text-base-300">You're all caught up</p>
                  <p className="mt-1 text-[11px] text-base-500">No new notifications.</p>
                </div>
              ) : (
                <div className="divide-y divide-base-800/50">
                  {notifications.map((notif) => (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`group flex items-start gap-3 p-3 hover:bg-base-900/50 transition-colors cursor-pointer ${
                        !notif.read ? 'bg-primary/5' : ''
                      }`}
                      onClick={() => handleNotificationClick(notif)}
                    >
                      <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                        !notif.read ? 'bg-primary/10' : 'bg-base-900'
                      }`}>
                        {getIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${!notif.read ? 'text-base-50' : 'text-base-300'}`}>
                          {notif.title}
                        </p>
                        <p className="text-xs text-base-500 mt-0.5 line-clamp-2">{notif.message}</p>
                        <p className="text-[10px] text-base-600 mt-1">{formatTime(notif.created_at)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearNotification(notif.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-base-600 hover:text-danger transition-opacity"
                      >
                        <Trash2 size={14} />
                      </button>
                      {!notif.read && (
                        <div className="shrink-0 w-2 h-2 rounded-full bg-primary mt-2" />
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
            
            {notifications.length > 0 && (
              <div className="px-4 py-2 border-t border-base-800 bg-base-900/30 text-center">
                <button
                  type="button"
                  onClick={() => {}}
                  className="text-[11px] text-base-500 hover:text-base-300 transition-colors"
                >
                  View all notifications →
                </button>
              </div>
            )}
          </div>
        </Portal>
      )}
    </div>
  );
}

function UserProfileMenu({ auth, onLogout }: { auth: any; onLogout: () => void }) {
  const { open, setOpen, ref, portalRef } = usePopover();
  const { resolvedTheme, toggleTheme } = useTheme();
  const user = auth?.session?.user;
  const initial = user?.fullName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "?";
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="h-10 w-10 rounded-full flex items-center justify-center cursor-pointer touch-target text-xs font-bold transition-colors"
        style={{ 
          backgroundColor: "var(--theme-bg-surface)",
          border: "1px solid var(--theme-border-default)",
          color: "var(--theme-primary)"
        }}
        aria-label="User profile"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {user ? initial : <User size={18} />}
      </button>
      {open && (
        <Portal>
          <div
            ref={portalRef}
            role="menu"
            className="absolute right-0 mt-2 w-64 rounded-pro shadow-xl z-50 overflow-hidden"
            style={{ 
              top: 'var(--profile-top, 60px)', 
              right: 'var(--profile-right, 16px)',
              backgroundColor: "var(--theme-bg-surface)",
              border: "1px solid var(--theme-border-default)"
            }}
          >
            <div 
              className="px-4 py-3 border-b"
              style={{ borderColor: "var(--theme-border-default)" }}
            >
              <p className="truncate text-sm font-semibold" style={{ color: "var(--theme-text-primary)" }}>
                {user?.fullName || "Guest"}
              </p>
              <p className="truncate text-[11px] font-mono" style={{ color: "var(--theme-text-dim)" }}>
                {user?.email}
              </p>
              {user?.role && (
                <p 
                  className="mt-1 inline-flex px-1.5 py-0.5 text-[9px] font-bold rounded uppercase tracking-widest"
                  style={{ 
                    color: "var(--theme-primary)",
                    backgroundColor: "var(--theme-primary-100, rgba(72, 101, 129, 0.1))"
                  }}
                >
                  {user.role}
                </p>
              )}
            </div>
            
            {/* Theme Toggle */}
            <button
              type="button"
              onClick={() => { toggleTheme(); }}
              role="menuitem"
              className="flex w-full items-center gap-2 px-4 py-3 text-sm transition-colors"
              style={{ color: "var(--theme-text-secondary)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--theme-bg-surface-raised)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              {resolvedTheme === "dark" ? <Moon size={16} /> : <Sun size={16} />}
              {resolvedTheme === "dark" ? "Dark Mode" : "Light Mode"}
            </button>
            
            {/* Profile Link */}
            <Link
              to="/app/profile"
              onClick={() => setOpen(false)}
              role="menuitem"
              className="flex w-full items-center gap-2 px-4 py-3 text-sm transition-colors"
              style={{ color: "var(--theme-text-secondary)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--theme-bg-surface-raised)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <Settings size={16} /> Profile Settings
            </Link>
            
            <div 
              className="border-t"
              style={{ borderColor: "var(--theme-border-default)" }}
            />
            
            <button
              type="button"
              onClick={() => { setOpen(false); onLogout(); }}
              role="menuitem"
              className="flex w-full items-center gap-2 px-4 py-3 text-sm transition-colors"
              style={{ color: "var(--theme-danger)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </Portal>
      )}
    </div>
  );
}

export function AppShell({ children, auth, onLogout }: { children: React.ReactNode, auth: any, onLogout: () => void }) {
  const location = useLocation();

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-base-950">
      <AppSidebar auth={auth} onLogout={onLogout} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-base-800 flex items-center justify-end px-4 lg:px-8 bg-base-950/50 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-4">
             <NotificationsMenu />
             <div className="h-8 w-[1px] bg-base-800 mx-2" aria-hidden="true" />
             <UserProfileMenu auth={auth} onLogout={onLogout} />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={eliteVariants.fadeInUp}
              initial="initial"
              animate="animate"
              exit="exit"
              className="decision-engine-grid py-4 sm:py-6 lg:py-8"
            >
              <>{children}</>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
