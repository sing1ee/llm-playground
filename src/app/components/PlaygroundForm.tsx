import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { CopyToClipboard } from "react-copy-to-clipboard";
import remarkGfm from "remark-gfm";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./MarkdownStyles.css";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";
import {
    SandpackLayout,
    SandpackProvider,
    SandpackPreview,
    SandpackCodeEditor,
} from "@codesandbox/sandpack-react";
import { cyberpunk } from "@codesandbox/sandpack-themes";
import FullScreenButton from "./FullScreenButton";
import {
    PlaygroundFormProps,
    TokenInfo,
    Files,
    Settings,
    Role,
} from "../lib/types";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";

export default function PlaygroundForm({ setResult }: PlaygroundFormProps) {
    const [prompt, setPrompt] = useState("");
    const [result, setLocalResult] = useState("");
    const [history, setHistory] = useState<
        { time: string; prompt: string; result: string; tokenInfo: TokenInfo }[]
    >([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [popoverContent, setPopoverContent] = useState("");
    const [settings, setSettings] = useState<Settings>({
        apiKey: "",
        baseUrl: "",
        model: "",
        systemPrompt: "",
        useSystemPrompt: false,
        systemPromptType: "",
    });
    const [roles, setRoles] = useState<Role[]>([]);
    const [newRoleName, setNewRoleName] = useState("");
    const [newRoleSystemPrompt, setNewRoleSystemPrompt] = useState("");
    const [runFiles, setRunFiles] = useState({});
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleDialogOpen = () => {
        setIsDialogOpen(true);
        extractCodeBlocks();
    };

    const handleDialogClose = () => {
        setIsDialogOpen(false);
    };

    useEffect(() => {
        const storedHistory = localStorage.getItem("playgroundHistory");
        if (storedHistory) {
            setHistory(JSON.parse(storedHistory));
        }

        const storedSettings = localStorage.getItem("playgroundSettings");
        if (storedSettings) {
            setSettings(JSON.parse(storedSettings));
        }

        const storedRoles = localStorage.getItem("playgroundRoles");
        if (storedRoles) {
            setRoles(JSON.parse(storedRoles));
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
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    baseUrl: settings.baseUrl,
                    apiKey: settings.apiKey,
                    model: settings.model,
                    prompt,
                    systemPrompt: settings.useSystemPrompt
                        ? settings.systemPrompt
                        : undefined,
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

    const extractCodeBlocks = () => {
        const files: Files = {};
        const cssCodeBlocks = result.match(/```css([\s\S]*?)```/g);
        const jsxCodeBlocks = result.match(/```jsx([\s\S]*?)```/g);
        if (cssCodeBlocks) {
            files["/styles.css"] = cssCodeBlocks
                .map((block) => block.replace(/```css|```/g, ""))
                .join("\n");
        }

        if (jsxCodeBlocks) {
            files["/App.js"] = jsxCodeBlocks
                .map((block) => block.replace(/```jsx|```/g, ""))
                .join("\n");
        }
        setRunFiles(files);
    };

    useEffect(() => {
        console.log(runFiles);
    }, [runFiles]);

    const handleRenderContent = (content: string, isSvg: boolean) => {
        if (isSvg) {
            const htmlContent = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>SVG Render</title>
                    <style>
                        body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
                        svg { max-width: 100%; max-height: 100vh; }
                    </style>
                </head>
                <body>
                    ${content}
                </body>
                </html>
            `;
            setPopoverContent(htmlContent);
        } else {
            setPopoverContent(content);
        }
    };

    const handleSettingsChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value, type } = e.target;
        if (type === "checkbox") {
            const checked = (e.target as HTMLInputElement).checked;
            setSettings((prev) => ({ ...prev, [name]: checked }));
        } else {
            setSettings((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleSystemPromptTypeChange = (value: string) => {
        let systemPrompt = "";
        let use: boolean = false;
        if (value) {
            const selectedRole = roles.find((role) => role.name === value);
            if (selectedRole) {
                systemPrompt = selectedRole.systemPrompt;
                use = true;
            }
        }
        setSettings((prev) => ({
            ...prev,
            systemPromptType: value,
            systemPrompt,
            useSystemPrompt: use,
        }));
        localStorage.setItem(
            "playgroundSettings",
            JSON.stringify({
                ...settings,
                systemPromptType: value,
                systemPrompt,
                useSystemPrompt: use,
            })
        );
    };

    const saveSettings = () => {
        localStorage.setItem("playgroundSettings", JSON.stringify(settings));
        toast.success("Settings saved successfully!");
    };

    const handleAddRole = () => {
        if (newRoleName && newRoleSystemPrompt) {
            const newRole: Role = {
                name: newRoleName,
                systemPrompt: newRoleSystemPrompt,
            };
            const updatedRoles = [...roles, newRole];
            setRoles(updatedRoles);
            localStorage.setItem(
                "playgroundRoles",
                JSON.stringify(updatedRoles)
            );
            setNewRoleName("");
            setNewRoleSystemPrompt("");
            toast.success("New role added successfully!");
        } else {
            toast.error(
                "Please provide both a name and system prompt for the new role."
            );
        }
    };

    const handleDeleteRole = (roleName: string) => {
        const updatedRoles = roles.filter((role) => role.name !== roleName);
        setRoles(updatedRoles);
        localStorage.setItem("playgroundRoles", JSON.stringify(updatedRoles));

        // If the deleted role was selected, reset the system prompt
        if (settings.systemPromptType === roleName) {
            setSettings((prev) => ({
                ...prev,
                systemPromptType: "",
                systemPrompt: "",
                useSystemPrompt: false,
            }));
            localStorage.setItem(
                "playgroundSettings",
                JSON.stringify({
                    ...settings,
                    systemPromptType: "",
                    systemPrompt: "",
                    useSystemPrompt: false,
                })
            );
        }

        toast.success(`Role "${roleName}" deleted successfully!`);
    };

    return (
        <div className={`relative ${isFullScreen ? "full-screen" : ""}`}>
            <ToastContainer />
            <FullScreenButton
                isFullScreen={isFullScreen}
                toggleFullScreen={toggleFullScreen}
            />
            <div className="space-y-6 p-8">
                <h1 className="text-3xl font-bold text-primary">
                    AI Playground
                </h1>
                <div className="mb-4 flex items-center space-x-2 flex-wrap">
                    <ToggleGroup
                        type="single"
                        value={settings.systemPromptType}
                        onValueChange={handleSystemPromptTypeChange}
                        className="justify-start flex-wrap"
                    >
                        {roles.map((role) => (
                            <div key={role.name} className="flex items-center">
                                <ToggleGroupItem value={role.name}>
                                    {role.name}
                                </ToggleGroupItem>
                                <button
                                    onClick={() => handleDeleteRole(role.name)}
                                    className="ml-1 p-1 text-red-500 hover:text-red-700"
                                    title={`Delete ${role.name} role`}
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={1.5}
                                        stroke="currentColor"
                                        className="w-4 h-4"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                                        />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </ToggleGroup>
                    <Popover>
                        <PopoverTrigger asChild>
                            <button
                                className="p-2 bg-secondary rounded-full hover:bg-accent transition-colors"
                                aria-label="Add new role"
                                title="Add new role"
                            >
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
                                        d="M12 4.5v15m7.5-7.5h-15"
                                    />
                                </svg>
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 bg-white">
                            <div className="grid gap-4">
                                <h3 className="font-medium leading-none">
                                    Add New Role
                                </h3>
                                <div className="grid gap-2">
                                    <label
                                        htmlFor="roleName"
                                        className="text-sm font-medium leading-none"
                                    >
                                        Role Name
                                    </label>
                                    <input
                                        id="roleName"
                                        value={newRoleName}
                                        onChange={(e) =>
                                            setNewRoleName(e.target.value)
                                        }
                                        className="border rounded p-2"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <label
                                        htmlFor="roleSystemPrompt"
                                        className="text-sm font-medium leading-none"
                                    >
                                        System Prompt
                                    </label>
                                    <textarea
                                        id="roleSystemPrompt"
                                        value={newRoleSystemPrompt}
                                        onChange={(e) =>
                                            setNewRoleSystemPrompt(
                                                e.target.value
                                            )
                                        }
                                        className="border rounded p-2"
                                        rows={3}
                                    />
                                </div>
                                <button
                                    onClick={handleAddRole}
                                    className="bg-primary text-white rounded p-2 hover:bg-accent transition-colors"
                                >
                                    Add Role
                                </button>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
                <div className="mb-4">
                    <textarea
                        placeholder="Enter your prompt here..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="textarea w-full h-40 border-primary focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                </div>
                <div className="mb-4 flex items-center space-x-2">
                    <button
                        onClick={handleGenerate}
                        className="btn bg-primary hover:bg-accent text-white flex-grow transition-colors duration-300"
                        disabled={isGenerating}
                    >
                        {isGenerating ? "Generating..." : "Generate"}
                    </button>
                    <Popover>
                        <PopoverTrigger asChild>
                            <button
                                className="p-2 bg-secondary rounded-full hover:bg-accent transition-colors"
                                aria-label="Open settings"
                                title="Open settings"
                            >
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
                                        d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
                                    />
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                </svg>
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 bg-white">
                            <div className="grid gap-4">
                                <h3 className="font-medium leading-none">
                                    Settings
                                </h3>
                                <div className="grid gap-2">
                                    <label
                                        htmlFor="apiKey"
                                        className="text-sm font-medium leading-none"
                                    >
                                        API Key
                                    </label>
                                    <input
                                        id="apiKey"
                                        name="apiKey"
                                        value={settings.apiKey}
                                        onChange={handleSettingsChange}
                                        className="border rounded p-2"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <label
                                        htmlFor="baseUrl"
                                        className="text-sm font-medium leading-none"
                                    >
                                        Base URL
                                    </label>
                                    <input
                                        id="baseUrl"
                                        name="baseUrl"
                                        value={settings.baseUrl}
                                        onChange={handleSettingsChange}
                                        className="border rounded p-2"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <label
                                        htmlFor="model"
                                        className="text-sm font-medium leading-none"
                                    >
                                        Model
                                    </label>
                                    <input
                                        id="model"
                                        name="model"
                                        value={settings.model}
                                        onChange={handleSettingsChange}
                                        className="border rounded p-2"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <label
                                        htmlFor="systemPrompt"
                                        className="text-sm font-medium leading-none"
                                    >
                                        System Prompt
                                    </label>
                                    <textarea
                                        id="systemPrompt"
                                        name="systemPrompt"
                                        value={settings.systemPrompt}
                                        onChange={handleSettingsChange}
                                        className="border rounded p-2"
                                        rows={3}
                                    />
                                </div>
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="useSystemPrompt"
                                        name="useSystemPrompt"
                                        checked={settings.useSystemPrompt}
                                        onChange={handleSettingsChange}
                                        className="mr-2"
                                    />
                                    <label
                                        htmlFor="useSystemPrompt"
                                        className="text-sm font-medium leading-none"
                                    >
                                        Use System Prompt
                                    </label>
                                </div>
                                <button
                                    onClick={saveSettings}
                                    className="bg-primary text-white rounded p-2 hover:bg-accent transition-colors"
                                >
                                    Save Settings
                                </button>
                            </div>
                        </PopoverContent>
                    </Popover>
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
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="lg:w-1/4 border border-primary rounded-lg p-4 bg-white shadow-sm">
                        <h3 className="font-bold mb-2 text-primary">History</h3>
                        <div className="overflow-y-auto">
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
                    <div className="lg:w-3/4 border border-primary rounded-lg p-4 bg-white shadow-sm">
                        <div className="flex flex-col lg:flex-row gap-4">
                            <div className={`w-full overflow-auto`}>
                                <ReactMarkdown
                                    className="markdown-body"
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        code({
                                            node,
                                            className,
                                            children,
                                            ...props
                                        }) {
                                            const text = String(
                                                children
                                            ).replace(/\n$/, "");
                                            const hasLanguageIdentifier =
                                                className?.includes(
                                                    "language-"
                                                ) || false;
                                            const isHtml =
                                                className?.includes(
                                                    "language-html"
                                                ) || false;
                                            const isSvg =
                                                className?.includes(
                                                    "language-svg"
                                                ) || false;
                                            const isJsx =
                                                className?.includes(
                                                    "language-jsx"
                                                ) || false;
                                            return hasLanguageIdentifier ? (
                                                <div className="relative">
                                                    <pre className={className}>
                                                        <code
                                                            className={
                                                                className
                                                            }
                                                            {...props}
                                                        >
                                                            {children}
                                                        </code>
                                                    </pre>
                                                    <div className="absolute top-2 right-2 flex space-x-2">
                                                        <CopyToClipboard
                                                            text={text}
                                                            onCopy={() =>
                                                                toast.success(
                                                                    "Code copied successfully!"
                                                                )
                                                            }
                                                        >
                                                            <button className="bg-secondary text-white p-1 rounded text-sm hover:bg-accent transition-colors duration-300">
                                                                Copy
                                                            </button>
                                                        </CopyToClipboard>
                                                        {(isHtml || isSvg) && (
                                                            <Popover>
                                                                <PopoverTrigger
                                                                    asChild
                                                                >
                                                                    <button
                                                                        onClick={() =>
                                                                            handleRenderContent(
                                                                                text,
                                                                                isSvg
                                                                            )
                                                                        }
                                                                        className="bg-secondary text-white p-1 rounded text-sm hover:bg-accent transition-colors duration-300"
                                                                    >
                                                                        Render
                                                                    </button>
                                                                </PopoverTrigger>
                                                                <PopoverContent className="w-[800px] h-[600px] p-0">
                                                                    <div className="w-full h-full overflow-auto">
                                                                        <iframe
                                                                            srcDoc={
                                                                                popoverContent
                                                                            }
                                                                            className="w-full h-full border-none"
                                                                            title="Rendered Content"
                                                                        />
                                                                    </div>
                                                                </PopoverContent>
                                                            </Popover>
                                                        )}
                                                        {isJsx && (
                                                            <Dialog
                                                                open={
                                                                    isDialogOpen
                                                                }
                                                                onOpenChange={
                                                                    handleDialogClose
                                                                }
                                                            >
                                                                <DialogTrigger
                                                                    asChild
                                                                >
                                                                    <Button
                                                                        variant="outline"
                                                                        onClick={
                                                                            handleDialogOpen
                                                                        }
                                                                        className="bg-secondary text-white p-1 rounded text-sm hover:bg-accent transition-colors duration-300"
                                                                    >
                                                                        Run
                                                                    </Button>
                                                                </DialogTrigger>
                                                                <DialogContent className="sm:max-w-[1000px]">
                                                                    <DialogHeader>
                                                                        <DialogTitle>
                                                                            Run
                                                                            Code
                                                                        </DialogTitle>
                                                                        <DialogDescription>
                                                                            Run
                                                                            Code
                                                                            like
                                                                            Artifact
                                                                        </DialogDescription>
                                                                    </DialogHeader>
                                                                    <div className="w-Full">
                                                                        <SandpackProvider
                                                                            files={
                                                                                runFiles
                                                                            }
                                                                            theme={
                                                                                cyberpunk
                                                                            }
                                                                            template="react"
                                                                        >
                                                                            <SandpackLayout className="!block !rounded-none sm:!rounded-lg !-mx-4 sm:!mx-0">
                                                                                <SandpackCodeEditor
                                                                                    showTabs
                                                                                    showLineNumbers={
                                                                                        false
                                                                                    }
                                                                                    showInlineErrors
                                                                                    wrapContent
                                                                                    closableTabs
                                                                                />
                                                                                <div className="rounded-b-lg bg-zinc-900 p-4 h-auto">
                                                                                    <div className="overflow-auto rounded bg-white p-1">
                                                                                        <SandpackPreview
                                                                                            showOpenInCodeSandbox={
                                                                                                false
                                                                                            }
                                                                                            showRefreshButton={
                                                                                                true
                                                                                            }
                                                                                        />
                                                                                    </div>
                                                                                </div>
                                                                            </SandpackLayout>
                                                                        </SandpackProvider>
                                                                    </div>
                                                                </DialogContent>
                                                            </Dialog>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <code
                                                    className={className}
                                                    {...props}
                                                >
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
            </div>
        </div>
    );
}
