import { User } from '@prisma/client';

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
