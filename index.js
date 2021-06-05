// http.js
import axios from 'axios';
import QS from 'qs'; // 引入qs模块, 用来序列化post类型的数据

class HttpClient {
  constructor(cfg) {
    this.timeout = 10000;  // 10秒超时
    this.withCredentials = true;
    // 异常的回掉函数, 对外面全局处理
    if (cfg && cfg.responseException) {
      this.responseException = cfg.responseException;
    }
  }
  setInterceptors(instance, options) {
    // 获取请求拦截器
    instance.interceptors.request.use((config) => {
      const method = config.method;
      if (method && (method.toLowerCase() === 'post' || method.toLowerCase() === 'put')) {
        config.data = QS.stringify(config.params);
        delete config.params;
      }
      // 外部方法处理请求拦截器后 再返回config
      options.requestCallBack && options.requestCallBack(config);
      return config;
    }, err => Promise.reject(err));

    // 处理响应拦截器
    instance.interceptors.response.use((response) => {
      // 外部方法处理响应拦截器后 再返回response
      options.responseCallBack && options.responseCallBack(response);
      if (response.status === 200) {  // 正常200的情况下
        return response.data;
      } else {
        // 处理响应拦截器异常的情况
        this.responseException && this.responseException(response);
      }
    }, (err) => {
      // 处理响应拦截器异常的情况
      this.responseException && this.responseException(err);
      console.log('err.response', err);
      return Promise.reject(err);
    })
  }
  request(options) {
    // 每次请求都会创建新的axios的实列
    const instance = axios.create();
    // 参数合并
    const config = {
      timeout: this.timeout,
      withCredentials: this.withCredentials,
      ...options,
    };
    // 设置拦截器
    this.setInterceptors(instance, config);
    return instance(config); // 返回axios的实列的执行结果
  }
}

export default HttpClient;