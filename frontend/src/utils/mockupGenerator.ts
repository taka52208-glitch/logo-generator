const FONT_FAMILY = '"M PLUS 1p", "Zen Kaku Gothic New", "Noto Sans JP", sans-serif';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function toDataUrl(base64: string): string {
  return `data:image/png;base64,${base64}`;
}

function canvasToBase64(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/png').replace('data:image/png;base64,', '');
}

// ---------------------------------------------------------------------------
// 1. Business Card Mockup  (1050 x 600)
// ---------------------------------------------------------------------------
export async function generateBusinessCardMockup(
  logoBase64: string,
  companyName: string,
): Promise<string> {
  const W = 1050;
  const H = 600;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = '#f5f5f5';
  ctx.fillRect(0, 0, W, H);

  // Card dimensions & position (centered)
  const cardW = 860;
  const cardH = 440;
  const cardX = (W - cardW) / 2;
  const cardY = (H - cardH) / 2;

  // Card shadow
  ctx.shadowColor = 'rgba(0,0,0,0.18)';
  ctx.shadowBlur = 32;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 8;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 10);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Logo — top-left area of card
  const logoSize = 120;
  const logoPad = 50;
  const logoX = cardX + logoPad;
  const logoY = cardY + logoPad;

  const img = await loadImage(toDataUrl(logoBase64));
  ctx.drawImage(img, logoX, logoY, logoSize, logoSize);

  // Company name — to the right of the logo, vertically centred on it
  const nameX = logoX + logoSize + 24;
  const nameY = logoY + logoSize / 2;
  ctx.fillStyle = '#1e293b';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';

  let nameFontSize = 36;
  ctx.font = `bold ${nameFontSize}px ${FONT_FAMILY}`;
  const maxNameW = cardW - logoPad - logoSize - 24 - logoPad;
  while (ctx.measureText(companyName).width > maxNameW && nameFontSize > 16) {
    nameFontSize -= 1;
    ctx.font = `bold ${nameFontSize}px ${FONT_FAMILY}`;
  }
  ctx.fillText(companyName, nameX, nameY);

  // Horizontal divider
  const dividerY = logoY + logoSize + 28;
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cardX + logoPad, dividerY);
  ctx.lineTo(cardX + cardW - logoPad, dividerY);
  ctx.stroke();

  // Placeholder contact lines
  const lines = ['Taro Yamada  /  Manager', 'taro@example.com  ·  080-0000-0000', '1-1-1 Chiyoda, Tokyo 100-0001'];
  const lineH = 36;
  const textStartY = dividerY + 32;
  ctx.fillStyle = '#94a3b8';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  ctx.font = `400 22px ${FONT_FAMILY}`;
  lines.forEach((line, i) => {
    ctx.fillText(line, cardX + logoPad, textStartY + i * lineH);
  });

  return canvasToBase64(canvas);
}

// ---------------------------------------------------------------------------
// 2. Signboard Mockup  (1200 x 800)
// ---------------------------------------------------------------------------
export async function generateSignboardMockup(
  logoBase64: string,
  companyName: string,
): Promise<string> {
  const W = 1200;
  const H = 800;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Dark storefront background
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, W, H);

  // Subtle ground gradient at bottom
  const groundGrad = ctx.createLinearGradient(0, H * 0.7, 0, H);
  groundGrad.addColorStop(0, 'rgba(0,0,0,0)');
  groundGrad.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = groundGrad;
  ctx.fillRect(0, H * 0.7, W, H * 0.3);

  // Sign board dimensions
  const signW = 720;
  const signH = 340;
  const signX = (W - signW) / 2;
  const signY = (H - signH) / 2 - 20;

  // Glow effect behind sign
  ctx.shadowColor = 'rgba(255, 255, 255, 0.25)';
  ctx.shadowBlur = 60;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(signX, signY, signW, signH, 12);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;

  // Sign content — logo centered
  const logoSize = 160;
  const logoCenterX = W / 2;
  const logoCenterY = signY + signH / 2 - 30;
  const logoX = logoCenterX - logoSize / 2;
  const logoY = logoCenterY - logoSize / 2;

  const img = await loadImage(toDataUrl(logoBase64));
  ctx.drawImage(img, logoX, logoY, logoSize, logoSize);

  // Company name below logo on sign
  const nameY = logoY + logoSize + 20;
  ctx.fillStyle = '#1e293b';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  let nameFontSize = 38;
  ctx.font = `bold ${nameFontSize}px ${FONT_FAMILY}`;
  while (ctx.measureText(companyName).width > signW - 60 && nameFontSize > 18) {
    nameFontSize -= 1;
    ctx.font = `bold ${nameFontSize}px ${FONT_FAMILY}`;
  }
  ctx.fillText(companyName, W / 2, nameY);

  return canvasToBase64(canvas);
}

// ---------------------------------------------------------------------------
// 3. Website Mockup  (1200 x 800)
// ---------------------------------------------------------------------------
export async function generateWebsiteMockup(
  logoBase64: string,
  companyName: string,
): Promise<string> {
  const W = 1200;
  const H = 800;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Outer browser chrome background
  ctx.fillStyle = '#e8e8e8';
  ctx.fillRect(0, 0, W, H);

  // Browser title bar
  const chromeH = 48;
  ctx.fillStyle = '#d1d5db';
  ctx.fillRect(0, 0, W, chromeH);

  // Traffic-light dots
  const dotY = chromeH / 2;
  const dotColors = ['#ef4444', '#f59e0b', '#22c55e'];
  dotColors.forEach((color, i) => {
    ctx.beginPath();
    ctx.arc(20 + i * 22, dotY, 7, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  });

  // URL bar
  const urlBarX = 110;
  const urlBarW = W - 200;
  const urlBarH = 26;
  const urlBarY = (chromeH - urlBarH) / 2;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(urlBarX, urlBarY, urlBarW, urlBarH, 4);
  ctx.fill();

  ctx.fillStyle = '#9ca3af';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `400 13px ${FONT_FAMILY}`;
  ctx.fillText('https://www.example.com', urlBarX + urlBarW / 2, chromeH / 2);

  // Page area
  const pageY = chromeH;
  const pageH = H - chromeH;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, pageY, W, pageH);

  // --- Header ---
  const headerH = 70;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, pageY, W, headerH);

  // Header bottom border
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, pageY + headerH);
  ctx.lineTo(W, pageY + headerH);
  ctx.stroke();

  // Logo in header (left)
  const headerLogoPad = 40;
  const headerLogoH = 40;
  const headerLogoW = 40;
  const headerLogoY = pageY + (headerH - headerLogoH) / 2;

  const img = await loadImage(toDataUrl(logoBase64));
  ctx.drawImage(img, headerLogoPad, headerLogoY, headerLogoW, headerLogoH);

  // Company name next to header logo
  const headerNameX = headerLogoPad + headerLogoW + 12;
  const headerNameY = pageY + headerH / 2;
  ctx.fillStyle = '#1e293b';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  let headerFontSize = 20;
  ctx.font = `bold ${headerFontSize}px ${FONT_FAMILY}`;
  while (ctx.measureText(companyName).width > 340 && headerFontSize > 12) {
    headerFontSize -= 1;
    ctx.font = `bold ${headerFontSize}px ${FONT_FAMILY}`;
  }
  ctx.fillText(companyName, headerNameX, headerNameY);

  // Navigation links — right side of header
  const navItems = ['HOME', 'SERVICE', 'ABOUT', 'CONTACT'];
  const navRightPad = 40;
  const navSpacing = 38;
  ctx.font = `600 13px ${FONT_FAMILY}`;
  ctx.fillStyle = '#64748b';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  let navX = W - navRightPad;
  [...navItems].reverse().forEach((label) => {
    ctx.fillText(label, navX, headerNameY);
    navX -= navSpacing + ctx.measureText(label).width;
  });

  // --- Hero section ---
  const heroY = pageY + headerH;
  const heroH = 320;
  const heroGrad = ctx.createLinearGradient(0, heroY, 0, heroY + heroH);
  heroGrad.addColorStop(0, '#eff6ff');
  heroGrad.addColorStop(1, '#e0f2fe');
  ctx.fillStyle = heroGrad;
  ctx.fillRect(0, heroY, W, heroH);

  // Hero heading placeholder
  ctx.fillStyle = '#1e293b';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.font = `bold 48px ${FONT_FAMILY}`;
  ctx.fillText('Your Tagline Goes Here', W / 2, heroY + 70);

  // Hero sub-text
  ctx.font = `400 20px ${FONT_FAMILY}`;
  ctx.fillStyle = '#64748b';
  ctx.fillText('Brief description of your service or product.', W / 2, heroY + 132);

  // CTA button
  const btnW = 180;
  const btnH = 48;
  const btnX = W / 2 - btnW / 2;
  const btnY = heroY + 200;
  ctx.fillStyle = '#3b82f6';
  ctx.beginPath();
  ctx.roundRect(btnX, btnY, btnW, btnH, 8);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'middle';
  ctx.font = `bold 18px ${FONT_FAMILY}`;
  ctx.fillText('Get Started', W / 2, btnY + btnH / 2);

  // --- Content blocks section ---
  const contentY = heroY + heroH;
  const contentH = pageH - headerH - heroH;
  ctx.fillStyle = '#f9fafb';
  ctx.fillRect(0, contentY, W, contentH);

  const blockCount = 3;
  const blockW = 280;
  const blockH = 120;
  const blockGap = (W - blockCount * blockW) / (blockCount + 1);
  const blockY = contentY + (contentH - blockH) / 2;

  for (let i = 0; i < blockCount; i++) {
    const bx = blockGap + i * (blockW + blockGap);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.07)';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.roundRect(bx, blockY, blockW, blockH, 8);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // Icon placeholder circle
    ctx.fillStyle = '#dbeafe';
    ctx.beginPath();
    ctx.arc(bx + 36, blockY + blockH / 2, 20, 0, Math.PI * 2);
    ctx.fill();

    // Text lines
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = `600 15px ${FONT_FAMILY}`;
    ctx.fillText('Feature Title', bx + 68, blockY + blockH / 2 - 14);
    ctx.font = `400 13px ${FONT_FAMILY}`;
    ctx.fillText('Short description text.', bx + 68, blockY + blockH / 2 + 12);
  }

  return canvasToBase64(canvas);
}

// ---------------------------------------------------------------------------
// Combined mockup  (2400 x 1600)
// ---------------------------------------------------------------------------
export async function generateCombinedMockup(
  logoBase64: string,
  companyName: string,
): Promise<string> {
  const W = 2400;
  const H = 1600;
  const HALF_W = W / 2;
  const HALF_H = H / 2;
  const LABEL_AREA_H = 48;
  const BORDER_COLOR = '#dee2e6';

  const [websiteBase64, businessCardBase64, signboardBase64] = await Promise.all([
    generateWebsiteMockup(logoBase64, companyName),
    generateBusinessCardMockup(logoBase64, companyName),
    generateSignboardMockup(logoBase64, companyName),
  ]);

  const [websiteImg, businessCardImg, signboardImg] = await Promise.all([
    loadImage(toDataUrl(websiteBase64)),
    loadImage(toDataUrl(businessCardBase64)),
    loadImage(toDataUrl(signboardBase64)),
  ]);

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = '#f8f9fa';
  ctx.fillRect(0, 0, W, H);

  // --- Top half: Website mockup (full width, 2400 x 800) ---
  const topContentH = HALF_H - LABEL_AREA_H;
  const wsScale = Math.min(W / websiteImg.width, topContentH / websiteImg.height);
  const wsW = websiteImg.width * wsScale;
  const wsH = websiteImg.height * wsScale;
  const wsX = (W - wsW) / 2;
  const wsY = (topContentH - wsH) / 2;
  ctx.drawImage(websiteImg, wsX, wsY, wsW, wsH);

  // Website label
  ctx.fillStyle = '#868e96';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `500 28px ${FONT_FAMILY}`;
  ctx.fillText('Webサイト', W / 2, topContentH + LABEL_AREA_H / 2);

  // --- Horizontal border ---
  ctx.strokeStyle = BORDER_COLOR;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, HALF_H);
  ctx.lineTo(W, HALF_H);
  ctx.stroke();

  // --- Vertical border (bottom half only) ---
  ctx.beginPath();
  ctx.moveTo(HALF_W, HALF_H);
  ctx.lineTo(HALF_W, H);
  ctx.stroke();

  // --- Bottom-left: Business card mockup (1200 x 800) ---
  const bottomContentH = HALF_H - LABEL_AREA_H;
  const bcScale = Math.min(HALF_W / businessCardImg.width, bottomContentH / businessCardImg.height);
  const bcW = businessCardImg.width * bcScale;
  const bcH = businessCardImg.height * bcScale;
  const bcX = (HALF_W - bcW) / 2;
  const bcY = HALF_H + (bottomContentH - bcH) / 2;
  ctx.drawImage(businessCardImg, bcX, bcY, bcW, bcH);

  // Business card label
  ctx.fillStyle = '#868e96';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `500 28px ${FONT_FAMILY}`;
  ctx.fillText('名刺', HALF_W / 2, HALF_H + bottomContentH + LABEL_AREA_H / 2);

  // --- Bottom-right: Signboard mockup (1200 x 800) ---
  const sbScale = Math.min(HALF_W / signboardImg.width, bottomContentH / signboardImg.height);
  const sbW = signboardImg.width * sbScale;
  const sbH = signboardImg.height * sbScale;
  const sbX = HALF_W + (HALF_W - sbW) / 2;
  const sbY = HALF_H + (bottomContentH - sbH) / 2;
  ctx.drawImage(signboardImg, sbX, sbY, sbW, sbH);

  // Signboard label
  ctx.fillStyle = '#868e96';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `500 28px ${FONT_FAMILY}`;
  ctx.fillText('看板', HALF_W + HALF_W / 2, HALF_H + bottomContentH + LABEL_AREA_H / 2);

  return canvasToBase64(canvas);
}

// ---------------------------------------------------------------------------
// Aggregate helper
// ---------------------------------------------------------------------------
export async function generateAllMockups(
  logoBase64: string,
  companyName: string,
): Promise<{ businessCard: string; signboard: string; website: string }> {
  const [businessCard, signboard, website] = await Promise.all([
    generateBusinessCardMockup(logoBase64, companyName),
    generateSignboardMockup(logoBase64, companyName),
    generateWebsiteMockup(logoBase64, companyName),
  ]);
  return { businessCard, signboard, website };
}
