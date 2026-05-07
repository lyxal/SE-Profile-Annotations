# SE Profile Annotations

A userscript that allows you to add and manage profile annotations for Stack Exchange users. Annotations are stored in a dedicated Stack Exchange chat room and can be created, edited, and removed.

## Requirements

- **Tampermonkey Beta** - This userscript requires Tampermonkey Beta because it uses the `GM.cookie` API with access to HTTP-only cookies. This is needed to retrieve your Stack Exchange authentication cookies.
  - Download: [Tampermonkey Beta](https://www.tampermonkey.net/beta.html)

## Installation

1. **Install Tampermonkey Beta** following the link above for your browser.
2. **Build the userscript** (see [Building](#building) section below)
3. **Open** `dist/annotations.user.js` in your browser or copy its contents
4. **Install** via Tampermonkey by clicking the "Install" button in the popup that appears

## Building

### Prerequisites

- Node.js (v14 or higher recommended)
- npm

### Build Steps

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the userscript:
   ```bash
   npx rollup -c
   ```

3. The compiled userscript will be generated at:
   ```
   dist/annotations.user.js
   ```


## How It Works

1. **Authentication**: When you visit the annotations room, the script retrieves your Stack Exchange authentication cookies (`acct` and `prov`) and your session `fkey`.

2. **Annotation Storage**: Annotations are stored as messages in the SE chat room. Each annotation follows a specific format:
   - New: `AN[userID]: annotation text`
   - Edit: `AN[userID] EDIT(messageID): new text`
   - Remove: `AN[userID] UNDO(messageID):`

3. **Caching**: The script maintains a local cache of annotations using Tampermonkey's storage, reducing the need to re-fetch all annotation messages on subsequent visits.

4. **Searching**: The script searches the chat room for all messages matching the pattern `AN[userID]` to find annotations for a specific user.

## Technical Details

### Required Permissions

The userscript requires the following Tampermonkey permissions:
- `GM_xmlhttpRequest` - To fetch data from Stack Exchange chat
- `GM_getValue` / `GM_setValue` - To cache annotations locally
- `GM_cookie` - To retrieve authentication cookies

### File Structure

- `main.js` - Main entry point
- `ChatSearch.js` - Functions to search and parse annotations from chat
- `RetrieveCookies.js` - Functions to retrieve authentication cookies
- `rollup.config.js` - Build configuration
- `header.txt` - Userscript metadata header

## Troubleshooting

### "Required cookies or fkey not found"

This error appears when the script cannot find your authentication credentials. Make sure:
- You are logged into Stack Exchange
- You have visited the [annotations room](https://chat.stackexchange.com/rooms/163900) with Tampermonkey Beta enabled
- You have granted Tampermonkey permission to access cookies

### No annotations appearing

- Ensure you have actually posted annotations to the chat room in the correct format
- Check that the user's network ID is correct
- Open the browser console (F12) to see debug logs showing which users and messages are being fetched

## Support

For issues or feature requests, please refer to the project repository.
