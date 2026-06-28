'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { ArrowLeft, Upload, Loader2, CheckCircle2, FileSpreadsheet } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { api, extractApiError } from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface ImportRow {
  name: string;
  email?: string;
  phone?: string;
  cpf?: string;
  rg?: string;
  birthDate?: string;
  baptismDate?: string;
  maritalStatus?: string;
  profession?: string;
  city?: string;
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function cellToText(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'number') return String(v);
  if (v instanceof Date) return v.toLocaleDateString('pt-BR');
  return String(v).trim();
}

function cellToIsoDate(v: unknown): string | undefined {
  if (v === null || v === undefined || v === '') return undefined;
  const pad = (n: number) => String(n).padStart(2, '0');
  if (v instanceof Date) {
    return `${v.getFullYear()}-${pad(v.getMonth() + 1)}-${pad(v.getDate())}`;
  }
  if (typeof v === 'number') {
    // Serial do Excel (base 1899-12-30).
    const d = new Date(Date.UTC(1899, 11, 30) + v * 86400000);
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
  }
  const s = String(v).trim();
  const m = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/);
  if (m) {
    let [, d, mo, y] = m;
    if (y.length === 2) y = (Number(y) > 30 ? '19' : '20') + y;
    return `${y}-${pad(Number(mo))}-${pad(Number(d))}`;
  }
  return undefined;
}

export default function ImportMembersPage(): React.ReactElement {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [parseInfo, setParseInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    total: number;
    created: number;
    skipped: number;
  } | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>): void {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setResult(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const wb = XLSX.read(reader.result, { type: 'array', cellDates: true });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
          defval: '',
        });

        const mapped: ImportRow[] = [];
        for (const raw of json) {
          const norm: Record<string, unknown> = {};
          for (const k of Object.keys(raw)) norm[normalize(k)] = raw[k];

          const pick = (keys: string[]): unknown => {
            for (const k of keys) {
              if (norm[k] !== undefined && norm[k] !== '') return norm[k];
            }
            return undefined;
          };

          const name = cellToText(pick(['nome', 'nome completo']));
          if (name.trim().length < 2) continue;

          const naturalidade = cellToText(
            pick(['naturalidade', 'cidade', 'cidade natal']),
          );
          const uf = cellToText(pick(['uf', 'estado'])).toUpperCase();
          const city = naturalidade
            ? naturalidade + (uf ? `/${uf}` : '')
            : uf || undefined;

          mapped.push({
            name: name.trim(),
            email: cellToText(pick(['e-mail', 'email'])) || undefined,
            phone:
              cellToText(pick(['telefone', 'celular', 'fone', 'contato'])) ||
              undefined,
            cpf: cellToText(pick(['cpf'])) || undefined,
            rg: cellToText(pick(['rg'])) || undefined,
            birthDate: cellToIsoDate(
              pick(['data nascimento', 'data de nascimento', 'nascimento']),
            ),
            baptismDate: cellToIsoDate(
              pick(['batismo', 'data batismo', 'data de batismo']),
            ),
            maritalStatus:
              cellToText(pick(['estado civil'])) || undefined,
            profession: cellToText(pick(['profissao'])) || undefined,
            city,
          });
        }

        setRows(mapped);
        setParseInfo(
          `${mapped.length} membro(s) reconhecido(s) de ${json.length} linha(s).`,
        );
        if (mapped.length === 0) {
          setError(
            'Nenhum membro reconhecido. A planilha precisa ter uma coluna "NOME".',
          );
        }
      } catch {
        setError('Não foi possível ler o arquivo. Use um .xlsx, .xls ou .csv.');
        setRows([]);
      }
    };
    reader.onerror = () => setError('Falha ao ler o arquivo.');
    reader.readAsArrayBuffer(file);
    if (fileRef.current) fileRef.current.value = '';
  }

  async function handleImport(): Promise<void> {
    if (rows.length === 0) return;
    setImporting(true);
    setError(null);
    try {
      const { data } = await api.post<{
        total: number;
        created: number;
        skipped: number;
      }>('/members/import', { members: rows });
      setResult(data);
      setRows([]);
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setImporting(false);
    }
  }

  return (
    <div>
      <Link href="/members">
        <Button variant="ghost" size="sm" className="mb-2 -ml-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
      </Link>
      <PageHeader
        title="Importar membros"
        description="Envie uma planilha (.xlsx, .xls ou .csv) com a lista de membros."
      />

      {result ? (
        <Card>
          <CardContent className="space-y-4 py-10 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
            <div>
              <p className="text-lg font-semibold text-slate-900">
                Importação concluída!
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {result.created} membro(s) cadastrado(s)
                {result.skipped > 0
                  ? ` · ${result.skipped} linha(s) ignorada(s) (sem nome)`
                  : ''}
                .
              </p>
            </div>
            <div className="flex justify-center gap-2">
              <Link href="/members">
                <Button>Ver membros</Button>
              </Link>
              <Button
                variant="outline"
                onClick={() => {
                  setResult(null);
                  setFileName('');
                  setParseInfo(null);
                }}
              >
                Importar outra
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFile}
              />
              <div className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border py-10 text-center">
                <FileSpreadsheet className="h-10 w-10 text-slate-300" />
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    {fileName || 'Nenhum arquivo selecionado'}
                  </p>
                  <p className="text-xs text-slate-400">
                    Colunas reconhecidas: NOME, DATA NASCIMENTO, CPF, RG,
                    TELEFONE, E-MAIL, BATISMO, ESTADO CIVIL, PROFISSÃO,
                    NATURALIDADE, UF.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                  Escolher planilha
                </Button>
              </div>
              {parseInfo && (
                <p className="mt-3 text-sm text-slate-600">{parseInfo}</p>
              )}
              {error && (
                <div className="mt-3 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}
            </CardContent>
          </Card>

          {rows.length > 0 && (
            <>
              <Card>
                <CardContent className="overflow-x-auto p-0">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-slate-50 text-left">
                        <th className="px-4 py-2.5 font-semibold text-slate-600">
                          Nome
                        </th>
                        <th className="px-4 py-2.5 font-semibold text-slate-600">
                          Nascimento
                        </th>
                        <th className="px-4 py-2.5 font-semibold text-slate-600">
                          Telefone
                        </th>
                        <th className="px-4 py-2.5 font-semibold text-slate-600">
                          Cidade
                        </th>
                        <th className="px-4 py-2.5 font-semibold text-slate-600">
                          Profissão
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 12).map((r, i) => (
                        <tr
                          key={i}
                          className="border-b border-border last:border-0"
                        >
                          <td className="px-4 py-2.5 text-slate-800">
                            {r.name}
                          </td>
                          <td className="px-4 py-2.5 text-slate-600">
                            {r.birthDate ? formatDate(r.birthDate) : '—'}
                          </td>
                          <td className="px-4 py-2.5 text-slate-600">
                            {r.phone ?? '—'}
                          </td>
                          <td className="px-4 py-2.5 text-slate-600">
                            {r.city ?? '—'}
                          </td>
                          <td className="px-4 py-2.5 text-slate-600">
                            {r.profession ?? '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {rows.length > 12 && (
                    <p className="px-4 py-2 text-xs text-slate-400">
                      + {rows.length - 12} membro(s) não exibido(s) na prévia.
                    </p>
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button onClick={handleImport} disabled={importing}>
                  {importing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Importar {rows.length} membro(s)
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
