// Annuals custom Lovelace card - bundled with the annuals integration, no
// separate HACS frontend package. Vanilla Web Components, no build step, no
// dependencies, consistent with the integration's zero-`requirements` design.

(() => {
  const ENTITY_PREFIX = "sensor.annuals_";

  // How often AnnualsCard re-fetches embedded external calendars' own
  // events (see _startExternalEventsPolling) while it's on-screen, as a
  // safety net alongside the entity-state fast-path in
  // externalCalendarsSignature: Home Assistant's state machine silently
  // skips writing (and firing state_changed for) a coordinator refresh that
  // produces the same state/attributes as before, and a calendar entity's
  // state/attributes only ever reflect its single current/next event - so
  // deleting or editing any OTHER event in the window is invisible to pure
  // state-change reactivity. 5 minutes balances "stale data doesn't linger
  // long" against not hammering the calendar integration's own API.
  const EXTERNAL_EVENTS_POLL_MS = 5 * 60 * 1000;

  const EVENT_TYPES = [
    "birthday",
    "anniversary",
    "name_day",
    "wedding_anniversary",
    "memorial",
    "pet_birthday",
    "work_anniversary",
    "custom",
    "one_time",
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
      // Timeline layout only (see _timelineSentenceFragment) - one sentence
      // template shared by every event type, so it doesn't need a
      // "birthday"/"anniversary"/"holiday"-specific variant. {sup} becomes a
      // real <sup> element (English ordinals need the suffix raised, e.g.
      // 27ᵗʰ) - every other placeholder is a plain string substitution.
      possessive: (name) => `${name}'s`,
      ordinalParts: (n) => {
        const v = n % 100;
        if (v >= 11 && v <= 13) return { num: `${n}`, sup: "th" };
        switch (n % 10) {
          case 1:
            return { num: `${n}`, sup: "st" };
          case 2:
            return { num: `${n}`, sup: "nd" };
          case 3:
            return { num: `${n}`, sup: "rd" };
          default:
            return { num: `${n}`, sup: "th" };
        }
      },
      timelineSentence: "{possessive} {ordinal}{sup} {type} is {when}",
      timelineSentenceSimple: "{name} is {when}",
      // Recent-past events (e.daysSince > 0) use these instead - "is" would
      // read wrong for something that already happened ("...is 2 days ago").
      timelineSentencePast: "{possessive} {ordinal}{sup} {type} was {when}",
      timelineSentenceSimplePast: "{name} was {when}",
      timelineExpand: "Details",
      timelineCollapse: "Less",
      timelineMore: "More",
      types: {
        birthday: "Birthday",
        anniversary: "Anniversary",
        name_day: "Name day",
        wedding_anniversary: "Wedding anniversary",
        memorial: "Memorial",
        pet_birthday: "Pet birthday",
        work_anniversary: "Work anniversary",
        custom: "Custom",
        one_time: "One-time event",
        holiday: "Holiday",
        // Fallback only - an embedded external calendar's own event.typeLabel
        // (its source calendar's name, see buildExternalEvent) is always
        // shown instead wherever a type label appears; this only surfaces
        // where a bare type name is needed with no event context, e.g. the
        // Colors -> Event Types row label.
        calendar: "Calendar event",
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
        one_time: "One-time events",
        holiday: "Holidays",
        calendar: "Calendar events",
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
        layoutStyleLabel: "Layout style",
        layoutStyleDesc:
          "List shows the classic icon/name/type/badge/countdown rows. Timeline shows a compact horizontal axis with the next event highlighted and the rest as clickable dots - handy for a narrow Sections-view column.",
        layoutStyleList: "List",
        layoutStyleTimeline: "Timeline",
        timelineLineHeading: "Timeline line",
        timelineLineWidth: "Width",
        timelineLineWidthDesc: "Thickness of the horizontal axis line, e.g. \"4px\".",
        timelineLineColor: "Color",
        timelineLineColorDesc: "Color of the horizontal axis line.",
        timelineDividerHeading: "Divider line",
        timelineDividerWidth: "Width",
        timelineDividerWidthDesc:
          "Thickness of the vertical divider marking the past/future boundary, e.g. \"1px\".",
        timelineDividerColor: "Color",
        timelineDividerColorDesc: "Color of the vertical past/future divider line.",
        lineStyleLabel: "Style",
        lineStyleSolid: "Solid",
        lineStyleDashed: "Dashed",
        lineStyleDotted: "Dotted",
        timelineOptionsHeading: "Options",
        timelineShowFullName: "Show full name",
        timelineShowFullNameDesc:
          "Show each event's full name (first and last) instead of just its first name, in the header, tooltip and expandable list.",
        showHolidaySuffix: "Show holiday suffix",
        showHolidaySuffixDesc:
          "Append the holiday's country (and subdivision, if any) in parentheses after its name, e.g. \"Pioneer Day (US-UT)\".",
        timelineShowDate: "Show date",
        timelineShowDateDesc:
          "Append the short calendar date in parentheses at the end, e.g. \"...is in 3 days (6 Aug)\". Hidden on the event's own day, since the sentence already ends \"...is today\" right before it.",
        timelineShowTime: "Show time",
        timelineShowTimeDesc:
          "Append an external calendar event's own time range in the same parentheses, e.g. \"...is in 3 days (03:00 PM–04:00 PM)\". Only ever shown for a timed (non all-day) external calendar event. The time format follows your Home Assistant language.",
        timelineShowLocation: "Show location",
        timelineShowLocationDesc:
          "Append an external calendar event's own location in the same parentheses. Only ever shown for an external calendar event that has one set.",
        timelineShowDescription: "Show description",
        timelineShowDescriptionDesc:
          "Append an external calendar event's own description in the same parentheses. Only ever shown for an external calendar event that has one set.",
        timelineHeaderMaxEvents: "Max events per day",
        timelineHeaderMaxEventsDesc:
          "Caps how many header lines a single day of tied events contributes, e.g. 3 birthdays on the same day. Extra events for that day still get their own dot on the axis, just without a header line. Leave empty for no limit.",
        timelineHeaderMinEvents: "Always show N upcoming",
        timelineHeaderMinEventsDesc:
          "Always shows at least this many header lines, pulling in further upcoming (or, once those run out, further recent-past) days beyond the very next one if needed - each still capped by \"max events per day\" above. Leave empty (or 0) to only show the very next day's own events.",
        moreAction: "\"More\" button",
        moreActionDesc:
          "What the timeline's bottom-right \"More\" button does. Typically a Navigate action pointing at a dashboard that shows the same events in the full List layout. Leave it on \"Nothing\" to hide the button.",
        groupTimeline: "Timeline",
        groupTimelineDesc: "Only used when Layout style (under Display) is set to Timeline.",
        timelineHeaderLabel: "Header",
        timelineHeaderFontDesc:
          "Font for the description line above the axis, e.g. \"Kevin's 27th birthday is today\".",
        timelineHeaderColorDesc: "Text color for the description line above the axis.",
        timelineTooltipLabel: "Tooltip",
        timelineTooltipFontDesc: "Font for the text shown when a dot on the axis is clicked.",
        timelineTooltipColorDesc: "Text color for the text shown when a dot on the axis is clicked.",
        timelineListLabel: "List (Details)",
        timelineListFontDesc: "Font for the expandable chronological list under the axis.",
        timelineListColorDesc: "Text color for the expandable chronological list under the axis.",
        timelineButtonLabel: "Details / More button",
        timelineButtonFontDesc: "Font for the footer's Details and More buttons.",
        timelineButtonColorDesc: "Text color for the footer's Details and More buttons.",
        eventTypesHeading: "Event types",
        eventTypeColorDesc: "Color used for this event type's icon and dot on the timeline.",
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
        visibilityNameDesc: "Show the event name",
        visibilityTypeDesc: "Show the event type",
        visibilityCountrySuffix: "Holiday suffix",
        visibilityCountrySuffixDesc: "Append the country (and subdivision, if any) after the holiday's name/type, e.g. “Independence Day · US (UT)”",
        columnsHeading: "Row columns",
        columnsDesc: "Add, remove, and reorder what each row shows. Custom text columns can mix free text with placeholders: {name}, {last_name}, {full_name}, {type}, {occurrence}, {when}, {date}, {country}, {time}, {location}, {description}.",
        columnTypeIcon: "Icon",
        columnTypeInfo: "Name + type",
        columnTypeName: "Name",
        columnTypeLastName: "Last name",
        columnTypeFullName: "Full name",
        columnTypeFullNameType: "Full name + type",
        columnTypeType: "Type",
        columnTypeText: "Custom text",
        columnTypeDate: "Date",
        columnTypeTime: "Time",
        columnTypeLocation: "Location",
        columnTypeDescription: "Description",
        columnTypeTimeDesc:
          "Append the external calendar event's own time range, e.g. \"...03:00 PM–05:00 PM\". Only ever shown for a timed (non all-day) external calendar event.",
        columnTypeLocationDesc:
          "Append the external calendar event's own location. Only ever shown for an external calendar event that has one set.",
        columnTypeDescriptionDesc:
          "Append the external calendar event's own description. Only ever shown for an external calendar event that has one set.",
        suffixLabel: "Suffix",
        suffixGroupHolidayTitle: "Holidays only",
        suffixGroupExternalTitle: "External calendars only",
        suffixShowCalendarName: "Calendar name",
        suffixShowCalendarNameDesc:
          "Show the external calendar's own name (e.g. \"Personal\") here. Turn off once Time/Location/Description below already say enough on their own.",
        externalCalendarsHeading: "External calendars",
        externalCalendarsDesc:
          "Embed one or more of your existing Home Assistant calendars alongside Annuals' own events - each one lands on its real day (and, for timed events, sorts by time of day within that day) instead of any \"next occurrence\" math. Add a Time/Location/Description column above to show those fields for these events.",
        externalCalendarsLabel: "Calendars",
        externalCalendarsLabelDesc: "Which calendar.* entities to embed.",
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
        vipBadgeColorList: "Badge color (List)",
        vipBadgeColorListDesc:
          "Color of the VIP star badge in the List layout's corner badge, in the Timeline layout's header, and in its expandable Details list.",
        vipBadgeColorTimeline: "Badge color (Timeline)",
        vipBadgeColorTimelineDesc:
          "Color of the VIP star icon on the Timeline layout's axis dots specifically. Only shown while Layout style is set to Timeline.",
        importantBadgeColorList: "Badge color (List)",
        importantBadgeColorListDesc:
          "Color of the Important exclamation-mark badge in the List layout's corner badge, in the Timeline layout's header, and in its expandable Details list.",
        importantBadgeColorTimeline: "Badge color (Timeline)",
        importantBadgeColorTimelineDesc:
          "Color of the Important exclamation-mark icon on the Timeline layout's axis dots specifically. Only shown while Layout style is set to Timeline.",
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
        iconVisibleLabel: "Show icon",
        iconVisibleDesc: "Show or hide the icon for this category",
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
        colorName: "Name",
        colorType: "Type",
        colorBadge: "Occurrence",
        colorWhen: "Countdown",
        colorText: "Custom text",
        cardTitleColorDesc: "Text color for the card's own title",
        colorNameDesc: "Text color for the event name",
        colorLastName: "Last name",
        colorLastNameDesc: "Text color for the event's last name",
        colorFullName: "Full name",
        colorFullNameDesc: "Text color for the event's full name (first + last)",
        colorTypeDesc: "Text color for the event type",
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
        fontNameDesc: "Font size for the event name",
        fontLastNameDesc: "Font size for the event's last name",
        fontFullNameDesc: "Font size for the event's full name (first + last)",
        fontTypeDesc: "Font size for the event type",
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
        panelLayoutDesc: "Display, fonts, colors, icons, card background and timeline",
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
      // Genitiv ohne Apostroph ("Kevins Geburtstag") - nur bei einem
      // Namen, der bereits auf einen Zischlaut endet, bleibt es beim bloßen
      // Apostroph ("Klaus' Geburtstag"), statt ein zusätzliches "s"
      // anzuhängen.
      possessive: (name) => (/[sxzß]$/i.test(name) ? `${name}'` : `${name}s`),
      ordinalParts: (n) => ({ num: `${n}.`, sup: "" }),
      // Deutsche Substantive (Geburtstag, Jahrestag, ...) bleiben groß-
      // geschrieben, egal an welcher Stelle im Satz sie stehen.
      capitalizeSentenceType: true,
      timelineSentence: "{possessive} {ordinal}{sup} {type} ist {when}",
      timelineSentenceSimple: "{name} ist {when}",
      timelineSentencePast: "{possessive} {ordinal}{sup} {type} war {when}",
      timelineSentenceSimplePast: "{name} war {when}",
      timelineExpand: "Details",
      timelineCollapse: "Weniger",
      timelineMore: "Mehr",
      types: {
        birthday: "Geburtstag",
        anniversary: "Jahrestag",
        name_day: "Namenstag",
        wedding_anniversary: "Hochzeitstag",
        memorial: "Todestag",
        pet_birthday: "Tiergeburtstag",
        work_anniversary: "Firmenjubiläum",
        custom: "Frei wählbar",
        one_time: "Einmaliges Ereignis",
        holiday: "Feiertag",
        calendar: "Kalenderereignis",
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
        one_time: "Einmalige Ereignisse",
        holiday: "Feiertage",
        calendar: "Kalenderereignisse",
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
        layoutStyleLabel: "Kartenlayout",
        layoutStyleDesc:
          "Liste zeigt die klassischen Zeilen mit Icon/Name/Untertitel/Abzeichen/Countdown. Timeline zeigt eine kompakte horizontale Achse mit hervorgehobenem nächsten Ereignis und den übrigen als anklickbare Punkte - praktisch für eine schmale Spalte in der Sections-Ansicht.",
        layoutStyleList: "Liste",
        layoutStyleTimeline: "Timeline",
        timelineLineHeading: "Timeline-Linie",
        timelineLineWidth: "Breite",
        timelineLineWidthDesc: "Dicke der horizontalen Achsenlinie, z. B. „4px“.",
        timelineLineColor: "Farbe",
        timelineLineColorDesc: "Farbe der horizontalen Achsenlinie.",
        timelineDividerHeading: "Trennlinie",
        timelineDividerWidth: "Breite",
        timelineDividerWidthDesc:
          "Dicke der senkrechten Trennlinie zwischen Vergangenheit und Zukunft, z. B. „1px“.",
        timelineDividerColor: "Farbe",
        timelineDividerColorDesc: "Farbe der senkrechten Trennlinie zwischen Vergangenheit und Zukunft.",
        lineStyleLabel: "Stil",
        lineStyleSolid: "Durchgängig",
        lineStyleDashed: "Gestrichelt",
        lineStyleDotted: "Gepunktet",
        timelineOptionsHeading: "Optionen",
        timelineShowFullName: "Vollständigen Namen anzeigen",
        timelineShowFullNameDesc:
          "Zeigt im Header, im Tooltip und in der aufklappbaren Liste den vollständigen Namen (Vor- und Nachname) statt nur des Vornamens an.",
        showHolidaySuffix: "Feiertagssuffix anzeigen",
        showHolidaySuffixDesc:
          "Land (und ggf. Bundesland/Region) des Feiertags in Klammern hinter dessen Namen anhängen, z. B. „Pioneer Day (US-UT)“.",
        timelineShowDate: "Datum anzeigen",
        timelineShowDateDesc:
          "Hängt am Ende das Kurzdatum in Klammern an, z. B. „... ist in 3 Tagen (6. Aug.)“. Wird am Tag selbst ausgeblendet, da der Satz direkt davor schon mit „... ist heute“ endet.",
        timelineShowTime: "Uhrzeit anzeigen",
        timelineShowTimeDesc:
          "Hängt die Uhrzeit (Zeitspanne) eines externen Kalenderereignisses in denselben Klammern an, z. B. „... ist in 3 Tagen (14:00–15:00)“. Nur bei einem zeitgebundenen (nicht ganztägigen) externen Kalenderereignis sichtbar. Das Zeitformat richtet sich nach der Sprache von Home Assistant.",
        timelineShowLocation: "Ort anzeigen",
        timelineShowLocationDesc:
          "Hängt den Ort eines externen Kalenderereignisses in denselben Klammern an. Nur sichtbar, wenn das externe Kalenderereignis einen Ort hinterlegt hat.",
        timelineShowDescription: "Beschreibung anzeigen",
        timelineShowDescriptionDesc:
          "Hängt die Beschreibung eines externen Kalenderereignisses in denselben Klammern an. Nur sichtbar, wenn das externe Kalenderereignis eine Beschreibung hinterlegt hat.",
        timelineHeaderMaxEvents: "Max. Ereignisse pro Tag",
        timelineHeaderMaxEventsDesc:
          "Begrenzt, wie viele Kopfzeilen ein einzelner Tag mit zeitgleichen Ereignissen beisteuert, z. B. 3 Geburtstage am selben Tag. Weitere Ereignisse dieses Tages bekommen trotzdem einen eigenen Punkt auf der Achse, nur keine eigene Kopfzeile mehr. Leer lassen für keine Begrenzung.",
        timelineHeaderMinEvents: "Immer N kommende anzeigen",
        timelineHeaderMinEventsDesc:
          "Zeigt immer mindestens so viele Kopfzeilen, indem bei Bedarf weitere kommende (oder, falls die aufgebraucht sind, weitere kürzlich vergangene) Tage über den nächsten hinaus einbezogen werden - jeder davon weiterhin begrenzt durch „max. Ereignisse pro Tag“ oben. Leer lassen (oder 0) zeigt nur die Ereignisse des nächsten Tages.",
        moreAction: "„Mehr“-Schaltfläche",
        moreActionDesc:
          "Was die Schaltfläche „Mehr“ unten rechts in der Timeline auslöst. Üblicherweise eine Navigations-Aktion zu einem Dashboard, das dieselben Ereignisse im vollständigen Listen-Layout zeigt. Bei „Nichts“ wird die Schaltfläche ausgeblendet.",
        groupTimeline: "Timeline",
        groupTimelineDesc: "Wird nur verwendet, wenn unter Anzeige als Kartenlayout „Timeline“ ausgewählt ist.",
        timelineHeaderLabel: "Kopfzeile",
        timelineHeaderFontDesc:
          "Schrift für die Beschreibungszeile über der Achse, z. B. „Kevins 27. Geburtstag ist heute“.",
        timelineHeaderColorDesc: "Textfarbe für die Beschreibungszeile über der Achse.",
        timelineTooltipLabel: "Tooltip",
        timelineTooltipFontDesc: "Schrift für den Text, der beim Klick auf einen Punkt der Achse erscheint.",
        timelineTooltipColorDesc: "Textfarbe für den Text, der beim Klick auf einen Punkt der Achse erscheint.",
        timelineListLabel: "Liste (Details)",
        timelineListFontDesc: "Schrift für die aufklappbare chronologische Liste unter der Achse.",
        timelineListColorDesc: "Textfarbe für die aufklappbare chronologische Liste unter der Achse.",
        timelineButtonLabel: "Details-/More-Button",
        timelineButtonFontDesc: "Schrift für die Details- und More-Buttons in der Fußzeile.",
        timelineButtonColorDesc: "Textfarbe für die Details- und More-Buttons in der Fußzeile.",
        eventTypesHeading: "Ereignistypen",
        eventTypeColorDesc: "Farbe für Icon und Punkt dieses Ereignistyps auf der Timeline.",
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
        visibilityNameDesc: "Namen des Ereignisses anzeigen",
        visibilityTypeDesc: "Ereignistyp anzeigen",
        visibilityCountrySuffix: "Feiertagssuffix",
        visibilityCountrySuffixDesc: "Land (und ggf. Bundesland/Provinz) hinter dem Namen/Typ des Feiertags anhängen, z. B. „Tag der Deutschen Einheit · DE (BY)“",
        columnsHeading: "Zeilenspalten",
        columnsDesc: "Lege fest, was jede Zeile anzeigt, und in welcher Reihenfolge. Eigene Textspalten können freien Text mit Platzhaltern kombinieren: {name}, {last_name}, {full_name}, {type}, {occurrence}, {when}, {date}, {country}, {time}, {location}, {description}.",
        columnTypeIcon: "Icon",
        columnTypeInfo: "Name + Typ",
        columnTypeName: "Name",
        columnTypeLastName: "Nachname",
        columnTypeFullName: "Vollständiger Name",
        columnTypeFullNameType: "Vollständiger Name + Typ",
        columnTypeType: "Typ",
        columnTypeText: "Freier Text",
        columnTypeDate: "Datum",
        columnTypeTime: "Uhrzeit",
        columnTypeLocation: "Ort",
        columnTypeDescription: "Beschreibung",
        columnTypeTimeDesc:
          "Hängt die eigene Uhrzeit (Zeitspanne) des externen Kalenderereignisses an, z. B. „...03:00 PM–05:00 PM“. Nur bei einem zeitgebundenen (nicht ganztägigen) externen Kalenderereignis sichtbar.",
        columnTypeLocationDesc:
          "Hängt den eigenen Ort des externen Kalenderereignisses an. Nur sichtbar, wenn beim externen Kalenderereignis ein Ort hinterlegt ist.",
        columnTypeDescriptionDesc:
          "Hängt die eigene Beschreibung des externen Kalenderereignisses an. Nur sichtbar, wenn beim externen Kalenderereignis eine Beschreibung hinterlegt ist.",
        suffixLabel: "Suffix",
        suffixGroupHolidayTitle: "Nur Feiertage",
        suffixGroupExternalTitle: "Nur externe Kalender",
        suffixShowCalendarName: "Kalendername",
        suffixShowCalendarNameDesc:
          "Zeigt hier den eigenen Namen des externen Kalenders an (z. B. „Privat“). Ausschalten, sobald Uhrzeit/Ort/Beschreibung unten für sich schon genug aussagen.",
        externalCalendarsHeading: "Externe Kalender",
        externalCalendarsDesc:
          "Binde einen oder mehrere deiner bestehenden Home-Assistant-Kalender neben den eigenen Annuals-Ereignissen ein - jedes landet an seinem tatsächlichen Tag (und bei zeitgebundenen Ereignissen sortiert nach Uhrzeit innerhalb dieses Tages) statt nach irgendeiner „nächstes Vorkommen“-Berechnung. Füge oben eine Spalte für Uhrzeit/Ort/Beschreibung hinzu, um diese Felder für solche Ereignisse anzuzeigen.",
        externalCalendarsLabel: "Kalender",
        externalCalendarsLabelDesc: "Welche calendar.*-Entitäten eingebunden werden sollen.",
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
        vipBadgeColorList: "Badge-Farbe (Liste)",
        vipBadgeColorListDesc:
          "Farbe des VIP-Sterns im Eck-Badge des Listen-Layouts, im Header des Timeline-Layouts und in dessen aufklappbarer Liste.",
        vipBadgeColorTimeline: "Badge-Farbe (Timeline)",
        vipBadgeColorTimelineDesc:
          "Farbe des VIP-Sterns speziell auf den Achsenpunkten des Timeline-Layouts. Nur sichtbar, wenn als Kartenlayout „Timeline“ ausgewählt ist.",
        importantBadgeColorList: "Badge-Farbe (Liste)",
        importantBadgeColorListDesc:
          "Farbe des Important-Ausrufezeichens im Eck-Badge des Listen-Layouts, im Header des Timeline-Layouts und in dessen aufklappbarer Liste.",
        importantBadgeColorTimeline: "Badge-Farbe (Timeline)",
        importantBadgeColorTimelineDesc:
          "Farbe des Important-Ausrufezeichens speziell auf den Achsenpunkten des Timeline-Layouts. Nur sichtbar, wenn als Kartenlayout „Timeline“ ausgewählt ist.",
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
        iconVisibleLabel: "Icon anzeigen",
        iconVisibleDesc: "Icon für diese Kategorie ein- oder ausblenden",
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
        colorName: "Name",
        colorType: "Typ",
        colorBadge: "Jubiläum",
        colorWhen: "Countdown",
        colorText: "Freier Text",
        cardTitleColorDesc: "Textfarbe für den Kartentitel",
        colorNameDesc: "Textfarbe für den Namen des Ereignisses",
        colorLastName: "Nachname",
        colorLastNameDesc: "Textfarbe für den Nachnamen des Ereignisses",
        colorFullName: "Vollständiger Name",
        colorFullNameDesc: "Textfarbe für den vollständigen Namen des Ereignisses (Vor- und Nachname)",
        colorTypeDesc: "Textfarbe für den Ereignistyp",
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
        fontNameDesc: "Schriftgröße für den Namen des Ereignisses",
        fontLastNameDesc: "Schriftgröße für den Nachnamen des Ereignisses",
        fontFullNameDesc: "Schriftgröße für den vollständigen Namen des Ereignisses (Vor- und Nachname)",
        fontTypeDesc: "Schriftgröße für den Ereignistyp",
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
        panelLayoutDesc: "Anzeige, Schriften, Farben, Icons, Kartenhintergrund und Timeline",
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
      possessive: (name) => name,
      ordinalParts: (n) => (n === 1 ? { num: "1", sup: "er" } : { num: `${n}`, sup: "e" }),
      timelineSentence: "{ordinal}{sup} {type} de {possessive} est {when}",
      timelineSentenceSimple: "{name} est {when}",
      timelineSentencePast: "{ordinal}{sup} {type} de {possessive} était {when}",
      timelineSentenceSimplePast: "{name} était {when}",
      timelineExpand: "Détails",
      timelineCollapse: "Réduire",
      timelineMore: "Plus",
      types: {
        birthday: "Anniversaire",
        anniversary: "Date commémorative",
        name_day: "Fête",
        wedding_anniversary: "Anniversaire de mariage",
        memorial: "Commémoration",
        pet_birthday: "Anniversaire d'animal",
        work_anniversary: "Anniversaire professionnel",
        custom: "Personnalisé",
        one_time: "Événement ponctuel",
        holiday: "Jour férié",
        calendar: "Événement de calendrier",
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
        one_time: "Événements ponctuels",
        holiday: "Jours fériés",
        calendar: "Événements de calendrier",
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
        layoutStyleLabel: "Style de mise en page",
        layoutStyleDesc:
          "Liste affiche les lignes classiques icône/nom/sous-titre/badge/compte à rebours. Timeline affiche un axe horizontal compact avec le prochain événement mis en évidence et les autres sous forme de points cliquables - pratique pour une colonne étroite en vue Sections.",
        layoutStyleList: "Liste",
        layoutStyleTimeline: "Timeline",
        timelineLineHeading: "Ligne de la timeline",
        timelineLineWidth: "Épaisseur",
        timelineLineWidthDesc: "Épaisseur de la ligne horizontale de l'axe, par ex. « 4px ».",
        timelineLineColor: "Couleur",
        timelineLineColorDesc: "Couleur de la ligne horizontale de l'axe.",
        timelineDividerHeading: "Ligne de séparation",
        timelineDividerWidth: "Épaisseur",
        timelineDividerWidthDesc:
          "Épaisseur de la ligne verticale marquant la limite entre passé et futur, par ex. « 1px ».",
        timelineDividerColor: "Couleur",
        timelineDividerColorDesc: "Couleur de la ligne verticale de séparation passé/futur.",
        lineStyleLabel: "Style",
        lineStyleSolid: "Continu",
        lineStyleDashed: "Tirets",
        lineStyleDotted: "Pointillés",
        timelineOptionsHeading: "Options",
        timelineShowFullName: "Afficher le nom complet",
        timelineShowFullNameDesc:
          "Affiche le nom complet (prénom et nom) de chaque événement au lieu du seul prénom, dans l'en-tête, l'infobulle et la liste déroulante.",
        showHolidaySuffix: "Afficher le suffixe du jour férié",
        showHolidaySuffixDesc:
          "Ajouter le pays du jour férié (et la subdivision, le cas échéant) entre parenthèses après son nom, par ex. « Pioneer Day (US-UT) ».",
        timelineShowDate: "Afficher la date",
        timelineShowDateDesc:
          "Ajoute la date courte entre parenthèses à la fin, par ex. « ... est dans 3 jours (6 août) ». Masquée le jour même, la phrase se terminant déjà juste avant par « ... est aujourd'hui ».",
        timelineShowTime: "Afficher l'heure",
        timelineShowTimeDesc:
          "Ajoute la plage horaire propre à un événement de calendrier externe dans les mêmes parenthèses, par ex. « ... est dans 3 jours (14:00–15:00) ». Affiché uniquement pour un événement de calendrier externe à heure fixe (non journée entière). Le format de l'heure suit la langue de Home Assistant.",
        timelineShowLocation: "Afficher le lieu",
        timelineShowLocationDesc:
          "Ajoute le lieu propre à un événement de calendrier externe dans les mêmes parenthèses. Affiché uniquement pour un événement de calendrier externe ayant un lieu défini.",
        timelineShowDescription: "Afficher la description",
        timelineShowDescriptionDesc:
          "Ajoute la description propre à un événement de calendrier externe dans les mêmes parenthèses. Affiché uniquement pour un événement de calendrier externe ayant une description définie.",
        timelineHeaderMaxEvents: "Max. événements par jour",
        timelineHeaderMaxEventsDesc:
          "Limite le nombre de lignes d'en-tête qu'un seul jour avec des événements simultanés peut fournir, par ex. 3 anniversaires le même jour. Les événements supplémentaires de ce jour reçoivent quand même leur propre point sur l'axe, mais sans ligne d'en-tête. Laissez vide pour aucune limite.",
        timelineHeaderMinEvents: "Toujours afficher N événements à venir",
        timelineHeaderMinEventsDesc:
          "Affiche toujours au moins ce nombre de lignes d'en-tête, en incluant si nécessaire d'autres jours à venir (ou, une fois ceux-ci épuisés, d'autres jours récents passés) au-delà du tout prochain - chacun restant limité par « max. événements par jour » ci-dessus. Laissez vide (ou 0) pour n'afficher que les événements du tout prochain jour.",
        moreAction: "Bouton « Plus »",
        moreActionDesc:
          "Ce que fait le bouton « Plus » en bas à droite de la timeline. Généralement une action de navigation vers un tableau de bord affichant les mêmes événements dans le layout Liste complet. Laissez sur « Rien » pour masquer le bouton.",
        groupTimeline: "Timeline",
        groupTimelineDesc: "Utilisé uniquement lorsque le style de mise en page (sous Affichage) est réglé sur Timeline.",
        timelineHeaderLabel: "En-tête",
        timelineHeaderFontDesc:
          "Police pour la ligne de description au-dessus de l'axe, par ex. « L'anniversaire de Kevin est aujourd'hui ».",
        timelineHeaderColorDesc: "Couleur du texte pour la ligne de description au-dessus de l'axe.",
        timelineTooltipLabel: "Infobulle",
        timelineTooltipFontDesc: "Police pour le texte affiché lorsqu'un point de l'axe est cliqué.",
        timelineTooltipColorDesc: "Couleur du texte affiché lorsqu'un point de l'axe est cliqué.",
        timelineListLabel: "Liste (Détails)",
        timelineListFontDesc: "Police pour la liste chronologique dépliable sous l'axe.",
        timelineListColorDesc: "Couleur du texte pour la liste chronologique dépliable sous l'axe.",
        timelineButtonLabel: "Bouton Détails / Plus",
        timelineButtonFontDesc: "Police pour les boutons Détails et Plus du pied de carte.",
        timelineButtonColorDesc: "Couleur du texte pour les boutons Détails et Plus du pied de carte.",
        eventTypesHeading: "Types d'événements",
        eventTypeColorDesc: "Couleur utilisée pour l'icône et le point de ce type d'événement sur la chronologie.",
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
        visibilityNameDesc: "Afficher le nom de l'événement",
        visibilityTypeDesc: "Afficher le type d'événement",
        visibilityCountrySuffix: "Suffixe du jour férié",
        visibilityCountrySuffixDesc: "Ajouter le pays (et la subdivision, le cas échéant) après le nom/type du jour férié, par ex. « Fête nationale · FR (75) »",
        columnsHeading: "Colonnes de ligne",
        columnsDesc: "Ajoutez, supprimez et réorganisez ce que chaque ligne affiche. Les colonnes de texte libre peuvent combiner du texte libre avec des espaces réservés : {name}, {last_name}, {full_name}, {type}, {occurrence}, {when}, {date}, {country}, {time}, {location}, {description}.",
        columnTypeIcon: "Icône",
        columnTypeInfo: "Nom + type",
        columnTypeName: "Nom",
        columnTypeLastName: "Nom de famille",
        columnTypeFullName: "Nom complet",
        columnTypeFullNameType: "Nom complet + type",
        columnTypeType: "Type",
        columnTypeText: "Texte libre",
        columnTypeDate: "Date",
        columnTypeTime: "Heure",
        columnTypeLocation: "Lieu",
        columnTypeDescription: "Description",
        columnTypeTimeDesc:
          "Ajoute la propre plage horaire de l'événement du calendrier externe, par ex. « ...15:00–17:00 ». Affiché uniquement pour un événement de calendrier externe avec horaire (non journée entière).",
        columnTypeLocationDesc:
          "Ajoute le propre lieu de l'événement du calendrier externe. Affiché uniquement si l'événement du calendrier externe en a un défini.",
        columnTypeDescriptionDesc:
          "Ajoute la propre description de l'événement du calendrier externe. Affiché uniquement si l'événement du calendrier externe en a une définie.",
        suffixLabel: "Suffixe",
        suffixGroupHolidayTitle: "Jours fériés uniquement",
        suffixGroupExternalTitle: "Calendriers externes uniquement",
        suffixShowCalendarName: "Nom du calendrier",
        suffixShowCalendarNameDesc:
          "Affiche ici le propre nom du calendrier externe (par ex. « Personnel »). Désactivez une fois que Heure/Lieu/Description ci-dessous en disent déjà assez.",
        externalCalendarsHeading: "Calendriers externes",
        externalCalendarsDesc:
          "Intégrez un ou plusieurs de vos calendriers Home Assistant existants aux côtés des propres événements d'Annuals - chacun apparaît à sa date réelle (et, pour les événements à heure fixe, trié par heure au sein de cette date) plutôt que selon un calcul de « prochaine occurrence ». Ajoutez une colonne Heure/Lieu/Description ci-dessus pour afficher ces champs pour ces événements.",
        externalCalendarsLabel: "Calendriers",
        externalCalendarsLabelDesc: "Quelles entités calendar.* intégrer.",
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
        vipBadgeColorList: "Couleur du badge (Liste)",
        vipBadgeColorListDesc:
          "Couleur du badge étoile VIP dans le badge d'angle du layout Liste, dans l'en-tête du layout Timeline, et dans sa liste Détails dépliable.",
        vipBadgeColorTimeline: "Couleur du badge (Timeline)",
        vipBadgeColorTimelineDesc:
          "Couleur de l'icône étoile VIP spécifiquement sur les points de l'axe du layout Timeline. Affiché uniquement lorsque le style de mise en page est réglé sur Timeline.",
        importantBadgeColorList: "Couleur du badge (Liste)",
        importantBadgeColorListDesc:
          "Couleur du badge point d'exclamation Important dans le badge d'angle du layout Liste, dans l'en-tête du layout Timeline, et dans sa liste Détails dépliable.",
        importantBadgeColorTimeline: "Couleur du badge (Timeline)",
        importantBadgeColorTimelineDesc:
          "Couleur de l'icône point d'exclamation Important spécifiquement sur les points de l'axe du layout Timeline. Affiché uniquement lorsque le style de mise en page est réglé sur Timeline.",
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
        iconVisibleLabel: "Afficher l'icône",
        iconVisibleDesc: "Afficher ou masquer l'icône pour cette catégorie",
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
        colorName: "Nom",
        colorType: "Type",
        colorBadge: "Occurrence",
        colorWhen: "Compte à rebours",
        colorText: "Texte libre",
        cardTitleColorDesc: "Couleur du texte pour le titre propre de la carte",
        colorNameDesc: "Couleur du texte pour le nom de l'événement",
        colorLastName: "Nom de famille",
        colorLastNameDesc: "Couleur du texte pour le nom de famille de l'événement",
        colorFullName: "Nom complet",
        colorFullNameDesc: "Couleur du texte pour le nom complet de l'événement (prénom et nom)",
        colorTypeDesc: "Couleur du texte pour le type d'événement",
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
        fontNameDesc: "Taille de police pour le nom de l'événement",
        fontLastNameDesc: "Taille de police pour le nom de famille de l'événement",
        fontFullNameDesc: "Taille de police pour le nom complet de l'événement (prénom et nom)",
        fontTypeDesc: "Taille de police pour le type d'événement",
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
        panelLayoutDesc: "Affichage, polices, couleurs, icônes, fond de carte et timeline",
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
      possessive: (name) => (/[sxz]$/i.test(name) ? `${name}'` : `${name}s`),
      ordinalParts: (n) => ({ num: `${n}e`, sup: "" }),
      timelineSentence: "{possessive} {ordinal}{sup} {type} is {when}",
      timelineSentenceSimple: "{name} is {when}",
      timelineSentencePast: "{possessive} {ordinal}{sup} {type} was {when}",
      timelineSentenceSimplePast: "{name} was {when}",
      timelineExpand: "Details",
      timelineCollapse: "Minder",
      timelineMore: "Meer",
      types: {
        birthday: "Verjaardag",
        anniversary: "Jaardag",
        name_day: "Naamdag",
        wedding_anniversary: "Trouwdag",
        memorial: "Sterfdag",
        pet_birthday: "Verjaardag huisdier",
        work_anniversary: "Werkjubileum",
        custom: "Aangepast",
        one_time: "Eenmalig evenement",
        holiday: "Feestdag",
        calendar: "Kalendergebeurtenis",
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
        one_time: "Eenmalige evenementen",
        holiday: "Feestdagen",
        calendar: "Kalendergebeurtenissen",
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
        layoutStyleLabel: "Kaartlayout",
        layoutStyleDesc:
          "Lijst toont de klassieke rijen met icoon/naam/subtitel/badge/aftellen. Timeline toont een compacte horizontale as met het eerstvolgende evenement uitgelicht en de rest als klikbare punten - handig voor een smalle kolom in de Sections-weergave.",
        layoutStyleList: "Lijst",
        layoutStyleTimeline: "Timeline",
        timelineLineHeading: "Timeline-lijn",
        timelineLineWidth: "Dikte",
        timelineLineWidthDesc: "Dikte van de horizontale aslijn, bijv. „4px”.",
        timelineLineColor: "Kleur",
        timelineLineColorDesc: "Kleur van de horizontale aslijn.",
        timelineDividerHeading: "Scheidingslijn",
        timelineDividerWidth: "Dikte",
        timelineDividerWidthDesc:
          "Dikte van de verticale scheidingslijn tussen verleden en toekomst, bijv. „1px”.",
        timelineDividerColor: "Kleur",
        timelineDividerColorDesc: "Kleur van de verticale scheidingslijn tussen verleden en toekomst.",
        lineStyleLabel: "Stijl",
        lineStyleSolid: "Doorlopend",
        lineStyleDashed: "Gestreept",
        lineStyleDotted: "Gestippeld",
        timelineOptionsHeading: "Opties",
        timelineShowFullName: "Volledige naam tonen",
        timelineShowFullNameDesc:
          "Toont in de header, tooltip en uitklapbare lijst de volledige naam (voor- en achternaam) in plaats van alleen de voornaam.",
        showHolidaySuffix: "Feestdagsuffix tonen",
        showHolidaySuffixDesc:
          "Voeg het land (en eventueel de deelstaat/provincie) van de feestdag tussen haakjes toe na de naam, bijv. „Pioneer Day (US-UT)”.",
        timelineShowDate: "Datum tonen",
        timelineShowDateDesc:
          "Voegt aan het einde de korte datum tussen haakjes toe, bijv. „... is over 3 dagen (6 aug)”. Verborgen op de dag zelf, omdat de zin daar al eindigt met „... is vandaag”.",
        timelineShowTime: "Tijd tonen",
        timelineShowTimeDesc:
          "Voegt de eigen tijdspanne van een extern kalenderevenement toe in dezelfde haakjes, bijv. „... is over 3 dagen (14:00–15:00)”. Alleen getoond voor een extern kalenderevenement met een vaste tijd (niet de hele dag). De tijdnotatie volgt de taal van Home Assistant.",
        timelineShowLocation: "Locatie tonen",
        timelineShowLocationDesc:
          "Voegt de eigen locatie van een extern kalenderevenement toe in dezelfde haakjes. Alleen getoond voor een extern kalenderevenement met een ingestelde locatie.",
        timelineShowDescription: "Beschrijving tonen",
        timelineShowDescriptionDesc:
          "Voegt de eigen beschrijving van een extern kalenderevenement toe in dezelfde haakjes. Alleen getoond voor een extern kalenderevenement met een ingestelde beschrijving.",
        timelineHeaderMaxEvents: "Max. evenementen per dag",
        timelineHeaderMaxEventsDesc:
          "Beperkt hoeveel kopregels één dag met gelijktijdige evenementen bijdraagt, bijv. 3 verjaardagen op dezelfde dag. Extra evenementen van die dag krijgen nog steeds hun eigen punt op de as, maar zonder eigen kopregel. Laat leeg voor geen limiet.",
        timelineHeaderMinEvents: "Altijd N komende tonen",
        timelineHeaderMinEventsDesc:
          "Toont altijd minstens dit aantal kopregels, door indien nodig verdere komende (of, zodra die op zijn, verdere recent verstreken) dagen naast de eerstvolgende erbij te betrekken - elk nog steeds beperkt door „max. evenementen per dag” hierboven. Laat leeg (of 0) om alleen de evenementen van de eerstvolgende dag te tonen.",
        moreAction: "„Meer”-knop",
        moreActionDesc:
          "Wat de „Meer”-knop rechtsonder in de timeline doet. Meestal een navigatie-actie naar een dashboard dat dezelfde evenementen in het volledige Lijst-layout toont. Laat op „Niets” staan om de knop te verbergen.",
        groupTimeline: "Timeline",
        groupTimelineDesc: "Wordt alleen gebruikt wanneer Kaartlayout (onder Weergave) is ingesteld op Timeline.",
        timelineHeaderLabel: "Kop",
        timelineHeaderFontDesc:
          "Lettertype voor de beschrijvingsregel boven de as, bijv. „Kevins verjaardag is vandaag”.",
        timelineHeaderColorDesc: "Tekstkleur voor de beschrijvingsregel boven de as.",
        timelineTooltipLabel: "Tooltip",
        timelineTooltipFontDesc: "Lettertype voor de tekst die wordt getoond wanneer op een punt op de as wordt geklikt.",
        timelineTooltipColorDesc: "Tekstkleur voor de tekst die wordt getoond wanneer op een punt op de as wordt geklikt.",
        timelineListLabel: "Lijst (Details)",
        timelineListFontDesc: "Lettertype voor de uitklapbare chronologische lijst onder de as.",
        timelineListColorDesc: "Tekstkleur voor de uitklapbare chronologische lijst onder de as.",
        timelineButtonLabel: "Details-/Meer-knop",
        timelineButtonFontDesc: "Lettertype voor de Details- en Meer-knoppen in de voettekst.",
        timelineButtonColorDesc: "Tekstkleur voor de Details- en Meer-knoppen in de voettekst.",
        eventTypesHeading: "Gebeurtenistypen",
        eventTypeColorDesc: "Kleur voor het icoon en de stip van dit gebeurtenistype op de tijdlijn.",
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
        visibilityNameDesc: "Toon de naam van het evenement",
        visibilityTypeDesc: "Toon het evenementtype",
        visibilityCountrySuffix: "Feestdagsuffix",
        visibilityCountrySuffixDesc: "Voeg het land (en eventueel de deelstaat/provincie) toe na de naam/type van de feestdag, bijv. „Bevrijdingsdag · NL (NH)”",
        columnsHeading: "Rijkolommen",
        columnsDesc: "Voeg toe, verwijder en herschik wat elke rij toont. Eigen tekstkolommen kunnen vrije tekst combineren met plaatshouders: {name}, {last_name}, {full_name}, {type}, {occurrence}, {when}, {date}, {country}, {time}, {location}, {description}.",
        columnTypeIcon: "Icoon",
        columnTypeInfo: "Naam + type",
        columnTypeName: "Naam",
        columnTypeLastName: "Achternaam",
        columnTypeFullName: "Volledige naam",
        columnTypeFullNameType: "Volledige naam + type",
        columnTypeType: "Type",
        columnTypeText: "Eigen tekst",
        columnTypeDate: "Datum",
        columnTypeTime: "Tijd",
        columnTypeLocation: "Locatie",
        columnTypeDescription: "Beschrijving",
        columnTypeTimeDesc:
          "Voegt het eigen tijdsbereik van de externe agenda-afspraak toe, bijv. „...15:00–17:00”. Wordt alleen getoond voor een afspraak met vaste tijd (niet de hele dag) in een externe agenda.",
        columnTypeLocationDesc:
          "Voegt de eigen locatie van de externe agenda-afspraak toe. Wordt alleen getoond als de externe agenda-afspraak er een heeft ingesteld.",
        columnTypeDescriptionDesc:
          "Voegt de eigen beschrijving van de externe agenda-afspraak toe. Wordt alleen getoond als de externe agenda-afspraak er een heeft ingesteld.",
        suffixLabel: "Suffix",
        suffixGroupHolidayTitle: "Alleen feestdagen",
        suffixGroupExternalTitle: "Alleen externe kalenders",
        suffixShowCalendarName: "Kalendernaam",
        suffixShowCalendarNameDesc:
          "Toont hier de eigen naam van de externe kalender (bijv. „Privé”). Zet dit uit zodra Tijd/Locatie/Beschrijving hieronder al genoeg zeggen.",
        externalCalendarsHeading: "Externe kalenders",
        externalCalendarsDesc:
          "Neem een of meer van je bestaande Home Assistant-kalenders op naast de eigen evenementen van Annuals - elk komt op zijn werkelijke dag terecht (en, voor evenementen met een vaste tijd, gesorteerd op tijdstip binnen die dag) in plaats van enige „eerstvolgende gebeurtenis”-berekening. Voeg hierboven een kolom Tijd/Locatie/Beschrijving toe om deze velden voor deze evenementen te tonen.",
        externalCalendarsLabel: "Kalenders",
        externalCalendarsLabelDesc: "Welke calendar.*-entiteiten moeten worden opgenomen.",
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
        vipBadgeColorList: "Badgekleur (Lijst)",
        vipBadgeColorListDesc:
          "Kleur van het VIP-sterbadge in het hoekbadge van het Lijst-layout, in de kop van het Timeline-layout, en in de uitklapbare Details-lijst.",
        vipBadgeColorTimeline: "Badgekleur (Timeline)",
        vipBadgeColorTimelineDesc:
          "Kleur van het VIP-stericoon specifiek op de aspunten van het Timeline-layout. Alleen zichtbaar wanneer Kaartlayout is ingesteld op Timeline.",
        importantBadgeColorList: "Badgekleur (Lijst)",
        importantBadgeColorListDesc:
          "Kleur van het Important-uitroeptekenbadge in het hoekbadge van het Lijst-layout, in de kop van het Timeline-layout, en in de uitklapbare Details-lijst.",
        importantBadgeColorTimeline: "Badgekleur (Timeline)",
        importantBadgeColorTimelineDesc:
          "Kleur van het Important-uitroepteken-icoon specifiek op de aspunten van het Timeline-layout. Alleen zichtbaar wanneer Kaartlayout is ingesteld op Timeline.",
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
        iconVisibleLabel: "Icoon weergeven",
        iconVisibleDesc: "Icoon voor deze categorie tonen of verbergen",
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
        colorName: "Naam",
        colorType: "Type",
        colorBadge: "Jubileum",
        colorWhen: "Aftellen",
        colorText: "Eigen tekst",
        cardTitleColorDesc: "Tekstkleur voor de eigen titel van de kaart",
        colorNameDesc: "Tekstkleur voor de naam van het evenement",
        colorLastName: "Achternaam",
        colorLastNameDesc: "Tekstkleur voor de achternaam van het evenement",
        colorFullName: "Volledige naam",
        colorFullNameDesc: "Tekstkleur voor de volledige naam van het evenement (voor- en achternaam)",
        colorTypeDesc: "Tekstkleur voor het evenementtype",
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
        fontNameDesc: "Lettergrootte voor de naam van het evenement",
        fontLastNameDesc: "Lettergrootte voor de achternaam van het evenement",
        fontFullNameDesc: "Lettergrootte voor de volledige naam van het evenement (voor- en achternaam)",
        fontTypeDesc: "Lettergrootte voor het evenementtype",
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
        panelLayoutDesc: "Weergave, lettertypen, kleuren, iconen, kaartachtergrond en timeline",
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
      // Polska odmiana przez przypadki nie daje się bezpiecznie zastosować do
      // dowolnie wpisanych imion, dlatego zamiast dopasowywać przypadek,
      // zdanie budowane jest w formie neutralnej "Imię: N. typ — kiedy" -
      // ta sama forma działa dla wydarzeń przeszłych i przyszłych, ponieważ
      // to samo "kiedy" (np. "wczoraj"/"za 3 dni") już niesie informację o
      // czasie.
      possessive: (name) => name,
      ordinalParts: (n) => ({ num: `${n}.`, sup: "" }),
      timelineSentence: "{possessive}: {ordinal}{sup} {type} — {when}",
      timelineSentenceSimple: "{name} — {when}",
      timelineSentencePast: "{possessive}: {ordinal}{sup} {type} — {when}",
      timelineSentenceSimplePast: "{name} — {when}",
      timelineExpand: "Szczegóły",
      timelineCollapse: "Mniej",
      timelineMore: "Więcej",
      types: {
        birthday: "Urodziny",
        anniversary: "Rocznica",
        name_day: "Imieniny",
        wedding_anniversary: "Rocznica ślubu",
        memorial: "Rocznica śmierci",
        pet_birthday: "Urodziny zwierzaka",
        work_anniversary: "Jubileusz pracy",
        custom: "Inne",
        one_time: "Wydarzenie jednorazowe",
        holiday: "Święto",
        calendar: "Wydarzenie z kalendarza",
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
        one_time: "Wydarzenia jednorazowe",
        holiday: "Święta",
        calendar: "Wydarzenia z kalendarza",
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
        layoutStyleLabel: "Układ karty",
        layoutStyleDesc:
          "Lista pokazuje klasyczne wiersze ikona/nazwa/podtytuł/odznaka/odliczanie. Timeline pokazuje kompaktową poziomą oś z wyróżnionym najbliższym wydarzeniem, a resztą jako klikalne punkty - przydatne w wąskiej kolumnie widoku Sekcje.",
        layoutStyleList: "Lista",
        layoutStyleTimeline: "Timeline",
        timelineLineHeading: "Linia osi czasu",
        timelineLineWidth: "Grubość",
        timelineLineWidthDesc: "Grubość poziomej linii osi, np. „4px”.",
        timelineLineColor: "Kolor",
        timelineLineColorDesc: "Kolor poziomej linii osi.",
        timelineDividerHeading: "Linia rozdzielająca",
        timelineDividerWidth: "Grubość",
        timelineDividerWidthDesc:
          "Grubość pionowej linii oddzielającej przeszłość od przyszłości, np. „1px”.",
        timelineDividerColor: "Kolor",
        timelineDividerColorDesc: "Kolor pionowej linii oddzielającej przeszłość od przyszłości.",
        lineStyleLabel: "Styl",
        lineStyleSolid: "Ciągła",
        lineStyleDashed: "Przerywana",
        lineStyleDotted: "Kropkowana",
        timelineOptionsHeading: "Opcje",
        timelineShowFullName: "Pokaż pełne imię i nazwisko",
        timelineShowFullNameDesc:
          "Pokazuje pełne imię i nazwisko każdego wydarzenia zamiast samego imienia, w nagłówku, dymku i rozwijanej liście.",
        showHolidaySuffix: "Pokaż sufiks święta",
        showHolidaySuffixDesc:
          "Dodaj kraj święta (i region, jeśli występuje) w nawiasie po jego nazwie, np. „Pioneer Day (US-UT)”.",
        timelineShowDate: "Pokaż datę",
        timelineShowDateDesc:
          "Dodaje na końcu krótką datę w nawiasie, np. „... jest za 3 dni (6 sie)”. Ukryte w dniu wydarzenia, ponieważ zdanie kończy się wtedy już słowami „... jest dzisiaj”.",
        timelineShowTime: "Pokaż godzinę",
        timelineShowTimeDesc:
          "Dodaje w tym samym nawiasie zakres godzin własny zewnętrznego wydarzenia z kalendarza, np. „... jest za 3 dni (14:00–15:00)”. Pokazywane tylko dla zewnętrznego wydarzenia z kalendarza o określonej godzinie (nie całodniowego). Format godziny zależy od języka Home Assistant.",
        timelineShowLocation: "Pokaż lokalizację",
        timelineShowLocationDesc:
          "Dodaje w tym samym nawiasie lokalizację własną zewnętrznego wydarzenia z kalendarza. Pokazywane tylko dla zewnętrznego wydarzenia z kalendarza, które ma ustawioną lokalizację.",
        timelineShowDescription: "Pokaż opis",
        timelineShowDescriptionDesc:
          "Dodaje w tym samym nawiasie opis własny zewnętrznego wydarzenia z kalendarza. Pokazywane tylko dla zewnętrznego wydarzenia z kalendarza, które ma ustawiony opis.",
        timelineHeaderMaxEvents: "Maks. wydarzeń dziennie",
        timelineHeaderMaxEventsDesc:
          "Ogranicza, ile linii nagłówka może dostarczyć jeden dzień z jednoczesnymi wydarzeniami, np. 3 urodziny tego samego dnia. Dodatkowe wydarzenia tego dnia nadal otrzymują własną kropkę na osi, tylko bez własnej linii nagłówka. Pozostaw puste, aby nie ustawiać limitu.",
        timelineHeaderMinEvents: "Zawsze pokazuj N nadchodzących",
        timelineHeaderMinEventsDesc:
          "Zawsze pokazuje co najmniej tyle linii nagłówka, w razie potrzeby uwzględniając kolejne nadchodzące (lub, gdy te się skończą, kolejne niedawno minione) dni poza najbliższym - każdy nadal ograniczony przez „maks. wydarzeń dziennie” powyżej. Pozostaw puste (lub 0), aby pokazywać tylko wydarzenia najbliższego dnia.",
        moreAction: "Przycisk „Więcej”",
        moreActionDesc:
          "Co robi przycisk „Więcej” w prawym dolnym rogu osi czasu. Zwykle akcja nawigacji do pulpitu pokazującego te same wydarzenia w pełnym układzie Lista. Pozostaw „Nic”, aby ukryć przycisk.",
        groupTimeline: "Timeline",
        groupTimelineDesc: "Używane tylko wtedy, gdy Układ karty (w sekcji Wyświetlanie) jest ustawiony na Timeline.",
        timelineHeaderLabel: "Nagłówek",
        timelineHeaderFontDesc:
          "Czcionka dla linii opisu nad osią, np. „Kevin: 27. urodziny — dzisiaj”.",
        timelineHeaderColorDesc: "Kolor tekstu dla linii opisu nad osią.",
        timelineTooltipLabel: "Dymek",
        timelineTooltipFontDesc: "Czcionka dla tekstu wyświetlanego po kliknięciu punktu na osi.",
        timelineTooltipColorDesc: "Kolor tekstu wyświetlanego po kliknięciu punktu na osi.",
        timelineListLabel: "Lista (Szczegóły)",
        timelineListFontDesc: "Czcionka dla rozwijanej chronologicznej listy pod osią.",
        timelineListColorDesc: "Kolor tekstu rozwijanej chronologicznej listy pod osią.",
        timelineButtonLabel: "Przycisk Szczegóły / Więcej",
        timelineButtonFontDesc: "Czcionka przycisków Szczegóły i Więcej w stopce.",
        timelineButtonColorDesc: "Kolor tekstu przycisków Szczegóły i Więcej w stopce.",
        eventTypesHeading: "Typy wydarzeń",
        eventTypeColorDesc: "Kolor ikony i kropki tego typu wydarzenia na osi czasu.",
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
        visibilityNameDesc: "Pokaż nazwę wydarzenia",
        visibilityTypeDesc: "Pokaż typ wydarzenia",
        visibilityCountrySuffix: "Sufiks święta",
        visibilityCountrySuffixDesc: "Dodaj kraj (i ewentualnie region) po nazwie/typie święta, np. „Święto Niepodległości · PL (MAZ)”",
        columnsHeading: "Kolumny wiersza",
        columnsDesc: "Dodawaj, usuwaj i zmieniaj kolejność tego, co pokazuje każdy wiersz. Kolumny własnego tekstu mogą łączyć dowolny tekst z symbolami zastępczymi: {name}, {last_name}, {full_name}, {type}, {occurrence}, {when}, {date}, {country}, {time}, {location}, {description}.",
        columnTypeIcon: "Ikona",
        columnTypeInfo: "Nazwa + typ",
        columnTypeName: "Nazwa",
        columnTypeLastName: "Nazwisko",
        columnTypeFullName: "Pełne imię i nazwisko",
        columnTypeFullNameType: "Pełne imię i nazwisko + typ",
        columnTypeType: "Typ",
        columnTypeText: "Własny tekst",
        columnTypeDate: "Data",
        columnTypeTime: "Godzina",
        columnTypeLocation: "Lokalizacja",
        columnTypeDescription: "Opis",
        columnTypeTimeDesc:
          "Dodaje własny zakres czasu wydarzenia z kalendarza zewnętrznego, np. „...15:00–17:00”. Widoczne tylko dla wydarzenia z określoną godziną (nie całodniowego) w kalendarzu zewnętrznym.",
        columnTypeLocationDesc:
          "Dodaje własną lokalizację wydarzenia z kalendarza zewnętrznego. Widoczne tylko, gdy wydarzenie w kalendarzu zewnętrznym ma ustawioną lokalizację.",
        columnTypeDescriptionDesc:
          "Dodaje własny opis wydarzenia z kalendarza zewnętrznego. Widoczne tylko, gdy wydarzenie w kalendarzu zewnętrznym ma ustawiony opis.",
        suffixLabel: "Sufiks",
        suffixGroupHolidayTitle: "Tylko święta",
        suffixGroupExternalTitle: "Tylko kalendarze zewnętrzne",
        suffixShowCalendarName: "Nazwa kalendarza",
        suffixShowCalendarNameDesc:
          "Pokazuje tutaj własną nazwę kalendarza zewnętrznego (np. „Prywatny”). Wyłącz, gdy Godzina/Lokalizacja/Opis poniżej mówią już wystarczająco dużo.",
        externalCalendarsHeading: "Kalendarze zewnętrzne",
        externalCalendarsDesc:
          "Osadź jeden lub więcej istniejących kalendarzy Home Assistant obok własnych wydarzeń Annuals - każde z nich trafia na swój rzeczywisty dzień (a wydarzenia z określoną godziną są w obrębie tego dnia sortowane według pory dnia) zamiast być obliczane według logiki „następnego wystąpienia”. Dodaj powyżej kolumnę Godzina/Lokalizacja/Opis, aby pokazać te pola dla tych wydarzeń.",
        externalCalendarsLabel: "Kalendarze",
        externalCalendarsLabelDesc: "Które encje calendar.* osadzić.",
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
        vipBadgeColorList: "Kolor odznaki (Lista)",
        vipBadgeColorListDesc:
          "Kolor odznaki gwiazdki VIP w odznace narożnej układu Lista, w nagłówku układu Timeline i na jego rozwijanej liście Szczegóły.",
        vipBadgeColorTimeline: "Kolor odznaki (Timeline)",
        vipBadgeColorTimelineDesc:
          "Kolor ikony gwiazdki VIP konkretnie na punktach osi układu Timeline. Widoczne tylko, gdy Układ karty jest ustawiony na Timeline.",
        importantBadgeColorList: "Kolor odznaki (Lista)",
        importantBadgeColorListDesc:
          "Kolor odznaki wykrzyknika Important w odznace narożnej układu Lista, w nagłówku układu Timeline i na jego rozwijanej liście Szczegóły.",
        importantBadgeColorTimeline: "Kolor odznaki (Timeline)",
        importantBadgeColorTimelineDesc:
          "Kolor ikony wykrzyknika Important konkretnie na punktach osi układu Timeline. Widoczne tylko, gdy Układ karty jest ustawiony na Timeline.",
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
        iconVisibleLabel: "Pokaż ikonę",
        iconVisibleDesc: "Pokaż lub ukryj ikonę dla tej kategorii",
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
        colorName: "Nazwa",
        colorType: "Typ",
        colorBadge: "Wystąpienie",
        colorWhen: "Odliczanie",
        colorText: "Własny tekst",
        cardTitleColorDesc: "Kolor tekstu dla własnego tytułu karty",
        colorNameDesc: "Kolor tekstu dla nazwy wydarzenia",
        colorLastName: "Nazwisko",
        colorLastNameDesc: "Kolor tekstu dla nazwiska wydarzenia",
        colorFullName: "Pełne imię i nazwisko",
        colorFullNameDesc: "Kolor tekstu dla pełnego imienia i nazwiska wydarzenia",
        colorTypeDesc: "Kolor tekstu dla typu wydarzenia",
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
        fontNameDesc: "Rozmiar czcionki dla nazwy wydarzenia",
        fontLastNameDesc: "Rozmiar czcionki dla nazwiska wydarzenia",
        fontFullNameDesc: "Rozmiar czcionki dla pełnego imienia i nazwiska wydarzenia",
        fontTypeDesc: "Rozmiar czcionki dla typu wydarzenia",
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
        panelLayoutDesc: "Wyświetlanie, czcionki, kolory, ikony, tło karty i timeline",
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
      possessive: (name) => name,
      ordinalParts: (n) => ({ num: `${n}º`, sup: "" }),
      timelineSentence: "{ordinal}{sup} {type} de {possessive} es {when}",
      timelineSentenceSimple: "{name} es {when}",
      timelineSentencePast: "{ordinal}{sup} {type} de {possessive} fue {when}",
      timelineSentenceSimplePast: "{name} fue {when}",
      timelineExpand: "Detalles",
      timelineCollapse: "Menos",
      timelineMore: "Más",
      types: {
        birthday: "Cumpleaños",
        anniversary: "Aniversario",
        name_day: "Onomástica",
        wedding_anniversary: "Aniversario de boda",
        memorial: "Aniversario de fallecimiento",
        pet_birthday: "Cumpleaños de mascota",
        work_anniversary: "Aniversario laboral",
        custom: "Personalizado",
        one_time: "Evento puntual",
        holiday: "Festivo",
        calendar: "Evento de calendario",
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
        one_time: "Eventos puntuales",
        holiday: "Festivos",
        calendar: "Eventos de calendario",
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
        layoutStyleLabel: "Estilo de diseño",
        layoutStyleDesc:
          "Lista muestra las filas clásicas de icono/nombre/subtítulo/insignia/cuenta atrás. Timeline muestra un eje horizontal compacto con el próximo evento resaltado y el resto como puntos pulsables - útil para una columna estrecha en la vista Secciones.",
        layoutStyleList: "Lista",
        layoutStyleTimeline: "Timeline",
        timelineLineHeading: "Línea de la timeline",
        timelineLineWidth: "Grosor",
        timelineLineWidthDesc: "Grosor de la línea horizontal del eje, p. ej. «4px».",
        timelineLineColor: "Color",
        timelineLineColorDesc: "Color de la línea horizontal del eje.",
        timelineDividerHeading: "Línea divisoria",
        timelineDividerWidth: "Grosor",
        timelineDividerWidthDesc:
          "Grosor de la línea vertical que marca el límite entre pasado y futuro, p. ej. «1px».",
        timelineDividerColor: "Color",
        timelineDividerColorDesc: "Color de la línea vertical divisoria entre pasado y futuro.",
        lineStyleLabel: "Estilo",
        lineStyleSolid: "Sólida",
        lineStyleDashed: "Discontinua",
        lineStyleDotted: "Punteada",
        timelineOptionsHeading: "Opciones",
        timelineShowFullName: "Mostrar nombre completo",
        timelineShowFullNameDesc:
          "Muestra el nombre completo (nombre y apellido) de cada evento en lugar de solo el nombre, en el encabezado, la información sobre herramientas y la lista desplegable.",
        showHolidaySuffix: "Mostrar sufijo del festivo",
        showHolidaySuffixDesc:
          "Añade el país del festivo (y la subdivisión, si la hay) entre paréntesis después de su nombre, p. ej. «Pioneer Day (US-UT)».",
        timelineShowDate: "Mostrar fecha",
        timelineShowDateDesc:
          "Añade la fecha corta entre paréntesis al final, p. ej. «... es en 3 días (6 ago)». Se oculta el día del propio evento, ya que la frase ya termina justo antes con «... es hoy».",
        timelineShowTime: "Mostrar hora",
        timelineShowTimeDesc:
          "Añade el rango horario propio de un evento de calendario externo en los mismos paréntesis, p. ej. «... es en 3 días (14:00–15:00)». Solo se muestra para un evento de calendario externo con hora (no de todo el día). El formato de la hora sigue el idioma de Home Assistant.",
        timelineShowLocation: "Mostrar ubicación",
        timelineShowLocationDesc:
          "Añade la ubicación propia de un evento de calendario externo en los mismos paréntesis. Solo se muestra para un evento de calendario externo que tenga una ubicación establecida.",
        timelineShowDescription: "Mostrar descripción",
        timelineShowDescriptionDesc:
          "Añade la descripción propia de un evento de calendario externo en los mismos paréntesis. Solo se muestra para un evento de calendario externo que tenga una descripción establecida.",
        timelineHeaderMaxEvents: "Máx. eventos por día",
        timelineHeaderMaxEventsDesc:
          "Limita cuántas líneas de encabezado puede aportar un solo día con eventos simultáneos, p. ej. 3 cumpleaños el mismo día. Los eventos adicionales de ese día siguen recibiendo su propio punto en el eje, solo que sin línea de encabezado propia. Déjelo vacío para no aplicar límite.",
        timelineHeaderMinEvents: "Mostrar siempre N próximos",
        timelineHeaderMinEventsDesc:
          "Muestra siempre al menos esta cantidad de líneas de encabezado, incorporando si es necesario más días próximos (o, una vez agotados estos, más días recientes pasados) más allá del siguiente inmediato - cada uno sigue limitado por «máx. eventos por día» arriba. Déjelo vacío (o 0) para mostrar solo los eventos del día siguiente inmediato.",
        moreAction: "Botón «Más»",
        moreActionDesc:
          "Qué hace el botón «Más» de la esquina inferior derecha de la timeline. Normalmente una acción de navegación hacia un panel que muestra los mismos eventos en el diseño Lista completo. Déjalo en «Nada» para ocultar el botón.",
        groupTimeline: "Timeline",
        groupTimelineDesc: "Solo se usa cuando el Estilo de diseño (en Visualización) está configurado como Timeline.",
        timelineHeaderLabel: "Encabezado",
        timelineHeaderFontDesc:
          "Fuente para la línea de descripción sobre el eje, p. ej. «El cumpleaños número 27 de Kevin es hoy».",
        timelineHeaderColorDesc: "Color de texto para la línea de descripción sobre el eje.",
        timelineTooltipLabel: "Info sobre",
        timelineTooltipFontDesc: "Fuente para el texto mostrado al pulsar un punto del eje.",
        timelineTooltipColorDesc: "Color de texto para el texto mostrado al pulsar un punto del eje.",
        timelineListLabel: "Lista (Detalles)",
        timelineListFontDesc: "Fuente para la lista cronológica desplegable bajo el eje.",
        timelineListColorDesc: "Color de texto para la lista cronológica desplegable bajo el eje.",
        timelineButtonLabel: "Botón Detalles / Más",
        timelineButtonFontDesc: "Fuente para los botones Detalles y Más del pie.",
        timelineButtonColorDesc: "Color de texto para los botones Detalles y Más del pie.",
        eventTypesHeading: "Tipos de evento",
        eventTypeColorDesc: "Color del icono y del punto de este tipo de evento en la línea de tiempo.",
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
        visibilityNameDesc: "Mostrar el nombre del evento",
        visibilityTypeDesc: "Mostrar el tipo de evento",
        visibilityCountrySuffix: "Sufijo del festivo",
        visibilityCountrySuffixDesc: "Añadir el país (y la subdivisión, si la hay) tras el nombre/tipo del festivo, p. ej. «Día de la Hispanidad · ES (MD)»",
        columnsHeading: "Columnas de fila",
        columnsDesc: "Añade, elimina y reordena lo que muestra cada fila. Las columnas de texto personalizado pueden combinar texto libre con marcadores de posición: {name}, {last_name}, {full_name}, {type}, {occurrence}, {when}, {date}, {country}, {time}, {location}, {description}.",
        columnTypeIcon: "Icono",
        columnTypeInfo: "Nombre + tipo",
        columnTypeName: "Nombre",
        columnTypeLastName: "Apellido",
        columnTypeFullName: "Nombre completo",
        columnTypeFullNameType: "Nombre completo + tipo",
        columnTypeType: "Tipo",
        columnTypeText: "Texto personalizado",
        columnTypeDate: "Fecha",
        columnTypeTime: "Hora",
        columnTypeLocation: "Ubicación",
        columnTypeDescription: "Descripción",
        columnTypeTimeDesc:
          "Añade el propio intervalo horario del evento del calendario externo, p. ej. «...15:00–17:00». Solo se muestra para un evento con hora (no de todo el día) de un calendario externo.",
        columnTypeLocationDesc:
          "Añade la propia ubicación del evento del calendario externo. Solo se muestra si el evento del calendario externo tiene una definida.",
        columnTypeDescriptionDesc:
          "Añade la propia descripción del evento del calendario externo. Solo se muestra si el evento del calendario externo tiene una definida.",
        suffixLabel: "Sufijo",
        suffixGroupHolidayTitle: "Solo festivos",
        suffixGroupExternalTitle: "Solo calendarios externos",
        suffixShowCalendarName: "Nombre del calendario",
        suffixShowCalendarNameDesc:
          "Muestra aquí el propio nombre del calendario externo (p. ej. «Personal»). Desactívalo cuando Hora/Ubicación/Descripción de abajo ya digan suficiente por sí solos.",
        externalCalendarsHeading: "Calendarios externos",
        externalCalendarsDesc:
          "Incorpora uno o más de tus calendarios existentes de Home Assistant junto a los propios eventos de Annuals - cada uno aparece en su día real (y, en el caso de eventos con hora, se ordena por hora del día dentro de ese día) en lugar de seguir ningún cálculo de «próxima ocurrencia». Añade arriba una columna de Hora/Ubicación/Descripción para mostrar esos campos en estos eventos.",
        externalCalendarsLabel: "Calendarios",
        externalCalendarsLabelDesc: "Qué entidades calendar.* incorporar.",
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
        vipBadgeColorList: "Color de la insignia (Lista)",
        vipBadgeColorListDesc:
          "Color de la insignia de estrella VIP en la insignia de esquina del diseño Lista, en el encabezado del diseño Timeline y en su lista Detalles desplegable.",
        vipBadgeColorTimeline: "Color de la insignia (Timeline)",
        vipBadgeColorTimelineDesc:
          "Color del icono de estrella VIP específicamente en los puntos del eje del diseño Timeline. Solo se muestra cuando el Estilo de diseño está configurado como Timeline.",
        importantBadgeColorList: "Color de la insignia (Lista)",
        importantBadgeColorListDesc:
          "Color de la insignia de signo de exclamación Important en la insignia de esquina del diseño Lista, en el encabezado del diseño Timeline y en su lista Detalles desplegable.",
        importantBadgeColorTimeline: "Color de la insignia (Timeline)",
        importantBadgeColorTimelineDesc:
          "Color del icono de signo de exclamación Important específicamente en los puntos del eje del diseño Timeline. Solo se muestra cuando el Estilo de diseño está configurado como Timeline.",
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
        iconVisibleLabel: "Mostrar icono",
        iconVisibleDesc: "Mostrar u ocultar el icono para esta categoría",
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
        colorName: "Nombre",
        colorType: "Tipo",
        colorBadge: "Ocurrencia",
        colorWhen: "Cuenta atrás",
        colorText: "Texto personalizado",
        cardTitleColorDesc: "Color del texto para el título propio de la tarjeta",
        colorNameDesc: "Color del texto para el nombre del evento",
        colorLastName: "Apellido",
        colorLastNameDesc: "Color del texto para el apellido del evento",
        colorFullName: "Nombre completo",
        colorFullNameDesc: "Color del texto para el nombre completo del evento (nombre y apellido)",
        colorTypeDesc: "Color del texto para el tipo de evento",
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
        fontNameDesc: "Tamaño de fuente para el nombre del evento",
        fontLastNameDesc: "Tamaño de fuente para el apellido del evento",
        fontFullNameDesc: "Tamaño de fuente para el nombre completo del evento (nombre y apellido)",
        fontTypeDesc: "Tamaño de fuente para el tipo de evento",
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
        panelLayoutDesc: "Visualización, fuentes, colores, iconos, fondo de tarjeta y timeline",
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
      possessive: (name) => name,
      ordinalParts: (n) => ({ num: `${n}°`, sup: "" }),
      timelineSentence: "{ordinal}{sup} {type} di {possessive} è {when}",
      timelineSentenceSimple: "{name} è {when}",
      timelineSentencePast: "{ordinal}{sup} {type} di {possessive} era {when}",
      timelineSentenceSimplePast: "{name} era {when}",
      timelineExpand: "Dettagli",
      timelineCollapse: "Meno",
      timelineMore: "Altro",
      types: {
        birthday: "Compleanno",
        anniversary: "Anniversario",
        name_day: "Onomastico",
        wedding_anniversary: "Anniversario di matrimonio",
        memorial: "Anniversario della morte",
        pet_birthday: "Compleanno animale",
        work_anniversary: "Anniversario lavorativo",
        custom: "Personalizzato",
        one_time: "Evento occasionale",
        holiday: "Festività",
        calendar: "Evento del calendario",
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
        one_time: "Eventi occasionali",
        holiday: "Festività",
        calendar: "Eventi del calendario",
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
        layoutStyleLabel: "Stile del layout",
        layoutStyleDesc:
          "Lista mostra le righe classiche icona/nome/sottotitolo/badge/conto alla rovescia. Timeline mostra un asse orizzontale compatto con il prossimo evento evidenziato e gli altri come punti cliccabili - utile per una colonna stretta nella vista Sezioni.",
        layoutStyleList: "Lista",
        layoutStyleTimeline: "Timeline",
        timelineLineHeading: "Linea della timeline",
        timelineLineWidth: "Spessore",
        timelineLineWidthDesc: "Spessore della linea orizzontale dell'asse, ad es. «4px».",
        timelineLineColor: "Colore",
        timelineLineColorDesc: "Colore della linea orizzontale dell'asse.",
        timelineDividerHeading: "Linea di separazione",
        timelineDividerWidth: "Spessore",
        timelineDividerWidthDesc:
          "Spessore della linea verticale che segna il confine tra passato e futuro, ad es. «1px».",
        timelineDividerColor: "Colore",
        timelineDividerColorDesc: "Colore della linea verticale di separazione tra passato e futuro.",
        lineStyleLabel: "Stile",
        lineStyleSolid: "Continua",
        lineStyleDashed: "Tratteggiata",
        lineStyleDotted: "Punteggiata",
        timelineOptionsHeading: "Opzioni",
        timelineShowFullName: "Mostra nome completo",
        timelineShowFullNameDesc:
          "Mostra il nome completo (nome e cognome) di ogni evento invece del solo nome, nell'intestazione, nel tooltip e nell'elenco espandibile.",
        showHolidaySuffix: "Mostra suffisso festività",
        showHolidaySuffixDesc:
          "Aggiunge il paese della festività (e la suddivisione, se presente) tra parentesi dopo il suo nome, ad es. «Pioneer Day (US-UT)».",
        timelineShowDate: "Mostra data",
        timelineShowDateDesc:
          "Aggiunge la data breve tra parentesi alla fine, ad es. «...è tra 3 giorni (6 ago)». Nascosta nel giorno stesso, poiché la frase termina già subito prima con «...è oggi».",
        timelineShowTime: "Mostra ora",
        timelineShowTimeDesc:
          "Aggiunge l'intervallo orario di un evento del calendario esterno nelle stesse parentesi, ad es. «...è tra 3 giorni (14:00–15:00)». Mostrato solo per un evento del calendario esterno con orario (non per l'intera giornata). Il formato dell'ora segue la lingua di Home Assistant.",
        timelineShowLocation: "Mostra luogo",
        timelineShowLocationDesc:
          "Aggiunge il luogo di un evento del calendario esterno nelle stesse parentesi. Mostrato solo per un evento del calendario esterno che ne ha uno impostato.",
        timelineShowDescription: "Mostra descrizione",
        timelineShowDescriptionDesc:
          "Aggiunge la descrizione di un evento del calendario esterno nelle stesse parentesi. Mostrato solo per un evento del calendario esterno che ne ha una impostata.",
        timelineHeaderMaxEvents: "Max eventi al giorno",
        timelineHeaderMaxEventsDesc:
          "Limita quante righe di intestazione può fornire un singolo giorno con eventi contemporanei, ad es. 3 compleanni nello stesso giorno. Gli eventi aggiuntivi di quel giorno ricevono comunque un proprio punto sull'asse, solo senza una riga di intestazione propria. Lascia vuoto per nessun limite.",
        timelineHeaderMinEvents: "Mostra sempre N imminenti",
        timelineHeaderMinEventsDesc:
          "Mostra sempre almeno questo numero di righe di intestazione, includendo se necessario ulteriori giorni imminenti (o, una volta esauriti, ulteriori giorni recenti passati) oltre il prossimo immediato - ciascuno comunque limitato da «max eventi al giorno» sopra. Lascia vuoto (o 0) per mostrare solo gli eventi del giorno immediatamente successivo.",
        moreAction: "Pulsante «Altro»",
        moreActionDesc:
          "Cosa fa il pulsante «Altro» in basso a destra nella timeline. Tipicamente un'azione di navigazione verso una dashboard che mostra gli stessi eventi nel layout Lista completo. Lascialo su «Nulla» per nascondere il pulsante.",
        groupTimeline: "Timeline",
        groupTimelineDesc: "Usato solo quando lo Stile del layout (in Visualizzazione) è impostato su Timeline.",
        timelineHeaderLabel: "Intestazione",
        timelineHeaderFontDesc:
          "Font per la riga di descrizione sopra l'asse, ad es. «Il 27° compleanno di Kevin è oggi».",
        timelineHeaderColorDesc: "Colore del testo per la riga di descrizione sopra l'asse.",
        timelineTooltipLabel: "Tooltip",
        timelineTooltipFontDesc: "Font per il testo mostrato quando si clicca su un punto dell'asse.",
        timelineTooltipColorDesc: "Colore del testo mostrato quando si clicca su un punto dell'asse.",
        timelineListLabel: "Elenco (Dettagli)",
        timelineListFontDesc: "Font per l'elenco cronologico espandibile sotto l'asse.",
        timelineListColorDesc: "Colore del testo per l'elenco cronologico espandibile sotto l'asse.",
        timelineButtonLabel: "Pulsante Dettagli / Altro",
        timelineButtonFontDesc: "Font per i pulsanti Dettagli e Altro del piè di pagina.",
        timelineButtonColorDesc: "Colore del testo per i pulsanti Dettagli e Altro del piè di pagina.",
        eventTypesHeading: "Tipi di evento",
        eventTypeColorDesc: "Colore dell'icona e del punto di questo tipo di evento sulla timeline.",
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
        visibilityNameDesc: "Mostra il nome dell'evento",
        visibilityTypeDesc: "Mostra il tipo di evento",
        visibilityCountrySuffix: "Suffisso festività",
        visibilityCountrySuffixDesc: "Aggiunge il paese (ed eventualmente la suddivisione) dopo il nome/tipo della festività, ad es. «Festa della Repubblica · IT (RM)»",
        columnsHeading: "Colonne di riga",
        columnsDesc: "Aggiungi, rimuovi e riordina ciò che ogni riga mostra. Le colonne di testo libero possono combinare testo libero con segnaposto: {name}, {last_name}, {full_name}, {type}, {occurrence}, {when}, {date}, {country}, {time}, {location}, {description}.",
        columnTypeIcon: "Icona",
        columnTypeInfo: "Nome + tipo",
        columnTypeName: "Nome",
        columnTypeLastName: "Cognome",
        columnTypeFullName: "Nome completo",
        columnTypeFullNameType: "Nome completo + tipo",
        columnTypeType: "Tipo",
        columnTypeText: "Testo libero",
        columnTypeDate: "Data",
        columnTypeTime: "Ora",
        columnTypeLocation: "Luogo",
        columnTypeDescription: "Descrizione",
        columnTypeTimeDesc:
          "Aggiunge la propria fascia oraria dell'evento del calendario esterno, ad es. «...15:00–17:00». Visibile solo per un evento con orario (non per l'intera giornata) di un calendario esterno.",
        columnTypeLocationDesc:
          "Aggiunge il proprio luogo dell'evento del calendario esterno. Visibile solo se l'evento del calendario esterno ne ha uno impostato.",
        columnTypeDescriptionDesc:
          "Aggiunge la propria descrizione dell'evento del calendario esterno. Visibile solo se l'evento del calendario esterno ne ha una impostata.",
        suffixLabel: "Suffisso",
        suffixGroupHolidayTitle: "Solo festività",
        suffixGroupExternalTitle: "Solo calendari esterni",
        suffixShowCalendarName: "Nome del calendario",
        suffixShowCalendarNameDesc:
          "Mostra qui il nome proprio del calendario esterno (ad es. «Personale»). Disattivalo quando Ora/Luogo/Descrizione qui sotto dicono già abbastanza da soli.",
        externalCalendarsHeading: "Calendari esterni",
        externalCalendarsDesc:
          "Incorpora uno o più dei tuoi calendari di Home Assistant esistenti insieme agli eventi propri di Annuals - ciascuno compare nel suo giorno reale (e, per gli eventi con orario, viene ordinato in base all'ora all'interno di quel giorno) invece di seguire il calcolo della «prossima occorrenza». Aggiungi sopra una colonna Ora/Luogo/Descrizione per mostrare questi campi per tali eventi.",
        externalCalendarsLabel: "Calendari",
        externalCalendarsLabelDesc: "Quali entità calendar.* incorporare.",
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
        vipBadgeColorList: "Colore del badge (Lista)",
        vipBadgeColorListDesc:
          "Colore del badge a stella VIP nel badge d'angolo del layout Lista, nell'intestazione del layout Timeline e nel suo elenco Dettagli espandibile.",
        vipBadgeColorTimeline: "Colore del badge (Timeline)",
        vipBadgeColorTimelineDesc:
          "Colore dell'icona a stella VIP specificamente sui punti dell'asse del layout Timeline. Mostrato solo quando lo Stile del layout è impostato su Timeline.",
        importantBadgeColorList: "Colore del badge (Lista)",
        importantBadgeColorListDesc:
          "Colore del badge punto esclamativo Important nel badge d'angolo del layout Lista, nell'intestazione del layout Timeline e nel suo elenco Dettagli espandibile.",
        importantBadgeColorTimeline: "Colore del badge (Timeline)",
        importantBadgeColorTimelineDesc:
          "Colore dell'icona punto esclamativo Important specificamente sui punti dell'asse del layout Timeline. Mostrato solo quando lo Stile del layout è impostato su Timeline.",
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
        iconVisibleLabel: "Mostra icona",
        iconVisibleDesc: "Mostra o nascondi l'icona per questa categoria",
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
        colorName: "Nome",
        colorType: "Tipo",
        colorBadge: "Occorrenza",
        colorWhen: "Conto alla rovescia",
        colorText: "Testo libero",
        cardTitleColorDesc: "Colore del testo per il titolo proprio della scheda",
        colorNameDesc: "Colore del testo per il nome dell'evento",
        colorLastName: "Cognome",
        colorLastNameDesc: "Colore del testo per il cognome dell'evento",
        colorFullName: "Nome completo",
        colorFullNameDesc: "Colore del testo per il nome completo dell'evento (nome e cognome)",
        colorTypeDesc: "Colore del testo per il tipo di evento",
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
        fontNameDesc: "Dimensione del font per il nome dell'evento",
        fontLastNameDesc: "Dimensione del font per il cognome dell'evento",
        fontFullNameDesc: "Dimensione del font per il nome completo dell'evento (nome e cognome)",
        fontTypeDesc: "Dimensione del font per il tipo di evento",
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
        panelLayoutDesc: "Visualizzazione, font, colori, icone, sfondo scheda e timeline",
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
      possessive: (name) => name,
      ordinalParts: (n) => ({ num: `${n}º`, sup: "" }),
      timelineSentence: "{ordinal}{sup} {type} de {possessive} é {when}",
      timelineSentenceSimple: "{name} é {when}",
      timelineSentencePast: "{ordinal}{sup} {type} de {possessive} foi {when}",
      timelineSentenceSimplePast: "{name} foi {when}",
      timelineExpand: "Detalhes",
      timelineCollapse: "Menos",
      timelineMore: "Mais",
      types: {
        birthday: "Aniversário",
        anniversary: "Data comemorativa",
        name_day: "Dia do nome",
        wedding_anniversary: "Aniversário de casamento",
        memorial: "Aniversário de falecimento",
        pet_birthday: "Aniversário de animal de estimação",
        work_anniversary: "Aniversário de trabalho",
        custom: "Personalizado",
        one_time: "Evento único",
        holiday: "Feriado",
        calendar: "Evento do calendário",
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
        one_time: "Eventos únicos",
        holiday: "Feriados",
        calendar: "Eventos do calendário",
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
        layoutStyleLabel: "Estilo de layout",
        layoutStyleDesc:
          "Lista mostra as linhas clássicas de ícone/nome/subtítulo/selo/contagem regressiva. Timeline mostra um eixo horizontal compacto com o próximo evento destacado e o restante como pontos clicáveis - útil para uma coluna estreita na visualização de Seções.",
        layoutStyleList: "Lista",
        layoutStyleTimeline: "Timeline",
        timelineLineHeading: "Linha da timeline",
        timelineLineWidth: "Espessura",
        timelineLineWidthDesc: "Espessura da linha horizontal do eixo, ex.: \"4px\".",
        timelineLineColor: "Cor",
        timelineLineColorDesc: "Cor da linha horizontal do eixo.",
        timelineDividerHeading: "Linha divisória",
        timelineDividerWidth: "Espessura",
        timelineDividerWidthDesc:
          "Espessura da linha vertical que marca o limite entre passado e futuro, ex.: \"1px\".",
        timelineDividerColor: "Cor",
        timelineDividerColorDesc: "Cor da linha vertical divisória entre passado e futuro.",
        lineStyleLabel: "Estilo",
        lineStyleSolid: "Sólida",
        lineStyleDashed: "Tracejada",
        lineStyleDotted: "Pontilhada",
        timelineOptionsHeading: "Opções",
        timelineShowFullName: "Mostrar nome completo",
        timelineShowFullNameDesc:
          "Exibe o nome completo (nome e sobrenome) de cada evento em vez de apenas o primeiro nome, no cabeçalho, na dica de ferramenta e na lista expansível.",
        showHolidaySuffix: "Mostrar sufixo do feriado",
        showHolidaySuffixDesc:
          "Adiciona o país do feriado (e a subdivisão, se houver) entre parênteses após o seu nome, ex.: \"Pioneer Day (US-UT)\".",
        timelineShowDate: "Mostrar data",
        timelineShowDateDesc:
          "Adiciona a data curta entre parênteses no final, ex.: \"...é em 3 dias (6 ago)\". Ocultada no próprio dia do evento, já que a frase já termina logo antes com \"...é hoje\".",
        timelineShowTime: "Mostrar horário",
        timelineShowTimeDesc:
          "Adiciona o intervalo de horário próprio de um evento de calendário externo nos mesmos parênteses, ex.: \"...é em 3 dias (14:00–15:00)\". Exibido apenas para um evento de calendário externo com horário definido (não de dia inteiro). O formato de horário segue o idioma do Home Assistant.",
        timelineShowLocation: "Mostrar local",
        timelineShowLocationDesc:
          "Adiciona o local próprio de um evento de calendário externo nos mesmos parênteses. Exibido apenas para um evento de calendário externo que tenha um local definido.",
        timelineShowDescription: "Mostrar descrição",
        timelineShowDescriptionDesc:
          "Adiciona a descrição própria de um evento de calendário externo nos mesmos parênteses. Exibido apenas para um evento de calendário externo que tenha uma descrição definida.",
        timelineHeaderMaxEvents: "Máx. de eventos por dia",
        timelineHeaderMaxEventsDesc:
          "Limita quantas linhas de cabeçalho um único dia com eventos simultâneos pode contribuir, ex.: 3 aniversários no mesmo dia. Eventos adicionais desse dia ainda recebem seu próprio ponto no eixo, só que sem linha de cabeçalho própria. Deixe em branco para não haver limite.",
        timelineHeaderMinEvents: "Sempre mostrar N próximos",
        timelineHeaderMinEventsDesc:
          "Sempre mostra pelo menos esse número de linhas de cabeçalho, incluindo, se necessário, mais dias futuros (ou, quando esses se esgotarem, mais dias recentes passados) além do próximo imediato - cada um ainda limitado por \"máx. de eventos por dia\" acima. Deixe em branco (ou 0) para mostrar apenas os eventos do dia imediatamente seguinte.",
        moreAction: "Botão \"Mais\"",
        moreActionDesc:
          "O que o botão \"Mais\" no canto inferior direito da timeline faz. Normalmente uma ação de navegação para um painel que mostra os mesmos eventos no layout Lista completo. Deixe em \"Nada\" para ocultar o botão.",
        groupTimeline: "Timeline",
        groupTimelineDesc: "Usado apenas quando o Estilo de layout (em Exibição) está definido como Timeline.",
        timelineHeaderLabel: "Cabeçalho",
        timelineHeaderFontDesc:
          "Fonte para a linha de descrição acima do eixo, ex.: \"O 27º aniversário de Kevin é hoje\".",
        timelineHeaderColorDesc: "Cor do texto para a linha de descrição acima do eixo.",
        timelineTooltipLabel: "Dica de ferramenta",
        timelineTooltipFontDesc: "Fonte para o texto mostrado ao clicar em um ponto do eixo.",
        timelineTooltipColorDesc: "Cor do texto mostrado ao clicar em um ponto do eixo.",
        timelineListLabel: "Lista (Detalhes)",
        timelineListFontDesc: "Fonte para a lista cronológica expansível abaixo do eixo.",
        timelineListColorDesc: "Cor do texto para a lista cronológica expansível abaixo do eixo.",
        timelineButtonLabel: "Botão Detalhes / Mais",
        timelineButtonFontDesc: "Fonte para os botões Detalhes e Mais do rodapé.",
        timelineButtonColorDesc: "Cor do texto para os botões Detalhes e Mais do rodapé.",
        eventTypesHeading: "Tipos de evento",
        eventTypeColorDesc: "Cor do ícone e do ponto deste tipo de evento na linha do tempo.",
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
        visibilityNameDesc: "Mostrar o nome do evento",
        visibilityTypeDesc: "Mostrar o tipo de evento",
        visibilityCountrySuffix: "Sufixo do feriado",
        visibilityCountrySuffixDesc: "Acrescenta o país (e a subdivisão, se houver) após o nome/tipo do feriado, por ex. \"Independência do Brasil · BR (SP)\"",
        columnsHeading: "Colunas da linha",
        columnsDesc: "Adicione, remova e reorganize o que cada linha mostra. Colunas de texto personalizado podem combinar texto livre com espaços reservados: {name}, {last_name}, {full_name}, {type}, {occurrence}, {when}, {date}, {country}, {time}, {location}, {description}.",
        columnTypeIcon: "Ícone",
        columnTypeInfo: "Nome + tipo",
        columnTypeName: "Nome",
        columnTypeLastName: "Sobrenome",
        columnTypeFullName: "Nome completo",
        columnTypeFullNameType: "Nome completo + tipo",
        columnTypeType: "Tipo",
        columnTypeText: "Texto personalizado",
        columnTypeDate: "Data",
        columnTypeTime: "Horário",
        columnTypeLocation: "Local",
        columnTypeDescription: "Descrição",
        columnTypeTimeDesc:
          "Adiciona o próprio intervalo de horário do evento do calendário externo, por ex. \"...15:00–17:00\". Exibido apenas para um evento com horário definido (não de dia inteiro) de um calendário externo.",
        columnTypeLocationDesc:
          "Adiciona o próprio local do evento do calendário externo. Exibido apenas se o evento do calendário externo tiver um local definido.",
        columnTypeDescriptionDesc:
          "Adiciona a própria descrição do evento do calendário externo. Exibido apenas se o evento do calendário externo tiver uma descrição definida.",
        suffixLabel: "Sufixo",
        suffixGroupHolidayTitle: "Somente feriados",
        suffixGroupExternalTitle: "Somente calendários externos",
        suffixShowCalendarName: "Nome do calendário",
        suffixShowCalendarNameDesc:
          "Exibe aqui o próprio nome do calendário externo (por ex. \"Pessoal\"). Desative assim que Horário/Local/Descrição abaixo já disserem o suficiente por si só.",
        externalCalendarsHeading: "Calendários externos",
        externalCalendarsDesc:
          "Incorpore um ou mais dos seus calendários existentes do Home Assistant junto aos eventos próprios do Annuals - cada um aparece no seu dia real (e, no caso de eventos com horário, é ordenado pelo horário dentro desse dia) em vez de qualquer cálculo de \"próxima ocorrência\". Adicione uma coluna de Horário/Local/Descrição acima para exibir esses campos nesses eventos.",
        externalCalendarsLabel: "Calendários",
        externalCalendarsLabelDesc: "Quais entidades calendar.* incorporar.",
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
        vipBadgeColorList: "Cor do selo (Lista)",
        vipBadgeColorListDesc:
          "Cor do selo de estrela VIP no selo de canto do layout Lista, no cabeçalho do layout Timeline e na sua lista Detalhes expansível.",
        vipBadgeColorTimeline: "Cor do selo (Timeline)",
        vipBadgeColorTimelineDesc:
          "Cor do ícone de estrela VIP especificamente nos pontos do eixo do layout Timeline. Mostrado apenas quando o Estilo de layout está definido como Timeline.",
        importantBadgeColorList: "Cor do selo (Lista)",
        importantBadgeColorListDesc:
          "Cor do selo de ponto de exclamação Important no selo de canto do layout Lista, no cabeçalho do layout Timeline e na sua lista Detalhes expansível.",
        importantBadgeColorTimeline: "Cor do selo (Timeline)",
        importantBadgeColorTimelineDesc:
          "Cor do ícone de ponto de exclamação Important especificamente nos pontos do eixo do layout Timeline. Mostrado apenas quando o Estilo de layout está definido como Timeline.",
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
        iconVisibleLabel: "Mostrar ícone",
        iconVisibleDesc: "Mostrar ou ocultar o ícone para esta categoria",
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
        colorName: "Nome",
        colorType: "Tipo",
        colorBadge: "Ocorrência",
        colorWhen: "Contagem regressiva",
        colorText: "Texto personalizado",
        cardTitleColorDesc: "Cor do texto para o título próprio do cartão",
        colorNameDesc: "Cor do texto para o nome do evento",
        colorLastName: "Sobrenome",
        colorLastNameDesc: "Cor do texto para o sobrenome do evento",
        colorFullName: "Nome completo",
        colorFullNameDesc: "Cor do texto para o nome completo do evento (nome e sobrenome)",
        colorTypeDesc: "Cor do texto para o tipo de evento",
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
        fontNameDesc: "Tamanho da fonte para o nome do evento",
        fontLastNameDesc: "Tamanho da fonte para o sobrenome do evento",
        fontFullNameDesc: "Tamanho da fonte para o nome completo do evento (nome e sobrenome)",
        fontTypeDesc: "Tamanho da fonte para o tipo de evento",
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
        panelLayoutDesc: "Exibição, fontes, cores, ícones, fundo do cartão e timeline",
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
      // Русское склонение по падежам нельзя безопасно применить к
      // произвольно введённым именам, поэтому вместо родительного падежа
      // используется нейтральная форма «Имя: N. тип — когда» - она одинаково
      // подходит для прошедших и будущих событий, так как само «когда»
      // (например, «вчера»/«через 3 дня») уже передаёт время.
      possessive: (name) => name,
      ordinalParts: (n) => ({ num: `${n}-й`, sup: "" }),
      timelineSentence: "{possessive}: {ordinal}{sup} {type} — {when}",
      timelineSentenceSimple: "{name} — {when}",
      timelineSentencePast: "{possessive}: {ordinal}{sup} {type} — {when}",
      timelineSentenceSimplePast: "{name} — {when}",
      timelineExpand: "Подробнее",
      timelineCollapse: "Свернуть",
      timelineMore: "Ещё",
      types: {
        birthday: "День рождения",
        anniversary: "Годовщина",
        name_day: "Именины",
        wedding_anniversary: "Годовщина свадьбы",
        memorial: "День памяти",
        pet_birthday: "День рождения питомца",
        work_anniversary: "Трудовой юбилей",
        custom: "Другое",
        one_time: "Разовое событие",
        holiday: "Праздник",
        calendar: "Событие календаря",
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
        one_time: "Разовые события",
        holiday: "Праздники",
        calendar: "События календаря",
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
        layoutStyleLabel: "Стиль макета",
        layoutStyleDesc:
          "Список показывает классические строки значок/имя/подзаголовок/значок-badge/обратный отсчёт. Timeline показывает компактную горизонтальную ось с выделенным ближайшим событием и остальными в виде кликабельных точек - удобно для узкой колонки в виде Секции.",
        layoutStyleList: "Список",
        layoutStyleTimeline: "Timeline",
        timelineLineHeading: "Линия таймлайна",
        timelineLineWidth: "Толщина",
        timelineLineWidthDesc: "Толщина горизонтальной линии оси, напр. «4px».",
        timelineLineColor: "Цвет",
        timelineLineColorDesc: "Цвет горизонтальной линии оси.",
        timelineDividerHeading: "Разделительная линия",
        timelineDividerWidth: "Толщина",
        timelineDividerWidthDesc:
          "Толщина вертикальной линии, отмечающей границу между прошлым и будущим, напр. «1px».",
        timelineDividerColor: "Цвет",
        timelineDividerColorDesc: "Цвет вертикальной разделительной линии между прошлым и будущим.",
        lineStyleLabel: "Стиль",
        lineStyleSolid: "Сплошная",
        lineStyleDashed: "Пунктирная",
        lineStyleDotted: "Точечная",
        timelineOptionsHeading: "Параметры",
        timelineShowFullName: "Показывать полное имя",
        timelineShowFullNameDesc:
          "Показывает полное имя (имя и фамилию) каждого события вместо только имени — в заголовке, всплывающей подсказке и раскрывающемся списке.",
        showHolidaySuffix: "Показывать суффикс праздника",
        showHolidaySuffixDesc:
          "Добавлять страну праздника (и регион, если есть) в скобках после его названия, напр. «Pioneer Day (US-UT)».",
        timelineShowDate: "Показывать дату",
        timelineShowDateDesc:
          "Добавляет в конце краткую дату в скобках, напр. «...через 3 дня (6 авг.)». Скрывается в день самого события, так как перед этим предложение уже заканчивается словами «...сегодня».",
        timelineShowTime: "Показывать время",
        timelineShowTimeDesc:
          "Добавляет в тех же скобках собственный временной диапазон события внешнего календаря, напр. «...через 3 дня (14:00–15:00)». Показывается только для событий внешнего календаря с указанным временем (не для событий на весь день). Формат времени зависит от языка Home Assistant.",
        timelineShowLocation: "Показывать место",
        timelineShowLocationDesc:
          "Добавляет в тех же скобках собственное место события внешнего календаря. Показывается только для событий внешнего календаря, для которых оно указано.",
        timelineShowDescription: "Показывать описание",
        timelineShowDescriptionDesc:
          "Добавляет в тех же скобках собственное описание события внешнего календаря. Показывается только для событий внешнего календаря, для которых оно указано.",
        timelineHeaderMaxEvents: "Макс. событий в день",
        timelineHeaderMaxEventsDesc:
          "Ограничивает, сколько строк заголовка может дать один день с одновременными событиями, напр. 3 дня рождения в один день. Дополнительные события этого дня всё равно получают свою точку на оси, просто без отдельной строки заголовка. Оставьте пустым, чтобы не задавать ограничение.",
        timelineHeaderMinEvents: "Всегда показывать N ближайших",
        timelineHeaderMinEventsDesc:
          "Всегда показывает не менее этого количества строк заголовка, при необходимости включая дополнительные предстоящие (а если они закончились - недавние прошедшие) дни помимо самого ближайшего - каждый из них по-прежнему ограничен параметром «макс. событий в день» выше. Оставьте пустым (или 0), чтобы показывать только события самого ближайшего дня.",
        moreAction: "Кнопка «Ещё»",
        moreActionDesc:
          "Что делает кнопка «Ещё» в правом нижнем углу таймлайна. Обычно действие перехода на дашборд, показывающий те же события в полном макете Список. Оставьте «Ничего», чтобы скрыть кнопку.",
        groupTimeline: "Timeline",
        groupTimelineDesc: "Используется только когда Стиль макета (в разделе Отображение) установлен на Timeline.",
        timelineHeaderLabel: "Заголовок",
        timelineHeaderFontDesc:
          "Шрифт для строки описания над осью, напр. «Kevin: 27-й день рождения — сегодня».",
        timelineHeaderColorDesc: "Цвет текста для строки описания над осью.",
        timelineTooltipLabel: "Подсказка",
        timelineTooltipFontDesc: "Шрифт для текста, показываемого при нажатии на точку оси.",
        timelineTooltipColorDesc: "Цвет текста, показываемого при нажатии на точку оси.",
        timelineListLabel: "Список (Подробнее)",
        timelineListFontDesc: "Шрифт для раскрываемого хронологического списка под осью.",
        timelineListColorDesc: "Цвет текста раскрываемого хронологического списка под осью.",
        timelineButtonLabel: "Кнопка Подробнее / Ещё",
        timelineButtonFontDesc: "Шрифт кнопок Подробнее и Ещё в нижней части карточки.",
        timelineButtonColorDesc: "Цвет текста кнопок Подробнее и Ещё в нижней части карточки.",
        eventTypesHeading: "Типы событий",
        eventTypeColorDesc: "Цвет значка и точки этого типа события на шкале времени.",
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
        visibilityNameDesc: "Показывать имя события",
        visibilityTypeDesc: "Показывать тип события",
        visibilityCountrySuffix: "Суффикс праздника",
        visibilityCountrySuffixDesc: "Добавлять страну (и регион, если есть) после названия/типа праздника, напр. «День России · RU (MOW)»",
        columnsHeading: "Столбцы строки",
        columnsDesc: "Добавляйте, удаляйте и меняйте порядок того, что показывает каждая строка. Столбцы произвольного текста могут сочетать свободный текст с плейсхолдерами: {name}, {last_name}, {full_name}, {type}, {occurrence}, {when}, {date}, {country}, {time}, {location}, {description}.",
        columnTypeIcon: "Значок",
        columnTypeInfo: "Имя + тип",
        columnTypeName: "Имя",
        columnTypeLastName: "Фамилия",
        columnTypeFullName: "Полное имя",
        columnTypeFullNameType: "Полное имя + тип",
        columnTypeType: "Тип",
        columnTypeText: "Произвольный текст",
        columnTypeDate: "Дата",
        columnTypeTime: "Время",
        columnTypeLocation: "Место",
        columnTypeDescription: "Описание",
        columnTypeTimeDesc:
          "Добавляет собственный временной диапазон события внешнего календаря, например «...15:00–17:00». Отображается только для события с указанным временем (не на весь день) во внешнем календаре.",
        columnTypeLocationDesc:
          "Добавляет собственное место события внешнего календаря. Отображается, только если у события внешнего календаря оно указано.",
        columnTypeDescriptionDesc:
          "Добавляет собственное описание события внешнего календаря. Отображается, только если у события внешнего календаря оно указано.",
        suffixLabel: "Суффикс",
        suffixGroupHolidayTitle: "Только праздники",
        suffixGroupExternalTitle: "Только внешние календари",
        suffixShowCalendarName: "Название календаря",
        suffixShowCalendarNameDesc:
          "Показывает здесь собственное название внешнего календаря (например, «Личный»). Отключите, когда время/место/описание ниже уже достаточно информативны.",
        externalCalendarsHeading: "Внешние календари",
        externalCalendarsDesc:
          "Встраивайте один или несколько ваших существующих календарей Home Assistant вместе с собственными событиями Annuals — каждое из них попадает на свой реальный день (а события с указанным временем сортируются по времени суток внутри этого дня) вместо вычисления «следующего повторения». Добавьте выше столбец Время/Место/Описание, чтобы показывать эти поля для таких событий.",
        externalCalendarsLabel: "Календари",
        externalCalendarsLabelDesc: "Какие сущности calendar.* встраивать.",
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
        vipBadgeColorList: "Цвет бейджа (Список)",
        vipBadgeColorListDesc:
          "Цвет VIP-бейджа со звездой в угловом бейдже макета Список, в заголовке макета Timeline и в его раскрываемом списке Подробнее.",
        vipBadgeColorTimeline: "Цвет бейджа (Timeline)",
        vipBadgeColorTimelineDesc:
          "Цвет значка звезды VIP именно на точках оси макета Timeline. Отображается только когда Стиль макета установлен на Timeline.",
        importantBadgeColorList: "Цвет бейджа (Список)",
        importantBadgeColorListDesc:
          "Цвет бейджа с восклицательным знаком Important в угловом бейдже макета Список, в заголовке макета Timeline и в его раскрываемом списке Подробнее.",
        importantBadgeColorTimeline: "Цвет бейджа (Timeline)",
        importantBadgeColorTimelineDesc:
          "Цвет значка восклицательного знака Important именно на точках оси макета Timeline. Отображается только когда Стиль макета установлен на Timeline.",
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
        iconVisibleLabel: "Показывать значок",
        iconVisibleDesc: "Показать или скрыть значок для этой категории",
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
        colorName: "Имя",
        colorType: "Тип",
        colorBadge: "Номер события",
        colorWhen: "Обратный отсчёт",
        colorText: "Произвольный текст",
        cardTitleColorDesc: "Цвет текста для собственного заголовка карточки",
        colorNameDesc: "Цвет текста для имени события",
        colorLastName: "Фамилия",
        colorLastNameDesc: "Цвет текста для фамилии события",
        colorFullName: "Полное имя",
        colorFullNameDesc: "Цвет текста для полного имени события (имя и фамилия)",
        colorTypeDesc: "Цвет текста для типа события",
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
        fontNameDesc: "Размер шрифта для имени события",
        fontLastNameDesc: "Размер шрифта для фамилии события",
        fontFullNameDesc: "Размер шрифта для полного имени события (имя и фамилия)",
        fontTypeDesc: "Размер шрифта для типа события",
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
        panelLayoutDesc: "Отображение, шрифты, цвета, значки, фон карточки и timeline",
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
      possessive: (name) => (/[sxz]$/i.test(name) ? `${name}'` : `${name}s`),
      ordinalParts: (n) => {
        const teen = n % 100 >= 10 && n % 100 <= 12;
        const last = n % 10;
        return { num: `${n}`, sup: !teen && (last === 1 || last === 2) ? ":a" : ":e" };
      },
      timelineSentence: "{possessive} {ordinal}{sup} {type} är {when}",
      timelineSentenceSimple: "{name} är {when}",
      timelineSentencePast: "{possessive} {ordinal}{sup} {type} var {when}",
      timelineSentenceSimplePast: "{name} var {when}",
      timelineExpand: "Detaljer",
      timelineCollapse: "Mindre",
      timelineMore: "Mer",
      types: {
        birthday: "Födelsedag",
        anniversary: "Årsdag",
        name_day: "Namnsdag",
        wedding_anniversary: "Bröllopsdag",
        memorial: "Dödsdag",
        pet_birthday: "Husdjurets födelsedag",
        work_anniversary: "Arbetsjubileum",
        custom: "Anpassad",
        one_time: "Engångshändelse",
        holiday: "Helgdag",
        calendar: "Kalenderhändelse",
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
        one_time: "Engångshändelser",
        holiday: "Helgdagar",
        calendar: "Kalenderhändelser",
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
        layoutStyleLabel: "Kortlayout",
        layoutStyleDesc:
          "Lista visar de klassiska raderna med ikon/namn/undertext/badge/nedräkning. Timeline visar en kompakt horisontell axel med nästa händelse markerad och resten som klickbara punkter - praktiskt för en smal kolumn i Sektioner-vyn.",
        layoutStyleList: "Lista",
        layoutStyleTimeline: "Timeline",
        timelineLineHeading: "Tidslinje",
        timelineLineWidth: "Tjocklek",
        timelineLineWidthDesc: "Tjocklek på den horisontella axellinjen, t.ex. \"4px\".",
        timelineLineColor: "Färg",
        timelineLineColorDesc: "Färg på den horisontella axellinjen.",
        timelineDividerHeading: "Avgränsarlinje",
        timelineDividerWidth: "Tjocklek",
        timelineDividerWidthDesc:
          "Tjocklek på den vertikala linjen som markerar gränsen mellan dåtid och framtid, t.ex. \"1px\".",
        timelineDividerColor: "Färg",
        timelineDividerColorDesc: "Färg på den vertikala avgränsarlinjen mellan dåtid och framtid.",
        lineStyleLabel: "Stil",
        lineStyleSolid: "Heldragen",
        lineStyleDashed: "Streckad",
        lineStyleDotted: "Prickad",
        timelineOptionsHeading: "Alternativ",
        timelineShowFullName: "Visa fullständigt namn",
        timelineShowFullNameDesc:
          "Visar varje händelses fullständiga namn (förnamn och efternamn) istället för bara förnamnet, i rubriken, verktygstipset och den expanderbara listan.",
        showHolidaySuffix: "Visa helgdagssuffix",
        showHolidaySuffixDesc:
          "Lägg till helgdagens land (och delstat/region, om sådan finns) inom parentes efter namnet, t.ex. \"Pioneer Day (US-UT)\".",
        timelineShowDate: "Visa datum",
        timelineShowDateDesc:
          "Lägger till det korta datumet inom parentes i slutet, t.ex. \"...är om 3 dagar (6 aug)\". Döljs på själva dagen, eftersom meningen redan slutar med \"...är idag\" precis innan.",
        timelineShowTime: "Visa tid",
        timelineShowTimeDesc:
          "Lägger till en extern kalenderhändelses eget tidsintervall inom samma parentes, t.ex. \"...är om 3 dagar (14:00–15:00)\". Visas endast för en tidsbestämd (icke heldags) extern kalenderhändelse. Tidsformatet följer Home Assistants språkinställning.",
        timelineShowLocation: "Visa plats",
        timelineShowLocationDesc:
          "Lägger till en extern kalenderhändelses egen plats inom samma parentes. Visas endast för en extern kalenderhändelse som har en plats angiven.",
        timelineShowDescription: "Visa beskrivning",
        timelineShowDescriptionDesc:
          "Lägger till en extern kalenderhändelses egen beskrivning inom samma parentes. Visas endast för en extern kalenderhändelse som har en beskrivning angiven.",
        timelineHeaderMaxEvents: "Max antal händelser per dag",
        timelineHeaderMaxEventsDesc:
          "Begränsar hur många rubrikrader en enskild dag med sammanfallande händelser bidrar med, t.ex. 3 födelsedagar samma dag. Ytterligare händelser den dagen får ändå en egen punkt på axeln, bara utan egen rubrikrad. Lämna tomt för ingen begränsning.",
        timelineHeaderMinEvents: "Visa alltid N kommande",
        timelineHeaderMinEventsDesc:
          "Visar alltid minst så många rubrikrader, genom att vid behov inkludera ytterligare kommande (eller, när de tar slut, ytterligare nyligen passerade) dagar utöver nästa dag - var och en fortfarande begränsad av \"max antal händelser per dag\" ovan. Lämna tomt (eller 0) för att bara visa nästa dags egna händelser.",
        moreAction: "\"Mer\"-knapp",
        moreActionDesc:
          "Vad knappen \"Mer\" längst ned till höger i tidslinjen gör. Vanligtvis en navigeringsåtgärd till en instrumentpanel som visar samma händelser i det fullständiga Lista-layouten. Lämna på \"Inget\" för att dölja knappen.",
        groupTimeline: "Timeline",
        groupTimelineDesc: "Används endast när Kortlayout (under Visning) är inställd på Timeline.",
        timelineHeaderLabel: "Rubrik",
        timelineHeaderFontDesc:
          "Teckensnitt för beskrivningsraden ovanför axeln, t.ex. \"Kevins 27:e födelsedag är idag\".",
        timelineHeaderColorDesc: "Textfärg för beskrivningsraden ovanför axeln.",
        timelineTooltipLabel: "Tooltip",
        timelineTooltipFontDesc: "Teckensnitt för texten som visas när en punkt på axeln klickas.",
        timelineTooltipColorDesc: "Textfärg för texten som visas när en punkt på axeln klickas.",
        timelineListLabel: "Lista (Detaljer)",
        timelineListFontDesc: "Teckensnitt för den utfällbara kronologiska listan under axeln.",
        timelineListColorDesc: "Textfärg för den utfällbara kronologiska listan under axeln.",
        timelineButtonLabel: "Knappen Detaljer / Mer",
        timelineButtonFontDesc: "Teckensnitt för knapparna Detaljer och Mer i sidfoten.",
        timelineButtonColorDesc: "Textfärg för knapparna Detaljer och Mer i sidfoten.",
        eventTypesHeading: "Händelsetyper",
        eventTypeColorDesc: "Färg för ikonen och punkten för denna händelsetyp på tidslinjen.",
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
        visibilityNameDesc: "Visa händelsens namn",
        visibilityTypeDesc: "Visa händelsetypen",
        visibilityCountrySuffix: "Helgdagssuffix",
        visibilityCountrySuffixDesc: "Lägg till landet (och ev. delstat/region) efter helgdagens namn/typ, t.ex. \"Nationaldagen · SE (AB)\"",
        columnsHeading: "Radkolumner",
        columnsDesc:
          "Lägg till, ta bort och ändra ordning på vad varje rad visar. Egna textkolumner kan blanda fri text med platshållare: {name}, {last_name}, {full_name}, {type}, {occurrence}, {when}, {date}, {country}, {time}, {location}, {description}.",
        columnTypeIcon: "Ikon",
        columnTypeInfo: "Namn + typ",
        columnTypeName: "Namn",
        columnTypeLastName: "Efternamn",
        columnTypeFullName: "Fullständigt namn",
        columnTypeFullNameType: "Fullständigt namn + typ",
        columnTypeType: "Typ",
        columnTypeText: "Egen text",
        columnTypeDate: "Datum",
        columnTypeTime: "Tid",
        columnTypeLocation: "Plats",
        columnTypeDescription: "Beskrivning",
        columnTypeTimeDesc:
          "Lägg till den externa kalenderhändelsens egen tidsperiod, t.ex. \"...03:00 PM–05:00 PM\". Visas bara för en tidsbestämd (icke heldags-) extern kalenderhändelse.",
        columnTypeLocationDesc:
          "Lägg till den externa kalenderhändelsens egen plats. Visas bara för en extern kalenderhändelse som har en plats angiven.",
        columnTypeDescriptionDesc:
          "Lägg till den externa kalenderhändelsens egen beskrivning. Visas bara för en extern kalenderhändelse som har en beskrivning angiven.",
        suffixLabel: "Suffix",
        suffixGroupHolidayTitle: "Endast helgdagar",
        suffixGroupExternalTitle: "Endast externa kalendrar",
        suffixShowCalendarName: "Kalendernamn",
        suffixShowCalendarNameDesc:
          "Visa den externa kalenderns eget namn här (t.ex. \"Privat\"). Stäng av när Tid/Plats/Beskrivning nedan redan säger tillräckligt på egen hand.",
        externalCalendarsHeading: "Externa kalendrar",
        externalCalendarsDesc:
          "Bädda in en eller flera av dina befintliga Home Assistant-kalendrar tillsammans med Annuals egna händelser - var och en hamnar på sin verkliga dag (och, för tidsbestämda händelser, sorteras efter tid på dygnet inom den dagen) istället för någon beräkning av \"nästa förekomst\". Lägg till en kolumn för Tid/Plats/Beskrivning ovan för att visa dessa fält för dessa händelser.",
        externalCalendarsLabel: "Kalendrar",
        externalCalendarsLabelDesc: "Vilka calendar.*-entiteter som ska bäddas in.",
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
        vipBadgeColorList: "Märkesfärg (Lista)",
        vipBadgeColorListDesc:
          "Färg på VIP-stjärnmärket i Lista-layoutens hörnmärke, i Timeline-layoutens rubrik och i dess utfällbara Detaljer-lista.",
        vipBadgeColorTimeline: "Märkesfärg (Timeline)",
        vipBadgeColorTimelineDesc:
          "Färg på VIP-stjärnikonen specifikt på Timeline-layoutens axelpunkter. Visas endast när Kortlayout är inställd på Timeline.",
        importantBadgeColorList: "Märkesfärg (Lista)",
        importantBadgeColorListDesc:
          "Färg på Important-utropsteckenmärket i Lista-layoutens hörnmärke, i Timeline-layoutens rubrik och i dess utfällbara Detaljer-lista.",
        importantBadgeColorTimeline: "Märkesfärg (Timeline)",
        importantBadgeColorTimelineDesc:
          "Färg på Important-utropsteckenikonen specifikt på Timeline-layoutens axelpunkter. Visas endast när Kortlayout är inställd på Timeline.",
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
        iconVisibleLabel: "Visa ikon",
        iconVisibleDesc: "Visa eller dölj ikonen för denna kategori",
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
        colorName: "Namn",
        colorType: "Typ",
        colorBadge: "Händelsenummer",
        colorWhen: "Nedräkning",
        colorText: "Egen text",
        colorNameDesc: "Textfärg för händelsens namn",
        colorLastName: "Efternamn",
        colorLastNameDesc: "Textfärg för händelsens efternamn",
        colorFullName: "Fullständigt namn",
        colorFullNameDesc: "Textfärg för händelsens fullständiga namn (för- och efternamn)",
        cardTitleColorDesc: "Textfärg för kortets egen titel",
        colorTypeDesc: "Textfärg för händelsetypen",
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
        fontNameDesc: "Teckenstorlek för händelsens namn",
        fontLastNameDesc: "Teckenstorlek för händelsens efternamn",
        fontFullNameDesc: "Teckenstorlek för händelsens fullständiga namn (för- och efternamn)",
        fontTypeDesc: "Teckenstorlek för händelsetypen",
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
        panelLayoutDesc: "Visning, typsnitt, färger, ikoner, kortbakgrund och timeline",
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
      // "when" 本身（今天/明天/N 天后/N 天前）已经表达了时态，因此过去和未来
      // 使用同一模板即可，无需单独的过去式版本。
      possessive: (name) => `${name}的`,
      ordinalParts: (n) => ({ num: `第 ${n} 个`, sup: "" }),
      timelineSentence: "{possessive}{ordinal}{sup}{type}是{when}",
      timelineSentenceSimple: "{name} {when}",
      timelineSentencePast: "{possessive}{ordinal}{sup}{type}是{when}",
      timelineSentenceSimplePast: "{name} {when}",
      timelineExpand: "详情",
      timelineCollapse: "收起",
      timelineMore: "更多",
      types: {
        birthday: "生日",
        anniversary: "纪念日",
        name_day: "命名日",
        wedding_anniversary: "结婚纪念日",
        memorial: "忌日",
        pet_birthday: "宠物生日",
        work_anniversary: "工作纪念日",
        custom: "自定义",
        one_time: "一次性事件",
        holiday: "假日",
        calendar: "日历事件",
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
        one_time: "一次性事件",
        holiday: "假日",
        calendar: "日历事件",
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
        layoutStyleLabel: "布局样式",
        layoutStyleDesc:
          "「列表」显示经典的图标/姓名/副标题/徽章/倒计时行。「时间轴」显示一条紧凑的水平轴，突出显示最近的事件，其余事件以可点击的圆点表示 - 适合分区视图中的窄列。",
        layoutStyleList: "列表",
        layoutStyleTimeline: "时间轴",
        timelineLineHeading: "时间轴线",
        timelineLineWidth: "粗细",
        timelineLineWidthDesc: "水平轴线的粗细，例如「4px」。",
        timelineLineColor: "颜色",
        timelineLineColorDesc: "水平轴线的颜色。",
        timelineDividerHeading: "分隔线",
        timelineDividerWidth: "粗细",
        timelineDividerWidthDesc: "标记过去与未来分界的竖直分隔线粗细，例如「1px」。",
        timelineDividerColor: "颜色",
        timelineDividerColorDesc: "过去与未来之间竖直分隔线的颜色。",
        lineStyleLabel: "样式",
        lineStyleSolid: "实线",
        lineStyleDashed: "虚线",
        lineStyleDotted: "点线",
        timelineOptionsHeading: "选项",
        timelineShowFullName: "显示全名",
        timelineShowFullNameDesc: "在标题、提示框和可展开列表中显示每个事件的全名（名字和姓氏），而不仅仅是名字。",
        showHolidaySuffix: "显示节日后缀",
        showHolidaySuffixDesc: "在节日名称后以括号附加其所属国家（及地区，如有），例如「Pioneer Day (US-UT)」。",
        timelineShowDate: "显示日期",
        timelineShowDateDesc: "在末尾以括号附加简短日期，例如「...还有 3 天（8月6日）」。当天会自动隐藏，因为句子前面已经以「...就在今天」结尾。",
        timelineShowTime: "显示时间",
        timelineShowTimeDesc:
          "在同一括号内附加外部日历事件自身的时间范围，例如「...还有 3 天（14:00-15:00）」。仅在外部日历事件为定时（非全天）事件时显示。时间格式遵循 Home Assistant 的语言设置。",
        timelineShowLocation: "显示地点",
        timelineShowLocationDesc: "在同一括号内附加外部日历事件自身的地点。仅在该外部日历事件设置了地点时显示。",
        timelineShowDescription: "显示描述",
        timelineShowDescriptionDesc: "在同一括号内附加外部日历事件自身的描述。仅在该外部日历事件设置了描述时显示。",
        timelineHeaderMaxEvents: "每天最多事件数",
        timelineHeaderMaxEventsDesc: "限制同一天并列事件所能提供的标题行数，例如同一天有 3 个生日。超出上限的事件仍会在轴上显示各自的圆点，只是没有单独的标题行。留空表示不限制。",
        timelineHeaderMinEvents: "始终显示 N 个即将到来的事件",
        timelineHeaderMinEventsDesc: "始终至少显示这么多标题行，必要时会将下一天之外的更多即将到来（或用完后，更多近期已过去）的日期也纳入 - 每天仍受上面「每天最多事件数」的限制。留空（或 0）表示只显示下一天自身的事件。",
        moreAction: "「更多」按钮",
        moreActionDesc:
          "时间轴右下角「更多」按钮的作用。通常是跳转到以完整列表布局显示相同事件的仪表盘的导航操作。留空为「无」可隐藏该按钮。",
        groupTimeline: "时间轴",
        groupTimelineDesc: "仅当「显示」下的布局样式设置为「时间轴」时使用。",
        timelineHeaderLabel: "标题行",
        timelineHeaderFontDesc: "轴上方描述行的字体，例如「Kevin 的第 27 个生日是今天」。",
        timelineHeaderColorDesc: "轴上方描述行的文字颜色。",
        timelineTooltipLabel: "提示框",
        timelineTooltipFontDesc: "点击轴上圆点时显示文字的字体。",
        timelineTooltipColorDesc: "点击轴上圆点时显示文字的颜色。",
        timelineListLabel: "列表（详情）",
        timelineListFontDesc: "轴下方可展开的按时间排列列表的字体。",
        timelineListColorDesc: "轴下方可展开的按时间排列列表的文字颜色。",
        timelineButtonLabel: "详情 / 更多 按钮",
        timelineButtonFontDesc: "页脚「详情」和「更多」按钮的字体。",
        timelineButtonColorDesc: "页脚「详情」和「更多」按钮的文字颜色。",
        eventTypesHeading: "事件类型",
        eventTypeColorDesc: "此事件类型在时间轴上的图标和圆点颜色。",
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
        visibilityNameDesc: "显示事件名称",
        visibilityTypeDesc: "显示事件类型",
        visibilityCountrySuffix: "节假日后缀",
        visibilityCountrySuffixDesc: "在节假日名称/类型后附加国家（及地区，如有），例如“国庆节 · CN (BJ)”",
        columnsHeading: "行列",
        columnsDesc:
          "添加、删除并重新排列每行显示的内容。自定义文本列可以混合自由文本与占位符：{name}、{last_name}、{full_name}、{type}、{occurrence}、{when}、{date}、{country}、{time}、{location}、{description}。",
        columnTypeIcon: "图标",
        columnTypeInfo: "名称 + 类型",
        columnTypeName: "名称",
        columnTypeLastName: "姓氏",
        columnTypeFullName: "全名",
        columnTypeFullNameType: "全名 + 类型",
        columnTypeType: "类型",
        columnTypeText: "自定义文本",
        columnTypeDate: "日期",
        columnTypeTime: "时间",
        columnTypeLocation: "地点",
        columnTypeDescription: "描述",
        columnTypeTimeDesc:
          "附加外部日历事件自身的时间范围，例如「...03:00 PM-05:00 PM」。仅在外部日历事件为定时（非全天）事件时显示。",
        columnTypeLocationDesc:
          "附加外部日历事件自身的地点。仅在该外部日历事件设置了地点时显示。",
        columnTypeDescriptionDesc:
          "附加外部日历事件自身的描述。仅在该外部日历事件设置了描述时显示。",
        suffixLabel: "后缀",
        suffixGroupHolidayTitle: "仅限节假日",
        suffixGroupExternalTitle: "仅限外部日历",
        suffixShowCalendarName: "日历名称",
        suffixShowCalendarNameDesc:
          "在此显示外部日历自身的名称（例如「个人」）。一旦下方的时间/地点/描述已经足够说明，可关闭此项。",
        externalCalendarsHeading: "外部日历",
        externalCalendarsDesc:
          "将一个或多个现有的 Home Assistant 日历与 Annuals 自身的事件一起嵌入 - 每个事件都会显示在其实际发生的日期（对于定时事件，还会在当天按时间排序），而不是套用任何「下一次发生」的计算。请在上方添加时间/地点/描述列，以显示这些事件的相应字段。",
        externalCalendarsLabel: "日历",
        externalCalendarsLabelDesc: "要嵌入哪些 calendar.* 实体。",
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
        vipBadgeColorList: "徽章颜色（列表）",
        vipBadgeColorListDesc: "列表布局角标中的 VIP 星形徽章、时间轴布局标题行以及其可展开详情列表中的 VIP 星形颜色。",
        vipBadgeColorTimeline: "徽章颜色（时间轴）",
        vipBadgeColorTimelineDesc: "专门用于时间轴布局轴上圆点的 VIP 星形图标颜色。仅当布局样式设置为时间轴时显示。",
        importantBadgeColorList: "徽章颜色（列表）",
        importantBadgeColorListDesc: "列表布局角标中的 Important 感叹号徽章、时间轴布局标题行以及其可展开详情列表中的 Important 感叹号颜色。",
        importantBadgeColorTimeline: "徽章颜色（时间轴）",
        importantBadgeColorTimelineDesc: "专门用于时间轴布局轴上圆点的 Important 感叹号图标颜色。仅当布局样式设置为时间轴时显示。",
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
        iconVisibleLabel: "显示图标",
        iconVisibleDesc: "显示或隐藏此类别的图标",
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
        colorName: "名称",
        colorType: "类型",
        colorBadge: "周年数",
        colorWhen: "倒计时",
        colorText: "自定义文本",
        colorNameDesc: "事件名称的文本颜色",
        colorLastName: "姓氏",
        colorLastNameDesc: "事件姓氏的文本颜色",
        colorFullName: "全名",
        colorFullNameDesc: "事件全名（名+姓）的文本颜色",
        cardTitleColorDesc: "卡片自身标题的文本颜色",
        colorTypeDesc: "事件类型的文本颜色",
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
        fontNameDesc: "事件名称的字体大小",
        fontLastNameDesc: "事件姓氏的字体大小",
        fontFullNameDesc: "事件全名（名+姓）的字体大小",
        fontTypeDesc: "事件类型的字体大小",
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
        panelLayoutDesc: "显示、字体、颜色、图标、卡片背景和时间轴",
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
      // Skloňování libovolně zadaných jmen podle pádů nelze bezpečně
      // provést automaticky, proto se místo genitivu používá neutrální
      // tvar "Jméno: N. typ — kdy" - stejný tvar funguje pro minulé i
      // budoucí události, protože samotné "kdy" (např. "včera"/"za 3 dny")
      // už čas vyjadřuje.
      possessive: (name) => name,
      ordinalParts: (n) => ({ num: `${n}.`, sup: "" }),
      timelineSentence: "{possessive}: {ordinal}{sup} {type} — {when}",
      timelineSentenceSimple: "{name} — {when}",
      timelineSentencePast: "{possessive}: {ordinal}{sup} {type} — {when}",
      timelineSentenceSimplePast: "{name} — {when}",
      timelineExpand: "Podrobnosti",
      timelineCollapse: "Méně",
      timelineMore: "Více",
      types: {
        birthday: "Narozeniny",
        anniversary: "Výročí",
        name_day: "Svátek",
        wedding_anniversary: "Výročí svatby",
        memorial: "Výročí úmrtí",
        pet_birthday: "Narozeniny mazlíčka",
        work_anniversary: "Pracovní výročí",
        custom: "Vlastní",
        one_time: "Jednorázová událost",
        holiday: "Státní svátek",
        calendar: "Kalendářní událost",
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
        one_time: "Jednorázové události",
        holiday: "Státní svátky",
        calendar: "Kalendářní události",
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
        layoutStyleLabel: "Styl rozvržení",
        layoutStyleDesc:
          "Seznam zobrazuje klasické řádky s ikonou/jménem/podtitulem/odznakem/odpočtem. Timeline zobrazuje kompaktní vodorovnou osu se zvýrazněnou nejbližší událostí a ostatními jako klikatelné body - vhodné pro úzký sloupec v zobrazení Sekce.",
        layoutStyleList: "Seznam",
        layoutStyleTimeline: "Timeline",
        timelineLineHeading: "Čára osy",
        timelineLineWidth: "Tloušťka",
        timelineLineWidthDesc: "Tloušťka vodorovné čáry osy, např. „4px“.",
        timelineLineColor: "Barva",
        timelineLineColorDesc: "Barva vodorovné čáry osy.",
        timelineDividerHeading: "Oddělovací čára",
        timelineDividerWidth: "Tloušťka",
        timelineDividerWidthDesc:
          "Tloušťka svislé čáry oddělující minulost a budoucnost, např. „1px“.",
        timelineDividerColor: "Barva",
        timelineDividerColorDesc: "Barva svislé oddělovací čáry mezi minulostí a budoucností.",
        lineStyleLabel: "Styl",
        lineStyleSolid: "Plná",
        lineStyleDashed: "Čárkovaná",
        lineStyleDotted: "Tečkovaná",
        timelineOptionsHeading: "Možnosti",
        timelineShowFullName: "Zobrazit celé jméno",
        timelineShowFullNameDesc:
          "Zobrazí u každé události celé jméno (jméno a příjmení) místo pouze jména, v záhlaví, popisku a v rozbalovacím seznamu.",
        showHolidaySuffix: "Zobrazit příponu svátku",
        showHolidaySuffixDesc:
          "Přidá zemi svátku (a případně region) v závorce za jeho název, např. „Pioneer Day (US-UT)“.",
        timelineShowDate: "Zobrazit datum",
        timelineShowDateDesc:
          "Na konci přidá v závorce krátké datum, např. „...je za 3 dny (6. srp)“. V den samotné události je skryto, protože věta už těsně předtím končí slovy „...je dnes“.",
        timelineShowTime: "Zobrazit čas",
        timelineShowTimeDesc:
          "Ve stejné závorce přidá vlastní časové rozmezí externí kalendářní události, např. „...je za 3 dny (14:00–15:00)“. Zobrazuje se pouze u časově vymezené (nikoli celodenní) externí kalendářní události. Formát času se řídí jazykem nastaveným v Home Assistant.",
        timelineShowLocation: "Zobrazit místo",
        timelineShowLocationDesc:
          "Ve stejné závorce přidá vlastní místo externí kalendářní události. Zobrazuje se pouze u externí kalendářní události, která má místo nastaveno.",
        timelineShowDescription: "Zobrazit popis",
        timelineShowDescriptionDesc:
          "Ve stejné závorce přidá vlastní popis externí kalendářní události. Zobrazuje se pouze u externí kalendářní události, která má popis nastaven.",
        timelineHeaderMaxEvents: "Max. počet událostí za den",
        timelineHeaderMaxEventsDesc:
          "Omezuje, kolik řádků záhlaví přispěje jeden den se současně probíhajícími událostmi, např. 3 narozeniny ve stejný den. Další události daného dne přesto dostanou vlastní tečku na ose, jen bez vlastního řádku záhlaví. Ponechte prázdné pro neomezený počet.",
        timelineHeaderMinEvents: "Vždy zobrazit N nadcházejících",
        timelineHeaderMinEventsDesc:
          "Vždy zobrazí alespoň tolik řádků záhlaví, přičemž v případě potřeby zahrne další nadcházející (nebo, pokud dojdou, další nedávno uplynulé) dny nad rámec toho úplně nejbližšího - každý z nich stále omezen výše uvedeným „max. počtem událostí za den“. Ponechte prázdné (nebo 0), chcete-li zobrazit pouze události úplně nejbližšího dne.",
        moreAction: "Tlačítko „Více“",
        moreActionDesc:
          "Co dělá tlačítko „Více“ vpravo dole na časové ose. Obvykle akce navigace na řídicí panel zobrazující stejné události v plném rozvržení Seznam. Ponechte na „Nic“, chcete-li tlačítko skrýt.",
        groupTimeline: "Timeline",
        groupTimelineDesc: "Používá se pouze tehdy, když je Styl rozvržení (v sekci Zobrazení) nastaven na Timeline.",
        timelineHeaderLabel: "Záhlaví",
        timelineHeaderFontDesc:
          "Písmo pro popisný řádek nad osou, např. „Kevin: 27. narozeniny — dnes“.",
        timelineHeaderColorDesc: "Barva textu popisného řádku nad osou.",
        timelineTooltipLabel: "Bublina nápovědy",
        timelineTooltipFontDesc: "Písmo textu zobrazeného po kliknutí na bod na ose.",
        timelineTooltipColorDesc: "Barva textu zobrazeného po kliknutí na bod na ose.",
        timelineListLabel: "Seznam (Podrobnosti)",
        timelineListFontDesc: "Písmo rozbalovacího chronologického seznamu pod osou.",
        timelineListColorDesc: "Barva textu rozbalovacího chronologického seznamu pod osou.",
        timelineButtonLabel: "Tlačítko Podrobnosti / Více",
        timelineButtonFontDesc: "Písmo tlačítek Podrobnosti a Více v patičce.",
        timelineButtonColorDesc: "Barva textu tlačítek Podrobnosti a Více v patičce.",
        eventTypesHeading: "Typy událostí",
        eventTypeColorDesc: "Barva ikony a tečky tohoto typu události na časové ose.",
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
        visibilityNameDesc: "Zobrazit jméno události",
        visibilityTypeDesc: "Zobrazit typ události",
        visibilityCountrySuffix: "Přípona svátku",
        visibilityCountrySuffixDesc: "Připojit zemi (a případně kraj) za název/typ svátku, např. „Den české státnosti · CZ (PR)“",
        columnsHeading: "Sloupce řádku",
        columnsDesc:
          "Přidávejte, odebírejte a měňte pořadí toho, co každý řádek zobrazuje. Vlastní textové sloupce mohou kombinovat volný text se zástupnými symboly: {name}, {last_name}, {full_name}, {type}, {occurrence}, {when}, {date}, {country}, {time}, {location}, {description}.",
        columnTypeIcon: "Ikona",
        columnTypeInfo: "Jméno + typ",
        columnTypeName: "Jméno",
        columnTypeLastName: "Příjmení",
        columnTypeFullName: "Celé jméno",
        columnTypeFullNameType: "Celé jméno + typ",
        columnTypeType: "Typ",
        columnTypeText: "Vlastní text",
        columnTypeDate: "Datum",
        columnTypeTime: "Čas",
        columnTypeLocation: "Místo",
        columnTypeDescription: "Popis",
        columnTypeTimeDesc:
          "Přidá vlastní časové rozmezí externí kalendářní události, např. „...03:00 PM–05:00 PM“. Zobrazuje se pouze u časově vymezené (nikoli celodenní) externí kalendářní události.",
        columnTypeLocationDesc:
          "Přidá vlastní místo externí kalendářní události. Zobrazuje se pouze u externí kalendářní události, která má místo nastavené.",
        columnTypeDescriptionDesc:
          "Přidá vlastní popis externí kalendářní události. Zobrazuje se pouze u externí kalendářní události, která má popis nastavený.",
        suffixLabel: "Přípona",
        suffixGroupHolidayTitle: "Pouze svátky",
        suffixGroupExternalTitle: "Pouze externí kalendáře",
        suffixShowCalendarName: "Název kalendáře",
        suffixShowCalendarNameDesc:
          "Zobrazí zde vlastní název externího kalendáře (např. „Osobní“). Vypněte, jakmile níže uvedené Čas/Místo/Popis samy o sobě říkají dost.",
        externalCalendarsHeading: "Externí kalendáře",
        externalCalendarsDesc:
          "Vloží jeden nebo více vašich stávajících kalendářů Home Assistant vedle vlastních událostí Annuals - každá skončí ve svém skutečném dni (a u časově vymezených událostí je v rámci daného dne seřazena podle času) místo jakéhokoli výpočtu „příštího výskytu“. Chcete-li u těchto událostí zobrazit pole čas/místo/popis, přidejte výše odpovídající sloupec.",
        externalCalendarsLabel: "Kalendáře",
        externalCalendarsLabelDesc: "Které entity calendar.* se mají vložit.",
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
        vipBadgeColorList: "Barva odznaku (Seznam)",
        vipBadgeColorListDesc:
          "Barva hvězdičkového odznaku VIP v rohovém odznaku rozvržení Seznam, v záhlaví rozvržení Timeline a v jeho rozbalovacím seznamu Podrobnosti.",
        vipBadgeColorTimeline: "Barva odznaku (Timeline)",
        vipBadgeColorTimelineDesc:
          "Barva ikony hvězdičky VIP konkrétně na bodech osy rozvržení Timeline. Zobrazí se pouze při nastavení Stylu rozvržení na Timeline.",
        importantBadgeColorList: "Barva odznaku (Seznam)",
        importantBadgeColorListDesc:
          "Barva odznaku s vykřičníkem Important v rohovém odznaku rozvržení Seznam, v záhlaví rozvržení Timeline a v jeho rozbalovacím seznamu Podrobnosti.",
        importantBadgeColorTimeline: "Barva odznaku (Timeline)",
        importantBadgeColorTimelineDesc:
          "Barva ikony vykřičníku Important konkrétně na bodech osy rozvržení Timeline. Zobrazí se pouze při nastavení Stylu rozvržení na Timeline.",
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
        iconVisibleLabel: "Zobrazit ikonu",
        iconVisibleDesc: "Zobrazit nebo skrýt ikonu pro tuto kategorii",
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
        colorName: "Jméno",
        colorType: "Typ",
        colorBadge: "Výročí",
        colorWhen: "Odpočet",
        colorText: "Vlastní text",
        colorNameDesc: "Barva textu pro jméno události",
        colorLastName: "Příjmení",
        colorLastNameDesc: "Barva textu pro příjmení události",
        colorFullName: "Celé jméno",
        colorFullNameDesc: "Barva textu pro celé jméno události (jméno a příjmení)",
        cardTitleColorDesc: "Barva textu pro vlastní název karty",
        colorTypeDesc: "Barva textu pro typ události",
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
        fontNameDesc: "Velikost písma pro jméno události",
        fontLastNameDesc: "Velikost písma pro příjmení události",
        fontFullNameDesc: "Velikost písma pro celé jméno události (jméno a příjmení)",
        fontTypeDesc: "Velikost písma pro typ události",
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
        panelLayoutDesc: "Zobrazení, písma, barvy, ikony, pozadí karty a timeline",
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
      possessive: (name) => (/[sxz]$/i.test(name) ? `${name}'` : `${name}s`),
      ordinalParts: (n) => ({ num: `${n}.`, sup: "" }),
      timelineSentence: "{possessive} {ordinal}{sup} {type} er {when}",
      timelineSentenceSimple: "{name} er {when}",
      timelineSentencePast: "{possessive} {ordinal}{sup} {type} var {when}",
      timelineSentenceSimplePast: "{name} var {when}",
      timelineExpand: "Detaljer",
      timelineCollapse: "Mindre",
      timelineMore: "Mer",
      types: {
        birthday: "Bursdag",
        anniversary: "Jubileum",
        name_day: "Navnedag",
        wedding_anniversary: "Bryllupsdag",
        memorial: "Minnedag",
        pet_birthday: "Kjæledyrs bursdag",
        work_anniversary: "Arbeidsjubileum",
        custom: "Egendefinert",
        one_time: "Engangshendelse",
        holiday: "Helligdag",
        calendar: "Kalenderhendelse",
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
        one_time: "Engangshendelser",
        holiday: "Helligdager",
        calendar: "Kalenderhendelser",
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
        layoutStyleLabel: "Kortlayout",
        layoutStyleDesc:
          "Liste viser de klassiske radene med ikon/navn/undertittel/merke/nedtelling. Timeline viser en kompakt horisontal akse med den neste hendelsen uthevet og resten som klikkbare punkter - praktisk for en smal kolonne i Seksjoner-visningen.",
        layoutStyleList: "Liste",
        layoutStyleTimeline: "Timeline",
        timelineLineHeading: "Tidslinje",
        timelineLineWidth: "Tykkelse",
        timelineLineWidthDesc: "Tykkelse på den horisontale akselinjen, f.eks. «4px».",
        timelineLineColor: "Farge",
        timelineLineColorDesc: "Farge på den horisontale akselinjen.",
        timelineDividerHeading: "Skillelinje",
        timelineDividerWidth: "Tykkelse",
        timelineDividerWidthDesc:
          "Tykkelse på den vertikale linjen som markerer grensen mellom fortid og fremtid, f.eks. «1px».",
        timelineDividerColor: "Farge",
        timelineDividerColorDesc: "Farge på den vertikale skillelinjen mellom fortid og fremtid.",
        lineStyleLabel: "Stil",
        lineStyleSolid: "Heltrukket",
        lineStyleDashed: "Stiplet",
        lineStyleDotted: "Prikket",
        timelineOptionsHeading: "Alternativer",
        timelineShowFullName: "Vis fullt navn",
        timelineShowFullNameDesc:
          "Viser det fulle navnet (for- og etternavn) for hver hendelse i stedet for bare fornavnet, i overskriften, verktøytipset og den utvidbare listen.",
        showHolidaySuffix: "Vis høytidssuffiks",
        showHolidaySuffixDesc:
          "Legg til høytidens land (og region, hvis noen) i parentes etter navnet, f.eks. «Pioneer Day (US-UT)».",
        timelineShowDate: "Vis dato",
        timelineShowDateDesc:
          "Legger til den korte datoen i parentes til slutt, f.eks. «...er om 3 dager (6. aug)». Skjules på selve dagen, siden setningen allerede slutter med «...er i dag» rett før.",
        timelineShowTime: "Vis klokkeslett",
        timelineShowTimeDesc:
          "Legger til en ekstern kalenderhendelses eget tidsrom i samme parentes, f.eks. «...er om 3 dager (14:00–15:00)». Vises bare for en tidsbestemt (ikke heldags) ekstern kalenderhendelse. Tidsformatet følger språkinnstillingen i Home Assistant.",
        timelineShowLocation: "Vis sted",
        timelineShowLocationDesc:
          "Legger til en ekstern kalenderhendelses eget sted i samme parentes. Vises bare for en ekstern kalenderhendelse som har et sted angitt.",
        timelineShowDescription: "Vis beskrivelse",
        timelineShowDescriptionDesc:
          "Legger til en ekstern kalenderhendelses egen beskrivelse i samme parentes. Vises bare for en ekstern kalenderhendelse som har en beskrivelse angitt.",
        timelineHeaderMaxEvents: "Maks hendelser per dag",
        timelineHeaderMaxEventsDesc:
          "Begrenser hvor mange overskriftslinjer én enkelt dag med samtidige hendelser bidrar med, f.eks. 3 bursdager samme dag. Ytterligere hendelser den dagen får likevel sin egen prikk på aksen, bare uten egen overskriftslinje. La stå tomt for ingen grense.",
        timelineHeaderMinEvents: "Vis alltid N kommende",
        timelineHeaderMinEventsDesc:
          "Viser alltid minst så mange overskriftslinjer, ved å ved behov inkludere flere kommende (eller, når de tar slutt, flere nylig passerte) dager utover den aller nærmeste - hver av dem fortsatt begrenset av «maks hendelser per dag» ovenfor. La stå tomt (eller 0) for å bare vise den aller nærmeste dagens egne hendelser.",
        moreAction: "«Mer»-knapp",
        moreActionDesc:
          "Hva «Mer»-knappen nederst til høyre i tidslinjen gjør. Vanligvis en navigasjonshandling til et dashbord som viser de samme hendelsene i det fulle Liste-layoutet. La stå på «Ingenting» for å skjule knappen.",
        groupTimeline: "Timeline",
        groupTimelineDesc: "Brukes kun når Kortlayout (under Visning) er satt til Timeline.",
        timelineHeaderLabel: "Overskrift",
        timelineHeaderFontDesc:
          "Skrift for beskrivelseslinjen over aksen, f.eks. «Kevins 27. bursdag er i dag».",
        timelineHeaderColorDesc: "Tekstfarge for beskrivelseslinjen over aksen.",
        timelineTooltipLabel: "Verktøytips",
        timelineTooltipFontDesc: "Skrift for teksten som vises når et punkt på aksen klikkes.",
        timelineTooltipColorDesc: "Tekstfarge for teksten som vises når et punkt på aksen klikkes.",
        timelineListLabel: "Liste (Detaljer)",
        timelineListFontDesc: "Skrift for den utvidbare kronologiske listen under aksen.",
        timelineListColorDesc: "Tekstfarge for den utvidbare kronologiske listen under aksen.",
        timelineButtonLabel: "Detaljer-/Mer-knapp",
        timelineButtonFontDesc: "Skrift for Detaljer- og Mer-knappene i bunnteksten.",
        timelineButtonColorDesc: "Tekstfarge for Detaljer- og Mer-knappene i bunnteksten.",
        eventTypesHeading: "Hendelsestyper",
        eventTypeColorDesc: "Farge for ikonet og punktet til denne hendelsestypen på tidslinjen.",
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
        visibilityNameDesc: "Vis hendelsens navn",
        visibilityTypeDesc: "Vis hendelsestypen",
        visibilityCountrySuffix: "Helligdagssuffiks",
        visibilityCountrySuffixDesc: "Legg til landet (og eventuelt fylket) etter helligdagens navn/type, f.eks. «Grunnlovsdagen · NO (OSL)»",
        columnsHeading: "Radkolonner",
        columnsDesc:
          "Legg til, fjern og endre rekkefølgen på det hver rad viser. Egendefinerte tekstkolonner kan blande fri tekst med plassholdere: {name}, {last_name}, {full_name}, {type}, {occurrence}, {when}, {date}, {country}, {time}, {location}, {description}.",
        columnTypeIcon: "Ikon",
        columnTypeInfo: "Navn + type",
        columnTypeName: "Navn",
        columnTypeLastName: "Etternavn",
        columnTypeFullName: "Fullt navn",
        columnTypeFullNameType: "Fullt navn + type",
        columnTypeType: "Type",
        columnTypeText: "Egendefinert tekst",
        columnTypeDate: "Dato",
        columnTypeTime: "Klokkeslett",
        columnTypeLocation: "Sted",
        columnTypeDescription: "Beskrivelse",
        columnTypeTimeDesc:
          "Legger til den eksterne kalenderhendelsens eget tidsrom, f.eks. «...03:00 PM–05:00 PM». Vises bare for en tidsbestemt (ikke heldags) ekstern kalenderhendelse.",
        columnTypeLocationDesc:
          "Legger til den eksterne kalenderhendelsens eget sted. Vises bare for en ekstern kalenderhendelse som har et sted angitt.",
        columnTypeDescriptionDesc:
          "Legger til den eksterne kalenderhendelsens egen beskrivelse. Vises bare for en ekstern kalenderhendelse som har en beskrivelse angitt.",
        suffixLabel: "Suffiks",
        suffixGroupHolidayTitle: "Kun helligdager",
        suffixGroupExternalTitle: "Kun eksterne kalendere",
        suffixShowCalendarName: "Kalendernavn",
        suffixShowCalendarNameDesc:
          "Vis den eksterne kalenderens eget navn her (f.eks. «Privat»). Slå av når Klokkeslett/Sted/Beskrivelse nedenfor allerede sier nok på egen hånd.",
        externalCalendarsHeading: "Eksterne kalendere",
        externalCalendarsDesc:
          "Legg inn én eller flere av dine eksisterende Home Assistant-kalendere sammen med Annuals' egne hendelser - hver havner på sin faktiske dag (og for tidsbestemte hendelser sorteres den etter klokkeslett innenfor den dagen) i stedet for noen «neste forekomst»-beregning. Legg til en Klokkeslett-/Sted-/Beskrivelse-kolonne ovenfor for å vise disse feltene for disse hendelsene.",
        externalCalendarsLabel: "Kalendere",
        externalCalendarsLabelDesc: "Hvilke calendar.*-enheter som skal legges inn.",
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
        vipBadgeColorList: "Merkefarge (Liste)",
        vipBadgeColorListDesc:
          "Farge på VIP-stjernemerket i hjørnemerket til Liste-layoutet, i overskriften til Timeline-layoutet og i dets utvidbare Detaljer-liste.",
        vipBadgeColorTimeline: "Merkefarge (Timeline)",
        vipBadgeColorTimelineDesc:
          "Farge på VIP-stjerneikonet spesifikt på akse-punktene til Timeline-layoutet. Vises kun når Kortlayout er satt til Timeline.",
        importantBadgeColorList: "Merkefarge (Liste)",
        importantBadgeColorListDesc:
          "Farge på Important-utropstegnmerket i hjørnemerket til Liste-layoutet, i overskriften til Timeline-layoutet og i dets utvidbare Detaljer-liste.",
        importantBadgeColorTimeline: "Merkefarge (Timeline)",
        importantBadgeColorTimelineDesc:
          "Farge på Important-utropstegnikonet spesifikt på akse-punktene til Timeline-layoutet. Vises kun når Kortlayout er satt til Timeline.",
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
        iconVisibleLabel: "Vis ikon",
        iconVisibleDesc: "Vis eller skjul ikonet for denne kategorien",
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
        colorName: "Navn",
        colorType: "Type",
        colorBadge: "Jubileum",
        colorWhen: "Nedtelling",
        colorText: "Egendefinert tekst",
        colorNameDesc: "Tekstfarge for hendelsens navn",
        colorLastName: "Etternavn",
        colorLastNameDesc: "Tekstfarge for hendelsens etternavn",
        colorFullName: "Fullt navn",
        colorFullNameDesc: "Tekstfarge for hendelsens fulle navn (fornavn og etternavn)",
        cardTitleColorDesc: "Tekstfarge for kortets egen tittel",
        colorTypeDesc: "Tekstfarge for hendelsestypen",
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
        fontNameDesc: "Skriftstørrelse for hendelsens navn",
        fontLastNameDesc: "Skriftstørrelse for hendelsens etternavn",
        fontFullNameDesc: "Skriftstørrelse for hendelsens fulle navn (fornavn og etternavn)",
        fontTypeDesc: "Skriftstørrelse for hendelsestypen",
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
        panelLayoutDesc: "Visning, skrifter, farger, ikoner, kortbakgrunn og timeline",
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
      possessive: (name) => (/[sxz]$/i.test(name) ? `${name}'` : `${name}s`),
      ordinalParts: (n) => ({ num: `${n}.`, sup: "" }),
      timelineSentence: "{possessive} {ordinal}{sup} {type} er {when}",
      timelineSentenceSimple: "{name} er {when}",
      timelineSentencePast: "{possessive} {ordinal}{sup} {type} var {when}",
      timelineSentenceSimplePast: "{name} var {when}",
      timelineExpand: "Detaljer",
      timelineCollapse: "Mindre",
      timelineMore: "Mere",
      types: {
        birthday: "Fødselsdag",
        anniversary: "Mærkedag",
        name_day: "Navnedag",
        wedding_anniversary: "Bryllupsdag",
        memorial: "Mindedag",
        pet_birthday: "Kæledyrs fødselsdag",
        work_anniversary: "Jubilæum på arbejdet",
        custom: "Tilpasset",
        one_time: "Engangsbegivenhed",
        holiday: "Helligdag",
        calendar: "Kalenderbegivenhed",
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
        one_time: "Engangsbegivenheder",
        holiday: "Helligdage",
        calendar: "Kalenderbegivenheder",
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
        layoutStyleLabel: "Kortlayout",
        layoutStyleDesc:
          "Liste viser de klassiske rækker med ikon/navn/undertekst/badge/nedtælling. Timeline viser en kompakt vandret akse med den næste begivenhed fremhævet og resten som klikbare punkter - praktisk til en smal kolonne i Sektioner-visningen.",
        layoutStyleList: "Liste",
        layoutStyleTimeline: "Timeline",
        timelineLineHeading: "Tidslinje",
        timelineLineWidth: "Tykkelse",
        timelineLineWidthDesc: "Tykkelse på den vandrette akselinje, f.eks. „4px”.",
        timelineLineColor: "Farve",
        timelineLineColorDesc: "Farve på den vandrette akselinje.",
        timelineDividerHeading: "Skillelinje",
        timelineDividerWidth: "Tykkelse",
        timelineDividerWidthDesc:
          "Tykkelse på den lodrette linje, der markerer grænsen mellem fortid og fremtid, f.eks. „1px”.",
        timelineDividerColor: "Farve",
        timelineDividerColorDesc: "Farve på den lodrette skillelinje mellem fortid og fremtid.",
        lineStyleLabel: "Stil",
        lineStyleSolid: "Massiv",
        lineStyleDashed: "Stiplet",
        lineStyleDotted: "Prikket",
        timelineOptionsHeading: "Indstillinger",
        timelineShowFullName: "Vis fulde navn",
        timelineShowFullNameDesc:
          "Viser det fulde navn (for- og efternavn) for hver begivenhed i stedet for kun fornavnet, i overskriften, tooltippet og den udvidelige liste.",
        showHolidaySuffix: "Vis helligdagssuffiks",
        showHolidaySuffixDesc:
          "Tilføj helligdagens land (og region, hvis nogen) i parentes efter navnet, f.eks. „Pioneer Day (US-UT)”.",
        timelineShowDate: "Vis dato",
        timelineShowDateDesc:
          "Tilføjer den korte dato i parentes til sidst, f.eks. „...er om 3 dage (6. aug)”. Skjules på selve dagen, da sætningen allerede lige inden slutter med „...er i dag”.",
        timelineShowTime: "Vis klokkeslæt",
        timelineShowTimeDesc:
          "Tilføjer en ekstern kalenderbegivenheds eget tidsinterval i samme parentes, f.eks. „...er om 3 dage (14:00–15:00)”. Vises kun for en tidsbestemt (ikke heldags) ekstern kalenderbegivenhed. Tidsformatet følger sprogindstillingen i Home Assistant.",
        timelineShowLocation: "Vis sted",
        timelineShowLocationDesc:
          "Tilføjer en ekstern kalenderbegivenheds eget sted i samme parentes. Vises kun for en ekstern kalenderbegivenhed, der har et sted angivet.",
        timelineShowDescription: "Vis beskrivelse",
        timelineShowDescriptionDesc:
          "Tilføjer en ekstern kalenderbegivenheds egen beskrivelse i samme parentes. Vises kun for en ekstern kalenderbegivenhed, der har en beskrivelse angivet.",
        timelineHeaderMaxEvents: "Maks. antal begivenheder pr. dag",
        timelineHeaderMaxEventsDesc:
          "Begrænser, hvor mange overskriftslinjer én enkelt dag med sammenfaldende begivenheder bidrager med, f.eks. 3 fødselsdage samme dag. Yderligere begivenheder den dag får stadig deres egen prik på aksen, blot uden egen overskriftslinje. Lad stå tomt for ingen grænse.",
        timelineHeaderMinEvents: "Vis altid N kommende",
        timelineHeaderMinEventsDesc:
          "Viser altid mindst så mange overskriftslinjer ved om nødvendigt at inddrage yderligere kommende (eller, når de slipper op, yderligere for nylig overståede) dage ud over selve den nærmeste - hver af dem stadig begrænset af „maks. antal begivenheder pr. dag” ovenfor. Lad stå tomt (eller 0) for kun at vise selve den nærmeste dags egne begivenheder.",
        moreAction: "„Mere”-knap",
        moreActionDesc:
          "Hvad „Mere”-knappen nederst til højre i tidslinjen gør. Typisk en navigationshandling til et dashboard, der viser de samme begivenheder i det fulde Liste-layout. Lad den stå på „Intet” for at skjule knappen.",
        groupTimeline: "Timeline",
        groupTimelineDesc: "Bruges kun når Kortlayout (under Visning) er sat til Timeline.",
        timelineHeaderLabel: "Overskrift",
        timelineHeaderFontDesc:
          "Skrifttype til beskrivelseslinjen over aksen, f.eks. „Kevins 27. fødselsdag er i dag”.",
        timelineHeaderColorDesc: "Tekstfarve til beskrivelseslinjen over aksen.",
        timelineTooltipLabel: "Værktøjstip",
        timelineTooltipFontDesc: "Skrifttype til teksten, der vises, når der klikkes på et punkt på aksen.",
        timelineTooltipColorDesc: "Tekstfarve til teksten, der vises, når der klikkes på et punkt på aksen.",
        timelineListLabel: "Liste (Detaljer)",
        timelineListFontDesc: "Skrifttype til den udvidelige kronologiske liste under aksen.",
        timelineListColorDesc: "Tekstfarve til den udvidelige kronologiske liste under aksen.",
        timelineButtonLabel: "Detaljer-/Mere-knap",
        timelineButtonFontDesc: "Skrifttype til Detaljer- og Mere-knapperne i bunden.",
        timelineButtonColorDesc: "Tekstfarve til Detaljer- og Mere-knapperne i bunden.",
        eventTypesHeading: "Begivenhedstyper",
        eventTypeColorDesc: "Farve til ikonet og prikken for denne begivenhedstype på tidslinjen.",
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
        visibilityNameDesc: "Vis begivenhedens navn",
        visibilityTypeDesc: "Vis begivenhedstypen",
        visibilityCountrySuffix: "Helligdagssuffiks",
        visibilityCountrySuffixDesc: "Tilføj landet (og evt. regionen) efter helligdagens navn/type, f.eks. \"Grundlovsdag · DK (84)\"",
        columnsHeading: "Rækkekolonner",
        columnsDesc:
          "Tilføj, fjern og omorganiser hvad hver række viser. Brugerdefinerede tekstkolonner kan blande fri tekst med pladsholdere: {name}, {last_name}, {full_name}, {type}, {occurrence}, {when}, {date}, {country}, {time}, {location}, {description}.",
        columnTypeIcon: "Ikon",
        columnTypeInfo: "Navn + type",
        columnTypeName: "Navn",
        columnTypeLastName: "Efternavn",
        columnTypeFullName: "Fulde navn",
        columnTypeFullNameType: "Fulde navn + type",
        columnTypeType: "Type",
        columnTypeText: "Brugerdefineret tekst",
        columnTypeDate: "Dato",
        columnTypeTime: "Klokkeslæt",
        columnTypeLocation: "Sted",
        columnTypeDescription: "Beskrivelse",
        columnTypeTimeDesc:
          "Tilføjer den eksterne kalenderbegivenheds eget tidsinterval, f.eks. „...03:00 PM–05:00 PM”. Vises kun for en tidsbestemt (ikke heldags) ekstern kalenderbegivenhed.",
        columnTypeLocationDesc:
          "Tilføjer den eksterne kalenderbegivenheds eget sted. Vises kun for en ekstern kalenderbegivenhed, der har et sted angivet.",
        columnTypeDescriptionDesc:
          "Tilføjer den eksterne kalenderbegivenheds egen beskrivelse. Vises kun for en ekstern kalenderbegivenhed, der har en beskrivelse angivet.",
        suffixLabel: "Suffiks",
        suffixGroupHolidayTitle: "Kun helligdage",
        suffixGroupExternalTitle: "Kun eksterne kalendere",
        suffixShowCalendarName: "Kalendernavn",
        suffixShowCalendarNameDesc:
          "Vis den eksterne kalenders eget navn her (f.eks. „Privat”). Slå fra, når Klokkeslæt/Sted/Beskrivelse nedenfor allerede siger nok i sig selv.",
        externalCalendarsHeading: "Eksterne kalendere",
        externalCalendarsDesc:
          "Indlejr en eller flere af dine eksisterende Home Assistant-kalendere sammen med Annuals' egne begivenheder - hver havner på sin faktiske dag (og for tidsbestemte begivenheder sorteres den efter klokkeslæt inden for den dag) i stedet for en „næste forekomst”-beregning. Tilføj en Klokkeslæt-/Sted-/Beskrivelse-kolonne ovenfor for at vise disse felter for disse begivenheder.",
        externalCalendarsLabel: "Kalendere",
        externalCalendarsLabelDesc: "Hvilke calendar.*-entiteter der skal indlejres.",
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
        vipBadgeColorList: "Mærkefarve (Liste)",
        vipBadgeColorListDesc:
          "Farve på VIP-stjernemærket i Liste-layoutets hjørnemærke, i Timeline-layoutets overskrift og i dets udvidelige Detaljer-liste.",
        vipBadgeColorTimeline: "Mærkefarve (Timeline)",
        vipBadgeColorTimelineDesc:
          "Farve på VIP-stjerneikonet specifikt på Timeline-layoutets akse-punkter. Vises kun når Kortlayout er sat til Timeline.",
        importantBadgeColorList: "Mærkefarve (Liste)",
        importantBadgeColorListDesc:
          "Farve på Important-udråbstegnsmærket i Liste-layoutets hjørnemærke, i Timeline-layoutets overskrift og i dets udvidelige Detaljer-liste.",
        importantBadgeColorTimeline: "Mærkefarve (Timeline)",
        importantBadgeColorTimelineDesc:
          "Farve på Important-udråbstegnsikonet specifikt på Timeline-layoutets akse-punkter. Vises kun når Kortlayout er sat til Timeline.",
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
        iconVisibleLabel: "Vis ikon",
        iconVisibleDesc: "Vis eller skjul ikonet for denne kategori",
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
        colorName: "Navn",
        colorType: "Type",
        colorBadge: "Jubilæum",
        colorWhen: "Nedtælling",
        colorText: "Brugerdefineret tekst",
        colorNameDesc: "Tekstfarve for begivenhedens navn",
        colorLastName: "Efternavn",
        colorLastNameDesc: "Tekstfarve for begivenhedens efternavn",
        colorFullName: "Fulde navn",
        colorFullNameDesc: "Tekstfarve for begivenhedens fulde navn (fornavn og efternavn)",
        cardTitleColorDesc: "Tekstfarve for kortets egen titel",
        colorTypeDesc: "Tekstfarve for begivenhedstypen",
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
        fontNameDesc: "Skriftstørrelse for begivenhedens navn",
        fontLastNameDesc: "Skriftstørrelse for begivenhedens efternavn",
        fontFullNameDesc: "Skriftstørrelse for begivenhedens fulde navn (fornavn og efternavn)",
        fontTypeDesc: "Skriftstørrelse for begivenhedstypen",
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
        panelLayoutDesc: "Visning, skrifttyper, farver, ikoner, kortbaggrund og timeline",
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
      // Türkçedeki iyelik eki (-'nin/-'nın/-'nün/-'nun) ünlü uyumuna göre
      // değişir ve rastgele girilen isimlere güvenli biçimde
      // uygulanamayacağından, cümle bunun yerine "İsim: N. tür — ne zaman"
      // biçiminde kuruluyor - aynı biçim hem geçmiş hem gelecek etkinlikler
      // için çalışıyor, çünkü "ne zaman" (ör. "dün"/"3 gün sonra") zamanı
      // zaten belirtiyor.
      possessive: (name) => name,
      ordinalParts: (n) => ({ num: `${n}.`, sup: "" }),
      timelineSentence: "{possessive}: {ordinal}{sup} {type} — {when}",
      timelineSentenceSimple: "{name} — {when}",
      timelineSentencePast: "{possessive}: {ordinal}{sup} {type} — {when}",
      timelineSentenceSimplePast: "{name} — {when}",
      timelineExpand: "Ayrıntılar",
      timelineCollapse: "Daha az",
      timelineMore: "Daha fazla",
      types: {
        birthday: "Doğum günü",
        anniversary: "Yıl dönümü",
        name_day: "İsim günü",
        wedding_anniversary: "Evlilik yıl dönümü",
        memorial: "Ölüm yıl dönümü",
        pet_birthday: "Evcil hayvan doğum günü",
        work_anniversary: "İş yıl dönümü",
        custom: "Özel",
        one_time: "Tek seferlik etkinlik",
        holiday: "Resmi tatil",
        calendar: "Takvim etkinliği",
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
        one_time: "Tek seferlik etkinlikler",
        holiday: "Resmi tatiller",
        calendar: "Takvim etkinlikleri",
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
        layoutStyleLabel: "Düzen stili",
        layoutStyleDesc:
          "Liste, klasik simge/ad/alt başlık/rozet/geri sayım satırlarını gösterir. Timeline, bir sonraki etkinliğin vurgulandığı ve geri kalanının tıklanabilir noktalar olarak gösterildiği kompakt bir yatay eksen gösterir - Bölümler görünümünde dar bir sütun için kullanışlıdır.",
        layoutStyleList: "Liste",
        layoutStyleTimeline: "Timeline",
        timelineLineHeading: "Zaman çizelgesi çizgisi",
        timelineLineWidth: "Kalınlık",
        timelineLineWidthDesc: "Yatay eksen çizgisinin kalınlığı, örn. \"4px\".",
        timelineLineColor: "Renk",
        timelineLineColorDesc: "Yatay eksen çizgisinin rengi.",
        timelineDividerHeading: "Ayırıcı çizgi",
        timelineDividerWidth: "Kalınlık",
        timelineDividerWidthDesc:
          "Geçmiş ile gelecek arasındaki sınırı işaretleyen dikey çizginin kalınlığı, örn. \"1px\".",
        timelineDividerColor: "Renk",
        timelineDividerColorDesc: "Geçmiş ile gelecek arasındaki dikey ayırıcı çizginin rengi.",
        lineStyleLabel: "Stil",
        lineStyleSolid: "Düz",
        lineStyleDashed: "Kesikli",
        lineStyleDotted: "Noktalı",
        timelineOptionsHeading: "Seçenekler",
        timelineShowFullName: "Tam adı göster",
        timelineShowFullNameDesc:
          "Başlıkta, araç ipucunda ve genişletilebilir listede yalnızca adı yerine her etkinliğin tam adını (ad ve soyad) gösterir.",
        showHolidaySuffix: "Tatil sonekini göster",
        showHolidaySuffixDesc:
          "Tatilin ülkesini (ve varsa bölgesini) adının ardından parantez içinde ekler, örn. \"Pioneer Day (US-UT)\".",
        timelineShowDate: "Tarihi göster",
        timelineShowDateDesc:
          "Sonuna parantez içinde kısa tarihi ekler, örn. \"...3 gün sonra (6 Ağu)\". Etkinliğin kendi gününde gizlenir, çünkü cümle bundan hemen önce zaten \"...bugün\" ile bitiyor.",
        timelineShowTime: "Saati göster",
        timelineShowTimeDesc:
          "Harici bir takvim etkinliğinin kendi saat aralığını aynı parantez içine ekler, örn. \"...3 gün sonra (14:00–15:00)\". Yalnızca saatli (tüm gün olmayan) harici bir takvim etkinliği için gösterilir. Saat biçimi, Home Assistant dil ayarını izler.",
        timelineShowLocation: "Konumu göster",
        timelineShowLocationDesc:
          "Harici bir takvim etkinliğinin kendi konumunu aynı parantez içine ekler. Yalnızca konumu ayarlanmış harici bir takvim etkinliği için gösterilir.",
        timelineShowDescription: "Açıklamayı göster",
        timelineShowDescriptionDesc:
          "Harici bir takvim etkinliğinin kendi açıklamasını aynı parantez içine ekler. Yalnızca açıklaması ayarlanmış harici bir takvim etkinliği için gösterilir.",
        timelineHeaderMaxEvents: "Gün başına maks. etkinlik",
        timelineHeaderMaxEventsDesc:
          "Aynı güne denk gelen etkinliklerin kaç başlık satırı oluşturacağını sınırlar, örn. aynı gün 3 doğum günü. Bu sınırı aşan etkinlikler yine de eksende kendi noktasını alır, sadece kendi başlık satırı olmaz. Sınır olmaması için boş bırakın.",
        timelineHeaderMinEvents: "Her zaman N yaklaşan göster",
        timelineHeaderMinEventsDesc:
          "Gerekirse bir sonraki günün ötesinde daha fazla yaklaşan (veya bunlar tükenirse, daha fazla yakın zamanda geçmiş) günü de dahil ederek her zaman en az bu kadar başlık satırı gösterir - her biri yine de yukarıdaki \"gün başına maks. etkinlik\" ile sınırlıdır. Yalnızca bir sonraki günün kendi etkinliklerini göstermek için boş (veya 0) bırakın.",
        moreAction: "\"Daha fazla\" düğmesi",
        moreActionDesc:
          "Zaman çizelgesinin sağ alt köşesindeki \"Daha fazla\" düğmesinin ne yaptığı. Genellikle aynı etkinlikleri tam Liste düzeninde gösteren bir panoya yönlendiren bir gezinme eylemi. Düğmeyi gizlemek için \"Hiçbiri\" olarak bırakın.",
        groupTimeline: "Timeline",
        groupTimelineDesc: "Yalnızca Düzen stili (Görünüm altında) Timeline olarak ayarlandığında kullanılır.",
        timelineHeaderLabel: "Başlık",
        timelineHeaderFontDesc:
          "Eksenin üzerindeki açıklama satırının yazı tipi, örn. \"Kevin: 27. doğum günü — bugün\".",
        timelineHeaderColorDesc: "Eksenin üzerindeki açıklama satırının metin rengi.",
        timelineTooltipLabel: "İpucu",
        timelineTooltipFontDesc: "Eksendeki bir noktaya tıklandığında gösterilen metnin yazı tipi.",
        timelineTooltipColorDesc: "Eksendeki bir noktaya tıklandığında gösterilen metnin rengi.",
        timelineListLabel: "Liste (Ayrıntılar)",
        timelineListFontDesc: "Eksenin altındaki genişletilebilir kronolojik listenin yazı tipi.",
        timelineListColorDesc: "Eksenin altındaki genişletilebilir kronolojik listenin metin rengi.",
        timelineButtonLabel: "Ayrıntılar / Daha fazla düğmesi",
        timelineButtonFontDesc: "Alt bilgideki Ayrıntılar ve Daha fazla düğmelerinin yazı tipi.",
        timelineButtonColorDesc: "Alt bilgideki Ayrıntılar ve Daha fazla düğmelerinin metin rengi.",
        eventTypesHeading: "Etkinlik türleri",
        eventTypeColorDesc: "Bu etkinlik türünün zaman çizelgesindeki simge ve nokta rengi.",
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
        visibilityNameDesc: "Etkinlik adını göster",
        visibilityTypeDesc: "Etkinlik türünü göster",
        visibilityCountrySuffix: "Tatil eki",
        visibilityCountrySuffixDesc: "Tatilin adının/türünün ardına ülkeyi (ve varsa bölgeyi) ekler, örn. \"Cumhuriyet Bayramı · TR (34)\"",
        columnsHeading: "Satır sütunları",
        columnsDesc:
          "Her satırın gösterdiği içeriği ekleyin, kaldırın ve yeniden sıralayın. Özel metin sütunları serbest metni yer tutucularla karıştırabilir: {name}, {last_name}, {full_name}, {type}, {occurrence}, {when}, {date}, {country}, {time}, {location}, {description}.",
        columnTypeIcon: "Simge",
        columnTypeInfo: "Ad + tür",
        columnTypeName: "Ad",
        columnTypeLastName: "Soyad",
        columnTypeFullName: "Tam ad",
        columnTypeFullNameType: "Tam ad + tür",
        columnTypeType: "Tür",
        columnTypeText: "Özel metin",
        columnTypeDate: "Tarih",
        columnTypeTime: "Saat",
        columnTypeLocation: "Konum",
        columnTypeDescription: "Açıklama",
        columnTypeTimeDesc:
          "Harici takvim etkinliğinin kendi saat aralığını ekler, örn. \"...03:00 PM–05:00 PM\". Yalnızca saatli (tüm gün olmayan) harici bir takvim etkinliği için gösterilir.",
        columnTypeLocationDesc:
          "Harici takvim etkinliğinin kendi konumunu ekler. Yalnızca konumu ayarlanmış harici bir takvim etkinliği için gösterilir.",
        columnTypeDescriptionDesc:
          "Harici takvim etkinliğinin kendi açıklamasını ekler. Yalnızca açıklaması ayarlanmış harici bir takvim etkinliği için gösterilir.",
        suffixLabel: "Ek",
        suffixGroupHolidayTitle: "Yalnızca tatiller",
        suffixGroupExternalTitle: "Yalnızca harici takvimler",
        suffixShowCalendarName: "Takvim adı",
        suffixShowCalendarNameDesc:
          "Harici takvimin kendi adını burada gösterir (örn. \"Kişisel\"). Aşağıdaki Saat/Konum/Açıklama zaten yeterince açıklayıcı olduğunda kapatın.",
        externalCalendarsHeading: "Harici takvimler",
        externalCalendarsDesc:
          "Mevcut Home Assistant takvimlerinizden birini veya birkaçını Annuals'ın kendi etkinlikleriyle birlikte katıştırın - her biri, herhangi bir \"sonraki tekrar\" hesaplaması yerine gerçek gününe düşer (ve saatli etkinlikler için o gün içinde saate göre sıralanır). Bu etkinlikler için bu alanları göstermek üzere yukarıya bir Saat/Konum/Açıklama sütunu ekleyin.",
        externalCalendarsLabel: "Takvimler",
        externalCalendarsLabelDesc: "Hangi calendar.* varlıklarının katıştırılacağı.",
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
        vipBadgeColorList: "Rozet rengi (Liste)",
        vipBadgeColorListDesc:
          "Liste düzeninin köşe rozetindeki, Timeline düzeninin başlığındaki ve genişletilebilir Ayrıntılar listesindeki VIP yıldız rozetinin rengi.",
        vipBadgeColorTimeline: "Rozet rengi (Timeline)",
        vipBadgeColorTimelineDesc:
          "Özellikle Timeline düzeninin eksen noktalarındaki VIP yıldız simgesinin rengi. Yalnızca Düzen stili Timeline olarak ayarlandığında gösterilir.",
        importantBadgeColorList: "Rozet rengi (Liste)",
        importantBadgeColorListDesc:
          "Liste düzeninin köşe rozetindeki, Timeline düzeninin başlığındaki ve genişletilebilir Ayrıntılar listesindeki Important ünlem işareti rozetinin rengi.",
        importantBadgeColorTimeline: "Rozet rengi (Timeline)",
        importantBadgeColorTimelineDesc:
          "Özellikle Timeline düzeninin eksen noktalarındaki Important ünlem işareti simgesinin rengi. Yalnızca Düzen stili Timeline olarak ayarlandığında gösterilir.",
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
        iconVisibleLabel: "Simgeyi göster",
        iconVisibleDesc: "Bu kategori için simgeyi göster veya gizle",
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
        colorName: "Ad",
        colorType: "Tür",
        colorBadge: "Tekrar sayısı",
        colorWhen: "Geri sayım",
        colorText: "Özel metin",
        colorNameDesc: "Etkinlik adı için metin rengi",
        colorLastName: "Soyad",
        colorLastNameDesc: "Etkinliğin soyadı için metin rengi",
        colorFullName: "Tam ad",
        colorFullNameDesc: "Etkinliğin tam adı (ad ve soyad) için metin rengi",
        cardTitleColorDesc: "Kartın kendi başlığı için metin rengi",
        colorTypeDesc: "Etkinlik türü için metin rengi",
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
        fontNameDesc: "Etkinlik adı için yazı tipi boyutu",
        fontLastNameDesc: "Etkinliğin soyadı için yazı tipi boyutu",
        fontFullNameDesc: "Etkinliğin tam adı (ad ve soyad) için yazı tipi boyutu",
        fontTypeDesc: "Etkinlik türü için yazı tipi boyutu",
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
        panelLayoutDesc: "Görünüm, yazı tipleri, renkler, simgeler, kart arka planı ve zaman çizelgesi",
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

  // Seeds the "Row columns" editor's list the first time it's opened for a
  // card that has never set config.columns explicitly - purely a starting
  // point to customize from, not the render path itself (that's still
  // _row()'s own hardcoded legacy template, untouched, for zero regression
  // risk on every dashboard saved before this feature existed).
  const DEFAULT_COLUMNS = [
    { id: "icon", type: "icon" },
    { id: "full_name_type", type: "full_name_type" },
    { id: "badge", type: "badge" },
    { id: "when", type: "when" },
  ];

  // Applied the moment "Compact (no gaps, centered)" is switched on (see the
  // compactToggle handler in _buildColumnsSection) - Icon, Full name,
  // Occurrence, Type, Countdown, Date, each of the latter five preceded by
  // its own space-only text column. Compact mode zeroes the flex gap
  // between columns (see .list.columns-compact .row in CARD_STYLE) so two
  // fields would otherwise run together with no separator at all; a real
  // space character between them reads correctly on its own and, unlike a
  // CSS gap, stays put if the user later mixes in their own custom text
  // columns around this starting arrangement.
  const COMPACT_DEFAULT_COLUMNS = [
    { id: "icon", type: "icon" },
    { id: "space-1", type: "text", template: " " },
    { id: "full_name", type: "full_name" },
    { id: "space-2", type: "text", template: " " },
    { id: "badge", type: "badge" },
    { id: "space-3", type: "text", template: " " },
    { id: "type", type: "type" },
    { id: "space-4", type: "text", template: " " },
    { id: "when", type: "when" },
    { id: "space-5", type: "text", template: " " },
    { id: "date", type: "date" },
  ];

  // Rewrites a handful of legacy config keys from before "title"/"subtitle"
  // were split off from the row's own name/type fields (they used to mean
  // "this row's name"/"this row's type"; now "title" means only the card's
  // own heading, unambiguously). Old YAML keeps reading correctly forever;
  // new-key values win if both happen to be present. Every defaultConfig()
  // call runs this first, and every editor mutation re-runs defaultConfig(),
  // so the very next _emit() after any edit persists only the new keys -
  // no separate "save" migration step needed.
  function migrateLegacyKeys(config) {
    const c = { ...config };
    const moveKey = (obj, oldKey, newKey) => {
      if (obj && obj[oldKey] !== undefined) {
        if (obj[newKey] === undefined) obj[newKey] = obj[oldKey];
        delete obj[oldKey];
      }
    };
    if (c.colors) {
      c.colors = { ...c.colors };
      moveKey(c.colors, "title", "name");
      moveKey(c.colors, "subtitle", "type");
    }
    if (c.font_sizes) {
      c.font_sizes = { ...c.font_sizes };
      moveKey(c.font_sizes, "title", "name");
      moveKey(c.font_sizes, "subtitle", "type");
    }
    if (c.font_style) {
      c.font_style = { ...c.font_style };
      moveKey(c.font_style, "title", "name");
      moveKey(c.font_style, "subtitle", "type");
    }
    moveKey(c, "show_subtitle", "show_type");
    moveKey(c, "show_subtitle_country", "show_type_country");
    if (Array.isArray(c.columns)) {
      c.columns = c.columns.map((col) => (col.type === "subtitle" ? { ...col, type: "type" } : col));
    }
    return c;
  }

  function defaultConfig(config) {
    config = migrateLegacyKeys(config || {});
    return {
      title: "",
      show_title: true,
      // "list" is every dashboard saved before this feature existed - the
      // classic icon/name/type/badge/when row list, untouched. "timeline"
      // is the new compact horizontal-axis layout (see _buildTimeline).
      layout_style: "list",
      count: 10,
      days_ahead: 0,
      days_past: 0,
      soon_days: 7,
      today_only: false,
      next_event_day_only: false,
      types: [],
      // Existing HA calendar.* entities (Google/CalDAV/Local Calendar/...)
      // whose own events should be merged in alongside the yearly-recurring
      // Annuals ones, landing on their real day (and, for timed events,
      // sorted by time-of-day within that day) rather than any "next
      // occurrence" math - see buildExternalEvent(). Empty means none are
      // embedded, same "opt-in, no restriction by default" meaning as an
      // empty `types` above has for Annuals' own event types. Entirely
      // independent of the `types`/`categories`/VIP/Important filters below,
      // which describe Annuals-specific concepts that don't apply to an
      // external calendar's events - only the day-window filters
      // (days_ahead/days_past/soon_days/today_only/next_event_day_only)
      // apply to both alike.
      external_calendars: [],
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
      show_type: true,
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
      show_type_country: false,
      show_full_name_country: false,
      // List layout, Row columns -> Type field's "External calendars" group
      // - whether an external calendar event's own name (e.g. "Personal")
      // fills the Type cell at all. Defaults to true (today's existing
      // behavior, unlike the toggles below which all default to off/absent)
      // since turning it off only makes sense once Time/Location/
      // Description below already carry enough information on their own.
      show_type_calendar_name: true,
      // List layout, Row columns -> Type field's own sub-options (alongside
      // the Holiday suffix toggle above) - append an external calendar
      // event's own time/location/description into the Type cell, same " · "
      // joining the Timeline layout's own Show time/location/description
      // toggles use for their trailing parenthetical (see
      // _timelineSentenceFragment). No effect on any Annuals event,
      // including a one-time event, which has none of the three.
      show_type_time: false,
      show_type_location: false,
      show_type_description: false,
      // Deliberately not defaulted to an array - "unset" (every dashboard
      // saved before this feature existed) must stay distinguishable from
      // "explicitly configured" so _row() can pick the right render path.
      // See _buildDisplayBody's column-list editor for how this gets set.
      columns: undefined,
      // Squashes the gap between columns and centers the row, and neutralizes
      // the couple of hardcoded style differences between fields (the name's
      // semi-bold weight, the type/countdown's dimmed opacity) that
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
      // Timeline layout only: what the footer's "More" button does, in the
      // same HA action-config shape as tap/hold above. Defaults to "none",
      // which hides the button entirely rather than showing one that does
      // nothing - it's meant to be pointed at a fuller list view (e.g. a
      // navigate action to a dashboard with the regular list layout).
      more_action: { action: "none" },
      // Timeline layout only: the horizontal axis line's own thickness/style,
      // and the same for the vertical past/future divider (see
      // _buildTimeline) - width is a free-form CSS length string (e.g.
      // "4px") the same way font_sizes fields are, style is one of
      // solid/dashed/dotted. Colors for both live in `colors` below, same
      // pattern as every other themeable field on this card.
      timeline_line_width: "",
      timeline_line_style: "solid",
      timeline_divider_width: "",
      timeline_divider_style: "solid",
      // Timeline layout only, under Layout -> Timeline -> Options: appends
      // " (country[-subdivision])" after a holiday event's own name in its
      // sentence (header/tooltip/list all share _timelineSentenceFragment),
      // e.g. "Pioneer Day (US-UT)". Off by default, same reasoning as the
      // list layout's own show_*_country toggles - most setups only ever
      // import a single country/region and don't need it repeated.
      show_holiday_suffix: false,
      // Timeline layout only, under Layout -> Timeline -> Options: shows
      // each event's full name (first + last) instead of just the first
      // name, everywhere _timelineSentenceFragment is used (header, tooltip,
      // expandable list) since they all share that one function.
      timeline_show_full_name: false,
      // Timeline layout only, under Layout -> Timeline -> Options: appends
      // " (<short date>)" at the very end of the sentence, e.g. "...is in 3
      // days (6 Aug)" - same short-date text the List layout's own Date
      // column shows (see _timelineDateText). Suppressed on the day itself
      // (_timelineDateText returns null) since the sentence already reads
      // "...is today" right before it - repeating it as "(Today)" would be
      // redundant.
      timeline_show_date: false,
      // Timeline layout only, under Layout -> Timeline -> Options: same
      // trailing-parenthetical mechanism as timeline_show_date above, for
      // an external calendar event's own time range/location/description -
      // each is simply omitted from the parenthetical when the event has
      // nothing to show there (an Annuals event, or an all-day/timeless
      // external one) rather than leaving an empty " · " behind.
      timeline_show_time: false,
      timeline_show_location: false,
      timeline_show_description: false,
      // Timeline layout only, under Layout -> Timeline -> Options: caps how
      // many header lines a single tied day contributes (see _buildTimeline's
      // header-building loop) - empty/0 means no cap, same as before this
      // option existed. Further events tied for a capped day still get their
      // own axis dot, just without a header line, same as any other day.
      timeline_header_max_events: "",
      // Timeline layout only, under Layout -> Timeline -> Options: the
      // header always shows at least this many lines, pulling in additional
      // upcoming (or, once exhausted, additional recent-past) days beyond
      // the first tied day if needed - each further day still respects
      // timeline_header_max_events above. Empty/0 means no minimum, i.e.
      // only the first tied day's own events show, same as before this
      // option existed.
      timeline_header_min_events: "",
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
      // Per icon-color-category visibility - same accent/today/soon keying
      // as icon_animation and colors.match_*, so a row's icon can be hidden
      // just for its own category (e.g. hide the icon once a row is
      // "today") without affecting the other two. Defaults to shown, same
      // as the existing global show_icon toggle.
      icon_visibility: {
        accent: true,
        today: true,
        soon: true,
        ...(config.icon_visibility || {}),
      },
      colors: {
        today: "",
        soon: "",
        accent: "",
        card_title: "",
        name: "",
        last_name: "",
        full_name: "",
        type: "",
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
        // Timeline layout has its own independent VIP/Important badge
        // colors - vip_badge/important_badge above drive the list layout's
        // corner badges; these drive the timeline's star/exclamation glyphs
        // instead, since a single shared color meant changing one always
        // silently affected the other layout too.
        vip_badge_timeline: "",
        important_badge_timeline: "",
        // Timeline layout only (see Layout -> Timeline in the editor and
        // _buildTimeline) - the header sentence above the axis, each dot's
        // click tooltip, and the expandable chronological list, styled
        // independently from the list layout's own fields above since
        // they're a completely different visual (no per-row icon/badge/when
        // split to color individually).
        timeline_header: "",
        timeline_tooltip: "",
        timeline_list: "",
        // The footer's Details/More buttons - same reasoning as the three
        // above, appended last since it's the most recently added.
        timeline_button: "",
        // The axis line itself, and the vertical past/future divider - see
        // timeline_line_width/timeline_line_style above for the rest of
        // each line's styling.
        timeline_line: "",
        timeline_divider: "",
        ...(config.colors || {}),
      },
      font_sizes: {
        name: "",
        last_name: "",
        full_name: "",
        type: "",
        badge: "",
        when: "",
        text: "",
        timeline_header: "",
        timeline_tooltip: "",
        timeline_list: "",
        timeline_button: "",
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
        name: {
          bold: false,
          italic: false,
          uppercase: false,
          underline: false,
          letter_spacing: "",
          ...((config.font_style || {}).name || {}),
        },
        last_name: {
          bold: false,
          italic: false,
          uppercase: false,
          underline: false,
          letter_spacing: "",
          ...((config.font_style || {}).last_name || {}),
        },
        full_name: {
          bold: false,
          italic: false,
          uppercase: false,
          underline: false,
          letter_spacing: "",
          ...((config.font_style || {}).full_name || {}),
        },
        type: {
          bold: false,
          italic: false,
          uppercase: false,
          underline: false,
          letter_spacing: "",
          ...((config.font_style || {}).type || {}),
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
        timeline_header: {
          bold: false,
          italic: false,
          uppercase: false,
          underline: false,
          letter_spacing: "",
          ...((config.font_style || {}).timeline_header || {}),
        },
        timeline_tooltip: {
          bold: false,
          italic: false,
          uppercase: false,
          underline: false,
          letter_spacing: "",
          ...((config.font_style || {}).timeline_tooltip || {}),
        },
        timeline_list: {
          bold: false,
          italic: false,
          uppercase: false,
          underline: false,
          letter_spacing: "",
          ...((config.font_style || {}).timeline_list || {}),
        },
        timeline_button: {
          bold: false,
          italic: false,
          uppercase: false,
          underline: false,
          letter_spacing: "",
          ...((config.font_style || {}).timeline_button || {}),
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
        // Empty for holiday events (no last_name attribute at all - see
        // sensor.py) and for any event added before this field existed.
        lastName: state.attributes.last_name || "",
        fullName: state.attributes.full_name || state.attributes.name || state.attributes.friendly_name || entityId,
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

  // Cheap fingerprint of just the entities getEvents() actually reads -
  // used by AnnualsCard.set hass to skip a render when nothing relevant
  // changed. `hass` is replaced with a new object on literally every state
  // change anywhere in Home Assistant (a light turning on, an unrelated
  // sensor ticking, ...), not just this card's own entities, which on a
  // busy production instance can happen many times a second - full
  // re-renders on every one of those wiped any transient UI state (a
  // Timeline tooltip left open by a click, a row mid-:hover, an icon's CSS
  // animation, which restarts from frame zero when its element is
  // recreated) long before a person could ever notice the underlying data
  // actually changed. state/last_updated is enough to catch a real change
  // without stringifying every attribute on every tick.
  function eventsSignature(hass) {
    let sig = "";
    for (const entityId in hass.states) {
      if (!entityId.startsWith(ENTITY_PREFIX)) continue;
      const s = hass.states[entityId];
      sig += entityId + ":" + s.state + ":" + s.last_updated + ";";
    }
    return sig;
  }

  // Home Assistant's calendar REST API (GET /api/calendars/<entity_id>)
  // represents an event boundary as a plain "YYYY-MM-DD" string for an
  // all-day event, or a full ISO-8601 datetime string (with offset) for a
  // timed one. A handful of calendar platforms have been seen returning the
  // Google Calendar API's own {date: "..."}/{dateTime: "...", timeZone:
  // "..."} nested shape instead - handled defensively here too, rather than
  // assuming every integration matches HA's own REST format exactly.
  function parseCalendarEventBoundary(value) {
    if (value == null) return null;
    if (typeof value === "object") {
      if (value.date) return { date: new Date(`${value.date}T00:00:00`), allDay: true };
      if (value.dateTime) return { date: new Date(value.dateTime), allDay: false };
      return null;
    }
    if (typeof value !== "string") return null;
    const allDay = /^\d{4}-\d{2}-\d{2}$/.test(value);
    return { date: new Date(allDay ? `${value}T00:00:00` : value), allDay };
  }

  // One external calendar event (as returned by the REST call in
  // AnnualsCard._fetchExternalEvents) reshaped into the same event object
  // getEvents() builds for Annuals' own sensors, so both flow through the
  // rest of this file - filtering, sorting, row/timeline rendering -
  // completely unchanged. `days` is computed from the event's own start
  // date (not any "next occurrence" concept, which only makes sense for a
  // yearly-recurring Annuals event) - once negative or beyond the
  // days_ahead/days_past window it configured, it's dropped the same way
  // any other out-of-window event already is (see _filteredEvents).
  function buildExternalEvent(raw, entityId, calendarName, calendarIcon, now) {
    const startInfo = parseCalendarEventBoundary(raw.start);
    if (!startInfo || Number.isNaN(startInfo.date.getTime())) return null;
    const endInfo = parseCalendarEventBoundary(raw.end);
    const today0 = new Date(now);
    today0.setHours(0, 0, 0, 0);
    const startDay0 = new Date(startInfo.date);
    startDay0.setHours(0, 0, 0, 0);
    const days = Math.round((startDay0 - today0) / 86400000);
    return {
      entityId: `${entityId}:${raw.uid || startInfo.date.toISOString()}`,
      // The raw calendar.* entity id, distinct from the composite entityId
      // above (which has the event's own uid appended) - needed to look up
      // that specific calendar's own configured color for the Timeline dot
      // (see timelineDotColor), since multiple embedded calendars each keep
      // their own color rather than sharing TIMELINE_TYPE_COLORS.calendar.
      calendarEntityId: entityId,
      days,
      name: raw.summary || calendarName,
      lastName: "",
      fullName: raw.summary || calendarName,
      // Not one of Annuals' own EVENT_TYPES - never matched by the "Event
      // types" filter grid or CSV/ICS/vCard import, purely an internal tag
      // for icon/color lookups (see TIMELINE_TYPE_COLORS's "calendar" entry)
      // and the strings.types["calendar"] fallback label below.
      type: "calendar",
      // Preferred over strings.types.calendar wherever a type label is
      // shown (see _row/_timelineSentenceFragment) - the source calendar's
      // own name reads far more usefully than a generic "Calendar event"
      // label once more than one calendar is embedded.
      typeLabel: calendarName,
      icon: calendarIcon,
      month: startInfo.date.getMonth() + 1,
      day: startInfo.date.getDate(),
      occurrence: null,
      vip: false,
      important: false,
      category: undefined,
      country: undefined,
      subdivision: undefined,
      isExternal: true,
      allDay: startInfo.allDay,
      startTime: startInfo.allDay ? null : startInfo.date,
      endTime: endInfo && !endInfo.allDay ? endInfo.date : null,
      location: raw.location || "",
      description: raw.description || "",
      // Secondary sort key within the same day (see _visibleEvents): every
      // all-day/Annuals event sorts as -1 (before any timed one), timed
      // events then sort earliest-first by minutes-since-midnight.
      timeSortKey: startInfo.allDay ? -1 : startInfo.date.getHours() * 60 + startInfo.date.getMinutes(),
    };
  }

  // Only the inputs that actually change what _fetchExternalEvents needs to
  // (re)fetch - which calendars, the day window, and (bounded to only the
  // handful of entities actually configured here, never "all entities" -
  // that blanket-reactivity approach was an earlier bug) each configured
  // calendar's own last_updated/state - so a fetch fires when one of those
  // genuinely changed (or a new day has begun), not on every one of the
  // many hass ticks that change nothing relevant.
  //
  // This entity check is a fast-path, not the primary fix for stale data:
  // Home Assistant's state machine silently skips writing a new state at
  // all when a coordinator refresh produces the same state string and
  // attributes as before (no state_changed event, last_updated untouched).
  // A calendar entity's state/attributes only ever reflect its single
  // current/next event - deleting or editing any OTHER event in the window
  // leaves both unchanged, so core dedupes the write and nothing here ever
  // sees it. That gap is what a real user hit (deleted event stayed on the
  // card until an unrelated full page reload) - it's closed instead by
  // AnnualsCard's periodic _fetchExternalEvents poll (see
  // _startExternalEventsPolling), which is time-based and doesn't depend on
  // any entity's state changing at all.
  function externalCalendarsSignature(config, hass) {
    const calendars = Array.isArray(config.external_calendars) ? config.external_calendars : [];
    const entityTicks = calendars
      .map((id) => {
        const state = hass && hass.states && hass.states[id];
        return state ? `${id}:${state.last_updated}` : `${id}:?`;
      })
      .join(",");
    return (
      JSON.stringify(calendars) +
      "|" +
      new Date().toDateString() +
      "|" +
      (config.days_past || 0) +
      "|" +
      (config.days_ahead || 0) +
      "|" +
      entityTicks
    );
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
    /* With the icon hidden (see icon_visibility), the row's left padding
       otherwise stays at the icon column's much narrower 4px, so the first
       field starts almost flush against the left edge - lopsided next to
       the same 12px the last field keeps from the right edge. Matching it
       here restores that symmetry. */
    .row.icon-hidden {
      padding-left: 12px;
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
       Layout -> Icons editor tab. Applied via an anim-* class computed from
       config.icon_animation, directly on the icon in _row() (list layout),
       or on a wrapping span around the timeline's header/list MDI icons
       (see _buildTimeline and .timeline-icon-anim-wrap) - never on the
       timeline's axis dots themselves, which have no MDI icon of their own
       to animate. Deliberately not scoped to .icon so the wrapper variant
       works too. */
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
    .anim-pulse { animation: annuals-icon-pulse 1.4s ease-in-out infinite; }
    .anim-bounce { animation: annuals-icon-bounce 1s ease-in-out infinite; }
    .anim-shake { animation: annuals-icon-shake 0.6s ease-in-out infinite; }
    .anim-spin { animation: annuals-icon-spin 2s linear infinite; }
    .anim-flash { animation: annuals-icon-flash 1.2s ease-in-out infinite; }
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
       overriding the individually configured name/type/badge/when
       colors for just that row. Higher specificity (.row.match-* .name vs
       plain .name) wins regardless of stylesheet order. */
    .row.match-accent-text .name,
    .row.match-accent-text .last-name,
    .row.match-accent-text .full-name,
    .row.match-accent-text .type,
    .row.match-accent-text .badge,
    .row.match-accent-text .when,
    .row.match-accent-text .text-col {
      color: var(--annuals-accent-color, var(--primary-text-color));
    }
    .row.match-today-text .name,
    .row.match-today-text .last-name,
    .row.match-today-text .full-name,
    .row.match-today-text .type,
    .row.match-today-text .badge,
    .row.match-today-text .when,
    .row.match-today-text .text-col {
      color: var(--annuals-today-color, var(--error-color));
    }
    .row.match-soon-text .name,
    .row.match-soon-text .last-name,
    .row.match-soon-text .full-name,
    .row.match-soon-text .type,
    .row.match-soon-text .badge,
    .row.match-soon-text .when,
    .row.match-soon-text .text-col {
      color: var(--annuals-soon-color, var(--warning-color));
    }
    .info { flex: 1; min-width: 0; }
    /* Standalone identity columns (as opposed to the combined .info wrapper)
       need the same flex:1;min-width:0 treatment - without it, nothing in
       the row absorbs the leftover width, so the badge/countdown (both
       fixed-width) end up trailing right after the name/type instead of
       flush against a consistent right edge, and every row's columns
       misalign depending on how long its name happens to be. Deliberately
       NOT extended to .text-col: a Custom text column is usually short,
       fixed content (e.g. "wird"/"turns") - making it flex:1 too would split
       the leftover width with the name column instead of leaving it all to
       the name, truncating names that didn't need truncating. .text-col
       keeps its own natural-width sizing below instead. */
    .name,
    .last-name,
    .full-name,
    .type {
      flex: 1;
      min-width: 0;
    }
    .name {
      font-weight: var(--annuals-row-name-weight, 500);
      font-style: var(--annuals-row-name-style, normal);
      text-transform: var(--annuals-row-name-transform, none);
      text-decoration: var(--annuals-row-name-decoration, none);
      letter-spacing: var(--annuals-row-name-spacing, normal);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--annuals-name-color, inherit);
      font-size: var(--annuals-row-name-size, inherit);
    }
    .type {
      font-size: var(--annuals-row-type-size, 0.85em);
      font-weight: var(--annuals-row-type-weight, normal);
      font-style: var(--annuals-row-type-style, normal);
      text-transform: var(--annuals-row-type-transform, none);
      text-decoration: var(--annuals-row-type-decoration, none);
      letter-spacing: var(--annuals-row-type-spacing, normal);
      opacity: 0.6;
      color: var(--annuals-type-color, inherit);
    }
    .last-name, .full-name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .last-name {
      font-weight: var(--annuals-row-last-name-weight, 500);
      font-style: var(--annuals-row-last-name-style, normal);
      text-transform: var(--annuals-row-last-name-transform, none);
      text-decoration: var(--annuals-row-last-name-decoration, none);
      letter-spacing: var(--annuals-row-last-name-spacing, normal);
      color: var(--annuals-last-name-color, inherit);
      font-size: var(--annuals-row-last-name-size, inherit);
    }
    .full-name {
      font-weight: var(--annuals-row-full-name-weight, 500);
      font-style: var(--annuals-row-full-name-style, normal);
      text-transform: var(--annuals-row-full-name-transform, none);
      text-decoration: var(--annuals-row-full-name-decoration, none);
      letter-spacing: var(--annuals-row-full-name-spacing, normal);
      color: var(--annuals-full-name-color, inherit);
      font-size: var(--annuals-row-full-name-size, inherit);
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
    /* Free-form "text" column (see _buildColumnCell) - sized to its own
       content rather than flexing to fill the row: a custom text column is
       usually short, fixed connective text (e.g. "wird"/"turns"), and if it
       flexed like .name/.info do, it would compete with a sibling name
       column for the row's leftover width and needlessly truncate the name
       instead of leaving that space to it. Wraps instead of truncating,
       since its content can still be a full templated sentence rather than
       a single word. Falls back to the same title color/size variables as
       .name, since it most often replaces that field. pre-wrap (not normal)
       so a leading/trailing space typed into the template - the only way to
       add spacing between columns in compact mode, where the row's own gap
       is zero - actually renders instead of being collapsed away as
       "whitespace at the edge of a box", which is what plain normal does to
       every column since each is its own separate box, not one shared run
       of inline text. */
    .text-col {
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
       semi-bold weight, type/countdown's dimmed opacity) that otherwise
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
    .list.columns-compact .last-name,
    .list.columns-compact .full-name,
    .list.columns-compact .type {
      flex: none;
      opacity: 1;
    }
    .list.columns-compact .name { font-weight: var(--annuals-row-name-weight, normal); }
    .list.columns-compact .last-name { font-weight: var(--annuals-row-last-name-weight, normal); }
    .list.columns-compact .full-name { font-weight: var(--annuals-row-full-name-weight, normal); }
    .list.columns-compact .type {
      font-size: var(--annuals-row-type-size, 1em);
    }
    .list.columns-compact .when {
      opacity: 1;
    }
    .list.columns-compact .badge-slot { width: auto; flex: none; justify-content: center; }
    .list.columns-compact .when { min-width: 0; text-align: center; flex: none; }
    .empty { opacity: 0.6; text-align: center; padding: 12px; }
    /* Compact horizontal-axis layout (layout_style: "timeline") - see
       _buildTimeline. Deliberately its own small block of styles instead of
       reusing .row/.icon-wrap/etc., since it's a completely different visual
       (one header line per soonest-day event plus a dot axis) rather than a
       list of rows. */
    .timeline-header {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-bottom: 10px;
    }
    .timeline-header-row {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    /* This event has no circle behind its icon at all - just the bare glyph,
       since the header line is a single description rather than one row
       among many that needs a strong visual anchor. position:relative is the
       positioning context for the VIP/Important overlay badges below - same
       icon + corner-badge structure the expandable Details list uses (see
       .timeline-list-icon-wrap), so the two contexts read consistently. */
    .timeline-header-icons {
      display: flex;
      align-items: center;
      position: relative;
      flex: 0 0 auto;
    }
    /* Wraps the header/list MDI icon when Layout -> Icons has an animation
       set for its category - kept separate from the icon's own translateY
       alignment (see _buildTimeline/_alignTimelineIconToText) so the two
       transforms don't fight over the same element. */
    .timeline-icon-anim-wrap {
      display: inline-flex;
    }
    .timeline-header-icons ha-icon {
      --mdc-icon-size: 20px;
      /* translateY is set inline by _alignTimelineIconToText - flexbox only
         centers the icon's *box*, and an mdi glyph is rarely centered within
         its own 24x24 viewBox, so the visible symbol still needs nudging to
         line its center up with the text's. */
      display: block;
    }
    /* Bare glyphs, no round background - same treatment as the Details
       list's own .timeline-list-badge. Two classes needed on the selector so
       it beats the ".timeline-header-icons ha-icon" rule above (one class
       plus a type selector still outranks a single class). */
    .timeline-header-icons .timeline-header-badge {
      position: absolute;
      --mdc-icon-size: 12px;
      width: 12px;
      height: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .timeline-header-badge-important {
      top: -4px;
      left: -4px;
    }
    .timeline-header-badge-vip {
      top: -4px;
      right: -4px;
    }
    .timeline-header .sentence {
      font-size: var(--annuals-timeline-header-size, 13px);
      font-weight: var(--annuals-timeline-header-weight, normal);
      font-style: var(--annuals-timeline-header-style, normal);
      text-transform: var(--annuals-timeline-header-transform, none);
      text-decoration: var(--annuals-timeline-header-decoration, none);
      letter-spacing: var(--annuals-timeline-header-spacing, normal);
      color: var(--annuals-timeline-header-color, inherit);
      line-height: 1.4;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex: 1 1 auto;
      min-width: 0;
    }
    /* The English ordinal suffix ("27th") - see _timelineSentenceFragment.
       line-height:0 keeps the raised suffix from growing the line box, which
       would otherwise push the text's center up away from the icon's. */
    .timeline-header .sentence sup,
    .timeline-list-item sup,
    .timeline-tip sup {
      line-height: 0;
      font-size: 0.7em;
    }
    .timeline-axis {
      /* height and .line's top are set inline (see _buildTimeline) - they
         grow to fit whichever same-day cluster on the axis has the most
         events, since those stack vertically instead of overlapping.
         margin-left reserves room for the leftmost dot's own Important
         glyph, which extends further left than the dot itself (see
         .timeline-dot-important) - without it, a dot sitting at the
         axis's own 0% (the furthest-back past event, or day 0 with no past
         events at all) could have that glyph clipped against ha-card's own
         16px padding, since the worst case (radius + ring + glyph width at
         MAX_SIZE) runs a couple pixels past that on its own. */
      position: relative;
      height: 34px;
      margin-left: 20px;
    }
    /* Rendered as a top border on a 0-height box, not a filled background -
       border-style is what lets Layout -> Timeline's line-style option
       (solid/dashed/dotted) actually work; a background-color bar can only
       ever be solid. Width/style/color are all configurable there; _buildTimeline
       reads the same configured width back to keep this positioned centered
       on axisCenter regardless of how thick it is. */
    .timeline-axis .line {
      position: absolute;
      left: 0;
      right: 0;
      height: 0;
      border-top-width: var(--annuals-timeline-line-width, 4px);
      border-top-style: var(--annuals-timeline-line-style, solid);
      border-top-color: var(--annuals-timeline-line-color, var(--divider-color, rgba(128, 128, 128, 0.4)));
    }
    /* Marks the past/future boundary - only present once at least one
       recent-past event is on the axis (see _buildTimeline). Left is set
       inline, halfway between today and the nearest past event. Same
       border-based rendering as .line above, for the same reason (so its
       own configurable style option can be dashed/dotted, not just solid). */
    .timeline-divider {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 0;
      border-left-width: var(--annuals-timeline-divider-width, 1px);
      border-left-style: var(--annuals-timeline-divider-style, solid);
      border-left-color: var(--annuals-timeline-divider-color, var(--divider-color, rgba(128, 128, 128, 0.4)));
    }
    /* Each event is a small group (the circle plus, for Important events, an
       adjacent glyph to its left) positioned as one unit - top/left are set
       inline (see _buildTimeline), left placing the *circle* at its
       days-until position regardless of whether an Important glyph extends
       further left. */
    .timeline-dot-wrap {
      position: absolute;
      transform: translate(-50%, -50%);
      cursor: pointer;
    }
    .timeline-dot-wrap.is-next {
      cursor: default;
    }
    .timeline-dot {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      /* The ring that separates each dot from the background (and from an
         adjacent same-day dot) - a fixed-width outline in the card's own
         background color, same trick as .is-next used before this was
         applied to every dot. */
      box-shadow: 0 0 0 2px var(--card-background-color, var(--ha-card-background, #fff));
    }
    /* VIP replaces the dot's plain color with the badge icon itself, large
       and centered inside the still-visible circle - centering the glyph
       directly on a bare transparent dot read as a naked symbol with no
       "this is a dot on the axis" anchor. */
    .timeline-dot-vip {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    /* width/height/--mdc-icon-size/color are all set inline (see
       _buildTimeline) - color specifically because it needs to read the
       configurable Badge Color (Timeline) var with a white fallback, which
       an ordinary CSS rule here can't express. */
    /* Important leaves the circle untouched and adds a same-height glyph
       immediately to its left instead - unlike VIP, Important doesn't
       replace the event's own identity marker. No margin and no square
       aspect-ratio here: the container's width is set inline to the glyph's
       own measured width (see _fitTimelineIcon), so its right edge - and
       therefore the glyph's right edge - sits flush against the circle
       instead of leaving the empty side-padding a square icon box has. */
    .timeline-dot-important {
      position: absolute;
      top: 50%;
      /* right:100% is the circle's own border edge; the ring is drawn
         *outside* that by box-shadow, so the glyph is pushed out by the ring
         width to sit against its outer edge rather than overlapping it.
         Set inline from TIMELINE_DOT_RING so the two can't drift apart. */
      right: 100%;
      transform: translateY(-50%);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .timeline-tip {
      /* left/top/width are set inline per-tooltip (see _buildTimeline), so
         it stays inside the card on both axes. border-box so the width set
         there (measured via offsetWidth, which includes padding+border) is
         applied back as the same total width. */
      box-sizing: border-box;
      position: absolute;
      background: var(--card-background-color, var(--ha-card-background, #fff));
      border: 1px solid var(--divider-color, rgba(128, 128, 128, 0.4));
      border-radius: 6px;
      padding: 4px 8px;
      font-size: var(--annuals-timeline-tooltip-size, 11px);
      font-weight: var(--annuals-timeline-tooltip-weight, normal);
      font-style: var(--annuals-timeline-tooltip-style, normal);
      text-transform: var(--annuals-timeline-tooltip-transform, none);
      text-decoration: var(--annuals-timeline-tooltip-decoration, none);
      letter-spacing: var(--annuals-timeline-tooltip-spacing, normal);
      color: var(--annuals-timeline-tooltip-color, inherit);
      max-width: 220px;
      white-space: normal;
      pointer-events: none;
      z-index: 1;
      display: none;
    }
    /* Footer button row under the axis: the list-expander on the left, the
       configurable "More" action on the right. */
    .timeline-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 6px;
    }
    .timeline-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      background: none;
      border: none;
      padding: 4px 6px;
      margin: 0;
      border-radius: 6px;
      cursor: pointer;
      font: inherit;
      font-size: var(--annuals-timeline-button-size, 12px);
      font-weight: var(--annuals-timeline-button-weight, inherit);
      font-style: var(--annuals-timeline-button-style, inherit);
      text-transform: var(--annuals-timeline-button-transform, none);
      text-decoration: var(--annuals-timeline-button-decoration, none);
      letter-spacing: var(--annuals-timeline-button-spacing, normal);
      color: var(--annuals-timeline-button-color, var(--secondary-text-color, #888));
    }
    .timeline-btn:hover {
      background: var(--secondary-background-color, rgba(128, 128, 128, 0.12));
    }
    .timeline-btn ha-icon {
      --mdc-icon-size: 18px;
      display: block;
      transition: transform 0.18s ease;
    }
    .timeline-btn.is-open ha-icon {
      transform: rotate(180deg);
    }
    /* The expandable chronological list under the footer - same sentence
       text as each dot's tooltip, prefixed with that event's own icon in its
       type color. */
    .timeline-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-top: 6px;
      padding-top: 8px;
      border-top: 1px solid var(--divider-color, rgba(128, 128, 128, 0.4));
    }
    .timeline-list[hidden] {
      display: none;
    }
    .timeline-list-item {
      display: flex;
      align-items: center;
      gap: 8px;
      line-height: 1.4;
    }
    /* Applied to the text span, not the whole row, so the row's own icon
       (sized independently via --mdc-icon-size below) isn't affected by
       this text-only styling. */
    .timeline-list-item span {
      font-size: var(--annuals-timeline-list-size, 12px);
      font-weight: var(--annuals-timeline-list-weight, normal);
      font-style: var(--annuals-timeline-list-style, normal);
      text-transform: var(--annuals-timeline-list-transform, none);
      text-decoration: var(--annuals-timeline-list-decoration, none);
      letter-spacing: var(--annuals-timeline-list-spacing, normal);
      color: var(--annuals-timeline-list-color, inherit);
    }
    .timeline-list-item ha-icon {
      --mdc-icon-size: 18px;
      flex: 0 0 auto;
      /* translateY set inline by _alignTimelineIconToText, same reason as
         the header icon above. */
      display: block;
    }
    /* Positioning context for the VIP/Important badge overlays below - the
       wrap, not the icon itself, so a badge's absolute position isn't
       thrown off by the icon's own translateY alignment offset. */
    .timeline-list-icon-wrap {
      position: relative;
      flex: 0 0 auto;
    }
    /* Bare glyphs, no round background - unlike the list layout's own
       .vip-badge/.important-badge, which do have one. Sized smaller than
       .timeline-list-item's own ha-icon rule, so the specificity here needs
       two classes to win over that one-class-plus-type selector. */
    .timeline-list-item .timeline-list-badge {
      position: absolute;
      --mdc-icon-size: 11px;
      width: 11px;
      height: 11px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .timeline-list-badge-important {
      top: -4px;
      left: -4px;
    }
    .timeline-list-badge-vip {
      top: -4px;
      right: -4px;
    }
  `;

  // One accent color per event type, used only by the timeline layout to
  // tell dots apart at a glance without a legend (see the Colors tab for
  // per-field text/badge colors, which stay separate from this). These are
  // Home Assistant's own standard theme color variables, so they follow
  // whatever theme is active instead of being fixed values; the literal
  // fallbacks only apply on a theme that doesn't define them. Covers every
  // type in const.py's ALL_EVENT_TYPES - an earlier version was missing
  // name_day and memorial, which silently fell through to the "custom" grey.
  const TIMELINE_TYPE_COLORS = {
    birthday: "var(--deep-orange-color, #ff6f22)",
    anniversary: "var(--purple-color, #926bc7)",
    name_day: "var(--cyan-color, #00bcd4)",
    wedding_anniversary: "var(--pink-color, #e91e63)",
    memorial: "var(--blue-grey-color, #607d8b)",
    pet_birthday: "var(--green-color, #4caf50)",
    work_anniversary: "var(--blue-color, #2196f3)",
    custom: "var(--grey-color, #9e9e9e)",
    one_time: "var(--amber-color, #ffb300)",
    holiday: "var(--teal-color, #009688)",
    // Not one of const.py's ALL_EVENT_TYPES - every embedded external
    // calendar's events share this one entry regardless of which calendar
    // they came from (see buildExternalEvent), same as every other type
    // here being a single color across however many events share it.
    calendar: "var(--light-blue-color, #03a9f4)",
  };
  // Event type keys in the fixed order they're listed throughout the editor
  // (Event types filter grid, this new Colors -> EVENT TYPES section) -
  // shared so both stay in sync with TIMELINE_TYPE_COLORS above.
  const EVENT_TYPE_KEYS = Object.keys(TIMELINE_TYPE_COLORS);
  // colorName is only ever passed for an external calendar event (type
  // "calendar") - an explicit per-type Colors override still wins if the
  // user set one, but otherwise each embedded calendar uses its own
  // configured "Calendar color" (HA's entity-settings dropdown, resolved
  // asynchronously by _fetchCalendarColors since it isn't in hass.entities)
  // rather than every embedded calendar sharing one flat
  // TIMELINE_TYPE_COLORS.calendar value. The stored color is one of HA's
  // standard Material color names ("pink", "green", ...) - the exact same
  // `--<name>-color` theme variables TIMELINE_TYPE_COLORS' own per-type
  // entries above already use, confirmed live (--calendar-color-pink is NOT
  // a real theme variable and silently fell through to the fallback;
  // --pink-color is).
  function timelineDotColor(config, type, colorName) {
    const configured = config && config.colors && config.colors[`type_${type}`];
    if (configured) return configured;
    if (type === "calendar" && colorName) {
      return `var(--${colorName}-color, ${TIMELINE_TYPE_COLORS.calendar})`;
    }
    return TIMELINE_TYPE_COLORS[type] || TIMELINE_TYPE_COLORS.custom;
  }
  // Width of the ring drawn around each dot (see .timeline-dot's box-shadow).
  // Kept here because _buildTimeline needs it in JS too, to sit the Important
  // glyph against the ring's *outer* edge rather than the circle's own edge.
  const TIMELINE_DOT_RING = 2;

  class AnnualsCard extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      // Populated asynchronously by _fetchExternalEvents (see set hass
      // below) - empty until the first fetch resolves, same as any
      // network-backed data has to start somewhere. Never read directly by
      // _filteredEvents/_visibleEvents' callers except through that method.
      this._externalEvents = [];
      this._externalSignature = undefined;
      // entity_id -> configured "Calendar color" name (see
      // _fetchCalendarColors) - undefined until that resolves, same
      // "starts empty, fills in asynchronously" shape as _externalEvents.
      this._calendarColors = {};
      this._calendarColorsKey = undefined;
    }

    setConfig(config) {
      this._config = defaultConfig(config);
      this._built = false;
      this._eventsSignature = undefined;
      // Config-only edits (e.g. picking a calendar in the editor) don't
      // necessarily change `hass` itself, so set hass() below won't
      // necessarily re-run - force the next external-events check instead
      // of waiting for one.
      this._externalSignature = undefined;
      this._calendarColorsKey = undefined;
      if (this._hass) {
        this._fetchExternalEvents();
        this._fetchCalendarColors();
      }
      this._render();
    }

    set hass(hass) {
      // See eventsSignature() above - re-render only on the first hass
      // (nothing built yet), a language change (translations depend on
      // it), or an actual change to one of this card's own entities;
      // every other state update in the system leaves the existing DOM -
      // and whatever transient state a person is mid-interaction with -
      // untouched.
      const prevHass = this._hass;
      this._hass = hass;
      // Cheap even when nothing changed - only actually fetches when the
      // configured calendars, the day window, or the calendar day itself
      // changed since the last check (see externalCalendarsSignature).
      const extSignature = externalCalendarsSignature(this._config, hass);
      if (extSignature !== this._externalSignature) {
        this._externalSignature = extSignature;
        this._fetchExternalEvents();
      }
      this._fetchCalendarColors();
      const signature = eventsSignature(hass);
      const langChanged = !prevHass || prevHass.language !== hass.language;
      if (this._built && !langChanged && signature === this._eventsSignature) return;
      this._eventsSignature = signature;
      this._render();
    }

    // A calendar entity's own "Calendar color" (set in its entity settings
    // dialog) lives in the entity registry's per-platform `options`, which
    // the lightweight hass.entities collection this card reads everywhere
    // else does NOT carry (confirmed live: hass.entities[id] has no
    // `options` key at all, only entity_id/name/icon/....). Reading it
    // needs an explicit registry fetch, same "starts empty, fills in
    // asynchronously" shape _fetchExternalEvents already established for
    // this card's other non-hass.states-backed data. Keyed by the
    // calendars list alone (not the day window) since a color never
    // depends on that.
    async _fetchCalendarColors() {
      const config = this._config;
      const calendars = Array.isArray(config.external_calendars) ? config.external_calendars : [];
      const key = JSON.stringify(calendars);
      if (key === this._calendarColorsKey) return;
      this._calendarColorsKey = key;
      if (!calendars.length) {
        this._calendarColors = {};
        return;
      }
      const fetchId = (this._colorFetchId = (this._colorFetchId || 0) + 1);
      const entries = await Promise.all(
        calendars.map(async (entityId) => {
          try {
            const reg = await this._hass.callWS({ type: "config/entity_registry/get", entity_id: entityId });
            return [entityId, reg?.options?.calendar?.color];
          } catch (err) {
            return [entityId, undefined];
          }
        })
      );
      if (fetchId !== this._colorFetchId) return;
      this._calendarColors = Object.fromEntries(entries);
      this._render();
    }

    // Fetches every configured external calendar's events, once, for a
    // window wide enough to cover whatever days_ahead/days_past currently
    // allow (capped at a year out when days_ahead is 0/unset, i.e.
    // "unbounded" for Annuals' own events - an actual unbounded window isn't
    // meaningful for a REST call, and a year covers every realistic
    // days_ahead/soon_days setting). Failures for one calendar (e.g. a
    // temporarily unavailable integration) never take down the others.
    async _fetchExternalEvents() {
      const config = this._config;
      const calendars = Array.isArray(config.external_calendars) ? config.external_calendars : [];
      const fetchId = (this._externalFetchId = (this._externalFetchId || 0) + 1);
      if (!calendars.length) {
        if (this._externalEvents.length) {
          this._externalEvents = [];
          this._render();
        }
        return;
      }
      const now = new Date();
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - (config.days_past || 0));
      const aheadDays = config.days_ahead && config.days_ahead > 0 ? config.days_ahead : 365;
      const end = new Date(now);
      end.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() + aheadDays + 1);
      const results = await Promise.all(
        calendars.map(async (entityId) => {
          const state = this._hass.states[entityId];
          if (!state) return [];
          const calendarName = state.attributes.friendly_name || entityId;
          const calendarIcon = state.attributes.icon || "mdi:calendar-blank";
          try {
            const raw = await this._hass.callApi(
              "GET",
              `calendars/${entityId}?start=${start.toISOString()}&end=${end.toISOString()}`
            );
            return (raw || [])
              .map((ev) => buildExternalEvent(ev, entityId, calendarName, calendarIcon, now))
              .filter(Boolean);
          } catch (err) {
            return [];
          }
        })
      );
      // A slower-to-resolve earlier fetch (e.g. the day window just grew)
      // landing after a newer one already applied would otherwise flicker
      // the list back to stale data - only the most recently started fetch
      // is allowed to actually update anything.
      if (fetchId !== this._externalFetchId) return;
      this._externalEvents = results.flat();
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
      // An external event's own `days` (see buildExternalEvent) is already
      // its real, one-off offset from today - unlike an Annuals event's,
      // there's no yearly-recurring month/day to re-derive a "days ago"
      // figure from, so a negative e.days *is* that figure already.
      if (e.isExternal) return e.days < 0 && e.days >= -pastWindow;
      const since = daysSincePrevOccurrence(e.month, e.day, now);
      return since > 0 && since <= pastWindow;
    }

    _filteredEvents() {
      const config = this._config;
      const now = new Date();
      const all = [...getEvents(this._hass), ...this._externalEvents];
      let filtered = all.filter((e) => {
        // `types`/`categories`/VIP/Important all describe Annuals-specific
        // concepts (event type, holiday category, the manual VIP flag and
        // computed Important milestone) that simply don't exist for an
        // external calendar's own events - only the day-window filters
        // below (today_only, and days_ahead/soon_days further down) apply
        // to both alike, same as defaultConfig's external_calendars comment
        // notes.
        if (e.isExternal) return !config.today_only || e.days === 0;
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
          // Same isExternal branch as _isRecent above - an external event's
          // own e.days is already signed, so "how many days ago" is simply
          // its negation instead of daysSincePrevOccurrence's yearly-
          // recurrence math.
          daysSince: e.days === 0 ? 0 : e.isExternal ? -e.days : daysSincePrevOccurrence(e.month, e.day, now),
        }))
        .filter((e) => (e.daysSince === 0 ? showToday : showPast));
      // days_ahead only caps how far into the future upcoming events are
      // shown - applying it earlier (to `filtered`) would also cull recent
      // past events being considered for the hero section above, whose own
      // window is governed by days_past instead, not days_ahead.
      const upcoming = filtered
        .filter((e) => e.days > 0 && !this._isRecent(e, now))
        .filter((e) => !config.days_ahead || config.days_ahead <= 0 || e.days <= config.days_ahead)
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
      return [...hero, ...upcoming]
        .sort((a, b) => {
          const dayDiff = sortKey(a) - sortKey(b);
          if (dayDiff !== 0) return dayDiff;
          // Same day - an external event's own time of day (see
          // buildExternalEvent) decides order within it; every Annuals
          // event (no time of day of its own) sorts as if it were an
          // all-day event, i.e. before any timed external event that day.
          const timeDiff = (a.timeSortKey ?? -1) - (b.timeSortKey ?? -1);
          if (timeDiff !== 0) return timeDiff;
          return (a.entityId || "").localeCompare(b.entityId || "");
        })
        .slice(0, this._config.count || 10);
    }

    // "when" text for the timeline layout - e.daysSince (attached in
    // _filteredEvents, only for hero/recent-past events) takes priority over
    // e.days (always the forward-looking "days until next occurrence") the
    // same way _row() has to handle it, since a recent-past event's own
    // e.days already points at its *next* year's occurrence by this point.
    _timelineWhenText(e, strings) {
      if (e.daysSince !== undefined && e.daysSince > 0) {
        return e.daysSince === 1 ? strings.dayAgo : strings.daysAgo(e.daysSince);
      }
      return e.days === 0 ? strings.today : e.days === 1 ? strings.inDay : strings.inDays(e.days);
    }

    // Short calendar date ("6 Aug") for config.timeline_show_date - same
    // day-offset math and Intl.DateTimeFormat call as _row()'s own dateText,
    // kept separate since the timeline reads its offset off e.daysSince/
    // e.days the same way _timelineWhenText does. Returns null on the event's
    // own day - _timelineSentenceFragment already ends "...is today" there,
    // so a literal "(Today)" right after it would just repeat itself.
    _timelineDateText(e) {
      const isPast = e.daysSince !== undefined && e.daysSince > 0;
      if (!isPast && e.days === 0) return null;
      const target = new Date();
      target.setHours(0, 0, 0, 0);
      target.setDate(target.getDate() + (isPast ? -e.daysSince : e.days));
      return new Intl.DateTimeFormat(this._hass.language || "en", {
        day: "numeric",
        month: "short",
      }).format(target);
    }

    // Time range ("14:00–15:00", or a single time with no dash when there's
    // no end/it equals the start) for config.timeline_show_time - same
    // formatting _row()'s own values.time uses, only ever non-null for a
    // timed (non-all-day) external calendar event (see buildExternalEvent).
    _timelineTimeText(e) {
      if (!e.isExternal || e.allDay || !e.startTime) return null;
      const timeFmt = new Intl.DateTimeFormat(this._hass.language || "en", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const startStr = timeFmt.format(e.startTime);
      const endStr = e.endTime ? timeFmt.format(e.endTime) : "";
      return endStr && endStr !== startStr ? `${startStr}–${endStr}` : startStr;
    }

    // VIP/Important flags for one event, resolved against this card's usual
    // show_vip_badge/show_important_badge toggles and icon config - both can
    // be present on the same event, since the timeline draws them in two
    // different places (see _buildTimeline): a small overlay badge beside
    // the axis dot's own icon, and the same beside the header/expandable
    // Details list's icon (those two share both the same look and the same
    // color). Which color config drives them depends on `context`:
    // "timeline" (the default) uses the Timeline's own Badge Color fields
    // (vip_badge_timeline/important_badge_timeline) for the axis dots only;
    // "list" uses the same Badge Color fields the classic List layout's own
    // corner badges use (vip_badge/important_badge) for both the header and
    // the expandable Details list - two independent colors so the compact
    // axis view and the two textual views can each be themed on their own.
    _timelineBadges(e, config, context) {
      const vipColorVar =
        context === "list" ? "--annuals-vip-badge-color" : "--annuals-vip-badge-timeline-color";
      const importantColorVar =
        context === "list" ? "--annuals-important-badge-color" : "--annuals-important-badge-timeline-color";
      const vip =
        e.vip && config.show_vip_badge !== false
          ? {
              icon: config.vip_badge_icon || "mdi:star",
              colorVar: vipColorVar,
              fallback: "var(--error-color)",
            }
          : null;
      const important =
        e.important && config.show_important_badge !== false
          ? {
              icon: config.important_badge_icon || "mdi:exclamation-thick",
              colorVar: importantColorVar,
              fallback: "var(--annuals-soon-color, var(--warning-color))",
            }
          : null;
      return { vip, important };
    }

    // Same accent/today/soon category lookup _row() uses for the list
    // layout's icon animation, applied to one timeline event instead of one
    // rendered row - returns the "anim-x" class (or "" for none/unset) to
    // add to that event's axis dot.
    _timelineAnimClass(e, config) {
      const soonDays = config.soon_days;
      const colorCategory = e.days === 0 ? "today" : e.days > 0 && e.days <= soonDays ? "soon" : "accent";
      const animName = (config.icon_animation || {})[colorCategory];
      return animName && animName !== "none" ? `anim-${animName}` : "";
    }

    // Scales one of the timeline's badge glyphs (VIP star / Important
    // exclamation) to a target size in real pixels, and optionally sizes its
    // container to the glyph's own width.
    //
    // Every icon fills its 24x24 viewBox differently - mdi:star's path spans
    // 20x19 of it, mdi:exclamation-thick's only 4x18 - so a fixed
    // --mdc-icon-size renders visually large for one icon and tiny for
    // another, and a square icon box leaves wide empty side-padding around a
    // narrow glyph. Since both badge icons are user-configurable, the actual
    // path bounds are measured instead of assuming any one icon's ratio.
    //
    // ha-icon builds its <svg> asynchronously inside two nested shadow roots,
    // so this measures on the next frame; the caller's initial estimate
    // stands if the svg still isn't there (or if this is an icon-font build
    // with no path to measure at all).
    _fitTimelineIcon(icon, container, opts) {
      requestAnimationFrame(() => {
        const inner = icon.shadowRoot && icon.shadowRoot.querySelector("ha-svg-icon");
        const svg = inner && inner.shadowRoot && inner.shadowRoot.querySelector("svg");
        const path = svg && svg.querySelector("path");
        if (!path) return;
        let bbox;
        try {
          bbox = path.getBBox();
        } catch (err) {
          return; // not laid out yet - keep the estimate
        }
        if (!bbox || !bbox.width || !bbox.height) return;
        // getBBox reports the svg's own user units, so normalize against the
        // viewBox rather than assuming the usual 24x24.
        const viewBox = (svg.getAttribute("viewBox") || "0 0 24 24").split(/[\s,]+/);
        const unitW = parseFloat(viewBox[2]) || 24;
        const unitH = parseFloat(viewBox[3]) || 24;
        const w = bbox.width / unitW;
        const h = bbox.height / unitH;
        // fitBy "both" keeps the whole glyph inside the target box (VIP,
        // which sits inside the circle); "height" matches only the glyph's
        // height and lets its width follow (Important, which sits beside the
        // circle and should be exactly as tall as it).
        const ratio = opts.fitBy === "height" ? h : Math.max(w, h);
        const iconSize = Math.round(opts.target / ratio);
        icon.style.width = `${iconSize}px`;
        icon.style.height = `${iconSize}px`;
        icon.style.setProperty("--mdc-icon-size", `${iconSize}px`);
        if (container && opts.fitContainerWidth) {
          container.style.width = `${Math.ceil(w * iconSize)}px`;
        }
      });
    }

    // Nudges an icon vertically so the *visible glyph's* center lines up
    // with the center of the text beside it. Flexbox only centers the
    // icon's box, and an mdi glyph is rarely centered inside its own 24x24
    // viewBox (mdi:cake-variant, for one, sits noticeably high), so box
    // centering alone leaves the symbol looking off relative to the text.
    // Measured on the next frame for the same reason as _fitTimelineIcon:
    // ha-icon builds its <svg> asynchronously in nested shadow roots.
    _alignTimelineIconToText(icon, textEl) {
      requestAnimationFrame(() => {
        const inner = icon.shadowRoot && icon.shadowRoot.querySelector("ha-svg-icon");
        const svg = inner && inner.shadowRoot && inner.shadowRoot.querySelector("svg");
        const path = svg && svg.querySelector("path");
        if (!path) return;
        const glyph = path.getBoundingClientRect();
        const text = textEl.getBoundingClientRect();
        if (!glyph.height || !text.height) return;
        const delta = (text.top + text.height / 2) - (glyph.top + glyph.height / 2);
        if (!delta) return;
        icon.style.transform = `translateY(${Math.round(delta * 10) / 10}px)`;
      });
    }

    // One-sentence description shared by the timeline's header (the single
    // soonest event) and every dot's click tooltip, e.g. "Kevin's 27th
    // birthday is today" (English ordinal suffix superscript) or "Kevins 27.
    // Geburtstag ist heute" (German keeps "Geburtstag" capitalized - it's a
    // noun - and drops the apostrophe a name ending in s/x/z/ß would
    // otherwise double up, e.g. "Klaus'" not "Klauss'"), or for an event
    // with no occurrence count (a holiday, or any event added before
    // occurrence tracking existed), simply "Labor Day is in 43 days" - the
    // same templates work for every event type since neither hardcodes
    // "birthday"/"anniversary"/etc. anywhere. Returns a DocumentFragment
    // (not a string) so the ordinal suffix can be an actual <sup> element -
    // callers append it directly rather than assigning textContent/innerHTML.
    _timelineSentenceFragment(e, strings, config) {
      const frag = document.createDocumentFragment();
      const whenRaw = this._timelineWhenText(e, strings);
      // Both templates always put {when} at the sentence's end (never its
      // start), so unlike _row()'s version of this same countdown text, it
      // always needs the lowercased "...is today"/"...ist heute" form here.
      const when = whenRaw.charAt(0).toLowerCase() + whenRaw.slice(1);
      // Same adjustment _row() makes for its own badge number: once an
      // event's date has passed, e.occurrence already counts *next* year's
      // occurrence (the sensor jumped forward the day after the event), so
      // a recent-past event's sentence needs that number one lower to
      // describe the occurrence that actually just happened.
      const isPast = e.daysSince !== undefined && e.daysSince > 0;
      const occurrence = isPast && e.occurrence != null ? e.occurrence - 1 : e.occurrence;
      // Layout -> Timeline -> Options: "Pioneer Day (US-UT)" instead of just
      // "Pioneer Day" - hyphenated country-subdivision, distinct from the
      // list layout's own "US (UT)" country-suffix format (see _row()),
      // since this one's meant to read as a single parenthetical rather than
      // nested parens.
      const holidaySuffix =
        config.show_holiday_suffix && e.type === "holiday" && e.country
          ? ` (${e.country}${e.subdivision ? `-${e.subdivision}` : ""})`
          : "";
      const baseName = config.timeline_show_full_name && e.fullName ? e.fullName : e.name;
      const displayName = `${baseName}${holidaySuffix}`;
      // Layout -> Timeline -> Options: "Show date"/"Show time"/"Show
      // location"/"Show description" each contribute their own piece (any
      // combination of which can be on at once) to one shared trailing
      // parenthetical, e.g. "...is in 3 days (6 Aug, 14:00–15:00 · Home ·
      // Weekly sync)" - rather than a separate "(...)" per toggle, which
      // would read as a run of disconnected parens instead of one
      // parenthetical remark. Date is null on the event's own day (see
      // _timelineDateText), since the sentence already ends "...is today"
      // right before it; time/location/description are simply never shown
      // for anything but a timed external calendar event (see
      // buildExternalEvent) regardless of their own toggle.
      const timelineDateText = config.timeline_show_date ? this._timelineDateText(e) : null;
      const timelineTimeText = config.timeline_show_time ? this._timelineTimeText(e) : null;
      const timelineLocationText = config.timeline_show_location && e.isExternal ? e.location : null;
      const timelineDescriptionText =
        config.timeline_show_description && e.isExternal ? e.description : null;
      const parenParts = [timelineDateText, timelineTimeText, timelineLocationText, timelineDescriptionText].filter(
        (part) => part
      );
      const dateSuffix = parenParts.length ? ` (${parenParts.join(" · ")})` : "";
      if (!(config.show_badge !== false && occurrence != null)) {
        const tmpl =
          (isPast ? strings.timelineSentenceSimplePast : strings.timelineSentenceSimple) || "{name} is {when}";
        frag.appendChild(
          document.createTextNode(tmpl.replace("{name}", displayName).replace("{when}", when) + dateSuffix)
        );
        return frag;
      }
      let typeLabel = strings.types[e.type] || e.type;
      if (e.type === "holiday" && e.category) {
        typeLabel = `${typeLabel} (${(strings.categories || {})[e.category] || e.category})`;
      }
      // German nouns stay capitalized wherever they sit in the sentence;
      // only English (and any other language not opting in) lowercases the
      // type the way _row()'s trailing countdown text does.
      const typeText = strings.capitalizeSentenceType
        ? typeLabel
        : typeLabel.charAt(0).toLowerCase() + typeLabel.slice(1);
      const possessive = (strings.possessive || ((n) => `${n}'s`))(displayName);
      const { num, sup } = (strings.ordinalParts || ((n) => ({ num: `${n}.`, sup: "" })))(occurrence);
      // {sup} is the one placeholder handled specially below (split instead
      // of replaced) so its value can become a real <sup> element; every
      // other placeholder is a plain string substitution.
      const tmpl =
        (isPast ? strings.timelineSentencePast : strings.timelineSentence) ||
        "{possessive} {ordinal}{sup} {type} is {when}";
      const [before, after] = tmpl.split("{sup}");
      const fill = (s) =>
        (s || "").replace("{possessive}", possessive).replace("{ordinal}", num).replace("{type}", typeText).replace("{when}", when);
      frag.appendChild(document.createTextNode(fill(before)));
      if (sup) {
        const supEl = document.createElement("sup");
        supEl.textContent = sup;
        frag.appendChild(supEl);
      }
      frag.appendChild(document.createTextNode(fill(after) + dateSuffix));
      return frag;
    }

    // Compact horizontal-axis layout (layout_style: "timeline"): one header
    // line per event sharing the soonest day (events is already sorted
    // chronologically, oldest-past-first, by _visibleEvents), plus a dot per
    // event positioned and sized by its own signed distance from today (see
    // axisDaysOf below) - closer events (in either direction, past or
    // future) render bigger, linearly (not logarithmically) across the
    // widest gap in the set, so the axis always fits its container
    // regardless of days_ahead/days_past. Every dot not already described in
    // the header is clickable, toggling a small tooltip instead of
    // permanently showing every event's details at once - that's what keeps
    // this fitting a narrow Sections-view column where the regular row list
    // can't.
    _buildTimeline(events, strings) {
      const config = this._config;
      const wrap = document.createElement("div");
      wrap.className = "timeline";

      // Signed day offset from today for one event: e.days is always the
      // sensor's forward-looking "days until next occurrence" (see
      // getEvents), which already points at *next* year's date once an
      // event's own date has passed - daysSince (attached in
      // _filteredEvents, only for hero/recent-past events) is what actually
      // says "this happened N days ago", so it takes priority whenever
      // present and positive. Used everywhere below instead of raw e.days
      // so recent-past events land correctly to the left of today on the
      // axis instead of scattered among next year's events.
      const isPastEvent = (e) => e.daysSince !== undefined && e.daysSince > 0;
      const axisDaysOf = (e) => (isPastEvent(e) ? -e.daysSince : e.days);

      // Every event sharing the *first* day gets its own header line, not
      // just the first one _visibleEvents happened to sort first - two
      // events landing on the same day are equally deserving of a header
      // line, and showing only one made the other's own tooltip the only
      // place its text ever appeared. "First" always means events[0] -
      // _visibleEvents already sorts oldest-past-first, so this is the
      // oldest recent-past event whenever one is visible at all, and falls
      // back to today/the soonest upcoming event exactly as before once no
      // past events are shown.
      const minAxisDays = axisDaysOf(events[0]);

      // timeline_header_max_events (Layout -> Timeline -> Options) caps how
      // many lines *one* day contributes - without it, a day with a dozen
      // tied events would make the header that tall. timeline_header_min_events
      // instead widens the header *across* days, pulling in further days
      // (each still subject to the same per-day cap) until at least that many
      // lines are shown in total - useful for always seeing "what's coming
      // up next" at a glance instead of just today's/the soonest day's own
      // events. Both default to unset (0), which reproduces the original,
      // uncapped single-day behavior exactly.
      const maxPerDay = parseInt(config.timeline_header_max_events, 10) || 0;
      const minTotal = Math.max(1, parseInt(config.timeline_header_min_events, 10) || 0);
      const nextGroup = [];
      for (let i = 0; i < events.length && nextGroup.length < minTotal; ) {
        const dayVal = axisDaysOf(events[i]);
        let dayGroup = [];
        while (i < events.length && axisDaysOf(events[i]) === dayVal) {
          dayGroup.push(events[i]);
          i++;
        }
        if (maxPerDay > 0 && dayGroup.length > maxPerDay) dayGroup = dayGroup.slice(0, maxPerDay);
        nextGroup.push(...dayGroup);
      }
      const inHeader = (e) => nextGroup.includes(e);
      const header = document.createElement("div");
      header.className = "timeline-header";
      nextGroup.forEach((ev) => {
        // "list" context, not "timeline" - the header's icon+badge is the
        // same visual (and now the same color) as the expandable Details
        // list's own rows; only the axis dots use the Timeline's own Badge
        // Color fields.
        const badges = this._timelineBadges(ev, config, "list");
        const row = document.createElement("div");
        row.className = "timeline-header-row";
        // Same icon + small overlay badge structure the expandable Details
        // list uses (see events.forEach below) - exclamation top-left, star
        // top-right of the entity's own icon, rather than the older
        // "Important sits beside the marker, VIP replaces it" layout, so the
        // two contexts read consistently as the user expects.
        const headerIcons = document.createElement("div");
        headerIcons.className = "timeline-header-icons";

        const mainIcon = document.createElement("ha-icon");
        mainIcon.setAttribute("icon", ev.icon);
        mainIcon.style.color = timelineDotColor(config, ev.type, this._calendarColors?.[ev.calendarEntityId]);
        // Animated via a wrapping span, not the icon itself - the icon
        // already carries its own inline transform (translateY, set below by
        // _alignTimelineIconToText), and a CSS animation targeting the same
        // property on the same element would override that alignment for as
        // long as the animation runs. Nesting them keeps both transforms
        // independent: the wrapper spins/pulses/etc, the icon inside it
        // still sits at its aligned offset.
        const mainAnimClass = this._timelineAnimClass(ev, config);
        if (mainAnimClass) {
          const animWrap = document.createElement("span");
          animWrap.className = `timeline-icon-anim-wrap ${mainAnimClass}`;
          animWrap.appendChild(mainIcon);
          headerIcons.appendChild(animWrap);
        } else {
          headerIcons.appendChild(mainIcon);
        }

        if (badges.important) {
          const excl = document.createElement("ha-icon");
          excl.className = "timeline-header-badge timeline-header-badge-important";
          excl.setAttribute("icon", badges.important.icon);
          excl.style.color = `var(${badges.important.colorVar}, ${badges.important.fallback})`;
          headerIcons.appendChild(excl);
        }
        if (badges.vip) {
          const star = document.createElement("ha-icon");
          star.className = "timeline-header-badge timeline-header-badge-vip";
          star.setAttribute("icon", badges.vip.icon);
          star.style.color = `var(${badges.vip.colorVar}, ${badges.vip.fallback})`;
          headerIcons.appendChild(star);
        }
        row.appendChild(headerIcons);

        const sentence = document.createElement("div");
        sentence.className = "sentence";
        sentence.appendChild(this._timelineSentenceFragment(ev, strings, config));
        row.appendChild(sentence);
        header.appendChild(row);
        this._alignTimelineIconToText(mainIcon, sentence);
      });
      wrap.appendChild(header);

      const axis = document.createElement("div");
      axis.className = "timeline-axis";
      // Mirrors whatever CARD_STYLE's ".timeline-axis .line" border-top-width
      // actually renders at, so the line's vertical center still lands on
      // axisCenter (see line.style.top below) no matter how thick the user
      // has configured it.
      const LINE_THICKNESS = parseFloat(config.timeline_line_width) || 4;
      const line = document.createElement("div");
      line.className = "line";
      axis.appendChild(line);

      const tip = document.createElement("div");
      tip.className = "timeline-tip";
      axis.appendChild(tip);

      // The axis spans from the furthest-back recent-past event (if any) to
      // the furthest-out upcoming one, with today sitting wherever that
      // split lands rather than always at the left edge - maxPast/maxFuture
      // guard against an empty side (e.g. no past events at all) collapsing
      // that side's scale to 0.
      const pastDaysSince = events.filter(isPastEvent).map((e) => e.daysSince);
      const futureDays = events.filter((e) => !isPastEvent(e)).map((e) => e.days);
      const maxPast = Math.max(0, ...pastDaysSince);
      const maxFuture = Math.max(1, ...futureDays);
      const totalSpan = maxPast + maxFuture;

      // A full-height divider marking the past/future boundary, halfway
      // between today (axisDays 0, whether or not anything actually happens
      // today) and the nearest recent-past event - only drawn once there's
      // an actual past event on the axis to separate from.
      if (pastDaysSince.length) {
        const nearestPastAxisDays = -Math.min(...pastDaysSince);
        const dividerAxisDays = nearestPastAxisDays / 2;
        const dividerRatio = (dividerAxisDays + maxPast) / totalSpan;
        const divider = document.createElement("div");
        divider.className = "timeline-divider";
        divider.style.left = `${dividerRatio * 100}%`;
        axis.appendChild(divider);
      }

      const MIN_SIZE = 6;
      const MAX_SIZE = 18;
      // Clear space kept between two stacked same-day dots' own edges (on
      // top of their rings) - a fixed size *added to that specific
      // cluster's own largest dot*, not to a global maximum, so two small,
      // far-out same-day dots stack tightly instead of inheriting a gap
      // sized for the biggest dot anywhere on the axis.
      const RING_GAP = 5;

      // Purely distance-based (from today, in either direction) - a VIP
      // event deliberately gets no size bump, so its dot stays comparable to
      // its neighbours' and the star simply scales to fill whatever size
      // that dot is (see _fitTimelineIcon).
      const maxDist = Math.max(maxPast, maxFuture, 1);
      const sizeOf = (e, isNext) => {
        const ratio = Math.abs(axisDaysOf(e)) / maxDist;
        return isNext ? MAX_SIZE : Math.max(MIN_SIZE, MAX_SIZE - ratio * (MAX_SIZE - MIN_SIZE));
      };
      const sizes = events.map((e) => sizeOf(e, axisDaysOf(e) === minAxisDays));

      // Same-day events would otherwise all land at the exact same x
      // position (ratio is purely days-based) and fully overlap. Each
      // cluster instead stacks straight above/below a shared center -
      // offsets of (slot - (n-1)/2) * slotSize put a lone event exactly on
      // the line, center a 3-way cluster's middle event exactly on the
      // line, and split the line exactly between the two middle events of
      // a 2- or 4-way cluster - which is what lets the one straight axis
      // line still read as "centered" through every cluster it passes, not
      // just the biggest one. No cap on cluster size either way: the axis
      // (and so the card) simply grows by one more slotSize per additional
      // same-day event, via maxOffset below. Keyed by axisDaysOf, not raw
      // e.days, so a recent-past event never clusters with an unrelated
      // future event that happens to share the same forward day count.
      const dayGroups = new Map();
      events.forEach((e, i) => {
        const key = axisDaysOf(e);
        if (!dayGroups.has(key)) dayGroups.set(key, []);
        dayGroups.get(key).push(i);
      });
      const offsetByIndex = new Array(events.length);
      let maxOffset = 0;
      dayGroups.forEach((indices) => {
        const n = indices.length;
        const slotSize = Math.max(...indices.map((idx) => sizes[idx])) + RING_GAP;
        indices.forEach((eventIdx, slot) => {
          const offset = Math.round((slot - (n - 1) / 2) * slotSize);
          offsetByIndex[eventIdx] = offset;
          maxOffset = Math.max(maxOffset, Math.abs(offset));
        });
      });
      const TOP_PAD = 4;
      const axisCenter = MAX_SIZE / 2 + TOP_PAD + maxOffset;
      // Symmetric: since offsets range from -maxOffset to +maxOffset, the
      // container needs the same MAX_SIZE/2+TOP_PAD+maxOffset clearance
      // *below* the line as axisCenter already reserves above it - not just
      // MAX_SIZE/2+TOP_PAD. Reserving only the top half here (a leftover
      // from an earlier stack-only-upward version of this) let a
      // below-the-line dot overlap the footer's Details/More buttons, which
      // sit right after the axis in normal flow.
      axis.style.height = `${axisCenter * 2}px`;
      // The line's own top-left corner (not its center) is what `top`
      // positions - offset by half its thickness so its visual center lands
      // on axisCenter, matching how each dot is centered via
      // translate(-50%, -50%) on *its* box. Skipping this half-thickness
      // correction is what made the line sit visibly below the dots' true
      // center once the line was thickened past 1-2px.
      line.style.top = `${axisCenter - LINE_THICKNESS / 2}px`;

      // Tracked on the instance (not a local closure) so the single
      // document-level "click outside closes the tooltip" listener below -
      // added once per card instance, never re-added on every re-render -
      // always reads whichever render's tip/dot is current.
      this._timelineTipState = { tipEl: tip, activeWrap: null };
      if (!this._timelineOutsideClickHandler) {
        this._timelineOutsideClickHandler = (ev) => {
          const state = this._timelineTipState;
          if (!state || !state.activeWrap) return;
          if (!ev.composedPath().includes(state.activeWrap)) {
            state.tipEl.style.display = "none";
            state.activeWrap = null;
          }
        };
        document.addEventListener("click", this._timelineOutsideClickHandler);
      }

      events.forEach((e, i) => {
        const isNext = axisDaysOf(e) === minAxisDays;
        const offset = offsetByIndex[i];
        // 0% at the furthest-back past event, 100% at the furthest-out
        // future one - today lands wherever (maxPast/totalSpan) puts it,
        // not fixed to the left edge, once any past event is on the axis.
        const ratio = (axisDaysOf(e) + maxPast) / totalSpan;
        const size = sizes[i];
        const badges = this._timelineBadges(e, config, "timeline");

        const dotWrap = document.createElement("div");
        dotWrap.className = "timeline-dot-wrap" + (isNext ? " is-next" : "");
        dotWrap.style.left = `${ratio * 100}%`;
        dotWrap.style.top = `${axisCenter + offset}px`;
        dotWrap.style.width = `${size}px`;
        dotWrap.style.height = `${size}px`;

        const circle = document.createElement("div");
        circle.className = "timeline-dot";
        if (badges.vip) {
          circle.classList.add("timeline-dot-vip");
          // The circle keeps the event's own type color, same as every
          // other dot - only the icon replaces the plain color fill.
          // Filling the circle with the VIP badge color itself instead
          // (always red by default, regardless of event type) was the bug
          // report this fixed.
          circle.style.background = timelineDotColor(config, e.type, this._calendarColors?.[e.calendarEntityId]);
          const vipIcon = document.createElement("ha-icon");
          vipIcon.setAttribute("icon", badges.vip.icon);
          // Explicit inline color, not just the CARD_STYLE default
          // (".timeline-dot-vip ha-icon { color: #fff }") - that CSS rule
          // was the whole bug report: it always won over the Badge Color
          // (Timeline) setting since nothing here ever overrode it with the
          // configured var. White stays the fallback (for contrast against
          // whatever color the circle itself is), but a configured color now
          // actually takes effect on the star, same as it already did for
          // the Important glyph beside it.
          vipIcon.style.color = `var(${badges.vip.colorVar}, #fff)`;
          // display:flex directly on the ha-icon element (not just on its
          // parent) is what actually centers the glyph - ha-icon's own
          // internal layout otherwise leaves it off-center, which is what an
          // earlier version of this ran into. Sizes below are only a first
          // estimate; _fitTimelineIcon replaces them next frame with values
          // scaled from the glyph's measured bounds, so the star fills this
          // dot's diameter no matter how big the dot is or which icon is
          // configured.
          vipIcon.style.display = "flex";
          vipIcon.style.alignItems = "center";
          vipIcon.style.justifyContent = "center";
          vipIcon.style.width = `${size}px`;
          vipIcon.style.height = `${size}px`;
          vipIcon.style.setProperty("--mdc-icon-size", `${size}px`);
          circle.appendChild(vipIcon);
          // 0.94, not 1.0: the ring around the dot reads as part of it, so a
          // glyph running the full diameter looks like it's spilling over
          // the edge rather than sitting in the circle.
          this._fitTimelineIcon(vipIcon, circle, { target: size * 0.94, fitBy: "both" });
        } else {
          circle.style.background = timelineDotColor(config, e.type, this._calendarColors?.[e.calendarEntityId]);
        }
        dotWrap.appendChild(circle);

        if (badges.important) {
          const imp = document.createElement("div");
          imp.className = "timeline-dot-important";
          // Pushed out past the ring, which box-shadow draws outside the
          // circle's border box (where right:100% lands) - see
          // TIMELINE_DOT_RING.
          imp.style.marginRight = `${TIMELINE_DOT_RING}px`;
          const impIcon = document.createElement("ha-icon");
          impIcon.setAttribute("icon", badges.important.icon);
          impIcon.style.color = `var(${badges.important.colorVar}, ${badges.important.fallback})`;
          // Same reasoning as the VIP icon above; here the glyph is matched
          // to the circle's height and the container to the glyph's width,
          // so it ends up exactly as tall as the circle and flush against
          // its left edge.
          impIcon.style.display = "flex";
          impIcon.style.alignItems = "center";
          impIcon.style.justifyContent = "center";
          impIcon.style.width = `${size}px`;
          impIcon.style.height = `${size}px`;
          impIcon.style.setProperty("--mdc-icon-size", `${size}px`);
          imp.style.width = `${Math.round(size * 0.4)}px`;
          imp.appendChild(impIcon);
          dotWrap.appendChild(imp);
          this._fitTimelineIcon(impIcon, imp, {
            target: size,
            fitBy: "height",
            fitContainerWidth: true,
          });
        }

        // An event already described in the header above (see nextGroup)
        // has nothing new to show in a tooltip - clicking its dot would
        // just repeat the same text, so only a dot outside the header gets
        // the click handler.
        if (!inHeader(e)) {
          dotWrap.addEventListener("click", (ev) => {
            // Stopped so the document-level "click outside" listener above
            // doesn't immediately close the tooltip this same click just
            // opened (see the reopening check below for the toggle-closed
            // case instead).
            ev.stopPropagation();
            const state = this._timelineTipState;
            const reopening = state.activeWrap === dotWrap && tip.style.display === "block";
            tip.style.display = "none";
            state.activeWrap = null;
            if (reopening) return;
            tip.textContent = "";
            tip.appendChild(this._timelineSentenceFragment(e, strings, config));
            // Measured with left pinned to 0 and width released, then locked
            // to that measurement before left moves. An absolutely
            // positioned box with `left` set and `right: auto` shrink-fits
            // against "containing block width - left", so assigning left
            // *after* measuring silently re-narrows the tooltip (measured
            // live: the same text renders 179x28 at left:0 but 59x98 at
            // left:400), which threw off both the centering math and the
            // height used to place it vertically.
            tip.style.width = "auto";
            tip.style.left = "0px";
            tip.style.display = "block";
            const tipWidth = tip.offsetWidth;
            tip.style.width = `${tipWidth}px`;
            const tipHeight = tip.offsetHeight;

            // ha-card sets overflow:hidden (its background-image support
            // needs it), so anything spilling past the card is silently cut
            // off rather than just overhanging - the tooltip is therefore
            // clamped inside the card on both axes.
            const axisRect = axis.getBoundingClientRect();
            const cardRect = this.shadowRoot.querySelector("ha-card").getBoundingClientRect();
            const dotRect = dotWrap.getBoundingClientRect();
            const pad = 4;
            const gap = 6;

            const centerX = dotRect.left + dotRect.width / 2 - axisRect.left;
            const minLeft = tipWidth / 2 + (cardRect.left + pad - axisRect.left);
            const maxLeft = cardRect.right - pad - axisRect.left - tipWidth / 2;
            tip.style.left = `${Math.min(Math.max(centerX, minLeft), Math.max(minLeft, maxLeft))}px`;
            tip.style.transform = "translateX(-50%)";

            // Above the dot by default; flipped below when that would clip
            // against the card's top (which is the common case, since the
            // axis sits just under the header), then clamped so a card too
            // short for either placement still shows the whole tooltip.
            let topAbs = dotRect.top - gap - tipHeight;
            if (topAbs < cardRect.top + pad) topAbs = dotRect.bottom + gap;
            if (topAbs + tipHeight > cardRect.bottom - pad) topAbs = cardRect.bottom - pad - tipHeight;
            if (topAbs < cardRect.top + pad) topAbs = cardRect.top + pad;
            tip.style.top = `${topAbs - axisRect.top}px`;
            state.activeWrap = dotWrap;
          });
        }
        axis.appendChild(dotWrap);
      });

      wrap.appendChild(axis);

      // Footer: the list expander on the left, the configurable "More"
      // action on the right.
      const footer = document.createElement("div");
      footer.className = "timeline-footer";

      const expandBtn = document.createElement("button");
      expandBtn.type = "button";
      expandBtn.className = "timeline-btn";
      const expandIcon = document.createElement("ha-icon");
      expandIcon.setAttribute("icon", "mdi:chevron-down");
      const expandLabel = document.createElement("span");
      expandBtn.append(expandIcon, expandLabel);
      footer.appendChild(expandBtn);

      // Only rendered when an action is actually configured - an always-on
      // button that does nothing when clicked would just be confusing.
      const moreAction = config.more_action || { action: "none" };
      if ((moreAction.action || "none") !== "none") {
        const moreBtn = document.createElement("button");
        moreBtn.type = "button";
        moreBtn.className = "timeline-btn";
        moreBtn.textContent = strings.timelineMore || "More";
        moreBtn.addEventListener("click", (ev) => {
          ev.stopPropagation();
          this._handleRowAction(moreAction, this._actionEntityId(nextGroup[0]));
        });
        footer.appendChild(moreBtn);
      }
      wrap.appendChild(footer);

      // The full chronological list, same sentence text as the tooltips,
      // each prefixed with that event's own icon in its type color - plus,
      // same as the list layout's own row icon, small VIP/Important badges
      // overlaid top-right/top-left. Unlike the list layout's badges these
      // have no round background - bare glyphs in the same color the
      // timeline axis dots use, consistent with how this whole layout
      // treats VIP/Important everywhere else.
      const listEl = document.createElement("div");
      listEl.className = "timeline-list";
      events.forEach((e) => {
        const item = document.createElement("div");
        item.className = "timeline-list-item";

        const iconWrap = document.createElement("div");
        iconWrap.className = "timeline-list-icon-wrap";
        const icon = document.createElement("ha-icon");
        icon.setAttribute("icon", e.icon);
        icon.style.color = timelineDotColor(config, e.type, this._calendarColors?.[e.calendarEntityId]);
        // Same wrap-for-animation reasoning as the header icon above.
        const listAnimClass = this._timelineAnimClass(e, config);
        if (listAnimClass) {
          const animWrap = document.createElement("span");
          animWrap.className = `timeline-icon-anim-wrap ${listAnimClass}`;
          animWrap.appendChild(icon);
          iconWrap.appendChild(animWrap);
        } else {
          iconWrap.appendChild(icon);
        }

        const badges = this._timelineBadges(e, config, "list");
        if (badges.important) {
          const excl = document.createElement("ha-icon");
          excl.className = "timeline-list-badge timeline-list-badge-important";
          excl.setAttribute("icon", badges.important.icon);
          excl.style.color = `var(${badges.important.colorVar}, ${badges.important.fallback})`;
          iconWrap.appendChild(excl);
        }
        if (badges.vip) {
          const star = document.createElement("ha-icon");
          star.className = "timeline-list-badge timeline-list-badge-vip";
          star.setAttribute("icon", badges.vip.icon);
          star.style.color = `var(${badges.vip.colorVar}, ${badges.vip.fallback})`;
          iconWrap.appendChild(star);
        }

        const text = document.createElement("span");
        text.appendChild(this._timelineSentenceFragment(e, strings, config));
        item.append(iconWrap, text);
        listEl.appendChild(item);
        this._alignTimelineIconToText(icon, text);
      });
      wrap.appendChild(listEl);

      // Expanded state lives on the instance, not in this DOM: _render()
      // rebuilds the whole card on every Home Assistant state update, so a
      // per-render local would silently collapse the list under the user.
      const applyExpanded = () => {
        const open = this._timelineExpanded === true;
        listEl.hidden = !open;
        expandBtn.classList.toggle("is-open", open);
        expandLabel.textContent = open
          ? strings.timelineCollapse || "Less"
          : strings.timelineExpand || "All events";
        expandBtn.setAttribute("aria-expanded", open ? "true" : "false");
      };
      expandBtn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        this._timelineExpanded = this._timelineExpanded !== true;
        applyExpanded();
      });
      applyExpanded();

      return wrap;
    }

    // Starts the external-events poll timer (see EXTERNAL_EVENTS_POLL_MS)
    // for as long as this card instance is actually on a dashboard -
    // paired with disconnectedCallback below so navigating away (or the
    // card being removed/replaced) doesn't leave an orphaned timer running
    // forever in the background.
    connectedCallback() {
      if (this._externalPollTimer) return;
      this._externalPollTimer = window.setInterval(() => {
        if (this._hass) this._fetchExternalEvents();
      }, EXTERNAL_EVENTS_POLL_MS);
    }

    // Cleans up the one document-level click listener _buildTimeline adds
    // (see above) and the external-events poll timer from connectedCallback
    // once this card is removed from a dashboard - otherwise both would
    // linger forever, since nothing else ever removes them.
    disconnectedCallback() {
      if (this._timelineOutsideClickHandler) {
        document.removeEventListener("click", this._timelineOutsideClickHandler);
        this._timelineOutsideClickHandler = null;
      }
      if (this._externalPollTimer) {
        window.clearInterval(this._externalPollTimer);
        this._externalPollTimer = undefined;
      }
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
      const iconVisible = (config.icon_visibility || {})[colorCategory] !== false;
      const matchClass = config.colors[`match_${colorCategory}`] ? ` match-${colorCategory}-text` : "";
      div.className =
        "row" + (highlightClass ? ` ${highlightClass}` : "") + matchClass + (iconVisible ? "" : " icon-hidden");
      // An external calendar event's own typeLabel (its source calendar's
      // name - see buildExternalEvent) always wins over the generic
      // strings.types.calendar fallback, the same way its name already
      // reads more usefully than a plain "Calendar event" label would once
      // more than one calendar is embedded.
      // "External calendars" group's "Calendar name" toggle - only ever
      // gates an external event's own typeLabel (the embedded calendar's
      // name), never Annuals' own type labels.
      let typeLabel = e.isExternal && config.show_type_calendar_name === false ? "" : e.typeLabel || strings.types[e.type] || e.type;
      // Holidays share one generic "Holiday" type label otherwise, which
      // doesn't distinguish a public holiday from a school break - the
      // category (already driving the row's icon - see CATEGORY_ICONS in
      // const.py) is appended so it's visible as text too.
      if (e.type === "holiday" && e.category) {
        typeLabel = `${typeLabel} (${(strings.categories || {})[e.category] || e.category})`;
      }
      // Country (+ subdivision), useful once more than one country/region is
      // imported at once - opt-in per show_name_country/show_type_country
      // (see the "Show country/subdivision" sub-options under Name/Type
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
      // Short calendar date ("3 Aug") for the same occurrence "when" already
      // describes as a countdown - derived the same way, purely from the
      // day-offset attributes (e.days / e.daysSince), so it always agrees
      // with whatever the countdown column says. "Today" instead of the
      // literal date once it's actually today, same as the countdown does.
      let dateText;
      if (e.days === 0) {
        dateText = strings.today;
      } else {
        const target = new Date();
        target.setHours(0, 0, 0, 0);
        target.setDate(target.getDate() + (isRecent && e.daysSince > 0 ? -e.daysSince : e.days));
        dateText = new Intl.DateTimeFormat(this._hass.language || "en", {
          day: "numeric",
          month: "short",
        }).format(target);
      }
      // occurrence_number always describes the *next* occurrence - once an
      // event's date has passed (daysSince > 0), the sensor has already
      // advanced to next year's count, so the occurrence that just happened
      // is occurrence_number - 1.
      const showBadge = config.show_badge !== false && e.occurrence != null;
      const badgeValue = isRecent && e.daysSince > 0 ? e.occurrence - 1 : e.occurrence;
      const badgeClass = config.colors.badge_background === false ? "badge no-background" : "badge";

      const nameText = countrySuffix && config.show_name_country ? `${e.name} · ${countrySuffix}` : e.name;
      const fullNameSuffixedText =
        countrySuffix && config.show_full_name_country ? `${e.fullName} · ${countrySuffix}` : e.fullName;

      // Time/location/description only ever come from an external calendar
      // event (see buildExternalEvent) - empty string for every Annuals
      // event, same as e.g. last_name already is for a holiday. An all-day
      // external event has no time of day to show either. A single time
      // (no dash) when there's no end time, or the end equals the start.
      let timeText = "";
      if (e.isExternal && !e.allDay && e.startTime) {
        const timeFmt = new Intl.DateTimeFormat(this._hass.language || "en", {
          hour: "2-digit",
          minute: "2-digit",
        });
        const startStr = timeFmt.format(e.startTime);
        const endStr = e.endTime ? timeFmt.format(e.endTime) : "";
        timeText = endStr && endStr !== startStr ? `${startStr}–${endStr}` : startStr;
      }
      const locationText = e.location || "";
      const descriptionText = e.description || "";

      // Settings -> Display -> Row columns: "Time"/"Location"/"Description"
      // sub-options under the Type field (alongside its existing "Holiday
      // suffix" toggle) - append into the same Type cell, joined the same
      // " · " way the Timeline layout's own trailing parenthetical joins
      // whichever of its own Show time/location/description toggles are on
      // (see _timelineSentenceFragment). Only ever non-empty for an
      // external calendar event, same as the values.time/location/
      // description fields above - a no-op for every Annuals event,
      // including a one-time event, which carries none of the three.
      const typeExtras = [];
      if (countrySuffix && config.show_type_country) typeExtras.push(countrySuffix);
      if (config.show_type_time && timeText) typeExtras.push(timeText);
      if (config.show_type_location && locationText) typeExtras.push(locationText);
      if (config.show_type_description && descriptionText) typeExtras.push(descriptionText);
      // typeLabel can be "" when show_type_calendar_name is off - in that
      // case the extras stand on their own instead of leading with a
      // dangling " · ".
      const typeText = typeExtras.length
        ? typeLabel
          ? `${typeLabel} · ${typeExtras.join(" · ")}`
          : typeExtras.join(" · ")
        : typeLabel;

      // Shared value set for "text" column templates ({name}/{last_name}/
      // {full_name}/{type}/{occurrence}/{when}/{date}/{country}/{time}/
      // {location}/{description}) - reuses everything already computed
      // above instead of recomputing per column. last_name/full_name are
      // simply empty/first-name-only for holiday events and any event
      // added before the field existed - see getEvents() above and
      // sensor.py; time/location/description are empty for every non-
      // external event the same way.
      const values = {
        name: e.name,
        last_name: e.lastName,
        full_name: e.fullName,
        type: typeLabel,
        occurrence: badgeValue != null ? String(badgeValue) : "",
        when,
        date: dateText,
        country: countrySuffix,
        time: timeText,
        location: locationText,
        description: descriptionText,
      };

      // config.columns is only ever set once a user has actually opened the
      // "Row columns" editor and reordered/added/removed something (see
      // _buildDisplayBody) - every dashboard that never touched it renders
      // via the same DEFAULT_COLUMNS the editor already shows as its
      // starting point, so what you see in the editor is what actually
      // renders, both before and after the first structural edit.
      const columns = Array.isArray(config.columns) ? config.columns : DEFAULT_COLUMNS;
      const ctx = {
        iconClass,
        iconAnimClass,
        iconVisible,
        nameText,
        typeText,
        lastNameText: e.lastName,
        fullNameText: fullNameSuffixedText,
        showBadge,
        badgeValue,
        badgeClass,
        // Only the "Today"/"Heute" case of the Date column is a word whose
        // case should follow its position in the row, same as Countdown - a
        // real formatted date like "Aug 3" starts with the month name and
        // must always stay capitalized regardless of position.
        dateIsToday: e.days === 0,
      };
      // Countdown ("when") reads as the sentence's opening word ("In 2
      // days, Anna has her birthday") only until the event's identity has
      // actually been named - once a name/type/info column has
      // appeared, any later countdown is a trailing remark instead
      // ("Anna's birthday is today") and gets lower-cased instead. Custom
      // text columns don't count either way - they're just connective
      // words, not the event's identity.
      let identityShown = false;
      for (const col of columns) {
        // Guards against a malformed/empty entry (e.g. a stray "-" left in
        // the raw YAML editor) crashing the whole card instead of just
        // skipping that one column.
        if (!col || typeof col !== "object") continue;
        div.appendChild(this._buildColumnCell(col, e, values, config, ctx, !identityShown));
        if (
          col.type === "name" ||
          col.type === "type" ||
          col.type === "info" ||
          col.type === "last_name" ||
          col.type === "full_name" ||
          col.type === "full_name_type"
        )
          identityShown = true;
      }

      this._wireRowActions(div, config, this._actionEntityId(e));
      return div;
    }

    // An external calendar event's own "entityId" (see buildExternalEvent)
    // is a synthetic `${calendarEntityId}:${uid}` composite used internally
    // to keep every event row unique for sorting/rendering - it was never a
    // real registered entity, so pointing a row action (more-info, toggle,
    // ...) at it always fails ("This entity is unavailable"). Row actions on
    // an external event should target the real calendar.* entity behind it
    // instead; an Annuals-native event's entityId is already a real entity
    // and passes through unchanged.
    _actionEntityId(e) {
      return e && e.isExternal ? e.calendarEntityId : e && e.entityId;
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
    // theming keep applying unchanged; "name"/"type" split the "info"
    // block apart for layouts that reorder them independently; "text" is
    // the new free-form template column.
    _buildColumnCell(col, e, values, config, ctx, whenLeading) {
      const {
        iconClass,
        iconAnimClass,
        iconVisible,
        nameText,
        typeText,
        lastNameText,
        fullNameText,
        showBadge,
        badgeValue,
        badgeClass,
      } = ctx;
      switch (col.type) {
        case "icon": {
          const wrap = document.createElement("div");
          wrap.className = "icon-wrap";
          if (!iconVisible) wrap.style.display = "none";
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
        case "full_name_type": {
          const info = document.createElement("div");
          info.className = "info";
          const fullName = document.createElement("div");
          fullName.className = "full-name";
          fullName.textContent = fullNameText;
          const type = document.createElement("div");
          type.className = "type";
          type.textContent = typeText;
          info.append(fullName, type);
          return info;
        }
        case "name": {
          const name = document.createElement("div");
          name.className = "name";
          name.textContent = nameText;
          return name;
        }
        case "type": {
          const type = document.createElement("div");
          type.className = "type";
          type.textContent = typeText;
          return type;
        }
        case "last_name": {
          const lastName = document.createElement("div");
          lastName.className = "last-name";
          lastName.textContent = lastNameText;
          return lastName;
        }
        case "full_name": {
          const fullName = document.createElement("div");
          fullName.className = "full-name";
          fullName.textContent = fullNameText;
          return fullName;
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
        case "date": {
          // Shares the Custom text column's styling (.text-col) rather than
          // getting its own Colors/Fonts tab entry - it's the same kind of
          // short, secondary text. On the day itself this reads "Today" -
          // same word as the Countdown column's own today case - so it
          // gets the same leading/trailing case treatment there. Any other
          // day this is a real formatted date (e.g. "Aug 3" - the month
          // name leads in several locales), which must always stay
          // capitalized regardless of position in the row.
          const dateEl = document.createElement("div");
          dateEl.className = "text-col";
          const dateText = values.date || "";
          dateEl.textContent =
            ctx.dateIsToday && !whenLeading
              ? dateText.charAt(0).toLowerCase() + dateText.slice(1)
              : dateText.charAt(0).toUpperCase() + dateText.slice(1);
          return dateEl;
        }
        // Time/location/description share the Custom text column's styling
        // (.text-col) same as Date above, and are simply empty for any
        // non-external event (see _row's values.time/location/description) -
        // rendering an empty div rather than hiding the column entirely,
        // consistent with every other column type here.
        case "time": {
          const timeEl = document.createElement("div");
          timeEl.className = "text-col";
          timeEl.textContent = values.time || "";
          return timeEl;
        }
        case "location": {
          const locationEl = document.createElement("div");
          locationEl.className = "text-col";
          locationEl.textContent = values.location || "";
          return locationEl;
        }
        case "description": {
          const descriptionEl = document.createElement("div");
          descriptionEl.className = "text-col";
          descriptionEl.textContent = values.description || "";
          return descriptionEl;
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
      if (config.colors.name) card.style.setProperty("--annuals-name-color", config.colors.name);
      if (config.colors.type)
        card.style.setProperty("--annuals-type-color", config.colors.type);
      if (config.colors.last_name)
        card.style.setProperty("--annuals-last-name-color", config.colors.last_name);
      if (config.colors.full_name)
        card.style.setProperty("--annuals-full-name-color", config.colors.full_name);
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
      if (config.colors.vip_badge_timeline)
        card.style.setProperty("--annuals-vip-badge-timeline-color", config.colors.vip_badge_timeline);
      if (config.colors.important_badge_timeline)
        card.style.setProperty(
          "--annuals-important-badge-timeline-color",
          config.colors.important_badge_timeline
        );
      if (config.colors.timeline_header)
        card.style.setProperty("--annuals-timeline-header-color", config.colors.timeline_header);
      if (config.colors.timeline_tooltip)
        card.style.setProperty("--annuals-timeline-tooltip-color", config.colors.timeline_tooltip);
      if (config.colors.timeline_list)
        card.style.setProperty("--annuals-timeline-list-color", config.colors.timeline_list);
      if (config.colors.timeline_button)
        card.style.setProperty("--annuals-timeline-button-color", config.colors.timeline_button);
      if (config.colors.timeline_line)
        card.style.setProperty("--annuals-timeline-line-color", config.colors.timeline_line);
      if (config.timeline_line_width)
        card.style.setProperty("--annuals-timeline-line-width", config.timeline_line_width);
      if (config.timeline_line_style)
        card.style.setProperty("--annuals-timeline-line-style", config.timeline_line_style);
      if (config.colors.timeline_divider)
        card.style.setProperty("--annuals-timeline-divider-color", config.colors.timeline_divider);
      if (config.timeline_divider_width)
        card.style.setProperty("--annuals-timeline-divider-width", config.timeline_divider_width);
      if (config.timeline_divider_style)
        card.style.setProperty("--annuals-timeline-divider-style", config.timeline_divider_style);
      if (config.font_sizes.timeline_header)
        card.style.setProperty("--annuals-timeline-header-size", config.font_sizes.timeline_header);
      if (config.font_sizes.timeline_tooltip)
        card.style.setProperty("--annuals-timeline-tooltip-size", config.font_sizes.timeline_tooltip);
      if (config.font_sizes.timeline_list)
        card.style.setProperty("--annuals-timeline-list-size", config.font_sizes.timeline_list);
      if (config.font_sizes.timeline_button)
        card.style.setProperty("--annuals-timeline-button-size", config.font_sizes.timeline_button);
      if (config.font_sizes.name)
        card.style.setProperty("--annuals-row-name-size", config.font_sizes.name);
      if (config.font_sizes.type)
        card.style.setProperty("--annuals-row-type-size", config.font_sizes.type);
      if (config.font_sizes.last_name)
        card.style.setProperty("--annuals-row-last-name-size", config.font_sizes.last_name);
      if (config.font_sizes.full_name)
        card.style.setProperty("--annuals-row-full-name-size", config.font_sizes.full_name);
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
      setFontStyle("row-name", config.font_style.name);
      setFontStyle("row-type", config.font_style.type);
      setFontStyle("row-last-name", config.font_style.last_name);
      setFontStyle("row-full-name", config.font_style.full_name);
      setFontStyle("row-badge", config.font_style.badge);
      setFontStyle("row-when", config.font_style.when);
      setFontStyle("row-text", config.font_style.text);
      setFontStyle("timeline-header", config.font_style.timeline_header);
      setFontStyle("timeline-tooltip", config.font_style.timeline_tooltip);
      setFontStyle("timeline-list", config.font_style.timeline_list);
      setFontStyle("timeline-button", config.font_style.timeline_button);

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
      } else if (config.layout_style === "timeline") {
        listEl.appendChild(this._buildTimeline(combined, strings));
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
      groups: ["display", "fonts", "colors", "icons", "background", "timeline"],
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
    { key: "timeline", icon: "mdi:chart-timeline-variant" },
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
    .column-suffix-groups {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin: 6px 0 0 68px;
    }
    .column-suffix-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding-left: 10px;
      border-left: 2px solid var(--divider-color, rgba(127, 127, 127, 0.3));
    }
    .column-suffix-group-header {
      font-size: 0.72em;
      font-weight: 600;
      letter-spacing: 0.03em;
      text-transform: uppercase;
      opacity: 0.55;
    }
    .column-suffix-toggle {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.8em;
      white-space: nowrap;
      opacity: 0.85;
    }
    .column-suffix-toggle .tooltip-anchor ha-icon {
      --mdc-icon-size: 14px;
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
       current or future field in this column, not just today's fields.
       :not(:only-child) excludes a .field-row-split that only ever holds a
       single column (e.g. the "More" button action selector) - that lone
       column spans the row's full width starting at the LEFT edge, so
       right-aligning it would flip the overflow to the opposite (left)
       side instead of fixing it. */
    .field-row-split .field-col:last-child:not(:only-child) .tooltip-anchor::after { left: auto; right: 0; }
    /* A flex item's children never collapse their margins with anything
       outside it (flex establishes a new block-formatting context), so the
       last row's own margin-bottom would sit *in addition to*
       .field-row-split's margin-bottom below - stacking to 32px instead of
       collapsing down to 16px the way two plain block siblings would.
       Zeroing it here leaves only the container's own margin, matching the
       single-row .toggle-row case exactly. */
    .field-row-split .toggle-row:last-child { margin-bottom: 0; }
    .field-row-split .field-row:last-child { margin-bottom: 0; }
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
    /* The Icons tab's per-category "show icon" toggle - inline at the end of
       that category's own heading line (field-label already spans the full
       row width) rather than a separate row below its color/animation
       controls. */
    .field-label-toggle { margin-left: auto; }
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

    // set hass() re-runs every _sync*Inputs() function below on every
    // Home Assistant state update - not just ones relevant to this card -
    // to keep the editor's fields current if the config changed from
    // outside it (e.g. the raw YAML editor). Every one of those functions
    // must skip overwriting whichever field the user is actively typing
    // in, or a busy instance turns every keystroke into "type a character,
    // watch it get reverted." The obvious-looking check for that,
    // `document.activeElement === el`, does NOT work here: this element is
    // nested inside the editor's own shadow root, and focus inside a
    // shadow tree "retargets" at the document level to the shadow host
    // (this custom element itself), never to the actual focused
    // descendant. `shadowRoot.activeElement` is the one that reflects
    // focus correctly inside a shadow tree - always use this helper
    // instead of comparing against document.activeElement directly,
    // including for any future field added to this editor.
    _hasFocus(el) {
      return !!el && this.shadowRoot.activeElement === el;
    }

    _syncFieldRow(key, value) {
      const input = this.shadowRoot.querySelector(`input[data-field="${key}"]`);
      if (!input || this._hasFocus(input)) return;
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

    // Same .field-col/.field-label/.action-selector-slot markup as
    // _actionSelectorSplitHtml above, just one full-width field instead of
    // a pair side by side - used for the external-calendars entity picker
    // (see _upgradeEntitySelector), which has nothing to sit next to.
    _actionSelectorFieldHtml(key) {
      return `
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

    // Native multi-entity picker (ha-selector's "entity" selector with
    // multiple: true and a domain filter) for external_calendars - same
    // already-loaded ha-selector component _upgradeActionSelector above
    // relies on, reused here with a different selector shape/config key.
    // Synced and read back through the very same _syncActionSelector/
    // this._actionSelectors bookkeeping as the action selectors, since both
    // just need "assign hass, diff-and-set value" on every render.
    // Annuals' own calendar.annuals_* entities would be nonsensical to embed
    // as an "external" calendar (their events already appear via the
    // Annuals-native pipeline), so they're dropped from the picker's
    // suggestion list entirely. A calendar the user already added does NOT
    // belong in this list too, despite also having "nothing left to offer a
    // second time" - ha-selector's own multi-entity picker already omits
    // whatever is in its current value from its suggestions on its own, and
    // unlike that built-in omission, exclude_entities here turns out to
    // ALSO affect how an already-selected chip renders (it showed as
    // "Unknown entity selected" for a perfectly valid, still-selected
    // calendar during live testing) - so including already-added entities
    // here actively breaks the picker rather than just being redundant.
    _calendarExcludeEntities() {
      return Object.keys(this._hass.states || {}).filter((id) => id.startsWith("calendar.annuals_"));
    }

    _upgradeEntitySelector(body, key, label, desc, domain) {
      const col = body.querySelector(`[data-action-slot="${key}"]`).closest(".field-col");
      col.querySelector(".label-text").textContent = label;
      col.querySelector(".tooltip-anchor").dataset.tooltip = desc;
      const slot = col.querySelector(`[data-action-slot="${key}"]`);
      if (!customElements.get("ha-selector")) return;
      const selector = document.createElement("ha-selector");
      selector.hass = this._hass;
      // exclude_entities is a sibling of filter on ha-selector's entity
      // config, not nested inside it - nesting it under filter (an earlier
      // version of this) silently does nothing, since ha-selector's own
      // EntityFilter type has no such key and just ignores it.
      const excludeEntities = key === "external_calendars" ? this._calendarExcludeEntities() : undefined;
      selector.selector = { entity: { multiple: true, filter: { domain }, exclude_entities: excludeEntities } };
      selector.value = Array.isArray(this._config[key]) ? this._config[key] : [];
      selector.style.display = "block";
      selector.style.width = "100%";
      selector.addEventListener("value-changed", (ev) => {
        ev.stopPropagation();
        this._config = defaultConfig({ ...this._config, [key]: ev.detail.value || [] });
        this._emit();
      });
      slot.appendChild(selector);
      this._actionSelectors = this._actionSelectors || {};
      this._actionSelectors[key] = selector;
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

      const calendarsHeading = document.createElement("div");
      calendarsHeading.className = "section-heading";
      calendarsHeading.textContent = strings.editor.externalCalendarsHeading;
      body.appendChild(calendarsHeading);
      const calendarsDesc = document.createElement("div");
      calendarsDesc.className = "columns-desc";
      calendarsDesc.textContent = strings.editor.externalCalendarsDesc;
      body.appendChild(calendarsDesc);
      const calendarsRow = document.createElement("div");
      calendarsRow.innerHTML = this._actionSelectorFieldHtml("external_calendars");
      body.appendChild(calendarsRow);
      this._upgradeEntitySelector(
        body,
        "external_calendars",
        strings.editor.externalCalendarsLabel,
        strings.editor.externalCalendarsLabelDesc,
        "calendar"
      );

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
      this._syncActionSelector("external_calendars", this._config.external_calendars || []);
      const calendarSelector = this._actionSelectors && this._actionSelectors.external_calendars;
      if (calendarSelector) {
        const excludeEntities = this._calendarExcludeEntities();
        if (JSON.stringify(calendarSelector.selector?.entity?.exclude_entities) !== JSON.stringify(excludeEntities)) {
          calendarSelector.selector = { entity: { multiple: true, filter: { domain: "calendar" }, exclude_entities: excludeEntities } };
        }
      }
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
        timeline: [strings.editor.groupTimeline, strings.editor.groupTimelineDesc],
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
      // Sits inline in the heading line itself (field-label is the row's
      // full-width first line, label text + "i" tooltip) rather than as its
      // own row below the color/animation controls, and is pushed to the
      // line's right end via margin-left:auto - see EDITOR_STYLE.
      const iconToggle = options.iconToggle
        ? `
          <label class="toggle field-label-toggle">
            <input type="checkbox" data-icon-visible="${key}">
            <span class="track"></span>
          </label>
        `
        : "";
      return `
        <div class="field-row${options.sub ? " sub-field-row" : ""}">
          <div class="field-label">
            <span class="label-text"></span>
            <span class="tooltip-anchor" data-tooltip="">
              <ha-icon icon="mdi:information-outline"></ha-icon>
            </span>
            ${iconToggle}
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
        const toggle = this.shadowRoot.querySelector(`input[data-icon-visible="${key}"]`);
        if (toggle) toggle.checked = this._config.icon_visibility[key] !== false;
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
      if (!this._hasFocus(textInput)) textInput.value = value;
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
        name: "var(--primary-text-color)",
        last_name: "var(--primary-text-color)",
        full_name: "var(--primary-text-color)",
        type: "var(--primary-text-color)",
        badge: "var(--primary-text-color)",
        badge_background_color: "rgba(128, 128, 128, 0.25)",
        when: "var(--primary-text-color)",
        text: "var(--primary-text-color)",
        timeline_header: "var(--primary-text-color)",
        timeline_tooltip: "var(--primary-text-color)",
        timeline_list: "var(--primary-text-color)",
        timeline_button: "var(--secondary-text-color)",
      };
      for (const key of EVENT_TYPE_KEYS) {
        fallbacks[`type_${key}`] = TIMELINE_TYPE_COLORS[key];
      }
      for (const key of [
        "accent",
        "today",
        "soon",
        "card_title",
        "name",
        "last_name",
        "full_name",
        "type",
        "badge",
        "badge_background_color",
        "when",
        "text",
        "timeline_header",
        "timeline_tooltip",
        "timeline_list",
        "timeline_button",
        ...EVENT_TYPE_KEYS.map((key) => `type_${key}`),
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
      if (imageInput && !this._hasFocus(imageInput)) imageInput.value = bg.image || "";

      const preview = this.shadowRoot.querySelector("[data-bg-card-preview]");
      if (preview) {
        preview.hidden = !bg.image;
        if (bg.image) preview.querySelector("img").src = bg.image;
      }

      const sizeSelect = this.shadowRoot.querySelector("select[data-bg-card-size]");
      if (sizeSelect) sizeSelect.value = bg.size || "cover";

      const opacityInput = this.shadowRoot.querySelector("input[data-bg-card-opacity]");
      if (opacityInput && !this._hasFocus(opacityInput)) opacityInput.value = bg.opacity ?? 100;
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
        this._colorRowHtml("name", strings.editor.colorPlaceholder) +
        this._colorRowHtml("last_name", strings.editor.colorPlaceholder) +
        this._colorRowHtml("full_name", strings.editor.colorPlaceholder) +
        this._colorRowHtml("type", strings.editor.colorPlaceholder) +
        this._colorRowHtml("badge", strings.editor.colorPlaceholder, { bgToggle: true }) +
        this._colorRowHtml("badge_background_color", strings.editor.colorPlaceholder, { sub: true }) +
        this._colorRowHtml("when", strings.editor.colorPlaceholder) +
        this._colorRowHtml("text", strings.editor.colorPlaceholder) +
        // Timeline layout only - see _applyLayoutStyleVisibility, which
        // hides these three whenever layout_style isn't "timeline".
        this._colorRowHtml("timeline_header", strings.editor.colorPlaceholder) +
        this._colorRowHtml("timeline_tooltip", strings.editor.colorPlaceholder) +
        this._colorRowHtml("timeline_list", strings.editor.colorPlaceholder) +
        this._colorRowHtml("timeline_button", strings.editor.colorPlaceholder) +
        // Timeline layout only, same as the four rows above - one row per
        // event type (see EVENT_TYPE_KEYS/TIMELINE_TYPE_COLORS), each in the
        // exact same field-row style as Header/Tooltip/etc above so it reads
        // as one continuous list rather than a visually distinct grid.
        `<div class="section-heading" data-heading="event_types"></div>` +
        EVENT_TYPE_KEYS.map((key) => this._colorRowHtml(`type_${key}`, strings.editor.colorPlaceholder)).join("");
      body.appendChild(labelRows);

      this._paintPresetSwatches(body, strings);

      const labels = {
        card_title: [strings.editor.fontCardTitle, strings.editor.cardTitleColorDesc],
        name: [strings.editor.colorName, strings.editor.colorNameDesc],
        last_name: [strings.editor.colorLastName, strings.editor.colorLastNameDesc],
        full_name: [strings.editor.colorFullName, strings.editor.colorFullNameDesc],
        type: [strings.editor.colorType, strings.editor.colorTypeDesc],
        badge: [strings.editor.colorBadge, strings.editor.colorBadgeDesc],
        badge_background_color: [
          strings.editor.colorBadgeBackground,
          strings.editor.colorBadgeBackgroundDesc,
        ],
        when: [strings.editor.colorWhen, strings.editor.colorWhenDesc],
        text: [strings.editor.colorText, strings.editor.colorTextDesc],
        timeline_header: [strings.editor.timelineHeaderLabel, strings.editor.timelineHeaderColorDesc],
        timeline_tooltip: [strings.editor.timelineTooltipLabel, strings.editor.timelineTooltipColorDesc],
        timeline_list: [strings.editor.timelineListLabel, strings.editor.timelineListColorDesc],
        timeline_button: [strings.editor.timelineButtonLabel, strings.editor.timelineButtonColorDesc],
      };
      for (const key of [
        "card_title",
        "name",
        "last_name",
        "full_name",
        "type",
        "badge",
        "badge_background_color",
        "when",
        "text",
        "timeline_header",
        "timeline_tooltip",
        "timeline_list",
        "timeline_button",
      ]) {
        const [label, desc] = labels[key];
        this._wireColorRow(body, key, label, desc);
      }

      const eventTypesHeading = body.querySelector('[data-heading="event_types"]');
      if (eventTypesHeading) eventTypesHeading.textContent = strings.editor.eventTypesHeading;
      for (const key of EVENT_TYPE_KEYS) {
        this._wireColorRow(body, `type_${key}`, strings.typesPlural[key] || strings.types[key] || key, strings.editor.eventTypeColorDesc);
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
        this._colorRowHtml("accent", strings.editor.colorPlaceholder, { iconToggle: true }) +
        this._animSelectRowHtml("accent") +
        this._colorRowHtml("today", strings.editor.colorPlaceholder, { iconToggle: true }) +
        this._animSelectRowHtml("today") +
        this._colorRowHtml("soon", strings.editor.colorPlaceholder, { iconToggle: true }) +
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
        this._wireIconVisibilityToggle(body, key, strings);
      }

      if (!this._presetOutsideClickWired) {
        this._presetOutsideClickWired = true;
        this.addEventListener("click", () => this._closeAllPresetMenus());
      }

      return body;
    }

    // Per-category "show icon" toggle (see icon_visibility in defaultConfig)
    // - lives inline in that category's own field-label (see _colorRowHtml's
    // iconToggle option), so it's wired separately from the color/preset
    // inputs _wireColorRow already handles for the same row. Title comes
    // from the tooltip alone (the row already has its own visible label,
    // e.g. "Today") rather than duplicating the field-label's text.
    _wireIconVisibilityToggle(body, key, strings) {
      const toggle = body.querySelector(`input[data-icon-visible="${key}"]`);
      if (!toggle) return;
      toggle.closest("label").title = strings.editor.iconVisibleLabel || "Show icon";
      toggle.checked = this._config.icon_visibility[key] !== false;
      toggle.addEventListener("change", () => {
        this._config = defaultConfig({
          ...this._config,
          icon_visibility: { ...this._config.icon_visibility, [key]: toggle.checked },
        });
        this._emit();
      });
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
      // #fff, not --error-color like the List field above - the Timeline's
      // VIP star sits directly on top of the dot's own colored circle (see
      // _buildTimeline), so it defaults to white for contrast rather than
      // red; the swatch preview needs to match that real fallback or it
      // shows a color the star never actually renders in when unset.
      this._syncColorSwatch("vip_badge_timeline", config.colors.vip_badge_timeline || "", "#fff");
      this._syncColorSwatch(
        "important_badge_timeline",
        config.colors.important_badge_timeline || "",
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
        full_name_type: strings.editor.columnTypeFullNameType || "Full name + type",
        name: strings.editor.columnTypeName || "Name",
        last_name: strings.editor.columnTypeLastName || "Last name",
        full_name: strings.editor.columnTypeFullName || "Full name",
        type: strings.editor.columnTypeType || "Type",
        badge: strings.editor.colorBadge,
        when: strings.editor.colorWhen,
        date: strings.editor.columnTypeDate || "Date",
        time: strings.editor.columnTypeTime || "Time",
        location: strings.editor.columnTypeLocation || "Location",
        description: strings.editor.columnTypeDescription || "Description",
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
        "Add, remove, and reorder what each row shows. Custom text columns can mix free text with placeholders: {name}, {last_name}, {full_name}, {type}, {occurrence}, {when}, {date}, {country}, {time}, {location}, {description}.";
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
          <option value="full_name_type"></option>
          <option value="name"></option>
          <option value="last_name"></option>
          <option value="full_name"></option>
          <option value="type"></option>
          <option value="badge"></option>
          <option value="when"></option>
          <option value="date"></option>
          <option value="time"></option>
          <option value="location"></option>
          <option value="description"></option>
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
        const columns = this._currentColumns();
        // Plain type name (matches DEFAULT_COLUMNS' own ids) unless one
        // already exists - only then append the lowest free "-2", "-3", ...
        // suffix, so the common case of adding one of something reads
        // cleanly in the YAML instead of a random id no one would recognize.
        const existingIds = new Set(columns.map((c) => c.id));
        let id = type;
        for (let n = 2; existingIds.has(id); n++) id = `${type}-${n}`;
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
        // Flipping this toggle immediately swaps the whole column
        // arrangement - Compact's own Icon/Full name/Occurrence/Type/
        // Countdown/Date (with its space columns) turning on, or back to
        // the plain Icon/Full name + type/Occurrence/Countdown default
        // turning off - rather than just changing spacing/weight under
        // whatever columns happened to be configured already. Either
        // arrangement stays fully user-customizable afterward, same as any
        // other time the columns list gets touched.
        const columns = compactToggle.checked
          ? COMPACT_DEFAULT_COLUMNS.map((c) => ({ ...c }))
          : undefined;
        this._config = defaultConfig({
          ...this._config,
          columns_compact: compactToggle.checked,
          columns,
        });
        this._emit();
        this._renderColumnsList();
      });
      section.appendChild(compactRow);

      this._renderColumnsList(strings);
      return section;
    }

    // Expands a column's suffixable fields (e.g. "info" -> name+type) into
    // one toggle entry per checkbox actually rendered - the "type" field
    // alone gets 4 (Holiday suffix/Time/Location/Description) since Full
    // name+type/Name+type/bare Type are the only columns where the user
    // asked for Time/Location/Description sub-options; name/full_name keep
    // their single Holiday-suffix toggle as before.
    _suffixToggleEntries(col) {
      const fieldKeys =
        col.type === "info"
          ? ["name", "type"]
          : col.type === "full_name_type"
            ? ["full_name", "type"]
            : col.type === "name"
              ? ["name"]
              : col.type === "full_name"
                ? ["full_name"]
                : col.type === "type"
                  ? ["type"]
                  : [];
      const entries = [];
      fieldKeys.forEach((key) => {
        const configKey =
          key === "name" ? "show_name_country" : key === "full_name" ? "show_full_name_country" : "show_type_country";
        // "Holidays only" - only ever has an effect on an imported holiday
        // event, regardless of which field it's attached to.
        entries.push({ toggleKey: key, configKey, fieldKey: key, kind: "country", group: "holiday" });
        if (key === "type") {
          // "External calendars" - only ever has an effect on an embedded
          // external calendar's own event, never on any Annuals event.
          entries.push({
            toggleKey: "type_calendar_name",
            configKey: "show_type_calendar_name",
            fieldKey: key,
            kind: "calendar_name",
            group: "external",
          });
          entries.push({
            toggleKey: "type_time",
            configKey: "show_type_time",
            fieldKey: key,
            kind: "time",
            group: "external",
          });
          entries.push({
            toggleKey: "type_location",
            configKey: "show_type_location",
            fieldKey: key,
            kind: "location",
            group: "external",
          });
          entries.push({
            toggleKey: "type_description",
            configKey: "show_type_description",
            fieldKey: key,
            kind: "description",
            group: "external",
          });
        }
      });
      return { entries, multiField: fieldKeys.length > 1 };
    }

    // Time/Location/Description/Calendar name toggles only ever apply to the
    // "type" field, so unlike the country-suffix toggle they never need a
    // "(Type)"-style disambiguation suffix on their label.
    _suffixToggleLabel(entry, multiField, strings) {
      if (entry.kind === "calendar_name") return strings.editor.suffixShowCalendarName || "Calendar name";
      if (entry.kind === "time") return strings.editor.columnTypeTime || "Time";
      if (entry.kind === "location") return strings.editor.columnTypeLocation || "Location";
      if (entry.kind === "description") return strings.editor.columnTypeDescription || "Description";
      // Just "Suffix", not "Holiday suffix" - the group is now already
      // titled "Holidays only" (see _suffixGroupHtml), so repeating
      // "Holiday" on every toggle inside it would be redundant.
      return multiField
        ? `${strings.editor.suffixLabel || "Suffix"} (${
            entry.fieldKey === "name"
              ? strings.editor.columnTypeName || "Name"
              : entry.fieldKey === "full_name"
                ? strings.editor.columnTypeFullName || "Full name"
                : strings.editor.columnTypeSubtitle || "Type"
          })`
        : strings.editor.suffixLabel || "Suffix";
    }

    // Per-toggle "i" tooltip text - both groups' toggles get one now (the
    // "Holidays only" group reuses visibilityCountrySuffixDesc, which
    // already carries a concrete example like "Independence Day · US (UT)").
    _suffixToggleDesc(entry, strings) {
      if (entry.kind === "country") {
        return (
          strings.editor.visibilityCountrySuffixDesc ||
          "Append the country (and subdivision, if any) after the holiday's name/type, e.g. “Independence Day · US (UT)”"
        );
      }
      if (entry.kind === "calendar_name") {
        return (
          strings.editor.suffixShowCalendarNameDesc ||
          "Show the external calendar's own name (e.g. \"Personal\") here. Turn off once Time/Location/Description below already say enough on their own."
        );
      }
      if (entry.kind === "time") {
        return (
          strings.editor.columnTypeTimeDesc ||
          "Append the external calendar event's own time range, e.g. \"...03:00 PM–05:00 PM\". Only ever shown for a timed (non all-day) external calendar event."
        );
      }
      if (entry.kind === "location") {
        return (
          strings.editor.columnTypeLocationDesc ||
          "Append the external calendar event's own location. Only ever shown for an external calendar event that has one set."
        );
      }
      if (entry.kind === "description") {
        return (
          strings.editor.columnTypeDescriptionDesc ||
          "Append the external calendar event's own description. Only ever shown for an external calendar event that has one set."
        );
      }
      return "";
    }

    // Shared by the initial render (_columnRowHtml) and both
    // _renderColumnsList refresh paths - sets the two group headers' titles
    // plus every toggle's checked state/label/tooltip, and (only when a
    // fresh row was just built, never on the label-only refresh path) wires
    // up each checkbox's change listener.
    _syncSuffixToggles(row, col, strings, attachListeners) {
      const { entries: suffixEntries, multiField } = this._suffixToggleEntries(col);
      const holidayTitle = row.querySelector('[data-suffix-group="holiday"] .suffix-group-title');
      if (holidayTitle) holidayTitle.textContent = strings.editor.suffixGroupHolidayTitle || "Holidays only";
      const externalTitle = row.querySelector('[data-suffix-group="external"] .suffix-group-title');
      if (externalTitle) externalTitle.textContent = strings.editor.suffixGroupExternalTitle || "External calendars";
      suffixEntries.forEach((entry) => {
        const cb = row.querySelector(`[data-col-suffix="${entry.toggleKey}"]`);
        if (!cb) return;
        cb.checked = this._config[entry.configKey] === true;
        const wrap = cb.closest(".column-suffix-toggle");
        wrap.querySelector(".suffix-label").textContent = this._suffixToggleLabel(entry, multiField, strings);
        const tooltip = wrap.querySelector(".tooltip-anchor");
        if (tooltip) tooltip.dataset.tooltip = this._suffixToggleDesc(entry, strings);
        if (attachListeners) {
          cb.addEventListener("change", () => {
            this._config = defaultConfig({ ...this._config, [entry.configKey]: cb.checked });
            this._emit();
          });
        }
      });
    }

    // One <group> block (a header + its own toggles) - every toggle in
    // both groups now gets its own "i" tooltip-anchor.
    _suffixGroupHtml(entries, groupKey) {
      if (!entries.length) return "";
      return `
        <div class="column-suffix-group" data-suffix-group="${groupKey}">
          <div class="column-suffix-group-header">
            <span class="suffix-group-title"></span>
          </div>
          ${entries
            .map(
              (entry) => `
                <div class="column-suffix-toggle">
                  <label class="toggle">
                    <input type="checkbox" data-col-suffix="${entry.toggleKey}">
                    <span class="track"></span>
                  </label>
                  <span class="suffix-label"></span>
                  <span class="tooltip-anchor" data-tooltip="">
                    <ha-icon icon="mdi:information-outline"></ha-icon>
                  </span>
                </div>
              `
            )
            .join("")}
        </div>
      `;
    }

    _columnRowHtml(col, index, strings) {
      const isText = col.type === "text";
      const { entries: suffixEntries } = this._suffixToggleEntries(col);
      const holidayEntries = suffixEntries.filter((e) => e.group === "holiday");
      const externalEntries = suffixEntries.filter((e) => e.group === "external");
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
            suffixEntries.length
              ? `
                <div class="column-suffix-groups">
                  ${this._suffixGroupHtml(holidayEntries, "holiday")}
                  ${this._suffixGroupHtml(externalEntries, "external")}
                </div>
              `
              : ""
          }
        </div>
      `;
    }

    // Column identity+order, used to tell a genuine add/remove/reorder
    // apart from "nothing structural changed" below - a plain string so two
    // signatures can be compared with ===.
    _columnsSignature(columns) {
      return JSON.stringify(columns.map((c) => [c.id, c.type]));
    }

    _renderColumnsList(strings) {
      strings = strings || t(this._hass);
      if (!this._columnsListEl) return;
      const columns = this._currentColumns();
      const signature = this._columnsSignature(columns);

      // set hass() (see below) re-runs this on every Home Assistant state
      // update, not just ones relevant to this card - on a busy instance
      // that can be many times a second. Rebuilding the row markup via
      // innerHTML every time destroyed and recreated the "Custom text"
      // <input> out from under the user mid-keystroke, so typing a template
      // meant re-clicking into the field after every character (worse the
      // busier the instance, which is also why it never showed up on a
      // near-idle test instance). When the columns themselves haven't
      // changed, only refresh what legitimately can without a structural
      // edit (translated labels, a template/toggle edited via the raw YAML
      // editor) and leave the existing DOM - and whichever field the user
      // has focused - alone instead.
      if (signature === this._columnsListSignature && this._columnsListEl.children.length === columns.length) {
        columns.forEach((col, index) => {
          const row = this._columnsListEl.querySelector(`[data-col-index="${index}"]`);
          if (!row) return;
          row.querySelector(".column-type-label").textContent = this._columnTypeLabel(col.type, strings);

          if (col.type === "text") {
            const templateInput = row.querySelector("[data-col-template]");
            templateInput.placeholder =
              strings.editor.columnTemplatePlaceholder || "e.g. {name} turns {occurrence} today";
            if (!this._hasFocus(templateInput)) {
              templateInput.value = col.template || "";
            }
          }

          this._syncSuffixToggles(row, col, strings, false);
        });
        return;
      }

      this._columnsListSignature = signature;
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

        this._syncSuffixToggles(row, col, strings, true);
      });
    }

    _buildDisplayBody(strings) {
      const body = document.createElement("div");
      body.className = "display-body";

      const layoutWrap = document.createElement("div");
      layoutWrap.innerHTML = `
        <div class="field-row">
          <div class="field-label">
            <span class="label-text"></span>
            <span class="tooltip-anchor" data-tooltip="">
              <ha-icon icon="mdi:information-outline"></ha-icon>
            </span>
          </div>
          <div class="field-input-row">
            <select data-layout-style>
              <option value="list"></option>
              <option value="timeline"></option>
            </select>
          </div>
        </div>
      `;
      const layoutRow = layoutWrap.firstElementChild;
      layoutRow.querySelector(".label-text").textContent = strings.editor.layoutStyleLabel;
      layoutRow.querySelector(".tooltip-anchor").dataset.tooltip = strings.editor.layoutStyleDesc;
      const layoutSelect = layoutRow.querySelector("select[data-layout-style]");
      layoutSelect.querySelector('option[value="list"]').textContent = strings.editor.layoutStyleList;
      layoutSelect.querySelector('option[value="timeline"]').textContent = strings.editor.layoutStyleTimeline;
      layoutSelect.value = this._config.layout_style || "list";
      layoutSelect.addEventListener("change", () => {
        this._config = defaultConfig({ ...this._config, layout_style: layoutSelect.value });
        this._emit();
      });
      body.appendChild(layoutRow);

      const visHeading = document.createElement("div");
      visHeading.className = "section-heading";
      visHeading.textContent = strings.editor.visibilityHeading;
      body.appendChild(visHeading);

      const visRows = document.createElement("div");
      // Which events appear at all (past/today/soon | VIP/Important
      // filters). The card's own title lives in Settings -> General now
      // (right under the title text field, as "Hide"), and which fields
      // appear per row - and in what order - is the "Spalten" section
      // below instead of a fixed icon/name/type/badge/when grid.
      visRows.innerHTML = this._visibilityTwoColHtml(["past", "today", "soon"], ["vip_only", "important_only"]);
      body.appendChild(visRows);

      // Row columns only apply to the classic list layout - the timeline
      // layout has its own fixed header+axis shape, so this section would
      // just be dead configuration with nothing to affect. Always built
      // (rather than conditionally, the way this used to work) so
      // _applyLayoutStyleVisibility can just hide/show it like every other
      // layout-specific field, instead of this body needing its own special
      // case for it.
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
        this._colorRowHtml("vip_badge_timeline", strings.editor.colorPlaceholder, { sub: true }) +
        this._highlightRowHtml("important") +
        this._fieldRowHtml(
          "important_badge_icon",
          "text",
          strings.editor.importantBadgeIconPlaceholder,
          "",
          true
        ) +
        this._colorRowHtml("important_badge", strings.editor.colorPlaceholder, { sub: true }) +
        this._colorRowHtml("important_badge_timeline", strings.editor.colorPlaceholder, { sub: true });
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
      this._wireColorRow(
        body,
        "vip_badge",
        strings.editor.vipBadgeColorList,
        strings.editor.vipBadgeColorListDesc,
        "colors"
      );
      this._wireColorRow(
        body,
        "vip_badge_timeline",
        strings.editor.vipBadgeColorTimeline,
        strings.editor.vipBadgeColorTimelineDesc,
        "colors"
      );

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
        strings.editor.importantBadgeColorList,
        strings.editor.importantBadgeColorListDesc,
        "colors"
      );
      this._wireColorRow(
        body,
        "important_badge_timeline",
        strings.editor.importantBadgeColorTimeline,
        strings.editor.importantBadgeColorTimelineDesc,
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
        { key: "name", value: config.font_sizes.name, style: config.font_style.name },
        { key: "last_name", value: config.font_sizes.last_name, style: config.font_style.last_name },
        { key: "full_name", value: config.font_sizes.full_name, style: config.font_style.full_name },
        { key: "type", value: config.font_sizes.type, style: config.font_style.type },
        { key: "badge", value: config.font_sizes.badge, style: config.font_style.badge },
        { key: "when", value: config.font_sizes.when, style: config.font_style.when },
        { key: "text", value: config.font_sizes.text, style: config.font_style.text },
        { key: "timeline_header", value: config.font_sizes.timeline_header, style: config.font_style.timeline_header },
        { key: "timeline_tooltip", value: config.font_sizes.timeline_tooltip, style: config.font_style.timeline_tooltip },
        { key: "timeline_list", value: config.font_sizes.timeline_list, style: config.font_style.timeline_list },
        { key: "timeline_button", value: config.font_sizes.timeline_button, style: config.font_style.timeline_button },
      ];
      for (const { key, value, style } of rows) {
        const input = this.shadowRoot.querySelector(`input[data-font="${key}"]`);
        const boldToggle = this.shadowRoot.querySelector(`input[data-bold="${key}"]`);
        const italicToggle = this.shadowRoot.querySelector(`input[data-italic="${key}"]`);
        const uppercaseToggle = this.shadowRoot.querySelector(`input[data-uppercase="${key}"]`);
        const underlineToggle = this.shadowRoot.querySelector(`input[data-underline="${key}"]`);
        const letterInput = this.shadowRoot.querySelector(`input[data-letterspacing="${key}"]`);
        if (!input) continue;
        if (!this._hasFocus(input)) input.value = value || "";
        boldToggle.checked = style.bold === true;
        italicToggle.checked = style.italic === true;
        uppercaseToggle.checked = style.uppercase === true;
        underlineToggle.checked = style.underline === true;
        if (!this._hasFocus(letterInput)) letterInput.value = style.letter_spacing || "";
      }
    }

    _buildFontsBody(strings) {
      const body = document.createElement("div");
      body.className = "fonts-body";

      const rows = document.createElement("div");
      rows.innerHTML =
        this._fontRowHtml("font_size_title", strings.editor.fontPlaceholder, strings.editor.fontLetterSpacingPlaceholder) +
        this._fontRowHtml("name", strings.editor.fontPlaceholder, strings.editor.fontLetterSpacingPlaceholder) +
        this._fontRowHtml("last_name", strings.editor.fontPlaceholder, strings.editor.fontLetterSpacingPlaceholder) +
        this._fontRowHtml("full_name", strings.editor.fontPlaceholder, strings.editor.fontLetterSpacingPlaceholder) +
        this._fontRowHtml("type", strings.editor.fontPlaceholder, strings.editor.fontLetterSpacingPlaceholder) +
        this._fontRowHtml("badge", strings.editor.fontPlaceholder, strings.editor.fontLetterSpacingPlaceholder) +
        this._fontRowHtml("when", strings.editor.fontPlaceholder, strings.editor.fontLetterSpacingPlaceholder) +
        this._fontRowHtml("text", strings.editor.fontPlaceholder, strings.editor.fontLetterSpacingPlaceholder) +
        // Timeline layout only - see _applyLayoutStyleVisibility, which
        // hides these three whenever layout_style isn't "timeline".
        this._fontRowHtml("timeline_header", strings.editor.fontPlaceholder, strings.editor.fontLetterSpacingPlaceholder) +
        this._fontRowHtml("timeline_tooltip", strings.editor.fontPlaceholder, strings.editor.fontLetterSpacingPlaceholder) +
        this._fontRowHtml("timeline_list", strings.editor.fontPlaceholder, strings.editor.fontLetterSpacingPlaceholder) +
        this._fontRowHtml("timeline_button", strings.editor.fontPlaceholder, strings.editor.fontLetterSpacingPlaceholder);
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
        name: [strings.editor.colorName, strings.editor.fontNameDesc],
        last_name: [strings.editor.colorLastName, strings.editor.fontLastNameDesc],
        full_name: [strings.editor.colorFullName, strings.editor.fontFullNameDesc],
        type: [strings.editor.colorType, strings.editor.fontTypeDesc],
        badge: [strings.editor.colorBadge, strings.editor.fontBadgeDesc],
        when: [strings.editor.colorWhen, strings.editor.fontWhenDesc],
        text: [strings.editor.colorText, strings.editor.fontTextDesc],
        timeline_header: [strings.editor.timelineHeaderLabel, strings.editor.timelineHeaderFontDesc],
        timeline_tooltip: [strings.editor.timelineTooltipLabel, strings.editor.timelineTooltipFontDesc],
        timeline_list: [strings.editor.timelineListLabel, strings.editor.timelineListFontDesc],
        timeline_button: [strings.editor.timelineButtonLabel, strings.editor.timelineButtonFontDesc],
      };
      for (const key of [
        "font_size_title",
        "name",
        "last_name",
        "full_name",
        "type",
        "badge",
        "when",
        "text",
        "timeline_header",
        "timeline_tooltip",
        "timeline_list",
        "timeline_button",
      ]) {
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

    // Timeline layout only: the footer's "More" button action. The header
    // sentence/tooltip/expandable-list font and color settings that used to
    // live here moved into the Fonts/Colors tabs instead (see
    // _buildFontsBody/_buildColorsBody) - same rows, same wiring, just
    // appended there and hidden by _applyLayoutStyleVisibility unless
    // layout_style is "timeline", so they sit next to every other font/color
    // control instead of duplicating that tab elsewhere.
    // One width input + line-style <select> + color row, shared by the axis
    // line and the past/future divider below - same three knobs for both,
    // just against different config keys.
    _lineStyleRowsHtml(widthKey, colorKey) {
      return (
        `
        <div class="field-row">
          <div class="field-label">
            <span class="label-text"></span>
            <span class="tooltip-anchor" data-tooltip="">
              <ha-icon icon="mdi:information-outline"></ha-icon>
            </span>
          </div>
          <div class="field-input-row">
            <input type="text" data-field="${widthKey}" placeholder="e.g. 4px">
          </div>
        </div>
        <div class="field-row sub-field-row">
          <div class="field-label">
            <span class="label-text"></span>
          </div>
          <div class="field-input-row">
            <select data-line-style="${widthKey}">
              <option value="solid"></option>
              <option value="dashed"></option>
              <option value="dotted"></option>
            </select>
          </div>
        </div>
      ` + this._colorRowHtml(colorKey, "e.g. #cccccc or var(--divider-color)", { sub: true })
      );
    }

    // widthKey doubles as the line-style <select>'s own key (see
    // _lineStyleRowsHtml) since each line only has one style select, but the
    // actual config key it reads/writes is styleKey - kept separate from
    // widthKey since "solid"/"dashed"/"dotted" is a wholly different config
    // field from the CSS-length width string.
    _wireLineStyleRows(body, widthKey, styleKey, colorKey, labels) {
      const strings = t(this._hass);
      this._wireFieldRow(body, widthKey, labels.width, labels.widthDesc, (v) => v);

      const select = body.querySelector(`select[data-line-style="${widthKey}"]`);
      const row = select.closest(".sub-field-row");
      row.querySelector(".label-text").textContent = labels.style;
      const optionLabels = {
        solid: strings.editor.lineStyleSolid || "Solid",
        dashed: strings.editor.lineStyleDashed || "Dashed",
        dotted: strings.editor.lineStyleDotted || "Dotted",
      };
      Array.from(select.options).forEach((opt) => {
        opt.textContent = optionLabels[opt.value] || opt.value;
      });
      select.value = this._config[styleKey] || "solid";
      select.addEventListener("change", () => {
        this._config = defaultConfig({ ...this._config, [styleKey]: select.value });
        this._emit();
      });

      this._wireColorRow(body, colorKey, labels.color, labels.colorDesc, "colors");
    }

    _buildTimelineBody(strings) {
      const body = document.createElement("div");
      body.className = "timeline-config-body";

      const headerHeading = document.createElement("div");
      headerHeading.className = "section-heading";
      headerHeading.textContent = strings.editor.timelineHeaderLabel;
      body.appendChild(headerHeading);
      const headerCountWrap = document.createElement("div");
      headerCountWrap.innerHTML = `
        <div class="field-row-split">
          <div class="field-col">
            ${this._fieldRowHtml("timeline_header_max_events", "number", "", 'min="0" max="50"')}
          </div>
          <div class="field-col">
            ${this._fieldRowHtml("timeline_header_min_events", "number", "", 'min="0" max="50"')}
          </div>
        </div>
      `;
      body.appendChild(headerCountWrap);
      this._wireFieldRow(
        headerCountWrap,
        "timeline_header_max_events",
        strings.editor.timelineHeaderMaxEvents,
        strings.editor.timelineHeaderMaxEventsDesc,
        (v) => (v === "" ? "" : parseInt(v, 10))
      );
      this._wireFieldRow(
        headerCountWrap,
        "timeline_header_min_events",
        strings.editor.timelineHeaderMinEvents,
        strings.editor.timelineHeaderMinEventsDesc,
        (v) => (v === "" ? "" : parseInt(v, 10))
      );

      const lineHeading = document.createElement("div");
      lineHeading.className = "section-heading";
      lineHeading.textContent = strings.editor.timelineLineHeading;
      body.appendChild(lineHeading);
      const lineRows = document.createElement("div");
      lineRows.innerHTML = this._lineStyleRowsHtml("timeline_line_width", "timeline_line");
      body.appendChild(lineRows);
      this._wireLineStyleRows(body, "timeline_line_width", "timeline_line_style", "timeline_line", {
        width: strings.editor.timelineLineWidth,
        widthDesc: strings.editor.timelineLineWidthDesc,
        style: strings.editor.lineStyleLabel,
        color: strings.editor.timelineLineColor,
        colorDesc: strings.editor.timelineLineColorDesc,
      });

      const dividerHeading = document.createElement("div");
      dividerHeading.className = "section-heading";
      dividerHeading.textContent = strings.editor.timelineDividerHeading;
      body.appendChild(dividerHeading);
      const dividerRows = document.createElement("div");
      dividerRows.innerHTML = this._lineStyleRowsHtml("timeline_divider_width", "timeline_divider");
      body.appendChild(dividerRows);
      this._wireLineStyleRows(body, "timeline_divider_width", "timeline_divider_style", "timeline_divider", {
        width: strings.editor.timelineDividerWidth,
        widthDesc: strings.editor.timelineDividerWidthDesc,
        style: strings.editor.lineStyleLabel,
        color: strings.editor.timelineDividerColor,
        colorDesc: strings.editor.timelineDividerColorDesc,
      });

      this._paintPresetSwatches(body, strings);

      const optionsHeading = document.createElement("div");
      optionsHeading.className = "section-heading";
      optionsHeading.textContent = strings.editor.timelineOptionsHeading;
      body.appendChild(optionsHeading);
      const optionsRows = document.createElement("div");
      optionsRows.innerHTML = this._visibilityTwoColHtml(
        ["timeline_show_full_name", "timeline_show_date", "timeline_show_time"],
        ["show_holiday_suffix", "timeline_show_location", "timeline_show_description"]
      );
      body.appendChild(optionsRows);
      const fullNameToggle = optionsRows.querySelector('input[data-visibility="timeline_show_full_name"]');
      const fullNameRow = fullNameToggle.closest(".toggle-row");
      fullNameRow.querySelector(".label-text").textContent = strings.editor.timelineShowFullName;
      fullNameRow.querySelector(".tooltip-anchor").dataset.tooltip = strings.editor.timelineShowFullNameDesc;
      fullNameToggle.addEventListener("change", () => {
        this._config = defaultConfig({ ...this._config, timeline_show_full_name: fullNameToggle.checked });
        this._emit();
      });
      const suffixToggle = optionsRows.querySelector('input[data-visibility="show_holiday_suffix"]');
      const suffixRow = suffixToggle.closest(".toggle-row");
      suffixRow.querySelector(".label-text").textContent = strings.editor.showHolidaySuffix;
      suffixRow.querySelector(".tooltip-anchor").dataset.tooltip = strings.editor.showHolidaySuffixDesc;
      suffixToggle.addEventListener("change", () => {
        this._config = defaultConfig({ ...this._config, show_holiday_suffix: suffixToggle.checked });
        this._emit();
      });
      const dateToggle = optionsRows.querySelector('input[data-visibility="timeline_show_date"]');
      const dateRow = dateToggle.closest(".toggle-row");
      dateRow.querySelector(".label-text").textContent = strings.editor.timelineShowDate;
      dateRow.querySelector(".tooltip-anchor").dataset.tooltip = strings.editor.timelineShowDateDesc;
      dateToggle.addEventListener("change", () => {
        this._config = defaultConfig({ ...this._config, timeline_show_date: dateToggle.checked });
        this._emit();
      });
      const timeToggle = optionsRows.querySelector('input[data-visibility="timeline_show_time"]');
      const timeRow = timeToggle.closest(".toggle-row");
      timeRow.querySelector(".label-text").textContent = strings.editor.timelineShowTime;
      timeRow.querySelector(".tooltip-anchor").dataset.tooltip = strings.editor.timelineShowTimeDesc;
      timeToggle.addEventListener("change", () => {
        this._config = defaultConfig({ ...this._config, timeline_show_time: timeToggle.checked });
        this._emit();
      });
      const locationToggle = optionsRows.querySelector('input[data-visibility="timeline_show_location"]');
      const locationRow = locationToggle.closest(".toggle-row");
      locationRow.querySelector(".label-text").textContent = strings.editor.timelineShowLocation;
      locationRow.querySelector(".tooltip-anchor").dataset.tooltip = strings.editor.timelineShowLocationDesc;
      locationToggle.addEventListener("change", () => {
        this._config = defaultConfig({ ...this._config, timeline_show_location: locationToggle.checked });
        this._emit();
      });
      const descriptionToggle = optionsRows.querySelector('input[data-visibility="timeline_show_description"]');
      const descriptionRow = descriptionToggle.closest(".toggle-row");
      descriptionRow.querySelector(".label-text").textContent = strings.editor.timelineShowDescription;
      descriptionRow.querySelector(".tooltip-anchor").dataset.tooltip = strings.editor.timelineShowDescriptionDesc;
      descriptionToggle.addEventListener("change", () => {
        this._config = defaultConfig({ ...this._config, timeline_show_description: descriptionToggle.checked });
        this._emit();
      });

      const moreWrap = document.createElement("div");
      moreWrap.innerHTML = this._actionSelectorSplitHtml(["more_action"]);
      body.appendChild(moreWrap);
      this._upgradeActionSelector(
        moreWrap,
        "more_action",
        strings.editor.moreAction,
        strings.editor.moreActionDesc,
        { action: "none" }
      );

      if (!this._presetOutsideClickWired) {
        this._presetOutsideClickWired = true;
        this.addEventListener("click", () => this._closeAllPresetMenus());
      }

      return body;
    }

    _syncTimelineInputs() {
      const fullNameToggle = this.shadowRoot.querySelector('input[data-visibility="timeline_show_full_name"]');
      if (fullNameToggle) fullNameToggle.checked = this._config.timeline_show_full_name === true;
      this._syncActionSelector("more_action", this._config.more_action || { action: "none" });
      this._syncFieldRow("timeline_line_width", this._config.timeline_line_width);
      const lineStyleSelect = this.shadowRoot.querySelector('select[data-line-style="timeline_line_width"]');
      if (lineStyleSelect) lineStyleSelect.value = this._config.timeline_line_style || "solid";
      this._syncColorSwatch("timeline_line", this._config.colors.timeline_line || "", "var(--divider-color)");

      this._syncFieldRow("timeline_divider_width", this._config.timeline_divider_width);
      const dividerStyleSelect = this.shadowRoot.querySelector(
        'select[data-line-style="timeline_divider_width"]'
      );
      if (dividerStyleSelect) dividerStyleSelect.value = this._config.timeline_divider_style || "solid";
      this._syncColorSwatch("timeline_divider", this._config.colors.timeline_divider || "", "var(--divider-color)");

      const suffixToggle = this.shadowRoot.querySelector('input[data-visibility="show_holiday_suffix"]');
      if (suffixToggle) suffixToggle.checked = this._config.show_holiday_suffix === true;
      const dateToggle = this.shadowRoot.querySelector('input[data-visibility="timeline_show_date"]');
      if (dateToggle) dateToggle.checked = this._config.timeline_show_date === true;
      const timeToggle = this.shadowRoot.querySelector('input[data-visibility="timeline_show_time"]');
      if (timeToggle) timeToggle.checked = this._config.timeline_show_time === true;
      const locationToggle = this.shadowRoot.querySelector('input[data-visibility="timeline_show_location"]');
      if (locationToggle) locationToggle.checked = this._config.timeline_show_location === true;
      const descriptionToggle = this.shadowRoot.querySelector(
        'input[data-visibility="timeline_show_description"]'
      );
      if (descriptionToggle) descriptionToggle.checked = this._config.timeline_show_description === true;
      this._syncFieldRow("timeline_header_max_events", this._config.timeline_header_max_events);
      this._syncFieldRow("timeline_header_min_events", this._config.timeline_header_min_events);
    }

    // Hides whichever of this card's Layout fields the *current* layout
    // style doesn't read, instead of leaving them visible but silently
    // ignored - in both directions: list-only fields disappear in timeline
    // mode, and the timeline-only fields (appended to the end of Fonts/
    // Colors - see _buildFontsBody/_buildColorsBody) disappear in list mode.
    _applyLayoutStyleVisibility() {
      const isTimeline = this._config.layout_style === "timeline";
      const setRowHidden = (input, hidden) => {
        if (!input) return;
        const row = input.closest(".field-row, .toggle-row");
        if (!row) return;
        row.style.display = hidden ? "none" : "";
      };
      const setFontRowHidden = (bodyClass, key, hidden) => {
        const input = this.shadowRoot.querySelector(`.${bodyClass} input[data-font="${key}"]`);
        if (!input) return;
        const row = input.closest(".field-row");
        setRowHidden(input, hidden);
        const sub = row && row.nextElementSibling;
        if (sub && sub.classList.contains("sub-field-row")) sub.style.display = hidden ? "none" : "";
      };

      // Fonts/Colors: everything but the card title (which both layouts
      // share) only applies to the list layout's own row fields.
      for (const key of ["name", "last_name", "full_name", "type", "badge", "when", "text"]) {
        setFontRowHidden("fonts-body", key, isTimeline);
      }
      for (const key of ["name", "last_name", "full_name", "type", "badge", "badge_background_color", "when", "text"]) {
        setRowHidden(this.shadowRoot.querySelector(`.colors-body input[data-color="${key}"]`), isTimeline);
      }

      // The reverse: the timeline's own header/tooltip/expandable-list font
      // and color rows, appended to the end of the same two tabs, only
      // apply once the timeline layout is actually selected.
      for (const key of ["timeline_header", "timeline_tooltip", "timeline_list", "timeline_button"]) {
        setFontRowHidden("fonts-body", key, !isTimeline);
        setRowHidden(this.shadowRoot.querySelector(`.colors-body input[data-color="${key}"]`), !isTimeline);
      }

      // EVENT TYPES section (Colors tab): the per-type dot/icon color only
      // means anything on the timeline axis, so the whole heading plus its
      // one row per event type stays hidden in list mode, same as the four
      // timeline_* rows above.
      const eventTypesHeading = this.shadowRoot.querySelector('.colors-body [data-heading="event_types"]');
      if (eventTypesHeading) eventTypesHeading.style.display = isTimeline ? "" : "none";
      for (const key of EVENT_TYPE_KEYS) {
        setRowHidden(this.shadowRoot.querySelector(`.colors-body input[data-color="type_${key}"]`), !isTimeline);
      }

      // Icons tab: Default/Today/Soon stay visible either way, but their
      // color/preset controls and per-category "show icon" toggle only
      // affect the list layout's own icon - the animation itself is
      // layout-agnostic (applied to the list row's icon in _row(), and to
      // the timeline's own header/list MDI icons in _buildTimeline via
      // _timelineAnimClass), so it stays configurable in both modes.
      for (const key of ["accent", "today", "soon"]) {
        const colorInput = this.shadowRoot.querySelector(`.icons-body input[data-color="${key}"]`);
        if (colorInput) {
          const inputRow = colorInput.closest(".field-row").querySelector(".field-input-row");
          if (inputRow) inputRow.style.display = isTimeline ? "none" : "";
        }
        const iconToggle = this.shadowRoot.querySelector(`.icons-body input[data-icon-visible="${key}"]`);
        if (iconToggle) {
          const toggleLabel = iconToggle.closest("label");
          if (toggleLabel) toggleLabel.style.display = isTimeline ? "none" : "";
        }
        const matchToggle = this.shadowRoot.querySelector(`.icons-body input[data-match="${key}"]`);
        if (matchToggle) {
          const toggleGroup = matchToggle.closest(".toggle-group");
          if (toggleGroup) toggleGroup.style.display = isTimeline ? "none" : "";
        }
      }

      // Display: past/today/soon row-highlighting has no "row" to highlight
      // in the timeline layout.
      for (const key of ["past", "today", "soon"]) {
        const toggle = this.shadowRoot.querySelector(`.display-body input[data-highlight="${key}"]`);
        setRowHidden(toggle, isTimeline);
        const colorInput = this.shadowRoot.querySelector(`.display-body input[data-color="highlight_${key}"]`);
        setRowHidden(colorInput, isTimeline);
      }
      // VIP/Important icon fields apply to both layouts (the list layout's
      // corner badges, the timeline's dot/list glyphs), and so does the List
      // layout's own Badge Color field now - it's always visible regardless
      // of layout_style, same as the icon fields, so it can be configured
      // ahead of switching back to List. Only the Timeline's own Badge Color
      // field (vip_badge_timeline/important_badge_timeline) stays
      // timeline-only, since it has nothing to color while List is active.
      for (const key of ["vip_badge_timeline", "important_badge_timeline"]) {
        setRowHidden(this.shadowRoot.querySelector(`.display-body input[data-color="${key}"]`), !isTimeline);
      }

      // Row columns has nothing to configure in the timeline layout either
      // - it has its own fixed header+axis shape, not a row of columns.
      const columnsSection = this.shadowRoot.querySelector(".columns-section");
      if (columnsSection) columnsSection.style.display = isTimeline ? "none" : "";

      // Settings -> General: tap/hold only drive the list layout's own row
      // click handling - the timeline has no "row" to tap, since its axis
      // dots (click to open a tooltip) and header sentence (no click at all)
      // already have their own fixed behavior.
      const tapSlot = this.shadowRoot.querySelector('[data-action-slot="tap_action"]');
      const tapSplitRow = tapSlot && tapSlot.closest(".field-row-split");
      if (tapSplitRow) tapSplitRow.style.display = isTimeline ? "none" : "";
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
        timeline: this.shadowRoot.querySelector(".timeline-config-body"),
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
      if (key === "timeline") this._syncTimelineInputs();
      // Re-applied after the body-swap above, which unconditionally shows
      // whichever body just became active (including icons-body) - without
      // this, switching to a hidden-when-timeline tab would instantly
      // un-hide it again.
      this._applyLayoutStyleVisibility();
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
        this.shadowRoot.appendChild(this._buildTimelineBody(strings));

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
        this._syncTimelineInputs();
        this._applyLayoutStyleVisibility();
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
      this._syncTimelineInputs();
      this._applyLayoutStyleVisibility();
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
