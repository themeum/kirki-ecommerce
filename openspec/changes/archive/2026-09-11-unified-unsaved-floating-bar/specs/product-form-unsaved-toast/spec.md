## REMOVED Requirements

### Requirement: Toast appears when in-app navigation is blocked on a dirty form

**Reason**: The bar no longer waits for a navigation attempt. It is shown for as long as the form
has unsaved changes, so a merchant is told about unsaved work before they try to leave rather than
only once they are stopped. Blocked navigation now shakes the already-visible bar.

**Migration**: Replaced by "The bar is visible whenever the screen has unsaved work" and "Blocked
navigation shakes the bar" in `unsaved-changes-floating-bar`.

### Requirement: Toast provides Cancel and Save actions

**Reason**: The destructive action is now labelled Discard and it both reverts the form and
completes the blocked navigation, rather than merely dismissing the toast and leaving the merchant
where they were. A bar that is always visible while dirty has nothing to "dismiss" — dismissing it
would only hide the one affordance the merchant needs.

**Migration**: Replaced by "The bar offers Discard and Save" in `unsaved-changes-floating-bar`. The
scenario "Cancel dismisses the toast only" has no successor: there is no dismiss-without-reverting
action.

### Requirement: Toast visibility follows dirty state

**Reason**: Visibility is now a per-screen choice rather than one fixed rule, so that the settings
panel — which has no header Save — can show the bar on first edit while the product form keeps
showing it only when leaving is refused. The requirement also asserted that a repeated blocked
navigation produces "no visible re-animation", which is now the opposite of the intended behaviour.

**Migration**: Replaced by "A guarded screen chooses when the bar is visible" and the
"Trying again shakes again" scenario in `unsaved-changes-floating-bar`. The product form's own
behaviour is unchanged; it is now stated as one of the two modes.

### Requirement: Toast does not cover reload or external navigation

**Reason**: Unchanged in substance, but restated for every guarded screen rather than for the
product form's toast alone.

**Migration**: Replaced by "Leaving the application still uses the browser's own prompt" in
`unsaved-changes-floating-bar`.
