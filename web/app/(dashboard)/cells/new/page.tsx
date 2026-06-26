'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { CellForm } from '@/components/cells/CellForm';

export default function NewCellPage(): React.ReactElement {
  return (
    <div>
      <Link href="/cells">
        <Button variant="ghost" size="sm" className="mb-2 -ml-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
      </Link>
      <PageHeader
        title="Nova célula"
        description="Preencha os dados para cadastrar uma nova célula."
      />
      <CellForm />
    </div>
  );
}
