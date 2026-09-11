# Smart Home Technical Options Evaluation

**Status:** Platform evaluation / recommendation  
**Date:** 2026-09-11  
**Inputs:** `docs/SMART_HOME_REQUIREMENTS.md` v1.1

## 1. Purpose

This document evaluates implementation approaches for the smart-home awareness and action layer defined in `SMART_HOME_REQUIREMENTS.md`.

The requirements intentionally do not select a platform. This document evaluates credible options against the home's actual systems and the desired operating model.

The primary architectural question is:

> **Where should authoritative home state, automation intelligence, and device integration live?**

The preferred answer should minimize duplicated integration logic while preserving the existing family dashboard as the primary household experience.

## 2. Evaluation Criteria

Options are evaluated against:

1. Device/integration coverage
2. Integration quality and maturity
3. Reliable state
4. Native alerts and events
5. Automation
6. Expected-vs-actual / missed-automation detection
7. Direct control
8. Historical data and trends
9. Cross-system intelligence
10. API and event model
11. Local vs. cloud operation
12. Offline resilience
13. Security and credential handling
14. Community/ecosystem strength
15. Maintainability
16. Existing investment
17. Dashboard integration
18. Vendor lock-in
19. Initial and recurring cost
20. Cost of ongoing engineering/maintenance

The scoring is directional rather than mathematically precise. The most important evidence is device-by-device feasibility and the reasons behind the relative scores.

## 3. Candidate Options

### Home Assistant

Open-source home automation platform with broad integrations, local execution, automation, history, APIs, and a large community ecosystem. Home Assistant itself has no required subscription; optional Home Assistant Cloud services are separate.

**Fit:** Strongest candidate for the home-state and automation layer.

### Hubitat

Local-first home automation hub with strong automation capabilities, custom drivers/apps, no required subscription, and a focus on local device processing.

**Fit:** Credible alternative, especially for local automation, but actual coverage of this home's cloud-oriented consumer systems requires more validation.

### Homey

Consumer-oriented smart-home platform with a large app/device ecosystem, Flow/Advanced Flow automation, Insights, dashboards, HomeyScript, and local Homey Pro hardware.

**Fit:** Credible alternative with excellent ecosystem breadth, but less naturally aligned than Home Assistant with using an existing custom Node dashboard as the experience layer.

### Custom Node

Continue adding integrations, state normalization, automation, history, alerting, retry handling, and controls directly to the existing family-dashboard server/application.

**Fit:** Technically possible and has the highest continuity with the existing codebase, but creates significant ongoing ownership of generic home-automation infrastructure.

### openHAB

Mature open-source home automation platform with extensive bindings and local operation.

**Fit:** Technically credible but does not currently present a compelling advantage over Home Assistant, Hubitat, or Homey for this particular device mix and dashboard architecture. It remains a fallback rather than a primary candidate.

## 4. Actual Device Feasibility

### Hydrawise

**Home Assistant: Green.** The current HA Hydrawise integration supports sensors, switches, valves, and binary sensors and exposes irrigation-related state and controls. It is a strong fit for expected-vs-actual irrigation awareness.

Source: https://www.home-assistant.io/integrations/hydrawise/

### Propane — Tank Utility / Anova

Tank Utility is now part of Anova. Anova's current Unify platform manages tank-level data, analytics, and API connectivity across propane and other fuel/tank applications.

Source: https://www.anova.com/products/anova-unify/

The current Home Assistant Tank Utility integration remains a **Legacy**, community-maintained, cloud-polling integration using the historical Tank Utility account model.

Source: https://www.home-assistant.io/integrations/tank_utility/

**Assessment: Yellow / validation required.** The ownership transition means the old HA integration should not be assumed to represent the long-term Anova integration path. Anova's current platform appears capable of supplying the required data, but a supported consumer API/access path for this household account must be established before relying on it.

Propane should have a clear adapter boundary. If the legacy HA integration proves unreliable or obsolete, the problem should be isolated to the Anova/Tank Utility adapter rather than forcing a change to the entire automation platform or dashboard.

### Garage — MyQ

**Home Assistant: Red for native MyQ cloud integration; local workaround preferred.** Home Assistant removed the MyQ integration because Chamberlain/MyQ blocked third-party access. HA recommends ratgdo for compatible openers.

Source: https://www.home-assistant.io/blog/2023/11/06/removal-of-myq-integration/

If reliable garage state/control is required, a local interface should be evaluated. This is not a reason to reject Home Assistant; it supports the broader requirement to prefer local interfaces where manufacturers restrict cloud access.

### Ecobee

**Home Assistant: Green.** The current official HA integration supports viewing and controlling ecobee thermostats and sensor data. Since HA 2026.3, a developer API key is no longer required.

Source: https://www.home-assistant.io/integrations/ecobee/

### Ring Doorbell

**Home Assistant: Green.** The official Ring integration supports Ring doorbells and cameras, device state, events, and controls useful for awareness and automation.

Source: https://www.home-assistant.io/integrations/ring/

### Blink Cameras

**Home Assistant: Orange / caution.** The HA Blink integration provides useful camera/system information and controls, but cloud/polling behavior creates limitations for timely camera-specific state. Blink authentication/API behavior has also been a source of integration instability during 2026.

Blink should not be treated as a high-confidence foundation for critical automation or security decisions until the exact capabilities and latency are tested against the household's four cameras.

### Eero

**Home Assistant: Yellow.** The current Eero integration available for Home Assistant is a community/custom integration rather than a core HA integration. It exposes network resources, client/profile presence, metrics, selected controls, firmware management, and other network functions.

Source: https://github.com/schmittx/home-assistant-eero

Eero does not need to become a critical dependency for other home automations. Validate the integration's reliability and required capabilities during POC.

### Smart Plugs / Bulbs

**Home Assistant: Green in aggregate.** HA has a broad ecosystem of plug, light, switch, and related integrations. Exact capability depends on the brands/models in use. The requirement is reliable state plus control and, where applicable, scheduled/expected state changes.

### Sonos

**Home Assistant: Green.** The official Sonos integration supports discovery and control and uses the local network when available.

Source: https://www.home-assistant.io/integrations/sonos/

## 5. Platform Comparison

Scores are 1–5, where 5 is best for this project.

| Criterion | Home Assistant | Hubitat | Homey | Custom Node |
|---|---:|---:|---:|---:|
| Device coverage | 5 | 4 | 5 | 3 |
| Actual-device fit | 4.5 | 3.5 | 4 | 3 |
| Integration maturity | 4.5 | 3.5 | 4.5 | 2 |
| Reliable state | 5 | 5 | 4.5 | 2 |
| Native alerts/events | 5 | 4 | 4.5 | 2 |
| Automation | 5 | 5 | 5 | 2 |
| Expected-vs-actual | 5 | 5 | 4.5 | 2 |
| History/trends | 5 | 4 | 5 | 1 |
| Cross-system intelligence | 5 | 5 | 5 | 4 |
| API/event model | 5 | 4 | 4.5 | 5 |
| Local execution | 5 | 5 | 5 (Pro) | 5 |
| Offline resilience | 5 | 5 | 4.5 (Pro) | 5 |
| Community | 5 | 4 | 5 | 1 |
| Ecosystem | 5 | 4 | 5 | 1 |
| Maintainability | 5 | 4 | 5 | 1 |
| Dashboard integration | 5 | 4 | 4.5 | 5 |
| Vendor independence | 5 | 4 | 3.5 | 5 |
| Initial cost | 5 | 4.5 | 4 | 5 |
| Ongoing engineering cost | 5 | 4 | 4.5 | 1 |
| **Overall fit** | **Strongest** | **Strong** | **Strong** | **Weakest** |

The numbers are decision aids, not precise measurements. Device feasibility and architectural fit carry more weight than the arithmetic total.

## 6. Cost Evaluation

### Home Assistant

Home Assistant software is open source and does not require a subscription for local operation. Hardware cost can be zero if an existing suitable machine/VM is used; dedicated hardware is optional. Home Assistant Cloud is optional.

**Economic position:** Very strong, especially because the platform absorbs generic integration and automation maintenance that would otherwise belong to the custom Node application.

### Hubitat

Hubitat is a local platform with no required ongoing subscription. The C-8 Pro is currently approximately $185 USD in North America.

**Economic position:** Strong acquisition and operating economics.

### Homey

Current US pricing is $2.99/month for Homey Cloud, $249 for Homey Pro mini, and $449 for Homey Pro.

Sources:
- https://homey.app/en-us/homey-pro/
- https://support.homey.app/hc/en-us/articles/27532480827036-Pricing-update-effective-June-1-2026

**Economic position:** Reasonable, but higher than zero-cost software alternatives and introduces recurring cost if Homey Cloud is selected.

### Custom Node

Incremental acquisition cost is effectively zero, but this understates total cost. The application would own integration maintenance, vendor API changes, authentication, state normalization, polling/event handling, retries, history, automation scheduling, alerting, device discovery, and failure handling.

**Economic position:** Lowest acquisition cost but highest ongoing engineering cost.

> **No license fee does not mean low total cost.**

## 7. Community and Ecosystem

Community/ecosystem strength is a first-class criterion because vendor APIs and devices change over time.

### Home Assistant

Strong combination of open-source control, broad integration ecosystem, community maintenance, custom integrations, and public technical knowledge. This reduces the need for the project to own every generic integration.

### Homey

Very strong commercial ecosystem. Homey currently advertises more than 70,000 supported devices from more than 2,000 brands and provides official/community apps plus an SDK for custom integrations.

Source: https://homey.app/en-us/features/apps/

### Hubitat

Strong community and driver ecosystem, especially for local device automation, but unusual cloud-oriented services can depend more heavily on community drivers/apps.

### Custom Node

No comparable ecosystem benefit; the project becomes responsible for the integration layer.

**Conclusion:** Community strength materially favors Home Assistant and Homey over a custom implementation.

## 8. Architectural Implications

The evaluation supports a clean separation between the automation platform and the existing family dashboard.

```text
                    HOME DEVICES / SERVICES
                             |
                             v
                 +-----------------------+
                 | Home Automation Layer |
                 |                       |
                 | state                 |
                 | events                |
                 | automation            |
                 | history               |
                 | device control        |
                 +-----------+-----------+
                             |
                        API / events
                             |
                             v
                 +-----------------------+
                 |   Family Dashboard    |
                 |                       |
                 | awareness             |
                 | recommendations       |
                 | controls              |
                 | status                |
                 +-----------------------+
```

The family dashboard should remain the experience layer. The automation platform should own generic device integration, authoritative normalized state, automation, and history.

The dashboard should not duplicate those responsibilities unless a requirement specifically represents intelligence the automation platform cannot reasonably provide.

## 9. Integration Boundary Principle

Not every device integration needs to be native to the selected platform.

The architecture should support an adapter boundary for weak or vendor-transition integrations.

Examples:

- Anova/Tank Utility may require a current adapter if the legacy HA integration becomes unsuitable.
- MyQ should use a local garage interface rather than depend on blocked cloud access.
- Eero can remain an optional/custom integration because network health should not be a critical automation dependency.
- Blink should remain non-critical until event reliability is proven.

An integration weakness should normally result in replacing an adapter, not replacing the entire automation platform.

## 10. Recommendation

### Recommended platform: Home Assistant

Based on the requirements and current feasibility evidence, **Home Assistant is the strongest fit for the home automation/state layer**, subject to proof-of-concept validation.

The recommendation is based on the combination of:

- broad integration coverage
- strong fit for Hydrawise, Ecobee, Ring, Sonos, and common smart-home devices
- strong automation and expected-vs-actual capabilities
- local execution
- history and trends
- APIs/events suitable for integration with the existing Node dashboard
- large open-source community and integration ecosystem
- no required platform subscription
- lower long-term engineering ownership than extending the custom Node application
- ability to isolate weak integrations behind adapters

This is **not** a recommendation to replace the existing family dashboard with Home Assistant.

The intended model is:

> **Home Assistant provides the home-state and automation foundation; the existing Family Dashboard provides the family-specific awareness and action experience.**

## 11. Conditions on the Recommendation

The recommendation should be confirmed through a proof of concept before significant implementation work.

The POC must validate at minimum:

1. Hydrawise state, schedule, and manual control.
2. Anova/Tank Utility current account/data access.
3. Ecobee state, schedule, and control.
4. Ring events/state.
5. Blink state/event usefulness and authentication stability.
6. Eero network status and client information.
7. A practical local MyQ interface.
8. At least one representative smart plug/bulb.
9. Home Assistant API/event access from the existing Node dashboard.
10. Persistence/history behavior.
11. Restart/recovery behavior.
12. Credential/security model.
13. Ability to detect a deliberately simulated missed automation.

The POC should also test what happens when Home Assistant is unavailable. The dashboard must fail gracefully rather than becoming dependent on the automation platform for all existing dashboard functionality.

## 12. Risks

### Integration drift

Vendor APIs and authentication can change. Mitigation: prefer local integrations where practical, use established integrations, and isolate fragile adapters.

### Community-maintained integrations

Some integrations are not maintained by the vendor or HA core team. Mitigation: classify integrations by criticality and avoid making fragile integrations prerequisites for critical household functions.

### Cloud dependency

Several useful integrations remain cloud polling. Mitigation: identify which functions require cloud availability and do not assume cloud-backed state is equivalent to local state.

### Platform dependency

Selecting HA introduces dependence on a new automation platform. Mitigation: keep the dashboard dependent on a narrow API/event contract rather than HA-specific UI or implementation details.

### Custom-integration sprawl

HACS/custom integrations can re-create the maintenance problem we are trying to avoid. Mitigation: use custom integrations only where they provide meaningful value and document their ownership/replacement path.

## 13. Decision

**Working platform decision: Home Assistant, subject to proof-of-concept validation.**

Do not begin broad smart-home implementation yet.

The next document should define the target architecture:

`docs/SMART_HOME_ARCHITECTURE.md`

That document should specify:

- what Home Assistant owns
- what the existing Node server owns
- the API/event boundary
- state and alert normalization
- expected-vs-actual intelligence
- alert severity model
- dashboard integration
- credential boundaries
- failure/degraded-mode behavior
- how fragile integrations are isolated
- how the architecture avoids rebuilding Home Assistant capabilities inside the dashboard
