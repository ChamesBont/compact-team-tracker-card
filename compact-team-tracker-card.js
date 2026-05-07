console.log("!!! TEAM TRACKER v2.0.8-beta.9 !!!");

const LitElementBase = customElements.get("ha-panel-lovelace");

const html = LitElementBase.prototype.html;
const css = LitElementBase.prototype.css;

// =====================================================
// TRANSLATIONS
// =====================================================

const LANG = {
  de: {
    manage_teams: "Teams verwalten",
    add_team: "Neues Team hinzufügen...",
    priority_label: "Priorität",
    prio_picker: "Haupt-Sensor auswählen",
    prio_help:
      "Dieses Team wird bevorzugt, falls mehrere Spiele gleichzeitig starten.",
    layout_section: "Erscheinungsbild",
    ultra_layout: "Ultra-Compact-Layout",
    show_league: "Kopfzeile anzeigen",
    match_info_section: "Spiel-Informationen",
    next_only: "Nur nächstes/aktuelles Spiel anzeigen",
    hide_finished: "Beendete Spiele ausblenden",
    show_sun: "Statistik anzeigen",
    live_details_section: "Live-Details",
    show_last_play: "Letzten Spielzug anzeigen",
    last_play_marquee: "Lauftext nutzen",
    no_entities:
      "Bitte Teams hinzufügen.",
    finished: "Beendet",
    live: "LIVE",
  },

  en: {
    manage_teams: "Manage Teams",
    add_team: "Add new team...",
    priority_label: "Priority",
    prio_picker: "Select main sensor",
    prio_help:
      "Preferred team if games start simultaneously.",
    layout_section: "Appearance",
    ultra_layout: "Ultra compact layout",
    show_league: "Show header",
    match_info_section: "Match information",
    next_only: "Show next/current only",
    hide_finished: "Hide finished matches",
    show_sun: "Show statistics",
    live_details_section: "Live details",
    show_last_play: "Show last play",
    last_play_marquee: "Use marquee",
    no_entities:
      "Please add teams.",
    finished: "Finished",
    live: "LIVE",
  },
};

// =====================================================
// EDITOR
// =====================================================

class CompactTeamTrackerEditor extends LitElementBase {

  static get properties() {
    return {
      hass: {},
      _config: {},
    };
  }

  setConfig(config) {

    this._config = {
      entities: [],
      layout: "standard",
      show_league: true,
      show_next_only: false,
      only_today: false,
      show_record: false,
      show_last_play: true,
      last_play_marquee: false,
      ...config,
    };

    if (
      !this._config.entities &&
      this._config.entity
    ) {
      this._config.entities = [
        this._config.entity,
      ];
    }
  }

  get _lang() {
    const l = this.hass?.language || "de";
    return LANG[l] || LANG["en"];
  }

  render() {

    if (!this.hass || !this._config) {
      return html``;
    }

    const t = this._lang;

    return html`

      <div class="card-config">

        <div class="section-title">
          ${t.manage_teams}
        </div>

        <div class="config-box">

          ${this._config.entities.map(
            (ent, idx) => html`

              <div class="entity-row">

                <hui-entity-picker
                  .hass=${this.hass}
                  .value=${ent}
                  .label=${`Team ${idx + 1}`}
                  @value-changed=${(ev) =>
                    this._entityChanged(idx, ev)}
                >
                </hui-entity-picker>

                <ha-icon
                  icon="mdi:delete"
                  class="delete-icon"
                  @click=${() =>
                    this._removeEntity(idx)}
                >
                </ha-icon>

              </div>
            `
          )}

          <hui-entity-picker
            .hass=${this.hass}
            .label=${t.add_team}
            @value-changed=${this._addEntity}
          >
          </hui-entity-picker>

        </div>

        <div class="section-title">
          ${t.priority_label}
        </div>

        <div class="config-box">

          <hui-entity-picker
            .hass=${this.hass}
            .value=${this._config.priority_entity || ""}
            .label=${t.prio_picker}
            @value-changed=${this._prioChanged}
          >
          </hui-entity-picker>

          <p class="help-text">
            ${t.prio_help}
          </p>

        </div>

        <div class="section-title">
          ${t.layout_section}
        </div>

        <div class="config-box">

          <div class="switch-row">

            <ha-switch
              .checked=${this._config.layout === "ultra"}
              .configValue=${"layout"}
              @change=${this._toggleLayout}
            >
            </ha-switch>

            <span>${t.ultra_layout}</span>

          </div>

          <div class="switch-row">

            <ha-switch
              .checked=${this._config.show_league !== false}
              .configValue=${"show_league"}
              @change=${this._toggleOption}
            >
            </ha-switch>

            <span>${t.show_league}</span>

          </div>

        </div>

        <div class="section-title">
          ${t.match_info_section}
        </div>

        <div class="config-box">

          <div class="switch-row">

            <ha-switch
              .checked=${this._config.show_next_only === true}
              .configValue=${"show_next_only"}
              @change=${this._toggleOption}
            >
            </ha-switch>

            <span>${t.next_only}</span>

          </div>

          <div class="switch-row">

            <ha-switch
              .checked=${this._config.only_today === true}
              .configValue=${"only_today"}
              @change=${this._toggleOption}
            >
            </ha-switch>

            <span>${t.hide_finished}</span>

          </div>

          <div class="switch-row">

            <ha-switch
              .checked=${this._config.show_record === true}
              .configValue=${"show_record"}
              @change=${this._toggleOption}
            >
            </ha-switch>

            <span>${t.show_sun}</span>

          </div>

        </div>

        <div class="section-title">
          ${t.live_details_section}
        </div>

        <div class="config-box">

          <div class="switch-row">

            <ha-switch
              .checked=${this._config.show_last_play !== false}
              .configValue=${"show_last_play"}
              @change=${this._toggleOption}
            >
            </ha-switch>

            <span>${t.show_last_play}</span>

          </div>

          <div class="switch-row">

            <ha-switch
              .checked=${this._config.last_play_marquee === true}
              .configValue=${"last_play_marquee"}
              @change=${this._toggleOption}
            >
            </ha-switch>

            <span>${t.last_play_marquee}</span>

          </div>

        </div>

      </div>
    `;
  }

  _toggleLayout(ev) {

    this._updateConfig({
      ...this._config,
      layout: ev.target.checked
        ? "ultra"
        : "standard",
    });
  }

  _toggleOption(ev) {

    this._updateConfig({
      ...this._config,
      [ev.target.configValue]:
        ev.target.checked,
    });
  }

  _entityChanged(idx, ev) {

    const entities = [
      ...this._config.entities,
    ];

    entities[idx] = ev.detail.value;

    this._updateConfig({
      ...this._config,
      entities,
    });
  }

  _addEntity(ev) {

    if (!ev.detail.value) return;

    const entities = [
      ...(this._config.entities || []),
      ev.detail.value,
    ];

    this._updateConfig({
      ...this._config,
      entities,
    });

    ev.target.value = "";
  }

  _removeEntity(idx) {

    this._updateConfig({
      ...this._config,
      entities:
        this._config.entities.filter(
          (_, i) => i !== idx
        ),
    });
  }

  _prioChanged(ev) {

    this._updateConfig({
      ...this._config,
      priority_entity:
        ev.detail.value,
    });
  }

  _updateConfig(config) {

    this.dispatchEvent(
      new CustomEvent(
        "config-changed",
        {
          detail: { config },
          bubbles: true,
          composed: true,
        }
      )
    );
  }

  static get styles() {

    return css`

      .card-config {
        padding: 4px;
      }

      .section-title {
        font-weight: bold;
        font-size: 14px;
        margin: 16px 0 8px 0;
        color: var(--secondary-text-color);
      }

      .config-box {
        background: rgba(128,128,128,0.05);
        padding: 12px;
        border-radius: 8px;
      }

      .entity-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
      }

      hui-entity-picker {
        flex-grow: 1;
      }

      .delete-icon {
        cursor: pointer;
        color: var(--error-color);
      }

      .switch-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
      }

      .help-text {
        font-size: 12px;
        opacity: 0.7;
      }

    `;
  }
}

customElements.define(
  "compact-team-tracker-editor",
  CompactTeamTrackerEditor
);

// =====================================================
// CARD
// =====================================================

class CompactTeamTracker extends LitElementBase {

  static get properties() {
    return {
      hass: {},
      config: {},
    };
  }

  setConfig(config) {
    this.config = config;
  }

  static getConfigElement() {
    return document.createElement(
      "compact-team-tracker-editor"
    );
  }

  static getStubConfig() {
    return {
      entities: [],
    };
  }

  render() {

    if (!this.hass) {
      return html``;
    }

    const entities =
      this.config.entities || [];

    if (!entities.length) {

      return html`
        <ha-card style="padding:16px">
          Keine Teams konfiguriert
        </ha-card>
      `;
    }

    const validStates = entities
      .map((e) => this.hass.states[e])
      .filter(Boolean);

    return html`

      <ha-card>

        ${validStates.map((stateObj) => {

          const a = stateObj.attributes;

          return html`

            <div class="match">

              <div class="team">
                ${a.team_abbr || "?"}
              </div>

              <div class="score">
                ${a.team_score ?? "-"}
                :
                ${a.opponent_score ?? "-"}
              </div>

              <div class="team">
                ${a.opponent_abbr || "?"}
              </div>

            </div>

          `;
        })}

      </ha-card>
    `;
  }

  static get styles() {

    return css`

      .match {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        border-bottom:
          1px solid var(--divider-color);
      }

      .team {
        font-weight: bold;
      }

      .score {
        font-size: 20px;
        font-weight: bold;
      }

    `;
  }
}

customElements.define(
  "compact-team-tracker",
  CompactTeamTracker
);

window.customCards =
  window.customCards || [];

window.customCards.push({
  type: "compact-team-tracker",
  name: "Compact Team Tracker",
  description:
    "Compact sports tracker card",
  preview: true,
});
