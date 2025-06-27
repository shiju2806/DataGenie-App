// src/utils/api.js
import { supabase } from '../config/supabase';
import { API_CONFIG } from '../config/api';

class DataGenieAPI {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
  }

  async getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    
    return {
      'Content-Type': 'application/json',
      ...(session?.access_token && {
        'Authorization': `Bearer ${session.access_token}`
      })
    };
  }

  async healthCheck() {
    const response = await fetch(`${this.baseURL}${API_CONFIG.ENDPOINTS.HEALTH}`);
    return await response.json();
  }

  async sendChatMessage(message, sessionId = 'default') {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseURL}${API_CONFIG.ENDPOINTS.CHAT}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message, sessionId })
    });

    return await response.json();
  }
}

export const dataGenieAPI = new DataGenieAPI();