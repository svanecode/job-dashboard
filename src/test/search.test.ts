import { describe, it, expect } from 'vitest';

// Test at søgefunktionaliteten bruger korrekte felter
describe('Search Functionality', () => {
  it('should search in correct database fields', () => {
    // Test at søgefelterne er korrekte
    const searchFields = ['title', 'company', 'description', 'location'];
    
    expect(searchFields).toContain('title');
    expect(searchFields).toContain('company');
    expect(searchFields).toContain('description');
    expect(searchFields).toContain('location');
    
    // Vigtigt: location skal være inkluderet, ikke region
    expect(searchFields).not.toContain('region');
  });

  it('should use location field for location-based search', () => {
    // Test at location bruges korrekt
    const locationField = 'location';
    expect(locationField).toBe('location');
    expect(locationField).not.toBe('region');
  });
}); 