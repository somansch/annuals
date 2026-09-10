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
 */
(() => {
  const TAG = "annuals-card";
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

  const done = () => !!customElements.get(TAG);

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
})();
