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

import { Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AlarmService } from '@core/http/alarm.service';
import { EntityService } from '@core/http/entity.service';
import { UserSettingsService } from '@core/http/user-settings.service';
import {
  AlarmInfo,
  AlarmQueryV2,
  AlarmSearchStatus,
  AlarmSeverity
} from '@shared/models/alarm.models';
import { TimePageLink } from '@shared/models/page/page-link';
import { Direction } from '@shared/models/page/sort-order';
import { UserId } from '@shared/models/id/user-id';
import { getCurrentAuthUser } from '@core/auth/auth.selectors';
import { Store } from '@ngrx/store';
import { AppState } from '@core/core.state';
import { AliasFilterType } from '@shared/models/alias.models';
import { EntityType } from '@shared/models/entity-type.models';
import {
  BooleanOperation,
  EntityDataQuery,
  EntityKeyType,
  EntityKeyValueType,
  FilterPredicateType,
  KeyFilter
} from '@shared/models/query/query.models';
import {
  RpHomeKpiData,
  RpRecentAlarmItem,
  RpRecentDashboardItem
} from './rp-home.models';

@Injectable({
  providedIn: 'root'
})
export class RpHomeService {

  constructor(private alarmService: AlarmService,
              private entityService: EntityService,
              private userSettingsService: UserSettingsService,
              private store: Store<AppState>) {
  }

  loadKpis(persistDeviceStateToTelemetry = false): Observable<RpHomeKpiData> {
    const authUser = getCurrentAuthUser(this.store);
    const countPage = new TimePageLink(1, 0, null, {property: 'createdTime', direction: Direction.DESC});

    const critical$ = this.alarmService.getAllAlarmsV2(
      new AlarmQueryV2(null, countPage, {
        statusList: [AlarmSearchStatus.ACTIVE],
        severityList: [AlarmSeverity.CRITICAL]
      }),
      {ignoreLoading: true, ignoreErrors: true}
    ).pipe(
      map(p => p?.totalElements || 0),
      catchError(() => of(0))
    );

    const assigned$ = authUser?.userId
      ? this.alarmService.getAllAlarmsV2(
          new AlarmQueryV2(null, countPage, {
            statusList: [AlarmSearchStatus.ACTIVE],
            assigneeId: new UserId(authUser.userId)
          }),
          {ignoreLoading: true, ignoreErrors: true}
        ).pipe(
          map(p => p?.totalElements || 0),
          catchError(() => of(0))
        )
      : of(0);

    const activeKeyType = persistDeviceStateToTelemetry
      ? EntityKeyType.TIME_SERIES
      : EntityKeyType.SERVER_ATTRIBUTE;

    const activeDevices$ = this.countDevicesByActive(true, activeKeyType);
    const inactiveDevices$ = this.countDevicesByActive(false, activeKeyType);

    return forkJoin({
      criticalAlarms: critical$,
      assignedAlarms: assigned$,
      activeDevices: activeDevices$,
      inactiveDevices: inactiveDevices$
    });
  }

  loadRecentDashboards(limit = 5): Observable<RpRecentDashboardItem[]> {
    return this.userSettingsService.getUserDashboardsInfo({ignoreLoading: true, ignoreErrors: true}).pipe(
      map(info => (info?.last || []).slice(0, limit).map(d => ({
        id: d.id,
        title: d.title,
        lastVisited: d.lastVisited,
        starred: !!d.starred
      }))),
      catchError(() => of([]))
    );
  }

  loadRecentAlarms(limit = 5): Observable<RpRecentAlarmItem[]> {
    const pageLink = new TimePageLink(limit, 0, null, {property: 'createdTime', direction: Direction.DESC});
    const query = new AlarmQueryV2(null, pageLink, {
      statusList: [AlarmSearchStatus.ACTIVE]
    });
    return this.alarmService.getAllAlarmsV2(query, {ignoreLoading: true, ignoreErrors: true}).pipe(
      map(page => (page?.data || []).map((a: AlarmInfo) => ({
        id: a.id?.id,
        type: a.type,
        originatorName: a.originatorName,
        severity: a.severity,
        createdTime: a.createdTime,
        status: a.status
      }))),
      catchError(() => of([]))
    );
  }

  private countDevicesByActive(active: boolean, keyType: EntityKeyType): Observable<number> {
    const keyFilter: KeyFilter = {
      key: {type: keyType, key: 'active'},
      valueType: EntityKeyValueType.BOOLEAN,
      predicate: {
        type: FilterPredicateType.BOOLEAN,
        operation: BooleanOperation.EQUAL,
        value: {defaultValue: active, dynamicValue: null}
      }
    };
    const query: EntityDataQuery = {
      entityFilter: {
        type: AliasFilterType.entityType,
        entityType: EntityType.DEVICE
      },
      keyFilters: [keyFilter],
      pageLink: {
        page: 0,
        pageSize: 1,
        textSearch: null,
        sortOrder: null
      },
      entityFields: [
        {type: EntityKeyType.ENTITY_FIELD, key: 'name'}
      ]
    };
    return this.entityService.findEntityDataByQuery(query, {ignoreLoading: true, ignoreErrors: true}).pipe(
      map(page => page?.totalElements || 0),
      catchError(() => of(0))
    );
  }
}
