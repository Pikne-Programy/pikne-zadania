#!/usr/bin/env python3
# Copyright 2022 Marcin Zepp <nircek-2103@protonmail.com>
#
# SPDX-License-Identifier: MIT

import sys
import re

with open('API.adoc', 'r') as f:
    x = f.read()

offset = next(re.finditer(r'\n=+\s+Endpoints\n', x)).end()
print(x[:offset], end='')
print('@'*37)
n = 0
for section in re.finditer(r'^={3}\s+(\S.*)\n([\s\S]*?)(?=^={3}\s+(\S.*)\n|^={2}\s+\S)', x, re.M):
    name, content, *_ = section.groups()
    print(f'# {name}')
    for endpoint in re.finditer(r'\.`(?P<endpoint>[^`\n]*)` - (?P<desc>[^[\n]*) \[\[.*\]\][\s\S]*?^\.It can be used by\n(?P<used>(?:[^\.\n][^\n]*\n)*)\n\.Special status codes\n(?P<codes>(?:[^\.\n][^\n]*\n)*)\n\.Request\n{1,2}(?P<request>(?:(?:[^\.\n][^\n]*|)\n)*)\n\.Response\n{1,2}(?P<response>(?:(?:[^\.\n][^\n]*|)\n)*)\n\.Notes\n\n(?P<notes>[\s\S]*?)(?=\n====)', content, re.M):
        d = endpoint.groupdict()
        n += 1
        print('\\^', f"{d['endpoint']} - {d['desc']}")
        print('\\$', d['used'], sep='\n', end='')
        print('\\%', d['codes'], sep='\n', end='')
        print('\\>', d['request'], sep='\n', end='')
        print('\\<', d['response'], sep='\n', end='')
        print('\\!', d['notes'], sep='\n', end='')

offset = next(re.finditer(r'\n=+\s+Used', x)).start()
print('@'*37)
print(x[offset:], end='')
print(n, file=sys.stderr)
