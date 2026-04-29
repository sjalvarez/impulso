export interface JCEParty {
  id: string;
  name: string;
  abbr: string;
  type: 'partido' | 'movimiento';
}

export const JCE_PARTIES: JCEParty[] = [
  { id: 'prm', name: 'Partido Revolucionario Moderno', abbr: 'PRM', type: 'partido' },
  { id: 'pld', name: 'Partido de la Liberación Dominicana', abbr: 'PLD', type: 'partido' },
  { id: 'prsc', name: 'Partido Reformista Social Cristiano', abbr: 'PRSC', type: 'partido' },
  { id: 'fp', name: 'Fuerza del Pueblo', abbr: 'FP', type: 'partido' },
  { id: 'apd', name: 'Alianza País Dominicano', abbr: 'APD', type: 'partido' },
  { id: 'bld', name: 'Brisas de Libertad Dominicana', abbr: 'BLD', type: 'partido' },
  { id: 'dxc', name: 'Dominicanos por el Cambio', abbr: 'DXC', type: 'partido' },
  { id: 'pqd', name: 'Partido Quisqueyano Demócrata', abbr: 'PQD', type: 'partido' },
  { id: 'pdc', name: 'Partido Demócrata Cristiano', abbr: 'PDC', type: 'partido' },
  { id: 'pun', name: 'Partido de Unidad Nacional', abbr: 'PUN', type: 'partido' },
  { id: 'ptd', name: 'Partido de los Trabajadores Dominicanos', abbr: 'PTD', type: 'partido' },
  { id: 'ard', name: 'Alianza por la Reivindicación Dominicana', abbr: 'ARD', type: 'partido' },
  { id: 'mxd', name: 'Movimiento Democrático', abbr: 'MXD', type: 'movimiento' },
  { id: 'mbd', name: 'Movimiento Bloque Democrático', abbr: 'MBD', type: 'movimiento' },
  { id: 'mrd', name: 'Movimiento Revolucionario Dominicano', abbr: 'MRD', type: 'movimiento' },
  { id: 'mcd', name: 'Movimiento Cívico Democrático', abbr: 'MCD', type: 'movimiento' },
  { id: 'msd', name: 'Movimiento Social Dominicano', abbr: 'MSD', type: 'movimiento' },
];

export type PartyId = typeof JCE_PARTIES[number]['id'];
