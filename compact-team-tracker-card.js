console.log("!!! TEAM TRACKER v2.0.6-beta.7 !!!");

const LitElement = Object.getPrototypeOf(customElements.get("ha-panel-lovelace"));
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;

const LANG = {
  de: {
    manage_teams: "Teams verwalten",
    add_team: "Neues Team hinzufügen...",
    priority_label: "Priorität",
    prio_picker: "Haupt-Sensor auswählen",
    prio_help: "Dieses Team wird bevorzugt, falls mehrere Spiele zur exakt gleichen Zeit starten.",
    layout_section: "Erscheinungsbild",
    ultra_layout: "Ultra-Compact-Layout",
    show_league: "Kopfzeile anzeigen",
    match_info_section: "Spiel-Informationen",
    next_only: "Nur das nächste/aktuelle Spiel anzeigen",
    hide_finished: "Beendete Spiele ausblenden",
    hide_finished_help: "Versteckt Spiele vom Vortag automatisch um Mitternacht.",
    show_sun: "Statistiken (S-U-N) anzeigen",
    live_details_section: "Live-Details",
    show_last_play: "Letzten Spielzug anzeigen",
    last_play_help: "Zeigt bei Live-Spielen eine Textzusammenfassung des letzten Spielzugs an.",
    last_play_marquee: "Lauftext für letzten Spielzug nutzen",
    no_entities: "Bitte füge in der Konfiguration Teams hinzu (TeamTracker Integration erforderlich).",
    scheduled: "Geplant",
    finished: "Beendet",
    live: "LIVE"
  },
  en: {
    manage_teams: "Manage Teams",
    add_team: "Add new team...",
    priority_label: "Priority",
    prio_picker: "Select main sensor",
    prio_help: "This team will be preferred if multiple games start at the exact same time.",
    layout_section: "Appearance",
    ultra_layout: "Ultra-compact layout",
    show_league: "Show card header",
    match_info_section: "Match Information",
    next_only: "Show only next/current match",
    hide_finished: "Hide finished matches",
    hide_finished_help: "Automatically hides matches from previous days at midnight.",
    show_sun: "Show statistics (W-D-L)",
    live_details_section: "Live Details",
    show_last_play: "Show last play",
    last_play_help: "Displays a text summary of the most recent play during live games.",
    last_play_marquee: "Use marquee for last play",
    no_entities: "Please add teams (TeamTracker integration required).",
    scheduled: "Scheduled",
    finished: "Finished",
    live: "LIVE"
  }
};

class CompactTeamTrackerEditor extends LitElement {
  static get properties() { return { hass: {}, _config: {} }; }
  
  setConfig(config) {
    // FIX: Tiefe Kopie erstellen, um Schreibschutz zu umgehen
    this._config = JSON.parse(JSON.stringify(config));
    if (!this._config.entities) this._config.entities = [];
  }

  get _lang() {
    const l = this.hass?.language || 'de';
    return LANG[l] || LANG['en'];
  }

  render() {
    if (!this.hass || !this._config) return html``;
    const t = this._lang;

    return html`
      <div class="card-config">
        <div class="section-title">${t.manage_teams}</div>
        <div class="config-box">
          ${this._config.entities.map((ent, idx) => html`
            <div class="entity-row" key="${idx}">
              <ha-entity-picker 
                .label="${`Team ${idx + 1}`}" 
                .hass="${this.hass}" 
                .value="${ent}" 
                .includeDomains="${["sensor"]}" 
                @value-changed="${(ev) => this._entityChanged(idx, ev)}" 
                allow-custom-entity>
              </ha-entity-picker>
              <ha-icon icon="mdi:delete" class="delete-icon" @click="${() => this._removeEntity(idx)}"></ha-icon>
            </div>
          `)}
          <ha-entity-picker 
            .label="${t.add_team}" 
            .hass="${this.hass}" 
            .includeDomains="${["sensor"]}" 
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
            @value-changed="${this._prioChanged}" 
            allow-custom-entity>
          </ha-entity-picker>
        </div>

        <div class="section-title">${t.layout_section}</div>
        <div class="config-box">
          <div class="switch-row"><ha-switch .checked="${this._config.layout === 'ultra'}" .configValue="${"layout"}" @change="${this._toggleLayout}"></ha-switch><span>${t.ultra_layout}</span></div>
          <div class="switch-row"><ha-switch .checked="${this._config.show_league !== false}" .configValue="${"show_league"}" @change="${this._toggleOption}"></ha-switch><span>${t.show_league}</span></div>
        </div>

        <div class="section-title">${t.match_info_section}</div>
        <div class="config-box">
          <div class="switch-row"><ha-switch .checked="${this._config.show_next_only === true}" .configValue="${"show_next_only"}" @change="${this._toggleOption}"></ha-switch><span>${t.next_only}</span></div>
          <div class="switch-row"><ha-switch .checked="${this._config.only_today === true}" .configValue="${"only_today"}" @change="${this._toggleOption}"></ha-switch><span>${t.hide_finished}</span></div>
          <div class="switch-row"><ha-switch .checked="${this._config.show_record === true}" .configValue="${"show_record"}" @change="${this._toggleOption}"></ha-switch><span>${t.show_sun}</span></div>
        </div>

        <div class="section-title">${t.live_details_section}</div>
        <div class="config-box">
          <div class="switch-row"><ha-switch .checked="${this._config.show_last_play !== false}" .configValue="${"show_last_play"}" @change="${this._toggleOption}"></ha-switch><span>${t.show_last_play}</span></div>
          <div class="switch-row"><ha-switch .checked="${this._config.last_play_marquee === true}" .configValue="${"last_play_marquee"}" @change="${this._toggleOption}"></ha-switch><span>${t.last_play_marquee}</span></div>
        </div>
      </div>
    `;
  }

  _toggleLayout(ev) { this._updateConfig({ ...this._config, layout: ev.target.checked ? 'ultra' : 'standard' }); }
  _toggleOption(ev) { this._updateConfig({ ...this._config, [ev.target.configValue]: ev.target.checked }); }
  _entityChanged(idx, ev) {
    const newEntities = [...this._config.entities];
    newEntities[idx] = ev.detail.value;
    this._updateConfig({ ...this._config, entities: newEntities });
  }
  _addEntity(ev) {
    if (!ev.detail.value) return;
    const newEnts = [...this._config.entities, ev.detail.value];
    this._updateConfig({ ...this._config, entities: newEnts });
    ev.target.value = "";
  }
  _removeEntity(idx) { this._updateConfig({ ...this._config, entities: this._config.entities.filter((_, i) => i !== idx) }); }
  _prioChanged(ev) { this._updateConfig({ ...this._config, priority_entity: ev.detail.value }); }
  _updateConfig(newConfig) { this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: newConfig }, bubbles: true, composed: true })); }

  static get styles() { return css`
    .card-config { padding: 4px; }
    .section-title { font-weight: bold; font-size: 14px; margin: 16px 0 8px 0; color: var(--secondary-text-color); text-transform: uppercase; letter-spacing: 1px; }
    .config-box { background: rgba(128, 128, 128, 0.05); padding: 12px; border-radius: 8px; border: 1px solid rgba(128, 128, 128, 0.1); }
    .entity-row { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; } 
    ha-entity-picker { flex-grow: 1; } 
    .delete-icon { cursor: pointer; color: var(--error-color); } 
    .switch-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 8px; font-size: 14px; }
  `; }
}
customElements.define("compact-team-tracker-editor", CompactTeamTrackerEditor);

class CompactTeamTracker extends LitElement {
  static get properties() { return { hass: {}, config: {} }; }
  setConfig(config) { this.config = config; }
  static getConfigElement() { return document.createElement("compact-team-tracker-editor"); }
  static getStubConfig() { return { entities: [], layout: "standard", show_league: true, only_today: false }; }

  render() {
    if (!this.hass) return html``;
    const t = LANG[this.hass.language] || LANG['en'];
    const entities = this.config.entities || [];
    
    if (entities.length === 0) {
      return html`<ha-card style="padding: 16px; text-align: center;">${t.no_entities}</ha-card>`;
    }
    // Hier folgt die restliche Render-Logik (Match/UltraMatch)...
    return html`<ha-card>Vorschau aktiv für ${entities.length} Teams</ha-card>`;
  }
}
customElements.define("compact-team-tracker", CompactTeamTracker);
window.customCards = window.customCards || [];
window.customCards.push({ type: "compact-team-tracker", name: "Compact Team Tracker", preview: true });
