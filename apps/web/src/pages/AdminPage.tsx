import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  ShieldAlert, 
  Users, 
  Server,
  Search,
  Database,
  Cpu,
  Terminal,
  ShieldCheck,
  History,
  Filter,
  PlusCircle
} from "lucide-react";
import { 
  EliteCard as Card, 
  SectionTitle, 
  EliteBadge as Badge, 
  ShinyMetricCard, 
  EliteInlineError as InlineError,
  StatusPulse,
  EliteButton as Button,
  Table,
  type TableColumn
} from "../components/ui";
import { apiFetch } from "../lib/api";
import { type AuthContextValue } from "../App";
import { motion } from "framer-motion";

interface ServiceStatus {
  name: string;
  region: string;
  status: "HEALTHY" | "UNHEALTHY" | "DEGRADED";
  uptime: string;
}

interface UserRegistry {
  id: string;
  fullName: string;
  email: string;
  role: "ADMIN" | "USER";
}

interface TelemetryData {
  services: ServiceStatus[];
  systemUsage: {
    cpu: number;
    memory: number;
  };
  users: UserRegistry[];
}

interface AuditLog {
  id: string;
  features: Record<string, any>;
  modelFamily: string;
  decision: boolean;
  probability: number;
  createdAt: string;
}

/**
 * AdminPage - Command & Control Oversight Station
 * References: Req 6.6, 6.10, 18.1, 18.2, 18.3, 18.4, 18.6, 18.7, 18.8, 7.1, 7.4
 */
export function AdminPage({ auth }: { auth: AuthContextValue }) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const telemetry = useQuery<TelemetryData>({
    queryKey: ["telemetry", auth.session?.token],
    queryFn: () => apiFetch("/telemetry", { token: auth.session?.token }),
    enabled: !!auth.session?.token,
  });

  const audits = useQuery<AuditLog[]>({
    queryKey: ["admin-audits", auth.session?.token],
    queryFn: () => apiFetch("/admin/decisions", { token: auth.session?.token }),
    enabled: !!auth.session?.token,
  });

  if (telemetry.isLoading) {
     return (
       <div className="py-12 space-y-12 animate-pulse">
          <div className="h-24 bg-base-900 border border-base-800 rounded-pro" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
             {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-32 bg-base-900 border border-base-800 rounded-pro" />
             ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
             <div className="h-96 bg-base-900 border border-base-800 rounded-pro" />
             <div className="h-96 bg-base-900 border border-base-800 rounded-pro" />
          </div>
       </div>
     );
  }

  if (telemetry.error) return <InlineError message={(telemetry.error as Error).message} />;
  if (audits.error) return <InlineError message={(audits.error as Error).message} />;

  const { services = [], systemUsage = { cpu: 0, memory: 0 }, users = [] } = telemetry.data || {};

  // Infrastructure Matrix Table Columns
  const serviceColumns: TableColumn<ServiceStatus>[] = [
    {
      header: 'Node Endpoint',
      accessor: 'name',
      render: (row) => (
        <div className="flex items-center gap-4">
           <div className={`h-2.5 w-2.5 rounded-full transition-all duration-700 shadow-lg ${row.status === 'HEALTHY' ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-rose-500 shadow-rose-500/20'} shrink-0`} />
           <div className="flex flex-col">
              <span className="font-black text-base-50 text-sm tracking-tight uppercase italic">{row.name}</span>
              <span className="text-[10px] font-mono text-base-600 lowercase mt-0.5 tracking-wider">{row.name.toLowerCase().replace(/ /g, '-')}.cluster.internal</span>
           </div>
        </div>
      ),
    },
    {
      header: 'Sector',
      accessor: 'region',
      render: (row) => <span className="font-bold text-base-500 text-[11px] uppercase tracking-widest">{row.region || 'AP-SOUTH-1'}</span>,
    },
    {
      header: 'State',
      accessor: 'status',
      render: (row) => (
        <Badge tone={row.status === 'HEALTHY' ? 'success' : 'danger'} className="text-[10px] font-black px-3 py-1 tracking-[0.1em]">
           {row.status}
        </Badge>
      ),
    },
    {
      header: 'Latency',
      accessor: 'uptime',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-baseline justify-end gap-1.5">
           <span className="font-mono font-black text-base-50 text-sm italic">{row.uptime || '8ms'}</span>
           <span className="text-[9px] font-bold text-base-800 uppercase">MS</span>
        </div>
      ),
    },
  ];

  // Audit Ledger Table Columns
  const auditColumns: TableColumn<AuditLog>[] = [
    {
      header: 'Verification ID',
      accessor: 'id',
      render: (row) => (
        <span className="font-mono text-[10px] font-black text-primary/70 tracking-[0.1em]">
           #AUD-{row.id.toString().slice(-10).toUpperCase()}
        </span>
      ),
    },
    {
      header: 'Subject Context',
      accessor: 'features',
      render: (row) => (
        <div className="flex flex-col">
           <span className="text-[11px] font-black text-base-50 uppercase italic tracking-tight">{row.features.email || "ANONYMOUS_PROBE"}</span>
           <span className="text-[9px] font-bold text-base-600 uppercase tracking-widest mt-1">Ingested via API v2.1</span>
        </div>
      ),
    },
    {
      header: 'Model Matrix',
      accessor: 'modelFamily',
      render: (row) => (
        <div className="flex items-center gap-2 text-base-500">
           <Cpu size={12} className="opacity-40" />
           <span className="font-black text-[10px] uppercase tracking-[0.2em]">{row.modelFamily}</span>
        </div>
      ),
    },
    {
      header: 'Synthesis',
      accessor: 'decision',
      render: (row) => (
        <Badge tone={row.decision ? "success" : "danger"} className="text-[10px] font-black px-3 py-1 tracking-[0.1em] uppercase shadow-sm">
           {row.decision ? "SYN_APPROVE" : "SYN_DENY"}
        </Badge>
      ),
    },
    {
      header: 'Confidence',
      accessor: 'probability',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-4 min-w-[120px]">
           <span className="font-black text-base-50 text-sm italic tabular-nums">{(row.probability * 100).toFixed(1)}%</span>
           <div className="w-16 h-1.5 bg-base-900 border border-base-800 rounded-full overflow-hidden self-center p-px">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${row.probability * 100}%` }}
                className={`h-full rounded-full ${row.decision ? 'bg-success shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-danger shadow-[0_0_8px_rgba(239,68,68,0.4)]'}`} 
              />
           </div>
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-10 pb-20 animate-in text-base-200">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between border-b border-base-800 pb-8">
        <SectionTitle
          eyebrow="System Oversight"
          title="Command & Control"
          description="Global infrastructure telemetry, decentralized user registry, and regulatory audit chains."
          className="mb-0"
        />
        <div className="flex items-center gap-4">
           <Badge tone="warning" className="px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] italic border-warning/20 bg-warning/5 shadow-inner">
             Level 0: Root Instance
           </Badge>
           <StatusPulse tone="success" label="Nodes Synchronized" />
        </div>
      </div>

      {/* Global Status metrics */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
         <ShinyMetricCard 
           title="Compute Nodes" 
           value={services.length} 
           icon={Server} 
           hint="Distributed Global Cluster" 
         />
         <ShinyMetricCard 
           title="Active Personnel" 
           value={users.length} 
           icon={Users} 
           hint="Authorized Officer Accounts" 
         />
         <ShinyMetricCard 
           title="CPU Core Saturation" 
           value={`${(systemUsage.cpu * 100).toFixed(0)}%`} 
           icon={Cpu} 
           hint={`Memory: ${systemUsage.memory.toFixed(1)} GB Reserved`} 
         />
         <Card border padded className="flex flex-col justify-center bg-primary/5 border-primary/20 shadow-elite-primary/5 group relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-12 -mr-12 w-32 h-32 bg-primary/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000" />
            <div className="flex items-center gap-3 mb-2 relative z-10">
               <ShieldCheck size={18} className="text-primary group-hover:scale-110 transition-transform" />
               <span className="text-[10px] font-black text-base-100 uppercase tracking-[0.2em]">Security Protocol</span>
            </div>
            <p className="text-xl font-black text-base-50 italic uppercase tracking-tighter relative z-10">AES-256 E2EE</p>
            <p className="text-[10px] font-bold text-base-600 uppercase tracking-widest mt-1 relative z-10 opacity-70">Zero Trust Active</p>
         </Card>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
        {/* Service Registry */}
        <div className="space-y-6">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="h-10 w-10 bg-base-900 border border-base-800 rounded-xl flex items-center justify-center text-primary shadow-inner">
                    <Terminal size={20} />
                 </div>
                 <div>
                    <h3 className="text-xs font-black text-base-50 uppercase tracking-[0.2em] leading-none">Infrastructure Matrix</h3>
                    <p className="text-[10px] text-base-600 font-bold uppercase mt-1 tracking-widest italic leading-none">Global service health</p>
                 </div>
              </div>
              <div className="flex items-center gap-4">
                 <span className="text-[10px] font-black text-base-700 uppercase tracking-widest">Uptime: 99.999%</span>
                 <div className="h-4 w-px bg-base-800" />
                 <Badge tone="info" className="text-[9px] px-3">Live</Badge>
              </div>
           </div>

           <Table
             data={services}
             columns={serviceColumns}
             className="shadow-3xl border-base-800/50"
             onRowClick={() => {}}
           />
           {services.length === 0 && !telemetry.isLoading && (
             <div className="py-12 text-center text-xs text-base-500 border border-base-800 rounded-lg bg-base-900/20">
               No services found.
             </div>
           )}
        </div>

        {/* User Directory */}
        <div className="space-y-8">
           <div className="space-y-6">
              <div className="flex items-center gap-3">
                 <div className="h-10 w-10 bg-base-900 border border-base-800 rounded-xl flex items-center justify-center text-primary shadow-inner">
                    <Database size={20} />
                 </div>
                 <div>
                    <h3 className="text-xs font-black text-base-50 uppercase tracking-[0.2em] leading-none">Officer Registry</h3>
                    <p className="text-[10px] text-base-600 font-bold uppercase mt-1 tracking-widest leading-none">Authorization management</p>
                 </div>
              </div>
              
              <Card border className="p-0 overflow-hidden bg-base-900/40 border-base-800 shadow-2xl">
                 <div className="max-h-[500px] overflow-y-auto custom-scrollbar divide-y divide-base-800">
                    {users.length === 0 && (
                      <div className="py-12 text-center text-xs text-base-500">No users found.</div>
                    )}
                    {users.map((user) => (
                       <div key={user.id} className="p-6 flex items-center justify-between hover:bg-base-800/50 transition-all group cursor-pointer relative overflow-hidden">
                          <div className="flex items-center gap-4 min-w-0 relative z-10">
                             <div className="h-11 w-11 rounded-2xl bg-base-950 border border-base-800 flex items-center justify-center font-black text-xs text-primary group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all duration-300 shadow-inner">
                                {user.fullName.split(' ').map(n => n[0]).join('')}
                             </div>
                             <div className="min-w-0">
                                <p className="text-[14px] font-black text-base-100 tracking-tight uppercase leading-none italic group-hover:text-base-50 transition-colors">{user.fullName}</p>
                                <p className="text-[10px] font-bold text-base-600 truncate mt-1.5 uppercase tracking-widest">{user.email}</p>
                             </div>
                          </div>
                          <Badge tone={user.role === 'ADMIN' ? 'warning' : 'ghost'} className="text-[9px] font-black tracking-widest relative z-10">{user.role}</Badge>
                       </div>
                    ))}
                 </div>
                 <Button variant="secondary" className="w-full h-14 rounded-none text-[10px] font-black uppercase tracking-[0.2em] bg-base-950 border-t border-base-800 hover:bg-primary/10 hover:text-primary transition-all group" leftIcon={<PlusCircle size={16} className="group-hover:scale-110 transition-transform" />}>
                    Provision New Identity
                 </Button>
              </Card>
           </div>

           <Card border padded className="bg-danger/5 border-danger/10 shadow-lg shadow-danger/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                 <ShieldAlert size={80} className="text-danger" />
              </div>
              <div className="flex gap-5 relative z-10">
                 <div className="h-12 w-12 flex-shrink-0 bg-danger/10 rounded-2xl border border-danger/20 flex items-center justify-center text-danger shadow-inner">
                    <ShieldAlert size={28} />
                 </div>
                 <div>
                    <h4 className="text-[11px] font-black text-base-50 uppercase tracking-[0.2em] mb-2 leading-none">Regulatory Isolation</h4>
                    <p className="text-[10px] text-base-600 leading-relaxed font-bold uppercase tracking-widest italic opacity-80">
                       Panel interaction requires P0 Root attestation. Multi-factor handshake required for any state mutation.
                    </p>
                 </div>
              </div>
           </Card>
        </div>
      </div>

      {/* Decision Audit Trail */}
      <div className="space-y-8 pt-6">
         <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8 border-t border-base-800 pt-10">
            <div className="flex items-center gap-4">
               <div className="h-12 w-12 bg-base-900 border border-base-800 rounded-2xl flex items-center justify-center text-primary shadow-inner">
                  <History size={24} />
               </div>
               <div>
                  <h3 className="text-sm font-black text-base-50 uppercase tracking-[0.2em] leading-none">Immutable Synthesis Ledger</h3>
                  <p className="text-[10px] text-base-600 font-bold uppercase mt-1.5 tracking-widest">System-wide regulatory compliance logs</p>
               </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
               <div className="flex-1 min-w-[300px] relative group">
                   <div className="absolute inset-y-0 left-4 flex items-center text-base-700 group-focus-within:text-primary transition-colors">
                      <Search size={16} />
                   </div>
                   <input 
                     type="text" 
                     placeholder="QUERY IDENTITY OR AUDIT REF..." 
                     className="w-full h-12 bg-base-950 border border-base-800 rounded-2xl pl-12 pr-4 text-[10px] font-black text-base-50 uppercase tracking-[0.2em] outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-base-800 shadow-inner"
                   />
               </div>
               <Button variant="secondary" size="md" className="h-12 w-12 p-0 border border-base-800" aria-label="Filter audit logs">
                  <Filter size={18} />
               </Button>
            </div>
         </div>

         <Table 
           data={audits.data?.slice((currentPage - 1) * pageSize, currentPage * pageSize) || []} 
           columns={auditColumns}
           loading={audits.isLoading}
           className="shadow-elite-primary/5 border-base-800/50"
           onRowClick={() => {}}
           pagination={{
             currentPage,
             totalPages: Math.ceil((audits.data?.length || 0) / pageSize),
             pageSize,
             onPageChange: (page) => setCurrentPage(page)
           }}
         />
      </div>
    </div>
  );
}
