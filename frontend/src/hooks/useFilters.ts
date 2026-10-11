import { useFilterContext } from '../context/FilterContext';

export const useFilters = () => {
  const { filters, setDateRange, setRegion, setCategory, resetFilters, filterOptions, refreshKey, triggerRefresh } =
    useFilterContext();

  return {
    filters,
    setDateRange,
    setRegion,
    setCategory,
    resetFilters,
    filterOptions,
    refreshKey,
    triggerRefresh,
  };
};

export default useFilters;
