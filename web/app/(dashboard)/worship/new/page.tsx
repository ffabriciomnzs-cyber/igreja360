'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { WorshipForm } from '@/components/worship/WorshipForm';

export default function NewWorshipPage(): React.ReactElement {
  return (
    <div>
      <Link href="/worship">
        <Button variant="ghost" size="sm" className="mb-2 -ml-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
      </Link>
      <PageHeader
        title="Planejar culto"
        description="Defina o tema, a ordem do culto e escale os participantes."
      />
      <WorshipForm />
    </div>
  );
}
