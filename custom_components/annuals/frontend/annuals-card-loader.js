/**
 * Loads the Annuals card, and keeps trying until it has.
 *
 * Home Assistant puts a bare `import()` for a bundled card into the page it
 * serves - awaited by nothing, caught by nothing, and made exactly once per
 * document. Measured: one request, and navigating between dashboards never
 * makes another, because that is an in-app navigation and the document
 * stays. So a single fetch that does not arrive - Home Assistant restarting
 * in that moment, a proxy hiccup, a phone losing the network while the page
 * builds - leaves the card missing for as long as that page is open,
 * however healthy the server gets a second later. Only a reload cures it,
 * which is exactly what people report.
 *
 * This file is therefore what Home Assistant imports, and it is the one
 * that fetches the card. Being a few hundred bytes is the whole point: its
 * own fetch is about as likely to fail as anything on the network can be,
 * and from here the real module can be asked for again as often as it takes.
 *
 * Every attempt needs a URL of its own. A dynamic import that failed is
 * remembered per URL: measured, a second import of the same specifier -
 * after the file was back and answering 200 - failed again without sending
 * a single request. Hence the "retry" parameter, which changes nothing
 * about which file is served and everything about whether the browser is
 * willing to go and ask for it.
 *
 * Nothing needs reloading once an attempt gets through. Home Assistant
 * watches for the element being defined and rebuilds the card where it had
 * shown "custom element doesn't exist" - measured: one error card became
 * one real card, with no reload.
 *
 * And nothing needs reloading after an update either. A page that is open
 * while Home Assistant restarts is not served again: the frontend connects
 * its websocket anew and goes on with the card it has, and the dashboards'
 * resources are read once per page (ha-panel-lovelace keeps a flag for
 * it). That is why a new version used to show up only after a reload - and
 * only after a hard one on a browser whose service worker kept the old
 * file. So this loader, which stays in the page, asks the integration after
 * every reconnect which version it serves now, and when that is not the one
 * this page runs, imports the new file under its new "?v=". The card does
 * the rest: finding its tag already defined, the new file hands its methods
 * to the class that is registered and redraws every card and editor on the
 * page - see the end of the card's file.
 */
(() => {
  const TAG = "annuals-card";

  // One loader per page is enough. Home Assistant is handed this file twice -
  // as an extra module URL and as a dashboard resource - and while that is one
  // URL it is one module, a dashboard reached under a different address than
  // the one the browser's token was issued for resolves the two differently.
  // Two loaders would mean two sets of retries, two sets of listeners and two
  // fetches of a card measured in megabytes.
  const RUNNING = `__${TAG}-loader`;
  if (window[RUNNING]) return;
  window[RUNNING] = true;

  const HERE = new URL(import.meta.url);

  // Seconds to wait before each attempt. The last value repeats, so the
  // browser settles into asking twice a minute rather than hammering.
  const BACKOFF = [1, 2, 5, 10, 20, 30];
  // Twenty tries on its own, which the backoff above spreads over about
  // eight minutes. After that it waits for something to actually change -
  // see the listeners below - instead of knocking twice a minute at a
  // server that is evidently not coming back on its own.
  const ATTEMPTS_BEFORE_WAITING = 20;

  let tries = 0;
  let busy = false;
  let timer = null;
  // Set once the module has been fetched and run. What happens to the element
  // afterwards is the card's business: it watches for Home Assistant swapping
  // the element registry and defines itself again into the new one. Asking
  // customElements here instead would send this loader after the whole file
  // again every time that happened.
  let loaded = false;

  const done = () => loaded || !!customElements.get(TAG);

  function urlForThisTry() {
    const url = new URL("./annuals-card.js", HERE);
    // Carry over the "?v=" the integration puts on this loader, so the card
    // keeps being cache-busted per version exactly as it was.
    url.search = HERE.search;
    if (tries > 0) url.searchParams.set("retry", String(tries));
    return url.href;
  }

  async function attempt() {
    if (busy || done()) return;
    busy = true;
    const url = urlForThisTry();
    try {
      await import(url);
      loaded = true;
    } catch (err) {
      if (!done()) {
        console.warn(
          `${TAG}: could not load the card (attempt ${tries + 1}), retrying`,
          err
        );
        tries += 1;
        if (tries < ATTEMPTS_BEFORE_WAITING) {
          schedule(BACKOFF[Math.min(tries, BACKOFF.length - 1)] * 1000);
        } else {
          console.error(
            `${TAG}: giving up for now - it will try again when this tab is ` +
              `brought back to the front or the browser comes back online.`
          );
        }
      }
    } finally {
      busy = false;
    }
  }

  function schedule(delay) {
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      attempt();
    }, delay);
  }

  // The two moments when the world has plausibly changed. Both go straight
  // to an attempt rather than resetting anything: the URL is unique per try
  // regardless, so there is nothing to reset.
  const retryNow = () => {
    if (done()) return;
    tries = Math.max(tries, 1);
    schedule(0);
  };
  addEventListener("online", retryNow);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) retryNow();
  });

  attempt();

  // The version this page runs: the "?v=" the integration put on this
  // loader's URL, which is the modification time of the newest of the
  // card's files. The import below moves it on.
  let running = Number(HERE.searchParams.get("v")) || 0;
  let updating = false;
  // How often fetching a newer card has failed. Every further try needs an
  // address of its own, for the reason given at the top of this file: a
  // dynamic import that failed is remembered per URL.
  let updateTries = 0;
  let askTimer = null;
  let asked = 0;
  // The websocket is back long before the integrations are: measured, the
  // page reconnected while Home Assistant was still NOT_RUNNING, and the
  // command was not registered yet - "unknown_command", and no second
  // chance until the next restart. So an answer that is not an answer is
  // asked again, at these distances in seconds (the last one repeats),
  // for about ten minutes - a slow start on a small box - and then left
  // alone: an integration from before the command never answers, and the
  // next reconnect starts over.
  const ASK_AGAIN = [2, 3, 5, 10, 20, 30];
  const ASK_LIMIT = 24;

  function askLater(conn) {
    if (asked >= ASK_LIMIT) return;
    const delay = ASK_AGAIN[Math.min(asked, ASK_AGAIN.length - 1)] * 1000;
    asked += 1;
    if (askTimer !== null) clearTimeout(askTimer);
    askTimer = setTimeout(() => {
      askTimer = null;
      updateIfNewer(conn);
    }, delay);
  }

  async function updateIfNewer(conn) {
    if (updating || !done()) return;
    updating = true;
    try {
      const answer = await conn.sendMessagePromise({ type: `${TAG.replace(/-card$/, "")}/card_version` });
      const served = Number(answer && answer.version) || 0;
      // Only ever forward: a page with a newer card than the server - a
      // restart into an older backup - keeps what it has.
      if (served <= running) return;
      const url = new URL(`./${TAG}.js`, HERE);
      url.search = "";
      url.searchParams.set("v", String(served));
      if (updateTries > 0) url.searchParams.set("retry", String(updateTries));
      try {
        await import(url.href);
      } catch (err) {
        updateTries += 1;
        throw err;
      }
      updateTries = 0;
      running = served;
      console.info(`${TAG}: updated to the card served now (${served})`);
    } catch (err) {
      console.debug(`${TAG}: could not check for a newer card yet`, err);
      askLater(conn);
    } finally {
      updating = false;
    }
  }

  // Home Assistant keeps one connection object for the life of the page and
  // fires "ready" on it every time it has (re)connected - after a restart
  // of Home Assistant, which is when the card may have changed. The
  // connection promise is what Home Assistant's own page sets up before
  // anything else; without it (a page that is not Home Assistant's) there is
  // nothing to ask.
  const connection = window.hassConnection;
  if (connection && typeof connection.then === "function") {
    connection
      .then(({ conn }) => {
        conn.addEventListener("ready", () => {
          asked = 0;
          updateIfNewer(conn);
        });
        // "ready" for this page's first connection has usually fired before
        // this line runs: ask once now, for the page that was served by a
        // Home Assistant that has since restarted into a newer card.
        updateIfNewer(conn);
      })
      .catch(() => {});
  }
})();
