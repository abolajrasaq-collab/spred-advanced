export const IconSizes = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  xxl: 40,
} as const;

export const IconColors = {
  primary: '#F45303',
  white: '#FFFFFF',
  black: '#000000',
  gray: '#888888',
  darkGray: '#666666',
  lightGray: '#CCCCCC',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#ff4444',
} as const;

export const IconMappings = {
  // Navigation - MaterialIcons names
  back: 'arrow-back',
  forward: 'arrow-forward',
  up: 'keyboard-arrow-up',
  down: 'keyboard-arrow-down',
  close: 'close',
  menu: 'menu',
  'arrow-left': 'arrow-back',
  'arrow-right': 'arrow-forward',
  'arrow-back': 'arrow-back',
  'arrow-forward': 'arrow-forward',

  // Actions - MaterialIcons names
  search: 'search',
  download: 'file-download',
  delete: 'delete',
  edit: 'edit',
  add: 'add',
  remove: 'remove',
  share: 'share',
  save: 'save',

  // Media - MaterialIcons names
  play: 'play-circle-outline',
  'play-arrow': 'play-arrow',
  pause: 'pause-circle-outline',
  stop: 'stop',
  previous: 'skip-previous',
  next: 'skip-next',
  fullscreen: 'fullscreen',
  exitfullscreen: 'fullscreen-exit',
  'fullscreen-exit': 'fullscreen-exit',

  // UI Elements - MaterialIcons names
  home: 'home',
  user: 'person',
  person: 'person',
  settings: 'settings',
  heart: 'favorite-border',
  heartFilled: 'favorite',
  star: 'star-border',
  starFilled: 'star',

  // Bottom Tab Navigation Icons - MaterialIcons names
  'file-download': 'file-download',
  'video-library': 'video-library',
  notifications: 'notifications',
  bell: 'notifications',

  // Status - MaterialIcons names
  check: 'check',
  'check-circle': 'check-circle',
  warning: 'warning',
  error: 'error',
  info: 'info',

  // Communication - MaterialIcons names
  phone: 'phone',
  mail: 'mail',
  message: 'message',

  // File operations - MaterialIcons names
  folder: 'folder',
  'folder-shared': 'folder-shared',
  file: 'description',
  image: 'image',
  video: 'video-library',

  // Misc - MaterialIcons names
  clock: 'schedule',
  calendar: 'event',
  location: 'location-on',
  lock: 'lock',
  unlock: 'lock-open',
  wifi: 'wifi',
  'wifi-off': 'wifi-off',
  battery: 'battery-std',

  // Account Screen Icons - MaterialIcons names
  wallet: 'account-balance-wallet',
  dashboard: 'dashboard',
  sharealt: 'share',
  questioncircleo: 'help-outline',
  logout: 'logout',
  right: 'arrow-forward',
  camera: 'camera-alt',
  playcircleo: 'play-circle-outline',
  clockcircleo: 'schedule',
  fire: 'whatshot',
  bookmark: 'bookmark',
  eye: 'visibility',
  devices: 'devices',
  'stop-circle': 'stop-circle',
  'trending-up': 'trending-up',
  movie: 'movie',
  recommend: 'thumb-up',
} as const;

export type IconName = keyof typeof IconMappings;
export type IconSize = keyof typeof IconSizes;
export type IconColor = keyof typeof IconColors;
