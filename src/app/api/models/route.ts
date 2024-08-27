import { NextResponse } from 'next/server'
import { ClientOptions, OpenAI } from 'openai'

export async function POST(request: Request) {
    const { baseUrl, apiKey } = await request.json()

    console.log('baseUrl:', baseUrl)
    console.log('apiKey:', apiKey)

    const configuration: ClientOptions = {
        apiKey: apiKey,
        baseURL: baseUrl,
    }
    const openai = new OpenAI(configuration)

    try {
        const response = await openai.models.list()
        const models = response.data.map((model) => model.id)
        return NextResponse.json(models)
    } catch (error) {
        console.error('Error fetching models:', error)
        return NextResponse.json({ error: 'Failed to fetch models' }, { status: 500 })
    }
}