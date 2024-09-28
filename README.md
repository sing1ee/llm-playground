# AI Language Playground

AI Language Playground is an interactive web application that allows users to explore the capabilities of AI-generated text. Built with Next.js and React, this playground provides a user-friendly interface for interacting with language models, managing API settings, and tracking token usage.

## Features

- Interactive text generation using AI models
- Customizable API settings (API Key, Base URL, Model selection)
- System prompt support
- Token usage tracking and cost estimation
- History of generated content
- Markdown rendering with syntax highlighting
- Code copying and HTML/SVG rendering
- Responsive design with full-screen mode

## Technologies Used

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- OpenAI API (customizable to other providers)
- React Markdown
- React Toastify
- Radix UI components

## Setup and Installation

1. Clone the repository:

   ```
   git clone https://github.com/your-username/ai-language-playground.git
   cd ai-language-playground
   ```

2. Install dependencies:

   ```
   pnpm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory and add your API key:

   ```
   OPENAI_API_KEY=your_api_key_here
   ```

4. Run the development server:

   ```
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Usage

1. Enter your prompt in the text area.
2. (Optional) Adjust API settings by clicking the gear icon.
3. Click "Generate" to create AI-generated text based on your prompt.
4. View the generated text, token usage, and estimated cost.
5. Explore the history of your generated content.
6. Use the full-screen mode for a more immersive experience.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
