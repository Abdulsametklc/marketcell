import api from './axios';

export const getSellerOrders = () => api.get('/seller/orders/');

export const updateOrderStatus = (id, status) =>
  api.patch(`/seller/orders/${id}/status/`, { status });

export const getSellerStats = () => api.get('/seller/stats/');