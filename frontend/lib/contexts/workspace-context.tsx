'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Mock types (we'll replace with real data later)
interface Organization {
  id: string;
  name: string;
  slug: string;
}

interface Team {
  id: string;
  name: string;
  slug: string;
  gcpProjectId: string;
  organizationId: string;
}

interface WorkspaceContextType {
  organization: Organization | null;
  team: Team | null;
  setOrganization: (org: Organization | null) => void;
  setTeam: (team: Team | null) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [team, setTeam] = useState<Team | null>(null);

  // Persist to localStorage
  useEffect(() => {
    if (organization) {
      localStorage.setItem('selected_org', JSON.stringify(organization));
    }
  }, [organization]);

  useEffect(() => {
    if (team) {
      localStorage.setItem('selected_team', JSON.stringify(team));
    }
  }, [team]);

  // Load from localStorage on mount
  useEffect(() => {
    const savedOrg = localStorage.getItem('selected_org');
    const savedTeam = localStorage.getItem('selected_team');

    if (savedOrg) {
      setOrganization(JSON.parse(savedOrg));
    }
    if (savedTeam) {
      setTeam(JSON.parse(savedTeam));
    }
  }, []);

  return (
    <WorkspaceContext.Provider
      value={{
        organization,
        team,
        setOrganization,
        setTeam,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within WorkspaceProvider');
  }
  return context;
}