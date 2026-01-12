'use client';
import { useWorkspace } from '@/lib/contexts/workspace-context';
import { MOCK_ORGANIZATIONS, MOCK_TEAMS } from '@/lib/mock-data';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Building2, Users, Search, Star, Folder } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ProjectSwitcherModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProjectSwitcherModal({ open, onOpenChange }: ProjectSwitcherModalProps) {
  const { organization, team, setOrganization, setTeam } = useWorkspace();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('projects');

const filteredTeams = MOCK_TEAMS.filter((t) => {
  // First filter by search
  const matchesSearch = search === '' || 
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.gcpProjectId.toLowerCase().includes(search.toLowerCase());
  
  // Then filter by organization if one is selected
  const matchesOrg = !organization || t.organizationId === organization.id;
  
  return matchesSearch && matchesOrg;
});

  const handleSelectTeam = (selectedTeam: typeof MOCK_TEAMS[0]) => {
    // Find and set the organization for this team
    const org = MOCK_ORGANIZATIONS.find(o => o.id === selectedTeam.organizationId);
    if (org) setOrganization(org);
    setTeam(selectedTeam);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle>Switch Project</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="projects" className="gap-2">
                <Folder className="w-4 h-4" />
                Projects
              </TabsTrigger>
              <TabsTrigger value="organizations" className="gap-2">
                <Building2 className="w-4 h-4" />
                Organizations
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="projects" className="mt-0 px-6 pb-6">
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search your project by name or ID"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Organization Filter Dropdown */}
            <div className="mb-4">
              <select 
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-sm"
                value={organization?.id || 'all'}
                onChange={(e) => {
                  const org = MOCK_ORGANIZATIONS.find(o => o.id === e.target.value);
                  setOrganization(org || null);
                }}
              >
                <option value="all">All Organizations</option>
                {MOCK_ORGANIZATIONS.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Project List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              <div className="text-xs text-gray-500 mb-2">
                Total: {filteredTeams.length}
              </div>
              {filteredTeams.map((t) => {
                const isActive = team?.id === t.id;
                const org = MOCK_ORGANIZATIONS.find(o => o.id === t.organizationId);
                
                return (
                  <button
                    key={t.id}
                    onClick={() => handleSelectTeam(t)}
                    className={cn(
                      "w-full p-4 rounded-lg border text-left transition-all",
                      isActive
                        ? "bg-blue-500/10 border-blue-500/50"
                        : "bg-gray-800/50 border-gray-700 hover:bg-gray-800"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {isActive && <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />}
                          <span className="font-medium">{t.name}</span>
                        </div>
                        <div className="text-xs text-gray-500 mb-2">
                          id: {t.gcpProjectId}
                        </div>
                        <div className="text-xs text-gray-400">
                          {org?.name}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-xs font-bold text-white">
                          RC
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="organizations" className="mt-0 px-6 pb-6">
            <div className="space-y-2">
              {MOCK_ORGANIZATIONS.map((org) => {
                const isActive = organization?.id === org.id;
                const orgTeams = MOCK_TEAMS.filter(t => t.organizationId === org.id);
                
                return (
                  <button
                    key={org.id}
                    onClick={() => setOrganization(org)}
                    className={cn(
                      "w-full p-4 rounded-lg border text-left transition-all",
                      isActive
                        ? "bg-blue-500/10 border-blue-500/50"
                        : "bg-gray-800/50 border-gray-700 hover:bg-gray-800"
                    )}
                  >
                    <div className="font-medium mb-1">{org.name}</div>
                    <div className="text-xs text-gray-500">
                      {orgTeams.length} {orgTeams.length === 1 ? 'project' : 'projects'}
                    </div>
                  </button>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}