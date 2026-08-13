<template>
  <v-dialog
    v-model="props.visible"
    :fullscreen="props.action === 'Remove' ? false : isFullscreen"
    :max-width="props.action === 'Remove' ? 500 : undefined"
    persistent
    scrollable
  >
    <v-card
      ref="cardEl"
      :class="[
        props.action === 'Remove' ? '' : 'resizable-card',
        {
          'is-fullscreen': isFullscreen && props.action !== 'Remove',
          dragging,
          resizing,
        },
      ]"
      :style="isFullscreen || props.action === 'Remove' ? undefined : cardStyle"
    >
      <v-card-title
        class="employee-dialog-header d-flex align-center"
        :class="{ 'drag-handle': props.action !== 'Remove' }"
        @mousedown="onTitleMouseDown"
      >
        <v-avatar :color="headerColor" variant="tonal" size="38" class="mr-3">
          <v-icon :icon="headerIcon" size="21" />
        </v-avatar>
        <div>
          <div class="text-subtitle-1 font-weight-bold">
            {{ props.action }} {{ displayEntity }}
          </div>
          <div class="text-caption text-medium-emphasis">
            Profile, work assignment, addresses, and contact details
          </div>
        </div>
        <v-spacer />
        <v-btn
          v-if="props.action !== 'Remove'"
          :icon="isFullscreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen'"
          variant="text"
          size="small"
          density="comfortable"
          :title="isFullscreen ? 'Exit fullscreen' : 'Fullscreen'"
          :aria-label="isFullscreen ? 'Exit fullscreen' : 'Fullscreen'"
          @click="isFullscreen = !isFullscreen"
          class="mr-2"
        />
        <v-btn
          icon="mdi-close"
          variant="text"
          size="small"
          density="comfortable"
          @click="$emit('close')"
        />
      </v-card-title>

      <v-card-text class="employee-dialog-body">
        <template v-if="props.action === 'Remove'">
          <div class="delete-confirmation">
            <v-avatar color="error" variant="tonal" size="58">
              <v-icon icon="mdi-account-remove-outline" size="29" />
            </v-avatar>
            <div class="text-h6 mt-4">Delete this employee?</div>
            <div class="text-body-2 text-medium-emphasis mt-2">
              {{ linkedAccountLabel || props.data?.employee_no || "This employee record" }}
              will be permanently removed. This cannot be undone.
            </div>
          </div>
        </template>
        <div v-else class="employee-workflow">
          <nav class="workflow-nav" aria-label="Employee form progress">
            <button
              v-for="step in workflowSteps"
              :key="step.value"
              type="button"
              class="workflow-step"
              :class="{
                active: currentStep === step.value,
                complete: currentStep > step.value,
              }"
              @click="goToStep(step.value)"
            >
              <span class="workflow-step-number">
                <v-icon
                  v-if="currentStep > step.value"
                  icon="mdi-check"
                  size="15"
                />
                <span v-else>{{ step.value }}</span>
              </span>
              <span class="workflow-step-copy">
                <strong>{{ step.title }}</strong>
                <small>{{ step.description }}</small>
              </span>
            </button>
          </nav>

          <v-window v-model="currentStep" class="workflow-window">
            <!-- Step 1: Employee Details -->
            <v-window-item :value="1">
              <div class="step-content">
                <div class="section-heading">
                  <v-avatar color="primary" variant="tonal" size="34">
                    <v-icon icon="mdi-badge-account-outline" size="19" />
                  </v-avatar>
                  <div>
                    <div class="text-subtitle-1 font-weight-bold">Employee profile</div>
                    <div class="text-caption text-medium-emphasis">
                      Link the account and define the employee's work assignment.
                    </div>
                  </div>
                </div>

                <div class="employee-summary">
                  <v-avatar color="primary" size="48">
                    <span class="text-subtitle-1 font-weight-bold">
                      {{ employeeInitials }}
                    </span>
                  </v-avatar>
                  <div class="employee-summary-copy">
                    <div class="text-subtitle-2 font-weight-bold">
                      {{ linkedAccountLabel || "Select a user account" }}
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      Employee number {{ employeeForm.employee_no || "will be generated" }}
                    </div>
                  </div>
                  <v-chip
                    size="small"
                    :color="employeeForm.employment_status_id ? 'success' : 'default'"
                    variant="tonal"
                  >
                    {{ selectedEmploymentStatus || "Status not set" }}
                  </v-chip>
                </div>

                <div class="form-section">
                  <div class="form-section-title">Account and identity</div>
                  <div class="form-section-description">
                    Connect the login account and verify the employee identifier.
                  </div>
                  <div class="employee-field-grid mt-4">
                    <template v-for="field in accountFields" :key="field.key">
                      <v-text-field
                        v-if="field.inputField === 'text'"
                        v-model="employeeForm[field.key]"
                        :label="field.title"
                        :readonly="isFieldReadOnly(field)"
                        density="compact"
                        variant="outlined"
                        hide-details="auto"
                      />
                      <v-text-field
                        v-else-if="field.inputField === 'date'"
                        v-model="employeeForm[field.key]"
                        type="date"
                        :label="field.title"
                        :readonly="isFieldReadOnly(field)"
                        density="compact"
                        variant="outlined"
                        hide-details="auto"
                      />
                      <v-autocomplete
                        v-else-if="field.inputField === 'select'"
                        v-model="employeeForm[field.selectKey!]"
                        :label="field.title"
                        item-title="label"
                        item-value="value"
                        :items="field.inputOptions"
                        :readonly="isFieldReadOnly(field)"
                        density="compact"
                        variant="outlined"
                        hide-details="auto"
                        clearable
                      />
                    </template>
                  </div>
                </div>

                <div class="form-section">
                  <div class="form-section-title">Employment assignment</div>
                  <div class="form-section-description">
                    Place the employee in the correct team, role, and grade.
                  </div>
                  <div class="employee-field-grid mt-4">
                    <template v-for="field in employmentFields" :key="field.key">
                    <v-text-field
                      v-if="field.inputField === 'text'"
                      :required="!field.nullable"
                      v-model="employeeForm[field.key]"
                      :label="field.title"
                      :readonly="isFieldReadOnly(field)"
                      :rules="field.required ? [(value) => !!value || `${field.title} is required`] : []"
                      density="compact"
                      variant="outlined"
                      hide-details="auto"
                    />
                    <v-text-field
                      v-else-if="field.inputField === 'date'"
                      type="date"
                      v-model="employeeForm[field.key]"
                      :label="field.title"
                      :readonly="isFieldReadOnly(field)"
                      density="compact"
                      variant="outlined"
                      hide-details="auto"
                    />
                    <v-autocomplete
                      v-else-if="field.inputField === 'select'"
                      v-model="employeeForm[field.selectKey!]"
                      :label="field.title"
                      item-title="label"
                      item-value="value"
                      :items="field.inputOptions"
                      :readonly="isFieldReadOnly(field)"
                      :rules="field.required ? [(value) => !!value || `${field.title} is required`] : []"
                      density="compact"
                      variant="outlined"
                      hide-details="auto"
                      clearable
                    />
                  </template>
                  </div>
                </div>

                <div class="form-section">
                  <div class="form-section-title">Payroll assignment</div>
                  <div class="form-section-description">
                    Set the employee's base monthly compensation and pay cycle.
                  </div>
                  <div class="employee-field-grid mt-4">
                    <template v-for="field in payrollFields" :key="field.key">
                      <v-text-field
                        v-if="field.inputField === 'text'"
                        v-model="employeeForm[field.key]"
                        :type="field.key === 'basic_monthly_salary' ? 'number' : 'text'"
                        :prefix="field.key === 'basic_monthly_salary' ? '₱' : undefined"
                        min="0"
                        step="0.01"
                        :label="field.title"
                        :readonly="isFieldReadOnly(field)"
                        :rules="field.required ? [(value) => value !== '' && value !== null || `${field.title} is required`] : []"
                        density="compact"
                        variant="outlined"
                        hide-details="auto"
                      />
                      <v-select
                        v-else-if="field.inputField === 'select'"
                        v-model="employeeForm[field.selectKey!]"
                        :label="field.title"
                        item-title="label"
                        item-value="value"
                        :items="field.inputOptions"
                        :readonly="isFieldReadOnly(field)"
                        density="compact"
                        variant="outlined"
                        hide-details="auto"
                      />
                    </template>
                  </div>
                </div>
              </div>
            </v-window-item>

            <!-- Step 2: Addresses -->
            <v-window-item :value="2">
              <div class="step-content">
                  <div class="section-heading justify-space-between">
                    <div class="d-flex align-center ga-3">
                      <v-avatar color="primary" variant="tonal" size="34">
                        <v-icon icon="mdi-map-marker-outline" size="19" />
                      </v-avatar>
                      <div>
                        <div class="text-subtitle-1 font-weight-bold">Addresses</div>
                        <div class="text-caption text-medium-emphasis">Maintain current and permanent locations.</div>
                      </div>
                    </div>
                    <v-btn
                      color="primary"
                      prepend-icon="mdi-plus"
                      size="small"
                      variant="tonal"
                      class="text-none"
                      @click="addAddress"
                      :disabled="props.readOnly"
                    >
                      Add Address
                    </v-btn>
                  </div>

                  <section
                    v-for="(address, index) in addresses"
                    :key="index"
                    class="detail-record address-record"
                  >
                      <div class="detail-record-header">
                        <div>
                          <div class="text-subtitle-2 font-weight-bold">
                            Address {{ index + 1 }}
                          </div>
                          <div class="text-caption text-medium-emphasis">
                            Enter a complete and deliverable address.
                          </div>
                        </div>
                        <v-btn
                          prepend-icon="mdi-trash-can-outline"
                          size="small"
                          variant="text"
                          color="error"
                          @click="removeAddress(index)"
                          :disabled="props.readOnly"
                        >
                          Remove
                        </v-btn>
                      </div>

                      <div class="detail-type-row">
                        <span class="text-caption font-weight-medium">Address type</span>
                        <v-btn-toggle
                          v-model="address.type"
                          color="primary"
                          variant="tonal"
                          density="compact"
                          divided
                          mandatory
                          :disabled="props.readOnly"
                        >
                          <v-btn
                            v-for="option in addressTypeOptions"
                            :key="option.value"
                            :value="option.value"
                            size="small"
                            class="text-none"
                          >
                            {{ option.label }}
                          </v-btn>
                        </v-btn-toggle>
                      </div>

                      <div class="address-lines-grid">
                          <v-text-field
                            v-model="address.address_line_1"
                            label="Address Line 1 *"
                            :readonly="props.readOnly"
                            density="compact"
                          variant="outlined"
                          hide-details="auto"
                            prepend-inner-icon="mdi-map-marker-outline"
                          />
                          <v-text-field
                            v-model="address.address_line_2"
                            label="Unit, floor, building (optional)"
                            :readonly="props.readOnly"
                            density="compact"
                          variant="outlined"
                          hide-details="auto"
                          />
                      </div>

                      <div class="location-grid">
                          <v-autocomplete
                            v-model="address.country_iso2"
                            label="Country *"
                            item-title="name"
                            item-value="iso2"
                            :items="countryOptions"
                            :readonly="props.readOnly"
                            :loading="loadingCountries"
                            density="compact"
                          variant="outlined"
                          hide-details="auto"
                            @update:model-value="onCountryChange(index, $event)"
                            prepend-inner-icon="mdi-earth"
                            clearable
                          />
                          <v-autocomplete
                            v-model="address.province_iso2"
                            label="Province/State *"
                            item-title="name"
                            item-value="iso2"
                            :items="address.stateOptions || []"
                            :readonly="props.readOnly"
                            :loading="address.loadingStates"
                            :disabled="!address.country_iso2"
                            density="compact"
                          variant="outlined"
                          hide-details="auto"
                            @update:model-value="onStateChange(index, $event)"
                            clearable
                          />
                          <v-autocomplete
                            v-model="address.city"
                            label="City *"
                            item-title="name"
                            item-value="name"
                            :items="address.cityOptions || []"
                            :readonly="props.readOnly"
                            :loading="address.loadingCities"
                            :disabled="!address.province_iso2"
                            density="compact"
                          variant="outlined"
                          hide-details="auto"
                            clearable
                          />
                          <v-text-field
                            v-model="address.postal_code"
                            label="Postal Code"
                            :readonly="props.readOnly"
                            density="compact"
                          variant="outlined"
                          hide-details="auto"
                          />
                      </div>
                  </section>

                  <v-sheet
                    v-if="addresses.length === 0"
                    rounded="lg"
                    class="empty-state"
                  >
                    <v-icon icon="mdi-map-marker-off-outline" size="28" class="mb-2" />
                    <div class="text-body-2">No addresses added yet.</div>
                  </v-sheet>
              </div>
            </v-window-item>

            <!-- Step 3: Contacts -->
            <v-window-item :value="3">
              <div class="step-content">
                  <div class="section-heading justify-space-between">
                    <div class="d-flex align-center ga-3">
                      <v-avatar color="primary" variant="tonal" size="34">
                        <v-icon icon="mdi-card-account-phone-outline" size="19" />
                      </v-avatar>
                      <div>
                        <div class="text-subtitle-1 font-weight-bold">Contact information</div>
                        <div class="text-caption text-medium-emphasis">Add phone numbers, email addresses, or emergency contacts.</div>
                      </div>
                    </div>
                    <v-btn
                      color="primary"
                      prepend-icon="mdi-plus"
                      size="small"
                      variant="tonal"
                      @click="addContact"
                      :disabled="props.readOnly"
                    >
                      Add Contact
                    </v-btn>
                  </div>

                  <section
                    v-for="(contact, index) in contacts"
                    :key="index"
                    class="detail-record contact-record"
                  >
                      <div class="detail-record-header">
                        <div>
                          <div class="text-subtitle-2 font-weight-bold">
                            Contact {{ index + 1 }}
                          </div>
                          <div class="text-caption text-medium-emphasis">
                            Add a reliable way to reach this employee.
                          </div>
                        </div>
                        <v-btn
                          prepend-icon="mdi-trash-can-outline"
                          size="small"
                          variant="text"
                          color="error"
                          @click="removeContact(index)"
                          :disabled="props.readOnly"
                        >
                          Remove
                        </v-btn>
                      </div>

                      <div class="detail-type-row">
                        <span class="text-caption font-weight-medium">Contact type</span>
                        <v-btn-toggle
                          v-model="contact.type"
                          color="primary"
                          variant="tonal"
                          density="compact"
                          divided
                          mandatory
                          :disabled="props.readOnly"
                        >
                          <v-btn
                            v-for="option in contactTypeOptions"
                            :key="option.value"
                            :value="option.value"
                            size="small"
                            class="text-none"
                          >
                            <v-icon :icon="contactTypeIcon(option.value)" start size="15" />
                            {{ option.label }}
                          </v-btn>
                        </v-btn-toggle>
                      </div>

                      <v-text-field
                        v-model="contact.value"
                        :label="contactValueLabel(contact.type)"
                        :type="contact.type === 'email' ? 'email' : 'text'"
                        :prepend-inner-icon="contactTypeIcon(contact.type)"
                        :readonly="props.readOnly"
                        density="compact"
                        variant="outlined"
                        hide-details="auto"
                      />
                  </section>

                  <v-sheet
                    v-if="contacts.length === 0"
                    rounded="lg"
                    class="empty-state"
                  >
                    <v-icon icon="mdi-card-account-phone-outline" size="28" class="mb-2" />
                    <div class="text-body-2">No contact information added yet.</div>
                  </v-sheet>
              </div>
            </v-window-item>
          </v-window>
        </div>
      </v-card-text>

      <v-card-actions class="employee-dialog-actions">
        <div v-if="validationMessage" class="validation-message">
          <v-icon icon="mdi-alert-circle-outline" size="17" />
          {{ validationMessage }}
        </div>
        <v-btn
          v-if="currentStep > 1 && props.action !== 'Remove'"
          @click="previousStep"
          variant="text"
        >
          Previous
        </v-btn>
        <v-spacer />
        <v-btn @click="$emit('close')" variant="text"> Close </v-btn>
        <v-btn
          v-if="currentStep < 3 && props.action !== 'Remove'"
          color="primary"
          append-icon="mdi-arrow-right"
          variant="flat"
          @click="nextStep"
        >
          Next
        </v-btn>
        <v-btn
          v-else-if="props.action === 'Create'"
          prepend-icon="mdi-plus"
          color="success"
          :loading="props.loading"
          :disabled="props.readOnly"
          @click="handleSubmit"
        >
          Create {{ displayEntity }}
        </v-btn>
        <v-btn
          v-else-if="props.action === 'Edit'"
          prepend-icon="mdi-pencil"
          color="info"
          :loading="props.loading"
          :disabled="props.readOnly"
          @click="handleSubmit"
        >
          Save {{ displayEntity }}
        </v-btn>
        <v-btn
          v-else-if="props.action === 'Remove'"
          prepend-icon="mdi-delete"
          color="error"
          :loading="props.loading"
          :disabled="props.readOnly"
          @click="handleSubmit"
        >
          Delete {{ displayEntity }}
        </v-btn>
      </v-card-actions>

      <div
        v-if="!isFullscreen && props.action !== 'Remove'"
        class="resize-handle"
        @mousedown="onResizeMouseDown"
      />
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { computed, ref, watch, onMounted } from "vue";
import { ColumnConfig } from "@/types/types";
import axios from "@/plugins/axios";
import { useDraggable } from "@/composables/useDraggable";
import { useResizable } from "@/composables/useResizable";

const props = defineProps({
  loading: { type: Boolean, default: false },
  entity: { type: String, default: "" },
  action: { type: String, default: "" },
  readOnly: { type: Boolean, default: false },
  visible: { type: Boolean, default: false },
  employeeForm: { type: Object, default: () => ({}) },
  data: { type: Object, default: () => ({}) },
  employeeFields: { type: Array as () => ColumnConfig[], default: () => [] },
  addressFields: { type: Array as () => ColumnConfig[], default: () => [] },
  contactFields: { type: Array as () => ColumnConfig[], default: () => [] },
});

const emit = defineEmits(["close", "execute"]);

const currentStep = ref(1);
const validationMessage = ref("");
const employeeForm = ref<Record<string, any>>({});
const addresses = ref<Array<Record<string, any>>>([]);
const contacts = ref<Array<Record<string, any>>>([]);

const countryOptions = ref<any[]>([]);
const loadingCountries = ref(false);
const isFullscreen = ref(false);

const cardEl = ref<{ $el: HTMLElement } | null>(null);
const cardElement = computed<HTMLElement | null>(
  () => cardEl.value?.$el ?? null,
);

const {
  offset: dragOffset,
  dragging,
  onMouseDown: onTitleMouseDown,
  reset: resetDrag,
} = useDraggable(() => isFullscreen.value || props.action === "Remove");

const {
  size,
  resizing,
  onMouseDown: onResizeMouseDown,
  reset: resetResize,
} = useResizable(
  cardElement,
  { minWidth: 600, minHeight: 400, maxWidth: window.innerWidth * 0.95 },
  () => isFullscreen.value || props.action === "Remove",
);

const cardStyle = computed(() => ({
  transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)`,
  ...(size.width !== null ? { width: `${size.width}px` } : {}),
  ...(size.height !== null ? { height: `${size.height}px` } : {}),
}));

const resetDialogGeometry = () => {
  resetDrag();
  resetResize();
};

const addressTypeOptions = [
  { label: "Current", value: "current" },
  { label: "Permanent", value: "permanent" },
  { label: "Previous", value: "previous" },
];

const contactTypeOptions = computed(() => {
  const field = props.contactFields.find(
    (item: any) => item.selectKey === "type",
  ) as any;

  return field?.inputOptions ?? [];
});

const contactTypeIcon = (type: string): string => {
  const icons: Record<string, string> = {
    mobile: "mdi-cellphone",
    home: "mdi-phone-outline",
    work: "mdi-briefcase-outline",
    email: "mdi-email-outline",
    emergency: "mdi-alert-circle-outline",
  };

  return icons[type] ?? "mdi-card-account-phone-outline";
};

const contactValueLabel = (type: string): string => {
  if (type === "email") return "Email address *";
  if (type === "emergency") return "Emergency contact details *";
  return "Phone number *";
};

const workflowSteps = [
  { value: 1, title: "Profile", description: "Account and assignment" },
  { value: 2, title: "Addresses", description: "Home and mailing details" },
  { value: 3, title: "Contacts", description: "Phone and emergency info" },
];

const displayEntity = computed(() => {
  const raw = (props.entity ?? "").toString().trim();
  if (!raw) return "";

  let formatted = raw
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();

  const words = formatted.split(" ");
  const lastWord = words.pop() as string;

  let singularLastWord = lastWord;
  if (lastWord.endsWith("ies")) {
    singularLastWord = lastWord.slice(0, -3) + "y";
  } else if (lastWord.endsWith("ses")) {
    singularLastWord = lastWord.slice(0, -2);
  } else if (lastWord.endsWith("s")) {
    singularLastWord = lastWord.slice(0, -1);
  }

  words.push(singularLastWord);

  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
});

const headerIcon = computed(() => {
  if (props.action === "Create") return "mdi-account-plus-outline";
  if (props.action === "Remove") return "mdi-account-remove-outline";
  if (props.action === "View") return "mdi-account-eye-outline";
  return "mdi-account-edit-outline";
});

const headerColor = computed(() =>
  props.action === "Remove" ? "error" : "primary",
);

const visibleEmployeeFields = computed(() =>
  props.employeeFields.filter(
    (field) => field.inputField !== "none" && field.key !== "action",
  ),
);

const accountFields = computed(() =>
  visibleEmployeeFields.value.filter((field) =>
    ["user.email", "employee_no", "hire_date"].includes(field.key),
  ),
);

const employmentFields = computed(() =>
  visibleEmployeeFields.value.filter(
    (field) =>
      ![
        "user.email",
        "employee_no",
        "hire_date",
        "basic_monthly_salary",
        "pay_schedule",
      ].includes(field.key),
  ),
);

const payrollFields = computed(() =>
  visibleEmployeeFields.value.filter((field) =>
    ["basic_monthly_salary", "pay_schedule"].includes(field.key),
  ),
);

const optionLabel = (selectKey: string, value: unknown): string => {
  const field = visibleEmployeeFields.value.find(
    (item: any) => item.selectKey === selectKey,
  ) as any;
  return field?.inputOptions?.find((option: any) => option.value === value)?.label ?? "";
};

const linkedAccountLabel = computed(() =>
  optionLabel("user_id", employeeForm.value.user_id),
);

const selectedEmploymentStatus = computed(() =>
  optionLabel(
    "employment_status_id",
    employeeForm.value.employment_status_id,
  ),
);

const employeeInitials = computed(() => {
  const name = linkedAccountLabel.value.split(" - ")[0].trim();
  if (!name) return "?";
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
});

const isFieldReadOnly = (field: ColumnConfig): boolean => {
  if (props.readOnly) return true;
  if (field.readOnly) return true;
  if (field.readOnlyOnEdit && props.action === "Edit") return true;
  return false;
};

const getColSize = (key: string): number => {
  if (key === "type") return 6;
  if (key === "address_line_1" || key === "address_line_2") return 12;
  if (key === "city" || key === "province") return 6;
  if (key === "postal_code" || key === "country") return 6;
  return 12;
};

const loadCountries = async () => {
  loadingCountries.value = true;
  try {
    const response = await axios.get("/public-apis/countries");
    countryOptions.value = response.data.data || [];
  } catch (error) {
    console.error("Error loading countries:", error);
  } finally {
    loadingCountries.value = false;
  }
};

const onCountryChange = async (index: number, countryIso2: string) => {
  const address = addresses.value[index];

  address.province_iso2 = "";
  address.province = "";
  address.city = "";
  address.stateOptions = [];
  address.cityOptions = [];

  const country = countryOptions.value.find((c) => c.iso2 === countryIso2);
  address.country = country?.name || "";

  if (!address.country) return;

  address.loadingStates = true;
  try {
    // Pass the country NAME instead of ISO2
    const response = await axios.get(
      `/public-apis/countries/${encodeURIComponent(address.country)}/states`,
    );
    address.stateOptions = response.data.data || [];
  } catch (error) {
    console.error("Error loading states:", error);
    address.stateOptions = [];
  } finally {
    address.loadingStates = false;
  }
};

const onStateChange = async (index: number, stateIso2: string) => {
  const address = addresses.value[index];

  address.city = "";
  address.cityOptions = [];

  const state = address.stateOptions?.find((s: any) => s.iso2 === stateIso2);
  address.province = state?.name || "";

  if (!address.province || !address.country) return;

  address.loadingCities = true;
  try {
    // Pass country NAME and state NAME
    const response = await axios.get(
      `/public-apis/countries/${encodeURIComponent(
        address.country,
      )}/states/${encodeURIComponent(address.province)}/cities`,
    );
    address.cityOptions = response.data.data || [];
  } catch (error) {
    console.error("Error loading cities:", error);
    address.cityOptions = [];
  } finally {
    address.loadingCities = false;
  }
};

const addAddress = () => {
  addresses.value.push({
    type: addresses.value.length === 0 ? "current" : "permanent",
    address_line_1: "",
    address_line_2: "",
    city: "",
    province: "",
    province_iso2: "",
    postal_code: "",
    country: "",
    country_iso2: "",
    stateOptions: [],
    cityOptions: [],
    loadingStates: false,
    loadingCities: false,
  });
};

const removeAddress = (index: number) => {
  addresses.value.splice(index, 1);
};

const addContact = () => {
  contacts.value.push({
    type: "mobile",
    value: "",
  });
};

const removeContact = (index: number) => {
  contacts.value.splice(index, 1);
};

const fieldValue = (field: ColumnConfig): unknown => {
  const key = (field as any).selectKey ?? field.key;
  return employeeForm.value[key];
};

const validateStep = (step: number): boolean => {
  validationMessage.value = "";
  if (props.readOnly) return true;

  if (step === 1) {
    const missing = visibleEmployeeFields.value.find(
      (field) => field.required && !fieldValue(field),
    );
    if (missing) {
      validationMessage.value = `${missing.title} is required before continuing.`;
      return false;
    }
  }

  if (step === 2) {
    const invalidIndex = addresses.value.findIndex(
      (address) =>
        !address.type ||
        !address.address_line_1 ||
        !address.country ||
        !address.province ||
        !address.city,
    );
    if (invalidIndex !== -1) {
      validationMessage.value = `Complete the required fields for Address ${invalidIndex + 1}.`;
      return false;
    }
  }

  if (step === 3) {
    const invalidIndex = contacts.value.findIndex(
      (contact) => !contact.type || !contact.value,
    );
    if (invalidIndex !== -1) {
      validationMessage.value = `Complete the type and value for Contact ${invalidIndex + 1}.`;
      return false;
    }
  }

  return true;
};

const goToStep = (target: number) => {
  if (target <= currentStep.value) {
    currentStep.value = target;
    validationMessage.value = "";
    return;
  }

  for (let step = currentStep.value; step < target; step++) {
    if (!validateStep(step)) {
      currentStep.value = step;
      return;
    }
  }

  currentStep.value = target;
};

const nextStep = () => {
  if (validateStep(currentStep.value)) currentStep.value++;
};

const previousStep = () => {
  validationMessage.value = "";
  currentStep.value--;
};

const handleSubmit = () => {
  if (props.action === "Remove") {
    emit("execute", { ...employeeForm.value, ...props.data });
    return;
  }

  for (const step of workflowSteps) {
    if (!validateStep(step.value)) {
      currentStep.value = step.value;
      return;
    }
  }

  const cleanAddresses = addresses.value.map((addr) => ({
    id: addr.id,
    type: addr.type,
    address_line_1: addr.address_line_1,
    address_line_2: addr.address_line_2,
    city: addr.city,
    province: addr.province,
    postal_code: addr.postal_code,
    country: addr.country,
  }));

  const payload = {
    ...employeeForm.value,
    addresses: cleanAddresses,
    contacts: contacts.value.map((contact) => ({
      id: contact.id,
      type: contact.type,
      value: contact.value,
    })),
  };
  emit("execute", payload);
};

onMounted(() => {
  loadCountries();
});

watch(isFullscreen, (value) => {
  if (!value) resetDialogGeometry();
});

watch(
  () => props.visible,
  async (visible) => {
    if (visible) {
      currentStep.value = 1;
      validationMessage.value = "";
      resetDialogGeometry();
      employeeForm.value = { ...props.employeeForm, ...props.data };

      if (props.data.addresses && props.data.addresses.length > 0) {
        addresses.value = await Promise.all(
          props.data.addresses.map(async (addr: any) => {
            const address = {
              ...addr,
              country_iso2: "",
              province_iso2: "",
              stateOptions: [],
              cityOptions: [],
              loadingStates: false,
              loadingCities: false,
            };

            if (addr.country) {
              const country = countryOptions.value.find(
                (c) => c.name.toLowerCase() === addr.country.toLowerCase(),
              );
              if (country) {
                address.country_iso2 = country.iso2;

                try {
                  // Fetch using country NAME
                  const response = await axios.get(
                    `/public-apis/countries/${encodeURIComponent(
                      country.name,
                    )}/states`,
                  );
                  address.stateOptions = response.data.data || [];

                  if (addr.province) {
                    const state = address.stateOptions.find(
                      (s: any) =>
                        s.name.toLowerCase() === addr.province.toLowerCase(),
                    );
                    if (state) {
                      address.province_iso2 = state.iso2;

                      // Fetch using country NAME and state NAME
                      const citiesResponse = await axios.get(
                        `/public-apis/countries/${encodeURIComponent(
                          country.name,
                        )}/states/${encodeURIComponent(state.name)}/cities`,
                      );
                      address.cityOptions = citiesResponse.data.data || [];
                    }
                  }
                } catch (error) {
                  console.error("Error loading location data:", error);
                }
              }
            }

            return address;
          }),
        );
      } else {
        addresses.value = [];
      }

      contacts.value = props.data.contacts ? [...props.data.contacts] : [];
    } else {
      isFullscreen.value = false;
      resetDialogGeometry();
    }
  },
);
</script>

<style scoped>
.drag-handle {
  cursor: move;
}

.resizable-card.dragging {
  cursor: grabbing;
  user-select: none;
}

.resizable-card.resizing {
  cursor: nwse-resize;
  user-select: none;
}

.resizable-card {
  flex: 0 0 auto !important;
  align-self: center;
  justify-self: center;
  width: min(980px, 94vw);
  max-height: 88vh;
  min-width: 600px;
  min-height: 400px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
}

.resize-handle {
  position: absolute;
  right: 2px;
  bottom: 2px;
  width: 14px;
  height: 14px;
  cursor: nwse-resize;
  z-index: 2;
  opacity: 0.45;
  transition: opacity 0.15s ease;
  background-image: linear-gradient(
    135deg,
    transparent 0%,
    transparent 65%,
    rgba(var(--v-theme-on-surface), 0.6) 65%,
    rgba(var(--v-theme-on-surface), 0.6) 75%,
    transparent 75%
  );
}

.resize-handle:hover,
.resizable-card.resizing .resize-handle {
  opacity: 0.9;
}

.resizable-card :deep(.v-card-actions) {
  padding: 10px 20px 14px;
}

.resizable-card.is-fullscreen {
  width: 100% !important;
  height: 100% !important;
  max-width: none !important;
  max-height: none !important;
  min-width: 0;
  min-height: 0;
  resize: none;
}

.employee-dialog-header {
  min-height: 66px;
  padding: 12px 18px;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.employee-dialog-body {
  padding: 0 !important;
}

.delete-confirmation {
  max-width: 360px;
  margin: 0 auto;
  padding: 34px 24px;
  text-align: center;
}

.employee-workflow {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  min-height: 540px;
}

.workflow-nav {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 20px 14px;
  background: rgba(var(--v-theme-on-surface), 0.025);
  border-right: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.workflow-step {
  display: flex;
  align-items: center;
  gap: 11px;
  width: 100%;
  padding: 11px 10px;
  border: 0;
  border-radius: 10px;
  color: rgb(var(--v-theme-on-surface-variant));
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition: background 0.16s ease, color 0.16s ease;
}

.workflow-step:hover {
  background: rgba(var(--v-theme-primary), 0.06);
}

.workflow-step.active {
  color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.11);
}

.workflow-step-number {
  display: grid;
  flex: 0 0 28px;
  width: 28px;
  height: 28px;
  place-items: center;
  border-radius: 50%;
  background: rgba(var(--v-theme-on-surface), 0.08);
  font-size: 0.75rem;
  font-weight: 700;
}

.workflow-step.active .workflow-step-number,
.workflow-step.complete .workflow-step-number {
  color: rgb(var(--v-theme-on-primary));
  background: rgb(var(--v-theme-primary));
}

.workflow-step-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

.workflow-step-copy strong {
  font-size: 0.82rem;
  line-height: 1.25;
}

.workflow-step-copy small {
  margin-top: 2px;
  overflow: hidden;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.68rem;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workflow-window {
  min-width: 0;
}

.step-content {
  padding: 22px 26px 26px;
}

.section-heading {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 22px;
}

.employee-field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.employee-summary {
  display: flex;
  align-items: center;
  gap: 13px;
  margin-bottom: 20px;
  padding: 14px 16px;
  border-radius: 12px;
  background: linear-gradient(
    120deg,
    rgba(var(--v-theme-primary), 0.11),
    rgba(var(--v-theme-primary), 0.025)
  );
}

.employee-summary-copy {
  min-width: 0;
  flex: 1;
}

.employee-summary-copy > div {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.form-section {
  padding: 18px;
  border-radius: 12px;
  background: rgba(var(--v-theme-on-surface), 0.025);
}

.form-section + .form-section {
  margin-top: 14px;
}

.form-section-title {
  font-size: 0.85rem;
  font-weight: 700;
}

.form-section-description {
  margin-top: 2px;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.73rem;
}

.detail-record {
  padding: 2px 0 24px;
}

.detail-record + .detail-record {
  margin-top: 24px;
  padding-top: 24px;
  box-shadow: 0 -1px rgba(var(--v-border-color), 0.18);
}

.detail-record-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 15px;
}

.detail-type-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
  padding: 9px 10px 9px 13px;
  border-radius: 10px;
  background: rgba(var(--v-theme-on-surface), 0.035);
}

.detail-type-row :deep(.v-btn-toggle) {
  max-width: 100%;
  overflow-x: auto;
}

.contact-record {
  max-width: 100%;
}

.address-lines-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
  gap: 12px;
}

.location-grid {
  display: grid;
  grid-template-columns:
    minmax(0, 1.15fr)
    minmax(0, 1.15fr)
    minmax(0, 1fr)
    minmax(110px, 0.7fr);
  gap: 12px;
  margin-top: 12px;
}

.empty-state {
  padding: 34px 20px;
  text-align: center;
  color: rgb(var(--v-theme-on-surface-variant));
  background: rgba(var(--v-theme-on-surface), 0.035);
}

.employee-dialog-actions {
  min-height: 58px;
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgb(var(--v-theme-surface));
}

.validation-message {
  display: flex;
  align-items: center;
  gap: 6px;
  color: rgb(var(--v-theme-error));
  font-size: 0.75rem;
}

@media (max-width: 700px) {
  .resizable-card {
    width: 96vw;
    min-width: 0;
  }

  .employee-field-grid {
    grid-template-columns: 1fr;
  }

  .employee-workflow {
    display: block;
    min-height: 0;
  }

  .workflow-nav {
    position: sticky;
    top: 0;
    z-index: 2;
    flex-direction: row;
    padding: 8px;
    overflow-x: auto;
    border-right: 0;
    border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  }

  .workflow-step {
    min-width: max-content;
    padding: 8px 10px;
  }

  .workflow-step-copy small {
    display: none;
  }

  .step-content {
    padding: 18px 16px 22px;
  }

  .stepper-header {
    padding-inline: 8px;
  }

  .section-heading {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .employee-summary {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .address-lines-grid,
  .location-grid {
    grid-template-columns: 1fr;
  }

  .detail-type-row {
    align-items: flex-start;
    flex-direction: column;
  }

  .detail-type-row :deep(.v-btn-toggle) {
    width: 100%;
  }

  .detail-type-row :deep(.v-btn) {
    flex: 1;
  }

  .validation-message {
    width: 100%;
    order: -1;
  }
}
</style>
