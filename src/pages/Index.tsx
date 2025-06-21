import React from 'react';
import { EnhancedSystemDashboard } from '../components/EnhancedSystemDashboard';
import { sampleSystemData } from '../data/sampleData';

const Index = () => {
  return (
    <div className="w-full h-screen">
      <EnhancedSystemDashboard data={sampleSystemData} />
    </div>
  );
};

export default Index;
