import { AppLayout } from '../layouts/AppLayout';
import { Card } from '../components/ui';

function JobsPage() {
  return (
    <AppLayout
      title="Job History"
      subtitle="Track your video generation jobs and download completed videos."
    >
      <div className="max-w-6xl mx-auto">
        <Card className="text-center py-8">
          <p className="text-text-secondary">
            Job tracking interface will be implemented in Phase 2.
          </p>
          <p className="text-sm text-text-tertiary mt-2">
            Phase 1 focuses on core infrastructure setup.
          </p>
        </Card>
      </div>
    </AppLayout>
  );
}

export default JobsPage;
