## Purpose

Defines the docblock every PHP declaration in `app/` and `database/` carries, so a developer can learn what a class, method or property is for, what it accepts and returns, and which release introduced it, without reading its body.

## ADDED Requirements

### Requirement: Every declaration has a docblock

Every class, interface, trait, method, function and property declared in `app/**/*.php` and `database/**/*.php` SHALL have a docblock, regardless of visibility. Class constants, closures, and files under `vendor/libraries/framework/`, `resources/views/`, `config/`, `routes/` and the plugin bootstrap files are out of scope.

#### Scenario: Reading an undocumented-looking internal method

- **WHEN** a developer opens a `protected` helper method in any service
- **THEN** it has a docblock stating what it does, its parameter and return types, and the version it appeared in

#### Scenario: A class is added

- **WHEN** a new class, interface or trait is added under `app/` or `database/`
- **THEN** it has a class-level docblock before it is considered complete

### Requirement: Docblock structure is fixed

A docblock on a class, interface, trait, method or function SHALL consist of, in this order: a one-line summary, an optional description paragraph, a blank line, `@since`, a blank line, then `@param`, `@return` and `@throws` tags where they apply. A property docblock SHALL consist of `@var` only, and MAY be written on a single line (`/** @var Type */`).

The summary SHALL be a single sentence in the imperative for methods and functions (for example "Resolve the canonical cart.") and a descriptive sentence for classes, interfaces and traits. A description paragraph SHALL appear only when behavior is not obvious from the summary and signature.

#### Scenario: Method docblock layout

- **WHEN** a method takes parameters, returns a value and can throw
- **THEN** its docblock reads summary, blank line, `@since 1.0.0`, blank line, one `@param` per parameter, `@return`, then `@throws`

#### Scenario: Class docblock layout

- **WHEN** a class is documented
- **THEN** its docblock contains a one-line summary, a blank line and `@since 1.0.0`, and no other tags

### Requirement: Every class-like and callable declares its introduction version

Every class, interface, trait, method and function docblock SHALL contain `@since` with the version in which the declaration became available. Every declaration existing when this standard is adopted SHALL use `@since 1.0.0`. Properties SHALL NOT carry `@since`.

#### Scenario: Existing declaration

- **WHEN** a class or method that predates this standard is documented
- **THEN** its docblock has `@since 1.0.0`

#### Scenario: Protected method

- **WHEN** a `protected` method is documented
- **THEN** it has `@since` exactly as a `public` method does

### Requirement: Parameter, return and throw tags are complete and accurate

Every method and function SHALL have one `@param` per parameter, in signature order, with a type, the `$name`, and a description where the name and type do not already make the meaning clear. Every method and function other than constructors and destructors SHALL have `@return`, using `void` when nothing is returned. `@throws` SHALL be present only for exceptions the method throws directly, including through the `throw_if()` and `throw_anyway()` helpers, which raise the exception themselves.

Types SHALL reflect what the code actually accepts and returns. Nullable values SHALL be written `Type|null`. Lists SHALL be written `Type[]` and keyed maps `array<KeyType, ValueType>`. Where the actual type cannot be determined from the code and its callers, `mixed` SHALL be used rather than a guess. Docblock types SHALL NOT be turned into native type declarations as part of this work.

#### Scenario: Method with nullable parameters

- **WHEN** a method accepts `$user_id` that may be null
- **THEN** its tag reads `@param int|null $user_id` with a short description

#### Scenario: Method returning nothing

- **WHEN** a method has no return value
- **THEN** its docblock contains `@return void`

#### Scenario: Method that only propagates an exception

- **WHEN** a method calls another method that throws but does not itself throw
- **THEN** its docblock has no `@throws` for that exception

#### Scenario: Unknown type

- **WHEN** a parameter's type cannot be established from the method body or its callers
- **THEN** it is documented as `mixed`

### Requirement: Overrides and implementations use inherited documentation

A method or property that overrides a parent member or implements an interface member without changing its contract SHALL use `@inheritDoc` in place of a summary and parameter tags, and SHALL still carry `@since`.

#### Scenario: Interface implementation

- **WHEN** a class implements a method declared on an interface
- **THEN** its docblock contains `@inheritDoc` and `@since 1.0.0` and does not repeat the interface's `@param` and `@return` tags

#### Scenario: Override that changes the contract

- **WHEN** an override accepts different types or adds behavior worth stating
- **THEN** it carries its own summary and tags instead of `@inheritDoc`

### Requirement: Docblock content is truthful and adds information

Docblock text SHALL be written from the behavior of the code it documents. A summary SHALL NOT merely restate the method name in prose. Existing docblocks SHALL be brought into the structure above, keeping any description that is still accurate and correcting any that is not.

#### Scenario: Existing docblock with stale content

- **WHEN** an existing docblock describes behavior the method no longer has
- **THEN** it is corrected to match the current code

#### Scenario: Existing accurate description

- **WHEN** an existing docblock has an accurate summary but the wrong tag order or missing tags
- **THEN** the summary is kept and only the structure is fixed

### Requirement: Adopting docblocks changes no executable code

Adding or normalizing docblocks SHALL NOT alter the executable code of any file. For every changed file, the PHP token stream with comments and whitespace removed SHALL be identical before and after.

#### Scenario: Verifying a file

- **WHEN** a changed file's tokens are compared to its previous version with comments and whitespace ignored
- **THEN** the two token streams are identical

#### Scenario: A docblock pass edits a signature

- **WHEN** an edit changes a parameter, type declaration, name or expression
- **THEN** the comparison fails and the file is not accepted

### Requirement: Drift is caught automatically

The project's PHP code-style checks SHALL fail when a declaration in scope lacks a docblock, lacks a required tag, or has tags out of order, so that new code cannot silently diverge from this standard.

#### Scenario: New method without a docblock

- **WHEN** a method is added without a docblock and the code-style check runs
- **THEN** the check reports it as an error

#### Scenario: Existing code

- **WHEN** the code-style check runs on the codebase after adoption
- **THEN** it reports no docblock errors
