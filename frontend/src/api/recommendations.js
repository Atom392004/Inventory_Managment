import api from './apiClient'

export async function fetchRecommendations(productId) {
  const response = await api.get(`/scraped-products/recommendations/${productId}`)
  return response.data
}
