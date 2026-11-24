import { Args } from "grimoire-kolmafia";

export const args = Args.create(
  "fomo",
  "Buys each new Item of the Month from Mr. Store once, then turns spare meat into Mr. Accessories.",
  {
    reserve: Args.number({
      help: "Meat to keep on hand. Mr. Accessories are only bought with meat above this.",
      default: 20_000_000,
    }),
    maxprice: Args.number({
      help: "Most meat to pay for one Mr. Accessory in the mall.",
      default: 80_000_000,
    }),
    buymra: Args.boolean({
      help: "Buy Mr. Accessories from the mall with spare meat.",
      default: true,
    }),
    ntfy: Args.string({
      help: "ntfy.sh topic (or full ntfy server URL) to notify about purchases and failures.",
      default: "",
    }),
    dryrun: Args.flag({
      help: "Print what would happen without buying anything or writing the data file.",
      default: false,
    }),
  },
);
