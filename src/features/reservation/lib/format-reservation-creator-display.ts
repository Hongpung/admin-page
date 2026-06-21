/** 예약자 표시 — 이름·닉네임을 괄호 없이 2줄(또는 1줄)로 정규화 */
export function getReservationCreatorDisplayLines(
  creatorName: string,
  creatorNickname?: string | null,
): string[] {
  const name = creatorName.trim();
  const nickname = creatorNickname?.trim() ?? "";

  if (!name && !nickname) return [];
  if (!name) return [nickname];
  if (!nickname || nickname === name) return [name];
  return [name, nickname];
}

/** 한 줄 표시 — 닉네임이 있으면 닉네임, 없으면 이름 */
export function getReservationCreatorDisplayLabel(
  creatorName: string,
  creatorNickname?: string | null,
): string {
  const lines = getReservationCreatorDisplayLines(creatorName, creatorNickname);
  const nickname = creatorNickname?.trim() ?? "";
  if (nickname) return nickname;
  return lines[0] ?? "";
}
