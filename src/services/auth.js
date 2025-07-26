import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT } from '../config';

const PATH_LOGIN = '/auth/login';
const PATH_LOGOUT = '/auth/logout';
const PATH_REGISTER = '/auth/register';
const PATH_FORGOT_PASSWORD = '/auth/forgot-password';
const PATH_RESET_PASSWORD = '/auth/reset-password';
const PATH_VERIFY = '/auth/verify';

export const verifyAuth = async (token) => {
  try {
    const response = await axios.get(`${API_BASE_URL}${PATH_VERIFY}`, {
      headers: {
        Authorization: `Bearer ${token}` // Add the token to the Authorization header
      },
      timeout: API_TIMEOUT // Set the timeout from the config
    });

    // Return the response data if the request is successful
    return response.data;
  } catch (error) {
    console.error('Error verifying authentication:', error);
    throw error; // Re-throw the error to handle it in the calling function
  }
};

export const checkAuth = async () => {
  const token = localStorage.getItem('authToken'); // Retrieve the token from local storage or cookies
  if (!token) {
    return false; // No token, user is not authenticated
  }

  try {
    const authData = await verifyAuth(token);
    console.log('Authentication verified:', authData);
    return true; // User is authenticated
  } catch {
    return false; // Authentication failed
  }
};

export const login = async (username, password) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}${PATH_LOGIN}`,
      { username, password }, // Send username and password in the request body
      {
        timeout: API_TIMEOUT // Set the timeout from the config
      }
    );

    // Save the token to local storage or cookies
    const { token } = response.data;
    localStorage.setItem('authToken', token);

    // Return the response data
    return response.data;
  } catch (error) {
    console.error('Error during login:', error);
    throw error; // Re-throw the error to handle it in the calling function
  }
};
