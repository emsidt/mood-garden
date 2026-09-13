import { NavLink, Route, Routes, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from './lib/api';
import { AccountLink, AuthPage as LegacyAuthPage, ProfilePage, RequireAuth } from './features/auth/auth-pages';
import { LoginPage as AuthPage } from './features/auth/login-page';
import { GardenPage, MoodPage } from './features/garden/garden-pages';
import { WardrobePage } from './features/wardrobe/wardrobe-page';

const sections = [
  { path: 'moods', icon: '☀', title: 'Cảm xúc', description: 'Một khoảng dừng nhỏ để lắng nghe bản thân. Ghi lại cảm xúc và nhìn lại hành trình của bạn.' },
  { path: 'garden', icon: '❀', title: 'Khu vườn', description: 'Mỗi ngày chăm sóc bản thân sẽ giúp khu vườn của bạn lớn thêm một chút.' },
  { path: 'wardrobe', icon: '♧', title: 'Tủ đồ', description: 'Tập hợp những món đồ yêu thích, sẵn sàng cho một ngày mới.' },
  { path: 'outfits', icon: '☁', title: 'Trang phục', description: 'Những gợi ý phù hợp với thời tiết và phong cách của riêng bạn.' },
];

function Home() {
  const health = useQuery({ queryKey: ['health'], queryFn: async () => (await api.get<{ status: string }>('/health')).data });
  return <>
    <section className="hero"><div><p className="eyebrow">CHẬM LẠI MỘT CHÚT, MỖI NGÀY</p><h1>Một ngày mới.<br />Một chút nở hoa.</h1><p>Nơi cảm xúc được lắng nghe, và những điều nhỏ bé có không gian để lớn lên.</p><Link className="button" to="/garden">Ghé thăm khu vườn <span aria-hidden="true">↗</span></Link></div><div className="garden-art" aria-hidden="true"><span className="sun" /><span className="hill back" /><span className="hill" /><span className="flower one">✿</span><span className="flower two">✿</span><span className="flower three">✿</span><span className="garden-label">Cứ lớn lên, theo nhịp của bạn.</span></div></section>
    <div className="section-heading"><h2>Góc nhỏ của bạn</h2><span>Mỗi ngày, một chút quan tâm</span></div><div className="cards">{sections.map(section => <Link className="card" to={'/' + section.path} key={section.path}><span className="card-icon" aria-hidden="true">{section.icon}</span><h3>{section.title} <span aria-hidden="true">↗</span></h3><p>{section.description}</p></Link>)}</div>
    <p className="connection" role="status">API: {health.isPending ? 'Đang kết nối…' : health.isError ? 'Chưa kết nối được máy chủ.' : health.data.status === 'ok' ? 'Đã kết nối' : 'Chưa sẵn sàng'} · Phiên bản khởi tạo</p>
  </>;
}

function Placeholder({ title, description, icon }: typeof sections[number]) {
  return <section className="placeholder"><span className="card-icon" aria-hidden="true">{icon}</span><p className="eyebrow">SẮP NẢY MẦM</p><h1>{title}</h1><p>{description}</p><p>Chức năng này sẽ được xây dựng ở giai đoạn tiếp theo.</p><Link className="button" to="/">Về trang hôm nay</Link></section>;
}

export function App() {
  return <div className="shell"><header><Link className="brand" to="/"><span aria-hidden="true">✿</span> mood garden</Link><nav aria-label="Điều hướng chính"><NavLink to="/" end>Hôm nay</NavLink>{sections.map(s => <NavLink key={s.path} to={'/' + s.path}>{s.title}</NavLink>)}<AccountLink /></nav></header><main><Routes><Route path="/" element={<Home />} /><Route path="/login" element={<AuthPage key="login" mode="login" />} /><Route path="/register" element={<AuthPage key="register" mode="register" />} /><Route element={<RequireAuth />}><Route path="/profile" element={<ProfilePage />} /><Route path="/moods" element={<MoodPage />} /><Route path="/garden" element={<GardenPage />} /><Route path="/wardrobe" element={<WardrobePage />} /><Route path="/outfits" element={<Placeholder {...sections[3]} />} /></Route><Route path="*" element={<section className="placeholder"><h1>Không tìm thấy trang</h1><Link className="button" to="/">Về trang hôm nay</Link></section>} /></Routes></main><footer><span>Mood Garden <em>How you feel, what you wear, how your garden grows.</em></span><span>Thiết kế và phát triển bởi <a href="https://www.instagram.com/trinhbinhduong_/" target="_blank" rel="noreferrer">emsidt</a></span></footer></div>;
}
