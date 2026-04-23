import axios from 'axios'
import { mockAdapter } from './mockAdapter'

export const apiClient = axios.create({
  baseURL: '/api',
  timeout: 8000,
  adapter: mockAdapter,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }
})
