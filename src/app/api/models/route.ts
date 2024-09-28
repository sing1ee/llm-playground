import { NextResponse } from 'next/server';
import { ClientOptions, OpenAI } from 'openai';

export async function POST(request: Request) {
  let { baseUrl, apiKey } = await request.json();
  if (!baseUrl) baseUrl = 'https://api.siliconflow.cn/v1';
  if (!apiKey) apiKey = 'sk-xapavxiazxgkjhhmqgqyoeyskdfmrmosqqzknmhixcgdqpli';
  const configuration: ClientOptions = {
    apiKey: apiKey,
    baseURL: baseUrl,
  };
  const openai = new OpenAI(configuration);

  try {
    const response = await openai.models.list();
    const models = response.data.map((model) => model.id);
    return NextResponse.json(models);
  } catch (error) {
    console.error('Error fetching models:', error);
    return NextResponse.json(
      { error: 'Failed to fetch models' },
      { status: 500 },
    );
  }
}
