
import { useState, useEffect } from 'react';
import { ComponentCanvas } from '../components/ComponentCanvas';
import { TagFilter } from '../components/TagFilter';
import { ComponentData } from '../types/ComponentTypes';
import { sampleData } from '../data/sampleData';

const Index = () => {
  const [data, setData] = useState<ComponentData[]>(sampleData);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Extract all unique tags from the data
  const allTags = Array.from(
    new Set(
      data.flatMap(component => [
        ...component.tags,
        ...component.subComponents.flatMap(sub => sub.tags)
      ])
    )
  );

  const filteredData = data.map(component => ({
    ...component,
    subComponents: component.subComponents.filter(sub => {
      const matchesSearch = sub.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTags = selectedTags.length === 0 || 
        selectedTags.some(tag => sub.tags.includes(tag));
      return matchesSearch && matchesTags;
    })
  })).filter(component => {
    const matchesSearch = component.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.some(tag => component.tags.includes(tag)) ||
      component.subComponents.length > 0;
    return matchesSearch && matchesTags;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Component Architecture Visualizer
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Interactive visualization of component relationships, dependencies, and tagged connections
          </p>
        </div>

        <div className="mb-6">
          <TagFilter
            allTags={allTags}
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <ComponentCanvas data={filteredData} selectedTags={selectedTags} />
        </div>
      </div>
    </div>
  );
};

export default Index;
