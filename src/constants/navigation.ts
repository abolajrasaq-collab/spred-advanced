import { ICONS as MAIN_ICONS } from './icons';

export const ICONS = {
  HOME: 'home',
  UPLOAD: 'add',
  DOWNLOAD: 'file-download',
  ME: 'person',
  SHORTS: 'video-library',
  SEARCH: 'search',
  BELL: 'notifications',
  ARROW_LEFT: 'arrow-left',
  SETTINGS: 'settings',
  HEART: 'heart',
  PLAY: 'play-arrow',
  PAUSE: 'pause',
  TRENDING: 'trending-up',
  STAR: 'star',
};

export interface NavigationItem {
  name: string;
  component?: any;
  icon: string;
  label: string;
}

export const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    name: 'HOME',
    icon: ICONS.HOME,
    label: 'HOME',
  },
  {
    name: 'SHORTS',
    icon: ICONS.SHORTS,
    label: 'SHORTS',
  },
  {
    name: 'UPLOAD',
    icon: ICONS.UPLOAD,
    label: 'UPLOAD',
  },
  {
    name: 'LIBRARY',
    icon: ICONS.DOWNLOAD,
    label: 'LIBRARY',
  },
  {
    name: 'ME',
    icon: ICONS.ME,
    label: 'ME',
  },
];

export const NAVIGATION_CONFIG = {
  activeTintColor: '#FF6B35',
  inactiveTintColor: '#9e9a9a',
  backgroundColors: {
    gradientTop: '#333333',
    gradientBottom: '#000000',
    gradientOpacity: 0.7,
  },
  tabBarStyle: {
    height: 70,
    paddingTop: 8,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  tabBarLabelStyle: {
    fontSize: 10,
    fontWeight: '600' as const,
    marginTop: 4,
  },
};
