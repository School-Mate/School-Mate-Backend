import { AdminRole } from "./constants";

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
