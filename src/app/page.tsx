'use client';

import { useState } from 'react';
import PlaygroundForm from './components/PlaygroundForm';

export default function Home() {
  const [result, setResult] = useState('');

  return (
    <main className="container mx-auto p-4">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-primary-color mb-2">
          AI Language Playground
        </h1>
        <p className="text-lg text-gray-600">
          Explore the power of AI-generated text
        </p>
      </header>
      <div className="bg-white rounded-lg shadow-md p-6">
        <PlaygroundForm setResult={setResult} />
      </div>
      <footer className="mt-8 text-center text-sm text-gray-500">
        <p>© 2023 AI Language Playground. All rights reserved.</p>
      </footer>
    </main>
  );
}
