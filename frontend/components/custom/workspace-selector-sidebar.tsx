'use client';
import { useWorkspace } from '@/lib/contexts/workspace-context';
import { MOCK_ORGANIZATIONS, MOCK_TEAMS } from '@/lib/mock-data';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2, Users, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkspaceSelectorSidebarProps {
  isOpen: boolean;
}

export function WorkspaceSelectorSidebar({ isOpen }: WorkspaceSelectorSidebarProps) {
  const { organization, team, setOrganization, setTeam } = useWorkspace();

  const availableTeams = organization
    ? MOCK_TEAMS.filter((t) => t.organizationId === organization.id)
    : [];

  const handleOrgChange = (orgId: string) => {
    const org = MOCK_ORGANIZATIONS.find((o) => o.id === orgId);
    setOrganization(org || null);
    setTeam(null);
  };

  const handleTeamChange = (teamId: string) => {
    const t = availableTeams.find((t) => t.id === teamId);
    setTeam(t || null);
  };

  // Collapsed view - just show icons
  if (!isOpen) {
    return (
      <div className="flex flex-col items-center gap-2 mb-4 pb-4 border-b border-gray-700">
        <div className="p-2 rounded-lg bg-gray-800 text-gray-400">
          <Building2 className="w-5 h-5" />
        </div>
        <div className="p-2 rounded-lg bg-gray-800 text-gray-400">
          <Users className="w-5 h-5" />
        </div>
      </div>
    );
  }

  // Expanded view
  return (
    <div className="mb-4 pb-4 border-b border-gray-700 space-y-2">
      {/* Organization Selector */}
      <div>
        <label className="text-xs text-gray-500 mb-1 block px-1">
          Organization
        </label>
        <Select value={organization?.id || ''} onValueChange={handleOrgChange}>
          <SelectTrigger className="w-full bg-gray-800 border-gray-700 h-9">
            <div className="flex items-center gap-2 overflow-hidden">
              <Building2 className="w-4 h-4 flex-shrink-0 text-gray-400" />
              <SelectValue placeholder="Select org" />
            </div>
          </SelectTrigger>
          <SelectContent>
            {MOCK_ORGANIZATIONS.map((org) => (
              <SelectItem key={org.id} value={org.id}>
                {org.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Team Selector */}
      <div>
        <label className="text-xs text-gray-500 mb-1 block px-1">
          Team
        </label>
        <Select
          value={team?.id || ''}
          onValueChange={handleTeamChange}
          disabled={!organization}
        >
          <SelectTrigger className="w-full bg-gray-800 border-gray-700 h-9">
            <div className="flex items-center gap-2 overflow-hidden">
              <Users className="w-4 h-4 flex-shrink-0 text-gray-400" />
              <SelectValue placeholder="Select team" />
            </div>
          </SelectTrigger>
          <SelectContent>
            {availableTeams.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                <div className="flex flex-col items-start">
                  <span className="font-medium">{t.name}</span>
                  <span className="text-xs text-gray-500 font-mono">
                    {t.gcpProjectId}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Current Project Badge */}
      {team && (
        <div className="px-2 py-1.5 bg-blue-500/10 rounded text-xs">
          <div className="text-blue-400 font-mono truncate">
            {team.gcpProjectId}
          </div>
        </div>
      )}
    </div>
  );
}