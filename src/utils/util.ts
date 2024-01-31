import { Process } from '@prisma/client';

export const storages = ['profile', 'article', 'schoolverify', 'report', 'asked'];

export const processMap = {
  pending: Process.pending,
  success: Process.success,
  denied: Process.denied,
};

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

/**
 * @method isEmpty
 * @param {String | Number | Object} value
 * @returns {Boolean} true & false
 * @description this value is Empty Check
 */
export const isEmpty = (value: string | number | object): boolean => {
  if (value === null) {
    return true;
  } else if (typeof value !== 'number' && value === '') {
    return true;
  } else if (typeof value === 'undefined' || value === undefined) {
    return true;
  } else if (value !== null && typeof value === 'object' && !Object.keys(value).length) {
    return true;
  } else {
    return false;
  }
};

export enum AdminRole {
  USER_SCHOOL_REVIEWER = 2 << 0, // 학교 인증 확인 권한
  USER_REPORT_REVIEWER = 2 << 1, // 유저 신고 확인 권한
  USER_MANAGE = 2 << 2, // 유저 전체 관리 권한
  BOARD_MANAGE = 2 << 3, // 게시판 전체 관리 권한
  SUPER_ADMIN = 2 << 10, // 아래 권한 모두 지급 가능 및 계정생성
}

export const excludeUserPassword = <User, Key extends keyof User>(
  user: User,
  keys: Key[],
): {
  [K in Exclude<keyof User, Key>]: User[K];
} => {
  return Object.fromEntries(Object.entries(user).filter(([key]) => !keys.includes(key as Key))) as {
    [K in Exclude<keyof User, Key>]: User[K];
  };
};

export const excludeAdminPassword = <Admin, Key extends keyof Admin>(
  admin: Admin,
  keys: Key[],
): {
  [K in Exclude<keyof Admin, Key>]: Admin[K];
} => {
  return Object.fromEntries(Object.entries(admin).filter(([key]) => !keys.includes(key as Key))) as {
    [K in Exclude<keyof Admin, Key>]: Admin[K];
  };
};

export function userHyperlink(userId: string, userName?: string): string {
  return `([${userName || userId}](https://admin.schoolmate.kr/user/${userId}))`;
}

export function discordCodeBlock(content: string, ext?: string): string {
  return `\`\`\`${ext || ''}\n${content.replace(/```/g, '')}\`\`\``;
}

export function checkAdminFlag(base: number, required: number | keyof typeof AdminRole): boolean {
  return checkFlag(base, typeof required === 'number' ? required : AdminRole[required]);
}

function checkFlag(base: number, required: number) {
  return (base & required) === required;
}

export function maskName(name: string): string {
  if (name.length === 2) {
    return name[0] + '*';
  } else {
    return name[0] + '*'.repeat(name.length - 2) + name.slice(-1);
  }
}
