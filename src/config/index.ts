const ENV = 'development'

const CONFIG = {
  development: {
    BASE_URL: 'http://localhost:3000/api'
  },
  production: {
    BASE_URL: 'https://your-domain.com/api'
  }
}

export const BASE_URL = CONFIG[ENV].BASE_URL
