import api from './axios';

export const getCart = () => api.get('/cart/');

export const addToCart = (variant_id, quantity) =>
  api.post('/cart/items/', { variant_id, quantity });

export const updateCartItem = (id, quantity) =>
  api.patch(`/cart/items/${id}/`, { quantity });

export const removeCartItem = (id) =>
  api.delete(`/cart/items/${id}/`);