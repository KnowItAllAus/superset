/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import { css } from '@superset-ui/core';
import { List } from '@superset-ui/core/components';
import { ValidationObject } from './types';
import { TRANSLATIONS } from './AlertReportModal';

export const buildErrorTooltipMessage = (
  validationStatus: ValidationObject,
) => {
  const sectionErrors: string[] = [];
  Object.values(validationStatus).forEach(section => {
    if (section.hasErrors) {
      const sectionTitle = `${section.name}: `;
      sectionErrors.push(sectionTitle + section.errors.join(', '));
    }
  });
  return (
    <div>
      {TRANSLATIONS.ERROR_TOOLTIP_MESSAGE}
      <List
        dataSource={sectionErrors}
        renderItem={err => (
          <List.Item
            css={theme => css`
              &&& {
                color: ${theme.colorWhite};
              }
            `}
            compact
          >
            • {err}
          </List.Item>
        )}
        size="small"
        split={false}
      />
    </div>
  );
};
