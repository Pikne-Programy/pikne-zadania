// Copyright 2021 Michał Szymocha <szymocha.michal@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

export function deepCopy<T>(arr : T) : T {
    return JSON.parse(JSON.stringify(arr));
}
