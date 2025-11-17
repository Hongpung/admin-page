type StatLinkCardSkeletonProps = {
  footnote?: string;
};

function SkeletonBar({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-gray-200 ${className}`} />;
}

export function StatLinkCardSkeleton({ footnote }: StatLinkCardSkeletonProps) {
  return (
    <div className="h-full rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <SkeletonBar className="h-4 w-20" />
      <SkeletonBar className="mt-3 h-8 w-16" />
      {footnote ? <SkeletonBar className="mt-3 h-3 w-28" /> : null}
    </div>
  );
}

export function NoticePreviewCardSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <SkeletonBar className="h-4 w-16" />
        <SkeletonBar className="h-4 w-10" />
      </div>
      <div className="mt-3 space-y-2">
        <SkeletonBar className="h-4 w-[90%]" />
        <SkeletonBar className="h-4 w-[84%]" />
        <SkeletonBar className="h-4 w-[75%]" />
        <SkeletonBar className="h-4 w-[88%]" />
      </div>
    </div>
  );
}

export function RecentEndedSessionsPanelSkeleton() {
  return (
    <div className="col-span-1 flex min-h-[420px] flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-shrink-0 items-center justify-between gap-2 border-b border-gray-100 px-3 py-2.5">
        <SkeletonBar className="h-4 w-36" />
        <SkeletonBar className="h-4 w-24" />
      </div>
      <div className="space-y-2 p-2">
        <div className="rounded-md border border-gray-100 p-3">
          <SkeletonBar className="h-4 w-[72%]" />
          <SkeletonBar className="mt-3 h-3 w-[56%]" />
        </div>
        <div className="rounded-md border border-gray-100 p-3">
          <SkeletonBar className="h-4 w-[68%]" />
          <SkeletonBar className="mt-3 h-3 w-[52%]" />
        </div>
        <div className="rounded-md border border-gray-100 p-3">
          <SkeletonBar className="h-4 w-[70%]" />
          <SkeletonBar className="mt-3 h-3 w-[58%]" />
        </div>
      </div>
    </div>
  );
}

export function WeekReservationsPanelSkeleton() {
  return (
    <div className="col-span-3 flex min-h-[420px] flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-shrink-0 items-center justify-between gap-2 border-b border-gray-100 px-3 py-2.5">
        <SkeletonBar className="h-4 w-24" />
        <SkeletonBar className="h-4 w-24" />
      </div>
      <div className="h-full p-3">
        <div className="grid h-full grid-cols-8 gap-2">
          <SkeletonBar className="h-full min-h-[340px] w-full" />
          <SkeletonBar className="h-full min-h-[340px] w-full" />
          <SkeletonBar className="h-full min-h-[340px] w-full" />
          <SkeletonBar className="h-full min-h-[340px] w-full" />
          <SkeletonBar className="h-full min-h-[340px] w-full" />
          <SkeletonBar className="h-full min-h-[340px] w-full" />
          <SkeletonBar className="h-full min-h-[340px] w-full" />
          <SkeletonBar className="h-full min-h-[340px] w-full" />
        </div>
      </div>
    </div>
  );
}
