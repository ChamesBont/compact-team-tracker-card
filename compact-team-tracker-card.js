console.log("!!! TEAM TRACKER v2.0.6-beta.6 - PERSISTENT PICKER FIX !!!");

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
    if (!this._config.entities) this._config.entities = this._config.entity ? [this._config.entity] : [];

    // FIX: Wir laden die Card-Helpers aktiv. Dies "weckt" den ha-entity-picker auf,
    // genau wie es das Öffnen einer anderen Karte tun würde.
    if (!window.loadCardHelpers) return;
    this._helpers = await window.loadCardHelpers();
  }

  set hass(hass) {
    this._hass = hass;
    // Sobald hass verfügbar ist, erzwingen wir ein Update für alle Picker
    if (this._hass) {
      this.requestUpdate();
    }
  }

  get hass() {
    return this._hass;
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

        <div class="section-title">${t.priority_label}</div>
        <div class="config-box">
          <ha-entity-picker 
            .hass=${this.hass} 
            .value=${this._config.priority_entity || ''} 
            .label=${t.prio_picker}
            .includeDomains=${["sensor"]}
            @value-changed=${this._prioChanged}
            allow-custom-entity>
          </ha-entity-picker>
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

  _prioChanged(ev) {
    this._updateConfig({ ...this._config, priority_entity: ev.detail.value });
  }

  _updateConfig(newConfig) {
    this._config = newConfig;
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: newConfig }, bubbles: true, composed: true }));
  }

  static get styles() { return css`
    .card-config { padding: 4px; }
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
    if (states.length === 0) return html`<ha-card style="padding: 16px; text-align: center;">(Warte auf Team-Tracker Daten...)</ha-card>`;

    const prioId = this.config.priority_entity;
    const sortedStates = [...states].sort((a, b) => {
      const timeA = new Date(a.attributes.date).getTime();
      const timeB = new Date(b.attributes.date).getTime();
      if (timeA !== timeB) return timeA - timeB;
      if (a.entity_id === prioId) return -1;
      if (b.entity_id === prioId) return 1;
      return 0;
    });

    const seenMatches = new Set();
    const uniqueStates = [];
    for (const s of sortedStates) {
      const matchId = `${s.attributes.team_abbr}-${s.attributes.opponent_abbr}-${s.attributes.date?.split('T')[0]}`;
      const revMatchId = `${s.attributes.opponent_abbr}-${s.attributes.team_abbr}-${s.attributes.date?.split('T')[0]}`;
      if (!seenMatches.has(matchId) && !seenMatches.has(revMatchId)) {
        seenMatches.add(matchId);
        uniqueStates.push(s);
      }
    }

    const todayStr = new Date().toISOString().split('T')[0];
    let displayList = uniqueStates.filter(s => {
      if (this.config.only_today === true && s.state === 'POST') return s.attributes.date?.split('T')[0] === todayStr;
      return true;
    });

    if (this.config.show_next_only && displayList.length > 0) displayList = [displayList[0]];

    return html`
      <ha-card>
        <div class="${this.config.layout === 'ultra' ? 'ultra-mode' : ''}">
          ${displayList.map((stateObj, index) => html`
            ${this.config.layout === 'ultra' ? this.renderUltraMatch(stateObj, t) : this.renderMatch(stateObj, t)}
            ${index < displayList.length - 1 ? html`<div class="spacer"></div>` : ''}
          `)}
        </div>
      </ha-card>
    `;
  }

  renderMatch(entityObj, t) {
    const a = entityObj.attributes;
    const s = entityObj.state;
    const isHome = a.team_homeaway === 'home';
    const h = { logo: isHome ? a.team_logo : a.opponent_logo, abbr: isHome ? a.team_abbr : a.opponent_abbr, score: isHome ? a.team_score : a.opponent_score, rec: isHome ? a.team_record : a.opponent_record };
    const v = { logo: isHome ? a.opponent_logo : a.team_logo, abbr: isHome ? a.opponent_abbr : a.team_abbr, score: isHome ? a.opponent_score : a.team_score, rec: isHome ? a.opponent_record : a.team_record };
    
    const kDate = new Date(a.date);
    const timeStr = kDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const fullDateStr = kDate.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' });

    return html`
      <style>
        .card-wrapper { padding-bottom: 8px; }
        .header-bg { background: rgba(255, 255, 255, 0.05); padding: 8px 12px; margin-bottom: 8px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
        .header { display: flex; justify-content: space-between; align-items: center; font-size: 10px; font-weight: bold; }
        .league-box { display: flex; align-items: center; }
        .league-logo { width: 18px; height: 18px; margin-right: 6px; }
        .live-status { color: #e74c3c; display: flex; align-items: center; }
        .dot { height: 6px; width: 6px; background-color: #e74c3c; border-radius: 50%; margin-right: 4px; animation: blink 1.5s infinite; }
        .content { display: flex; align-items: center; justify-content: space-between; padding: 0 12px; }
        .team-box { flex: 1; display: flex; flex-direction: column; align-items: center; text-align: center; }
        .team-logo { width: 50px; height: 50px; object-fit: contain; }
        .name { font-size: 14px; font-weight: 800; margin-top: 4px; }
        .score-nums { font-size: 34px; font-weight: 900; }
        .kickoff-time { font-size: 24px; font-weight: 800; }
        .info-footer { margin-top: 10px; padding: 8px 12px 0; border-top: 1px solid var(--divider-color); text-align: center; font-size: 10px; opacity: 0.7; }
        @keyframes blink { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }
      </style>
      <div class="card-wrapper">
        <div class="header-bg">
          <div class="header">
            <div class="league-box"><img src="${a.league_logo}" class="league-logo"><span>${a.league_name || a.league}</span></div>
            ${s === 'IN' ? html`<div class="live-status"><span class="dot"></span> ${t.live} / ${a.clock}</div>` : html`<div>${t.scheduled}</div>`}
          </div>
        </div>
        <div class="content">
          <div class="team-box"><img src="${h.logo}" class="team-logo"><div class="name">${h.abbr}</div></div>
          <div style="flex: 1.5; text-align: center;">
            ${s === 'PRE' ? html`<div class="kickoff-time">${timeStr}</div><div>${a.kickoff_in}</div>` : html`<div class="score-nums">${h.score} : ${v.score}</div>`}
          </div>
          <div class="team-box"><img src="${v.logo}" class="team-logo"><div class="name">${v.abbr}</div></div>
        </div>
        <div class="info-footer">${a.venue}</div>
      </div>
    `;
  }

  renderUltraMatch(entityObj, t) {
    const a = entityObj.attributes;
    const s = entityObj.state;
    const isHome = a.team_homeaway === 'home';
    const h = { logo: isHome ? a.team_logo : a.opponent_logo, abbr: isHome ? a.team_abbr : a.opponent_abbr, score: isHome ? a.team_score || 0 : a.opponent_score || 0 };
    const v = { logo: isHome ? a.opponent_logo : a.team_logo, abbr: isHome ? a.opponent_abbr : a.team_abbr, score: isHome ? a.opponent_score || 0 : a.team_score || 0 };
    const kDate = new Date(a.date);
    const timeStr = kDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return html`
      <style>
        .ultra-wrapper { display: flex; align-items: center; justify-content: space-between; padding: 10px 16px; }
        .ultra-logo { width: 28px; height: 28px; object-fit: contain; }
        .ultra-abbr { font-size: 14px; font-weight: 800; margin: 0 8px; }
        .ultra-score { font-size: 18px; font-weight: 900; }
      </style>
      <div class="ultra-wrapper">
        <div style="display:flex; align-items:center;"><img src="${h.logo}" class="ultra-logo"><span class="ultra-abbr">${h.abbr}</span></div>
        <div class="ultra-score">${s === 'PRE' ? timeStr : h.score + ':' + v.score}</div>
        <div style="display:flex; align-items:center;"><span class="ultra-abbr">${v.abbr}</span><img src="${v.logo}" class="ultra-logo"></div>
      </div>
    `;
  }

  static get styles() { return css`
    ha-card { overflow: hidden; padding-bottom: 8px; }
    .spacer { height: 1px; background: var(--divider-color); opacity: 0.15; margin: 4px 16px; }
  `; }
}

customElements.define("compact-team-tracker", CompactTeamTracker);

window.customCards = window.customCards || [];
window.customCards.push({ 
  type: "compact-team-tracker", 
  name: "Compact Team Tracker", 
  description: "A compact card for sports tracking",
  preview: true 
});
