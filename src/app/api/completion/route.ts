import { NextResponse } from 'next/server'
import { ClientOptions, OpenAI } from 'openai'

export async function POST(request: Request) {
    const { baseUrl, apiKey, model, prompt, maxTokens, temperature } = await request.json()

    const configuration: ClientOptions = {
        apiKey: apiKey,
        baseURL: baseUrl,
    }
    const openai = new OpenAI(configuration)

    const stream = await openai.chat.completions.create({
        model: model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature: temperature,
        stream: true,
    })

    const encoder = new TextEncoder()

    return new NextResponse(
        new ReadableStream({
            async start(controller) {
                for await (const chunk of stream) {
                    if (chunk.choices[0].finish_reason != null) {
                        controller.close()
                        return
                    }
                    try {
                        const text = chunk.choices[0].delta.content
                        if (typeof text === 'string') {
                            controller.enqueue(encoder.encode(text))
                        }
                    } catch (error) {
                        console.error('Error parsing stream message', error)
                    }
                }
            },
        })
    )
}