'use client';
import { useWorkspace } from '@/lib/contexts/workspace-context';
import { Button } from '@/components/ui/button';
import { ChevronRight, Folder } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { ProjectSwitcherModal } from '@/components/custom/project-switcher-modal';

interface ProjectSelectorProps {
  isOpen: boolean;
}

export function ProjectSelector({ isOpen }: ProjectSelectorProps) {
  const { organization, team } = useWorkspace();
  const [modalOpen, setModalOpen] = useState(false);

  // Collapsed view - just show icon
  if (!isOpen) {
    return (
      <button
        onClick={() => setModalOpen(true)}
        className="flex items-center justify-center w-full p-3 mb-3 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
      >
        <Folder className="w-5 h-5 text-blue-400" />
      </button>
    );
  }

  // Expanded view - Harness style card
  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className={cn(
          "w-full mb-4 p-3 rounded-lg transition-all",
          "bg-blue-500/10 hover:bg-blue-500/15",
          "border border-blue-500/20",
          "flex items-start justify-between gap-2"
        )}
      >
        <div className="flex-1 text-left">
          <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
            <Folder className="w-3 h-3" />
            <span>PROJECT</span>
          </div>
          {team ? (
            <>
              <div className="font-medium text-sm text-white">
                {team.name}
              </div>
              <div className="text-xs text-gray-500 font-mono mt-0.5">
                {team.gcpProjectId}
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-400">
              Select a project
            </div>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
      </button>

      {/* Project Switcher Modal */}
      <ProjectSwitcherModal 
        open={modalOpen} 
        onOpenChange={setModalOpen} 
      />
    </>
  );
}