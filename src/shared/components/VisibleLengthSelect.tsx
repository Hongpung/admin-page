"use client";

import type { ReactNode } from "react";

type VisibleLengthSelectProps = {
  /** 현재 선택된 표시 개수(페이지 크기 등) */
  value: number;
  onChange: (next: number) => void;
  /** 선택 가능한 값 목록 */
  options?: readonly number[];
  /** 라벨 (null이면 라벨 영역 미표시) */
  label?: ReactNode | null;
  className?: string;
  selectClassName?: string;
  labelClassName?: string;
};

const defaultOptions: number[] = [10, 20, 50];

const defaultSelectClass =
  "border border-[#446fdb] rounded px-2 py-0.5 outline-[#1e3a80]";

const defaultLabelClass = "text-sm text-gray-500";

/**
 * 표에 보이는 행 수·페이지 크기 등 `visibleLength` 선택용 셀렉트.
 * Table과 분리된 공통 컴포넌트입니다.
 */
export default function VisibleLengthSelect({
  value,
  onChange,
  options = defaultOptions,
  label = "페이지 사이즈",
  className = "flex flex-row gap-3 h-10 items-center",
  selectClassName = defaultSelectClass,
  labelClassName = defaultLabelClass,
}: VisibleLengthSelectProps) {
  return (
    <div className={className}>
      {label != null && label !== "" && (
        <div className={labelClassName}>{label}</div>
      )}
      <select
        className={selectClassName}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      >
        {options.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
    </div>
  );
}
