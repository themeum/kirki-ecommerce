# Client IP detection behind proxies: problem, Laravel's solution, proposed solution

Audience: the maintainers and the AI agent of `themeum/framework`.
Reporter: the Kirki eCommerce plugin, which uses the framework.
Status: analysis only. No code is changed.

## Table of contents

1. Summary
2. Background: why the client IP matters
3. Current implementation
4. Problems, with examples
5. Impact by hosting setup
6. How Laravel solves this
7. Proposed solution for `themeum/framework`
8. Site owner experience
9. Test cases (acceptance criteria)
10. Out of scope
11. Open questions
12. Where this differs from Laravel

---

## 1. Summary

`Request::ip()` has a safe default: when no proxy is trusted, it returns `REMOTE_ADDR`. Its chain walk over
`X-Forwarded-For` is also correct. But the feature has these defects:

| # | Problem | Severity |
|---|---|---|
| P1 | A WordPress site cannot set `trusted_proxies`. The only source is `config/app.php` inside the plugin folder, and a plugin update deletes that file. | High |
| P2 | Behind Cloudflare or a load balancer, all guests share the proxy's IP, so they share one rate limit. Real shoppers get HTTP 429, and an attacker can use up the shared limit to block every guest. | High (it follows from P1) |
| P3 | `CF-Connecting-IP` is believed from **any** trusted proxy, and it skips the chain walk. Behind a proxy that is not Cloudflare, a client can spoof its IP and bypass the rate limiter. | High (when a trust list is set) |
| P4 | `*` trusts every address in the chain, so the result is the leftmost entry, which the client controls. | Medium |
| P5 | Forwarded entries are not validated or normalized (ports, brackets, text such as `unknown`). | Low |
| P6 | A plain-IP trust entry is matched as a string, so equal IPv6 addresses in different notation do not match. | Low |
| P7 | The rate limiter keys guests by the full IPv6 address. One client with a `/64` can use a new address for each request and get a new limit each time. | Medium |
| P8 | `array_filter()` without a callback also drops the entry `"0"`. | Very low |

P1 and P2 affect every site today. P3 and P4 can happen only after P1 is fixed, so the fix for P1 must ship
together with the fixes for P3 and P4.

---

## 2. Background: why the client IP matters

The framework's `throttle` middleware limits requests per caller. The Kirki eCommerce plugin uses it on
these routes:

| Route | Limit |
|---|---|
| `POST /checkout` | 10 requests in 1 minute |
| `POST /cart/coupon` | 10 requests in 1 minute |
| `POST /account/resend-verification-email` | 1 request in 2 minutes |
| `login` named limiter | 5 a minute per email + IP, and 20 a minute per IP |

`ThrottleRequests::resolve_key()` builds the key:

1. If the limit has its own key (`Limit::by()`), it uses that key.
2. Otherwise, if a user is logged in, it uses `Request::user_id()`.
3. Otherwise (a guest), it uses `Request::ip()`.
4. It adds a route signature (`sha1(method + ' ' + route)`), so each route has its own count.

So for guests, the rate limiter is only as good as `Request::ip()`.

---

## 3. Current implementation

Files (paths are in the upstream package, under `src/`):

- `Http/Request.php`: `ip()`, `forwarded_ip()`, `is_trusted_proxy()`, `trusted_proxies()`, `ip_in_range()`
- `Middlewares/ThrottleRequests.php`: `resolve_key()`, `route_signature()`
- `helpers.php`: `config()`

### 3.1 Algorithm

1. `ip()` reads `REMOTE_ADDR` from `$this->server`, or from `Superglobals::server()`, and trims it.
2. If `REMOTE_ADDR` is empty, or it is **not** a trusted proxy, `ip()` returns `REMOTE_ADDR` (or `null`).
3. If `REMOTE_ADDR` is trusted, `ip()` calls `forwarded_ip()`:
   1. If `HTTP_CF_CONNECTING_IP` is set, it returns that value (trimmed) at once.
   2. If `HTTP_X_FORWARDED_FOR` is empty, it returns `null`, and `ip()` returns `REMOTE_ADDR`.
   3. It splits `X-Forwarded-For` on `,`, trims each entry, and calls `array_filter()` with no callback.
   4. While more than one entry remains and the rightmost entry is trusted, it removes the rightmost entry.
   5. It returns the rightmost remaining entry.
4. `is_trusted_proxy($ip)` gives true when a list entry is `*`, when an entry equals `$ip` as a string, or
   when an entry has `/` and `ip_in_range()` matches. `ip_in_range()` compares the leading bits of the
   `inet_pton()` results, for IPv4 and IPv6.
5. `trusted_proxies()` returns `config('app.trusted_proxies')` as an array, or `[]`.
6. `config('app.x')` includes `app()->config_path('app.php')`, which is `<plugin>/config/app.php`. No
   filter, option, or constant can change the value.

### 3.2 What is correct

- The default trusts nothing.
- Forwarded headers are read only when `REMOTE_ADDR` is trusted.
- IPv4 and IPv6 CIDR ranges work.
- The chain is walked from the right, and trusted hops are dropped.
- The leftmost entry is never dropped.

---

## 4. Problems, with examples

All examples use this trust list, unless the example says something different:

```php
'trusted_proxies' => [
    '10.0.0.5',          // load balancer
    '10.0.1.0/24',       // internal proxy subnet
    '173.245.48.0/20',   // one Cloudflare range
],
```

### 4.1 Examples that work correctly

**A. Direct connection, attacker sends a fake XFF**

```
Client 203.0.113.7 ──► PHP
REMOTE_ADDR = 203.0.113.7
X-Forwarded-For: 1.2.3.4            (sent by the client)
```

`203.0.113.7` is not trusted, so `ip()` returns `203.0.113.7`. The header is not read. Correct.

**B. One load balancer**

```
Client 203.0.113.7 ──► LB 10.0.0.5 ──► PHP
REMOTE_ADDR = 10.0.0.5
X-Forwarded-For: 203.0.113.7        (added by the LB)
```

The chain is `[203.0.113.7]`, so the result is `203.0.113.7`. Correct.

**C. Fake XFF through the load balancer**

```
Client 198.51.100.9 ──► LB 10.0.0.5 ──► PHP
Client sends:   X-Forwarded-For: 1.2.3.4
LB forwards:    X-Forwarded-For: 1.2.3.4, 198.51.100.9
```

The rightmost entry `198.51.100.9` is not trusted, so the walk stops there. The result is `198.51.100.9`.
The fake value is ignored. Correct.

**D. Two proxies**

```
Client 203.0.113.7 ──► Proxy 10.0.1.20 ──► LB 10.0.0.5 ──► PHP
X-Forwarded-For: 203.0.113.7, 10.0.1.20
```

`10.0.1.20` is in `10.0.1.0/24`, so it is removed. The result is `203.0.113.7`. Correct.

**E. Cloudflare**

```
Client 203.0.113.7 ──► Cloudflare 173.245.48.10 ──► PHP
CF-Connecting-IP: 203.0.113.7       (set by Cloudflare, which replaces any value from the client)
```

`173.245.48.10` is trusted, and the CF header is set, so the result is `203.0.113.7`. Correct.

### 4.2 P1: a site cannot set the trust list

The trust list is read only from `<plugin>/config/app.php`:

- The Kirki eCommerce plugin does not ship that file, so the list is always empty.
- A store owner can create the file, but WordPress replaces the full plugin folder on update, so the file
  is deleted.
- There is no filter, option, or `wp-config.php` constant.
- Most store owners are not developers.

Result: on every site, `Request::ip()` always returns `REMOTE_ADDR`.

### 4.3 P2: behind a proxy, all guests share one limit

This follows from P1. When a proxy is in front of PHP and the server does not restore the client IP into
`REMOTE_ADDR` (for example, with nginx `real_ip` or Apache `mod_remoteip`):

```
Guest 1 ──┐
Guest 2 ──┼──► LB 10.0.0.5 ──► PHP      REMOTE_ADDR = 10.0.0.5 for every guest
Guest N ──┘
```

- All guests share one limit of 10 checkouts a minute. On a busy sale, real shoppers get HTTP 429.
- An attacker sends about 10 checkout requests a minute and blocks guest checkout for every visitor. This
  is a cheap denial of service.
- Behind Cloudflare, traffic comes from many edge IPs, so the guests are spread over several limits. The
  effect is smaller, but it does not go away.
- This is **not** a bypass. An attacker cannot spoof an IP here, because the headers are never read.

### 4.4 P3: `CF-Connecting-IP` is believed from any trusted proxy

```
Attacker 198.51.100.9 ──► LB 10.0.0.5 (not Cloudflare) ──► PHP
Attacker sends:  CF-Connecting-IP: 9.9.9.9   (a new random value on each request)
LB forwards the header without a change.
```

1. `REMOTE_ADDR` `10.0.0.5` is trusted.
2. `forwarded_ip()` finds `HTTP_CF_CONNECTING_IP` and returns `9.9.9.9`.
3. The `X-Forwarded-For` chain walk does not run.

Result: each request gets a new rate-limit key. The checkout limit has no effect. This is the attack that
the trust list is meant to stop. The header can be believed only when `REMOTE_ADDR` is a Cloudflare edge
address.

### 4.5 P4: `*` returns the client-controlled entry

Use the request from example C, with `'trusted_proxies' => ['*']`:

```
X-Forwarded-For: 1.2.3.4, 198.51.100.9
```

Every entry is "trusted", so the walk removes `198.51.100.9` and stops at one entry. The result is
`1.2.3.4`, which is the attacker's fake value. `*` is safe only when the proxy in front deletes the client's
`X-Forwarded-For`, and most proxies append to it.

### 4.6 P5: forwarded entries are not validated

The value that `forwarded_ip()` returns is used as it is. Examples of values that real proxies can send:

| Entry | Returned today | Expected |
|---|---|---|
| `203.0.113.7:51234` | `203.0.113.7:51234` | `203.0.113.7` |
| `[2001:db8::1]:443` | `[2001:db8::1]:443` | `2001:db8::1` |
| `unknown` | `unknown` | not used as an IP |
| `CF-Connecting-IP: garbage` | `garbage` | not used as an IP |

When the port changes for each connection, each request gets a new rate-limit key.

### 4.7 P6: plain-IP entries are compared as strings

Trust list `['2001:db8::1']`, and `REMOTE_ADDR` is `2001:0db8:0000:0000:0000:0000:0000:0001`.
`is_trusted_proxy()` returns `false`, because the strings are different. A CIDR entry (`2001:db8::1/128`)
matches, because it uses `inet_pton()`. The two forms must give the same result.

### 4.8 P7: IPv6 rotation bypasses the rate limiter

Most IPv6 connections get a full `/64` (2^64 addresses). `resolve_key()` uses the full address:

```
Request 1 from 2001:db8:abcd:12::1   → key sha1('2001:db8:abcd:12::1')
Request 2 from 2001:db8:abcd:12::2   → key sha1('2001:db8:abcd:12::2')   (new limit)
...
```

One client gets an unlimited number of limits. This happens on direct hosting too, with no proxy.

### 4.9 P8: `array_filter()` drops `"0"`

`array_filter()` with no callback removes entries that are falsy, which includes the string `"0"`. This has
no effect on real IPs. Use `static fn ($v) => $v !== ''` to make the intent clear.

---

## 5. Impact by hosting setup

| Setup | Today | After the fixes in section 7 |
|---|---|---|
| Direct hosting, or shared hosting with no proxy | Correct | Correct |
| A proxy that restores the client IP into `REMOTE_ADDR` (many managed hosts, `mod_remoteip`, nginx `real_ip`) | Correct | Correct |
| A load balancer that does not restore the IP | All guests share one limit (P2) | Correct, after the host adds the LB to the list |
| Cloudflare, and the host does not restore the IP | Guests share the edge-IP limits (P2) | Correct, after the site turns on the Cloudflare preset |
| Any setup with IPv6 clients | Bypass by rotation (P7) | Correct (keys grouped by `/64`) |

Public data (W3Techs, 2026): Cloudflare is the reverse proxy of about 25% of all websites, and of a larger
share of WordPress sites. Load balancers cannot be measured from outside. So P2 affects a real share of
stores.

---

## 6. How Laravel solves this

Laravel uses Symfony's `Request` class and adds the `TrustProxies` middleware. This section is from
knowledge of Laravel 11+ and Symfony 6/7. Check the details against their source before you copy them.

### 6.1 Configuration

```php
// bootstrap/app.php (Laravel 11+)
->withMiddleware(function (Middleware $middleware) {
    $middleware->trustProxies(at: ['10.0.0.0/8', '173.245.48.0/20']);
    $middleware->trustProxies(headers: Request::HEADER_X_FORWARDED_FOR
        | Request::HEADER_X_FORWARDED_HOST
        | Request::HEADER_X_FORWARDED_PORT
        | Request::HEADER_X_FORWARDED_PROTO);
})
```

- The default trusts no proxy.
- The list lives in the application's own code. The application belongs to its developer, so an update
  does not delete it. Laravel does not have problem P1.
- The developer chooses which headers to believe (a bit mask).

### 6.2 Algorithm (`Symfony\Component\HttpFoundation\Request::getClientIps()`)

1. If `REMOTE_ADDR` is not trusted, return `[REMOTE_ADDR]`.
2. Read only the headers in the allowed mask: `X-Forwarded-For`, or the RFC 7239 `Forwarded` header.
3. If both `Forwarded` and `X-Forwarded-For` are present and they disagree, throw
   `ConflictingHeadersException`.
4. Normalize each entry: remove the port, remove IPv6 brackets, and drop entries that are not valid IPs.
5. Walk from the right and drop each entry that `IpUtils::checkIp()` matches in the trust list.
6. If every entry is trusted, return the leftmost entry.

`IpUtils::checkIp()` handles plain IPs and CIDR ranges for IPv4 and IPv6, and caches the results.

### 6.3 The meaning of `*`

In Laravel, `trustProxies(at: '*')` trusts **only the current `REMOTE_ADDR`** (the direct peer). It does not
trust every address in the chain. For example C (`X-Forwarded-For: 1.2.3.4, 198.51.100.9`), Laravel returns
`198.51.100.9`, which is the real client. Our `*` returns `1.2.3.4`, which is the fake value (P4). This is
why Laravel Forge and Vapor tell developers to use `*` behind one load balancer.

Symfony also accepts the keywords `REMOTE_ADDR` and, in newer versions, `PRIVATE_SUBNETS` in the trust list.

### 6.4 Cloudflare

- Laravel does not read `CF-Connecting-IP`. It uses `X-Forwarded-For`, which Cloudflare also sets.
- Community packages (for example `monicahq/laravel-cloudflare`) download Cloudflare's published ranges,
  cache them, refresh them on a schedule (`php artisan cloudflare:reload`), and add them to the trust list.
- So the spoof in P3 cannot happen in Laravel: no special header skips the chain walk.

### 6.5 What Laravel does not solve

- IPv6 `/64` grouping (P7). The usual `Limit::perMinute(10)->by($request->user()?->id ?: $request->ip())`
  uses the full address.
- A safe place to store the list on a host that the application does not own. This is not a problem for
  Laravel, but it is the main problem for a WordPress plugin.

---

## 7. Proposed solution for `themeum/framework`

The aim: keep the safe default, give WordPress sites a supported place to set the list, and remove every
path that lets a client choose its own IP.

### 7.1 Sources for the trust list (fixes P1)

Merge these sources, in this order. Each source can only add entries:

1. `config('app.trusted_proxies')`: the application's own default (keep it for compatibility).
2. A `wp-config.php` constant. Its name comes from the application prefix, for example
   `<PREFIX>_TRUSTED_PROXIES`, where `<PREFIX>` comes from `app()->prefix()`. The value is an array or a
   comma-separated string.
3. A filter: `apply_filters( app()->prefix() . '_trusted_proxies', $proxies, $request )`.

Rules:

- Do not store the list in `wp_options` in the framework. An application can add a settings UI and feed
  the filter if it wants to.
- Never learn trusted IPs from requests (for example, by saving the `REMOTE_ADDR` of requests that carry
  proxy headers). An attacker could make their own IP "trusted".
- Read and normalize the list once for each request, and keep it in memory.

Why a constant: shop owners on shared hosting can usually edit `wp-config.php`, or ask their host to edit
it. Hosts already use `wp-config.php` for this type of setting. The constant is outside the plugin folder,
so an update does not delete it.

### 7.2 Keywords in the trust list (fixes P4)

| Entry | Meaning |
|---|---|
| `10.0.0.5`, `2001:db8::1` | One address (compared as binary, see 7.5) |
| `10.0.0.0/8`, `2001:db8::/32` | A CIDR range |
| `*` or `REMOTE_ADDR` | Trust the direct peer only (the current `REMOTE_ADDR`). Do not trust the other entries in the chain. This is the same as Laravel. |
| `PRIVATE_SUBNETS` | `127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.0.0/16`, `::1/128`, `fc00::/7`, `fe80::/10` |
| `CLOUDFLARE` | Cloudflare's published IPv4 and IPv6 ranges (see 7.3) |

Do not add a "trust every address" value. No case needs it, and it lets the client choose its IP.

### 7.3 Cloudflare preset (fixes P2 for Cloudflare sites, and P3)

1. Ship Cloudflare's ranges as a PHP array in the framework, from
   `https://www.cloudflare.com/ips-v4` and `https://www.cloudflare.com/ips-v6`.
2. Optional: refresh the ranges on a schedule with the framework's `Http` and `Cache` classes. If the fetch
   fails, keep the bundled list. Because sites are on WordPress.org, a remote call must be documented in
   the readme, so the bundled list must work alone, and the refresh can stay off by default.
3. Read `CF-Connecting-IP` **only** when `REMOTE_ADDR` is in the Cloudflare ranges. In all other cases,
   ignore the header and use the `X-Forwarded-For` chain walk.
4. Validate the `CF-Connecting-IP` value (7.4). If it is not valid, use the chain walk.

### 7.4 Normalize and validate every address (fixes P5, P8)

Apply this to `REMOTE_ADDR`, to each `X-Forwarded-For` entry, and to `CF-Connecting-IP`:

1. Trim the value.
2. Remove `[` and `]` around IPv6 addresses, and remove a `:port` suffix.
3. Validate with `filter_var($ip, FILTER_VALIDATE_IP)`.
4. Convert IPv4-mapped IPv6 (`::ffff:203.0.113.7`) to IPv4 (`203.0.113.7`).
5. Return the canonical text form (`inet_ntop(inet_pton($ip))`).

In the chain walk, an entry that is not valid ends the walk. Return the nearest valid address to its right
(or `REMOTE_ADDR`). Do not skip it and go further to the left, because entries to the left of a bad entry
cannot be trusted. Split the header with an explicit callback: `static fn ($v) => $v !== ''`.

### 7.5 Compare addresses as binary (fixes P6)

Treat a plain-IP entry as a full-length range (`/32` for IPv4, `/128` for IPv6). Compare `inet_pton()`
results for both plain and CIDR entries. Normalize the list once (7.1) so the comparison is cheap.

### 7.6 Group IPv6 keys in the rate limiter (fixes P7)

In `ThrottleRequests::resolve_key()`, when the caller is an IPv6 address, key by its `/64` network
(for example `2001:db8:abcd:12::/64`). Keep IPv4 keys as the full address. Do not change `Request::ip()`
itself; the grouping is only for the rate-limit key. A named limiter that uses `Limit::by($request->ip())`
gets the full address, so also give a helper, for example `Request::ip_key()` or `Limit::by_ip()`, that
returns the grouped value.

### 7.7 Optional: diagnostics for the application

Give a method, for example `Request::proxy_diagnosis()`, that returns `REMOTE_ADDR`, the proxy headers
present, whether `REMOTE_ADDR` is trusted, and whether it is in a Cloudflare or private range. An
application can use it in a WordPress Site Health check to warn: "Your site seems to be behind a proxy, but
no trusted proxy is set." It sends no data out.

### 7.8 Proposed algorithm (pseudocode)

```
ip():
    remote = normalize(REMOTE_ADDR)              // 7.4; null if invalid
    if remote is null: return null
    if not trusted(remote): return remote

    if in_cloudflare(remote) and header CF-Connecting-IP:
        cf = normalize(CF-Connecting-IP)
        if cf is not null: return cf

    chain = split(X-Forwarded-For)              // left → right
    if chain is empty: return remote

    result = remote
    for entry in reverse(chain):                // right → left
        ip = normalize(entry)
        if ip is null: return result            // bad entry ends the walk
        result = ip
        if not trusted_in_chain(ip): return ip  // first untrusted hop is the client
    return result                               // every hop trusted: leftmost valid entry

trusted(ip):          ip in expanded list, or (list has '*'/'REMOTE_ADDR' and ip == remote)
trusted_in_chain(ip): ip in expanded list   // '*'/'REMOTE_ADDR' do not apply to chain entries
```

### 7.9 Compatibility notes

- In the Kirki eCommerce plugin, `trusted_proxies` is not on the released branch (`origin/main`). Check
  whether the framework itself released it to other consumers.
- The change of `*` (from "trust everything" to "trust the direct peer") changes behavior for any site
  that already uses `*`. The new behavior is the safe one. Write it in the changelog.
- Sites with no trust list keep the same result (`REMOTE_ADDR`), except that the value is normalized.
- The IPv6 `/64` grouping changes the rate-limit keys, so counts start again after the update. The limits
  are short (minutes), so this is not a problem.

---

## 8. Site owner experience

Most shop owners are not developers. A fix that needs the owner to find and type IP addresses will not be
used. Also, Cloudflare changes its ranges from time to time, so a list that an owner types becomes old.
So the owner must never collect Cloudflare IPs. The software detects the setup, and the owner makes one
choice at most.

This section has two parts:
- **Framework:** detection data (7.7), the `CLOUDFLARE` keyword (7.2, 7.3), and the constant and filter
  (7.1).
- **Application** (for example Kirki eCommerce): the Site Health check, the notices, the settings UI, and
  the docs.

### 8.1 Detect Cloudflare from the socket address

`REMOTE_ADDR` comes from the TCP connection, so a client cannot fake it. The detection uses three inputs:
`REMOTE_ADDR`, whether `REMOTE_ADDR` is in Cloudflare's ranges, and whether `CF-Connecting-IP` is present.

| `REMOTE_ADDR` | `CF-Connecting-IP` | Meaning | Action |
|---|---|---|---|
| In Cloudflare's ranges | Present | Behind Cloudflare, and the host does not restore the visitor IP | Tell the owner (8.2) |
| Not in Cloudflare's ranges | Present | Behind Cloudflare, and the host already restores the IP (or a client sent a fake header) | Nothing to do |
| Not in Cloudflare's ranges | Absent | Not behind Cloudflare | Nothing to do |
| In Cloudflare's ranges, and the `CLOUDFLARE` preset is on | Present | Correct setup | Report "good" |

Rules:
- Run the detection on the owner's own admin requests. An admin request goes through the same network
  path as a shopper's request.
- The header alone proves nothing, because a client can send it. Only the socket address can prove that
  the request came through Cloudflare.
- Detection only shows information. It never adds entries to the trust list (see 7.1: never learn trust
  from requests).

### 8.2 Where to tell the owner

1. **WordPress Site Health check** (Tools → Site Health). This is the usual WordPress place for problems
   with the server setup. Status "recommended". Example text:

   > **Your store is behind Cloudflare, but Kirki eCommerce cannot see your shoppers' real IP addresses.**
   > Checkout and login limits count all shoppers together. During busy periods, this can block real
   > shoppers. Turn on Cloudflare support to fix this.
   > [Turn on Cloudflare support]

2. **A notice on the application's settings page.** Show it only while the problem exists, and let the
   owner dismiss it. Do not show a notice on every admin page.
3. **Docs.** A `docs/trusted-proxies.md` page and a readme FAQ entry: "My store uses Cloudflare. What do I
   need to do?"

### 8.3 What the owner does: three options

**Option A: one click (recommended for owners).** A "My site uses Cloudflare" switch in the application's
settings. When the switch is on, the application adds `CLOUDFLARE` to the list through the filter from 7.1.
The owner never sees an IP address. This is an application setting, not a framework one.

**Option B: one line in `wp-config.php`.** For hosts, developers, and owners who do not want a setting:

```php
define( 'KIRKI_ECOMMERCE_TRUSTED_PROXIES', 'CLOUDFLARE' );
```

The final constant name depends on open question 1. The notice gives a "Copy" button for the line and
says: "If you cannot edit this file, send this line to your host."

**Option C: the host restores the IP on the server.** Cloudflare documents this ("Restoring original
visitor IPs"), with nginx `real_ip` or Apache `mod_remoteip`. After that, `REMOTE_ADDR` is the visitor, the
framework needs no setup, and other plugins (security, spam filters) also get the correct IP. Give the owner
a message to send to the host:

> My site uses Cloudflare. Please restore the original visitor IP into `REMOTE_ADDR` (with mod_remoteip,
> or nginx real_ip with `CF-Connecting-IP`), as Cloudflare's documentation describes.

Recommendation: Option A in the UI, with Options B and C in the docs.

### 8.4 Load balancers and other proxies

A load balancer cannot be detected reliably. A private `REMOTE_ADDR` together with an `X-Forwarded-For`
header is a hint, but it is not proof. There are also no public ranges to ship. So:

- Show a softer Site Health message: "Your site seems to be behind a proxy or load balancer. Kirki eCommerce
  may see one IP address for all shoppers."
- Tell the owner to ask the host for the load balancer's IP or subnet, then add it with Option B (for
  example `define( 'KIRKI_ECOMMERCE_TRUSTED_PROXIES', '10.0.0.0/24' );`), or ask the host for Option C.
- Give a message to send to the host:

  > Kirki eCommerce needs the IP address or subnet of the proxy or load balancer in front of my site, so
  > that it can read the real visitor IP from `X-Forwarded-For`. Can you send it to me, or restore the
  > visitor IP into `REMOTE_ADDR`?

Do not offer a free-text IP field in the settings UI for this. A wrong entry (for example `0.0.0.0/0`) lets
every client spoof its IP. Keep custom entries in `wp-config.php` or the filter, where a host or developer
sets them.

### 8.5 Possible later step: turn on Cloudflare support automatically

The detection in 8.1 uses the socket address, so the framework could trust the `CLOUDFLARE` ranges with no
owner action. Before you choose this, check one thing: can a client send a request through Cloudflare (for
example through its own Cloudflare zone that points at the victim's origin IP, or through a Cloudflare
Worker) with a `CF-Connecting-IP` value that the client chooses? The reporter does not know of such a way,
but did not verify it.

This would also change how rate limiting works for existing sites that did not change a setting. So for
the first release, keep it opt-in (Options A–C), and decide on automatic trust later.

---

## 9. Test cases (acceptance criteria)

`R` = `REMOTE_ADDR`, `XFF` = `X-Forwarded-For`, `CF` = `CF-Connecting-IP`.
Trust list `L1` = `['10.0.0.5', '10.0.1.0/24']`. `L2` = `['CLOUDFLARE']`. `L3` = `['*']`.

| # | List | R | Headers | Expected `ip()` |
|---|---|---|---|---|
| 1 | none | `203.0.113.7` | `XFF: 1.2.3.4` | `203.0.113.7` |
| 2 | none | `203.0.113.7` | `CF: 1.2.3.4` | `203.0.113.7` |
| 3 | L1 | `10.0.0.5` | `XFF: 203.0.113.7` | `203.0.113.7` |
| 4 | L1 | `10.0.0.5` | `XFF: 1.2.3.4, 198.51.100.9` | `198.51.100.9` |
| 5 | L1 | `10.0.0.5` | `XFF: 203.0.113.7, 10.0.1.20` | `203.0.113.7` |
| 6 | L1 | `10.0.0.5` | `CF: 9.9.9.9`, `XFF: 198.51.100.9` | `198.51.100.9` (CF ignored, P3) |
| 7 | L1 | `10.0.0.5` | none | `10.0.0.5` |
| 8 | L2 | `173.245.48.10` | `CF: 203.0.113.7` | `203.0.113.7` |
| 9 | L2 | `173.245.48.10` | `CF: garbage`, `XFF: 203.0.113.7` | `203.0.113.7` |
| 10 | L2 | `198.51.100.9` (origin hit directly) | `CF: 9.9.9.9` | `198.51.100.9` |
| 11 | L3 | `10.0.0.5` | `XFF: 1.2.3.4, 198.51.100.9` | `198.51.100.9` (P4) |
| 12 | L3 | `10.0.0.5` | `XFF: 203.0.113.7` | `203.0.113.7` |
| 13 | L1 | `10.0.0.5` | `XFF: 203.0.113.7:51234` | `203.0.113.7` |
| 14 | L1 | `10.0.0.5` | `XFF: [2001:db8::1]:443` | `2001:db8::1` |
| 15 | L1 | `10.0.0.5` | `XFF: 1.2.3.4, unknown` | `10.0.0.5` (bad entry ends the walk) |
| 16 | `['2001:db8::1']` | `2001:0db8:0:0:0:0:0:1` | `XFF: 203.0.113.7` | `203.0.113.7` (P6) |
| 17 | none | `::ffff:203.0.113.7` | none | `203.0.113.7` |
| 18 | L1, from constant only | `10.0.0.5` | `XFF: 203.0.113.7` | `203.0.113.7` (P1) |
| 19 | L1, from filter only | `10.0.0.5` | `XFF: 203.0.113.7` | `203.0.113.7` (P1) |

Rate-limit key tests (P7):

| # | Caller | Expected key input |
|---|---|---|
| 20 | `2001:db8:abcd:12::1` and `2001:db8:abcd:12::2` | the same key (`2001:db8:abcd:12::/64`) |
| 21 | `2001:db8:abcd:12::1` and `2001:db8:abcd:13::1` | different keys |
| 22 | `203.0.113.7` and `203.0.113.8` | different keys |
| 23 | a logged-in user | the user ID; the IP is not used |

---

## 10. Out of scope

- The RFC 7239 `Forwarded` header. Few WordPress hosts send it. Add it later if a host needs it, with
  Symfony's conflict check.
- `X-Forwarded-Host`, `-Proto`, and `-Port`. WordPress handles HTTPS detection in its own way.
- Botnets and residential proxy networks. Every per-IP limiter has this limit.
- A settings UI. That belongs to each application, which can feed the filter in 7.1.

---

## 11. Open questions

1. **Constant name.** Use a name for each application (`<PREFIX>_TRUSTED_PROXIES`), or one shared name for
   all framework applications on the same site? A shared name lets a host set it once, but two plugins with
   different framework versions could read it in different ways.
2. **Cloudflare refresh.** Ship the bundled list only, or also refresh it from Cloudflare? A refresh is a
   remote call that must be documented for WordPress.org.
3. **`PRIVATE_SUBNETS` by default.** Many hosts put a proxy on a private address. Trusting private ranges
   by default would fix P2 for them with no setup, but on a host where other tenants share the private
   network, a tenant could spoof the IP. The proposal is to keep it opt-in.
4. **IPv6 prefix length.** `/64` is the common value. Should an application be able to change it (for
   example to `/56`)?

---

## 12. Where this differs from Laravel

| Topic | Laravel / Symfony | This proposal |
|---|---|---|
| Where the list lives | Application code | Config default + `wp-config.php` constant + filter |
| `*` | Direct peer only | Direct peer only (the same) |
| `Forwarded` (RFC 7239) | Supported, with a conflict check | Not supported (section 10) |
| `X-Forwarded-Host/Proto/Port` | Supported, by header mask | Not supported |
| Header mask | The developer chooses | Fixed: `X-Forwarded-For`, plus `CF-Connecting-IP` from Cloudflare only |
| `CF-Connecting-IP` | Not read | Read only from Cloudflare ranges |
| Cloudflare ranges | Community package | Built in (`CLOUDFLARE` keyword) |
| Invalid chain entry | Dropped, and the walk goes on | Ends the walk (stricter) |
| IPv6 `/64` rate-limit keys | Not grouped | Grouped |
| Diagnostics | None | Optional `proxy_diagnosis()`, used by a Site Health check (section 8) |

Laravel's list of trusted proxies lives in code that the developer owns. A WordPress plugin runs on sites
that its developer does not own, so this proposal adds the `wp-config.php` constant and the filter.
Laravel's `Forwarded` and host/proto/port support is a real gap in this proposal, not an improvement.
