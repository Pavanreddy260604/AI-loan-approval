import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, ShieldCheck, Mail, Lock, User, ArrowRight, ChevronLeft, Fingerprint, ShieldAlert } from "lucide-react";
import { 
  EliteButton as Button, 
  EliteCard as Card, 
  EliteInput as Input, 
  InlineNotice, 
  EliteInlineError as InlineError
} from "../components/ui";
import { apiFetch, type AuthSession } from "../lib/api";
import { type AuthContextValue } from "../App";

type AuthMode = "login" | "signup" | "verify" | "forgot" | "reset";

/**
 * AuthPage - Institutional Gateway
 * References: Req 6.8, 6.10, 18.1, 18.3
 */
export function AuthPage({ auth }: { auth: AuthContextValue }) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [emailForVerification, setEmailForVerification] = useState("");
  const [notice, setNotice] = useState("");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<any>();

  const mutation = useMutation({
    mutationFn: async (values: any) => {
      const endpoints: Record<AuthMode, string> = {
        signup: "/auth/signup",
        verify: "/auth/verify-email",
        forgot: "/auth/forgot-password",
        reset: "/auth/reset-password",
        login: "/auth/login"
      };
      return apiFetch(endpoints[mode], { method: "POST", body: values });
    },
    onSuccess: (data: any, variables: any) => {
      if (mode === "signup") {
        setEmailForVerification(variables.email);
        setNotice(`Verification code sent to ${variables.email}.`);
        reset({ otp: "" });
        setMode("verify");
        return;
      }
      if (mode === "verify") {
        setNotice("Email verified. Please sign in.");
        reset({ email: emailForVerification, password: "" });
        setMode("login");
        return;
      }
      if (mode === "forgot") {
        setEmailForVerification(variables.email);
        setNotice(`Reset code sent to ${variables.email}.`);
        reset({ otp: "", newPassword: "" });
        setMode("reset");
        return;
      }
      if (mode === "reset") {
        setNotice("Password updated. Sign in with your new password.");
        reset({ email: emailForVerification || variables.email, password: "" });
        setMode("login");
        return;
      }
      if (mode === "login") {
        setNotice("");
        const session = { ...data, token: data.accessToken || data.token } as AuthSession;
        auth.setSession(session);
        queryClient.invalidateQueries();
        navigate("/app/dashboard");
      }
    },
  });

  const titles: Record<AuthMode, string> = {
    login: "Login",
    signup: "Sign Up",
    verify: "Verify Email",
    forgot: "Forgot Password",
    reset: "Reset Password"
  };

  const descriptions: Record<AuthMode, string> = {
    login: "Sign in with your account details to access the system.",
    signup: "Create your account on the Originate platform.",
    verify: `Enter the 6-digit code sent to your email.`,
    forgot: "We'll send a reset link to your verified email.",
    reset: "Choose a strong password for your secure session."
  };

  function switchMode(next: AuthMode) {
    mutation.reset();
    setNotice("");
    if (next === "verify" || next === "reset") reset({});
    setMode(next);
  }

  return (
    <div className="min-h-screen bg-base-950 flex flex-col items-center justify-center p-6 selection:bg-primary/30 relative overflow-hidden">
      {/* Precision Background - High Fidelity Grid & Glow */}
      <div className="absolute inset-0 z-0">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.08)_0%,transparent_70%)]" />
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-primary/20 blur-[160px] rounded-full opacity-40 animate-pulse" />
      </div>

      <div className="w-full max-w-[440px] z-10 space-y-10">
        <div className="flex flex-col items-center">
          <Link to="/" className="flex items-center gap-4 group transition-all">
            <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center shadow-elite-primary group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
               <Zap size={24} className="text-white" fill="white" />
            </div>
            <div className="flex flex-col">
               <span className="text-2xl font-black text-base-50 tracking-[-0.05em] uppercase italic leading-none">Originate</span>
               <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mt-1 leading-none">Intelligence Layer</span>
            </div>
          </Link>
        </div>

        <Card border padded className="bg-base-900/60 border-base-800 backdrop-blur-2xl shadow-elite-elevated relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="space-y-10"
            >
              <div>
                <div className="flex items-center gap-3 mb-3">
                   <div className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                   <h1 className="text-xl font-black text-base-50 tracking-tight uppercase italic leading-none">{titles[mode]}</h1>
                </div>
                <p className="text-[11px] text-base-500 font-bold uppercase tracking-widest leading-relaxed">
                   {descriptions[mode]}
                </p>
              </div>

              <form 
                className="space-y-8"
                onSubmit={handleSubmit((values) => {
                  if (mode === "verify" || mode === "reset") {
                    values.email = emailForVerification;
                  }
                  mutation.mutate(values);
                })}
              >
                {notice && (
                   <div className="p-px rounded-xl bg-gradient-to-r from-primary/30 to-transparent">
                      <InlineNotice message={notice} tone="info" className="bg-base-950 border-none py-3" />
                   </div>
                )}
                {mutation.error && (
                   <div className="p-px rounded-xl bg-gradient-to-r from-danger/30 to-transparent">
                      <InlineError message={(mutation.error as Error).message} className="bg-base-950 border-none py-3" />
                   </div>
                )}

                <div className="space-y-6">
                  {mode === "signup" && (
                    <Input 
                       label="Full Name" 
                       placeholder="YOUR FULL NAME..." 
                       {...register("fullName", { required: true })} 
                       error={errors.fullName && "NAME REQUIRED"}
                       className="uppercase tracking-widest text-[10px]"
                       leftIcon={<User size={14} />}
                    />
                  )}
                  
                  {mode !== "verify" && mode !== "reset" && (
                    <Input 
                      label="Email Address" 
                      type="email" 
                      placeholder="NAME@EXAMPLE.COM"
                      {...register("email", { required: true })} 
                      error={errors.email && "VALID EMAIL REQUIRED"}
                      className="uppercase tracking-widest text-[10px]"
                      leftIcon={<Mail size={14} />}
                    />
                  )}
                  
                  {(mode === "login" || mode === "signup") && (
                    <div className="space-y-2">
                       <Input 
                        label="Password" 
                        type="password" 
                        placeholder="••••••••••••"
                        {...register("password", { required: true })} 
                        error={errors.password && "PASSWORD REQUIRED"}
                        leftIcon={<Lock size={14} />}
                      />
                      {mode === "login" && (
                        <div className="flex justify-end">
                          <button 
                            type="button" 
                            onClick={() => switchMode("forgot")}
                            className="text-[9px] font-black text-base-700 hover:text-primary transition-colors uppercase tracking-[0.2em] italic"
                          >
                            Forgot Password?
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {(mode === "verify" || mode === "reset") && (
                    <Input 
                       label="Verification Code" 
                       placeholder="0 0 0 0 0 0" 
                       {...register("otp", { required: true })} 
                       error={errors.otp && "CODE REQUIRED"}
                       className="text-center text-lg tracking-[1em] font-black"
                       leftIcon={<Fingerprint size={14} />}
                    />
                  )}

                  {mode === "reset" && (
                    <Input 
                       label="New Password" 
                       type="password" 
                       placeholder="••••••••••••" 
                       {...register("newPassword", { required: true })} 
                       error={errors.newPassword && "NEW PASSWORD REQUIRED"}
                       leftIcon={<ShieldAlert size={14} />}
                    />
                  )}
                </div>

                <div className="pt-4">
                  <Button 
                    className="w-full h-14 text-[11px] font-black uppercase tracking-[0.3em] italic shadow-elite-primary" 
                    type="submit" 
                    loading={mutation.isPending}
                    rightIcon={<ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />}
                  >
                    {mode === "login" ? "Login" : mode === "signup" ? "Create Account" : mode === "forgot" ? "Send Reset Code" : "Save Password"}
                  </Button>
                </div>

                <div className="pt-8 border-t border-base-800">
                  <p className="text-[10px] text-center text-base-600 font-bold uppercase tracking-widest">
                    {mode === "login" ? (
                      <>
                        No account?{" "}
                        <button type="button" onClick={() => switchMode("signup")} className="font-black text-primary hover:text-primary/80 transition-all italic underline decoration-primary/30 underline-offset-4">Sign Up</button>
                      </>
                    ) : (
                      <button type="button" onClick={() => switchMode("login")} className="flex items-center gap-2 mx-auto font-black text-base-500 hover:text-base-50 transition-all italic">
                         <ChevronLeft size={12} /> BACK TO LOGIN
                      </button>
                    )}
                  </p>
                </div>
              </form>
            </motion.div>
          </AnimatePresence>
        </Card>

        <div className="flex flex-col items-center gap-4">
           <div className="flex items-center gap-3 grayscale opacity-30 group-hover:grayscale-0 group-hover:opacity-100 transition-all">
              <div className="h-px w-8 bg-base-800" />
              <ShieldCheck size={16} className="text-primary" />
              <div className="h-px w-8 bg-base-800" />
           </div>
           <p className="text-[9px] font-black text-base-800 uppercase tracking-[0.4em] text-center leading-relaxed">
             Enterprise Intelligence Gateway <br />
             <span className="text-primary/40">AES-256 GCM ENCRYPTION ACTIVE</span>
           </p>
        </div>
      </div>
    </div>
  );
}
