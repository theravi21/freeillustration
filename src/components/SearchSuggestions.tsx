import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Search, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SearchSuggestionsProps {
  query: string;
  onSuggestionClick: (suggestion: string) => void;
}

const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({ query, onSuggestionClick }) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Popular search terms (could be from analytics in the future)
  const popularTerms = [
    'business', 'technology', 'people', 'abstract', 'nature', 'education',
    'medical', 'food', 'travel', 'sports', 'music', 'fashion'
  ];

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions(popularTerms.slice(0, 6));
      return;
    }

    const fetchSuggestions = async () => {
      setLoading(true);
      
      try {
        // Get suggestions from illustration titles and tags
        const { data, error } = await supabase
          .from('illustrations')
          .select('title, tags')
          .eq('status', 'approved')
          .or(`title.ilike.%${query}%,tags.cs.{${query}}`)
          .limit(10);

        if (error) {
          console.error('Error fetching suggestions:', error);
          setSuggestions(popularTerms.filter(term => 
            term.toLowerCase().includes(query.toLowerCase())
          ).slice(0, 6));
          return;
        }

        // Extract unique suggestions
        const suggestionSet = new Set<string>();
        
        data?.forEach(item => {
          // Add matching titles
          if (item.title.toLowerCase().includes(query.toLowerCase())) {
            suggestionSet.add(item.title);
          }
          
          // Add matching tags
          item.tags?.forEach(tag => {
            if (tag.toLowerCase().includes(query.toLowerCase())) {
              suggestionSet.add(tag);
            }
          });
        });

        // Add popular terms that match
        popularTerms.forEach(term => {
          if (term.toLowerCase().includes(query.toLowerCase())) {
            suggestionSet.add(term);
          }
        });

        setSuggestions(Array.from(suggestionSet).slice(0, 8));
      } catch (error) {
        console.error('Error in fetchSuggestions:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  if (suggestions.length === 0 && !loading) {
    return null;
  }

  return (
    <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-80 overflow-y-auto bg-popover border shadow-lg">
      <div className="p-2">
        {loading ? (
          <div className="p-3 text-center text-muted-foreground">
            <div className="animate-pulse flex items-center justify-center gap-2">
              <Search className="h-4 w-4" />
              Searching...
            </div>
          </div>
        ) : (
          <>
            {query.length < 2 && (
              <div className="px-3 py-2 text-xs text-muted-foreground font-medium border-b border-border">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-3 w-3" />
                  Popular searches
                </div>
              </div>
            )}
            
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => onSuggestionClick(suggestion)}
                className="w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground rounded-sm transition-colors flex items-center gap-2"
              >
                <Search className="h-3 w-3 text-muted-foreground" />
                <span className="truncate">{suggestion}</span>
              </button>
            ))}
            
            {query.length >= 2 && suggestions.length === 0 && (
              <div className="p-3 text-center text-muted-foreground text-sm">
                No suggestions found
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
};

export default SearchSuggestions;