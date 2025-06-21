
import { useState } from 'react';
import { SystemDashboard } from '../components/SystemDashboard';
import { SystemData } from '../types/ComponentTypes';
import { sampleSystemData } from '../data/sampleData';

const Index = () => {
  const [systemData] = useState<SystemData>(sampleSystemData);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold font-roboto bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            System Architecture Dashboard
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto font-roboto">
            Dynamic system visualization with real-time label evaluation and material design
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
          <SystemDashboard data={systemData} />
        </div>
      </div>
    </div>
  );
};

export default Index;
