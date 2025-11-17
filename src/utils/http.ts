import { CustomRequestOptions } from '@/interceptors/request'
import { RefreshToken } from '@/service/api2'
import { useUserStore } from '@/store'

// 401是否正在并发请求处理
let is401 = false
let requestList401 = []
let isNoteken = false
let requestListNoteken = []

export const noTokenUrl = [
  '/auth/api/TouristRegister',
  '/auth/TokenAuth/GetSystemDate',
  '/auth/api/RefreshToken',
]

export const http = async <T>(options: CustomRequestOptions) => {
  // 1. 返回 Promise 对象
  return new Promise<IResData<T>>((resolve, reject) => {
    const userStore = useUserStore()
    if (!noTokenUrl.find((url) => options.url.includes(url))) {
      const token = userStore.token
      if (!token) {
        if (!isNoteken) {
          isNoteken = true
          userStore.getTouristToken().then(() => {
            isNoteken = false
            resolve(http(options))
            requestListNoteken.forEach((callback) => {
              callback()
            })
            requestListNoteken = []
          })
        } else {
          requestListNoteken.unshift(() => {
            resolve(http(options))
          })
        }
      } else {
        options.Utoken = token
      }
    }
    uni.request({
      ...options,
      dataType: 'json',
      // #ifndef MP-WEIXIN
      responseType: 'json',
      // #endif
      // 响应成功
      async success(res) {
        const data = (res.data as any).result as IResData<T>
        // 状态码 2xx，参考 axios 的设计
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // 2.1 提取核心数据 res.data
          if (data.code === 401) {
            if (!is401) {
              is401 = true
              const tkRes: any = await RefreshToken({ token: userStore.token })
              if (tkRes.isLogin && tkRes.accessToken) {
                is401 = false
                resolve(http(options))
                requestList401.forEach((callback) => {
                  callback()
                })
                requestList401 = []
              } else {
                requestList401 = []
                is401 = false
                userStore.clearUserInfo()
              }
            } else {
              requestList401.unshift(() => {
                resolve(http(options))
              })
            }
          } else {
            resolve(data)
          }
        } else if (res.statusCode === 401) {
          // 401错误  -> 清理用户信息，跳转到登录页
          // userStore.clearUserInfo()
          // uni.navigateTo({ url: '/pages/login/login' })
          reject(res)
        } else {
          // 其他错误 -> 根据后端错误信息轻提示
          !options.hideErrorToast &&
            uni.showToast({
              icon: 'none',
              title: data.msg || '请求错误',
            })
          reject(res)
        }
      },
      // 响应失败
      fail(err) {
        uni.showToast({
          icon: 'none',
          title: '网络错误，换个网络试试',
        })
        reject(err)
      },
    })
  })
}

/**
 * GET 请求
 * @param url 后台地址
 * @param query 请求query参数
 * @param header 请求头，默认为json格式
 * @returns
 */
export const httpGet = <T>(
  url: string,
  query?: Record<string, any>,
  header?: Record<string, any>,
) => {
  return http<T>({
    url,
    query,
    method: 'GET',
    header,
  })
}

/**
 * POST 请求
 * @param url 后台地址
 * @param data 请求body参数
 * @param query 请求query参数，post请求也支持query，很多微信接口都需要
 * @param header 请求头，默认为json格式
 * @returns
 */
export const httpPost = <T>(
  url: string,
  data?: Record<string, any>,
  query?: Record<string, any>,
  header?: Record<string, any>,
) => {
  return http<T>({
    url,
    query,
    data,
    method: 'POST',
    header,
  })
}

http.get = httpGet
http.post = httpPost
