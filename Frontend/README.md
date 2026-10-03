# Frontend

This folder contains the current static frontend prototype:

- `index.html` - admin workspace
- `staff.html` - barista/cashier workspace
- `customer.html` - customer workspace
- `app.js` - prototype UI behavior and sample state
- `styles.css` - shared styling

The files are kept together so the current relative paths continue to work.
No production authentication or server-side access control is implemented yet.
The role selector and local storage are demo conveniences only and should be
replaced or restricted when the backend is added.

When the team connects the API, keep network requests and authentication
handling in a dedicated module rather than putting server credentials in these
static files.
