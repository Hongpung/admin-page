import Image from "next/image";
import { Pencil, Trash2 } from "lucide-react";
import type { BannerDTO } from "../../types";

function formatDateOnly(iso: string) {
  return new Date(iso).toISOString().split("T")[0];
}

function BannerRow({
  banner,
  onEdit,
  onDelete,
}: {
  banner: BannerDTO;
  onEdit: (banner: BannerDTO) => void;
  onDelete: (bannerId: string) => void;
}) {
  return (
    <article className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm ring-1 ring-neutral-100/80">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-6">
        <div className="relative h-[120px] w-full max-w-[360px] shrink-0 overflow-hidden rounded-md border border-neutral-100 bg-neutral-100">
          <Image
            src={banner.bannerImgUrl}
            alt={`${banner.owner} 배너 이미지`}
            fill
            className="object-cover object-center"
            sizes="(max-width: 768px) 100vw, 360px"
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <dl className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2.5 text-base leading-snug py-2">
              <dt className="shrink-0 text-neutral-500">요청자</dt>
              <dd className="min-w-0 font-semibold text-neutral-900">
                {banner.owner}
              </dd>
              <dt className="shrink-0 text-neutral-500">게시 기간</dt>
              <dd className="tabular-nums font-semibold text-neutral-900">
                <time dateTime={banner.startDate}>
                  {formatDateOnly(banner.startDate)}
                </time>
                <span className="mx-2 font-normal text-neutral-400">~</span>
                <time dateTime={banner.endDate}>
                  {formatDateOnly(banner.endDate)}
                </time>
              </dd>
              {banner.href && <>
                <dt className="shrink-0 text-neutral-500">연결된 링크</dt>
                <dd className="min-w-0 font-semibold text-neutral-900">
                  {banner.href}
                </dd>
              </>}
            </dl>

            <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
              <button
                type="button"
                onClick={() => onEdit(banner)}
                className="inline-flex items-center gap-1.5 rounded-md border border-sky-200 bg-white px-2.5 py-1.5 text-sm font-medium text-sky-800 shadow-sm transition-colors hover:border-sky-300 hover:bg-sky-50 focus-visible:outline focus-visible:ring-2 focus-visible:ring-sky-400/40"
              >
                <Pencil className="size-3.5 shrink-0 opacity-80" aria-hidden />
                변경
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm("배너를 삭제하시겠습니까?"))
                    onDelete(banner.bannerId);
                }}
                className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-white px-2.5 py-1.5 text-sm font-medium text-red-700 shadow-sm transition-colors hover:border-red-300 hover:bg-red-50 focus-visible:outline focus-visible:ring-2 focus-visible:ring-red-400/40"
              >
                <Trash2 className="size-3.5 shrink-0 opacity-80" aria-hidden />
                삭제
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export function BannerStatusSection({
  title,
  banners,
  onEdit,
  onDelete,
  emptyLabel = "해당 되는 배너가 없습니다.",
}: {
  title: string;
  banners: BannerDTO[];
  onEdit: (banner: BannerDTO) => void;
  onDelete: (bannerId: string) => void;
  emptyLabel?: string;
}) {
  return (
    <section className="space-y-3">
      <h3 className="text-base font-semibold uppercase tracking-wider text-neutral-400">
        {title}
      </h3>
      {banners.length === 0 ? (
        <div className="flex min-h-28 flex-col items-center justify-center rounded-lg border border-dashed border-neutral-200 bg-neutral-50/60 px-4 py-10 text-center text-sm text-neutral-400">
          {emptyLabel}
        </div>
      ) : (
        <div className="flex w-full flex-col gap-4">
          {banners.map((banner) => (
            <BannerRow
              key={banner.bannerId}
              banner={banner}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </section>
  );
}
