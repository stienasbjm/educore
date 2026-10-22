/**
 * Escape teks sebelum disisipkan ke HTML.
 * Dipakai untuk data yang berasal dari pengguna (nama, NIM, kode token) agar
 * tidak dapat menyisipkan skrip pada dialog, laporan, atau halaman rekap.
 */
export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
