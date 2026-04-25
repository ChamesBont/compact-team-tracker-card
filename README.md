# Compact Team Tracker Card
A highly customizable and space-saving Lovelace card for the Team Tracker Integration. This card is optimized to display multiple sports events simultaneously without cluttering your Home Assistant dashboard.

✨ FeaturesTwo Layout Modes: 
- Toggle between the detailed Standard Card View and the minimalist Ultra-Compact Layout (table view).
- Smart Filter: Option to show only the next upcoming or currently live match.
- Priority System: Define a "Main Sensor" to ensure your favorite team is always prioritized in the sorting order.
- Auto-Cleanup: Automatically hide finished matches from previous days at midnight.
- Scoring Plays: Optional list of scorers for live and finished matches, including timestamps.
- Multi-Team Support: Manage as many teams as you like within a single card.
- Multi-Language: Built-in support for English and German (auto-detected).

  📸 Screenshots
  (Tip: Upload an image of your card to the img folder in your repo and link it here)

🚀 Installation
Method 1: Via HACS (Recommended)
1. Open HACS in Home Assistant.
2. Click the three dots in the top right corner and select Custom repositories.
3. Add the URL of this repository: https://github.com/ChamesBont/Compact-Team-Tracker-Card
4. Select Lovelace as the category.
5. Click Add and then install the card.

Method 2: Manual Installation
1. Download the compact-team-tracker.js file.
2. Copy it to your Home Assistant /config/www/ folder.
3. Add the resource in Home Assistant:
     - Settings -> Dashboards -> Three dots (top right) -> Resources -> Add Resource.
     - URL: /local/compact-team-tracker.js
     - Type: JavaScript Module
   
🛠 Configuration
The card features a full Graphic User Interface (GUI) editor. No YAML coding required!

OptionDescriptionManage TeamsAdd all Team Tracker sensors you want to follow.PriorityChoose your main team. It will be prioritized if multiple games start at the same time.Show Next OnlyLimits the display to the single most relevant current or upcoming match.Ultra-Compact LayoutSwitches to the space-saving table view.League InformationToggle the visibility of the league logo and name in the header.Hide Finished MatchesAutomatically hides matches from previous days to keep the dashboard clean.List ScorersDisplays who scored and when.Show Statistics (W-D-L)Displays the team's current season record.

📋 Requirements
This card requires the Team Tracker Integration "ha-teamtracker" by @vasqued2to be installed. Make sure you have configured your team sensors there first.
https://github.com/vasqued2/ha-teamtracker
