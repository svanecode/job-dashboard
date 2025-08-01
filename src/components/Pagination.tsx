'use client';
import { useJobStore } from '@/store/jobStore';

export default function Pagination() {
  const { totalJobs, totalPages, currentPage, jobsPerPage, setCurrentPage } = useJobStore();

  const startItem = (currentPage - 1) * jobsPerPage + 1;
  const endItem = Math.min(currentPage * jobsPerPage, totalJobs);

  if (totalPages <= 1) {
    return null;
  }

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show pages around current page
      let start = Math.max(1, currentPage - 2);
      let end = Math.min(totalPages, currentPage + 2);
      
      if (end - start < 4) {
        if (start === 1) {
          end = Math.min(totalPages, start + 4);
        } else {
          start = Math.max(1, end - 4);
        }
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-400">
          Viser {startItem}-{endItem} af {totalJobs} jobs
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Previous button */}
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-2 text-sm font-medium text-gray-300 bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Forrige
          </button>
          
          {/* Page numbers */}
          <div className="flex items-center space-x-1">
            {renderPageNumbers().map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  page === currentPage
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 bg-gray-700 border border-gray-600 hover:bg-gray-600'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
          
          {/* Next button */}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-2 text-sm font-medium text-gray-300 bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Næste
          </button>
        </div>
      </div>
    </div>
  );
} 