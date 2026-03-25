import type { AIProvider } from './provider';

let cachedProvider: AIProvider | null = null;

export async function getAIProvider(): Promise<AIProvider> {
  if (cachedProvider) return cachedProvider;

  const providerName = import.meta.env.AI_PROVIDER || 'azure';

  switch (providerName) {
    case 'azure': {
      const { AzureAIProvider } = await import('./providers/azure');
      cachedProvider = new AzureAIProvider();
      break;
    }
    case 'openai': {
      const { OpenAIProvider } = await import('./providers/openai');
      cachedProvider = new OpenAIProvider();
      break;
    }
    case 'anthropic': {
      const { AnthropicProvider } = await import('./providers/anthropic');
      cachedProvider = new AnthropicProvider();
      break;
    }
    case 'ollama': {
      const { OllamaProvider } = await import('./providers/ollama');
      cachedProvider = new OllamaProvider();
      break;
    }
    case 'lmstudio': {
      const { LMStudioProvider } = await import('./providers/lmstudio');
      cachedProvider = new LMStudioProvider();
      break;
    }
    default:
      throw new Error(`Unknown AI provider: ${providerName}`);
  }

  return cachedProvider!;
}
