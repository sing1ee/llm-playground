// src/lib/downloadUtils.ts

import CryptoJS from 'crypto-js';
import { saveAs } from 'file-saver';

export const handleDownload = (text: string) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // 创建一个 Image 对象
  const img = new Image();

  // 将 SVG 转换为 data URL
  const svgBlob = new Blob([text], {
    type: 'image/svg+xml;charset=utf-8',
  });
  const url = URL.createObjectURL(svgBlob);
  img.src = url;
  img.onload = () => {
    // 设置 canvas 尺寸
    canvas.width = img.width;
    canvas.height = img.height;

    // 在 canvas 上绘制图像
    ctx?.drawImage(img, 0, 0);

    // 将 canvas 转换为 PNG 并下载
    canvas.toBlob((blob) => {
      // md5 of text
      const md5 = CryptoJS.MD5(text).toString();
      saveAs(blob!, `${md5}.png`);
    });

    // 清理
    URL.revokeObjectURL(url);
  };
};
