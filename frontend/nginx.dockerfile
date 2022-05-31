# Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
#
# SPDX-License-Identifier: AGPL-3.0-or-later

FROM nginx:1.22
EXPOSE 80
COPY nginx.conf /etc/nginx/conf.d/default.conf
