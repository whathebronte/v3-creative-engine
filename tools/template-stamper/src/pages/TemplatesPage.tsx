import { AppLayout } from '../layouts/AppLayout';
import { Card } from '../components/ui';

function TemplatesPage() {
  return (
    <AppLayout
      title="Template Library"
      subtitle="Manage your video templates. Upload new templates and view existing ones."
    >
      <div className="max-w-6xl mx-auto">
        <Card className="text-center py-8">
          <p className="text-text-secondary">
            Template management system will be implemented in Phase 2.
          </p>
          <p className="text-sm text-text-tertiary mt-2">
            Phase 1 focuses on core infrastructure setup.
          </p>
        </Card>
      </div>
    </AppLayout>
  );
}

export default TemplatesPage;
