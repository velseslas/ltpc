import { useState, useMemo } from "react";

export interface UseTableFiltersOptions<T> {
  data: T[] | undefined;
  searchFields: (keyof T | ((item: T) => string | undefined))[];
  itemsPerPage?: number;
}

export interface UseTableFiltersResult<T> {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  filteredData: T[];
  paginatedData: T[];
  totalPages: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
}

export function useTableFilters<T extends { statut?: string }>({
  data,
  searchFields,
  itemsPerPage = 10,
}: UseTableFiltersOptions<T>): UseTableFiltersResult<T> {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredData = useMemo(() => {
    if (!data) return [];

    return data.filter((item) => {
      // Status filter
      if (statusFilter !== "all" && item.statut !== statusFilter) {
        return false;
      }

      // Search filter
      if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        return searchFields.some((field) => {
          if (typeof field === "function") {
            return field(item)?.toLowerCase().includes(lowerSearch);
          }
          const value = item[field];
          if (typeof value === "string") {
            return value.toLowerCase().includes(lowerSearch);
          }
          return false;
        });
      }

      return true;
    });
  }, [data, searchTerm, statusFilter, searchFields]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredData.length);
  const paginatedData = filteredData.slice(startIndex, endIndex);

  // Reset to first page when filters change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  return {
    searchTerm,
    setSearchTerm: handleSearchChange,
    statusFilter,
    setStatusFilter: handleStatusChange,
    currentPage,
    setCurrentPage,
    filteredData,
    paginatedData,
    totalPages,
    totalItems: filteredData.length,
    startIndex: startIndex + 1,
    endIndex,
  };
}
