export type ElectionType = 'primary' | 'municipal' | 'general';

export const JCE_CALENDAR = {
  primaryElection: { date: new Date('2027-10-03'), label: 'Primary Election (Primarias)' },
  municipalElection: { date: new Date('2028-02-20'), label: 'Municipal Election' },
  generalElection: { date: new Date('2028-05-21'), label: 'General Election' },
  preCampaignStart: { date: new Date('2027-07-06'), label: 'Pre-Campaign Start' },
};

export function getElectionDeadline(electionType: ElectionType, _raceType: string): Date {
  switch (electionType) {
    case 'primary': return JCE_CALENDAR.primaryElection.date;
    case 'municipal': return JCE_CALENDAR.municipalElection.date;
    case 'general': return JCE_CALENDAR.generalElection.date;
    default: return JCE_CALENDAR.generalElection.date;
  }
}

export function getDaysUntilElection(electionType: ElectionType, raceType: string): number {
  const deadline = getElectionDeadline(electionType, raceType);
  const now = new Date();
  const diff = deadline.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
