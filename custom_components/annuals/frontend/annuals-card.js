// Annuals custom Lovelace card - bundled with the annuals integration, no
// separate HACS frontend package. Vanilla Web Components, no build step, no
// dependencies, consistent with the integration's zero-`requirements` design.

(() => {
  const ENTITY_PREFIX = "sensor.annuals_";

  const EVENT_TYPES = [
    "birthday",
    "anniversary",
    "name_day",
    "wedding_anniversary",
    "memorial",
    "pet_birthday",
    "work_anniversary",
    "custom",
  ];

  const STRINGS = {
    en: {
      defaultTitle: "Upcoming Events",
      today: "Today",
      inDay: "in 1 day",
      inDays: (n) => `in ${n} days`,
      noEvents: "No upcoming events",
      types: {
        birthday: "Birthday",
        anniversary: "Anniversary",
        name_day: "Name day",
        wedding_anniversary: "Wedding anniversary",
        memorial: "Memorial",
        pet_birthday: "Pet birthday",
        work_anniversary: "Work anniversary",
        custom: "Custom",
      },
      editor: {
        title: "Title",
        count: "Number of upcoming events",
        daysAhead: "Days ahead (0 = unlimited)",
        types: "Event types (empty = all)",
        showHero: "Highlight today's events",
        colors: "Colors",
        colorToday: "Today color",
        colorSoon: "Soon color (within 7 days)",
        colorAccent: "Icon color",
        fonts: "Font sizes",
        fontTitle: "Title font size",
        fontList: "List font size",
      },
    },
    de: {
      defaultTitle: "Anstehende Ereignisse",
      today: "Heute",
      inDay: "in 1 Tag",
      inDays: (n) => `in ${n} Tagen`,
      noEvents: "Keine anstehenden Ereignisse",
      types: {
        birthday: "Geburtstag",
        anniversary: "Jahrestag",
        name_day: "Namenstag",
        wedding_anniversary: "Hochzeitstag",
        memorial: "Todestag",
        pet_birthday: "Tiergeburtstag",
        work_anniversary: "Firmenjubiläum",
        custom: "Frei wählbar",
      },
      editor: {
        title: "Titel",
        count: "Anzahl anstehender Ereignisse",
        daysAhead: "Tage im Voraus (0 = unbegrenzt)",
        types: "Ereignistypen (leer = alle)",
        showHero: "Heutige Ereignisse hervorheben",
        colors: "Farben",
        colorToday: "Farbe für Heute",
        colorSoon: "Farbe für Bald (innerhalb 7 Tage)",
        colorAccent: "Icon-Farbe",
        fonts: "Schriftgrößen",
        fontTitle: "Schriftgröße Titel",
        fontList: "Schriftgröße Liste",
      },
    },
  };

  // The card's own UI strings follow the *viewing user's* profile language
  // (hass.language) - deliberately not hass.config.language (the server
  // language), which is what the integration's backend translations use for
  // entity/config-flow text instead.
  function t(hass) {
    const lang = (hass && hass.language) || "en";
    return STRINGS[lang] || STRINGS.en;
  }

  function defaultConfig(config) {
    config = config || {};
    return {
      title: "",
      count: 10,
      days_ahead: 0,
      types: [],
      show_hero: true,
      font_size_title: "",
      font_size_list: "",
      ...config,
      colors: { today: "", soon: "", accent: "", ...(config.colors || {}) },
    };
  }

  function getEvents(hass) {
    const events = [];
    for (const entityId in hass.states) {
      if (!entityId.startsWith(ENTITY_PREFIX)) continue;
      const state = hass.states[entityId];
      const days = parseInt(state.state, 10);
      if (Number.isNaN(days)) continue;
      events.push({
        entityId,
        days,
        name: state.attributes.name || state.attributes.friendly_name || entityId,
        type: state.attributes.type || "custom",
        icon: state.attributes.icon || "mdi:calendar-star",
        occurrence:
          state.attributes.occurrence_number == null ? null : state.attributes.occurrence_number,
      });
    }
    events.sort((a, b) => a.days - b.days || a.entityId.localeCompare(b.entityId));
    return events;
  }

  const CARD_STYLE = `
    ha-card { padding: 16px; }
    .title {
      font-size: var(--annuals-title-size, 1.2em);
      font-weight: 500;
      margin-bottom: 12px;
    }
    .hero {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-bottom: 12px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--divider-color, #e0e0e0);
    }
    .list {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: var(--annuals-list-size, 1em);
    }
    .row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 6px 4px;
      cursor: pointer;
      border-radius: 8px;
    }
    .row:hover, .row.hero-row {
      background: var(--secondary-background-color, rgba(0, 0, 0, 0.04));
    }
    .icon { flex-shrink: 0; color: var(--annuals-accent-color, var(--primary-text-color)); }
    .icon.today { color: var(--annuals-today-color, var(--error-color)); }
    .icon.soon { color: var(--annuals-soon-color, var(--warning-color)); }
    .info { flex: 1; min-width: 0; }
    .name { font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .type { font-size: 0.85em; opacity: 0.6; }
    .badge {
      background: var(--secondary-background-color, #eee);
      border-radius: 12px;
      padding: 2px 8px;
      font-size: 0.85em;
      flex-shrink: 0;
    }
    .when { flex-shrink: 0; opacity: 0.8; white-space: nowrap; }
    .empty { opacity: 0.6; text-align: center; padding: 12px; }
  `;

  class AnnualsCard extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
    }

    setConfig(config) {
      this._config = defaultConfig(config);
      this._built = false;
      this._render();
    }

    set hass(hass) {
      this._hass = hass;
      this._render();
    }

    getCardSize() {
      if (!this._hass || !this._config) return 3;
      const { today, upcoming } = this._filteredEvents();
      return 1 + (today.length ? 1 : 0) + upcoming.length;
    }

    static getConfigElement() {
      return document.createElement("annuals-card-editor");
    }

    static getStubConfig() {
      return defaultConfig({});
    }

    _filteredEvents() {
      const config = this._config;
      const all = getEvents(this._hass);
      const filtered = all.filter((e) => {
        if (config.types && config.types.length && !config.types.includes(e.type)) return false;
        if (config.days_ahead && config.days_ahead > 0 && e.days > config.days_ahead) return false;
        return true;
      });
      const today = filtered.filter((e) => e.days === 0);
      const upcoming = filtered.filter((e) => e.days > 0).slice(0, config.count || 10);
      return { today, upcoming };
    }

    _row(e, strings, isHero) {
      const div = document.createElement("div");
      div.className = "row" + (isHero ? " hero-row" : "");
      const typeLabel = strings.types[e.type] || e.type;
      const when = e.days === 0 ? strings.today : e.days === 1 ? strings.inDay : strings.inDays(e.days);
      const iconClass = e.days === 0 ? "today" : e.days <= 7 ? "soon" : "";
      div.innerHTML = `
        <ha-icon icon="${e.icon}" class="icon ${iconClass}"></ha-icon>
        <div class="info">
          <div class="name"></div>
          <div class="type"></div>
        </div>
        ${e.occurrence != null ? `<div class="badge">${e.occurrence}</div>` : ""}
        <div class="when"></div>
      `;
      div.querySelector(".name").textContent = e.name;
      div.querySelector(".type").textContent = typeLabel;
      div.querySelector(".when").textContent = when;
      div.addEventListener("click", () => {
        this.dispatchEvent(
          new CustomEvent("hass-more-info", {
            detail: { entityId: e.entityId },
            bubbles: true,
            composed: true,
          })
        );
      });
      return div;
    }

    _render() {
      if (!this._hass || !this._config) return;
      const strings = t(this._hass);
      const config = this._config;

      if (!this._built) {
        this.shadowRoot.innerHTML = `
          <style>${CARD_STYLE}</style>
          <ha-card>
            <div class="title"></div>
            <div class="hero"></div>
            <div class="list"></div>
          </ha-card>
        `;
        this._built = true;
      }

      const card = this.shadowRoot.querySelector("ha-card");
      card.style.setProperty(
        "--annuals-title-size",
        config.font_size_title || "var(--annuals-title-size, 1.2em)"
      );
      card.style.setProperty(
        "--annuals-list-size",
        config.font_size_list || "var(--annuals-list-size, 1em)"
      );
      if (config.colors.today) card.style.setProperty("--annuals-today-color", config.colors.today);
      if (config.colors.soon) card.style.setProperty("--annuals-soon-color", config.colors.soon);
      if (config.colors.accent) card.style.setProperty("--annuals-accent-color", config.colors.accent);

      const { today, upcoming } = this._filteredEvents();

      const titleEl = this.shadowRoot.querySelector(".title");
      titleEl.textContent = config.title || strings.defaultTitle;

      const heroEl = this.shadowRoot.querySelector(".hero");
      heroEl.innerHTML = "";
      heroEl.style.display = config.show_hero && today.length ? "" : "none";
      if (config.show_hero) {
        today.forEach((e) => heroEl.appendChild(this._row(e, strings, true)));
      }

      const listEl = this.shadowRoot.querySelector(".list");
      listEl.innerHTML = "";
      if (!upcoming.length) {
        const empty = document.createElement("div");
        empty.className = "empty";
        empty.textContent = strings.noEvents;
        listEl.appendChild(empty);
      } else {
        upcoming.forEach((e) => listEl.appendChild(this._row(e, strings, false)));
      }
    }
  }

  class AnnualsCardEditor extends HTMLElement {
    setConfig(config) {
      this._config = defaultConfig(config);
      this._render();
    }

    set hass(hass) {
      this._hass = hass;
      this._render();
    }

    _schema(strings) {
      const typeOptions = EVENT_TYPES.map((value) => ({
        value,
        label: strings.types[value] || value,
      }));
      return [
        { name: "title", selector: { text: {} } },
        { name: "count", selector: { number: { min: 1, max: 50, mode: "box" } } },
        { name: "days_ahead", selector: { number: { min: 0, max: 365, mode: "box" } } },
        { name: "types", selector: { select: { multiple: true, options: typeOptions } } },
        { name: "show_hero", selector: { boolean: {} } },
        {
          type: "expandable",
          name: "colors",
          title: strings.editor.colors,
          schema: [
            { name: "today", selector: { text: {} } },
            { name: "soon", selector: { text: {} } },
            { name: "accent", selector: { text: {} } },
          ],
        },
        { name: "font_size_title", selector: { text: {} } },
        { name: "font_size_list", selector: { text: {} } },
      ];
    }

    _computeLabel(strings) {
      const map = {
        title: strings.editor.title,
        count: strings.editor.count,
        days_ahead: strings.editor.daysAhead,
        types: strings.editor.types,
        show_hero: strings.editor.showHero,
        colors: strings.editor.colors,
        today: strings.editor.colorToday,
        soon: strings.editor.colorSoon,
        accent: strings.editor.colorAccent,
        font_size_title: strings.editor.fontTitle,
        font_size_list: strings.editor.fontList,
      };
      return (schemaItem) => map[schemaItem.name] || schemaItem.name;
    }

    _render() {
      if (!this._hass || !this._config) return;
      const strings = t(this._hass);

      if (!this.shadowRoot) this.attachShadow({ mode: "open" });
      let form = this.shadowRoot.querySelector("ha-form");
      if (!form) {
        this.shadowRoot.innerHTML = "<ha-form></ha-form>";
        form = this.shadowRoot.querySelector("ha-form");
        form.addEventListener("value-changed", (ev) => {
          ev.stopPropagation();
          this._config = defaultConfig(ev.detail.value);
          this.dispatchEvent(
            new CustomEvent("config-changed", { detail: { config: this._config } })
          );
        });
      }
      form.hass = this._hass;
      form.data = this._config;
      form.schema = this._schema(strings);
      form.computeLabel = this._computeLabel(strings);
    }
  }

  customElements.define("annuals-card", AnnualsCard);
  customElements.define("annuals-card-editor", AnnualsCardEditor);

  window.customCards = window.customCards || [];
  window.customCards.push({
    type: "annuals-card",
    name: "Annuals Card",
    description: "Upcoming yearly-recurring events (birthdays, anniversaries, ...) with a today highlight.",
    preview: true,
  });
})();
