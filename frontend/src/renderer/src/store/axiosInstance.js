import axios from 'axios'
import { encrypt, decrypt } from '../utils/Crypto'
import { token } from '../auth/index'

const bakendUrl = import.meta.env.VITE_BACKEND_URL

const axiosInstance = axios.create({
  baseURL: bakendUrl,
  headers: {
    'Content-Type': 'application/json'
  }
})

const isEncryptionEnabled = import.meta.env.VITE_ENCRYPT === 'true'

// 🔐 Request Interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const authToken = token.get()
    const originalData = config.data

    if (originalData && !(originalData instanceof FormData)) {
      config.data = isEncryptionEnabled
        ? { encryptedData: encrypt(originalData) }
        : originalData

      config.headers['Content-Type'] = 'application/json'
    }

    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`
    }

    return config
  },
  (error) => Promise.reject(error)
)

// 🔓 Response Interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    const contentType = response.headers['content-type']

    if (
      contentType &&
      (contentType.includes('image') ||
        contentType.includes('octet-stream') ||
        contentType.includes('application/pdf'))
    ) {
      return response
    }

    if (isEncryptionEnabled && response?.data?.encryptedData) {
      try {
        const decryptedData = decrypt(response.data.encryptedData)
        return { data: decryptedData }
      } catch (err) {
        return Promise.reject({
          message: '❌ Decryption failed',
          raw: response.data.encryptedData
        })
      }
    }

    return response
  },
  (error) => Promise.reject(error)
)

export default axiosInstance
