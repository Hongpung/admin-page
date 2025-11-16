import { ADMIN_SUPPORT_EMAIL } from "@admin/shared/constants/support-contact";

type ErrorNoticeProps = {
  title?: string;
  detail?: string | null;
  className?: string;
};

const DEFAULT_TITLE = "문제가 발생했습니다. 잠시 후 다시 시도해 주세요.";
const GUIDE_TEXT =
  "계속 동일한 문제가 발생하면 새로고침하거나 네트워크 상태를 확인해 주세요.";

export function ErrorNotice({ title, detail, className }: ErrorNoticeProps) {
  return (
    <div
      className={`rounded-lg border border-red-200 bg-red-50 p-4 ${className ?? ""}`}
      role="alert"
    >
      <p className="font-medium text-red-800">{title ?? DEFAULT_TITLE}</p>
      {detail ? <p className="mt-1 text-sm text-red-700">{detail}</p> : null}
      <p className="mt-2 text-sm text-red-700">{GUIDE_TEXT}</p>
      <p className="mt-1 text-sm text-red-700">
        동일한 문제가 반복되면 ({ADMIN_SUPPORT_EMAIL})로
        연락해 주세요.
      </p>
    </div>
  );
}
