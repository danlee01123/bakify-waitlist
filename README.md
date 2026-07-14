# Bakify Polished Email Flow

This project uses one GitHub repository and one Vercel project for both the
waitlist and the resource library.

## Public pages

- `/` is the Bakify waitlist page.
- `/resources` is the resource library.
- `/guide` is the starter guide.
- `/laws` is the state-by-state cottage food law reference.
- `/labeling` is the labeling checklist.

Kit sends subscribers a button that points to:

`https://bakify-waitlist.vercel.app/resources?verified=1`

A second Vercel app is not required.

## GitHub replacement

Upload all files and folders from this package to the root of the existing
repository. Files with the same path replace the existing version in the new
commit. New files are added. Files that are not included in the upload are not
automatically deleted.

The root of the repository should contain:

- `api/subscribe.js`
- `data.js`
- `guide.html`
- `index.html`
- `labeling.html`
- `laws.html`
- `package.json`
- `resource.js`
- `resources.html`
- `script.js`
- `style.css`
- `vercel.json`

Delete any accidental extra `subscribe.js` located in the repository root.
The correct server file belongs only at `api/subscribe.js`.

## Kit settings

- Send confirmation email: ON
- Auto-confirm new subscribers: ON for lower friction, or OFF for true email verification
- Redirect URL:
  `https://bakify-waitlist.vercel.app/resources?verified=1`

See `KIT_EMAIL_COPY.md` for polished copy.


## Platform-aligned content update

The guides now encourage bakers to start small, then position Bakify as the
place to grow. The public copy emphasizes local discovery, storefronts,
checkout and payments, pickup scheduling, state-aware listings, and label
generation.

The guide no longer treats building a large social media audience as a required
step. Social media is described only as an optional bridge before Bakify
launches.
