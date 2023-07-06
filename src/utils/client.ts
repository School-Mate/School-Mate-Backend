import axios from 'axios';
import { NEIS_API_KEY, BUS_API_KEY } from '@config';

export const neisClient = axios.create({
  baseURL: 'https://open.neis.go.kr/',
  params: {
    KEY: NEIS_API_KEY,
    Type: 'json',
  },
});

export const busClient = axios.create({
  baseURL: 'http://apis.data.go.kr/',
  params: {
    serviceKey: encodeURIComponent(BUS_API_KEY),
    _type: encodeURIComponent('json'),
  },
});

export const kakaoClient = axios.create({
  baseURL: 'https://dapi.kakao.com/',
  headers: {
    Authorization: `KakaoAK ${process.env.KAKAO_CLIENT_KEY}`,
  },
});
