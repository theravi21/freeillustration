import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Download, Grid, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import SearchSuggestions from '../components/SearchSuggestions';
import IllustrationGrid from '../components/IllustrationGrid';
import EmptyState from '../components/EmptyState';
import FilterPanel from '../components/FilterPanel';

const ITEMS_PER_PAGE = 24;

const Browse = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [illustrations, setIllustrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Get current filters from URL
  const currentQuery = searchParams.get('q') || '';
  const currentPage = parseInt(searchParams.get('page') || '1');
  const currentTopic = searchParams.get('topic') || '';
  const currentOrientation = searchParams.get('orientation') || '';
  const currentStyle = searchParams.get('style') || '';
  const currentColor = searchParams.get('color') || '';

  // Update URL with new parameters
  const updateURL = (updates: Record<string, string | number>) => {
    const newParams = new URLSearchParams(searchParams);
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === '' || value === null || value === undefined) {
        newParams.delete(key);
      } else {
        newParams.set(key, value.toString());
      }
    });

    // Reset to page 1 when filters change (except when page is being updated)
    if (!updates.hasOwnProperty('page')) {
      newParams.delete('page');
    }

    setSearchParams(newParams);
  };

  // Fetch illustrations with filters
  const fetchIllustrations = async () => {
    setLoading(true);
    
    let query = supabase
      .from('illustrations')
      .select('*', { count: 'exact' })
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    // Apply search filter
    if (currentQuery) {
      query = query.or(`title.ilike.%${currentQuery}%,description.ilike.%${currentQuery}%`);
    }

    // Apply facet filters
    if (currentTopic) {
      query = query.eq('topic', currentTopic);
    }
    if (currentOrientation) {
      query = query.eq('orientation', currentOrientation);
    }
    if (currentStyle) {
      query = query.eq('style', currentStyle);
    }
    if (currentColor) {
      query = query.eq('dominant_color', currentColor);
    }

    // Apply pagination
    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching illustrations:', error);
    } else {
      setIllustrations(data || []);
      setTotalCount(count || 0);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchIllustrations();
  }, [currentQuery, currentPage, currentTopic, currentOrientation, currentStyle, currentColor]);

  // Calculate pagination
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const showPagination = totalPages > 1;

  const handleSearch = (query: string) => {
    updateURL({ q: query });
    setShowSuggestions(false);
  };

  const handleFilterChange = (filterType: string, value: string) => {
    updateURL({ [filterType]: value });
  };

  const handlePageChange = (page: number) => {
    updateURL({ page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Browse Free Illustrations</h1>
          <p className="text-muted-foreground text-lg">
            Discover thousands of high-quality illustrations for your projects
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search illustrations..."
                value={currentQuery}
                onChange={(e) => updateURL({ q: e.target.value })}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="pl-10 h-12 text-base"
              />
            </div>
            
            {showSuggestions && currentQuery && (
              <SearchSuggestions
                query={currentQuery}
                onSuggestionClick={handleSearch}
              />
            )}
          </div>

          {/* Filter Panel */}
          <FilterPanel
            currentTopic={currentTopic}
            currentOrientation={currentOrientation}
            currentStyle={currentStyle}
            currentColor={currentColor}
            onFilterChange={handleFilterChange}
          />

          {/* Active Filters */}
          {(currentQuery || currentTopic || currentOrientation || currentStyle || currentColor) && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {currentQuery && (
                <Badge variant="secondary" className="gap-1">
                  Search: {currentQuery}
                  <button
                    onClick={() => updateURL({ q: '' })}
                    className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {currentTopic && (
                <Badge variant="secondary" className="gap-1">
                  Topic: {currentTopic}
                  <button
                    onClick={() => updateURL({ topic: '' })}
                    className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {currentOrientation && (
                <Badge variant="secondary" className="gap-1">
                  Orientation: {currentOrientation}
                  <button
                    onClick={() => updateURL({ orientation: '' })}
                    className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {currentStyle && (
                <Badge variant="secondary" className="gap-1">
                  Style: {currentStyle}
                  <button
                    onClick={() => updateURL({ style: '' })}
                    className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {currentColor && (
                <Badge variant="secondary" className="gap-1">
                  Color: {currentColor}
                  <button
                    onClick={() => updateURL({ color: '' })}
                    className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                  >
                    ×
                  </button>
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchParams(new URLSearchParams())}
                className="text-muted-foreground hover:text-foreground"
              >
                Clear all
              </Button>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-muted-foreground">
            {loading ? 'Loading...' : `${totalCount} illustration${totalCount !== 1 ? 's' : ''} found`}
          </p>
          <div className="flex items-center gap-2">
            <Grid className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Grid view</span>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {Array.from({ length: 24 }).map((_, i) => (
              <Card key={i} className="aspect-square">
                <CardContent className="p-0 h-full bg-muted rounded-lg animate-pulse" />
              </Card>
            ))}
          </div>
        ) : illustrations.length > 0 ? (
          <>
            <IllustrationGrid illustrations={illustrations} />
            
            {/* Pagination */}
            {showPagination && (
              <div className="mt-12 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 7) {
                      pageNum = i + 1;
                    } else if (currentPage <= 4) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 3) {
                      pageNum = totalPages - 6 + i;
                    } else {
                      pageNum = currentPage - 3 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className="w-10"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="gap-1"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <EmptyState
            query={currentQuery}
            hasFilters={!!(currentTopic || currentOrientation || currentStyle || currentColor)}
          />
        )}
      </div>
    </div>
  );
};

export default Browse;