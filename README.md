# 360 Degrees Cafe

This repository contains the 360 Degrees Specialty Cafe point-of-sale and
customer ordering system prototype.

## Project structure

- [`Frontend`](./Frontend/) contains the current browser-based prototype:
  customer ordering, barista/cashier POS, and admin workspaces.
- [`Backend`](./Backend/) is reserved for the future API, authentication,
  authorization, database, and server-side business logic.

## Current status

This is a deployment preparation structure only. The current frontend still
uses sample data and browser `localStorage`; it is not yet connected to a
backend and must not be treated as a secure production system.

Before production deployment, the team should:

1. Add backend authentication and role-based authorization.
2. Move products, orders, inventory, employees, and customer data to a
   server-side database.
3. Protect admin and staff routes on the server, not only in frontend
   JavaScript.
4. Configure the frontend API base URL using the chosen deployment
   environment.
5. Add production environment configuration, validation, error handling,
   logging, and automated tests.

See the folder-specific README files for the intended responsibilities of
each part of the system.
