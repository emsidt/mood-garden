import axios from 'axios';
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api', timeout: 10000,
  withCredentials: true, headers: { 'X-Mood-Garden': '1' },
});
export function errorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 429) return 'Bạn thử quá nhiều lần. Vui lòng chờ một phút.';
    const message: unknown = error.response?.data?.message;
    if (Array.isArray(message)) return message.join(' · ');
    if (typeof message === 'string') return message;
    return 'Chưa kết nối được máy chủ. Vui lòng thử lại.';
  }
  return 'Có lỗi xảy ra. Vui lòng thử lại.';
}
