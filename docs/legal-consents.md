# Legal Consents

Consent statements a merchant defines once and the storefront honours everywhere
they apply — terms acceptance at checkout, a marketing opt-in, a plain legal
notice. A consent carries its own message, the places it appears, and how
strictly it is enforced. Messages can link to your store's pages through tokens
like `{privacy_policy}`, which resolve to a real link when the page is published.

Consents are **enforced but not recorded**. Section 6 is explicit about what that
does and does not give you; read it before treating this as an audit trail.

- [1. Quick start](#1-quick-start)
- [2. Consent methods](#2-consent-methods)
- [3. Page tokens](#3-page-tokens)
- [4. Where consents appear](#4-where-consents-appear)
- [5. How enforcement works](#5-how-enforcement-works)
- [6. What is and is not recorded](#6-what-is-and-is-not-recorded)
- [7. Requirements and limitations](#7-requirements-and-limitations)
- [8. How it is stored](#8-how-it-is-stored)
- [9. Where this differs from a consent-management platform](#9-where-this-differs-from-a-consent-management-platform)

---

## 1. Quick start

Go to **Settings → Legal** and press **Add**. A consent needs four things:

| Field | What it does |
|---|---|
| **Consent Title** | Identifies the consent in the admin list. Customers never see it. |
| **Display on** | One or more of Signup page, Login page, Checkout. At least one is required. |
| **Consent Message** | The text the customer reads. Use the **+** button to insert a page link. |
| **Consent Method** | Whether the customer must tick a box, may tick one, or only reads the text. |

Every action on this page saves immediately — creating, editing, toggling and
deleting. There is no separate Save button, and no unsaved state to lose.

Hovering a row reveals its delete, edit and enable/disable controls. A disabled
consent stays visibly dimmed with a **Disabled** badge when you are not hovering
it, so you can tell at a glance which consents are live.

Deleting asks for confirmation and then offers a five-second undo.

## 2. Consent methods

| Method | What the customer sees | What it enforces |
|---|---|---|
| **Mandatory Checkbox** | A checkbox marked with a red `*` | The action cannot complete until it is ticked |
| **Optional Checkbox** | A checkbox | Nothing. The customer may leave it unticked |
| **Display Text Only** | The message, no control | Nothing |

Only **Mandatory Checkbox** blocks anything. The other two are informational.

See [section 6](#6-what-is-and-is-not-recorded) before choosing **Optional
Checkbox** for a marketing opt-in — the answer is not stored anywhere yet.

## 3. Page tokens

Write `{privacy_policy}` in a consent message and it renders as a link to the
published page whose slug is `privacy-policy`, using that page's title as the
link text. Underscores in the token map to dashes in the slug.

Rather than typing tokens, press the **+** button at the bottom right of the
Consent Message box. It lists your published pages; picking one inserts its token
at the cursor — or at the end of the message if you have not placed a cursor.

Merchant-typed HTML is always escaped. If you type `<b>bold</b>` into a message,
the customer sees those tags as literal text; only tokens produce markup.

### When a token does not resolve

A token renders as **plain readable text** — `{privacy_policy}` becomes
`Privacy Policy` — when no published page matches its slug. That happens if the
page is deleted, moved to draft, or has its permalink renamed.

This degrades silently and on purpose: the customer never sees a raw `{token}` or
a link with no destination. But it also means a renamed permalink quietly turns a
link into flat text. **If a consent's link stops working, check the page's slug
first.** Only published pages resolve; drafts and private pages count as
unresolved.

## 4. Where consents appear

| Location | Where it renders |
|---|---|
| **Checkout** | Directly above the Place Order button |
| **Signup page** | WordPress's registration form at `wp-login.php?action=register` |
| **Login page** | WordPress's login form at `wp-login.php` |

Signup and login consents attach to WordPress's own forms — this plugin does not
ship its own login or registration pages. They inherit `wp-login.php` styling
rather than your storefront theme.

A location with no enabled consents renders nothing at all: no heading, no empty
container.

## 5. How enforcement works

A mandatory consent is checked twice: in the browser, so the customer gets an
immediate inline message, and again on the server, so a request that skips the
interface is rejected the same way.

At checkout the customer sees the error inline above the Place Order button, and
the page scrolls to it. No order is created.

At the login form, an incorrect password is always reported as an incorrect
password — the consent check runs after the credentials are settled, so it never
masks a real sign-in failure.

**Consent applies to shoppers, not staff.** An order a merchant creates through
the admin is never blocked by a consent requirement, since no shopper is present
to accept one.

## 6. What is and is not recorded

**Nothing is recorded.** There is no per-customer or per-order record of anyone
having accepted a consent, and none is planned in this version.

Acceptance is treated purely as a precondition of the action in progress and is
discarded once that action completes. Concretely:

- A completed order stores no consent data.
- A registered customer stores no consent data.
- There is no way to look up who accepted what, or when.
- **An Optional Checkbox answer goes nowhere.** A marketing opt-in renders and is
  accepted, but the customer's answer is not saved — so it cannot currently feed
  a mailing list. Use it as a disclosure, not as a subscription mechanism.

If you need an audit trail for a compliance regime, this feature does not provide
one. It makes acceptance a condition of proceeding; it does not prove acceptance
after the fact.

## 7. Requirements and limitations

**Signup consents need registration enabled.** WordPress only serves its
registration form when *Anyone can register* is on in **Settings → General**.
With it off, a signup consent is saved but never displayed. The Legal page warns
you when this applies.

**Registration coverage is not total.** The registration check runs through
WordPress's standard registration flow. It does **not** cover multisite
`wp-signup.php`, accounts created programmatically, accounts created through the
plugin's own admin, or third-party registration forms and membership plugins.
Customers created during checkout are not registrations and are not covered.

**Login consents apply to the login form only.** Authentication by other means —
REST application passwords, XML-RPC, programmatic sign-in, SSO plugins — is
deliberately untouched, so that a mandatory consent cannot lock you out of your
own API.

**Concurrent edits overwrite.** Consents are saved as one list. Two administrators
editing the Legal page at the same time will overwrite each other's changes; the
last save wins.

## 8. How it is stored

Consents live in the `legal` settings group as a single option row, read and
written through the generic settings endpoints:

```
GET  /kirki/ecommerce/v1/settings/legal
PUT  /kirki/ecommerce/v1/settings     { "key": "legal", "data": { "consents": [...] } }
```

Each consent is `{ id, title, locations[], message, method, is_enabled }`. Every
write sends the whole list — that is what makes deletion possible, and it is why
concurrent edits overwrite rather than merge.

Server-side rendering and enforcement both go through
`App\Services\LegalConsentService`: `get_renderable($location)` returns the
consents to display with their messages already escaped and tokens resolved, and
`get_mandatory_ids($location)` backs the enforcement checks. Consumers never read
the settings blob directly.

## 9. Where this differs from a consent-management platform

Being honest about the gaps, so nothing here is assumed:

- **No audit trail.** Nothing records who accepted what, or when. See
  [section 6](#6-what-is-and-is-not-recorded).
- **No consent versioning.** Editing a message changes it everywhere at once.
  There is no history of previous wording, and no way to know which version a
  customer saw.
- **No re-consent.** Changing a consent does not prompt customers who already
  proceeded under the old wording.
- **No per-customer export or withdrawal.** There is nothing to export, and no
  mechanism for a customer to withdraw a consent after the fact.
- **No proof of acceptance.** Enforcement stops an action from completing; it
  does not produce evidence that acceptance occurred.
- **No geographic or conditional targeting.** A consent shows at every location
  it lists, for every visitor. There is no per-region or per-product rule.
- **No cookie banner or script gating.** This feature renders consent text and
  gates form submissions. It does not block cookies, scripts or trackers.

If your compliance requirement is record-keeping rather than gating, treat this
as a starting point rather than a solution.
