import React, { createContext, useContext, useState, useEffect } from 'react';
import { FilterState, FilterOptions } from '../types';
import api from '../services/api';

interface FilterContextType {
  filters: FilterState;
  setDateRange: (start_date: string, end_date: string) => void;
  setRegion: (region: string) => void;
  setCategory: (category: string) => void;
  resetFilters: () => void;
  filterOptions: FilterOptions;
  refreshKey: number;
  triggerRefresh: () => void;
}

const getDefaultFilters = (): FilterState => {
  const end = new Date();
  const start = new Date();
  start.setFullYear(end.getFullYear() - 1);

  return {
    start_date: '',
    end_date: '',
    region: '',
    category: '',
  };
};

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [filters, setFilters] = useState<FilterState>(getDefaultFilters);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    regions: [],
    categories: [],
    sub_categories: [],
    segments: [],
  });
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const fetchOptions = async () => {
    try {
      const opts = await api.getFilterOptions();
      setFilterOptions(opts);
    } catch {
      // Keep empty arrays if API fails or backend has no data yet
    }
  };

  useEffect(() => {
    fetchOptions();
  }, [refreshKey]);

  const setDateRange = (start_date: string, end_date: string) => {
    setFilters((prev) => ({ ...prev, start_date, end_date }));
  };

  const setRegion = (region: string) => {
    setFilters((prev) => ({ ...prev, region }));
  };

  const setCategory = (category: string) => {
    setFilters((prev) => ({ ...prev, category }));
  };

  const resetFilters = () => {
    setFilters(getDefaultFilters());
  };

  const triggerRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <FilterContext.Provider
      value={{
        filters,
        setDateRange,
        setRegion,
        setCategory,
        resetFilters,
        filterOptions,
        refreshKey,
        triggerRefresh,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
};

export const useFilterContext = (): FilterContextType => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilterContext must be used within a FilterProvider');
  }
  return context;
};
