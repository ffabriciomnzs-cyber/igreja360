'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { CampaignForm } from '@/components/campaigns/CampaignForm';

export default function NewCampaignPage(): React.ReactElement {
  return (
    <div>
      <Link href="/campaigns">
        <Button variant="ghost" size="sm" className="mb-2 -ml-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
      </Link>
      <PageHeader title="Nova campanha" description="Crie uma campanha com meta." />
      <CampaignForm />
    </div>
  );
}
