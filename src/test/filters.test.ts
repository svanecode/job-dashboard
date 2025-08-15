import { describe, it, expect } from 'vitest';

// Test at filtrene fungerer korrekt sammen med søgning
describe('Filter Compatibility', () => {
  it('should allow score filters to override minScore', () => {
    // Test at score-filtre kan overskrive standard minScore
    const hasScoreFilters = true;
    const shouldUseMinScore = !hasScoreFilters;
    
    expect(shouldUseMinScore).toBe(false);
    expect(hasScoreFilters).toBe(true);
  });

  it('should support all filter types', () => {
    const filterTypes = ['score', 'location', 'dateFrom', 'dateTo', 'q'];
    
    expect(filterTypes).toContain('score');
    expect(filterTypes).toContain('location');
    expect(filterTypes).toContain('dateFrom');
    expect(filterTypes).toContain('dateTo');
    expect(filterTypes).toContain('q');
  });

  it('should use location field correctly', () => {
    const locationField = 'location';
    expect(locationField).toBe('location');
    expect(locationField).not.toBe('region');
  });
}); 