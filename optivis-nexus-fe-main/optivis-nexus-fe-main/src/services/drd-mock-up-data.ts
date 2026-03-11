// 시연용 목업 데이터

export const DRD_MOCK_UP_DATA = {
  task_id: "nd20251017ddk7qkyzdrzv71",
  disease_id: "2",
  data_id: "2",
  company_id: "1",
  schema_version: "1.0",
  global_seed: 123,
  profile_name: "t2dm_kr_longstanding",
  generator_version: "cf_sim_v1.0.0",
};

const DRD_MOCK_UP_QUERY = `task_id=${encodeURIComponent(
  DRD_MOCK_UP_DATA.task_id
)}&disease_id=${encodeURIComponent(
  DRD_MOCK_UP_DATA.disease_id
)}&data_id=${encodeURIComponent(DRD_MOCK_UP_DATA.data_id)}`;

export const DRD_DEFAULT_SETTING_PATH = `/drd/default-setting?${DRD_MOCK_UP_QUERY}`;

export const DRD_PATIENT_DISEASE_INFO_PATH =
  `/drd/patient-disease-info?${DRD_MOCK_UP_QUERY}`;
