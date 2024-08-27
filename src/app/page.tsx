"use client";

import { useState } from "react";
import PlaygroundForm from "./components/PlaygroundForm";
import ResultCard from "./components/ResultCard";

export default function Home() {
    const [result, setResult] = useState("");

    return (
        <main className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">LLM Playground</h1>
            <PlaygroundForm setResult={setResult} />
            {result && <ResultCard result={result} />}
        </main>
    );
}
