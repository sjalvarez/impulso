export const JCE_CALENDAR = {
  primaryElection: {
    date: new Date('2027-10-03'),
    fundraisingDeadline: new Date('2027-08-19'),
    label: 'Primary election (Primarias)',
    labelEs: 'Elecciones Primarias',
  },
  municipalElection: {
    date: new Date('2028-02-20'),
    fundraisingDeadline: new Date('2028-01-06'),
    label: 'Municipal elections',
    labelEs: 'Elecciones Municipales',
  },
  generalElection: {
    date: new Date('2028-05-21'),
    fundraisingDeadline: new Date('2028-04-06'),
    label: 'General elections',
    labelEs: 'Elecciones Generales',
  },
}

export type ElectionCategory = 'primary' | 'general'
export type ElectionDateType = 'primary' | 'municipal' | 'general'

export function getElectionInfo(category: ElectionCategory, raceType: string) {
  if (category === 'primary') return JCE_CALENDAR.primaryElection
  if (raceType === 'mayor' || raceType === 'district_director') return JCE_CALENDAR.municipalElection
  return JCE_CALENDAR.generalElection
}

export function getElectionDateType(category: ElectionCategory, raceType: string): ElectionDateType {
  if (category === 'primary') return 'primary'
  if (raceType === 'mayor' || raceType === 'district_director') return 'municipal'
  return 'general'
}

export function getDaysUntil(date: Date): number {
  return Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}
