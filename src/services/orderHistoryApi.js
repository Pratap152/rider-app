import axios from 'axios';
import { tokenService } from '../services/TokenService';
import apiClient from './ApiClient';

export const getOrderHistory = async ({
  filter = 'weekly',
  page = 1,
  limit = 10,
}) => {
  try {
    const token = await tokenService.getAccessToken();

    if (!token) {
      return;
    }

    const response = await apiClient.get(
      `/api/rider/profile/orders/history`,
      {
        params: {
          filter,
          page,
          limit,
        },
      },
    );

    return response.data;
  } catch (error) {
    console.log('Order History API Error:', error);
    throw error;
  }
};