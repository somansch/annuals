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
    "holiday",
  ];

  // Stored in `types`/`categories` when the user has explicitly unchecked
  // every box (e.g. via "Hide All") - a real empty array already means "no
  // restriction, show everything" throughout this file (see defaultConfig
  // and _filteredEvents), so an actual "show nothing" selection needs a
  // value that isn't a real type/category name to stay distinguishable.
  const NONE_SELECTED = "__none__";

  const STRINGS = {
    en: {
      defaultTitle: "Upcoming Events",
      today: "Today",
      inDay: "Tomorrow",
      inDays: (n) => `in ${n} days`,
      dayAgo: "Yesterday",
      daysAgo: (n) => `${n} days ago`,
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
        holiday: "Holiday",
      },
      // Plural forms for the editor's "Event types" checkbox grid, which is
      // a filter over a whole category of events (English adjectives like
      // the ones in `categories` below don't inflect for plural, so no
      // `categoriesPlural` counterpart is needed for this language).
      typesPlural: {
        birthday: "Birthdays",
        anniversary: "Anniversaries",
        name_day: "Name days",
        wedding_anniversary: "Wedding anniversaries",
        memorial: "Memorials",
        pet_birthday: "Pet birthdays",
        work_anniversary: "Work anniversaries",
        custom: "Custom",
        holiday: "Holidays",
      },
      categories: {
        public: "Public",
        bank: "Bank",
        government: "Government",
        school: "School",
        optional: "Optional",
        unofficial: "Unofficial",
        half_day: "Half day",
        armed_forces: "Armed forces",
        workday: "Workday",
        catholic: "Catholic",
        christian: "Christian",
        orthodox: "Orthodox",
        hebrew: "Jewish",
        islamic: "Islamic",
        hindu: "Hindu",
        buddhist: "Buddhist",
      },
      editor: {
        title: "Card title",
        titleDesc: "Custom title text for the card (leave empty for the default)",
        titlePlaceholder: "e.g. Upcoming Events",
        count: "Number of events",
        countDesc: "The total number of events shown on the card",
        todayOnly: "Today only",
        todayOnlyDesc: "Ignore every other filter below and show only events happening today",
        nextEventDayOnly: "Only next event day",
        nextEventDayOnlyDesc:
          "Show only the events on the single soonest day - today's, if any, otherwise the next day with events (possibly more than one)",
        daysAhead: "Days ahead (0 = unlimited)",
        daysAheadDesc: "Only show events happening within this many days (0 = no limit)",
        daysPast: "Days in the past (0 = today only)",
        daysPastDesc: "How many days in the past an event still counts as recent (0 = today only)",
        soonDays: "“Soon” threshold (days)",
        soonDaysDesc: "Events within this many days count as “soon”",
        types: "Event types",
        typesDesc: "Only show the checked event types",
        categories: "Holiday categories",
        categoriesDesc: "Only show holidays in the checked categories (other event types are unaffected)",
        showAll: "Show All",
        hideAll: "Hide All",
        visibilityHeading: "Show / Hide",
        visibilityPast: "Past events",
        visibilityPastDesc: "Show events whose anniversary already passed within the configured past window",
        visibilityToday: "Today's events",
        visibilityTodayDesc: "Show events happening today",
        visibilitySoon: "Upcoming soon",
        visibilitySoonDesc: "Show events within the “soon” threshold",
        visibilityCardTitleDesc: "Show the card's own title",
        hideCardTitle: "Hide",
        hideCardTitleDesc: "Hide the card's own title, even when set above",
        tapAction: "Tap action",
        tapActionDesc: "What happens when a row is tapped or clicked",
        holdAction: "Hold action",
        holdActionDesc: "What happens when a row is pressed and held",
        visibilityIcon: "Icon",
        visibilityIconDesc: "Show the type icon in front of each row",
        visibilityTitleDesc: "Show the event name",
        visibilitySubtitleDesc: "Show the event type",
        visibilityCountrySuffix: "Holiday suffix",
        visibilityCountrySuffixDesc: "Append the country (and subdivision, if any) after the holiday's name/type, e.g. “Independence Day · US (UT)”",
        columnsHeading: "Row columns",
        columnsDesc: "Add, remove, and reorder what each row shows. Custom text columns can mix free text with placeholders: {name}, {type}, {occurrence}, {when}, {country}.",
        columnTypeIcon: "Icon",
        columnTypeInfo: "Name + type",
        columnTypeName: "Name",
        columnTypeSubtitle: "Type",
        columnTypeText: "Custom text",
        columnAdd: "Add",
        columnMoveUp: "Move up",
        columnMoveDown: "Move down",
        columnRemove: "Remove",
        columnTemplatePlaceholder: "e.g. {name} turns {occurrence} today",
        columnColor: "Color",
        columnsCompact: "Compact (no gaps, centered)",
        columnsCompactDesc: "Remove the spacing between columns, center the row, and make every field match in weight and opacity - useful when the columns form one continuous sentence.",
        visibilityBadgeDesc: "Show the occurrence number badge",
        visibilityWhenDesc: "Show the countdown (e.g. “in 3 days”)",
        visibilityVipOnly: "VIP only",
        visibilityVipOnlyDesc: "Only show events flagged as “VIP Annual”",
        visibilityImportantOnly: "Important only",
        visibilityImportantOnlyDesc:
          "Only show events automatically flagged as important (configured under Annual Settings in the integration)",
        vipBadgeIcon: "VIP badge icon",
        vipBadgeIconDesc: "MDI icon shown as a small badge on the icon of VIP-flagged events",
        vipBadgeIconPlaceholder: "mdi:star",
        importantBadgeIcon: "Important badge icon",
        importantBadgeIconDesc: "MDI icon shown as a small badge on the icon of events automatically flagged as important",
        importantBadgeIconPlaceholder: "mdi:exclamation-thick",
        highlightHeading: "Highlight",
        highlightPast: "Past events",
        highlightPastDesc: "Tint the row background for events that already happened",
        highlightToday: "Today's events",
        highlightTodayDesc: "Tint the row background for events happening today",
        highlightSoon: "Upcoming soon",
        highlightSoonDesc: "Tint the row background for events within the “soon” threshold",
        highlightBgColor: "Background color",
        highlightBgColorDesc: "Background tint color for this highlight",
        highlightVip: "VIP events",
        highlightVipDesc: "Show a badge on the icon of VIP-flagged events",
        highlightImportant: "Important events",
        highlightImportantDesc: "Show a badge on the icon of events automatically flagged as important",
        vipBadgeColor: "Badge color",
        vipBadgeColorDesc: "Background color of the VIP badge",
        importantBadgeColor: "Badge color",
        importantBadgeColorDesc: "Background color of the Important badge",
        colors: "Colors",
        cardBackgroundTabTitle: "Card Background",
        cardBackgroundEnable: "Show background",
        cardBackgroundEnableDesc: "Show a custom color and/or image behind the whole card",
        cardBackgroundColor: "Color",
        cardBackgroundColorDesc: "Background color for the card",
        cardBackgroundImage: "Image",
        cardBackgroundImageDesc:
          "Upload an image, or paste a URL or a local media path (e.g. from HA's Media Browser) to use as the card background. Supported formats: JPEG, PNG, GIF, WebP. Keep the file reasonably small (a few MB at most) for fast loading.",
        cardBackgroundImagePlaceholder: "e.g. /local/my-image.jpg",
        cardBackgroundUpload: "Upload image",
        cardBackgroundClear: "Remove image",
        cardBackgroundSize: "Image behavior",
        cardBackgroundSizeDesc:
          "Fill (cover): scales the image to completely fill the card, cropping if needed. Fit (contain): scales the image to fit inside the card without cropping, may leave empty space. Actual size: shows the image at its original size, centered. Repeat (tile): repeats the image at its original size to tile the card.",
        cardBackgroundSizeCover: "Fill (cover)",
        cardBackgroundSizeContain: "Fit (contain)",
        cardBackgroundSizeAuto: "Actual size",
        cardBackgroundSizeRepeat: "Repeat (tile)",
        cardBackgroundOpacity: "Opacity",
        cardBackgroundOpacityDesc: "Opacity of the background color/image, in percent",
        colorsIconsHeading: "Icons",
        colorsLabelsHeading: "Labels",
        colorToday: "Today",
        colorSoon: "Soon",
        colorAccent: "Default",
        colorTodayDesc: "Icon color for today's events",
        colorSoonDesc: "Icon color for events within the “soon” threshold",
        colorAccentDesc: "Icon color for events with no special status",
        animationLabel: "Animation",
        animationDesc: "Add a looping animation to this icon",
        animationNone: "None",
        animationPulse: "Pulse",
        animationBounce: "Bounce",
        animationShake: "Shake",
        animationSpin: "Spin",
        animationFlash: "Flash",
        matchTextLabel: "Also color the text",
        matchTextDesc: "Also color the whole row's text with this icon color",
        colorTitle: "Name",
        colorSubtitle: "Type",
        colorBadge: "Occurrence",
        colorWhen: "Countdown",
        colorText: "Custom text",
        cardTitleColorDesc: "Text color for the card's own title",
        colorTitleDesc: "Text color for the event name",
        colorSubtitleDesc: "Text color for the event type",
        colorBadgeDesc: "Text color for the occurrence number badge",
        colorWhenDesc: "Text color for the countdown (e.g. “in 3 days”)",
        colorTextDesc: "Text color for custom text columns (see Row columns in Layout -> Display)",
        backgroundLabel: "Show background",
        backgroundDesc: "Show a rounded background behind the occurrence number",
        colorBadgeBackground: "Background color",
        colorBadgeBackgroundDesc: "Background color behind the occurrence number",
        colorPlaceholder: "e.g. #ff5722 or var(--my-red)",
        presetDefault: "Default",
        presetPrimary: "Primary",
        presetAccent: "Accent",
        presetCustom: "Custom",
        presetRed: "Red",
        presetPink: "Pink",
        presetPurple: "Purple",
        presetDeepPurple: "Deep purple",
        presetIndigo: "Indigo",
        presetBlue: "Blue",
        presetLightBlue: "Light blue",
        presetCyan: "Cyan",
        presetTeal: "Teal",
        presetGreen: "Green",
        presetLightGreen: "Light green",
        presetLime: "Lime",
        presetYellow: "Yellow",
        presetAmber: "Amber",
        presetOrange: "Orange",
        presetDeepOrange: "Deep orange",
        presetBrown: "Brown",
        presetGrey: "Grey",
        presetBlueGrey: "Blue grey",
        fonts: "Fonts",
        fontCardTitle: "Card title",
        fontCardTitleDesc: "Font size for the card's own title",
        fontTitleDesc: "Font size for the event name",
        fontSubtitleDesc: "Font size for the event type",
        fontBadgeDesc: "Font size for the occurrence number badge",
        fontWhenDesc: "Font size for the countdown (e.g. “in 3 days”)",
        fontTextDesc: "Font size for custom text columns (see Row columns in Layout -> Display)",
        fontPlaceholder: "e.g. 1.2em or 20px",
        fontBold: "Bold",
        fontItalic: "Italic",
        fontUppercase: "Uppercase",
        fontUnderline: "Underline",
        fontLetterSpacing: "Letter spacing",
        fontLetterSpacingPlaceholder: "e.g. 0.05em or 1px",
        panelSettings: "Settings",
        panelSettingsDesc: "General, events, and time period",
        panelLayout: "Layout",
        panelLayoutDesc: "Display, fonts, colors, icons, and backgrounds",
        groupGeneral: "General",
        groupGeneralDesc: "",
        groupEvents: "Events",
        groupEventsDesc: "",
        groupPeriod: "Time period",
        groupPeriodDesc: "",
        groupDisplay: "Display",
        groupDisplayDesc: "",
      },
    },
    de: {
      defaultTitle: "Anstehende Ereignisse",
      today: "Heute",
      inDay: "Morgen",
      inDays: (n) => `in ${n} Tagen`,
      dayAgo: "Gestern",
      daysAgo: (n) => `vor ${n} Tagen`,
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
        holiday: "Feiertag",
      },
      // Plural forms for the editor's "Ereignistypen"/"Feiertagskategorien"
      // checkbox grids, which are filters over a whole category of events
      // rather than a label for one single event - "Geburtstage" reads
      // correctly there, whereas the singular `types`/`categories` above is
      // still correct for a single row's own type/category text.
      typesPlural: {
        birthday: "Geburtstage",
        anniversary: "Jahrestage",
        name_day: "Namenstage",
        wedding_anniversary: "Hochzeitstage",
        memorial: "Todestage",
        pet_birthday: "Tiergeburtstage",
        work_anniversary: "Firmenjubiläen",
        custom: "Frei wählbar",
        holiday: "Feiertage",
      },
      categories: {
        public: "Gesetzlich",
        bank: "Bankfeiertag",
        government: "Behörden",
        school: "Schulferien",
        optional: "Optional",
        unofficial: "Inoffiziell",
        half_day: "Halber Tag",
        armed_forces: "Streitkräfte",
        workday: "Arbeitstag",
        catholic: "Katholisch",
        christian: "Christlich",
        orthodox: "Orthodox",
        hebrew: "Jüdisch",
        islamic: "Islamisch",
        hindu: "Hinduistisch",
        buddhist: "Buddhistisch",
      },
      categoriesPlural: {
        public: "Gesetzliche",
        bank: "Bankfeiertage",
        government: "Behörden",
        school: "Schulferien",
        optional: "Optionale",
        unofficial: "Inoffizielle",
        half_day: "Halbe Tage",
        armed_forces: "Streitkräfte",
        workday: "Arbeitstage",
        catholic: "Katholische",
        christian: "Christliche",
        orthodox: "Orthodoxe",
        hebrew: "Jüdische",
        islamic: "Islamische",
        hindu: "Hinduistische",
        buddhist: "Buddhistische",
      },
      editor: {
        title: "Kartentitel",
        titleDesc: "Eigener Titeltext für die Karte (leer lassen für den Standardtitel)",
        titlePlaceholder: "z. B. Anstehende Ereignisse",
        count: "Anzahl der Ereignisse",
        countDesc: "Legt die Gesamtanzahl der auf der Karte angezeigten Ereignisse fest",
        todayOnly: "Nur heute",
        todayOnlyDesc: "Alle anderen Filter unten ignorieren und nur Ereignisse von heute anzeigen",
        nextEventDayOnly: "Nur nächster Ereignistag",
        nextEventDayOnlyDesc:
          "Nur die Ereignisse des einen nächstgelegenen Tages anzeigen - heute, falls vorhanden, sonst der nächste Tag mit Ereignissen (ggf. mehrere)",
        daysAhead: "Tage im Voraus (0 = unbegrenzt)",
        daysAheadDesc: "Nur Ereignisse innerhalb dieser Anzahl Tage anzeigen (0 = unbegrenzt)",
        daysPast: "Tage in der Vergangenheit (0 = nur heute)",
        daysPastDesc: "Wie viele Tage in der Vergangenheit ein Ereignis noch als aktuell zählt (0 = nur heute)",
        soonDays: "Schwelle für „Bald“ (Tage)",
        soonDaysDesc: "Ereignisse innerhalb dieser Anzahl Tage gelten als „bald“",
        types: "Ereignistypen",
        typesDesc: "Nur die angehakten Ereignistypen anzeigen",
        categories: "Feiertagskategorien",
        categoriesDesc: "Nur Feiertage der angehakten Kategorien anzeigen (andere Ereignistypen sind davon nicht betroffen)",
        showAll: "Alle anzeigen",
        hideAll: "Alle ausblenden",
        visibilityHeading: "Ein- und ausblenden",
        visibilityPast: "Vergangene Ereignisse",
        visibilityPastDesc: "Vergangene Ereignisse innerhalb des eingestellten Zeitraums in der Liste anzeigen",
        visibilityToday: "Heutige Ereignisse",
        visibilityTodayDesc: "Heutige Ereignisse in der Liste anzeigen",
        visibilitySoon: "Baldige Ereignisse",
        visibilitySoonDesc: "Ereignisse innerhalb der „Bald“-Schwelle in der Liste anzeigen",
        visibilityCardTitleDesc: "Kartentitel in der Karte anzeigen",
        hideCardTitle: "Ausblenden",
        hideCardTitleDesc: "Eigenen Kartentitel ausblenden, auch wenn oben einer gesetzt ist",
        tapAction: "Aktion beim Antippen",
        tapActionDesc: "Was passiert, wenn eine Zeile angetippt oder angeklickt wird",
        holdAction: "Aktion beim Gedrückthalten",
        holdActionDesc: "Was passiert, wenn eine Zeile gedrückt gehalten wird",
        visibilityIcon: "Icon",
        visibilityIconDesc: "Symbol vor jeder Zeile anzeigen",
        visibilityTitleDesc: "Namen des Ereignisses anzeigen",
        visibilitySubtitleDesc: "Ereignistyp anzeigen",
        visibilityCountrySuffix: "Feiertagssuffix",
        visibilityCountrySuffixDesc: "Land (und ggf. Bundesland/Provinz) hinter dem Namen/Typ des Feiertags anhängen, z. B. „Tag der Deutschen Einheit · DE (BY)“",
        columnsHeading: "Zeilenspalten",
        columnsDesc: "Lege fest, was jede Zeile anzeigt, und in welcher Reihenfolge. Eigene Textspalten können freien Text mit Platzhaltern kombinieren: {name}, {type}, {occurrence}, {when}, {country}.",
        columnTypeIcon: "Icon",
        columnTypeInfo: "Name + Typ",
        columnTypeName: "Name",
        columnTypeSubtitle: "Typ",
        columnTypeText: "Freier Text",
        columnAdd: "Hinzufügen",
        columnMoveUp: "Nach oben",
        columnMoveDown: "Nach unten",
        columnRemove: "Entfernen",
        columnTemplatePlaceholder: "z. B. {name} wird heute {occurrence}",
        columnColor: "Farbe",
        columnsCompact: "Kompakt (kein Abstand, zentriert)",
        columnsCompactDesc: "Entfernt den Abstand zwischen den Spalten, zentriert die Zeile und gleicht Schriftstärke und Deckkraft aller Felder an - nützlich, wenn die Spalten einen zusammenhängenden Satz ergeben.",
        visibilityBadgeDesc: "Jubiläums-Badge anzeigen",
        visibilityWhenDesc: "Zeitangabe (Countdown) anzeigen",
        visibilityVipOnly: "Nur VIP",
        visibilityVipOnlyDesc: "Nur als „VIP Annual“ markierte Ereignisse anzeigen",
        visibilityImportantOnly: "Nur Important",
        visibilityImportantOnlyDesc:
          "Nur automatisch als wichtig markierte Ereignisse anzeigen (einstellbar unter Annual Settings in der Integration)",
        vipBadgeIcon: "VIP-Badge-Icon",
        vipBadgeIconDesc: "MDI-Icon, das als kleines Badge auf dem Icon von VIP-Ereignissen angezeigt wird",
        vipBadgeIconPlaceholder: "mdi:star",
        importantBadgeIcon: "Important-Badge-Icon",
        importantBadgeIconDesc:
          "MDI-Icon, das als kleines Badge auf dem Icon von automatisch als wichtig markierten Ereignissen angezeigt wird",
        importantBadgeIconPlaceholder: "mdi:exclamation-thick",
        highlightHeading: "Hervorheben",
        highlightPast: "Vergangene Ereignisse",
        highlightPastDesc: "Zeilenhintergrund für bereits vergangene Ereignisse einfärben",
        highlightToday: "Heutige Ereignisse",
        highlightTodayDesc: "Zeilenhintergrund für heutige Ereignisse einfärben",
        highlightSoon: "Baldige Ereignisse",
        highlightSoonDesc: "Zeilenhintergrund für Ereignisse innerhalb der „Bald“-Schwelle einfärben",
        highlightBgColor: "Hintergrundfarbe",
        highlightBgColorDesc: "Hintergrund-Einfärbung für dieses Highlight",
        highlightVip: "VIP Events",
        highlightVipDesc: "Badge auf dem Icon von VIP-Ereignissen anzeigen",
        highlightImportant: "Important Events",
        highlightImportantDesc: "Badge auf dem Icon von automatisch als wichtig markierten Ereignissen anzeigen",
        vipBadgeColor: "Badge-Farbe",
        vipBadgeColorDesc: "Hintergrundfarbe des VIP-Badges",
        importantBadgeColor: "Badge-Farbe",
        importantBadgeColorDesc: "Hintergrundfarbe des Important-Badges",
        colors: "Farben",
        cardBackgroundTabTitle: "Kartenhintergrund",
        cardBackgroundEnable: "Hintergrund anzeigen",
        cardBackgroundEnableDesc: "Eine eigene Farbe und/oder ein Bild hinter der gesamten Karte anzeigen",
        cardBackgroundColor: "Farbe",
        cardBackgroundColorDesc: "Hintergrundfarbe der Karte",
        cardBackgroundImage: "Bild",
        cardBackgroundImageDesc:
          "Ein Bild hochladen oder eine URL bzw. einen lokalen Medienpfad einfügen (z. B. aus dem Media-Browser von HA), das als Kartenhintergrund verwendet wird. Unterstützte Formate: JPEG, PNG, GIF, WebP. Die Datei sollte möglichst klein sein (max. wenige MB) für schnelles Laden.",
        cardBackgroundImagePlaceholder: "z. B. /local/mein-bild.jpg",
        cardBackgroundUpload: "Bild hochladen",
        cardBackgroundClear: "Bild entfernen",
        cardBackgroundSize: "Bildverhalten",
        cardBackgroundSizeDesc:
          "Ausfüllen: skaliert das Bild so, dass es die Karte vollständig ausfüllt, ggf. mit Beschnitt. Einpassen: skaliert das Bild so, dass es vollständig in die Karte passt, ggf. mit leerem Rand. Originalgröße: zeigt das Bild in Originalgröße, zentriert. Kacheln: wiederholt das Bild in Originalgröße kachelartig.",
        cardBackgroundSizeCover: "Ausfüllen",
        cardBackgroundSizeContain: "Einpassen",
        cardBackgroundSizeAuto: "Originalgröße",
        cardBackgroundSizeRepeat: "Kacheln",
        cardBackgroundOpacity: "Deckkraft",
        cardBackgroundOpacityDesc: "Deckkraft von Farbe/Bild im Hintergrund, in Prozent",
        colorsIconsHeading: "Icons",
        colorsLabelsHeading: "Beschriftung",
        colorToday: "Heute",
        colorSoon: "Demnächst",
        colorAccent: "Standard",
        colorTodayDesc: "Icon-Farbe für heutige Ereignisse",
        colorSoonDesc: "Icon-Farbe für Ereignisse innerhalb der „Bald“-Schwelle",
        colorAccentDesc: "Icon-Farbe für Ereignisse ohne besonderen Status",
        animationLabel: "Animation",
        animationNone: "Keine",
        animationPulse: "Pulsieren",
        animationBounce: "Hüpfen",
        animationShake: "Wackeln",
        animationSpin: "Drehen",
        animationFlash: "Blinken",
        animationDesc: "Dem Icon eine wiederkehrende Animation hinzufügen",
        matchTextLabel: "Auch den Text einfärben",
        matchTextDesc: "Auch den gesamten Zeilentext in dieser Icon-Farbe einfärben",
        colorTitle: "Name",
        colorSubtitle: "Typ",
        colorBadge: "Jubiläum",
        colorWhen: "Countdown",
        colorText: "Freier Text",
        cardTitleColorDesc: "Textfarbe für den Kartentitel",
        colorTitleDesc: "Textfarbe für den Namen des Ereignisses",
        colorSubtitleDesc: "Textfarbe für den Ereignistyp",
        colorBadgeDesc: "Textfarbe für das Jubiläums-Badge (Vorkommen-Nummer)",
        colorWhenDesc: "Textfarbe für die Zeitangabe (z. B. „in 3 Tagen“)",
        colorTextDesc: "Textfarbe für eigene Textspalten (siehe Zeilenspalten unter Layout -> Anzeige)",
        backgroundLabel: "Hintergrund anzeigen",
        backgroundDesc: "Zeigt einen abgerundeten Hintergrund hinter der Jubiläumszahl an",
        colorBadgeBackground: "Hintergrundfarbe",
        colorBadgeBackgroundDesc: "Hintergrundfarbe hinter der Jubiläumszahl",
        colorPlaceholder: "z. B. #ff5722 oder var(--my-red)",
        presetDefault: "Standard",
        presetPrimary: "Primär",
        presetAccent: "Akzent",
        presetCustom: "Benutzerdef.",
        presetRed: "Rot",
        presetPink: "Rosa",
        presetPurple: "Violett",
        presetDeepPurple: "Dunkelviolett",
        presetIndigo: "Indigo",
        presetBlue: "Blau",
        presetLightBlue: "Hellblau",
        presetCyan: "Cyan",
        presetTeal: "Türkis",
        presetGreen: "Grün",
        presetLightGreen: "Hellgrün",
        presetLime: "Limette",
        presetYellow: "Gelb",
        presetAmber: "Bernstein",
        presetOrange: "Orange",
        presetDeepOrange: "Dunkelorange",
        presetBrown: "Braun",
        presetGrey: "Grau",
        presetBlueGrey: "Blaugrau",
        fonts: "Schriften",
        fontCardTitle: "Kartentitel",
        fontCardTitleDesc: "Schriftgröße für den Kartentitel",
        fontTitleDesc: "Schriftgröße für den Namen des Ereignisses",
        fontSubtitleDesc: "Schriftgröße für den Ereignistyp",
        fontBadgeDesc: "Schriftgröße für das Jubiläums-Badge",
        fontWhenDesc: "Schriftgröße für die Zeitangabe (z. B. „in 3 Tagen“)",
        fontTextDesc: "Schriftgröße für eigene Textspalten (siehe Zeilenspalten unter Layout -> Anzeige)",
        fontPlaceholder: "z. B. 1.2em oder 20px",
        fontBold: "Fett",
        fontItalic: "Kursiv",
        fontUppercase: "Großbuchstaben",
        fontUnderline: "Unterstrichen",
        fontLetterSpacing: "Zeichenabstand",
        fontLetterSpacingPlaceholder: "z. B. 0.05em oder 1px",
        panelSettings: "Einstellungen",
        panelSettingsDesc: "Allgemein, Ereignisse und Zeitraum",
        panelLayout: "Layout",
        panelLayoutDesc: "Anzeige, Schriften, Farben, Icons und Hintergründe",
        groupGeneral: "Allgemein",
        groupGeneralDesc: "",
        groupEvents: "Ereignisse",
        groupEventsDesc: "",
        groupPeriod: "Zeitraum",
        groupPeriodDesc: "",
        groupDisplay: "Anzeige",
        groupDisplayDesc: "",
      },
    },
    fr: {
      defaultTitle: "Événements à venir",
      today: "Aujourd'hui",
      inDay: "Demain",
      inDays: (n) => `dans ${n} jours`,
      dayAgo: "Hier",
      daysAgo: (n) => `il y a ${n} jours`,
      noEvents: "Aucun événement à venir",
      types: {
        birthday: "Anniversaire",
        anniversary: "Date commémorative",
        name_day: "Fête",
        wedding_anniversary: "Anniversaire de mariage",
        memorial: "Commémoration",
        pet_birthday: "Anniversaire d'animal",
        work_anniversary: "Anniversaire professionnel",
        custom: "Personnalisé",
        holiday: "Jour férié",
      },
      typesPlural: {
        birthday: "Anniversaires",
        anniversary: "Dates commémoratives",
        name_day: "Fêtes",
        wedding_anniversary: "Anniversaires de mariage",
        memorial: "Commémorations",
        pet_birthday: "Anniversaires d'animaux",
        work_anniversary: "Anniversaires professionnels",
        custom: "Personnalisé",
        holiday: "Jours fériés",
      },
      categories: {
        public: "Public",
        bank: "Bancaire",
        government: "Administratif",
        school: "Vacances scolaires",
        optional: "Optionnel",
        unofficial: "Officieux",
        half_day: "Demi-journée",
        armed_forces: "Forces armées",
        workday: "Jour travaillé",
        catholic: "Catholique",
        christian: "Chrétien",
        orthodox: "Orthodoxe",
        hebrew: "Juif",
        islamic: "Islamique",
        hindu: "Hindou",
        buddhist: "Bouddhiste",
      },
      categoriesPlural: {
        public: "Publics",
        bank: "Bancaires",
        government: "Administratifs",
        school: "Vacances scolaires",
        optional: "Optionnels",
        unofficial: "Officieux",
        half_day: "Demi-journées",
        armed_forces: "Forces armées",
        workday: "Jours travaillés",
        catholic: "Catholiques",
        christian: "Chrétiens",
        orthodox: "Orthodoxes",
        hebrew: "Juifs",
        islamic: "Islamiques",
        hindu: "Hindous",
        buddhist: "Bouddhistes",
      },
      editor: {
        title: "Titre de la carte",
        titleDesc: "Texte de titre personnalisé pour la carte (laisser vide pour le titre par défaut)",
        titlePlaceholder: "par ex. Événements à venir",
        count: "Nombre d'événements",
        countDesc: "Le nombre total d'événements affichés sur la carte",
        todayOnly: "Aujourd'hui uniquement",
        todayOnlyDesc: "Ignorer tous les autres filtres ci-dessous et n'afficher que les événements du jour",
        nextEventDayOnly: "Seulement le jour du prochain événement",
        nextEventDayOnlyDesc:
          "N'afficher que les événements du jour le plus proche - aujourd'hui, le cas échéant, sinon le prochain jour avec des événements (éventuellement plusieurs)",
        daysAhead: "Jours à l'avance (0 = illimité)",
        daysAheadDesc: "N'afficher que les événements dans ce nombre de jours (0 = pas de limite)",
        daysPast: "Jours passés (0 = aujourd'hui seulement)",
        daysPastDesc: "Combien de jours passés un événement compte encore comme récent (0 = aujourd'hui seulement)",
        soonDays: "Seuil « bientôt » (jours)",
        soonDaysDesc: "Les événements dans ce nombre de jours comptent comme « bientôt »",
        types: "Types d'événements",
        typesDesc: "N'afficher que les types cochés",
        categories: "Catégories de jours fériés",
        categoriesDesc: "N'afficher que les jours fériés des catégories cochées (les autres types d'événements ne sont pas concernés)",
        showAll: "Tout afficher",
        hideAll: "Tout masquer",
        visibilityHeading: "Afficher / Masquer",
        visibilityPast: "Événements passés",
        visibilityPastDesc: "Afficher les événements dont l'anniversaire est déjà passé dans la période configurée",
        visibilityToday: "Événements du jour",
        visibilityTodayDesc: "Afficher les événements du jour",
        visibilitySoon: "Bientôt",
        visibilitySoonDesc: "Afficher les événements dans le seuil « bientôt »",
        visibilityCardTitleDesc: "Afficher le titre propre de la carte",
        hideCardTitle: "Masquer",
        hideCardTitleDesc: "Masquer le titre propre de la carte, même s'il est défini ci-dessus",
        tapAction: "Action au toucher",
        tapActionDesc: "Ce qui se passe lorsqu'une ligne est touchée ou cliquée",
        holdAction: "Action à l'appui long",
        holdActionDesc: "Ce qui se passe lorsqu'une ligne est maintenue appuyée",
        visibilityIcon: "Icône",
        visibilityIconDesc: "Afficher l'icône du type devant chaque ligne",
        visibilityTitleDesc: "Afficher le nom de l'événement",
        visibilitySubtitleDesc: "Afficher le type d'événement",
        visibilityCountrySuffix: "Suffixe du jour férié",
        visibilityCountrySuffixDesc: "Ajouter le pays (et la subdivision, le cas échéant) après le nom/type du jour férié, par ex. « Fête nationale · FR (75) »",
        columnsHeading: "Colonnes de ligne",
        columnsDesc: "Ajoutez, supprimez et réorganisez ce que chaque ligne affiche. Les colonnes de texte libre peuvent combiner du texte libre avec des espaces réservés : {name}, {type}, {occurrence}, {when}, {country}.",
        columnTypeIcon: "Icône",
        columnTypeInfo: "Nom + type",
        columnTypeName: "Nom",
        columnTypeSubtitle: "Type",
        columnTypeText: "Texte libre",
        columnAdd: "Ajouter",
        columnMoveUp: "Monter",
        columnMoveDown: "Descendre",
        columnRemove: "Supprimer",
        columnTemplatePlaceholder: "par ex. {name} a {occurrence} ans aujourd'hui",
        columnColor: "Couleur",
        columnsCompact: "Compact (sans espace, centré)",
        columnsCompactDesc: "Supprime l'espace entre les colonnes, centre la ligne, et harmonise la graisse et l'opacité de tous les champs - utile lorsque les colonnes forment une seule phrase continue.",
        visibilityBadgeDesc: "Afficher le badge du numéro d'occurrence",
        visibilityWhenDesc: "Afficher le compte à rebours (par ex. « dans 3 jours »)",
        visibilityVipOnly: "VIP uniquement",
        visibilityVipOnlyDesc: "N'afficher que les événements marqués « VIP Annual »",
        visibilityImportantOnly: "Important uniquement",
        visibilityImportantOnlyDesc:
          "N'afficher que les événements automatiquement marqués comme importants (configuré sous Annual Paramètres dans l'intégration)",
        vipBadgeIcon: "Icône du badge VIP",
        vipBadgeIconDesc: "Icône MDI affichée en petit badge sur l'icône des événements marqués VIP",
        vipBadgeIconPlaceholder: "mdi:star",
        importantBadgeIcon: "Icône du badge Important",
        importantBadgeIconDesc: "Icône MDI affichée en petit badge sur l'icône des événements automatiquement marqués comme importants",
        importantBadgeIconPlaceholder: "mdi:exclamation-thick",
        highlightHeading: "Mise en évidence",
        highlightPast: "Événements passés",
        highlightPastDesc: "Teinter le fond de la ligne pour les événements déjà passés",
        highlightToday: "Événements du jour",
        highlightTodayDesc: "Teinter le fond de la ligne pour les événements du jour",
        highlightSoon: "Bientôt",
        highlightSoonDesc: "Teinter le fond de la ligne pour les événements dans le seuil « bientôt »",
        highlightBgColor: "Couleur de fond",
        highlightBgColorDesc: "Couleur de fond pour cette mise en évidence",
        highlightVip: "Événements VIP",
        highlightVipDesc: "Afficher un badge sur l'icône des événements marqués VIP",
        highlightImportant: "Événements importants",
        highlightImportantDesc: "Afficher un badge sur l'icône des événements automatiquement marqués comme importants",
        vipBadgeColor: "Couleur du badge",
        vipBadgeColorDesc: "Couleur de fond du badge VIP",
        importantBadgeColor: "Couleur du badge",
        importantBadgeColorDesc: "Couleur de fond du badge Important",
        colors: "Couleurs",
        cardBackgroundTabTitle: "Fond de carte",
        cardBackgroundEnable: "Afficher le fond",
        cardBackgroundEnableDesc: "Afficher une couleur et/ou une image personnalisée derrière toute la carte",
        cardBackgroundColor: "Couleur",
        cardBackgroundColorDesc: "Couleur de fond de la carte",
        cardBackgroundImage: "Image",
        cardBackgroundImageDesc:
          "Téléversez une image, ou collez une URL ou un chemin de média local (par ex. depuis le navigateur de médias de HA) à utiliser comme fond de carte. Formats pris en charge : JPEG, PNG, GIF, WebP. Gardez le fichier raisonnablement petit (quelques Mo maximum) pour un chargement rapide.",
        cardBackgroundImagePlaceholder: "par ex. /local/mon-image.jpg",
        cardBackgroundUpload: "Téléverser une image",
        cardBackgroundClear: "Supprimer l'image",
        cardBackgroundSize: "Comportement de l'image",
        cardBackgroundSizeDesc:
          "Remplir : redimensionne l'image pour remplir entièrement la carte, en la recadrant si nécessaire. Ajuster : redimensionne l'image pour qu'elle tienne dans la carte sans recadrage, peut laisser un espace vide. Taille réelle : affiche l'image à sa taille d'origine, centrée. Mosaïque : répète l'image à sa taille d'origine pour couvrir la carte.",
        cardBackgroundSizeCover: "Remplir",
        cardBackgroundSizeContain: "Ajuster",
        cardBackgroundSizeAuto: "Taille réelle",
        cardBackgroundSizeRepeat: "Mosaïque",
        cardBackgroundOpacity: "Opacité",
        cardBackgroundOpacityDesc: "Opacité de la couleur/image de fond, en pourcentage",
        colorsIconsHeading: "Icônes",
        colorsLabelsHeading: "Libellés",
        colorToday: "Aujourd'hui",
        colorSoon: "Bientôt",
        colorAccent: "Par défaut",
        colorTodayDesc: "Couleur de l'icône pour les événements du jour",
        colorSoonDesc: "Couleur de l'icône pour les événements dans le seuil « bientôt »",
        colorAccentDesc: "Couleur de l'icône pour les événements sans statut particulier",
        animationLabel: "Animation",
        animationDesc: "Ajouter une animation en boucle à cette icône",
        animationNone: "Aucune",
        animationPulse: "Pulsation",
        animationBounce: "Rebond",
        animationShake: "Secousse",
        animationSpin: "Rotation",
        animationFlash: "Clignotement",
        matchTextLabel: "Colorer aussi le texte",
        matchTextDesc: "Colorer aussi tout le texte de la ligne avec cette couleur d'icône",
        colorTitle: "Nom",
        colorSubtitle: "Type",
        colorBadge: "Occurrence",
        colorWhen: "Compte à rebours",
        colorText: "Texte libre",
        cardTitleColorDesc: "Couleur du texte pour le titre propre de la carte",
        colorTitleDesc: "Couleur du texte pour le nom de l'événement",
        colorSubtitleDesc: "Couleur du texte pour le type d'événement",
        colorBadgeDesc: "Couleur du texte pour le badge du numéro d'occurrence",
        colorWhenDesc: "Couleur du texte pour le compte à rebours (par ex. « dans 3 jours »)",
        colorTextDesc: "Couleur du texte pour les colonnes de texte libre (voir Colonnes de ligne sous Disposition -> Affichage)",
        backgroundLabel: "Afficher le fond",
        backgroundDesc: "Afficher un fond arrondi derrière le numéro d'occurrence",
        colorBadgeBackground: "Couleur de fond",
        colorBadgeBackgroundDesc: "Couleur de fond derrière le numéro d'occurrence",
        colorPlaceholder: "par ex. #ff5722 ou var(--my-red)",
        presetDefault: "Par défaut",
        presetPrimary: "Primaire",
        presetAccent: "Accent",
        presetCustom: "Personnalisé",
        presetRed: "Rouge",
        presetPink: "Rose",
        presetPurple: "Violet",
        presetDeepPurple: "Violet foncé",
        presetIndigo: "Indigo",
        presetBlue: "Bleu",
        presetLightBlue: "Bleu clair",
        presetCyan: "Cyan",
        presetTeal: "Sarcelle",
        presetGreen: "Vert",
        presetLightGreen: "Vert clair",
        presetLime: "Citron vert",
        presetYellow: "Jaune",
        presetAmber: "Ambre",
        presetOrange: "Orange",
        presetDeepOrange: "Orange foncé",
        presetBrown: "Marron",
        presetGrey: "Gris",
        presetBlueGrey: "Gris bleu",
        fonts: "Polices",
        fontCardTitle: "Titre de la carte",
        fontCardTitleDesc: "Taille de police pour le titre propre de la carte",
        fontTitleDesc: "Taille de police pour le nom de l'événement",
        fontSubtitleDesc: "Taille de police pour le type d'événement",
        fontBadgeDesc: "Taille de police pour le badge du numéro d'occurrence",
        fontWhenDesc: "Taille de police pour le compte à rebours (par ex. « dans 3 jours »)",
        fontTextDesc: "Taille de police pour les colonnes de texte libre (voir Colonnes de ligne sous Disposition -> Affichage)",
        fontPlaceholder: "par ex. 1.2em ou 20px",
        fontBold: "Gras",
        fontItalic: "Italique",
        fontUppercase: "Majuscules",
        fontUnderline: "Souligné",
        fontLetterSpacing: "Espacement des lettres",
        fontLetterSpacingPlaceholder: "par ex. 0.05em ou 1px",
        panelSettings: "Paramètres",
        panelSettingsDesc: "Général, événements et période",
        panelLayout: "Mise en page",
        panelLayoutDesc: "Affichage, polices, couleurs, icônes et fonds",
        groupGeneral: "Général",
        groupGeneralDesc: "",
        groupEvents: "Événements",
        groupEventsDesc: "",
        groupPeriod: "Période",
        groupPeriodDesc: "",
        groupDisplay: "Affichage",
        groupDisplayDesc: "",
      },
    },
    nl: {
      defaultTitle: "Aankomende evenementen",
      today: "Vandaag",
      inDay: "Morgen",
      inDays: (n) => `over ${n} dagen`,
      dayAgo: "Gisteren",
      daysAgo: (n) => `${n} dagen geleden`,
      noEvents: "Geen aankomende evenementen",
      types: {
        birthday: "Verjaardag",
        anniversary: "Jaardag",
        name_day: "Naamdag",
        wedding_anniversary: "Trouwdag",
        memorial: "Sterfdag",
        pet_birthday: "Verjaardag huisdier",
        work_anniversary: "Werkjubileum",
        custom: "Aangepast",
        holiday: "Feestdag",
      },
      typesPlural: {
        birthday: "Verjaardagen",
        anniversary: "Jaardagen",
        name_day: "Naamdagen",
        wedding_anniversary: "Trouwdagen",
        memorial: "Sterfdagen",
        pet_birthday: "Verjaardagen huisdier",
        work_anniversary: "Werkjubilea",
        custom: "Aangepast",
        holiday: "Feestdagen",
      },
      categories: {
        public: "Nationaal",
        bank: "Bank",
        government: "Overheid",
        school: "Schoolvakantie",
        optional: "Optioneel",
        unofficial: "Onofficieel",
        half_day: "Halve dag",
        armed_forces: "Krijgsmacht",
        workday: "Werkdag",
        catholic: "Katholiek",
        christian: "Christelijk",
        orthodox: "Orthodox",
        hebrew: "Joods",
        islamic: "Islamitisch",
        hindu: "Hindoeïstisch",
        buddhist: "Boeddhistisch",
      },
      categoriesPlural: {
        public: "Nationale",
        bank: "Bank",
        government: "Overheid",
        school: "Schoolvakanties",
        optional: "Optionele",
        unofficial: "Onofficiële",
        half_day: "Halve dagen",
        armed_forces: "Krijgsmacht",
        workday: "Werkdagen",
        catholic: "Katholieke",
        christian: "Christelijke",
        orthodox: "Orthodoxe",
        hebrew: "Joodse",
        islamic: "Islamitische",
        hindu: "Hindoeïstische",
        buddhist: "Boeddhistische",
      },
      editor: {
        title: "Kaarttitel",
        titleDesc: "Aangepaste titeltekst voor de kaart (leeg laten voor de standaardtitel)",
        titlePlaceholder: "bijv. Aankomende evenementen",
        count: "Aantal evenementen",
        countDesc: "Het totale aantal evenementen dat op de kaart wordt getoond",
        todayOnly: "Alleen vandaag",
        todayOnlyDesc: "Negeer alle andere filters hieronder en toon alleen evenementen van vandaag",
        nextEventDayOnly: "Alleen eerstvolgende evenementdag",
        nextEventDayOnlyDesc:
          "Toon alleen de evenementen op de eerstvolgende dag - vandaag, indien van toepassing, anders de eerstvolgende dag met evenementen (mogelijk meerdere)",
        daysAhead: "Dagen vooruit (0 = onbeperkt)",
        daysAheadDesc: "Toon alleen evenementen binnen dit aantal dagen (0 = geen limiet)",
        daysPast: "Dagen in het verleden (0 = alleen vandaag)",
        daysPastDesc: "Hoeveel dagen in het verleden een evenement nog als recent telt (0 = alleen vandaag)",
        soonDays: "„Binnenkort”-drempel (dagen)",
        soonDaysDesc: "Evenementen binnen dit aantal dagen tellen als „binnenkort”",
        types: "Evenementtypes",
        typesDesc: "Toon alleen de aangevinkte evenementtypes",
        categories: "Feestdagcategorieën",
        categoriesDesc: "Toon alleen feestdagen uit de aangevinkte categorieën (andere evenementtypes blijven onaangetast)",
        showAll: "Alles tonen",
        hideAll: "Alles verbergen",
        visibilityHeading: "Tonen / Verbergen",
        visibilityPast: "Vergane evenementen",
        visibilityPastDesc: "Toon evenementen waarvan de jaardag al is geweest binnen het ingestelde verleden-venster",
        visibilityToday: "Evenementen van vandaag",
        visibilityTodayDesc: "Toon evenementen die vandaag plaatsvinden",
        visibilitySoon: "Binnenkort",
        visibilitySoonDesc: "Toon evenementen binnen de „binnenkort”-drempel",
        visibilityCardTitleDesc: "Toon de eigen titel van de kaart",
        hideCardTitle: "Verbergen",
        hideCardTitleDesc: "Verberg de eigen titel van de kaart, ook als deze hierboven is ingesteld",
        tapAction: "Actie bij tikken",
        tapActionDesc: "Wat er gebeurt als op een rij wordt getikt of geklikt",
        holdAction: "Actie bij ingedrukt houden",
        holdActionDesc: "Wat er gebeurt als een rij ingedrukt wordt gehouden",
        visibilityIcon: "Icoon",
        visibilityIconDesc: "Toon het type-icoon vóór elke rij",
        visibilityTitleDesc: "Toon de naam van het evenement",
        visibilitySubtitleDesc: "Toon het evenementtype",
        visibilityCountrySuffix: "Feestdagsuffix",
        visibilityCountrySuffixDesc: "Voeg het land (en eventueel de deelstaat/provincie) toe na de naam/type van de feestdag, bijv. „Bevrijdingsdag · NL (NH)”",
        columnsHeading: "Rijkolommen",
        columnsDesc: "Voeg toe, verwijder en herschik wat elke rij toont. Eigen tekstkolommen kunnen vrije tekst combineren met plaatshouders: {name}, {type}, {occurrence}, {when}, {country}.",
        columnTypeIcon: "Icoon",
        columnTypeInfo: "Naam + type",
        columnTypeName: "Naam",
        columnTypeSubtitle: "Type",
        columnTypeText: "Eigen tekst",
        columnAdd: "Toevoegen",
        columnMoveUp: "Omhoog",
        columnMoveDown: "Omlaag",
        columnRemove: "Verwijderen",
        columnTemplatePlaceholder: "bijv. {name} wordt vandaag {occurrence}",
        columnColor: "Kleur",
        columnsCompact: "Compact (geen ruimte, gecentreerd)",
        columnsCompactDesc: "Verwijdert de ruimte tussen de kolommen, centreert de rij, en laat alle velden overeenkomen in dikte en dekking - handig wanneer de kolommen één doorlopende zin vormen.",
        visibilityBadgeDesc: "Toon het badge met het jubileumnummer",
        visibilityWhenDesc: "Toon het aftellen (bijv. „over 3 dagen”)",
        visibilityVipOnly: "Alleen VIP",
        visibilityVipOnlyDesc: "Toon alleen evenementen gemarkeerd als „VIP Annual”",
        visibilityImportantOnly: "Alleen Important",
        visibilityImportantOnlyDesc:
          "Toon alleen evenementen die automatisch als belangrijk zijn gemarkeerd (in te stellen onder Annual Instellingen in de integratie)",
        vipBadgeIcon: "VIP-badge-icoon",
        vipBadgeIconDesc: "MDI-icoon dat als klein badge op het icoon van VIP-evenementen wordt getoond",
        vipBadgeIconPlaceholder: "mdi:star",
        importantBadgeIcon: "Important-badge-icoon",
        importantBadgeIconDesc: "MDI-icoon dat als klein badge op het icoon van automatisch als belangrijk gemarkeerde evenementen wordt getoond",
        importantBadgeIconPlaceholder: "mdi:exclamation-thick",
        highlightHeading: "Markeren",
        highlightPast: "Vergane evenementen",
        highlightPastDesc: "Rijachtergrond inkleuren voor evenementen die al zijn geweest",
        highlightToday: "Evenementen van vandaag",
        highlightTodayDesc: "Rijachtergrond inkleuren voor evenementen van vandaag",
        highlightSoon: "Binnenkort",
        highlightSoonDesc: "Rijachtergrond inkleuren voor evenementen binnen de „binnenkort”-drempel",
        highlightBgColor: "Achtergrondkleur",
        highlightBgColorDesc: "Achtergrondkleur voor deze markering",
        highlightVip: "VIP-evenementen",
        highlightVipDesc: "Toon een badge op het icoon van VIP-evenementen",
        highlightImportant: "Belangrijke evenementen",
        highlightImportantDesc: "Toon een badge op het icoon van automatisch als belangrijk gemarkeerde evenementen",
        vipBadgeColor: "Badgekleur",
        vipBadgeColorDesc: "Achtergrondkleur van het VIP-badge",
        importantBadgeColor: "Badgekleur",
        importantBadgeColorDesc: "Achtergrondkleur van het Important-badge",
        colors: "Kleuren",
        cardBackgroundTabTitle: "Kaartachtergrond",
        cardBackgroundEnable: "Achtergrond tonen",
        cardBackgroundEnableDesc: "Toon een eigen kleur en/of afbeelding achter de hele kaart",
        cardBackgroundColor: "Kleur",
        cardBackgroundColorDesc: "Achtergrondkleur van de kaart",
        cardBackgroundImage: "Afbeelding",
        cardBackgroundImageDesc:
          "Upload een afbeelding, of plak een URL of lokaal mediapad (bijv. uit de Media Browser van HA) om als kaartachtergrond te gebruiken. Ondersteunde formaten: JPEG, PNG, GIF, WebP. Houd het bestand redelijk klein (maximaal enkele MB) voor snel laden.",
        cardBackgroundImagePlaceholder: "bijv. /local/mijn-afbeelding.jpg",
        cardBackgroundUpload: "Afbeelding uploaden",
        cardBackgroundClear: "Afbeelding verwijderen",
        cardBackgroundSize: "Beeldgedrag",
        cardBackgroundSizeDesc:
          "Vullen: schaalt de afbeelding zodat deze de kaart volledig vult, indien nodig bijgesneden. Passend: schaalt de afbeelding zodat deze zonder bijsnijden in de kaart past, kan lege ruimte overlaten. Werkelijke grootte: toont de afbeelding op ware grootte, gecentreerd. Tegels: herhaalt de afbeelding op ware grootte om de kaart te betegelen.",
        cardBackgroundSizeCover: "Vullen",
        cardBackgroundSizeContain: "Passend",
        cardBackgroundSizeAuto: "Werkelijke grootte",
        cardBackgroundSizeRepeat: "Tegels",
        cardBackgroundOpacity: "Dekking",
        cardBackgroundOpacityDesc: "Dekking van de achtergrondkleur/-afbeelding, in procenten",
        colorsIconsHeading: "Iconen",
        colorsLabelsHeading: "Labels",
        colorToday: "Vandaag",
        colorSoon: "Binnenkort",
        colorAccent: "Standaard",
        colorTodayDesc: "Icoonkleur voor evenementen van vandaag",
        colorSoonDesc: "Icoonkleur voor evenementen binnen de „binnenkort”-drempel",
        colorAccentDesc: "Icoonkleur voor evenementen zonder speciale status",
        animationLabel: "Animatie",
        animationDesc: "Voeg een herhalende animatie toe aan dit icoon",
        animationNone: "Geen",
        animationPulse: "Pulseren",
        animationBounce: "Stuiteren",
        animationShake: "Schudden",
        animationSpin: "Draaien",
        animationFlash: "Knipperen",
        matchTextLabel: "Ook de tekst inkleuren",
        matchTextDesc: "Ook alle tekst van de rij inkleuren met deze icoonkleur",
        colorTitle: "Naam",
        colorSubtitle: "Type",
        colorBadge: "Jubileum",
        colorWhen: "Aftellen",
        colorText: "Eigen tekst",
        cardTitleColorDesc: "Tekstkleur voor de eigen titel van de kaart",
        colorTitleDesc: "Tekstkleur voor de naam van het evenement",
        colorSubtitleDesc: "Tekstkleur voor het evenementtype",
        colorBadgeDesc: "Tekstkleur voor het jubileumnummer-badge",
        colorWhenDesc: "Tekstkleur voor het aftellen (bijv. „over 3 dagen”)",
        colorTextDesc: "Tekstkleur voor eigen tekstkolommen (zie Rijkolommen onder Layout -> Weergave)",
        backgroundLabel: "Achtergrond tonen",
        backgroundDesc: "Toon een afgeronde achtergrond achter het jubileumnummer",
        colorBadgeBackground: "Achtergrondkleur",
        colorBadgeBackgroundDesc: "Achtergrondkleur achter het jubileumnummer",
        colorPlaceholder: "bijv. #ff5722 of var(--my-red)",
        presetDefault: "Standaard",
        presetPrimary: "Primair",
        presetAccent: "Accent",
        presetCustom: "Aangepast",
        presetRed: "Rood",
        presetPink: "Roze",
        presetPurple: "Paars",
        presetDeepPurple: "Donkerpaars",
        presetIndigo: "Indigo",
        presetBlue: "Blauw",
        presetLightBlue: "Lichtblauw",
        presetCyan: "Cyaan",
        presetTeal: "Blauwgroen",
        presetGreen: "Groen",
        presetLightGreen: "Lichtgroen",
        presetLime: "Limoen",
        presetYellow: "Geel",
        presetAmber: "Amber",
        presetOrange: "Oranje",
        presetDeepOrange: "Donkeroranje",
        presetBrown: "Bruin",
        presetGrey: "Grijs",
        presetBlueGrey: "Blauwgrijs",
        fonts: "Lettertypen",
        fontCardTitle: "Kaarttitel",
        fontCardTitleDesc: "Lettergrootte voor de eigen titel van de kaart",
        fontTitleDesc: "Lettergrootte voor de naam van het evenement",
        fontSubtitleDesc: "Lettergrootte voor het evenementtype",
        fontBadgeDesc: "Lettergrootte voor het jubileumnummer-badge",
        fontWhenDesc: "Lettergrootte voor het aftellen (bijv. „over 3 dagen”)",
        fontTextDesc: "Lettergrootte voor eigen tekstkolommen (zie Rijkolommen onder Layout -> Weergave)",
        fontPlaceholder: "bijv. 1.2em of 20px",
        fontBold: "Vet",
        fontItalic: "Cursief",
        fontUppercase: "Hoofdletters",
        fontUnderline: "Onderstreept",
        fontLetterSpacing: "Letterafstand",
        fontLetterSpacingPlaceholder: "bijv. 0.05em of 1px",
        panelSettings: "Instellingen",
        panelSettingsDesc: "Algemeen, evenementen en periode",
        panelLayout: "Lay-out",
        panelLayoutDesc: "Weergave, lettertypen, kleuren, iconen en achtergronden",
        groupGeneral: "Algemeen",
        groupGeneralDesc: "",
        groupEvents: "Evenementen",
        groupEventsDesc: "",
        groupPeriod: "Periode",
        groupPeriodDesc: "",
        groupDisplay: "Weergave",
        groupDisplayDesc: "",
      },
    },
    pl: {
      defaultTitle: "Nadchodzące wydarzenia",
      today: "Dzisiaj",
      inDay: "Jutro",
      inDays: (n) => `za ${n} dni`,
      dayAgo: "Wczoraj",
      daysAgo: (n) => `${n} dni temu`,
      noEvents: "Brak nadchodzących wydarzeń",
      types: {
        birthday: "Urodziny",
        anniversary: "Rocznica",
        name_day: "Imieniny",
        wedding_anniversary: "Rocznica ślubu",
        memorial: "Rocznica śmierci",
        pet_birthday: "Urodziny zwierzaka",
        work_anniversary: "Jubileusz pracy",
        custom: "Inne",
        holiday: "Święto",
      },
      typesPlural: {
        birthday: "Urodziny",
        anniversary: "Rocznice",
        name_day: "Imieniny",
        wedding_anniversary: "Rocznice ślubu",
        memorial: "Rocznice śmierci",
        pet_birthday: "Urodziny zwierzaków",
        work_anniversary: "Jubileusze pracy",
        custom: "Inne",
        holiday: "Święta",
      },
      categories: {
        public: "Państwowe",
        bank: "Bankowe",
        government: "Urzędowe",
        school: "Szkolne",
        optional: "Opcjonalne",
        unofficial: "Nieoficjalne",
        half_day: "Pół dnia",
        armed_forces: "Wojskowe",
        workday: "Dzień roboczy",
        catholic: "Katolickie",
        christian: "Chrześcijańskie",
        orthodox: "Prawosławne",
        hebrew: "Żydowskie",
        islamic: "Islamskie",
        hindu: "Hinduskie",
        buddhist: "Buddyjskie",
      },
      categoriesPlural: {
        public: "Święta państwowe",
        bank: "Święta bankowe",
        government: "Dni urzędowe",
        school: "Ferie szkolne",
        optional: "Święta opcjonalne",
        unofficial: "Święta nieoficjalne",
        half_day: "Dni skrócone",
        armed_forces: "Święta wojskowe",
        workday: "Dni robocze",
        catholic: "Święta katolickie",
        christian: "Święta chrześcijańskie",
        orthodox: "Święta prawosławne",
        hebrew: "Święta żydowskie",
        islamic: "Święta islamskie",
        hindu: "Święta hinduskie",
        buddhist: "Święta buddyjskie",
      },
      editor: {
        title: "Tytuł karty",
        titleDesc: "Własny tekst tytułu karty (pozostaw puste dla domyślnego tytułu)",
        titlePlaceholder: "np. Nadchodzące wydarzenia",
        count: "Liczba wydarzeń",
        countDesc: "Łączna liczba wydarzeń pokazywanych na karcie",
        todayOnly: "Tylko dzisiaj",
        todayOnlyDesc: "Zignoruj wszystkie inne filtry poniżej i pokaż tylko dzisiejsze wydarzenia",
        nextEventDayOnly: "Tylko dzień najbliższego wydarzenia",
        nextEventDayOnlyDesc:
          "Pokaż tylko wydarzenia z najbliższego dnia - dzisiaj, jeśli są, w przeciwnym razie następny dzień z wydarzeniami (możliwe więcej niż jedno)",
        daysAhead: "Dni naprzód (0 = bez limitu)",
        daysAheadDesc: "Pokazuj tylko wydarzenia w ciągu tylu dni (0 = bez limitu)",
        daysPast: "Dni wstecz (0 = tylko dzisiaj)",
        daysPastDesc: "Ile dni wstecz wydarzenie nadal liczy się jako aktualne (0 = tylko dzisiaj)",
        soonDays: "Próg „wkrótce” (dni)",
        soonDaysDesc: "Wydarzenia w ciągu tylu dni liczą się jako „wkrótce”",
        types: "Typy wydarzeń",
        typesDesc: "Pokazuj tylko zaznaczone typy wydarzeń",
        categories: "Kategorie świąt",
        categoriesDesc: "Pokazuj tylko święta z zaznaczonych kategorii (inne typy wydarzeń pozostają bez zmian)",
        showAll: "Pokaż wszystko",
        hideAll: "Ukryj wszystko",
        visibilityHeading: "Pokaż / Ukryj",
        visibilityPast: "Minione wydarzenia",
        visibilityPastDesc: "Pokaż wydarzenia, których rocznica już minęła w skonfigurowanym oknie przeszłości",
        visibilityToday: "Dzisiejsze wydarzenia",
        visibilityTodayDesc: "Pokaż wydarzenia mające miejsce dzisiaj",
        visibilitySoon: "Wkrótce",
        visibilitySoonDesc: "Pokaż wydarzenia w progu „wkrótce”",
        visibilityCardTitleDesc: "Pokaż własny tytuł karty",
        hideCardTitle: "Ukryj",
        hideCardTitleDesc: "Ukryj własny tytuł karty, nawet jeśli ustawiono go powyżej",
        tapAction: "Akcja dotknięcia",
        tapActionDesc: "Co się dzieje po dotknięciu lub kliknięciu wiersza",
        holdAction: "Akcja przytrzymania",
        holdActionDesc: "Co się dzieje po przytrzymaniu wiersza",
        visibilityIcon: "Ikona",
        visibilityIconDesc: "Pokaż ikonę typu przed każdym wierszem",
        visibilityTitleDesc: "Pokaż nazwę wydarzenia",
        visibilitySubtitleDesc: "Pokaż typ wydarzenia",
        visibilityCountrySuffix: "Sufiks święta",
        visibilityCountrySuffixDesc: "Dodaj kraj (i ewentualnie region) po nazwie/typie święta, np. „Święto Niepodległości · PL (MAZ)”",
        columnsHeading: "Kolumny wiersza",
        columnsDesc: "Dodawaj, usuwaj i zmieniaj kolejność tego, co pokazuje każdy wiersz. Kolumny własnego tekstu mogą łączyć dowolny tekst z symbolami zastępczymi: {name}, {type}, {occurrence}, {when}, {country}.",
        columnTypeIcon: "Ikona",
        columnTypeInfo: "Nazwa + typ",
        columnTypeName: "Nazwa",
        columnTypeSubtitle: "Typ",
        columnTypeText: "Własny tekst",
        columnAdd: "Dodaj",
        columnMoveUp: "Przenieś w górę",
        columnMoveDown: "Przenieś w dół",
        columnRemove: "Usuń",
        columnTemplatePlaceholder: "np. {name} kończy dziś {occurrence} lat",
        columnColor: "Kolor",
        columnsCompact: "Kompaktowy (bez odstępów, wyśrodkowany)",
        columnsCompactDesc: "Usuwa odstępy między kolumnami, wyśrodkowuje wiersz i ujednolica grubość oraz krycie wszystkich pól - przydatne, gdy kolumny tworzą jedno spójne zdanie.",
        visibilityBadgeDesc: "Pokaż odznakę numeru wystąpienia",
        visibilityWhenDesc: "Pokaż odliczanie (np. „za 3 dni”)",
        visibilityVipOnly: "Tylko VIP",
        visibilityVipOnlyDesc: "Pokaż tylko wydarzenia oznaczone jako „VIP Annual”",
        visibilityImportantOnly: "Tylko Important",
        visibilityImportantOnlyDesc:
          "Pokaż tylko wydarzenia automatycznie oznaczone jako ważne (konfigurowane w Annual Ustawienia w integracji)",
        vipBadgeIcon: "Ikona odznaki VIP",
        vipBadgeIconDesc: "Ikona MDI pokazywana jako mała odznaka na ikonie wydarzeń oznaczonych VIP",
        vipBadgeIconPlaceholder: "mdi:star",
        importantBadgeIcon: "Ikona odznaki Important",
        importantBadgeIconDesc: "Ikona MDI pokazywana jako mała odznaka na ikonie wydarzeń automatycznie oznaczonych jako ważne",
        importantBadgeIconPlaceholder: "mdi:exclamation-thick",
        highlightHeading: "Wyróżnienie",
        highlightPast: "Minione wydarzenia",
        highlightPastDesc: "Zabarw tło wiersza dla wydarzeń, które już się odbyły",
        highlightToday: "Dzisiejsze wydarzenia",
        highlightTodayDesc: "Zabarw tło wiersza dla dzisiejszych wydarzeń",
        highlightSoon: "Wkrótce",
        highlightSoonDesc: "Zabarw tło wiersza dla wydarzeń w progu „wkrótce”",
        highlightBgColor: "Kolor tła",
        highlightBgColorDesc: "Kolor zabarwienia tła dla tego wyróżnienia",
        highlightVip: "Wydarzenia VIP",
        highlightVipDesc: "Pokaż odznakę na ikonie wydarzeń oznaczonych VIP",
        highlightImportant: "Wydarzenia ważne",
        highlightImportantDesc: "Pokaż odznakę na ikonie wydarzeń automatycznie oznaczonych jako ważne",
        vipBadgeColor: "Kolor odznaki",
        vipBadgeColorDesc: "Kolor tła odznaki VIP",
        importantBadgeColor: "Kolor odznaki",
        importantBadgeColorDesc: "Kolor tła odznaki Important",
        colors: "Kolory",
        cardBackgroundTabTitle: "Tło karty",
        cardBackgroundEnable: "Pokaż tło",
        cardBackgroundEnableDesc: "Pokaż własny kolor i/lub obraz za całą kartą",
        cardBackgroundColor: "Kolor",
        cardBackgroundColorDesc: "Kolor tła karty",
        cardBackgroundImage: "Obraz",
        cardBackgroundImageDesc:
          "Prześlij obraz lub wklej adres URL bądź lokalną ścieżkę multimediów (np. z przeglądarki multimediów HA), aby użyć jako tła karty. Obsługiwane formaty: JPEG, PNG, GIF, WebP. Zachowaj rozsądnie mały rozmiar pliku (maks. kilka MB) dla szybkiego ładowania.",
        cardBackgroundImagePlaceholder: "np. /local/moj-obraz.jpg",
        cardBackgroundUpload: "Prześlij obraz",
        cardBackgroundClear: "Usuń obraz",
        cardBackgroundSize: "Zachowanie obrazu",
        cardBackgroundSizeDesc:
          "Wypełnij: skaluje obraz tak, aby całkowicie wypełnił kartę, przycinając w razie potrzeby. Dopasuj: skaluje obraz tak, aby zmieścił się w karcie bez przycinania, może pozostawić puste miejsce. Rozmiar rzeczywisty: pokazuje obraz w oryginalnym rozmiarze, wyśrodkowany. Kafelki: powtarza obraz w oryginalnym rozmiarze, kafelkując kartę.",
        cardBackgroundSizeCover: "Wypełnij",
        cardBackgroundSizeContain: "Dopasuj",
        cardBackgroundSizeAuto: "Rozmiar rzeczywisty",
        cardBackgroundSizeRepeat: "Kafelki",
        cardBackgroundOpacity: "Nieprzezroczystość",
        cardBackgroundOpacityDesc: "Nieprzezroczystość koloru/obrazu tła, w procentach",
        colorsIconsHeading: "Ikony",
        colorsLabelsHeading: "Etykiety",
        colorToday: "Dzisiaj",
        colorSoon: "Wkrótce",
        colorAccent: "Domyślny",
        colorTodayDesc: "Kolor ikony dla dzisiejszych wydarzeń",
        colorSoonDesc: "Kolor ikony dla wydarzeń w progu „wkrótce”",
        colorAccentDesc: "Kolor ikony dla wydarzeń bez specjalnego statusu",
        animationLabel: "Animacja",
        animationDesc: "Dodaj zapętloną animację do tej ikony",
        animationNone: "Brak",
        animationPulse: "Pulsowanie",
        animationBounce: "Odbijanie",
        animationShake: "Trzęsienie",
        animationSpin: "Obracanie",
        animationFlash: "Miganie",
        matchTextLabel: "Zabarw też tekst",
        matchTextDesc: "Zabarw też cały tekst wiersza tym kolorem ikony",
        colorTitle: "Nazwa",
        colorSubtitle: "Typ",
        colorBadge: "Wystąpienie",
        colorWhen: "Odliczanie",
        colorText: "Własny tekst",
        cardTitleColorDesc: "Kolor tekstu dla własnego tytułu karty",
        colorTitleDesc: "Kolor tekstu dla nazwy wydarzenia",
        colorSubtitleDesc: "Kolor tekstu dla typu wydarzenia",
        colorBadgeDesc: "Kolor tekstu dla odznaki numeru wystąpienia",
        colorWhenDesc: "Kolor tekstu dla odliczania (np. „za 3 dni”)",
        colorTextDesc: "Kolor tekstu dla kolumn własnego tekstu (zobacz Kolumny wiersza w Układ -> Wyświetlanie)",
        backgroundLabel: "Pokaż tło",
        backgroundDesc: "Pokaż zaokrąglone tło za numerem wystąpienia",
        colorBadgeBackground: "Kolor tła",
        colorBadgeBackgroundDesc: "Kolor tła za numerem wystąpienia",
        colorPlaceholder: "np. #ff5722 lub var(--my-red)",
        presetDefault: "Domyślny",
        presetPrimary: "Podstawowy",
        presetAccent: "Akcent",
        presetCustom: "Niestandardowy",
        presetRed: "Czerwony",
        presetPink: "Różowy",
        presetPurple: "Fioletowy",
        presetDeepPurple: "Ciemnofioletowy",
        presetIndigo: "Indygo",
        presetBlue: "Niebieski",
        presetLightBlue: "Jasnoniebieski",
        presetCyan: "Cyjan",
        presetTeal: "Morski",
        presetGreen: "Zielony",
        presetLightGreen: "Jasnozielony",
        presetLime: "Limonkowy",
        presetYellow: "Żółty",
        presetAmber: "Bursztynowy",
        presetOrange: "Pomarańczowy",
        presetDeepOrange: "Ciemnopomarańczowy",
        presetBrown: "Brązowy",
        presetGrey: "Szary",
        presetBlueGrey: "Niebieskoszary",
        fonts: "Czcionki",
        fontCardTitle: "Tytuł karty",
        fontCardTitleDesc: "Rozmiar czcionki dla własnego tytułu karty",
        fontTitleDesc: "Rozmiar czcionki dla nazwy wydarzenia",
        fontSubtitleDesc: "Rozmiar czcionki dla typu wydarzenia",
        fontBadgeDesc: "Rozmiar czcionki dla odznaki numeru wystąpienia",
        fontWhenDesc: "Rozmiar czcionki dla odliczania (np. „za 3 dni”)",
        fontTextDesc: "Rozmiar czcionki dla kolumn własnego tekstu (zobacz Kolumny wiersza w Układ -> Wyświetlanie)",
        fontPlaceholder: "np. 1.2em lub 20px",
        fontBold: "Pogrubienie",
        fontItalic: "Kursywa",
        fontUppercase: "Wielkie litery",
        fontUnderline: "Podkreślenie",
        fontLetterSpacing: "Odstęp między literami",
        fontLetterSpacingPlaceholder: "np. 0.05em lub 1px",
        panelSettings: "Ustawienia",
        panelSettingsDesc: "Ogólne, wydarzenia i okres",
        panelLayout: "Układ",
        panelLayoutDesc: "Wyświetlanie, czcionki, kolory, ikony i tła",
        groupGeneral: "Ogólne",
        groupGeneralDesc: "",
        groupEvents: "Wydarzenia",
        groupEventsDesc: "",
        groupPeriod: "Okres",
        groupPeriodDesc: "",
        groupDisplay: "Wyświetlanie",
        groupDisplayDesc: "",
      },
    },
    es: {
      defaultTitle: "Próximos eventos",
      today: "Hoy",
      inDay: "Mañana",
      inDays: (n) => `en ${n} días`,
      dayAgo: "Ayer",
      daysAgo: (n) => `hace ${n} días`,
      noEvents: "No hay próximos eventos",
      types: {
        birthday: "Cumpleaños",
        anniversary: "Aniversario",
        name_day: "Onomástica",
        wedding_anniversary: "Aniversario de boda",
        memorial: "Aniversario de fallecimiento",
        pet_birthday: "Cumpleaños de mascota",
        work_anniversary: "Aniversario laboral",
        custom: "Personalizado",
        holiday: "Festivo",
      },
      typesPlural: {
        birthday: "Cumpleaños",
        anniversary: "Aniversarios",
        name_day: "Onomásticas",
        wedding_anniversary: "Aniversarios de boda",
        memorial: "Aniversarios de fallecimiento",
        pet_birthday: "Cumpleaños de mascota",
        work_anniversary: "Aniversarios laborales",
        custom: "Personalizado",
        holiday: "Festivos",
      },
      categories: {
        public: "Público",
        bank: "Bancario",
        government: "Administrativo",
        school: "Vacaciones escolares",
        optional: "Opcional",
        unofficial: "Extraoficial",
        half_day: "Media jornada",
        armed_forces: "Fuerzas armadas",
        workday: "Día laborable",
        catholic: "Católico",
        christian: "Cristiano",
        orthodox: "Ortodoxo",
        hebrew: "Judío",
        islamic: "Islámico",
        hindu: "Hindú",
        buddhist: "Budista",
      },
      categoriesPlural: {
        public: "Públicos",
        bank: "Bancarios",
        government: "Administrativos",
        school: "Vacaciones escolares",
        optional: "Opcionales",
        unofficial: "Extraoficiales",
        half_day: "Medias jornadas",
        armed_forces: "Fuerzas armadas",
        workday: "Días laborables",
        catholic: "Católicos",
        christian: "Cristianos",
        orthodox: "Ortodoxos",
        hebrew: "Judíos",
        islamic: "Islámicos",
        hindu: "Hindúes",
        buddhist: "Budistas",
      },
      editor: {
        title: "Título de la tarjeta",
        titleDesc: "Texto de título personalizado para la tarjeta (dejar vacío para el título predeterminado)",
        titlePlaceholder: "p. ej. Próximos eventos",
        count: "Número de eventos",
        countDesc: "El número total de eventos mostrados en la tarjeta",
        todayOnly: "Solo hoy",
        todayOnlyDesc: "Ignorar todos los demás filtros a continuación y mostrar solo los eventos de hoy",
        nextEventDayOnly: "Solo el día del próximo evento",
        nextEventDayOnlyDesc:
          "Mostrar solo los eventos del día más próximo - hoy, si los hay, o si no el siguiente día con eventos (posiblemente más de uno)",
        daysAhead: "Días de antelación (0 = ilimitado)",
        daysAheadDesc: "Mostrar solo eventos dentro de este número de días (0 = sin límite)",
        daysPast: "Días pasados (0 = solo hoy)",
        daysPastDesc: "Cuántos días en el pasado un evento sigue contando como reciente (0 = solo hoy)",
        soonDays: "Umbral «pronto» (días)",
        soonDaysDesc: "Los eventos dentro de este número de días cuentan como «pronto»",
        types: "Tipos de evento",
        typesDesc: "Mostrar solo los tipos de evento marcados",
        categories: "Categorías de festivos",
        categoriesDesc: "Mostrar solo los festivos de las categorías marcadas (los demás tipos de evento no se ven afectados)",
        showAll: "Mostrar todo",
        hideAll: "Ocultar todo",
        visibilityHeading: "Mostrar / Ocultar",
        visibilityPast: "Eventos pasados",
        visibilityPastDesc: "Mostrar eventos cuyo aniversario ya pasó dentro de la ventana pasada configurada",
        visibilityToday: "Eventos de hoy",
        visibilityTodayDesc: "Mostrar eventos que ocurren hoy",
        visibilitySoon: "Próximamente",
        visibilitySoonDesc: "Mostrar eventos dentro del umbral «pronto»",
        visibilityCardTitleDesc: "Mostrar el título propio de la tarjeta",
        hideCardTitle: "Ocultar",
        hideCardTitleDesc: "Ocultar el título propio de la tarjeta, aunque esté configurado arriba",
        tapAction: "Acción al tocar",
        tapActionDesc: "Qué ocurre al tocar o hacer clic en una fila",
        holdAction: "Acción al mantener pulsado",
        holdActionDesc: "Qué ocurre al mantener pulsada una fila",
        visibilityIcon: "Icono",
        visibilityIconDesc: "Mostrar el icono de tipo delante de cada fila",
        visibilityTitleDesc: "Mostrar el nombre del evento",
        visibilitySubtitleDesc: "Mostrar el tipo de evento",
        visibilityCountrySuffix: "Sufijo del festivo",
        visibilityCountrySuffixDesc: "Añadir el país (y la subdivisión, si la hay) tras el nombre/tipo del festivo, p. ej. «Día de la Hispanidad · ES (MD)»",
        columnsHeading: "Columnas de fila",
        columnsDesc: "Añade, elimina y reordena lo que muestra cada fila. Las columnas de texto personalizado pueden combinar texto libre con marcadores de posición: {name}, {type}, {occurrence}, {when}, {country}.",
        columnTypeIcon: "Icono",
        columnTypeInfo: "Nombre + tipo",
        columnTypeName: "Nombre",
        columnTypeSubtitle: "Tipo",
        columnTypeText: "Texto personalizado",
        columnAdd: "Añadir",
        columnMoveUp: "Subir",
        columnMoveDown: "Bajar",
        columnRemove: "Eliminar",
        columnTemplatePlaceholder: "p. ej. {name} cumple {occurrence} hoy",
        columnColor: "Color",
        columnsCompact: "Compacto (sin espacios, centrado)",
        columnsCompactDesc: "Elimina el espacio entre columnas, centra la fila y iguala el grosor y la opacidad de todos los campos - útil cuando las columnas forman una sola frase continua.",
        visibilityBadgeDesc: "Mostrar la insignia del número de ocurrencia",
        visibilityWhenDesc: "Mostrar la cuenta atrás (p. ej. «en 3 días»)",
        visibilityVipOnly: "Solo VIP",
        visibilityVipOnlyDesc: "Mostrar solo eventos marcados como «VIP Annual»",
        visibilityImportantOnly: "Solo Important",
        visibilityImportantOnlyDesc:
          "Mostrar solo eventos marcados automáticamente como importantes (configurado en Annual Ajustes en la integración)",
        vipBadgeIcon: "Icono de la insignia VIP",
        vipBadgeIconDesc: "Icono MDI mostrado como pequeña insignia en el icono de los eventos marcados como VIP",
        vipBadgeIconPlaceholder: "mdi:star",
        importantBadgeIcon: "Icono de la insignia Important",
        importantBadgeIconDesc: "Icono MDI mostrado como pequeña insignia en el icono de los eventos marcados automáticamente como importantes",
        importantBadgeIconPlaceholder: "mdi:exclamation-thick",
        highlightHeading: "Resaltado",
        highlightPast: "Eventos pasados",
        highlightPastDesc: "Teñir el fondo de la fila para eventos que ya han ocurrido",
        highlightToday: "Eventos de hoy",
        highlightTodayDesc: "Teñir el fondo de la fila para eventos de hoy",
        highlightSoon: "Próximamente",
        highlightSoonDesc: "Teñir el fondo de la fila para eventos dentro del umbral «pronto»",
        highlightBgColor: "Color de fondo",
        highlightBgColorDesc: "Color de tinte de fondo para este resaltado",
        highlightVip: "Eventos VIP",
        highlightVipDesc: "Mostrar una insignia en el icono de los eventos marcados como VIP",
        highlightImportant: "Eventos importantes",
        highlightImportantDesc: "Mostrar una insignia en el icono de los eventos marcados automáticamente como importantes",
        vipBadgeColor: "Color de la insignia",
        vipBadgeColorDesc: "Color de fondo de la insignia VIP",
        importantBadgeColor: "Color de la insignia",
        importantBadgeColorDesc: "Color de fondo de la insignia Important",
        colors: "Colores",
        cardBackgroundTabTitle: "Fondo de la tarjeta",
        cardBackgroundEnable: "Mostrar fondo",
        cardBackgroundEnableDesc: "Mostrar un color y/o imagen personalizados detrás de toda la tarjeta",
        cardBackgroundColor: "Color",
        cardBackgroundColorDesc: "Color de fondo de la tarjeta",
        cardBackgroundImage: "Imagen",
        cardBackgroundImageDesc:
          "Sube una imagen, o pega una URL o una ruta de medios local (p. ej. del Navegador de medios de HA) para usar como fondo de la tarjeta. Formatos admitidos: JPEG, PNG, GIF, WebP. Mantén el archivo razonablemente pequeño (unos pocos MB como máximo) para una carga rápida.",
        cardBackgroundImagePlaceholder: "p. ej. /local/mi-imagen.jpg",
        cardBackgroundUpload: "Subir imagen",
        cardBackgroundClear: "Quitar imagen",
        cardBackgroundSize: "Comportamiento de la imagen",
        cardBackgroundSizeDesc:
          "Rellenar: escala la imagen para llenar completamente la tarjeta, recortando si es necesario. Ajustar: escala la imagen para que quepa dentro de la tarjeta sin recortar, puede dejar espacio vacío. Tamaño real: muestra la imagen en su tamaño original, centrada. Mosaico: repite la imagen en su tamaño original para cubrir la tarjeta.",
        cardBackgroundSizeCover: "Rellenar",
        cardBackgroundSizeContain: "Ajustar",
        cardBackgroundSizeAuto: "Tamaño real",
        cardBackgroundSizeRepeat: "Mosaico",
        cardBackgroundOpacity: "Opacidad",
        cardBackgroundOpacityDesc: "Opacidad del color/imagen de fondo, en porcentaje",
        colorsIconsHeading: "Iconos",
        colorsLabelsHeading: "Etiquetas",
        colorToday: "Hoy",
        colorSoon: "Pronto",
        colorAccent: "Predeterminado",
        colorTodayDesc: "Color del icono para los eventos de hoy",
        colorSoonDesc: "Color del icono para eventos dentro del umbral «pronto»",
        colorAccentDesc: "Color del icono para eventos sin estado especial",
        animationLabel: "Animación",
        animationDesc: "Añadir una animación en bucle a este icono",
        animationNone: "Ninguna",
        animationPulse: "Pulso",
        animationBounce: "Rebote",
        animationShake: "Vibración",
        animationSpin: "Giro",
        animationFlash: "Parpadeo",
        matchTextLabel: "Colorear también el texto",
        matchTextDesc: "Colorear también todo el texto de la fila con este color de icono",
        colorTitle: "Nombre",
        colorSubtitle: "Tipo",
        colorBadge: "Ocurrencia",
        colorWhen: "Cuenta atrás",
        colorText: "Texto personalizado",
        cardTitleColorDesc: "Color del texto para el título propio de la tarjeta",
        colorTitleDesc: "Color del texto para el nombre del evento",
        colorSubtitleDesc: "Color del texto para el tipo de evento",
        colorBadgeDesc: "Color del texto para la insignia del número de ocurrencia",
        colorWhenDesc: "Color del texto para la cuenta atrás (p. ej. «en 3 días»)",
        colorTextDesc: "Color del texto para columnas de texto personalizado (ver Columnas de fila en Diseño -> Visualización)",
        backgroundLabel: "Mostrar fondo",
        backgroundDesc: "Mostrar un fondo redondeado detrás del número de ocurrencia",
        colorBadgeBackground: "Color de fondo",
        colorBadgeBackgroundDesc: "Color de fondo detrás del número de ocurrencia",
        colorPlaceholder: "p. ej. #ff5722 o var(--my-red)",
        presetDefault: "Predeterminado",
        presetPrimary: "Primario",
        presetAccent: "Acento",
        presetCustom: "Personalizado",
        presetRed: "Rojo",
        presetPink: "Rosa",
        presetPurple: "Morado",
        presetDeepPurple: "Morado oscuro",
        presetIndigo: "Índigo",
        presetBlue: "Azul",
        presetLightBlue: "Azul claro",
        presetCyan: "Cian",
        presetTeal: "Verde azulado",
        presetGreen: "Verde",
        presetLightGreen: "Verde claro",
        presetLime: "Lima",
        presetYellow: "Amarillo",
        presetAmber: "Ámbar",
        presetOrange: "Naranja",
        presetDeepOrange: "Naranja oscuro",
        presetBrown: "Marrón",
        presetGrey: "Gris",
        presetBlueGrey: "Gris azulado",
        fonts: "Fuentes",
        fontCardTitle: "Título de la tarjeta",
        fontCardTitleDesc: "Tamaño de fuente para el título propio de la tarjeta",
        fontTitleDesc: "Tamaño de fuente para el nombre del evento",
        fontSubtitleDesc: "Tamaño de fuente para el tipo de evento",
        fontBadgeDesc: "Tamaño de fuente para la insignia del número de ocurrencia",
        fontWhenDesc: "Tamaño de fuente para la cuenta atrás (p. ej. «en 3 días»)",
        fontTextDesc: "Tamaño de fuente para columnas de texto personalizado (ver Columnas de fila en Diseño -> Visualización)",
        fontPlaceholder: "p. ej. 1.2em o 20px",
        fontBold: "Negrita",
        fontItalic: "Cursiva",
        fontUppercase: "Mayúsculas",
        fontUnderline: "Subrayado",
        fontLetterSpacing: "Espaciado de letras",
        fontLetterSpacingPlaceholder: "p. ej. 0.05em o 1px",
        panelSettings: "Ajustes",
        panelSettingsDesc: "General, eventos y período",
        panelLayout: "Diseño",
        panelLayoutDesc: "Visualización, fuentes, colores, iconos y fondos",
        groupGeneral: "General",
        groupGeneralDesc: "",
        groupEvents: "Eventos",
        groupEventsDesc: "",
        groupPeriod: "Período",
        groupPeriodDesc: "",
        groupDisplay: "Visualización",
        groupDisplayDesc: "",
      },
    },
    it: {
      defaultTitle: "Eventi in arrivo",
      today: "Oggi",
      inDay: "Domani",
      inDays: (n) => `tra ${n} giorni`,
      dayAgo: "Ieri",
      daysAgo: (n) => `${n} giorni fa`,
      noEvents: "Nessun evento in arrivo",
      types: {
        birthday: "Compleanno",
        anniversary: "Anniversario",
        name_day: "Onomastico",
        wedding_anniversary: "Anniversario di matrimonio",
        memorial: "Anniversario della morte",
        pet_birthday: "Compleanno animale",
        work_anniversary: "Anniversario lavorativo",
        custom: "Personalizzato",
        holiday: "Festività",
      },
      typesPlural: {
        birthday: "Compleanni",
        anniversary: "Anniversari",
        name_day: "Onomastici",
        wedding_anniversary: "Anniversari di matrimonio",
        memorial: "Anniversari della morte",
        pet_birthday: "Compleanni degli animali",
        work_anniversary: "Anniversari lavorativi",
        custom: "Personalizzato",
        holiday: "Festività",
      },
      categories: {
        public: "Pubblico",
        bank: "Bancario",
        government: "Amministrativo",
        school: "Vacanze scolastiche",
        optional: "Facoltativo",
        unofficial: "Non ufficiale",
        half_day: "Mezza giornata",
        armed_forces: "Forze armate",
        workday: "Giorno lavorativo",
        catholic: "Cattolico",
        christian: "Cristiano",
        orthodox: "Ortodosso",
        hebrew: "Ebraico",
        islamic: "Islamico",
        hindu: "Indù",
        buddhist: "Buddista",
      },
      categoriesPlural: {
        public: "Pubbliche",
        bank: "Bancarie",
        government: "Amministrative",
        school: "Vacanze scolastiche",
        optional: "Facoltative",
        unofficial: "Non ufficiali",
        half_day: "Mezze giornate",
        armed_forces: "Forze armate",
        workday: "Giorni lavorativi",
        catholic: "Cattoliche",
        christian: "Cristiane",
        orthodox: "Ortodosse",
        hebrew: "Ebraiche",
        islamic: "Islamiche",
        hindu: "Indù",
        buddhist: "Buddiste",
      },
      editor: {
        title: "Titolo della scheda",
        titleDesc: "Testo del titolo personalizzato per la scheda (lasciare vuoto per il titolo predefinito)",
        titlePlaceholder: "ad es. Eventi in arrivo",
        count: "Numero di eventi",
        countDesc: "Il numero totale di eventi mostrati sulla scheda",
        todayOnly: "Solo oggi",
        todayOnlyDesc: "Ignora tutti gli altri filtri sottostanti e mostra solo gli eventi di oggi",
        nextEventDayOnly: "Solo il giorno del prossimo evento",
        nextEventDayOnlyDesc:
          "Mostra solo gli eventi del giorno più vicino - oggi, se presenti, altrimenti il giorno successivo con eventi (possibilmente più di uno)",
        daysAhead: "Giorni in anticipo (0 = illimitato)",
        daysAheadDesc: "Mostra solo eventi entro questo numero di giorni (0 = nessun limite)",
        daysPast: "Giorni passati (0 = solo oggi)",
        daysPastDesc: "Quanti giorni nel passato un evento conta ancora come recente (0 = solo oggi)",
        soonDays: "Soglia «a breve» (giorni)",
        soonDaysDesc: "Gli eventi entro questo numero di giorni contano come «a breve»",
        types: "Tipi di evento",
        typesDesc: "Mostra solo i tipi di evento selezionati",
        categories: "Categorie di festività",
        categoriesDesc: "Mostra solo le festività delle categorie selezionate (gli altri tipi di evento non sono interessati)",
        showAll: "Mostra tutto",
        hideAll: "Nascondi tutto",
        visibilityHeading: "Mostra / Nascondi",
        visibilityPast: "Eventi passati",
        visibilityPastDesc: "Mostra eventi il cui anniversario è già trascorso entro la finestra passata configurata",
        visibilityToday: "Eventi di oggi",
        visibilityTodayDesc: "Mostra gli eventi di oggi",
        visibilitySoon: "A breve",
        visibilitySoonDesc: "Mostra eventi entro la soglia «a breve»",
        visibilityCardTitleDesc: "Mostra il titolo proprio della scheda",
        hideCardTitle: "Nascondi",
        hideCardTitleDesc: "Nascondi il titolo proprio della scheda, anche se impostato sopra",
        tapAction: "Azione al tocco",
        tapActionDesc: "Cosa succede quando si tocca o si fa clic su una riga",
        holdAction: "Azione alla pressione prolungata",
        holdActionDesc: "Cosa succede quando si tiene premuta una riga",
        visibilityIcon: "Icona",
        visibilityIconDesc: "Mostra l'icona del tipo davanti a ogni riga",
        visibilityTitleDesc: "Mostra il nome dell'evento",
        visibilitySubtitleDesc: "Mostra il tipo di evento",
        visibilityCountrySuffix: "Suffisso festività",
        visibilityCountrySuffixDesc: "Aggiunge il paese (ed eventualmente la suddivisione) dopo il nome/tipo della festività, ad es. «Festa della Repubblica · IT (RM)»",
        columnsHeading: "Colonne di riga",
        columnsDesc: "Aggiungi, rimuovi e riordina ciò che ogni riga mostra. Le colonne di testo libero possono combinare testo libero con segnaposto: {name}, {type}, {occurrence}, {when}, {country}.",
        columnTypeIcon: "Icona",
        columnTypeInfo: "Nome + tipo",
        columnTypeName: "Nome",
        columnTypeSubtitle: "Tipo",
        columnTypeText: "Testo libero",
        columnAdd: "Aggiungi",
        columnMoveUp: "Sposta su",
        columnMoveDown: "Sposta giù",
        columnRemove: "Rimuovi",
        columnTemplatePlaceholder: "ad es. {name} compie {occurrence} anni oggi",
        columnColor: "Colore",
        columnsCompact: "Compatto (senza spazi, centrato)",
        columnsCompactDesc: "Rimuove lo spazio tra le colonne, centra la riga e uniforma spessore e opacità di tutti i campi - utile quando le colonne formano un'unica frase continua.",
        visibilityBadgeDesc: "Mostra il badge del numero di occorrenza",
        visibilityWhenDesc: "Mostra il conto alla rovescia (ad es. «tra 3 giorni»)",
        visibilityVipOnly: "Solo VIP",
        visibilityVipOnlyDesc: "Mostra solo eventi contrassegnati come «VIP Annual»",
        visibilityImportantOnly: "Solo Important",
        visibilityImportantOnlyDesc:
          "Mostra solo eventi contrassegnati automaticamente come importanti (configurabile in Annual Impostazioni nell'integrazione)",
        vipBadgeIcon: "Icona badge VIP",
        vipBadgeIconDesc: "Icona MDI mostrata come piccolo badge sull'icona degli eventi contrassegnati come VIP",
        vipBadgeIconPlaceholder: "mdi:star",
        importantBadgeIcon: "Icona badge Important",
        importantBadgeIconDesc: "Icona MDI mostrata come piccolo badge sull'icona degli eventi contrassegnati automaticamente come importanti",
        importantBadgeIconPlaceholder: "mdi:exclamation-thick",
        highlightHeading: "Evidenziazione",
        highlightPast: "Eventi passati",
        highlightPastDesc: "Colora lo sfondo della riga per gli eventi già trascorsi",
        highlightToday: "Eventi di oggi",
        highlightTodayDesc: "Colora lo sfondo della riga per gli eventi di oggi",
        highlightSoon: "A breve",
        highlightSoonDesc: "Colora lo sfondo della riga per gli eventi entro la soglia «a breve»",
        highlightBgColor: "Colore di sfondo",
        highlightBgColorDesc: "Colore di sfondo per questa evidenziazione",
        highlightVip: "Eventi VIP",
        highlightVipDesc: "Mostra un badge sull'icona degli eventi contrassegnati come VIP",
        highlightImportant: "Eventi importanti",
        highlightImportantDesc: "Mostra un badge sull'icona degli eventi contrassegnati automaticamente come importanti",
        vipBadgeColor: "Colore del badge",
        vipBadgeColorDesc: "Colore di sfondo del badge VIP",
        importantBadgeColor: "Colore del badge",
        importantBadgeColorDesc: "Colore di sfondo del badge Important",
        colors: "Colori",
        cardBackgroundTabTitle: "Sfondo scheda",
        cardBackgroundEnable: "Mostra sfondo",
        cardBackgroundEnableDesc: "Mostra un colore e/o un'immagine personalizzati dietro l'intera scheda",
        cardBackgroundColor: "Colore",
        cardBackgroundColorDesc: "Colore di sfondo della scheda",
        cardBackgroundImage: "Immagine",
        cardBackgroundImageDesc:
          "Carica un'immagine, oppure incolla un URL o un percorso multimediale locale (ad es. dal Media Browser di HA) da usare come sfondo della scheda. Formati supportati: JPEG, PNG, GIF, WebP. Mantieni il file ragionevolmente piccolo (al massimo qualche MB) per un caricamento veloce.",
        cardBackgroundImagePlaceholder: "ad es. /local/mia-immagine.jpg",
        cardBackgroundUpload: "Carica immagine",
        cardBackgroundClear: "Rimuovi immagine",
        cardBackgroundSize: "Comportamento immagine",
        cardBackgroundSizeDesc:
          "Riempi: ridimensiona l'immagine per riempire completamente la scheda, ritagliando se necessario. Adatta: ridimensiona l'immagine per farla stare nella scheda senza ritagli, può lasciare spazio vuoto. Dimensione reale: mostra l'immagine nella sua dimensione originale, centrata. Piastrelle: ripete l'immagine nella sua dimensione originale per riempire la scheda a piastrelle.",
        cardBackgroundSizeCover: "Riempi",
        cardBackgroundSizeContain: "Adatta",
        cardBackgroundSizeAuto: "Dimensione reale",
        cardBackgroundSizeRepeat: "Piastrelle",
        cardBackgroundOpacity: "Opacità",
        cardBackgroundOpacityDesc: "Opacità del colore/immagine di sfondo, in percentuale",
        colorsIconsHeading: "Icone",
        colorsLabelsHeading: "Etichette",
        colorToday: "Oggi",
        colorSoon: "A breve",
        colorAccent: "Predefinito",
        colorTodayDesc: "Colore dell'icona per gli eventi di oggi",
        colorSoonDesc: "Colore dell'icona per gli eventi entro la soglia «a breve»",
        colorAccentDesc: "Colore dell'icona per gli eventi senza stato particolare",
        animationLabel: "Animazione",
        animationDesc: "Aggiungi un'animazione in loop a questa icona",
        animationNone: "Nessuna",
        animationPulse: "Pulsazione",
        animationBounce: "Rimbalzo",
        animationShake: "Scuotimento",
        animationSpin: "Rotazione",
        animationFlash: "Lampeggio",
        matchTextLabel: "Colora anche il testo",
        matchTextDesc: "Colora anche tutto il testo della riga con questo colore dell'icona",
        colorTitle: "Nome",
        colorSubtitle: "Tipo",
        colorBadge: "Occorrenza",
        colorWhen: "Conto alla rovescia",
        colorText: "Testo libero",
        cardTitleColorDesc: "Colore del testo per il titolo proprio della scheda",
        colorTitleDesc: "Colore del testo per il nome dell'evento",
        colorSubtitleDesc: "Colore del testo per il tipo di evento",
        colorBadgeDesc: "Colore del testo per il badge del numero di occorrenza",
        colorWhenDesc: "Colore del testo per il conto alla rovescia (ad es. «tra 3 giorni»)",
        colorTextDesc: "Colore del testo per le colonne di testo libero (vedi Colonne di riga in Layout -> Visualizzazione)",
        backgroundLabel: "Mostra sfondo",
        backgroundDesc: "Mostra uno sfondo arrotondato dietro il numero di occorrenza",
        colorBadgeBackground: "Colore di sfondo",
        colorBadgeBackgroundDesc: "Colore di sfondo dietro il numero di occorrenza",
        colorPlaceholder: "ad es. #ff5722 o var(--my-red)",
        presetDefault: "Predefinito",
        presetPrimary: "Primario",
        presetAccent: "Accento",
        presetCustom: "Personalizzato",
        presetRed: "Rosso",
        presetPink: "Rosa",
        presetPurple: "Viola",
        presetDeepPurple: "Viola scuro",
        presetIndigo: "Indaco",
        presetBlue: "Blu",
        presetLightBlue: "Blu chiaro",
        presetCyan: "Ciano",
        presetTeal: "Verde acqua",
        presetGreen: "Verde",
        presetLightGreen: "Verde chiaro",
        presetLime: "Lime",
        presetYellow: "Giallo",
        presetAmber: "Ambra",
        presetOrange: "Arancione",
        presetDeepOrange: "Arancione scuro",
        presetBrown: "Marrone",
        presetGrey: "Grigio",
        presetBlueGrey: "Grigio-blu",
        fonts: "Font",
        fontCardTitle: "Titolo della scheda",
        fontCardTitleDesc: "Dimensione del font per il titolo proprio della scheda",
        fontTitleDesc: "Dimensione del font per il nome dell'evento",
        fontSubtitleDesc: "Dimensione del font per il tipo di evento",
        fontBadgeDesc: "Dimensione del font per il badge del numero di occorrenza",
        fontWhenDesc: "Dimensione del font per il conto alla rovescia (ad es. «tra 3 giorni»)",
        fontTextDesc: "Dimensione del font per le colonne di testo libero (vedi Colonne di riga in Layout -> Visualizzazione)",
        fontPlaceholder: "ad es. 1.2em o 20px",
        fontBold: "Grassetto",
        fontItalic: "Corsivo",
        fontUppercase: "Maiuscolo",
        fontUnderline: "Sottolineato",
        fontLetterSpacing: "Spaziatura tra lettere",
        fontLetterSpacingPlaceholder: "ad es. 0.05em o 1px",
        panelSettings: "Impostazioni",
        panelSettingsDesc: "Generale, eventi e periodo",
        panelLayout: "Layout",
        panelLayoutDesc: "Visualizzazione, font, colori, icone e sfondi",
        groupGeneral: "Generale",
        groupGeneralDesc: "",
        groupEvents: "Eventi",
        groupEventsDesc: "",
        groupPeriod: "Periodo",
        groupPeriodDesc: "",
        groupDisplay: "Visualizzazione",
        groupDisplayDesc: "",
      },
    },
    "pt-BR": {
      defaultTitle: "Próximos eventos",
      today: "Hoje",
      inDay: "Amanhã",
      inDays: (n) => `em ${n} dias`,
      dayAgo: "Ontem",
      daysAgo: (n) => `${n} dias atrás`,
      noEvents: "Nenhum evento próximo",
      types: {
        birthday: "Aniversário",
        anniversary: "Data comemorativa",
        name_day: "Dia do nome",
        wedding_anniversary: "Aniversário de casamento",
        memorial: "Aniversário de falecimento",
        pet_birthday: "Aniversário de animal de estimação",
        work_anniversary: "Aniversário de trabalho",
        custom: "Personalizado",
        holiday: "Feriado",
      },
      typesPlural: {
        birthday: "Aniversários",
        anniversary: "Datas comemorativas",
        name_day: "Dias do nome",
        wedding_anniversary: "Aniversários de casamento",
        memorial: "Aniversários de falecimento",
        pet_birthday: "Aniversários de animais de estimação",
        work_anniversary: "Aniversários de trabalho",
        custom: "Personalizado",
        holiday: "Feriados",
      },
      categories: {
        public: "Público",
        bank: "Bancário",
        government: "Governamental",
        school: "Férias escolares",
        optional: "Opcional",
        unofficial: "Não oficial",
        half_day: "Meio período",
        armed_forces: "Forças armadas",
        workday: "Dia útil",
        catholic: "Católico",
        christian: "Cristão",
        orthodox: "Ortodoxo",
        hebrew: "Judaico",
        islamic: "Islâmico",
        hindu: "Hindu",
        buddhist: "Budista",
      },
      categoriesPlural: {
        public: "Públicos",
        bank: "Bancários",
        government: "Governamentais",
        school: "Férias escolares",
        optional: "Opcionais",
        unofficial: "Não oficiais",
        half_day: "Meios períodos",
        armed_forces: "Forças armadas",
        workday: "Dias úteis",
        catholic: "Católicos",
        christian: "Cristãos",
        orthodox: "Ortodoxos",
        hebrew: "Judaicos",
        islamic: "Islâmicos",
        hindu: "Hindus",
        buddhist: "Budistas",
      },
      editor: {
        title: "Título do cartão",
        titleDesc: "Texto de título personalizado para o cartão (deixe vazio para o título padrão)",
        titlePlaceholder: "por ex. Próximos eventos",
        count: "Número de eventos",
        countDesc: "O número total de eventos mostrados no cartão",
        todayOnly: "Somente hoje",
        todayOnlyDesc: "Ignorar todos os outros filtros abaixo e mostrar apenas os eventos de hoje",
        nextEventDayOnly: "Somente o dia do próximo evento",
        nextEventDayOnlyDesc:
          "Mostrar apenas os eventos do dia mais próximo - hoje, se houver, senão o próximo dia com eventos (possivelmente mais de um)",
        daysAhead: "Dias à frente (0 = ilimitado)",
        daysAheadDesc: "Mostrar apenas eventos dentro desse número de dias (0 = sem limite)",
        daysPast: "Dias no passado (0 = apenas hoje)",
        daysPastDesc: "Quantos dias no passado um evento ainda conta como recente (0 = apenas hoje)",
        soonDays: "Limite \"em breve\" (dias)",
        soonDaysDesc: "Eventos dentro desse número de dias contam como \"em breve\"",
        types: "Tipos de evento",
        typesDesc: "Mostrar apenas os tipos de evento marcados",
        categories: "Categorias de feriados",
        categoriesDesc: "Mostrar apenas feriados das categorias marcadas (os outros tipos de evento não são afetados)",
        showAll: "Mostrar tudo",
        hideAll: "Ocultar tudo",
        visibilityHeading: "Mostrar / Ocultar",
        visibilityPast: "Eventos passados",
        visibilityPastDesc: "Mostrar eventos cujo aniversário já passou dentro da janela passada configurada",
        visibilityToday: "Eventos de hoje",
        visibilityTodayDesc: "Mostrar eventos que ocorrem hoje",
        visibilitySoon: "Em breve",
        visibilitySoonDesc: "Mostrar eventos dentro do limite \"em breve\"",
        visibilityCardTitleDesc: "Mostrar o título próprio do cartão",
        hideCardTitle: "Ocultar",
        hideCardTitleDesc: "Ocultar o título próprio do cartão, mesmo se definido acima",
        tapAction: "Ação ao tocar",
        tapActionDesc: "O que acontece ao tocar ou clicar em uma linha",
        holdAction: "Ação ao pressionar e segurar",
        holdActionDesc: "O que acontece ao pressionar e segurar uma linha",
        visibilityIcon: "Ícone",
        visibilityIconDesc: "Mostrar o ícone do tipo antes de cada linha",
        visibilityTitleDesc: "Mostrar o nome do evento",
        visibilitySubtitleDesc: "Mostrar o tipo de evento",
        visibilityCountrySuffix: "Sufixo do feriado",
        visibilityCountrySuffixDesc: "Acrescenta o país (e a subdivisão, se houver) após o nome/tipo do feriado, por ex. \"Independência do Brasil · BR (SP)\"",
        columnsHeading: "Colunas da linha",
        columnsDesc: "Adicione, remova e reorganize o que cada linha mostra. Colunas de texto personalizado podem combinar texto livre com espaços reservados: {name}, {type}, {occurrence}, {when}, {country}.",
        columnTypeIcon: "Ícone",
        columnTypeInfo: "Nome + tipo",
        columnTypeName: "Nome",
        columnTypeSubtitle: "Tipo",
        columnTypeText: "Texto personalizado",
        columnAdd: "Adicionar",
        columnMoveUp: "Mover para cima",
        columnMoveDown: "Mover para baixo",
        columnRemove: "Remover",
        columnTemplatePlaceholder: "por ex. {name} completa {occurrence} anos hoje",
        columnColor: "Cor",
        columnsCompact: "Compacto (sem espaços, centralizado)",
        columnsCompactDesc: "Remove o espaçamento entre as colunas, centraliza a linha e uniformiza a espessura e a opacidade de todos os campos - útil quando as colunas formam uma única frase contínua.",
        visibilityBadgeDesc: "Mostrar o selo do número de ocorrência",
        visibilityWhenDesc: "Mostrar a contagem regressiva (por ex. \"em 3 dias\")",
        visibilityVipOnly: "Apenas VIP",
        visibilityVipOnlyDesc: "Mostrar apenas eventos marcados como \"VIP Annual\"",
        visibilityImportantOnly: "Apenas Important",
        visibilityImportantOnlyDesc:
          "Mostrar apenas eventos marcados automaticamente como importantes (configurável em Annual Configurações na integração)",
        vipBadgeIcon: "Ícone do selo VIP",
        vipBadgeIconDesc: "Ícone MDI mostrado como um pequeno selo no ícone de eventos marcados como VIP",
        vipBadgeIconPlaceholder: "mdi:star",
        importantBadgeIcon: "Ícone do selo Important",
        importantBadgeIconDesc: "Ícone MDI mostrado como um pequeno selo no ícone de eventos marcados automaticamente como importantes",
        importantBadgeIconPlaceholder: "mdi:exclamation-thick",
        highlightHeading: "Destaque",
        highlightPast: "Eventos passados",
        highlightPastDesc: "Colorir o fundo da linha para eventos que já aconteceram",
        highlightToday: "Eventos de hoje",
        highlightTodayDesc: "Colorir o fundo da linha para eventos de hoje",
        highlightSoon: "Em breve",
        highlightSoonDesc: "Colorir o fundo da linha para eventos dentro do limite \"em breve\"",
        highlightBgColor: "Cor de fundo",
        highlightBgColorDesc: "Cor de fundo para este destaque",
        highlightVip: "Eventos VIP",
        highlightVipDesc: "Mostrar um selo no ícone de eventos marcados como VIP",
        highlightImportant: "Eventos importantes",
        highlightImportantDesc: "Mostrar um selo no ícone de eventos marcados automaticamente como importantes",
        vipBadgeColor: "Cor do selo",
        vipBadgeColorDesc: "Cor de fundo do selo VIP",
        importantBadgeColor: "Cor do selo",
        importantBadgeColorDesc: "Cor de fundo do selo Important",
        colors: "Cores",
        cardBackgroundTabTitle: "Fundo do cartão",
        cardBackgroundEnable: "Mostrar fundo",
        cardBackgroundEnableDesc: "Mostrar uma cor e/ou imagem personalizada atrás de todo o cartão",
        cardBackgroundColor: "Cor",
        cardBackgroundColorDesc: "Cor de fundo do cartão",
        cardBackgroundImage: "Imagem",
        cardBackgroundImageDesc:
          "Envie uma imagem, ou cole uma URL ou um caminho de mídia local (por ex. do Navegador de Mídia do HA) para usar como fundo do cartão. Formatos suportados: JPEG, PNG, GIF, WebP. Mantenha o arquivo razoavelmente pequeno (no máximo alguns MB) para carregamento rápido.",
        cardBackgroundImagePlaceholder: "por ex. /local/minha-imagem.jpg",
        cardBackgroundUpload: "Enviar imagem",
        cardBackgroundClear: "Remover imagem",
        cardBackgroundSize: "Comportamento da imagem",
        cardBackgroundSizeDesc:
          "Preencher: dimensiona a imagem para preencher completamente o cartão, recortando se necessário. Ajustar: dimensiona a imagem para caber no cartão sem recorte, pode deixar espaço vazio. Tamanho real: mostra a imagem em seu tamanho original, centralizada. Mosaico: repete a imagem em seu tamanho original para cobrir o cartão.",
        cardBackgroundSizeCover: "Preencher",
        cardBackgroundSizeContain: "Ajustar",
        cardBackgroundSizeAuto: "Tamanho real",
        cardBackgroundSizeRepeat: "Mosaico",
        cardBackgroundOpacity: "Opacidade",
        cardBackgroundOpacityDesc: "Opacidade da cor/imagem de fundo, em porcentagem",
        colorsIconsHeading: "Ícones",
        colorsLabelsHeading: "Rótulos",
        colorToday: "Hoje",
        colorSoon: "Em breve",
        colorAccent: "Padrão",
        colorTodayDesc: "Cor do ícone para eventos de hoje",
        colorSoonDesc: "Cor do ícone para eventos dentro do limite \"em breve\"",
        colorAccentDesc: "Cor do ícone para eventos sem status especial",
        animationLabel: "Animação",
        animationDesc: "Adicionar uma animação em loop a este ícone",
        animationNone: "Nenhuma",
        animationPulse: "Pulsar",
        animationBounce: "Saltar",
        animationShake: "Tremer",
        animationSpin: "Girar",
        animationFlash: "Piscar",
        matchTextLabel: "Colorir também o texto",
        matchTextDesc: "Colorir também todo o texto da linha com esta cor de ícone",
        colorTitle: "Nome",
        colorSubtitle: "Tipo",
        colorBadge: "Ocorrência",
        colorWhen: "Contagem regressiva",
        colorText: "Texto personalizado",
        cardTitleColorDesc: "Cor do texto para o título próprio do cartão",
        colorTitleDesc: "Cor do texto para o nome do evento",
        colorSubtitleDesc: "Cor do texto para o tipo de evento",
        colorBadgeDesc: "Cor do texto para o selo do número de ocorrência",
        colorWhenDesc: "Cor do texto para a contagem regressiva (por ex. \"em 3 dias\")",
        colorTextDesc: "Cor do texto para colunas de texto personalizado (veja Colunas da linha em Layout -> Exibição)",
        backgroundLabel: "Mostrar fundo",
        backgroundDesc: "Mostrar um fundo arredondado atrás do número de ocorrência",
        colorBadgeBackground: "Cor de fundo",
        colorBadgeBackgroundDesc: "Cor de fundo atrás do número de ocorrência",
        colorPlaceholder: "por ex. #ff5722 ou var(--my-red)",
        presetDefault: "Padrão",
        presetPrimary: "Primária",
        presetAccent: "Destaque",
        presetCustom: "Personalizado",
        presetRed: "Vermelho",
        presetPink: "Rosa",
        presetPurple: "Roxo",
        presetDeepPurple: "Roxo escuro",
        presetIndigo: "Índigo",
        presetBlue: "Azul",
        presetLightBlue: "Azul claro",
        presetCyan: "Ciano",
        presetTeal: "Verde-azulado",
        presetGreen: "Verde",
        presetLightGreen: "Verde claro",
        presetLime: "Verde-limão",
        presetYellow: "Amarelo",
        presetAmber: "Âmbar",
        presetOrange: "Laranja",
        presetDeepOrange: "Laranja escuro",
        presetBrown: "Marrom",
        presetGrey: "Cinza",
        presetBlueGrey: "Cinza-azulado",
        fonts: "Fontes",
        fontCardTitle: "Título do cartão",
        fontCardTitleDesc: "Tamanho da fonte para o título próprio do cartão",
        fontTitleDesc: "Tamanho da fonte para o nome do evento",
        fontSubtitleDesc: "Tamanho da fonte para o tipo de evento",
        fontBadgeDesc: "Tamanho da fonte para o selo do número de ocorrência",
        fontWhenDesc: "Tamanho da fonte para a contagem regressiva (por ex. \"em 3 dias\")",
        fontTextDesc: "Tamanho da fonte para colunas de texto personalizado (veja Colunas da linha em Layout -> Exibição)",
        fontPlaceholder: "por ex. 1.2em ou 20px",
        fontBold: "Negrito",
        fontItalic: "Itálico",
        fontUppercase: "Maiúsculas",
        fontUnderline: "Sublinhado",
        fontLetterSpacing: "Espaçamento entre letras",
        fontLetterSpacingPlaceholder: "por ex. 0.05em ou 1px",
        panelSettings: "Configurações",
        panelSettingsDesc: "Geral, eventos e período",
        panelLayout: "Layout",
        panelLayoutDesc: "Exibição, fontes, cores, ícones e fundos",
        groupGeneral: "Geral",
        groupGeneralDesc: "",
        groupEvents: "Eventos",
        groupEventsDesc: "",
        groupPeriod: "Período",
        groupPeriodDesc: "",
        groupDisplay: "Exibição",
        groupDisplayDesc: "",
      },
    },
    ru: {
      defaultTitle: "Ближайшие события",
      today: "Сегодня",
      inDay: "Завтра",
      inDays: (n) => `через ${n} дн.`,
      dayAgo: "Вчера",
      daysAgo: (n) => `${n} дн. назад`,
      noEvents: "Нет ближайших событий",
      types: {
        birthday: "День рождения",
        anniversary: "Годовщина",
        name_day: "Именины",
        wedding_anniversary: "Годовщина свадьбы",
        memorial: "День памяти",
        pet_birthday: "День рождения питомца",
        work_anniversary: "Трудовой юбилей",
        custom: "Другое",
        holiday: "Праздник",
      },
      typesPlural: {
        birthday: "Дни рождения",
        anniversary: "Годовщины",
        name_day: "Именины",
        wedding_anniversary: "Годовщины свадьбы",
        memorial: "Дни памяти",
        pet_birthday: "Дни рождения питомцев",
        work_anniversary: "Трудовые юбилеи",
        custom: "Другое",
        holiday: "Праздники",
      },
      categories: {
        public: "Государственный",
        bank: "Банковский",
        government: "Административный",
        school: "Школьные каникулы",
        optional: "Необязательный",
        unofficial: "Неофициальный",
        half_day: "Сокращённый день",
        armed_forces: "Вооружённые силы",
        workday: "Рабочий день",
        catholic: "Католический",
        christian: "Христианский",
        orthodox: "Православный",
        hebrew: "Иудейский",
        islamic: "Исламский",
        hindu: "Индуистский",
        buddhist: "Буддийский",
      },
      categoriesPlural: {
        public: "Государственные",
        bank: "Банковские",
        government: "Административные",
        school: "Школьные каникулы",
        optional: "Необязательные",
        unofficial: "Неофициальные",
        half_day: "Сокращённые дни",
        armed_forces: "Вооружённые силы",
        workday: "Рабочие дни",
        catholic: "Католические",
        christian: "Христианские",
        orthodox: "Православные",
        hebrew: "Иудейские",
        islamic: "Исламские",
        hindu: "Индуистские",
        buddhist: "Буддийские",
      },
      editor: {
        title: "Заголовок карточки",
        titleDesc: "Собственный текст заголовка карточки (оставьте пустым для заголовка по умолчанию)",
        titlePlaceholder: "напр. Ближайшие события",
        count: "Количество событий",
        countDesc: "Общее количество событий, показываемых на карточке",
        todayOnly: "Только сегодня",
        todayOnlyDesc: "Игнорировать все остальные фильтры ниже и показывать только сегодняшние события",
        nextEventDayOnly: "Только день ближайшего события",
        nextEventDayOnlyDesc:
          "Показывать только события ближайшего дня - сегодняшнего, если есть, иначе следующего дня с событиями (возможно, несколькими)",
        daysAhead: "Дней вперёд (0 = без ограничений)",
        daysAheadDesc: "Показывать только события в пределах этого количества дней (0 = без ограничений)",
        daysPast: "Дней в прошлом (0 = только сегодня)",
        daysPastDesc: "Сколько дней в прошлом событие ещё считается недавним (0 = только сегодня)",
        soonDays: "Порог «скоро» (дней)",
        soonDaysDesc: "События в пределах этого количества дней считаются «скоро»",
        types: "Типы событий",
        typesDesc: "Показывать только отмеченные типы событий",
        categories: "Категории праздников",
        categoriesDesc: "Показывать только праздники отмеченных категорий (остальные типы событий не затрагиваются)",
        showAll: "Показать все",
        hideAll: "Скрыть все",
        visibilityHeading: "Показать / Скрыть",
        visibilityPast: "Прошедшие события",
        visibilityPastDesc: "Показывать события, годовщина которых уже прошла в настроенном окне прошлого",
        visibilityToday: "Сегодняшние события",
        visibilityTodayDesc: "Показывать события, происходящие сегодня",
        visibilitySoon: "Скоро",
        visibilitySoonDesc: "Показывать события в пределах порога «скоро»",
        visibilityCardTitleDesc: "Показывать собственный заголовок карточки",
        hideCardTitle: "Скрыть",
        hideCardTitleDesc: "Скрыть собственный заголовок карточки, даже если он задан выше",
        tapAction: "Действие при нажатии",
        tapActionDesc: "Что происходит при нажатии или клике на строку",
        holdAction: "Действие при удержании",
        holdActionDesc: "Что происходит при удержании строки нажатой",
        visibilityIcon: "Значок",
        visibilityIconDesc: "Показывать значок типа перед каждой строкой",
        visibilityTitleDesc: "Показывать имя события",
        visibilitySubtitleDesc: "Показывать тип события",
        visibilityCountrySuffix: "Суффикс праздника",
        visibilityCountrySuffixDesc: "Добавлять страну (и регион, если есть) после названия/типа праздника, напр. «День России · RU (MOW)»",
        columnsHeading: "Столбцы строки",
        columnsDesc: "Добавляйте, удаляйте и меняйте порядок того, что показывает каждая строка. Столбцы произвольного текста могут сочетать свободный текст с плейсхолдерами: {name}, {type}, {occurrence}, {when}, {country}.",
        columnTypeIcon: "Значок",
        columnTypeInfo: "Имя + тип",
        columnTypeName: "Имя",
        columnTypeSubtitle: "Тип",
        columnTypeText: "Произвольный текст",
        columnAdd: "Добавить",
        columnMoveUp: "Переместить вверх",
        columnMoveDown: "Переместить вниз",
        columnRemove: "Удалить",
        columnTemplatePlaceholder: "напр. {name} исполняется {occurrence} сегодня",
        columnColor: "Цвет",
        columnsCompact: "Компактно (без промежутков, по центру)",
        columnsCompactDesc: "Убирает промежутки между столбцами, центрирует строку и выравнивает толщину и прозрачность всех полей - полезно, когда столбцы образуют одно связное предложение.",
        visibilityBadgeDesc: "Показывать значок номера события",
        visibilityWhenDesc: "Показывать обратный отсчёт (напр. «через 3 дня»)",
        visibilityVipOnly: "Только VIP",
        visibilityVipOnlyDesc: "Показывать только события, отмеченные как «VIP Annual»",
        visibilityImportantOnly: "Только Important",
        visibilityImportantOnlyDesc:
          "Показывать только события, автоматически отмеченные как важные (настраивается в Annual Настройки в интеграции)",
        vipBadgeIcon: "Значок VIP-бейджа",
        vipBadgeIconDesc: "Значок MDI, показываемый как небольшой бейдж на значке событий, отмеченных как VIP",
        vipBadgeIconPlaceholder: "mdi:star",
        importantBadgeIcon: "Значок бейджа Important",
        importantBadgeIconDesc: "Значок MDI, показываемый как небольшой бейдж на значке событий, автоматически отмеченных как важные",
        importantBadgeIconPlaceholder: "mdi:exclamation-thick",
        highlightHeading: "Выделение",
        highlightPast: "Прошедшие события",
        highlightPastDesc: "Окрашивать фон строки для уже прошедших событий",
        highlightToday: "Сегодняшние события",
        highlightTodayDesc: "Окрашивать фон строки для сегодняшних событий",
        highlightSoon: "Скоро",
        highlightSoonDesc: "Окрашивать фон строки для событий в пределах порога «скоро»",
        highlightBgColor: "Цвет фона",
        highlightBgColorDesc: "Цвет фона для этого выделения",
        highlightVip: "VIP-события",
        highlightVipDesc: "Показывать бейдж на значке событий, отмеченных как VIP",
        highlightImportant: "Важные события",
        highlightImportantDesc: "Показывать бейдж на значке событий, автоматически отмеченных как важные",
        vipBadgeColor: "Цвет бейджа",
        vipBadgeColorDesc: "Цвет фона VIP-бейджа",
        importantBadgeColor: "Цвет бейджа",
        importantBadgeColorDesc: "Цвет фона бейджа Important",
        colors: "Цвета",
        cardBackgroundTabTitle: "Фон карточки",
        cardBackgroundEnable: "Показывать фон",
        cardBackgroundEnableDesc: "Показывать собственный цвет и/или изображение позади всей карточки",
        cardBackgroundColor: "Цвет",
        cardBackgroundColorDesc: "Цвет фона карточки",
        cardBackgroundImage: "Изображение",
        cardBackgroundImageDesc:
          "Загрузите изображение или вставьте URL-адрес либо локальный путь к медиафайлу (напр. из медиабраузера HA), чтобы использовать его как фон карточки. Поддерживаемые форматы: JPEG, PNG, GIF, WebP. Держите файл разумно небольшим (не более нескольких МБ) для быстрой загрузки.",
        cardBackgroundImagePlaceholder: "напр. /local/моё-изображение.jpg",
        cardBackgroundUpload: "Загрузить изображение",
        cardBackgroundClear: "Удалить изображение",
        cardBackgroundSize: "Поведение изображения",
        cardBackgroundSizeDesc:
          "Заполнить: масштабирует изображение так, чтобы оно полностью заполнило карточку, при необходимости обрезая. Вписать: масштабирует изображение так, чтобы оно поместилось в карточку без обрезки, может оставить пустое пространство. Реальный размер: показывает изображение в исходном размере по центру. Плитка: повторяет изображение в исходном размере, замащивая карточку.",
        cardBackgroundSizeCover: "Заполнить",
        cardBackgroundSizeContain: "Вписать",
        cardBackgroundSizeAuto: "Реальный размер",
        cardBackgroundSizeRepeat: "Плитка",
        cardBackgroundOpacity: "Непрозрачность",
        cardBackgroundOpacityDesc: "Непрозрачность цвета/изображения фона, в процентах",
        colorsIconsHeading: "Значки",
        colorsLabelsHeading: "Подписи",
        colorToday: "Сегодня",
        colorSoon: "Скоро",
        colorAccent: "По умолчанию",
        colorTodayDesc: "Цвет значка для сегодняшних событий",
        colorSoonDesc: "Цвет значка для событий в пределах порога «скоро»",
        colorAccentDesc: "Цвет значка для событий без особого статуса",
        animationLabel: "Анимация",
        animationDesc: "Добавить зацикленную анимацию к этому значку",
        animationNone: "Нет",
        animationPulse: "Пульсация",
        animationBounce: "Подпрыгивание",
        animationShake: "Встряхивание",
        animationSpin: "Вращение",
        animationFlash: "Мигание",
        matchTextLabel: "Также окрашивать текст",
        matchTextDesc: "Также окрашивать весь текст строки в этот цвет значка",
        colorTitle: "Имя",
        colorSubtitle: "Тип",
        colorBadge: "Номер события",
        colorWhen: "Обратный отсчёт",
        colorText: "Произвольный текст",
        cardTitleColorDesc: "Цвет текста для собственного заголовка карточки",
        colorTitleDesc: "Цвет текста для имени события",
        colorSubtitleDesc: "Цвет текста для типа события",
        colorBadgeDesc: "Цвет текста для значка номера события",
        colorWhenDesc: "Цвет текста для обратного отсчёта (напр. «через 3 дня»)",
        colorTextDesc: "Цвет текста для столбцов произвольного текста (см. Столбцы строки в разделе Макет -> Отображение)",
        backgroundLabel: "Показывать фон",
        backgroundDesc: "Показывать скруглённый фон позади номера события",
        colorBadgeBackground: "Цвет фона",
        colorBadgeBackgroundDesc: "Цвет фона позади номера события",
        colorPlaceholder: "напр. #ff5722 или var(--my-red)",
        presetDefault: "По умолчанию",
        presetPrimary: "Основной",
        presetAccent: "Акцент",
        presetCustom: "Свой",
        presetRed: "Красный",
        presetPink: "Розовый",
        presetPurple: "Фиолетовый",
        presetDeepPurple: "Тёмно-фиолетовый",
        presetIndigo: "Индиго",
        presetBlue: "Синий",
        presetLightBlue: "Голубой",
        presetCyan: "Циан",
        presetTeal: "Бирюзовый",
        presetGreen: "Зелёный",
        presetLightGreen: "Светло-зелёный",
        presetLime: "Лаймовый",
        presetYellow: "Жёлтый",
        presetAmber: "Янтарный",
        presetOrange: "Оранжевый",
        presetDeepOrange: "Тёмно-оранжевый",
        presetBrown: "Коричневый",
        presetGrey: "Серый",
        presetBlueGrey: "Серо-синий",
        fonts: "Шрифты",
        fontCardTitle: "Заголовок карточки",
        fontCardTitleDesc: "Размер шрифта для собственного заголовка карточки",
        fontTitleDesc: "Размер шрифта для имени события",
        fontSubtitleDesc: "Размер шрифта для типа события",
        fontBadgeDesc: "Размер шрифта для значка номера события",
        fontWhenDesc: "Размер шрифта для обратного отсчёта (напр. «через 3 дня»)",
        fontTextDesc: "Размер шрифта для столбцов произвольного текста (см. Столбцы строки в разделе Макет -> Отображение)",
        fontPlaceholder: "напр. 1.2em или 20px",
        fontBold: "Жирный",
        fontItalic: "Курсив",
        fontUppercase: "Заглавные буквы",
        fontUnderline: "Подчёркнутый",
        fontLetterSpacing: "Межбуквенный интервал",
        fontLetterSpacingPlaceholder: "напр. 0.05em или 1px",
        panelSettings: "Настройки",
        panelSettingsDesc: "Общее, события и период",
        panelLayout: "Оформление",
        panelLayoutDesc: "Отображение, шрифты, цвета, значки и фоны",
        groupGeneral: "Общее",
        groupGeneralDesc: "",
        groupEvents: "События",
        groupEventsDesc: "",
        groupPeriod: "Период",
        groupPeriodDesc: "",
        groupDisplay: "Отображение",
        groupDisplayDesc: "",
      },
    },
    sv: {
      defaultTitle: "Kommande händelser",
      today: "Idag",
      inDay: "Imorgon",
      inDays: (n) => `om ${n} dagar`,
      dayAgo: "Igår",
      daysAgo: (n) => `för ${n} dagar sedan`,
      noEvents: "Inga kommande händelser",
      types: {
        birthday: "Födelsedag",
        anniversary: "Årsdag",
        name_day: "Namnsdag",
        wedding_anniversary: "Bröllopsdag",
        memorial: "Dödsdag",
        pet_birthday: "Husdjurets födelsedag",
        work_anniversary: "Arbetsjubileum",
        custom: "Anpassad",
        holiday: "Helgdag",
      },
      typesPlural: {
        birthday: "Födelsedagar",
        anniversary: "Årsdagar",
        name_day: "Namnsdagar",
        wedding_anniversary: "Bröllopsdagar",
        memorial: "Dödsdagar",
        pet_birthday: "Husdjurens födelsedagar",
        work_anniversary: "Arbetsjubileer",
        custom: "Anpassad",
        holiday: "Helgdagar",
      },
      categories: {
        public: "Allmän",
        bank: "Bank",
        government: "Myndighet",
        school: "Skollov",
        optional: "Valfri",
        unofficial: "Inofficiell",
        half_day: "Halvdag",
        armed_forces: "Försvarsmakten",
        workday: "Arbetsdag",
        catholic: "Katolsk",
        christian: "Kristen",
        orthodox: "Ortodox",
        hebrew: "Judisk",
        islamic: "Islamisk",
        hindu: "Hinduisk",
        buddhist: "Buddhistisk",
      },
      categoriesPlural: {
        public: "Allmänna",
        bank: "Bank",
        government: "Myndighet",
        school: "Skollov",
        optional: "Valfria",
        unofficial: "Inofficiella",
        half_day: "Halvdagar",
        armed_forces: "Försvarsmakten",
        workday: "Arbetsdagar",
        catholic: "Katolska",
        christian: "Kristna",
        orthodox: "Ortodoxa",
        hebrew: "Judiska",
        islamic: "Islamiska",
        hindu: "Hinduiska",
        buddhist: "Buddhistiska",
      },
      editor: {
        title: "Kortets titel",
        titleDesc: "Egen titeltext för kortet (lämna tomt för standardtiteln)",
        titlePlaceholder: "t.ex. Kommande händelser",
        count: "Antal händelser",
        countDesc: "Det totala antalet händelser som visas på kortet",
        todayOnly: "Endast idag",
        todayOnlyDesc: "Ignorera alla andra filter nedan och visa endast dagens händelser",
        nextEventDayOnly: "Endast nästa händelsedag",
        nextEventDayOnlyDesc:
          "Visa endast händelser för den närmaste dagen - idag, om sådana finns, annars nästa dag med händelser (eventuellt fler än en)",
        daysAhead: "Dagar framåt (0 = obegränsat)",
        daysAheadDesc: "Visa endast händelser inom detta antal dagar (0 = ingen gräns)",
        daysPast: "Dagar bakåt (0 = endast idag)",
        daysPastDesc: "Hur många dagar bakåt en händelse fortfarande räknas som aktuell (0 = endast idag)",
        soonDays: "\"Snart\"-tröskel (dagar)",
        soonDaysDesc: "Händelser inom detta antal dagar räknas som \"snart\"",
        types: "Händelsetyper",
        typesDesc: "Visa endast markerade händelsetyper",
        categories: "Helgdagskategorier",
        categoriesDesc: "Visa endast helgdagar i de markerade kategorierna (övriga händelsetyper påverkas inte)",
        showAll: "Visa alla",
        hideAll: "Dölj alla",
        visibilityHeading: "Visa / Dölj",
        visibilityPast: "Tidigare händelser",
        visibilityPastDesc: "Visa händelser vars årsdag redan passerat inom det inställda tidigare-fönstret",
        visibilityToday: "Dagens händelser",
        visibilityTodayDesc: "Visa händelser som inträffar idag",
        visibilitySoon: "Snart",
        visibilitySoonDesc: "Visa händelser inom \"snart\"-tröskeln",
        visibilityCardTitleDesc: "Visa kortets egen titel",
        hideCardTitle: "Dölj",
        hideCardTitleDesc: "Dölj kortets egen titel, även om den är inställd ovan",
        tapAction: "Åtgärd vid tryck",
        tapActionDesc: "Vad som händer när en rad trycks eller klickas",
        holdAction: "Åtgärd vid tryck och håll",
        holdActionDesc: "Vad som händer när en rad trycks och hålls in",
        visibilityIcon: "Ikon",
        visibilityIconDesc: "Visa typikonen framför varje rad",
        visibilityTitleDesc: "Visa händelsens namn",
        visibilitySubtitleDesc: "Visa händelsetypen",
        visibilityCountrySuffix: "Helgdagssuffix",
        visibilityCountrySuffixDesc: "Lägg till landet (och ev. delstat/region) efter helgdagens namn/typ, t.ex. \"Nationaldagen · SE (AB)\"",
        columnsHeading: "Radkolumner",
        columnsDesc:
          "Lägg till, ta bort och ändra ordning på vad varje rad visar. Egna textkolumner kan blanda fri text med platshållare: {name}, {type}, {occurrence}, {when}, {country}.",
        columnTypeIcon: "Ikon",
        columnTypeInfo: "Namn + typ",
        columnTypeName: "Namn",
        columnTypeSubtitle: "Typ",
        columnTypeText: "Egen text",
        columnAdd: "Lägg till",
        columnMoveUp: "Flytta upp",
        columnMoveDown: "Flytta ner",
        columnRemove: "Ta bort",
        columnTemplatePlaceholder: "t.ex. {name} fyller {occurrence} idag",
        columnColor: "Färg",
        columnsCompact: "Kompakt (inga mellanrum, centrerad)",
        columnsCompactDesc:
          "Tar bort mellanrummet mellan kolumnerna, centrerar raden och gör vikt och opacitet lika för alla fält - användbart när kolumnerna bildar en sammanhängande mening.",
        visibilityBadgeDesc: "Visa märket för händelsenumret",
        visibilityWhenDesc: "Visa nedräkningen (t.ex. \"om 3 dagar\")",
        visibilityVipOnly: "Endast VIP",
        visibilityVipOnlyDesc: "Visa endast händelser markerade som \"VIP Annual\"",
        visibilityImportantOnly: "Endast Important",
        visibilityImportantOnlyDesc:
          "Visa endast händelser som automatiskt markerats som viktiga (ställs in under Annual Inställningar i integrationen)",
        vipBadgeIcon: "VIP-märkesikon",
        vipBadgeIconDesc: "MDI-ikon som visas som ett litet märke på ikonen för VIP-markerade händelser",
        vipBadgeIconPlaceholder: "mdi:star",
        importantBadgeIcon: "Important-märkesikon",
        importantBadgeIconDesc: "MDI-ikon som visas som ett litet märke på ikonen för händelser som automatiskt markerats som viktiga",
        importantBadgeIconPlaceholder: "mdi:exclamation-thick",
        highlightHeading: "Markering",
        highlightPast: "Tidigare händelser",
        highlightPastDesc: "Färga radens bakgrund för händelser som redan inträffat",
        highlightToday: "Dagens händelser",
        highlightTodayDesc: "Färga radens bakgrund för dagens händelser",
        highlightSoon: "Snart",
        highlightSoonDesc: "Färga radens bakgrund för händelser inom \"snart\"-tröskeln",
        highlightBgColor: "Bakgrundsfärg",
        highlightBgColorDesc: "Bakgrundsfärg för denna markering",
        highlightVip: "VIP-händelser",
        highlightVipDesc: "Visa ett märke på ikonen för VIP-markerade händelser",
        highlightImportant: "Viktiga händelser",
        highlightImportantDesc: "Visa ett märke på ikonen för händelser som automatiskt markerats som viktiga",
        vipBadgeColor: "Märkesfärg",
        vipBadgeColorDesc: "Bakgrundsfärg för VIP-märket",
        importantBadgeColor: "Märkesfärg",
        importantBadgeColorDesc: "Bakgrundsfärg för Important-märket",
        colors: "Färger",
        cardBackgroundTabTitle: "Kortbakgrund",
        cardBackgroundEnable: "Visa bakgrund",
        cardBackgroundEnableDesc: "Visa en egen färg och/eller bild bakom hela kortet",
        cardBackgroundColor: "Färg",
        cardBackgroundColorDesc: "Bakgrundsfärg för kortet",
        cardBackgroundImage: "Bild",
        cardBackgroundImageDesc:
          "Ladda upp en bild, eller klistra in en URL eller en lokal mediesökväg (t.ex. från HA:s mediebläddrare) att använda som kortbakgrund. Format som stöds: JPEG, PNG, GIF, WebP. Håll filen rimligt liten (högst några MB) för snabb inläsning.",
        cardBackgroundImagePlaceholder: "t.ex. /local/min-bild.jpg",
        cardBackgroundUpload: "Ladda upp bild",
        cardBackgroundClear: "Ta bort bild",
        cardBackgroundSize: "Bildbeteende",
        cardBackgroundSizeDesc:
          "Fyll: skalar bilden så att den fyller kortet helt, beskär vid behov. Anpassa: skalar bilden så att den ryms i kortet utan beskärning, kan lämna tomt utrymme. Verklig storlek: visar bilden i originalstorlek, centrerad. Kakel: upprepar bilden i originalstorlek för att kakla kortet.",
        cardBackgroundSizeCover: "Fyll",
        cardBackgroundSizeContain: "Anpassa",
        cardBackgroundSizeAuto: "Verklig storlek",
        cardBackgroundSizeRepeat: "Kakel",
        cardBackgroundOpacity: "Opacitet",
        cardBackgroundOpacityDesc: "Opacitet för bakgrundsfärg/-bild, i procent",
        colorsIconsHeading: "Ikoner",
        colorsLabelsHeading: "Etiketter",
        colorToday: "Idag",
        colorSoon: "Snart",
        colorAccent: "Standard",
        colorTodayDesc: "Ikonfärg för dagens händelser",
        colorSoonDesc: "Ikonfärg för händelser inom \"snart\"-tröskeln",
        colorAccentDesc: "Ikonfärg för händelser utan särskild status",
        animationLabel: "Animation",
        animationDesc: "Lägg till en repeterande animation för denna ikon",
        animationNone: "Ingen",
        animationPulse: "Pulsera",
        animationBounce: "Studsa",
        animationShake: "Skaka",
        animationSpin: "Snurra",
        animationFlash: "Blinka",
        matchTextLabel: "Färga även texten",
        matchTextDesc: "Färga även hela radens text med denna ikonfärg",
        colorTitle: "Namn",
        colorSubtitle: "Typ",
        colorBadge: "Händelsenummer",
        colorWhen: "Nedräkning",
        colorText: "Egen text",
        colorTitleDesc: "Textfärg för händelsens namn",
        cardTitleColorDesc: "Textfärg för kortets egen titel",
        colorSubtitleDesc: "Textfärg för händelsetypen",
        colorBadgeDesc: "Textfärg för märket med händelsenumret",
        colorWhenDesc: "Textfärg för nedräkningen (t.ex. \"om 3 dagar\")",
        colorTextDesc:
          "Textfärg för egna textkolumner (se Radkolumner under Layout -> Visning)",
        backgroundLabel: "Visa bakgrund",
        backgroundDesc: "Visa en rundad bakgrund bakom händelsenumret",
        colorBadgeBackground: "Bakgrundsfärg",
        colorBadgeBackgroundDesc: "Bakgrundsfärg bakom händelsenumret",
        colorPlaceholder: "t.ex. #ff5722 eller var(--my-red)",
        presetDefault: "Standard",
        presetPrimary: "Primär",
        presetAccent: "Accent",
        presetCustom: "Anpassad",
        presetRed: "Röd",
        presetPink: "Rosa",
        presetPurple: "Lila",
        presetDeepPurple: "Mörklila",
        presetIndigo: "Indigo",
        presetBlue: "Blå",
        presetLightBlue: "Ljusblå",
        presetCyan: "Cyan",
        presetTeal: "Blågrön",
        presetGreen: "Grön",
        presetLightGreen: "Ljusgrön",
        presetLime: "Limegrön",
        presetYellow: "Gul",
        presetAmber: "Bärnsten",
        presetOrange: "Orange",
        presetDeepOrange: "Mörkorange",
        presetBrown: "Brun",
        presetGrey: "Grå",
        presetBlueGrey: "Blågrå",
        fonts: "Typsnitt",
        fontCardTitle: "Kortets titel",
        fontCardTitleDesc: "Teckenstorlek för kortets egen titel",
        fontTitleDesc: "Teckenstorlek för händelsens namn",
        fontSubtitleDesc: "Teckenstorlek för händelsetypen",
        fontBadgeDesc: "Teckenstorlek för märket med händelsenumret",
        fontWhenDesc: "Teckenstorlek för nedräkningen (t.ex. \"om 3 dagar\")",
        fontTextDesc:
          "Teckenstorlek för egna textkolumner (se Radkolumner under Layout -> Visning)",
        fontPlaceholder: "t.ex. 1.2em eller 20px",
        fontBold: "Fet",
        fontItalic: "Kursiv",
        fontUppercase: "Versaler",
        fontUnderline: "Understruken",
        fontLetterSpacing: "Bokstavsavstånd",
        fontLetterSpacingPlaceholder: "t.ex. 0.05em eller 1px",
        panelSettings: "Inställningar",
        panelSettingsDesc: "Allmänt, händelser och period",
        panelLayout: "Layout",
        panelLayoutDesc: "Visning, typsnitt, färger, ikoner och bakgrunder",
        groupGeneral: "Allmänt",
        groupGeneralDesc: "",
        groupEvents: "Händelser",
        groupEventsDesc: "",
        groupPeriod: "Period",
        groupPeriodDesc: "",
        groupDisplay: "Visning",
        groupDisplayDesc: "",
      },
    },
    "zh-Hans": {
      defaultTitle: "即将到来的事件",
      today: "今天",
      inDay: "明天",
      inDays: (n) => `${n} 天后`,
      dayAgo: "昨天",
      daysAgo: (n) => `${n} 天前`,
      noEvents: "没有即将到来的事件",
      types: {
        birthday: "生日",
        anniversary: "纪念日",
        name_day: "命名日",
        wedding_anniversary: "结婚纪念日",
        memorial: "忌日",
        pet_birthday: "宠物生日",
        work_anniversary: "工作纪念日",
        custom: "自定义",
        holiday: "假日",
      },
      // Chinese nouns don't inflect for plural, so typesPlural/categoriesPlural
      // simply reuse the same singular labels as types/categories below.
      typesPlural: {
        birthday: "生日",
        anniversary: "纪念日",
        name_day: "命名日",
        wedding_anniversary: "结婚纪念日",
        memorial: "忌日",
        pet_birthday: "宠物生日",
        work_anniversary: "工作纪念日",
        custom: "自定义",
        holiday: "假日",
      },
      categories: {
        public: "公共",
        bank: "银行",
        government: "政府",
        school: "学校假期",
        optional: "可选",
        unofficial: "非官方",
        half_day: "半天",
        armed_forces: "军队",
        workday: "工作日",
        catholic: "天主教",
        christian: "基督教",
        orthodox: "东正教",
        hebrew: "犹太教",
        islamic: "伊斯兰教",
        hindu: "印度教",
        buddhist: "佛教",
      },
      categoriesPlural: {
        public: "公共",
        bank: "银行",
        government: "政府",
        school: "学校假期",
        optional: "可选",
        unofficial: "非官方",
        half_day: "半天",
        armed_forces: "军队",
        workday: "工作日",
        catholic: "天主教",
        christian: "基督教",
        orthodox: "东正教",
        hebrew: "犹太教",
        islamic: "伊斯兰教",
        hindu: "印度教",
        buddhist: "佛教",
      },
      editor: {
        title: "卡片标题",
        titleDesc: "卡片的自定义标题文本（留空使用默认标题）",
        titlePlaceholder: "例如：即将到来的事件",
        count: "事件数量",
        countDesc: "卡片上显示的事件总数",
        todayOnly: "仅今天",
        todayOnlyDesc: "忽略以下所有其他筛选条件，仅显示今天发生的事件",
        nextEventDayOnly: "仅下一个事件日",
        nextEventDayOnlyDesc:
          "仅显示最近一天的事件——如果有的话是今天，否则是下一个有事件的日子（可能不止一个）",
        daysAhead: "提前天数（0 = 不限）",
        daysAheadDesc: "仅显示在此天数内发生的事件（0 = 不限）",
        daysPast: "过去天数（0 = 仅今天）",
        daysPastDesc: "事件在过去多少天内仍算作最近（0 = 仅今天）",
        soonDays: "“即将到来”阈值（天）",
        soonDaysDesc: "在此天数内的事件算作“即将到来”",
        types: "事件类型",
        typesDesc: "仅显示已勾选的事件类型",
        categories: "节假日类别",
        categoriesDesc: "仅显示已勾选类别的节假日（其他事件类型不受影响）",
        showAll: "全部显示",
        hideAll: "全部隐藏",
        visibilityHeading: "显示 / 隐藏",
        visibilityPast: "过去的事件",
        visibilityPastDesc: "显示在设定的过去时间范围内已经过去的周年纪念事件",
        visibilityToday: "今天的事件",
        visibilityTodayDesc: "显示今天发生的事件",
        visibilitySoon: "即将到来",
        visibilitySoonDesc: "显示在“即将到来”阈值内的事件",
        visibilityCardTitleDesc: "显示卡片自身的标题",
        hideCardTitle: "隐藏",
        hideCardTitleDesc: "隐藏卡片自身的标题，即使上方已设置",
        tapAction: "点击操作",
        tapActionDesc: "点击或单击某行时执行的操作",
        holdAction: "长按操作",
        holdActionDesc: "长按某行时执行的操作",
        visibilityIcon: "图标",
        visibilityIconDesc: "在每行前显示类型图标",
        visibilityTitleDesc: "显示事件名称",
        visibilitySubtitleDesc: "显示事件类型",
        visibilityCountrySuffix: "节假日后缀",
        visibilityCountrySuffixDesc: "在节假日名称/类型后附加国家（及地区，如有），例如“国庆节 · CN (BJ)”",
        columnsHeading: "行列",
        columnsDesc:
          "添加、删除并重新排列每行显示的内容。自定义文本列可以混合自由文本与占位符：{name}、{type}、{occurrence}、{when}、{country}。",
        columnTypeIcon: "图标",
        columnTypeInfo: "名称 + 类型",
        columnTypeName: "名称",
        columnTypeSubtitle: "类型",
        columnTypeText: "自定义文本",
        columnAdd: "添加",
        columnMoveUp: "上移",
        columnMoveDown: "下移",
        columnRemove: "移除",
        columnTemplatePlaceholder: "例如：{name} 今天满 {occurrence} 岁",
        columnColor: "颜色",
        columnsCompact: "紧凑（无间距，居中）",
        columnsCompactDesc:
          "移除各列之间的间距，使该行居中，并让所有字段的粗细和不透明度保持一致——适用于各列组成一个连贯句子的情况。",
        visibilityBadgeDesc: "显示周年数徽章",
        visibilityWhenDesc: "显示倒计时（例如“3 天后”）",
        visibilityVipOnly: "仅 VIP",
        visibilityVipOnlyDesc: "仅显示标记为“VIP Annual”的事件",
        visibilityImportantOnly: "仅 Important",
        visibilityImportantOnlyDesc:
          "仅显示自动标记为重要的事件（可在集成的 Annual 设置中配置）",
        vipBadgeIcon: "VIP 徽章图标",
        vipBadgeIconDesc: "在被标记为 VIP 的事件图标上显示的小徽章 MDI 图标",
        vipBadgeIconPlaceholder: "mdi:star",
        importantBadgeIcon: "Important 徽章图标",
        importantBadgeIconDesc: "在自动标记为重要的事件图标上显示的小徽章 MDI 图标",
        importantBadgeIconPlaceholder: "mdi:exclamation-thick",
        highlightHeading: "高亮",
        highlightPast: "过去的事件",
        highlightPastDesc: "为已发生的事件的行背景着色",
        highlightToday: "今天的事件",
        highlightTodayDesc: "为今天发生的事件的行背景着色",
        highlightSoon: "即将到来",
        highlightSoonDesc: "为“即将到来”阈值内的事件的行背景着色",
        highlightBgColor: "背景颜色",
        highlightBgColorDesc: "此高亮的背景着色颜色",
        highlightVip: "VIP 事件",
        highlightVipDesc: "在标记为 VIP 的事件图标上显示徽章",
        highlightImportant: "重要事件",
        highlightImportantDesc: "在自动标记为重要的事件图标上显示徽章",
        vipBadgeColor: "徽章颜色",
        vipBadgeColorDesc: "VIP 徽章的背景颜色",
        importantBadgeColor: "徽章颜色",
        importantBadgeColorDesc: "Important 徽章的背景颜色",
        colors: "颜色",
        cardBackgroundTabTitle: "卡片背景",
        cardBackgroundEnable: "显示背景",
        cardBackgroundEnableDesc: "在整个卡片后方显示自定义颜色和/或图片",
        cardBackgroundColor: "颜色",
        cardBackgroundColorDesc: "卡片的背景颜色",
        cardBackgroundImage: "图片",
        cardBackgroundImageDesc:
          "上传图片，或粘贴 URL 或本地媒体路径（例如来自 HA 的媒体浏览器）用作卡片背景。支持的格式：JPEG、PNG、GIF、WebP。为加快加载速度，请保持文件尽量小（最多几 MB）。",
        cardBackgroundImagePlaceholder: "例如：/local/my-image.jpg",
        cardBackgroundUpload: "上传图片",
        cardBackgroundClear: "移除图片",
        cardBackgroundSize: "图片行为",
        cardBackgroundSizeDesc:
          "填充：缩放图片以完全填满卡片，必要时进行裁剪。适应：缩放图片使其完整显示在卡片内而不裁剪，可能留有空白。原始大小：以原始大小居中显示图片。平铺：以原始大小重复图片以平铺卡片。",
        cardBackgroundSizeCover: "填充",
        cardBackgroundSizeContain: "适应",
        cardBackgroundSizeAuto: "原始大小",
        cardBackgroundSizeRepeat: "平铺",
        cardBackgroundOpacity: "不透明度",
        cardBackgroundOpacityDesc: "背景颜色/图片的不透明度（百分比）",
        colorsIconsHeading: "图标",
        colorsLabelsHeading: "标签",
        colorToday: "今天",
        colorSoon: "即将到来",
        colorAccent: "默认",
        colorTodayDesc: "今天事件的图标颜色",
        colorSoonDesc: "“即将到来”阈值内事件的图标颜色",
        colorAccentDesc: "无特殊状态事件的图标颜色",
        animationLabel: "动画",
        animationDesc: "为此图标添加循环动画",
        animationNone: "无",
        animationPulse: "脉动",
        animationBounce: "弹跳",
        animationShake: "摇晃",
        animationSpin: "旋转",
        animationFlash: "闪烁",
        matchTextLabel: "同时为文本着色",
        matchTextDesc: "同时用此图标颜色为整行文本着色",
        colorTitle: "名称",
        colorSubtitle: "类型",
        colorBadge: "周年数",
        colorWhen: "倒计时",
        colorText: "自定义文本",
        colorTitleDesc: "事件名称的文本颜色",
        cardTitleColorDesc: "卡片自身标题的文本颜色",
        colorSubtitleDesc: "事件类型的文本颜色",
        colorBadgeDesc: "周年数徽章的文本颜色",
        colorWhenDesc: "倒计时的文本颜色（例如“3 天后”）",
        colorTextDesc: "自定义文本列的文本颜色（参见“布局 -> 显示”中的行列）",
        backgroundLabel: "显示背景",
        backgroundDesc: "在周年数后方显示圆角背景",
        colorBadgeBackground: "背景颜色",
        colorBadgeBackgroundDesc: "周年数后方的背景颜色",
        colorPlaceholder: "例如：#ff5722 或 var(--my-red)",
        presetDefault: "默认",
        presetPrimary: "主色",
        presetAccent: "强调色",
        presetCustom: "自定义",
        presetRed: "红色",
        presetPink: "粉色",
        presetPurple: "紫色",
        presetDeepPurple: "深紫色",
        presetIndigo: "靛蓝色",
        presetBlue: "蓝色",
        presetLightBlue: "浅蓝色",
        presetCyan: "青色",
        presetTeal: "蓝绿色",
        presetGreen: "绿色",
        presetLightGreen: "浅绿色",
        presetLime: "酸橙色",
        presetYellow: "黄色",
        presetAmber: "琥珀色",
        presetOrange: "橙色",
        presetDeepOrange: "深橙色",
        presetBrown: "棕色",
        presetGrey: "灰色",
        presetBlueGrey: "蓝灰色",
        fonts: "字体",
        fontCardTitle: "卡片标题",
        fontCardTitleDesc: "卡片自身标题的字体大小",
        fontTitleDesc: "事件名称的字体大小",
        fontSubtitleDesc: "事件类型的字体大小",
        fontBadgeDesc: "周年数徽章的字体大小",
        fontWhenDesc: "倒计时的字体大小（例如“3 天后”）",
        fontTextDesc: "自定义文本列的字体大小（参见“布局 -> 显示”中的行列）",
        fontPlaceholder: "例如：1.2em 或 20px",
        fontBold: "粗体",
        fontItalic: "斜体",
        fontUppercase: "大写",
        fontUnderline: "下划线",
        fontLetterSpacing: "字母间距",
        fontLetterSpacingPlaceholder: "例如：0.05em 或 1px",
        panelSettings: "设置",
        panelSettingsDesc: "常规、事件和时间段",
        panelLayout: "布局",
        panelLayoutDesc: "显示、字体、颜色、图标和背景",
        groupGeneral: "常规",
        groupGeneralDesc: "",
        groupEvents: "事件",
        groupEventsDesc: "",
        groupPeriod: "时间段",
        groupPeriodDesc: "",
        groupDisplay: "显示",
        groupDisplayDesc: "",
      },
    },
    cs: {
      defaultTitle: "Nadcházející události",
      today: "Dnes",
      inDay: "Zítra",
      inDays: (n) => `za ${n} dní`,
      dayAgo: "Včera",
      daysAgo: (n) => `před ${n} dny`,
      noEvents: "Žádné nadcházející události",
      types: {
        birthday: "Narozeniny",
        anniversary: "Výročí",
        name_day: "Svátek",
        wedding_anniversary: "Výročí svatby",
        memorial: "Výročí úmrtí",
        pet_birthday: "Narozeniny mazlíčka",
        work_anniversary: "Pracovní výročí",
        custom: "Vlastní",
        holiday: "Státní svátek",
      },
      typesPlural: {
        birthday: "Narozeniny",
        anniversary: "Výročí",
        name_day: "Svátky",
        wedding_anniversary: "Výročí svatby",
        memorial: "Výročí úmrtí",
        pet_birthday: "Narozeniny mazlíčků",
        work_anniversary: "Pracovní výročí",
        custom: "Vlastní",
        holiday: "Státní svátky",
      },
      categories: {
        public: "Veřejný",
        bank: "Bankovní",
        government: "Úřední",
        school: "Školní prázdniny",
        optional: "Volitelný",
        unofficial: "Neoficiální",
        half_day: "Půlden",
        armed_forces: "Ozbrojené síly",
        workday: "Pracovní den",
        catholic: "Katolický",
        christian: "Křesťanský",
        orthodox: "Pravoslavný",
        hebrew: "Židovský",
        islamic: "Islámský",
        hindu: "Hinduistický",
        buddhist: "Buddhistický",
      },
      categoriesPlural: {
        public: "Veřejné",
        bank: "Bankovní",
        government: "Úřední",
        school: "Školní prázdniny",
        optional: "Volitelné",
        unofficial: "Neoficiální",
        half_day: "Půldny",
        armed_forces: "Ozbrojené síly",
        workday: "Pracovní dny",
        catholic: "Katolické",
        christian: "Křesťanské",
        orthodox: "Pravoslavné",
        hebrew: "Židovské",
        islamic: "Islámské",
        hindu: "Hinduistické",
        buddhist: "Buddhistické",
      },
      editor: {
        title: "Název karty",
        titleDesc: "Vlastní text názvu karty (ponechte prázdné pro výchozí název)",
        titlePlaceholder: "např. Nadcházející události",
        count: "Počet událostí",
        countDesc: "Celkový počet událostí zobrazených na kartě",
        todayOnly: "Pouze dnes",
        todayOnlyDesc: "Ignorovat všechny ostatní filtry níže a zobrazit pouze dnešní události",
        nextEventDayOnly: "Pouze den nejbližší události",
        nextEventDayOnlyDesc:
          "Zobrazit pouze události z jediného nejbližšího dne - dnešního, pokud existuje, jinak dalšího dne s událostmi (případně více než jednou)",
        daysAhead: "Dní dopředu (0 = neomezeno)",
        daysAheadDesc: "Zobrazit pouze události v tomto počtu dní (0 = bez omezení)",
        daysPast: "Dní zpět (0 = pouze dnes)",
        daysPastDesc: "Kolik dní zpět se událost stále počítá jako nedávná (0 = pouze dnes)",
        soonDays: "Práh „brzy“ (dny)",
        soonDaysDesc: "Události v tomto počtu dní se počítají jako „brzy“",
        types: "Typy událostí",
        typesDesc: "Zobrazit pouze zaškrtnuté typy událostí",
        categories: "Kategorie svátků",
        categoriesDesc: "Zobrazit pouze svátky ze zaškrtnutých kategorií (ostatní typy událostí nejsou ovlivněny)",
        showAll: "Zobrazit vše",
        hideAll: "Skrýt vše",
        visibilityHeading: "Zobrazit / Skrýt",
        visibilityPast: "Minulé události",
        visibilityPastDesc: "Zobrazit události, jejichž výročí již proběhlo v nastaveném minulém okně",
        visibilityToday: "Dnešní události",
        visibilityTodayDesc: "Zobrazit události, které se konají dnes",
        visibilitySoon: "Brzy",
        visibilitySoonDesc: "Zobrazit události v prahu „brzy“",
        visibilityCardTitleDesc: "Zobrazit vlastní název karty",
        hideCardTitle: "Skrýt",
        hideCardTitleDesc: "Skrýt vlastní název karty, i když je nastaven výše",
        tapAction: "Akce při klepnutí",
        tapActionDesc: "Co se stane při klepnutí nebo kliknutí na řádek",
        holdAction: "Akce při podržení",
        holdActionDesc: "Co se stane při podržení řádku",
        visibilityIcon: "Ikona",
        visibilityIconDesc: "Zobrazit ikonu typu před každým řádkem",
        visibilityTitleDesc: "Zobrazit jméno události",
        visibilitySubtitleDesc: "Zobrazit typ události",
        visibilityCountrySuffix: "Přípona svátku",
        visibilityCountrySuffixDesc: "Připojit zemi (a případně kraj) za název/typ svátku, např. „Den české státnosti · CZ (PR)“",
        columnsHeading: "Sloupce řádku",
        columnsDesc:
          "Přidávejte, odebírejte a měňte pořadí toho, co každý řádek zobrazuje. Vlastní textové sloupce mohou kombinovat volný text se zástupnými symboly: {name}, {type}, {occurrence}, {when}, {country}.",
        columnTypeIcon: "Ikona",
        columnTypeInfo: "Jméno + typ",
        columnTypeName: "Jméno",
        columnTypeSubtitle: "Typ",
        columnTypeText: "Vlastní text",
        columnAdd: "Přidat",
        columnMoveUp: "Posunout nahoru",
        columnMoveDown: "Posunout dolů",
        columnRemove: "Odebrat",
        columnTemplatePlaceholder: "např. {name} má dnes {occurrence}. narozeniny",
        columnColor: "Barva",
        columnsCompact: "Kompaktní (bez mezer, na střed)",
        columnsCompactDesc:
          "Odstraní mezery mezi sloupci, vystředí řádek a sjednotí váhu a krytí všech polí - užitečné, když sloupce tvoří jednu souvislou větu.",
        visibilityBadgeDesc: "Zobrazit odznak čísla výročí",
        visibilityWhenDesc: "Zobrazit odpočet (např. „za 3 dny“)",
        visibilityVipOnly: "Pouze VIP",
        visibilityVipOnlyDesc: "Zobrazit pouze události označené jako „VIP Annual“",
        visibilityImportantOnly: "Pouze Important",
        visibilityImportantOnlyDesc:
          "Zobrazit pouze události automaticky označené jako důležité (nastavuje se v Annual Nastavení integrace)",
        vipBadgeIcon: "Ikona VIP odznaku",
        vipBadgeIconDesc: "Ikona MDI zobrazená jako malý odznak na ikoně událostí označených jako VIP",
        vipBadgeIconPlaceholder: "mdi:star",
        importantBadgeIcon: "Ikona odznaku Important",
        importantBadgeIconDesc: "Ikona MDI zobrazená jako malý odznak na ikoně událostí automaticky označených jako důležité",
        importantBadgeIconPlaceholder: "mdi:exclamation-thick",
        highlightHeading: "Zvýraznění",
        highlightPast: "Minulé události",
        highlightPastDesc: "Obarvit pozadí řádku pro události, které již proběhly",
        highlightToday: "Dnešní události",
        highlightTodayDesc: "Obarvit pozadí řádku pro dnešní události",
        highlightSoon: "Brzy",
        highlightSoonDesc: "Obarvit pozadí řádku pro události v prahu „brzy“",
        highlightBgColor: "Barva pozadí",
        highlightBgColorDesc: "Barva pozadí pro toto zvýraznění",
        highlightVip: "VIP události",
        highlightVipDesc: "Zobrazit odznak na ikoně událostí označených jako VIP",
        highlightImportant: "Důležité události",
        highlightImportantDesc: "Zobrazit odznak na ikoně událostí automaticky označených jako důležité",
        vipBadgeColor: "Barva odznaku",
        vipBadgeColorDesc: "Barva pozadí VIP odznaku",
        importantBadgeColor: "Barva odznaku",
        importantBadgeColorDesc: "Barva pozadí odznaku Important",
        colors: "Barvy",
        cardBackgroundTabTitle: "Pozadí karty",
        cardBackgroundEnable: "Zobrazit pozadí",
        cardBackgroundEnableDesc: "Zobrazit vlastní barvu a/nebo obrázek za celou kartou",
        cardBackgroundColor: "Barva",
        cardBackgroundColorDesc: "Barva pozadí karty",
        cardBackgroundImage: "Obrázek",
        cardBackgroundImageDesc:
          "Nahrajte obrázek nebo vložte URL či místní cestu k médiu (např. z prohlížeče médií HA), který se použije jako pozadí karty. Podporované formáty: JPEG, PNG, GIF, WebP. Udržujte soubor přiměřeně malý (maximálně několik MB) pro rychlé načítání.",
        cardBackgroundImagePlaceholder: "např. /local/muj-obrazek.jpg",
        cardBackgroundUpload: "Nahrát obrázek",
        cardBackgroundClear: "Odebrat obrázek",
        cardBackgroundSize: "Chování obrázku",
        cardBackgroundSizeDesc:
          "Vyplnit: zvětší obrázek tak, aby zcela vyplnil kartu, v případě potřeby oříznutím. Přizpůsobit: zvětší obrázek tak, aby se vešel do karty bez oříznutí, může zanechat prázdné místo. Skutečná velikost: zobrazí obrázek v původní velikosti, na středu. Dlaždice: opakuje obrázek v původní velikosti a vydláždí kartu.",
        cardBackgroundSizeCover: "Vyplnit",
        cardBackgroundSizeContain: "Přizpůsobit",
        cardBackgroundSizeAuto: "Skutečná velikost",
        cardBackgroundSizeRepeat: "Dlaždice",
        cardBackgroundOpacity: "Krytí",
        cardBackgroundOpacityDesc: "Krytí barvy/obrázku pozadí, v procentech",
        colorsIconsHeading: "Ikony",
        colorsLabelsHeading: "Popisky",
        colorToday: "Dnes",
        colorSoon: "Brzy",
        colorAccent: "Výchozí",
        colorTodayDesc: "Barva ikony pro dnešní události",
        colorSoonDesc: "Barva ikony pro události v prahu „brzy“",
        colorAccentDesc: "Barva ikony pro události bez zvláštního stavu",
        animationLabel: "Animace",
        animationDesc: "Přidat této ikoně smyčkovou animaci",
        animationNone: "Žádná",
        animationPulse: "Pulzování",
        animationBounce: "Poskakování",
        animationShake: "Třesení",
        animationSpin: "Otáčení",
        animationFlash: "Blikání",
        matchTextLabel: "Obarvit i text",
        matchTextDesc: "Obarvit touto barvou ikony i celý text řádku",
        colorTitle: "Jméno",
        colorSubtitle: "Typ",
        colorBadge: "Výročí",
        colorWhen: "Odpočet",
        colorText: "Vlastní text",
        colorTitleDesc: "Barva textu pro jméno události",
        cardTitleColorDesc: "Barva textu pro vlastní název karty",
        colorSubtitleDesc: "Barva textu pro typ události",
        colorBadgeDesc: "Barva textu pro odznak čísla výročí",
        colorWhenDesc: "Barva textu pro odpočet (např. „za 3 dny“)",
        colorTextDesc:
          "Barva textu pro vlastní textové sloupce (viz Sloupce řádku v Rozvržení -> Zobrazení)",
        backgroundLabel: "Zobrazit pozadí",
        backgroundDesc: "Zobrazit zaoblené pozadí za číslem výročí",
        colorBadgeBackground: "Barva pozadí",
        colorBadgeBackgroundDesc: "Barva pozadí za číslem výročí",
        colorPlaceholder: "např. #ff5722 nebo var(--my-red)",
        presetDefault: "Výchozí",
        presetPrimary: "Primární",
        presetAccent: "Akcent",
        presetCustom: "Vlastní",
        presetRed: "Červená",
        presetPink: "Růžová",
        presetPurple: "Fialová",
        presetDeepPurple: "Tmavě fialová",
        presetIndigo: "Indigová",
        presetBlue: "Modrá",
        presetLightBlue: "Světle modrá",
        presetCyan: "Azurová",
        presetTeal: "Modrozelená",
        presetGreen: "Zelená",
        presetLightGreen: "Světle zelená",
        presetLime: "Limetková",
        presetYellow: "Žlutá",
        presetAmber: "Jantarová",
        presetOrange: "Oranžová",
        presetDeepOrange: "Tmavě oranžová",
        presetBrown: "Hnědá",
        presetGrey: "Šedá",
        presetBlueGrey: "Modrošedá",
        fonts: "Písma",
        fontCardTitle: "Název karty",
        fontCardTitleDesc: "Velikost písma pro vlastní název karty",
        fontTitleDesc: "Velikost písma pro jméno události",
        fontSubtitleDesc: "Velikost písma pro typ události",
        fontBadgeDesc: "Velikost písma pro odznak čísla výročí",
        fontWhenDesc: "Velikost písma pro odpočet (např. „za 3 dny“)",
        fontTextDesc:
          "Velikost písma pro vlastní textové sloupce (viz Sloupce řádku v Rozvržení -> Zobrazení)",
        fontPlaceholder: "např. 1.2em nebo 20px",
        fontBold: "Tučné",
        fontItalic: "Kurzíva",
        fontUppercase: "Velká písmena",
        fontUnderline: "Podtržené",
        fontLetterSpacing: "Rozestup písmen",
        fontLetterSpacingPlaceholder: "např. 0.05em nebo 1px",
        panelSettings: "Nastavení",
        panelSettingsDesc: "Obecné, události a období",
        panelLayout: "Rozvržení",
        panelLayoutDesc: "Zobrazení, písma, barvy, ikony a pozadí",
        groupGeneral: "Obecné",
        groupGeneralDesc: "",
        groupEvents: "Události",
        groupEventsDesc: "",
        groupPeriod: "Období",
        groupPeriodDesc: "",
        groupDisplay: "Zobrazení",
        groupDisplayDesc: "",
      },
    },
    nb: {
      defaultTitle: "Kommende hendelser",
      today: "I dag",
      inDay: "I morgen",
      inDays: (n) => `om ${n} dager`,
      dayAgo: "I går",
      daysAgo: (n) => `for ${n} dager siden`,
      noEvents: "Ingen kommende hendelser",
      types: {
        birthday: "Bursdag",
        anniversary: "Jubileum",
        name_day: "Navnedag",
        wedding_anniversary: "Bryllupsdag",
        memorial: "Minnedag",
        pet_birthday: "Kjæledyrs bursdag",
        work_anniversary: "Arbeidsjubileum",
        custom: "Egendefinert",
        holiday: "Helligdag",
      },
      typesPlural: {
        birthday: "Bursdager",
        anniversary: "Jubileer",
        name_day: "Navnedager",
        wedding_anniversary: "Bryllupsdager",
        memorial: "Minnedager",
        pet_birthday: "Kjæledyrs bursdager",
        work_anniversary: "Arbeidsjubileer",
        custom: "Egendefinert",
        holiday: "Helligdager",
      },
      categories: {
        public: "Offentlig",
        bank: "Bank",
        government: "Myndighet",
        school: "Skoleferie",
        optional: "Valgfri",
        unofficial: "Uoffisiell",
        half_day: "Halv dag",
        armed_forces: "Forsvaret",
        workday: "Arbeidsdag",
        catholic: "Katolsk",
        christian: "Kristen",
        orthodox: "Ortodoks",
        hebrew: "Jødisk",
        islamic: "Islamsk",
        hindu: "Hinduistisk",
        buddhist: "Buddhistisk",
      },
      categoriesPlural: {
        public: "Offentlige",
        bank: "Bank",
        government: "Myndighet",
        school: "Skoleferie",
        optional: "Valgfrie",
        unofficial: "Uoffisielle",
        half_day: "Halve dager",
        armed_forces: "Forsvaret",
        workday: "Arbeidsdager",
        catholic: "Katolske",
        christian: "Kristne",
        orthodox: "Ortodokse",
        hebrew: "Jødiske",
        islamic: "Islamske",
        hindu: "Hinduistiske",
        buddhist: "Buddhistiske",
      },
      editor: {
        title: "Korttittel",
        titleDesc: "Egen titteltekst for kortet (la stå tomt for standardtittelen)",
        titlePlaceholder: "f.eks. Kommende hendelser",
        count: "Antall hendelser",
        countDesc: "Det totale antallet hendelser som vises på kortet",
        todayOnly: "Bare i dag",
        todayOnlyDesc: "Ignorer alle andre filtre nedenfor og vis kun dagens hendelser",
        nextEventDayOnly: "Bare neste hendelsesdag",
        nextEventDayOnlyDesc:
          "Vis bare hendelser for den nærmeste dagen - i dag, hvis noen, ellers neste dag med hendelser (eventuelt flere enn én)",
        daysAhead: "Dager fremover (0 = ubegrenset)",
        daysAheadDesc: "Vis bare hendelser innen dette antallet dager (0 = ingen grense)",
        daysPast: "Dager tilbake (0 = bare i dag)",
        daysPastDesc: "Hvor mange dager tilbake en hendelse fortsatt telles som nylig (0 = bare i dag)",
        soonDays: "«Snart»-terskel (dager)",
        soonDaysDesc: "Hendelser innen dette antallet dager telles som «snart»",
        types: "Hendelsestyper",
        typesDesc: "Vis bare de avkryssede hendelsestypene",
        categories: "Helligdagskategorier",
        categoriesDesc: "Vis bare helligdager i de avkryssede kategoriene (andre hendelsestyper påvirkes ikke)",
        showAll: "Vis alle",
        hideAll: "Skjul alle",
        visibilityHeading: "Vis / Skjul",
        visibilityPast: "Tidligere hendelser",
        visibilityPastDesc: "Vis hendelser hvis jubileum allerede har passert innenfor det konfigurerte tidligere-vinduet",
        visibilityToday: "Dagens hendelser",
        visibilityTodayDesc: "Vis hendelser som skjer i dag",
        visibilitySoon: "Snart",
        visibilitySoonDesc: "Vis hendelser innenfor «snart»-terskelen",
        visibilityCardTitleDesc: "Vis kortets egen tittel",
        hideCardTitle: "Skjul",
        hideCardTitleDesc: "Skjul kortets egen tittel, selv om den er angitt ovenfor",
        tapAction: "Handling ved trykk",
        tapActionDesc: "Hva som skjer når en rad trykkes eller klikkes",
        holdAction: "Handling ved trykk og hold",
        holdActionDesc: "Hva som skjer når en rad trykkes og holdes inne",
        visibilityIcon: "Ikon",
        visibilityIconDesc: "Vis typeikonet foran hver rad",
        visibilityTitleDesc: "Vis hendelsens navn",
        visibilitySubtitleDesc: "Vis hendelsestypen",
        visibilityCountrySuffix: "Helligdagssuffiks",
        visibilityCountrySuffixDesc: "Legg til landet (og eventuelt fylket) etter helligdagens navn/type, f.eks. «Grunnlovsdagen · NO (OSL)»",
        columnsHeading: "Radkolonner",
        columnsDesc:
          "Legg til, fjern og endre rekkefølgen på det hver rad viser. Egendefinerte tekstkolonner kan blande fri tekst med plassholdere: {name}, {type}, {occurrence}, {when}, {country}.",
        columnTypeIcon: "Ikon",
        columnTypeInfo: "Navn + type",
        columnTypeName: "Navn",
        columnTypeSubtitle: "Type",
        columnTypeText: "Egendefinert tekst",
        columnAdd: "Legg til",
        columnMoveUp: "Flytt opp",
        columnMoveDown: "Flytt ned",
        columnRemove: "Fjern",
        columnTemplatePlaceholder: "f.eks. {name} fyller {occurrence} i dag",
        columnColor: "Farge",
        columnsCompact: "Kompakt (ingen mellomrom, sentrert)",
        columnsCompactDesc:
          "Fjerner mellomrommet mellom kolonnene, sentrerer raden og gjør vekt og opasitet lik for alle felt - nyttig når kolonnene danner én sammenhengende setning.",
        visibilityBadgeDesc: "Vis merket for jubileumsnummeret",
        visibilityWhenDesc: "Vis nedtellingen (f.eks. «om 3 dager»)",
        visibilityVipOnly: "Kun VIP",
        visibilityVipOnlyDesc: "Vis bare hendelser merket som «VIP Annual»",
        visibilityImportantOnly: "Kun Important",
        visibilityImportantOnlyDesc:
          "Vis bare hendelser som automatisk er merket som viktige (angis under Annual Innstillinger i integrasjonen)",
        vipBadgeIcon: "VIP-merkeikon",
        vipBadgeIconDesc: "MDI-ikon vist som et lite merke på ikonet til VIP-merkede hendelser",
        vipBadgeIconPlaceholder: "mdi:star",
        importantBadgeIcon: "Important-merkeikon",
        importantBadgeIconDesc: "MDI-ikon vist som et lite merke på ikonet til hendelser som automatisk er merket som viktige",
        importantBadgeIconPlaceholder: "mdi:exclamation-thick",
        highlightHeading: "Fremheving",
        highlightPast: "Tidligere hendelser",
        highlightPastDesc: "Fargelegg radbakgrunnen for hendelser som allerede har skjedd",
        highlightToday: "Dagens hendelser",
        highlightTodayDesc: "Fargelegg radbakgrunnen for dagens hendelser",
        highlightSoon: "Snart",
        highlightSoonDesc: "Fargelegg radbakgrunnen for hendelser innenfor «snart»-terskelen",
        highlightBgColor: "Bakgrunnsfarge",
        highlightBgColorDesc: "Bakgrunnsfarge for denne fremhevingen",
        highlightVip: "VIP-hendelser",
        highlightVipDesc: "Vis et merke på ikonet til VIP-merkede hendelser",
        highlightImportant: "Viktige hendelser",
        highlightImportantDesc: "Vis et merke på ikonet til hendelser som automatisk er merket som viktige",
        vipBadgeColor: "Merkefarge",
        vipBadgeColorDesc: "Bakgrunnsfarge for VIP-merket",
        importantBadgeColor: "Merkefarge",
        importantBadgeColorDesc: "Bakgrunnsfarge for Important-merket",
        colors: "Farger",
        cardBackgroundTabTitle: "Kortbakgrunn",
        cardBackgroundEnable: "Vis bakgrunn",
        cardBackgroundEnableDesc: "Vis en egen farge og/eller bilde bak hele kortet",
        cardBackgroundColor: "Farge",
        cardBackgroundColorDesc: "Bakgrunnsfarge for kortet",
        cardBackgroundImage: "Bilde",
        cardBackgroundImageDesc:
          "Last opp et bilde, eller lim inn en URL eller en lokal mediesti (f.eks. fra HAs mediebehandler) å bruke som kortbakgrunn. Støttede formater: JPEG, PNG, GIF, WebP. Hold filen rimelig liten (høyst noen få MB) for rask innlasting.",
        cardBackgroundImagePlaceholder: "f.eks. /local/mitt-bilde.jpg",
        cardBackgroundUpload: "Last opp bilde",
        cardBackgroundClear: "Fjern bilde",
        cardBackgroundSize: "Bildeatferd",
        cardBackgroundSizeDesc:
          "Fyll: skalerer bildet slik at det fyller kortet helt, beskjærer om nødvendig. Tilpass: skalerer bildet slik at det passer i kortet uten beskjæring, kan etterlate tomt rom. Faktisk størrelse: viser bildet i original størrelse, sentrert. Flislegg: gjentar bildet i original størrelse for å flislegge kortet.",
        cardBackgroundSizeCover: "Fyll",
        cardBackgroundSizeContain: "Tilpass",
        cardBackgroundSizeAuto: "Faktisk størrelse",
        cardBackgroundSizeRepeat: "Flislegg",
        cardBackgroundOpacity: "Ugjennomsiktighet",
        cardBackgroundOpacityDesc: "Ugjennomsiktighet for bakgrunnsfarge/-bilde, i prosent",
        colorsIconsHeading: "Ikoner",
        colorsLabelsHeading: "Etiketter",
        colorToday: "I dag",
        colorSoon: "Snart",
        colorAccent: "Standard",
        colorTodayDesc: "Ikonfarge for dagens hendelser",
        colorSoonDesc: "Ikonfarge for hendelser innenfor «snart»-terskelen",
        colorAccentDesc: "Ikonfarge for hendelser uten spesiell status",
        animationLabel: "Animasjon",
        animationDesc: "Legg til en løkkeanimasjon for dette ikonet",
        animationNone: "Ingen",
        animationPulse: "Puls",
        animationBounce: "Sprett",
        animationShake: "Rist",
        animationSpin: "Snurr",
        animationFlash: "Blink",
        matchTextLabel: "Fargelegg også teksten",
        matchTextDesc: "Fargelegg også all tekst i raden med denne ikonfargen",
        colorTitle: "Navn",
        colorSubtitle: "Type",
        colorBadge: "Jubileum",
        colorWhen: "Nedtelling",
        colorText: "Egendefinert tekst",
        colorTitleDesc: "Tekstfarge for hendelsens navn",
        cardTitleColorDesc: "Tekstfarge for kortets egen tittel",
        colorSubtitleDesc: "Tekstfarge for hendelsestypen",
        colorBadgeDesc: "Tekstfarge for merket med jubileumsnummeret",
        colorWhenDesc: "Tekstfarge for nedtellingen (f.eks. «om 3 dager»)",
        colorTextDesc:
          "Tekstfarge for egendefinerte tekstkolonner (se Radkolonner under Layout -> Visning)",
        backgroundLabel: "Vis bakgrunn",
        backgroundDesc: "Vis en avrundet bakgrunn bak jubileumsnummeret",
        colorBadgeBackground: "Bakgrunnsfarge",
        colorBadgeBackgroundDesc: "Bakgrunnsfarge bak jubileumsnummeret",
        colorPlaceholder: "f.eks. #ff5722 eller var(--my-red)",
        presetDefault: "Standard",
        presetPrimary: "Primær",
        presetAccent: "Aksent",
        presetCustom: "Egendefinert",
        presetRed: "Rød",
        presetPink: "Rosa",
        presetPurple: "Lilla",
        presetDeepPurple: "Mørk lilla",
        presetIndigo: "Indigo",
        presetBlue: "Blå",
        presetLightBlue: "Lyseblå",
        presetCyan: "Cyan",
        presetTeal: "Blågrønn",
        presetGreen: "Grønn",
        presetLightGreen: "Lysegrønn",
        presetLime: "Limegrønn",
        presetYellow: "Gul",
        presetAmber: "Rav",
        presetOrange: "Oransje",
        presetDeepOrange: "Mørk oransje",
        presetBrown: "Brun",
        presetGrey: "Grå",
        presetBlueGrey: "Blågrå",
        fonts: "Skrifter",
        fontCardTitle: "Korttittel",
        fontCardTitleDesc: "Skriftstørrelse for kortets egen tittel",
        fontTitleDesc: "Skriftstørrelse for hendelsens navn",
        fontSubtitleDesc: "Skriftstørrelse for hendelsestypen",
        fontBadgeDesc: "Skriftstørrelse for merket med jubileumsnummeret",
        fontWhenDesc: "Skriftstørrelse for nedtellingen (f.eks. «om 3 dager»)",
        fontTextDesc:
          "Skriftstørrelse for egendefinerte tekstkolonner (se Radkolonner under Layout -> Visning)",
        fontPlaceholder: "f.eks. 1.2em eller 20px",
        fontBold: "Fet",
        fontItalic: "Kursiv",
        fontUppercase: "Store bokstaver",
        fontUnderline: "Understreket",
        fontLetterSpacing: "Bokstavavstand",
        fontLetterSpacingPlaceholder: "f.eks. 0.05em eller 1px",
        panelSettings: "Innstillinger",
        panelSettingsDesc: "Generelt, hendelser og periode",
        panelLayout: "Layout",
        panelLayoutDesc: "Visning, skrifter, farger, ikoner og bakgrunner",
        groupGeneral: "Generelt",
        groupGeneralDesc: "",
        groupEvents: "Hendelser",
        groupEventsDesc: "",
        groupPeriod: "Periode",
        groupPeriodDesc: "",
        groupDisplay: "Visning",
        groupDisplayDesc: "",
      },
    },
    da: {
      defaultTitle: "Kommende begivenheder",
      today: "I dag",
      inDay: "I morgen",
      inDays: (n) => `om ${n} dage`,
      dayAgo: "I går",
      daysAgo: (n) => `for ${n} dage siden`,
      noEvents: "Ingen kommende begivenheder",
      types: {
        birthday: "Fødselsdag",
        anniversary: "Mærkedag",
        name_day: "Navnedag",
        wedding_anniversary: "Bryllupsdag",
        memorial: "Mindedag",
        pet_birthday: "Kæledyrs fødselsdag",
        work_anniversary: "Jubilæum på arbejdet",
        custom: "Tilpasset",
        holiday: "Helligdag",
      },
      typesPlural: {
        birthday: "Fødselsdage",
        anniversary: "Mærkedage",
        name_day: "Navnedage",
        wedding_anniversary: "Bryllupsdage",
        memorial: "Mindedage",
        pet_birthday: "Kæledyrs fødselsdage",
        work_anniversary: "Jubilæer på arbejdet",
        custom: "Tilpasset",
        holiday: "Helligdage",
      },
      categories: {
        public: "Offentlig",
        bank: "Bank",
        government: "Myndighed",
        school: "Skoleferie",
        optional: "Valgfri",
        unofficial: "Uofficiel",
        half_day: "Halv dag",
        armed_forces: "Forsvaret",
        workday: "Arbejdsdag",
        catholic: "Katolsk",
        christian: "Kristen",
        orthodox: "Ortodoks",
        hebrew: "Jødisk",
        islamic: "Islamisk",
        hindu: "Hinduistisk",
        buddhist: "Buddhistisk",
      },
      categoriesPlural: {
        public: "Offentlige",
        bank: "Bank",
        government: "Myndighed",
        school: "Skoleferie",
        optional: "Valgfrie",
        unofficial: "Uofficielle",
        half_day: "Halve dage",
        armed_forces: "Forsvaret",
        workday: "Arbejdsdage",
        catholic: "Katolske",
        christian: "Kristne",
        orthodox: "Ortodokse",
        hebrew: "Jødiske",
        islamic: "Islamiske",
        hindu: "Hinduistiske",
        buddhist: "Buddhistiske",
      },
      editor: {
        title: "Korttitel",
        titleDesc: "Egen titeltekst til kortet (lad stå tomt for standardtitlen)",
        titlePlaceholder: "f.eks. Kommende begivenheder",
        count: "Antal begivenheder",
        countDesc: "Det samlede antal begivenheder, der vises på kortet",
        todayOnly: "Kun i dag",
        todayOnlyDesc: "Ignorer alle andre filtre nedenfor og vis kun dagens begivenheder",
        nextEventDayOnly: "Kun næste begivenhedsdag",
        nextEventDayOnlyDesc:
          "Vis kun begivenheder for den nærmeste dag - i dag, hvis nogen, ellers næste dag med begivenheder (eventuelt flere end én)",
        daysAhead: "Dage frem (0 = ubegrænset)",
        daysAheadDesc: "Vis kun begivenheder inden for dette antal dage (0 = ingen grænse)",
        daysPast: "Dage tilbage (0 = kun i dag)",
        daysPastDesc: "Hvor mange dage tilbage en begivenhed stadig tæller som nylig (0 = kun i dag)",
        soonDays: "\"Snart\"-tærskel (dage)",
        soonDaysDesc: "Begivenheder inden for dette antal dage tæller som \"snart\"",
        types: "Begivenhedstyper",
        typesDesc: "Vis kun de afkrydsede begivenhedstyper",
        categories: "Helligdagskategorier",
        categoriesDesc: "Vis kun helligdage i de afkrydsede kategorier (andre begivenhedstyper påvirkes ikke)",
        showAll: "Vis alle",
        hideAll: "Skjul alle",
        visibilityHeading: "Vis / Skjul",
        visibilityPast: "Tidligere begivenheder",
        visibilityPastDesc: "Vis begivenheder, hvis mærkedag allerede er passeret inden for det konfigurerede tidligere-vindue",
        visibilityToday: "Dagens begivenheder",
        visibilityTodayDesc: "Vis begivenheder, der finder sted i dag",
        visibilitySoon: "Snart",
        visibilitySoonDesc: "Vis begivenheder inden for \"snart\"-tærsklen",
        visibilityCardTitleDesc: "Vis kortets egen titel",
        hideCardTitle: "Skjul",
        hideCardTitleDesc: "Skjul kortets egen titel, selv når den er angivet ovenfor",
        tapAction: "Handling ved tryk",
        tapActionDesc: "Hvad der sker, når en række trykkes eller klikkes",
        holdAction: "Handling ved tryk og hold",
        holdActionDesc: "Hvad der sker, når en række trykkes og holdes nede",
        visibilityIcon: "Ikon",
        visibilityIconDesc: "Vis typeikonet foran hver række",
        visibilityTitleDesc: "Vis begivenhedens navn",
        visibilitySubtitleDesc: "Vis begivenhedstypen",
        visibilityCountrySuffix: "Helligdagssuffiks",
        visibilityCountrySuffixDesc: "Tilføj landet (og evt. regionen) efter helligdagens navn/type, f.eks. \"Grundlovsdag · DK (84)\"",
        columnsHeading: "Rækkekolonner",
        columnsDesc:
          "Tilføj, fjern og omorganiser hvad hver række viser. Brugerdefinerede tekstkolonner kan blande fri tekst med pladsholdere: {name}, {type}, {occurrence}, {when}, {country}.",
        columnTypeIcon: "Ikon",
        columnTypeInfo: "Navn + type",
        columnTypeName: "Navn",
        columnTypeSubtitle: "Type",
        columnTypeText: "Brugerdefineret tekst",
        columnAdd: "Tilføj",
        columnMoveUp: "Flyt op",
        columnMoveDown: "Flyt ned",
        columnRemove: "Fjern",
        columnTemplatePlaceholder: "f.eks. {name} fylder {occurrence} i dag",
        columnColor: "Farve",
        columnsCompact: "Kompakt (ingen mellemrum, centreret)",
        columnsCompactDesc:
          "Fjerner mellemrummet mellem kolonnerne, centrerer rækken og gør vægt og opacitet ens for alle felter - nyttigt når kolonnerne danner én sammenhængende sætning.",
        visibilityBadgeDesc: "Vis mærket for jubilæumsnummeret",
        visibilityWhenDesc: "Vis nedtællingen (f.eks. \"om 3 dage\")",
        visibilityVipOnly: "Kun VIP",
        visibilityVipOnlyDesc: "Vis kun begivenheder markeret som \"VIP Annual\"",
        visibilityImportantOnly: "Kun Important",
        visibilityImportantOnlyDesc:
          "Vis kun begivenheder, der automatisk er markeret som vigtige (indstilles under Annual Indstillinger i integrationen)",
        vipBadgeIcon: "VIP-mærkeikon",
        vipBadgeIconDesc: "MDI-ikon vist som et lille mærke på ikonet for VIP-markerede begivenheder",
        vipBadgeIconPlaceholder: "mdi:star",
        importantBadgeIcon: "Important-mærkeikon",
        importantBadgeIconDesc: "MDI-ikon vist som et lille mærke på ikonet for begivenheder, der automatisk er markeret som vigtige",
        importantBadgeIconPlaceholder: "mdi:exclamation-thick",
        highlightHeading: "Fremhævning",
        highlightPast: "Tidligere begivenheder",
        highlightPastDesc: "Farvelæg rækkebaggrunden for begivenheder, der allerede er sket",
        highlightToday: "Dagens begivenheder",
        highlightTodayDesc: "Farvelæg rækkebaggrunden for dagens begivenheder",
        highlightSoon: "Snart",
        highlightSoonDesc: "Farvelæg rækkebaggrunden for begivenheder inden for \"snart\"-tærsklen",
        highlightBgColor: "Baggrundsfarve",
        highlightBgColorDesc: "Baggrundsfarve for denne fremhævning",
        highlightVip: "VIP-begivenheder",
        highlightVipDesc: "Vis et mærke på ikonet for VIP-markerede begivenheder",
        highlightImportant: "Vigtige begivenheder",
        highlightImportantDesc: "Vis et mærke på ikonet for begivenheder, der automatisk er markeret som vigtige",
        vipBadgeColor: "Mærkefarve",
        vipBadgeColorDesc: "Baggrundsfarve for VIP-mærket",
        importantBadgeColor: "Mærkefarve",
        importantBadgeColorDesc: "Baggrundsfarve for Important-mærket",
        colors: "Farver",
        cardBackgroundTabTitle: "Kortbaggrund",
        cardBackgroundEnable: "Vis baggrund",
        cardBackgroundEnableDesc: "Vis en egen farve og/eller billede bag hele kortet",
        cardBackgroundColor: "Farve",
        cardBackgroundColorDesc: "Baggrundsfarve for kortet",
        cardBackgroundImage: "Billede",
        cardBackgroundImageDesc:
          "Upload et billede, eller indsæt en URL eller en lokal mediesti (f.eks. fra HA's mediebrowser) til brug som kortbaggrund. Understøttede formater: JPEG, PNG, GIF, WebP. Hold filen rimeligt lille (højst et par MB) for hurtig indlæsning.",
        cardBackgroundImagePlaceholder: "f.eks. /local/mit-billede.jpg",
        cardBackgroundUpload: "Upload billede",
        cardBackgroundClear: "Fjern billede",
        cardBackgroundSize: "Billedadfærd",
        cardBackgroundSizeDesc:
          "Udfyld: skalerer billedet, så det udfylder kortet helt, beskærer om nødvendigt. Tilpas: skalerer billedet, så det passer i kortet uden beskæring, kan efterlade tomt rum. Faktisk størrelse: viser billedet i original størrelse, centreret. Fliser: gentager billedet i original størrelse for at flise kortet.",
        cardBackgroundSizeCover: "Udfyld",
        cardBackgroundSizeContain: "Tilpas",
        cardBackgroundSizeAuto: "Faktisk størrelse",
        cardBackgroundSizeRepeat: "Fliser",
        cardBackgroundOpacity: "Uigennemsigtighed",
        cardBackgroundOpacityDesc: "Uigennemsigtighed for baggrundsfarve/-billede, i procent",
        colorsIconsHeading: "Ikoner",
        colorsLabelsHeading: "Etiketter",
        colorToday: "I dag",
        colorSoon: "Snart",
        colorAccent: "Standard",
        colorTodayDesc: "Ikonfarve for dagens begivenheder",
        colorSoonDesc: "Ikonfarve for begivenheder inden for \"snart\"-tærsklen",
        colorAccentDesc: "Ikonfarve for begivenheder uden særlig status",
        animationLabel: "Animation",
        animationDesc: "Tilføj en løkkeanimation til dette ikon",
        animationNone: "Ingen",
        animationPulse: "Puls",
        animationBounce: "Hop",
        animationShake: "Ryst",
        animationSpin: "Spin",
        animationFlash: "Blink",
        matchTextLabel: "Farvelæg også teksten",
        matchTextDesc: "Farvelæg også hele rækkens tekst med denne ikonfarve",
        colorTitle: "Navn",
        colorSubtitle: "Type",
        colorBadge: "Jubilæum",
        colorWhen: "Nedtælling",
        colorText: "Brugerdefineret tekst",
        colorTitleDesc: "Tekstfarve for begivenhedens navn",
        cardTitleColorDesc: "Tekstfarve for kortets egen titel",
        colorSubtitleDesc: "Tekstfarve for begivenhedstypen",
        colorBadgeDesc: "Tekstfarve for mærket med jubilæumsnummeret",
        colorWhenDesc: "Tekstfarve for nedtællingen (f.eks. \"om 3 dage\")",
        colorTextDesc:
          "Tekstfarve for brugerdefinerede tekstkolonner (se Rækkekolonner under Layout -> Visning)",
        backgroundLabel: "Vis baggrund",
        backgroundDesc: "Vis en afrundet baggrund bag jubilæumsnummeret",
        colorBadgeBackground: "Baggrundsfarve",
        colorBadgeBackgroundDesc: "Baggrundsfarve bag jubilæumsnummeret",
        colorPlaceholder: "f.eks. #ff5722 eller var(--my-red)",
        presetDefault: "Standard",
        presetPrimary: "Primær",
        presetAccent: "Accent",
        presetCustom: "Tilpasset",
        presetRed: "Rød",
        presetPink: "Lyserød",
        presetPurple: "Lilla",
        presetDeepPurple: "Mørk lilla",
        presetIndigo: "Indigo",
        presetBlue: "Blå",
        presetLightBlue: "Lyseblå",
        presetCyan: "Cyan",
        presetTeal: "Blågrøn",
        presetGreen: "Grøn",
        presetLightGreen: "Lysegrøn",
        presetLime: "Limegrøn",
        presetYellow: "Gul",
        presetAmber: "Rav",
        presetOrange: "Orange",
        presetDeepOrange: "Mørk orange",
        presetBrown: "Brun",
        presetGrey: "Grå",
        presetBlueGrey: "Blågrå",
        fonts: "Skrifttyper",
        fontCardTitle: "Korttitel",
        fontCardTitleDesc: "Skriftstørrelse for kortets egen titel",
        fontTitleDesc: "Skriftstørrelse for begivenhedens navn",
        fontSubtitleDesc: "Skriftstørrelse for begivenhedstypen",
        fontBadgeDesc: "Skriftstørrelse for mærket med jubilæumsnummeret",
        fontWhenDesc: "Skriftstørrelse for nedtællingen (f.eks. \"om 3 dage\")",
        fontTextDesc:
          "Skriftstørrelse for brugerdefinerede tekstkolonner (se Rækkekolonner under Layout -> Visning)",
        fontPlaceholder: "f.eks. 1.2em eller 20px",
        fontBold: "Fed",
        fontItalic: "Kursiv",
        fontUppercase: "Store bogstaver",
        fontUnderline: "Understreget",
        fontLetterSpacing: "Bogstavafstand",
        fontLetterSpacingPlaceholder: "f.eks. 0.05em eller 1px",
        panelSettings: "Indstillinger",
        panelSettingsDesc: "Generelt, begivenheder og periode",
        panelLayout: "Layout",
        panelLayoutDesc: "Visning, skrifttyper, farver, ikoner og baggrunde",
        groupGeneral: "Generelt",
        groupGeneralDesc: "",
        groupEvents: "Begivenheder",
        groupEventsDesc: "",
        groupPeriod: "Periode",
        groupPeriodDesc: "",
        groupDisplay: "Visning",
        groupDisplayDesc: "",
      },
    },
    tr: {
      defaultTitle: "Yaklaşan Etkinlikler",
      today: "Bugün",
      inDay: "Yarın",
      inDays: (n) => `${n} gün sonra`,
      dayAgo: "Dün",
      daysAgo: (n) => `${n} gün önce`,
      noEvents: "Yaklaşan etkinlik yok",
      types: {
        birthday: "Doğum günü",
        anniversary: "Yıl dönümü",
        name_day: "İsim günü",
        wedding_anniversary: "Evlilik yıl dönümü",
        memorial: "Ölüm yıl dönümü",
        pet_birthday: "Evcil hayvan doğum günü",
        work_anniversary: "İş yıl dönümü",
        custom: "Özel",
        holiday: "Resmi tatil",
      },
      typesPlural: {
        birthday: "Doğum günleri",
        anniversary: "Yıl dönümleri",
        name_day: "İsim günleri",
        wedding_anniversary: "Evlilik yıl dönümleri",
        memorial: "Ölüm yıl dönümleri",
        pet_birthday: "Evcil hayvan doğum günleri",
        work_anniversary: "İş yıl dönümleri",
        custom: "Özel",
        holiday: "Resmi tatiller",
      },
      categories: {
        public: "Resmi",
        bank: "Banka",
        government: "Devlet dairesi",
        school: "Okul tatili",
        optional: "İsteğe bağlı",
        unofficial: "Gayriresmi",
        half_day: "Yarım gün",
        armed_forces: "Silahlı kuvvetler",
        workday: "İş günü",
        catholic: "Katolik",
        christian: "Hristiyan",
        orthodox: "Ortodoks",
        hebrew: "Yahudi",
        islamic: "İslami",
        hindu: "Hindu",
        buddhist: "Budist",
      },
      categoriesPlural: {
        public: "Resmi tatiller",
        bank: "Banka tatilleri",
        government: "Devlet tatilleri",
        school: "Okul tatilleri",
        optional: "İsteğe bağlı tatiller",
        unofficial: "Gayriresmi tatiller",
        half_day: "Yarım günler",
        armed_forces: "Silahlı kuvvetler tatilleri",
        workday: "İş günleri",
        catholic: "Katolik tatiller",
        christian: "Hristiyan tatiller",
        orthodox: "Ortodoks tatiller",
        hebrew: "Yahudi tatiller",
        islamic: "İslami tatiller",
        hindu: "Hindu tatiller",
        buddhist: "Budist tatiller",
      },
      editor: {
        title: "Kart başlığı",
        titleDesc: "Kart için özel başlık metni (varsayılan başlık için boş bırakın)",
        titlePlaceholder: "örn. Yaklaşan Etkinlikler",
        count: "Etkinlik sayısı",
        countDesc: "Kartta gösterilen toplam etkinlik sayısı",
        todayOnly: "Yalnızca bugün",
        todayOnlyDesc: "Aşağıdaki tüm diğer filtreleri yok say ve yalnızca bugün gerçekleşen etkinlikleri göster",
        nextEventDayOnly: "Yalnızca sonraki etkinlik günü",
        nextEventDayOnlyDesc:
          "Yalnızca en yakın gündeki etkinlikleri göster - varsa bugünkü, yoksa etkinlik olan sonraki gün (birden fazla olabilir)",
        daysAhead: "İleri gün sayısı (0 = sınırsız)",
        daysAheadDesc: "Yalnızca bu gün sayısı içinde gerçekleşen etkinlikleri göster (0 = sınır yok)",
        daysPast: "Geçmiş gün sayısı (0 = yalnızca bugün)",
        daysPastDesc: "Bir etkinliğin kaç gün geriye kadar hâlâ yakın sayılacağı (0 = yalnızca bugün)",
        soonDays: "\"Yakında\" eşiği (gün)",
        soonDaysDesc: "Bu gün sayısı içindeki etkinlikler \"yakında\" sayılır",
        types: "Etkinlik türleri",
        typesDesc: "Yalnızca işaretli etkinlik türlerini göster",
        categories: "Tatil kategorileri",
        categoriesDesc: "Yalnızca işaretli kategorilerdeki tatilleri göster (diğer etkinlik türleri etkilenmez)",
        showAll: "Tümünü göster",
        hideAll: "Tümünü gizle",
        visibilityHeading: "Göster / Gizle",
        visibilityPast: "Geçmiş etkinlikler",
        visibilityPastDesc: "Yıl dönümü, ayarlanan geçmiş penceresi içinde zaten geçmiş olan etkinlikleri göster",
        visibilityToday: "Bugünkü etkinlikler",
        visibilityTodayDesc: "Bugün gerçekleşen etkinlikleri göster",
        visibilitySoon: "Yakında",
        visibilitySoonDesc: "\"Yakında\" eşiği içindeki etkinlikleri göster",
        visibilityCardTitleDesc: "Kartın kendi başlığını göster",
        hideCardTitle: "Gizle",
        hideCardTitleDesc: "Yukarıda ayarlanmış olsa bile kartın kendi başlığını gizle",
        tapAction: "Dokunma eylemi",
        tapActionDesc: "Bir satıra dokunulduğunda veya tıklandığında ne olacağı",
        holdAction: "Basılı tutma eylemi",
        holdActionDesc: "Bir satır basılı tutulduğunda ne olacağı",
        visibilityIcon: "Simge",
        visibilityIconDesc: "Her satırın önünde tür simgesini göster",
        visibilityTitleDesc: "Etkinlik adını göster",
        visibilitySubtitleDesc: "Etkinlik türünü göster",
        visibilityCountrySuffix: "Tatil eki",
        visibilityCountrySuffixDesc: "Tatilin adının/türünün ardına ülkeyi (ve varsa bölgeyi) ekler, örn. \"Cumhuriyet Bayramı · TR (34)\"",
        columnsHeading: "Satır sütunları",
        columnsDesc:
          "Her satırın gösterdiği içeriği ekleyin, kaldırın ve yeniden sıralayın. Özel metin sütunları serbest metni yer tutucularla karıştırabilir: {name}, {type}, {occurrence}, {when}, {country}.",
        columnTypeIcon: "Simge",
        columnTypeInfo: "Ad + tür",
        columnTypeName: "Ad",
        columnTypeSubtitle: "Tür",
        columnTypeText: "Özel metin",
        columnAdd: "Ekle",
        columnMoveUp: "Yukarı taşı",
        columnMoveDown: "Aşağı taşı",
        columnRemove: "Kaldır",
        columnTemplatePlaceholder: "örn. {name} bugün {occurrence} yaşına giriyor",
        columnColor: "Renk",
        columnsCompact: "Kompakt (boşluksuz, ortalanmış)",
        columnsCompactDesc:
          "Sütunlar arasındaki boşluğu kaldırır, satırı ortalar ve tüm alanların kalınlık ve saydamlığını eşitler - sütunların tek bir cümle oluşturduğu durumlarda kullanışlıdır.",
        visibilityBadgeDesc: "Tekrar numarası rozetini göster",
        visibilityWhenDesc: "Geri sayımı göster (örn. \"3 gün sonra\")",
        visibilityVipOnly: "Yalnızca VIP",
        visibilityVipOnlyDesc: "Yalnızca \"VIP Annual\" olarak işaretlenmiş etkinlikleri göster",
        visibilityImportantOnly: "Yalnızca Important",
        visibilityImportantOnlyDesc:
          "Yalnızca otomatik olarak önemli işaretlenmiş etkinlikleri göster (entegrasyondaki Annual Ayarları altından yapılandırılır)",
        vipBadgeIcon: "VIP rozet simgesi",
        vipBadgeIconDesc: "VIP olarak işaretlenmiş etkinliklerin simgesinde küçük bir rozet olarak gösterilen MDI simgesi",
        vipBadgeIconPlaceholder: "mdi:star",
        importantBadgeIcon: "Important rozet simgesi",
        importantBadgeIconDesc: "Otomatik olarak önemli işaretlenmiş etkinliklerin simgesinde küçük bir rozet olarak gösterilen MDI simgesi",
        importantBadgeIconPlaceholder: "mdi:exclamation-thick",
        highlightHeading: "Vurgulama",
        highlightPast: "Geçmiş etkinlikler",
        highlightPastDesc: "Zaten gerçekleşmiş etkinlikler için satır arka planını renklendir",
        highlightToday: "Bugünkü etkinlikler",
        highlightTodayDesc: "Bugünkü etkinlikler için satır arka planını renklendir",
        highlightSoon: "Yakında",
        highlightSoonDesc: "\"Yakında\" eşiği içindeki etkinlikler için satır arka planını renklendir",
        highlightBgColor: "Arka plan rengi",
        highlightBgColorDesc: "Bu vurgulama için arka plan rengi",
        highlightVip: "VIP etkinlikler",
        highlightVipDesc: "VIP olarak işaretlenmiş etkinliklerin simgesinde bir rozet göster",
        highlightImportant: "Önemli etkinlikler",
        highlightImportantDesc: "Otomatik olarak önemli işaretlenmiş etkinliklerin simgesinde bir rozet göster",
        vipBadgeColor: "Rozet rengi",
        vipBadgeColorDesc: "VIP rozetinin arka plan rengi",
        importantBadgeColor: "Rozet rengi",
        importantBadgeColorDesc: "Important rozetinin arka plan rengi",
        colors: "Renkler",
        cardBackgroundTabTitle: "Kart Arka Planı",
        cardBackgroundEnable: "Arka planı göster",
        cardBackgroundEnableDesc: "Tüm kartın arkasında özel bir renk ve/veya görsel göster",
        cardBackgroundColor: "Renk",
        cardBackgroundColorDesc: "Kartın arka plan rengi",
        cardBackgroundImage: "Görsel",
        cardBackgroundImageDesc:
          "Kart arka planı olarak kullanmak üzere bir görsel yükleyin veya bir URL ya da yerel medya yolu (örn. HA'nın Medya Tarayıcısından) yapıştırın. Desteklenen formatlar: JPEG, PNG, GIF, WebP. Hızlı yüklenmesi için dosyayı makul ölçüde küçük tutun (en fazla birkaç MB).",
        cardBackgroundImagePlaceholder: "örn. /local/resmim.jpg",
        cardBackgroundUpload: "Görsel yükle",
        cardBackgroundClear: "Görseli kaldır",
        cardBackgroundSize: "Görsel davranışı",
        cardBackgroundSizeDesc:
          "Doldur: görseli, gerekirse kırparak, kartı tamamen dolduracak şekilde ölçekler. Sığdır: görseli kırpmadan kartın içine sığacak şekilde ölçekler, boş alan bırakabilir. Gerçek boyut: görseli ortalanmış olarak orijinal boyutunda gösterir. Döşeme: görseli orijinal boyutunda tekrarlayarak kartı döşer.",
        cardBackgroundSizeCover: "Doldur",
        cardBackgroundSizeContain: "Sığdır",
        cardBackgroundSizeAuto: "Gerçek boyut",
        cardBackgroundSizeRepeat: "Döşeme",
        cardBackgroundOpacity: "Opaklık",
        cardBackgroundOpacityDesc: "Arka plan rengi/görselinin opaklığı, yüzde olarak",
        colorsIconsHeading: "Simgeler",
        colorsLabelsHeading: "Etiketler",
        colorToday: "Bugün",
        colorSoon: "Yakında",
        colorAccent: "Varsayılan",
        colorTodayDesc: "Bugünkü etkinlikler için simge rengi",
        colorSoonDesc: "\"Yakında\" eşiği içindeki etkinlikler için simge rengi",
        colorAccentDesc: "Özel durumu olmayan etkinlikler için simge rengi",
        animationLabel: "Animasyon",
        animationDesc: "Bu simgeye döngüsel bir animasyon ekle",
        animationNone: "Yok",
        animationPulse: "Nabız",
        animationBounce: "Zıplama",
        animationShake: "Sallanma",
        animationSpin: "Dönme",
        animationFlash: "Yanıp sönme",
        matchTextLabel: "Metni de renklendir",
        matchTextDesc: "Satırın tüm metnini de bu simge rengiyle renklendir",
        colorTitle: "Ad",
        colorSubtitle: "Tür",
        colorBadge: "Tekrar sayısı",
        colorWhen: "Geri sayım",
        colorText: "Özel metin",
        colorTitleDesc: "Etkinlik adı için metin rengi",
        cardTitleColorDesc: "Kartın kendi başlığı için metin rengi",
        colorSubtitleDesc: "Etkinlik türü için metin rengi",
        colorBadgeDesc: "Tekrar numarası rozeti için metin rengi",
        colorWhenDesc: "Geri sayım için metin rengi (örn. \"3 gün sonra\")",
        colorTextDesc:
          "Özel metin sütunları için metin rengi (bkz. Düzen -> Görünüm altındaki Satır sütunları)",
        backgroundLabel: "Arka planı göster",
        backgroundDesc: "Tekrar numarasının arkasında yuvarlatılmış bir arka plan göster",
        colorBadgeBackground: "Arka plan rengi",
        colorBadgeBackgroundDesc: "Tekrar numarasının arkasındaki arka plan rengi",
        colorPlaceholder: "örn. #ff5722 veya var(--my-red)",
        presetDefault: "Varsayılan",
        presetPrimary: "Birincil",
        presetAccent: "Vurgu",
        presetCustom: "Özel",
        presetRed: "Kırmızı",
        presetPink: "Pembe",
        presetPurple: "Mor",
        presetDeepPurple: "Koyu mor",
        presetIndigo: "Çivit mavisi",
        presetBlue: "Mavi",
        presetLightBlue: "Açık mavi",
        presetCyan: "Camgöbeği",
        presetTeal: "Deniz mavisi",
        presetGreen: "Yeşil",
        presetLightGreen: "Açık yeşil",
        presetLime: "Fıstık yeşili",
        presetYellow: "Sarı",
        presetAmber: "Kehribar",
        presetOrange: "Turuncu",
        presetDeepOrange: "Koyu turuncu",
        presetBrown: "Kahverengi",
        presetGrey: "Gri",
        presetBlueGrey: "Mavi-gri",
        fonts: "Yazı tipleri",
        fontCardTitle: "Kart başlığı",
        fontCardTitleDesc: "Kartın kendi başlığı için yazı tipi boyutu",
        fontTitleDesc: "Etkinlik adı için yazı tipi boyutu",
        fontSubtitleDesc: "Etkinlik türü için yazı tipi boyutu",
        fontBadgeDesc: "Tekrar numarası rozeti için yazı tipi boyutu",
        fontWhenDesc: "Geri sayım için yazı tipi boyutu (örn. \"3 gün sonra\")",
        fontTextDesc:
          "Özel metin sütunları için yazı tipi boyutu (bkz. Düzen -> Görünüm altındaki Satır sütunları)",
        fontPlaceholder: "örn. 1.2em veya 20px",
        fontBold: "Kalın",
        fontItalic: "İtalik",
        fontUppercase: "Büyük harf",
        fontUnderline: "Altı çizili",
        fontLetterSpacing: "Harf aralığı",
        fontLetterSpacingPlaceholder: "örn. 0.05em veya 1px",
        panelSettings: "Ayarlar",
        panelSettingsDesc: "Genel, etkinlikler ve dönem",
        panelLayout: "Düzen",
        panelLayoutDesc: "Görünüm, yazı tipleri, renkler, simgeler ve arka planlar",
        groupGeneral: "Genel",
        groupGeneralDesc: "",
        groupEvents: "Etkinlikler",
        groupEventsDesc: "",
        groupPeriod: "Dönem",
        groupPeriodDesc: "",
        groupDisplay: "Görünüm",
        groupDisplayDesc: "",
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

  // Implicit column layout for any dashboard saved before this feature
  // existed (config.columns unset) - matches the legacy fixed row template
  // in _row() exactly, and seeds the "Spalten" editor's list on first open.
  const DEFAULT_COLUMNS = [
    { id: "icon", type: "icon" },
    { id: "info", type: "info" },
    { id: "badge", type: "badge" },
    { id: "when", type: "when" },
  ];

  function defaultConfig(config) {
    config = config || {};
    return {
      title: "",
      show_title: true,
      count: 10,
      days_ahead: 0,
      days_past: 0,
      soon_days: 7,
      today_only: false,
      next_event_day_only: false,
      types: [],
      // Only meaningful for holiday-type events (see CATEGORY_ICONS in
      // const.py) - empty means "show every category", same semantics as
      // `types` above. Non-holiday events have no category and are never
      // filtered by this.
      categories: [],
      show_past: true,
      show_today: true,
      show_soon: true,
      highlight_past: true,
      highlight_today: true,
      highlight_soon: false,
      font_size_title: "",
      show_icon: true,
      show_name: true,
      show_subtitle: true,
      show_badge: true,
      show_when: true,
      show_vip_only: false,
      show_important_only: false,
      show_vip_badge: true,
      show_important_badge: true,
      vip_badge_icon: "mdi:star",
      important_badge_icon: "mdi:exclamation-thick",
      // Holidays only - appends the imported country (+ subdivision) to the
      // name/type text instead of the old hover-only tooltip.
      show_name_country: false,
      show_subtitle_country: false,
      // Deliberately not defaulted to an array - "unset" (every dashboard
      // saved before this feature existed) must stay distinguishable from
      // "explicitly configured" so _row() can pick the right render path.
      // See _buildDisplayBody's column-list editor for how this gets set.
      columns: undefined,
      // Squashes the gap between columns and centers the row, and neutralizes
      // the couple of hardcoded style differences between fields (the name's
      // semi-bold weight, the subtitle/countdown's dimmed opacity) that
      // otherwise still show even once every field is given matching
      // color/font-size - meant for building one continuous sentence out of
      // columns rather than a classic multi-field row.
      columns_compact: false,
      // HA's own action-config shape ({action: "more-info"/"navigate"/...}).
      // Defaulting tap to "more-info" preserves this card's original,
      // pre-configurable click behavior for every dashboard saved before
      // this feature existed; hold has never done anything, so it defaults
      // to "none".
      tap_action: { action: "more-info" },
      hold_action: { action: "none" },
      ...config,
      // Per icon-color-category (accent/today/soon) animation, keyed the
      // same way as colors.match_* so the same "which category is this
      // row's icon in" lookup (colorCategory in _row()) drives both.
      icon_animation: {
        accent: "none",
        today: "none",
        soon: "none",
        ...(config.icon_animation || {}),
      },
      colors: {
        today: "",
        soon: "",
        accent: "",
        card_title: "",
        title: "",
        subtitle: "",
        badge: "",
        when: "",
        text: "",
        match_accent: false,
        match_today: false,
        match_soon: false,
        badge_background: true,
        badge_background_color: "",
        highlight_past: "",
        highlight_today: "",
        highlight_soon: "",
        vip_badge: "",
        important_badge: "",
        ...(config.colors || {}),
      },
      font_sizes: {
        title: "",
        subtitle: "",
        badge: "",
        when: "",
        text: "",
        ...(config.font_sizes || {}),
      },
      font_style: {
        font_size_title: {
          bold: false,
          italic: false,
          uppercase: false,
          underline: false,
          letter_spacing: "",
          ...((config.font_style || {}).font_size_title || {}),
        },
        title: {
          bold: false,
          italic: false,
          uppercase: false,
          underline: false,
          letter_spacing: "",
          ...((config.font_style || {}).title || {}),
        },
        subtitle: {
          bold: false,
          italic: false,
          uppercase: false,
          underline: false,
          letter_spacing: "",
          ...((config.font_style || {}).subtitle || {}),
        },
        badge: {
          bold: false,
          italic: false,
          uppercase: false,
          underline: false,
          letter_spacing: "",
          ...((config.font_style || {}).badge || {}),
        },
        when: {
          bold: false,
          italic: false,
          uppercase: false,
          underline: false,
          letter_spacing: "",
          ...((config.font_style || {}).when || {}),
        },
        text: {
          bold: false,
          italic: false,
          uppercase: false,
          underline: false,
          letter_spacing: "",
          ...((config.font_style || {}).text || {}),
        },
      },
      background: {
        enabled: false,
        color: "",
        image: "",
        size: "cover",
        opacity: 100,
        ...(config.background || {}),
      },
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
        month: state.attributes.month,
        day: state.attributes.day,
        occurrence:
          state.attributes.occurrence_number == null ? null : state.attributes.occurrence_number,
        vip: state.attributes.vip === true,
        important: state.attributes.important === true,
        category: state.attributes.category,
        country: state.attributes.country,
        subdivision: state.attributes.subdivision,
      });
    }
    events.sort((a, b) => a.days - b.days || a.entityId.localeCompare(b.entityId));
    return events;
  }

  // Mirrors dates.py's occurrence_in_year: Feb 29 falls back to Feb 28 in
  // non-leap years, so a leap-day event still has a "last occurrence" every
  // year instead of only every four.
  function occurrenceDate(month, day, year) {
    const d = new Date(year, month - 1, day);
    if (d.getMonth() !== month - 1) return new Date(year, 1, 28);
    return d;
  }

  // Independent of the sensor's own "days until next occurrence" state
  // (which is never negative - it jumps forward the day after an event), so
  // that a "days in the past" window can be computed client-side from the
  // raw day/month attributes alone.
  function daysSincePrevOccurrence(month, day, now) {
    const today0 = new Date(now);
    today0.setHours(0, 0, 0, 0);
    const thisYear = occurrenceDate(month, day, today0.getFullYear());
    thisYear.setHours(0, 0, 0, 0);
    if (thisYear <= today0) {
      return Math.round((today0 - thisYear) / 86400000);
    }
    const prevYear = occurrenceDate(month, day, today0.getFullYear() - 1);
    prevYear.setHours(0, 0, 0, 0);
    return Math.round((today0 - prevYear) / 86400000);
  }

  // Plain {placeholder} substitution for "text" columns - no expressions or
  // conditionals, consistent with this card's no-build-step, no-cleverness
  // approach elsewhere. Missing keys render as empty string rather than
  // leaving the literal "{foo}" in the output.
  function renderTemplate(template, values) {
    return template.replace(/\{(\w+)\}/g, (_, key) => (values[key] ?? ""));
  }

  const CARD_STYLE = `
    ha-card { padding: 16px; position: relative; overflow: hidden; }
    /* Custom card background (color/image) lives on its own layer behind
       the content rather than on ha-card itself, so its opacity can be
       adjusted without fading the title/list text above it. */
    ha-card::before {
      content: "";
      position: absolute;
      inset: 0;
      background-color: var(--annuals-bg-color, transparent);
      background-image: var(--annuals-bg-image, none);
      background-size: var(--annuals-bg-size, cover);
      background-repeat: var(--annuals-bg-repeat, no-repeat);
      background-position: center;
      opacity: var(--annuals-bg-opacity, 1);
      z-index: 0;
      pointer-events: none;
    }
    .title {
      position: relative;
      z-index: 1;
      font-size: var(--annuals-title-size, 1.2em);
      font-weight: var(--annuals-title-weight, 500);
      font-style: var(--annuals-title-style, normal);
      text-transform: var(--annuals-title-transform, none);
      text-decoration: var(--annuals-title-decoration, none);
      letter-spacing: var(--annuals-title-spacing, normal);
      color: var(--annuals-card-title-color, inherit);
      margin-bottom: 12px;
    }
    .list {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 1em;
    }
    .row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 6px 12px 6px 4px;
      border-radius: 8px;
    }
    .row.has-action {
      cursor: pointer;
    }
    .row.has-action:hover {
      background: var(--secondary-background-color, rgba(0, 0, 0, 0.04));
    }
    .row.highlight-today {
      background: color-mix(
        in srgb,
        var(--annuals-highlight-today-color, var(--annuals-today-color, var(--error-color))) 18%,
        transparent
      );
    }
    .row.highlight-soon {
      background: color-mix(
        in srgb,
        var(--annuals-highlight-soon-color, var(--annuals-soon-color, var(--warning-color))) 18%,
        transparent
      );
    }
    .row.highlight-past {
      background: color-mix(
        in srgb,
        var(--annuals-highlight-past-color, var(--secondary-text-color, #888)) 15%,
        transparent
      );
    }
    .icon-wrap { position: relative; flex-shrink: 0; display: flex; }
    .icon { flex-shrink: 0; color: var(--annuals-accent-color, var(--primary-text-color)); }
    .icon.today { color: var(--annuals-today-color, var(--error-color)); }
    .icon.soon { color: var(--annuals-soon-color, var(--warning-color)); }
    /* Optional per-category (Default/Today/Soon) icon animation - see the
       Layout -> Icons editor tab. Applied directly on the icon element via
       an anim-* class computed from config.icon_animation in _row(), so
       these rules stay a flat list with no category-crossed combinations. */
    @keyframes annuals-icon-pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.2); }
    }
    @keyframes annuals-icon-bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-25%); }
    }
    @keyframes annuals-icon-shake {
      0%, 100% { transform: rotate(0deg); }
      25% { transform: rotate(-14deg); }
      75% { transform: rotate(14deg); }
    }
    @keyframes annuals-icon-spin {
      to { transform: rotate(360deg); }
    }
    @keyframes annuals-icon-flash {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.25; }
    }
    .icon.anim-pulse { animation: annuals-icon-pulse 1.4s ease-in-out infinite; }
    .icon.anim-bounce { animation: annuals-icon-bounce 1s ease-in-out infinite; }
    .icon.anim-shake { animation: annuals-icon-shake 0.6s ease-in-out infinite; }
    .icon.anim-spin { animation: annuals-icon-spin 2s linear infinite; }
    .icon.anim-flash { animation: annuals-icon-flash 1.2s ease-in-out infinite; }
    .vip-badge,
    .important-badge {
      position: absolute;
      top: -4px;
      --mdc-icon-size: 10px;
      width: 14px;
      height: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      color: #fff;
      box-shadow: 0 0 0 2px var(--ha-card-background, var(--card-background-color, #fff));
    }
    .vip-badge {
      right: -6px;
      background: var(--annuals-vip-badge-color, var(--error-color));
    }
    .important-badge {
      left: -6px;
      /* Same default as the "Upcoming soon" row highlight color, so an
         unconfigured Important badge and an unconfigured "soon" tint match
         out of the box. */
      background: var(--annuals-important-badge-color, var(--annuals-soon-color, var(--warning-color)));
    }
    /* "Match text" per icon category - when enabled in the editor, every
       text element in a matching row takes on that category's icon color,
       overriding the individually configured title/subtitle/badge/when
       colors for just that row. Higher specificity (.row.match-* .name vs
       plain .name) wins regardless of stylesheet order. */
    .row.match-accent-text .name,
    .row.match-accent-text .type,
    .row.match-accent-text .badge,
    .row.match-accent-text .when {
      color: var(--annuals-accent-color, var(--primary-text-color));
    }
    .row.match-today-text .name,
    .row.match-today-text .type,
    .row.match-today-text .badge,
    .row.match-today-text .when {
      color: var(--annuals-today-color, var(--error-color));
    }
    .row.match-soon-text .name,
    .row.match-soon-text .type,
    .row.match-soon-text .badge,
    .row.match-soon-text .when {
      color: var(--annuals-soon-color, var(--warning-color));
    }
    .info { flex: 1; min-width: 0; }
    .name {
      font-weight: var(--annuals-row-title-weight, 500);
      font-style: var(--annuals-row-title-style, normal);
      text-transform: var(--annuals-row-title-transform, none);
      text-decoration: var(--annuals-row-title-decoration, none);
      letter-spacing: var(--annuals-row-title-spacing, normal);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--annuals-title-color, inherit);
      font-size: var(--annuals-row-title-size, inherit);
    }
    .type {
      font-size: var(--annuals-row-subtitle-size, 0.85em);
      font-weight: var(--annuals-row-subtitle-weight, normal);
      font-style: var(--annuals-row-subtitle-style, normal);
      text-transform: var(--annuals-row-subtitle-transform, none);
      text-decoration: var(--annuals-row-subtitle-decoration, none);
      letter-spacing: var(--annuals-row-subtitle-spacing, normal);
      opacity: 0.6;
      color: var(--annuals-subtitle-color, inherit);
    }
    .badge-slot {
      flex-shrink: 0;
      width: 56px;
      display: flex;
      justify-content: flex-end;
    }
    .badge {
      display: inline-block;
      flex-shrink: 0;
      background: var(--annuals-badge-bg-color, rgba(128, 128, 128, 0.25));
      border-radius: 12px;
      padding: 2px 10px;
      font-size: var(--annuals-row-badge-size, 1.05em);
      font-weight: var(--annuals-row-badge-weight, normal);
      font-style: var(--annuals-row-badge-style, normal);
      text-transform: var(--annuals-row-badge-transform, none);
      text-decoration: var(--annuals-row-badge-decoration, none);
      letter-spacing: var(--annuals-row-badge-spacing, normal);
      color: var(--annuals-badge-color, inherit);
      white-space: nowrap;
    }
    .badge.no-background {
      background: none;
      padding: 2px 0;
    }
    .when {
      flex-shrink: 0;
      min-width: 80px;
      text-align: right;
      opacity: 0.8;
      white-space: nowrap;
      color: var(--annuals-when-color, inherit);
      font-size: var(--annuals-row-when-size, inherit);
      font-weight: var(--annuals-row-when-weight, normal);
      font-style: var(--annuals-row-when-style, normal);
      text-transform: var(--annuals-row-when-transform, none);
      text-decoration: var(--annuals-row-when-decoration, none);
      letter-spacing: var(--annuals-row-when-spacing, normal);
    }
    /* Free-form "text" column (see _buildColumnCell) - flexes to fill
       remaining row width like .info, but wraps instead of truncating since
       its content is a full templated sentence rather than a single-line
       name/type. Falls back to the same title color/size variables as
       .name, since it most often replaces that field. pre-wrap (not normal)
       so a leading/trailing space typed into the template - the only way to
       add spacing between columns in compact mode, where the row's own gap
       is zero - actually renders instead of being collapsed away as
       "whitespace at the edge of a box", which is what plain normal does to
       every column since each is its own separate box, not one shared run
       of inline text. */
    .text-col {
      flex: 1;
      min-width: 0;
      white-space: pre-wrap;
      color: var(--annuals-text-color, inherit);
      font-size: var(--annuals-row-text-size, inherit);
      font-weight: var(--annuals-row-text-weight, normal);
      font-style: var(--annuals-row-text-style, normal);
      text-transform: var(--annuals-row-text-transform, none);
      text-decoration: var(--annuals-row-text-decoration, none);
      letter-spacing: var(--annuals-row-text-spacing, normal);
    }
    /* "Compact" mode (columns_compact) - for building one continuous
       sentence out of columns instead of a classic multi-field row: removes
       every field's built-in width/growth/alignment so nothing but the
       columns' own content determines spacing, centers the whole row, and
       neutralizes the couple of hardcoded style differences (name's
       semi-bold weight, subtitle/countdown's dimmed opacity) that otherwise
       still show even once every column is given the same color/font-size.
       align-items switches from the normal row's vertical centering to
       baseline - centering mixed font sizes makes the smaller ones look
       like they're floating relative to the bigger ones (each box's middle
       lines up, not the text itself), whereas baseline is how differently
       sized words actually sit together in a real sentence. */
    .list.columns-compact .row { gap: 0; justify-content: center; align-items: baseline; flex-wrap: wrap; }
    /* The icon has no text of its own to align by, so flexbox falls back to
       treating its bottom margin edge as its "baseline" - for a box as tall
       as the icon, that lines its bottom up with roughly the middle of the
       surrounding text instead of its actual baseline, leaving it floating
       high above the row. flex-end (true bottom-of-line alignment) overshoots
       the other way though - the row's own cross-size is set by the tallest
       participant's full line box (including the space reserved below
       baseline for descenders, the tails on letters like g/y), so flush
       bottom alignment drops the icon below the actual text baseline into
       that reserved space, which the icon itself doesn't need. Measured
       empirically against both a 14px default row and a 28px bold name -
       the same 6px pull-up lands the icon within ~1px of the real baseline
       in both, so it's a genuine constant, not a per-font-size guess. */
    .list.columns-compact .icon-wrap { align-self: flex-end; margin-bottom: 6px; }
    .list.columns-compact .info,
    .list.columns-compact .text-col,
    .list.columns-compact .name,
    .list.columns-compact .type {
      flex: none;
      opacity: 1;
    }
    .list.columns-compact .name { font-weight: var(--annuals-row-title-weight, normal); }
    .list.columns-compact .type,
    .list.columns-compact .when {
      opacity: 1;
    }
    .list.columns-compact .badge-slot { width: auto; flex: none; justify-content: center; }
    .list.columns-compact .when { min-width: 0; text-align: center; flex: none; }
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
      return 1 + this._visibleEvents().length;
    }


    static getConfigElement() {
      return document.createElement("annuals-card-editor");
    }

    static getStubConfig() {
      return defaultConfig({});
    }

    // "hero" = today's events, plus (if days_past > 0) events whose
    // anniversary fell within that many days ago - shown highlighted instead
    // of always demoted straight into the regular upcoming list.
    _isRecent(e, now) {
      if (e.days === 0) return true;
      const pastWindow = this._config.days_past || 0;
      if (pastWindow <= 0) return false;
      const since = daysSincePrevOccurrence(e.month, e.day, now);
      return since > 0 && since <= pastWindow;
    }

    _filteredEvents() {
      const config = this._config;
      const now = new Date();
      const all = getEvents(this._hass);
      let filtered = all.filter((e) => {
        if (config.types && config.types.length && !config.types.includes(e.type)) return false;
        // Only holiday-type events carry a category at all (see getEvents) -
        // this never filters anything else out, same as `types` being
        // empty meaning "no restriction" above.
        if (
          e.type === "holiday" &&
          config.categories &&
          config.categories.length &&
          !config.categories.includes(e.category)
        )
          return false;
        if (config.days_ahead && config.days_ahead > 0 && e.days > config.days_ahead) return false;
        // e.days is always the sensor's "days until next occurrence" (never
        // negative - it jumps forward the day after an event), so this is
        // simply "only the events landing exactly today".
        if (config.today_only && e.days !== 0) return false;
        // When both filters are on, they combine as OR (VIP or Important),
        // not AND - otherwise enabling both would only show events that are
        // both at once, which reads as "either" to anyone flipping two
        // separate toggles.
        if (config.show_vip_only || config.show_important_only) {
          const isVip = config.show_vip_only && e.vip;
          const isImportant = config.show_important_only && e.important;
          if (!isVip && !isImportant) return false;
        }
        return true;
      });
      // "Only next event day" - once every other filter above has been
      // applied, keep only whichever events share the single soonest
      // `days` value (today if any event falls today, otherwise the
      // nearest upcoming day - possibly more than one event on that day).
      if (config.next_event_day_only && filtered.length) {
        const minDays = Math.min(...filtered.map((e) => e.days));
        filtered = filtered.filter((e) => e.days === minDays);
      }
      // defaultConfig() always fills this in - no "|| 7" fallback here, since
      // that would treat a deliberate 0 (soon-highlighting disabled) as
      // unset and silently re-enable a 7-day "soon" window.
      const soonDays = config.soon_days;
      const showPast = config.show_past !== false;
      const showToday = config.show_today !== false;
      const showSoon = config.show_soon !== false;
      const hero = filtered
        .filter((e) => this._isRecent(e, now))
        .map((e) => ({
          ...e,
          daysSince: e.days === 0 ? 0 : daysSincePrevOccurrence(e.month, e.day, now),
        }))
        .filter((e) => (e.daysSince === 0 ? showToday : showPast));
      const upcoming = filtered
        .filter((e) => e.days > 0 && !this._isRecent(e, now))
        .filter((e) => e.days > soonDays || showSoon);
      return { hero, upcoming };
    }

    // A single chronological timeline (past events oldest-first, then today,
    // then upcoming soonest-first), capped to config.count as a total across
    // the whole card - not just the "upcoming" portion, so a highlighted
    // today/recent-past event counts toward the same limit.
    _visibleEvents() {
      const { hero, upcoming } = this._filteredEvents();
      const sortKey = (e) => (e.daysSince !== undefined ? -e.daysSince : e.days);
      return [...hero, ...upcoming].sort((a, b) => sortKey(a) - sortKey(b)).slice(0, this._config.count || 10);
    }

    _row(e, strings) {
      const config = this._config;
      const div = document.createElement("div");
      // defaultConfig() always fills this in - no "|| 7" fallback here, since
      // that would treat a deliberate 0 (soon-highlighting disabled) as
      // unset and silently re-enable a 7-day "soon" window.
      const soonDays = config.soon_days;
      const iconClass = e.days === 0 ? "today" : e.days > 0 && e.days <= soonDays ? "soon" : "";
      // e.daysSince is only ever attached (in _filteredEvents) to today/
      // recent-past events - it drives "N days ago" phrasing and the
      // occurrence-badge adjustment regardless of whether that category is
      // highlighted.
      const isRecent = e.daysSince !== undefined;
      const isPast = isRecent && e.daysSince > 0;
      let highlightClass = "";
      if (isPast && config.highlight_past) highlightClass = "highlight-past";
      else if (iconClass === "today" && config.highlight_today) highlightClass = "highlight-today";
      else if (iconClass === "soon" && config.highlight_soon) highlightClass = "highlight-soon";
      // Which icon color category this row belongs to (past events fall
      // under "accent" unless they also happen to be today/soon) - used to
      // optionally match the row's text color to its icon color.
      const colorCategory = iconClass || "accent";
      const animName = (config.icon_animation || {})[colorCategory];
      const iconAnimClass = animName && animName !== "none" ? ` anim-${animName}` : "";
      const matchClass = config.colors[`match_${colorCategory}`] ? ` match-${colorCategory}-text` : "";
      div.className = "row" + (highlightClass ? ` ${highlightClass}` : "") + matchClass;
      let typeLabel = strings.types[e.type] || e.type;
      // Holidays share one generic "Holiday" subtitle otherwise, which
      // doesn't distinguish a public holiday from a school break - the
      // category (already driving the row's icon - see CATEGORY_ICONS in
      // const.py) is appended so it's visible as text too.
      if (e.type === "holiday" && e.category) {
        typeLabel = `${typeLabel} (${(strings.categories || {})[e.category] || e.category})`;
      }
      // Country (+ subdivision), useful once more than one country/region is
      // imported at once - opt-in per show_name_country/show_subtitle_country
      // (see the "Show country/subdivision" sub-options under Title/Subtitle
      // in the editor) rather than always-on, since most setups only ever
      // import a single country and don't need it repeated on every row.
      const countrySuffix =
        e.type === "holiday" && e.country
          ? e.subdivision
            ? `${e.country} (${e.subdivision})`
            : e.country
          : "";

      let when;
      if (isRecent && e.daysSince > 0) {
        when = e.daysSince === 1 ? strings.dayAgo : strings.daysAgo(e.daysSince);
      } else {
        when = e.days === 0 ? strings.today : e.days === 1 ? strings.inDay : strings.inDays(e.days);
      }
      // occurrence_number always describes the *next* occurrence - once an
      // event's date has passed (daysSince > 0), the sensor has already
      // advanced to next year's count, so the occurrence that just happened
      // is occurrence_number - 1.
      const showBadge = config.show_badge !== false && e.occurrence != null;
      const badgeValue = isRecent && e.daysSince > 0 ? e.occurrence - 1 : e.occurrence;
      const badgeClass = config.colors.badge_background === false ? "badge no-background" : "badge";

      const nameText = countrySuffix && config.show_name_country ? `${e.name} · ${countrySuffix}` : e.name;
      const typeText =
        countrySuffix && config.show_subtitle_country ? `${typeLabel} · ${countrySuffix}` : typeLabel;

      // Shared value set for "text" column templates ({name}/{type}/
      // {occurrence}/{when}/{country}) - reuses everything already computed
      // above instead of recomputing per column.
      const values = {
        name: e.name,
        type: typeLabel,
        occurrence: badgeValue != null ? String(badgeValue) : "",
        when,
        country: countrySuffix,
      };

      // config.columns is only ever set once a user has actually opened the
      // new "Spalten" editor and reordered/added/removed something (see
      // _buildDisplayBody) - every dashboard saved before this feature keeps
      // rendering through the untouched fixed-template path below, so there
      // is zero migration/regression risk for existing configs.
      if (Array.isArray(config.columns)) {
        const ctx = { iconClass, iconAnimClass, nameText, typeText, showBadge, badgeValue, badgeClass };
        // Countdown ("when") reads as the sentence's opening word ("In 2
        // days, Anna has her birthday") only until the event's identity has
        // actually been named - once a name/subtitle/info column has
        // appeared, any later countdown is a trailing remark instead
        // ("Anna's birthday is today") and gets lower-cased instead. Custom
        // text columns don't count either way - they're just connective
        // words, not the event's identity.
        let identityShown = false;
        for (const col of config.columns) {
          // Guards against a malformed/empty entry (e.g. a stray "-" left in
          // the raw YAML editor) crashing the whole card instead of just
          // skipping that one column.
          if (!col || typeof col !== "object") continue;
          div.appendChild(this._buildColumnCell(col, e, values, config, ctx, !identityShown));
          if (col.type === "name" || col.type === "subtitle" || col.type === "info") identityShown = true;
        }
      } else {
        div.innerHTML = `
          <div class="icon-wrap">
            <ha-icon icon="${e.icon}" class="icon ${iconClass}${iconAnimClass}"></ha-icon>
            ${e.vip && config.show_vip_badge !== false ? `<ha-icon class="vip-badge" icon="${config.vip_badge_icon || "mdi:star"}"></ha-icon>` : ""}
            ${e.important && config.show_important_badge !== false ? `<ha-icon class="important-badge" icon="${config.important_badge_icon || "mdi:exclamation-thick"}"></ha-icon>` : ""}
          </div>
          <div class="info">
            <div class="name"></div>
            <div class="type"></div>
          </div>
          <div class="badge-slot">${showBadge ? `<span class="${badgeClass}">${badgeValue}</span>` : ""}</div>
          <div class="when"></div>
        `;
        const iconWrapEl = div.querySelector(".icon-wrap");
        if (config.show_icon === false) iconWrapEl.style.display = "none";

        const nameEl = div.querySelector(".name");
        nameEl.textContent = nameText;
        if (config.show_name === false) nameEl.style.display = "none";

        const typeEl = div.querySelector(".type");
        typeEl.textContent = typeText;
        if (config.show_subtitle === false) typeEl.style.display = "none";

        const whenEl = div.querySelector(".when");
        whenEl.textContent = when;
        if (config.show_when === false) whenEl.style.display = "none";
      }

      this._wireRowActions(div, config, e.entityId);
      return div;
    }

    // Tap and (separately) press-and-hold on a row each run their own
    // configurable action (config.tap_action/hold_action - HA's own
    // {action: "more-info"/"navigate"/...} shape, edited via the native
    // ui_action selector in Settings -> General). Defaults preserve this
    // card's original, unconfigurable behavior: tap opens more-info, hold
    // does nothing.
    _wireRowActions(div, config, entityId) {
      const HOLD_MS = 500;
      const tapAction = config.tap_action || { action: "more-info" };
      const holdAction = config.hold_action || { action: "none" };
      const hasAction =
        (tapAction.action && tapAction.action !== "none") ||
        (holdAction.action && holdAction.action !== "none");
      if (hasAction) div.classList.add("has-action");

      let holdTimer = null;
      let holdFired = false;
      const clearHoldTimer = () => {
        if (holdTimer) {
          clearTimeout(holdTimer);
          holdTimer = null;
        }
      };
      div.addEventListener("pointerdown", (ev) => {
        if (ev.button !== 0) return;
        holdFired = false;
        holdTimer = setTimeout(() => {
          holdFired = true;
          this._handleRowAction(holdAction, entityId);
        }, HOLD_MS);
      });
      div.addEventListener("pointerup", clearHoldTimer);
      div.addEventListener("pointerleave", clearHoldTimer);
      div.addEventListener("pointercancel", clearHoldTimer);
      // A long-press on touch devices would otherwise also open the
      // browser's own text-selection/context menu.
      div.addEventListener("contextmenu", (ev) => {
        if (holdAction.action && holdAction.action !== "none") ev.preventDefault();
      });
      div.addEventListener("click", () => {
        if (holdFired) return;
        this._handleRowAction(tapAction, entityId);
      });
    }

    // Executes one HA action-config object against this row's entity -
    // covers every action the native ui_action selector offers, in the same
    // shape HA's own cards use (perform_action/service, navigation_path,
    // url_path, target, data/service_data).
    _handleRowAction(actionConfig, entityId) {
      const action = (actionConfig && actionConfig.action) || "none";
      switch (action) {
        case "none":
          return;
        case "more-info":
          this.dispatchEvent(
            new CustomEvent("hass-more-info", {
              detail: { entityId },
              bubbles: true,
              composed: true,
            })
          );
          return;
        case "toggle":
          if (this._hass) this._hass.callService("homeassistant", "toggle", { entity_id: entityId });
          return;
        case "navigate":
          if (actionConfig.navigation_path) {
            history.pushState(null, "", actionConfig.navigation_path);
            this.dispatchEvent(new CustomEvent("location-changed", { bubbles: true, composed: true }));
          }
          return;
        case "url":
          if (actionConfig.url_path) {
            window.open(actionConfig.url_path, actionConfig.new_tab === false ? "_self" : "_blank");
          }
          return;
        case "call-service":
        case "perform-action": {
          const serviceStr = actionConfig.perform_action || actionConfig.service;
          if (!serviceStr || !this._hass) return;
          const [domain, service] = serviceStr.split(".");
          this._hass.callService(
            domain,
            service,
            actionConfig.data || actionConfig.service_data || {},
            actionConfig.target || {}
          );
          return;
        }
        case "assist":
          this.dispatchEvent(
            new CustomEvent("show-dialog", {
              detail: {
                dialogTag: "ha-voice-command-dialog",
                dialogImport: () => {},
                dialogParams: {},
              },
              bubbles: true,
              composed: true,
            })
          );
          return;
        default:
          return;
      }
    }

    // Builds one column's DOM node for the generic column-based row layout
    // (used once config.columns is set). Mirrors the legacy fixed markup
    // exactly for icon/info/badge/when so existing CSS and color/font-size
    // theming keep applying unchanged; "name"/"subtitle" split the "info"
    // block apart for layouts that reorder them independently; "text" is
    // the new free-form template column.
    _buildColumnCell(col, e, values, config, ctx, whenLeading) {
      const { iconClass, iconAnimClass, nameText, typeText, showBadge, badgeValue, badgeClass } = ctx;
      switch (col.type) {
        case "icon": {
          const wrap = document.createElement("div");
          wrap.className = "icon-wrap";
          wrap.innerHTML = `
            <ha-icon icon="${e.icon}" class="icon ${iconClass}${iconAnimClass}"></ha-icon>
            ${e.vip && config.show_vip_badge !== false ? `<ha-icon class="vip-badge" icon="${config.vip_badge_icon || "mdi:star"}"></ha-icon>` : ""}
            ${e.important && config.show_important_badge !== false ? `<ha-icon class="important-badge" icon="${config.important_badge_icon || "mdi:exclamation-thick"}"></ha-icon>` : ""}
          `;
          return wrap;
        }
        case "info": {
          const info = document.createElement("div");
          info.className = "info";
          const name = document.createElement("div");
          name.className = "name";
          name.textContent = nameText;
          const type = document.createElement("div");
          type.className = "type";
          type.textContent = typeText;
          info.append(name, type);
          return info;
        }
        case "name": {
          const name = document.createElement("div");
          name.className = "name";
          name.textContent = nameText;
          return name;
        }
        case "subtitle": {
          const type = document.createElement("div");
          type.className = "type";
          type.textContent = typeText;
          return type;
        }
        case "badge": {
          const slot = document.createElement("div");
          slot.className = "badge-slot";
          if (showBadge) slot.innerHTML = `<span class="${badgeClass}">${badgeValue}</span>`;
          return slot;
        }
        case "when": {
          const whenEl = document.createElement("div");
          whenEl.className = "when";
          // Countdown reads as the sentence's opening word ("In 2 days...")
          // only until the event's name has actually appeared earlier in
          // the row - after that it's a trailing remark ("...is today")
          // instead, so its case is forced to match regardless of how the
          // underlying translation string itself happens to be cased.
          const text = values.when || "";
          whenEl.textContent = whenLeading
            ? text.charAt(0).toUpperCase() + text.slice(1)
            : text.charAt(0).toLowerCase() + text.slice(1);
          return whenEl;
        }
        case "text": {
          // Color/font-size/style are global (config.colors.text /
          // font_sizes.text / font_style.text, set in Colors/Fonts like
          // every other field) rather than per-column-instance, applied via
          // the --annuals-text-color/-row-text-* CSS variables .text-col
          // already reads - see _render().
          const textEl = document.createElement("div");
          textEl.className = "text-col";
          textEl.textContent = renderTemplate(col.template || "", values);
          return textEl;
        }
        default:
          // Unknown column type (e.g. a newer card version's config loaded
          // into an older one) - render nothing rather than throwing.
          return document.createElement("div");
      }
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
      if (config.colors.today) card.style.setProperty("--annuals-today-color", config.colors.today);
      if (config.colors.soon) card.style.setProperty("--annuals-soon-color", config.colors.soon);
      if (config.colors.accent) card.style.setProperty("--annuals-accent-color", config.colors.accent);
      if (config.colors.card_title)
        card.style.setProperty("--annuals-card-title-color", config.colors.card_title);
      if (config.colors.title) card.style.setProperty("--annuals-title-color", config.colors.title);
      if (config.colors.subtitle)
        card.style.setProperty("--annuals-subtitle-color", config.colors.subtitle);
      if (config.colors.badge) card.style.setProperty("--annuals-badge-color", config.colors.badge);
      if (config.colors.badge_background_color)
        card.style.setProperty("--annuals-badge-bg-color", config.colors.badge_background_color);
      if (config.colors.when) card.style.setProperty("--annuals-when-color", config.colors.when);
      if (config.colors.text) card.style.setProperty("--annuals-text-color", config.colors.text);
      if (config.colors.highlight_past)
        card.style.setProperty("--annuals-highlight-past-color", config.colors.highlight_past);
      if (config.colors.highlight_today)
        card.style.setProperty("--annuals-highlight-today-color", config.colors.highlight_today);
      if (config.colors.highlight_soon)
        card.style.setProperty("--annuals-highlight-soon-color", config.colors.highlight_soon);
      if (config.colors.vip_badge)
        card.style.setProperty("--annuals-vip-badge-color", config.colors.vip_badge);
      if (config.colors.important_badge)
        card.style.setProperty("--annuals-important-badge-color", config.colors.important_badge);
      if (config.font_sizes.title)
        card.style.setProperty("--annuals-row-title-size", config.font_sizes.title);
      if (config.font_sizes.subtitle)
        card.style.setProperty("--annuals-row-subtitle-size", config.font_sizes.subtitle);
      if (config.font_sizes.badge)
        card.style.setProperty("--annuals-row-badge-size", config.font_sizes.badge);
      if (config.font_sizes.when)
        card.style.setProperty("--annuals-row-when-size", config.font_sizes.when);
      if (config.font_sizes.text)
        card.style.setProperty("--annuals-row-text-size", config.font_sizes.text);

      const setFontStyle = (cssKey, style) => {
        card.style.removeProperty(`--annuals-${cssKey}-weight`);
        card.style.removeProperty(`--annuals-${cssKey}-style`);
        card.style.removeProperty(`--annuals-${cssKey}-transform`);
        card.style.removeProperty(`--annuals-${cssKey}-decoration`);
        card.style.removeProperty(`--annuals-${cssKey}-spacing`);
        if (!style) return;
        if (style.bold) card.style.setProperty(`--annuals-${cssKey}-weight`, "700");
        if (style.italic) card.style.setProperty(`--annuals-${cssKey}-style`, "italic");
        if (style.uppercase) card.style.setProperty(`--annuals-${cssKey}-transform`, "uppercase");
        if (style.underline) card.style.setProperty(`--annuals-${cssKey}-decoration`, "underline");
        if (style.letter_spacing) card.style.setProperty(`--annuals-${cssKey}-spacing`, style.letter_spacing);
      };
      setFontStyle("title", config.font_style.font_size_title);
      setFontStyle("row-title", config.font_style.title);
      setFontStyle("row-subtitle", config.font_style.subtitle);
      setFontStyle("row-badge", config.font_style.badge);
      setFontStyle("row-when", config.font_style.when);
      setFontStyle("row-text", config.font_style.text);

      const bg = config.background;
      card.style.removeProperty("--annuals-bg-color");
      card.style.removeProperty("--annuals-bg-image");
      card.style.removeProperty("--annuals-bg-size");
      card.style.removeProperty("--annuals-bg-repeat");
      card.style.removeProperty("--annuals-bg-opacity");
      if (bg.enabled) {
        if (bg.color) card.style.setProperty("--annuals-bg-color", bg.color);
        if (bg.image) card.style.setProperty("--annuals-bg-image", `url("${bg.image}")`);
        const sizeMap = {
          cover: ["cover", "no-repeat"],
          contain: ["contain", "no-repeat"],
          auto: ["auto", "no-repeat"],
          repeat: ["auto", "repeat"],
        };
        const [size, repeat] = sizeMap[bg.size] || sizeMap.cover;
        card.style.setProperty("--annuals-bg-size", size);
        card.style.setProperty("--annuals-bg-repeat", repeat);
        const opacity = Math.max(0, Math.min(100, bg.opacity ?? 100)) / 100;
        card.style.setProperty("--annuals-bg-opacity", String(opacity));
      }

      const titleEl = this.shadowRoot.querySelector(".title");
      titleEl.style.display = config.show_title === false ? "none" : "";
      titleEl.textContent = config.title || strings.defaultTitle;

      const listEl = this.shadowRoot.querySelector(".list");
      listEl.classList.toggle("columns-compact", config.columns_compact === true);
      listEl.innerHTML = "";

      // Which categories get a highlighted row background is controlled
      // independently per-row in _row() (highlight_past/today/soon).
      const combined = this._visibleEvents();
      if (!combined.length) {
        const empty = document.createElement("div");
        empty.className = "empty";
        empty.textContent = strings.noEvents;
        listEl.appendChild(empty);
      } else {
        combined.forEach((e) => listEl.appendChild(this._row(e, strings)));
      }
    }
  }

  // Mirrors cataseven's Statistics Graph Chart Card editor: two icon+border
  // expandable "super panels" (Settings, Layout), each containing its own
  // pill/chip tab bar with a single content pane below showing only the
  // active tab.
  const SUPER_GROUPS = [
    { key: "settings", icon: "mdi:tune", groups: ["general", "events", "period"] },
    {
      key: "layout",
      icon: "mdi:view-dashboard-outline",
      groups: ["display", "fonts", "colors", "icons", "background"],
    },
  ];

  const GROUPS = [
    { key: "general", icon: "mdi:cog" },
    { key: "events", icon: "mdi:calendar-star" },
    { key: "period", icon: "mdi:calendar-range" },
    { key: "display", icon: "mdi:eye-outline" },
    { key: "fonts", icon: "mdi:format-size" },
    { key: "colors", icon: "mdi:palette" },
    { key: "icons", icon: "mdi:shape-outline" },
    { key: "background", icon: "mdi:image" },
  ];

  const EDITOR_STYLE = `
    .super-panel {
      border: 2px solid rgba(128, 128, 128, 0.4);
      border-radius: 12px;
      margin-bottom: 16px;
      background-color: var(--card-background-color, #1c1c1c);
      overflow: hidden;
    }
    .super-header {
      display: grid;
      grid-template-columns: 36px 1fr 16px;
      align-items: center;
      gap: 0 10px;
      padding: 14px 16px;
      background-color: rgba(255, 255, 255, 0.05);
      cursor: pointer;
    }
    .super-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background-color: rgba(74, 144, 217, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--primary-color);
      flex-shrink: 0;
    }
    .super-icon ha-icon { --mdc-icon-size: 18px; }
    .super-text { display: flex; flex-direction: column; min-width: 0; }
    .super-title {
      font-size: 15px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: var(--primary-text-color, #e1e1e1);
    }
    .super-subtitle {
      font-size: 11px;
      color: var(--secondary-text-color, #9b9b9b);
    }
    .super-chevron {
      --mdc-icon-size: 16px;
      color: var(--secondary-text-color);
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      justify-self: end;
    }
    .super-panel.open .super-chevron { transform: rotate(180deg); }
    .super-body { display: none; padding: 0 16px 16px; }
    .super-panel.open .super-body { display: block; }
    .tabs {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 2px;
      padding: 4px;
      margin: 6px 0 16px;
      background: rgba(127, 127, 127, 0.1);
      border-radius: 10px;
    }
    .tab {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      padding: 8px 10px;
      border: none;
      border-radius: 8px;
      background: transparent;
      color: var(--secondary-text-color);
      font: inherit;
      font-weight: 400;
      font-size: 11.5px;
      letter-spacing: 0.46px;
      text-transform: uppercase;
      cursor: pointer;
      transition: 0.2s;
    }
    .tab ha-icon { --mdc-icon-size: 13px; flex-shrink: 0; }
    .tab.active {
      background: var(--card-background-color, #1c1c1c);
      color: var(--primary-color);
      font-weight: 600;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
    }
    .panel-description {
      font-size: 0.9em;
      opacity: 0.6;
      margin: -8px 0 16px;
    }
    .section-heading {
      font-size: 1em;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      opacity: 0.85;
      margin: 32px 0 10px;
      padding-bottom: 6px;
      border-bottom: 1px solid var(--divider-color, #e0e0e0);
    }
    .section-heading:first-child { margin-top: 0; }
    /* The "Row columns" heading is the first child of its own wrapper div,
       so the generic :first-child reset above would zero its top margin -
       but it isn't the first thing in the panel (Show/Hide precedes it), so
       it still needs the normal section gap above it. */
    .columns-section .section-heading:first-child { margin-top: 32px; }
    .columns-desc {
      font-size: 0.85em;
      opacity: 0.7;
      margin: -4px 0 12px;
    }
    .columns-list { margin-bottom: 10px; }
    .column-row {
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 8px;
      padding: 8px 10px;
      margin-bottom: 8px;
    }
    .column-row-main {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }
    .column-type-label {
      font-weight: 500;
      font-size: 0.9em;
      min-width: 80px;
    }
    .icon-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      flex-shrink: 0;
      border-radius: 6px;
      border: 1px solid var(--divider-color, #e0e0e0);
      background: var(--card-background-color, transparent);
      color: inherit;
      cursor: pointer;
      padding: 0;
    }
    .icon-btn:hover { background: var(--secondary-background-color, rgba(0, 0, 0, 0.05)); }
    .icon-btn:disabled { opacity: 0.35; cursor: default; }
    .icon-btn ha-icon { --mdc-icon-size: 16px; }
    .column-template-input {
      flex: 1;
      min-width: 140px;
      padding: 6px 8px;
      border-radius: 4px;
      border: 1px solid var(--divider-color, #e0e0e0);
      background: var(--card-background-color, transparent);
      color: inherit;
      font: inherit;
    }
    .column-suffix-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin: 4px 0 0 68px;
    }
    .column-suffix-toggle {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.8em;
      white-space: nowrap;
      opacity: 0.85;
    }
    .column-add-row {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .columns-compact-row { margin-top: 12px; }
    .column-add-row select {
      flex: 1;
      padding: 8px;
      border-radius: 4px;
      border: 1px solid var(--divider-color, #e0e0e0);
      background: var(--card-background-color, transparent);
      color: inherit;
      font: inherit;
      cursor: pointer;
    }
    .field-row { margin-bottom: 16px; }
    .field-row-split {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
    }
    .field-row-split .field-col { flex: 1; min-width: 0; }
    /* The right-hand column sits close to the dialog's right edge, so a
       tooltip opening the usual way (left-aligned, expanding rightward)
       overflows past it and gets clipped - open it right-aligned instead,
       expanding leftward, same fix as .toggle-group below. Applies to any
       current or future field in this column, not just today's fields. */
    .field-row-split .field-col:last-child .tooltip-anchor::after { left: auto; right: 0; }
    /* A flex item's children never collapse their margins with anything
       outside it (flex establishes a new block-formatting context), so the
       last row's own margin-bottom would sit *in addition to*
       .field-row-split's margin-bottom below - stacking to 32px instead of
       collapsing down to 16px the way two plain block siblings would.
       Zeroing it here leaves only the container's own margin, matching the
       single-row .toggle-row case exactly. */
    .field-row-split .toggle-row:last-child { margin-bottom: 0; }
    /* Marks a row as a dependent sub-option of the one above it (e.g. the
       background color for a "show background" toggle) - indented, smaller,
       with a left border so it visually reads as nested rather than a peer
       field. */
    .sub-field-row {
      margin: -8px 0 16px 20px;
      padding-left: 12px;
      border-left: 2px solid var(--divider-color, #e0e0e0);
    }
    .sub-field-row .field-label { font-size: 0.8em; }
    .sub-field-row .field-label ha-icon,
    .sub-field-row .tooltip-anchor ha-icon { --mdc-icon-size: 14px; }
    .sub-field-row .field-input-row input[type="text"] {
      padding: 6px 8px;
      font-size: 0.85em;
    }
    .sub-field-row .field-input-row input[type="color"] { width: 28px; height: 28px; }
    .sub-field-row .preset-btn { padding: 4px 6px; font-size: 0.8em; max-width: 110px; }
    .sub-field-row .preset-btn .preset-swatch { width: 14px; height: 14px; }
    /* Narrow enough that the "also color the text" toggle still fits next
       to it on the same line, instead of stretching the full row width like
       a regular field-input-row select. */
    .anim-select { flex: none; width: auto; min-width: 110px; }
    /* Toggle-groups normally always wrap to their own full-width line (see
       .field-input-row > .toggle-group below) - the animation row is the one
       place a toggle-group is meant to sit right on the same line as the
       control before it, pushed to the row's end via the auto margin. */
    .anim-row .field-input-row > .toggle-group {
      flex-basis: auto;
      justify-content: flex-start;
      margin-top: 0;
      margin-left: auto;
    }
    .field-label {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-bottom: 6px;
      font-size: 0.9em;
      font-weight: 500;
    }
    /* The tooltip is anchored on a plain <span> wrapper, not the ha-icon
       itself - ha-icon has its own shadow root, and Chromium paints
       ::after content generated on shadow-hosting elements in a way that
       doesn't reliably stack above sibling rows' form controls (it looked
       translucent/see-through in testing despite an opaque background). */
    .tooltip-anchor { position: relative; display: flex; cursor: help; }
    /* Sizing/opacity live on this single selector (not scoped to
       .field-label) so every "i" icon in the editor - field labels, toggle
       rows, wherever - looks identical rather than drifting per context. */
    .tooltip-anchor ha-icon {
      --mdc-icon-size: 16px;
      opacity: 0.6;
    }
    .tooltip-anchor::after {
      content: attr(data-tooltip);
      position: absolute;
      bottom: calc(100% + 6px);
      left: 0;
      z-index: 20;
      width: max-content;
      max-width: 220px;
      padding: 6px 10px;
      border-radius: 6px;
      background-color: #383838;
      opacity: 1;
      color: #fff;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      font-size: 12px;
      font-weight: 400;
      text-transform: none;
      letter-spacing: normal;
      white-space: normal;
      visibility: hidden;
      pointer-events: none;
    }
    .tooltip-anchor:hover::after { visibility: visible; }
    /* The toggle-group's info icon sits at the row's far right edge, so its
       tooltip must open to the left (right-aligned to the icon) instead of
       the usual left-aligned opening - otherwise it overflows past the
       dialog's edge and gets clipped/hidden. */
    .toggle-group .tooltip-anchor::after { left: auto; right: 0; }
    .field-input-row {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      row-gap: 8px;
      gap: 8px;
    }
    .field-input-row > .toggle-group { flex-basis: 100%; justify-content: flex-end; margin-top: 4px; }
    .field-input-row > .field-toggles {
      flex-basis: 100%;
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      row-gap: 8px;
      gap: 16px;
      margin-top: 4px;
    }
    .field-input-row input[type="text"],
    .field-input-row input[type="number"],
    .field-input-row select {
      flex: 1;
      min-width: 0;
      padding: 8px;
      border-radius: 4px;
      border: 1px solid var(--divider-color, #e0e0e0);
      background: var(--card-background-color, transparent);
      color: inherit;
      font: inherit;
    }
    .field-input-row select { cursor: pointer; }
    .upload-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      flex-shrink: 0;
      border-radius: 6px;
      border: 1px solid var(--divider-color, #e0e0e0);
      background: var(--card-background-color, transparent);
      color: inherit;
      cursor: pointer;
    }
    .upload-btn:hover { background: var(--secondary-background-color, rgba(0, 0, 0, 0.05)); }
    .unit-input-wrap {
      position: relative;
      flex: 1;
      min-width: 0;
      display: flex;
    }
    .unit-input-wrap input[type="number"] {
      width: 100%;
      padding-right: 32px;
    }
    .unit-suffix {
      position: absolute;
      top: 50%;
      right: 10px;
      transform: translateY(-50%);
      color: var(--secondary-text-color);
      font-size: 0.9em;
      pointer-events: none;
    }
    .upload-btn ha-icon { --mdc-icon-size: 18px; }
    .bg-image-preview {
      position: relative;
      display: inline-block;
      margin-top: 8px;
      width: fit-content;
    }
    .bg-image-preview[hidden] { display: none; }
    .bg-image-preview img {
      display: block;
      max-width: 100%;
      max-height: 120px;
      border-radius: 6px;
      border: 1px solid var(--divider-color, #e0e0e0);
    }
    .bg-image-clear {
      position: absolute;
      top: 4px;
      right: 4px;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      border: none;
      background: rgba(0, 0, 0, 0.6);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
    .bg-image-clear ha-icon { --mdc-icon-size: 14px; }
    .type-toggle-actions {
      display: flex;
      justify-content: flex-end;
      gap: 16px;
      margin-bottom: 10px;
    }
    .link-btn {
      background: none;
      border: none;
      padding: 0;
      color: var(--primary-color);
      font: inherit;
      font-size: 0.85em;
      cursor: pointer;
    }
    .link-btn:hover { text-decoration: underline; }
    .type-toggle-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px 24px;
    }
    .type-toggle-row {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }
    .type-toggle-row .type-toggle-label {
      font-size: 0.9em;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .field-input-row input[type="color"] {
      width: 36px;
      height: 36px;
      padding: 0;
      border: none;
      border-radius: 6px;
      background: none;
      cursor: pointer;
      flex-shrink: 0;
    }
    .toggle-group {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }
    .toggle-row {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 12px;
      margin-bottom: 16px;
    }
    .toggle-row .field-label { margin-bottom: 0; }
    /* Margin matches the 16px bottom-margin every row/column-group around it
       already uses, and every row's own top margin is 0 (only bottom is
       ever set) - so on both sides, margin-collapsing resolves to the same
       16px (max(16,16) above, max(16,0) below), landing the line exactly
       centered in the gap instead of drifting toward whichever neighbor has
       the bigger margin. */
    .toggle-divider {
      border: none;
      border-top: 1px dashed var(--divider-color, #444);
      margin: 16px 0;
    }
    .toggle-label {
      font-size: 0.85em;
      color: var(--secondary-text-color);
      white-space: nowrap;
    }
    .toggle {
      position: relative;
      display: inline-block;
      width: 30px;
      height: 16px;
      flex-shrink: 0;
      cursor: pointer;
    }
    .toggle input { position: absolute; opacity: 0; width: 0; height: 0; }
    .toggle .track {
      position: absolute;
      inset: 0;
      background: var(--disabled-text-color, #ccc);
      border-radius: 20px;
      transition: 0.2s;
    }
    .toggle .track::before {
      content: "";
      position: absolute;
      width: 12px;
      height: 12px;
      left: 2px;
      top: 2px;
      background: #fff;
      border-radius: 50%;
      transition: 0.2s;
    }
    .toggle input:checked + .track { background: var(--primary-color); }
    .toggle input:checked + .track::before { transform: translateX(14px); }
    .preset-select { position: relative; flex-shrink: 0; }
    .preset-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 8px;
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 4px;
      background: var(--card-background-color, transparent);
      color: inherit;
      font: inherit;
      font-size: 0.85em;
      cursor: pointer;
      max-width: 130px;
    }
    .preset-btn .preset-name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex: 1;
      text-align: left;
    }
    .preset-btn ha-icon { --mdc-icon-size: 16px; opacity: 0.6; flex-shrink: 0; }
    .preset-swatch {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      flex-shrink: 0;
      box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.15);
    }
    .preset-menu {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      z-index: 10;
      max-height: 260px;
      overflow-y: auto;
      background: var(--card-background-color, #1c1c1c);
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      min-width: 170px;
      padding: 4px;
    }
    /* Applied when there isn't enough room below the button (rows near the
       bottom of the scrollable dialog) - opens upward instead of getting
       clipped by the dialog's own edge. */
    .preset-menu.menu-up {
      top: auto;
      bottom: calc(100% + 4px);
    }
    .preset-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 8px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.85em;
    }
    .preset-item:hover { background: var(--secondary-background-color, rgba(0, 0, 0, 0.06)); }
  `;

  // Mirrors the Material-ish preset palette shown in the Statistics Graph
  // Chart Card's color picker. "default" (empty value, falls through to the
  // card's own CSS-variable fallback) and "custom" (shown whenever the
  // current value doesn't match any preset below) are handled specially.
  const PRESET_COLORS = [
    { key: "default", labelKey: "presetDefault", value: "" },
    { key: "primary", labelKey: "presetPrimary", value: "var(--primary-color)" },
    { key: "accent", labelKey: "presetAccent", value: "var(--accent-color)" },
    { key: "red", labelKey: "presetRed", value: "#f44336" },
    { key: "pink", labelKey: "presetPink", value: "#e91e63" },
    { key: "purple", labelKey: "presetPurple", value: "#9c27b0" },
    { key: "deep_purple", labelKey: "presetDeepPurple", value: "#673ab7" },
    { key: "indigo", labelKey: "presetIndigo", value: "#3f51b5" },
    { key: "blue", labelKey: "presetBlue", value: "#2196f3" },
    { key: "light_blue", labelKey: "presetLightBlue", value: "#03a9f4" },
    { key: "cyan", labelKey: "presetCyan", value: "#00bcd4" },
    { key: "teal", labelKey: "presetTeal", value: "#009688" },
    { key: "green", labelKey: "presetGreen", value: "#4caf50" },
    { key: "light_green", labelKey: "presetLightGreen", value: "#8bc34a" },
    { key: "lime", labelKey: "presetLime", value: "#cddc39" },
    { key: "yellow", labelKey: "presetYellow", value: "#ffeb3b" },
    { key: "amber", labelKey: "presetAmber", value: "#ffc107" },
    { key: "orange", labelKey: "presetOrange", value: "#ff9800" },
    { key: "deep_orange", labelKey: "presetDeepOrange", value: "#ff5722" },
    { key: "brown", labelKey: "presetBrown", value: "#795548" },
    { key: "grey", labelKey: "presetGrey", value: "#9e9e9e" },
    { key: "blue_grey", labelKey: "presetBlueGrey", value: "#607d8b" },
  ];

  class AnnualsCardEditor extends HTMLElement {
    setConfig(config) {
      this._config = defaultConfig(config);
      this._render();
    }

    set hass(hass) {
      this._hass = hass;
      this._render();
    }

    _emit() {
      this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config } }));
    }

    // Plain scalar text/number fields (title, count, days_ahead, ...) - same
    // field-row visual language as the colors/fonts tabs (label + "i"
    // tooltip on the left, a single input on the right), just without the
    // color-picker/preset extras those need.
    _fieldRowHtml(key, inputType, placeholder, attrs, sub) {
      return `
        <div class="field-row${sub ? " sub-field-row" : ""}">
          <div class="field-label">
            <span class="label-text"></span>
            <span class="tooltip-anchor" data-tooltip="">
              <ha-icon icon="mdi:information-outline"></ha-icon>
            </span>
          </div>
          <div class="field-input-row">
            <input type="${inputType}" data-field="${key}" placeholder="${placeholder || ""}" ${attrs || ""}>
          </div>
        </div>
      `;
    }

    _wireFieldRow(body, key, label, desc, parse) {
      const row = body.querySelector(`input[data-field="${key}"]`).closest(".field-row");
      row.querySelector(".label-text").textContent = label;
      row.querySelector(".tooltip-anchor").dataset.tooltip = desc;
      const input = row.querySelector(`input[data-field="${key}"]`);
      input.addEventListener("input", () => {
        this._config = defaultConfig({ ...this._config, [key]: parse(input.value) });
        this._emit();
      });
      return input;
    }

    _syncFieldRow(key, value) {
      const input = this.shadowRoot.querySelector(`input[data-field="${key}"]`);
      if (!input || document.activeElement === input) return;
      input.value = value;
    }

    // Upgrades a plain text field (built via _fieldRowHtml/_wireFieldRow) to
    // HA's own visual MDI icon picker - the same searchable grid used for
    // an entity's icon override - when that component happens to be loaded
    // in the page already. It's a core, widely-used HA component (unlike
    // the per-selector-type lazy chunks that failed for the background
    // image field), so it's reliably available in practice, but this still
    // falls back to the plain text input rather than assuming so.
    _upgradeIconField(body, key) {
      if (!customElements.get("ha-icon-picker")) return;
      const input = body.querySelector(`input[data-field="${key}"]`);
      if (!input) return;
      const picker = document.createElement("ha-icon-picker");
      picker.hass = this._hass;
      picker.value = input.value;
      picker.style.flex = "1";
      picker.style.minWidth = "0";
      picker.style.width = "100%";
      picker.addEventListener("value-changed", (ev) => {
        ev.stopPropagation();
        this._config = defaultConfig({ ...this._config, [key]: ev.detail.value || "" });
        this._emit();
      });
      input.replaceWith(picker);
      this._iconPickers = this._iconPickers || {};
      this._iconPickers[key] = picker;
    }

    _syncIconField(key, value) {
      const picker = this._iconPickers && this._iconPickers[key];
      if (picker) {
        picker.hass = this._hass;
        if (picker.value !== value) picker.value = value;
        return;
      }
      this._syncFieldRow(key, value);
    }

    // Tap and hold sit side by side (same .field-row-split/.field-col
    // pattern as the background size/opacity and visibility columns
    // elsewhere in this editor) so their two dropdowns land at equal width
    // instead of each spanning the full row. Each column's input slot is
    // filled in by _upgradeActionSelector below, once ha-selector is
    // confirmed available - there's no plain text-input fallback for an
    // action config, unlike _fieldRowHtml.
    _actionSelectorSplitHtml(keys) {
      return `
        <div class="field-row-split">
          ${keys
            .map(
              (key) => `
            <div class="field-col">
              <div class="field-label">
                <span class="label-text"></span>
                <span class="tooltip-anchor" data-tooltip="">
                  <ha-icon icon="mdi:information-outline"></ha-icon>
                </span>
              </div>
              <div class="field-input-row">
                <div class="action-selector-slot" data-action-slot="${key}"></div>
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      `;
    }

    // Renders HA's own native "what should this do" action-config selector
    // (More info / Navigate / URL / Perform action / Toggle / Assist /
    // Nothing) via the same already-loaded-by-the-frontend ha-selector
    // component _upgradeIconField above relies on for ha-icon-picker - no
    // bundling of HA's own action-config UI needed.
    _upgradeActionSelector(body, key, label, desc, defaultAction) {
      const col = body.querySelector(`[data-action-slot="${key}"]`).closest(".field-col");
      col.querySelector(".label-text").textContent = label;
      col.querySelector(".tooltip-anchor").dataset.tooltip = desc;
      const slot = col.querySelector(`[data-action-slot="${key}"]`);
      if (!customElements.get("ha-selector")) return;
      const selector = document.createElement("ha-selector");
      selector.hass = this._hass;
      selector.selector = { ui_action: {} };
      selector.value = this._config[key] || defaultAction;
      selector.style.display = "block";
      selector.style.width = "100%";
      selector.addEventListener("value-changed", (ev) => {
        ev.stopPropagation();
        this._config = defaultConfig({ ...this._config, [key]: ev.detail.value });
        this._emit();
      });
      slot.appendChild(selector);
      this._actionSelectors = this._actionSelectors || {};
      this._actionSelectors[key] = selector;
    }

    _syncActionSelector(key, value) {
      const selector = this._actionSelectors && this._actionSelectors[key];
      if (!selector) return;
      selector.hass = this._hass;
      if (JSON.stringify(selector.value) !== JSON.stringify(value)) selector.value = value;
    }

    _buildGeneralBody(strings) {
      const body = document.createElement("div");
      body.className = "general-body";
      body.innerHTML =
        this._fieldRowHtml("title", "text", strings.editor.titlePlaceholder) +
        this._visibilityRowHtml("hide_title") +
        this._actionSelectorSplitHtml(["tap_action", "hold_action"]);
      this._wireFieldRow(body, "title", strings.editor.title, strings.editor.titleDesc, (v) => v);

      // Inverted on purpose - this toggle lives right under the title field
      // now (moved from Layout -> Display -> Show/Hide) and reads as "Hide"
      // rather than "Show", but still drives the same show_title config key
      // as before (checked means show_title === false) so no config
      // migration is needed.
      const hideRow = body.querySelector('input[data-visibility="hide_title"]').closest(".toggle-row");
      hideRow.querySelector(".label-text").textContent = strings.editor.hideCardTitle;
      const hideTooltip = hideRow.querySelector(".tooltip-anchor");
      if (hideTooltip) hideTooltip.dataset.tooltip = strings.editor.hideCardTitleDesc;
      const hideToggle = hideRow.querySelector('input[data-visibility="hide_title"]');
      hideToggle.addEventListener("change", () => {
        this._config = defaultConfig({ ...this._config, show_title: !hideToggle.checked });
        this._emit();
      });

      this._upgradeActionSelector(
        body,
        "tap_action",
        strings.editor.tapAction,
        strings.editor.tapActionDesc,
        { action: "more-info" }
      );
      this._upgradeActionSelector(
        body,
        "hold_action",
        strings.editor.holdAction,
        strings.editor.holdActionDesc,
        { action: "none" }
      );

      return body;
    }

    _syncGeneralInputs() {
      this._syncFieldRow("title", this._config.title || "");
      const hideToggle = this.shadowRoot.querySelector('input[data-visibility="hide_title"]');
      if (hideToggle) hideToggle.checked = this._config.show_title === false;
      this._syncActionSelector("tap_action", this._config.tap_action || { action: "more-info" });
      this._syncActionSelector("hold_action", this._config.hold_action || { action: "none" });
    }

    _buildEventsBody(strings) {
      const body = document.createElement("div");
      body.className = "events-body";
      body.innerHTML = this._fieldRowHtml("count", "number", "", 'min="1" max="50"');
      this._wireFieldRow(body, "count", strings.editor.count, strings.editor.countDesc, (v) =>
        Math.max(1, Number(v) || 1)
      );

      body.appendChild(
        this._buildToggleGridRow({
          labelText: strings.editor.types,
          tooltipText: strings.editor.typesDesc,
          values: EVENT_TYPES,
          dataAttr: "type",
          valueLabel: (value) => (strings.typesPlural || {})[value] || strings.types[value] || value,
          showAllText: strings.editor.showAll || "Show All",
          hideAllText: strings.editor.hideAll || "Hide All",
          onChange: (checked) => {
            const wasHolidayOn = this._holidayTypeEnabled();
            this._config = defaultConfig({ ...this._config, types: checked });
            const isHolidayOn = this._holidayTypeEnabled();
            // The holiday categories row only makes sense while "Holiday" is
            // itself among the shown types - toggling it off (individually
            // or via "Hide All") clears every category too, rather than
            // leaving a stale selection that silently does nothing while the
            // row is hidden; toggling it back on resets to "show every
            // category" since the previous subset was already discarded.
            if (wasHolidayOn && !isHolidayOn) {
              this._config = defaultConfig({ ...this._config, categories: [NONE_SELECTED] });
            } else if (!wasHolidayOn && isHolidayOn) {
              this._config = defaultConfig({ ...this._config, categories: [] });
            }
            this._emit();
            this._syncEventsInputs();
          },
        })
      );

      // Only shown once at least one holiday event is actually present -
      // which categories exist depends entirely on what's been imported
      // (see config_flow.py's "Import public holidays" step), so there's no
      // fixed list to always offer the way there is for `types` above.
      const categories = this._availableCategories();
      if (categories.length) {
        this._categoriesRowEl = this._buildToggleGridRow({
          labelText: strings.editor.categories,
          tooltipText: strings.editor.categoriesDesc,
          values: categories,
          dataAttr: "category",
          valueLabel: (value) =>
            (strings.categoriesPlural || {})[value] || (strings.categories || {})[value] || value,
          showAllText: strings.editor.showAll || "Show All",
          hideAllText: strings.editor.hideAll || "Hide All",
          onChange: (checked) => {
            this._config = defaultConfig({ ...this._config, categories: checked });
            this._emit();
            // Unchecking every category (individually or via "Hide All")
            // means "no holidays" just as much as unchecking "Holiday"
            // itself does - fold it back into the same type, which also
            // hides this row again via _syncEventsInputs below.
            if (checked.length === 1 && checked[0] === NONE_SELECTED) {
              this._disableHolidayType();
            }
          },
        });
        body.appendChild(this._categoriesRowEl);
        this._updateCategoriesRowVisibility();
      } else {
        this._categoriesRowEl = null;
      }

      return body;
    }

    // "Holiday" counts as shown whenever `types` doesn't explicitly exclude
    // it - either the empty-array "all types" default, or an explicit list
    // that includes "holiday" (see the "empty means all" convention noted
    // throughout this file).
    _holidayTypeEnabled() {
      const types = this._config.types || [];
      if (types.length === 1 && types[0] === NONE_SELECTED) return false;
      return types.length === 0 || types.includes("holiday");
    }

    // Mirror image of the types-onChange cascade above (types -> categories)
    // - unchecking every category folds back into unchecking "Holiday"
    // itself, since "no categories shown" and "no holidays shown" mean the
    // same thing from the user's point of view.
    _disableHolidayType() {
      if (!this._holidayTypeEnabled()) return;
      const types = this._config.types || [];
      const withoutHoliday =
        types.length === 0 ? EVENT_TYPES.filter((t) => t !== "holiday") : types.filter((t) => t !== "holiday");
      this._config = defaultConfig({
        ...this._config,
        types: withoutHoliday.length ? withoutHoliday : [NONE_SELECTED],
      });
      this._emit();
      this._syncEventsInputs();
    }

    _updateCategoriesRowVisibility() {
      if (this._categoriesRowEl) {
        this._categoriesRowEl.hidden = !this._holidayTypeEnabled();
      }
    }

    // Shared builder for the "Event types" / "Holiday categories" rows: a
    // two-column grid of toggle switches with "Show All" / "Hide All"
    // shortcuts above it, instead of one-checkbox-per-line - used by both
    // since they only differ in which values/labels/config-key they drive.
    _buildToggleGridRow({ labelText, tooltipText, values, dataAttr, valueLabel, showAllText, hideAllText, onChange }) {
      const row = document.createElement("div");
      row.className = "field-row";
      row.innerHTML = `
        <div class="field-label">
          <span class="label-text"></span>
          <span class="tooltip-anchor" data-tooltip="">
            <ha-icon icon="mdi:information-outline"></ha-icon>
          </span>
        </div>
        <div class="type-toggle-actions">
          <button type="button" class="link-btn" data-action="show-all"></button>
          <button type="button" class="link-btn" data-action="hide-all"></button>
        </div>
        <div class="type-toggle-grid">
          ${values
            .map(
              (value) => `
                <div class="type-toggle-row">
                  <label class="toggle">
                    <input type="checkbox" data-${dataAttr}="${value}">
                    <span class="track"></span>
                  </label>
                  <span class="type-toggle-label"></span>
                </div>
              `
            )
            .join("")}
        </div>
      `;
      row.querySelector(".label-text").textContent = labelText;
      row.querySelector(".tooltip-anchor").dataset.tooltip = tooltipText;
      row.querySelector('[data-action="show-all"]').textContent = showAllText;
      row.querySelector('[data-action="hide-all"]').textContent = hideAllText;

      const inputs = Array.from(row.querySelectorAll(`input[data-${dataAttr}]`));
      const emitChange = () => {
        const checked = inputs.filter((el) => el.checked).map((el) => el.dataset[dataAttr]);
        onChange(checked.length ? checked : [NONE_SELECTED]);
      };
      row.querySelectorAll(".type-toggle-row").forEach((toggleRow) => {
        const input = toggleRow.querySelector("input");
        const value = input.dataset[dataAttr];
        toggleRow.querySelector(".type-toggle-label").textContent = valueLabel(value);
        input.addEventListener("change", emitChange);
      });
      row.querySelector('[data-action="show-all"]').addEventListener("click", () => {
        inputs.forEach((el) => (el.checked = true));
        emitChange();
      });
      row.querySelector('[data-action="hide-all"]').addEventListener("click", () => {
        inputs.forEach((el) => (el.checked = false));
        emitChange();
      });

      return row;
    }

    // Every distinct `category` attribute seen among currently-existing
    // holiday sensors - there's no fixed enum (see const.py's CATEGORY_ICONS
    // comment: countries define their own categories), so the checkbox list
    // above can only ever offer what's actually been imported.
    _availableCategories() {
      if (!this._hass) return [];
      const found = new Set();
      for (const entityId in this._hass.states) {
        if (!entityId.startsWith("sensor.annuals_holiday_")) continue;
        const category = this._hass.states[entityId].attributes.category;
        if (category) found.add(category);
      }
      return Array.from(found).sort();
    }

    _syncEventsInputs() {
      this._syncFieldRow("count", this._config.count || 10);
      const types = this._config.types || [];
      // An empty types array means "all" (both as a stored default and as
      // the filtering semantics in _filteredEvents) - shown as every box
      // checked, so unchecking just one recomputes the array to the other
      // seven rather than leaving the visual state out of sync with "all".
      const allChecked = types.length === 0;
      this.shadowRoot.querySelectorAll(".events-body input[data-type]").forEach((el) => {
        el.checked = allChecked || types.includes(el.dataset.type);
      });

      const categories = this._config.categories || [];
      const allCategoriesChecked = categories.length === 0;
      this.shadowRoot.querySelectorAll(".events-body input[data-category]").forEach((el) => {
        el.checked = allCategoriesChecked || categories.includes(el.dataset.category);
      });
      this._updateCategoriesRowVisibility();
    }

    _buildPeriodBody(strings) {
      const body = document.createElement("div");
      body.className = "period-body";
      body.innerHTML =
        this._visibilityTwoColHtml(["today_only"], ["next_event_day_only"]) +
        '<hr class="toggle-divider">' +
        this._fieldRowHtml("days_ahead", "number", "", 'min="0" max="365"') +
        this._fieldRowHtml("days_past", "number", "", 'min="0" max="30"') +
        this._fieldRowHtml("soon_days", "number", "", 'min="0" max="60"');
      this._wireFieldRow(body, "days_ahead", strings.editor.daysAhead, strings.editor.daysAheadDesc, (v) =>
        Math.max(0, Number(v) || 0)
      );
      this._wireFieldRow(body, "days_past", strings.editor.daysPast, strings.editor.daysPastDesc, (v) =>
        Math.max(0, Number(v) || 0)
      );
      this._wireFieldRow(body, "soon_days", strings.editor.soonDays, strings.editor.soonDaysDesc, (v) =>
        Math.max(0, Number(v) || 0)
      );

      const periodVisLabels = {
        today_only: [strings.editor.todayOnly, strings.editor.todayOnlyDesc],
        next_event_day_only: [strings.editor.nextEventDayOnly, strings.editor.nextEventDayOnlyDesc],
      };
      for (const key of Object.keys(periodVisLabels)) {
        const row = body.querySelector(`input[data-visibility="${key}"]`).closest(".toggle-row");
        const [label, desc] = periodVisLabels[key];
        row.querySelector(".label-text").textContent = label;
        const tooltipEl = row.querySelector(".tooltip-anchor");
        if (tooltipEl) tooltipEl.dataset.tooltip = desc;

        const toggle = row.querySelector(`input[data-visibility="${key}"]`);
        toggle.addEventListener("change", () => {
          this._config = defaultConfig({ ...this._config, [key]: toggle.checked });
          this._emit();
        });
      }

      return body;
    }

    _syncPeriodInputs() {
      // defaultConfig() always fills these in, so no fallback is needed here
      // - and none should be added, since a "|| 7"-style fallback would
      // mask a deliberately-entered 0 (falsy) and snap the field back to
      // the default the moment it re-syncs.
      this._syncFieldRow("days_ahead", this._config.days_ahead);
      this._syncFieldRow("days_past", this._config.days_past);
      this._syncFieldRow("soon_days", this._config.soon_days);
      const todayOnlyToggle = this.shadowRoot.querySelector('input[data-visibility="today_only"]');
      if (todayOnlyToggle) todayOnlyToggle.checked = this._config.today_only === true;
      const nextDayToggle = this.shadowRoot.querySelector('input[data-visibility="next_event_day_only"]');
      if (nextDayToggle) nextDayToggle.checked = this._config.next_event_day_only === true;
    }

    _groupText(key, strings) {
      const map = {
        general: [strings.editor.groupGeneral, strings.editor.groupGeneralDesc],
        events: [strings.editor.groupEvents, strings.editor.groupEventsDesc],
        period: [strings.editor.groupPeriod, strings.editor.groupPeriodDesc],
        display: [strings.editor.groupDisplay, strings.editor.groupDisplayDesc],
        fonts: [strings.editor.fonts, ""],
        colors: [strings.editor.colors, ""],
        icons: [strings.editor.colorsIconsHeading, ""],
        background: [strings.editor.cardBackgroundTabTitle, ""],
      };
      return map[key];
    }

    _superText(key, strings) {
      const map = {
        settings: [strings.editor.panelSettings, strings.editor.panelSettingsDesc],
        layout: [strings.editor.panelLayout, strings.editor.panelLayoutDesc],
      };
      return map[key];
    }

    _colorRowHtml(key, placeholder, options) {
      options = options || {};
      const presetItems = PRESET_COLORS.map(
        (p) => `
          <div class="preset-item" data-preset-value="${p.value}">
            <span class="preset-swatch" data-swatch-for="${p.key}"></span>
            <span data-preset-label="${p.key}"></span>
          </div>
        `
      ).join("");
      const toggleGroupHtml = (dataAttr) => `
        <div class="toggle-group">
          <label class="toggle">
            <input type="checkbox" data-${dataAttr}="${key}">
            <span class="track"></span>
          </label>
          <span class="toggle-label"></span>
          <span class="tooltip-anchor" data-tooltip="">
            <ha-icon icon="mdi:information-outline"></ha-icon>
          </span>
        </div>
      `;
      const matchToggle = options.matchToggle ? toggleGroupHtml("match") : "";
      const bgToggle = options.bgToggle ? toggleGroupHtml("bg") : "";
      return `
        <div class="field-row${options.sub ? " sub-field-row" : ""}">
          <div class="field-label">
            <span class="label-text"></span>
            <span class="tooltip-anchor" data-tooltip="">
              <ha-icon icon="mdi:information-outline"></ha-icon>
            </span>
          </div>
          <div class="field-input-row">
            <div class="preset-select" data-preset-for="${key}">
              <button type="button" class="preset-btn">
                <span class="preset-swatch"></span>
                <span class="preset-name"></span>
                <ha-icon icon="mdi:menu-down"></ha-icon>
              </button>
              <div class="preset-menu" hidden>${presetItems}</div>
            </div>
            <input type="text" data-color-text="${key}" placeholder="${placeholder}">
            <input type="color" data-color="${key}">
            ${matchToggle}${bgToggle}
          </div>
        </div>
      `;
    }

    // Per-category (accent/today/soon) icon animation dropdown - a
    // sub-field-row directly under that category's color row, matching the
    // badge_background_color sub-row pattern elsewhere in this tab. The
    // "Also color the text" toggle (see _colorRowHtml's old matchToggle
    // option, before it moved here) sits inline right after the select
    // instead of on its own row - the select carries its own narrow class
    // (.anim-select) and the .anim-row modifier on the row itself overrides
    // the generic "toggle-group always wraps to a full-width line" rule
    // (see EDITOR_STYLE) so both fit on one line.
    _animSelectRowHtml(key) {
      return `
        <div class="field-row sub-field-row anim-row">
          <div class="field-label">
            <span class="label-text"></span>
            <span class="tooltip-anchor" data-tooltip="">
              <ha-icon icon="mdi:information-outline"></ha-icon>
            </span>
          </div>
          <div class="field-input-row">
            <select class="anim-select" data-anim="${key}">
              <option value="none"></option>
              <option value="pulse"></option>
              <option value="bounce"></option>
              <option value="shake"></option>
              <option value="spin"></option>
              <option value="flash"></option>
            </select>
            <div class="toggle-group">
              <label class="toggle">
                <input type="checkbox" data-match="${key}">
                <span class="track"></span>
              </label>
              <span class="toggle-label"></span>
              <span class="tooltip-anchor" data-tooltip="">
                <ha-icon icon="mdi:information-outline"></ha-icon>
              </span>
            </div>
          </div>
        </div>
      `;
    }

    _wireAnimSelect(body, key, strings) {
      const select = body.querySelector(`select[data-anim="${key}"]`);
      if (!select) return;
      const row = select.closest(".sub-field-row");
      row.querySelector(".label-text").textContent = strings.editor.animationLabel || "Animation";
      const tooltip = row.querySelector(".tooltip-anchor");
      if (tooltip) tooltip.dataset.tooltip = strings.editor.animationDesc || "";
      const optionLabels = {
        none: strings.editor.animationNone || "None",
        pulse: strings.editor.animationPulse || "Pulse",
        bounce: strings.editor.animationBounce || "Bounce",
        shake: strings.editor.animationShake || "Shake",
        spin: strings.editor.animationSpin || "Spin",
        flash: strings.editor.animationFlash || "Flash",
      };
      Array.from(select.options).forEach((opt) => {
        opt.textContent = optionLabels[opt.value] || opt.value;
      });
      select.value = this._config.icon_animation[key] || "none";
      select.addEventListener("change", () => {
        this._config = defaultConfig({
          ...this._config,
          icon_animation: { ...this._config.icon_animation, [key]: select.value },
        });
        this._emit();
      });
    }

    _syncIconsInputs() {
      for (const key of ["accent", "today", "soon"]) {
        const select = this.shadowRoot.querySelector(`select[data-anim="${key}"]`);
        if (select) select.value = this._config.icon_animation[key] || "none";
      }
    }

    _matchPreset(value) {
      return (
        PRESET_COLORS.find((p) => p.value === (value || "")) ||
        { key: "custom", labelKey: "presetCustom", value }
      );
    }

    // The native <input type="color"> square only accepts plain 6-digit hex
    // values, but our fields also take var(--...) references and named CSS
    // colors - so instead of defaulting to white/blank for anything else, we
    // resolve the value to its actual rendered color via a throwaway probe
    // element and convert that to hex, so the square reflects the true
    // current color as soon as the editor opens.
    _resolveToHex(value) {
      if (!value) return null;
      if (/^#[0-9a-fA-F]{6}$/.test(value)) return value;
      const probe = document.createElement("span");
      probe.style.display = "none";
      probe.style.color = value;
      this.shadowRoot.appendChild(probe);
      const rgb = getComputedStyle(probe).color;
      probe.remove();
      const m = rgb.match(/[\d.]+/g);
      if (!m || m.length < 3) return null;
      const [r, g, b] = m.map((n) => Math.round(Number(n)));
      const toHex = (n) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0");
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }

    // Shared by the "colors" group fields and the background color field -
    // resolves/paints one color field-row's swatch, text input, and preset
    // dropdown to match a given value.
    _syncColorSwatch(key, value, fallback) {
      const strings = t(this._hass);
      const colorInput = this.shadowRoot.querySelector(`input[data-color="${key}"]`);
      const textInput = this.shadowRoot.querySelector(`input[data-color-text="${key}"]`);
      if (!colorInput) return;
      if (document.activeElement !== textInput) textInput.value = value;
      colorInput.value = this._resolveToHex(value || fallback) || "#ffffff";

      const select = this.shadowRoot.querySelector(`.preset-select[data-preset-for="${key}"]`);
      const preset = this._matchPreset(value);
      const swatch = select.querySelector(".preset-btn .preset-swatch");
      swatch.style.background = value || "transparent";
      swatch.style.boxShadow =
        preset.key === "default"
          ? "inset 0 0 0 2px var(--divider-color, #ccc)"
          : "inset 0 0 0 1px rgba(0, 0, 0, 0.15)";
      select.querySelector(".preset-name").textContent = strings.editor[preset.labelKey] || preset.key;
    }

    _syncColorInputs() {
      // Matches the fallback chain each color actually renders with in
      // CARD_STYLE (annuals-card.js's .icon/.name/.type/.badge/.when rules),
      // so the square shows the true current color even before any override
      // has been set.
      const fallbacks = {
        accent: "var(--primary-text-color)",
        today: "var(--error-color)",
        soon: "var(--warning-color)",
        card_title: "var(--primary-text-color)",
        title: "var(--primary-text-color)",
        subtitle: "var(--primary-text-color)",
        badge: "var(--primary-text-color)",
        badge_background_color: "rgba(128, 128, 128, 0.25)",
        when: "var(--primary-text-color)",
        text: "var(--primary-text-color)",
      };
      for (const key of [
        "accent",
        "today",
        "soon",
        "card_title",
        "title",
        "subtitle",
        "badge",
        "badge_background_color",
        "when",
        "text",
      ]) {
        this._syncColorSwatch(key, this._config.colors[key] || "", fallbacks[key]);

        const matchToggle = this.shadowRoot.querySelector(`input[data-match="${key}"]`);
        if (matchToggle) matchToggle.checked = this._config.colors[`match_${key}`] === true;

        const bgToggle = this.shadowRoot.querySelector(`input[data-bg="${key}"]`);
        if (bgToggle) bgToggle.checked = this._config.colors.badge_background !== false;
      }
    }

    _syncBackgroundInputs() {
      const bg = this._config.background;
      this._syncColorSwatch("color", bg.color || "", "var(--card-background-color)");

      const enabledToggle = this.shadowRoot.querySelector("input[data-bg-card-enabled]");
      if (enabledToggle) enabledToggle.checked = bg.enabled === true;

      const imageInput = this.shadowRoot.querySelector("input[data-bg-card-image]");
      if (imageInput && document.activeElement !== imageInput) imageInput.value = bg.image || "";

      const preview = this.shadowRoot.querySelector("[data-bg-card-preview]");
      if (preview) {
        preview.hidden = !bg.image;
        if (bg.image) preview.querySelector("img").src = bg.image;
      }

      const sizeSelect = this.shadowRoot.querySelector("select[data-bg-card-size]");
      if (sizeSelect) sizeSelect.value = bg.size || "cover";

      const opacityInput = this.shadowRoot.querySelector("input[data-bg-card-opacity]");
      if (opacityInput && document.activeElement !== opacityInput) opacityInput.value = bg.opacity ?? 100;
    }

    _closeAllPresetMenus() {
      this.shadowRoot.querySelectorAll(".preset-menu").forEach((menu) => (menu.hidden = true));
    }

    // Walks up from this editor's own light-DOM position (it's mounted
    // directly inside the dashboard editor dialog's scrollable content
    // area) to find the nearest ancestor that actually clips/scrolls its
    // content, rather than assuming any particular HA-internal class name -
    // that container's bottom edge, not the browser viewport's, is what a
    // dropdown opening downward can actually get cut off by.
    _scrollAncestorRect() {
      // This editor is nested several shadow-DOM levels deep inside the
      // dashboard edit dialog (hui-dialog-edit-card -> ... -> gui-editor ->
      // wrapper -> annuals-card-editor). el.parentElement is null once it
      // reaches the top of its own shadow root, so the walk has to cross
      // back out via shadowRoot.host to keep climbing toward the actual
      // scrollable dialog container several shadow roots up.
      const nextUp = (node) => node.parentElement || (node.getRootNode() && node.getRootNode().host) || null;
      let node = nextUp(this);
      while (node && node !== document.body) {
        const style = getComputedStyle(node);
        if (/(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight + 1) {
          return node.getBoundingClientRect();
        }
        node = nextUp(node);
      }
      return { bottom: window.innerHeight };
    }

    _wireColorRow(body, key, label, desc, group) {
      group = group || "colors";
      const row = body.querySelector(`input[data-color="${key}"]`).closest(".field-row");
      row.querySelector(".label-text").textContent = label;
      row.querySelector(".tooltip-anchor").dataset.tooltip = desc;

      const colorInput = row.querySelector(`input[data-color="${key}"]`);
      const textInput = row.querySelector(`input[data-color-text="${key}"]`);
      const setColor = (value) => {
        this._config = defaultConfig({
          ...this._config,
          [group]: { ...this._config[group], [key]: value },
        });
        this._emit();
        this._syncColorInputs();
      };
      colorInput.addEventListener("input", () => setColor(colorInput.value));
      textInput.addEventListener("input", () => setColor(textInput.value));

      const select = row.querySelector(`.preset-select[data-preset-for="${key}"]`);
      const menu = select.querySelector(".preset-menu");
      select.querySelector(".preset-btn").addEventListener("click", (ev) => {
        ev.stopPropagation();
        const isOpen = !menu.hidden;
        this._closeAllPresetMenus();
        if (!isOpen) {
          // The dialog scrolls internally and can cut the menu off well
          // before the browser viewport's own edge does - window.innerHeight
          // alone underestimates the clipping risk, since the dialog's own
          // visible bottom typically sits well above the window's. Measure
          // against the nearest actual scrolling ancestor instead (falling
          // back to the viewport if the editor isn't inside one), and
          // re-measure on every open since the dialog's scroll offset and
          // the button's on-screen position both change between opens.
          const rect = select.getBoundingClientRect();
          const containerRect = this._scrollAncestorRect();
          const spaceBelow = containerRect.bottom - rect.bottom;
          menu.classList.toggle("menu-up", spaceBelow < 280);
        }
        menu.hidden = isOpen;
      });
      select.querySelectorAll(".preset-item").forEach((item) => {
        item.addEventListener("click", () => {
          setColor(item.dataset.presetValue);
          menu.hidden = true;
        });
      });

      // body-wide (not row-scoped) lookups - the "Also color the text"
      // toggle now lives in its own sub-field-row after the animation
      // picker (see _matchToggleRowHtml) rather than inline in this row,
      // but bgToggle (badge's "show background") still renders inline here.
      const matchToggle = body.querySelector(`input[data-match="${key}"]`);
      if (matchToggle) {
        const strings = t(this._hass);
        const group = matchToggle.closest(".toggle-group");
        group.querySelector(".toggle-label").textContent = strings.editor.matchTextLabel;
        group.querySelector(".tooltip-anchor").dataset.tooltip = strings.editor.matchTextDesc;
        matchToggle.addEventListener("change", () => {
          this._config = defaultConfig({
            ...this._config,
            colors: { ...this._config.colors, [`match_${key}`]: matchToggle.checked },
          });
          this._emit();
        });
      }

      const bgToggle = body.querySelector(`input[data-bg="${key}"]`);
      if (bgToggle) {
        const strings = t(this._hass);
        const group = bgToggle.closest(".toggle-group");
        group.querySelector(".toggle-label").textContent = strings.editor.backgroundLabel;
        group.querySelector(".tooltip-anchor").dataset.tooltip = strings.editor.backgroundDesc;
        bgToggle.addEventListener("change", () => {
          this._config = defaultConfig({
            ...this._config,
            colors: { ...this._config.colors, badge_background: bgToggle.checked },
          });
          this._emit();
        });
      }
    }

    // Preset swatch colors/labels don't depend on the current config, so
    // they're painted once per color-picker row here rather than in
    // _syncColorInputs (which runs often) - shared by every body that
    // contains a color row (colors-body and background-body), since each
    // builds its own <div class="preset-item"> markup independently.
    _paintPresetSwatches(body, strings) {
      body.querySelectorAll(".preset-item").forEach((item) => {
        const swatch = item.querySelector(".preset-swatch");
        swatch.style.background = item.dataset.presetValue || "transparent";
        if (!item.dataset.presetValue) {
          swatch.style.boxShadow = "inset 0 0 0 2px var(--divider-color, #ccc)";
        }
        const labelEl = item.querySelector("[data-preset-label]");
        const preset = PRESET_COLORS.find((p) => p.key === labelEl.dataset.presetLabel);
        labelEl.textContent = strings.editor[preset.labelKey] || preset.key;
      });
    }

    _buildColorsBody(strings) {
      const body = document.createElement("div");
      body.className = "colors-body";

      const labelRows = document.createElement("div");
      labelRows.innerHTML =
        this._colorRowHtml("card_title", strings.editor.colorPlaceholder) +
        this._colorRowHtml("title", strings.editor.colorPlaceholder) +
        this._colorRowHtml("subtitle", strings.editor.colorPlaceholder) +
        this._colorRowHtml("badge", strings.editor.colorPlaceholder, { bgToggle: true }) +
        this._colorRowHtml("badge_background_color", strings.editor.colorPlaceholder, { sub: true }) +
        this._colorRowHtml("when", strings.editor.colorPlaceholder) +
        this._colorRowHtml("text", strings.editor.colorPlaceholder);
      body.appendChild(labelRows);

      this._paintPresetSwatches(body, strings);

      const labels = {
        card_title: [strings.editor.fontCardTitle, strings.editor.cardTitleColorDesc],
        title: [strings.editor.colorTitle, strings.editor.colorTitleDesc],
        subtitle: [strings.editor.colorSubtitle, strings.editor.colorSubtitleDesc],
        badge: [strings.editor.colorBadge, strings.editor.colorBadgeDesc],
        badge_background_color: [
          strings.editor.colorBadgeBackground,
          strings.editor.colorBadgeBackgroundDesc,
        ],
        when: [strings.editor.colorWhen, strings.editor.colorWhenDesc],
        text: [strings.editor.colorText, strings.editor.colorTextDesc],
      };
      for (const key of [
        "card_title",
        "title",
        "subtitle",
        "badge",
        "badge_background_color",
        "when",
        "text",
      ]) {
        const [label, desc] = labels[key];
        this._wireColorRow(body, key, label, desc);
      }

      if (!this._presetOutsideClickWired) {
        this._presetOutsideClickWired = true;
        this.addEventListener("click", () => this._closeAllPresetMenus());
      }

      return body;
    }

    _buildIconsBody(strings) {
      const body = document.createElement("div");
      body.className = "icons-body";

      const rows = document.createElement("div");
      rows.innerHTML =
        this._colorRowHtml("accent", strings.editor.colorPlaceholder) +
        this._animSelectRowHtml("accent") +
        this._colorRowHtml("today", strings.editor.colorPlaceholder) +
        this._animSelectRowHtml("today") +
        this._colorRowHtml("soon", strings.editor.colorPlaceholder) +
        this._animSelectRowHtml("soon");
      body.appendChild(rows);

      this._paintPresetSwatches(body, strings);

      const labels = {
        accent: [strings.editor.colorAccent, strings.editor.colorAccentDesc],
        today: [strings.editor.colorToday, strings.editor.colorTodayDesc],
        soon: [strings.editor.colorSoon, strings.editor.colorSoonDesc],
      };
      for (const key of ["accent", "today", "soon"]) {
        const [label, desc] = labels[key];
        this._wireColorRow(body, key, label, desc);
        this._wireAnimSelect(body, key, strings);
      }

      if (!this._presetOutsideClickWired) {
        this._presetOutsideClickWired = true;
        this.addEventListener("click", () => this._closeAllPresetMenus());
      }

      return body;
    }

    _buildBackgroundBody(strings) {
      const body = document.createElement("div");
      body.className = "background-body";

      body.innerHTML =
        `
        <div class="toggle-row">
          <label class="toggle">
            <input type="checkbox" data-bg-card-enabled>
            <span class="track"></span>
          </label>
          <div class="field-label">
            <span class="label-text"></span>
            <span class="tooltip-anchor" data-tooltip="">
              <ha-icon icon="mdi:information-outline"></ha-icon>
            </span>
          </div>
        </div>
        ` +
        this._colorRowHtml("color", strings.editor.colorPlaceholder) +
        `
        <div class="field-row">
          <div class="field-label">
            <span class="label-text"></span>
            <span class="tooltip-anchor" data-tooltip="">
              <ha-icon icon="mdi:information-outline"></ha-icon>
            </span>
          </div>
          <div class="field-input-row">
            <input type="text" data-bg-card-image placeholder="${strings.editor.cardBackgroundImagePlaceholder}">
            <button type="button" class="upload-btn" data-bg-card-upload-btn title="${strings.editor.cardBackgroundUpload}">
              <ha-icon icon="mdi:upload"></ha-icon>
            </button>
          </div>
          <div class="bg-image-preview" data-bg-card-preview hidden>
            <img data-bg-card-preview-img alt="">
            <button type="button" class="bg-image-clear" data-bg-card-clear title="${strings.editor.cardBackgroundClear}">
              <ha-icon icon="mdi:close"></ha-icon>
            </button>
          </div>
        </div>
        <div class="field-row-split">
          <div class="field-col">
            <div class="field-label">
              <span class="label-text"></span>
              <span class="tooltip-anchor" data-tooltip="">
                <ha-icon icon="mdi:information-outline"></ha-icon>
              </span>
            </div>
            <div class="field-input-row">
              <select data-bg-card-size>
                <option value="cover"></option>
                <option value="contain"></option>
                <option value="auto"></option>
                <option value="repeat"></option>
              </select>
            </div>
          </div>
          <div class="field-col">
            <div class="field-label">
              <span class="label-text"></span>
              <span class="tooltip-anchor" data-tooltip="">
                <ha-icon icon="mdi:information-outline"></ha-icon>
              </span>
            </div>
            <div class="field-input-row">
              <div class="unit-input-wrap">
                <input type="number" data-bg-card-opacity min="0" max="100">
                <span class="unit-suffix">%</span>
              </div>
            </div>
          </div>
        </div>
        `;

      body.querySelector('input[data-bg-card-enabled]').closest(".toggle-row").querySelector(".label-text").textContent =
        strings.editor.cardBackgroundEnable;
      body.querySelector('input[data-bg-card-enabled]').closest(".toggle-row").querySelector(".tooltip-anchor").dataset.tooltip =
        strings.editor.cardBackgroundEnableDesc;

      // Uploads go through HA's own public image-upload REST endpoint (the
      // same one HA's built-in dashboard/area background pickers use), so
      // the result is a normal /api/image/serve/<id>/original URL - the
      // text field stays editable too, for pasting an existing URL or a
      // media-source path selected in HA's own Media Browser.
      const imageInput = body.querySelector("input[data-bg-card-image]");
      const imageRow = imageInput.closest(".field-row");
      imageRow.querySelector(".label-text").textContent = strings.editor.cardBackgroundImage;
      imageRow.querySelector(".tooltip-anchor").dataset.tooltip = strings.editor.cardBackgroundImageDesc;

      const setImage = (value) => {
        this._config = defaultConfig({
          ...this._config,
          background: {
            ...this._config.background,
            image: value,
            // Picking an image (upload or typed/pasted path) is a clear
            // signal the user wants it shown - flipping the toggle for
            // them avoids the "I picked an image but nothing happened"
            // confusion of the background staying disabled.
            enabled: value ? true : this._config.background.enabled,
          },
        });
        this._emit();
        this._syncBackgroundInputs();
      };
      imageInput.addEventListener("input", () => setImage(imageInput.value));

      // The file input is created fresh on document.body (outside every
      // shadow root, including the ha-dialog wrapping this editor) rather
      // than kept as a permanent element in our own shadow DOM: when a
      // <input type="file"> element sits nested inside the editor's shadow
      // root *inside* ha-dialog's own shadow root, the native OS file picker
      // regaining focus after a pick is misread by ha-dialog's outside-click
      // detection as a click outside the dialog, silently closing the whole
      // "Annuals-Karte anpassen" dialog before the change event even fires.
      // A top-level, briefly-lived input sidesteps that nested-shadow-DOM
      // focus handling entirely.
      body.querySelector("[data-bg-card-upload-btn]").addEventListener("click", () => {
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = "image/*";
        fileInput.style.position = "fixed";
        fileInput.style.opacity = "0";
        fileInput.style.pointerEvents = "none";
        document.body.appendChild(fileInput);
        fileInput.addEventListener("change", async () => {
          const file = fileInput.files && fileInput.files[0];
          fileInput.remove();
          if (!file || !this._hass) return;
          const formData = new FormData();
          formData.append("file", file);
          try {
            // hass.callApi() doesn't pass FormData bodies through correctly
            // in every HA frontend version (it silently fails here) - a
            // direct fetch with the same bearer token HA itself uses is
            // the reliable path for a multipart upload.
            const response = await fetch("/api/image/upload", {
              method: "POST",
              headers: { Authorization: `Bearer ${this._hass.auth.data.access_token}` },
              body: formData,
            });
            if (!response.ok) throw new Error(`Upload failed: ${response.status}`);
            const result = await response.json();
            setImage(`/api/image/serve/${result.id}/original`);
          } catch (err) {
            console.error("annuals-card: background image upload failed", err);
          }
        });
        fileInput.click();
      });

      body.querySelector("[data-bg-card-clear]").addEventListener("click", () => setImage(""));

      const sizeRow = body.querySelector("select[data-bg-card-size]").closest(".field-col");
      sizeRow.querySelector(".label-text").textContent = strings.editor.cardBackgroundSize;
      sizeRow.querySelector(".tooltip-anchor").dataset.tooltip = strings.editor.cardBackgroundSizeDesc;
      const sizeSelect = sizeRow.querySelector("select");
      sizeSelect.querySelector('option[value="cover"]').textContent = strings.editor.cardBackgroundSizeCover;
      sizeSelect.querySelector('option[value="contain"]').textContent = strings.editor.cardBackgroundSizeContain;
      sizeSelect.querySelector('option[value="auto"]').textContent = strings.editor.cardBackgroundSizeAuto;
      sizeSelect.querySelector('option[value="repeat"]').textContent = strings.editor.cardBackgroundSizeRepeat;

      const opacityRow = body.querySelector("input[data-bg-card-opacity]").closest(".field-col");
      opacityRow.querySelector(".label-text").textContent = strings.editor.cardBackgroundOpacity;
      opacityRow.querySelector(".tooltip-anchor").dataset.tooltip = strings.editor.cardBackgroundOpacityDesc;

      this._paintPresetSwatches(body, strings);

      this._wireColorRow(
        body,
        "color",
        strings.editor.cardBackgroundColor,
        strings.editor.cardBackgroundColorDesc,
        "background"
      );

      const enabledToggle = body.querySelector("input[data-bg-card-enabled]");
      enabledToggle.addEventListener("change", () => {
        this._config = defaultConfig({
          ...this._config,
          background: { ...this._config.background, enabled: enabledToggle.checked },
        });
        this._emit();
      });

      sizeSelect.addEventListener("change", () => {
        this._config = defaultConfig({
          ...this._config,
          background: { ...this._config.background, size: sizeSelect.value },
        });
        this._emit();
      });

      const opacityInput = body.querySelector("input[data-bg-card-opacity]");
      opacityInput.addEventListener("input", () => {
        this._config = defaultConfig({
          ...this._config,
          background: {
            ...this._config.background,
            opacity: Math.max(0, Math.min(100, Number(opacityInput.value) || 0)),
          },
        });
        this._emit();
      });

      return body;
    }

    _highlightRowHtml(key) {
      return `
        <div class="toggle-row">
          <label class="toggle">
            <input type="checkbox" data-highlight="${key}">
            <span class="track"></span>
          </label>
          <div class="field-label">
            <span class="label-text"></span>
            <span class="tooltip-anchor" data-tooltip="">
              <ha-icon icon="mdi:information-outline"></ha-icon>
            </span>
          </div>
        </div>
      `;
    }

    _syncDisplayInputs() {
      const config = this._config;
      const map = {
        past: config.highlight_past,
        today: config.highlight_today,
        soon: config.highlight_soon,
        vip: config.show_vip_badge !== false,
        important: config.show_important_badge !== false,
      };
      for (const key of ["past", "today", "soon", "vip", "important"]) {
        const toggle = this.shadowRoot.querySelector(`input[data-highlight="${key}"]`);
        if (toggle) toggle.checked = map[key] === true;
      }
      this._syncColorSwatch("highlight_past", config.colors.highlight_past || "", "var(--secondary-text-color)");
      this._syncColorSwatch(
        "highlight_today",
        config.colors.highlight_today || "",
        "var(--annuals-today-color, var(--error-color))"
      );
      this._syncColorSwatch(
        "highlight_soon",
        config.colors.highlight_soon || "",
        "var(--annuals-soon-color, var(--warning-color))"
      );
      this._syncColorSwatch("vip_badge", config.colors.vip_badge || "", "var(--error-color)");
      this._syncColorSwatch(
        "important_badge",
        config.colors.important_badge || "",
        "var(--annuals-soon-color, var(--warning-color))"
      );
      const visMap = {
        past: config.show_past !== false,
        today: config.show_today !== false,
        soon: config.show_soon !== false,
        vip_only: config.show_vip_only === true,
        important_only: config.show_important_only === true,
        columns_compact: config.columns_compact === true,
      };
      for (const key of Object.keys(visMap)) {
        const toggle = this.shadowRoot.querySelector(`input[data-visibility="${key}"]`);
        if (toggle) toggle.checked = visMap[key];
      }
      this._syncIconField("vip_badge_icon", config.vip_badge_icon || "");
      this._syncIconField("important_badge_icon", config.important_badge_icon || "");
      // Config may have changed from outside this editor's own commit path
      // (e.g. the user switched to the raw YAML code-editor and back) -
      // rebuild the columns list from scratch so it never drifts out of
      // sync with the actual saved config.
      this._renderColumnsList();
    }

    _visibilityRowHtml(key, extraClass) {
      return `
        <div class="toggle-row${extraClass ? ` ${extraClass}` : ""}">
          <label class="toggle">
            <input type="checkbox" data-visibility="${key}">
            <span class="track"></span>
          </label>
          <div class="field-label">
            <span class="label-text"></span>
            <span class="tooltip-anchor" data-tooltip="">
              <ha-icon icon="mdi:information-outline"></ha-icon>
            </span>
          </div>
        </div>
      `;
    }

    // Two independent vertical columns (not a CSS grid) so a sub-row nested
    // under one entry - e.g. the country-suffix toggle under "Title" - only
    // ever affects its own column's flow, never the other column's pairing.
    // `entries` is a mix of plain keys and [key, subKey] tuples.
    _visibilityColumnHtml(entries) {
      return entries
        .map((entry) =>
          typeof entry === "string"
            ? this._visibilityRowHtml(entry)
            : this._visibilityRowHtml(entry[0]) + this._visibilityRowHtml(entry[1], "sub-field-row")
        )
        .join("");
    }

    _visibilityTwoColHtml(leftEntries, rightEntries) {
      return `
        <div class="field-row-split">
          <div class="field-col">${this._visibilityColumnHtml(leftEntries)}</div>
          <div class="field-col">${this._visibilityColumnHtml(rightEntries)}</div>
        </div>
      `;
    }

    // Working column list for the "Spalten" editor - config.columns itself
    // if the user has ever committed a change, otherwise the implicit
    // default (see DEFAULT_COLUMNS) so the list has something to show and
    // reorder even before anything has been saved. Always returns a fresh
    // array of shallow copies so callers can freely splice/reorder/mutate
    // without touching the live config until _commitColumns() is called.
    _currentColumns() {
      const cols = Array.isArray(this._config.columns) ? this._config.columns : DEFAULT_COLUMNS;
      return cols.map((c) => ({ ...c }));
    }

    _commitColumns(columns) {
      this._config = defaultConfig({ ...this._config, columns });
      this._emit();
      this._renderColumnsList();
    }

    _columnTypeLabel(type, strings) {
      const map = {
        icon: strings.editor.columnTypeIcon || "Icon",
        info: strings.editor.columnTypeInfo || "Name + type",
        name: strings.editor.columnTypeName || "Name",
        subtitle: strings.editor.columnTypeSubtitle || "Type",
        badge: strings.editor.colorBadge,
        when: strings.editor.colorWhen,
        text: strings.editor.columnTypeText || "Custom text",
      };
      return map[type] || type;
    }

    _buildColumnsSection(strings) {
      const section = document.createElement("div");
      section.className = "columns-section";

      const heading = document.createElement("div");
      heading.className = "section-heading";
      heading.textContent = strings.editor.columnsHeading || "Row columns";
      section.appendChild(heading);

      const desc = document.createElement("div");
      desc.className = "columns-desc";
      desc.textContent =
        strings.editor.columnsDesc ||
        "Add, remove, and reorder what each row shows. Custom text columns can mix free text with placeholders: {name}, {type}, {occurrence}, {when}, {country}.";
      section.appendChild(desc);

      const list = document.createElement("div");
      list.className = "columns-list";
      section.appendChild(list);
      this._columnsListEl = list;

      const addRow = document.createElement("div");
      addRow.className = "column-add-row";
      addRow.innerHTML = `
        <select data-column-add-type>
          <option value="icon"></option>
          <option value="info"></option>
          <option value="name"></option>
          <option value="subtitle"></option>
          <option value="badge"></option>
          <option value="when"></option>
          <option value="text"></option>
        </select>
        <button type="button" class="preset-btn" data-column-add>
          <ha-icon icon="mdi:plus"></ha-icon>
          <span></span>
        </button>
      `;
      const select = addRow.querySelector("select");
      Array.from(select.options).forEach((opt) => {
        opt.textContent = this._columnTypeLabel(opt.value, strings);
      });
      addRow.querySelector("[data-column-add] span").textContent = strings.editor.columnAdd || "Add";
      addRow.querySelector("[data-column-add]").addEventListener("click", () => {
        const type = select.value;
        // Always a fresh random id, even for types that only ever appear
        // once by default (icon/info/badge/when) - so a user adding a
        // *second* instance of the same type later never collides with the
        // first one's id.
        const id = `${type}-${Math.random().toString(36).slice(2, 8)}`;
        const columns = this._currentColumns();
        columns.push(type === "text" ? { id, type, template: "" } : { id, type });
        this._commitColumns(columns);
      });
      section.appendChild(addRow);

      const compactRow = document.createElement("div");
      compactRow.innerHTML = this._visibilityRowHtml("columns_compact", "columns-compact-row");
      compactRow.querySelector(".label-text").textContent =
        strings.editor.columnsCompact || "Compact (no gaps, centered)";
      const compactTooltip = compactRow.querySelector(".tooltip-anchor");
      if (compactTooltip) {
        compactTooltip.dataset.tooltip =
          strings.editor.columnsCompactDesc ||
          "Remove the spacing between columns, center the row, and make every field match in weight and opacity - useful when the columns form one continuous sentence.";
      }
      const compactToggle = compactRow.querySelector('input[data-visibility="columns_compact"]');
      compactToggle.addEventListener("change", () => {
        this._config = defaultConfig({ ...this._config, columns_compact: compactToggle.checked });
        this._emit();
      });
      section.appendChild(compactRow);

      this._renderColumnsList(strings);
      return section;
    }

    _columnRowHtml(col, index, strings) {
      const isText = col.type === "text";
      const suffixKeys =
        col.type === "info"
          ? ["name", "subtitle"]
          : col.type === "name"
            ? ["name"]
            : col.type === "subtitle"
              ? ["subtitle"]
              : [];
      return `
        <div class="column-row" data-col-index="${index}">
          <div class="column-row-main">
            <button type="button" class="icon-btn" data-col-action="up" title="${strings.editor.columnMoveUp || "Move up"}">
              <ha-icon icon="mdi:chevron-up"></ha-icon>
            </button>
            <button type="button" class="icon-btn" data-col-action="down" title="${strings.editor.columnMoveDown || "Move down"}">
              <ha-icon icon="mdi:chevron-down"></ha-icon>
            </button>
            <span class="column-type-label"></span>
            ${isText ? `<input type="text" class="column-template-input" data-col-template>` : ""}
            <button type="button" class="icon-btn column-remove" data-col-action="remove" title="${strings.editor.columnRemove || "Remove"}">
              <ha-icon icon="mdi:close"></ha-icon>
            </button>
          </div>
          ${
            suffixKeys.length
              ? `
                <div class="column-suffix-list">
                  ${suffixKeys
                    .map(
                      (key) => `
                        <div class="column-suffix-toggle">
                          <label class="toggle">
                            <input type="checkbox" data-col-suffix="${key}">
                            <span class="track"></span>
                          </label>
                          <span class="suffix-label"></span>
                        </div>
                      `
                    )
                    .join("")}
                </div>
              `
              : ""
          }
        </div>
      `;
    }

    _renderColumnsList(strings) {
      strings = strings || t(this._hass);
      if (!this._columnsListEl) return;
      const columns = this._currentColumns();
      this._columnsListEl.innerHTML = columns
        .map((col, index) => this._columnRowHtml(col, index, strings))
        .join("");

      columns.forEach((col, index) => {
        const row = this._columnsListEl.querySelector(`[data-col-index="${index}"]`);
        if (!row) return;
        row.querySelector(".column-type-label").textContent = this._columnTypeLabel(col.type, strings);

        const upBtn = row.querySelector('[data-col-action="up"]');
        const downBtn = row.querySelector('[data-col-action="down"]');
        upBtn.disabled = index === 0;
        downBtn.disabled = index === columns.length - 1;
        upBtn.addEventListener("click", () => {
          const cols = this._currentColumns();
          [cols[index - 1], cols[index]] = [cols[index], cols[index - 1]];
          this._commitColumns(cols);
        });
        downBtn.addEventListener("click", () => {
          const cols = this._currentColumns();
          [cols[index + 1], cols[index]] = [cols[index], cols[index + 1]];
          this._commitColumns(cols);
        });

        const removeBtn = row.querySelector('[data-col-action="remove"]');
        // At least one column must always remain - an empty row would just
        // look broken, and there's no "empty state" designed for it.
        removeBtn.disabled = columns.length <= 1;
        removeBtn.addEventListener("click", () => {
          const cols = this._currentColumns();
          cols.splice(index, 1);
          this._commitColumns(cols);
        });

        if (col.type === "text") {
          const templateInput = row.querySelector("[data-col-template]");
          templateInput.placeholder =
            strings.editor.columnTemplatePlaceholder || "e.g. {name} turns {occurrence} today";
          templateInput.value = col.template || "";
          templateInput.addEventListener("change", () => {
            const cols = this._currentColumns();
            cols[index] = { ...cols[index], template: templateInput.value };
            this._commitColumns(cols);
          });
        }

        const suffixKeys =
          col.type === "info"
            ? ["name", "subtitle"]
            : col.type === "name"
              ? ["name"]
              : col.type === "subtitle"
                ? ["subtitle"]
                : [];
        suffixKeys.forEach((key) => {
          const configKey = key === "name" ? "show_name_country" : "show_subtitle_country";
          const cb = row.querySelector(`[data-col-suffix="${key}"]`);
          if (!cb) return;
          cb.checked = this._config[configKey] === true;
          const labelEl = cb.closest(".column-suffix-toggle").querySelector(".suffix-label");
          labelEl.textContent =
            suffixKeys.length > 1
              ? `${strings.editor.visibilityCountrySuffix || "Holiday suffix"} (${
                  key === "name"
                    ? strings.editor.columnTypeName || "Name"
                    : strings.editor.columnTypeSubtitle || "Type"
                })`
              : strings.editor.visibilityCountrySuffix || "Holiday suffix";
          cb.addEventListener("change", () => {
            this._config = defaultConfig({ ...this._config, [configKey]: cb.checked });
            this._emit();
          });
        });
      });
    }

    _buildDisplayBody(strings) {
      const body = document.createElement("div");
      body.className = "display-body";

      const visHeading = document.createElement("div");
      visHeading.className = "section-heading";
      visHeading.textContent = strings.editor.visibilityHeading;
      body.appendChild(visHeading);

      const visRows = document.createElement("div");
      // Which events appear at all (past/today/soon | VIP/Important
      // filters). The card's own title lives in Settings -> General now
      // (right under the title text field, as "Hide"), and which fields
      // appear per row - and in what order - is the "Spalten" section
      // below instead of a fixed icon/title/subtitle/badge/when grid.
      visRows.innerHTML = this._visibilityTwoColHtml(["past", "today", "soon"], ["vip_only", "important_only"]);
      body.appendChild(visRows);

      body.appendChild(this._buildColumnsSection(strings));

      const visLabels = {
        past: [strings.editor.visibilityPast, strings.editor.visibilityPastDesc],
        today: [strings.editor.visibilityToday, strings.editor.visibilityTodayDesc],
        soon: [strings.editor.visibilitySoon, strings.editor.visibilitySoonDesc],
        vip_only: [strings.editor.visibilityVipOnly, strings.editor.visibilityVipOnlyDesc],
        important_only: [strings.editor.visibilityImportantOnly, strings.editor.visibilityImportantOnlyDesc],
      };
      const visConfigKeys = {
        past: "show_past",
        today: "show_today",
        soon: "show_soon",
        vip_only: "show_vip_only",
        important_only: "show_important_only",
      };
      for (const key of Object.keys(visConfigKeys)) {
        const row = body.querySelector(`input[data-visibility="${key}"]`).closest(".toggle-row");
        const [label, desc] = visLabels[key];
        row.querySelector(".label-text").textContent = label;
        const tooltipEl = row.querySelector(".tooltip-anchor");
        if (tooltipEl) tooltipEl.dataset.tooltip = desc;

        const toggle = row.querySelector(`input[data-visibility="${key}"]`);
        const configKey = visConfigKeys[key];
        toggle.addEventListener("change", () => {
          this._config = defaultConfig({ ...this._config, [configKey]: toggle.checked });
          this._emit();
        });
      }

      const heading = document.createElement("div");
      heading.className = "section-heading";
      heading.textContent = strings.editor.highlightHeading;
      body.appendChild(heading);

      // Each highlight toggle (past/today/soon/VIP/Important) is followed
      // by an indented sub-row for the color it controls - the tint's
      // background color for past/today/soon, the badge icon + color for
      // VIP/Important - so the customization reads as belonging to the
      // toggle above it rather than as a separate peer field.
      const rows = document.createElement("div");
      rows.innerHTML =
        this._highlightRowHtml("past") +
        this._colorRowHtml("highlight_past", strings.editor.colorPlaceholder, { sub: true }) +
        this._highlightRowHtml("today") +
        this._colorRowHtml("highlight_today", strings.editor.colorPlaceholder, { sub: true }) +
        this._highlightRowHtml("soon") +
        this._colorRowHtml("highlight_soon", strings.editor.colorPlaceholder, { sub: true }) +
        this._highlightRowHtml("vip") +
        this._fieldRowHtml("vip_badge_icon", "text", strings.editor.vipBadgeIconPlaceholder, "", true) +
        this._colorRowHtml("vip_badge", strings.editor.colorPlaceholder, { sub: true }) +
        this._highlightRowHtml("important") +
        this._fieldRowHtml(
          "important_badge_icon",
          "text",
          strings.editor.importantBadgeIconPlaceholder,
          "",
          true
        ) +
        this._colorRowHtml("important_badge", strings.editor.colorPlaceholder, { sub: true });
      body.appendChild(rows);

      const labels = {
        past: [strings.editor.highlightPast, strings.editor.highlightPastDesc],
        today: [strings.editor.highlightToday, strings.editor.highlightTodayDesc],
        soon: [strings.editor.highlightSoon, strings.editor.highlightSoonDesc],
        vip: [strings.editor.highlightVip, strings.editor.highlightVipDesc],
        important: [strings.editor.highlightImportant, strings.editor.highlightImportantDesc],
      };
      const configKeys = {
        past: "highlight_past",
        today: "highlight_today",
        soon: "highlight_soon",
        vip: "show_vip_badge",
        important: "show_important_badge",
      };
      for (const key of ["past", "today", "soon", "vip", "important"]) {
        const row = body.querySelector(`input[data-highlight="${key}"]`).closest(".toggle-row");
        const [label, desc] = labels[key];
        row.querySelector(".label-text").textContent = label;
        row.querySelector(".tooltip-anchor").dataset.tooltip = desc;

        const toggle = row.querySelector(`input[data-highlight="${key}"]`);
        const configKey = configKeys[key];
        toggle.addEventListener("change", () => {
          this._config = defaultConfig({ ...this._config, [configKey]: toggle.checked });
          this._emit();
        });
      }

      this._wireColorRow(
        body,
        "highlight_past",
        strings.editor.highlightBgColor,
        strings.editor.highlightBgColorDesc,
        "colors"
      );
      this._wireColorRow(
        body,
        "highlight_today",
        strings.editor.highlightBgColor,
        strings.editor.highlightBgColorDesc,
        "colors"
      );
      this._wireColorRow(
        body,
        "highlight_soon",
        strings.editor.highlightBgColor,
        strings.editor.highlightBgColorDesc,
        "colors"
      );

      this._wireFieldRow(
        body,
        "vip_badge_icon",
        strings.editor.vipBadgeIcon,
        strings.editor.vipBadgeIconDesc,
        (v) => v
      );
      this._upgradeIconField(body, "vip_badge_icon");
      this._wireColorRow(body, "vip_badge", strings.editor.vipBadgeColor, strings.editor.vipBadgeColorDesc, "colors");

      this._wireFieldRow(
        body,
        "important_badge_icon",
        strings.editor.importantBadgeIcon,
        strings.editor.importantBadgeIconDesc,
        (v) => v
      );
      this._upgradeIconField(body, "important_badge_icon");
      this._wireColorRow(
        body,
        "important_badge",
        strings.editor.importantBadgeColor,
        strings.editor.importantBadgeColorDesc,
        "colors"
      );

      this._paintPresetSwatches(body, strings);

      return body;
    }

    _fontRowHtml(key, placeholder, letterSpacingPlaceholder) {
      return `
        <div class="field-row">
          <div class="field-label">
            <span class="label-text"></span>
            <span class="tooltip-anchor" data-tooltip="">
              <ha-icon icon="mdi:information-outline"></ha-icon>
            </span>
          </div>
          <div class="field-input-row">
            <input type="text" data-font="${key}" placeholder="${placeholder}">
            <div class="field-toggles">
              <div class="toggle-group">
                <label class="toggle">
                  <input type="checkbox" data-bold="${key}">
                  <span class="track"></span>
                </label>
                <span class="toggle-label"></span>
              </div>
              <div class="toggle-group">
                <label class="toggle">
                  <input type="checkbox" data-italic="${key}">
                  <span class="track"></span>
                </label>
                <span class="toggle-label"></span>
              </div>
              <div class="toggle-group">
                <label class="toggle">
                  <input type="checkbox" data-uppercase="${key}">
                  <span class="track"></span>
                </label>
                <span class="toggle-label"></span>
              </div>
              <div class="toggle-group">
                <label class="toggle">
                  <input type="checkbox" data-underline="${key}">
                  <span class="track"></span>
                </label>
                <span class="toggle-label"></span>
              </div>
            </div>
          </div>
        </div>
        <div class="field-row sub-field-row">
          <div class="field-label">
            <span class="label-text"></span>
          </div>
          <div class="field-input-row">
            <input type="text" data-letterspacing="${key}" placeholder="${letterSpacingPlaceholder}">
          </div>
        </div>
      `;
    }

    _syncFontInputs() {
      const config = this._config;
      const rows = [
        { key: "font_size_title", value: config.font_size_title, style: config.font_style.font_size_title },
        { key: "title", value: config.font_sizes.title, style: config.font_style.title },
        { key: "subtitle", value: config.font_sizes.subtitle, style: config.font_style.subtitle },
        { key: "badge", value: config.font_sizes.badge, style: config.font_style.badge },
        { key: "when", value: config.font_sizes.when, style: config.font_style.when },
        { key: "text", value: config.font_sizes.text, style: config.font_style.text },
      ];
      for (const { key, value, style } of rows) {
        const input = this.shadowRoot.querySelector(`input[data-font="${key}"]`);
        const boldToggle = this.shadowRoot.querySelector(`input[data-bold="${key}"]`);
        const italicToggle = this.shadowRoot.querySelector(`input[data-italic="${key}"]`);
        const uppercaseToggle = this.shadowRoot.querySelector(`input[data-uppercase="${key}"]`);
        const underlineToggle = this.shadowRoot.querySelector(`input[data-underline="${key}"]`);
        const letterInput = this.shadowRoot.querySelector(`input[data-letterspacing="${key}"]`);
        if (!input) continue;
        if (document.activeElement !== input) input.value = value || "";
        boldToggle.checked = style.bold === true;
        italicToggle.checked = style.italic === true;
        uppercaseToggle.checked = style.uppercase === true;
        underlineToggle.checked = style.underline === true;
        if (document.activeElement !== letterInput) letterInput.value = style.letter_spacing || "";
      }
    }

    _buildFontsBody(strings) {
      const body = document.createElement("div");
      body.className = "fonts-body";

      const rows = document.createElement("div");
      rows.innerHTML =
        this._fontRowHtml("font_size_title", strings.editor.fontPlaceholder, strings.editor.fontLetterSpacingPlaceholder) +
        this._fontRowHtml("title", strings.editor.fontPlaceholder, strings.editor.fontLetterSpacingPlaceholder) +
        this._fontRowHtml("subtitle", strings.editor.fontPlaceholder, strings.editor.fontLetterSpacingPlaceholder) +
        this._fontRowHtml("badge", strings.editor.fontPlaceholder, strings.editor.fontLetterSpacingPlaceholder) +
        this._fontRowHtml("when", strings.editor.fontPlaceholder, strings.editor.fontLetterSpacingPlaceholder) +
        this._fontRowHtml("text", strings.editor.fontPlaceholder, strings.editor.fontLetterSpacingPlaceholder);
      body.appendChild(rows);

      const toggleLabels = [
        ["[data-bold]", strings.editor.fontBold],
        ["[data-italic]", strings.editor.fontItalic],
        ["[data-uppercase]", strings.editor.fontUppercase],
        ["[data-underline]", strings.editor.fontUnderline],
      ];
      body.querySelectorAll(".toggle-group").forEach((group) => {
        const match = toggleLabels.find(([selector]) => group.querySelector(selector));
        if (match) group.querySelector(".toggle-label").textContent = match[1];
      });

      const labels = {
        font_size_title: [strings.editor.fontCardTitle, strings.editor.fontCardTitleDesc],
        title: [strings.editor.colorTitle, strings.editor.fontTitleDesc],
        subtitle: [strings.editor.colorSubtitle, strings.editor.fontSubtitleDesc],
        badge: [strings.editor.colorBadge, strings.editor.fontBadgeDesc],
        when: [strings.editor.colorWhen, strings.editor.fontWhenDesc],
        text: [strings.editor.colorText, strings.editor.fontTextDesc],
      };
      for (const key of ["font_size_title", "title", "subtitle", "badge", "when", "text"]) {
        const row = body.querySelector(`input[data-font="${key}"]`).closest(".field-row");
        const [label, desc] = labels[key];
        row.querySelector(".label-text").textContent = label;
        row.querySelector(".tooltip-anchor").dataset.tooltip = desc;

        const input = row.querySelector(`input[data-font="${key}"]`);
        input.addEventListener("input", () => {
          if (key === "font_size_title") {
            this._config = defaultConfig({ ...this._config, font_size_title: input.value });
          } else {
            this._config = defaultConfig({
              ...this._config,
              font_sizes: { ...this._config.font_sizes, [key]: input.value },
            });
          }
          this._emit();
        });

        const updateStyle = (patch) => {
          this._config = defaultConfig({
            ...this._config,
            font_style: {
              ...this._config.font_style,
              [key]: { ...this._config.font_style[key], ...patch },
            },
          });
          this._emit();
        };

        const boldToggle = row.querySelector(`input[data-bold="${key}"]`);
        boldToggle.addEventListener("change", () => updateStyle({ bold: boldToggle.checked }));

        const italicToggle = row.querySelector(`input[data-italic="${key}"]`);
        italicToggle.addEventListener("change", () => updateStyle({ italic: italicToggle.checked }));

        const uppercaseToggle = row.querySelector(`input[data-uppercase="${key}"]`);
        uppercaseToggle.addEventListener("change", () => updateStyle({ uppercase: uppercaseToggle.checked }));

        const underlineToggle = row.querySelector(`input[data-underline="${key}"]`);
        underlineToggle.addEventListener("change", () => updateStyle({ underline: underlineToggle.checked }));

        const letterInput = body.querySelector(`input[data-letterspacing="${key}"]`);
        const letterRow = letterInput.closest(".sub-field-row");
        letterRow.querySelector(".label-text").textContent = strings.editor.fontLetterSpacing;
        letterInput.addEventListener("input", () => updateStyle({ letter_spacing: letterInput.value }));
      }

      return body;
    }

    _superForGroup(key) {
      return SUPER_GROUPS.find((sg) => sg.groups.includes(key)).key;
    }

    _selectTab(key) {
      this._activeGroup = key;
      const superKey = this._superForGroup(key);
      this._activeSuper = superKey;

      this.shadowRoot.querySelectorAll(".tab").forEach((el) => {
        el.classList.toggle("active", el.dataset.key === key);
      });

      // The shared body panes (one per leaf tab) are moved into whichever
      // super-panel's content slot is currently relevant, rather than
      // duplicated per super-panel.
      const superContent = this.shadowRoot.querySelector(
        `.super-panel[data-super="${superKey}"] .super-content`
      );
      const bodies = {
        general: this.shadowRoot.querySelector(".general-body"),
        events: this.shadowRoot.querySelector(".events-body"),
        period: this.shadowRoot.querySelector(".period-body"),
        display: this.shadowRoot.querySelector(".display-body"),
        colors: this.shadowRoot.querySelector(".colors-body"),
        icons: this.shadowRoot.querySelector(".icons-body"),
        fonts: this.shadowRoot.querySelector(".fonts-body"),
        background: this.shadowRoot.querySelector(".background-body"),
      };
      for (const [bodyKey, el] of Object.entries(bodies)) {
        superContent.appendChild(el);
        el.style.display = key === bodyKey ? "" : "none";
      }

      const strings = t(this._hass);
      const desc = this.shadowRoot.querySelector(
        `.super-panel[data-super="${superKey}"] .panel-description`
      );
      const descText = this._groupText(key, strings)[1];
      desc.textContent = descText;
      desc.style.display = descText ? "" : "none";
      if (key === "general") this._syncGeneralInputs();
      if (key === "events") this._syncEventsInputs();
      if (key === "period") this._syncPeriodInputs();
      if (key === "fonts") this._syncFontInputs();
      if (key === "display") this._syncDisplayInputs();
      if (key === "icons") { this._syncColorInputs(); this._syncIconsInputs(); }
      if (key === "background") this._syncBackgroundInputs();
    }

    // Accordion: opening a super-panel closes the other one. If the newly
    // opened panel doesn't own the currently active leaf tab, it falls back
    // to that panel's first tab.
    _toggleSuper(key) {
      const panel = this.shadowRoot.querySelector(`.super-panel[data-super="${key}"]`);
      if (panel.classList.contains("open")) {
        panel.classList.remove("open");
        return;
      }
      SUPER_GROUPS.forEach((sg) => {
        this.shadowRoot
          .querySelector(`.super-panel[data-super="${sg.key}"]`)
          .classList.toggle("open", sg.key === key);
      });
      const sg = SUPER_GROUPS.find((s) => s.key === key);
      if (!sg.groups.includes(this._activeGroup)) {
        this._selectTab(sg.groups[0]);
      }
    }

    _render() {
      if (!this._hass || !this._config) return;
      const strings = t(this._hass);

      if (!this.shadowRoot) this.attachShadow({ mode: "open" });

      if (!this.shadowRoot.querySelector(".super-panel")) {
        this._activeGroup = "general";
        this.shadowRoot.innerHTML = `<style>${EDITOR_STYLE}</style>`;

        for (const superGroup of SUPER_GROUPS) {
          const [title, subtitle] = this._superText(superGroup.key, strings);
          const panel = document.createElement("div");
          panel.className = "super-panel";
          panel.dataset.super = superGroup.key;
          panel.innerHTML = `
            <div class="super-header">
              <div class="super-icon"><ha-icon icon="${superGroup.icon}"></ha-icon></div>
              <div class="super-text">
                <span class="super-title"></span>
                <span class="super-subtitle"></span>
              </div>
              <ha-icon class="super-chevron" icon="mdi:chevron-down"></ha-icon>
            </div>
            <div class="super-body">
              <div class="tabs"></div>
              <div class="panel-description"></div>
              <div class="super-content"></div>
            </div>
          `;
          panel.querySelector(".super-title").textContent = title;
          panel.querySelector(".super-subtitle").textContent = subtitle;
          panel
            .querySelector(".super-header")
            .addEventListener("click", () => this._toggleSuper(superGroup.key));

          const tabsEl = panel.querySelector(".tabs");
          for (const key of superGroup.groups) {
            const group = GROUPS.find((g) => g.key === key);
            const [header] = this._groupText(key, strings);
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "tab";
            btn.dataset.key = key;
            btn.innerHTML = `<ha-icon icon="${group.icon}"></ha-icon><span></span>`;
            btn.querySelector("span").textContent = header;
            btn.addEventListener("click", () => this._selectTab(key));
            tabsEl.appendChild(btn);
          }

          this.shadowRoot.appendChild(panel);
        }

        this.shadowRoot.appendChild(this._buildGeneralBody(strings));
        this.shadowRoot.appendChild(this._buildEventsBody(strings));
        this.shadowRoot.appendChild(this._buildPeriodBody(strings));
        this.shadowRoot.appendChild(this._buildDisplayBody(strings));
        this.shadowRoot.appendChild(this._buildColorsBody(strings));
        this.shadowRoot.appendChild(this._buildIconsBody(strings));
        this.shadowRoot.appendChild(this._buildFontsBody(strings));
        this.shadowRoot.appendChild(this._buildBackgroundBody(strings));

        // Both top-level sections (Settings/Layout) start collapsed - the
        // internal active-tab state is still wired up via _selectTab so
        // whichever section the user opens first shows the right content,
        // it just isn't forced open on load.
        this._selectTab(this._activeGroup);
        this._syncGeneralInputs();
        this._syncEventsInputs();
        this._syncPeriodInputs();
        this._syncColorInputs();
        this._syncIconsInputs();
        this._syncFontInputs();
        this._syncDisplayInputs();
        this._syncBackgroundInputs();
        return;
      }

      // Keep tab/panel labels current (language can change) and refresh
      // whichever pane is active without rebuilding the DOM.
      GROUPS.forEach((group) => {
        const [header] = this._groupText(group.key, strings);
        const span = this.shadowRoot.querySelector(`.tab[data-key="${group.key}"] span`);
        if (span) span.textContent = header;
      });
      SUPER_GROUPS.forEach((sg) => {
        const [title, subtitle] = this._superText(sg.key, strings);
        const panel = this.shadowRoot.querySelector(`.super-panel[data-super="${sg.key}"]`);
        panel.querySelector(".super-title").textContent = title;
        panel.querySelector(".super-subtitle").textContent = subtitle;
      });
      const activeDesc = this.shadowRoot.querySelector(
        `.super-panel[data-super="${this._activeSuper}"] .panel-description`
      );
      const descText = this._groupText(this._activeGroup, strings)[1];
      activeDesc.textContent = descText;
      activeDesc.style.display = descText ? "" : "none";
      this._syncGeneralInputs();
      this._syncEventsInputs();
      this._syncPeriodInputs();
      this._syncColorInputs();
      this._syncIconsInputs();
      this._syncFontInputs();
      this._syncDisplayInputs();
      this._syncBackgroundInputs();
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
