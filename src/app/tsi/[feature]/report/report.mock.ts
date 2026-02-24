import type { ReportByFeatureResponse } from "@/services/subgroupService";

export const reportMockResponse: ReportByFeatureResponse = {
  "status": "OK",
  "status_code": 200,
  "message": "Subgroup Report info retrieved successfully",
  "data": {
    "subgroup_id": 6,
    "set_name": "Set 2",
    "outcome": "CDR-SB",
    "month": 12,
    "report_json": {
      "overview_description": [
        {
          "title": "Executive Summary & Stratification Strategy",
          "description": "Patients were initially stratified based on the model's predicted progression effect into three distinct categories:\n\nSlow: X<=3, Moderate: X>3 and X<=5, Rapid: X>5\n\nTo enhance clinical interpretability, we utilized the CART algorithm to translate complex model parameters into simplified, feature-based decision rules."
        },
        {
          "title": "Feature-Based Decision Rules (CART-derived)",
          "description": "The variance decomposition analysis identified key baseline drivers and their respective clinical thresholds that define each subgroup:\n\nHigh Risk (Rapid): Patients with CDPCARE > 1.00. Low Risk (Slow): Patients with CDPCARE ≤ 0.01. Moderate: All patients not meeting the specific High or Low-risk criteria."
        },
        {
          "title": "Prognostic Trajectory & Validation",
          "description": "The longitudinal trajectories for the feature-based subgroups show a high degree of consistency with the original model-based classifications validating the reliability of these simplified rules. This rule-based approach captures 34.2% of the total variance (𝑉𝑅 : 0.544), effectively identifying the accelerated cognitive decline (CDR-SB) observed in the High Risk group starting from Month 12"
        },
        {
          "title": "Risk & Response Assessment",
          "description": "Risk & Response Assessment (rHTE & Safety)\n\nDrug Response (rHTE): Forest plot analysis indicates that the High Risk (Rapid) subgroup exhibits the most pronounced therapeutic benefit compared to the placebo.\n\nSafety Assessment : Consistent safety profiles were observed across all subgroups, supporting the clinical utility of this classification system for targeted patient management."
        }
      ],
      "model_stratification_strategy": [
        {
          "feature_name": "CDR-SB",
          "group": "group1",
          "month": 0,
          "mean": 1.6879,
          "ci_low": 1.578,
          "ci_high": 1.7978,
          "n": 270,
          "cutoff": "<= 3"
        },
        {
          "feature_name": "CDR-SB",
          "group": "group1",
          "month": 3,
          "mean": 1.8124,
          "ci_low": 1.701,
          "ci_high": 1.9238,
          "n": 270,
          "cutoff": "<= 3"
        },
        {
          "feature_name": "CDR-SB",
          "group": "group1",
          "month": 6,
          "mean": 1.7586,
          "ci_low": 1.6488,
          "ci_high": 1.8684,
          "n": 270,
          "cutoff": "<= 3"
        },
        {
          "feature_name": "CDR-SB",
          "group": "group1",
          "month": 9,
          "mean": 1.7879,
          "ci_low": 1.6758,
          "ci_high": 1.9001,
          "n": 270,
          "cutoff": "<= 3"
        },
        {
          "feature_name": "CDR-SB",
          "group": "group1",
          "month": 12,
          "mean": 1.7602,
          "ci_low": 1.6584,
          "ci_high": 1.862,
          "n": 270,
          "cutoff": "<= 3"
        },
        {
          "feature_name": "CDR-SB",
          "group": "group1",
          "month": 15,
          "mean": 1.8163,
          "ci_low": 1.7051,
          "ci_high": 1.9275,
          "n": 262,
          "cutoff": "<= 3"
        },
        {
          "feature_name": "CDR-SB",
          "group": "group1",
          "month": 18,
          "mean": 1.7814,
          "ci_low": 1.6571,
          "ci_high": 1.9057,
          "n": 217,
          "cutoff": "<= 3"
        },
        {
          "feature_name": "CDR-SB",
          "group": "group2",
          "month": 0,
          "mean": 3.4303,
          "ci_low": 3.3593,
          "ci_high": 3.5013,
          "n": 340,
          "cutoff": "> 3 and <= 5"
        },
        {
          "feature_name": "CDR-SB",
          "group": "group2",
          "month": 3,
          "mean": 3.3923,
          "ci_low": 3.307,
          "ci_high": 3.4776,
          "n": 340,
          "cutoff": "> 3 and <= 5"
        },
        {
          "feature_name": "CDR-SB",
          "group": "group2",
          "month": 6,
          "mean": 3.5968,
          "ci_low": 3.5255,
          "ci_high": 3.668,
          "n": 340,
          "cutoff": "> 3 and <= 5"
        },
        {
          "feature_name": "CDR-SB",
          "group": "group2",
          "month": 9,
          "mean": 3.7357,
          "ci_low": 3.6634,
          "ci_high": 3.8079,
          "n": 340,
          "cutoff": "> 3 and <= 5"
        },
        {
          "feature_name": "CDR-SB",
          "group": "group2",
          "month": 12,
          "mean": 3.8983,
          "ci_low": 3.8406,
          "ci_high": 3.9559,
          "n": 340,
          "cutoff": "> 3 and <= 5"
        },
        {
          "feature_name": "CDR-SB",
          "group": "group2",
          "month": 15,
          "mean": 4.0583,
          "ci_low": 3.987,
          "ci_high": 4.1297,
          "n": 319,
          "cutoff": "> 3 and <= 5"
        },
        {
          "feature_name": "CDR-SB",
          "group": "group2",
          "month": 18,
          "mean": 4.2786,
          "ci_low": 4.1519,
          "ci_high": 4.4053,
          "n": 146,
          "cutoff": "> 3 and <= 5"
        },
        {
          "feature_name": "CDR-SB",
          "group": "group3",
          "month": 0,
          "mean": 5.8746,
          "ci_low": 5.614,
          "ci_high": 6.1351,
          "n": 214,
          "cutoff": "> 5"
        },
        {
          "feature_name": "CDR-SB",
          "group": "group3",
          "month": 3,
          "mean": 5.5547,
          "ci_low": 5.2769,
          "ci_high": 5.8324,
          "n": 214,
          "cutoff": "> 5"
        },
        {
          "feature_name": "CDR-SB",
          "group": "group3",
          "month": 6,
          "mean": 6.2791,
          "ci_low": 6.0007,
          "ci_high": 6.5576,
          "n": 214,
          "cutoff": "> 5"
        },
        {
          "feature_name": "CDR-SB",
          "group": "group3",
          "month": 9,
          "mean": 6.7919,
          "ci_low": 6.4827,
          "ci_high": 7.1011,
          "n": 214,
          "cutoff": "> 5"
        },
        {
          "feature_name": "CDR-SB",
          "group": "group3",
          "month": 12,
          "mean": 7.4594,
          "ci_low": 7.1482,
          "ci_high": 7.7706,
          "n": 214,
          "cutoff": "> 5"
        },
        {
          "feature_name": "CDR-SB",
          "group": "group3",
          "month": 15,
          "mean": 7.9141,
          "ci_low": 7.5479,
          "ci_high": 8.2802,
          "n": 197,
          "cutoff": "> 5"
        },
        {
          "feature_name": "CDR-SB",
          "group": "group3",
          "month": 18,
          "mean": 8.6178,
          "ci_low": 8.0768,
          "ci_high": 9.1589,
          "n": 81,
          "cutoff": "> 5"
        }
      ],
      "feature_stratification_strategy": [
        {
          "feature_name": "CDR-SB",
          "group": "group1",
          "month": 0,
          "mean": 0.1253,
          "ci_low": 0.0974,
          "ci_high": 0.1532,
          "n": 689,
          "cutoff": "CDR-SB <= 0.0139"
        },
        {
          "feature_name": "CDR-SB",
          "group": "group1",
          "month": 3,
          "mean": 0.1535,
          "ci_low": 0.1494,
          "ci_high": 0.1575,
          "n": 689,
          "cutoff": "CDR-SB <= 0.0139"
        },
        {
          "feature_name": "CDR-SB",
          "group": "group1",
          "month": 6,
          "mean": 0.2727,
          "ci_low": 0.2333,
          "ci_high": 0.3121,
          "n": 689,
          "cutoff": "CDR-SB <= 0.0139"
        },
        {
          "feature_name": "CDR-SB",
          "group": "group1",
          "month": 9,
          "mean": 0.4026,
          "ci_low": 0.3437,
          "ci_high": 0.4615,
          "n": 673,
          "cutoff": "CDR-SB <= 0.0139"
        },
        {
          "feature_name": "CDR-SB",
          "group": "group1",
          "month": 12,
          "mean": 0.5687,
          "ci_low": 0.4873,
          "ci_high": 0.6501,
          "n": 571,
          "cutoff": "CDR-SB <= 0.0139"
        },
        {
          "feature_name": "CDR-SB",
          "group": "group1",
          "month": 15,
          "mean": 0.737,
          "ci_low": 0.6321,
          "ci_high": 0.8419,
          "n": 546,
          "cutoff": "CDR-SB <= 0.0139"
        },
        {
          "feature_name": "CDR-SB",
          "group": "group1",
          "month": 18,
          "mean": 0.7761,
          "ci_low": 0.6338,
          "ci_high": 0.9183,
          "n": 336,
          "cutoff": "CDR-SB <= 0.0139"
        },
        {
          "feature_name": "CDR-SB",
          "group": "group2",
          "month": 0,
          "mean": 0.34,
          "ci_low": 0.2838,
          "ci_high": 0.3961,
          "n": 391,
          "cutoff": "CDR-SB 0.0139 < and <= 1.0022"
        },
        {
          "feature_name": "CDR-SB",
          "group": "group2",
          "month": 3,
          "mean": 0.1713,
          "ci_low": 0.1639,
          "ci_high": 0.1787,
          "n": 391,
          "cutoff": "CDR-SB 0.0139 < and <= 1.0022"
        },
        {
          "feature_name": "CDR-SB",
          "group": "group2",
          "month": 6,
          "mean": 0.5933,
          "ci_low": 0.5197,
          "ci_high": 0.6668,
          "n": 391,
          "cutoff": "CDR-SB 0.0139 < and <= 1.0022"
        },
        {
          "feature_name": "CDR-SB",
          "group": "group2",
          "month": 9,
          "mean": 0.8217,
          "ci_low": 0.7006,
          "ci_high": 0.9428,
          "n": 366,
          "cutoff": "CDR-SB 0.0139 < and <= 1.0022"
        },
        {
          "feature_name": "CDR-SB",
          "group": "group2",
          "month": 12,
          "mean": 1.4377,
          "ci_low": 1.2216,
          "ci_high": 1.6537,
          "n": 234,
          "cutoff": "CDR-SB 0.0139 < and <= 1.0022"
        },
        {
          "feature_name": "CDR-SB",
          "group": "group2",
          "month": 15,
          "mean": 1.7413,
          "ci_low": 1.4499,
          "ci_high": 2.0328,
          "n": 215,
          "cutoff": "CDR-SB 0.0139 < and <= 1.0022"
        },
        {
          "feature_name": "CDR-SB",
          "group": "group2",
          "month": 18,
          "mean": 2.6507,
          "ci_low": 2.1428,
          "ci_high": 3.1586,
          "n": 100,
          "cutoff": "CDR-SB 0.0139 < and <= 1.0022"
        },
        {
          "feature_name": "CDR-SB",
          "group": "group3",
          "month": 0,
          "mean": 0.6783,
          "ci_low": 0.3627,
          "ci_high": 0.9939,
          "n": 25,
          "cutoff": "CDR-SB > 1.0022"
        },
        {
          "feature_name": "CDR-SB",
          "group": "group3",
          "month": 3,
          "mean": 0.45,
          "ci_low": 0.3851,
          "ci_high": 0.5148,
          "n": 25,
          "cutoff": "CDR-SB > 1.0022"
        },
        {
          "feature_name": "CDR-SB",
          "group": "group3",
          "month": 6,
          "mean": 1.3481,
          "ci_low": 1.0217,
          "ci_high": 1.6745,
          "n": 25,
          "cutoff": "CDR-SB > 1.0022"
        },
        {
          "feature_name": "CDR-SB",
          "group": "group3",
          "month": 9,
          "mean": 1.9976,
          "ci_low": 1.2987,
          "ci_high": 2.6966,
          "n": 23,
          "cutoff": "CDR-SB > 1.0022"
        },
        {
          "feature_name": "CDR-SB",
          "group": "group3",
          "month": 12,
          "mean": 2.2727,
          "ci_low": 1.4775,
          "ci_high": 3.0679,
          "n": 19,
          "cutoff": "CDR-SB > 1.0022"
        },
        {
          "feature_name": "CDR-SB",
          "group": "group3",
          "month": 15,
          "mean": 1.8798,
          "ci_low": 1.0103,
          "ci_high": 2.7494,
          "n": 17,
          "cutoff": "CDR-SB > 1.0022"
        },
        {
          "feature_name": "CDR-SB",
          "group": "group3",
          "month": 18,
          "mean": 2.2221,
          "ci_low": 0.7898,
          "ci_high": 3.6545,
          "n": 8,
          "cutoff": "CDR-SB > 1.0022"
        }
      ],
      "model_variance_decomposition": [
        {
          "group": "group1",
          "variance": 0.7218,
          "number": 270,
          "vr": 0.1113,
          "ci": "boot 95% CI 0.09814 - 0.1233",
          "eta_square": 0.7321,
          "omega": 0.7313
        },
        {
          "group": "group2",
          "variance": 0.292,
          "number": 340,
          "vr": 0.045,
          "ci": "boot 95% CI 0.04016 - 0.04968",
          "eta_square": 0.7321,
          "omega": 0.7313
        },
        {
          "group": "group3",
          "variance": 5.3337,
          "number": 214,
          "vr": 0.8227,
          "ci": "boot 95% CI 0.6386 - 1.03",
          "eta_square": 0.7321,
          "omega": 0.7313
        }
      ],
      "model_within_group_variance_by_subgroup": [
        {
          "group": "group1",
          "number": 270,
          "variance": 0.7218,
          "classification": "middle",
          "total_var": 6.4834
        },
        {
          "group": "group2",
          "number": 340,
          "variance": 0.292,
          "classification": "low",
          "total_var": 6.4834
        },
        {
          "group": "group3",
          "number": 214,
          "variance": 5.3337,
          "classification": "high",
          "total_var": 6.4834
        }
      ],
      "feature_variance_decomposition": [
        {
          "group": "group1",
          "variance": 3.5296,
          "number": 571,
          "vr": 0.5444,
          "ci": "boot 95% CI 0.464 - 0.623",
          "eta_square": 0.3425,
          "omega": 0.3406
        },
        {
          "group": "group2",
          "variance": 5.8373,
          "number": 234,
          "vr": 0.9004,
          "ci": "boot 95% CI 0.7087 - 1.095",
          "eta_square": 0.3425,
          "omega": 0.3406
        },
        {
          "group": "group3",
          "variance": 7.5857,
          "number": 19,
          "vr": 1.17,
          "ci": "boot 95% CI 0.4183 - 1.968",
          "eta_square": 0.3425,
          "omega": 0.3406
        }
      ],
      "feature_within_group_variance_by_subgroup": [
        {
          "group": "group1",
          "number": 571,
          "variance": 3.5296,
          "classification": "low",
          "total_var": 6.4834
        },
        {
          "group": "group2",
          "number": 234,
          "variance": 5.8373,
          "classification": "middle",
          "total_var": 6.4834
        },
        {
          "group": "group3",
          "number": 19,
          "variance": 7.5857,
          "classification": "high",
          "total_var": 6.4834
        }
      ],
      "risk_response_assessment": [
        {
          "type": "feature_based",
          "outcome": "CDR-SB",
          "group": "group1",
          "mean": 0.5687,
          "ci_low": 0.4871,
          "ci_high": 0.6503,
          "name": "Disease Progression"
        },
        {
          "type": "feature_based",
          "outcome": "CDR-SB",
          "group": "group2",
          "mean": 1.4377,
          "ci_low": 1.2205,
          "ci_high": 1.6548,
          "name": "Disease Progression"
        },
        {
          "type": "feature_based",
          "outcome": "CDR-SB",
          "group": "group3",
          "mean": 2.2727,
          "ci_low": 1.4203,
          "ci_high": 3.125,
          "name": "Disease Progression"
        },
        {
          "type": "feature_based",
          "outcome": "rHTE",
          "group": "group1",
          "mean": -0.0854,
          "ci_low": -0.1116,
          "ci_high": -0.0592,
          "name": "Drug Response"
        },
        {
          "type": "feature_based",
          "outcome": "rHTE",
          "group": "group2",
          "mean": -0.3151,
          "ci_low": -0.3904,
          "ci_high": -0.2398,
          "name": "Drug Response"
        },
        {
          "type": "feature_based",
          "outcome": "rHTE",
          "group": "group3",
          "mean": -0.1803,
          "ci_low": -0.5661,
          "ci_high": 0.2054,
          "name": "Drug Response"
        },
        {
          "type": "feature_based",
          "outcome": "Safety",
          "group": "group1",
          "mean": 0.3454,
          "ci_low": 0.3139,
          "ci_high": 0.3769,
          "name": "Safety"
        },
        {
          "type": "feature_based",
          "outcome": "Safety",
          "group": "group2",
          "mean": 0.5141,
          "ci_low": 0.4517,
          "ci_high": 0.5765,
          "name": "Safety"
        },
        {
          "type": "feature_based",
          "outcome": "Safety",
          "group": "group3",
          "mean": 0.9302,
          "ci_low": 0.5112,
          "ci_high": 1.3493,
          "name": "Safety"
        },
        {
          "type": "model_based",
          "outcome": "CDR-SB",
          "group": "group1",
          "mean": 0.0947,
          "ci_low": 0.0197,
          "ci_high": 0.1697,
          "name": "Disease Progression"
        },
        {
          "type": "model_based",
          "outcome": "CDR-SB",
          "group": "group2",
          "mean": 0.6435,
          "ci_low": 0.5667,
          "ci_high": 0.7203,
          "name": "Disease Progression"
        },
        {
          "type": "model_based",
          "outcome": "CDR-SB",
          "group": "group3",
          "mean": 2.1494,
          "ci_low": 1.917,
          "ci_high": 2.3817,
          "name": "Disease Progression"
        },
        {
          "type": "model_based",
          "outcome": "rHTE",
          "group": "group1",
          "mean": 0.0266,
          "ci_low": 0.0073,
          "ci_high": 0.0459,
          "name": "Drug Response"
        },
        {
          "type": "model_based",
          "outcome": "rHTE",
          "group": "group2",
          "mean": -0.0899,
          "ci_low": -0.1152,
          "ci_high": -0.0646,
          "name": "Drug Response"
        },
        {
          "type": "model_based",
          "outcome": "rHTE",
          "group": "group3",
          "mean": -0.4793,
          "ci_low": -0.5712,
          "ci_high": -0.3874,
          "name": "Drug Response"
        },
        {
          "type": "model_based",
          "outcome": "Safety",
          "group": "group1",
          "mean": 0.2552,
          "ci_low": 0.2306,
          "ci_high": 0.2798,
          "name": "Safety"
        },
        {
          "type": "model_based",
          "outcome": "Safety",
          "group": "group2",
          "mean": 0.2973,
          "ci_low": 0.2679,
          "ci_high": 0.3267,
          "name": "Safety"
        },
        {
          "type": "model_based",
          "outcome": "Safety",
          "group": "group3",
          "mean": 0.772,
          "ci_low": 0.6864,
          "ci_high": 0.8576,
          "name": "Safety"
        }
      ]
    }
  }
};

export default reportMockResponse;
