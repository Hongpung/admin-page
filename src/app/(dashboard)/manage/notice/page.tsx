import { GET as loadInfos } from "@admin/app/api/manage/notice/load/route";
import type { Notice } from "@admin/features/notice";
import { NoticeManageClient } from "./_components/NoticeManageClient";

export const dynamic = "force-dynamic";

export default async function NoticeManagePage() {
  const loadedInfos = await loadInfos();
  const { notices } = (await loadedInfos.json()) as { notices: Notice[] };

  return <NoticeManageClient initNotices={notices} />;
}
