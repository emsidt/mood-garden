import { FormEvent, useState } from 'react';
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, errorMessage } from '../../lib/api';
import { authenticate, logout, restoreSession, updateSessionUser, useSession, User } from './session';

export function RequireAuth() {
  const session = useSession();
  const location = useLocation();
  if (session.loading) return <p className="placeholder" role="status">Đang mở góc nhỏ của bạn…</p>;
  if (session.error) return <section className="placeholder"><p role="alert">{session.error}</p><button className="button" onClick={() => { void restoreSession().catch(() => {}); }}>Thử kết nối lại</button></section>;
  return session.user ? <Outlet /> : <Navigate to="/login" replace state={{ from: location.pathname }} />;
}
export function AccountLink() {
  const session = useSession();
  return <NavAccount user={session.user} />;
}
function NavAccount({ user }: { user: User | null }) {
  return <Link to={user ? '/profile' : '/login'}>{user ? 'Tài khoản' : 'Đăng nhập'}</Link>;
}
export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const session = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const from: unknown = location.state?.from;
  const destination = typeof from === 'string' && /^\/(?!\/)/.test(from) && !['/login', '/register'].includes(from) ? from : '/profile';
  if (session.loading) return <p className="placeholder" role="status">Đang kiểm tra phiên đăng nhập…</p>;
  if (session.user) return <Navigate to={destination} replace />;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true); setError('');
    try {
      await authenticate(mode, { email: String(data.get('email')), password: String(data.get('password')),
        ...(mode === 'register' ? { username: String(data.get('username')) } : {}) });
      queryClient.clear();
      navigate(destination, { replace: true });
    } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  }
  return <section className="account-layout"><div className="account-intro"><p className="eyebrow">MỘT GÓC NHỎ DÀNH RIÊNG CHO BẠN</p><h1>{mode === 'login' ? 'Chào bạn,\nmừng trở lại.' : 'Gieo một hạt mầm\ncho hôm nay.'}</h1><p>Lưu lại những ngày của bạn, chăm một khu vườn và tìm niềm vui từ những điều giản dị.</p><div className="account-flower" aria-hidden="true">✿</div></div>
    <form className="account-form" onSubmit={submit}><h2>{mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}</h2><p className="muted">{mode === 'login' ? 'Góc nhỏ của bạn đang chờ.' : 'Bắt đầu hành trình theo nhịp của riêng bạn.'}</p>
      {mode === 'register' && <label>Tên người dùng<input name="username" required minLength={3} maxLength={30} pattern="[a-zA-Z0-9_]{3,30}" autoComplete="username" placeholder="ten_cua_ban" /><small>3–30 chữ cái không dấu, chữ số hoặc dấu gạch dưới.</small></label>}
      <label>Email<input name="email" type="email" required maxLength={254} autoComplete={mode === 'login' ? 'username' : 'email'} placeholder="ban@example.com" /></label>
      <label>Mật khẩu<input name="password" type="password" required minLength={10} maxLength={128} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /><small>Từ 10 đến 128 ký tự.</small></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button" disabled={busy}>{busy ? 'Đang xử lý…' : mode === 'login' ? 'Đăng nhập' : 'Tạo khu vườn của bạn'}</button>
      <p className="form-switch">{mode === 'login' ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}<Link state={location.state} to={mode === 'login' ? '/register' : '/login'}>{mode === 'login' ? 'Đăng ký' : 'Đăng nhập'}</Link></p>
    </form></section>;
}
type Preferences = { city: string; timezone: string; preferredStyle: string; temperatureTolerance: number };
const styles = [['CASUAL', 'Thoải mái'], ['STREETWEAR', 'Đường phố'], ['FORMAL', 'Lịch sự'], ['SPORT', 'Thể thao'], ['MINIMAL', 'Tối giản']];
export function ProfilePage() {
  const session = useSession();
  const client = useQueryClient();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const preferences = useQuery({ queryKey: ['preferences', session.user?.id], queryFn: async () => (await api.get<Preferences>('/users/me/preferences')).data });
  async function signOut() {
    setBusy(true); setError('');
    try { await logout(); client.clear(); navigate('/', { replace: true }); }
    catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  }
  return <section className="profile-page"><p className="eyebrow">GÓC NHỎ CỦA BẠN</p><div className="section-heading"><h1>Chào {session.user?.username}.</h1><button className="text-button" onClick={signOut} disabled={busy}>{busy ? 'Đang đăng xuất…' : 'Đăng xuất'}</button></div>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="profile-grid"><ProfileForm user={session.user!} />{preferences.isPending ? <p role="status">Đang tải tùy chọn…</p> : preferences.isError ? <div><p role="alert">{errorMessage(preferences.error)}</p><button className="button" onClick={() => { void preferences.refetch(); }}>Thử lại</button></div> : <PreferencesForm initial={preferences.data} />}</div>
  </section>;
}
function ProfileForm({ user }: { user: User }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage(''); setError('');
    const data = new FormData(event.currentTarget);
    try { updateSessionUser((await api.patch<User>('/users/me', { username: data.get('username') })).data); setMessage('Đã lưu hồ sơ.'); }
    catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  }
  return <form className="account-form" onSubmit={submit}><h2>Hồ sơ</h2><label>Email<input readOnly value={user.email} /></label><label>Tên người dùng<input name="username" required defaultValue={user.username} minLength={3} maxLength={30} pattern="[a-zA-Z0-9_]{3,30}" autoComplete="username" /></label><p className="muted">Tham gia ngày {new Date(user.createdAt).toLocaleDateString('vi-VN')}</p>{error && <p className="form-error" role="alert">{error}</p>}<p role="status">{message}</p><button className="button" disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu hồ sơ'}</button></form>;
}
function PreferencesForm({ initial }: { initial: Preferences }) {
  const client = useQueryClient();
  const session = useSession();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage(''); setError('');
    const form = new FormData(event.currentTarget);
    try {
      const { data } = await api.patch<Preferences>('/users/me/preferences', {
        city: form.get('city'), timezone: form.get('timezone'), preferredStyle: form.get('preferredStyle'),
        temperatureTolerance: Number(form.get('temperatureTolerance')),
      });
      client.setQueryData(['preferences', session.user?.id], data);
      await client.invalidateQueries({ queryKey: ['weather-current'] });
      setMessage('Đã lưu tùy chọn.');
    } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  }
  return <form className="account-form" onSubmit={submit}><h2>Theo nhịp của bạn</h2><label>Thành phố<input name="city" required maxLength={100} defaultValue={initial.city} autoComplete="address-level2" /></label><label>Múi giờ<input name="timezone" required maxLength={100} defaultValue={initial.timezone} list="timezones" /><datalist id="timezones"><option value="Asia/Ho_Chi_Minh" /><option value="Asia/Bangkok" /><option value="Asia/Tokyo" /><option value="Europe/London" /><option value="America/New_York" /></datalist><small>Ví dụ: Asia/Ho_Chi_Minh. Dùng để xác định ngày check-in.</small></label>
    <label>Phong cách<select name="preferredStyle" defaultValue={initial.preferredStyle}>{styles.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    <label>Điều chỉnh nhiệt độ cảm nhận (°C)<input name="temperatureTolerance" type="number" min={-10} max={10} step={0.5} defaultValue={initial.temperatureTolerance} required /><small>0 là mặc định; giá trị dương nếu bạn dễ thấy nóng, âm nếu dễ thấy lạnh.</small></label>
    {error && <p className="form-error" role="alert">{error}</p>}<p role="status">{message}</p><button className="button" disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu tùy chọn'}</button></form>;
}
