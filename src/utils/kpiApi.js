// src/utils/kpiApi.js
import axios from "axios";
import { BASE_URL } from "./config";

export async function getKPI(serviceType) {
  // serviceType should be 'house_painting' or 'deep_cleaning'
  return axios.get(`${BASE_URL}/kpi-parameters/${serviceType}`);
}

export async function updateRanges(serviceType, rangesPayload) {
  // rangesPayload = { surveyPercentage: {a:...,b:...,c:...,d:...,e:...}, ... }
  return axios.put(`${BASE_URL}/kpi-parameters/${serviceType}/ranges`, { ranges: rangesPayload });
}

export async function updateMetrics(serviceType, metricsPayload) {
  // metricsPayload = { surveyPercentage: { red: 10, green: 40 }, rating: { green: 4.5 } }
  return axios.put(`${BASE_URL}/kpi-parameters/${serviceType}/metrics`, { metrics: metricsPayload });
}
