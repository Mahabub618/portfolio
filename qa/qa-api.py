import json, sys, urllib.request, urllib.error

BASE = sys.argv[1].rstrip('/') if len(sys.argv) > 1 else 'http://localhost:8080'
EMAIL = sys.argv[2] if len(sys.argv) > 2 else 'dev@portfolio.local'
PASS = sys.argv[3] if len(sys.argv) > 3 else 'DevPass#2026!'

fails = passes = 0
def check(c, m):
    global fails, passes
    print(('PASS' if c else 'FAIL') + '  ' + m)
    passes += 1 if c else 0
    fails += 0 if c else 1

def req(method, path, body=None, token=None, raw=False, headers=None):
    h = {'Content-Type': 'application/json'}
    if token: h['Authorization'] = 'Bearer ' + token
    if headers: h.update(headers)
    data = None
    if body is not None:
        data = body if raw else json.dumps(body).encode()
    r = urllib.request.Request(BASE + path, data=data, headers=h, method=method)
    try:
        with urllib.request.urlopen(r) as resp:
            return resp.status, json.loads(resp.read().decode() or '{}')
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read().decode() or '{}')
        except Exception:
            return e.code, {}

# login
st, login = req('POST', '/api/auth/login', {'email': EMAIL, 'password': PASS})
check(st == 200 and login.get('data', {}).get('token'), 'login 200 + token')
TOK = login['data']['token']

# malformed login json
st, _ = req('POST', '/api/auth/login', b'{bad json', raw=True)
check(st == 400, f'malformed login JSON -> 400 (got {st})')

# wrong password
st, body = req('POST', '/api/auth/login', {'email': EMAIL, 'password': 'nope'})
check(st == 401 and body.get('error'), 'wrong password -> 401 envelope')

# pagination boundaries
for q, want in [('page=0&size=5', None), ('page=-3&size=5', None), ('page=1&size=0', None), ('page=1&size=100000', None), ('page=9999&size=5', None)]:
    st, body = req('GET', f'/api/projects?{q}')
    ok = st in (200, 400) and st != 500
    if st == 200:
        d = body['data']
        ok = d['size'] <= 100 and d['page'] >= 1 if 'size' in d else True
    check(ok, f'projects?{q} -> {st} (no 5xx, sane clamp)')

# invalid uuid
st, body = req('GET', '/api/blogs/not-a-uuid')
check(st in (400, 404) and body.get('error') is not None, f'GET /blogs/not-a-uuid -> {st} with error envelope')
st, body = req('GET', '/api/blogs/00000000-0000-0000-0000-000000000000')
check(st == 404, f'GET missing blog uuid -> 404 (got {st})')

# auth required on writes
st, _ = req('POST', '/api/projects', {'title': 'x', 'description': 'y'})
check(st == 401, f'unauthenticated POST /projects -> 401 (got {st})')
st, _ = req('PUT', '/api/profile', {'name': 'x'})
check(st == 401, f'unauthenticated PUT /profile -> 401 (got {st})')

# validation on create
st, body = req('POST', '/api/projects', {'title': '', 'description': ''}, token=TOK)
check(st == 400 and body.get('error'), f'blank project -> 400 with details (got {st})')
st, body = req('POST', '/api/projects', {'title': 'T' * 300, 'description': 'd'}, token=TOK)
check(st == 400, f'300-char title -> 400 (got {st})')

# achievements category filter
st, body = req('GET', '/api/achievements?category=hackathon', token=TOK)
cats = {a['category'] for a in body.get('data', [])}
check(st == 200 and cats <= {'hackathon'}, f'category filter respected (got {cats})')

print(f'\n=== API QA: {passes} passed, {fails} failed ===')
sys.exit(1 if fails else 0)
