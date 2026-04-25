console.log("!!! TEAM TRACKER v2.0.0 (i18n) GELADEN !!!");

const LitElement = Object.getPrototypeOf(customElements.get("ha-panel-lovelace"));
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;

// --- ÜBERSETZUNGEN ---
const LANG = {
  de: {
    manage_teams: "Teams verwalten:",
    add_team: "Neues Team hinzufügen...",
    priority_label: "Priorität:",
    prio_picker: "Haupt-Sensor auswählen",
    prio_help: "Wähle deinen Haupt-Sensor aus. Dieses Team wird bevorzugt, falls mehrere Spiele zur exakt gleichen Zeit starten.",
    options_label: "Optionen:",
    next_only: "Nur das nächste/aktuelle Spiel anzeigen",
    ultra_layout: "Ultra-Compact-Layout",
    show_league: "Liga-Informationen anzeigen",
    hide_finished: "Beendete Spiele ausblenden",
    hide_finished_help: "Versteckt Spiele vom Vortag automatisch um Mitternacht, damit nur der aktuelle Spieltag sichtbar bleibt.",
    show_scorers: "Torschützen auflisten",
    show_sun: "Statistiken (S-U-N) anzeigen",
    scheduled: "Geplant",
    finished: "Beendet",
    live: "LIVE"
  },
  en: {
    manage_teams: "Manage Teams:",
    add_team: "Add new team...",
    priority_label: "Priority:",
    prio_picker: "Select main sensor",
    prio_help: "Select your main sensor. This team will be preferred if multiple games start at the exact same time.",
    options_label: "Options:",
    next_only: "Show only next/current match",
    ultra_layout: "Ultra-compact layout",
    show_league: "Show league information",
    hide_finished: "Hide finished matches",
    hide_finished_help: "Automatically hides matches from previous days at midnight to keep the dashboard clean.",
    show_scorers: "List scorers",
    show_sun: "Show statistics (W-D-L)",
    scheduled: "Scheduled",
    finished: "Finished",
    live: "LIVE"
  }
};

// --- EDITOR v2.0.0 ---
class CompactTeamTrackerEditor extends LitElement {
  static get properties() { return { hass: {}, _config: {} }; }
  
  setConfig(config) {
    this._config = config;
    if (!this._config.entities) this._config.entities = this._config.entity ? [this._config.entity] : [];
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
        <div class="label">${t.manage_teams}</div>
        ${this._config.entities.map((ent, idx) => html`
          <div class="entity-row" key="${idx}">
            <ha-entity-picker .label="${`Team ${idx + 1}`}" .hass="${this.hass}" .value="${ent}" .includeDomains="${["sensor"]}" @value-changed="${(ev) => this._entityChanged(idx, ev)}" allow-custom-entity></ha-entity-picker>
            <ha-icon icon="mdi:delete" class="delete-icon" @click="${() => this._removeEntity(idx)}"></ha-icon>
          </div>
        `)}
        <ha-entity-picker .label="${t.add_team}" .hass="${this.hass}" .includeDomains="${["sensor"]}" @value-changed="${this._addEntity}"></ha-entity-picker>
        
        <div class="prio-section">
          <div class="label">${t.priority_label}</div>
          <ha-entity-picker 
            .label="${t.prio_picker}" 
            .hass="${this.hass}" 
            .value="${this._config.priority_entity || ''}" 
            .includeDomains="${["sensor"]}" 
            @value-changed="${this._prioChanged}" 
            allow-custom-entity>
          </ha-entity-picker>
          <p class="help-text">${t.prio_help}</p>
          
          <div class="label">${t.options_label}</div>

          <div class="switch-row">
            <ha-switch .checked="${this._config.show_next_only === true}" .configValue="${"show_next_only"}" @change="${this._toggleOption}"></ha-switch>
            <span>${t.next_only}</span>
          </div>
          
          <div class="switch-row">
            <ha-switch .checked="${this._config.layout === 'ultra'}" .configValue="${"layout"}" @change="${this._toggleLayout}"></ha-switch>
            <span>${t.ultra_layout}</span>
          </div>

          <div class="switch-row">
            <ha-switch .checked="${this._config.show_league !== false}" .configValue="${"show_league"}" @change="${this._toggleOption}"></ha-switch>
            <span>${t.show_league}</span>
          </div>

          <div class="switch-row">
            <ha-switch .checked="${this._config.only_today !== false}" .configValue="${"only_today"}" @change="${this._toggleOption}"></ha-switch>
            <span>${t.hide_finished}</span>
          </div>
          <p class="help-text">${t.hide_finished_help}</p>

          <div class="switch-row">
            <ha-switch .checked="${this._config.show_scorers === true}" .configValue="${"show_scorers"}" @change="${this._toggleOption}"></ha-switch>
            <span>${t.show_scorers}</span>
          </div>
          
          <div class="switch-row">
            <ha-switch .checked="${this._config.show_record === true}" .configValue="${"show_record"}" @change="${this._toggleOption}"></ha-switch>
            <span>${t.show_sun}</span>
          </div>
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
    this._updateConfig({ ...this._config, entities: [...this._config.entities, ev.detail.value] });
    ev.target.value = "";
  }
  _removeEntity(idx) { this._updateConfig({ ...this._config, entities: this._config.entities.filter((_, i) => i !== idx) }); }
  _prioChanged(ev) { this._updateConfig({ ...this._config, priority_entity: ev.detail.value }); }
  _updateConfig(newConfig) { this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: newConfig }, bubbles: true, composed: true })); }
  
  static get styles() { return css`
    .card-config { padding: 10px; } 
    .label { font-weight: bold; margin: 10px 0; display: block; } 
    .entity-row { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; } 
    ha-entity-picker { flex-grow: 1; } 
    .delete-icon { cursor: pointer; color: var(--error-color); } 
    .prio-section { margin-top: 20px; padding-top: 15px; border-top: 1px solid var(--divider-color); } 
    .switch-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 12px; font-size: 14px; }
    .help-text { font-size: 11px; opacity: 0.6; margin: 4px 0 12px 0; line-height: 1.3; font-style: italic; }
  `; }
}
customElements.define("compact-team-tracker-editor", CompactTeamTrackerEditor);

// --- KARTE v2.0.0 ---
class CompactTeamTracker extends LitElement {
  static get properties() { return { hass: {}, config: {} }; }
  setConfig(config) { this.config = config; }
  static getConfigElement() { return document.createElement("compact-team-tracker-editor"); }

  get _lang() {
    const l = this.hass?.language || 'de';
    return LANG[l] || LANG['en'];
  }

  render() {
    if (!this.hass) return html``;
    const t = this._lang;
    const entities = this.config.entities || [];
    const states = entities.map(id => this.hass.states[id]).filter(s => s && s.attributes);
    const prioId = this.config.priority_entity;

    const sortedStates = [...states].sort((a, b) => {
      const timeA = new Date(a.attributes.date).getTime();
      const timeB = new Date(b.attributes.date).getTime();
      if (timeA !== timeB) return timeA - timeB;
      if (a.entity_id === prioId && b.entity_id !== prioId) return -1;
      if (b.entity_id === prioId && a.entity_id !== prioId) return 1;
      return 0;
    });

    const seenMatches = new Set();
    const uniqueStates = [];
    for (const s of sortedStates) {
      const matchId = `${s.attributes.team_abbr}-${s.attributes.opponent_abbr}-${s.attributes.date?.split('T')[0]}`;
      const matchIdReverse = `${s.attributes.opponent_abbr}-${s.attributes.team_abbr}-${s.attributes.date?.split('T')[0]}`;
      if (!seenMatches.has(matchId) && !seenMatches.has(matchIdReverse)) {
        seenMatches.add(matchId);
        uniqueStates.push(s);
      }
    }

    const todayStr = new Date().toISOString().split('T')[0];
    let filteredList = uniqueStates.filter(s => {
      if (this.config.only_today !== false && s.state === 'POST') return s.attributes.date?.split('T')[0] === todayStr;
      return true;
    });

    let displayList = filteredList;
    if (this.config.show_next_only && filteredList.length > 0) {
      displayList = [filteredList[0]];
    }

    if (displayList.length === 0) return html``;

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

    const showLeague = this.config.show_league !== false;

    return html`
      <div class="card-wrapper">
        ${showLeague || s === 'IN' ? html`
          <div class="header-bg">
            <div class="header ${!showLeague ? 'no-league' : ''}">
              ${showLeague ? html`
                <div class="league-box"><img src="${a.league_logo}" class="league-logo" @error="${e => e.target.style.display='none'}"><span>${a.league_name || a.league}</span></div>
              ` : ''}
              ${s === 'IN' ? html`<div class="live-status"><span class="dot"></span> ${t.live} / ${a.clock}</div>` : (s === 'POST' ? html`<div class="status-post">${t.finished}</div>` : '')}
            </div>
          </div>
        ` : ''}
        <div class="content ${!showLeague && s !== 'IN' ? 'extra-padding' : ''}">
          <div class="team-box"><img src="${h.logo}" class="team-logo"><div class="name">${h.abbr}</div>${this.config.show_record && h.rec ? html`<div class="record">${h.rec}</div>` : ''}</div>
          <div class="score-area">
            ${s === 'PRE' 
              ? html`<div class="kickoff-wrapper"><div class="kickoff-time">${timeStr}</div><div class="kickoff-date">${a.kickoff_in}</div><div class="kickoff-exact">(${fullDateStr})</div></div>` 
              : html`<div class="score-nums">${h.score} : ${v.score}</div>`
            }
          </div>
          <div class="team-box"><img src="${v.logo}" class="team-logo"><div class="name">${v.abbr}</div>${this.config.show_record && v.rec ? html`<div class="record">${v.rec}</div>` : ''}</div>
        </div>
        <div class="info-footer">
          <div class="venue">${a.venue}${a.location ? `, ${a.location}` : ''}</div>
          ${this.config.show_scorers && a.scoring_plays ? html`<div class="scorers-list">${a.scoring_plays.map(p => html`<div class="scorer-item"><b>${p.team_abbr}</b>: ${p.score_play} (${p.score_time})</div>`)}</div>` : ''}
          ${s === 'IN' && a.last_play ? html`<div class="play">${a.last_play}</div>` : ''}
        </div>
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
    const shortDateStr = kDate.toLocaleDateString([], { day: '2-digit', month: '2-digit' });

    return html`
      <div class="ultra-wrapper ${s === 'IN' ? 'live-border' : ''}">
        <div class="ultra-team left"><img src="${h.logo}" class="ultra-logo"><span class="ultra-abbr">${h.abbr}</span></div>
        <div class="ultra-info">
          ${s === 'PRE' 
            ? html`<span class="ultra-main-text">${shortDateStr}</span><span class="ultra-subtext">${timeStr}</span>` 
            : html`<span class="ultra-score ${s === 'IN' ? 'live-text' : ''}">${h.score}:${v.score}</span><div class="ultra-subtext"><span>${shortDateStr}</span><span>${s === 'IN' ? a.clock : t.finished}</span></div>`
          }
        </div>
        <div class="ultra-team right"><span class="ultra-abbr">${v.abbr}</span><img src="${v.logo}" class="ultra-logo"></div>
      </div>
    `;
  }

  static get styles() {
    return css`
      ha-card { overflow: hidden; padding-bottom: 8px; }
      .spacer { height: 1px; background: var(--divider-color); opacity: 0.15; margin: 4px 16px; }
      .header-bg { background: rgba(255, 255, 255, 0.08); padding: 8px 12px; margin-bottom: 8px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
      .header { display: flex; justify-content: space-between; align-items: center; font-size: 10px; font-weight: bold; }
      .header.no-league { justify-content: center; }
      .league-logo { width: 18px; height: 18px; object-fit: contain; margin-right: 6px; }
      .live-status { color: #e74c3c; display: flex; align-items: center; }
      .status-post { opacity: 0.7; }
      .dot { height: 6px; width: 6px; background-color: #e74c3c; border-radius: 50%; display: inline-block; margin-right: 4px; animation: blink 1.5s infinite; }
      .content { display: flex; align-items: center; justify-content: space-between; padding: 0 12px; }
      .extra-padding { padding-top: 12px; }
      .team-box { flex: 1; display: flex; flex-direction: column; align-items: center; text-align: center; }
      .team-logo { width: 50px; height: 50px; object-fit: contain; }
      .name { font-size: 14px; font-weight: 800; margin-top: 4px; }
      .record { font-size: 10px; opacity: 0.6; }
      .score-area { flex: 1.5; display: flex; justify-content: center; align-items: center; }
      .kickoff-wrapper { text-align: center; }
      .score-nums { font-size: 34px; font-weight: 900; }
      .kickoff-time { font-size: 24px; font-weight: 800; line-height: 1; }
      .kickoff-date { font-size: 12px; font-weight: bold; margin-top: 2px; }
      .kickoff-exact { font-size: 10px; opacity: 0.6; }
      .info-footer { margin-top: 10px; padding: 8px 12px 0; border-top: 1px solid var(--divider-color); text-align: center; font-size: 10px; opacity: 0.7; }
      .venue { font-weight: bold; margin-bottom: 4px; }
      .scorers-list { margin: 6px 0; text-align: left; font-size: 9px; display: grid; grid-template-columns: 1fr; gap: 2px; opacity: 0.9; }
      .scorer-item { padding: 1px 4px; background: rgba(255,255,255,0.03); border-radius: 2px; }
      .ultra-wrapper { display: flex; align-items: center; justify-content: space-between; padding: 10px 16px; }
      .ultra-team { display: flex; align-items: center; gap: 8px; flex: 1; }
      .ultra-team.right { justify-content: flex-end; }
      .ultra-logo { width: 28px; height: 28px; object-fit: contain; }
      .ultra-abbr { font-size: 14px; font-weight: 800; }
      .ultra-info { flex: 1.2; text-align: center; display: flex; flex-direction: column; line-height: 1.2; }
      .ultra-score, .ultra-main-text { font-size: 18px; font-weight: 900; }
      .ultra-subtext { font-size: 10px; opacity: 0.7; font-weight: bold; display: flex; flex-direction: column; }
      .live-text { color: #e74c3c; }
      .live-border { background: rgba(231, 76, 60, 0.05); }
      @keyframes blink { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }
    `;
  }
}

customElements.define("compact-team-tracker", CompactTeamTracker);
window.customCards = window.customCards || [];
window.customCards.push({ type: "compact-team-tracker", name: "Compact Team Tracker", preview: true });
