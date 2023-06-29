import { config } from 'dotenv';
config({ path: `.env.${process.env.NODE_ENV || 'development'}.local` });

export const CREDENTIALS = process.env.CREDENTIALS === 'true';

export const { NODE_ENV, PORT, SECRET_KEY, LOG_FORMAT, LOG_DIR, ORIGIN, DOMAIN, GOOGLE_CLIENT_KEY, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, KAKAO_CLIENT_KEY, KAKAO_CLIENT_SECRET, KAKAO_REDIRECT_URI } = process.env;
