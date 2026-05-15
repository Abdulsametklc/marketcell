import api from './axios';

export const createOrder = (address_id, card_number) =>
  api.post('/orders/', { address_id, card_number });

export const getOrders = () => api.get('/orders/');

export const getOrder = (id) => api.get(`/orders/${id}/`);

export const getAddresses = () => api.get('/auth/addresses/');

export const createAddress = (data) => api.post('/auth/addresses/', data);