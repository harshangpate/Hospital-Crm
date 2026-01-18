import QRCode from 'qrcode';

/**
 * Generate QR code as data URL for sample barcode
 */
export async function generateSampleBarcode(sampleId: string): Promise<string> {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(sampleId, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating barcode:', error);
    throw error;
  }
}

/**
 * Generate QR code as buffer for PDF embedding
 */
export async function generateSampleBarcodeBuffer(sampleId: string): Promise<Buffer> {
  try {
    const buffer = await QRCode.toBuffer(sampleId, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
    return buffer;
  } catch (error) {
    console.error('Error generating barcode buffer:', error);
    throw error;
  }
}

/**
 * Generate multiple sample barcodes
 */
export async function generateBatchBarcodes(sampleIds: string[]): Promise<{ sampleId: string; barcode: string }[]> {
  try {
    const barcodes = await Promise.all(
      sampleIds.map(async (sampleId) => ({
        sampleId,
        barcode: await generateSampleBarcode(sampleId),
      }))
    );
    return barcodes;
  } catch (error) {
    console.error('Error generating batch barcodes:', error);
    throw error;
  }
}
