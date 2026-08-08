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

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { AppState } from '@core/core.state';
import { selectPersistDeviceStateToTelemetry, selectUserDetails } from '@core/auth/auth.selectors';
import { take, takeUntil } from 'rxjs/operators';
import { forkJoin, Subject } from 'rxjs';
import { User } from '@shared/models/user.model';
import { AuthService } from '@core/auth/auth.service';
import { Router } from '@angular/router';
import { FormControl } from '@angular/forms';
import screenfull from 'screenfull';
import { isNotEmptyStr } from '@core/utils';
import { TranslateService } from '@ngx-translate/core';
import { RpHomeService } from './rp-home.service';
import {
  RpHomeKpiData,
  RpRecentAlarmItem,
  RpRecentDashboardItem
} from './rp-home.models';

@Component({
  selector: 'tb-rp-home',
  templateUrl: './rp-home.component.html',
  styleUrls: ['./rp-home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RpHomeComponent implements OnInit, OnDestroy {

  greetingKey = 'home.greeting-evening';
  greetingEmoji = '👋';
  firstName = '';
  initials = '';
  searchControl = new FormControl('', {nonNullable: true});
  fullscreenEnabled = screenfull.isEnabled;

  kpi: RpHomeKpiData = {
    criticalAlarms: 0,
    assignedAlarms: 0,
    activeDevices: 0,
    inactiveDevices: 0
  };
  recentDashboards: RpRecentDashboardItem[] = [];
  recentAlarms: RpRecentAlarmItem[] = [];
  loading = true;

  private destroy$ = new Subject<void>();

  constructor(private store: Store<AppState>,
              private authService: AuthService,
              private router: Router,
              private cd: ChangeDetectorRef,
              private translate: TranslateService,
              private rpHomeService: RpHomeService) {
  }

  ngOnInit() {
    this.updateGreetingByHour();
    this.store.pipe(
      select(selectUserDetails),
      takeUntil(this.destroy$)
    ).subscribe(user => {
      this.applyUser(user);
      this.cd.markForCheck();
    });
    this.loadHomeData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  greetingParams(): { name: string } {
    return {name: this.firstName || 'usuario'};
  }

  criticalDetail(): string {
    return this.kpi.criticalAlarms > 0
      ? this.translate.instant('home.critical-alarms')
      : this.translate.instant('home.no-critical-alarms');
  }

  assignedDetail(): string {
    return this.kpi.assignedAlarms > 0
      ? this.translate.instant('home.assigned-to-me')
      : this.translate.instant('home.no-assignments');
  }

  toggleFullscreen() {
    if (screenfull.isEnabled) {
      screenfull.toggle();
    }
  }

  isFullscreen(): boolean {
    return screenfull.isFullscreen;
  }

  openAccount() {
    this.router.navigate(['account']);
  }

  logout() {
    this.authService.logout();
  }

  private loadHomeData() {
    this.store.pipe(select(selectPersistDeviceStateToTelemetry), take(1)).subscribe(persist => {
      forkJoin({
        kpi: this.rpHomeService.loadKpis(!!persist),
        dashboards: this.rpHomeService.loadRecentDashboards(4),
        alarms: this.rpHomeService.loadRecentAlarms(5)
      }).pipe(takeUntil(this.destroy$)).subscribe(({kpi, dashboards, alarms}) => {
        this.kpi = kpi;
        this.recentDashboards = dashboards;
        this.recentAlarms = alarms;
        this.loading = false;
        this.cd.markForCheck();
      });
    });
  }

  private applyUser(user: User) {
    if (!user) {
      this.firstName = '';
      this.initials = '';
      return;
    }
    this.firstName = isNotEmptyStr(user.firstName)
      ? user.firstName
      : (user.email || '').split('@')[0];
    this.initials = this.computeInitials(user);
  }

  private computeInitials(user: User): string {
    let initials = '';
    if (isNotEmptyStr(user.firstName) || isNotEmptyStr(user.lastName)) {
      if (user.firstName) {
        initials += user.firstName.charAt(0);
      }
      if (user.lastName) {
        initials += user.lastName.charAt(0);
      }
    } else if (user.email) {
      initials += user.email.charAt(0);
    }
    return initials.toUpperCase();
  }

  private updateGreetingByHour() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      this.greetingKey = 'home.greeting-morning';
      this.greetingEmoji = '☀️';
    } else if (hour >= 12 && hour < 19) {
      this.greetingKey = 'home.greeting-afternoon';
      this.greetingEmoji = '👋';
    } else {
      this.greetingKey = 'home.greeting-evening';
      this.greetingEmoji = '👋';
    }
  }
}
