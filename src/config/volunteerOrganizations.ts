// Volunteer Organizations Configuration
// This file can be easily updated to add new organizations

export interface VolunteerOrganization {
  id: string;
  name: string;
  address: string;
  phone: string;
  website?: string;
  contactPerson?: string;
  email?: string;
  description?: string;
  isActive: boolean;
}

export const VOLUNTEER_ORGANIZATIONS: VolunteerOrganization[] = [
  {
    id: 'masjid-al-rahma',
    name: 'Masjid Al-Rahma',
    address: '9844 Skewlee Rd, Thonotosassa, FL 33592',
    phone: '(813) 381-3996',
    website: 'https://masjidalrahma.org',
    contactPerson: 'Health Fair Coordinator',
    email: 'healthfair@masjidalrahma.org',
    description: 'Community mosque providing health services and volunteer opportunities',
    isActive: true,
  },
  {
    id: 'community-health-center',
    name: 'Community Health Center',
    address: '123 Main St, Tampa, FL 33601',
    phone: '(813) 555-0123',
    website: 'https://communityhealth.org',
    contactPerson: 'Volunteer Coordinator',
    email: 'volunteers@communityhealth.org',
    description: 'Local health center providing free health screenings',
    isActive: true,
  },
  {
    id: 'red-cross-tampa',
    name: 'American Red Cross - Tampa Bay',
    address: '2001 E 7th Ave, Tampa, FL 33605',
    phone: '(813) 348-4820',
    website: 'https://redcross.org',
    contactPerson: 'Disaster Services',
    email: 'tampa@redcross.org',
    description: 'Emergency response and health services',
    isActive: true,
  },
  {
    id: 'university-health-clinic',
    name: 'University Health Clinic',
    address: '456 University Blvd, Tampa, FL 33620',
    phone: '(813) 555-0456',
    website: 'https://universityhealth.edu',
    contactPerson: 'Student Health Services',
    email: 'health@university.edu',
    description: 'University-affiliated health services',
    isActive: true,
  },
];

// Get active organizations only
export const getActiveOrganizations = (): VolunteerOrganization[] => {
  return VOLUNTEER_ORGANIZATIONS.filter(org => org.isActive);
};

// Get organization by ID
export const getOrganizationById = (id: string): VolunteerOrganization | undefined => {
  return VOLUNTEER_ORGANIZATIONS.find(org => org.id === id);
};

// Get organization by name
export const getOrganizationByName = (name: string): VolunteerOrganization | undefined => {
  return VOLUNTEER_ORGANIZATIONS.find(org => 
    org.name.toLowerCase().includes(name.toLowerCase())
  );
};

// Add new organization (for future use)
export const addOrganization = (organization: Omit<VolunteerOrganization, 'id'>): VolunteerOrganization => {
  const newOrg: VolunteerOrganization = {
    ...organization,
    id: organization.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
  };
  
  VOLUNTEER_ORGANIZATIONS.push(newOrg);
  return newOrg;
};

// Update organization
export const updateOrganization = (id: string, updates: Partial<VolunteerOrganization>): boolean => {
  const index = VOLUNTEER_ORGANIZATIONS.findIndex(org => org.id === id);
  if (index !== -1) {
    VOLUNTEER_ORGANIZATIONS[index] = { ...VOLUNTEER_ORGANIZATIONS[index], ...updates };
    return true;
  }
  return false;
};

// Toggle organization active status
export const toggleOrganizationStatus = (id: string): boolean => {
  const org = getOrganizationById(id);
  if (org) {
    org.isActive = !org.isActive;
    return true;
  }
  return false;
};
