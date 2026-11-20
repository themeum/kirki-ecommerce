## Purpose

Gives the merchant app one toast for short feedback messages: the result of a save, a warning, or an error. It has a countdown that the merchant can pause and optional Undo and Retry actions.

## ADDED Requirements

### Requirement: Toast variants and content

The merchant app SHALL show a toast in one of 4 variants: `success`, `info`, `warning`, or `error`. A toast SHALL have a title and MAY have a description. The title SHALL show at most 2 lines and the description at most 3 lines. Text that is longer SHALL end with an ellipsis. A long word or URL with no spaces SHALL break so that it stays inside the toast.

#### Scenario: Title and description

- **WHEN** a feature shows a success toast with the title "Brand saved" and the description "Adventure is now live."
- **THEN** the toast shows the title, and the description below it

#### Scenario: Title only

- **WHEN** a feature shows an info toast with a title and no description
- **THEN** the toast shows only the title, and no empty line for a description

#### Scenario: Long text is clamped

- **WHEN** a toast title needs 4 lines and its description needs 6 lines
- **THEN** the title shows 2 lines and the description shows 3 lines, each ending with an ellipsis

### Requirement: Toast layout and colours

A toast SHALL be 330 px wide, and its height SHALL fit its content. The left icon SHALL be a 22.5 px glyph on a 31.5 px round badge in a 36 px slot. The right close button SHALL be 24 px. Both SHALL be centred vertically in the toast. The variant colour SHALL be used only on the icon, its badge tint, the loading spinner, and the countdown ring. The background, the title colour, the description colour, and the close button colour SHALL be the same for all 4 variants. All colours, spacing, radii, shadows, and type styles SHALL come from the app theme.

#### Scenario: Icon per variant

- **WHEN** a feature shows a toast of each variant
- **THEN** success shows a filled circle with a check, info shows a filled circle with an "i", warning shows a filled triangle with an "!", and error shows a filled circle with an "!", each in the theme icon colour for that variant, on a round badge with the light tint of that variant

#### Scenario: Same surface for all variants

- **WHEN** a success toast and an error toast show at the same time
- **THEN** both have the same background, title colour, and description colour. Only their icons have different colours

#### Scenario: Icon and close button centred

- **WHEN** a toast has a title on 2 lines and a description on 3 lines
- **THEN** the icon and the close button stay centred vertically in the toast

### Requirement: Auto-dismiss duration

A toast that closes by itself SHALL stay visible for a duration that comes from its variant and its word count. The word count is the number of words in the title and the description together.

| Toast | Default | Maximum |
|---|---|---|
| success | 4 s | 6 s |
| info | 5 s | 8 s |
| warning | 7 s | 10 s |
| error | 20 s | 20 s |
| any toast with Undo, except error | 8 s | 10 s |

The duration SHALL be max(default, 1.5 s + 0.25 s × word count), and it SHALL NOT be more than the maximum. An error toast SHALL close after 20 s, also when it has Undo. When a feature gives a duration, the toast SHALL use that exact duration for any variant, and SHALL NOT clamp it.

#### Scenario: Short success message

- **WHEN** a feature shows a success toast with 3 words
- **THEN** the toast closes after 4 s

#### Scenario: Longer info message

- **WHEN** a feature shows an info toast with 20 words
- **THEN** the toast closes after 6.5 s (1.5 s + 20 × 0.25 s)

#### Scenario: Very long warning is capped

- **WHEN** a feature shows a warning toast with 60 words
- **THEN** the toast closes after 10 s

#### Scenario: Error closes after 20 s

- **WHEN** a feature shows an error toast and gives no duration
- **THEN** the toast closes after 20 s

#### Scenario: Explicit duration is used exactly

- **WHEN** a feature shows a success toast with a duration of 2000 ms
- **THEN** the toast closes after 2 s

### Requirement: Close button and countdown ring

Each toast that is not loading SHALL have a close button. A click on the close button SHALL close that toast at once. When the toast has a running auto-dismiss timer, a circular ring around the close button SHALL show the time left, from 100% to 0%, and the ring SHALL get shorter in the anticlockwise direction. The ring SHALL use the variant colour on a neutral track. A toast with no timer SHALL show the close button with no ring.

#### Scenario: Ring counts down

- **WHEN** a success toast with a 4 s duration has been visible for 2 s with no pause
- **THEN** the ring shows 50% of the circle, and the part that has gone is the part that the anticlockwise sweep has passed

#### Scenario: Close at once

- **WHEN** the merchant clicks the close button while 3 s are left
- **THEN** the toast closes at once

#### Scenario: Error close button has a ring

- **WHEN** an error toast shows
- **THEN** it shows a close button with a countdown ring for its 20 s

### Requirement: Loading state

Each variant SHALL have a loading state. In the loading state, a spinner in the variant colour SHALL replace the icon, the toast SHALL NOT show a close button, and the toast SHALL NOT close by itself. When the loading state ends and the toast closes by itself, its timer SHALL start from the full duration for its new content. When the merchant asks the system to reduce motion, the spinner SHALL NOT turn and SHALL show a slow pulse instead.

#### Scenario: Loading toast

- **WHEN** a feature shows an info toast in the loading state
- **THEN** the toast shows a spinner in the info colour, shows no close button, and stays visible

#### Scenario: Loading ends in success

- **WHEN** a feature changes a loading toast to a success toast that is not loading
- **THEN** the same toast shows the success icon, the close button, and a full ring, and closes after its success duration

#### Scenario: Reduced motion

- **WHEN** the operating system asks for reduced motion and a loading toast shows
- **THEN** the spinner pulses and does not turn

### Requirement: Pause and resume

All visible toast timers SHALL pause only while the mouse pointer is on the toast stack. Keyboard focus, a touch, and a hidden browser tab SHALL NOT pause the timers. While the timers pause, each countdown ring SHALL stop where it is. When the pointer moves off the stack, or the toast under the pointer closes and the pointer moves to a point that is not on the stack, each timer SHALL continue with the time it had left.

#### Scenario: Hover pauses all toasts

- **WHEN** a success toast with 3 s left and an info toast with 4 s left show, and the merchant moves the pointer onto the success toast for 10 s, then moves it off the stack
- **THEN** neither toast closes during the 10 s, both rings stop, and after the pointer leaves, the toasts close 3 s and 4 s later

#### Scenario: Closing the hovered toast does not stop the others

- **WHEN** the merchant clicks the close button of a toast, and then moves the pointer to a point that is not on the stack
- **THEN** the timers of the other toasts continue

#### Scenario: Keyboard focus does not pause

- **WHEN** the merchant moves keyboard focus onto a toast's close button and the pointer is not on the stack
- **THEN** the toast timers continue

### Requirement: Undo action

A feature SHALL be able to add an Undo action to a toast of any variant. The toast SHALL show an "Undo" button. A click on it SHALL run the feature's undo callback and SHALL close the toast at once. A toast with Undo that closes by itself SHALL use the Undo duration from the duration requirement.

#### Scenario: Undo a delete

- **WHEN** a feature shows a success toast "Brand deleted" with an Undo action, and the merchant clicks "Undo"
- **THEN** the undo callback runs once and the toast closes at once

#### Scenario: Undo timing

- **WHEN** a feature shows a success toast with 3 words and an Undo action
- **THEN** the toast closes after 8 s

### Requirement: Retry action

A feature SHALL be able to add a Retry action to a toast of any variant. The toast SHALL show a "Retry" button. A click on it SHALL run the feature's retry callback. When the callback gives back a Promise, the same toast SHALL go into its loading state until the Promise ends. When the Promise resolves, the toast SHALL show the success content that the feature gave, or SHALL close when the feature gave none. When the Promise rejects, the toast SHALL go back to the content it had before the click, with the Retry button. When the callback gives back no Promise, the toast SHALL close at once.

#### Scenario: Retry succeeds

- **WHEN** an error toast "Save failed" has a Retry action with success content "Brand saved", and the retry Promise resolves
- **THEN** the same toast shows a spinner while the Promise runs, then shows the success toast "Brand saved", which closes by itself

#### Scenario: Retry fails again

- **WHEN** the retry Promise rejects
- **THEN** the same toast shows "Save failed" again, with the Retry button

#### Scenario: Retry with no Promise

- **WHEN** the retry callback gives back no Promise
- **THEN** the callback runs once and the toast closes

### Requirement: Toast API

The merchant app SHALL give features one toast API. A feature SHALL be able to:

- show a toast of a variant, with optional description, duration, loading state, Undo, and Retry, and get back its id;
- change a visible toast by its id (variant, content, loading state, actions), and the toast SHALL change in its place in the stack and SHALL NOT show a second toast;
- close one toast by its id, or close all toasts;
- show a toast for a Promise: a loading toast while the Promise runs, then success content when it resolves or error content when it rejects. The success and error content MAY come from the result or the error.

Features SHALL NOT show toasts through any other API. The shared mutation helpers SHALL show their success and error messages through this API.

#### Scenario: Change a toast in place

- **WHEN** a feature shows a loading info toast "Importing products", then changes it by its id to a success toast "240 products imported"
- **THEN** only one toast shows, and it changes from loading to success in the same place in the stack

#### Scenario: Promise toast

- **WHEN** a feature shows a Promise toast with loading content "Saving brand" and error content that uses the error message, and the Promise rejects with "Name is taken"
- **THEN** a loading toast "Saving brand" shows, then it becomes an error toast "Name is taken" that closes after 20 s

#### Scenario: Mutation error helper

- **WHEN** a mutation fails and the feature calls the shared mutation error helper
- **THEN** an error toast with the error message shows in the new design

#### Scenario: Legacy dispatch without duration

- **WHEN** a feature calls the legacy dispatch helper with a success title and no duration
- **THEN** the success toast uses the duration rule, not a 2 s duration

### Requirement: Stacking and position

Toasts SHALL show at the bottom right of the screen. On a screen that is 600 px wide or less, toasts SHALL show at the bottom centre. Toasts SHALL show above the WordPress admin bar and app dialogs. Toasts SHALL stack, expand on hover, close with a swipe, and leave with the same motion as the merchant app had before this change.

#### Scenario: Several toasts stack

- **WHEN** a feature shows 3 toasts quickly
- **THEN** they stack at the bottom right as before, and the stack expands when the pointer is on it

#### Scenario: Bottom centre on a small screen

- **WHEN** the screen is 600 px wide or less and a toast shows
- **THEN** the toast shows at the bottom centre of the screen, and it is not wider than the screen minus the side gutters

#### Scenario: Toast over a dialog

- **WHEN** a dialog is open and a toast shows
- **THEN** the toast is above the dialog overlay and the merchant can click its close button

### Requirement: Accessible toasts

An error toast SHALL be announced to screen readers at once (assertive). The other variants SHALL be announced politely. The close button SHALL have the accessible name "Close notification". The Undo and Retry buttons SHALL have their visible text as their names. The icon and the countdown ring SHALL be hidden from screen readers. All visible text in the toast that the app adds SHALL be translatable.

#### Scenario: Error announced

- **WHEN** an error toast shows
- **THEN** a screen reader announces its title and description at once

#### Scenario: Close button name

- **WHEN** a screen reader user moves to a toast's close button
- **THEN** the screen reader reads "Close notification"
