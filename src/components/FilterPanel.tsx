import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Filter, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface FilterPanelProps {
  currentTopic: string;
  currentOrientation: string;
  currentStyle: string;
  currentColor: string;
  onFilterChange: (filterType: string, value: string) => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  currentTopic,
  currentOrientation,
  currentStyle,
  currentColor,
  onFilterChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [availableFilters, setAvailableFilters] = useState({
    topics: [] as string[],
    styles: [] as string[],
    colors: [] as string[],
  });

  // Predefined orientations
  const orientations = ['portrait', 'landscape', 'square'];

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        // Fetch unique topics
        const { data: topicsData } = await supabase
          .from('illustrations')
          .select('topic')
          .eq('status', 'approved')
          .not('topic', 'is', null)
          .order('topic');

        // Fetch unique styles
        const { data: stylesData } = await supabase
          .from('illustrations')
          .select('style')
          .eq('status', 'approved')
          .not('style', 'is', null)
          .order('style');

        // Fetch unique colors
        const { data: colorsData } = await supabase
          .from('illustrations')
          .select('dominant_color')
          .eq('status', 'approved')
          .not('dominant_color', 'is', null)
          .order('dominant_color');

        setAvailableFilters({
          topics: [...new Set(topicsData?.map(item => item.topic).filter(Boolean))] as string[],
          styles: [...new Set(stylesData?.map(item => item.style).filter(Boolean))] as string[],
          colors: [...new Set(colorsData?.map(item => item.dominant_color).filter(Boolean))] as string[],
        });
      } catch (error) {
        console.error('Error fetching filter options:', error);
      }
    };

    fetchFilterOptions();
  }, []);

  const hasActiveFilters = !!(currentTopic || currentOrientation || currentStyle || currentColor);

  return (
    <Card className="border-border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Filters</span>
            {hasActiveFilters && (
              <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                Active
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-muted-foreground hover:text-foreground"
          >
            {isExpanded ? 'Hide' : 'Show'} filters
          </Button>
        </div>

        {isExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Topic Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Topic</label>
              <Select
                value={currentTopic}
                onValueChange={(value) => onFilterChange('topic', value === 'all' ? '' : value)}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="All topics" />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border shadow-lg max-h-48 overflow-y-auto">
                  <SelectItem value="all">All topics</SelectItem>
                  {availableFilters.topics.map((topic) => (
                    <SelectItem key={topic} value={topic}>
                      {topic}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Orientation Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Orientation</label>
              <Select
                value={currentOrientation}
                onValueChange={(value) => onFilterChange('orientation', value === 'all' ? '' : value)}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="All orientations" />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border shadow-lg">
                  <SelectItem value="all">All orientations</SelectItem>
                  {orientations.map((orientation) => (
                    <SelectItem key={orientation} value={orientation}>
                      {orientation.charAt(0).toUpperCase() + orientation.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Style Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Style</label>
              <Select
                value={currentStyle}
                onValueChange={(value) => onFilterChange('style', value === 'all' ? '' : value)}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="All styles" />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border shadow-lg max-h-48 overflow-y-auto">
                  <SelectItem value="all">All styles</SelectItem>
                  {availableFilters.styles.map((style) => (
                    <SelectItem key={style} value={style}>
                      {style}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Color Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Color</label>
              <Select
                value={currentColor}
                onValueChange={(value) => onFilterChange('color', value === 'all' ? '' : value)}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="All colors" />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border shadow-lg max-h-48 overflow-y-auto">
                  <SelectItem value="all">All colors</SelectItem>
                  {availableFilters.colors.map((color) => (
                    <SelectItem key={color} value={color}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full border border-border"
                          style={{ backgroundColor: color }}
                        />
                        {color}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FilterPanel;