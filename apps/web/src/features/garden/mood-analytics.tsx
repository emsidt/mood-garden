import { useMemo, useState } from 'react';
import type { Mood, MoodEntry } from './garden-pages';

const MOOD_META: Record<Mood, { icon: string; label: string; cellBg: string; cellBorder: string; barBg: string; cardBg: string }> = {
  HAPPY:    { icon: '☀️', label: 'Vui vẻ',     cellBg: '#fef3c7', cellBorder: '#f59e0b', barBg: '#fcd34d', cardBg: '#fffbeb' },
  CALM:     { icon: '🍃', label: 'Bình yên',   cellBg: '#dcfce7', cellBorder: '#4ade80', barBg: '#86efac', cardBg: '#f0fdf4' },
  EXCITED:  { icon: '✨', label: 'Hào hứng',   cellBg: '#ffedd5', cellBorder: '#fb923c', barBg: '#fdba74', cardBg: '#fff7ed' },
  TIRED:    { icon: '🌙', label: 'Mệt mỏi',    cellBg: '#dbeafe', cellBorder: '#60a5fa', barBg: '#93c5fd', cardBg: '#eff6ff' },
  SAD:      { icon: '🌧️', label: 'Buồn',       cellBg: '#ede9fe', cellBorder: '#a78bfa', barBg: '#c4b5fd', cardBg: '#f5f3ff' },
  STRESSED: { icon: '🫧', label: 'Căng thẳng', cellBg: '#fee2e2', cellBorder: '#f87171', barBg: '#fca5a5', cardBg: '#fef2f2' },
};

const MOOD_ORDER: Mood[] = ['HAPPY', 'CALM', 'EXCITED', 'TIRED', 'SAD', 'STRESSED'];
const DAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const WEEKS = 13;

type Cell = { date: string; entry: MoodEntry | null; isFuture: boolean };

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function parseLocalDate(dateStr: string): Date {
  const [y, m, day] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, day);
}

export function MoodAnalytics({ entries }: { entries: MoodEntry[] }) {
  if (entries.length < 2) return null;
  return (
    <section className="mood-analytics">
      <div className="section-heading">
        <h2>Nhìn lại cảm xúc</h2>
        <span>{entries.length} lần đã ghi lại</span>
      </div>
      <HeatmapCalendar entries={entries} />
      <div className="analytics-grid">
        <MoodDistribution entries={entries} />
        <InsightCards entries={entries} />
      </div>
    </section>
  );
}

function HeatmapCalendar({ entries }: { entries: MoodEntry[] }) {
  const [tooltip, setTooltip] = useState<{ cell: Cell; x: number; y: number } | null>(null);

  const dateMap = useMemo(() => {
    const map = new Map<string, MoodEntry>();
    for (const e of entries) map.set(e.entryDate.slice(0, 10), e);
    return map;
  }, [entries]);

  const cells = useMemo<Cell[]>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const mondayOffset = (today.getDay() + 6) % 7;
    const start = new Date(today);
    start.setDate(today.getDate() - mondayOffset - (WEEKS - 1) * 7);
    const result: Cell[] = [];
    const cur = new Date(start);
    for (let i = 0; i < WEEKS * 7; i++) {
      const dateStr = toDateStr(cur);
      const isFuture = cur > today;
      result.push({ date: dateStr, entry: isFuture ? null : (dateMap.get(dateStr) ?? null), isFuture });
      cur.setDate(cur.getDate() + 1);
    }
    return result;
  }, [dateMap]);

  const monthLabels = useMemo(() => {
    const labels: string[] = [];
    let lastMonth = -1;
    for (let wi = 0; wi < WEEKS; wi++) {
      const cell = cells[wi * 7];
      if (cell) {
        const d = parseLocalDate(cell.date);
        const month = d.getMonth();
        labels.push(month !== lastMonth ? (lastMonth = month, d.toLocaleDateString('vi-VN', { month: 'short' })) : '');
      } else {
        labels.push('');
      }
    }
    return labels;
  }, [cells]);

  return (
    <div className="heatmap-wrapper">
      <div className="heatmap-container">
        <div className="heatmap-day-col">
          <div className="heatmap-month-spacer" />
          {DAY_LABELS.map(d => <span key={d} className="heatmap-day-label">{d}</span>)}
        </div>
        <div className="heatmap-scroll-area">
          <div className="heatmap-months" style={{ gridTemplateColumns: `repeat(${WEEKS}, 14px)` }}>
            {monthLabels.map((label, i) => <span key={i}>{label}</span>)}
          </div>
          <div className="heatmap-grid">
            {cells.map((cell, i) => {
              const meta = cell.entry ? MOOD_META[cell.entry.mood] : null;
              return (
                <span
                  key={i}
                  className={'heatmap-cell' + (cell.isFuture ? ' heatmap-cell-future' : '')}
                  style={meta ? { background: meta.cellBg, borderColor: meta.cellBorder } : undefined}
                  onMouseEnter={e => !cell.isFuture && setTooltip({ cell, x: e.clientX, y: e.clientY })}
                  onMouseLeave={() => setTooltip(null)}
                />
              );
            })}
          </div>
        </div>
      </div>
      <div className="heatmap-legend">
        {MOOD_ORDER.map(mood => {
          const meta = MOOD_META[mood];
          return (
            <span key={mood} className="heatmap-legend-item">
              <span className="heatmap-legend-dot" style={{ background: meta.cellBg, borderColor: meta.cellBorder }} />
              {meta.icon} {meta.label}
            </span>
          );
        })}
        <span className="heatmap-legend-item">
          <span className="heatmap-legend-dot" />
          Chưa ghi
        </span>
      </div>
      {tooltip && (
        <div className="heatmap-tooltip" style={{ left: tooltip.x, top: tooltip.y }} role="tooltip">
          <strong>{parseLocalDate(tooltip.cell.date).toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</strong>
          {tooltip.cell.entry
            ? <><span>{MOOD_META[tooltip.cell.entry.mood].icon} {MOOD_META[tooltip.cell.entry.mood].label}</span>{tooltip.cell.entry.note && <em>{tooltip.cell.entry.note}</em>}</>
            : <span className="tooltip-empty">Chưa ghi lại hôm nay</span>}
        </div>
      )}
    </div>
  );
}

function MoodDistribution({ entries }: { entries: MoodEntry[] }) {
  const { counts, total } = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    cutoff.setHours(0, 0, 0, 0);
    const last30 = entries.filter(e => parseLocalDate(e.entryDate.slice(0, 10)) >= cutoff);
    const counts = MOOD_ORDER.reduce<Record<string, number>>((acc, m) => ({ ...acc, [m]: 0 }), {});
    for (const e of last30) counts[e.mood]++;
    return { counts, total: last30.length };
  }, [entries]);

  const maxCount = Math.max(...Object.values(counts), 1);

  return (
    <div className="mood-distribution-card">
      <h3>Phân bố cảm xúc <span className="card-subtitle">30 ngày qua</span></h3>
      <div className="distribution-bars">
        {MOOD_ORDER.map(mood => {
          const count = counts[mood];
          const pct = total > 0 ? Math.round(count / total * 100) : 0;
          const meta = MOOD_META[mood];
          return (
            <div key={mood} className="distribution-row">
              <span className="distribution-label">{meta.icon} {meta.label}</span>
              <div className="distribution-track">
                <div className="distribution-fill" style={{ width: (count / maxCount * 100) + '%', background: meta.barBg }} />
              </div>
              <span className="distribution-pct">{count > 0 ? pct + '%' : '—'}</span>
            </div>
          );
        })}
      </div>
      {total > 0 && <p className="distribution-note">{total} lần ghi trong 30 ngày</p>}
    </div>
  );
}

function InsightCards({ entries }: { entries: MoodEntry[] }) {
  const insights = useMemo(() => {
    if (entries.length < 3) return [];
    const result: Array<{ icon: string; title: string; text: string; bg: string }> = [];

    // Most common mood
    const counts: Partial<Record<Mood, number>> = {};
    for (const e of entries) counts[e.mood] = (counts[e.mood] ?? 0) + 1;
    const topEntry = (Object.entries(counts) as [Mood, number][]).sort((a, b) => b[1] - a[1])[0];
    if (topEntry) {
      const meta = MOOD_META[topEntry[0]];
      result.push({ icon: meta.icon, title: 'Cảm xúc phổ biến nhất', text: `Bạn hay cảm thấy ${meta.label.toLowerCase()} nhất — ${topEntry[1]} lần ghi lại.`, bg: meta.cardBg });
    }

    // Best day of week
    const POSITIVE = new Set<Mood>(['HAPPY', 'CALM', 'EXCITED']);
    const dayPos: Record<number, number> = {};
    const dayTot: Record<number, number> = {};
    for (const e of entries) {
      const dow = (parseLocalDate(e.entryDate.slice(0, 10)).getDay() + 6) % 7;
      dayTot[dow] = (dayTot[dow] ?? 0) + 1;
      if (POSITIVE.has(e.mood)) dayPos[dow] = (dayPos[dow] ?? 0) + 1;
    }
    const scored = Object.keys(dayTot).map(Number).filter(dow => dayTot[dow] >= 2)
      .map(dow => ({ dow, score: (dayPos[dow] ?? 0) / dayTot[dow]! }))
      .sort((a, b) => b.score - a.score);
    if (scored.length > 0) {
      const dayNames = ['thứ hai', 'thứ ba', 'thứ tư', 'thứ năm', 'thứ sáu', 'thứ bảy', 'chủ nhật'];
      const best = scored[0];
      result.push({ icon: '🗓️', title: 'Ngày tích cực nhất', text: `Vào ${dayNames[best.dow]}, bạn thường cảm thấy tích cực hơn (${Math.round(best.score * 100)}% lần check-in).`, bg: '#f0fdf4' });
    }

    // Monthly check-in rate
    const now = new Date();
    const daysSoFar = now.getDate();
    const thisMonth = entries.filter(e => {
      const d = parseLocalDate(e.entryDate.slice(0, 10));
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const rate = Math.round(thisMonth.length / daysSoFar * 100);
    const rateLabel = rate >= 80 ? 'Tuyệt vời! 🌟' : rate >= 50 ? 'Khá đều đặn 🌿' : 'Cố gắng thêm nhé 🌱';
    result.push({ icon: '📊', title: 'Check-in tháng này', text: `${thisMonth.length} / ${daysSoFar} ngày — ${rate}% — ${rateLabel}`, bg: '#fbfcf7' });

    return result;
  }, [entries]);

  if (!insights.length) return null;

  return (
    <div className="insight-section">
      <h3>Nhận xét <span className="card-subtitle">từ dữ liệu của bạn</span></h3>
      <div className="insight-cards">
        {insights.map((ins, i) => (
          <div key={i} className="insight-card" style={{ background: ins.bg }}>
            <span className="insight-icon">{ins.icon}</span>
            <div>
              <strong>{ins.title}</strong>
              <p>{ins.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
