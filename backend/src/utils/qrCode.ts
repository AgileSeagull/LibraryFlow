import { randomBytes } from 'crypto';

export const generateQRCode = (): string => {
  // Generate a unique QR code string
  const randomString = randomBytes(16).toString('hex');
  const timestamp = Date.now().toString(36);
  return `LF-${timestamp}-${randomString}`.toUpperCase();
};

export const validateQRCode = (qrCode: string): boolean => {
  // Validate QR code format: LF-{timestamp}-{randomString}
  const qrCodePattern = /^LF-[a-z0-9]+-[a-f0-9]{32}$/i;
  return qrCodePattern.test(qrCode);
};
