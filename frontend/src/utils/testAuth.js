// Simple test utility to check authentication flow
import api from '../api/axiosConfig';

export const testLogin = async (identifier, password) => {
  try {
    console.log('Testing login with:', { identifier, passwordLength: password?.length });
    
    const response = await api.post('/auth/login', { identifier, password });
    
    console.log('Login test response:', {
      status: response.status,
      hasToken: !!response.data.token,
      hasUser: !!response.data.user,
      data: response.data
    });
    
    return response.data;
  } catch (error) {
    console.error('Login test error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    throw error;
  }
};

export const testRegister = async (name, email, password) => {
  try {
    console.log('Testing registration with:', { name, email, passwordLength: password?.length });
    
    const response = await api.post('/auth/register', { name, email, password });
    
    console.log('Registration test response:', {
      status: response.status,
      requiresVerification: response.data.requiresVerification,
      data: response.data
    });
    
    return response.data;
  } catch (error) {
    console.error('Registration test error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    throw error;
  }
};