'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { MemberForm } from '@/components/members/MemberForm';

export default function NewMemberPage(): React.ReactElement {
  return (
    <div>
      <Link href="/members">
        <Button variant="ghost" size="sm" className="mb-2 -ml-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
      </Link>
      <PageHeader
        title="Novo membro"
        description="Preencha os dados para cadastrar um novo membro."
      />
      <MemberForm />
    </div>
  );
}
