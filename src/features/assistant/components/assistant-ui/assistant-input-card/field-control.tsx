import type { AssistantInputFieldConfig } from "@admin/features/assistant/lib/assistant-input-field-config";
import { TimeArray } from "@admin/features/reservation/constants/constants";
import { cn } from "@admin/shared/lib/cn";

const inputClassName =
  "w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100";

type AssistantInputFieldControlProps = {
  config: AssistantInputFieldConfig;
  value: string;
  onChange: (value: string) => void;
};

export function AssistantInputFieldControl({
  config,
  value,
  onChange,
}: AssistantInputFieldControlProps) {
  if (config.widget === "info") {
    return (
      <p className="whitespace-pre-wrap rounded-md border border-blue-100 bg-blue-50/60 px-3 py-2 text-xs leading-relaxed text-gray-700">
        {config.message}
      </p>
    );
  }

  if (config.widget === "boolean") {
    return (
      <select
        className={inputClassName}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">선택</option>
        <option value="true">예</option>
        <option value="false">아니오</option>
      </select>
    );
  }

  if (config.widget === "select") {
    return (
      <select
        className={inputClassName}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">선택</option>
        {(config.options ?? []).map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  if (config.widget === "time") {
    return (
      <select
        className={inputClassName}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">선택</option>
        {TimeArray.map((time) => (
          <option key={time} value={time}>
            {time}
          </option>
        ))}
      </select>
    );
  }

  if (config.widget === "date") {
    return (
      <input
        type="date"
        className={inputClassName}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  if (config.widget === "number") {
    return (
      <input
        type="number"
        className={inputClassName}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={config.path === "creatorId" ? "memberId" : undefined}
      />
    );
  }

  if (config.widget === "member_name") {
    return (
      <input
        type="text"
        className={inputClassName}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="예약자 이름"
      />
    );
  }

  if (config.widget === "textarea") {
    return (
      <textarea
        className={cn(inputClassName, "min-h-24 resize-y")}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={
          config.path === "dayTimes"
            ? '[{"day":"MON","startTime":"19:00","endTime":"20:00"}]'
            : config.path === "reservationIds"
              ? "1, 2, 3 또는 [1,2,3]"
              : undefined
        }
      />
    );
  }

  return (
    <input
      type="text"
      className={inputClassName}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
