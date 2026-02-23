/* Imports ////////////////////////////////////////////////////////////////////////////////////////////////////////// */

import type { RouteRecordRaw } from 'vue-router';
import { createRouter, createWebHistory } from 'vue-router';

/* Routes /////////////////////////////////////////////////////////////////////////////////////////////////////////// */

export enum RouteName {
  Home = 'Home',
  Map = 'Map',
  Globe = 'Globe',
  NotFound = 'NotFound',
}

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: RouteName.Home,
    redirect: { name: RouteName.Globe },
  },
  {
    path: '/map',
    name: RouteName.Map,
    component: () => import('@/components/views/MapView.vue'),
  },
  {
    path: '/globe',
    name: RouteName.Globe,
    component: () => import('@/components/views/GlobeView.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    name: RouteName.NotFound,
    redirect: { name: RouteName.Home },
  },
];

/* Router initialization //////////////////////////////////////////////////////////////////////////////////////////// */

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

export default router;
