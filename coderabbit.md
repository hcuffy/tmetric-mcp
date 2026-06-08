# CodeRabbit Review Guidelines

This document provides review guidelines for the **testing-data** npm library - a TypeScript package for generating random vehicle and user data for testing purposes.

## Project Overview

- **Package**: `testing-data`
- **Purpose**: Generate fake but realistic test data (people, vehicles, companies)
- **Build**: TypeScript compiled with `tsc` to `lib/`
- **Package Manager**: pnpm
- **Testing**: Jest

## Module Architecture

```
src/
├── index.ts              # Main entry (re-exports all modules)
├── interfaces.d.ts       # Global type definitions
├── utils.ts              # Shared utilities (Chance.js factory)
├── people/               # Person data generation
├── vehicles/             # Vehicle data generation
└── company/              # Company data generation
```

## Code Style Guidelines

### General Rules

- Use 4 spaces for indentation
- Single quotes for strings
- Always use semicolons
- Prefer function declarations over arrow functions for exports
- Use lodash default import: `import _ from 'lodash'`

### TypeScript

- Explicit return types on exported functions
- Interfaces defined in `src/interfaces.d.ts`
- No explicit `any` (ESLint error)

### Naming Conventions

- **camelCase**: Variables, functions (`getVehicle`, `revisedQuantity`)
- **PascalCase**: Interfaces, types (`Person`, `Vehicle`, `PhoneNumbers`)
- **kebab-case**: File names (`vehicle.ts`, `helpers.ts`)

## Module-Specific Guidelines

### People Module (`src/people/`)

- Uses Chance.js for generating realistic fake data
- `getBirthDateAndAge()` uses moment.js for date calculations
- `getValidGender()` normalizes input to 'male' or 'female'
- `safeguardNumber()` caps quantities at 50 to prevent abuse
- `getPeople()` ensures unique emails by checking before adding
- Phone numbers support US, UK, and FR country codes

### Vehicles Module (`src/vehicles/`)

- VINs generated from brand-specific base patterns + random suffix
- `vehicleBrands` seed data contains brand, models array, and vinBase
- Engine types: petrol, diesel, autogas, naturalgas, hybrid
- Number plates can use custom prefix or generate random 2-letter prefix
- `getVehicles()` ensures unique VINs by checking before adding

### Company Module (`src/company/`)

- Company names include a random 4-digit number for uniqueness
- Reuses `getFullAddress()` from people module
- Uses Chance.js `company()` method for realistic names

### Utilities (`src/utils.ts`)

- Contains the Chance.js instance factory
- Keep minimal - only truly shared utilities belong here

### Type Definitions (`src/interfaces.d.ts`)

- Global TypeScript interfaces: `VehicleBrands`, `PhoneNumbers`, `Person`, `Vehicle`
- Interfaces should match the shape of data returned by generator functions

### Seed Data (`**/seeds/`)

- Static reference data for generators
- Contains country lists, vehicle brands, and models
- Keep data accurate and comprehensive

## Testing Guidelines

### Test Structure

- Use `describe()` blocks to group related tests
- Clear test names describing expected behavior
- Test both happy path and edge cases
- Verify return types match interfaces

### Test Patterns

```typescript
describe('getVehicle', () => {
    it('should return a vehicle with all required properties', () => {
        const vehicle = getVehicle({});
        expect(vehicle).toHaveProperty('brand');
        expect(vehicle).toHaveProperty('model');
        expect(vehicle).toHaveProperty('vin');
    });

    it('should use specified brand when provided', () => {
        const vehicle = getVehicle({ brand: 'Honda' });
        expect(vehicle.brand).toBe('Honda');
    });
});
```

## Key Patterns to Review

### Quantity Safeguarding

All batch functions should use `safeguardNumber()`:

```typescript
const revisedQuantity = safeguardNumber(quantity);
```

### Uniqueness Enforcement

Batch generators must check for duplicates:

```typescript
const exists = _.some(collection, { uniqueField: item.uniqueField });
if (!exists) {
    collection.push(item);
}
```

### Consistent Return Types

Functions should have explicit return types matching interfaces:

```typescript
export function getVehicle(vehicle): Vehicle { }
export function getPerson(data): Person { }
```

## ESLint Rules (Key)

| Rule | Setting |
|------|---------|
| Indentation | 4 spaces |
| Quotes | Single |
| Semicolons | Always |
| `@typescript-eslint/no-explicit-any` | Error |
| `@typescript-eslint/no-unused-vars` | Error |
| `max-len` | 150 |
| `no-nested-ternary` | Error |
| `curly` | Always required |

## Review Checklist

- [ ] TypeScript compiles without errors
- [ ] Return types explicit on public functions
- [ ] Batch functions use `safeguardNumber()`
- [ ] Batch functions ensure uniqueness
- [ ] New interfaces added to `interfaces.d.ts`
- [ ] Tests cover new functionality
- [ ] No console.log statements
- [ ] Follows lodash patterns for array/object operations
