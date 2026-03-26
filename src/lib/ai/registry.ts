import type { AIProvider } from './provider';
import { getSetting } from '../settings';

const providerCache = new Map<string, AIProvider>();

export async function getAIProvider(): Promise<AIProvider> {
  const providerName = getSetting('ai_provider') || import.meta.env.AI_PROVIDER || 'azure';
  const modelOverride = getSetting('ai_model') || undefined;
  const cacheKey = `${providerName}:${modelOverride || 'default'}`;

  const cached = providerCache.get(cacheKey);
  if (cached) return cached;

  let provider: AIProvider;

  switch (providerName) {
    case 'azure': {
      const { AzureAIProvider } = await import('./providers/azure');
      provider = new AzureAIProvider(modelOverride);
      break;
    }
    case 'openai': {
      const { OpenAIProvider } = await import('./providers/openai');
      provider = new OpenAIProvider(modelOverride);
      break;
    }
    case 'anthropic': {
      const { AnthropicProvider } = await import('./providers/anthropic');
      provider = new AnthropicProvider(modelOverride);
      break;
    }
    case 'ollama': {
      const { OllamaProvider } = await import('./providers/ollama');
      provider = new OllamaProvider(modelOverride);
      break;
    }
    case 'lmstudio': {
      const { LMStudioProvider } = await import('./providers/lmstudio');
      provider = new LMStudioProvider(modelOverride);
      break;
    }
    default:
      throw new Error(`Unknown AI provider: ${providerName}`);
  }

  providerCache.set(cacheKey, provider);
  return provider;
}

export function clearProviderCache(): void {
  providerCache.clear();
}
