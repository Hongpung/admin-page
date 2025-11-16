"use client";

interface PaginationProps {
  page: number;
  maxPage: number;
  onPageChange: (page: number) => void;
  className?: string;
  showWhenSinglePage?: boolean;
}

export default function Pagination({
  page,
  maxPage,
  onPageChange,
  className = "",
  showWhenSinglePage = false,
}: PaginationProps) {
  if (maxPage <= 1 && !showWhenSinglePage) return null;

  return (
    <div
      className={`flex flex-row justify-center items-center gap-2 mt-4 ${className}`}
    >
      {Array.from({ length: maxPage }, (_, index) => (
        <button
          key={index}
          onClick={() => onPageChange(index)}
          className={`px-2 py-1 rounded-md ${
            page === index ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
        >
          {index + 1}
        </button>
      ))}
    </div>
  );
}
