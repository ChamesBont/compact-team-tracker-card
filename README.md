# Compact Team Tracker Card

A highly customizable and space-saving Lovelace card for the [Team Tracker Integration](https://github.com/vasqued2/ha-teamtracker). This card is optimized to display multiple sports events simultaneously without cluttering your Home Assistant dashboard.

---

## 📋 Requirements

This card is a frontend display and requires the [Team Tracker Integration](https://github.com/vasqued2/ha-teamtracker) to be installed via HACS first. 

---

## 📸 Screenshots

### Standard Card Layout with multiple Teams
The detailed view showing all match information, venue, and status.

![Standard Card View](screenshots/Screenshot_compact_team_tracker_card_1.png)

### Ultra-Compact Layout
The space-saving table view, perfect for tracking many teams at once.

![Ultra-Compact View](screenshots/Screenshot_compact_team_tracker_card_2.png)

### Visual Editor
Multiple options for customization.

![Ultra-Compact View](screenshots/Screenshot_compact_team_tracker_card_3.png)

---

## ✨ Features

* **Two Layout Modes:** Toggle between the detailed **Standard Card View** and the minimalist **Ultra-Compact Layout** (table view).
* **Smart Filter:** Option to show only the next upcoming or currently live match.
* **Priority System:** Define a "Main Sensor" to ensure your favorite team is always prioritized if matches start at the same time.
* **Auto-Cleanup:** Automatically hide finished matches from previous days at midnight.
* **Scoring Plays:** Optional list of scorers for live and finished matches, including timestamps.
* **Multi-Language:** Built-in support for **English** and **German** (auto-detected from Home Assistant settings).

---

## 🚀 Installation

### Method 1: via HACS (recommended):
[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=ChamesBont&repository=https%3A%2F%2Fgithub.com%2FChamesBont%2Fcompact-team-tracker-card&category=Lovelace)

### Method 2: Manually add repository to HACS (recommended):

1. Open HACS section in Home Assistant.
2. Click on the 3 dots in the top right corner.
3. Select "Custom repositories".
4. Add the URL to the repository.
    * URL: `https://github.com/ChamesBont/compact-team-tracker-card/`
    * Type: `Dashboard`
5. Click the "ADD" button.

### Method 3: Manual Installation

1.  Download the `compact-team-tracker-card.js` file from this repository.
2.  Upload it to your Home Assistant `/config/www/` folder.
3.  Add the resource in Home Assistant:
    * **Settings** -> **Dashboards** -> **Three dots (top right)** -> **Resources** -> **Add Resource**.
    * URL: `/local/compact-team-tracker-card.js`
    * Type: `JavaScript Module`

---

## 🛠 Configuration Options

The card features a full **Graphic User Interface (GUI)** editor. No YAML coding required!

| Option | Description |
| :--- | :--- |
| `entities` | **(Required)** A list of one or more team_tracker sensor entities. |
| `priority_entity` | Select a main sensor that will be prioritized if multiple games start at the exact same time. |
| `show_next_only` | If enabled, only the next or currently active match will be displayed. |
| `layout` | Set to `ultra` for an even more compact one-line view of the matches. |
| `show_league` | Toggle the display of league names and logos (e.g., German Bundesliga , UEFA Champions League, ...). |
| `only_today` | Automatically hides finished matches from previous days at midnight. |
| `show_record` | Displays the current win-draw-loss record (W-D-L) for both teams. |
| `show_last_play` | **(New)** Shows a short text summary of the most recent play during live games. |

---

## 🤝 Acknowledgments

* This project was developed with the significant assistance of **Gemini**, Google's AI collaborator, which helped in coding, refining, and documenting this card.
* Special thanks to the Home Assistant community for the inspiration to create a more compact sport tracking solution.
