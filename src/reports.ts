import type { ExamType, ParticipantRecord } from './types';

const REPORT_COLUMNS = [
  'No.',
  'Nama mahasiswa',
  'NIM',
  'Program studi',
  'Token',
  'Waktu mulai',
  'Waktu selesai',
  'Status',
  'Posisi seksi',
  'Workstation',
];

const examLabel: Record<ExamType, string> = {
  toefl: 'TOEFL Like',
  tpa: 'TPA',
};

function escapeMarkup(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatDate(value?: string): string {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '-'
    : date.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}

function getReportRows(records: ParticipantRecord[]): string[][] {
  return records.map((participant, index) => [
    String(index + 1),
    participant.name,
    participant.nim,
    participant.prodi,
    participant.tokenCode,
    formatDate(participant.startedAt),
    formatDate(participant.completedAt),
    participant.status === 'completed' ? 'Selesai' : 'Sedang mengerjakan',
    participant.currentSection || '-',
    participant.workstationId || 'LAB-CBT',
  ]);
}

function createWorkbookXml(title: string, rows: string[][]): string {
  const xmlRow = (cells: string[], styleId?: string) =>
    `<Row>${cells
      .map(
        (cell) =>
          `<Cell${styleId ? ` ss:StyleID="${styleId}"` : ''}><Data ss:Type="String">${escapeMarkup(cell)}</Data></Cell>`,
      )
      .join('')}</Row>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" xmlns:html="http://www.w3.org/TR/REC-html40">
  <Styles>
    <Style ss:ID="Title"><Font ss:Bold="1" ss:Size="16" ss:Color="#FFFFFF"/><Interior ss:Color="#173B70" ss:Pattern="Solid"/></Style>
    <Style ss:ID="Header"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#2563EB" ss:Pattern="Solid"/></Style>
  </Styles>
  <Worksheet ss:Name="${escapeMarkup(title)}">
    <Table>
      <Column ss:Width="38"/><Column ss:Width="190"/><Column ss:Width="95"/><Column ss:Width="100"/><Column ss:Width="100"/>
      <Column ss:Width="145"/><Column ss:Width="145"/><Column ss:Width="130"/><Column ss:Width="130"/><Column ss:Width="100"/>
      <Row><Cell ss:MergeAcross="9" ss:StyleID="Title"><Data ss:Type="String">EduCore — Laporan ${escapeMarkup(title)}</Data></Cell></Row>
      <Row><Cell ss:MergeAcross="9"><Data ss:Type="String">Dicetak ${escapeMarkup(formatDate(new Date().toISOString()))} · ${rows.length} peserta</Data></Cell></Row>
      ${xmlRow(REPORT_COLUMNS, 'Header')}
      ${rows.map((row) => xmlRow(row)).join('')}
    </Table>
    <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel"><FreezePanes/><FrozenNoSplit/><SplitHorizontal>3</SplitHorizontal><TopRowBottomPane>3</TopRowBottomPane><ActivePane>2</ActivePane></WorksheetOptions>
  </Worksheet>
</Workbook>`;
}

export function downloadExamReportExcel(records: ParticipantRecord[], examType: ExamType): boolean {
  const filtered = records.filter((participant) => participant.examType === examType);
  if (filtered.length === 0) return false;

  const label = examLabel[examType];
  const workbook = createWorkbookXml(label, getReportRows(filtered));
  const blob = new Blob([`\uFEFF${workbook}`], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `EduCore_Laporan_${examType.toUpperCase()}_${new Date().toISOString().slice(0, 10)}.xls`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}

export function printExamReport(records: ParticipantRecord[], examType: ExamType): boolean {
  const filtered = records.filter((participant) => participant.examType === examType);
  if (filtered.length === 0) return false;

  const reportWindow = window.open('', '_blank');
  if (!reportWindow) return false;
  reportWindow.opener = null;

  const label = examLabel[examType];
  const tableRows = getReportRows(filtered)
    .map((row) => `<tr>${row.map((cell) => `<td>${escapeMarkup(cell)}</td>`).join('')}</tr>`)
    .join('');
  reportWindow.document.write(`<!doctype html>
    <html lang="id">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Laporan ${label} — EduCore</title>
        <style>
          * { box-sizing: border-box; }
          body { margin: 32px; color: #172033; font: 12px/1.5 Arial, sans-serif; }
          header { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; margin-bottom: 24px; padding-bottom: 18px; border-bottom: 3px solid #2563eb; }
          h1 { margin: 0 0 5px; color: #173b70; font-size: 23px; }
          p { margin: 0; color: #58657a; }
          .count { padding: 9px 14px; border-radius: 10px; background: #edf4ff; color: #173b70; font-size: 17px; font-weight: 700; white-space: nowrap; }
          table { width: 100%; border-collapse: collapse; }
          th { padding: 9px 7px; background: #173b70; color: white; text-align: left; }
          td { padding: 8px 7px; border-bottom: 1px solid #dbe2ec; vertical-align: top; }
          tr:nth-child(even) td { background: #f5f8fc; }
          footer { margin-top: 20px; color: #65738a; font-size: 10px; }
          @page { size: landscape; margin: 14mm; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <header>
          <div><h1>EduCore · Laporan ${label}</h1><p>TPA &amp; TOEFL Like · STIE Nasional Banjarmasin</p><p>Dicetak ${escapeMarkup(formatDate(new Date().toISOString()))}</p></div>
          <div class="count">${filtered.length} peserta</div>
        </header>
        <table><thead><tr>${REPORT_COLUMNS.map((column) => `<th>${escapeMarkup(column)}</th>`).join('')}</tr></thead><tbody>${tableRows}</tbody></table>
        <footer>Laporan ini memuat seluruh peserta yang terdaftar pada ujian ${label}.</footer>
      </body>
    </html>`);
  reportWindow.document.close();
  reportWindow.focus();
  reportWindow.setTimeout(() => reportWindow.print(), 350);
  return true;
}
