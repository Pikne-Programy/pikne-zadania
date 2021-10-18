// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { assertEquals, describe, it, xit } from "../../test_deps.ts";
import { generateCookieResponse, updateCookies } from "./cookies.ts";

describe("updateCookies", () => {
  const jwtCookie = "jwt=eyJh.eyJp";
  const xdCookie = "xd=xd";
  const jwtCookie2 = "jwt=pJye.hJye";
  const multiCookieResponse = generateCookieResponse(jwtCookie, xdCookie);
  const multiCookieString = `${jwtCookie}; ${xdCookie}`;

  it("parse Set-Cookie", () => {
    assertEquals(updateCookies(generateCookieResponse()), "");
    assertEquals(updateCookies(generateCookieResponse(jwtCookie)), jwtCookie);
    assertEquals(updateCookies(multiCookieResponse), multiCookieString);
  });

  xit("replace old cookies", () => { // TODO: enable this test
    let cookies = updateCookies(generateCookieResponse(jwtCookie));
    cookies = updateCookies(generateCookieResponse(jwtCookie2), cookies);
    assertEquals(cookies, jwtCookie2);
    cookies = updateCookies(multiCookieResponse, cookies);
    assertEquals(cookies, multiCookieString);
  });
});
