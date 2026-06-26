'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { CommunicationForm } from '@/components/communications/CommunicationForm';

export default function NewCommunicationPage(): React.ReactElement {
  return (
    <div>
      <Link href="/communications">
        <Button variant="ghost" size="sm" className="mb-2 -ml-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
      </Link>
      <PageHeader
        title="Novo comunicado"
        description="Publique um aviso para a igreja."
      />
      <CommunicationForm />
    </div>
  );
}
