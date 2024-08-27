import { useState } from "react";
import Select from "react-select";

interface PlaygroundFormProps {
    setResult: (result: string) => void;
}

export default function PlaygroundForm({ setResult }: PlaygroundFormProps) {
    const [baseUrl, setBaseUrl] = useState("");
    const [apiKey, setApiKey] = useState("");
    const [temperature, setTemperature] = useState(0.7);
    const [maxTokens, setMaxTokens] = useState(100);
    const [models, setModels] = useState<string[]>([]);
    const [selectedModel, setSelectedModel] = useState("");
    const [prompt, setPrompt] = useState("");

    const loadModels = async () => {
        const response = await fetch("/api/models", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ baseUrl, apiKey }),
        });
        const data = await response.json();
        setModels(data);
    };

    const handlePlay = async () => {
        const response = await fetch("/api/completion", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                baseUrl,
                apiKey,
                model: selectedModel,
                prompt,
                maxTokens,
                temperature,
            }),
        });

        const reader = response.body?.getReader();
        let result = "";

        while (true) {
            const { done, value } = await reader!.read();
            if (done) break;
            result += new TextDecoder().decode(value);
            setResult(result);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex space-x-4">
                <input
                    type="text"
                    placeholder="Base URL"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    className="border p-2 flex-1"
                />
                <input
                    type="password"
                    placeholder="API Key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="border p-2 flex-1"
                />
                <input
                    type="number"
                    placeholder="Temperature"
                    value={temperature}
                    onChange={(e) => setTemperature(Number(e.target.value))}
                    className="border p-2 w-24"
                />
                <input
                    type="number"
                    placeholder="Max Tokens"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(Number(e.target.value))}
                    className="border p-2 w-24"
                />
            </div>
            <div>
                <button
                    onClick={loadModels}
                    className="bg-blue-500 text-white p-2"
                >
                    Load Models
                </button>
            </div>
            <div>
                <Select
                    value={{ value: selectedModel, label: selectedModel }}
                    onChange={(option) => setSelectedModel(option?.value || "")}
                    options={models.map((model) => ({
                        value: model,
                        label: model,
                    }))}
                    isClearable
                    placeholder="Select a model"
                    className="w-full"
                />
            </div>
            <div>
                <textarea
                    placeholder="Enter your prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="border p-2 w-full h-32"
                />
            </div>
            <div>
                <button
                    onClick={handlePlay}
                    className="bg-green-500 text-white p-2"
                >
                    Play
                </button>
            </div>
        </div>
    );
}
