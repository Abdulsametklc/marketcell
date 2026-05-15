import api from './axios';

export const createOrder   = (address_id, card_number, coupon_code) =>
  api.post('/orders/', { address_id, card_number, ...(coupon_code ? { coupon_code } : {}) });

export const getOrders     = ()    => api.get('/orders/');
export const getOrder      = (id)  => api.get(`/orders/${id}/`);
export const getAddresses  = ()    => api.get('/auth/addresses/');
export const createAddress = (data)=> api.post('/auth/addresses/', data);

export const validateCoupon      = (code) => api.post('/coupons/validate/', { code });
export const getNotifications    = ()     => api.get('/notifications/');
export const markNotificationsRead = ()   => api.post('/notifications/read/');