import { useState, useEffect } from "react";
import Select from "react-select";
import ReactMarkdown from "react-markdown";
import { CopyToClipboard } from "react-copy-to-clipboard";
import remarkGfm from "remark-gfm";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./MarkdownStyles.css";
import Collapsible from "react-collapsible";
import "./PlaygroundForm.css";

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
    const [filter, setFilter] = useState("");

    useEffect(() => {
        const storedHistory = localStorage.getItem("playgroundHistory");
        if (storedHistory) {
            setHistory(JSON.parse(storedHistory));
        }
    }, []);

    const loadModels = async () => {
        setIsLoadingModels(true); // Set loading state
        const response = await fetch("/api/models", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ baseUrl, apiKey }),
        });
        const data = await response.json();
        setModels(data);
        setSelectedModel(""); // Reset selected model to trigger re-render
        setIsLoadingModels(false); // Reset loading state
        toast.success("Models loaded successfully!", {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
        });
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
        console.log(newEntry);
        const updatedHistory = [newEntry, ...history.slice(0, 99)];
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
        console.log(entry);
        setPrompt(entry.prompt);
        setLocalResult(entry.result);
        setBaseUrl(entry.baseUrl);
        setApiKey(entry.apiKey);
        setTemperature(entry.temperature);
        setMaxTokens(entry.maxTokens);
        setSelectedModel(entry.selectedModel);
    };

    return (
        <div className="space-y-4">
            <ToastContainer />
            <Collapsible
                trigger={
                    <span>
                        Settings <span className="arrow">▼</span>
                    </span>
                }
                triggerClassName="settings-trigger"
                triggerOpenedClassName="settings-trigger open"
            >
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
                <div className="flex space-x-4 mt-4">
                    <button
                        onClick={loadModels}
                        className="bg-blue-500 text-white p-2 flex-1"
                    >
                        Load Models
                    </button>
                </div>
            </Collapsible>
            <div className="flex mt-4">
                <div className="w-full p-2">
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
                        placeholder="Filter models..."
                        className="mb-2"
                    />
                </div>
            </div>
            <div className="flex mt-4">
                <div className="w-full">
                    <textarea
                        placeholder="Enter your prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="border p-2 w-full h-72"
                    />
                </div>
            </div>
            <div className="flex space-x-4">
                <button
                    onClick={handlePlay}
                    className="bg-green-500 text-white p-2 flex-1"
                >
                    Play
                </button>
            </div>
            <div className="flex">
                <div className="w-1/5 border p-2 overflow-y-auto">
                    {history.map((entry, index) => (
                        <div
                            key={index}
                            onClick={() => handleHistoryClick(entry)}
                            className="cursor-pointer hover:bg-gray-100"
                        >
                            <p>{new Date(entry.time).toLocaleString()}</p>
                        </div>
                    ))}
                </div>
                <div className="w-4/5 border p-2 h-auto min-h-32 overflow-x-auto">
                    <ReactMarkdown
                        className="markdown-body"
                        remarkPlugins={[remarkGfm]}
                        components={{
                            code({
                                node,
                                inline,
                                className,
                                children,
                                ...props
                            }) {
                                const text = String(children).replace(
                                    /\n$/,
                                    ""
                                );
                                const hasLanguageIdentifier =
                                    className?.includes("language-");
                                return !inline && hasLanguageIdentifier ? (
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
                                                    "Code copied successfully!",
                                                    {
                                                        position: "top-right",
                                                        autoClose: 3000,
                                                        hideProgressBar: false,
                                                        closeOnClick: true,
                                                        pauseOnHover: true,
                                                        draggable: true,
                                                        progress: undefined,
                                                    }
                                                )
                                            }
                                        >
                                            <button className="absolute top-2 right-2 bg-gray-200 p-1 rounded">
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
