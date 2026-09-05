#!/bin/bash
TOKEN=$(git credential fill <<< $'protocol=https\nhost=github.com' 2>/dev/null | grep password | cut -d= -f2)
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Accept: application/vnd.github.v3+json" https://api.github.com/user/repos -d '{"name":"real-online-ruler","private":false,"auto_init":false}'