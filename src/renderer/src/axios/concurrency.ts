import { RequestFn } from './types-axios';

class ConcurrencyController {
  private max: number;
  private running: number = 0;
  private queue: Array<() => void> = [];
  private loadingCount: number = 0;

  constructor(maxConcurrent = 5) {
    this.max = maxConcurrent;
  }

  async execute<T>(requestFn: RequestFn<T>, skipLoading = false): Promise<T> {
    // 处理 Loading
    if (!skipLoading) {
      this.loadingCount++;
      if (this.loadingCount === 1) console.log('Show Loading...'); // 替换为 UI.showLoading()
    }

    // 并发排队
    if (this.running >= this.max) {
      await new Promise<void>((resolve) => this.queue.push(resolve));
    }

    this.running++;
    try {
      return await requestFn();
    } finally {
      this.running--;
      this.loadingCount--;

      // 释放队列中的下一个请求
      if (this.queue.length > 0) {
        this.queue.shift()?.();
      }

      // 关闭 Loading
      if (this.loadingCount === 0 && !skipLoading) {
        console.log('Hide Loading...'); // 替换为 UI.hideLoading()
      }
    }
  }
}

export const concurrency = new ConcurrencyController(5);