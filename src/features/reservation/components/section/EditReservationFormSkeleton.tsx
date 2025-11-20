const pulseBar = "rounded-md bg-neutral-200 animate-pulse";
const pulseLabel = "rounded bg-neutral-200 animate-pulse";

export function EditReservationFormSkeleton() {
  return (
    <div
      className="mx-4 mb-12 mt-6 flex flex-col gap-6 text-left"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">예약 정보를 불러오는 중입니다.</span>
      {["wide", "wide", "wide", "wide", "time", "wide", "wide", "wide"].map(
        (kind, i) =>
          kind === "time" ? (
            <div
              key={`sk-${i}`}
              className="flex flex-row items-center justify-between gap-4"
            >
              <div className={`h-4 w-20 ${pulseLabel}`} />
              <div className="flex flex-row items-center gap-4">
                <div className={`h-9 w-24 ${pulseBar}`} />
                <span className="text-neutral-300">~</span>
                <div className={`h-9 w-24 ${pulseBar}`} />
              </div>
            </div>
          ) : (
            <div
              key={`sk-${i}`}
              className="flex flex-row items-center justify-between gap-4"
            >
              <div className={`h-4 w-24 ${pulseLabel}`} />
              <div className={`h-9 w-full max-w-xs ${pulseBar}`} />
            </div>
          ),
      )}
    </div>
  );
}
