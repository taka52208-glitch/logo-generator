import axios from 'axios';
import { config } from '../../config';

export const apiClient = axios.create({
  baseURL: config.apiUrl,
  timeout: 120_000,
  headers: {
    'Content-Type': 'application/json',
  },
});
