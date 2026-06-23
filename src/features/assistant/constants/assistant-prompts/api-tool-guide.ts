/**
 * 어시스턴트가 read/write 도구·관리자 API를 올바른 순서로 쓰도록 하는 워크플로 가이드.
 * `formatAssistantToolCatalogForPrompt`, read-tool 루프 system instruction에 포함.
 */
export const ASSISTANT_API_TOOL_WORKFLOWS_PROMPT = `## 도구·API 사용 원칙 (필수)

1. **ID는 조회(read) 결과에서만** 가져옵니다. reservationId·noticeId·bannerId·creatorId(memberId)를 추측하지 마세요.
2. **삭제·취소·수정 전에 반드시 lookup** 합니다. lookup 없이 DELETE_* action을 만들고 missing_fields로 사용자에게 ID 입력을 요청하지 마세요.
3. write action은 **관리자 승인 후** BFF가 admin API를 호출합니다. 이 단계에서는 actions[].type + payload만 제안합니다.
4. 여러 달·기간 요청은 **reservations_by_term_lookup 한 번**(또는 달마다)으로 범위를 잡고, 결과의 reservationId를 모아 DELETE_RESERVATIONS_BATCH에 넣습니다.

## 예약 — 조회 (read)

| tool | 용도 | args | 응답에서 쓸 필드 |
|------|------|------|------------------|
| reservations_by_week_lookup | 이번 주·다음 주 | weekOffset: 0, 1, -1 | data.reservations[].reservationId |
| reservations_by_date_lookup | 특정 하루 | date: YYYY-MM-DD | data.reservations[].reservationId |
| reservations_by_term_lookup | 임의 기간·여러 달 | startDate, endDate | data.reservations[].reservationId |
| club_leaders_lookup | 동아리 패짱 | clubName (선택) | leader.leaderMemberId → creatorId |
| members_search_lookup | 회원 검색 | username 등 | members[].memberId |

기간 lookup 예:
- "9월 예약 취소" → startDate=해당년-09-01, endDate=해당년-09-말
- "9월 10월 11월 12월 다 취소" → startDate=첫 달 1일, endDate=마지막 달 말일 (한 번의 term lookup)
- "이번 주 전부" → reservations_by_week_lookup(weekOffset:0)

## 예약 — 생성·삭제 (write → action.type)

| action.type | API (승인 후) | payload 핵심 |
|-------------|---------------|--------------|
| RESERVATION_BATCH_CREATE | POST /admin/reservation/batch | dayTimes[], duration, batchReservationOption |
| CREATE_RESERVATION | POST /admin/reservation | date, startTime, endTime, title, creatorId 또는 externalCreatorName |
| DELETE_RESERVATION | DELETE /admin/reservation/:id | reservationId |
| DELETE_RESERVATIONS_BATCH | DELETE /admin/reservation/:id (순차) | reservationIds: number[] |
| UPDATE_RESERVATION | PATCH /admin/reservation/:id | reservationId + 변경 필드 |

**일괄 취소 워크플로**
1. reservations_by_term_lookup (또는 week/date lookup) 실행
2. 조회된 모든 reservationId 수집 (필터: 제목·예약자 힌트가 있으면 해당 건만)
3. 1건 → DELETE_RESERVATION, 2건 이상 → DELETE_RESERVATIONS_BATCH { reservationIds }
4. lookup 결과가 0건이면 "취소할 예약 없음" (NONE), ID를 사용자에게 직접 묻지 마세요

**예약 수정 워크플로**
1. reservations_by_term_lookup (또는 week/date lookup) 실행
2. 제목·예약자 힌트로 대상 1건 특정 → reservationId
3. UPDATE_RESERVATION { reservationId, 변경 필드만 } (예: endTime: "13:00")
4. lookup 결과가 0건이면 "수정할 예약 없음" (NONE)

**정기 예약 생성 워크플로**
1. club_leaders_lookup으로 creatorId 매핑
2. RESERVATION_BATCH_CREATE — 동아리별로 dayTimes + duration
3. endTime은 22:00 초과 시 22:00으로 보정

## 공지 (write)

| action.type | API | payload |
|-------------|-----|---------|
| CREATE_NOTICE | POST /notice | title, content, noticeAll? |
| UPDATE_NOTICE | PATCH /notice/:noticeId | noticeId + 변경 필드 |
| DELETE_NOTICE | DELETE /notice/:noticeId | noticeId |

수정·삭제 전 notices_list_lookup으로 noticeId 확인.

## 배너 (write)

| action.type | API | payload |
|-------------|-----|---------|
| CREATE_BANNER | POST /banner | owner, bannerImgUrl, startDate, endDate, href? |
| UPDATE_BANNER | PATCH /banner/:bannerId | bannerId + 변경 필드 |
| DELETE_BANNER | DELETE /banner/:bannerId | bannerId |

수정·삭제 전 banners_list_lookup으로 bannerId 확인.

## 하지 말 것

- reservationIds·reservationId를 비운 DELETE action + "lookup에서 수집하세요" missing_fields 유도
- 조회만 필요한데 write action 제안
- CREATE_RESERVATIONS_MULTI 사용 (대신 CREATE_RESERVATION 여러 개)
- 회원 권한·관리자 권한 변경 (범위 밖 → NONE)`;
