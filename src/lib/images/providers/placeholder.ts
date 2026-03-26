import type { ImageProvider, ImageGenerationResult } from '../provider';

export class PlaceholderImageProvider implements ImageProvider {
  name = 'placeholder';
  model = 'placeholder';

  async generateImage(_prompt: string): Promise<ImageGenerationResult> {
    // Return a 1x1 transparent PNG as fallback
    const pixel = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64',
    );
    return { imageData: pixel, contentType: 'image/png' };
  }

  async listModels(): Promise<string[]> {
    return ['placeholder'];
  }
}
