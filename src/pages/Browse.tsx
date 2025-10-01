import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Download, Grid, Filter, ChevronLeft, ChevronRight, Upload } from 'lucide-react';
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
      .eq('published', true)
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
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-10 flex flex-col md:flex-row items-start justify-between gap-6 animate-fade-in">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-primary bg-clip-text text-transparent">
              Browse Gallery
            </h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl">
              Explore thousands of stunning illustrations from our creative community
            </p>
          </div>
          <Button asChild size="lg" variant="premium" className="flex-shrink-0">
            <Link to="/upload" className="gap-2">
              <Upload className="h-5 w-5" />
              Upload Yours
            </Link>
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="mb-10 space-y-6 animate-fade-up">
          {/* Search Bar */}
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                type="text"
                placeholder="Search illustrations by keyword..."
                value={currentQuery}
                onChange={(e) => updateURL({ q: e.target.value })}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="pl-12 h-14 text-base shadow-card border-2 focus-visible:ring-primary/20"
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
            <div className="flex flex-wrap gap-2 items-center p-4 bg-card rounded-lg shadow-card">
              <span className="text-sm font-semibold text-muted-foreground">Active filters:</span>
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
        <div className="mb-8 flex items-center justify-between">
          <p className="text-base font-medium">
            {loading ? (
              <span className="text-muted-foreground">Loading...</span>
            ) : (
              <>
                <span className="text-foreground font-bold">{totalCount.toLocaleString()}</span>
                <span className="text-muted-foreground"> illustration{totalCount !== 1 ? 's' : ''} found</span>
              </>
            )}
          </p>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Grid className="h-4 w-4" />
            <span className="text-sm">Grid view</span>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
            {Array.from({ length: 24 }).map((_, i) => (
              <Card key={i} className="aspect-square overflow-hidden">
                <CardContent className="p-0 h-full bg-gradient-to-br from-muted to-muted/50 animate-pulse" />
              </Card>
            ))}
          </div>
        ) : illustrations.length > 0 ? (
          <>
            <IllustrationGrid illustrations={illustrations} />
            
            {/* Pagination */}
            {showPagination && (
              <div className="mt-16 flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="gap-2"
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