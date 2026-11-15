import pandas as pd


def feature_engineering(df: pd.DataFrame) -> pd.DataFrame:
    """Must match train.py exactly."""
    df = df.copy()
    df["pollutant_load"] = (df["pm2_5_ug_m3"] * 2.0 +
                            df["pm10_ug_m3"] * 1.0 +
                            df["h2s_so2_ppm"] * 3.0 +
                            df["voc_a_u"] * 0.5)
    df["co2_humidity_ratio"] = df["co2_ppm"] / (df["humidity_pct"] + 1e-6)
    df["pm_ratio"] = df["pm2_5_ug_m3"] / (df["pm10_ug_m3"] + 1e-6)
    df["aqi_exposure_index"] = df["aqi"] * df["exposure_hours"]
    df["voc_co2_combined"] = (df["voc_a_u"] / 384.0 * 0.4 +
                              df["co2_ppm"] / 1635.0 * 0.6)
    df["thermal_comfort_index"] = df["temperature_C"] * df["humidity_pct"] / 100.0
    return df