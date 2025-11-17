import { http } from '@/utils/http'
import { getEnvBaseUrl2 } from '@/utils'

// 请求基准地址
const baseUrl = getEnvBaseUrl2()

/** POST 请求 */
export const TouristLogin = (data) => {
  return http.post(baseUrl + '/auth/api/TouristRegister', data)
}

export const RefreshToken = (data) => {
  return http.post(baseUrl + '/auth/api/RefreshToken', data)
}

export const AuthenticateV2 = (data) => {
  return http.post(baseUrl + '/auth/api/AuthenticateV2', data)
}
