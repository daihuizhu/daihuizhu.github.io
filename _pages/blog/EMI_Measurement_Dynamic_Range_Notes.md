---
permalink: /blog/EMI_Measurement_Dynamic_Range_Notes/
title: "EMI"
excerpt: ""
author_profile: true
---

# EMI Measurement: Attenuator vs Analyzer Overload

## Problem

In EMI measurements, especially with power converters and motor drives:

- Low-frequency emissions (e.g. around 150 kHz switching frequency) can be very large
- High-frequency emissions (e.g. 50–100 MHz) are often much smaller

This creates a dynamic range problem:

- Without attenuation → Spectrum analyzer overload
- With too much attenuation → DUT high-frequency noise falls below analyzer noise floor

As a result, high-frequency EMI cannot be measured correctly.

---

# Important Concept

Even if the spectrum analyzer display is set to only measure:

- 50–100 MHz

the analyzer front-end still sees:

- 150 kHz
- switching harmonics
- all broadband energy entering the RF input

because the RF front-end and mixer are located before RBW filtering.

Therefore:

- Large low-frequency signals can still overload the mixer/front-end
- Compression and intermodulation may occur
- High-frequency noise floor may rise
- Small HF emissions may disappear

So:

> Limiting the displayed frequency span does NOT prevent low-frequency overload.

---

# Typical Symptoms

- Analyzer shows “Overload”
- High-frequency noise disappears
- Noise floor becomes unusually high
- Fake spurs appear
- HF spectrum changes significantly with attenuation setting

---

# Recommended Solutions

## 1. Use a High-Pass Filter (Best Solution)

This is the most common solution in EMI labs.

Example:

- 10 MHz high-pass filter
- 30 MHz high-pass filter

Benefits:

- Removes large low-frequency energy
- Prevents analyzer front-end overload
- Allows smaller attenuation
- Improves high-frequency sensitivity

For measurements above 30 MHz, this is highly recommended.

Typical setup:

```text
DUT
→ LISN / probe
→ High-pass filter
→ Small attenuator
→ Preamp
→ Spectrum analyzer
```

---

## 2. Use the Minimum Necessary Attenuation

Do NOT blindly increase attenuation.

Too much attenuation reduces both:

- unwanted low-frequency energy
- desired high-frequency emissions

Procedure:

| Attenuation | Result |
|---|---|
| 0 dB | overload |
| 5 dB | overload |
| 10 dB | marginal |
| 15 dB | acceptable |

Use the minimum attenuation that avoids overload.

Then improve sensitivity using:

- preamplifier
- smaller RBW
- narrower span

---

## 3. Use Preselection / EMI Receiver

High-end EMI receivers often include:

- preselectors
- tracking filters
- YIG filters

These filters remove out-of-band signals before the mixer.

Advantages:

- better dynamic range
- less mixer compression
- improved HF measurement accuracy

Examples:

- Rohde & Schwarz ESR
- Keysight N9048B

Low-cost spectrum analyzers usually have very wide front-ends and are more vulnerable to overload.

---

# Conducted EMI Example

Example signal levels:

| Frequency | Level |
|---|---|
| 150 kHz | 90 dBµV |
| 80 MHz | 25 dBµV |

If 30 dB attenuation is added:

| Frequency | After Attenuation |
|---|---|
| 150 kHz | 60 dBµV |
| 80 MHz | -5 dBµV |

The HF emission may disappear into the analyzer noise floor.

---

# Practical Recommendation for 50–100 MHz Measurement

Recommended setup:

```text
DUT
→ LISN / current probe
→ 10 dB attenuator
→ 30 MHz high-pass filter
→ Preamp
→ Spectrum analyzer
```

This is usually much better than:

```text
DUT
→ 30 dB attenuator
→ Spectrum analyzer
```

---

# Additional Note: Types of Overload

Some analyzers distinguish between:

## RF Overload

- Front-end/mixer compression
- Measurement becomes unreliable
- Must be avoided

## IF Overload

- Intermediate frequency overload
- Sometimes still usable depending on analyzer architecture

Always check whether the overload occurs at:

- RF input
- mixer
- ADC
- IF stage

---

# Key Takeaway

The issue is fundamentally a dynamic range limitation:

$$
\text{Dynamic Range} = P_{\text{max without overload}} - P_{\text{noise floor}}
$$

Large low-frequency signals consume the analyzer dynamic range, making small high-frequency EMI impossible to observe.

The correct solution is NOT simply adding more attenuation.

The proper approach is:

- remove unnecessary low-frequency energy using filters
- use the minimum necessary attenuation
- use preamplifiers carefully
- reduce RBW/span when possible
- use preselection filters or EMI receivers when available
