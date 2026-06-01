import { app } from 'electron';

import { type GPUInfo } from '../../common/types';



export const getGpuInfo = async () => {
    const gpuInfo = await app.getGPUInfo('complete') as GPUInfo;
    // 打印显卡型号和驱动版本
    console.log('显卡型号:', gpuInfo);
    console.log('--- GPU 硬件信息 ---');
    gpuInfo.gpuDevice.forEach((device, index) => {
        console.log(`显卡 ${index + 1}: ${device.vendorId} - ${device.deviceId}`);
    });
    
    // 打印详细的辅助信息（如驱动版本）
    console.log('驱动版本:', gpuInfo.auxAttributes?.driverVersion);
}

