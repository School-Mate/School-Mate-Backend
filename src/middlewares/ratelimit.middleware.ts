import ResponseWrapper from '@/utils/responseWarpper';
import rateLimit from 'express-rate-limit';

export const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 250,
  statusCode: 429,
  keyGenerator: req => (req.headers['x-forwarded-for'] ? (req.headers['x-forwarded-for'] as string) : req.ip),
  handler(req, res) {
    ResponseWrapper(req as any, res, {
      message: '너무 많은 요청을 보냈습니다. 잠시 후 다시 시도해주세요.',
      status: 429,
    });
  },
});

export const verifyPhoneRateLimit = rateLimit({
  windowMs: 60 * 1000 * 30,
  max: 3,
  statusCode: 429,
  keyGenerator: req => (req.headers['x-forwarded-for'] ? (req.headers['x-forwarded-for'] as string) : req.ip),
  handler(req, res) {
    ResponseWrapper(req as any, res, {
      message: '너무 많은 요청을 보냈습니다. 잠시 후 다시 시도해주세요.',
      status: 429,
    });
  },
});
