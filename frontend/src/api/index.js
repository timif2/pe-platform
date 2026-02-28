import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 30000
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.warn('API Error:', error.message)
    return Promise.reject(error)
  }
)

export const portfolioApi = {
  getPortfolio: (filters = {}) => api.get('/api/portfolio/', { params: filters }),
  getFilterOptions: () => api.get('/api/portfolio/filters'),
  getSummary: () => api.get('/api/portfolio/summary'),
}

export const companyApi = {
  getCompany: (id) => api.get(`/api/companies/${id}`),
  getFinancials: (id) => api.get(`/api/companies/${id}/financials`),
  getPredictions: (id) => api.get(`/api/companies/${id}/predictions`),
  getNews: (id) => api.get(`/api/companies/${id}/news`),
  generateBusinessPlan: (id) => api.post(`/api/companies/${id}/business-plan`),
  chat: (id, message) => api.post(`/api/companies/${id}/chat`, { message }),
}

export const fundApi = {
  getFunds: () => api.get('/api/funds/'),
  getFund: (id) => api.get(`/api/funds/${id}`),
  getFundAnalytics: (id) => api.get(`/api/funds/${id}/analytics`),
  getMonteCarlo: (id, n = 500) => api.get(`/api/funds/${id}/monte-carlo`, { params: { n_simulations: n } }),
}

export const analyticsApi = {
  getOverview: () => api.get('/api/overview'),
  getSurvival: (groupBy = 'sector') => api.get('/api/survival', { params: { group_by: groupBy } }),
  getExplainability: (companyId) => api.get('/api/explainability', { params: { company_id: companyId } }),
}

export default api
