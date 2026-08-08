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

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HomeLinksRoutingModule } from './home-links-routing.module';
import { HomeLinksComponent } from './home-links.component';
import { SharedModule } from '@app/shared/shared.module';
import { HomeComponentsModule } from '@home/components/home-components.module';
import { RpHomeComponent } from './rp-home/rp-home.component';
import { RpKpiCardComponent } from './rp-home/rp-kpi-card.component';
import { RpRecentDashboardsComponent } from './rp-home/rp-recent-dashboards.component';
import { RpRecentAlarmsComponent } from './rp-home/rp-recent-alarms.component';
import { RpQuickAccessComponent } from './rp-home/rp-quick-access.component';
import { NotificationModule } from '@home/components/notification/notification.module';

@NgModule({
  declarations: [
    HomeLinksComponent,
    RpHomeComponent,
    RpKpiCardComponent,
    RpRecentDashboardsComponent,
    RpRecentAlarmsComponent,
    RpQuickAccessComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    HomeComponentsModule,
    HomeLinksRoutingModule,
    NotificationModule
  ]
})
export class HomeLinksModule { }
