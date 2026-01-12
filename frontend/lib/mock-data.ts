export const MOCK_ORGANIZATIONS = [
  {
    id: 'org-1',
    name: 'Acme Corporation',
    slug: 'acme-corp',
  },
  {
    id: 'org-2',
    name: 'TechStart Inc',
    slug: 'techstart',
  },
];

export const MOCK_TEAMS = [
  {
    id: 'team-1',
    name: 'Data Engineering',
    slug: 'data-eng',
    gcpProjectId: 'rk-prod',
    organizationId: 'org-1',
  },
  {
    id: 'team-2',
    name: 'Analytics',
    slug: 'analytics',
    gcpProjectId: 'rk-dev',
    organizationId: 'org-1',
  },
  {
    id: 'team-3',
    name: 'ML Platform',
    slug: 'ml-platform',
    gcpProjectId: 'rk-qa',
    organizationId: 'org-1',
  },
  {
    id: 'team-4',
    name: 'Backend Team',
    slug: 'backend',
    gcpProjectId: 'techstart-prod',
    organizationId: 'org-2',
  },
];

