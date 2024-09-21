import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { CopyToClipboard } from "react-copy-to-clipboard";
import remarkGfm from "remark-gfm";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./MarkdownStyles.css";

interface PlaygroundFormProps {
    setResult: (result: string) => void;
}

interface TokenInfo {
    inputTokens: number;
    outputTokens: number;
    totalCost: number;
}

export default function PlaygroundForm({ setResult }: PlaygroundFormProps) {
    const [prompt, setPrompt] = useState("");
    const [result, setLocalResult] = useState("");
    const [history, setHistory] = useState<
        { time: string; prompt: string; result: string; tokenInfo: TokenInfo }[]
    >([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);

    useEffect(() => {
        const storedHistory = localStorage.getItem("playgroundHistory");
        if (storedHistory) {
            setHistory(JSON.parse(storedHistory));
        }
    }, []);

    const saveToHistory = (
        prompt: string,
        result: string,
        tokenInfo: TokenInfo
    ) => {
        const newEntry = {
            time: new Date().toISOString(),
            prompt,
            result,
            tokenInfo,
        };
        const updatedHistory = [newEntry, ...history.slice(0, 99)];
        setHistory(updatedHistory);
        localStorage.setItem(
            "playgroundHistory",
            JSON.stringify(updatedHistory)
        );
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        setTokenInfo(null);
        try {
            const response = await fetch("/api/completion", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt }),
            });

            const reader = response.body?.getReader();
            let result = "";

            while (true) {
                const { done, value } = await reader!.read();
                if (done) break;
                result += new TextDecoder().decode(value);
                setLocalResult(result);
            }

            // Assume the last line of the response contains the token info
            const lines = result.split("\n");
            const tokenInfoLine = lines.pop();
            const tokenInfo = JSON.parse(tokenInfoLine || "{}");
            setTokenInfo(tokenInfo);

            const actualResult = lines.join("\n");
            saveToHistory(prompt, actualResult, tokenInfo);
            setLocalResult(actualResult);
            setResult(actualResult);
        } catch (error) {
            console.error("Error generating response:", error);
            toast.error(
                "An error occurred while generating the response. Please try again."
            );
        } finally {
            setIsGenerating(false);
        }
    };

    const handleHistoryClick = (entry: {
        prompt: string;
        result: string;
        tokenInfo: TokenInfo;
    }) => {
        setPrompt(entry.prompt);
        setLocalResult(entry.result);
        setTokenInfo(entry.tokenInfo);
    };

    return (
        <div className="space-y-6">
            <ToastContainer />
            <div className="mb-4">
                <textarea
                    placeholder="Enter your prompt here..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="textarea w-full h-40"
                />
            </div>
            <div className="mb-4">
                <button
                    onClick={handleGenerate}
                    className="btn btn-primary w-full"
                    disabled={isGenerating}
                >
                    {isGenerating ? "Generating..." : "Generate"}
                </button>
            </div>
            {tokenInfo && (
                <div className="mb-4 p-4 bg-gray-100 rounded-lg">
                    <h3 className="font-bold mb-2">Token Consumption:</h3>
                    <p>Input Tokens: {tokenInfo.inputTokens}</p>
                    <p>Output Tokens: {tokenInfo.outputTokens}</p>
                    <p>Total Cost: ${tokenInfo.totalCost.toFixed(4)}</p>
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-1 border rounded-lg p-4 h-96 overflow-y-auto">
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
                            <p className="text-xs text-gray-500">
                                Cost: ${entry.tokenInfo?.totalCost?.toFixed(4)}
                            </p>
                        </div>
                    ))}
                </div>
                <div className="md:col-span-3 border rounded-lg p-4 h-96 overflow-y-auto">
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
