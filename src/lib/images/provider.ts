export interface ImageGenerationResult {
  imageData: Buffer;
  contentType: string;
}

export interface ImageProvider {
  name: string;
  generateImage(prompt: string): Promise<ImageGenerationResult>;
}
