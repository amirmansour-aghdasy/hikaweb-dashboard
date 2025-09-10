import { useState, useMemo } from "react";

export const usePagination = (data, itemsPerPage = 10) => {
    const [currentPage, setCurrentPage] = useState(1);

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return data.slice(startIndex, endIndex);
    }, [data, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(data.length / itemsPerPage);
    const hasNext = currentPage < totalPages;
    const hasPrev = currentPage > 1;

    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const nextPage = () => {
        if (hasNext) {
            setCurrentPage(currentPage + 1);
        }
    };

    const prevPage = () => {
        if (hasPrev) {
            setCurrentPage(currentPage - 1);
        }
    };

    const reset = () => {
        setCurrentPage(1);
    };

    return {
        currentPage,
        totalPages,
        hasNext,
        hasPrev,
        paginatedData,
        goToPage,
        nextPage,
        prevPage,
        reset,
    };
};
