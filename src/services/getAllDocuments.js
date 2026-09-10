import apiClient from './ApiClient';

export const getAllDocuments = async () => {
  try {
    const response = await apiClient.get('/api/rider/my-documents');
    return response.data;
  } catch (error) {
    console.log(
      'DOCUMENTS ERROR:',
      error?.response?.data || error,
    );

    throw error;
  }
};
