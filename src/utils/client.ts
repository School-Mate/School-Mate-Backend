import axios from 'axios';
import { NEIS_API_KEY } from '@config';

export const neisClient = axios.create({
  baseURL: 'https://open.neis.go.kr/',
  params: {
    KEY: NEIS_API_KEY,
    Type: 'json',
  },
});
