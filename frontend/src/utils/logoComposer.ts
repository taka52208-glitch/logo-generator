const CANVAS_SIZE = 1024;
const ICON_SIZE = 500;
const ICON_Y = 120;
const TEXT_Y_OFFSET = 80;

export async function composeLogoWithText(
  base64Logo: string,
  companyName: string,
  fontFamily = '"Noto Sans JP", "Helvetica Neue", Arial, sans-serif',
): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  const ctx = canvas.getContext('2d')!;

  // White background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  // Draw AI-generated icon
  const img = await loadImage(`data:image/png;base64,${base64Logo}`);
  const iconX = (CANVAS_SIZE - ICON_SIZE) / 2;
  ctx.drawImage(img, iconX, ICON_Y, ICON_SIZE, ICON_SIZE);

  // Draw company name below the icon
  const textY = ICON_Y + ICON_SIZE + TEXT_Y_OFFSET;
  ctx.fillStyle = '#1e293b';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Auto-size font to fit
  let fontSize = 64;
  ctx.font = `bold ${fontSize}px ${fontFamily}`;
  while (ctx.measureText(companyName).width > CANVAS_SIZE * 0.85 && fontSize > 24) {
    fontSize -= 2;
    ctx.font = `bold ${fontSize}px ${fontFamily}`;
  }

  ctx.fillText(companyName, CANVAS_SIZE / 2, textY);

  // Return as base64 (without data:image/png;base64, prefix)
  return canvas.toDataURL('image/png').replace('data:image/png;base64,', '');
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
