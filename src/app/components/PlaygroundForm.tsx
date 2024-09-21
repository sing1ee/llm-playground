import { useState, useEffect } from "react";
import Select from "react-select";
import ReactMarkdown from "react-markdown";
import { CopyToClipboard } from "react-copy-to-clipboard";
import remarkGfm from "remark-gfm";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./MarkdownStyles.css";
import Collapsible from "react-collapsible";

interface PlaygroundFormProps {
    setResult: (result: string) => void;
}

export default function PlaygroundForm({ setResult }: PlaygroundFormProps) {
    const [baseUrl, setBaseUrl] = useState("");
    const [apiKey, setApiKey] = useState("");
    const [temperature, setTemperature] = useState(0.7);
    const [maxTokens, setMaxTokens] = useState(4000);
    const [models, setModels] = useState<string[]>([]);
    const [selectedModel, setSelectedModel] = useState("");
    const [prompt, setPrompt] = useState("");
    const [result, setLocalResult] = useState("");
    const [history, setHistory] = useState<
        {
            time: string;
            prompt: string;
            result: string;
            baseUrl: string;
            apiKey: string;
            temperature: number;
            maxTokens: number;
            selectedModel: string;
        }[]
    >([]);
    const [isLoadingModels, setIsLoadingModels] = useState(false);

    useEffect(() => {
        const storedHistory = localStorage.getItem("playgroundHistory");
        if (storedHistory) {
            setHistory(JSON.parse(storedHistory));
        }
    }, []);

    const loadModels = async () => {
        setIsLoadingModels(true);
        const response = await fetch("/api/models", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ baseUrl, apiKey }),
        });
        const data = await response.json();
        setModels(data);
        setSelectedModel("");
        setIsLoadingModels(false);
        toast.success("Models loaded successfully!");
    };

    const saveToHistory = (prompt: string, result: string) => {
        const newEntry = {
            time: new Date().toISOString(),
            prompt,
            result,
            baseUrl,
            apiKey,
            temperature,
            maxTokens,
            selectedModel,
        };
        const updatedHistory = [newEntry, ...history.slice(0, 50)];
        setHistory(updatedHistory);
        localStorage.setItem(
            "playgroundHistory",
            JSON.stringify(updatedHistory)
        );
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
            setLocalResult(result);
        }
        saveToHistory(prompt, result);
        setResult(result);
    };

    const handleHistoryClick = (entry: {
        prompt: string;
        result: string;
        baseUrl: string;
        apiKey: string;
        temperature: number;
        maxTokens: number;
        selectedModel: string;
    }) => {
        setPrompt(entry.prompt);
        setLocalResult(entry.result);
        setBaseUrl(entry.baseUrl);
        setApiKey(entry.apiKey);
        setTemperature(entry.temperature);
        setMaxTokens(entry.maxTokens);
        setSelectedModel(entry.selectedModel);
    };

    return (
        <div className="space-y-6">
            <ToastContainer />
            <Collapsible
                trigger={
                    <span className="settings-trigger">
                        Settings <span className="arrow">▼</span>
                    </span>
                }
                triggerClassName="settings-trigger"
                triggerOpenedClassName="settings-trigger open"
            >
                <div className="collapsible-content">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            type="text"
                            placeholder="Base URL"
                            value={baseUrl}
                            onChange={(e) => setBaseUrl(e.target.value)}
                            className="input"
                        />
                        <input
                            type="password"
                            placeholder="API Key"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className="input"
                        />
                        <input
                            type="number"
                            placeholder="Temperature"
                            value={temperature}
                            onChange={(e) =>
                                setTemperature(Number(e.target.value))
                            }
                            className="input"
                            step="0.1"
                            min="0"
                            max="1"
                        />
                        <input
                            type="number"
                            placeholder="Max Tokens"
                            value={maxTokens}
                            onChange={(e) =>
                                setMaxTokens(Number(e.target.value))
                            }
                            className="input"
                            min="1"
                        />
                    </div>
                    <button
                        onClick={loadModels}
                        className="btn btn-secondary mt-4 w-full"
                        disabled={isLoadingModels}
                    >
                        {isLoadingModels ? "Loading Models..." : "Load Models"}
                    </button>
                </div>
            </Collapsible>
            <div className="mb-4">
                <Select
                    options={models.map((model) => ({
                        value: model,
                        label: model,
                    }))}
                    value={{ value: selectedModel, label: selectedModel }}
                    onChange={(selectedOption) =>
                        setSelectedModel(selectedOption?.value || "")
                    }
                    isClearable
                    placeholder="Select a model..."
                    className="select"
                />
            </div>
            <div className="mb-4">
                <textarea
                    placeholder="Enter your prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="textarea w-full h-40"
                />
            </div>
            <div className="mb-4">
                <button onClick={handlePlay} className="btn btn-primary w-full">
                    Generate
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-1 border rounded-lg p-4">
                    <h3 className="font-bold mb-2">History</h3>
                    {history.map((entry, index) => (
                        <div
                            key={index}
                            onClick={() => handleHistoryClick(entry)}
                            className="history-item"
                        >
                            <p className="text-sm text-gray-600">
                                {new Date(entry.time).toLocaleString()}
                            </p>
                            <p className="truncate">{entry.prompt}</p>
                        </div>
                    ))}
                </div>
                <div className="md:col-span-3 border rounded-lg p-4">
                    <ReactMarkdown
                        className="markdown-body"
                        remarkPlugins={[remarkGfm]}
                        components={{
                            code({ node, className, children, ...props }) {
                                const text = String(children).replace(
                                    /\n$/,
                                    ""
                                );
                                const hasLanguageIdentifier =
                                    className?.includes("language-");
                                return hasLanguageIdentifier ? (
                                    <div className="relative">
                                        <pre className={className}>
                                            <code
                                                className={className}
                                                {...props}
                                            >
                                                {children}
                                            </code>
                                        </pre>
                                        <CopyToClipboard
                                            text={text}
                                            onCopy={() =>
                                                toast.success(
                                                    "Code copied successfully!"
                                                )
                                            }
                                        >
                                            <button className="absolute top-2 right-2 bg-gray-200 p-1 rounded text-sm">
                                                Copy
                                            </button>
                                        </CopyToClipboard>
                                    </div>
                                ) : (
                                    <code className={className} {...props}>
                                        {children}
                                    </code>
                                );
                            },
                        }}
                    >
                        {result}
                    </ReactMarkdown>
                </div>
            </div>
        </div>
    );
}
