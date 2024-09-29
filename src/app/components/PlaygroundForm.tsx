import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import remarkGfm from 'remark-gfm';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './MarkdownStyles.css';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { Button } from './ui/button';
import FullScreenButton from './FullScreenButton';
import {
  PlaygroundFormProps,
  TokenInfo,
  Files,
  Settings,
  Role,
} from '../lib/types';
import {
  SandpackLayout,
  SandpackProvider,
  SandpackPreview,
  SandpackCodeEditor,
} from '@codesandbox/sandpack-react';
import { cyberpunk } from '@codesandbox/sandpack-themes';
import { handleDownload } from '../lib/download';
import { CopyIcon, DownloadIcon, PlayIcon } from '@radix-ui/react-icons';
import IconTrash from './IconTrash';
import IconAdd from './IconAdd';
import IconSetting from './IconSetting';

export default function PlaygroundForm({ setResult }: PlaygroundFormProps) {
  const [prompt, setPrompt] = useState('');
  const [result, setLocalResult] = useState('');
  const [history, setHistory] = useState<
    { time: string; prompt: string; result: string; tokenInfo: TokenInfo }[]
  >([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [popoverContent, setPopoverContent] = useState('');
  const [settings, setSettings] = useState<Settings>({
    apiKey: '',
    baseUrl: '',
    model: '',
    systemPrompt: '',
    useSystemPrompt: false,
    systemPromptType: '',
  });
  const [roles, setRoles] = useState<Role[]>([]);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleSystemPrompt, setNewRoleSystemPrompt] = useState('');
  const [runFiles, setRunFiles] = useState({});

  const extractCodeBlocks = () => {
    const files: Files = {};
    const cssCodeBlocks = result.match(/```css([\s\S]*?)```/g);
    const jsxCodeBlocks = result.match(/```jsx([\s\S]*?)```/g);
    if (cssCodeBlocks && cssCodeBlocks.length > 0) {
      const lastCssBlock = cssCodeBlocks[cssCodeBlocks.length - 1];
      files['/styles.css'] = lastCssBlock.replace(/```css|```/g, '').trim();
    }

    if (jsxCodeBlocks && jsxCodeBlocks.length > 0) {
      const lastJsxBlock = jsxCodeBlocks[jsxCodeBlocks.length - 1];
      files['/App.js'] = lastJsxBlock.replace(/```jsx|```/g, '').trim();
    }
    setRunFiles(files);
  };

  useEffect(() => {
    console.log(runFiles);
  }, [runFiles]);

  useEffect(() => {
    extractCodeBlocks();
  }, [result]);

  useEffect(() => {
    const storedHistory = localStorage.getItem('playgroundHistory');
    if (storedHistory) {
      setHistory(JSON.parse(storedHistory));
    }

    const storedSettings = localStorage.getItem('playgroundSettings');
    if (storedSettings) {
      setSettings(JSON.parse(storedSettings));
    }

    const storedRoles = localStorage.getItem('playgroundRoles');
    if (storedRoles) {
      setRoles(JSON.parse(storedRoles));
    }
  }, []);

  const saveToHistory = (
    prompt: string,
    result: string,
    tokenInfo: TokenInfo,
  ) => {
    const newEntry = {
      time: new Date().toISOString(),
      prompt,
      result,
      tokenInfo,
    };
    const updatedHistory = [newEntry, ...history.slice(0, 99)];
    setHistory(updatedHistory);
    localStorage.setItem('playgroundHistory', JSON.stringify(updatedHistory));
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setTokenInfo(null);
    try {
      const response = await fetch('/api/completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
      let result = '';

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;
        result += new TextDecoder().decode(value);
        setLocalResult(result);
      }

      // Assume the last line of the response contains the token info
      const lines = result.split('\n');
      const tokenInfoLine = lines.pop();
      const tokenInfo = JSON.parse(tokenInfoLine || '{}');
      setTokenInfo(tokenInfo);

      const actualResult = lines.join('\n');
      saveToHistory(prompt, actualResult, tokenInfo);
      setLocalResult(actualResult);
      setResult(actualResult);
    } catch (error) {
      console.error('Error generating response:', error);
      toast.error(
        'An error occurred while generating the response. Please try again.',
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
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setSettings((prev) => ({ ...prev, [name]: checked }));
    } else {
      setSettings((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSystemPromptTypeChange = (value: string) => {
    let systemPrompt = '';
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
      'playgroundSettings',
      JSON.stringify({
        ...settings,
        systemPromptType: value,
        systemPrompt,
        useSystemPrompt: use,
      }),
    );
  };

  const saveSettings = () => {
    localStorage.setItem('playgroundSettings', JSON.stringify(settings));
    toast.success('Settings saved successfully!');
  };

  const handleAddRole = () => {
    if (newRoleName && newRoleSystemPrompt) {
      const newRole: Role = {
        name: newRoleName,
        systemPrompt: newRoleSystemPrompt,
      };
      const updatedRoles = [...roles, newRole];
      setRoles(updatedRoles);
      localStorage.setItem('playgroundRoles', JSON.stringify(updatedRoles));
      setNewRoleName('');
      setNewRoleSystemPrompt('');
      toast.success('New role added successfully!');
    } else {
      toast.error(
        'Please provide both a name and system prompt for the new role.',
      );
    }
  };

  const handleDeleteRole = (roleName: string) => {
    const updatedRoles = roles.filter((role) => role.name !== roleName);
    setRoles(updatedRoles);
    localStorage.setItem('playgroundRoles', JSON.stringify(updatedRoles));

    // If the deleted role was selected, reset the system prompt
    if (settings.systemPromptType === roleName) {
      setSettings((prev) => ({
        ...prev,
        systemPromptType: '',
        systemPrompt: '',
        useSystemPrompt: false,
      }));
      localStorage.setItem(
        'playgroundSettings',
        JSON.stringify({
          ...settings,
          systemPromptType: '',
          systemPrompt: '',
          useSystemPrompt: false,
        }),
      );
    }

    toast.success(`Role "${roleName}" deleted successfully!`);
  };

  return (
    <div className={`relative ${isFullScreen ? 'full-screen' : ''}`}>
      <ToastContainer />
      <FullScreenButton
        isFullScreen={isFullScreen}
        toggleFullScreen={toggleFullScreen}
      />
      <div className="space-y-6 p-8">
        <h1 className="text-3xl font-bold text-primary">AI Playground</h1>
        <div className="mb-4 flex items-center space-x-2 flex-wrap">
          <ToggleGroup
            type="single"
            value={settings.systemPromptType}
            onValueChange={handleSystemPromptTypeChange}
            className="justify-start flex-wrap"
          >
            {roles.map((role) => (
              <div key={role.name} className="flex items-center">
                <ToggleGroupItem value={role.name}>{role.name}</ToggleGroupItem>
                <button
                  onClick={() => handleDeleteRole(role.name)}
                  className="ml-1 p-1 text-red-500 hover:text-red-700"
                  title={`Delete ${role.name} role`}
                >
                  <IconTrash />
                </button>
              </div>
            ))}
          </ToggleGroup>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                className="p-2 bg-secondary rounded-full hover:bg-accent transition-colors"
                aria-label="Add new role"
                title="Add new role"
              >
                <IconAdd />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-white">
              <div className="grid gap-4">
                <h3 className="font-medium leading-none">Add New Role</h3>
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
                    onChange={(e) => setNewRoleName(e.target.value)}
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
                    onChange={(e) => setNewRoleSystemPrompt(e.target.value)}
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
            {isGenerating ? 'Generating...' : 'Generate'}
          </button>
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="p-2 bg-secondary rounded-full hover:bg-accent transition-colors"
                aria-label="Open settings"
                title="Open settings"
              >
                <IconSetting />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-white">
              <div className="grid gap-4">
                <h3 className="font-medium leading-none">Settings</h3>
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
                    Cost: ${entry.tokenInfo?.totalCost?.toFixed(4)}
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
                    code({ node, className, children, ...props }) {
                      const text = String(children).replace(/\n$/, '');
                      const hasLanguageIdentifier =
                        className?.includes('language-') || false;
                      const isHtml =
                        className?.includes('language-html') || false;
                      const isSvg =
                        className?.includes('language-svg') || false;
                      const isJsx =
                        className?.includes('language-jsx') || false;
                      return hasLanguageIdentifier ? (
                        <div className="relative">
                          <pre className={className}>
                            <code className={className} {...props}>
                              {children}
                            </code>
                          </pre>
                          <div className="absolute top-2 right-2 flex space-x-2">
                            <CopyToClipboard
                              text={text}
                              onCopy={() =>
                                toast.success('Code copied successfully!')
                              }
                            >
                              <Button className="bg-secondary text-white p-1 rounded text-sm hover:bg-accent transition-colors duration-300">
                                <CopyIcon></CopyIcon>
                              </Button>
                            </CopyToClipboard>
                            <Button
                              onClick={() => {
                                handleDownload(text);
                              }}
                              className="bg-secondary text-white p-1 rounded text-sm hover:bg-accent transition-colors duration-300"
                            >
                              <DownloadIcon></DownloadIcon>
                            </Button>
                            {(isHtml || isSvg) && (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    onClick={() =>
                                      handleRenderContent(text, isSvg)
                                    }
                                    className="bg-secondary text-white p-1 rounded text-sm hover:bg-accent transition-colors duration-300"
                                  >
                                    <PlayIcon></PlayIcon>
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[800px] h-[600px] p-0">
                                  <div className="w-full h-full overflow-auto">
                                    <iframe
                                      srcDoc={popoverContent}
                                      className="w-full h-full border-none"
                                      title="Rendered Content"
                                    />
                                  </div>
                                </PopoverContent>
                              </Popover>
                            )}
                            {isJsx && (
                              <div>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="outline">
                                      <PlayIcon></PlayIcon>
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent
                                    style={{ height: '900px' }}
                                    className="max-w-screen h-screen"
                                  >
                                    <DialogHeader>
                                      <DialogTitle>C0</DialogTitle>
                                      <DialogDescription>
                                        Run Code like Claude Artifacts
                                      </DialogDescription>
                                    </DialogHeader>
                                    <SandpackProvider
                                      files={runFiles}
                                      theme={cyberpunk}
                                      template="react"
                                    >
                                      <SandpackLayout>
                                        <SandpackCodeEditor
                                          style={{ height: '800px' }}
                                          showTabs
                                          showLineNumbers={false}
                                          showInlineErrors
                                          wrapContent
                                          closableTabs
                                        />
                                        <SandpackPreview
                                          style={{ height: '800px' }}
                                          showOpenInCodeSandbox={false}
                                          showRefreshButton={true}
                                        />
                                      </SandpackLayout>
                                    </SandpackProvider>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            )}
                          </div>
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
      </div>
    </div>
  );
}
