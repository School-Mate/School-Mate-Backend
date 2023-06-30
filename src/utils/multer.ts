import type { RequestWithUser } from '@/interfaces/auth.interface';

import { S3 } from '@aws-sdk/client-s3';
import multer from 'multer';
import multerS3 from 'multer-s3';
import { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_S3_BUCKET } from '@/config';

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
    cb(null, `${req.headers.storage}/${req.user.id}-${Date.now()}.png`);
  },
  metadata: function (req: RequestWithUser, file, cb) {
    console.log(file);
    cb(null, {
      fieldName: file.fieldname,
      fileOriginalName: encodeURIComponent(file.originalname),
    });
  },
});

export const imageUpload = multer({
  storage: ImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});
