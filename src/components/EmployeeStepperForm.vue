<template>
  <v-dialog v-model="props.visible" max-width="1200" persistent scrollable>
    <v-card>
      <v-card-title class="d-flex align-center">
        <span>{{ props.action }} {{ displayEntity }}</span>
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" @click="$emit('close')" />
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-0">
        <v-stepper v-model="currentStep" alt-labels>
          <v-stepper-header>
            <v-stepper-item
              :complete="currentStep > 1"
              :value="1"
              title="Employee Details"
            />
            <v-divider />
            <v-stepper-item
              :complete="currentStep > 2"
              :value="2"
              title="Addresses"
            />
            <v-divider />
            <v-stepper-item
              :complete="currentStep > 3"
              :value="3"
              title="Contact Information"
            />
          </v-stepper-header>

          <v-stepper-window>
            <!-- Step 1: Employee Details -->
            <v-stepper-window-item :value="1">
              <v-card flat>
                <v-card-text>
                  <h3 class="text-h6 mb-4">Employee Information</h3>
                  <template
                    v-for="field in props.employeeFields"
                    :key="field.key"
                  >
                    <h5 v-if="field.inputField != 'none'">{{ field.title }}</h5>
                    <v-text-field
                      v-if="field.inputField === 'text'"
                      :required="!field.nullable"
                      v-model="employeeForm[field.key]"
                      :readonly="isFieldReadOnly(field)"
                      density="compact"
                      variant="outlined"
                    />
                    <v-text-field
                      v-else-if="field.inputField === 'date'"
                      type="date"
                      v-model="employeeForm[field.key]"
                      :readonly="isFieldReadOnly(field)"
                      density="compact"
                      variant="outlined"
                    />
                    <v-select
                      v-else-if="field.inputField === 'select'"
                      v-model="employeeForm[field.selectKey!]"
                      item-title="label"
                      item-value="value"
                      :items="field.inputOptions"
                      :readonly="isFieldReadOnly(field)"
                      density="compact"
                      variant="outlined"
                    />
                  </template>
                </v-card-text>
              </v-card>
            </v-stepper-window-item>

            <!-- Step 2: Addresses -->
            <v-stepper-window-item :value="2">
              <v-card flat>
                <v-card-text>
                  <div class="d-flex justify-space-between align-center mb-4">
                    <h3 class="text-h6">Addresses</h3>
                    <v-btn
                      color="primary"
                      prepend-icon="mdi-plus"
                      size="small"
                      @click="addAddress"
                      :disabled="props.readOnly"
                    >
                      Add Address
                    </v-btn>
                  </div>

                  <v-card
                    v-for="(address, index) in addresses"
                    :key="index"
                    class="mb-4"
                    variant="outlined"
                  >
                    <v-card-text>
                      <div
                        class="d-flex justify-space-between align-center mb-2"
                      >
                        <span class="text-subtitle-2">
                          Address {{ index + 1 }}
                        </span>
                        <v-btn
                          icon="mdi-delete"
                          size="small"
                          variant="text"
                          color="error"
                          @click="removeAddress(index)"
                          :disabled="props.readOnly"
                        />
                      </div>

                      <v-row>
                        <!-- Address Type -->
                        <v-col cols="12" md="6">
                          <v-select
                            v-model="address.type"
                            label="Type"
                            item-title="label"
                            item-value="value"
                            :items="addressTypeOptions"
                            :readonly="props.readOnly"
                            density="compact"
                            variant="outlined"
                          />
                        </v-col>

                        <!-- Address Line 1 -->
                        <v-col cols="12">
                          <v-text-field
                            v-model="address.address_line_1"
                            label="Address Line 1"
                            :readonly="props.readOnly"
                            density="compact"
                            variant="outlined"
                          />
                        </v-col>

                        <!-- Address Line 2 -->
                        <v-col cols="12">
                          <v-text-field
                            v-model="address.address_line_2"
                            label="Address Line 2"
                            :readonly="props.readOnly"
                            density="compact"
                            variant="outlined"
                          />
                        </v-col>

                        <!-- Country Dropdown -->
                        <v-col cols="12" md="6">
                          <v-autocomplete
                            v-model="address.country_iso2"
                            label="Country"
                            item-title="name"
                            item-value="iso2"
                            :items="countryOptions"
                            :readonly="props.readOnly"
                            :loading="loadingCountries"
                            density="compact"
                            variant="outlined"
                            @update:model-value="onCountryChange(index, $event)"
                          />
                        </v-col>

                        <!-- State/Province Dropdown -->
                        <v-col cols="12" md="6">
                          <v-autocomplete
                            v-model="address.province_iso2"
                            label="Province/State"
                            item-title="name"
                            item-value="iso2"
                            :items="address.stateOptions || []"
                            :readonly="props.readOnly"
                            :loading="address.loadingStates"
                            :disabled="!address.country_iso2"
                            density="compact"
                            variant="outlined"
                            @update:model-value="onStateChange(index, $event)"
                          />
                        </v-col>

                        <!-- City Dropdown -->
                        <v-col cols="12" md="6">
                          <v-autocomplete
                            v-model="address.city"
                            label="City"
                            item-title="name"
                            item-value="name"
                            :items="address.cityOptions || []"
                            :readonly="props.readOnly"
                            :loading="address.loadingCities"
                            :disabled="!address.province_iso2"
                            density="compact"
                            variant="outlined"
                          />
                        </v-col>

                        <!-- Postal Code -->
                        <v-col cols="12" md="6">
                          <v-text-field
                            v-model="address.postal_code"
                            label="Postal Code"
                            :readonly="props.readOnly"
                            density="compact"
                            variant="outlined"
                          />
                        </v-col>
                      </v-row>
                    </v-card-text>
                  </v-card>

                  <v-alert
                    v-if="addresses.length === 0"
                    type="info"
                    variant="tonal"
                  >
                    No addresses added yet. Click "Add Address" to add one.
                  </v-alert>
                </v-card-text>
              </v-card>
            </v-stepper-window-item>

            <!-- Step 3: Contacts -->
            <v-stepper-window-item :value="3">
              <v-card flat>
                <v-card-text>
                  <div class="d-flex justify-space-between align-center mb-4">
                    <h3 class="text-h6">Contact Information</h3>
                    <v-btn
                      color="primary"
                      prepend-icon="mdi-plus"
                      size="small"
                      @click="addContact"
                      :disabled="props.readOnly"
                    >
                      Add Contact
                    </v-btn>
                  </div>

                  <v-card
                    v-for="(contact, index) in contacts"
                    :key="index"
                    class="mb-4"
                    variant="outlined"
                  >
                    <v-card-text>
                      <div
                        class="d-flex justify-space-between align-center mb-2"
                      >
                        <span class="text-subtitle-2"
                          >Contact {{ index + 1 }}</span
                        >
                        <v-btn
                          icon="mdi-delete"
                          size="small"
                          variant="text"
                          color="error"
                          @click="removeContact(index)"
                          :disabled="props.readOnly"
                        />
                      </div>

                      <v-row>
                        <v-col
                          v-for="field in props.contactFields.filter(
                            (f) => f.inputField !== 'none',
                          )"
                          :key="field.key"
                          cols="12"
                          :md="field.key === 'type' ? 4 : 8"
                        >
                          <v-select
                            v-if="field.inputField === 'select'"
                            v-model="contact[field.selectKey!]"
                            :label="field.title"
                            item-title="label"
                            item-value="value"
                            :items="field.inputOptions"
                            :readonly="props.readOnly"
                            density="compact"
                            variant="outlined"
                          />
                          <v-text-field
                            v-else
                            v-model="contact[field.key]"
                            :label="field.title"
                            :readonly="props.readOnly"
                            density="compact"
                            variant="outlined"
                          />
                        </v-col>
                      </v-row>
                    </v-card-text>
                  </v-card>

                  <v-alert
                    v-if="contacts.length === 0"
                    type="info"
                    variant="tonal"
                  >
                    No contacts added yet. Click "Add Contact" to add one.
                  </v-alert>
                </v-card-text>
              </v-card>
            </v-stepper-window-item>
          </v-stepper-window>
        </v-stepper>
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-btn v-if="currentStep > 1" @click="currentStep--" variant="text">
          Previous
        </v-btn>
        <v-spacer />
        <v-btn @click="$emit('close')" variant="text"> Close </v-btn>
        <v-btn v-if="currentStep < 3" color="primary" @click="currentStep++">
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
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { computed, ref, watch, onMounted } from "vue";
import { ColumnConfig } from "@/types/types";
import axios from "@/plugins/axios";

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
const employeeForm = ref<Record<string, any>>({});
const addresses = ref<Array<Record<string, any>>>([]);
const contacts = ref<Array<Record<string, any>>>([]);

const countryOptions = ref<any[]>([]);
const loadingCountries = ref(false);

const addressTypeOptions = [
  { label: "Current", value: "current" },
  { label: "Permanent", value: "permanent" },
  { label: "Previous", value: "previous" },
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
      `/public-apis/countries/${encodeURIComponent(address.country)}/states/${encodeURIComponent(address.province)}/cities`,
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
    type: "",
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
    type: "",
    value: "",
  });
};

const removeContact = (index: number) => {
  contacts.value.splice(index, 1);
};

const handleSubmit = () => {
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

watch(
  () => props.visible,
  async (visible) => {
    if (visible) {
      currentStep.value = 1;
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
                    `/public-apis/countries/${encodeURIComponent(country.name)}/states`,
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
                        `/public-apis/countries/${encodeURIComponent(country.name)}/states/${encodeURIComponent(state.name)}/cities`,
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
    }
  },
);
</script>

<style scoped>
.v-stepper {
  box-shadow: none;
}
</style>
