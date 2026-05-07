console.log("!!! TEAM TRACKER v2.0.8-beta.9 !!!");

const LitElement = customElements.get("ha-panel-lovelace");
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;

// --- TRANSLATIONS ---
const LANG = {
  de: {
    manage_teams: "Teams verwalten",
    add_team: "Neues Team hinzufügen...",
    priority_label: "Priorität",
    prio_picker: "Haupt-Sensor auswählen",
    prio_help:
      "Dieses Team wird bevorzugt, falls mehrere Spiele zur exakt gleichen Zeit starten.",
    layout_section: "Erscheinungsbild",
    ultra_layout: "Ultra-Compact-Layout",
    show_league: "Kopfzeile anzeigen",
    match_info_section: "Spiel-Informationen",
    next_only: "Nur nächstes/aktuelles Spiel anzeigen",
    hide_finished: "Beendete Spiele ausblenden",
    hide_finished_help:
      "Blendet Spiele vom Vortag automatisch aus.",
    show_sun: "Statistik anzeigen (S-U-N)",
    live_details_section: "Live-Details",
    show_last_play: "Letzten Spielzug anzeigen",
    last_play_help:
      "Zeigt eine Textzusammenfassung des letzten Spielzugs.",
    last_play_marquee: "Lauftext für letzten Spielzug",
    no_entities:
      "Bitte Teams hinzufügen, um eine Vorschau zu sehen.",
    finished: "Beendet",
    live: "LIVE",
  },

  en: {
    manage_teams: "Manage Teams",
    add_team: "Add new team...",
    priority_label: "Priority",
    prio_picker: "Select main sensor",
    prio_help:
      "This team will be preferred if multiple games start at the exact same time.",
    layout_section: "Appearance",
    ultra_layout: "Ultra-compact layout",
    show_league: "Show card header",
    match_info_section: "Match Information",
    next_only: "Show only next/current match",
    hide_finished: "Hide finished matches",
    hide_finished_help:
      "Automatically hides previous matches.",
    show_sun: "Show statistics (W-D-L)",
    live_details_section: "Live Details",
    show_last_play: "Show last play",
    last_play_help:
      "Displays a summary of the most recent play.",
    last_play_marquee: "Use marquee for last play",
    no_entities:
      "Please add teams to see a preview.",
    finished: "Finished",
    live: "LIVE",
  },
};

// =====================================================
// EDITOR
// =====================================================

class CompactTeamTrackerEditor extends LitElement {

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

        <!-- TEAMS -->

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
                  .includeDomains=${["sensor"]}
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
            .includeDomains=${["sensor"]}
            @value-changed=${this._addEntity}
          >
          </hui-entity-picker>

        </div>

        <!-- PRIORITY -->

        <div class="section-title">
          ${t.priority_label}
        </div>

        <div class="config-box">

          <hui-entity-picker
            .hass=${this.hass}
            .value=${this._config.priority_entity || ""}
            .label=${t.prio_picker}
            .includeDomains=${["sensor"]}
            @value-changed=${this._prioChanged}
          >
          </hui-entity-picker>

          <p class="help-text">
            ${t.prio_help}
          </p>

        </div>

        <!-- APPEARANCE -->

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

        <!-- MATCH INFO -->

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

          <p class="help-text">
            ${t.hide_finished_help}
          </p>

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

        <!-- LIVE -->

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

          <p class="help-text">
            ${t.last_play_help}
          </p>

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

  // =====================================================
  // ACTIONS
  // =====================================================

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

    if (!ev.detail.value) {
      return;
    }

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

  // =====================================================
  // STYLES
  // =====================================================

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
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .config-box {
        background: rgba(128,128,128,0.05);
        padding: 12px;
        border-radius: 8px;
        border: 1px solid rgba(128,128,128,0.1);
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
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 8px;
        font-size: 14px;
      }

      .help-text {
        font-size: 12px;
        opacity: 0.6;
        margin: 4px 0 8px 0;
        line-height: 1.2;
        font-style: italic;
      }

    `;
  }
}

customElements.define(
  "compact-team-tracker-editor",
  CompactTeamTrackerEditor
);
