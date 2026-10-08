import React, { useState, useMemo } from "react";
import { 
  TrendingUp, Clock, Calendar, Award, CheckCircle2, 
  BarChart2, Filter, Sparkles, Flame, History, Info
} from "lucide-react";
import { RoutineLog, Task } from "../types";

interface ProgressChartProps {
  logs: RoutineLog[];
  tasks: Task[];
}

// Mock/Demo historical logs representing 10 days of progress for a child using the app
const DEMO_LOGS: RoutineLog[] = [
  { id: "demo-1", timestamp: "2026-07-13T08:15:00Z", taskTitle: "Escovar os Dentes", durationSeconds: 240, status: "completed", stepsProgress: "2/4 passos" },
  { id: "demo-2", timestamp: "2026-07-13T19:30:00Z", taskTitle: "Tomar Banho", durationSeconds: 650, status: "completed", stepsProgress: "3/5 passos" },
  { id: "demo-3", timestamp: "2026-07-14T08:10:00Z", taskTitle: "Escovar os Dentes", durationSeconds: 210, status: "completed", stepsProgress: "3/4 passos" },
  { id: "demo-4", timestamp: "2026-07-14T19:15:00Z", taskTitle: "Tomar Banho", durationSeconds: 610, status: "completed", stepsProgress: "4/5 passos" },
  { id: "demo-5", timestamp: "2026-07-15T08:12:00Z", taskTitle: "Escovar os Dentes", durationSeconds: 190, status: "completed", stepsProgress: "4/4 passos" },
  { id: "demo-6", timestamp: "2026-07-15T19:20:00Z", taskTitle: "Tomar Banho", durationSeconds: 540, status: "completed", stepsProgress: "5/5 passos" },
  { id: "demo-7", timestamp: "2026-07-16T08:05:00Z", taskTitle: "Escovar os Dentes", durationSeconds: 165, status: "completed", stepsProgress: "4/4 passos" },
  { id: "demo-8", timestamp: "2026-07-16T19:10:00Z", taskTitle: "Tomar Banho", durationSeconds: 480, status: "completed", stepsProgress: "5/5 passos" },
  { id: "demo-9", timestamp: "2026-07-17T08:08:00Z", taskTitle: "Escovar os Dentes", durationSeconds: 140, status: "completed", stepsProgress: "4/4 passos" },
  { id: "demo-10", timestamp: "2026-07-17T19:05:00Z", taskTitle: "Tomar Banho", durationSeconds: 420, status: "completed", stepsProgress: "5/5 passos" },
  { id: "demo-11", timestamp: "2026-07-18T08:05:00Z", taskTitle: "Escovar os Dentes", durationSeconds: 130, status: "completed", stepsProgress: "4/4 passos" },
  { id: "demo-12", timestamp: "2026-07-18T19:12:00Z", taskTitle: "Tomar Banho", durationSeconds: 395, status: "completed", stepsProgress: "5/5 passos" },
  { id: "demo-13", timestamp: "2026-07-19T08:11:00Z", taskTitle: "Escovar os Dentes", durationSeconds: 125, status: "completed", stepsProgress: "4/4 passos" },
  { id: "demo-14", timestamp: "2026-07-19T19:00:00Z", taskTitle: "Tomar Banho", durationSeconds: 380, status: "completed", stepsProgress: "5/5 passos" },
  { id: "demo-15", timestamp: "2026-07-20T08:03:00Z", taskTitle: "Escovar os Dentes", durationSeconds: 110, status: "completed", stepsProgress: "4/4 passos" },
  { id: "demo-16", timestamp: "2026-07-20T19:02:00Z", taskTitle: "Tomar Banho", durationSeconds: 370, status: "completed", stepsProgress: "5/5 passos" },
  { id: "demo-17", timestamp: "2026-07-21T08:05:00Z", taskTitle: "Escovar os Dentes", durationSeconds: 95, status: "completed", stepsProgress: "4/4 passos" },
  { id: "demo-18", timestamp: "2026-07-21T19:15:00Z", taskTitle: "Tomar Banho", durationSeconds: 360, status: "completed", stepsProgress: "5/5 passos" },
  { id: "demo-19", timestamp: "2026-07-22T08:10:00Z", taskTitle: "Escovar os Dentes", durationSeconds: 90, status: "completed", stepsProgress: "4/4 passos" },
  { id: "demo-20", timestamp: "2026-07-22T19:05:00Z", taskTitle: "Tomar Banho", durationSeconds: 345, status: "completed", stepsProgress: "5/5 passos" },
];

export default function ProgressChart({ logs, tasks }: ProgressChartProps) {
  const [useDemoData, setUseDemoData] = useState<boolean>(logs.length < 3);
  const [selectedTaskTitle, setSelectedTaskTitle] = useState<string>("Todas");
  const [periodDays, setPeriodDays] = useState<number>(30);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [activeMetric, setActiveMetric] = useState<"time" | "steps">("time");

  // Determine active logs source
  const sourceLogs = useMemo(() => {
    return useDemoData ? DEMO_LOGS : logs;
  }, [useDemoData, logs]);

  // Extract all unique task titles from logs to filter on
  const availableTaskTitles = useMemo(() => {
    const titles = new Set<string>();
    sourceLogs.forEach(log => {
      if (log.taskTitle) titles.add(log.taskTitle);
    });
    // Add real tasks as options too if they are not in the logs yet
    tasks.forEach(t => titles.add(t.title));
    return Array.from(titles);
  }, [sourceLogs, tasks]);

  // Filter & Sort logs
  const filteredLogs = useMemo(() => {
    const now = new Date();
    const cutoffDate = new Date();
    cutoffDate.setDate(now.getDate() - periodDays);

    return sourceLogs
      .filter(log => {
        // Filter by task title
        if (selectedTaskTitle !== "Todas" && log.taskTitle !== selectedTaskTitle) {
          return false;
        }
        // Filter by period
        const logDate = new Date(log.timestamp);
        return logDate >= cutoffDate;
      })
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [sourceLogs, selectedTaskTitle, periodDays]);

  // Calculate high-level stats
  const stats = useMemo(() => {
    if (filteredLogs.length === 0) {
      return {
        totalCompletions: 0,
        averageTimeMinutes: 0,
        consistencyRate: 0,
        stepCompletionPercent: 0,
      };
    }

    const total = filteredLogs.length;
    const completedCount = filteredLogs.filter(l => l.status === "completed").length;
    const consistencyRate = Math.round((completedCount / total) * 100);

    // Filter only completed to calculate average execution time
    const completedLogs = filteredLogs.filter(l => l.status === "completed");
    const totalSeconds = completedLogs.reduce((acc, curr) => acc + curr.durationSeconds, 0);
    const averageTimeMinutes = completedLogs.length > 0 
      ? Math.round((totalSeconds / completedLogs.length) / 60 * 10) / 10 
      : 0;

    // Calculate step completion rate
    let totalCompletedSteps = 0;
    let totalExpectedSteps = 0;

    filteredLogs.forEach(log => {
      if (log.stepsProgress && log.stepsProgress.includes("/")) {
        const parts = log.stepsProgress.split("/");
        const comp = parseInt(parts[0], 10);
        const exp = parseInt(parts[1], 10);
        if (!isNaN(comp) && !isNaN(exp) && exp > 0) {
          totalCompletedSteps += comp;
          totalExpectedSteps += exp;
        }
      }
    });

    const stepCompletionPercent = totalExpectedSteps > 0
      ? Math.round((totalCompletedSteps / totalExpectedSteps) * 100)
      : 100;

    return {
      totalCompletions: completedCount,
      averageTimeMinutes,
      consistencyRate,
      stepCompletionPercent,
    };
  }, [filteredLogs]);

  // Chart measurements
  const chartWidth = 500;
  const chartHeight = 220;
  const paddingX = 45;
  const paddingY = 30;

  // Render variables for drawing custom SVG
  const chartData = useMemo(() => {
    if (filteredLogs.length < 2) return [];

    // Get max value to scale Y axis
    let maxVal = 1;
    if (activeMetric === "time") {
      maxVal = Math.max(...filteredLogs.map(l => l.durationSeconds / 60), 1);
    } else {
      maxVal = 100; // Step completion percent
    }

    // Give some Y padding
    const yMaxLimit = activeMetric === "time" ? maxVal * 1.15 : 110;

    return filteredLogs.map((log, index) => {
      const x = paddingX + (index * (chartWidth - paddingX * 2)) / (filteredLogs.length - 1);
      
      let val = 0;
      if (activeMetric === "time") {
        val = log.durationSeconds / 60;
      } else {
        // Parse step completion percent
        if (log.stepsProgress && log.stepsProgress.includes("/")) {
          const parts = log.stepsProgress.split("/");
          const comp = parseInt(parts[0], 10);
          const exp = parseInt(parts[1], 10);
          val = exp > 0 ? (comp / exp) * 100 : 100;
        } else {
          val = 100;
        }
      }

      // Invert Y because (0,0) is top-left in SVG
      const y = chartHeight - paddingY - (val * (chartHeight - paddingY * 2)) / yMaxLimit;

      return {
        x,
        y,
        value: val,
        date: new Date(log.timestamp),
        label: log.taskTitle,
        steps: log.stepsProgress,
        status: log.status
      };
    });
  }, [filteredLogs, activeMetric]);

  // Build the SVG path string for the line
  const linePath = useMemo(() => {
    if (chartData.length < 2) return "";
    return chartData.reduce((path, pt, index) => {
      return path + `${index === 0 ? "M" : "L"} ${pt.x} ${pt.y}`;
    }, "");
  }, [chartData]);

  // Build the area path for the gradient fill underneath
  const areaPath = useMemo(() => {
    if (chartData.length < 2) return "";
    const startX = chartData[0].x;
    const endX = chartData[chartData.length - 1].x;
    const bottomY = chartHeight - paddingY;
    return `${linePath} L ${endX} ${bottomY} L ${startX} ${bottomY} Z`;
  }, [chartData, linePath]);

  return (
    <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-xs select-none">
      
      {/* Chart Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-50 pb-5 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#FF7A00]" />
            <h3 className="text-lg font-black text-slate-800">Gráfico de Evolução e Autonomia</h3>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Acompanhe o ganho de velocidade (foco) e a consistência no cumprimento de micro-passos.
          </p>
        </div>

        {/* Filters and Demonstration Data toggler */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Demo Toggler */}
          <button
            id="btn-toggle-demo-data"
            onClick={() => setUseDemoData(!useDemoData)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
              useDemoData 
                ? "bg-amber-50 text-amber-700 border border-amber-100 shadow-3xs"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200 border border-transparent"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{useDemoData ? "Visualizando Simulação" : "Ver Dados de Simulação"}</span>
          </button>

          {/* Task Select Filter */}
          <div className="flex items-center gap-1 bg-[#FAF9F6] border border-gray-150 rounded-xl px-2 py-1">
            <Filter className="w-3 h-3 text-gray-400" />
            <select
              id="select-task-filter"
              value={selectedTaskTitle}
              onChange={(e) => {
                setSelectedTaskTitle(e.target.value);
                setHoveredIndex(null);
              }}
              className="bg-transparent text-xs font-extrabold text-slate-700 outline-none border-none py-0.5 pr-4 cursor-pointer"
            >
              <option value="Todas">Todas as Tarefas</option>
              {availableTaskTitles.map(title => (
                <option key={title} value={title}>{title}</option>
              ))}
            </select>
          </div>

          {/* Period Filter */}
          <div className="flex items-center gap-1 bg-[#FAF9F6] border border-gray-150 rounded-xl px-2 py-1">
            <Calendar className="w-3 h-3 text-gray-400" />
            <select
              id="select-period-filter"
              value={periodDays}
              onChange={(e) => {
                setPeriodDays(Number(e.target.value));
                setHoveredIndex(null);
              }}
              className="bg-transparent text-xs font-extrabold text-slate-700 outline-none border-none py-0.5 pr-4 cursor-pointer"
            >
              <option value="7">Últimos 7 dias</option>
              <option value="30">Últimos 30 dias</option>
              <option value="90">Últimos 90 dias</option>
            </select>
          </div>
        </div>
      </div>

      {/* Analytical Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#F8FAFC] border border-[#F1F5F9] rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-2">
            Taxa de Conclusão
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-[#1E293B]">
              {stats.consistencyRate}%
            </span>
          </div>
          <p className="text-[9px] text-gray-400 font-bold mt-1.5 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
            <span>Consistência de rotina</span>
          </p>
        </div>

        <div className="bg-[#F8FAFC] border border-[#F1F5F9] rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-2">
            Tempo Médio
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-[#1E293B]">
              {stats.averageTimeMinutes}
            </span>
            <span className="text-xs font-black text-slate-500">min</span>
          </div>
          <p className="text-[9px] text-gray-400 font-bold mt-1.5 flex items-center gap-1">
            <Clock className="w-3 h-3 text-[#FF7A00] shrink-0" />
            <span>Foco por execução</span>
          </p>
        </div>

        <div className="bg-[#F8FAFC] border border-[#F1F5F9] rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-2">
            Total Concluído
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-[#1E293B]">
              {stats.totalCompletions}
            </span>
            <span className="text-xs font-black text-slate-500">vezes</span>
          </div>
          <p className="text-[9px] text-gray-400 font-bold mt-1.5 flex items-center gap-1">
            <Flame className="w-3 h-3 text-orange-500 shrink-0 animate-bounce" />
            <span>Hábitos reforçados</span>
          </p>
        </div>

        <div className="bg-[#F8FAFC] border border-[#F1F5F9] rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-2">
            Autonomia de Passos
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-[#1E293B]">
              {stats.stepCompletionPercent}%
            </span>
          </div>
          <p className="text-[9px] text-gray-400 font-bold mt-1.5 flex items-center gap-1">
            <Award className="w-3 h-3 text-amber-500 shrink-0" />
            <span>Micro-passos feitos</span>
          </p>
        </div>
      </div>

      {/* Pedagogical insight on clinical impact */}
      {useDemoData && (
        <div className="bg-amber-50/50 border border-amber-100/60 rounded-2xl p-3.5 mb-6 flex gap-3 items-start text-left">
          <Info className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h4 className="text-xs font-black text-amber-800">
              Metodologia de Aprendizado & Autocuidado (Dr. Fabrine Fernandes)
            </h4>
            <p className="text-[11px] text-amber-700 leading-relaxed font-medium">
              Observe como a curva de tempo de execução cai de 4 minutos para 1.5 minutos nas primeiras 10 sessões. O micro-fracionamento (chunking) visual reduz a fricção de transição do TDAH, promovendo uma rápida curva de independência!
            </p>
          </div>
        </div>
      )}

      {/* Chart Visual Section */}
      <div className="relative bg-slate-50/50 rounded-2xl p-4 border border-slate-100 flex flex-col items-stretch">
        
        {/* Metric Selector Tab */}
        <div className="flex gap-2 mb-4 self-start bg-[#FAF9F6] border border-gray-150 p-1 rounded-xl">
          <button
            id="btn-metric-time"
            onClick={() => {
              setActiveMetric("time");
              setHoveredIndex(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
              activeMetric === "time"
                ? "bg-white text-[#FF7A00] shadow-3xs"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Tempo de Execução (minutos)
          </button>
          <button
            id="btn-metric-steps"
            onClick={() => {
              setActiveMetric("steps");
              setHoveredIndex(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
              activeMetric === "steps"
                ? "bg-white text-[#10B981] shadow-3xs"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Autonomia de Micro-passos (%)
          </button>
        </div>

        {filteredLogs.length < 2 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center text-gray-400">
            <BarChart2 className="w-10 h-10 mb-2 text-gray-300" />
            <p className="text-xs font-bold">Histórico insuficiente para traçar curva de evolução.</p>
            <p className="text-[10px] mt-1 max-w-xs leading-normal">
              A curva de evolução precisa de pelo menos 2 registros para começar a traçar as linhas de progresso de rotina.
            </p>
          </div>
        ) : (
          <div className="w-full relative">
            
            {/* SVG Visual Chart */}
            <svg 
              className="w-full overflow-visible" 
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              style={{ maxHeight: "220px" }}
            >
              <defs>
                {/* Modern Gradient fill */}
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop 
                    offset="0%" 
                    stopColor={activeMetric === "time" ? "#FF7A00" : "#10B981"} 
                    stopOpacity="0.25" 
                  />
                  <stop 
                    offset="100%" 
                    stopColor={activeMetric === "time" ? "#FF7A00" : "#10B981"} 
                    stopOpacity="0.0" 
                  />
                </linearGradient>
              </defs>

              {/* Grid Y Lines & Labels */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                const yVal = paddingY + ratio * (chartHeight - paddingY * 2);
                let label = "";
                if (activeMetric === "time") {
                  const maxMinutes = Math.max(...filteredLogs.map(l => l.durationSeconds / 60), 1) * 1.15;
                  const value = (1 - ratio) * maxMinutes;
                  label = value >= 1 ? `${Math.round(value)}m` : `${Math.round(value * 60)}s`;
                } else {
                  label = `${Math.round((1 - ratio) * 100)}%`;
                }

                return (
                  <g key={idx} className="opacity-40">
                    <line 
                      x1={paddingX} 
                      y1={yVal} 
                      x2={chartWidth - paddingX} 
                      y2={yVal} 
                      stroke="#E2E8F0" 
                      strokeDasharray="4 4" 
                      strokeWidth="1"
                    />
                    <text 
                      x={paddingX - 10} 
                      y={yVal + 3} 
                      textAnchor="end" 
                      className="text-[9px] font-bold fill-slate-400"
                    >
                      {label}
                    </text>
                  </g>
                );
              })}

              {/* Grid X Dates (Starts, Mid, End) */}
              {chartData.length > 0 && (
                <g className="opacity-60">
                  {/* First Date */}
                  <text 
                    x={chartData[0].x} 
                    y={chartHeight - paddingY + 16} 
                    textAnchor="start" 
                    className="text-[9px] font-bold fill-slate-400"
                  >
                    {chartData[0].date.toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}
                  </text>
                  {/* Mid Date if there are more than 3 */}
                  {chartData.length > 3 && (
                    <text 
                      x={chartData[Math.floor(chartData.length / 2)].x} 
                      y={chartHeight - paddingY + 16} 
                      textAnchor="middle" 
                      className="text-[9px] font-bold fill-slate-400"
                    >
                      {chartData[Math.floor(chartData.length / 2)].date.toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}
                    </text>
                  )}
                  {/* Last Date */}
                  <text 
                    x={chartData[chartData.length - 1].x} 
                    y={chartHeight - paddingY + 16} 
                    textAnchor="end" 
                    className="text-[9px] font-bold fill-slate-400"
                  >
                    {chartData[chartData.length - 1].date.toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}
                  </text>
                </g>
              )}

              {/* Gradient Area Fill */}
              <path d={areaPath} fill="url(#chartGradient)" />

              {/* Smooth trend line */}
              <path 
                d={linePath} 
                fill="none" 
                stroke={activeMetric === "time" ? "#FF7A00" : "#10B981"} 
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Points & Interactive Hover Areas */}
              {chartData.map((pt, idx) => (
                <g key={idx}>
                  {/* Outer glow ring for active hovered point */}
                  {hoveredIndex === idx && (
                    <circle 
                      cx={pt.x} 
                      cy={pt.y} 
                      r="10" 
                      fill={activeMetric === "time" ? "#FF7A00" : "#10B981"} 
                      opacity="0.25" 
                      className="transition-all duration-150"
                    />
                  )}
                  {/* Center Dot */}
                  <circle 
                    cx={pt.x} 
                    cy={pt.y} 
                    r="4.5" 
                    fill="#FFFFFF" 
                    stroke={activeMetric === "time" ? "#FF7A00" : "#10B981"} 
                    strokeWidth="3"
                    className="transition-all duration-150"
                  />
                  {/* Invisible mouse catcher */}
                  <circle 
                    cx={pt.x} 
                    cy={pt.y} 
                    r="15" 
                    fill="transparent" 
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    onTouchStart={() => setHoveredIndex(idx)}
                  />
                </g>
              ))}
            </svg>

            {/* Dynamic HTML Tooltip Overlay centered over hovered point */}
            {hoveredIndex !== null && chartData[hoveredIndex] && (
              <div 
                className="absolute z-10 bg-slate-900 text-white rounded-xl p-3 shadow-lg pointer-events-none transition-all duration-100 ease-out max-w-[200px] text-left text-xs"
                style={{
                  left: `${(chartData[hoveredIndex].x / chartWidth) * 100}%`,
                  top: `${(chartData[hoveredIndex].y / chartHeight) * 100 - 32}%`,
                  transform: "translate(-50%, -100%)",
                }}
              >
                <div className="absolute w-2.5 h-2.5 bg-slate-900 rotate-45 bottom-[-5px] left-1/2 transform -translate-x-1/2" />
                <p className="font-bold text-[#FF7A00] truncate">
                  {chartData[hoveredIndex].label}
                </p>
                <p className="text-[10px] text-slate-300 mt-0.5">
                  {chartData[hoveredIndex].date.toLocaleDateString("pt-BR")} às {chartData[hoveredIndex].date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </p>
                <div className="border-t border-slate-700/80 my-1.5 pt-1 space-y-0.5">
                  <p className="font-extrabold flex items-center justify-between gap-2">
                    <span className="text-slate-400">Tempo:</span>
                    <span>
                      {Math.floor(filteredLogs[hoveredIndex].durationSeconds / 60)}m {filteredLogs[hoveredIndex].durationSeconds % 60}s
                    </span>
                  </p>
                  <p className="font-extrabold flex items-center justify-between gap-2">
                    <span className="text-slate-400">Passos:</span>
                    <span className="text-emerald-400">
                      {chartData[hoveredIndex].steps || "N/A"}
                    </span>
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
