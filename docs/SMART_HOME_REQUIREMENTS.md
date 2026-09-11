# Smart Home Requirements — v1.1

**Status:** Baseline requirements  
**Version:** 1.1  
**Purpose:** Defines desired smart-home capabilities and experience. Does not prescribe implementation architecture.

## 1. Purpose and Goals

The smart-home integration should extend the existing family dashboard with an **awareness and action layer** for the connected systems in the home.

The primary goal is not to display every available piece of device information. The goal is to:

1. **Create awareness** when something requires human attention.
2. Explain **what is happening and why it matters**.
3. Provide a clear **recommended action** to resolve the issue.
4. Allow the user to **take action from the dashboard whenever practical**.
5. When direct action is not possible, provide **clear, human-readable instructions** for resolving the issue.
6. Provide an optional **overall status view** showing the operational state of the home's connected systems.
7. Where meaningful, show **trends, impacts, and benefits** resulting from connected or automated systems.

### Success criteria

The integration is successful when it can proactively surface meaningful conditions before they negatively affect the family, home, or daily routines—and make resolving those conditions as easy as possible.

The system should prioritize **meaningful awareness over raw device telemetry**.

Normal operation should generally remain quiet.

---

# 2. Information and Capabilities

## 2.1 Irrigation

The dashboard should provide awareness of the irrigation system and its effectiveness.

### Desired capabilities

- Show current watering status.
- Show when irrigation last ran.
- Show when irrigation is scheduled to run next.
- Show estimated watering amount over the previous seven days.
- Incorporate rainfall when estimating the amount of water received.
- Surface irrigation errors, failures, or warnings.
- Identify situations where watering may not be occurring as expected.
- Where data permits, estimate the benefit of the smart irrigation system, including:
  - Time saved.
  - Water saved.
  - Other meaningful efficiency improvements.
- Provide an action from the dashboard when an issue can be resolved programmatically.
- Otherwise provide clear instructions for resolving the issue.

### Desired awareness

The system should distinguish between normal irrigation activity and conditions that actually require attention—for example, a scheduled watering cycle that did not occur.

---

## 2.2 Propane

The dashboard should provide visibility into propane supply and proactively identify conditions that could affect the home.

### Desired capabilities

- Show current propane fuel level.
- Show tank battery level.
- Surface low-fuel warnings.
- Surface low-battery warnings.
- Surface other relevant tank/system warnings.
- Show meaningful usage trends over time.
- Where possible, estimate consumption trends and remaining supply.
- Surface conditions where the current supply or usage pattern may require action.
- Provide an actionable response where possible.
- Otherwise provide clear human instructions.

### Desired awareness

The system should make it possible to recognize a potential propane issue **before the lack of fuel becomes a problem for the household**.

---

## 2.3 Garage Doors

The dashboard should provide visibility and control of the garage doors.

### Desired capabilities

- Show whether each garage door is open or closed.
- Allow the user to open a garage door from the dashboard.
- Allow the user to close a garage door from the dashboard.
- Surface meaningful garage-door alerts or abnormal conditions.
- Where useful, provide awareness based on context—for example, a door remaining open when it may warrant attention.

Configured garage-door automations and other expected automated actions should be treated as expected behavior. For example, if a garage door is configured to close at 9:00 PM and remains open beyond an appropriate tolerance period, that missed automation should be eligible to generate an alert.

---

## 2.4 Smart Plugs and Bulbs

The dashboard should provide visibility and basic control of connected plugs and bulbs.

### Desired capabilities

- Show whether each device is on or off.
- Allow the user to turn the device on or off.
- Provide a meaningful label or descriptor explaining what the device controls.
- Where a device operates on a schedule:
  - Show the next scheduled state change.
  - Identify whether it is scheduled to turn on or off.
- Surface meaningful errors or conditions requiring attention.
- Treat configured scheduled actions as expected behavior and surface a missed action when the expected state change does not occur.

The dashboard should present these devices in terms that are useful to the family rather than requiring users to understand device names or technical identifiers.

---

## 2.5 Thermostats

The dashboard should provide awareness of the home's Ecobee thermostats and HVAC operation.

### Desired capabilities

- Show current temperature.
- Show current temperature setting/target.
- Show humidity.
- Show whether the system is currently heating, cooling, or idle.
- Show the next scheduled temperature change.
- Surface thermostat alerts and warnings.
- Surface meaningful conditions such as high humidity.
- Surface maintenance-related notifications where available.
- Show relevant trends over time.
- Where meaningful data is available, show impacts such as energy savings or other benefits resulting from smart thermostat operation.
- Provide actionable controls where appropriate.
- Provide human-readable instructions when an issue cannot be resolved through the dashboard.
- Where configured thermostat automations are expected to occur, identify meaningful failures to execute them.

---

## 2.6 Wi-Fi / Network

The dashboard should provide a high-level view of the health of the home's Eero network.

### Desired capabilities

- Show whether internet access is currently available.
- Show the state of the Eero system/beacons.
- Show the number of connected devices.
- Show the number of connected guest devices.
- Surface network warnings and errors.
- Surface relevant system notifications, including scheduled software/firmware updates.
- Identify conditions that may require human attention.

The dashboard should focus on **household-impacting network conditions**, rather than exposing unnecessary technical network information.

---

## 2.7 Ring Doorbell

The dashboard should provide awareness of the Ring doorbell.

### Desired capabilities

- Surface relevant Ring alerts.
- Show current doorbell/system state.
- Identify conditions requiring attention.
- Where supported and appropriate, provide an actionable response from the dashboard.
- Leverage existing Ring alerting and configured rules where available rather than unnecessarily recreating them.

The objective is awareness of meaningful doorbell/security events rather than reproducing the complete Ring application.

---

## 2.8 Blink Cameras

The dashboard should provide awareness of the Blink camera system.

### Desired capabilities

- Surface relevant camera alerts.
- Show whether the system is armed or disarmed.
- Show whether cameras are online.
- Show camera battery status.
- Identify cameras or system components requiring attention.
- Provide actionable controls where practical.
- Provide human-readable instructions when dashboard action is not possible.
- Leverage existing Blink alerting and configured rules where available rather than unnecessarily recreating them.

The system should distinguish individual camera problems from overall system status.

---

# 3. Existing Device Intelligence and Expected Behavior

Many connected devices and their supporting platforms already provide alerts, configurable thresholds, rules, schedules, and automation. The smart-home integration should **leverage those capabilities rather than unnecessarily recreate them**.

Examples include a propane service that can notify when fuel falls below a user-configured threshold.

Existing native capabilities should be treated as a first-class source of smart-home awareness. The dashboard should:

- Surface meaningful native alerts.
- Preserve the underlying system's configured thresholds and rules where appropriate.
- Make native alerts understandable in the context of the home.
- Provide a path to resolution when one is available.
- Avoid maintaining duplicate logic when the underlying platform already provides the required capability reliably.

At the same time, the smart-home layer should be capable of identifying conditions that individual devices or platforms cannot detect themselves.

### Native intelligence

The underlying device or platform already knows something is wrong or has an existing rule/automation that identifies the condition.

### Cross-system intelligence

The condition is identified by combining information from multiple systems or by monitoring expected behavior that the underlying device does not independently verify.

For example:

> Garage scheduled to close at 9:00 PM + garage still open after the expected close time → alert that the expected automation did not complete.

The requirements do not prescribe which system should perform this detection.

---

# 4. Other Connected Devices

The home contains additional connected devices, including:

- Peloton
- Samsung televisions
- Echo Dots
- Digital/photo frame
- Yoto
- Printer
- Other connected devices discovered over time

These devices are **not currently requirements for integration**.

They should remain candidates for future consideration.

A device should be considered for integration when it can provide meaningful:

- Awareness
- Action
- Automation
- Household status
- Or another clearly useful benefit

Connectivity alone is not sufficient justification for integration.

---

# 5. Interaction and Control

The smart-home experience should support different levels of interaction depending on the capability.

### Display

The dashboard should display relevant current state and status information.

### Control

Where practical, users should be able to control the underlying system directly from the dashboard.

Examples include:

- Opening/closing garage doors
- Turning plugs or lights on/off
- Potentially taking corrective action on other systems

### Notifications / Alerts

The system should proactively surface conditions that require attention.

Alerts should be:

- Meaningful
- Prioritized
- Understandable
- Action-oriented

The system should avoid generating unnecessary notifications for normal device activity.

### Automation

Where practical, routine or corrective actions should be automated.

Automation should be evaluated based on whether it provides a meaningful benefit to the household.

The implementation mechanism for automation is intentionally **not defined by these requirements**.

### Human action

When an issue cannot be resolved automatically, the dashboard should explain:

1. What is wrong.
2. Why it matters.
3. What needs to be done.
4. How to do it, in human-readable terms.

---

# 6. Awareness Model

The smart-home experience should distinguish between different levels of significance.

### Normal

Everything is operating as expected.

No action is required.

### Informational

Something happened or changed that may be useful to know, but does not require action.

### Attention

Something may require attention or monitoring.

The dashboard should explain why.

### Action Required

A condition exists that requires human intervention.

The dashboard should provide a clear recommended action and, where possible, a direct control to resolve it.

### Critical

A condition may have an immediate or significant impact on the home or family.

The dashboard should make the condition highly visible and provide the most direct available resolution path.

Not every integration needs to use every level.

---

# 7. Monitoring Expected Automations

Configured automations should be treated as **expected behavior**, not merely configuration metadata.

When a system is expected to perform an automated action, the smart-home experience should, where technically practical, be able to determine whether the expected result actually occurred.

Examples:

- Garage door scheduled to close at 9:00 PM → door remains open → alert.
- Irrigation scheduled to run → expected watering does not occur → alert.
- Smart plug scheduled to turn off → plug remains on → alert.
- Thermostat scheduled to change temperature → expected change does not occur → alert.

The system should account for an appropriate tolerance period and should avoid false alerts caused by normal timing variations, manual overrides, or other expected exceptions.

The underlying platform may already provide this capability. When it does, that capability should be leveraged rather than duplicated.

---

# 8. Status and Trends

In addition to individual alerts, the system should provide an optional **Smart Home Status** experience.

The status view should answer:

> **How is my house doing right now?**

It should provide a concise view of the operational state of the integrated systems.

Examples include:

- Irrigation — operating normally / attention required
- Propane — fuel level and trend
- Garage — doors open/closed
- Thermostats — temperature, humidity, HVAC state
- Wi-Fi — internet and network status
- Ring — current security/doorbell state
- Blink — system and camera status
- Smart plugs/bulbs — current state

The status experience should make important conditions easy to identify without requiring the user to inspect every individual device.

Where useful, it should also show:

- Trends
- Consumption
- Savings
- Efficiency
- Other measurable impacts of automation

---

# 9. Dashboard Experience

The existing dashboard screens should remain unchanged unless future requirements demonstrate a reason to modify them.

The smart-home experience should **not become another regularly rotating dashboard screen**.

Instead, it should be accessible when needed.

## Alert / Attention Experience

The existing dashboard side panel can be extended to provide a visual indication when smart-home conditions require attention.

Selecting the relevant indicator should open a dedicated screen outside of the normal screen rotation.

That screen should focus on:

- The alert
- Its significance
- Recommended action
- Available automated controls
- Human instructions where necessary

Multiple alerts should be prioritized so that the user can quickly understand what matters most.

## Smart Home Status Experience

A separate, or closely related, screen should provide the overall Smart Home Status view.

This screen should be available on demand rather than included in the normal rotation.

The rationale is:

> **If everything is working, the user should not need to see the smart-home status screen.**

The existing information, calendar, chores/fun, and sports screens should continue to serve their current purposes.

---

# 10. Alert Quality and Noise

The smart-home system should prioritize **useful awareness rather than maximum visibility**.

It should:

- Avoid alerting on normal operating conditions.
- Avoid duplicate or repetitive alerts.
- Prioritize conditions based on significance.
- Provide enough context to understand why an alert matters.
- Clear or downgrade alerts when the underlying condition is resolved.
- Prefer actionable alerts over informational noise.
- Consider context when determining whether something warrants attention.

The desired experience is:

> **When the dashboard tells us something needs attention, we should trust that it is worth looking at.**

---

# 11. Scope Boundaries

The following are explicitly outside the current smart-home requirements:

- Replacing the existing dashboard's current information, calendar, chores/fun, or sports experiences.
- Integrating every connected device simply because it is connected.
- Exposing raw device telemetry that has no meaningful household value.
- Defining the technical architecture.
- Selecting an integration platform.
- Selecting Home Assistant or another platform as the implementation mechanism.

Those decisions will be evaluated **after the requirements are established**.

---

# 12. Future Evaluation Criteria

Once the requirements are finalized, potential implementation approaches should be evaluated against their ability to provide:

1. Reliable device/system state.
2. Proactive awareness.
3. Meaningful alerting.
4. Direct control.
5. Automation.
6. Historical data and trends.
7. Actionable remediation.
8. Maintainability.
9. Reliability when the dashboard itself is unavailable.
10. Appropriate security and credential handling.
11. Integration with the existing dashboard experience.
12. Minimal duplication of capabilities that an existing platform already provides well.
13. Reliable detection of failed or missed expected automations.
14. Effective reuse of native device/platform alerts, rules, and automation.

The objective is not to maximize the number of integrations.

The objective is to create a **reliable household awareness and action system** that makes the home easier to operate and reduces the likelihood that a problem goes unnoticed.
