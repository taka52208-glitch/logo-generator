const CANVAS_SIZE = 1024;
const ICON_SIZE = 520;
const ICON_Y = 100;
const TEXT_Y_OFFSET = 70;

// Google Fonts to load for professional logo text
const GOOGLE_FONTS = [
  'Noto+Sans+JP:wght@400;700',
  'Zen+Kaku+Gothic+New:wght@400;700',
  'M+PLUS+1p:wght@400;700;800',
];

let fontsLoaded = false;

async function loadGoogleFonts(): Promise<void> {
  if (fontsLoaded) return;

  const families = GOOGLE_FONTS.map((f) => `family=${f}`).join('&');
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?${families}&display=swap`;
  document.head.appendChild(link);

  // Wait for fonts to be ready
  await document.fonts.ready;

  // Extra wait to ensure rendering
  await new Promise((r) => setTimeout(r, 300));
  fontsLoaded = true;
}

const FONT_PRIMARY = '"M PLUS 1p", "Zen Kaku Gothic New", "Noto Sans JP", sans-serif';

export async function composeLogoWithText(
  base64Logo: string,
  companyName: string,
): Promise<string> {
  await loadGoogleFonts();

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
  ctx.fillStyle = '#1a1a2e';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Auto-size font to fit — use weight 700 for professional look
  let fontSize = 56;
  ctx.font = `700 ${fontSize}px ${FONT_PRIMARY}`;
  while (ctx.measureText(companyName).width > CANVAS_SIZE * 0.8 && fontSize > 20) {
    fontSize -= 2;
    ctx.font = `700 ${fontSize}px ${FONT_PRIMARY}`;
  }

  ctx.fillText(companyName, CANVAS_SIZE / 2, textY);

  // Subtle letter-spacing effect: if company name is short, add tracking
  // (Canvas doesn't support letter-spacing natively, so we draw char by char for short names)
  if (companyName.length <= 10 && companyName.length > 0) {
    const spacing = fontSize * 0.15;
    const totalWidth = Array.from(companyName).reduce(
      (sum, ch) => sum + ctx.measureText(ch).width + spacing,
      -spacing
    );
    if (totalWidth <= CANVAS_SIZE * 0.85) {
      // Clear the text we just drew
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, textY - fontSize, CANVAS_SIZE, fontSize * 2);
      ctx.fillStyle = '#1a1a2e';

      let x = (CANVAS_SIZE - totalWidth) / 2;
      for (const ch of companyName) {
        const w = ctx.measureText(ch).width;
        ctx.fillText(ch, x + w / 2, textY);
        x += w + spacing;
      }
    }
  }

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
