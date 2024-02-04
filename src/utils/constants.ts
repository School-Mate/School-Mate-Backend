export const storages = ['profile', 'article', 'schoolverify', 'report', 'asked'];
export const connectAccountMap = {
  leagueoflegends: 'leagueoflegends',
  instagram: 'instagram',
};

export const tierOfPoint = {
  'Iron IV': 1,
  'Iron III': 2,
  'Iron II': 3,
  'Iron I': 4,
  'Bronze IV': 5,
  'Bronze III': 6,
  'Bronze II': 7,
  'Bronze I': 8,
  'Silver IV': 9,
  'Silver III': 10,
  'Silver II': 11,
  'Silver I': 12,
  'Gold IV': 13,
  'Gold III': 14,
  'Gold II': 15,
  'Gold I': 16,
  'Platinum IV': 17,
  'Platinum III': 18,
  'Platinum II': 19,
  'Platinum I': 20,
  'Emerald IV': 21,
  'Emerald III': 22,
  'Emerald II': 23,
  'Emerald I': 24,
  'Diamond IV': 28,
  'Diamond III': 30,
  'Diamond II': 32,
  'Diamond I': 34,
  Master: 40,
  Grandmaster: 50,
  Challenger: 55,
};

export enum AdminRole {
  USER_SCHOOL_REVIEWER = 2 << 0, // 학교 인증 확인 권한
  USER_REPORT_REVIEWER = 2 << 1, // 유저 신고 확인 권한
  USER_MANAGE = 2 << 2, // 유저 전체 관리 권한
  BOARD_MANAGE = 2 << 3, // 게시판 전체 관리 권한
  SUPER_ADMIN = 2 << 10, // 아래 권한 모두 지급 가능 및 계정생성
}
