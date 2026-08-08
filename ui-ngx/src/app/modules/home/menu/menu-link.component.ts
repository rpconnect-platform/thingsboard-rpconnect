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

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MenuId, MenuSection } from '@core/services/menu.models';
import { AlarmService } from '@core/http/alarm.service';
import { AlarmQueryV2, AlarmSearchStatus } from '@shared/models/alarm.models';
import { TimePageLink } from '@shared/models/page/page-link';
import { Direction } from '@shared/models/page/sort-order';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'tb-menu-link',
  templateUrl: './menu-link.component.html',
  styleUrls: ['./menu-link.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MenuLinkComponent implements OnInit, OnDestroy {

  @Input() section: MenuSection;

  badgeCount = 0;

  private destroy$ = new Subject<void>();

  constructor(private alarmService: AlarmService,
              private cd: ChangeDetectorRef) {
  }

  ngOnInit() {
    if (this.section?.id === MenuId.alarms) {
      this.loadActiveAlarmsBadge();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadActiveAlarmsBadge() {
    const pageLink = new TimePageLink(1, 0, null, {property: 'createdTime', direction: Direction.DESC});
    const query = new AlarmQueryV2(null, pageLink, {
      statusList: [AlarmSearchStatus.ACTIVE]
    });
    this.alarmService.getAllAlarmsV2(query, {ignoreLoading: true, ignoreErrors: true})
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (alarms) => {
          this.badgeCount = alarms?.totalElements || 0;
          this.cd.markForCheck();
        },
        error: () => {
          this.badgeCount = 0;
          this.cd.markForCheck();
        }
      });
  }

}
