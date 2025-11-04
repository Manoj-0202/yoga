import React, { useEffect, useState } from "react";
import "../styles/PersonalisedDetails.css";
import { LeftIcon } from "../icons/LeftIcon";

const TOTAL_STEPS = 7;
const NO_SYMPTOM_OPTION = "No current symptoms";
const NO_SURGERY_OPTION = "No past surgeries";
const NO_FAMILY_HISTORY_OPTION = "No family history";
const FAMILY_MEMBER_OPTIONS = ["Father", "Mother", "Siblings", "Grandparents", "Children", "Other"];
const NO_SLEEP_PATTERN_OPTION = "No usual night routine";

type FormState = {
  firstName: string;
  lastName: string;
  countryCode: string;
  mobile: string;
  email: string;
  gender: string;
  day: string;
  month: string;
  year: string;
  city: string;
  country: string;
  currentHealth: string[];
  healthNotes: string;
  yogaGoals: string[];
  surgeries: string[];
  surgeryNotes: string;
  familyHistory: string[];
  familyNotes: string;
  familyMembers: string[];
  stressLevel: string;
  sleepPattern: string;
  yogaExperience: string;
  mealType: string;
  stayType: string;
};

export const PersonalisedDetails: React.FC = () => {
  const [formData, setFormData] = useState<FormState>({
    firstName: "",
    lastName: "",
    countryCode: "+91",
    mobile: "",
    email: "",
    gender: "",
    day: "",
    month: "",
    year: "",
    city: "",
    country: "",
    currentHealth: [],
    healthNotes: "",
    yogaGoals: [],
    surgeries: [],
    surgeryNotes: "",
    familyHistory: [],
    familyNotes: "",
    familyMembers: [],
    stressLevel: "",
    sleepPattern: "",
    yogaExperience: "",
    mealType: "",
    stayType: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(1);
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

    const fetchYogaGoalOptions = async () => {
      setIsLoadingYogaGoals(true);
      setYogaGoalFetchError(null);

      try {
        const response = await fetch("http://54.234.26.129:8082/api/v1/common/yoga-goals", {
          signal: yogaGoalController.signal,
        });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const data = await response.json();
        if (Array.isArray(data)) {
          const uniqueOptions = Array.from(
            new Set(data.map((item) => (typeof item === "string" ? item.trim() : item)))
          );
          setYogaGoalOptions(uniqueOptions.filter(Boolean));
        } else {
          throw new Error("Unexpected response shape");
        }
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
        const response = await fetch("http://54.234.26.129:8082/api/v1/common/symptoms", {
          signal: symptomController.signal,
        });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const data = await response.json();
        if (Array.isArray(data)) {
          const uniqueOptions = Array.from(new Set([...data, NO_SYMPTOM_OPTION]));
          setSymptomOptions(uniqueOptions);
        } else {
          throw new Error("Unexpected response shape");
        }
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
        const response = await fetch("http://54.234.26.129:8082/api/v1/common/surgeries", {
          signal: surgeryController.signal,
        });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const data = await response.json();
        if (Array.isArray(data)) {
          const uniqueOptions = Array.from(new Set([...data, NO_SURGERY_OPTION]));
          setSurgeryOptions(uniqueOptions);
        } else {
          throw new Error("Unexpected response shape");
        }
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
        const response = await fetch("http://54.234.26.129:8082/api/v1/common/hereditaries", {
          signal: familyHistoryController.signal,
        });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const data = await response.json();
        if (Array.isArray(data)) {
          const uniqueOptions = Array.from(new Set([...data, NO_FAMILY_HISTORY_OPTION]));
          setFamilyHistoryOptions(uniqueOptions);
        } else {
          throw new Error("Unexpected response shape");
        }
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
        const response = await fetch("http://54.234.26.129:8082/api/v1/common/stress-level", {
          signal: stressLevelController.signal,
        });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const data = await response.json();
        if (Array.isArray(data)) {
          setStressLevelOptions(data);
        } else {
          throw new Error("Unexpected response shape");
        }
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
        const response = await fetch("http://54.234.26.129:8082/api/v1/common/sleep-patterns", {
          signal: sleepPatternController.signal,
        });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const data = await response.json();
        if (Array.isArray(data)) {
          const sanitized = data.map((item) => (typeof item === "string" ? item.trim() : item));
          const uniqueOptions = Array.from(new Set([...sanitized.filter(Boolean), NO_SLEEP_PATTERN_OPTION]));
          setSleepPatternOptions(uniqueOptions);
        } else {
          throw new Error("Unexpected response shape");
        }
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
        const response = await fetch("http://54.234.26.129:8082/api/v1/common/user-levels", {
          signal: yogaExperienceController.signal,
        });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const data = await response.json();
        if (Array.isArray(data)) {
          const uniqueOptions = Array.from(new Set(data.map((item) => (typeof item === "string" ? item.trim() : item))));
          setYogaExperienceOptions(uniqueOptions.filter(Boolean));
        } else {
          throw new Error("Unexpected response shape");
        }
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
        const response = await fetch("http://54.234.26.129:8082/api/v1/common/meal-types", {
          signal: mealTypeController.signal,
        });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const data = await response.json();
        if (Array.isArray(data)) {
          const uniqueOptions = Array.from(new Set(data.map((item) => (typeof item === "string" ? item.trim() : item))));
          setMealTypeOptions(uniqueOptions.filter(Boolean));
        } else {
          throw new Error("Unexpected response shape");
        }
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
        const response = await fetch("http://54.234.26.129:8082/api/v1/common/stay-types", {
          signal: stayTypeController.signal,
        });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const data = await response.json();
        if (Array.isArray(data)) {
          const uniqueOptions = Array.from(new Set(data.map((item) => (typeof item === "string" ? item.trim() : item))));
          setStayTypeOptions(uniqueOptions.filter(Boolean));
        } else {
          throw new Error("Unexpected response shape");
        }
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

    fetchYogaGoalOptions();
    fetchSymptomOptions();
    fetchSurgeryOptions();
    fetchFamilyHistoryOptions();
    fetchStressLevelOptions();
    fetchSleepPatternOptions();
    fetchYogaExperienceOptions();
    fetchMealTypeOptions();
    fetchStayTypeOptions();

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
    };
  }, []);

  const validatePersonalInfo = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.mobile.trim()) newErrors.mobile = "Mobile number is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!formData.gender) newErrors.gender = "Gender is required";
    if (!formData.day) newErrors.day = "Day is required";
    if (!formData.month) newErrors.month = "Month is required";
    if (!formData.year) newErrors.year = "Year is required";
    if (!formData.city.trim()) newErrors.city = "City is required";
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
    const noFamilyHistorySelected = formData.familyHistory.includes(NO_FAMILY_HISTORY_OPTION);
    const selectedHistory = formData.familyHistory.filter((item) => item !== NO_FAMILY_HISTORY_OPTION);
    if (selectedHistory.length === 0 && !formData.familyNotes.trim() && !noFamilyHistorySelected) {
      newErrors.familyHistory = "Select a family condition or share details about family health.";
    }
    if (selectedHistory.length > 0 && formData.familyMembers.length === 0) {
      newErrors.familyMembers = "Select the family members affected.";
    }
    return newErrors;
  };

  const validatePhysicalMetrics = () => {
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
      let updated: string[];

      if (value === NO_FAMILY_HISTORY_OPTION) {
        updated = hasValue ? [] : [NO_FAMILY_HISTORY_OPTION];
      } else if (hasValue) {
        updated = prev.familyHistory.filter((item) => item !== value);
      } else {
        updated = [...prev.familyHistory.filter((item) => item !== NO_FAMILY_HISTORY_OPTION), value];
      }

      const resetMembers = updated.includes(NO_FAMILY_HISTORY_OPTION) ? [] : prev.familyMembers;
      return { ...prev, familyHistory: updated, familyMembers: resetMembers };
    });
    clearFieldError("familyHistory");
    clearFieldError("familyMembers");
  };

  const handleFamilyMemberToggle = (value: string) => {
    setFormData((prev) => {
      const hasValue = prev.familyMembers.includes(value);
      const updated = hasValue
        ? prev.familyMembers.filter((item) => item !== value)
        : [...prev.familyMembers, value];

      return { ...prev, familyMembers: updated };
    });
    clearFieldError("familyMembers");
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
  const handlePreviousStep = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
    setErrors({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (currentStep === 1) {
      const personalErrors = validatePersonalInfo();
      if (Object.keys(personalErrors).length > 0) {
        setErrors(personalErrors);
        return;
      }

      setErrors({});
      setCurrentStep(2);
      return;
    }
    if (currentStep === 2) {
      const goalErrors = validateYogaGoals();
      if (Object.keys(goalErrors).length > 0) {
        setErrors(goalErrors);
        return;
      }

      setErrors({});
      setCurrentStep(3);
      return;
    }
    if (currentStep === 3) {
      const symptomErrors = validateSymptomDetails();
      if (Object.keys(symptomErrors).length > 0) {
        setErrors(symptomErrors);
        return;
      }

      setErrors({});
      setCurrentStep(4);
      return;
    }
    if (currentStep === 4) {
      const medicalErrors = validateMedicalHistory();
      if (Object.keys(medicalErrors).length > 0) {
        setErrors(medicalErrors);
        return;
      }

      setErrors({});
      setCurrentStep(5);
      return;
    }

    if (currentStep === 5) {
      const familyErrors = validateFamilyHistory();
      if (Object.keys(familyErrors).length > 0) {
        setErrors(familyErrors);
        return;
      }

      setErrors({});
      setCurrentStep(6);
      return;
    }

    if (currentStep === 6) {
      const physicalErrors = validatePhysicalMetrics();
      if (Object.keys(physicalErrors).length > 0) {
        setErrors(physicalErrors);
        return;
      }

      setErrors({});
      setCurrentStep(7);
      return;
    }

    if (currentStep === 7) {
      const nightRoutineErrors = validateNightRoutine();
      if (Object.keys(nightRoutineErrors).length > 0) {
        setErrors(nightRoutineErrors);
        return;
      }

      setErrors({});
      alert(JSON.stringify(formData, null, 2));
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
  const isFamilyMemberSelected = (value: string) => formData.familyMembers.includes(value);
  const hasFamilyHistorySelection = formData.familyHistory.some(
    (item) => item !== NO_FAMILY_HISTORY_OPTION
  );
  const isStressLevelSelected = (value: string) => formData.stressLevel === value;
  const isFamilyHistorySelected = (value: string) => formData.familyHistory.includes(value);
  const isSleepPatternSelected = (value: string) => formData.sleepPattern === value;
  const isYogaExperienceSelected = (value: string) => formData.yogaExperience === value;
  const isMealTypeSelected = (value: string) => formData.mealType === value;
  const isStayTypeSelected = (value: string) => formData.stayType === value;

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
          <p className="step">
            {currentStep} of {TOTAL_STEPS}
          </p>
          <h2 className="brand">Nirvaana Yoga</h2>
        </div>
      </header>

      <form className="formBox" onSubmit={handleSubmit}>
        {currentStep === 1 && (
          <>
            <h3 className="formTitle">Personal info</h3>
            <p className="formSubtitle">
              A few simple details will help Nirvaana craft sessions that truly fit you.
            </p>

            <div className="formField">
              <label htmlFor="firstName">First name *</label>
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
              <label htmlFor="lastName">Last name *</label>
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
                <label htmlFor="countryCode">Country *</label>
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
                <label htmlFor="mobile">Mobile number *</label>
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
              <label htmlFor="email">Email *</label>
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
              <label>Gender *</label>
              <div className="genderGroup">
                {["Male", "Female", "Other"].map((g) => (
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
              {errors.gender && <p className="error-message">{errors.gender}</p>}
            </div>

            <div className="formField">
              <label>Date of birth *</label>
              <div className="inlineFields">
                <select
                  name="day"
                  id="day"
                  value={formData.day}
                  onChange={handleChange}
                  className={errors.day ? "error" : ""}
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
                  className={errors.month ? "error" : ""}
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
                  className={errors.year ? "error" : ""}
                >
                  <option value="">Year</option>
                  {Array.from({ length: 60 }, (_, i) => 2025 - i).map((y) => (
                    <option key={y} value={`${y}`}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
              {(errors.day || errors.month || errors.year) && (
                <p className="error-message">Date of birth is required</p>
              )}
            </div>

            <div className="formField">
              <label htmlFor="city">City *</label>
              <input
                id="city"
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Hyderabad"
                autoComplete="address-level2"
                className={errors.city ? "error" : ""}
              />
              {errors.city && <p className="error-message">{errors.city}</p>}
            </div>

            <div className="formField">
              <label htmlFor="country">Country *</label>
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

            <button className="nextButton" type="submit">
              Next
            </button>
          </>
        )}

        {currentStep === 2 && (
          <>
            <h3 className="formTitle">Personal goals</h3>
            <p className="formSubtitle">
              Tell us what you’d love to achieve so we can shape your practice around what matters most.
            </p>

            <div className="formField">
              <label>Your goals *</label>
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
              {!errors.yogaGoals && !isLoadingYogaGoals && !yogaGoalFetchError && (
                <p className="helperText">Select all that resonate with you.</p>
              )}
            </div>

            <div className="buttonRow">
              <button type="button" className="secondaryButton" onClick={handlePreviousStep}>
                Back
              </button>
              <button className="nextButton" type="submit">
                Next
              </button>
            </div>
          </>
        )}

        {currentStep === 3 && (
          <>
            <h3 className="formTitle">Symptoms & concerns</h3>
            <p className="formSubtitle">
              A few simple details will help Nirvaana craft sessions that truly fit you.
            </p>

            <div className="formField">
              <label>Current symptoms or concerns *</label>
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
              {!errors.currentHealth && !isLoadingSymptoms && !symptomFetchError && (
                <p className="helperText">
                  Select all that apply or choose '{NO_SYMPTOM_OPTION}' if you feel symptom free.
                </p>
              )}
            </div>

            <div className="formField">
              <label htmlFor="healthNotes">Tell us more (optional)</label>
              <textarea
                id="healthNotes"
                name="healthNotes"
                value={formData.healthNotes}
                onChange={handleChange}
                placeholder="Share any injuries, diagnoses, or areas you'd like us to focus on."
              />
            </div>

            <div className="buttonRow">
              <button type="button" className="secondaryButton" onClick={handlePreviousStep}>
                Back
              </button>
              <button className="nextButton" type="submit">
                Next
              </button>
            </div>
          </>
        )}

        {currentStep === 4 && (
          <>
            <h3 className="formTitle">Medical history</h3>
            <p className="formSubtitle">
              A few simple details will help Nirvaana craft sessions that truly fit you.
            </p>

            <div className="formField">
              <label>Past surgeries or conditions *</label>
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
              {!errors.surgeries && !isLoadingSurgeries && !surgeryFetchError && (
                <p className="helperText">
                  Select all that apply or choose '{NO_SURGERY_OPTION}' if you have no medical history to
                  note.
                </p>
              )}
            </div>

            <div className="formField">
              <label htmlFor="surgeryNotes">Tell us more (optional)</label>
              <textarea
                id="surgeryNotes"
                name="surgeryNotes"
                value={formData.surgeryNotes}
                onChange={handleChange}
                placeholder="Share any additional details your instructor should know."
              />
            </div>

            <div className="buttonRow">
              <button type="button" className="secondaryButton" onClick={handlePreviousStep}>
                Back
              </button>
              <button className="nextButton" type="submit">
                Next
              </button>
            </div>
          </>
        )}

        {currentStep === 5 && (
          <>
            <h3 className="formTitle">Family health history</h3>
            <p className="formSubtitle">
              Let us know about any hereditary conditions so we can be mindful in your personalized
              plan.
            </p>

            <div className="formField">
              <label>Family health conditions *</label>
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
              {errors.familyHistory && <p className="error-message">{errors.familyHistory}</p>}
              {!errors.familyHistory && !isLoadingFamilyHistory && !familyHistoryFetchError && (
                <p className="helperText">
                  Select all that apply or choose '{NO_FAMILY_HISTORY_OPTION}' if none apply.
                </p>
              )}
            </div>

            <div className="formField">
              <label htmlFor="familyNotes">Tell us more (optional)</label>
              <textarea
                id="familyNotes"
                name="familyNotes"
                value={formData.familyNotes}
                onChange={handleChange}
                placeholder="Share any family health background that would help us support you better."
              />
            </div>

            <div className="buttonRow">
              <button type="button" className="secondaryButton" onClick={handlePreviousStep}>
                Back
              </button>
              <button className="nextButton" type="submit">
                Next
              </button>
            </div>
          </>
        )}

        {currentStep === 6 && (
          <>
            <h3 className="formTitle">Physical metrics</h3>
            <p className="formSubtitle">
              Tell us how you're feeling right now so we can balance intensity and recovery in your practice.
            </p>

            <div className="formField">
              <label>Your yoga experience *</label>
              {isLoadingYogaExperience && <p className="helperText">Loading experience levels...</p>}
              {yogaExperienceFetchError && <p className="error-message">{yogaExperienceFetchError}</p>}
              {!isLoadingYogaExperience && !yogaExperienceFetchError && (
                <div className="healthOptionsList">
                  {yogaExperienceOptions.map((option) => (
                    <label
                      key={option}
                      className={`healthOption ${isYogaExperienceSelected(option) ? "selected" : ""}`}
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
              <label>Your typical meal type *</label>
              {isLoadingMealTypes && <p className="helperText">Loading meal types...</p>}
              {mealTypeFetchError && <p className="error-message">{mealTypeFetchError}</p>}
              {!isLoadingMealTypes && !mealTypeFetchError && (
                <div className="healthOptionsList">
                  {mealTypeOptions.map((option) => (
                    <label
                      key={option}
                      className={`healthOption ${isMealTypeSelected(option) ? "selected" : ""}`}
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
              <label>Where do you stay? *</label>
              {isLoadingStayTypes && <p className="helperText">Loading stay types...</p>}
              {stayTypeFetchError && <p className="error-message">{stayTypeFetchError}</p>}
              {!isLoadingStayTypes && !stayTypeFetchError && (
                <div className="healthOptionsList">
                  {stayTypeOptions.map((option) => (
                    <label
                      key={option}
                      className={`healthOption ${isStayTypeSelected(option) ? "selected" : ""}`}
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
              <label>Current stress level *</label>
              {isLoadingStressLevels && <p className="helperText">Loading stress levels...</p>}
              {stressLevelFetchError && <p className="error-message">{stressLevelFetchError}</p>}
              {!isLoadingStressLevels && !stressLevelFetchError && (
                <div className="healthOptionsList">
                  {stressLevelOptions.map((level) => (
                    <label
                      key={level}
                      className={`healthOption ${isStressLevelSelected(level) ? "selected" : ""}`}
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

            <div className="buttonRow">
              <button type="button" className="secondaryButton" onClick={handlePreviousStep}>
                Back
              </button>
              <button className="nextButton" type="submit">
                Next
              </button>
            </div>
          </>
        )}

        {currentStep === 7 && (
          <>
            <h3 className="formTitle">Night routine</h3>
            <p className="formSubtitle">
              A quick snapshot of your evenings helps us understand how well you're resting.
            </p>

            <div className="formField">
              <label>How would you describe your current sleep pattern? *</label>
              {isLoadingSleepPatterns && <p className="helperText">Loading night routine options...</p>}
              {sleepPatternFetchError && <p className="error-message">{sleepPatternFetchError}</p>}
              {!isLoadingSleepPatterns && !sleepPatternFetchError && (
                <div className="healthOptionsList">
                  {sleepPatternOptions.map((pattern) => (
                    <label
                      key={pattern}
                      className={`healthOption ${isSleepPatternSelected(pattern) ? "selected" : ""}`}
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
                  Select one option or choose '{NO_SLEEP_PATTERN_OPTION}' if no routine fits.
                </p>
              )}
            </div>

            <div className="buttonRow">
              <button type="button" className="secondaryButton" onClick={handlePreviousStep}>
                Back
              </button>
              <button className="nextButton" type="submit">
                Submit
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
};
