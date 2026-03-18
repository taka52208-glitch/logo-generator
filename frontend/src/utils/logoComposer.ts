const CANVAS_SIZE = 1024;

export interface LogoFontOption {
  id: string;
  label: string;
  family: string;
  weight: number;
  category: 'gothic' | 'mincho' | 'rounded' | 'western';
}

export const FONT_OPTIONS: LogoFontOption[] = [
  { id: 'mplus', label: 'M PLUS 1p', family: '"M PLUS 1p"', weight: 700, category: 'gothic' },
  { id: 'zen-gothic', label: 'Zen角ゴシック', family: '"Zen Kaku Gothic New"', weight: 700, category: 'gothic' },
  { id: 'noto-sans', label: 'Noto Sans JP', family: '"Noto Sans JP"', weight: 700, category: 'gothic' },
  { id: 'zen-maru', label: 'Zen丸ゴシック', family: '"Zen Maru Gothic"', weight: 700, category: 'rounded' },
  { id: 'noto-serif', label: 'Noto Serif JP', family: '"Noto Serif JP"', weight: 700, category: 'mincho' },
  { id: 'shippori', label: 'しっぽり明朝', family: '"Shippori Mincho"', weight: 700, category: 'mincho' },
  { id: 'klee', label: 'Klee One', family: '"Klee One"', weight: 600, category: 'rounded' },
  { id: 'montserrat', label: 'Montserrat', family: '"Montserrat"', weight: 700, category: 'western' },
  { id: 'playfair', label: 'Playfair Display', family: '"Playfair Display"', weight: 700, category: 'western' },
  { id: 'poppins', label: 'Poppins', family: '"Poppins"', weight: 600, category: 'western' },
  { id: 'raleway', label: 'Raleway', family: '"Raleway"', weight: 600, category: 'western' },
];

export interface ComposeOptions {
  fontId?: string;
  textColor?: string;
  fontSize?: number;  // 0-100 scale, 50 = default
}

const DEFAULT_OPTIONS: Required<ComposeOptions> = {
  fontId: 'mplus',
  textColor: '#1a1a2e',
  fontSize: 50,
};

export async function composeLogoWithText(
  base64Logo: string,
  companyName: string,
  options?: ComposeOptions,
): Promise<string> {
  await document.fonts.ready;

  const opts = { ...DEFAULT_OPTIONS, ...options };
  const font = FONT_OPTIONS.find((f) => f.id === opts.fontId) || FONT_OPTIONS[0];

  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  const ctx = canvas.getContext('2d')!;

  // White background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  // Calculate layout based on fontSize scale
  const textScale = opts.fontSize / 50; // 1.0 at default
  const baseFontSize = 52;
  const maxFontSize = Math.round(baseFontSize * textScale);
  const iconSize = Math.min(560, CANVAS_SIZE - maxFontSize * 2 - 100);
  const iconY = Math.max(40, (CANVAS_SIZE - iconSize - maxFontSize - 60) / 2);
  const textY = iconY + iconSize + 50;

  // Draw AI-generated icon
  const img = await loadImage(`data:image/png;base64,${base64Logo}`);
  const iconX = (CANVAS_SIZE - iconSize) / 2;
  ctx.drawImage(img, iconX, iconY, iconSize, iconSize);

  // Draw company name
  ctx.fillStyle = opts.textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  let fontSize = maxFontSize;
  const fontStr = () => `${font.weight} ${fontSize}px ${font.family}, sans-serif`;
  ctx.font = fontStr();
  while (ctx.measureText(companyName).width > CANVAS_SIZE * 0.82 && fontSize > 16) {
    fontSize -= 2;
    ctx.font = fontStr();
  }

  // Letter-spacing for short names
  if (companyName.length <= 12 && companyName.length > 0) {
    const spacing = fontSize * 0.12;
    const chars = Array.from(companyName);
    const totalWidth = chars.reduce(
      (sum, ch) => sum + ctx.measureText(ch).width + spacing,
      -spacing
    );
    if (totalWidth <= CANVAS_SIZE * 0.85) {
      let x = (CANVAS_SIZE - totalWidth) / 2;
      for (const ch of chars) {
        const w = ctx.measureText(ch).width;
        ctx.fillText(ch, x + w / 2, textY);
        x += w + spacing;
      }
      return canvas.toDataURL('image/png').replace('data:image/png;base64,', '');
    }
  }

  ctx.fillText(companyName, CANVAS_SIZE / 2, textY);
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
