// Mapping from AntDesign icons to MaterialIcons equivalents
export const iconMapping: Record<string, string> = {
  // Navigation
  left: 'arrow-back',
  right: 'arrow-forward',
  arrowleft: 'arrow-back',
  arrowright: 'arrow-forward',
  up: 'keyboard-arrow-up',
  down: 'keyboard-arrow-down',

  // Common actions
  search1: 'search',
  plus: 'add',
  delete: 'delete',
  edit: 'edit',
  close: 'close',
  check: 'check',
  heart: 'favorite',
  hearto: 'favorite-border',

  // Communication
  mail: 'email',
  message1: 'message',
  phone: 'phone',

  // Media
  play: 'play-arrow',
  pause: 'pause',
  stop: 'stop',
  sound: 'volume-up',
  mute: 'volume-off',

  // UI elements
  user: 'person',
  team: 'group',
  home: 'home',
  setting: 'settings',
  logout: 'logout',
  notification: 'notifications',

  // Status
  questioncircleo: 'help-outline',
  infocircle: 'info',
  warning: 'warning',
  'check-circle': 'check-circle',
  error: 'error',

  // File operations
  download: 'download',
  upload: 'upload',
  folder: 'folder',
  folderopen: 'folder-open',
  file1: 'description',

  // Finance
  creditcard: 'credit-card',
  wallet: 'account-balance-wallet',
  dollarcircleo: 'attach-money',

  // Multimedia
  playcircleo: 'play-circle-outline',
  pausecircleo: 'pause-circle-outline',
  camerao: 'photo-camera',
  videocamera: 'videocam',

  // Social
  like1: 'thumb-up',
  like2: 'thumb-up-alt',
  dislike1: 'thumb-down',
  share: 'share',
  sharealt: 'share',

  // Misc
  eye: 'visibility',
  eyeo: 'visibility-off',
  lock: 'lock',
  unlock: 'lock-open',
  star: 'star',
  staro: 'star-border',
  calendar: 'event',
  clockcircle: 'schedule',
  wifi: 'wifi',
  database: 'storage',
  shield: 'security',
  global: 'language',
  moon: 'dark-mode',
  fontsize: 'format-size',
};

// Function to get MaterialIcons name from AntDesign name
export function getMaterialIcon(antDesignName: string): string {
  return iconMapping[antDesignName] || antDesignName;
}
