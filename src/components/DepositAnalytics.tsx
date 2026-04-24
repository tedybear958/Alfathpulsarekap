import React, { useMemo, useState } from 'react';
import { useFinanceStore } from '../hooks/useFinanceStore';
import { formatRupiah } from '../utils/formatters';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { 
  format, 
  startOfDay, 
  startOfWeek, 
  startOfMonth, 
  subDays, 
  subWeeks, 
  subMonths, 
  isSameDay, 
  isSameWeek, 
  isSameMonth,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval
} from 'date-fns';
import { id } from 'date-fns/locale';
import { TrendingUp, Calendar, BarChart3, PieChart } from 'lucide-react';

export function DepositAnalytics() {
  const store = useFinanceStore();
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const allDeposits = useMemo(() => {
    return store.branches.flatMap(branch => 
      branch.deposits.map(dep => ({
        ...dep,
        branchName: branch.name,
        dateObj: new Date(dep.date)
      }))
    ).sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
  }, [store.branches]);

  // Monitoring Stats (Live Data)
  const monitorStats = useMemo(() => {
    const pending = allDeposits.filter(d => d.status === 'pending' || d.status === 'received');
    const verified = allDeposits.filter(d => d.status === 'verified');
    
    const totalCashInHand = pending.reduce((sum, d) => sum + (d.totalSetor || 0), 0);
    const totalInBank = verified.reduce((sum, d) => sum + (d.berhasilDisetor || 0), 0);
    const totalUnset = pending.reduce((sum, d) => sum + (d.sisaSetor || 0), 0);

    return { totalCashInHand, totalInBank, totalUnset };
  }, [allDeposits]);

  const chartData = useMemo(() => {
    const now = new Date();
    let data: any[] = [];

    if (timeRange === 'daily') {
      const days = eachDayOfInterval({
        start: subDays(now, 6),
        end: now
      });
      data = days.map(day => {
        const dayDeposits = allDeposits.filter(d => isSameDay(d.dateObj, day));
        return {
          name: format(day, 'EEE', { locale: id }),
          fullDate: format(day, 'dd MMM yyyy', { locale: id }),
          total: dayDeposits.reduce((sum, d) => sum + (d.totalSetor || 0), 0),
          verified: dayDeposits.reduce((sum, d) => sum + (d.berhasilDisetor || 0), 0),
        };
      });
    } else if (timeRange === 'weekly') {
      const weeks = eachWeekOfInterval({
        start: subWeeks(now, 3),
        end: now
      });
      data = weeks.map((week, idx) => {
        const weekDeposits = allDeposits.filter(d => isSameWeek(d.dateObj, week));
        return {
          name: `Mgg ${idx + 1}`,
          fullDate: `Minggu ${format(week, 'dd MMM', { locale: id })}`,
          total: weekDeposits.reduce((sum, d) => sum + (d.totalSetor || 0), 0),
          verified: weekDeposits.reduce((sum, d) => sum + (d.berhasilDisetor || 0), 0),
        };
      });
    } else {
      const months = eachMonthOfInterval({
        start: subMonths(now, 5),
        end: now
      });
      data = months.map(month => {
        const monthDeposits = allDeposits.filter(d => isSameMonth(d.dateObj, month));
        return {
          name: format(month, 'MMM', { locale: id }),
          fullDate: format(month, 'MMMM yyyy', { locale: id }),
          total: monthDeposits.reduce((sum, d) => sum + (d.totalSetor || 0), 0),
          verified: monthDeposits.reduce((sum, d) => sum + (d.berhasilDisetor || 0), 0),
        };
      });
    }
    return data;
  }, [allDeposits, timeRange]);

  const branchComparisonData = useMemo(() => {
    return store.branches.map(branch => {
      const stats = store.getBranchStats(branch);
      return {
        name: branch.name,
        total: stats.totalSetor,
        verified: stats.berhasilDisetor,
      };
    }).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
  }, [store.branches]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-asphalt-800 p-4 border border-asphalt-700 shadow-2xl rounded-2xl text-[10px] backdrop-blur-md">
          <p className="font-black text-white mb-2 uppercase tracking-tight">{payload[0].payload.fullDate}</p>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-4 border-b border-asphalt-700 pb-1.5">
              <span className="text-asphalt-text-400 font-black uppercase">Total Setor</span>
              <span className="text-brand-400 font-bold">{formatRupiah(payload[0].value)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-asphalt-text-400 font-black uppercase">Masuk Bank</span>
              <span className="text-emerald-400 font-bold">{formatRupiah(payload[1].value)}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-asphalt-800 rounded-[2.5rem] p-7 border border-asphalt-700/50 shadow-2xl space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-asphalt-900 text-brand-500 rounded-2xl flex items-center justify-center shadow-lg border border-asphalt-700">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white tracking-tight uppercase">Analisa Setoran</h3>
            <p className="text-[10px] text-asphalt-text-400 font-black uppercase tracking-[0.2em] leading-none mt-1">Perputaran Dana Cabang</p>
          </div>
        </div>
        <div className="flex bg-asphalt-900 p-1.5 rounded-2xl border border-asphalt-700 shadow-inner">
          {(['daily', 'weekly', 'monthly'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 text-[9px] font-black rounded-xl transition-all uppercase tracking-widest ${
                timeRange === range 
                  ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' 
                  : 'text-asphalt-text-400 hover:text-white'
              }`}
            >
              {range === 'daily' ? 'Hari' : range === 'weekly' ? 'Mgg' : 'Bln'}
            </button>
          ))}
        </div>
      </div>

      {/* Branch Comparison - Main Focus */}
      <div className="space-y-5">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-[10px] font-black text-asphalt-text-400 uppercase tracking-widest">Omset Setoran Cabang</h4>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-brand-500 shadow-[0_0_8px_rgba(0,132,255,0.4)]"></div>
              <span className="text-[9px] font-black text-asphalt-text-400 uppercase">Total</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
              <span className="text-[9px] font-black text-asphalt-text-400 uppercase">Bank</span>
            </div>
          </div>
        </div>

        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={branchComparisonData} layout="vertical" margin={{ left: -10, right: 30, top: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#1e293b" />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 800 }}
                width={70}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#0f172a' }} />
              <Bar dataKey="total" fill="var(--brand-500)" radius={[0, 6, 6, 0]} barSize={14} animationDuration={1500} />
              <Bar dataKey="verified" fill="#10b981" radius={[0, 6, 6, 0]} barSize={14} animationDuration={1500} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Trend Area Chart - Secondary Focus */}
      <div className="pt-8 border-t border-asphalt-700/50 space-y-5">
        <h4 className="text-[10px] font-black text-asphalt-text-400 uppercase tracking-widest px-1">Trend Perputaran Dana</h4>
        <div className="h-[180px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--brand-500)" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="var(--brand-500)" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorVerified" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 9, fill: '#64748b', fontWeight: 800 }}
                dy={15}
              />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#334155', strokeWidth: 1 }} />
              <Area 
                type="monotone" 
                dataKey="total" 
                stroke="var(--brand-500)" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorTotal)" 
                animationDuration={1500}
              />
              <Area 
                type="monotone" 
                dataKey="verified" 
                stroke="#10b981" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorVerified)" 
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
