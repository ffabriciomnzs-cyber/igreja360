import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/PageHeader';

export function ModulePlaceholder({
  title,
  description,
  phase,
}: {
  title: string;
  description: string;
  phase: string;
}): React.ReactElement {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <p className="text-sm font-medium text-slate-700">
            Módulo planejado para a {phase}.
          </p>
          <p className="max-w-md text-sm text-slate-500">
            A estrutura de navegação e o layout já estão prontos. A
            implementação completa deste módulo entra na fase indicada do
            roadmap.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
