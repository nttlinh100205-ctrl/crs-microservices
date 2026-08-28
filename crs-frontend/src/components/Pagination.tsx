interface PaginationProps {
    currentPage: number; // bắt đầu từ 0, đúng định dạng Spring Data Pageable
    totalPages: number;
    onPageChange: (page: number) => void;
}

export default function Pagination({
                                       currentPage,
                                       totalPages,
                                       onPageChange,
                                   }: PaginationProps) {
    if (totalPages <= 1) return null;

    const pages = Array.from({ length: totalPages }, (_, i) => i);

    return (
        <div className="pagination">
            <button
                className="page-btn page-btn--nav"
                disabled={currentPage === 0}
                onClick={() => onPageChange(currentPage - 1)}
                aria-label="Trang trước"
            >
                « Trang trước
            </button>

            {pages.map((p) => (
                <button
                    key={p}
                    className={`page-btn${p === currentPage ? ' page-btn--active' : ''}`}
                    onClick={() => onPageChange(p)}
                    aria-current={p === currentPage ? 'page' : undefined}
                >
                    {p + 1}
                </button>
            ))}

            <button
                className="page-btn page-btn--nav"
                disabled={currentPage >= totalPages - 1}
                onClick={() => onPageChange(currentPage + 1)}
                aria-label="Trang sau"
            >
                Trang sau »
            </button>
        </div>
    );
}
