import React from 'react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { Button } from './ui/button';
import {
  SandpackLayout,
  SandpackProvider,
  SandpackPreview,
  SandpackCodeEditor,
} from '@codesandbox/sandpack-react';
import { cyberpunk } from '@codesandbox/sandpack-themes';
import { Files } from '../lib/types';

interface RunCodeDialogProps {
  isDialogOpen: boolean;
  handleDialogClose: () => void;
  handleDialogOpen: () => void;
  runFiles: Files;
}

const RunCodeDialog: React.FC<RunCodeDialogProps> = ({
  isDialogOpen,
  handleDialogClose,
  handleDialogOpen,
  runFiles,
}) => {
  return (
    <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          onClick={handleDialogOpen}
          className="bg-secondary text-white p-1 rounded text-sm hover:bg-accent transition-colors duration-300"
        >
          Run
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[1000px]">
        <DialogHeader>
          <DialogTitle>Run Code</DialogTitle>
          <DialogDescription>Run Code like Artifact</DialogDescription>
        </DialogHeader>
        <SandpackProvider files={runFiles} theme={cyberpunk} template="react">
          <SandpackLayout className="!block !rounded-none sm:!rounded-lg !-mx-4 sm:!mx-0">
            <SandpackCodeEditor
              showTabs
              showLineNumbers={false}
              showInlineErrors
              wrapContent
              closableTabs
            />
            <div className="rounded-b-lg bg-zinc-900 p-4 h-auto">
              <div className="overflow-auto rounded bg-white p-1">
                <SandpackPreview
                  showOpenInCodeSandbox={false}
                  showRefreshButton={true}
                />
              </div>
            </div>
          </SandpackLayout>
        </SandpackProvider>
      </DialogContent>
    </Dialog>
  );
};

export default RunCodeDialog;
