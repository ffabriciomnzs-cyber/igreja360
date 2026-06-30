export interface RadioStation {
  name: string;
  description: string;
  url: string;
}

// Emissoras gospel brasileiras com transmissão em HTTPS (testadas).
export const RADIO_STATIONS: RadioStation[] = [
  {
    name: 'Rádio Melodia FM 97.5',
    description: 'Louvor e adoração · Rio de Janeiro',
    url: 'https://26573.live.streamtheworld.com/MELODIAFMAAC.aac',
  },
  {
    name: 'MGT Gospel',
    description: 'Sucessos gospel',
    url: 'https://cast.mgtradio.net/radio/8040/aac',
  },
  {
    name: 'Rádio Gospel Hits',
    description: 'Os hits do louvor',
    url: 'https://servidor37.brlogic.com:7068/live',
  },
  {
    name: 'Rádio Super Gospel',
    description: 'Variedade gospel',
    url: 'https://servidor32.brlogic.com:8200/live',
  },
  {
    name: 'Rádio Cordeiro de Deus',
    description: 'Adoração e palavra',
    url: 'https://servidor33.brlogic.com:8598/live',
  },
  {
    name: 'Rádio BBN 93.5 FM',
    description: 'Pregações e música cristã',
    url: 'https://audio-edge-es6pf.mia.g.radiomast.io/ec065d59-f358-48c9-a288-4efc797e5860',
  },
  {
    name: 'Rádio Gospel Jireh',
    description: 'Louvor 24 horas',
    url: 'https://stm9.xcast.com.br:9922/',
  },
  {
    name: 'Atos FM',
    description: 'Música cristã',
    url: 'https://s.bul.tec.br:8020/128',
  },
];
