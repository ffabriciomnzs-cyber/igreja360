'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { EventForm } from '@/components/events/EventForm';

export default function NewEventPage(): React.ReactElement {
  return (
    <div>
      <Link href="/events">
        <Button variant="ghost" size="sm" className="mb-2 -ml-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
      </Link>
      <PageHeader
        title="Novo evento"
        description="Cadastre um evento na agenda."
      />
      <EventForm />
    </div>
  );
}
