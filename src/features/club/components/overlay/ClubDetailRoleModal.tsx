import type { KoRole } from "../../types";
import { ClubRoleAssignmentModal } from "./ClubRoleAssignmentModal";

export function ClubDetailRoleModal({
  visible,
  onClose,
  clubId,
  roleName,
  currentAssigneeId,
  onConfirm,
}: {
  visible: boolean;
  onClose: () => void;
  clubId: number;
  roleName: KoRole;
  currentAssigneeId?: number;
  onConfirm: (member: { memberId: number; name: string; nickname?: string }) => void;
}) {
  return (
    <ClubRoleAssignmentModal
      visible={visible}
      onClose={onClose}
      clubId={clubId}
      roleName={roleName}
      onConfirm={onConfirm}
      currentAssigneeId={currentAssigneeId}
    />
  );
}
