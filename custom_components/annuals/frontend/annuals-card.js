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
      },
      editor: {
        title: "Card title",
        titleDesc: "Custom title text for the card (leave empty for the default)",
        titlePlaceholder: "e.g. Upcoming Events",
        count: "Number of events",
        countDesc: "The total number of events shown on the card",
        daysAhead: "Days ahead (0 = unlimited)",
        daysAheadDesc: "Only show events happening within this many days (0 = no limit)",
        daysPast: "Days in the past (0 = today only)",
        daysPastDesc: "How many days in the past an event still counts as recent (0 = today only)",
        soonDays: "“Soon” threshold (days)",
        soonDaysDesc: "Events within this many days count as “soon”",
        types: "Event types",
        typesDesc: "Only show the checked event types",
        visibilityHeading: "Show / Hide",
        visibilityPast: "Past events",
        visibilityPastDesc: "Show events whose anniversary already passed within the configured past window",
        visibilityToday: "Today's events",
        visibilityTodayDesc: "Show events happening today",
        visibilitySoon: "Upcoming soon",
        visibilitySoonDesc: "Show events within the “soon” threshold",
        visibilityCardTitleDesc: "Show the card's own title",
        visibilityIcon: "Icon",
        visibilityIconDesc: "Show the type icon in front of each row",
        visibilityTitleDesc: "Show the event name",
        visibilitySubtitleDesc: "Show the event type",
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
        matchTextLabel: "Also color the text",
        matchTextDesc: "Also color the whole row's text with this icon color",
        colorTitle: "Title",
        colorSubtitle: "Subtitle",
        colorBadge: "Occurrence",
        colorWhen: "Countdown",
        colorTitleDesc: "Text color for the event name",
        colorSubtitleDesc: "Text color for the event type",
        colorBadgeDesc: "Text color for the occurrence number badge",
        colorWhenDesc: "Text color for the countdown (e.g. “in 3 days”)",
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
        panelLayoutDesc: "Display, fonts, colors, and backgrounds",
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
      },
      editor: {
        title: "Kartentitel",
        titleDesc: "Eigener Titeltext für die Karte (leer lassen für den Standardtitel)",
        titlePlaceholder: "z. B. Anstehende Ereignisse",
        count: "Anzahl der Ereignisse",
        countDesc: "Legt die Gesamtanzahl der auf der Karte angezeigten Ereignisse fest",
        daysAhead: "Tage im Voraus (0 = unbegrenzt)",
        daysAheadDesc: "Nur Ereignisse innerhalb dieser Anzahl Tage anzeigen (0 = unbegrenzt)",
        daysPast: "Tage in der Vergangenheit (0 = nur heute)",
        daysPastDesc: "Wie viele Tage in der Vergangenheit ein Ereignis noch als aktuell zählt (0 = nur heute)",
        soonDays: "Schwelle für „Bald“ (Tage)",
        soonDaysDesc: "Ereignisse innerhalb dieser Anzahl Tage gelten als „bald“",
        types: "Ereignistypen",
        typesDesc: "Nur die angehakten Ereignistypen anzeigen",
        visibilityHeading: "Ein- und ausblenden",
        visibilityPast: "Vergangene Ereignisse",
        visibilityPastDesc: "Vergangene Ereignisse innerhalb des eingestellten Zeitraums in der Liste anzeigen",
        visibilityToday: "Heutige Ereignisse",
        visibilityTodayDesc: "Heutige Ereignisse in der Liste anzeigen",
        visibilitySoon: "Baldige Ereignisse",
        visibilitySoonDesc: "Ereignisse innerhalb der „Bald“-Schwelle in der Liste anzeigen",
        visibilityCardTitleDesc: "Kartentitel in der Karte anzeigen",
        visibilityIcon: "Icon",
        visibilityIconDesc: "Symbol vor jeder Zeile anzeigen",
        visibilityTitleDesc: "Namen des Ereignisses anzeigen",
        visibilitySubtitleDesc: "Ereignistyp anzeigen",
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
        matchTextLabel: "Auch den Text einfärben",
        matchTextDesc: "Auch den gesamten Zeilentext in dieser Icon-Farbe einfärben",
        colorTitle: "Titel",
        colorSubtitle: "Untertitel",
        colorBadge: "Jubiläum",
        colorWhen: "Countdown",
        colorTitleDesc: "Textfarbe für den Namen des Ereignisses",
        colorSubtitleDesc: "Textfarbe für den Ereignistyp",
        colorBadgeDesc: "Textfarbe für das Jubiläums-Badge (Vorkommen-Nummer)",
        colorWhenDesc: "Textfarbe für die Zeitangabe (z. B. „in 3 Tagen“)",
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
        panelLayoutDesc: "Anzeige, Schriften, Farben und Hintergründe",
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
      },
      editor: {
        title: "Titre de la carte",
        titleDesc: "Texte de titre personnalisé pour la carte (laisser vide pour le titre par défaut)",
        titlePlaceholder: "par ex. Événements à venir",
        count: "Nombre d'événements",
        countDesc: "Le nombre total d'événements affichés sur la carte",
        daysAhead: "Jours à l'avance (0 = illimité)",
        daysAheadDesc: "N'afficher que les événements dans ce nombre de jours (0 = pas de limite)",
        daysPast: "Jours passés (0 = aujourd'hui seulement)",
        daysPastDesc: "Combien de jours passés un événement compte encore comme récent (0 = aujourd'hui seulement)",
        soonDays: "Seuil « bientôt » (jours)",
        soonDaysDesc: "Les événements dans ce nombre de jours comptent comme « bientôt »",
        types: "Types d'événements",
        typesDesc: "N'afficher que les types cochés",
        visibilityHeading: "Afficher / Masquer",
        visibilityPast: "Événements passés",
        visibilityPastDesc: "Afficher les événements dont l'anniversaire est déjà passé dans la période configurée",
        visibilityToday: "Événements du jour",
        visibilityTodayDesc: "Afficher les événements du jour",
        visibilitySoon: "Bientôt",
        visibilitySoonDesc: "Afficher les événements dans le seuil « bientôt »",
        visibilityCardTitleDesc: "Afficher le titre propre de la carte",
        visibilityIcon: "Icône",
        visibilityIconDesc: "Afficher l'icône du type devant chaque ligne",
        visibilityTitleDesc: "Afficher le nom de l'événement",
        visibilitySubtitleDesc: "Afficher le type d'événement",
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
        matchTextLabel: "Colorer aussi le texte",
        matchTextDesc: "Colorer aussi tout le texte de la ligne avec cette couleur d'icône",
        colorTitle: "Titre",
        colorSubtitle: "Sous-titre",
        colorBadge: "Occurrence",
        colorWhen: "Compte à rebours",
        colorTitleDesc: "Couleur du texte pour le nom de l'événement",
        colorSubtitleDesc: "Couleur du texte pour le type d'événement",
        colorBadgeDesc: "Couleur du texte pour le badge du numéro d'occurrence",
        colorWhenDesc: "Couleur du texte pour le compte à rebours (par ex. « dans 3 jours »)",
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
        panelLayoutDesc: "Affichage, polices, couleurs et fonds",
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
      },
      editor: {
        title: "Kaarttitel",
        titleDesc: "Aangepaste titeltekst voor de kaart (leeg laten voor de standaardtitel)",
        titlePlaceholder: "bijv. Aankomende evenementen",
        count: "Aantal evenementen",
        countDesc: "Het totale aantal evenementen dat op de kaart wordt getoond",
        daysAhead: "Dagen vooruit (0 = onbeperkt)",
        daysAheadDesc: "Toon alleen evenementen binnen dit aantal dagen (0 = geen limiet)",
        daysPast: "Dagen in het verleden (0 = alleen vandaag)",
        daysPastDesc: "Hoeveel dagen in het verleden een evenement nog als recent telt (0 = alleen vandaag)",
        soonDays: "„Binnenkort”-drempel (dagen)",
        soonDaysDesc: "Evenementen binnen dit aantal dagen tellen als „binnenkort”",
        types: "Evenementtypes",
        typesDesc: "Toon alleen de aangevinkte evenementtypes",
        visibilityHeading: "Tonen / Verbergen",
        visibilityPast: "Vergane evenementen",
        visibilityPastDesc: "Toon evenementen waarvan de jaardag al is geweest binnen het ingestelde verleden-venster",
        visibilityToday: "Evenementen van vandaag",
        visibilityTodayDesc: "Toon evenementen die vandaag plaatsvinden",
        visibilitySoon: "Binnenkort",
        visibilitySoonDesc: "Toon evenementen binnen de „binnenkort”-drempel",
        visibilityCardTitleDesc: "Toon de eigen titel van de kaart",
        visibilityIcon: "Icoon",
        visibilityIconDesc: "Toon het type-icoon vóór elke rij",
        visibilityTitleDesc: "Toon de naam van het evenement",
        visibilitySubtitleDesc: "Toon het evenementtype",
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
        matchTextLabel: "Ook de tekst inkleuren",
        matchTextDesc: "Ook alle tekst van de rij inkleuren met deze icoonkleur",
        colorTitle: "Titel",
        colorSubtitle: "Ondertitel",
        colorBadge: "Jubileum",
        colorWhen: "Aftellen",
        colorTitleDesc: "Tekstkleur voor de naam van het evenement",
        colorSubtitleDesc: "Tekstkleur voor het evenementtype",
        colorBadgeDesc: "Tekstkleur voor het jubileumnummer-badge",
        colorWhenDesc: "Tekstkleur voor het aftellen (bijv. „over 3 dagen”)",
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
        panelLayoutDesc: "Weergave, lettertypen, kleuren en achtergronden",
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
      },
      editor: {
        title: "Tytuł karty",
        titleDesc: "Własny tekst tytułu karty (pozostaw puste dla domyślnego tytułu)",
        titlePlaceholder: "np. Nadchodzące wydarzenia",
        count: "Liczba wydarzeń",
        countDesc: "Łączna liczba wydarzeń pokazywanych na karcie",
        daysAhead: "Dni naprzód (0 = bez limitu)",
        daysAheadDesc: "Pokazuj tylko wydarzenia w ciągu tylu dni (0 = bez limitu)",
        daysPast: "Dni wstecz (0 = tylko dzisiaj)",
        daysPastDesc: "Ile dni wstecz wydarzenie nadal liczy się jako aktualne (0 = tylko dzisiaj)",
        soonDays: "Próg „wkrótce” (dni)",
        soonDaysDesc: "Wydarzenia w ciągu tylu dni liczą się jako „wkrótce”",
        types: "Typy wydarzeń",
        typesDesc: "Pokazuj tylko zaznaczone typy wydarzeń",
        visibilityHeading: "Pokaż / Ukryj",
        visibilityPast: "Minione wydarzenia",
        visibilityPastDesc: "Pokaż wydarzenia, których rocznica już minęła w skonfigurowanym oknie przeszłości",
        visibilityToday: "Dzisiejsze wydarzenia",
        visibilityTodayDesc: "Pokaż wydarzenia mające miejsce dzisiaj",
        visibilitySoon: "Wkrótce",
        visibilitySoonDesc: "Pokaż wydarzenia w progu „wkrótce”",
        visibilityCardTitleDesc: "Pokaż własny tytuł karty",
        visibilityIcon: "Ikona",
        visibilityIconDesc: "Pokaż ikonę typu przed każdym wierszem",
        visibilityTitleDesc: "Pokaż nazwę wydarzenia",
        visibilitySubtitleDesc: "Pokaż typ wydarzenia",
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
        matchTextLabel: "Zabarw też tekst",
        matchTextDesc: "Zabarw też cały tekst wiersza tym kolorem ikony",
        colorTitle: "Tytuł",
        colorSubtitle: "Podtytuł",
        colorBadge: "Wystąpienie",
        colorWhen: "Odliczanie",
        colorTitleDesc: "Kolor tekstu dla nazwy wydarzenia",
        colorSubtitleDesc: "Kolor tekstu dla typu wydarzenia",
        colorBadgeDesc: "Kolor tekstu dla odznaki numeru wystąpienia",
        colorWhenDesc: "Kolor tekstu dla odliczania (np. „za 3 dni”)",
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
        panelLayoutDesc: "Wyświetlanie, czcionki, kolory i tła",
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
      },
      editor: {
        title: "Título de la tarjeta",
        titleDesc: "Texto de título personalizado para la tarjeta (dejar vacío para el título predeterminado)",
        titlePlaceholder: "p. ej. Próximos eventos",
        count: "Número de eventos",
        countDesc: "El número total de eventos mostrados en la tarjeta",
        daysAhead: "Días de antelación (0 = ilimitado)",
        daysAheadDesc: "Mostrar solo eventos dentro de este número de días (0 = sin límite)",
        daysPast: "Días pasados (0 = solo hoy)",
        daysPastDesc: "Cuántos días en el pasado un evento sigue contando como reciente (0 = solo hoy)",
        soonDays: "Umbral «pronto» (días)",
        soonDaysDesc: "Los eventos dentro de este número de días cuentan como «pronto»",
        types: "Tipos de evento",
        typesDesc: "Mostrar solo los tipos de evento marcados",
        visibilityHeading: "Mostrar / Ocultar",
        visibilityPast: "Eventos pasados",
        visibilityPastDesc: "Mostrar eventos cuyo aniversario ya pasó dentro de la ventana pasada configurada",
        visibilityToday: "Eventos de hoy",
        visibilityTodayDesc: "Mostrar eventos que ocurren hoy",
        visibilitySoon: "Próximamente",
        visibilitySoonDesc: "Mostrar eventos dentro del umbral «pronto»",
        visibilityCardTitleDesc: "Mostrar el título propio de la tarjeta",
        visibilityIcon: "Icono",
        visibilityIconDesc: "Mostrar el icono de tipo delante de cada fila",
        visibilityTitleDesc: "Mostrar el nombre del evento",
        visibilitySubtitleDesc: "Mostrar el tipo de evento",
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
        matchTextLabel: "Colorear también el texto",
        matchTextDesc: "Colorear también todo el texto de la fila con este color de icono",
        colorTitle: "Título",
        colorSubtitle: "Subtítulo",
        colorBadge: "Ocurrencia",
        colorWhen: "Cuenta atrás",
        colorTitleDesc: "Color del texto para el nombre del evento",
        colorSubtitleDesc: "Color del texto para el tipo de evento",
        colorBadgeDesc: "Color del texto para la insignia del número de ocurrencia",
        colorWhenDesc: "Color del texto para la cuenta atrás (p. ej. «en 3 días»)",
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
        panelLayoutDesc: "Visualización, fuentes, colores y fondos",
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
      },
      editor: {
        title: "Titolo della scheda",
        titleDesc: "Testo del titolo personalizzato per la scheda (lasciare vuoto per il titolo predefinito)",
        titlePlaceholder: "ad es. Eventi in arrivo",
        count: "Numero di eventi",
        countDesc: "Il numero totale di eventi mostrati sulla scheda",
        daysAhead: "Giorni in anticipo (0 = illimitato)",
        daysAheadDesc: "Mostra solo eventi entro questo numero di giorni (0 = nessun limite)",
        daysPast: "Giorni passati (0 = solo oggi)",
        daysPastDesc: "Quanti giorni nel passato un evento conta ancora come recente (0 = solo oggi)",
        soonDays: "Soglia «a breve» (giorni)",
        soonDaysDesc: "Gli eventi entro questo numero di giorni contano come «a breve»",
        types: "Tipi di evento",
        typesDesc: "Mostra solo i tipi di evento selezionati",
        visibilityHeading: "Mostra / Nascondi",
        visibilityPast: "Eventi passati",
        visibilityPastDesc: "Mostra eventi il cui anniversario è già trascorso entro la finestra passata configurata",
        visibilityToday: "Eventi di oggi",
        visibilityTodayDesc: "Mostra gli eventi di oggi",
        visibilitySoon: "A breve",
        visibilitySoonDesc: "Mostra eventi entro la soglia «a breve»",
        visibilityCardTitleDesc: "Mostra il titolo proprio della scheda",
        visibilityIcon: "Icona",
        visibilityIconDesc: "Mostra l'icona del tipo davanti a ogni riga",
        visibilityTitleDesc: "Mostra il nome dell'evento",
        visibilitySubtitleDesc: "Mostra il tipo di evento",
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
        matchTextLabel: "Colora anche il testo",
        matchTextDesc: "Colora anche tutto il testo della riga con questo colore dell'icona",
        colorTitle: "Titolo",
        colorSubtitle: "Sottotitolo",
        colorBadge: "Occorrenza",
        colorWhen: "Conto alla rovescia",
        colorTitleDesc: "Colore del testo per il nome dell'evento",
        colorSubtitleDesc: "Colore del testo per il tipo di evento",
        colorBadgeDesc: "Colore del testo per il badge del numero di occorrenza",
        colorWhenDesc: "Colore del testo per il conto alla rovescia (ad es. «tra 3 giorni»)",
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
        panelLayoutDesc: "Visualizzazione, font, colori e sfondi",
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
      },
      editor: {
        title: "Título do cartão",
        titleDesc: "Texto de título personalizado para o cartão (deixe vazio para o título padrão)",
        titlePlaceholder: "por ex. Próximos eventos",
        count: "Número de eventos",
        countDesc: "O número total de eventos mostrados no cartão",
        daysAhead: "Dias à frente (0 = ilimitado)",
        daysAheadDesc: "Mostrar apenas eventos dentro desse número de dias (0 = sem limite)",
        daysPast: "Dias no passado (0 = apenas hoje)",
        daysPastDesc: "Quantos dias no passado um evento ainda conta como recente (0 = apenas hoje)",
        soonDays: "Limite \"em breve\" (dias)",
        soonDaysDesc: "Eventos dentro desse número de dias contam como \"em breve\"",
        types: "Tipos de evento",
        typesDesc: "Mostrar apenas os tipos de evento marcados",
        visibilityHeading: "Mostrar / Ocultar",
        visibilityPast: "Eventos passados",
        visibilityPastDesc: "Mostrar eventos cujo aniversário já passou dentro da janela passada configurada",
        visibilityToday: "Eventos de hoje",
        visibilityTodayDesc: "Mostrar eventos que ocorrem hoje",
        visibilitySoon: "Em breve",
        visibilitySoonDesc: "Mostrar eventos dentro do limite \"em breve\"",
        visibilityCardTitleDesc: "Mostrar o título próprio do cartão",
        visibilityIcon: "Ícone",
        visibilityIconDesc: "Mostrar o ícone do tipo antes de cada linha",
        visibilityTitleDesc: "Mostrar o nome do evento",
        visibilitySubtitleDesc: "Mostrar o tipo de evento",
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
        matchTextLabel: "Colorir também o texto",
        matchTextDesc: "Colorir também todo o texto da linha com esta cor de ícone",
        colorTitle: "Título",
        colorSubtitle: "Subtítulo",
        colorBadge: "Ocorrência",
        colorWhen: "Contagem regressiva",
        colorTitleDesc: "Cor do texto para o nome do evento",
        colorSubtitleDesc: "Cor do texto para o tipo de evento",
        colorBadgeDesc: "Cor do texto para o selo do número de ocorrência",
        colorWhenDesc: "Cor do texto para a contagem regressiva (por ex. \"em 3 dias\")",
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
        panelLayoutDesc: "Exibição, fontes, cores e fundos",
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
      },
      editor: {
        title: "Заголовок карточки",
        titleDesc: "Собственный текст заголовка карточки (оставьте пустым для заголовка по умолчанию)",
        titlePlaceholder: "напр. Ближайшие события",
        count: "Количество событий",
        countDesc: "Общее количество событий, показываемых на карточке",
        daysAhead: "Дней вперёд (0 = без ограничений)",
        daysAheadDesc: "Показывать только события в пределах этого количества дней (0 = без ограничений)",
        daysPast: "Дней в прошлом (0 = только сегодня)",
        daysPastDesc: "Сколько дней в прошлом событие ещё считается недавним (0 = только сегодня)",
        soonDays: "Порог «скоро» (дней)",
        soonDaysDesc: "События в пределах этого количества дней считаются «скоро»",
        types: "Типы событий",
        typesDesc: "Показывать только отмеченные типы событий",
        visibilityHeading: "Показать / Скрыть",
        visibilityPast: "Прошедшие события",
        visibilityPastDesc: "Показывать события, годовщина которых уже прошла в настроенном окне прошлого",
        visibilityToday: "Сегодняшние события",
        visibilityTodayDesc: "Показывать события, происходящие сегодня",
        visibilitySoon: "Скоро",
        visibilitySoonDesc: "Показывать события в пределах порога «скоро»",
        visibilityCardTitleDesc: "Показывать собственный заголовок карточки",
        visibilityIcon: "Значок",
        visibilityIconDesc: "Показывать значок типа перед каждой строкой",
        visibilityTitleDesc: "Показывать имя события",
        visibilitySubtitleDesc: "Показывать тип события",
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
        matchTextLabel: "Также окрашивать текст",
        matchTextDesc: "Также окрашивать весь текст строки в этот цвет значка",
        colorTitle: "Заголовок",
        colorSubtitle: "Подзаголовок",
        colorBadge: "Номер события",
        colorWhen: "Обратный отсчёт",
        colorTitleDesc: "Цвет текста для имени события",
        colorSubtitleDesc: "Цвет текста для типа события",
        colorBadgeDesc: "Цвет текста для значка номера события",
        colorWhenDesc: "Цвет текста для обратного отсчёта (напр. «через 3 дня»)",
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
        panelLayoutDesc: "Отображение, шрифты, цвета и фоны",
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
      },
      editor: {
        title: "Kortets titel",
        titleDesc: "Egen titeltext för kortet (lämna tomt för standardtiteln)",
        titlePlaceholder: "t.ex. Kommande händelser",
        count: "Antal händelser",
        countDesc: "Det totala antalet händelser som visas på kortet",
        daysAhead: "Dagar framåt (0 = obegränsat)",
        daysAheadDesc: "Visa endast händelser inom detta antal dagar (0 = ingen gräns)",
        daysPast: "Dagar bakåt (0 = endast idag)",
        daysPastDesc: "Hur många dagar bakåt en händelse fortfarande räknas som aktuell (0 = endast idag)",
        soonDays: "\"Snart\"-tröskel (dagar)",
        soonDaysDesc: "Händelser inom detta antal dagar räknas som \"snart\"",
        types: "Händelsetyper",
        typesDesc: "Visa endast markerade händelsetyper",
        visibilityHeading: "Visa / Dölj",
        visibilityPast: "Tidigare händelser",
        visibilityPastDesc: "Visa händelser vars årsdag redan passerat inom det inställda tidigare-fönstret",
        visibilityToday: "Dagens händelser",
        visibilityTodayDesc: "Visa händelser som inträffar idag",
        visibilitySoon: "Snart",
        visibilitySoonDesc: "Visa händelser inom \"snart\"-tröskeln",
        visibilityCardTitleDesc: "Visa kortets egen titel",
        visibilityIcon: "Ikon",
        visibilityIconDesc: "Visa typikonen framför varje rad",
        visibilityTitleDesc: "Visa händelsens namn",
        visibilitySubtitleDesc: "Visa händelsetypen",
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
        matchTextLabel: "Färga även texten",
        matchTextDesc: "Färga även hela radens text med denna ikonfärg",
        colorTitle: "Titel",
        colorSubtitle: "Undertitel",
        colorBadge: "Händelsenummer",
        colorWhen: "Nedräkning",
        colorTitleDesc: "Textfärg för händelsens namn",
        colorSubtitleDesc: "Textfärg för händelsetypen",
        colorBadgeDesc: "Textfärg för märket med händelsenumret",
        colorWhenDesc: "Textfärg för nedräkningen (t.ex. \"om 3 dagar\")",
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
        panelLayoutDesc: "Visning, typsnitt, färger och bakgrunder",
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
      },
      editor: {
        title: "卡片标题",
        titleDesc: "卡片的自定义标题文本（留空使用默认标题）",
        titlePlaceholder: "例如：即将到来的事件",
        count: "事件数量",
        countDesc: "卡片上显示的事件总数",
        daysAhead: "提前天数（0 = 不限）",
        daysAheadDesc: "仅显示在此天数内发生的事件（0 = 不限）",
        daysPast: "过去天数（0 = 仅今天）",
        daysPastDesc: "事件在过去多少天内仍算作最近（0 = 仅今天）",
        soonDays: "“即将到来”阈值（天）",
        soonDaysDesc: "在此天数内的事件算作“即将到来”",
        types: "事件类型",
        typesDesc: "仅显示已勾选的事件类型",
        visibilityHeading: "显示 / 隐藏",
        visibilityPast: "过去的事件",
        visibilityPastDesc: "显示在设定的过去时间范围内已经过去的周年纪念事件",
        visibilityToday: "今天的事件",
        visibilityTodayDesc: "显示今天发生的事件",
        visibilitySoon: "即将到来",
        visibilitySoonDesc: "显示在“即将到来”阈值内的事件",
        visibilityCardTitleDesc: "显示卡片自身的标题",
        visibilityIcon: "图标",
        visibilityIconDesc: "在每行前显示类型图标",
        visibilityTitleDesc: "显示事件名称",
        visibilitySubtitleDesc: "显示事件类型",
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
        matchTextLabel: "同时为文本着色",
        matchTextDesc: "同时用此图标颜色为整行文本着色",
        colorTitle: "标题",
        colorSubtitle: "副标题",
        colorBadge: "周年数",
        colorWhen: "倒计时",
        colorTitleDesc: "事件名称的文本颜色",
        colorSubtitleDesc: "事件类型的文本颜色",
        colorBadgeDesc: "周年数徽章的文本颜色",
        colorWhenDesc: "倒计时的文本颜色（例如“3 天后”）",
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
        panelLayoutDesc: "显示、字体、颜色和背景",
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
      },
      editor: {
        title: "Název karty",
        titleDesc: "Vlastní text názvu karty (ponechte prázdné pro výchozí název)",
        titlePlaceholder: "např. Nadcházející události",
        count: "Počet událostí",
        countDesc: "Celkový počet událostí zobrazených na kartě",
        daysAhead: "Dní dopředu (0 = neomezeno)",
        daysAheadDesc: "Zobrazit pouze události v tomto počtu dní (0 = bez omezení)",
        daysPast: "Dní zpět (0 = pouze dnes)",
        daysPastDesc: "Kolik dní zpět se událost stále počítá jako nedávná (0 = pouze dnes)",
        soonDays: "Práh „brzy“ (dny)",
        soonDaysDesc: "Události v tomto počtu dní se počítají jako „brzy“",
        types: "Typy událostí",
        typesDesc: "Zobrazit pouze zaškrtnuté typy událostí",
        visibilityHeading: "Zobrazit / Skrýt",
        visibilityPast: "Minulé události",
        visibilityPastDesc: "Zobrazit události, jejichž výročí již proběhlo v nastaveném minulém okně",
        visibilityToday: "Dnešní události",
        visibilityTodayDesc: "Zobrazit události, které se konají dnes",
        visibilitySoon: "Brzy",
        visibilitySoonDesc: "Zobrazit události v prahu „brzy“",
        visibilityCardTitleDesc: "Zobrazit vlastní název karty",
        visibilityIcon: "Ikona",
        visibilityIconDesc: "Zobrazit ikonu typu před každým řádkem",
        visibilityTitleDesc: "Zobrazit jméno události",
        visibilitySubtitleDesc: "Zobrazit typ události",
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
        matchTextLabel: "Obarvit i text",
        matchTextDesc: "Obarvit touto barvou ikony i celý text řádku",
        colorTitle: "Nadpis",
        colorSubtitle: "Podnadpis",
        colorBadge: "Výročí",
        colorWhen: "Odpočet",
        colorTitleDesc: "Barva textu pro jméno události",
        colorSubtitleDesc: "Barva textu pro typ události",
        colorBadgeDesc: "Barva textu pro odznak čísla výročí",
        colorWhenDesc: "Barva textu pro odpočet (např. „za 3 dny“)",
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
        panelLayoutDesc: "Zobrazení, písma, barvy a pozadí",
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
      },
      editor: {
        title: "Korttittel",
        titleDesc: "Egen titteltekst for kortet (la stå tomt for standardtittelen)",
        titlePlaceholder: "f.eks. Kommende hendelser",
        count: "Antall hendelser",
        countDesc: "Det totale antallet hendelser som vises på kortet",
        daysAhead: "Dager fremover (0 = ubegrenset)",
        daysAheadDesc: "Vis bare hendelser innen dette antallet dager (0 = ingen grense)",
        daysPast: "Dager tilbake (0 = bare i dag)",
        daysPastDesc: "Hvor mange dager tilbake en hendelse fortsatt telles som nylig (0 = bare i dag)",
        soonDays: "«Snart»-terskel (dager)",
        soonDaysDesc: "Hendelser innen dette antallet dager telles som «snart»",
        types: "Hendelsestyper",
        typesDesc: "Vis bare de avkryssede hendelsestypene",
        visibilityHeading: "Vis / Skjul",
        visibilityPast: "Tidligere hendelser",
        visibilityPastDesc: "Vis hendelser hvis jubileum allerede har passert innenfor det konfigurerte tidligere-vinduet",
        visibilityToday: "Dagens hendelser",
        visibilityTodayDesc: "Vis hendelser som skjer i dag",
        visibilitySoon: "Snart",
        visibilitySoonDesc: "Vis hendelser innenfor «snart»-terskelen",
        visibilityCardTitleDesc: "Vis kortets egen tittel",
        visibilityIcon: "Ikon",
        visibilityIconDesc: "Vis typeikonet foran hver rad",
        visibilityTitleDesc: "Vis hendelsens navn",
        visibilitySubtitleDesc: "Vis hendelsestypen",
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
        matchTextLabel: "Fargelegg også teksten",
        matchTextDesc: "Fargelegg også all tekst i raden med denne ikonfargen",
        colorTitle: "Tittel",
        colorSubtitle: "Undertittel",
        colorBadge: "Jubileum",
        colorWhen: "Nedtelling",
        colorTitleDesc: "Tekstfarge for hendelsens navn",
        colorSubtitleDesc: "Tekstfarge for hendelsestypen",
        colorBadgeDesc: "Tekstfarge for merket med jubileumsnummeret",
        colorWhenDesc: "Tekstfarge for nedtellingen (f.eks. «om 3 dager»)",
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
        panelLayoutDesc: "Visning, skrifter, farger og bakgrunner",
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
      },
      editor: {
        title: "Korttitel",
        titleDesc: "Egen titeltekst til kortet (lad stå tomt for standardtitlen)",
        titlePlaceholder: "f.eks. Kommende begivenheder",
        count: "Antal begivenheder",
        countDesc: "Det samlede antal begivenheder, der vises på kortet",
        daysAhead: "Dage frem (0 = ubegrænset)",
        daysAheadDesc: "Vis kun begivenheder inden for dette antal dage (0 = ingen grænse)",
        daysPast: "Dage tilbage (0 = kun i dag)",
        daysPastDesc: "Hvor mange dage tilbage en begivenhed stadig tæller som nylig (0 = kun i dag)",
        soonDays: "\"Snart\"-tærskel (dage)",
        soonDaysDesc: "Begivenheder inden for dette antal dage tæller som \"snart\"",
        types: "Begivenhedstyper",
        typesDesc: "Vis kun de afkrydsede begivenhedstyper",
        visibilityHeading: "Vis / Skjul",
        visibilityPast: "Tidligere begivenheder",
        visibilityPastDesc: "Vis begivenheder, hvis mærkedag allerede er passeret inden for det konfigurerede tidligere-vindue",
        visibilityToday: "Dagens begivenheder",
        visibilityTodayDesc: "Vis begivenheder, der finder sted i dag",
        visibilitySoon: "Snart",
        visibilitySoonDesc: "Vis begivenheder inden for \"snart\"-tærsklen",
        visibilityCardTitleDesc: "Vis kortets egen titel",
        visibilityIcon: "Ikon",
        visibilityIconDesc: "Vis typeikonet foran hver række",
        visibilityTitleDesc: "Vis begivenhedens navn",
        visibilitySubtitleDesc: "Vis begivenhedstypen",
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
        matchTextLabel: "Farvelæg også teksten",
        matchTextDesc: "Farvelæg også hele rækkens tekst med denne ikonfarve",
        colorTitle: "Titel",
        colorSubtitle: "Undertitel",
        colorBadge: "Jubilæum",
        colorWhen: "Nedtælling",
        colorTitleDesc: "Tekstfarve for begivenhedens navn",
        colorSubtitleDesc: "Tekstfarve for begivenhedstypen",
        colorBadgeDesc: "Tekstfarve for mærket med jubilæumsnummeret",
        colorWhenDesc: "Tekstfarve for nedtællingen (f.eks. \"om 3 dage\")",
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
        panelLayoutDesc: "Visning, skrifttyper, farver og baggrunde",
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
      },
      editor: {
        title: "Kart başlığı",
        titleDesc: "Kart için özel başlık metni (varsayılan başlık için boş bırakın)",
        titlePlaceholder: "örn. Yaklaşan Etkinlikler",
        count: "Etkinlik sayısı",
        countDesc: "Kartta gösterilen toplam etkinlik sayısı",
        daysAhead: "İleri gün sayısı (0 = sınırsız)",
        daysAheadDesc: "Yalnızca bu gün sayısı içinde gerçekleşen etkinlikleri göster (0 = sınır yok)",
        daysPast: "Geçmiş gün sayısı (0 = yalnızca bugün)",
        daysPastDesc: "Bir etkinliğin kaç gün geriye kadar hâlâ yakın sayılacağı (0 = yalnızca bugün)",
        soonDays: "\"Yakında\" eşiği (gün)",
        soonDaysDesc: "Bu gün sayısı içindeki etkinlikler \"yakında\" sayılır",
        types: "Etkinlik türleri",
        typesDesc: "Yalnızca işaretli etkinlik türlerini göster",
        visibilityHeading: "Göster / Gizle",
        visibilityPast: "Geçmiş etkinlikler",
        visibilityPastDesc: "Yıl dönümü, ayarlanan geçmiş penceresi içinde zaten geçmiş olan etkinlikleri göster",
        visibilityToday: "Bugünkü etkinlikler",
        visibilityTodayDesc: "Bugün gerçekleşen etkinlikleri göster",
        visibilitySoon: "Yakında",
        visibilitySoonDesc: "\"Yakında\" eşiği içindeki etkinlikleri göster",
        visibilityCardTitleDesc: "Kartın kendi başlığını göster",
        visibilityIcon: "Simge",
        visibilityIconDesc: "Her satırın önünde tür simgesini göster",
        visibilityTitleDesc: "Etkinlik adını göster",
        visibilitySubtitleDesc: "Etkinlik türünü göster",
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
        matchTextLabel: "Metni de renklendir",
        matchTextDesc: "Satırın tüm metnini de bu simge rengiyle renklendir",
        colorTitle: "Başlık",
        colorSubtitle: "Alt başlık",
        colorBadge: "Tekrar sayısı",
        colorWhen: "Geri sayım",
        colorTitleDesc: "Etkinlik adı için metin rengi",
        colorSubtitleDesc: "Etkinlik türü için metin rengi",
        colorBadgeDesc: "Tekrar numarası rozeti için metin rengi",
        colorWhenDesc: "Geri sayım için metin rengi (örn. \"3 gün sonra\")",
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
        panelLayoutDesc: "Görünüm, yazı tipleri, renkler ve arka planlar",
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

  function defaultConfig(config) {
    config = config || {};
    return {
      title: "",
      show_title: true,
      count: 10,
      days_ahead: 0,
      days_past: 0,
      soon_days: 7,
      types: [],
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
      ...config,
      colors: {
        today: "",
        soon: "",
        accent: "",
        title: "",
        subtitle: "",
        badge: "",
        when: "",
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
      cursor: pointer;
      border-radius: 8px;
    }
    .row:hover {
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
      const filtered = all.filter((e) => {
        if (config.types && config.types.length && !config.types.includes(e.type)) return false;
        if (config.days_ahead && config.days_ahead > 0 && e.days > config.days_ahead) return false;
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
      const matchClass = config.colors[`match_${colorCategory}`] ? ` match-${colorCategory}-text` : "";
      div.className = "row" + (highlightClass ? ` ${highlightClass}` : "") + matchClass;
      const typeLabel = strings.types[e.type] || e.type;

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

      div.innerHTML = `
        <div class="icon-wrap">
          <ha-icon icon="${e.icon}" class="icon ${iconClass}"></ha-icon>
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
      nameEl.textContent = e.name;
      if (config.show_name === false) nameEl.style.display = "none";

      const typeEl = div.querySelector(".type");
      typeEl.textContent = typeLabel;
      if (config.show_subtitle === false) typeEl.style.display = "none";

      const whenEl = div.querySelector(".when");
      whenEl.textContent = when;
      if (config.show_when === false) whenEl.style.display = "none";
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
      if (config.colors.title) card.style.setProperty("--annuals-title-color", config.colors.title);
      if (config.colors.subtitle)
        card.style.setProperty("--annuals-subtitle-color", config.colors.subtitle);
      if (config.colors.badge) card.style.setProperty("--annuals-badge-color", config.colors.badge);
      if (config.colors.badge_background_color)
        card.style.setProperty("--annuals-badge-bg-color", config.colors.badge_background_color);
      if (config.colors.when) card.style.setProperty("--annuals-when-color", config.colors.when);
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
      groups: ["display", "fonts", "colors", "background"],
    },
  ];

  const GROUPS = [
    { key: "general", icon: "mdi:cog" },
    { key: "events", icon: "mdi:calendar-star" },
    { key: "period", icon: "mdi:calendar-range" },
    { key: "display", icon: "mdi:eye-outline" },
    { key: "fonts", icon: "mdi:format-size" },
    { key: "colors", icon: "mdi:palette" },
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
    .field-row { margin-bottom: 16px; }
    .field-row-split {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
    }
    .field-row-split .field-col { flex: 1; min-width: 0; }
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
    .type-grid {
      flex: 1;
      display: flex;
      flex-wrap: wrap;
      gap: 8px 20px;
    }
    .type-checkbox {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.9em;
      cursor: pointer;
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
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 16px;
    }
    .toggle-row .field-label { margin-bottom: 0; }
    /* Used on the row right before .toggle-divider - see comment there for
       why this needs to be smaller than the usual 16px. */
    .toggle-row-tight { margin-bottom: 8px; }
    .toggle-divider {
      border: none;
      border-top: 1px dashed var(--divider-color, #444);
      margin: 8px 0;
    }
    .toggle-label {
      font-size: 0.85em;
      color: var(--secondary-text-color);
      white-space: nowrap;
    }
    .toggle {
      position: relative;
      display: inline-block;
      width: 36px;
      height: 20px;
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
      width: 16px;
      height: 16px;
      left: 2px;
      top: 2px;
      background: #fff;
      border-radius: 50%;
      transition: 0.2s;
    }
    .toggle input:checked + .track { background: var(--primary-color); }
    .toggle input:checked + .track::before { transform: translateX(16px); }
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

    _buildGeneralBody(strings) {
      const body = document.createElement("div");
      body.className = "general-body";
      body.innerHTML = this._fieldRowHtml("title", "text", strings.editor.titlePlaceholder);
      this._wireFieldRow(body, "title", strings.editor.title, strings.editor.titleDesc, (v) => v);
      return body;
    }

    _syncGeneralInputs() {
      this._syncFieldRow("title", this._config.title || "");
    }

    _buildEventsBody(strings) {
      const body = document.createElement("div");
      body.className = "events-body";
      body.innerHTML = this._fieldRowHtml("count", "number", "", 'min="1" max="50"');
      this._wireFieldRow(body, "count", strings.editor.count, strings.editor.countDesc, (v) =>
        Math.max(1, Number(v) || 1)
      );

      const typesRow = document.createElement("div");
      typesRow.className = "field-row";
      typesRow.innerHTML = `
        <div class="field-label">
          <span class="label-text"></span>
          <span class="tooltip-anchor" data-tooltip="">
            <ha-icon icon="mdi:information-outline"></ha-icon>
          </span>
        </div>
        <div class="type-grid">
          ${EVENT_TYPES.map(
            (value) => `
              <label class="type-checkbox">
                <input type="checkbox" data-type="${value}">
                <span></span>
              </label>
            `
          ).join("")}
        </div>
      `;
      typesRow.querySelector(".label-text").textContent = strings.editor.types;
      typesRow.querySelector(".tooltip-anchor").dataset.tooltip = strings.editor.typesDesc;
      typesRow.querySelectorAll(".type-checkbox").forEach((label) => {
        const value = label.querySelector("input").dataset.type;
        label.querySelector("span").textContent = strings.types[value] || value;
        label.querySelector("input").addEventListener("change", () => {
          const checked = Array.from(typesRow.querySelectorAll("input[data-type]"))
            .filter((el) => el.checked)
            .map((el) => el.dataset.type);
          this._config = defaultConfig({ ...this._config, types: checked });
          this._emit();
        });
      });
      body.appendChild(typesRow);

      return body;
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
    }

    _buildPeriodBody(strings) {
      const body = document.createElement("div");
      body.className = "period-body";
      body.innerHTML =
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
    }

    _groupText(key, strings) {
      const map = {
        general: [strings.editor.groupGeneral, strings.editor.groupGeneralDesc],
        events: [strings.editor.groupEvents, strings.editor.groupEventsDesc],
        period: [strings.editor.groupPeriod, strings.editor.groupPeriodDesc],
        display: [strings.editor.groupDisplay, strings.editor.groupDisplayDesc],
        fonts: [strings.editor.fonts, ""],
        colors: [strings.editor.colors, ""],
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
          <span class="toggle-label"></span>
          <span class="tooltip-anchor" data-tooltip="">
            <ha-icon icon="mdi:information-outline"></ha-icon>
          </span>
          <label class="toggle">
            <input type="checkbox" data-${dataAttr}="${key}">
            <span class="track"></span>
          </label>
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
        title: "var(--primary-text-color)",
        subtitle: "var(--primary-text-color)",
        badge: "var(--primary-text-color)",
        badge_background_color: "rgba(128, 128, 128, 0.25)",
        when: "var(--primary-text-color)",
      };
      for (const key of [
        "accent",
        "today",
        "soon",
        "title",
        "subtitle",
        "badge",
        "badge_background_color",
        "when",
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

      const matchToggle = row.querySelector(`input[data-match="${key}"]`);
      if (matchToggle) {
        const strings = t(this._hass);
        row.querySelector(".toggle-label").textContent = strings.editor.matchTextLabel;
        row.querySelector(".toggle-group .tooltip-anchor").dataset.tooltip =
          strings.editor.matchTextDesc;
        matchToggle.addEventListener("change", () => {
          this._config = defaultConfig({
            ...this._config,
            colors: { ...this._config.colors, [`match_${key}`]: matchToggle.checked },
          });
          this._emit();
        });
      }

      const bgToggle = row.querySelector(`input[data-bg="${key}"]`);
      if (bgToggle) {
        const strings = t(this._hass);
        row.querySelector(".toggle-label").textContent = strings.editor.backgroundLabel;
        row.querySelector(".toggle-group .tooltip-anchor").dataset.tooltip =
          strings.editor.backgroundDesc;
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

      const iconsHeading = document.createElement("div");
      iconsHeading.className = "section-heading";
      iconsHeading.textContent = strings.editor.colorsIconsHeading;
      body.appendChild(iconsHeading);

      const iconRows = document.createElement("div");
      iconRows.innerHTML =
        this._colorRowHtml("accent", strings.editor.colorPlaceholder, { matchToggle: true }) +
        this._colorRowHtml("today", strings.editor.colorPlaceholder, { matchToggle: true }) +
        this._colorRowHtml("soon", strings.editor.colorPlaceholder, { matchToggle: true });
      body.appendChild(iconRows);

      const labelsHeading = document.createElement("div");
      labelsHeading.className = "section-heading";
      labelsHeading.textContent = strings.editor.colorsLabelsHeading;
      body.appendChild(labelsHeading);

      const labelRows = document.createElement("div");
      labelRows.innerHTML =
        this._colorRowHtml("title", strings.editor.colorPlaceholder) +
        this._colorRowHtml("subtitle", strings.editor.colorPlaceholder) +
        this._colorRowHtml("badge", strings.editor.colorPlaceholder, { bgToggle: true }) +
        this._colorRowHtml("badge_background_color", strings.editor.colorPlaceholder, { sub: true }) +
        this._colorRowHtml("when", strings.editor.colorPlaceholder);
      body.appendChild(labelRows);

      this._paintPresetSwatches(body, strings);

      const labels = {
        accent: [strings.editor.colorAccent, strings.editor.colorAccentDesc],
        today: [strings.editor.colorToday, strings.editor.colorTodayDesc],
        soon: [strings.editor.colorSoon, strings.editor.colorSoonDesc],
        title: [strings.editor.colorTitle, strings.editor.colorTitleDesc],
        subtitle: [strings.editor.colorSubtitle, strings.editor.colorSubtitleDesc],
        badge: [strings.editor.colorBadge, strings.editor.colorBadgeDesc],
        badge_background_color: [
          strings.editor.colorBadgeBackground,
          strings.editor.colorBadgeBackgroundDesc,
        ],
        when: [strings.editor.colorWhen, strings.editor.colorWhenDesc],
      };
      for (const key of [
        "accent",
        "today",
        "soon",
        "title",
        "subtitle",
        "badge",
        "badge_background_color",
        "when",
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

    _buildBackgroundBody(strings) {
      const body = document.createElement("div");
      body.className = "background-body";

      body.innerHTML =
        `
        <div class="toggle-row">
          <div class="field-label">
            <span class="label-text"></span>
            <span class="tooltip-anchor" data-tooltip="">
              <ha-icon icon="mdi:information-outline"></ha-icon>
            </span>
          </div>
          <label class="toggle">
            <input type="checkbox" data-bg-card-enabled>
            <span class="track"></span>
          </label>
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
          <div class="field-label">
            <span class="label-text"></span>
            <span class="tooltip-anchor" data-tooltip="">
              <ha-icon icon="mdi:information-outline"></ha-icon>
            </span>
          </div>
          <label class="toggle">
            <input type="checkbox" data-highlight="${key}">
            <span class="track"></span>
          </label>
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
        font_size_title: config.show_title !== false,
        icon: config.show_icon !== false,
        title: config.show_name !== false,
        subtitle: config.show_subtitle !== false,
        badge: config.show_badge !== false,
        when: config.show_when !== false,
        vip_only: config.show_vip_only === true,
        important_only: config.show_important_only === true,
      };
      for (const key of Object.keys(visMap)) {
        const toggle = this.shadowRoot.querySelector(`input[data-visibility="${key}"]`);
        if (toggle) toggle.checked = visMap[key];
      }
      this._syncIconField("vip_badge_icon", config.vip_badge_icon || "");
      this._syncIconField("important_badge_icon", config.important_badge_icon || "");
    }

    _visibilityRowHtml(key, extraClass) {
      return `
        <div class="toggle-row${extraClass ? ` ${extraClass}` : ""}">
          <div class="field-label">
            <span class="label-text"></span>
            <span class="tooltip-anchor" data-tooltip="">
              <ha-icon icon="mdi:information-outline"></ha-icon>
            </span>
          </div>
          <label class="toggle">
            <input type="checkbox" data-visibility="${key}">
            <span class="track"></span>
          </label>
        </div>
      `;
    }

    _buildDisplayBody(strings) {
      const body = document.createElement("div");
      body.className = "display-body";

      const visHeading = document.createElement("div");
      visHeading.className = "section-heading";
      visHeading.textContent = strings.editor.visibilityHeading;
      body.appendChild(visHeading);

      const visKeys = [
        "past",
        "today",
        "soon",
        "vip_only",
        "important_only",
        "font_size_title",
        "icon",
        "title",
        "subtitle",
        "badge",
        "when",
      ];
      const visRows = document.createElement("div");
      // A subtle dashed divider between "important_only" and "font_size_title"
      // marks the boundary between the two conceptually different groups
      // here: which events appear at all (past/today/soon, VIP/Important
      // filters) vs. which fields are shown per row (card title onward).
      // The row right before the divider gets a tighter bottom margin so
      // the line sits exactly centered between the two rows (equal gap
      // above and below) rather than hugging one side - sibling margins
      // collapse to the larger of the two, so leaving that row's margin at
      // the normal 16px would always win over the divider's own margin and
      // push the line to the bottom.
      visRows.innerHTML = visKeys
        .map(
          (key) =>
            (key === "font_size_title" ? '<hr class="toggle-divider">' : "") +
            this._visibilityRowHtml(key, key === "important_only" ? "toggle-row-tight" : "")
        )
        .join("");
      body.appendChild(visRows);

      const visLabels = {
        past: [strings.editor.visibilityPast, strings.editor.visibilityPastDesc],
        today: [strings.editor.visibilityToday, strings.editor.visibilityTodayDesc],
        soon: [strings.editor.visibilitySoon, strings.editor.visibilitySoonDesc],
        font_size_title: [strings.editor.fontCardTitle, strings.editor.visibilityCardTitleDesc],
        icon: [strings.editor.visibilityIcon, strings.editor.visibilityIconDesc],
        title: [strings.editor.colorTitle, strings.editor.visibilityTitleDesc],
        subtitle: [strings.editor.colorSubtitle, strings.editor.visibilitySubtitleDesc],
        badge: [strings.editor.colorBadge, strings.editor.visibilityBadgeDesc],
        when: [strings.editor.colorWhen, strings.editor.visibilityWhenDesc],
        vip_only: [strings.editor.visibilityVipOnly, strings.editor.visibilityVipOnlyDesc],
        important_only: [strings.editor.visibilityImportantOnly, strings.editor.visibilityImportantOnlyDesc],
      };
      const visConfigKeys = {
        past: "show_past",
        today: "show_today",
        soon: "show_soon",
        font_size_title: "show_title",
        icon: "show_icon",
        title: "show_name",
        subtitle: "show_subtitle",
        badge: "show_badge",
        when: "show_when",
        vip_only: "show_vip_only",
        important_only: "show_important_only",
      };
      for (const key of visKeys) {
        const row = body.querySelector(`input[data-visibility="${key}"]`).closest(".toggle-row");
        const [label, desc] = visLabels[key];
        row.querySelector(".label-text").textContent = label;
        row.querySelector(".tooltip-anchor").dataset.tooltip = desc;

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
                <span class="toggle-label"></span>
                <label class="toggle">
                  <input type="checkbox" data-bold="${key}">
                  <span class="track"></span>
                </label>
              </div>
              <div class="toggle-group">
                <span class="toggle-label"></span>
                <label class="toggle">
                  <input type="checkbox" data-italic="${key}">
                  <span class="track"></span>
                </label>
              </div>
              <div class="toggle-group">
                <span class="toggle-label"></span>
                <label class="toggle">
                  <input type="checkbox" data-uppercase="${key}">
                  <span class="track"></span>
                </label>
              </div>
              <div class="toggle-group">
                <span class="toggle-label"></span>
                <label class="toggle">
                  <input type="checkbox" data-underline="${key}">
                  <span class="track"></span>
                </label>
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

      const heading = document.createElement("div");
      heading.className = "section-heading";
      heading.textContent = strings.editor.colorsLabelsHeading;
      body.appendChild(heading);

      const rows = document.createElement("div");
      rows.innerHTML =
        this._fontRowHtml("font_size_title", strings.editor.fontPlaceholder, strings.editor.fontLetterSpacingPlaceholder) +
        this._fontRowHtml("title", strings.editor.fontPlaceholder, strings.editor.fontLetterSpacingPlaceholder) +
        this._fontRowHtml("subtitle", strings.editor.fontPlaceholder, strings.editor.fontLetterSpacingPlaceholder) +
        this._fontRowHtml("badge", strings.editor.fontPlaceholder, strings.editor.fontLetterSpacingPlaceholder) +
        this._fontRowHtml("when", strings.editor.fontPlaceholder, strings.editor.fontLetterSpacingPlaceholder);
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
      };
      for (const key of ["font_size_title", "title", "subtitle", "badge", "when"]) {
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
