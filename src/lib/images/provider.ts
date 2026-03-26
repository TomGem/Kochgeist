export interface ImageGenerationResult {
  imageData: Buffer;
  contentType: string;
}

export interface ImageProvider {
  name: string;
  model: string;
  generateImage(prompt: string): Promise<ImageGenerationResult>;
  listModels(): Promise<string[]>;
}
