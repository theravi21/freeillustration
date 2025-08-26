import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Filter, RefreshCw, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  query?: string;
  hasFilters?: boolean;
}

const EmptyState: React.FC<EmptyStateProps> = ({ query, hasFilters }) => {
  const renderContent = () => {
    if (query && hasFilters) {
      return (
        <>
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">No results found</h2>
          <p className="text-muted-foreground mb-6 max-w-md text-center">
            We couldn't find any illustrations matching your search "{query}" with the current filters applied.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Clear filters
            </Button>
            <Button variant="outline" asChild>
              <Link to="/browse">
                Browse all illustrations
              </Link>
            </Button>
          </div>
        </>
      );
    }

    if (query) {
      return (
        <>
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">No results for "{query}"</h2>
          <p className="text-muted-foreground mb-6 max-w-md text-center">
            Try adjusting your search terms or browse our collection of free illustrations.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" asChild>
              <Link to="/browse">
                Browse all illustrations
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/upload">
                <Upload className="h-4 w-4 mr-2" />
                Upload illustration
              </Link>
            </Button>
          </div>
        </>
      );
    }

    if (hasFilters) {
      return (
        <>
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Filter className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">No illustrations match your filters</h2>
          <p className="text-muted-foreground mb-6 max-w-md text-center">
            Try removing some filters or browse all available illustrations.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Clear filters
            </Button>
            <Button variant="outline" asChild>
              <Link to="/browse">
                Browse all illustrations
              </Link>
            </Button>
          </div>
        </>
      );
    }

    // Default empty state (no illustrations at all)
    return (
      <>
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <Search className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">No illustrations yet</h2>
        <p className="text-muted-foreground mb-6 max-w-md text-center">
          Be the first to contribute! Upload your illustrations to help build our community library.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button asChild>
            <Link to="/upload">
              <Upload className="h-4 w-4 mr-2" />
              Upload first illustration
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/">
              Go to homepage
            </Link>
          </Button>
        </div>
      </>
    );
  };

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="max-w-lg mx-auto">
        <CardContent className="p-8 text-center">
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmptyState;