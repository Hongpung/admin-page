import { X } from "lucide-react";

export function ClubRoleModalHeader({
  roleName,
  onClose,
}: {
  roleName: string;
  onClose: () => void;
}) {
  return (
    <>
      <button
        type="button"
        className="absolute right-8 top-4 cursor-pointer"
        onClick={onClose}
      >
        <X className="size-5" aria-hidden />
      </button>
      <div className="text-lg font-bold">{roleName} 지정</div>
    </>
  );
}
