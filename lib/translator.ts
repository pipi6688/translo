import { streamText, generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createDeepSeek } from '@ai-sdk/deepseek';
import type { AIProviderType, AIProviderConfig } from './storage';
import { renderPrompt } from './storage';

function createModel(provider: AIProviderType, config: AIProviderConfig) {
  const options = {
    apiKey: config.apiKey,
    ...(config.baseURL ? { baseURL: config.baseURL } : {}),
  };

  switch (provider) {
    case 'openai':
      return createOpenAI(options)(config.model);
    case 'anthropic':
      return createAnthropic(options)(config.model);
    case 'google':
      return createGoogleGenerativeAI(options)(config.model);
    case 'deepseek':
      return createDeepSeek(options)(config.model);
  }
}

export async function* translateStream(
  text: string,
  provider: AIProviderType,
  config: AIProviderConfig,
  targetLanguage: string,
): AsyncGenerator<string> {
  const model = createModel(provider, config);
  const userPrompt = renderPrompt(config.prompt, { text, from: 'en', to: targetLanguage });

  const { textStream } = streamText({
    model,
    system: config.systemPrompt,
    prompt: userPrompt,
    temperature: config.temperature,
  });

  for await (const chunk of textStream) {
    yield chunk;
  }
}

export async function testTranslate(
  provider: AIProviderType,
  config: AIProviderConfig,
  targetLanguage: string,
): Promise<string> {
  const model = createModel(provider, config);
  const userPrompt = renderPrompt(config.prompt, { text: 'Hello, world!', from: 'en', to: targetLanguage });

  const { text: result } = await generateText({
    model,
    system: config.systemPrompt,
    prompt: userPrompt,
    temperature: config.temperature,
  });

  return result;
}
