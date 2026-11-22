# fomo

A KoLmafia script that buys each new Item of the Month from Mr. Store once, then turns spare meat into Mr. Accessories. It's safe to run as often as you like, including right after a crash.

## Install

```
git checkout pstalcup/mafia-fomo release
```

Then type `fomo` in the KoLmafia CLI. `fomo help` lists the options.

## What it does

1. Visits Mr. Store so KoLmafia learns about any item it doesn't know yet, and lists everything sold for Mr. Accessories.
2. Anything not already in the data file's `seen` list is new. It's added to `seen` and recorded under the current month.
3. If you have spare meat and can use the mall, buys Mr. Accessories one at a time, checking the mall price before each one.
4. Buys one of each new item from this month with a Mr. Accessory, unless you already have it somewhere (inventory, closet, storage, display case, equipped, or the Eternity Codpiece). The file is saved right after each purchase.
5. Prints a summary: new items found, what was bought, Mr. Accessories bought, and meat left.

If a new item comes out while you're out of Mr. Accessories, it stays recorded as not bought and fomo tries again on later runs that month. It never uses Uncle Bucks or the currency exchange.

## Options

Options can be given on the command line (`fomo reserve=50000000 dryrun`) or saved as preferences named `fomo_<option>`.

| Option     | Default    | What it does                                                        |
| ---------- | ---------- | ------------------------------------------------------------------- |
| `reserve`  | `20000000` | Meat to keep. Mr. Accessories are only bought with meat above this. |
| `maxprice` | `80000000` | Most meat to pay for one Mr. Accessory.                             |
| `buymra`   | `true`     | Set to `false` to skip buying Mr. Accessories with meat.            |
| `dryrun`   | off        | Print what would happen without buying anything or saving the file. |

## Notifications

If the `halfloop_ntfy` preference is set (the same one halfloop uses), fomo sends an [ntfy](https://ntfy.sh) notification for each purchase and for any failure. It can be a bare topic name or a full ntfy server URL.

## The data file

fomo keeps its state in `fomo.json` in KoLmafia's `data` folder:

```json
{
  "seen": [12321, 12325, 12391],
  "months": {
    "2026-11": [
      {
        "id": 12391,
        "name": "unopened legendary acorndion",
        "bought": true,
        "at": "2026-11-01T00:05:00Z"
      }
    ]
  }
}
```

- `seen` holds the item ids of everything fomo has seen for sale. Items in it are never treated as new again.
- `months` records the new items found each month, and whether fomo bought them.

On the very first run there's no file, so fomo marks everything currently for sale as seen and buys nothing. That way it doesn't spend Mr. Accessories on old stock. Deleting the file resets fomo to that first-run behavior.

## Development

```bash
yarn install
yarn run build          # builds dist/scripts/fomo/fomo.js
yarn run lint           # typecheck, eslint and prettier
yarn run format         # fix formatting
yarn run install-mafia  # link the build into your KoLmafia folder
```

Every push to `main` builds the script and publishes it to the `release` branch.
