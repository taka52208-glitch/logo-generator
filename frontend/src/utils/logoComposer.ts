const CANVAS_SIZE = 1024;

export interface LogoFontOption {
  id: string;
  label: string;
  family: string;
  weight: number;
  category: 'gothic' | 'mincho' | 'rounded' | 'display' | 'serif' | 'sans' | 'script';
}

export const FONT_OPTIONS: LogoFontOption[] = [
  // ── 日本語ゴシック ──
  { id: 'noto-sans', label: 'Noto Sans JP (Black)', family: '"Noto Sans JP"', weight: 900, category: 'gothic' },
  { id: 'mplus', label: 'M PLUS 1p', family: '"M PLUS 1p"', weight: 800, category: 'gothic' },
  { id: 'zen-gothic', label: 'Zen角ゴシック', family: '"Zen Kaku Gothic New"', weight: 700, category: 'gothic' },
  { id: 'dela', label: 'デラゴシック (極太)', family: '"Dela Gothic One"', weight: 400, category: 'display' },

  // ── 日本語丸ゴシック ──
  { id: 'zen-maru', label: 'Zen丸ゴシック', family: '"Zen Maru Gothic"', weight: 700, category: 'rounded' },
  { id: 'mplus-rounded', label: 'M PLUS Rounded', family: '"M PLUS Rounded 1c"', weight: 800, category: 'rounded' },
  { id: 'klee', label: 'Klee One', family: '"Klee One"', weight: 600, category: 'rounded' },
  { id: 'hachi', label: 'はちまるポップ', family: '"Hachi Maru Pop"', weight: 400, category: 'script' },

  // ── 日本語明朝 ──
  { id: 'noto-serif', label: 'Noto Serif JP (Black)', family: '"Noto Serif JP"', weight: 900, category: 'mincho' },
  { id: 'shippori', label: 'しっぽり明朝 (太)', family: '"Shippori Mincho"', weight: 800, category: 'mincho' },
  { id: 'zen-old', label: 'Zen旧明朝', family: '"Zen Old Mincho"', weight: 700, category: 'mincho' },
  { id: 'shippori-antique', label: 'しっぽりアンティーク', family: '"Shippori Antique"', weight: 400, category: 'mincho' },

  // ── 日本語ディスプレイ ──
  { id: 'reggae', label: 'レゲエ One', family: '"Reggae One"', weight: 400, category: 'display' },

  // ── 欧文サンセリフ ──
  { id: 'montserrat', label: 'Montserrat (ExtraBold)', family: '"Montserrat"', weight: 800, category: 'sans' },
  { id: 'poppins', label: 'Poppins', family: '"Poppins"', weight: 700, category: 'sans' },
  { id: 'raleway', label: 'Raleway', family: '"Raleway"', weight: 700, category: 'sans' },
  { id: 'oswald', label: 'Oswald', family: '"Oswald"', weight: 700, category: 'sans' },
  { id: 'bebas', label: 'Bebas Neue', family: '"Bebas Neue"', weight: 400, category: 'sans' },
  { id: 'russo', label: 'Russo One', family: '"Russo One"', weight: 400, category: 'display' },

  // ── 欧文セリフ ──
  { id: 'playfair', label: 'Playfair Display (Black)', family: '"Playfair Display"', weight: 900, category: 'serif' },
  { id: 'cormorant', label: 'Cormorant Garamond', family: '"Cormorant Garamond"', weight: 700, category: 'serif' },
  { id: 'abril', label: 'Abril Fatface', family: '"Abril Fatface"', weight: 400, category: 'serif' },
  { id: 'lora', label: 'Lora', family: '"Lora"', weight: 700, category: 'serif' },
  { id: 'cinzel', label: 'Cinzel (Black)', family: '"Cinzel"', weight: 900, category: 'serif' },
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
