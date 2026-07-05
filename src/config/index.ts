const ENV = 'development'

const CONFIG = {
  development: {
    BASE_URL: 'http://localhost:3000/api'
  },
  production: {
    BASE_URL: 'http://175.178.19.169:3001/api'
  }
}

export const BASE_URL = CONFIG[ENV].BASE_URL
