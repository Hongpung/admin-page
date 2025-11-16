type SidebarSectionKey = SuperSidebarSectionKey | SubSidebarSectionKey;

type SuperSidebarSectionKey = "user" | "usage" | "main" | "club" | "admin";

type SubSidebarSectionKey = "user" | "club" | "usage" | "clubActivity";

type SidebarItem = {
  label: string;
  href: string;
  activeWhen: string[];
};

export type SidebarSection = {
  title: string;
  icon: "users" | "calendar" | "monitor" | "shield" | "user";
  key: SidebarSectionKey;
  activeWhen: string[];
  items: SidebarItem[];
};

export const SUPER_SIDEBAR_SECTIONS: SidebarSection[] = [
  {
    key: "user",
    title: "유저 관리",
    icon: "user",
    activeWhen: ["/user/accept", "/user/manage"],
    items: [
      {
        label: "가입요청 관리",
        href: "/user/accept",
        activeWhen: ["/user/accept"],
      },
      {
        label: "유저 관리",
        href: "/user/manage",
        activeWhen: ["/user/manage"],
      },
    ],
  },
  {
    key: "club",
    title: "동아리 관리",
    icon: "users",
    activeWhen: ["/club/global"],
    items: [
      {
        label: "클럽 프로필 관리",
        href: "/club/global/profile",
        activeWhen: ["/club/global/profile"],
      },
    ],
  },
  {
    key: "usage",
    title: "연습실 이용 관리",
    icon: "calendar",
    activeWhen: ["/reservation/live", "/session", "/reservation/discarded"],
    items: [
      {
        label: "연습실 예약 관리",
        href: "/reservation/live/weeks",
        activeWhen: ["/reservation/live"],
      },
      {
        label: "연습실 이용 내역",
        href: "/session",
        activeWhen: ["/session"],
      },
      {
        label: "이용 취소된 예약",
        href: "/reservation/discarded",
        activeWhen: ["/reservation/discarded"],
      },
    ],
  },
  {
    key: "main",
    title: "메인 페이지 관리",
    icon: "monitor",
    activeWhen: ["/manage/notice", "/manage/banner"],
    items: [
      {
        label: "공지사항",
        href: "/manage/notice",
        activeWhen: ["/manage/notice"],
      },
      {
        label: "배너 관리",
        href: "/manage/banner",
        activeWhen: ["/manage/banner"],
      },
    ],
  },

  {
    key: "admin",
    title: "관리자",
    icon: "shield",
    activeWhen: ["/admin"],
    items: [
      {
        label: "관리자 계정",
        href: "/admin",
        activeWhen: ["/admin"],
      },
    ],
  },
];

export const SUB_SIDEBAR_SECTIONS: SidebarSection[] = [
  {
    key: "user",
    title: "가입 신청 관리",
    icon: "user",
    activeWhen: ["/user/sub/accept"],
    items: [
      {
        label: "신청 내역 확인",
        href: "/user/sub/accept",
        activeWhen: ["/user/sub/accept"],
      },
    ],
  },
  {
    key: "club",
    title: "동아리 및 권한 설정",
    icon: "monitor",
    activeWhen: ["/club/sub/profile"],
    items: [
      {
        label: "정보 및 역할 관리",
        href: "/club/sub/profile",
        activeWhen: ["/club/sub/profile"],
      },
    ],
  },
  {
    key: "clubActivity",
    title: "주요 활동 멤버",
    icon: "users",
    activeWhen: ["/club/sub/primary-member"],
    items: [
      {
        label: "활동 멤버 프로필",
        href: "/club/sub/primary-member",
        activeWhen: ["/club/sub/primary-member"],
      },
    ],
  },
];
