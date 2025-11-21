export enum VoiceName {
  Achernar = 'achernar',
  Achird = 'achird',
  Algenib = 'algenib',
  Algieba = 'algieba',
  Alnilam = 'alnilam',
  Aoede = 'aoede',
  Autonoe = 'autonoe',
  Callirrhoe = 'callirrhoe',
  Charon = 'charon',
  Despina = 'despina',
  Enceladus = 'enceladus',
  Erinome = 'erinome',
  Fenrir = 'fenrir',
  Gacrux = 'gacrux',
  Iapetus = 'iapetus',
  Kore = 'kore',
  Laomedeia = 'laomedeia',
  Leda = 'leda',
  Orus = 'orus',
  Puck = 'puck',
  Pulcherrima = 'pulcherrima',
  Rasalgethi = 'rasalgethi',
  Sadachbia = 'sadachbia',
  Sadaltager = 'sadaltager',
  Schedar = 'schedar',
  Sulafat = 'sulafat',
  Umbriel = 'umbriel',
  Vindemiatrix = 'vindemiatrix',
  Zephyr = 'zephyr',
  Zubenelgenubi = 'zubenelgenubi',
}

export interface AudioState {
  isPlaying: boolean;
  volume: number;
}

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';