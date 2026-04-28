export interface Campaign {
  id: string;
  candidate_name: string;
  slug: string;
  goal_amount: number;
  created_at: string;
  user_id?: string;
  candidate_cedula?: string;
  party_affiliation?: string;
  race_type?: string;
  election_type?: string;
  election_deadline?: string;
  phone?: string;
  candidate_photo_url?: string;
  banner_url?: string;
  description?: string;
  jce_registration_number?: string;
  status?: 'pending_verification' | 'active' | 'suspended';
  municipality?: string;
}

export interface Donation {
  id: string;
  campaign_id: string;
  amount: number;
  donor_name: string | null;
  donor_cedula: string | null;
  anonymous: boolean;
  created_at: string;
}

export interface JCERegistration {
  id: string;
  jce_number: string;
  candidate_name: string;
  race_type: string;
  municipality?: string;
  party?: string;
}
