#!/usr/bin/env python3
# Copyright 2022 Marcin Zepp <nircek-2103@protonmail.com>
#
# SPDX-License-Identifier: MIT

import sys
import re

with open('gen.txt', 'r') as f:
    x = f.read()

offset = x.find('@'*37)
offset2 = x.find('@'*37, offset+1)
print(x[:offset])
content = x[offset+38:offset2]
n = 0
for match in re.finditer(r'^(?:(?P<section># [^\n]*)|(?P<content>\\\^ (.*)[\s\S]*?)(?=(?:^# [^\n]*|\Z|^\\\^ (.*))))', content, re.M):
    d = match.groupdict()
    if d['section'] is not None:
        print(f"\n=== {d['section'][2:]}")
        continue
    n += 1
    raw = d['content']
    d = re.search(r'\\\^ (?P<endpoint>[^\n]*?) - (?P<desc>[^\n]*?)\n\\\$\n(?P<used>[\s\S]*?\n)\\%\n(?P<codes>[\s\S]*?)\\>\n(?P<request>[\s\S]*?)\\<\n(?P<response>[\s\S]*?)\\!(?P<notes>[\s\S]*)', raw).groupdict()
    endpoint = d['endpoint']
    desc = d['desc']
    tag = '_'.join(re.split(r'(?: |\/)+', d['endpoint'])).replace(':', '.')
    used = d['used']
    codes = d['codes']
    request = '\n'+d['request'] if d['request'] else ''
    response = '\n'+d['response'] if d['response'] else ''
    notes = d['notes']
    endl = '\n'
    print(f'''
.`{endpoint}` - {desc} [[{tag}]]
[%collapsible]
====

.It can be used by
{used}
.Special status codes
{codes}
.Request
{request}
.Response
{response}
.Notes
{notes}
====''')


print(x[offset2+38:], end='')
print(n, file=sys.stderr)
