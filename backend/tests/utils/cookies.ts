// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { IResponse } from "../../test_deps.ts";

export function updateCookies(
  response: IResponse,
  old: string | string[] = "",
) {
  let cookies: string[] | string = response.header["set-cookie"] ?? [];
  if (typeof cookies === "string") cookies = [cookies];
  if (old === "") old = [];
  if (typeof old === "string") old = old.split(/; ?/);
  for (const c of cookies) {
    old.push(...c.split(/, ?(?=[^,]*=)/).map((e) => e.split(";")[0])); // TODO: make it in one regex and replace old cookies
  }
  return old.join("; ");
}

const cookieSuffix =
  "; path=/; expires=Sat, 11 Sep 2021 21:43:35 GMT; httponly";
export function generateCookieResponse(...cookies: string[]) {
  return {
    header: cookies.length == 0 ? {} : {
      "set-cookie": cookies.map((e) => `${e}${cookieSuffix}`).join(", "),
    },
  } as unknown as IResponse;
}
