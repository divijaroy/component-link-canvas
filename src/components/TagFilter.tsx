
import { Search, Tag, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface TagFilterProps {
  allTags: string[];
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export const TagFilter = ({
  allTags,
  selectedTags,
  onTagsChange,
  searchTerm,
  onSearchChange
}: TagFilterProps) => {
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter(t => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const clearAll = () => {
    onTagsChange([]);
    onSearchChange('');
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Filters
          </h3>
          {(selectedTags.length > 0 || searchTerm) && (
            <button
              onClick={clearAll}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Clear All
            </button>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search components..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-600">Tags:</p>
          <div className="flex flex-wrap gap-2">
            {allTags.map(tag => (
              <Badge
                key={tag}
                variant={selectedTags.includes(tag) ? "default" : "outline"}
                className={`cursor-pointer transition-all hover:scale-105 ${
                  selectedTags.includes(tag)
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'hover:bg-blue-50 hover:border-blue-300'
                }`}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        {selectedTags.length > 0 && (
          <div className="text-sm text-gray-600">
            {selectedTags.length} tag{selectedTags.length !== 1 ? 's' : ''} selected
          </div>
        )}
      </div>
    </div>
  );
};
