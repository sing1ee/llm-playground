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
    const [isFullScreen, setIsFullScreen] = useState(false);

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

    const toggleFullScreen = () => {
        setIsFullScreen(!isFullScreen);
    };

    return (
        <div className={`relative ${isFullScreen ? "full-screen" : ""}`}>
            <ToastContainer />
            <button
                onClick={toggleFullScreen}
                className="absolute top-4 right-4 p-2 bg-secondary rounded-full hover:bg-accent transition-colors"
                aria-label={
                    isFullScreen ? "Exit full screen" : "Enter full screen"
                }
                title={isFullScreen ? "Exit full screen" : "Enter full screen"}
            >
                {isFullScreen ? (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-6 h-6"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 9V4.5M9 9H4.5M15 9H19.5M15 9V4.5M15 20.25V15M15 20.25H19.5M9 20.25H4.5M9 20.25V15"
                        />
                    </svg>
                ) : (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-6 h-6"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
                        />
                    </svg>
                )}
            </button>
            <div className="space-y-6 p-8">
                <h1 className="text-3xl font-bold text-primary">
                    AI Playground
                </h1>
                <div className="mb-4">
                    <textarea
                        placeholder="Enter your prompt here..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="textarea w-full h-40 border-primary focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                </div>
                <div className="mb-4">
                    <button
                        onClick={handleGenerate}
                        className="btn bg-primary hover:bg-accent text-white w-full transition-colors duration-300"
                        disabled={isGenerating}
                    >
                        {isGenerating ? "Generating..." : "Generate"}
                    </button>
                </div>
                {tokenInfo && (
                    <div className="mb-4 p-4 bg-secondary bg-opacity-10 rounded-lg border border-secondary">
                        <h3 className="font-bold mb-2 text-secondary">
                            Token Consumption:
                        </h3>
                        <p>Input Tokens: {tokenInfo.inputTokens}</p>
                        <p>Output Tokens: {tokenInfo.outputTokens}</p>
                        <p>Total Cost: ${tokenInfo.totalCost.toFixed(4)}</p>
                    </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-1 border border-primary rounded-lg p-4 bg-white shadow-sm">
                        <h3 className="font-bold mb-2 text-primary">History</h3>
                        <div>
                            {history.map((entry, index) => (
                                <div
                                    key={index}
                                    onClick={() => handleHistoryClick(entry)}
                                    className="history-item mb-2 cursor-pointer hover:bg-primary hover:bg-opacity-10 p-2 rounded transition-colors duration-300"
                                >
                                    <p className="text-sm text-gray-600">
                                        {new Date(entry.time).toLocaleString()}
                                    </p>
                                    <p className="truncate">{entry.prompt}</p>
                                    <p className="text-xs text-accent">
                                        Cost: $
                                        {entry.tokenInfo?.totalCost?.toFixed(4)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="md:col-span-3 border border-primary rounded-lg p-4 bg-white shadow-sm">
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
                                                <button className="absolute top-2 right-2 bg-secondary text-white p-1 rounded text-sm hover:bg-accent transition-colors duration-300">
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
        </div>
    );
}
