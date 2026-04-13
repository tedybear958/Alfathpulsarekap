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
        <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-2xl text-xs">
          <p className="font-bold text-gray-900 mb-1">{payload[0].payload.fullDate}</p>
          <div className="space-y-1">
            <p className="text-blue-600">Total: {formatRupiah(payload[0].value)}</p>
            <p className="text-emerald-600">Masuk: {formatRupiah(payload[1].value)}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-[2.5rem] p-6 border border-gray-100 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-gray-900 tracking-tight">Grafik Setoran</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Analisis Dana Cabang</p>
          </div>
        </div>
        <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
          {(['daily', 'weekly', 'monthly'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition-all uppercase tracking-tighter ${
                timeRange === range 
                  ? 'bg-white text-blue-600 shadow-sm border border-blue-50' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {range === 'daily' ? 'Harian' : range === 'weekly' ? 'Mingguan' : 'Bulanan'}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorVerified" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }}
              dy={10}
            />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }} />
            <Area 
              type="monotone" 
              dataKey="total" 
              stroke="#3b82f6" 
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

      <div className="flex items-center justify-center gap-6 pt-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-200"></div>
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Total Setoran</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200"></div>
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Berhasil Masuk</span>
        </div>
      </div>

      <div className="pt-8 border-t border-gray-50">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm">
            <PieChart className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-gray-900 tracking-tight">Perbandingan Cabang</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Penyetor Terbesar</p>
          </div>
        </div>

        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={branchComparisonData} layout="vertical" margin={{ left: 10, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f8fafc" />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#475569', fontWeight: 800 }}
                width={70}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="total" fill="#3b82f6" radius={[0, 6, 6, 0]} barSize={14} animationDuration={1500} />
              <Bar dataKey="verified" fill="#10b981" radius={[0, 6, 6, 0]} barSize={14} animationDuration={1500} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
