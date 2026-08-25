console.log("!!! TEAM TRACKER v2.1.0-beta3 !!!");

const LitElement = Object.getPrototypeOf(customElements.get("ha-panel-lovelace"));
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;

// --- AUTO-PRELOAD FÜR LAZY LOADING ---
async function preloadHAComponents() {
  if (customElements.get("ha-entity-picker")) return;
  if (window.loadCardHelpers) {
    try {
      const helpers = await window.loadCardHelpers();
      const card = helpers.createCardElement({ type: "entities", entities: [] });
      if (card.constructor.getConfigElement) {
        await card.constructor.getConfigElement();
      }
    } catch (e) {
      console.warn("Team Tracker: Lazy-Loading der HA-Komponenten fehlgeschlagen", e);
    }
  }
}

// --- ÜBERSETZUNGEN ---
const LANG = {
  de: {
    manage_teams: "Teams verwalten",
    add_team: "Neues Team hinzufügen...",
    priority_label: "Priorität / Favorit",
    prio_picker: "Haupt-Sensor auswählen",
    prio_help: "Dieses Team wird bei gleicher Spielzeit bevorzugt und seine Teamfarbe hat immer Vorrang.",
    layout_section: "Erscheinungsbild",
    ultra_layout: "Ultra-Compact-Layout",
    slider_layout: "Als Karussell / Slider anzeigen",
    show_league: "Kopfzeile anzeigen",
    logo_shadow: "Wappen/Profilbild hervorheben",
    show_location: "Spielort anzeigen",
    show_tv_network: "TV-Sender anzeigen",
    home_position_label: "Heimteam-Position",
    home_left: "Links (Europäischer Standard)",
    home_right: "Rechts (US / Away @ Home)",
    delimiter_label: "Spielstand-Trennzeichen",
    delimiter_colon: "Doppelpunkt ( : )",
    delimiter_dash: "Bindestrich ( - )",
    match_info_section: "Spiel-Informationen",
    next_only: "Nur das nächste/aktuelle Spiel anzeigen",
    hide_finished: "Beendete Spiele ausblenden",
    hide_finished_help: "Versteckt Spiele vom Vortag automatisch um Mitternacht.",
    hide_offseason: "Spielfreie Teams ausblenden",
    hide_offseason_help: "Versteckt Teams ohne aktuell angesetzte Partien (z. B. Sommerpause/Pokal).",
    show_sun: "Statistiken (S-U-N) anzeigen",
    live_details_section: "Live-Details",
    show_last_play: "Letzten Spielzug anzeigen",
    last_play_help: "Zeigt bei Live-Spielen eine Textzusammenfassung des letzten Spielzugs an.",
    last_play_marquee: "Lauftext für letzten Spielzug nutzen",
    no_entities: "Bitte füge in der Konfiguration Teams hinzu, um die Vorschau zu sehen.",
    bg_color: "Hintergrundfarbe:",
    reset: "Zurücksetzen",
    scheduled: "Geplant",
    finished: "Beendet",
    live: "LIVE",
    no_upcoming_games: "Keine anstehenden Spiele",
    bye_week: "Spielfrei",
    pos: "Pos."
  },
  en: {
    manage_teams: "Manage Teams",
    add_team: "Add new team...",
    priority_label: "Priority / Favorite",
    prio_picker: "Select main sensor",
    prio_help: "This team is preferred for simultaneous games, and its custom color always takes precedence.",
    layout_section: "Appearance",
    ultra_layout: "Ultra-compact layout",
    slider_layout: "Display as carousel / slider",
    show_league: "Show card header",
    logo_shadow: "Highlight logo/profile picture",
    show_location: "Show match location",
    show_tv_network: "Show TV broadcast",
    home_position_label: "Home team position",
    home_left: "Left (European standard)",
    home_right: "Right (US / Away @ Home)",
    delimiter_label: "Score delimiter",
    delimiter_colon: "Colon ( : )",
    delimiter_dash: "Dash ( - )",
    match_info_section: "Match Information",
    next_only: "Show only next/current match",
    hide_finished: "Hide finished matches",
    hide_finished_help: "Automatically hides matches from previous days at midnight.",
    hide_offseason: "Hide unscheduled teams",
    hide_offseason_help: "Hides teams without currently scheduled matches.",
    show_sun: "Show statistics (W-D-L)",
    live_details_section: "Live Details",
    show_last_play: "Show last play",
    last_play_help: "Displays a text summary of the most recent play during live games.",
    last_play_marquee: "Use marquee for last play",
    no_entities: "Please add teams in the configuration to see the preview.",
    bg_color: "Background color:",
    reset: "Reset",
    scheduled: "Scheduled",
    finished: "Finished",
    live: "LIVE",
    no_upcoming_games: "No upcoming matches",
    bye_week: "Bye Week",
    pos: "Pos."
  }
};

// --- EDITOR ---
class CompactTeamTrackerEditor extends LitElement {
  static get properties() { return { hass: {}, _config: {}, _pickerReady: {} }; }

  constructor() {
    super();
    this._pickerReady = !!customElements.get("ha-entity-picker");
  }

  async connectedCallback() {
    super.connectedCallback();
    if (!this._pickerReady) {
      await preloadHAComponents();
      this._pickerReady = true;
      this.requestUpdate();
    }
  }

  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config));
    if (!this._config.entities) this._config.entities = this._config.entity ? [this._config.entity] : [];
    if (!this._config.team_colors) this._config.team_colors = {};
  }

  get _lang() {
    const l = this.hass?.language || 'de';
    return LANG[l] || LANG['en'];
  }

  _filterEntity(stateObj) {
    if (!stateObj) return false;
    const attr = stateObj.attributes?.attribution || "";
    return attr.toLowerCase().includes("espn") || stateObj.entity_id.includes("team_tracker");
  }

  render() {
    if (!this.hass || !this._config) return html``;
    const t = this._lang;

    if (!this._pickerReady && !customElements.get("ha-entity-picker")) {
      return html`
        <div style="padding: 16px; text-align: center; color: var(--secondary-text-color); font-style: italic;">
          Registriere Editor-Komponenten im Dashboard...
        </div>
      `;
    }

    const isUltra = this._config.layout === 'ultra';
    const isSlider = this._config.slider === true;
    const isShowLastPlayDisabled = isUltra;
    const isMarqueeDisabled = isUltra || this._config.show_last_play === false;
    const colors = this._config.team_colors || {};
    const homePos = this._config.home_team_position || 'left';
    const delimiter = this._config.score_delimiter || ':';

    return html`
      <div class="card-config">
        <div class="section-title">${t.manage_teams}</div>
        <div class="config-box">
          ${this._config.entities.map((ent, idx) => html`
            <div class="team-item-card" key="${ent || idx}">
              <div class="team-item-header">
                <span class="team-number-label">Team / Sensor ${idx + 1}</span>
                <ha-icon 
                  icon="mdi:trash-can-outline" 
                  class="delete-icon" 
                  title="Entfernen"
                  @click="${() => this._removeEntity(idx)}">
                </ha-icon>
              </div>
              
              <ha-entity-picker 
                .hass="${this.hass}" 
                .value="${ent}" 
                .includeDomains="${["sensor"]}" 
                .entityFilter="${(s) => this._filterEntity(s)}"
                @value-changed="${(ev) => this._entityChanged(idx, ev)}" 
                allow-custom-entity>
              </ha-entity-picker>

              <div class="team-color-subrow">
                <span class="color-label">${t.bg_color}</span>
                <div class="color-controls">
                  <input 
                    type="color" 
                    class="color-circle" 
                    .value="${colors[ent] || '#1c1c1e'}" 
                    @input="${(ev) => this._colorChanged(ent, ev.target.value)}">
                  <input 
                    type="text" 
                    class="color-text-input" 
                    placeholder="#HEX" 
                    .value="${colors[ent] || ''}" 
                    @change="${(ev) => this._colorChanged(ent, ev.target.value)}">
                  ${colors[ent] ? html`
                    <button class="reset-color-btn" @click="${() => this._resetColor(ent)}">
                      ${t.reset}
                    </button>
                  ` : ''}
                </div>
              </div>
            </div>
          `)}
          
          <ha-entity-picker 
            .label="${t.add_team}" 
            .hass="${this.hass}" 
            .includeDomains="${["sensor"]}" 
            .entityFilter="${(s) => this._filterEntity(s)}"
            @value-changed="${this._addEntity}">
          </ha-entity-picker>
        </div>

        <div class="section-title">${t.priority_label}</div>
        <div class="config-box">
          <ha-entity-picker 
            .label="${t.prio_picker}" 
            .hass="${this.hass}" 
            .value="${this._config.priority_entity || ''}" 
            .includeDomains="${["sensor"]}" 
            .entityFilter="${(s) => this._filterEntity(s)}"
            @value-changed="${this._prioChanged}" 
            allow-custom-entity>
          </ha-entity-picker>
          <p class="help-text">${t.prio_help}</p>
        </div>

        <div class="section-title">${t.layout_section}</div>
        <div class="config-box">
          <div class="switch-row">
            <ha-switch 
              .checked="${isUltra}" 
              .configValue="${"layout"}" 
              @change="${this._toggleLayout}">
            </ha-switch>
            <span>${t.ultra_layout}</span>
          </div>
          <div class="switch-row">
            <ha-switch 
              .checked="${isSlider}" 
              .configValue="${"slider"}" 
              @change="${this._toggleOption}">
            </ha-switch>
            <span>${t.slider_layout}</span>
          </div>
          <div class="switch-row ${isUltra ? 'disabled' : ''}">
            <ha-switch 
              .checked="${this._config.show_league !== false}" 
              .disabled="${isUltra}"
              .configValue="${"show_league"}" 
              @change="${this._toggleOption}">
            </ha-switch>
            <span>${t.show_league}</span>
          </div>
          <div class="switch-row">
            <ha-switch 
              .checked="${this._config.logo_shadow === true}" 
              .configValue="${"logo_shadow"}" 
              @change="${this._toggleOption}">
            </ha-switch>
            <span>${t.logo_shadow}</span>
          </div>
          <div class="switch-row ${isUltra ? 'disabled' : ''}">
            <ha-switch 
              .checked="${this._config.show_location !== false}" 
              .disabled="${isUltra}"
              .configValue="${"show_location"}" 
              @change="${this._toggleOption}">
            </ha-switch>
            <span>${t.show_location}</span>
          </div>
          <div class="switch-row ${isUltra ? 'disabled' : ''}">
            <ha-switch 
              .checked="${this._config.show_tv_network !== false}" 
              .disabled="${isUltra}"
              .configValue="${"show_tv_network"}" 
              @change="${this._toggleOption}">
            </ha-switch>
            <span>${t.show_tv_network}</span>
          </div>

          <div class="select-row">
            <label class="select-label">${t.home_position_label}</label>
            <select class="custom-select" .value="${homePos}" @change="${(e) => this._selectOption('home_team_position', e.target.value)}">
              <option value="left" ?selected="${homePos === 'left'}">${t.home_left}</option>
              <option value="right" ?selected="${homePos === 'right'}">${t.home_right}</option>
            </select>
          </div>

          <div class="select-row">
            <label class="select-label">${t.delimiter_label}</label>
            <select class="custom-select" .value="${delimiter}" @change="${(e) => this._selectOption('score_delimiter', e.target.value)}">
              <option value=":" ?selected="${delimiter === ':'}">${t.delimiter_colon}</option>
              <option value="-" ?selected="${delimiter === '-'}">${t.delimiter_dash}</option>
            </select>
          </div>
        </div>

        <div class="section-title">${t.match_info_section}</div>
        <div class="config-box">
          <div class="switch-row ${isSlider ? 'disabled' : ''}">
            <ha-switch 
              .checked="${this._config.show_next_only === true}" 
              .disabled="${isSlider}"
              .configValue="${"show_next_only"}" 
              @change="${this._toggleOption}">
            </ha-switch>
            <span>${t.next_only}</span>
          </div>
          
          <div class="switch-row">
            <ha-switch 
              .checked="${this._config.only_today === true}" 
              .configValue="${"only_today"}" 
              @change="${this._toggleOption}">
            </ha-switch>
            <span>${t.hide_finished}</span>
          </div>
          <p class="help-text">${t.hide_finished_help}</p>

          <div class="switch-row">
            <ha-switch 
              .checked="${this._config.hide_offseason === true}" 
              .configValue="${"hide_offseason"}" 
              @change="${this._toggleOption}">
            </ha-switch>
            <span>${t.hide_offseason}</span>
          </div>
          <p class="help-text">${t.hide_offseason_help}</p>

          <div class="switch-row ${isUltra ? 'disabled' : ''}">
            <ha-switch 
              .checked="${this._config.show_record === true}" 
              .disabled="${isUltra}"
              .configValue="${"show_record"}" 
              @change="${this._toggleOption}">
            </ha-switch>
            <span>${t.show_sun}</span>
          </div>
        </div>

        <div class="section-title">${t.live_details_section}</div>
        <div class="config-box">
          <div class="switch-row ${isShowLastPlayDisabled ? 'disabled' : ''}">
            <ha-switch 
              .checked="${this._config.show_last_play !== false}" 
              .disabled="${isShowLastPlayDisabled}"
              .configValue="${"show_last_play"}" 
              @change="${this._toggleOption}">
            </ha-switch>
            <span>${t.show_last_play}</span>
          </div>
          <p class="help-text ${isShowLastPlayDisabled ? 'disabled' : ''}">${t.last_play_help}</p>
          <div class="switch-row ${isMarqueeDisabled ? 'disabled' : ''}">
            <ha-switch 
              .checked="${this._config.last_play_marquee === true}" 
              .disabled="${isMarqueeDisabled}"
              .configValue="${"last_play_marquee"}" 
              @change="${this._toggleOption}">
            </ha-switch>
            <span>${t.last_play_marquee}</span>
          </div>
        </div>
      </div>
    `;
  }

  _toggleLayout(ev) { this._updateConfig({ ...this._config, layout: ev.target.checked ? 'ultra' : 'standard' }); }
  _toggleOption(ev) { this._updateConfig({ ...this._config, [ev.target.configValue]: ev.target.checked }); }
  _selectOption(key, val) { this._updateConfig({ ...this._config, [key]: val }); }
  
  _entityChanged(idx, ev) {
    const oldEnt = this._config.entities[idx];
    const newEntities = [...this._config.entities];
    newEntities[idx] = ev.detail.value;
    
    const teamColors = { ...(this._config.team_colors || {}) };
    if (oldEnt && teamColors[oldEnt] && oldEnt !== ev.detail.value) {
      teamColors[ev.detail.value] = teamColors[oldEnt];
      delete teamColors[oldEnt];
    }

    this._updateConfig({ ...this._config, entities: newEntities, team_colors: teamColors });
  }

  _colorChanged(entityId, colorHex) {
    if (!entityId) return;
    const formatted = colorHex ? (colorHex.startsWith('#') ? colorHex : `#${colorHex}`) : '';
    const teamColors = { ...(this._config.team_colors || {}) };
    if (formatted) {
      teamColors[entityId] = formatted;
    } else {
      delete teamColors[entityId];
    }
    this._updateConfig({ ...this._config, team_colors: teamColors });
  }

  _resetColor(entityId) {
    if (!entityId) return;
    const teamColors = { ...(this._config.team_colors || {}) };
    delete teamColors[entityId];
    this._updateConfig({ ...this._config, team_colors: teamColors });
  }

  _addEntity(ev) {
    if (!ev.detail.value) return;
    const newEnts = this._config.entities ? [...this._config.entities, ev.detail.value] : [ev.detail.value];
    this._updateConfig({ ...this._config, entities: newEnts });
    ev.target.value = "";
  }

  _removeEntity(idx) { 
    const entToRemove = this._config.entities[idx];
    const newEntities = this._config.entities.filter((_, i) => i !== idx);
    const teamColors = { ...(this._config.team_colors || {}) };
    if (entToRemove) delete teamColors[entToRemove];
    this._updateConfig({ ...this._config, entities: newEntities, team_colors: teamColors }); 
  }

  _prioChanged(ev) { this._updateConfig({ ...this._config, priority_entity: ev.detail.value }); }
  
  _updateConfig(newConfig) { 
    this._config = JSON.parse(JSON.stringify(newConfig));
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); 
    this.requestUpdate();
  }
  
  static get styles() { return css`
    .card-config { padding: 4px; }
    .section-title { font-weight: bold; font-size: 14px; margin: 16px 0 8px 0; color: var(--secondary-text-color); text-transform: uppercase; letter-spacing: 1px; }
    .config-box { background: rgba(128, 128, 128, 0.05); padding: 12px; border-radius: 8px; border: 1px solid rgba(128, 128, 128, 0.1); }
    
    .team-item-card { 
      background: var(--card-background-color, rgba(255, 255, 255, 0.03)); 
      border: 1px solid var(--divider-color, rgba(128, 128, 128, 0.2)); 
      border-radius: 8px; 
      padding: 10px 12px; 
      margin-bottom: 12px; 
      display: flex; 
      flex-direction: column; 
      gap: 8px; 
    }
    .team-item-header { 
      display: flex; 
      justify-content: space-between; 
      align-items: center; 
    }
    .team-number-label { 
      font-size: 12px; 
      font-weight: bold; 
      color: var(--secondary-text-color); 
    }
    .delete-icon { 
      cursor: pointer; 
      color: var(--error-color, #e74c3c); 
      opacity: 0.8; 
      transition: opacity 0.2s ease; 
      --mdc-icon-size: 18px; 
    }
    .delete-icon:hover { opacity: 1; }

    .team-color-subrow { 
      display: flex; 
      align-items: center; 
      justify-content: space-between; 
      gap: 8px; 
      padding-top: 4px; 
      border-top: 1px dashed rgba(128, 128, 128, 0.15); 
      font-size: 12px; 
    }
    .color-label { 
      color: var(--secondary-text-color); 
    }
    .color-controls { 
      display: flex; 
      align-items: center; 
      gap: 6px; 
    }
    .color-circle { 
      -webkit-appearance: none; 
      -moz-appearance: none; 
      appearance: none; 
      border: 1px solid var(--divider-color); 
      width: 24px; 
      height: 24px; 
      border-radius: 50%; 
      cursor: pointer; 
      background: none; 
      padding: 0; 
    }
    .color-circle::-webkit-color-swatch-wrapper { padding: 0; }
    .color-circle::-webkit-color-swatch { border: none; border-radius: 50%; }
    .color-text-input { 
      width: 62px; 
      border: 1px solid var(--divider-color); 
      background: var(--card-background-color, #1e1e1e); 
      color: var(--primary-text-color); 
      font-size: 11px; 
      padding: 3px 6px; 
      border-radius: 4px; 
      text-transform: uppercase; 
    }
    .reset-color-btn { 
      background: none; 
      border: 1px solid var(--divider-color); 
      color: var(--secondary-text-color); 
      border-radius: 4px; 
      padding: 2px 6px; 
      font-size: 10px; 
      cursor: pointer; 
      transition: all 0.2s ease; 
    }
    .reset-color-btn:hover { 
      color: var(--primary-text-color); 
      background: rgba(128, 128, 128, 0.1); 
    }

    .switch-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 8px; font-size: 14px; transition: opacity 0.2s ease; }
    .switch-row:last-child { margin-bottom: 0; }
    .switch-row.disabled, .help-text.disabled { opacity: 0.4; pointer-events: none; }
    
    .select-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 10px; font-size: 14px; }
    .select-label { color: var(--primary-text-color); }
    .custom-select { background: var(--card-background-color, #1e1e1e); color: var(--primary-text-color); border: 1px solid var(--divider-color); padding: 6px 10px; border-radius: 4px; font-size: 13px; cursor: pointer; outline: none; }
    
    .help-text { font-size: 12px; opacity: 0.6; margin: 4px 0 8px 0; line-height: 1.2; font-style: italic; transition: opacity 0.2s ease; }
  `; }
}
customElements.define("compact-team-tracker-editor", CompactTeamTrackerEditor);

// --- KARTE ---
class CompactTeamTracker extends LitElement {
  static get properties() { 
    return { 
      hass: {}, 
      config: {}, 
      _currentSlide: { type: Number } 
    }; 
  }

  constructor() {
    super();
    this._currentSlide = 0;
    this._touchStartX = 0;
    this._touchEndX = 0;
  }
  
  setConfig(config) { 
    this.config = config; 
  }
  
  static getConfigElement() { return document.createElement("compact-team-tracker-editor"); }
  static getStubConfig() { return { entities: [], layout: "standard", show_league: true, only_today: false, hide_offseason: false, slider: false, team_colors: {}, home_team_position: "left", score_delimiter: ":", logo_shadow: false, show_location: true, show_tv_network: true }; }

  get _lang() {
    const l = this.hass?.language || 'de';
    return LANG[l] || LANG['en'];
  }

  _prevSlide(max) {
    this._currentSlide = (this._currentSlide > 0) ? this._currentSlide - 1 : max - 1;
  }

  _nextSlide(max) {
    this._currentSlide = (this._currentSlide < max - 1) ? this._currentSlide + 1 : 0;
  }

  _setSlide(idx) {
    this._currentSlide = idx;
  }

  _handleTouchStart(e) {
    this._touchStartX = e.changedTouches[0].screenX;
  }

  _handleTouchEnd(e, max) {
    this._touchEndX = e.changedTouches[0].screenX;
    const diff = this._touchStartX - this._touchEndX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        this._nextSlide(max);
      } else {
        this._prevSlide(max);
      }
    }
  }

  _resolveBackgroundColor(stateObj) {
    const colors = this.config.team_colors || {};
    const prioId = this.config.priority_entity;

    if (prioId && colors[prioId]) {
      const prioState = this.hass.states[prioId];
      if (prioState && prioState.attributes) {
        const pAttr = prioState.attributes;
        const sAttr = stateObj.attributes;
        if (
          stateObj.entity_id === prioId ||
          (pAttr.team_abbr && (pAttr.team_abbr === sAttr.team_abbr || pAttr.team_abbr === sAttr.opponent_abbr))
        ) {
          return colors[prioId];
        }
      }
    }

    if (colors[stateObj.entity_id]) {
      return colors[stateObj.entity_id];
    }

    const entities = this.config.entities || [];
    for (const entId of entities) {
      if (colors[entId]) {
        const entState = this.hass.states[entId];
        if (entState && entState.attributes && entState.attributes.team_abbr) {
          const abbr = entState.attributes.team_abbr;
          if (abbr === stateObj.attributes.team_abbr || abbr === stateObj.attributes.opponent_abbr) {
            return colors[entId];
          }
        }
      }
    }

    return null;
  }

  _cleanName(abbr, name) {
    if (abbr && abbr.trim() !== "" && abbr.trim() !== "*") return abbr;
    if (name && name.trim() !== "" && name.trim() !== "*") return name;
    return "TBD";
  }

  _resolveAthleteData(a, isOpponent = false) {
    const prefix = isOpponent ? "opponent_" : "team_";
    let headshot = a[`${prefix}athlete_headshot`] || a[`${prefix}headshot`] || a[`${prefix}player_headshot`] || null;
    const rawLogo = a[`${prefix}logo`] || null;
    const id = a[`${prefix}id`] || a[`${prefix}athlete_id`] || a[`${prefix}player_id`] || null;
    const sport = (a.sport || a.league || "mma").toLowerCase();

    if (!headshot && id && (sport.includes("mma") || sport.includes("ufc") || sport.includes("tennis") || sport.includes("golf") || sport.includes("racing") || sport.includes("f1"))) {
      const sportKey = (sport.includes("mma") || sport.includes("ufc")) ? "mma" : (sport.includes("tennis") ? "tennis" : (sport.includes("golf") ? "golf" : "racing"));
      headshot = `https://a.espncdn.com/i/headshots/${sportKey}/players/full/${id}.png`;
    }

    const flag = a[`${prefix}flag`] || a[`${prefix}country_flag`] || (headshot && rawLogo ? rawLogo : null);
    const mainLogo = headshot || rawLogo;
    const name = this._cleanName(a[`${prefix}abbr`], a[`${prefix}name`]);

    return {
      mainLogo: mainLogo,
      flag: (mainLogo && flag && mainLogo !== flag) ? flag : null,
      name: name,
      score: a[`${prefix}score`],
      rec: a[`${prefix}record`]
    };
  }

  _resolveBestTeamLogo(stateObj) {
    const a = stateObj.attributes;
    const d = this._resolveAthleteData(a, false);
    if (d.mainLogo) return d.mainLogo;

    const myAbbr = a.team_abbr || a.team_name;
    if (myAbbr && myAbbr !== "*") {
      const entities = this.config.entities || [];
      for (const entId of entities) {
        const otherState = this.hass.states[entId];
        if (otherState && otherState.attributes) {
          const oAttr = otherState.attributes;
          if ((oAttr.team_abbr === myAbbr || oAttr.team_name === myAbbr) && oAttr.team_logo) {
            return oAttr.team_logo;
          }
        }
      }
    }

    return a.league_logo || null;
  }

  _getMatchSides(a) {
    const isRacingOrEvent = !a.opponent_name && !a.opponent_abbr && (a.position !== undefined || a.event_name);

    if (isRacingOrEvent) {
      const athlete = this._resolveAthleteData(a, false);
      return {
        isRacing: true,
        team: {
          mainLogo: athlete.mainLogo || a.league_logo,
          flag: athlete.flag,
          name: athlete.name,
          pos: a.position !== undefined ? a.position : null,
          rec: a.team_record || null
        }
      };
    }

    let isHome = true;
    if (a.team_homeaway === 'away') {
      isHome = false;
    }

    const teamData = this._resolveAthleteData(a, false);
    const oppData = this._resolveAthleteData(a, true);

    const homeSide = isHome ? teamData : oppData;
    const awaySide = isHome ? oppData : teamData;

    const isHomeLeft = (this.config.home_team_position || 'left') === 'left';
    return {
      isRacing: false,
      left: isHomeLeft ? homeSide : awaySide,
      right: isHomeLeft ? awaySide : homeSide
    };
  }

  render() {
    if (!this.hass) return html``;
    const t = this._lang;
    const entities = this.config.entities || [];
    
    if (entities.length === 0) {
      return html`
        <ha-card style="padding: 16px; text-align: center; color: var(--secondary-text-color); font-style: italic;">
          ${t.no_entities}
        </ha-card>
      `;
    }

    const states = entities
      .map(id => this.hass.states[id])
      .filter(s => s && s.attributes && (s.attributes.team_abbr || s.attributes.team_name || s.attributes.league || s.attributes.sport));

    if (states.length === 0) {
       return html`<ha-card style="padding: 16px; text-align: center; opacity: 0.5;">(Warte auf Sensordaten...)</ha-card>`;
    }

    const prioId = this.config.priority_entity;
    const sortedStates = [...states].sort((a, b) => {
      const timeA = a.attributes.date ? new Date(a.attributes.date).getTime() : 9999999999999;
      const timeB = b.attributes.date ? new Date(b.attributes.date).getTime() : 9999999999999;
      if (timeA !== timeB) return timeA - timeB;
      if (a.entity_id === prioId && b.entity_id !== prioId) return -1;
      if (b.entity_id === prioId && a.entity_id !== prioId) return 1;
      return 0;
    });

    const seenMatches = new Set();
    const uniqueStates = [];

    for (const s of sortedStates) {
      const a = s.attributes;
      const hasOpponent = !!(a.opponent_abbr || a.opponent_name);
      const hasDate = !!a.date;
      const tAbbr = a.team_abbr || a.team_name || '';
      const oAbbr = a.opponent_abbr || a.opponent_name || '';

      if (hasOpponent && hasDate) {
        const dateStr = a.date.split('T')[0];
        const leagueStr = a.league || a.league_name || a.sport || '';
        const matchId = `${leagueStr}-${tAbbr}-${oAbbr}-${dateStr}`;
        const matchIdReverse = `${leagueStr}-${oAbbr}-${tAbbr}-${dateStr}`;

        if (!seenMatches.has(matchId) && !seenMatches.has(matchIdReverse)) {
          seenMatches.add(matchId);
          uniqueStates.push(s);
        }
      } else {
        const fallbackKey = s.entity_id;
        if (!seenMatches.has(fallbackKey)) {
          seenMatches.add(fallbackKey);
          uniqueStates.push(s);
        }
      }
    }

    const todayStr = new Date().toISOString().split('T')[0];
    let filteredList = uniqueStates.filter(s => {
      const a = s.attributes;
      const isRacing = !a.opponent_name && !a.opponent_abbr && (a.position !== undefined || a.event_name);
      const isOffSeason = s.state === 'NOT_FOUND' || s.state === 'BYE' || (!isRacing && !a.opponent_abbr && !a.opponent_name && !a.date);
      
      if (this.config.hide_offseason === true && isOffSeason) {
        return false;
      }

      if (this.config.only_today === true && s.state === 'POST') {
        return a.date?.split('T')[0] === todayStr;
      }

      return true;
    });

    let displayList = filteredList;
    if (this.config.show_next_only && !this.config.slider && filteredList.length > 0) {
      displayList = [filteredList[0]];
    }

    if (this.config.slider && displayList.length > 1) {
      if (this._currentSlide >= displayList.length) {
        this._currentSlide = 0;
      }
      return html`
        <ha-card 
          class="slider-card"
          @touchstart="${(e) => this._handleTouchStart(e)}"
          @touchend="${(e) => this._handleTouchEnd(e, displayList.length)}">
          
          <div class="slider-track" style="transform: translateX(-${this._currentSlide * 100}%);">
            ${displayList.map(stateObj => {
              const slideBg = this._resolveBackgroundColor(stateObj);
              const slideStyle = slideBg ? `background-color: ${slideBg};` : '';
              return html`
                <div class="slider-slide" style="${slideStyle}">
                  <div class="${this.config.layout === 'ultra' ? 'ultra-mode' : ''}">
                    ${this.renderCardContent(stateObj, t, true)}
                  </div>
                </div>
              `;
            })}
          </div>

          <div class="slider-nav">
            <button class="nav-arrow left" @click="${() => this._prevSlide(displayList.length)}">&#10094;</button>
            <div class="slider-dots">
              ${displayList.map((_, idx) => html`
                <span 
                  class="dot-indicator ${idx === this._currentSlide ? 'active' : ''}" 
                  @click="${() => this._setSlide(idx)}">
                </span>
              `)}
            </div>
            <button class="nav-arrow right" @click="${() => this._nextSlide(displayList.length)}">&#10095;</button>
          </div>
        </ha-card>
      `;
    }

    return html`
      <ha-card>
        <div class="${this.config.layout === 'ultra' ? 'ultra-mode' : ''}">
          ${displayList.map((stateObj, index) => html`
            ${this.renderCardContent(stateObj, t, false)}
            ${index < displayList.length - 1 ? html`<div class="spacer"></div>` : ''}
          `)}
        </div>
      </ha-card>
    `;
  }

  renderCardContent(stateObj, t, isInsideSlider) {
    const a = stateObj.attributes;
    const isRacing = !a.opponent_name && !a.opponent_abbr && (a.position !== undefined || a.event_name);
    const isOffSeason = stateObj.state === 'NOT_FOUND' || stateObj.state === 'BYE' || (!isRacing && !a.opponent_abbr && !a.opponent_name && !a.date);
    
    if (isOffSeason) {
      return this.config.layout === 'ultra'
        ? this.renderUltraNoMatch(stateObj, t, isInsideSlider)
        : this.renderNoMatch(stateObj, t, isInsideSlider);
    }
    return this.config.layout === 'ultra' 
      ? this.renderUltraMatch(stateObj, t, isInsideSlider) 
      : this.renderMatch(stateObj, t, isInsideSlider);
  }

  // --- STANDARD SPIELFREI / OFF-SEASON LAYOUT ---
  renderNoMatch(entityObj, t, isInsideSlider = false) {
    const a = entityObj.attributes;
    const s = entityObj.state;
    const customBg = isInsideSlider ? null : this._resolveBackgroundColor(entityObj);
    const customStyle = customBg ? `background-color: ${customBg};` : '';
    const showLeague = this.config.show_league !== false;
    const logoUrl = this._resolveBestTeamLogo(entityObj);
    const shadowClass = this.config.logo_shadow ? 'custom-logo-shadow' : '';
    const teamName = this._cleanName(a.team_name, a.team_abbr);

    return html`
      <div class="card-wrapper off-season-card" style="${customStyle}">
        ${showLeague ? html`
          <div class="header-bg">
            <div class="header">
              <div class="league-box">
                ${a.league_logo ? html`<img src="${a.league_logo}" class="league-logo" @error="${e => e.target.style.display='none'}">` : ''}
                <span>${a.league_name || a.league || ''}</span>
              </div>
            </div>
          </div>
        ` : ''}
        
        <div class="content no-match-content ${!showLeague ? 'extra-padding' : ''}">
          <div class="no-match-logo-wrap">
            ${logoUrl ? html`
              <img src="${logoUrl}" class="team-logo off-season-logo ${shadowClass}" @error="${e => e.target.style.display='none'}">` : html`
              <ha-icon icon="mdi:shield-outline" class="off-season-icon-fallback"></ha-icon>`}
          </div>
          <div class="no-match-message">
            <div class="no-match-team-name">${teamName}</div>
            <div class="no-match-title">${s === 'BYE' ? t.bye_week : t.no_upcoming_games}</div>
          </div>
        </div>
      </div>
    `;
  }

  // --- ULTRA-COMPACT SPIELFREI LAYOUT ---
  renderUltraNoMatch(entityObj, t, isInsideSlider = false) {
    const a = entityObj.attributes;
    const s = entityObj.state;
    const customBg = isInsideSlider ? null : this._resolveBackgroundColor(entityObj);
    const customStyle = customBg ? `background-color: ${customBg};` : '';
    const logoUrl = this._resolveBestTeamLogo(entityObj);
    const shadowClass = this.config.logo_shadow ? 'custom-logo-shadow' : '';
    const teamName = this._cleanName(a.team_abbr, a.team_name);

    return html`
      <div class="ultra-wrapper ultra-off-season" style="${customStyle}">
        <div class="ultra-team left">
          ${logoUrl ? html`<img src="${logoUrl}" class="ultra-logo ${shadowClass}" @error="${e => e.target.style.display='none'}">` : ''}
          <span class="ultra-abbr">${teamName}</span>
        </div>
        <div class="ultra-info">
          <span class="ultra-subtext" style="opacity: 0.95; font-size: 11px; font-weight: bold;">
            ${s === 'BYE' ? t.bye_week : t.no_upcoming_games}
          </span>
        </div>
        <div class="ultra-team right">
          ${a.league_logo ? html`<img src="${a.league_logo}" class="ultra-logo" style="opacity: 0.7;" @error="${e => e.target.style.display='none'}">` : ''}
        </div>
      </div>
    `;
  }

  renderMatch(entityObj, t, isInsideSlider = false) {
    const a = entityObj.attributes;
    const s = entityObj.state;
    const sides = this._getMatchSides(a);
    const delim = this.config.score_delimiter || ':';
    
    const kDate = a.date ? new Date(a.date) : null;
    const timeStr = kDate ? kDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
    const fullDateStr = kDate ? kDate.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';

    const showLeague = this.config.show_league !== false;
    const showLastPlay = this.config.show_last_play !== false;
    const showLocation = this.config.show_location !== false;
    const showTv = this.config.show_tv_network !== false;
    const marqueeEnabled = this.config.last_play_marquee === true;
    const shadowClass = this.config.logo_shadow ? 'custom-logo-shadow' : '';
    
    const customBg = isInsideSlider ? null : this._resolveBackgroundColor(entityObj);
    const customStyle = customBg ? `background-color: ${customBg};` : '';

    const hasLocation = showLocation && (a.venue || a.location);
    const hasTv = showTv && (a.tv_network || a.broadcast);
    const hasLastPlay = showLastPlay && s === 'IN' && a.last_play;
    const hasFooterContent = hasLocation || hasTv || hasLastPlay;

    return html`
      <div class="card-wrapper" style="${customStyle}">
        ${showLeague || s === 'IN' ? html`
          <div class="header-bg">
            <div class="header ${!showLeague ? 'no-league' : ''}">
              ${showLeague ? html`
                <div class="league-box">${a.league_logo ? html`<img src="${a.league_logo}" class="league-logo" @error="${e => e.target.style.display='none'}">` : ''}<span>${a.league_name || a.league || a.event_name || ''}</span></div>
              ` : ''}
              ${s === 'IN' ? html`<div class="live-status"><span class="dot"></span> ${t.live} / ${a.clock || 'LIVE'}</div>` : (s === 'POST' ? html`<div class="status-post">${t.finished}</div>` : '')}
            </div>
          </div>
        ` : ''}
        
        <div class="content ${!showLeague && s !== 'IN' ? 'extra-padding' : ''}">
          ${sides.isRacing ? html`
            <div class="team-box single-side">
              <div class="logo-badge-container">
                ${sides.team.mainLogo ? html`<img src="${sides.team.mainLogo}" class="team-logo ${shadowClass}" @error="${e => e.target.style.display='none'}">` : ''}
                ${sides.team.flag ? html`<img src="${sides.team.flag}" class="mini-flag" @error="${e => e.target.style.display='none'}">` : ''}
              </div>
              <div class="name">${sides.team.name}</div>
              ${sides.team.rec ? html`<div class="record">${sides.team.rec}</div>` : ''}
            </div>
            <div class="score-area">
              ${s === 'PRE' 
                ? html`<div class="kickoff-wrapper"><div class="kickoff-time">${timeStr}</div><div class="kickoff-date">${a.kickoff_in || ''}</div>${fullDateStr ? html`<div class="kickoff-exact">(${fullDateStr})</div>` : ''}</div>` 
                : html`<div class="racing-pos-box"><span class="racing-pos-label">${t.pos}</span><span class="score-nums">${sides.team.pos || '-'}</span></div>`
              }
            </div>
          ` : html`
            <div class="team-box">
              <div class="logo-badge-container">
                ${sides.left.mainLogo ? html`<img src="${sides.left.mainLogo}" class="team-logo ${shadowClass}" @error="${e => e.target.style.display='none'}">` : ''}
                ${sides.left.flag ? html`<img src="${sides.left.flag}" class="mini-flag" @error="${e => e.target.style.display='none'}">` : ''}
              </div>
              <div class="name">${sides.left.name}</div>
              ${this.config.show_record && sides.left.rec ? html`<div class="record">${sides.left.rec}</div>` : ''}
            </div>
            <div class="score-area">
              ${s === 'PRE' 
                ? html`<div class="kickoff-wrapper"><div class="kickoff-time">${timeStr}</div><div class="kickoff-date">${a.kickoff_in || ''}</div>${fullDateStr ? html`<div class="kickoff-exact">(${fullDateStr})</div>` : ''}</div>` 
                : html`<div class="score-nums">${sides.left.score !== undefined ? sides.left.score : 0} ${delim} ${sides.right.score !== undefined ? sides.right.score : 0}</div>`
              }
            </div>
            <div class="team-box">
              <div class="logo-badge-container">
                ${sides.right.mainLogo ? html`<img src="${sides.right.mainLogo}" class="team-logo ${shadowClass}" @error="${e => e.target.style.display='none'}">` : ''}
                ${sides.right.flag ? html`<img src="${sides.right.flag}" class="mini-flag" @error="${e => e.target.style.display='none'}">` : ''}
              </div>
              <div class="name">${sides.right.name}</div>
              ${this.config.show_record && sides.right.rec ? html`<div class="record">${sides.right.rec}</div>` : ''}
            </div>
          `}
        </div>

        ${hasFooterContent ? html`
          <div class="info-footer">
            ${hasLocation ? html`
              <div class="venue">${a.venue || ''}${a.location ? (a.venue ? `, ${a.location}` : a.location) : ''}</div>
            ` : ''}
            ${hasTv ? html`
              <div class="tv-network"><ha-icon icon="mdi:television" class="tv-icon"></ha-icon>${a.tv_network || a.broadcast}</div>
            ` : ''}
            ${hasLastPlay ? html`
              <div class="play-container ${marqueeEnabled ? 'marquee' : 'multiline'}">
                <div class="play">${a.last_play}</div>
              </div>
            ` : ''}
          </div>
        ` : ''}
      </div>
    `;
  }

  renderUltraMatch(entityObj, t, isInsideSlider = false) {
    const a = entityObj.attributes;
    const s = entityObj.state;
    const sides = this._getMatchSides(a);
    const delim = this.config.score_delimiter || ':';
    const shadowClass = this.config.logo_shadow ? 'custom-logo-shadow' : '';

    const kDate = a.date ? new Date(a.date) : null;
    const timeStr = kDate ? kDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
    const shortDateStr = kDate ? kDate.toLocaleDateString([], { day: '2-digit', month: '2-digit' }) : '';

    const customBg = isInsideSlider ? null : this._resolveBackgroundColor(entityObj);
    const customStyle = customBg ? `background-color: ${customBg};` : '';

    return html`
      <div class="ultra-wrapper ${s === 'IN' ? 'live-border' : ''}" style="${customStyle}">
        ${sides.isRacing ? html`
          <div class="ultra-team left">
            <div class="ultra-logo-wrap">
              ${sides.team.mainLogo ? html`<img src="${sides.team.mainLogo}" class="ultra-logo ${shadowClass}" @error="${e => e.target.style.display='none'}">` : ''}
              ${sides.team.flag ? html`<img src="${sides.team.flag}" class="mini-flag-ultra" @error="${e => e.target.style.display='none'}">` : ''}
            </div>
            <span class="ultra-abbr">${sides.team.name}</span>
          </div>
          <div class="ultra-info">
            ${s === 'PRE' 
              ? html`<span class="ultra-main-text">${shortDateStr}</span><span class="ultra-subtext">${timeStr}</span>` 
              : html`<span class="ultra-score live-text-large">${t.pos} ${sides.team.pos || '-'}</span><div class="ultra-subtext"><span>${s === 'IN' ? (a.clock || 'LIVE') : t.finished}</span></div>`
            }
          </div>
          <div class="ultra-team right">${a.league_logo ? html`<img src="${a.league_logo}" class="ultra-logo" @error="${e => e.target.style.display='none'}">` : ''}</div>
        ` : html`
          <div class="ultra-team left">
            <div class="ultra-logo-wrap">
              ${sides.left.mainLogo ? html`<img src="${sides.left.mainLogo}" class="ultra-logo ${shadowClass}" @error="${e => e.target.style.display='none'}">` : ''}
              ${sides.left.flag ? html`<img src="${sides.left.flag}" class="mini-flag-ultra" @error="${e => e.target.style.display='none'}">` : ''}
            </div>
            <span class="ultra-abbr">${sides.left.name}</span>
          </div>
          <div class="ultra-info">
            ${s === 'PRE' 
              ? html`<span class="ultra-main-text">${shortDateStr}</span><span class="ultra-subtext">${timeStr}</span>` 
              : html`<span class="ultra-score live-text-large">${sides.left.score !== undefined ? sides.left.score : 0}${delim}${sides.right.score !== undefined ? sides.right.score : 0}</span><div class="ultra-subtext"><span>${s === 'IN' ? (a.clock || 'LIVE') : t.finished}</span></div>`
            }
          </div>
          <div class="ultra-team right">
            <span class="ultra-abbr">${sides.right.name}</span>
            <div class="ultra-logo-wrap">
              ${sides.right.mainLogo ? html`<img src="${sides.right.mainLogo}" class="ultra-logo ${shadowClass}" @error="${e => e.target.style.display='none'}">` : ''}
              ${sides.right.flag ? html`<img src="${sides.right.flag}" class="mini-flag-ultra" @error="${e => e.target.style.display='none'}">` : ''}
            </div>
          </div>
        `}
      </div>
    `;
  }

  static get styles() {
    return css`
      ha-card { overflow: hidden; position: relative; }
      .card-wrapper { width: 100%; max-width: 100%; box-sizing: border-box; overflow: hidden; border-radius: inherit; transition: background-color 0.3s ease; }
      .spacer { height: 1px; background: var(--divider-color); opacity: 0.15; margin: 4px 16px; }
      .header-bg { background: rgba(255, 255, 255, 0.05); padding: 8px 12px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
      .header { display: flex; justify-content: space-between; align-items: center; font-size: 10px; font-weight: bold; min-height: 20px; }
      .header.no-league { justify-content: center; }
      .league-box { display: flex; align-items: center; }
      .league-logo { width: 18px; height: 18px; object-fit: contain; margin-right: 6px; }
      .live-status { color: #e74c3c; display: flex; align-items: center; }
      .status-post { opacity: 0.7; }
      .dot { height: 6px; width: 6px; background-color: #e74c3c; border-radius: 50%; display: inline-block; margin-right: 4px; animation: blink 1.5s infinite; }
      .content { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; width: 100%; box-sizing: border-box; }
      .extra-padding { padding-top: 12px; }
      .team-box { flex: 1; display: flex; flex-direction: column; align-items: center; text-align: center; }
      .team-box.single-side { flex: 1.5; }
      
      .logo-badge-container { display: flex; flex-direction: column; align-items: center; position: relative; }
      .team-logo { width: 48px; height: 48px; object-fit: contain; }
      .mini-flag { width: 18px; height: 12px; object-fit: cover; border-radius: 2px; margin-top: 3px; box-shadow: 0 1px 3px rgba(0,0,0,0.3); }
      
      .ultra-logo-wrap { display: flex; flex-direction: column; align-items: center; }
      .mini-flag-ultra { width: 14px; height: 9px; object-fit: cover; border-radius: 1px; margin-top: 1px; }

      .custom-logo-shadow { filter: drop-shadow(0 0 6px #d3d3d3) !important; }
      
      /* VOLLSTÄNDIGER NAME OHNE ABSCHNEIDEN MIT SCHÖNEM UMBRUCH */
      .name { 
        font-size: 13px; 
        font-weight: 800; 
        margin-top: 4px; 
        max-width: 130px; 
        white-space: normal; 
        line-height: 1.15; 
        word-break: normal; 
        text-align: center; 
      }
      .record { font-size: 10px; opacity: 0.6; }
      .score-area { flex: 1.5; display: flex; justify-content: center; align-items: center; }
      .kickoff-wrapper { text-align: center; }
      .score-nums { font-size: 30px; font-weight: 900; }
      .kickoff-time { font-size: 24px; font-weight: 800; line-height: 1; }
      .kickoff-date { font-size: 12px; font-weight: bold; margin-top: 2px; }
      .kickoff-exact { font-size: 10px; opacity: 0.6; }
      .racing-pos-box { display: flex; flex-direction: column; align-items: center; }
      .racing-pos-label { font-size: 11px; font-weight: bold; opacity: 0.7; text-transform: uppercase; }
      
      /* Off-Season Layout */
      .no-match-content { 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        gap: 20px; 
        padding: 16px 20px; 
        min-height: 80px; 
      }
      .no-match-logo-wrap { 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        width: 56px; 
        height: 56px; 
        border-radius: 50%; 
        flex-shrink: 0; 
      }
      .off-season-logo { 
        width: 44px; 
        height: 44px; 
        object-fit: contain; 
      }
      .off-season-icon-fallback { 
        --mdc-icon-size: 32px; 
        color: var(--secondary-text-color); 
        opacity: 0.8; 
      }
      .no-match-message { 
        display: flex; 
        flex-direction: column; 
        justify-content: center; 
        text-align: left; 
      }
      .no-match-team-name { 
        font-size: 17px; 
        font-weight: 800; 
        letter-spacing: 0.5px; 
        color: var(--primary-text-color); 
        line-height: 1.2; 
        margin-bottom: 2px; 
      }
      .no-match-title { 
        font-size: 14px; 
        font-weight: 500; 
        opacity: 0.85; 
        color: var(--primary-text-color); 
      }
      .ultra-off-season { 
        padding: 12px 16px; 
      }

      .info-footer { padding: 4px 12px; border-top: 1px solid var(--divider-color); text-align: center; font-size: 10px; opacity: 0.7; width: 100%; max-width: 100%; box-sizing: border-box; overflow: hidden; word-break: break-word; overflow-wrap: anywhere; }
      .venue { font-weight: bold; margin-bottom: 2px; }
      .tv-network { font-size: 10px; opacity: 0.85; display: inline-flex; align-items: center; justify-content: center; gap: 4px; margin-bottom: 2px; }
      .tv-icon { --mdc-icon-size: 12px; }
      .play-container { width: 100%; max-width: 100%; position: relative; margin-top: 4px; box-sizing: border-box; overflow: hidden; }
      .play-container.marquee { overflow: hidden; white-space: nowrap; }
      .play-container.multiline { white-space: normal; word-break: break-word; overflow-wrap: anywhere; }
      .play { display: inline-block; color: var(--primary-text-color); font-style: normal; max-width: 100%; }
      .marquee .play { max-width: none; padding-left: 100%; animation: marquee 15s linear infinite; }
      @keyframes marquee { 0% { transform: translate(0, 0); } 100% { transform: translate(-100%, 0); } }
      .ultra-wrapper { display: flex; align-items: center; justify-content: space-between; padding: 10px 16px; width: 100%; box-sizing: border-box; border-radius: inherit; transition: background-color 0.3s ease; position: relative; }
      .ultra-team { display: flex; align-items: center; gap: 8px; flex: 1; }
      .ultra-team.right { justify-content: flex-end; }
      .ultra-logo { width: 28px; height: 28px; object-fit: contain; }
      
      /* ULTRA-COMPACT NAME WRAPPING */
      .ultra-abbr { 
        font-size: 13px; 
        font-weight: 800; 
        max-width: 110px; 
        white-space: normal; 
        line-height: 1.1; 
        word-break: normal; 
      }
      .ultra-team.right .ultra-abbr { text-align: right; }
      
      .ultra-info { flex: 1.2; text-align: center; display: flex; flex-direction: column; line-height: 1.2; }
      .ultra-score, .ultra-main-text { font-size: 18px; font-weight: 900; }
      .live-text-large { font-size: 22px; font-weight: 900; color: #e74c3c; }
      .ultra-subtext { font-size: 10px; opacity: 0.7; font-weight: bold; display: flex; flex-direction: column; }
      
      .live-border::before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 3.5px;
        height: 34%;
        background-color: #e74c3c;
        border-radius: 0 4px 4px 0;
      }

      @keyframes blink { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }

      /* SLIDER / CAROUSEL STYLES */
      .slider-card { overflow: hidden; width: 100%; box-sizing: border-box; padding-bottom: 6px; }
      .slider-track { display: flex; transition: transform 0.3s cubic-bezier(0.25, 1, 0.5, 1); width: 100%; }
      .slider-slide { min-width: 100%; max-width: 100%; width: 100%; flex-shrink: 0; box-sizing: border-box; overflow: hidden; transition: background-color 0.3s ease; }
      .slider-nav { display: flex; align-items: center; justify-content: space-between; padding: 4px 12px 0; border-top: 1px solid rgba(128, 128, 128, 0.1); }
      .nav-arrow { background: none; border: none; font-size: 14px; cursor: pointer; color: var(--primary-text-color); opacity: 0.6; padding: 4px 8px; transition: opacity 0.2s ease; }
      .nav-arrow:hover { opacity: 1; }
      .slider-dots { display: flex; gap: 6px; align-items: center; }
      .dot-indicator { width: 6px; height: 6px; border-radius: 50%; background: var(--primary-text-color); opacity: 0.2; cursor: pointer; transition: all 0.2s ease; }
      .dot-indicator.active { opacity: 0.9; transform: scale(1.3); background: var(--primary-color); }
    `;
  }
}

customElements.define("compact-team-tracker", CompactTeamTracker);
window.customCards = window.customCards || [];
window.customCards.push({ type: "compact-team-tracker", name: "Compact Team Tracker", preview: true });
