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

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export type RpKpiTone = 'red' | 'blue' | 'green' | 'orange';

@Component({
  selector: 'tb-rp-kpi-card',
  templateUrl: './rp-kpi-card.component.html',
  styleUrls: ['./rp-kpi-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RpKpiCardComponent {
  @Input() title: string;
  @Input() value: number | string = 0;
  @Input() detail: string;
  @Input() icon: string;
  @Input() tone: RpKpiTone = 'blue';
}
