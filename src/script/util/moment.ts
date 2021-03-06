/*
 * Wire
 * Copyright (C) 2018 Wire Swiss GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see http://www.gnu.org/licenses/.
 *
 */

import moment from 'moment';

export const isToday = (momentDate: moment.Moment) => momentDate.isSame(new Date(), 'd');
export const isCurrentYear = (momentDate: moment.Moment) => momentDate.isSame(new Date(), 'y');
export const isSameDay = (momentDate: moment.Moment, otherDate: moment.MomentInput) =>
  momentDate.isSame(otherDate, 'd');
export const isSameMonth = (momentDate: moment.Moment, otherDate: moment.MomentInput) =>
  momentDate.isSame(otherDate, 'M');
