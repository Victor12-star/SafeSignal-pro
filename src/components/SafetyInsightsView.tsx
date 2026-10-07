import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import {
  ShieldAlert,
  Clock,
  Battery,
  Activity,
  Calendar,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Download,
  Filter,
  ArrowUpRight,
  Zap,
  VolumeX,
  Footprints,
  Info,
  ChevronLeft,
} from 'lucide-react';

export interface HistoricalSosIncident {
  id: string;
  date: string;
  month: string;
  type: 'LOUD_SOS' | 'SILENT_SOS' | 'JOURNEY_ESCALATION' | 'DRILL_TEST';
  responseTimeSec: number;
  batteryLevelAtTrigger: number;
  batteryDrainPerHour: number;
  networkState: 'ONLINE' | 'OFFLINE_SMS' | 'RECOVERED';
  respondersCount: number;
  resolvedSafe: boolean;
}

// Realistic 12-month historical safety log data
const DEFAULT_HISTORICAL_INCIDENTS: HistoricalSosIncident[] = [
  {
    id: 'inc_849201',
    date: '2025-10-14',
    month: 'Oct 25',
    type: 'DRILL_TEST',
    responseTimeSec: 42,
    batteryLevelAtTrigger: 88,
    batteryDrainPerHour: 4.2,
    networkState: 'ONLINE',
    respondersCount: 3,
    resolvedSafe: true,
  },
  {
    id: 'inc_892102',
    date: '2025-11-03',
    month: 'Nov 25',
    type: 'LOUD_SOS',
    responseTimeSec: 135,
    batteryLevelAtTrigger: 64,
    batteryDrainPerHour: 5.1,
    networkState: 'ONLINE',
    respondersCount: 2,
    resolvedSafe: true,
  },
  {
    id: 'inc_910384',
    date: '2025-11-28',
    month: 'Nov 25',
    type: 'SILENT_SOS',
    responseTimeSec: 88,
    batteryLevelAtTrigger: 41,
    batteryDrainPerHour: 5.8,
    networkState: 'ONLINE',
    respondersCount: 3,
    resolvedSafe: true,
  },
  {
    id: 'inc_948271',
    date: '2025-12-19',
    month: 'Dec 25',
    type: 'JOURNEY_ESCALATION',
    responseTimeSec: 190,
    batteryLevelAtTrigger: 29,
    batteryDrainPerHour: 6.4,
    networkState: 'OFFLINE_SMS',
    respondersCount: 2,
    resolvedSafe: true,
  },
  {
    id: 'inc_982736',
    date: '2026-01-08',
    month: 'Jan 26',
    type: 'DRILL_TEST',
    responseTimeSec: 36,
    batteryLevelAtTrigger: 92,
    batteryDrainPerHour: 3.9,
    networkState: 'ONLINE',
    respondersCount: 4,
    resolvedSafe: true,
  },
  {
    id: 'inc_102837',
    date: '2026-01-27',
    month: 'Jan 26',
    type: 'LOUD_SOS',
    responseTimeSec: 110,
    batteryLevelAtTrigger: 52,
    batteryDrainPerHour: 5.0,
    networkState: 'ONLINE',
    respondersCount: 3,
    resolvedSafe: true,
  },
  {
    id: 'inc_118274',
    date: '2026-02-14',
    month: 'Feb 26',
    type: 'SILENT_SOS',
    responseTimeSec: 74,
    batteryLevelAtTrigger: 38,
    batteryDrainPerHour: 6.1,
    networkState: 'RECOVERED',
    respondersCount: 2,
    resolvedSafe: true,
  },
  {
    id: 'inc_129482',
    date: '2026-02-28',
    month: 'Feb 26',
    type: 'JOURNEY_ESCALATION',
    responseTimeSec: 165,
    batteryLevelAtTrigger: 22,
    batteryDrainPerHour: 7.2,
    networkState: 'ONLINE',
    respondersCount: 3,
    resolvedSafe: true,
  },
  {
    id: 'inc_139481',
    date: '2026-03-09',
    month: 'Mar 26',
    type: 'LOUD_SOS',
    responseTimeSec: 95,
    batteryLevelAtTrigger: 47,
    batteryDrainPerHour: 5.5,
    networkState: 'ONLINE',
    respondersCount: 3,
    resolvedSafe: true,
  },
  {
    id: 'inc_140293',
    date: '2026-03-18',
    month: 'Mar 26',
    type: 'DRILL_TEST',
    responseTimeSec: 28,
    batteryLevelAtTrigger: 85,
    batteryDrainPerHour: 4.1,
    networkState: 'ONLINE',
    respondersCount: 4,
    resolvedSafe: true,
  },
  {
    id: 'inc_150284',
    date: '2026-03-24',
    month: 'Mar 26',
    type: 'SILENT_SOS',
    responseTimeSec: 62,
    batteryLevelAtTrigger: 14,
    batteryDrainPerHour: 8.4,
    networkState: 'RECOVERED',
    respondersCount: 3,
    resolvedSafe: true,
  },
  {
    id: 'inc_159281',
    date: '2026-03-29',
    month: 'Mar 26',
    type: 'LOUD_SOS',
    responseTimeSec: 84,
    batteryLevelAtTrigger: 31,
    batteryDrainPerHour: 6.0,
    networkState: 'ONLINE',
    respondersCount: 3,
    resolvedSafe: true,
  },
];

interface SafetyInsightsViewProps {
  onBack?: () => void;
  isInline?: boolean;
}

export const SafetyInsightsView: React.FC<SafetyInsightsViewProps> = ({
  onBack,
  isInline = false,
}) => {
  const [timeframe, setTimeframe] = useState<'30D' | '90D' | '1Y'>('1Y');
  const [selectedMetricTab, setSelectedMetricTab] = useState<'events' | 'response' | 'battery'>('events');

  // Filtered incidents based on selected timeframe
  const filteredIncidents = useMemo(() => {
    if (timeframe === '30D') {
      return DEFAULT_HISTORICAL_INCIDENTS.slice(-4);
    }
    if (timeframe === '90D') {
      return DEFAULT_HISTORICAL_INCIDENTS.slice(-7);
    }
    return DEFAULT_HISTORICAL_INCIDENTS;
  }, [timeframe]);

  // Aggregate Key Performance Indicators
  const kpis = useMemo(() => {
    const total = filteredIncidents.length;
    const loudCount = filteredIncidents.filter((i) => i.type === 'LOUD_SOS').length;
    const silentCount = filteredIncidents.filter((i) => i.type === 'SILENT_SOS').length;
    const journeyCount = filteredIncidents.filter((i) => i.type === 'JOURNEY_ESCALATION').length;
    const drillCount = filteredIncidents.filter((i) => i.type === 'DRILL_TEST').length;

    const avgResponseSec = Math.round(
      filteredIncidents.reduce((acc, curr) => acc + curr.responseTimeSec, 0) / (total || 1)
    );
    const minResponseSec = Math.min(...filteredIncidents.map((i) => i.responseTimeSec));
    const avgBatteryAtTrigger = Math.round(
      filteredIncidents.reduce((acc, curr) => acc + curr.batteryLevelAtTrigger, 0) / (total || 1)
    );
    const criticalBatteryTriggers = filteredIncidents.filter(
      (i) => i.batteryLevelAtTrigger < 20
    ).length;

    return {
      total,
      loudCount,
      silentCount,
      journeyCount,
      drillCount,
      avgResponseSec,
      minResponseSec,
      avgBatteryAtTrigger,
      criticalBatteryTriggers,
    };
  }, [filteredIncidents]);

  // Monthly Aggregated Data for Event Frequency Chart
  const monthlyEventData = useMemo(() => {
    const monthsMap: Record<string, { month: string; loud: number; silent: number; journey: number; drill: number; total: number }> = {};

    filteredIncidents.forEach((inc) => {
      if (!monthsMap[inc.month]) {
        monthsMap[inc.month] = {
          month: inc.month,
          loud: 0,
          silent: 0,
          journey: 0,
          drill: 0,
          total: 0,
        };
      }
      if (inc.type === 'LOUD_SOS') monthsMap[inc.month].loud += 1;
      else if (inc.type === 'SILENT_SOS') monthsMap[inc.month].silent += 1;
      else if (inc.type === 'JOURNEY_ESCALATION') monthsMap[inc.month].journey += 1;
      else if (inc.type === 'DRILL_TEST') monthsMap[inc.month].drill += 1;

      monthsMap[inc.month].total += 1;
    });

    return Object.values(monthsMap);
  }, [filteredIncidents]);

  // Response Time Chronological Data
  const responseTimeData = useMemo(() => {
    return filteredIncidents.map((inc, idx) => ({
      index: `#${idx + 1}`,
      date: inc.date.slice(5),
      fullDate: inc.date,
      type: inc.type.replace('_', ' '),
      seconds: inc.responseTimeSec,
      minutes: Number((inc.responseTimeSec / 60).toFixed(1)),
      benchmark: 180, // 3-minute emergency target benchmark
    }));
  }, [filteredIncidents]);

  // Battery Level & Health Trend Data
  const batteryHealthData = useMemo(() => {
    return filteredIncidents.map((inc, idx) => ({
      index: `#${idx + 1}`,
      date: inc.date.slice(5),
      fullDate: inc.date,
      batteryLevel: inc.batteryLevelAtTrigger,
      drainRate: inc.batteryDrainPerHour,
      criticalThreshold: 15,
      shutdownReserve: 5,
    }));
  }, [filteredIncidents]);

  // CSV Export Helper
  const handleExportData = () => {
    const headers = 'ID,Date,Type,ResponseTimeSec,BatteryLevel,DrainPerHour,NetworkState,ResolvedSafe\n';
    const rows = filteredIncidents.map(
      (i) => `${i.id},${i.date},${i.type},${i.responseTimeSec},${i.batteryLevelAtTrigger},${i.batteryDrainPerHour},${i.networkState},${i.resolvedSafe}`
    );
    const csvContent = headers + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SafeSignal_SafetyInsights_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-1 text-slate-400 hover:text-white rounded-lg bg-slate-900 border border-slate-800 transition-colors"
              title="Return to Settings"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-rose-500" />
                <span>Safety Insights &amp; Analytics</span>
              </h3>
              <span className="px-1.5 py-0.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-mono rounded">
                Live Audit
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Historical distress frequency, responder velocity, and battery reserve telemetry.
            </p>
          </div>
        </div>

        {/* Export Button */}
        <button
          type="button"
          onClick={handleExportData}
          className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 hover:text-white transition-colors text-xs flex items-center gap-1 cursor-pointer"
          title="Export CSV Log"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-[11px] font-mono">Export CSV</span>
        </button>
      </div>

      {/* Timeframe Filter Tabs */}
      <div className="flex items-center justify-between bg-slate-900/90 p-1 rounded-xl border border-slate-800/80">
        <span className="text-[11px] font-semibold text-slate-400 px-2 flex items-center gap-1">
          <Calendar className="w-3 h-3 text-slate-500" />
          Time Horizon:
        </span>
        <div className="flex items-center gap-1">
          {(['30D', '90D', '1Y'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTimeframe(t)}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                timeframe === t
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-950/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t === '30D' ? 'Last 30 Days' : t === '90D' ? 'Last 90 Days' : 'Past Year'}
            </button>
          ))}
        </div>
      </div>

      {/* 3 Core KPI Metric Cards */}
      <div className="grid grid-cols-3 gap-2">
        {/* Total SOS Events Card */}
        <div
          onClick={() => setSelectedMetricTab('events')}
          className={`p-3 rounded-2xl border transition-all cursor-pointer ${
            selectedMetricTab === 'events'
              ? 'bg-rose-950/40 border-rose-600/80 shadow-lg shadow-rose-950/40 ring-1 ring-rose-500/40'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Total Events
            </span>
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-xl font-black text-white font-mono">{kpis.total}</div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
            <span>{kpis.loudCount} Loud</span>
            <span className="text-slate-600">•</span>
            <span>{kpis.silentCount} Silent</span>
          </div>
        </div>

        {/* Avg Response Time Card */}
        <div
          onClick={() => setSelectedMetricTab('response')}
          className={`p-3 rounded-2xl border transition-all cursor-pointer ${
            selectedMetricTab === 'response'
              ? 'bg-amber-950/40 border-amber-600/80 shadow-lg shadow-amber-950/40 ring-1 ring-amber-500/40'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Avg Response
            </span>
            <Clock className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-black text-amber-300 font-mono">
            {kpis.avgResponseSec}s
          </div>
          <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-0.5">
            <CheckCircle2 className="w-3 h-3 shrink-0" />
            <span>Best: {kpis.minResponseSec}s</span>
          </div>
        </div>

        {/* Battery Health at Trigger Card */}
        <div
          onClick={() => setSelectedMetricTab('battery')}
          className={`p-3 rounded-2xl border transition-all cursor-pointer ${
            selectedMetricTab === 'battery'
              ? 'bg-emerald-950/40 border-emerald-600/80 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500/40'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Avg Battery
            </span>
            <Battery className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-black text-emerald-300 font-mono">
            {kpis.avgBatteryAtTrigger}%
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
            <span className={kpis.criticalBatteryTriggers > 0 ? 'text-rose-400 font-bold' : 'text-slate-400'}>
              {kpis.criticalBatteryTriggers} &lt;20%
            </span>
            <span className="text-slate-500">at trigger</span>
          </div>
        </div>
      </div>

      {/* Main Chart Visualization Section */}
      <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-3 shadow-lg">
        {/* Metric Selector Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedMetricTab('events')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                selectedMetricTab === 'events'
                  ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldAlert className="w-3 h-3" />
              <span>SOS Frequency</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedMetricTab('response')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                selectedMetricTab === 'response'
                  ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>Response Velocity</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedMetricTab('battery')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                selectedMetricTab === 'battery'
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Battery className="w-3 h-3" />
              <span>Battery Reserve</span>
            </button>
          </div>

          <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
            Recharts Engine
          </span>
        </div>

        {/* CHART 1: Total SOS Events Over Time (Bar Chart) */}
        {selectedMetricTab === 'events' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Emergency Incidents Distribution Over Time</span>
                </h4>
                <p className="text-[10px] text-slate-400">
                  Categorized by Standard SOS, Silent Triggers, Journey Check-ins, and Drills.
                </p>
              </div>
            </div>

            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyEventData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="month"
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={10}
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#020617',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      fontSize: '11px',
                      color: '#f8fafc',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.7)',
                    }}
                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }}
                    iconType="circle"
                    iconSize={8}
                  />
                  <Bar dataKey="loud" name="Standard SOS" fill="#f43f5e" stackId="a" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="silent" name="Silent SOS" fill="#818cf8" stackId="a" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="journey" name="Journey Escalated" fill="#fb923c" stackId="a" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="drill" name="Safety Drill" fill="#10b981" stackId="a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* CHART 2: Response Times (Line/Area Chart with 3-minute emergency target line) */}
        {selectedMetricTab === 'response' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Contact Acknowledgment Velocity</span>
                </h4>
                <p className="text-[10px] text-slate-400">
                  Latency from SOS dispatch to first trusted contact acknowledging via SMS / Web.
                </p>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-mono text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                <span>Target: &lt;180s (3m)</span>
              </div>
            </div>

            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={responseTimeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="responseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={10}
                    unit="s"
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#020617',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      fontSize: '11px',
                      color: '#f8fafc',
                    }}
                    formatter={(value: any, name: any) => [`${value} seconds (${(Number(value) / 60).toFixed(1)} mins)`, 'Response Time']}
                    labelFormatter={(label, payload) => {
                      if (payload && payload[0]) {
                        return `${payload[0].payload.fullDate} (${payload[0].payload.type})`;
                      }
                      return label;
                    }}
                  />
                  <ReferenceLine
                    y={180}
                    stroke="#f43f5e"
                    strokeDasharray="4 4"
                    label={{
                      value: 'Critical Threshold (180s)',
                      fill: '#f43f5e',
                      fontSize: 9,
                      position: 'top',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="seconds"
                    name="Response Time (seconds)"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#responseGrad)"
                    dot={{ fill: '#f59e0b', r: 3 }}
                    activeDot={{ r: 5, fill: '#fbbf24' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* CHART 3: Battery Health Trends & Residual Capacity Over Time */}
        {selectedMetricTab === 'battery' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Battery Residual Capacity &amp; Drain Trends</span>
                </h4>
                <p className="text-[10px] text-slate-400">
                  Monitors battery level at moment of trigger and hourly discharge rate.
                </p>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                <span>Avg: {kpis.avgBatteryAtTrigger}%</span>
              </div>
            </div>

            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={batteryHealthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={10}
                    domain={[0, 100]}
                    unit="%"
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#020617',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      fontSize: '11px',
                      color: '#f8fafc',
                    }}
                    formatter={(val: any, name: any) => [`${val}%`, name]}
                    labelFormatter={(label, payload) => {
                      if (payload && payload[0]) {
                        return `${payload[0].payload.fullDate} · Drain: ${payload[0].payload.drainRate}%/hr`;
                      }
                      return label;
                    }}
                  />
                  <ReferenceLine
                    y={15}
                    stroke="#f43f5e"
                    strokeDasharray="3 3"
                    label={{ value: 'Critical (15%)', fill: '#f43f5e', fontSize: 9, position: 'right' }}
                  />
                  <ReferenceLine
                    y={5}
                    stroke="#991b1b"
                    strokeDasharray="2 2"
                    label={{ value: 'Shutdown (5%)', fill: '#991b1b', fontSize: 9, position: 'right' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="batteryLevel"
                    name="Battery Level at Trigger"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ fill: '#10b981', r: 3 }}
                    activeDot={{ r: 5, fill: '#34d399' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Incident Log Breakdown */}
      <div className="p-3.5 bg-slate-900 rounded-2xl border border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="font-semibold text-slate-200 text-xs flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Recent Incident History Log</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            {filteredIncidents.length} recorded events
          </span>
        </div>

        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {filteredIncidents.slice().reverse().map((inc) => (
            <div
              key={inc.id}
              className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      inc.type === 'LOUD_SOS'
                        ? 'bg-rose-500'
                        : inc.type === 'SILENT_SOS'
                        ? 'bg-indigo-400'
                        : inc.type === 'JOURNEY_ESCALATION'
                        ? 'bg-amber-400'
                        : 'bg-emerald-400'
                    }`}
                  />
                  <span className="font-bold text-white text-[11px]">
                    {inc.type === 'LOUD_SOS'
                      ? 'Loud SOS Alert'
                      : inc.type === 'SILENT_SOS'
                      ? 'Silent SOS Trigger'
                      : inc.type === 'JOURNEY_ESCALATION'
                      ? 'Safe Journey Escalated'
                      : 'Emergency Drill Test'}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {inc.date}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 flex items-center gap-2">
                  <span>Ack: <strong className="text-amber-300 font-mono">{inc.responseTimeSec}s</strong></span>
                  <span>•</span>
                  <span>Battery: <strong className={inc.batteryLevelAtTrigger <= 20 ? 'text-rose-400 font-mono' : 'text-emerald-400 font-mono'}>{inc.batteryLevelAtTrigger}%</strong></span>
                  <span>•</span>
                  <span>{inc.networkState}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="px-2 py-0.5 bg-emerald-950/60 border border-emerald-800/50 text-emerald-400 text-[10px] font-mono rounded">
                  Resolved Safe
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
