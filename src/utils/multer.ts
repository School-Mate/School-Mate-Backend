import type { RequestWithUser } from '@/interfaces/auth.interface';

import { S3 } from '@aws-sdk/client-s3';
import multer from 'multer';
import multerS3 from 'multer-s3';
import { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_S3_BUCKET } from '@/config';
import { HttpException } from '@/exceptions/HttpException';

export const s3 = new S3({
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
  region: AWS_REGION,
});

export const ImageStorage = multerS3({
  s3: s3,
  bucket: AWS_S3_BUCKET,
  contentType: multerS3.AUTO_CONTENT_TYPE,
  acl: 'public-read',
  key: function (req: RequestWithUser, file, cb) {
    if (!req.headers.storage) cb(new HttpException(400, 'storage 헤더가 없습니다.'));
    cb(null, `${req.headers.storage}/${req.user.id}-${Date.now()}.png`);
  },
  metadata: function (req: RequestWithUser, file, cb) {
    cb(null, {
      fieldName: file.fieldname,
      fileOriginalName: encodeURIComponent(file.originalname),
    });
  },
});

export const deleteObject = async (key: string) => {
  try {
    const params = {
      Bucket: AWS_S3_BUCKET,
      Key: key,
    };
    await s3.deleteObject(params);
  } catch (error) {
    throw new HttpException(500, '이미지 삭제를 실패했습니다.');
  }
};

export const imageUpload = multer({
  storage: ImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});
