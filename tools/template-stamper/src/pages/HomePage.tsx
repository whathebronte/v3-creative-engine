import { AppLayout } from '../layouts/AppLayout';
import { Card, Button } from '../components/ui';
import { Video, Zap, Layout, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function HomePage() {
  const navigate = useNavigate();

  return (
    <AppLayout
      title="Welcome to Template Stamper"
      subtitle="Professional automation tool for creating vertical video advertisements at scale"
    >
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="group">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-accent-red/10 rounded-md flex items-center justify-center flex-shrink-0 group-hover:bg-accent-red/20 transition-colors">
                <Video className="w-5 h-5 text-accent-red" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  One-Click Generation
                </h3>
                <p className="text-sm text-text-secondary">
                  Generate 64 videos per month across 4 markets with consistent branding and variable content.
                </p>
              </div>
            </div>
          </Card>

          <Card className="group">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-accent-red/10 rounded-md flex items-center justify-center flex-shrink-0 group-hover:bg-accent-red/20 transition-colors">
                <Zap className="w-5 h-5 text-accent-red" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  Fast Rendering
                </h3>
                <p className="text-sm text-text-secondary">
                  Powered by Remotion Lambda, each 17-second video renders in just 1-2 minutes.
                </p>
              </div>
            </div>
          </Card>

          <Card className="group">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-accent-red/10 rounded-md flex items-center justify-center flex-shrink-0 group-hover:bg-accent-red/20 transition-colors">
                <Layout className="w-5 h-5 text-accent-red" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  Template Library
                </h3>
                <p className="text-sm text-text-secondary">
                  Manage template variations with consistent branding and easy customization.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <h3 className="text-xl font-semibold text-text-primary mb-4">
            Quick Actions
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            <Button
              variant="primary"
              className="justify-between"
              onClick={() => navigate('/generate')}
            >
              <span>Create Video</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              variant="secondary"
              className="justify-between"
              onClick={() => navigate('/templates')}
            >
              <span>View Templates</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              variant="secondary"
              className="justify-between"
              onClick={() => navigate('/jobs')}
            >
              <span>View Jobs</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </Card>

        {/* Current Status */}
        <Card>
          <h3 className="text-xl font-semibold text-text-primary mb-4">
            Phase 2: Template Stamper App - In Progress
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-status-online rounded-full"></div>
              <span className="text-sm text-text-primary">Core UI Components - Complete</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-status-online rounded-full"></div>
              <span className="text-sm text-text-primary">Three-Column Layout - Complete</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-status-warning rounded-full animate-pulse"></div>
              <span className="text-sm text-text-primary">Video Generation Page - In Progress</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-status-offline rounded-full"></div>
              <span className="text-sm text-text-secondary">Template Gallery - Pending</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-status-offline rounded-full"></div>
              <span className="text-sm text-text-secondary">Job Dashboard - Pending</span>
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}

export default HomePage;
