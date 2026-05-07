console.log("!!! TEAM TRACKER v2.0.6-beta.10 - PICKER FIX !!!");

const LitElement = Object.getPrototypeOf(customElements.get("ha-panel-lovelace"));
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;

const LANG = {
  de: {
    manage_teams: "Teams verwalten",
    add_team: "Team suchen...",
    priority_label: "Priorität",
    prio_picker: "Haupt-Sensor",
    ultra_layout: "Ultra-Compact-Layout",
    no_entities: "Keine Teams konfiguriert."
  },
  en: {
    manage_teams: "Manage Teams",
    add_team: "Search team...",
    priority_label: "Priority",
    prio_picker: "Main Sensor",
    ultra_layout: "Ultra-compact layout",
    no_entities: "No teams configured."
  }
};

class CompactTeamTrackerEditor extends LitElement {
  static get properties() {
    return {
      hass: {},
      _config: {}
    };
  }

  setConfig(config) {
    // Erstellt eine Kopie der Config, um Schreibfehler zu vermeiden
    this._config = { ...config };
    if (!this._config.entities) this._config.entities = [];
  }

  get _lang() {
    return LANG[this.hass?.language] || LANG['en'];
  }

  render() {
    if (!this.hass || !this._config) return html``;
    const t = this._lang;

    return html`
      <div class="card-config">
        <div class="section-title">${t.manage_teams}</div>
        
        <div class="config-box">
          ${this._config.entities.map((ent, idx) => html`
            <div class="entity-row">
              <ha-entity-picker
                .hass="${this.hass}"
                .value="${ent}"
                .label="${`Team ${idx + 1}`}"
                .includeDomains="${['sensor']}"
                @value-changed="${(ev) => this._entityChanged(idx, ev)}"
                allow-custom-entity
              ></ha-entity-picker>
              <ha-icon icon="mdi:delete" class="delete-icon" @click="${() => this._removeEntity(idx)}"></ha-icon>
            </div>
          `)}

          <div class="add-row">
            <ha-entity-picker
              .hass="${this.hass}"
              .label="${t.add_team}"
              .includeDomains="${['sensor']}"
              @value-changed="${this._addEntity}"
              allow-custom-entity
            ></ha-entity-picker>
          </div>
        </div>
      </div>
    `;
  }

  _entityChanged(idx, ev) {
    if (!this._config || !ev.detail.value) return;
    const newEntities = [...this._config.entities];
    newEntities[idx] = ev.detail.value;
    this._updateConfig({ ...this._config, entities: newEntities });
  }

  _addEntity(ev) {
    if (!this._config || !ev.detail.value) return;
    const newEnts = [...this._config.entities, ev.detail.value];
    this._updateConfig({ ...this._config, entities: newEnts });
    ev.target.value = ""; // Feld nach dem Hinzufügen leeren
  }

  _removeEntity(idx) {
    const newEntities = this._config.entities.filter((_, i) => i !== idx);
    this._updateConfig({ ...this._config, entities: newEntities });
  }

  _updateConfig(newConfig) {
    this.dispatchEvent(new CustomEvent("config-changed", {
      detail: { config: newConfig },
      bubbles: true,
      composed: true
    }));
  }

  static get styles() {
    return css`
      .card-config { padding: 8px; }
      .section-title { font-weight: bold; margin-bottom: 8px; color: var(--secondary-text-color); text-transform: uppercase; font-size: 12px; }
      .config-box { background: var(--secondary-background-color); padding: 12px; border-radius: 8px; }
      .entity-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
      ha-entity-picker { flex-grow: 1; }
      .delete-icon { cursor: pointer; color: var(--error-color); }
      .add-row { margin-top: 16px; border-top: 1px solid var(--divider-color); padding-top: 16px; }
    `;
  }
}

customElements.define("compact-team-tracker-editor", CompactTeamTrackerEditor);

class CompactTeamTracker extends LitElement {
  static get properties() { return { hass: {}, config: {} }; }
  setConfig(config) { this.config = config; }
  static getConfigElement() { return document.createElement("compact-team-tracker-editor"); }
  static getStubConfig() { return { entities: [], layout: "standard" }; }

  render() {
    if (!this.hass || !this.config) return html``;
    const entities = this.config.entities || [];
    if (entities.length === 0) {
      return html`<ha-card style="padding: 16px;">Bitte Teams im Editor hinzufügen.</ha-card>`;
    }
    return html`<ha-card style="padding: 16px;">${entities.length} Teams geladen.</ha-card>`;
  }
}

customElements.define("compact-team-tracker", CompactTeamTracker);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "compact-team-tracker",
  name: "Compact Team Tracker",
  preview: true
});
