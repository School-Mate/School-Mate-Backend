import { S3 } from '@aws-sdk/client-s3';
import multer from 'multer';
import multerS3 from 'multer-s3';
import { HttpException } from '@/exceptions/HttpException';

import { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_S3_BUCKET } from '@/config';
import type { RequestWithUser } from '@/interfaces/auth.interface';
import dayjs from 'dayjs';
import { storages } from './util';
import Container from 'typedi';
import { PrismaClientService } from '@/services/prisma.service';

export const s3 = new S3({
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
  region: AWS_REGION,
});

export const uploadImage = multerS3({
  s3: s3,
  acl: 'public-read',
  bucket: AWS_S3_BUCKET,
  contentType: multerS3.AUTO_CONTENT_TYPE,
  key: function (req: RequestWithUser, file, cb) {
    if (!req.headers.storage) cb(new HttpException(400, 'storage 정보가 없습니다.'));
    if (!storages.includes(req.headers.storage as string)) cb(new HttpException(400, 'storage 정보가 올바르지 않습니다.'));
    const filetype = file.mimetype.split('/')[1];
    cb(
      null,
      // ['profile', 'article']/2023/01/01/12312312.png
      `${req.headers.storage}/${dayjs().format('YYYY')}/${dayjs().format('MM')}/${req.user.id}_${Date.now()}.${
        filetype === 'heic' ? 'jpg' : filetype
      }`,
    );
  },
  metadata: function (req: RequestWithUser, file, cb) {
    cb(null, {
      fieldName: file.fieldname,
      fileOriginalName: encodeURIComponent(file.originalname),
    });
  },
});

export const deleteImage = async (key: string) => {
  try {
    const params = {
      Bucket: AWS_S3_BUCKET,
      Key: key,
    };
    await s3.deleteObject(params);

    const imageData = await Container.get(PrismaClientService).image.findFirst({
      where: {
        key: key,
      },
    });

    if (imageData) {
      await Container.get(PrismaClientService).image.delete({
        where: {
          id: imageData.id,
        },
      });
    }
  } catch (error) {
    throw new HttpException(500, '이미지 삭제에 실패했습니다.');
  }
};

export const imageUpload = multer({
  storage: uploadImage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 10MB
  fileFilter: function (req, file, cb) {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg', 'image/heic'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new HttpException(400, '올바르지 않은 파일 형식입니다.'));
    }
  },
});
