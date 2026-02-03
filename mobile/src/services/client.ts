import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosHeaders } from 'axios';
import Constants from 'expo-constants';

// Global token type declaration
const global = globalThis as unknown as { __token__?: string };

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3001';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_URL}/api`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = global.__token__;
        if (token) {
          // 使用 set 方法设置 Authorization 头
          if (config.headers instanceof AxiosHeaders) {
            config.headers.set('Authorization', `Bearer ${token}`);
          } else {
            (config.headers as any) = config.headers || {};
            (config.headers as any)['Authorization'] = `Bearer ${token}`;
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized - redirect to login
          global.__token__ = undefined;
        }
        return Promise.reject(error);
      }
    );
  }

  // Get current token (for debugging)
  getToken() {
    return global.__token__;
  }

  // Auth APIs
  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password });
    return response.data;
  }

  async register(email: string, password: string, displayName: string) {
    const response = await this.client.post('/auth/register', { email, password, displayName });
    return response.data;
  }

  async getMe() {
    const response = await this.client.get('/auth/me');
    return response.data;
  }

  // Essay APIs
  async getEssays(params?: { page?: number; limit?: number; status?: string }) {
    const response = await this.client.get('/essays', { params });
    return response.data;
  }

  async getEssay(id: string) {
    const response = await this.client.get(`/essays/${id}`);
    return response.data;
  }

  async createEssay(data: { rubricId: string; title?: string; content: string; source: 'text' | 'photo'; photoUrl?: string }) {
    const response = await this.client.post('/essays', data);
    return response.data;
  }

  async deleteEssay(id: string) {
    const response = await this.client.delete(`/essays/${id}`);
    return response.data;
  }

  async regradeEssay(id: string, content: string) {
    const response = await this.client.post(`/essays/${id}/regrade`, { content });
    return response.data;
  }

  // Rubric APIs
  async getRubrics(params?: { page?: number; search?: string }) {
    const response = await this.client.get('/rubrics', { params });
    return response.data;
  }

  async getRubric(id: string) {
    const response = await this.client.get(`/rubrics/${id}`);
    return response.data;
  }

  async createRubric(data: any) {
    const response = await this.client.post('/rubrics', data);
    return response.data;
  }

  async updateRubric(id: string, data: any) {
    const response = await this.client.put(`/rubrics/${id}`, data);
    return response.data;
  }

  async deleteRubric(id: string) {
    const response = await this.client.delete(`/rubrics/${id}`);
    return response.data;
  }

  async setDefaultRubric(id: string) {
    const response = await this.client.post(`/rubrics/${id}/default`);
    return response.data;
  }

  async suggestRubric(scene?: string, topic?: string, grade?: string) {
    const response = await this.client.post('/rubrics/suggest', { scene, topic, grade });
    return response.data;
  }

  async optimizeRubricPrompt(rubricName: string, dimensions: any[], customPrompt?: string) {
    const response = await this.client.post('/rubrics/optimize-prompt', {
      rubricName,
      dimensions,
      customPrompt
    });
    return response.data;
  }

  // Achievement APIs
  async getAchievements() {
    const response = await this.client.get('/achievements');
    return response.data;
  }

  async getUserAchievements() {
    const response = await this.client.get('/achievements/user');
    return response.data;
  }

  async getAchievementProgress() {
    const response = await this.client.get('/achievements/progress');
    return response.data;
  }

  async getUserLevel() {
    const response = await this.client.get('/achievements/level');
    return response.data;
  }

  // AI APIs
  async gradeEssay(essay: string, rubric: object, customPrompt?: string) {
    const response = await this.client.post('/ai/grade', { essay, rubric, customPrompt });
    return response.data;
  }

  async recognizeText(imageUrl: string) {
    const response = await this.client.post('/ai/ocr', { imageUrl });
    return response.data;
  }
}

export const api = new ApiClient();
