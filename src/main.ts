import { Args } from "grimoire-kolmafia";
import {
  availableAmount,
  buy,
  canInteract,
  closetAmount,
  displayAmount,
  equippedAmount,
  equippedItem,
  Item,
  itemAmount,
  mallPrice,
  myMeat,
  print,
  sellCost,
  sellsItem,
  storageAmount,
  todayToString,
  visitUrl,
} from "kolmafia";
import { $coinmaster, $item, $slots } from "libram";

import { args } from "./args";
import { notify } from "./notify";
import { loadState, MonthEntry, monthKey, saveState, State, STATE_FILE } from "./state";

const MR_STORE = $coinmaster`Mr. Store`;
const MR_A = $item`Mr. Accessory`;

// equippedAmount doesn't count gems socketed in The Eternity Codpiece (from greenbox)
function codpieceAmount(item: Item): number {
  return $slots`codpiece1, codpiece2, codpiece3, codpiece4, codpiece5`.some(
    (slot) => equippedItem(slot) === item,
  )
    ? 1
    : 0;
}

/** True if the item is anywhere on the account (same checks as greenbox). */
function haveItem(item: Item): boolean {
  return [
    availableAmount,
    closetAmount,
    displayAmount,
    (i: Item) => equippedAmount(i, true),
    itemAmount,
    storageAmount,
    codpieceAmount,
  ].some((f) => f(item) > 0);
}

function mrACost(item: Item): number {
  return sellCost(MR_STORE, item)[MR_A.name] ?? 0;
}

/** Everything Mr. Store currently sells for Mr. Accessories. */
function itemsForSale(): Item[] {
  // Visiting the store lets mafia learn any item it doesn't know yet.
  visitUrl("mrstore.php");
  return Item.all().filter((item) => sellsItem(MR_STORE, item) && mrACost(item) > 0);
}

function fmt(n: number): string {
  // Rhino's toLocaleString doesn't reliably add commas
  return `${Math.round(n)}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

type Summary = { found: string[]; bought: string[]; mrAs: number };

/** Spend meat above the reserve on Mr. Accessories, one at a time. */
function buyMrAs(summary: Summary): void {
  if (!args.buymra) return;
  if (!canInteract()) {
    print("Can't use the mall right now, so no Mr. Accessories from meat.");
    return;
  }

  for (;;) {
    const price = mallPrice(MR_A, 0); // always fetch a fresh price
    const spare = myMeat() - args.reserve;
    if (price <= 0) {
      print("Couldn't get a mall price for Mr. Accessory.");
      return;
    }
    if (price > args.maxprice) {
      print(`Mr. Accessory costs ${fmt(price)}, over the ${fmt(args.maxprice)} cap.`);
      return;
    }
    if (price > spare) {
      if (summary.mrAs === 0) {
        print(`Mr. Accessory costs ${fmt(price)}, but only ${fmt(Math.max(spare, 0))} is spare.`);
      }
      return;
    }
    if (args.dryrun) {
      const count = Math.floor(spare / price);
      print(`Would buy about ${count} Mr. Accessory at around ${fmt(price)} each.`, "blue");
      return;
    }

    const before = itemAmount(MR_A);
    buy(1, MR_A, Math.min(args.maxprice, spare));
    if (itemAmount(MR_A) <= before) {
      notify(`Tried to buy a Mr. Accessory at ${fmt(price)} but none arrived.`, true);
      return;
    }
    summary.mrAs++;
    notify(`Bought a Mr. Accessory for about ${fmt(price)} meat. ${fmt(myMeat())} meat left.`);
  }
}

/** Buy one of the item with a Mr. Accessory. Returns whether it worked. */
function buyIotm(item: Item, entry: MonthEntry, isNew: boolean): boolean {
  if (haveItem(item)) {
    print(`Already have ${item.name}, not buying it.`);
    return false;
  }
  if (args.dryrun) {
    print(`Would buy ${item.name} for ${mrACost(item)} Mr. Accessory.`, "blue");
    return false;
  }
  if (itemAmount(MR_A) < mrACost(item)) {
    // Only notify the first time, since this may run many times a day.
    if (isNew)
      notify(`New IotM ${item.name} is out, but there's no Mr. Accessory to buy it.`, true);
    else print(`Still no Mr. Accessory for ${item.name}.`);
    return false;
  }

  const before = itemAmount(item);
  buy(MR_STORE, 1, item);
  if (itemAmount(item) <= before) {
    notify(`Tried to buy ${item.name} from Mr. Store but it didn't arrive.`, true);
    return false;
  }
  entry.bought = true;
  entry.at = new Date().toISOString();
  notify(`Bought ${item.name} from Mr. Store.`);
  return true;
}

function save(state: State): void {
  if (!args.dryrun) saveState(state);
}

function run(): void {
  const state = loadState();
  const forSale = itemsForSale();

  if (!state) {
    print(`No data/${STATE_FILE} yet. Marking ${forSale.length} items for sale as already seen.`);
    forSale.forEach((item) => print(`- ${item.name}`));
    save({ seen: forSale.map((item) => item.id), months: {} });
    return;
  }

  const summary: Summary = { found: [], bought: [], mrAs: 0 };
  const month = monthKey(todayToString());
  const entries = (state.months[month] ??= []);

  // Record new items first, so they're never treated as new twice.
  const newItems = forSale.filter((item) => !state.seen.includes(item.id));
  for (const item of newItems) {
    summary.found.push(item.name);
    state.seen.push(item.id);
    if (!entries.some((e) => e.id === item.id)) {
      entries.push({ id: item.id, name: item.name, bought: false, at: new Date().toISOString() });
    }
  }
  save(state);

  buyMrAs(summary);

  // Buy anything from this month that's still for sale and not bought yet.
  for (const entry of entries) {
    if (entry.bought) continue;
    const item = forSale.find((i) => i.id === entry.id);
    if (!item) continue;
    const isNew = newItems.includes(item);
    if (buyIotm(item, entry, isNew)) {
      summary.bought.push(item.name);
      save(state); // write right away so a crash can't cause a second buy
    }
  }
  if (entries.length === 0) delete state.months[month];
  save(state);

  print("");
  print(args.dryrun ? "fomo summary (dry run, nothing changed):" : "fomo summary:", "green");
  print(`New items found: ${summary.found.join(", ") || "none"}`);
  print(`IotMs bought: ${summary.bought.join(", ") || "none"}`);
  print(`Mr. Accessories bought: ${summary.mrAs}`);
  print(`Meat left: ${fmt(myMeat())}`);
}

export function main(command = ""): void {
  Args.fill(args, command);
  if (args.help) {
    Args.showHelp(args);
    return;
  }

  try {
    run();
  } catch (e) {
    notify(`fomo stopped with an error: ${e}`, true);
    throw e;
  }
}
