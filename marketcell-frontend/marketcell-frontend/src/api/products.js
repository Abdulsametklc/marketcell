import api from './axios';

export const getProducts = (params) =>  api.get('/products/', { params });
export const getProduct  = (id)      => api.get(`/products/${id}/`);
export const getCategories = ()      => api.get('/categories/');

export const getReviews     = (id)          => api.get(`/products/${id}/reviews/`);
export const createReview   = (id, data)    => api.post(`/products/${id}/reviews/`, data);
export const deleteReview   = (id)          => api.delete(`/products/${id}/reviews/`);

export const getWishlist    = ()            => api.get('/wishlist/');
export const toggleWishlist = (productId)  => api.post(`/wishlist/${productId}/`);
export const checkWishlist  = (productId)  => api.get(`/wishlist/${productId}/`);