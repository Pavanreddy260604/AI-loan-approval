import { useState } from "react";
import { motion } from "framer-motion";
import { 
  User, 
  Moon, 
  Sun, 
  Monitor,
  Mail,
  Shield,
  Bell,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { Card } from "../components/ui/molecules/Card";
import { useTheme } from "../lib/theme-provider";
import { useToast } from "../components/ui/molecules/Toast";
import type { AuthSession } from "../lib/api";

interface ProfilePageProps {
  auth: {
    session: AuthSession | null;
    setSession: (next: AuthSession | null) => void;
  };
}

type ThemeOption = "light" | "dark" | "system";

export function ProfilePage({ auth }: ProfilePageProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<"appearance" | "account" | "notifications">("appearance");
  
  const user = auth.session?.user;

  const handleThemeChange = (newTheme: ThemeOption) => {
    setTheme(newTheme);
    toast.success(`Theme set to ${newTheme === "system" ? "System Preference" : newTheme === "light" ? "Light" : "Dark"} Mode`);
  };

  const themeOptions: { value: ThemeOption; label: string; icon: React.ReactNode; description: string }[] = [
    { 
      value: "light", 
      label: "Light", 
      icon: <Sun size={18} />,
      description: "Clean, bright interface"
    },
    { 
      value: "dark", 
      label: "Dark", 
      icon: <Moon size={18} />,
      description: "Easy on the eyes"
    },
    { 
      value: "system", 
      label: "System", 
      icon: <Monitor size={18} />,
      description: "Match OS setting"
    },
  ];

  const tabs = [
    { id: "appearance" as const, label: "Appearance", icon: Sun },
    { id: "account" as const, label: "Account", icon: User },
    { id: "notifications" as const, label: "Notifications", icon: Bell },
  ];

  return (
    <div className="decision-engine-grid py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--theme-text-primary)" }}>
          Profile Settings
        </h1>
        <p style={{ color: "var(--theme-text-muted)" }}>
          Manage your account preferences and appearance
        </p>
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-6">
        {/* Sidebar */}
        <div className="space-y-4">
          {/* User Card */}
          <Card className="p-5">
            <div className="flex items-center gap-4">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ 
                  backgroundColor: "var(--theme-bg-surface-raised)",
                  border: "1px solid var(--theme-border-default)"
                }}
              >
                <User size={24} style={{ color: "var(--theme-primary)" }} />
              </div>
              <div>
                <p className="font-semibold" style={{ color: "var(--theme-text-primary)" }}>
                  {user?.email?.split("@")[0] || "User"}
                </p>
                <p className="text-sm" style={{ color: "var(--theme-text-muted)" }}>
                  {user?.email}
                </p>
              </div>
            </div>
          </Card>

          {/* Navigation */}
          <Card className="p-2">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
                    style={{
                      backgroundColor: isActive ? "var(--theme-bg-surface-raised)" : "transparent",
                      color: isActive ? "var(--theme-text-primary)" : "var(--theme-text-muted)",
                    }}
                  >
                    <Icon size={18} />
                    {tab.label}
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="ml-auto w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: "var(--theme-primary)" }}
                      />
                    )}
                  </button>
                );
              })}
            </nav>
          </Card>

          {/* Current Theme Indicator */}
          <Card className="p-4">
            <div className="flex items-center gap-3">
              {resolvedTheme === "dark" ? (
                <Moon size={20} style={{ color: "var(--theme-primary)" }} />
              ) : (
                <Sun size={20} style={{ color: "var(--color-warning)" }} />
              )}
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--theme-text-primary)" }}>
                  {resolvedTheme === "dark" ? "Dark Mode" : "Light Mode"} Active
                </p>
                <p className="text-xs" style={{ color: "var(--theme-text-dim)" }}>
                  {theme === "system" ? "Following system preference" : "Manually selected"}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <div>
          {activeTab === "appearance" && (
            <Card className="p-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--theme-text-primary)" }}>
                  Appearance
                </h2>
                <p className="text-sm" style={{ color: "var(--theme-text-muted)" }}>
                  Customize how the interface looks
                </p>
              </div>

              <div className="space-y-6">
                {/* Theme Selection */}
                <div>
                  <label className="block text-sm font-medium mb-3" style={{ color: "var(--theme-text-secondary)" }}>
                    Theme Mode
                  </label>
                  <div className="grid sm:grid-cols-3 gap-3">
                    {themeOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleThemeChange(option.value)}
                        className="relative p-4 rounded-xl border-2 transition-all text-left"
                        style={{
                          borderColor: theme === option.value 
                            ? "var(--theme-primary)" 
                            : "var(--theme-border-default)",
                          backgroundColor: theme === option.value
                            ? "var(--theme-bg-surface-raised)"
                            : "var(--theme-bg-surface)",
                        }}
                      >
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                          style={{ 
                            backgroundColor: "var(--theme-bg-main)",
                            color: theme === option.value ? "var(--theme-primary)" : "var(--theme-text-muted)"
                          }}
                        >
                          {option.icon}
                        </div>
                        <p 
                          className="font-medium text-sm mb-1"
                          style={{ color: "var(--theme-text-primary)" }}
                        >
                          {option.label}
                        </p>
                        <p className="text-xs" style={{ color: "var(--theme-text-dim)" }}>
                          {option.description}
                        </p>
                        
                        {theme === option.value && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-3 right-3"
                          >
                            <CheckCircle2 
                              size={16} 
                              style={{ color: "var(--theme-primary)" }} 
                            />
                          </motion.div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview Section */}
                <div 
                  className="p-4 rounded-xl mt-6"
                  style={{ 
                    backgroundColor: "var(--theme-bg-surface-raised)",
                    border: "1px solid var(--theme-border-default)"
                  }}
                >
                  <p className="text-sm font-medium mb-4" style={{ color: "var(--theme-text-secondary)" }}>
                    Preview
                  </p>
                  <div className="space-y-3">
                    {/* Sample Card */}
                    <div 
                      className="p-4 rounded-lg"
                      style={{ 
                        backgroundColor: "var(--theme-bg-surface)",
                        border: "1px solid var(--theme-border-default)"
                      }}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div 
                          className="w-8 h-8 rounded-full"
                          style={{ backgroundColor: "var(--theme-primary)" }}
                        />
                        <div>
                          <p className="text-sm font-medium" style={{ color: "var(--theme-text-primary)" }}>
                            Sample Card
                          </p>
                          <p className="text-xs" style={{ color: "var(--theme-text-dim)" }}>
                            This is how cards appear
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          className="px-3 py-1.5 rounded-md text-xs font-medium"
                          style={{ 
                            backgroundColor: "var(--theme-primary)",
                            color: "white"
                          }}
                        >
                          Primary
                        </button>
                        <button 
                          className="px-3 py-1.5 rounded-md text-xs font-medium"
                          style={{ 
                            backgroundColor: "var(--theme-bg-main)",
                            color: "var(--theme-text-primary)",
                            border: "1px solid var(--theme-border-default)"
                          }}
                        >
                          Secondary
                        </button>
                      </div>
                    </div>

                    {/* Sample Input */}
                    <div 
                      className="p-3 rounded-lg flex items-center gap-3"
                      style={{ 
                        backgroundColor: "var(--theme-bg-input)",
                        border: "1px solid var(--theme-border-default)"
                      }}
                    >
                      <Mail size={16} style={{ color: "var(--theme-text-muted)" }} />
                      <span className="text-sm" style={{ color: "var(--theme-text-dim)" }}>
                        Input field placeholder
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {activeTab === "account" && (
            <Card className="p-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--theme-text-primary)" }}>
                  Account Information
                </h2>
                <p className="text-sm" style={{ color: "var(--theme-text-muted)" }}>
                  Your account details and permissions
                </p>
              </div>

              <div className="space-y-4">
                <div 
                  className="flex items-center justify-between p-4 rounded-lg"
                  style={{ 
                    backgroundColor: "var(--theme-bg-surface-raised)",
                    border: "1px solid var(--theme-border-default)"
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Mail size={18} style={{ color: "var(--theme-text-muted)" }} />
                    <div>
                      <p className="text-sm" style={{ color: "var(--theme-text-dim)" }}>Email</p>
                      <p className="font-medium" style={{ color: "var(--theme-text-primary)" }}>
                        {user?.email}
                      </p>
                    </div>
                  </div>
                </div>

                <div 
                  className="flex items-center justify-between p-4 rounded-lg"
                  style={{ 
                    backgroundColor: "var(--theme-bg-surface-raised)",
                    border: "1px solid var(--theme-border-default)"
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Shield size={18} style={{ color: "var(--theme-text-muted)" }} />
                    <div>
                      <p className="text-sm" style={{ color: "var(--theme-text-dim)" }}>Role</p>
                      <p className="font-medium" style={{ color: "var(--theme-text-primary)" }}>
                        {user?.role || "User"}
                      </p>
                    </div>
                  </div>
                </div>

                {user?.role === "ADMIN" && (
                  <div 
                    className="flex items-center gap-3 p-3 rounded-lg"
                    style={{ 
                      backgroundColor: "var(--color-warning-50)",
                      border: "1px solid var(--color-warning-200)"
                    }}
                  >
                    <AlertTriangle size={18} style={{ color: "var(--color-warning)" }} />
                    <p className="text-sm" style={{ color: "var(--color-warning-700)" }}>
                      You have administrator privileges
                    </p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {activeTab === "notifications" && (
            <Card className="p-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--theme-text-primary)" }}>
                  Notifications
                </h2>
                <p className="text-sm" style={{ color: "var(--theme-text-muted)" }}>
                  Configure how you receive notifications
                </p>
              </div>

              <div 
                className="p-4 rounded-lg text-center"
                style={{ 
                  backgroundColor: "var(--theme-bg-surface-raised)",
                  border: "1px solid var(--theme-border-default)"
                }}
              >
                <Bell size={32} className="mx-auto mb-3" style={{ color: "var(--theme-text-muted)" }} />
                <p className="text-sm" style={{ color: "var(--theme-text-secondary)" }}>
                  Notification preferences coming soon
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
