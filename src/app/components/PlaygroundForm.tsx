import { useState } from "react";
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
    const [baseUrl, setBaseUrl] = useState("https://openrouter.ai/api/v1");
    const [apiKey, setApiKey] = useState("");
    const [temperature, setTemperature] = useState(0.7);
    const [maxTokens, setMaxTokens] = useState(10000);
    const [models, setModels] = useState<string[]>([]);
    const [selectedModel, setSelectedModel] = useState("");
    const [prompt, setPrompt] = useState("");
    const [result, setLocalResult] = useState("");

    const loadModels = async () => {
        const response = await fetch("/api/models", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ baseUrl, apiKey }),
        });
        const data = await response.json();
        setModels(data);
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
            console.log(result);
            setLocalResult(result);
        }
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
                <div className="mt-4">
                    <Select
                        value={{ value: selectedModel, label: selectedModel }}
                        onChange={(option) =>
                            setSelectedModel(option?.value || "")
                        }
                        options={models.map((model) => ({
                            value: model,
                            label: model,
                        }))}
                        isClearable
                        placeholder="Select a model"
                        className="w-full"
                        instanceId="model-select"
                    />
                </div>
            </Collapsible>
            <div>
                <textarea
                    placeholder="Enter your prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="border p-2 w-full h-32"
                />
            </div>
            <div className="flex space-x-4">
                <button
                    onClick={handlePlay}
                    className="bg-green-500 text-white p-2 flex-1"
                >
                    Play
                </button>
            </div>
            <div className="border p-2 w-full h-auto min-h-32 overflow-x-auto">
                <ReactMarkdown
                    className="markdown-body"
                    remarkPlugins={[remarkGfm]}
                    components={{
                        code({ node, inline, className, children, ...props }) {
                            const text = String(children).replace(/\n$/, "");
                            const hasLanguageIdentifier =
                                className?.includes("language-");
                            return !inline && hasLanguageIdentifier ? (
                                <div className="relative">
                                    <pre className={className}>
                                        <code className={className} {...props}>
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
    );
}
