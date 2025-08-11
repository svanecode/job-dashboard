import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import FilterBar from './FilterBar';
import { Filters } from '@/lib/filters';

const mockFilters: Filters = {
  regions: [],
  scores: [],
  density: 'normal'
};

const mockProps = {
  value: mockFilters,
  onChange: vi.fn(),
  onApply: vi.fn(),
  onReset: vi.fn()
};

describe('FilterBar', () => {
  it('renders all filter sections', () => {
    render(<FilterBar {...mockProps} />);
    
    expect(screen.getByText('Regioner')).toBeInTheDocument();
    expect(screen.getByText('Scores')).toBeInTheDocument();
    expect(screen.getByText('Dato')).toBeInTheDocument();
    expect(screen.getByText('Anvend filtre')).toBeInTheDocument();
  });

  it('shows "Ingen filtre aktive" when no filters are active', () => {
    render(<FilterBar {...mockProps} />);
    
    expect(screen.getByText('Ingen filtre aktive')).toBeInTheDocument();
  });

  it('renders all region options', () => {
    render(<FilterBar {...mockProps} />);
    
    expect(screen.getByText('Hovedstaden')).toBeInTheDocument();
    expect(screen.getByText('Sjælland')).toBeInTheDocument();
    expect(screen.getByText('Fyn')).toBeInTheDocument();
    expect(screen.getByText('Syd- og Sønderjylland')).toBeInTheDocument();
    expect(screen.getByText('Midtjylland')).toBeInTheDocument();
    expect(screen.getByText('Nordjylland')).toBeInTheDocument();
    expect(screen.getByText('Udlandet')).toBeInTheDocument();
  });

  it('renders all score options', () => {
    render(<FilterBar {...mockProps} />);
    
    expect(screen.getByText('Score 3')).toBeInTheDocument();
    expect(screen.getByText('Score 2')).toBeInTheDocument();
    expect(screen.getByText('Score 1')).toBeInTheDocument();
  });
}); 