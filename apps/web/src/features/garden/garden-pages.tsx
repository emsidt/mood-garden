import { FormEvent, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, errorMessage } from '../../lib/api';

type Mood = 'HAPPY' | 'CALM' | 'EXCITED' | 'TIRED' | 'SAD' | 'STRESSED';
type MoodEntry = { id: string; mood: Mood; note: string | null; entryDate: string; createdAt: string };
type Garden = {
  level: number; experience: number; theme: string; streak: { current: number; longest: number };
  progress: { current: number; target: number; nextLevelAt: number };
  unlocked: Array<{ level: number; name: string; icon: string; description: string }>;
  nextUnlock: { level: number; name: string; icon: string; description: string } | null;
};
type CurrentWeather = {
  city: string; temperature: number; feelsLike: number; condition: string; conditionText: string;
  rain: boolean; windSpeed: number; humidity: number; uvIndex: number; observedAt: string;
};
const moods: Array<{ value: Mood; icon: string; label: string; text: string }> = [
  { value: 'HAPPY', icon: '☀️', label: 'Vui vẻ', text: 'Hôm nay có một điều gì khiến bạn mỉm cười.' },
  { value: 'CALM', icon: '🍃', label: 'Bình yên', text: 'Bạn đang có một khoảng thở dịu dàng.' },
  { value: 'EXCITED', icon: '✨', label: 'Hào hứng', text: 'Năng lượng hôm nay đang muốn nở rộ.' },
  { value: 'TIRED', icon: '🌙', label: 'Mệt mỏi', text: 'Bạn có thể đi chậm lại một chút.' },
  { value: 'SAD', icon: '🌧️', label: 'Buồn', text: 'Cảm xúc này xứng đáng được lắng nghe.' },
  { value: 'STRESSED', icon: '🫧', label: 'Căng thẳng', text: 'Hãy nhẹ nhàng với chính mình hôm nay.' },
];
const moodByValue = Object.fromEntries(moods.map(item => [item.value, item]));

export function MoodPage() {
  const client = useQueryClient();
  const today = useQuery({ queryKey: ['mood-today'], queryFn: async () => (await api.get<MoodEntry | null>('/moods/today')).data });
  const history = useQuery({ queryKey: ['mood-history'], queryFn: async () => (await api.get<MoodEntry[]>('/moods/history')).data });
  const [chosen, setChosen] = useState<Mood | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!chosen) { setError('Chọn một cảm xúc trước nhé.'); return; }
    setBusy(true); setError('');
    try {
      await api.post('/moods', { mood: chosen, note });
      await Promise.all([client.invalidateQueries({ queryKey: ['mood-today'] }), client.invalidateQueries({ queryKey: ['mood-history'] }), client.invalidateQueries({ queryKey: ['garden'] })]);
    } catch (cause) { setError(errorMessage(cause)); } finally { setBusy(false); }
  }
  if (today.isPending) return <section className="placeholder"><p role="status">Đang chuẩn bị khoảng dừng cho bạn…</p></section>;
  const entry = today.data;
  return <section className="mood-page">
    <p className="eyebrow">MỘT KHOẢNG DỪNG NHỎ</p>
    <h1>Hôm nay bạn<br />thấy thế nào?</h1>
    {entry ? <CheckedIn entry={entry} /> : <form onSubmit={submit}>
      <div className="mood-options">{moods.map(item => <button type="button" key={item.value} className={'mood-option ' + (chosen === item.value ? 'selected' : '')} onClick={() => { setChosen(item.value); setError(''); }}>
        <span>{item.icon}</span><strong>{item.label}</strong>
      </button>)}</div>
      {chosen && <p className="mood-copy">{moodByValue[chosen].text}</p>}
      <label className="note-label">Một vài dòng nếu bạn muốn<textarea value={note} onChange={event => setNote(event.target.value)} maxLength={500} placeholder="Hôm nay có điều gì ở lại với bạn?" /></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button" disabled={busy}>{busy ? 'Đang gieo hạt mầm…' : 'Lưu cảm xúc hôm nay'}</button>
    </form>}
    <MoodHistory entries={history.data ?? []} />
  </section>;
}
function CheckedIn({ entry }: { entry: MoodEntry }) {
  const mood = moodByValue[entry.mood];
  return <div className="checked-in"><span>{mood.icon}</span><div><h2>Bạn đã chọn {mood.label.toLowerCase()} hôm nay.</h2><p>{entry.note || mood.text}</p><small>Một check-in đã giúp khu vườn của bạn thêm 25 XP.</small></div></div>;
}
function MoodHistory({ entries }: { entries: MoodEntry[] }) {
  if (!entries.length) return null;
  return <section className="mood-history"><div className="section-heading"><h2>Những ngày đã qua</h2><span>{entries.length} lần ghi lại</span></div><div className="history-list">{entries.slice(0, 7).map(entry => {
    const mood = moodByValue[entry.mood];
    return <article key={entry.id}><span>{mood.icon}</span><div><strong>{mood.label}</strong><p>{entry.note || mood.text}</p></div><time>{new Date(entry.entryDate).toLocaleDateString('vi-VN', { day: '2-digit', month: 'short' })}</time></article>;
  })}</div></section>;
}
export function GardenPage() {
  const garden = useQuery({ queryKey: ['garden'], queryFn: async () => (await api.get<Garden>('/garden')).data });
  const weather = useQuery({
    queryKey: ['weather-current', 'v3'],
    queryFn: async () => (await api.get<CurrentWeather>('/weather/current?client=v3')).data,
    staleTime: 15 * 60 * 1000,
    retry: 3,
    retryDelay: 1500,
  });
  const rainDrops = useMemo(() => Array.from({ length: 22 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    height: 12 + Math.random() * 18,
    delay: Math.random() * 2,
    duration: 0.6 + Math.random() * 0.6,
  })), []);
  if (garden.isPending) return <section className="placeholder"><p role="status">Đang mở khu vườn của bạn…</p></section>;
  if (garden.isError) return <section className="placeholder"><p role="alert">{errorMessage(garden.error)}</p><button className="button" onClick={() => { void garden.refetch(); }}>Thử lại</button></section>;
  const data = garden.data!;
  const percent = Math.max(0, Math.min(100, Math.round(data.progress.current / data.progress.target * 100)));
  const weatherClass = weather.data?.rain ? 'weather-rain' : weather.data && weather.data.condition !== 'CLEAR' ? 'weather-cloudy' : '';
  return <section className="garden-page">
    <p className="eyebrow">KHU VƯỜN CỦA BẠN</p><div className="section-heading"><div><h1>Đang lớn lên<br />từng chút một.</h1><p className="garden-subtitle">Mỗi lần bạn lắng nghe mình, khu vườn lại có thêm sức sống.</p></div><div className="garden-level"><span>Cấp độ</span><strong>{data.level}</strong></div></div>
    <div className={'garden-scene ' + weatherClass} aria-label={'Khu vườn cấp ' + data.level}><span className="scene-sun" /><span className="scene-cloud cloud-one">☁</span><span className="scene-cloud cloud-two">☁</span><span className="scene-hill hill-far" /><span className="scene-hill hill-near" />{data.unlocked.map((item, index) => <span key={item.name} className={'scene-plant plant-' + index} title={item.name}>{item.icon}</span>)}<div className="rain-container">{rainDrops.map(d => <span key={d.id} className="rain-drop" style={{ left: d.left + '%', height: d.height + 'px', animationDelay: d.delay + 's', animationDuration: d.duration + 's' }} />)}</div><span className="scene-message">Cứ lớn lên theo nhịp của bạn.</span></div>
    {weather.data ? <><section className="weather-card"><span className="weather-icon">{weather.data.rain ? '🌧️' : weather.data.condition === 'CLEAR' ? '☀️' : '☁️'}</span><div><p className="eyebrow">THỜI TIẾT Ở {weather.data.city.toUpperCase()}</p><strong>{Math.round(weather.data.temperature)}°</strong><span>{weather.data.conditionText} · Cảm giác {Math.round(weather.data.feelsLike)}°</span></div><div className="weather-details"><span>💧 {weather.data.humidity}%</span><span>🍃 {Math.round(weather.data.windSpeed)} km/h</span><span>☀️ UV {weather.data.uvIndex}</span></div></section><p className="weather-credit">Dữ liệu thời tiết bởi <a href="https://www.weatherapi.com/" target="_blank" rel="noreferrer">WeatherAPI.com</a></p></> : weather.isPending ? <p className="weather-loading" role="status">Đang lấy thời tiết theo thành phố của bạn…</p> : weather.isError ? <p className="weather-unavailable">{errorMessage(weather.error)} <button onClick={() => { void weather.refetch(); }}>Thử lại</button></p> : null}
    <div className="garden-stats"><article><span>🔥</span><div><strong>{data.streak.current} ngày</strong><p>Chuỗi hiện tại</p></div></article><article><span>✦</span><div><strong>{data.experience} XP</strong><p>Kinh nghiệm đã tích lũy</p></div></article><article><span>🌿</span><div><strong>{data.streak.longest} ngày</strong><p>Chuỗi dài nhất</p></div></article></div>
    <section className="garden-progress"><div><h2>Tiến độ cấp {data.level}</h2><span>{data.progress.current} / {data.progress.target} XP</span></div><div className="progress-track"><i style={{ width: percent + '%' }} /></div><p>{data.nextUnlock ? <>Còn {Math.max(0, data.progress.nextLevelAt - data.experience)} XP để mở khóa <strong>{data.nextUnlock.icon} {data.nextUnlock.name}</strong>.</> : 'Bạn đã mở khóa tất cả cây trong khu vườn.'}</p></section>
    <section className="unlocks"><div className="section-heading"><h2>Những điều đã nở</h2><span>{data.unlocked.length} mở khóa</span></div><div>{data.unlocked.map(item => <article key={item.name}><span>{item.icon}</span><div><strong>{item.name}</strong><p>{item.description}</p></div><small>Cấp {item.level}</small></article>)}</div></section>
  </section>;
}
