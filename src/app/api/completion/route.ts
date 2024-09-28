import { NextResponse } from 'next/server';
import { ClientOptions, OpenAI } from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions.mjs';

// Cost per 1000 tokens (you may need to adjust these values based on the actual pricing)
const INPUT_COST_PER_1K = 0.0015;
const OUTPUT_COST_PER_1K = 0.002;

export async function POST(request: Request) {
  let { baseUrl, apiKey, model, prompt, systemPrompt, maxTokens, temperature } =
    await request.json();
  if (!baseUrl) baseUrl = 'https://api.siliconflow.cn/v1';
  if (!model) model = 'Qwen/Qwen2-7B-Instruct';

  if (!apiKey) {
    return NextResponse.json({ error: 'API key is required' }, { status: 400 });
  }

  const configuration: ClientOptions = {
    apiKey: apiKey,
    baseURL: baseUrl,
  };
  const openai = new OpenAI(configuration);

  const messages: ChatCompletionMessageParam[] = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });
  const stream = await openai.chat.completions.create({
    model: model,
    messages: messages,
    max_tokens: maxTokens,
    temperature: temperature,
    stream: true,
  });

  const encoder = new TextEncoder();
  let totalOutputTokens = 0;

  const response = new NextResponse(
    new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (chunk.choices[0].finish_reason != null) {
            // Calculate token usage and cost
            const inputTokens = chunk.usage?.prompt_tokens || 0;
            const outputTokens =
              chunk.usage?.completion_tokens || totalOutputTokens;
            const totalTokens = inputTokens + outputTokens;
            const inputCost = (inputTokens / 1000) * INPUT_COST_PER_1K;
            const outputCost = (outputTokens / 1000) * OUTPUT_COST_PER_1K;
            const totalCost = inputCost + outputCost;

            const tokenInfo = JSON.stringify({
              inputTokens,
              outputTokens,
              totalTokens,
              totalCost,
            });

            controller.enqueue(encoder.encode(`\n${tokenInfo}`));
            controller.close();
            return;
          }
          try {
            const text = chunk.choices[0].delta.content;
            if (typeof text === 'string') {
              controller.enqueue(encoder.encode(text));
              // More accurate token estimation
              totalOutputTokens += text.trim().split(/\s+/).length;
            }
          } catch (error) {
            console.error('Error parsing stream message', error);
          }
        }
      },
    }),
  );

  response.headers.set('Content-Type', 'text/plain; charset=utf-8');
  return response;
}
