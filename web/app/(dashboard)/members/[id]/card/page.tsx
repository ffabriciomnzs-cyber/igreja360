'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { api, extractApiError } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import {
  MemberCardData,
  ROLE_LABELS,
  STATUS_LABELS,
} from '@/lib/members';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function MemberCardPage(): React.ReactElement {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<MemberCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    api
      .get<MemberCardData>(`/members/${params.id}/card`)
      .then(({ data: res }) => {
        if (mounted) setData(res);
      })
      .catch((err) => {
        if (mounted) setError(extractApiError(err));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [params.id]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando carteirinha...
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <div>
        <Link href={`/members/${params.id}`}>
          <Button variant="ghost" size="sm" className="mb-2 -ml-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </Link>
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error ?? 'Não foi possível carregar a carteirinha.'}
        </div>
      </div>
    );
  }

  const { member, church } = data;
  const churchName = church?.name ?? 'Igreja360';

  return (
    <div>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #carteirinha,
          #carteirinha * {
            visibility: visible !important;
          }
          #carteirinha {
            position: absolute;
            left: 50%;
            top: 24px;
            transform: translateX(-50%);
          }
          @page {
            margin: 12mm;
          }
        }
      `}</style>

      <div className="mb-4 flex items-center justify-between gap-4 print:hidden">
        <Link href={`/members/${member.id}`}>
          <Button variant="ghost" size="sm" className="-ml-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </Link>
        <Button onClick={() => window.print()}>
          <Printer className="h-4 w-4" />
          Imprimir / Salvar PDF
        </Button>
      </div>

      <div className="flex justify-center">
        <div
          id="carteirinha"
          className="w-[420px] overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200"
          style={{
            WebkitPrintColorAdjust: 'exact',
            printColorAdjust: 'exact',
          }}
        >
          {/* Cabeçalho com identidade da igreja */}
          <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-indigo-600 to-indigo-800 px-6 py-5 text-white">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-widest text-indigo-200">
                Carteirinha de Membro
              </p>
              <h2 className="mt-0.5 truncate text-lg font-bold leading-tight">
                {churchName}
              </h2>
              {church?.denomination && (
                <p className="text-xs text-indigo-200">{church.denomination}</p>
              )}
            </div>
            {church?.logo && (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/90 p-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={church.logo}
                  alt="Logo"
                  className="h-full w-full object-contain"
                />
              </div>
            )}
          </div>

          {/* Corpo */}
          <div className="flex gap-4 px-6 py-5">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-indigo-50 text-2xl font-bold text-indigo-600">
              {member.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={member.photo}
                  alt={member.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                initials(member.name)
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="truncate text-lg font-bold text-slate-900">
                {member.name}
              </h3>
              <p className="text-sm text-indigo-600">
                {member.role ? ROLE_LABELS[member.role] : 'Membro'}
              </p>

              <dl className="mt-3 grid grid-cols-1 gap-1.5 text-xs">
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-400">Situação</dt>
                  <dd className="font-medium text-slate-700">
                    {STATUS_LABELS[member.status]}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-400">Membro desde</dt>
                  <dd className="font-medium text-slate-700">
                    {member.joinedAt ? formatDate(member.joinedAt) : '—'}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-400">Batismo</dt>
                  <dd className="font-medium text-slate-700">
                    {member.baptismDate ? formatDate(member.baptismDate) : '—'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Rodapé */}
          <div className="flex items-center justify-between gap-4 border-t border-slate-100 bg-slate-50 px-6 py-4 text-[10px] leading-relaxed text-slate-500">
            <div>
              <p className="font-semibold text-slate-700">
                ID {member.id.slice(0, 8).toUpperCase()}
              </p>
              {member.cpf && <p>CPF {member.cpf}</p>}
            </div>
            <div className="text-right">
              {church?.phone && <p>{church.phone}</p>}
              {church?.address && <p>{church.address}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
