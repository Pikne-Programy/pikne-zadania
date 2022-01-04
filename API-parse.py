#!/usr/bin/env python3
# Copyright 2022 Marcin Zepp <nircek-2103@protonmail.com>
#
# SPDX-License-Identifier: MIT

import sys
import re

assert len(sys.argv) == 2
with open(sys.argv[1], 'r') as f:
    x = f.read()

offset1 = x.find('#'*37+'\n')
offset2 = x.find('@'*37+'\n')
offset3 = x.find('@'*37+'\n', offset2+1)

print(x[:offset1-1])
Notes = x[offset1+38:offset2]
notesD = {}
for match in re.finditer(r'^// (\S*)\n([\s\S]*?\n)(?=\n//|\Z)', Notes, re.M):
    assert match.group(1) not in notesD, f'`{match.group(1)} already in Notes'
    notesD[match.group(1)] = match.group(2)
Content = x[offset2+38:offset3]
print('== Endpoints\n')
n = 0
for match in re.finditer(r'^(?:(?P<section># [^\n]*)|(?P<content>\\\^ (.*)[\s\S]*?)(?=(?:^# [^\n]*|\Z|^\\\^ (.*))))', Content, re.M):
    d = match.groupdict()
    if d['section'] is not None:
        print(f"\n=== {d['section'][2:]}")
        continue
    n += 1
    raw = d['content']
    d = re.search(r'\\\^ (?P<endpoint>[^\n]*?) - (?P<desc>[^\n]*?)\n\\#\n(?P<comment>[\s\S]*?)\\\$\n(?P<used>[\s\S]*?\n)\\%\n(?P<codes>[\s\S]*?)\\>\n(?P<request>[\s\S]*?)\\<\n(?P<response>[\s\S]*?)\\!\n(?P<notes>[\s\S]*)', raw).groupdict()
    endpoint = d['endpoint']
    desc = d['desc']
    tag = '_'.join(re.split(r'(?: |\/)+', d['endpoint'])).replace(':', '.')
    comment = '\n' + d['comment'] if d['comment'] else ''
    used = d['used']
    codes = d['codes']
    request = '\n'+d['request'] if d['request'] else ''
    response = '\n'+d['response'] if d['response'] else ''
    notes = ''
    while d['notes'] and d['notes'][-1] == '\n':
        d['notes'] = d['notes'][:-1]
    for line in d['notes'].split('\n') if d['notes'] else []:
        if re.match(r'^TODO: ', line):
            notes += f'// {line}\n'
        else:
            if line in notesD:
                notes += f'// {line}\n{notesD[line]}'
            else:
                print(f'WARN: `{line}` not in Notes dict', file=sys.stderr)
    if notes:
        notes = '\n' + notes
    endl = '\n'
    print(f'''
.`{endpoint}` - {desc} [[{tag}]]
[%collapsible]
====
{comment}
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

print(f'''
////

== Notes database

[%collapsible]
====

{Notes}
====

////''')

print(x[offset3+38:], end='')
print(n, file=sys.stderr)
