import { useState } from 'react';
import { EnhancedSystemDashboard } from '@/components/EnhancedSystemDashboard';
import { Button } from '@/components/ui/button';

const Index = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  return (
    <div className="w-full h-screen bg-background">
      <EnhancedSystemDashboard />
    </div>
  );
};

export default Index;
