---
permalink: /
title: ""
excerpt: ""
author_profile: true
redirect_from: 
  - /about/
  - /about.html
---

{% if site.google_scholar_stats_use_cdn %}
{% assign gsDataBaseUrl = "https://cdn.jsdelivr.net/gh/" | append: site.repository | append: "@" %}
{% else %}
{% assign gsDataBaseUrl = "https://raw.githubusercontent.com/" | append: site.repository | append: "/" %}
{% endif %}
{% assign url = gsDataBaseUrl | append: "google-scholar-stats/gs_data_shieldsio.json" %}

<span class='anchor' id='about-me'></span>


Hi, I'm Daihui, a power electronic engineer at Volvo focusing on electric motor drive systems. My work covers the modelling of DC-link capacitors and their lifetime evaluation, EMC optimization and the gate driver PCBs' design in inverter systems.

I'm experienced in common/differential-mode filter designs, inverter modulation methods and the related controller design. Also, I am involved in system-level EMC simulation.

# 🔥 News
- *2024.11*: &nbsp;🎉🎉 I joined Volvo Group Truck Technology as a power electronics engineer!
- *2025.01*: &nbsp;🎉🎉 I graduated from Chalmers!

# 📝 Publications 
<div class='paper-box'>
  <div class='paper-box-image'>
    <div>
      <div class="badge">IECON 2025</div>
      <img src='images/500x300.png' alt="sym" width="100%">
    </div>
  </div>
  <div class='paper-box-text' markdown="1">
[1] Optimal Dimensioning of DC-link Capacitor for Electric Motor Drive Application, IEEE IECON 2025 – Madrid, Spain, 2025. (Accepted)

Daihui Zhu, Nimananda Sharma, Samadaei Emad

**Abstract** —The advancement of silicon carbide (SiC) power devices has enabled higher voltage levels in electric motor drive systems. However, the capacitance of film capacitors decreases as voltage stress increases. This reduction in capacitance increases the differential voltage ripple, which may degrade the quality of the DC bus. This work presents a holistic approach to DC-link design that considers both voltage and current ripples over the load cycle — a topic that has received limited attention in the literature. Based on the proposed methodology, four different DC-link capacitor designs were evaluated in terms of their lifetime performance. Results show that the sizing of the DC-link capacitor is highly dependent on the applied load cycle; therefore, the design should be tailored to application-specific requirements to achieve reduced size and increased power density.

  </div>
</div>

<div class='paper-box'>
  <div class='paper-box-image'>
    <div>
      <div class="badge">Master Thesis</div>
      <img src='images/MasterThesis.png' alt="sym" width="100%">
    </div>
  </div>
  <div class='paper-box-text' markdown="1">
[2] Determining Dynamic On-resistance of Lateral Gallium Nitride Devices in Motor Driver Applications (Master Thesis)

Daihui Zhu, Mikael Josefsson

**Abstract**: This report investigates different challenges of determining the effects of dynamic on-resistance (D-Rds(on)) in lateral Gallium Nitride High Electron Mobility Transistors (GaN-HEMT) operated in automotive traction inverter conditions. A literature review identifies the operational parameters of the devices that affect D-Rds(on) most adversely. The accuracy, complexity, and testable operational pa-rameters of different measurement methods, i.e., double pulse test, multi-pulse test, and steady-state continuous switching, are investigated. The report also examines different on-state voltage measurement circuits (OVMCs) needed to measure D-Rds(on) accurately. The report concludes that operational parameters, such as drain-to-source voltage, drain current, switching frequency, duty cycle,and turn-on gate resistance, significantly influence D-Rds(on). Moreover, these pa-rameters exhibit a synergistic relationship. In contrast, the impact of junction temperature on D-Rds(on) is ambiguous and varies between studies. Additionally, D-Rds(on) varies with production batches and device structures. Further, a double pulse test is a suitable first method to determine whether a device suffers from D-Rds(on). If accuracy is prioritized, the multi-pulse test serves as an alternative method. Finally, two different OVMCs are concluded to have sufficient performance for determining D-Rds(on).
  </div>
</div>

# 🎖 Honors and Awards
- Avancez Scholarship - Chalmers University of Technology
  
# 📖 Educations
- Chalmers University of Technology - Master’s in Sustainable Power Engineering and Electromobility
- Beijing Jiaotong University (北京交通大学) - Bachelor’s in Electrical Engineering

# 💻 Work Experience
![Volvo Logo](./volvo_logo.png) **Volvo Group Truck Technology** ---- Nov.2024 - Now, Gothenburg, Sweden

**Associate Power Electronics Engineer**

-Drafting technical requirements for new generation electric motor drive.
-Lead and participate several advanced engineering projects.
-Working with cross-functional teams to close Product Issue Log (PILs).
-Conducted Emission Test for pre-compliance with Volvo EMC standard and CISPR 25.
