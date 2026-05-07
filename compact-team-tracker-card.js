console.log("!!! TEAM TRACKER v2.0.6-beta.6 - CARD-HELPERS FIX !!!");

const LitElement = Object.getPrototypeOf(customElements.get("ha-panel-lovelace"));
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;

// --- ÜBERSETZUNGEN ---
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
    no_entities: "Bitte füge in der Konfiguration Teams hinzu, um die Vorschau zu sehen.",
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
    no_entities: "Please add teams in the configuration to see the preview.",
    scheduled: "Scheduled",
    finished: "Finished",
    live: "LIVE"
  }
};

// --- EDITOR ---
class CompactTeamTrackerEditor extends LitElement {
  static get properties() { return { hass: {}, _config: {} }; }
  
  async setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config));
    if (!this._config.entities) this._config.entities = [];

    // Lade Card-Helpers, um sicherzustellen, dass ha-entity-picker registriert ist
    if (window.loadCardHelpers) {
      this._helpers = await window.loadCardHelpers();
    }
  }

  get _lang() {
    return LANG[this.hass?.language] || LANG['en'];
  }

  render() {
    if (!this.hass || !this._config) return html`<div>Lade Konfiguration...</div>`;
    const t = this._lang;

    return html`
      <div class="card-config">
        <div class="section-title">${t.manage_teams}</div>
        <div class="config-box">
          ${this._config.entities.map((ent, idx) => html`
            <div class="entity-row" key="row-${idx}">
              <ha-entity-picker 
                .hass=${this.hass} 
                .value=${ent} 
                .label=${`Team ${idx + 1}`}
                .includeDomains=${["sensor"]}
                @value-changed=${(ev) => this._entityChanged(idx, ev)}
                allow-custom-entity>
              </ha-entity-picker>
              <ha-icon icon="mdi:delete" class="delete-icon" @click=${() => this._removeEntity(idx)}></ha-icon>
            </div>
          `)}
          
          <div class="add-row">
            <ha-entity-picker 
              .hass=${this.hass} 
              .label=${t.add_team}
              .includeDomains=${["sensor"]}
              @value-changed=${this._addEntity}
              allow-custom-entity>
            </ha-entity-picker>
          </div>
        </div>

        <div class="section-title">${t.layout_section}</div>
        <div class="config-box">
          <div class="switch-row">
            <ha-switch .checked=${this._config.layout === 'ultra'} @change=${this._toggleLayout}></ha-switch>
            <span>${t.ultra_layout}</span>
          </div>
          <div class="switch-row">
            <ha-switch .checked=${this._config.show_league !== false} .configValue=${"show_league"} @change=${this._toggleOption}></ha-switch>
            <span>${t.show_league}</span>
          </div>
        </div>
      </div>
    `;
  }

  _toggleLayout(ev) { this._updateConfig({ ...this._config, layout: ev.target.checked ? 'ultra' : 'standard' }); }
  _toggleOption(ev) { this._updateConfig({ ...this._config, [ev.target.configValue]: ev.target.checked }); }
  
  _entityChanged(idx, ev) {
    if (!ev.detail.value) return;
    const newEntities = [...this._config.entities];
    newEntities[idx] = ev.detail.value;
    this._updateConfig({ ...this._config, entities: newEntities });
  }

  _addEntity(ev) {
    const val = ev.detail.value;
    if (!val) return;
    const newEnts = [...this._config.entities, val];
    this._updateConfig({ ...this._config, entities: newEnts });
    ev.target.value = "";
  }

  _removeEntity(idx) {
    const newEntities = this._config.entities.filter((_, i) => i !== idx);
    this._updateConfig({ ...this._config, entities: newEntities });
  }

  _updateConfig(newConfig) {
    this._config = newConfig;
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: newConfig }, bubbles: true, composed: true }));
  }

  static get styles() { return css`
    .card-config { padding: 8px; }
    .section-title { font-weight: bold; font-size: 12px; margin: 16px 0 8px; color: var(--secondary-text-color); text-transform: uppercase; }
    .config-box { background: rgba(128, 128, 128, 0.05); padding: 12px; border-radius: 8px; border: 1px solid rgba(128, 128, 128, 0.1); }
    .entity-row { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
    ha-entity-picker { flex-grow: 1; }
    .delete-icon { cursor: pointer; color: var(--error-color); }
    .switch-row { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; font-size: 14px; }
    .add-row { margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(128, 128, 128, 0.1); }
  `; }
}
customElements.define("compact-team-tracker-editor", CompactTeamTrackerEditor);

// --- KARTE ---
class CompactTeamTracker extends LitElement {
  static get properties() { return { hass: {}, config: {} }; }
  setConfig(config) { this.config = config; }
  static getConfigElement() { return document.createElement("compact-team-tracker-editor"); }
  static getStubConfig() { return { entities: [], layout: "standard", show_league: true, only_today: false }; }

  render() {
    if (!this.hass || !this.config) return html``;
    const t = LANG[this.hass.language] || LANG['en'];
    const entities = this.config.entities || [];
    
    if (entities.length === 0) return html`<ha-card style="padding: 16px; text-align: center;">${t.no_entities}</ha-card>`;

    const states = entities.map(id => this.hass.states[id]).filter(s => s && s.attributes && s.attributes.team_abbr);
    if (states.length === 0) return html`<ha-card style="padding: 16px; text-align: center;">(Warte auf Daten...)</ha-card>`;

    // ... (Hier folgt deine restliche Render-Logik aus v2.0.6-beta.4)
    return html`<ha-card style="padding: 16px; text-align: center;">${entities.length} Teams geladen.</ha-card>`;
  }
}
customElements.define("compact-team-tracker", CompactTeamTracker);

window.customCards = window.customCards || [];
window.customCards.push({ 
  type: "compact-team-tracker", 
  name: "Compact Team Tracker", 
  description: "A compact card for sports tracking",
  preview: true 
});
