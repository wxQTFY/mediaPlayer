/**
 *  定义axios请求参数类型
 */
// types.ts
import { AxiosRequestConfig } from 'axios';

/** 扩展 Axios 配置 */
export interface AxiosConfig extends AxiosRequestConfig {
  skipErrorHandler?: boolean; // 跳过默认错误处理
  skipLoading?: boolean;      // 跳过全屏 Loading
}

/** 统一后端返回格式 */
export interface ResponseData<T = unknown> {
  code: number;
  message: string;
  data: T;
  success: boolean;
  timestamp: number;
}
/** 请求参数 */
export type RequestConfig = AxiosConfig


/** 错误响应结构 */
export interface ErrorResponse {
  code: number;
  message: string;
  data?: unknown;
  config?: AxiosConfig;
}

///** 内部请求配置 */
export interface InternalConfig extends AxiosConfig {
  metadata?: { startTime: Date };
}

// 并发控制器任务类型
export type RequestFn<T = unknown> = () => Promise<T>;
