import type { RouteRecordRaw } from 'vue-router';

// Route Meta Custom Types
export interface RouteMeta {
  title: string;
  icon?: string;
  keepAlive?: boolean;
  hidden?: boolean;
  order?: number;
  affix?: boolean;
  badge?: string | number;
  activeMenu?: string;
  externalLink?: string;
}

export interface AppRouteRecordRaw extends Omit<RouteRecordRaw, 'meta' | 'children'> {
  meta?: RouteMeta;
  children?: AppRouteRecordRaw[];
}

// Menu Item Types
export interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  path?: string;
  badge?: string | number;
  hidden?: boolean;
  children?: MenuItem[];
  meta?: RouteMeta;
}
