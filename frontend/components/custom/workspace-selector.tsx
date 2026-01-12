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
import { Building2, Users, ChevronRight } from 'lucide-react';

export function WorkspaceSelector() {
  const { organization, team, setOrganization, setTeam } = useWorkspace();

  // Filter teams by selected organization
  const availableTeams = organization
    ? MOCK_TEAMS.filter((t) => t.organizationId === organization.id)
    : [];

  const handleOrgChange = (orgId: string) => {
    const org = MOCK_ORGANIZATIONS.find((o) => o.id === orgId);
    setOrganization(org || null);
    setTeam(null); // Reset team when org changes
  };

  const handleTeamChange = (teamId: string) => {
    const t = availableTeams.find((t) => t.id === teamId);
    setTeam(t || null);
  };

  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-gray-900 border-b border-gray-800">
      {/* Organization Selector */}
      <div className="flex items-center gap-2">
        <Building2 className="w-4 h-4 text-gray-400" />
        <Select value={organization?.id || ''} onValueChange={handleOrgChange}>
          <SelectTrigger className="w-48 bg-gray-800 border-gray-700">
            <SelectValue placeholder="Select organization" />
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

      <ChevronRight className="w-4 h-4 text-gray-600" />

      {/* Team Selector */}
      <div className="flex items-center gap-2">
        <Users className="w-4 h-4 text-gray-400" />
        <Select
          value={team?.id || ''}
          onValueChange={handleTeamChange}
          disabled={!organization}
        >
          <SelectTrigger className="w-48 bg-gray-800 border-gray-700">
            <SelectValue placeholder="Select team" />
          </SelectTrigger>
          <SelectContent>
            {availableTeams.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                <div className="flex flex-col items-start">
                  <span>{t.name}</span>
                  <span className="text-xs text-gray-500">{t.gcpProjectId}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Current Project Badge */}
      {team && (
        <div className="ml-auto flex items-center gap-2">
          <div className="text-xs text-gray-400">GCP Project:</div>
          <div className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-md text-xs font-mono">
            {team.gcpProjectId}
          </div>
        </div>
      )}
    </div>
  );
}