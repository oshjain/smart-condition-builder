# Smart Condition Builder

A reusable **vanilla JavaScript nested condition builder** UI component.

It lets users visually create simple or complex filter conditions using nested **AND / OR groups**, then returns a clean condition-array structure that can be stored, converted, or applied by your own application logic.

No framework required.  
No table dependency.  
No backend dependency.  
Just vanilla JavaScript.

---

## Features

- Vanilla JavaScript
- Reusable class-based component
- Initialize once and reuse repeatedly
- Supports create and edit flows
- Supports nested AND / OR groups
- Add, remove, and move rules
- Add, remove, and move groups
- Configurable fields
- Configurable operators
- Tailwind-friendly class configuration
- Google Material Symbols icon support
- Returns a clean condition array
- Does not apply filters by itself
- Does not depend on any table/grid library

---

## Why this exists

Many apps need a user-friendly way to create smart filters, saved filters, prefilters, routing rules, or business conditions.

Most available query builders are either too heavy, framework-specific, or tightly coupled with a grid/table library.

Smart Condition Builder keeps the responsibility simple:

> Build the condition UI. Return the conditions. Let your app decide what to do next.

---

## Condition Format

The builder returns a neutral condition-array format.

```js
[
  {
    field: "spCode",
    type: "starts",
    value: "103266"
  },
  [
    {
      field: "reason",
      type: "like",
      value: "ashs"
    },
    {
      field: "onshorePic",
      type: "like",
      value: "has"
    }
  ]
]

Meaning:
code starts with 103266
AND
(
  reason contains ashs
  OR
  picName contains has
)

Format rules:
Outer array = AND
Nested array = OR
Object = single condition rule

You can convert this output to SQL, MongoDB, JsonLogic, custom predicates, table filters, API payloads, or any other format required by your application