import { saveAs } from 'file-saver';
import * as CryptoJS from 'crypto-js';

export const handleDownload = (text: string) => {
  console.log('download');
  console.log(text);

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    console.error('Canvas context is not supported');
    return;
  }

  // Create an SVG element and set its innerHTML to the SVG text
  const svgElement = document.createElement('div');
  svgElement.innerHTML = text;

  // Measure the SVG dimensions
  const svg = svgElement.firstElementChild as SVGSVGElement;
  const { width, height } = svg.getBoundingClientRect();

  // Set canvas dimensions
  canvas.width = width;
  canvas.height = height;

  // Encode the SVG text to base64
  const svgBase64 = btoa(unescape(encodeURIComponent(text)));
  const svgUrl = `data:image/svg+xml;base64,${svgBase64}`;

  const img = new Image();
  img.onload = () => {
    console.log('onload');
    ctx.drawImage(img, 0, 0);

    // Convert canvas to PNG and download
    canvas.toBlob((blob) => {
      const md5 = CryptoJS.MD5(text).toString();
      saveAs(blob!, `${md5}.png`);
    }, 'image/png');
  };
  img.onerror = (error) => {
    console.error('Image load error:', error); // Log any errors during image loading
  };

  img.src = svgUrl;
  console.log(img);
};
