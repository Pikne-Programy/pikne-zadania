#!/usr/bin/env python3
# Copyright 2022 Marcin Zepp <nircek-2103@protonmail.com>
#
# SPDX-License-Identifier: MIT

import sys
import re

assert len(sys.argv) == 2
with open(sys.argv[1], 'r') as f:
    x = f.read()

endpointsM = re.search(r'^=+\s+Endpoints\n', x, re.M)
notesM = re.search(r'\n=+\s+Notes database\n[\s\S]*?\n={4}\n*([\s\S]*)\n\n={4}\n\n/{4}\n', x)
print(x[:endpointsM.start()], end='')
print('#'*37)
print(notesM.group(1))
print('@'*37)
n = 0
for section in re.finditer(r'^={3}\s+(\S.*)\n([\s\S]*?)(?=^={3}\s+(\S.*)\n|^={2}\s+\S)', x[endpointsM.start():notesM.end()], re.M):
    name, content, *_ = section.groups()
    print(f'# {name}')
    for endpoint in re.finditer(r'\.`(?P<endpoint>[^`\n]*)` - (?P<desc>[^[\n]*) \[\[.*\]\][^=]*====\n*(?P<comment>(?:[^\.\n][^\n]*\n)*)\n\.It can be used by\n(?P<used>(?:[^\.\n][^\n]*\n)*)\n\.Special status codes\n(?P<codes>(?:[^\.\n][^\n]*\n)*)\n\.Request\n{1,2}(?P<request>(?:(?:[^\.\n][^\n]*|)\n)*)\n\.Response\n{1,2}(?P<response>(?:(?:[^\.\n][^\n]*|)\n)*)\n\.Notes\n\n(?P<notes>[\s\S]*?)(?=====)', content, re.M):
        d = endpoint.groupdict()
        n += 1
        print('\\^', f"{d['endpoint']} - {d['desc']}")
        print('\\#', d['comment'], sep='\n', end='')
        print('\\$', d['used'], sep='\n', end='')
        print('\\%', d['codes'], sep='\n', end='')
        print('\\>', d['request'], sep='\n', end='')
        print('\\<', d['response'], sep='\n', end='')
        notes = list(map(lambda x: x[0] if x[2] == '' else f"TODO: {x[2]}", re.findall(r'^// (?:(\S*)\n([\s\S]*?\n)|TODO: (.*))(?=\n*(//|\Z))', d['notes'], re.M)))
        notes += [''] if notes else []
        print('\\!', '\n'.join(notes), sep='\n', end='')

print('@'*37)
print(x[notesM.end():], end='')
print(n, file=sys.stderr)
