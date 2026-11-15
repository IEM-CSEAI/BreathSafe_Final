from schemas import SensorReading, SensorStatuses, Prediction


def classify(s: SensorReading) -> SensorStatuses:
    def temp(v): return "low" if v < 15 else ("high" if v > 35 else "normal")
    def hum(v):  return "low" if v < 30 else ("high" if v > 70 else "normal")
    def pm25(v): return "normal" if v <= 12 else ("moderate" if v <= 35 else "high")
    def pm10(v): return "normal" if v <= 54 else ("moderate" if v <= 154 else "high")
    def co2(v):  return "normal" if v <= 600 else ("moderate" if v <= 1000 else "high")
    def voc(v):  return "normal" if v <= 100 else ("moderate" if v <= 250 else "high")
    def aqi(v):  return "normal" if v <= 50 else ("moderate" if v <= 100 else "high")

    return SensorStatuses(
        temperature=temp(s.temperature_C),
        humidity=hum(s.humidity_pct),
        pm25=pm25(s.pm2_5_ug_m3),
        pm10=pm10(s.pm10_ug_m3),
        co2=co2(s.co2_ppm),
        voc=voc(s.voc_a_u),
        aqi=aqi(s.aqi),
    )


def recommend(st: SensorStatuses, p: Prediction) -> list[str]:
    tips: list[str] = []

    if st.pm25 != "normal" or st.pm10 != "normal":
        level = "high" if "high" in (st.pm25, st.pm10) else "elevated"
        tips.append(f"Particulate matter is {level}: use an air purifier or HEPA filter "
                    "and limit outdoor air intake.")
    if st.co2 != "normal":
        tips.append("CO2 is elevated: increase ventilation or open windows.")
    if st.voc != "normal":
        tips.append("VOC level is elevated: remove chemical sources and ventilate.")
    if st.humidity == "high":
        tips.append("Humidity is high: use a dehumidifier to reduce mold and pathogen growth.")
    elif st.humidity == "low":
        tips.append("Humidity is low: use a humidifier to avoid airway irritation.")
    if st.temperature == "high":
        tips.append("Temperature is high: cool the space.")
    elif st.temperature == "low":
        tips.append("Temperature is low: warm the space.")
    if st.aqi == "high":
        tips.append("AQI is unhealthy: sensitive individuals should wear a mask or leave the area.")

    if p.risk_level == "high":
        tips.append("Infection risk is HIGH: limit time in this space and use respiratory protection.")
    elif p.risk_level == "moderate":
        tips.append("Infection risk is moderate: improve ventilation and monitor closely.")

    if not tips:
        tips.append("Air quality looks good. No action needed.")
    return tips