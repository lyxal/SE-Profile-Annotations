# Network Wide Profile Annotations for Moderators

Ever noticed that SE doesn't have a way for moderators to leave notes on user profiles? Well, now there is a way! (obviously not official by any means.)

> [!NOTE]
> You will obviously need to be a moderator on at least one SE site to use this script. That might have something to do with the fact it relies on interacting with a private moderator chatroom.

> [!NOTE]
> This script has the ability to send chat messages using your account. It will only do so in the annotations chatroom, and only when interacting with annotations. If you have any concerns about this, feel free to review the source code to verify that it is not doing anything nefarious.

> [!WARNING]
> This script is not (yet?) endorsed by SE, and is not affiliated with SE in any way. Use at your own risk. I don't think it should trip any API rate limits, especially given there's a bit of caching in place.

## Installation

1. Install the [Tampermonkey BETA](https://www.tampermonkey.net/index.php?locale=en) extension for your browser. Note that the BETA version is specifically required for this script to work. The regular version of Tampermonkey does not allow `GM.cookie` to read `HTTPOnly` cookies.

> [!WARNING]
> It is VERY important you use Tampermonkey BETA. Normal Tampermonkey will NOT work. Also, make sure you do not accidentally install the userscript to normal Tampermonkey. Otherwise you'll be met with never-ending `alert`s.
  
2. Click [here](https://github.com/lyxal/SE-Profile-Annotations/raw/refs/heads/main/dist/annotations.user.js) to install the userscript. You should see a popup from Tampermonkey asking if you want to install the script. Click "Install".
3. Head on over to the [Network Wide Profile Annotations chatroom](https://chat.stackexchange.com/rooms/163900/network-wide-profile-annotations) (mod-only link). This is necessary for the script to read the `acct` and `prov` cookies. These cookies allow for programmatic access to searching a private room.

Alternatively, visit any user profile page, and the script will give you an alert saying "Required cookies or fkey for network-wide annotations not found. Opening chat page to retrieve them. Please refresh this page after the values have been set.". The script will then open the chatroom for you. You can close the chatroom after that and refresh the user profile.

4. That's it! If a user has any network-wide annotations, they will show up on their profile page on any SE site.

## Usage

Here is what annotations looks like on a user profile:

<img src="Sample1.png" alt="Sample annotation on a user profile" width="90%">

1. The `+ Add` button lets you add a new annotation.
2. The `Edit` button next to an individual annotation lets you update an annotation.
3. The `Delete` button next to an invididual annotation lets you delete an annotation.
4. The `Clear Annotation Cache for This User` button lets you clear the cached annotations for the currently viewed user.

## Contributing

If you would like to contribute to this project, the build process is very simple:

1. Make sure you have Node.js installed and `npm` available in your terminal.
2. Run `npm install` to install the dependencies.
3. Run `npx rollup -c` to build the userscript. The built script will be located at `dist/annotations.user.js`.

## Credits

- Thanks to @CPlus for the idea to (ab)use chat as a database.
