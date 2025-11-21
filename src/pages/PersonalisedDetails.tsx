import React, { useEffect, useMemo, useState } from "react";
import { CapacitorHttp } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import "../styles/PersonalisedDetails.css";
import { API_ROOT, ONLINE_USER_CREATE_ENDPOINT } from "../constants";
import { LeftIcon } from "../icons/LeftIcon";
import { Modal } from "../components/Modal";
import SuccessSplashImage from "../assets/Splash screen (2).png";
import { isNativeRuntime } from "../utils/platform";

const TOTAL_STEPS = 9;
const NO_SYMPTOM_OPTION = "No current symptoms";
const NO_SURGERY_OPTION = "No past surgeries";
const FAMILY_MEMBER_OPTIONS = ["Father", "Mother", "Siblings", "Grandparents", "Children", "Other"];
const NO_SLEEP_PATTERN_OPTION = "No usual night routine";
type CapFormDataEntry = {
  key: string;
  value: string;
  type: "string" | "base64File";
  contentType?: string;
  fileName?: string;
};

type FormState = {
  firstName: string;
  lastName: string;
  countryCode: string;
  mobile: string;
  email: string;
  gender: string;
  age: string;
  day: string;
  month: string;
  year: string;
  city: string;
  state: string;
  country: string;
  currentHealth: string[];
  healthNotes: string;
  yogaGoals: string[];
  yogaGoalNotes: string; // New
  surgeries: string[];
  surgeryNotes: string;
  familyHistory: string[];
  familyNotes: string;
  familyMembers: string[];
  stressLevel: string;
  physicalMetricsNotes: string; // New
  sleepPattern: string;
  nightRoutineNotes: string; // New
  yogaExperience: string;
  mealType: string;
  stayType: string;
  lifestyleNotes: string; // New
};

type EnumValue = string | { name?: string; status?: string | null };

type EnumResponse = {
  groupName?: string;
  values?: EnumValue[];
};

type ReviewSection = {
  key: string;
  title: string;
  description: string;
  step?: number;
  rows?: { label: string; value: string }[];
  lists?: { label: string; items: string[] }[];
};

const extractActiveEnumNames = (values: EnumValue[]): string[] => {
  const unique: string[] = [];

  values.forEach((value) => {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) unique.push(trimmed);
      return;
    }

    if (value && typeof value === "object") {
      const { name, status } = value;
      if (
        typeof name === "string" &&
        (!status || (typeof status === "string" && status.toUpperCase() === "ACTIVE"))
      ) {
        const trimmed = name.trim();
        if (trimmed) {
          unique.push(trimmed);
        }
      }
    }
  });

  return Array.from(new Set(unique));
};

const parseResponseData = (value: unknown) => {
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
};

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        const commaIndex = reader.result.indexOf(",");
        resolve(commaIndex >= 0 ? reader.result.slice(commaIndex + 1) : reader.result);
      } else {
        reject(new Error("Unable to read file."));
      }
    };
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file."));
    reader.readAsDataURL(file);
  });

const getJson = async (url: string, signal?: AbortSignal) => {
  if (signal?.aborted) {
    throw new DOMException("The request was aborted.", "AbortError");
  }

  if (isNativeRuntime()) {
    const response = await CapacitorHttp.get({ url });
    const parsed =
      typeof response.data === "string"
        ? (() => {
            try {
              return JSON.parse(response.data);
            } catch {
              return response.data;
            }
          })()
        : response.data;

    return { status: response.status, data: parsed };
  }

  const res = await fetch(url, { signal });
  const data = await res.json();
  return { status: res.status, data };
};

const fetchEnumGroup = async (groupName: string, signal: AbortSignal) => {
  const encodedGroup = encodeURIComponent(groupName.trim());
  const { status, data } = await getJson(`${API_ROOT}/api/v1/enum/${encodedGroup}`, signal);
  if (status < 200 || status >= 300) {
    throw new Error(`Request for ${groupName} failed with status ${status}`);
  }

  let values: EnumValue[] | null = null;

  if (Array.isArray(data)) {
    values = data as EnumValue[];
  } else if (
    data &&
    typeof data === "object" &&
    Array.isArray((data as EnumResponse).values)
  ) {
    values = (data as EnumResponse).values as EnumValue[];
  }

  if (!values) {
    throw new Error(`Unexpected response for enum group ${groupName}`);
  }

  return extractActiveEnumNames(values);
};

export const PersonalisedDetails: React.FC = () => {
  const [formData, setFormData] = useState<FormState>({
    firstName: "",
    lastName: "",
    countryCode: "+91",
    mobile: "",
    email: "",
    gender: "",
    age: "",
    day: "",
    month: "",
    year: "",
    city: "",
    state: "",
    country: "",
    currentHealth: [],
    healthNotes: "",
    yogaGoals: [],
    yogaGoalNotes: "", // New
    surgeries: [],
    surgeryNotes: "",
    familyHistory: [],
    familyNotes: "",
    familyMembers: [],
    stressLevel: "",
    physicalMetricsNotes: "", // New
    sleepPattern: "",
    nightRoutineNotes: "", // New
    yogaExperience: "",
    mealType: "",
    stayType: "",
    lifestyleNotes: "", // New
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(1);
  const [reviewEditStep, setReviewEditStep] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [isSuccessSplashVisible, setIsSuccessSplashVisible] = useState(false);
  
  const [symptomOptions, setSymptomOptions] = useState<string[]>([]);
  const [isLoadingSymptoms, setIsLoadingSymptoms] = useState(false);
  const [symptomFetchError, setSymptomFetchError] = useState<string | null>(null);
  const [surgeryOptions, setSurgeryOptions] = useState<string[]>([]);
  const [isLoadingSurgeries, setIsLoadingSurgeries] = useState(false);
  const [surgeryFetchError, setSurgeryFetchError] = useState<string | null>(null);
  const [familyHistoryOptions, setFamilyHistoryOptions] = useState<string[]>([]);
  const [isLoadingFamilyHistory, setIsLoadingFamilyHistory] = useState(false);
  const [familyHistoryFetchError, setFamilyHistoryFetchError] = useState<string | null>(null);
  const [stressLevelOptions, setStressLevelOptions] = useState<string[]>([]);
  const [isLoadingStressLevels, setIsLoadingStressLevels] = useState(false);
  const [stressLevelFetchError, setStressLevelFetchError] = useState<string | null>(null);
  const [yogaGoalOptions, setYogaGoalOptions] = useState<string[]>([]);
  const [isLoadingYogaGoals, setIsLoadingYogaGoals] = useState(false);
  const [yogaGoalFetchError, setYogaGoalFetchError] = useState<string | null>(null);
  const [sleepPatternOptions, setSleepPatternOptions] = useState<string[]>([]);
  const [isLoadingSleepPatterns, setIsLoadingSleepPatterns] = useState(false);
  const [sleepPatternFetchError, setSleepPatternFetchError] = useState<string | null>(null);
  const [yogaExperienceOptions, setYogaExperienceOptions] = useState<string[]>([]);
  const [isLoadingYogaExperience, setIsLoadingYogaExperience] = useState(false);
  const [yogaExperienceFetchError, setYogaExperienceFetchError] = useState<string | null>(null);
  const [mealTypeOptions, setMealTypeOptions] = useState<string[]>([]);
  const [isLoadingMealTypes, setIsLoadingMealTypes] = useState(false);
  const [mealTypeFetchError, setMealTypeFetchError] = useState<string | null>(null);
  const [stayTypeOptions, setStayTypeOptions] = useState<string[]>([]);
  const [isLoadingStayTypes, setIsLoadingStayTypes] = useState(false);
  const [stayTypeFetchError, setStayTypeFetchError] = useState<string | null>(null);
  const [genderOptions, setGenderOptions] = useState<string[]>([]);
  const [isLoadingGenders, setIsLoadingGenders] = useState(false);
  const [genderFetchError, setGenderFetchError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    setIsModalOpen(true);
  }, []);


  useEffect(() => {
    const symptomController = new AbortController();
    const surgeryController = new AbortController();
    const familyHistoryController = new AbortController();
    const yogaGoalController = new AbortController();
    const stressLevelController = new AbortController();
    const sleepPatternController = new AbortController();
    const yogaExperienceController = new AbortController();
    const mealTypeController = new AbortController();
    const stayTypeController = new AbortController();
    const genderController = new AbortController();

    const fetchYogaGoalOptions = async () => {
      setIsLoadingYogaGoals(true);
      setYogaGoalFetchError(null);

      try {
        const options = await fetchEnumGroup("Yoga Goals", yogaGoalController.signal);
        setYogaGoalOptions(options);
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }
        console.error("Unable to load yoga goals", error);
        setYogaGoalFetchError("We couldn't load yoga goals. Please try again shortly.");
      } finally {
        setIsLoadingYogaGoals(false);
      }
    };

    const fetchSymptomOptions = async () => {
      setIsLoadingSymptoms(true);
      setSymptomFetchError(null);

      try {
        const options = await fetchEnumGroup("Symptoms", symptomController.signal);
        const finalOptions = options.includes(NO_SYMPTOM_OPTION)
          ? options
          : [...options, NO_SYMPTOM_OPTION];
        setSymptomOptions(finalOptions);
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }
        console.error("Unable to load symptom options", error);
        setSymptomFetchError("We couldn't load symptom options. Please try again shortly.");
      } finally {
        setIsLoadingSymptoms(false);
      }
    };

    const fetchSurgeryOptions = async () => {
      setIsLoadingSurgeries(true);
      setSurgeryFetchError(null);

      try {
        const options = await fetchEnumGroup("Surgeries", surgeryController.signal);
        const finalOptions = options.includes(NO_SURGERY_OPTION)
          ? options
          : [...options, NO_SURGERY_OPTION];
        setSurgeryOptions(finalOptions);
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }
        console.error("Unable to load surgery options", error);
        setSurgeryFetchError("We couldn't load medical history options. Please try again shortly.");
      } finally {
        setIsLoadingSurgeries(false);
      }
    };

    const fetchFamilyHistoryOptions = async () => {
      setIsLoadingFamilyHistory(true);
      setFamilyHistoryFetchError(null);

      try {
        const options = await fetchEnumGroup("Hereditary", familyHistoryController.signal);
        setFamilyHistoryOptions(options);
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }
        console.error("Unable to load family history options", error);
        setFamilyHistoryFetchError("We couldn't load family health history. Please try again shortly.");
      } finally {
        setIsLoadingFamilyHistory(false);
      }
    };

    const fetchStressLevelOptions = async () => {
      setIsLoadingStressLevels(true);
      setStressLevelFetchError(null);

      try {
        const options = await fetchEnumGroup("Stress Level", stressLevelController.signal);
        setStressLevelOptions(options);
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }
        console.error("Unable to load stress level options", error);
        setStressLevelFetchError("We couldn't load stress levels. Please try again shortly.");
      } finally {
        setIsLoadingStressLevels(false);
      }
    };

    const fetchSleepPatternOptions = async () => {
      setIsLoadingSleepPatterns(true);
      setSleepPatternFetchError(null);

      try {
        const options = await fetchEnumGroup("Sleep Patterns", sleepPatternController.signal);
        const finalOptions = options.includes(NO_SLEEP_PATTERN_OPTION)
          ? options
          : [...options, NO_SLEEP_PATTERN_OPTION];
        setSleepPatternOptions(finalOptions);
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }
        console.error("Unable to load sleep pattern options", error);
        setSleepPatternFetchError("We couldn't load night routine options. Please try again shortly.");
      } finally {
        setIsLoadingSleepPatterns(false);
      }
    };

    const fetchYogaExperienceOptions = async () => {
      setIsLoadingYogaExperience(true);
      setYogaExperienceFetchError(null);

      try {
        const options = await fetchEnumGroup("Experience Level", yogaExperienceController.signal);
        setYogaExperienceOptions(options);
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }
        console.error("Unable to load yoga experience options", error);
        setYogaExperienceFetchError("We couldn't load yoga experience options. Please try again shortly.");
      } finally {
        setIsLoadingYogaExperience(false);
      }
    };

    const fetchMealTypeOptions = async () => {
      setIsLoadingMealTypes(true);
      setMealTypeFetchError(null);

      try {
        const options = await fetchEnumGroup("Meal Type", mealTypeController.signal);
        setMealTypeOptions(options);
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }
        console.error("Unable to load meal types", error);
        setMealTypeFetchError("We couldn't load meal types. Please try again shortly.");
      } finally {
        setIsLoadingMealTypes(false);
      }
    };

    const fetchStayTypeOptions = async () => {
      setIsLoadingStayTypes(true);
      setStayTypeFetchError(null);

      try {
        const options = await fetchEnumGroup("Stay Type", stayTypeController.signal);
        setStayTypeOptions(options);
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }
        console.error("Unable to load stay types", error);
        setStayTypeFetchError("We couldn't load stay types. Please try again shortly.");
      } finally {
        setIsLoadingStayTypes(false);
      }
    };

    const fetchGenderOptions = async () => {
      setIsLoadingGenders(true);
      setGenderFetchError(null);

      try {
        const options = await fetchEnumGroup("Gender", genderController.signal);
        setGenderOptions(options.length ? options : ["Male", "Female"]);
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }
        console.error("Unable to load gender options", error);
        setGenderOptions(["Male", "Female"]);
        setGenderFetchError("We couldn't load gender options. Please try again shortly.");
      } finally {
        setIsLoadingGenders(false);
      }
    };

    fetchYogaGoalOptions();
    fetchSymptomOptions();
    fetchSurgeryOptions();
    fetchFamilyHistoryOptions();
    fetchStressLevelOptions();
    fetchSleepPatternOptions();
    fetchYogaExperienceOptions();
    fetchMealTypeOptions();
    fetchStayTypeOptions();
    fetchGenderOptions();

    return () => {
      yogaGoalController.abort();
      symptomController.abort();
      surgeryController.abort();
      familyHistoryController.abort();
      stressLevelController.abort();
      sleepPatternController.abort();
      yogaExperienceController.abort();
      mealTypeController.abort();
      stayTypeController.abort();
      genderController.abort();
    };
  }, []);

  const validatePersonalInfo = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!selectedFile) newErrors.image = "Profile picture is required";
    if (!formData.mobile.trim()) newErrors.mobile = "Mobile number is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!formData.gender) newErrors.gender = "Gender is required";
    if (!formData.age && (!formData.day || !formData.month || !formData.year)) {
      newErrors.age = "Please enter your age or date of birth.";
    }
    if (!formData.city.trim()) newErrors.city = "City is required";
    if (!formData.state.trim()) newErrors.state = "State is required";
    if (!formData.country) newErrors.country = "Country is required";
    return newErrors;
  };

  const validateSymptomDetails = () => {
    const newErrors: Record<string, string> = {};
    if (formData.currentHealth.length === 0 && !formData.healthNotes.trim()) {
      newErrors.currentHealth = "Select a symptom or share details about your current health.";
    }
    return newErrors;
  };

  const validateYogaGoals = () => {
    const newErrors: Record<string, string> = {};
    if (formData.yogaGoals.length === 0) {
      newErrors.yogaGoals = "Select at least one personal goal.";
    }
    return newErrors;
  };

  const validateMedicalHistory = () => {
    const newErrors: Record<string, string> = {};
    if (formData.surgeries.length === 0 && !formData.surgeryNotes.trim()) {
      newErrors.surgeries = "Select a surgery or tell us about your medical history.";
    }
    return newErrors;
  };

const validateFamilyHistory = () => {
    const newErrors: Record<string, string> = {};
    if (formData.familyHistory.length === 0 && !formData.familyNotes.trim()) {
      newErrors.familyHistory = "Select a family condition or share details about family health.";
    }
    return newErrors;
  };

  const validateLifestyleHabits = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.yogaExperience) {
      newErrors.yogaExperience = "Select your current yoga experience level.";
    }
    if (!formData.mealType) {
      newErrors.mealType = "Select the meal type that fits you best.";
    }
    if (!formData.stayType) {
      newErrors.stayType = "Let us know where you stay.";
    }
    return newErrors;
  };

  const validatePhysicalMetrics = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.stressLevel) {
      newErrors.stressLevel = "Select your current stress level.";
    }
    return newErrors;
  };

  const validateNightRoutine = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.sleepPattern) {
      newErrors.sleepPattern = "Select the option that best describes your night routine.";
    }
    return newErrors;
  };

  const clearFieldError = (field: string) => {
    setErrors((prev) => {
      if (!prev[field]) {
        return prev;
      }
      const { [field]: _removed, ...rest } = prev;
      return rest;
    });
  };

  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const age = e.target.value;
    setFormData((prev) => ({
      ...prev,
      age,
      day: "",
      month: "",
      year: "",
    }));
    clearFieldError("age");
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const shouldResetAge = name === "day" || name === "month" || name === "year";
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(shouldResetAge ? { age: "" } : {}),
    }));
    clearFieldError(name);
  };

  const handleGenderSelect = (gender: string) => {
    setFormData((prev) => ({ ...prev, gender }));
    clearFieldError("gender");
  };

  const handleYogaGoalToggle = (value: string) => {
    setFormData((prev) => {
      const hasValue = prev.yogaGoals.includes(value);
      const updated = hasValue
        ? prev.yogaGoals.filter((item) => item !== value)
        : [...prev.yogaGoals, value];

      return { ...prev, yogaGoals: updated };
    });
    clearFieldError("yogaGoals");
  };

  const handleSymptomToggle = (value: string) => {
    setFormData((prev) => {
      const hasValue = prev.currentHealth.includes(value);
      let updated: string[];

      if (value === NO_SYMPTOM_OPTION) {
        updated = hasValue ? [] : [NO_SYMPTOM_OPTION];
      } else if (hasValue) {
        updated = prev.currentHealth.filter((item) => item !== value);
      } else {
        updated = [...prev.currentHealth.filter((item) => item !== NO_SYMPTOM_OPTION), value];
      }

      return { ...prev, currentHealth: updated };
    });
    clearFieldError("currentHealth");
  };

  const handleSurgeryToggle = (value: string) => {
    setFormData((prev) => {
      const hasValue = prev.surgeries.includes(value);
      let updated: string[];

      if (value === NO_SURGERY_OPTION) {
        updated = hasValue ? [] : [NO_SURGERY_OPTION];
      } else if (hasValue) {
        updated = prev.surgeries.filter((item) => item !== value);
      } else {
        updated = [...prev.surgeries.filter((item) => item !== NO_SURGERY_OPTION), value];
      }

      return { ...prev, surgeries: updated };
    });
    clearFieldError("surgeries");
  };

  const handleFamilyHistoryToggle = (value: string) => {
    setFormData((prev) => {
      const hasValue = prev.familyHistory.includes(value);
      const updated = hasValue
        ? prev.familyHistory.filter((item) => item !== value)
        : [...prev.familyHistory, value];

      return {
        ...prev,
        familyHistory: updated,
        familyMembers: updated.length === 0 ? [] : prev.familyMembers,
      };
    });
    clearFieldError("familyHistory");
  };

  const handleStressLevelSelect = (level: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      stressLevel: checked ? level : prev.stressLevel === level ? "" : prev.stressLevel,
    }));
    clearFieldError("stressLevel");
  };

  const handleSleepPatternCheckbox = (pattern: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      sleepPattern: checked ? pattern : prev.sleepPattern === pattern ? "" : prev.sleepPattern,
    }));
    clearFieldError("sleepPattern");
  };

  const handleYogaExperienceSelect = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      yogaExperience: prev.yogaExperience === value ? "" : value,
    }));
    clearFieldError("yogaExperience");
  };

  const handleMealTypeSelect = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      mealType: prev.mealType === value ? "" : value,
    }));
    clearFieldError("mealType");
  };

  const handleStayTypeSelect = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      stayType: prev.stayType === value ? "" : value,
    }));
    clearFieldError("stayType");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  const handlePreviousStep = () => {
    if (reviewEditStep !== null && reviewEditStep === currentStep) {
      setReviewEditStep(null);
      setCurrentStep(9);
      setErrors({});
      return;
    }
    setCurrentStep((prev) => Math.max(1, prev - 1));
    setErrors({});
  };

  const goToReviewOrStep = (nextStep: number) => {
    if (reviewEditStep !== null && reviewEditStep === currentStep) {
      setReviewEditStep(null);
      setCurrentStep(9);
    } else {
      setCurrentStep(nextStep);
    }
  };

  const renderPrimaryButton = (defaultLabel = "Next") => {
    const isEditingThisStep = reviewEditStep === currentStep;
    return (
      <div className="buttonRow">
        <button
          className={isEditingThisStep ? "updateButton" : "nextButton"}
          type="submit"
        >
          {isEditingThisStep ? "Update" : defaultLabel}
        </button>
      </div>
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (currentStep === 1) {
      const personalErrors = validatePersonalInfo();
      if (Object.keys(personalErrors).length > 0) {
        setErrors(personalErrors);
        return;
      }

      setErrors({});
      goToReviewOrStep(2);
      return;
    }
    if (currentStep === 2) {
      const goalErrors = validateYogaGoals();
      if (Object.keys(goalErrors).length > 0) {
        setErrors(goalErrors);
        return;
      }

      setErrors({});
      goToReviewOrStep(3);
      return;
    }
    if (currentStep === 3) {
      const symptomErrors = validateSymptomDetails();
      if (Object.keys(symptomErrors).length > 0) {
        setErrors(symptomErrors);
        return;
      }

      setErrors({});
      goToReviewOrStep(4);
      return;
    }
    if (currentStep === 4) {
      const medicalErrors = validateMedicalHistory();
      if (Object.keys(medicalErrors).length > 0) {
        setErrors(medicalErrors);
        return;
      }

      setErrors({});
      goToReviewOrStep(5);
      return;
    }

    if (currentStep === 5) {
      const familyErrors = validateFamilyHistory();
      if (Object.keys(familyErrors).length > 0) {
        setErrors(familyErrors);
        return;
      }

      setErrors({});
      goToReviewOrStep(6);
      return;
    }

    if (currentStep === 6) {
      const physicalErrors = validatePhysicalMetrics();
      if (Object.keys(physicalErrors).length > 0) {
        setErrors(physicalErrors);
        return;
      }

      setErrors({});
      goToReviewOrStep(7);
      return;
    }

    if (currentStep === 7) {
      const nightRoutineErrors = validateNightRoutine();
      if (Object.keys(nightRoutineErrors).length > 0) {
        setErrors(nightRoutineErrors);
        return;
      }

      setErrors({});
      goToReviewOrStep(8);
      return;
    }

    if (currentStep === 8) {
      const lifestyleErrors = validateLifestyleHabits();
      if (Object.keys(lifestyleErrors).length > 0) {
        setErrors(lifestyleErrors);
        return;
      }

      setErrors({});
      goToReviewOrStep(9); // Move to the new review step
      return;
    }

    if (currentStep === 9) {
      setErrors({});

      const now = new Date();
      const subscribeDate = now.toISOString();
      const subscribeExpiry = new Date(now);
      subscribeExpiry.setFullYear(subscribeExpiry.getFullYear() + 1);

      const ageValue = formData.age.trim();
      const maybeAge = Number(ageValue);
      const age = ageValue && Number.isFinite(maybeAge) ? maybeAge : null;

      const mobileDigits = formData.mobile.replace(/\D/g, "");
      const mobileNumber = mobileDigits || "";

      const symptoms = formData.currentHealth.includes(NO_SYMPTOM_OPTION)
        ? []
        : formData.currentHealth;
      const surgeries = formData.surgeries.includes(NO_SURGERY_OPTION) ? [] : formData.surgeries;
      const password = `${formData.firstName.trim() || "User"}@123`;

      const otherNotes = [
        formData.healthNotes,
        formData.yogaGoalNotes,
        formData.surgeryNotes,
        formData.familyNotes,
        formData.physicalMetricsNotes,
        formData.nightRoutineNotes,
        formData.lifestyleNotes,
      ]
        .map((note) => note.trim())
        .filter(Boolean)
        .join(" | ");

      const payload = {
        name: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        state: formData.state.trim(),
        country: formData.country.trim(),
        email: formData.email.trim(),
        mobileNumber,
        countryCode: formData.countryCode.trim(),
        gender: formData.gender,
        age: age ?? null,
        level: formData.yogaExperience,
        healthNotes: formData.healthNotes.trim(),
        yogaGoals: formData.yogaGoals,
        symptoms,
        surgeries,
        healthHistory: formData.familyHistory,
        city: formData.city.trim(),
        mealType: formData.mealType,
        stayType: formData.stayType,
        stressLevel: formData.stressLevel,
        sleepPattern: formData.sleepPattern,
        otherNotes,
        password,
        subscribeDate,
        subscribeExpiryDate: subscribeExpiry.toISOString(),
        online: true,
        status: "PENDING",
      };

      const requestUrl = ONLINE_USER_CREATE_ENDPOINT;

      console.log("Final payload:", payload);
      console.log("Submitting payload to:", requestUrl);

      try {
        const { value: token } = await Preferences.get({ key: "accessToken" });
        if (!token) {
          throw new Error("Authentication token not found. Please log in again.");
        }

        const headers = {
          'Authorization': `Bearer ${token}`
        };

        let status: number;
        let rawBody: any;

        if (isNativeRuntime()) {
          const fd = new FormData();
          fd.append("online_user", JSON.stringify(payload));

          if (selectedFile) {
            fd.append("image", selectedFile, selectedFile.name);
          }

          const response = await CapacitorHttp.post({
            url: requestUrl,
            headers,
            data: {},
            webFetchExtra: {
              method: "POST",
              body: fd,
              headers: {},
            },
          });

          status = response.status;
          rawBody = response.data;
        } else {
          const fd = new FormData();
          fd.append("online_user", JSON.stringify(payload));

          if (selectedFile) {
            fd.append("image", selectedFile, selectedFile.name);
          }

          const response = await fetch(requestUrl, {
            method: "POST",
            headers,
            body: fd,
          });

          status = response.status;
          rawBody = await response.text();
        }


        console.log("Response status:", status, "from:", requestUrl);

        const parsedBody = parseResponseData(rawBody);

        if (status < 200 || status >= 300) {
          const message =
            (parsedBody && typeof parsedBody === "object" && "message" in parsedBody
              ? (parsedBody as { message?: string }).message
              : null) ||
            (typeof parsedBody === "string" && parsedBody.trim() ? parsedBody : null) ||
            `HTTP error! status: ${status}`;
          throw new Error(message);
        }

        setIsSuccessSplashVisible(true);
        window.scrollTo({ top: 0, behavior: "auto" });
        return;
      } catch (error) {
        console.error("Error submitting form:", error);
        setErrors({ submit: (error as Error).message });
        alert("Failed to submit form: " + (error as Error).message);
      }
      return;
    }
  };

  const handleBackClick = () => {
    if (currentStep === 1) {
      window.history.pushState(null, "", "/home");
    } else {
      handlePreviousStep();
    }
  };

  const isYogaGoalSelected = (value: string) => formData.yogaGoals.includes(value);
  const isSymptomSelected = (value: string) => formData.currentHealth.includes(value);
  const isSurgerySelected = (value: string) => formData.surgeries.includes(value);
  const isStressLevelSelected = (value: string) => formData.stressLevel === value;
  const isFamilyHistorySelected = (value: string) => formData.familyHistory.includes(value);
  const isSleepPatternSelected = (value: string) => formData.sleepPattern === value;
  const isYogaExperienceSelected = (value: string) => formData.yogaExperience === value;
  const isMealTypeSelected = (value: string) => formData.mealType === value;
  const isStayTypeSelected = (value: string) => formData.stayType === value;

  const formatValue = (value?: string | null) => {
    if (value === null || value === undefined) return null;
    const trimmed = value.toString().trim();
    return trimmed.length ? trimmed : null;
  };

  const formatPhoneNumber = () => {
    const phone = formData.mobile?.trim();
    if (!phone) return null;
    const code = formData.countryCode?.trim() || "";
    const combined = `${code} ${phone}`.trim();
    return combined.length ? combined : null;
  };

  const formatDateOfBirth = () => {
    const { day, month, year } = formData;
    const parts = [day, month, year]
      .map((part) => (part ? part.trim() : ""))
      .filter(Boolean);
    if (!parts.length) return null;
    return parts.join(" ");
  };

  const formatListItems = (items: string[], additional?: string) => {
    const cleaned = (items || [])
      .map((item) => item?.trim())
      .filter((item): item is string => Boolean(item && item.length));
    if (additional) {
      const extra = additional.trim();
      if (extra) cleaned.push(extra);
    }
    return cleaned;
  };

  const reviewSections = useMemo<ReviewSection[]>(
    () => [
      {
        key: "personal-info",
        title: "Personal info",
        description: "A few simple details will help Nirvaana craft sessions that truly fit you.",
        step: 1,
        rows: [
          { label: "First name", value: formatValue(formData.firstName) },
          { label: "Last name", value: formatValue(formData.lastName) },
          { label: "Email", value: formatValue(formData.email) },
          { label: "Phone number", value: formatPhoneNumber() },
          { label: "Gender", value: formatValue(formData.gender) },
          { label: "Age", value: formatValue(formData.age) },
          { label: "Date of birth", value: formatDateOfBirth() },
          { label: "City", value: formatValue(formData.city) },
          { label: "State", value: formatValue(formData.state) },
          { label: "Country", value: formatValue(formData.country) },
        ].filter((row): row is { label: string; value: string } => Boolean(row.value)),
      },
      {
        key: "personal-goal",
        title: "Your personal goal!",
        description: "A few simple details will help Nirvaana craft sessions that truly fit you.",
        step: 2,
        lists: [
          {
            label: "Your core intention",
            items: formatListItems(formData.yogaGoals),
          },
        ].filter((list) => list.items.length > 0),
        rows: [
          { label: "Goal notes", value: formatValue(formData.yogaGoalNotes) },
        ].filter((row): row is { label: string; value: string } => Boolean(row.value)),
      },
      {
        key: "current-health",
        title: "Current health",
        description: "A few simple details will help Nirvaana craft sessions that truly fit you.",
        step: 3,
        lists: [
          {
            label: "Physical health",
            items: formatListItems(formData.currentHealth),
          },
        ].filter((list) => list.items.length > 0),
        rows: [{ label: "Health notes", value: formatValue(formData.healthNotes) }].filter(
          (row): row is { label: string; value: string } => Boolean(row.value)
        ),
      },
      {
        key: "medical-history",
        title: "Medical history",
        description: "A few simple details will help Nirvaana craft sessions that truly fit you.",
        step: 4,
        lists: [
          {
            label: "Surgeries & injuries",
            items: formatListItems(formData.surgeries),
          },
        ].filter((list) => list.items.length > 0),
        rows: [{ label: "Surgery notes", value: formatValue(formData.surgeryNotes) }].filter(
          (row): row is { label: string; value: string } => Boolean(row.value)
        ),
      },
      {
        key: "family-health",
        title: "Family health",
        description: "A few simple details will help Nirvaana craft sessions that truly fit you.",
        step: 5,
        lists: [
          {
            label: "Family history",
            items: formatListItems(formData.familyHistory),
          },
        ].filter((list) => list.items.length > 0),
        rows: [
          { label: "Family notes", value: formatValue(formData.familyNotes) },
          {
            label: "Family members",
            value: formatListItems(formData.familyMembers).join(", "),
          },
        ].filter((row): row is { label: string; value: string } => Boolean(row.value)),
      },
      {
        key: "physical-metrics",
        title: "Physical metrics",
        description: "A few simple details will help Nirvaana craft sessions that truly fit you.",
        step: 6,
        rows: [
          { label: "Stress level", value: formatValue(formData.stressLevel) },
          {
            label: "Physical notes",
            value: formatValue(formData.physicalMetricsNotes),
          },
        ].filter((row): row is { label: string; value: string } => Boolean(row.value)),
      },
      {
        key: "night-routine",
        title: "Night routine",
        description: "A few simple details will help Nirvaana craft sessions that truly fit you.",
        step: 7,
        rows: [
          { label: "Sleep pattern", value: formatValue(formData.sleepPattern) },
          { label: "Night routine notes", value: formatValue(formData.nightRoutineNotes) },
        ].filter((row): row is { label: string; value: string } => Boolean(row.value)),
      },
      {
        key: "lifestyle",
        title: "Lifestyle & habits",
        description: "A few simple details will help Nirvaana craft sessions that truly fit you.",
        step: 8,
        rows: [
          { label: "Yoga experience", value: formatValue(formData.yogaExperience) },
          { label: "Meal type", value: formatValue(formData.mealType) },
          { label: "Stay type", value: formatValue(formData.stayType) },
          { label: "Lifestyle notes", value: formatValue(formData.lifestyleNotes) },
        ].filter((row): row is { label: string; value: string } => Boolean(row.value)),
      },
    ],
    [formData]
  );

  const renderSuccessSplash = () => (
    <div className="fullscreen-splash">
      <img src={SuccessSplashImage} alt="Nirvaana Yoga" />
    </div>
  );

  if (isSuccessSplashVisible) {
    return renderSuccessSplash();
  }

  return (
    <div className="personalFormContainer">
      <header className="header">
        <button
          type="button"
          className="backButton"
          onClick={handleBackClick}
          aria-label={currentStep === 1 ? "Back to home" : "Go to previous step"}
        >
          <LeftIcon />
        </button>
        <div className="headerContent">
          <h2 className="brand">Nirva<span className="span-element">a</span>na Yoga</h2>
        </div>
      </header>
      <div className="progress-bar-wrapper">
        <p className="step">
            {currentStep} of {TOTAL_STEPS}
        </p>
        <div className="progress-bar-container">
            <div
            className="progress-bar-fill"
            style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
            ></div>
        </div>
      </div>

      <form className="formBox" onSubmit={handleSubmit}>
        {currentStep === 1 && (
          <>
            <h3 className="formTitle">Personal info</h3>
            <p className="formSubtitle">
              Your journey with Nirvaana begins here. Share a few details about yourself so we can craft yoga sessions that truly fit your body , mind and lifestyle .  
            </p>

            <div className="formField profile-picture-container">
              <label htmlFor="image">
                <div className="profile-picture-placeholder">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Profile Preview" className="profile-picture" />
                  ) : (
                    <span>+</span>
                  )}
                </div>
                Profile picture <span className="required-asterisk">*</span>
              </label>
              <input
                id="image"
                type="file"
                name="image"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: "none" }}
                required={currentStep === 1 && !imagePreview}
                tabIndex={currentStep === 1 ? 0 : -1}
              />
              {errors.image && <p className="error-message">{errors.image}</p>}
            </div>

            <div className="formField">
              <label htmlFor="firstName">First name <span className="required-asterisk">*</span></label>
              <input
                id="firstName"
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Your first name"
                autoComplete="given-name"
                className={errors.firstName ? "error" : ""}
              />
              {errors.firstName && <p className="error-message">{errors.firstName}</p>}
            </div>

            <div className="formField">
              <label htmlFor="lastName">Last name <span className="required-asterisk">*</span></label>
              <input
                id="lastName"
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Your last name"
                autoComplete="family-name"
                className={errors.lastName ? "error" : ""}
              />
              {errors.lastName && <p className="error-message">{errors.lastName}</p>}
            </div>

            <div className="inlineFields">
              <div className="formField">
                <label htmlFor="countryCode">Country <span className="required-asterisk">*</span></label>
                <select
                  id="countryCode"
                  name="countryCode"
                  value={formData.countryCode}
                  onChange={handleChange}
                >
                  <option value="+91">+91</option>
                  <option value="+1">+1</option>
                  <option value="+44">+44</option>
                </select>
              </div>
              <div className="formField">
                <label htmlFor="mobile">Mobile number <span className="required-asterisk">*</span></label>
                <input
                  id="mobile"
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  placeholder="9999999999"
                  maxLength={10}
                  autoComplete="tel-national"
                  className={errors.mobile ? "error" : ""}
                />
                {errors.mobile && <p className="error-message">{errors.mobile}</p>}
              </div>
            </div>

            <div className="formField">
              <label htmlFor="email">Email <span className="required-asterisk">*</span></label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="yourmailid@email.com"
                autoComplete="email"
                className={errors.email ? "error" : ""}
              />
              {errors.email && <p className="error-message">{errors.email}</p>}
            </div>

            <div className="formField">
              <label>Gender <span className="required-asterisk">*</span></label>
              {isLoadingGenders && <p className="helperText">Loading gender options...</p>}
              {genderFetchError && <p className="error-message">{genderFetchError}</p>}
              {!isLoadingGenders && !genderFetchError && genderOptions.length > 0 && (
                <div className="genderGroup">
                  {genderOptions.map((g) => (
                    <button
                      key={g}
                      type="button"
                      className={`genderBtn ${formData.gender === g ? "selected" : ""}`}
                      onClick={() => handleGenderSelect(g)}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              )}
              {!isLoadingGenders && !genderFetchError && genderOptions.length === 0 && (
                <p className="helperText">No gender options available right now.</p>
              )}
              {errors.gender && <p className="error-message">{errors.gender}</p>}
            </div>

            <div className="formField">
              <label htmlFor="age">Age</label>
              <input
                id="age"
                type="number"
                name="age"
                value={formData.age}
                onChange={handleAgeChange}
                placeholder="Your age"
                className={errors.age ? "error" : ""}
              />
            </div>

            <div className="formField">
              <label>Date of birth</label>
              <div className="inlineFields">
                <select
                  name="day"
                  id="day"
                  value={formData.day}
                  onChange={handleChange}
                  className={errors.age ? "error" : ""}
                >
                  <option value="">Day</option>
                  {[...Array(31)].map((_, i) => (
                    <option key={i + 1} value={`${i + 1}`}>
                      {i + 1}
                    </option>
                  ))}
                </select>
                <select
                  name="month"
                  id="month"
                  value={formData.month}
                  onChange={handleChange}
                  className={errors.age ? "error" : ""}
                >
                  <option value="">Month</option>
                  {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map(
                    (m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    )
                  )}
                </select>
                <select
                  name="year"
                  id="year"
                  value={formData.year}
                  onChange={handleChange}
                  className={errors.age ? "error" : ""}
                >
                  <option value="">Year</option>
                  {Array.from({ length: 60 }, (_, i) => 2025 - i).map((y) => (
                    <option key={y} value={`${y}`}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
              {errors.age && (
                <p className="error-message">{errors.age}</p>
              )}
            </div>

            <div className="formField">
              <label htmlFor="city">City <span className="required-asterisk">*</span></label>
              <input
                id="city"
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Bangalore"
                autoComplete="address-level2"
                className={errors.city ? "error" : ""}
              />
              {errors.city && <p className="error-message">{errors.city}</p>}
            </div>

            <div className="formField">
              <label htmlFor="state">State <span className="required-asterisk">*</span></label>
              <input
                id="state"
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="Karnataka"
                autoComplete="address-level1"
                className={errors.state ? "error" : ""}
              />
              {errors.state && <p className="error-message">{errors.state}</p>}
            </div>

            <div className="formField">
              <label htmlFor="country">Country <span className="required-asterisk">*</span></label>
              <select
                id="country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                className={errors.country ? "error" : ""}
              >
                <option value="">Select</option>
                <option value="India">India</option>
                <option value="United States">United States</option>
                <option value="United Kingdom">United Kingdom</option>
              </select>
              {errors.country && <p className="error-message">{errors.country}</p>}
            </div>

            

            {renderPrimaryButton()}
          </>
        )}

        {currentStep === 2 && (
          <>
            <h3 className="formTitle">Your Personal goal!</h3>
            <p className="formSubtitle">
              A few simple details will help Nirvaana craft sessions that truly fit you.
            </p>

            <div className="formField">
              <label className="label-head">Your goals <span className="required-asterisk">*</span></label>
              {isLoadingYogaGoals && <p className="helperText">Loading goals...</p>}
              {yogaGoalFetchError && <p className="error-message">{yogaGoalFetchError}</p>}
              {!isLoadingYogaGoals && !yogaGoalFetchError && (
                <div className="healthOptionsList">
                  {yogaGoalOptions.map((option) => (
                    <label
                      key={option}
                      className={`healthOption ${isYogaGoalSelected(option) ? "selected" : ""}`}
                    >
                      <input
                        type="checkbox"
                        name="yogaGoals"
                        value={option}
                        checked={isYogaGoalSelected(option)}
                        onChange={() => handleYogaGoalToggle(option)}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
                
              )}
              {errors.yogaGoals && <p className="error-message">{errors.yogaGoals}</p>}
            </div>
            <div className="formField">
              <textarea
                id="yogaGoalNotes"
                name="yogaGoalNotes"
                value={formData.yogaGoalNotes}
                onChange={handleChange}
                placeholder="Tell us more..."
              />
            </div>

            {renderPrimaryButton()}
          </>
        )}

        {currentStep === 3 && (
          <>
            <h3 className="formTitle">Current Health </h3>
            <p className="formSubtitle">
              A few simple details will help Nirvaana craft sessions that truly fit you.
            </p>

            <div className="formField">
              <label className="label-head">Physical health</label>
              {isLoadingSymptoms && <p className="helperText">Loading symptom options...</p>}
              {symptomFetchError && <p className="error-message">{symptomFetchError}</p>}
              {!isLoadingSymptoms && !symptomFetchError && (
                <div className="healthOptionsList">
                  {symptomOptions.map((option) => (
                    <label
                      key={option}
                      className={`healthOption ${isSymptomSelected(option) ? "selected" : ""}`}
                    >
                      <input
                        type="checkbox"
                        name="currentHealth"
                        value={option}
                        checked={isSymptomSelected(option)}
                        onChange={() => handleSymptomToggle(option)}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              )}
              {errors.currentHealth && <p className="error-message">{errors.currentHealth}</p>}
            </div>

            <div className="formField">
              <textarea
                id="healthNotes"
                name="healthNotes"
                value={formData.healthNotes}
                onChange={handleChange}
                placeholder="Tell us more..."
              />
            </div>

            {renderPrimaryButton()}
          </>
        )}

        {currentStep === 4 && (
          <>
            <h3 className="formTitle">Medical history</h3>
            <p className="formSubtitle">
              A few simple details will help Nirvaana craft sessions that truly fit you.
            </p>

            <div className="formField">
              <label className="label-head">Surgeries & Injuries</label>
              {isLoadingSurgeries && <p className="helperText">Loading medical history options...</p>}
              {surgeryFetchError && <p className="error-message">{surgeryFetchError}</p>}
              {!isLoadingSurgeries && !surgeryFetchError && (
                <div className="healthOptionsList">
                  {surgeryOptions.map((option) => (
                    <label
                      key={option}
                      className={`healthOption ${isSurgerySelected(option) ? "selected" : ""}`}
                    >
                      <input
                        type="checkbox"
                        name="surgeries"
                        value={option}
                        checked={isSurgerySelected(option)}
                        onChange={() => handleSurgeryToggle(option)}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              )}
              {errors.surgeries && <p className="error-message">{errors.surgeries}</p>}
            </div>

            <div className="formField">
              <textarea
                id="surgeryNotes"
                name="surgeryNotes"
                value={formData.surgeryNotes}
                onChange={handleChange}
                placeholder="Tell us more..."
              />
            </div>

            {renderPrimaryButton()}
          </>
        )}

        {currentStep === 5 && (
          <>
            <h3 className="formTitle">Family health history</h3>
            <p className="formSubtitle">
             A few simple details will help Nirvaana craft sessions that truly fit you.
            </p>

            <div className="formField">
              <label className="label-head">Hereditary Conditions</label>
              {isLoadingFamilyHistory && <p className="helperText">Loading family history options...</p>}
              {familyHistoryFetchError && <p className="error-message">{familyHistoryFetchError}</p>}
              {!isLoadingFamilyHistory && !familyHistoryFetchError && (
                <div className="healthOptionsList">
                  {familyHistoryOptions.map((option) => (
                    <label
                      key={option}
                      className={`healthOption ${isFamilyHistorySelected(option) ? "selected" : ""}`}
                    >
                      <input
                        type="checkbox"
                        name="familyHistory"
                        value={option}
                        checked={isFamilyHistorySelected(option)}
                        onChange={() => handleFamilyHistoryToggle(option)}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              )}
              {!isLoadingFamilyHistory &&
                !familyHistoryFetchError &&
                familyHistoryOptions.length === 0 && (
                  <p className="helperText">No hereditary conditions available right now.</p>
                )}
              {!errors.familyHistory &&
                !isLoadingFamilyHistory &&
                !familyHistoryFetchError &&
                familyHistoryOptions.length > 0 && (
                  <p className="helperText"> </p>
                )}
              {errors.familyHistory && <p className="error-message">{errors.familyHistory}</p>}
            </div>
            <div className="formField">
              <textarea
                id="familyNotes"
                name="familyNotes"
                value={formData.familyNotes}
                onChange={handleChange}
                placeholder="Tell us more... "
              />
            </div>

            {renderPrimaryButton()}
          </>
        )}

        {currentStep === 6 && (
           <>
            <h3 className="formTitle">Physical metrics</h3>
            <p className="formSubtitle">
              A few simple details will help Nirvaana craft sessions that truly fit you.
            </p>

            <div className="formField">
              <label className="label-head">Stress level </label>
              {isLoadingStressLevels && <p className="helperText">Loading stress levels...</p>}
              {stressLevelFetchError && <p className="error-message">{stressLevelFetchError}</p>}
              {!isLoadingStressLevels && !stressLevelFetchError && (
                <div className="healthOptionsList">
                  {stressLevelOptions.map((level) => (
                    <label
                      key={level}
                      className={`healthOption healthOption--radio ${isStressLevelSelected(level) ? "selected" : ""}`}
                    >
                      <input
                        type="checkbox"
                        name="stressLevel"
                        value={level}
                        checked={isStressLevelSelected(level)}
                        onChange={(event) => handleStressLevelSelect(level, event.target.checked)}
                      />
                      <span>{level}</span>
                    </label>
                  ))}
                </div>
              )}
              {errors.stressLevel && <p className="error-message">{errors.stressLevel}</p>}
            </div>
            <div className="formField">
              <textarea
                id="physicalMetricsNotes"
                name="physicalMetricsNotes"
                value={formData.physicalMetricsNotes}
                onChange={handleChange}
                placeholder="Tell us more..."
              />
            </div>

            {renderPrimaryButton()}
          </>
          
        )}

        {currentStep === 7 && (
           <>
            <h3 className="formTitle">Night routine</h3>
            <p className="formSubtitle">
              A few simple details will help Nirvaana craft sessions that truly fit you.
            </p>

            <div className="formField">
              <label>How would you describe your current sleep pattern? <span className="required-asterisk">*</span></label>
              {isLoadingSleepPatterns && <p className="helperText">Loading night routine options...</p>}
              {sleepPatternFetchError && <p className="error-message">{sleepPatternFetchError}</p>}
              {!isLoadingSleepPatterns && !sleepPatternFetchError && (
                <div className="healthOptionsList">
                  {sleepPatternOptions.map((pattern) => (
                    <label
                      key={pattern}
                      className={`healthOption healthOption--radio ${isSleepPatternSelected(pattern) ? "selected" : ""}`}
                    >
                      <input
                        type="checkbox"
                        name="sleepPattern"
                        value={pattern}
                        checked={isSleepPatternSelected(pattern)}
                        onChange={(event) => handleSleepPatternCheckbox(pattern, event.target.checked)}
                      />
                      <span>{pattern}</span>
                    </label>
                  ))}
                </div>
              )}
              {errors.sleepPattern && <p className="error-message">{errors.sleepPattern}</p>}
              {!errors.sleepPattern && !isLoadingSleepPatterns && !sleepPatternFetchError && (
                <p className="helperText">
                </p>
              )}
            </div>
            <div className="formField">
              <textarea
                id="nightRoutineNotes"
                name="nightRoutineNotes"
                value={formData.nightRoutineNotes}
                onChange={handleChange}
                placeholder="Tell us more..."
              />
            </div>
              {renderPrimaryButton()}
            
          </>
        )}

        {currentStep === 8 && (
         
          <>
            <h3 className="formTitle">Lifestyle and habits</h3>
            <p className="formSubtitle">
              A few simple details will help Nirvaana craft sessions that truly fit you.
            </p>

            <div className="formField">
              <label className="label-head">Your yoga experience <span className="required-asterisk">*</span></label>
              {isLoadingYogaExperience && <p className="helperText">Loading experience levels...</p>}
              {yogaExperienceFetchError && <p className="error-message">{yogaExperienceFetchError}</p>}
              {!isLoadingYogaExperience && !yogaExperienceFetchError && (
                <div className="healthOptionsList">
                  {yogaExperienceOptions.map((option) => (
                    <label
                      key={option}
                      className={`healthOption healthOption--radio ${isYogaExperienceSelected(option) ? "selected" : ""}`}
                    >
                      <input
                        type="checkbox"
                        name="yogaExperience"
                        value={option}
                        checked={isYogaExperienceSelected(option)}
                        onChange={() => handleYogaExperienceSelect(option)}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              )}
              {errors.yogaExperience && <p className="error-message">{errors.yogaExperience}</p>}
            </div>

            <div className="formField">
              <label className="label-head">Meal type <span className="required-asterisk">*</span></label>
              {isLoadingMealTypes && <p className="helperText">Loading meal types...</p>}
              {mealTypeFetchError && <p className="error-message">{mealTypeFetchError}</p>}
              {!isLoadingMealTypes && !mealTypeFetchError && (
                <div className="healthOptionsList">
                  {mealTypeOptions.map((option) => (
                    <label
                      key={option}
                      className={`healthOption healthOption--radio ${isMealTypeSelected(option) ? "selected" : ""}`}
                    >
                      <input
                        type="checkbox"
                        name="mealType"
                        value={option}
                        checked={isMealTypeSelected(option)}
                        onChange={() => handleMealTypeSelect(option)}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              )}
              {errors.mealType && <p className="error-message">{errors.mealType}</p>}
            </div>

            <div className="formField">
              <label className="label-head">Where do you stay? <span className="required-asterisk">*</span></label>
              {isLoadingStayTypes && <p className="helperText">Loading stay types...</p>}
              {stayTypeFetchError && <p className="error-message">{stayTypeFetchError}</p>}
              {!isLoadingStayTypes && !stayTypeFetchError && (
                <div className="healthOptionsList">
                  {stayTypeOptions.map((option) => (
                    <label
                      key={option}
                      className={`healthOption healthOption--radio ${isStayTypeSelected(option) ? "selected" : ""}`}
                    >
                      <input
                        type="checkbox"
                        name="stayType"
                        value={option}
                        checked={isStayTypeSelected(option)}
                        onChange={() => handleStayTypeSelect(option)}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              )}
              {errors.stayType && <p className="error-message">{errors.stayType}</p>}
            </div>

            <div className="formField">
              <textarea
                id="lifestyleNotes"
                name="lifestyleNotes"
                value={formData.lifestyleNotes}
                onChange={handleChange}
                placeholder="Tell us more..."
              />
            </div>
            {renderPrimaryButton()}
          </>
        )}

        {currentStep === 9 && (
          <>
            <div className="review-summary">
              <div className="review-summary__header">
                <p className="review-summary__step">
                  Step {currentStep} of {TOTAL_STEPS}
                </p>
                <h3 className="review-summary__title">Summary</h3>
                <p className="review-summary__subtitle">
                  Take a quick look at your information before confirming — this helps us create the best experience for you.
                </p>
              </div>

              {reviewSections.map((section) => (
                <section className="review-section" key={section.key}>
                  <div className="review-section__header">
                    <div>
                      <h4>{section.title}</h4>
                      <p>{section.description}</p>
                    </div>
                    {typeof section.step === "number" && (
                      <button
                        type="button"
                        className="review-edit"
                        onClick={() => {
                          setReviewEditStep(section.step as number);
                          setCurrentStep(section.step as number);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                      >
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2 16H3.425L13.2 6.225L11.775 4.8L2 14.575V16ZM0 18V13.75L13.2 0.575C13.4 0.391667 13.6208 0.25 13.8625 0.15C14.1042 0.05 14.3583 0 14.625 0C14.8917 0 15.15 0.05 15.4 0.15C15.65 0.25 15.8667 0.4 16.05 0.6L17.425 2C17.625 2.18333 17.7708 2.4 17.8625 2.65C17.9542 2.9 18 3.15 18 3.4C18 3.66667 17.9542 3.92083 17.8625 4.1625C17.7708 4.40417 17.625 4.625 17.425 4.825L4.25 18H0ZM12.475 5.525L11.775 4.8L13.2 6.225L12.475 5.525Z" fill="#FFAE00"/>
                      </svg>
                        Edit
                      </button>
                    )}
                  </div>

                  {section.rows && (
                    <dl className="review-rows">
                      {section.rows.map((row) => (
                        <div className="review-row" key={`${section.key}-${row.label}`}>
                          <dt>{row.label}</dt>
                          <dd>{row.value}</dd>
                        </div>
                      ))}
                    </dl>
                  )}

                  {section.lists &&
                    section.lists.map((list) => (
                      <div className="review-list" key={`${section.key}-${list.label}`}>
                        <p className="review-list__label">{list.label}</p>
                        <ul>
                          {list.items.map((item) => (
                            <li key={`${list.label}-${item}`}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                </section>
              ))}
            </div>

            <div className="buttonRow">
              <button className="nextButton" type="submit">
                Confirm & Submit
              </button>
            </div>
          </>
        )}
      </form>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={() => setIsModalOpen(false)}
        title="Take a moment for you "
      >
        <p>This easy 3-minute survey lets Nirvaana tailor every session to your needs. 
          your answers stay private and help us to create your most mindful experience</p>
      </Modal>
    </div>
  );
};
