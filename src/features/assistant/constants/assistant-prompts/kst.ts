/** LLM user 프롬프트에 넣는 KST 현재 시각 문자열 */
export function formatAssistantPromptKstNow(now = new Date()): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    dateStyle: "full",
    timeStyle: "short",
  }).format(now);
}
