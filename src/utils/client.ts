import axios from 'axios';

import { BUS_API_KEY, NEIS_API_KEY, KAKAO_CLIENT_KEY } from '@config';

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
    Authorization: `KakaoAK ${KAKAO_CLIENT_KEY}`,
  },
});

export const neisClient = axios.create({
  baseURL: 'https://open.neis.go.kr/',
  params: {
    KEY: NEIS_API_KEY,
    Type: 'json',
  },
});
