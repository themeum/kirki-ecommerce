## Context

See proposal.md - Why. The requirements are in
`specs/store-onboarding-wizard/spec.md`.

Current state:

- `useSampleDataImport` (`features/home/hooks/use-sample-data-import.ts`) is shared by
  the onboarding completion screen and the home setup checklist. It returns
  `phase`, `progress`, `start` and `isImporting`.
- `start()` runs a 2.5 second timer to 70% ("downloading") with no request. Then it
  sends `POST /onboarding/sample-data` and moves toward 95% ("creating").
- `SampleDataLink` (onboarding) ignores `progress` and shows a `Spinner`.
  `SampleDataProgress` (home) draws a 3 px bar along the bottom of the button.
- `components/ui/progressbar.tsx` is a draggable slider (`role="slider"`, thumb,
  mouse handlers). It is not a progress indicator.
- One request does all the work (JSON, images, records). The server sends no
  progress.

## Goals / Non-Goals

**Goals:**

- One time-based progress curve in the shared hook, used by both screens.
- The request starts on the click.
- The onboarding screen shows a progress bar like the design image: a short track
  with a brand fill, and the phase text below it.

**Non-Goals:**

- Measured progress from the server (polling, streaming, or a split endpoint). The
  user chose one request.
- A change to the home checklist layout. Only its timing and text change.
- A shared `components/ui` progress component. There are two users only, with
  different layouts.

## Decisions

### 1. Time-based curve with a cap per phase

The client cannot know when the download ends, so the hook uses elapsed time `t`
from the click, with `T = 10 000 ms`:

```
download (t < T):  progress = 95 * (1 - (1 - t/T)^3)      ease-out cubic, 95 at t = T
create   (t >= T): each tick: progress += (99 - progress) * 0.02   creep, never 99
success:           progress = 100, phase = 'done'
failure:           progress = 0,   phase = 'idle'
```

- The phase comes from the time, not from the server. At `t = T`, `phase` changes
  from `'downloading'` to `'creating'`.
- A response before `T` goes from `'downloading'` to `'done'` at once.
- The creep with a rate of 0.02 for each 100 ms tick gets to about 98.5% after 10 more
  seconds, so the bar keeps moving on a slow host.
- The hook keeps the existing 100 ms `setInterval` tick and the existing `done` pause
  of 1 second before `onLoaded`.

Alternatives considered:

- **Linear to 95%:** the bar looks slow at the start, and stops abruptly at 95%.
- **Pure asymptote (NProgress):** it never reaches 95%, so the label change needs a
  separate timer. The cubic ease-out reaches 95% at `T` exactly.
- **Real phases with two requests, or polling:** more accurate. The user rejected
  this during grilling, to keep the backend unchanged.

### 2. The request starts on the click

`start()` calls `importSampleData()` and starts the tick at the same time. The tick
stops when the request ends. This removes the 2.5 seconds of waiting that the old
timer added before the request.

### 3. The buttons use `isImporting`

`isImporting` is `phase === 'downloading' || phase === 'creating'`. It is `false` at
`'done'`, so the buttons become enabled when the bar shows 100%, as the user chose.
`OnboardingWizard` passes `sampleData.isImporting` to `SetupCompleteStep` as a new
`isActionDisabled` prop. The prop disables "Add your first product" and "Go to
Dashboard" in the `'default'` footer only. The other footers do not show the link.

### 4. The onboarding bar in `SampleDataLink`

- `SampleDataLink` gets a `progress` prop. For a phase that is not `'idle'`, it shows
  a column: a track of 160 px × 4 px with a full radius and a fill of
  `theme.colors.background.fillBrand`, and below it the phase text (`small`,
  `subdued`).
- The track has `role="progressbar"`, `aria-valuemin={0}`, `aria-valuemax={100}`,
  `aria-valuenow` (rounded) and `aria-valuetext` (the phase text).
- The fill width is a dynamic CSS variable, set through the `style` prop, as
  `SampleDataProgress` does. `transition: width 0.1s linear` makes the jump to 100%
  smooth.
- At `'done'`, the bar shows 100% with the last phase text.
- The root gets a `minHeight` that fits the bar and the text. Thus the link and the
  bar take the same height, and the card does not move when the state changes.

### 5. Text

The `'creating'` text is "Creating product sample..." in `SampleDataLink` and in
`SampleDataProgress`. "Creating products..." is no longer used.

## Risks / Trade-offs

- [The phase text can be wrong. On a fast host the server can create records while
  the bar shows "Downloading...". On a slow host it can still download while the bar
  shows "Creating..."] → This is the trade-off of one request, and the user accepted
  it. The docs say that the progress is time-based.
- [On a very slow host the bar waits near 99% for a long time] → The creep never
  stops. The request has its own server timeouts (15 s for each image), so the wait
  is limited.
- [A fast response jumps from about 40% to 100%] → The jump is the normal behavior
  of this pattern. The 0.1 s transition makes it smooth.

## Correction during implementation

After the first implementation, the user changed the plan:

- **One phase, not two.** The 95% / 5% split and the "Creating product sample..."
  text are removed. The hook phases are `'idle' | 'downloading' | 'done'`, and
  `isImporting` is `phase === 'downloading'`. The bar covers the whole import, the
  download and the record creation.
- **One text:** "Downloading sample data..." on the onboarding screen and on the home
  checklist. It replaces "Downloading product sample..." and "Creating products...".
  `SampleDataProgress` no longer takes a `phase` prop.
- **The curve does not change** (Decision 1): ease-out to 95% in 10 s, then the creep
  toward 99%, then 100% on success. At 10 s only the curve changes, and the text
  stays the same.
- **The onboarding bar is 80 px wide**, not 160 px, and stays centered below the card.

Decisions 1, 3, 4 and 5 above describe the first version where they name the
`'creating'` phase, the second text or the 160 px width. This note replaces them.
The risk about a wrong phase text no longer applies.
