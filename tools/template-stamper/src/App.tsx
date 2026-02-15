import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import TemplatesPage from './pages/TemplatesPage';
import AssetsPage from './pages/AssetsPage';
import GeneratePage from './pages/GeneratePage';
import JobsPage from './pages/JobsPage';
import TemplateGuidePage from './pages/TemplateGuidePage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/templates" element={<TemplatesPage />} />
        <Route path="/assets" element={<AssetsPage />} />
        <Route path="/generate" element={<GeneratePage />} />
        <Route path="/jobs" element={<JobsPage />} />
        <Route path="/template-guide" element={<TemplateGuidePage />} />
      </Routes>
    </Router>
  );
}

export default App;
