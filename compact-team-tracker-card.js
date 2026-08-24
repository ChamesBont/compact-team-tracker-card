console.log("!!! TEAM TRACKER v2.9.3 !!!");

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
    home_position_label: "Heimteam-Position",
    home_left: "Links (Europäischer Standard)",
    home_right: "Rechts (US / Away @ Home)",
    delimiter_label: "Spielstand-Trennzeichen",
    delimiter_colon: "Doppelpunkt ( : )",
    delimiter_dash: "Bindestrich ( - )",
    match_info_section: "Spiel-Informationen",
    next_only: "Nur das nächste/aktuelle Spiel anzeigen",
    hide_finished: "Beendete & spielfreie Tage ausblenden",
    hide_finished_help: "Versteckt vergangene Spiele sowie Teams ohne anstehende Spiele.",
    show_sun: "Statistiken (S-U-N) anzeigen",
    live_details_section: "Live-Details",
    show_last_play: "Letzten Spielzug anzeigen",
    last_play_help: "Zeigt bei Live-Spielen eine Textzusammenfassung des letzten Spielzugs an.",
    last_play_marquee: "Lauftext für letzten Spielzug nutzen",
    no_entities: "Bitte füge in der Konfiguration Teams hinzu, um die Vorschau zu sehen.",
    bg_color: "Hintergrundfarbe (optional):",
    reset: "Zurücksetzen",
    scheduled: "Geplant",
    finished: "Beendet",
    live: "LIVE",
    no_upcoming_games: "Keine anstehenden Spiele",
    bye_week: "Spielfrei (Bye-Week)",
    until: "bis"
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
    home_position_label: "Home team position",
    home_left: "Left (European standard)",
    home_right: "Right (US / Away @ Home)",
    delimiter_label: "Score delimiter",
    delimiter_colon: "Colon ( : )",
    delimiter_dash: "Dash ( - )",
    match_info_section: "Match Information",
    next_only: "Show only next/current match",
    hide_finished: "Hide finished & off-season matches",
    hide_finished_help: "Hides past matches and sensors without scheduled games.",
    show_sun: "Show statistics (W-D-L)",
    live_details_section: "Live Details",
    show_last_play: "Show last play",
    last_play_help: "Displays a text summary of the most recent play during live games.",
    last_play_marquee: "Use marquee for last play",
    no_entities: "Please add teams in the configuration to see the preview.",
    bg_color: "Background color (optional):",
    reset: "Reset",
    scheduled: "Scheduled",
    finished: "Finished",
    live: "LIVE",
    no_upcoming_games: "No upcoming matches",
    bye_week: "Bye Week",
    until: "until"
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
                <span class="team-number-label">Team ${idx + 1}</span>
                <ha-icon 
                  icon="mdi:trash-can-outline" 
                  class="delete-icon" 
                  title="Team entfernen"
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

          <div class="select-row">
            <label class="select-label">${t.home_position_label}</label>
            <select class="custom-select" .value="${homePos}" @change="${(e) => this._selectOption('home_team_position', e.target.value)}">
              <option value="left" ?selected="${homePos === 'left'}">${t.home_left}</option>
              <option
