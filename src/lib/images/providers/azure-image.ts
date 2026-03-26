import { AzureOpenAI } from 'openai';
import type { ImageProvider, ImageGenerationResult } from '../provider';

export class AzureImageProvider implements ImageProvider {
  name = 'azure-image';
  model: string;
  private client: AzureOpenAI;

  constructor(modelOverride?: string) {
    const endpoint = import.meta.env.AZURE_ENDPOINT;
    const apiKey = import.meta.env.AZURE_API_KEY;
    const apiVersion = import.meta.env.AZURE_API_VERSION || '2024-12-01-preview';
    this.model = modelOverride || import.meta.env.AZURE_IMAGE_DEPLOYMENT || 'gpt-image-1';

    if (!endpoint || !apiKey) {
      throw new Error('AZURE_ENDPOINT and AZURE_API_KEY must be set for image generation');
    }

    this.client = new AzureOpenAI({
      endpoint,
      apiKey,
      apiVersion,
    });
  }

  async generateImage(prompt: string): Promise<ImageGenerationResult> {
    const response = await this.client.images.generate({
      model: this.model,
      prompt,
      n: 1,
      size: '1024x1024',
    });

    const item = response.data[0];
    if (!item) throw new Error('No image data in response');

    // Newer models (gpt-image-1.5+) return b64_json by default; older ones may return a URL
    const b64 = item.b64_json;
    if (!b64) {
      if (item.url) {
        const imgResponse = await fetch(item.url);
        const arrayBuf = await imgResponse.arrayBuffer();
        return { imageData: Buffer.from(arrayBuf), contentType: 'image/png' };
      }
      throw new Error('No image data or URL in response');
    }

    return {
      imageData: Buffer.from(b64, 'base64'),
      contentType: 'image/png',
    };
  }

  async listModels(): Promise<string[]> {
    return [];
  }
}
