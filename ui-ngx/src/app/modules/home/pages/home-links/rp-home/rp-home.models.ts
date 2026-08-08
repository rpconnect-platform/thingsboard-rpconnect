///
/// Copyright © 2016-2024 The Thingsboard Authors
///
/// Licensed under the Apache License, Version 2.0 (the "License");
/// you may not use this file except in compliance with the License.
/// You may obtain a copy of the License at
///
///     http://www.apache.org/licenses/LICENSE-2.0
///
/// Unless required by applicable law or agreed to in writing, software
/// distributed under the License is distributed on an "AS IS" BASIS,
/// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
/// See the License for the specific language governing permissions and
/// limitations under the License.
///

/** Canonical telemetry key for daily consumption chart (after rule-chain normalization). */
export const RP_CANONICAL_CONSUMPTION_KEY = 'energiaActivaImportadaIntervalo';

export interface RpHomeKpiData {
  criticalAlarms: number;
  assignedAlarms: number;
  activeDevices: number;
  inactiveDevices: number;
}

export interface RpRecentDashboardItem {
  id: string;
  title: string;
  lastVisited: number;
  starred: boolean;
}

export interface RpRecentAlarmItem {
  id: string;
  type: string;
  originatorName: string;
  severity: string;
  createdTime: number;
  status: string;
}

export interface RpQuickAccessItem {
  id: string;
  titleKey: string;
  descKey: string;
  icon: string;
  route: string;
  queryParams?: Record<string, string>;
  color: 'red' | 'blue' | 'green' | 'purple';
}

export const RP_QUICK_ACCESS_ITEMS: RpQuickAccessItem[] = [
  {
    id: 'alarms',
    titleKey: 'home.qa-alarms',
    descKey: 'home.qa-alarms-desc',
    icon: 'notifications_active',
    route: '/alarms',
    color: 'red'
  },
  {
    id: 'dashboards',
    titleKey: 'home.qa-dashboards',
    descKey: 'home.qa-dashboards-desc',
    icon: 'dashboard',
    route: '/dashboards',
    color: 'blue'
  },
  {
    id: 'devices',
    titleKey: 'home.qa-devices',
    descKey: 'home.qa-devices-desc',
    icon: 'devices_other',
    route: '/devices',
    color: 'green'
  },
  {
    id: 'create-dashboard',
    titleKey: 'home.qa-create-dashboard',
    descKey: 'home.qa-create-dashboard-desc',
    icon: 'add',
    route: '/dashboards',
    queryParams: {action: 'add'},
    color: 'purple'
  }
];
