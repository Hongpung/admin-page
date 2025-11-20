"use client";

import Pagination from "@admin/shared/components/Pagination";
import Table, {
  TABLE_SHELL_IN_SECTION_CLASS,
} from "@admin/shared/components/Table";
import TableSection from "@admin/shared/components/TableSection";
import VisibleLengthSelect from "@admin/shared/components/VisibleLengthSelect";
import { useDiscardedReservationListState } from "../../hooks/state";
import {
  useDiscardedReservationColumns,
  useDiscardedReservations,
} from "../../hooks/view-model";
import { RESERVATION_LABEL } from "../../constants/reservation-label.constants";
import { RESERVATION_MESSAGE } from "../../constants/reservation-message.constants";
import { DiscardedReservationDetailModal } from "../overlay/DiscardedReservationDetailModal";

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

export default function DiscardedReservationsPage() {
  const {
    page,
    setPage,
    take,
    changeTake,
    skip,
    getTotalPages,
    selectedDetailItem,
    setSelectedDetailItem,
  } = useDiscardedReservationListState();
  const { items, total, loading, error } = useDiscardedReservations(skip, take);
  const totalPages = getTotalPages(total);
  const columns = useDiscardedReservationColumns({
    onDetailOpen: setSelectedDetailItem,
  });

  return (
    <>
      <div className="text-lg font-medium ml-2 mt-2">
        {RESERVATION_LABEL.discardedTitle} ({total})
      </div>

      <div className="flex flex-row justify-between items-center gap-4 ml-2 mt-2 flex-wrap">
        <div className="flex flex-row flex-wrap gap-4 min-h-10 items-center text-sm text-gray-500">
          {!loading ? (
            <span>
              현재 {page + 1} / {totalPages} 페이지
            </span>
          ) : null}
        </div>
        <VisibleLengthSelect
          value={take}
          options={PAGE_SIZE_OPTIONS}
          onChange={changeTake}
          className="flex flex-row gap-3 h-10 items-center shrink-0"
        />
      </div>

      <TableSection
        footer={
          !loading ? (
            <Pagination
              className="!mt-0"
              page={page}
              maxPage={totalPages}
              onPageChange={setPage}
              showWhenSinglePage
            />
          ) : null
        }
      >
        <Table
          dataSource={items}
          columns={columns}
          rowKey="discardedReservationId"
          loading={loading}
          loadingContent={
            <div className="p-8 text-center text-gray-500">{RESERVATION_LABEL.loading}</div>
          }
          error={error ?? undefined}
          emptyText={RESERVATION_MESSAGE.discardedListEmpty}
          emptyClassName="text-gray-400 font-normal text-base py-16 px-4"
          shellClassName={TABLE_SHELL_IN_SECTION_CLASS}
          rowClassName="border-t hover:bg-gray-50"
        />
      </TableSection>

      <DiscardedReservationDetailModal
        visible={Boolean(selectedDetailItem)}
        item={selectedDetailItem}
        onClose={() => setSelectedDetailItem(null)}
      />
    </>
  );
}
