<template>
  <v-dialog v-model="props.visible" max-width="1000" persistent>
    <v-card :title="`${props.action} ${displayEntity}`">
      <template v-slot:text>
        <template v-if="props.action === 'Remove'">
          Are you sure you want to delete this item?
        </template>
        <template v-else v-for="field in props.fields" :key="field.key">
          <h5 v-if="field.inputField != 'none'">
            {{ field.title }}
            <span v-if="field.required" style="color: red">*</span>
          </h5>

          <v-text-field
            v-if="field.inputField === 'text'"
            v-model="form[field.key]"
            :readonly="isFieldReadOnly(field)"
            :required="field.required"
            :rules="
              field.required ? [(v) => !!v || `${field.title} is required`] : []
            "
          />
          <v-text-field
            v-else-if="field.inputField === 'date'"
            type="date"
            v-model="form[field.key]"
            :readonly="isFieldReadOnly(field)"
            :required="field.required"
            :rules="
              field.required ? [(v) => !!v || `${field.title} is required`] : []
            "
          />
          <v-text-field
            v-else-if="field.inputField === 'time'"
            type="time"
            v-model="form[field.key]"
            :readonly="isFieldReadOnly(field)"
            :required="field.required"
            :rules="
              field.required ? [(v) => !!v || `${field.title} is required`] : []
            "
          />
          <v-checkbox
            v-else-if="field.inputField === 'checkbox'"
            v-model="form[field.key]"
            :readonly="isFieldReadOnly(field)"
          />
          <v-radio-group
            v-else-if="field.inputField === 'radio'"
            v-model="form[field.key]"
            :readonly="isFieldReadOnly(field)"
          >
            <v-radio
              v-for="option in field.inputOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </v-radio-group>
          <v-select
            v-else-if="field.inputField === 'select'"
            v-model="form[field.selectKey!]"
            item-title="label"
            item-value="value"
            :items="field.inputOptions"
            :readonly="isFieldReadOnly(field)"
            :required="field.required"
            :rules="
              field.required ? [(v) => !!v || `${field.title} is required`] : []
            "
          />
        </template>
        <v-btn
          v-if="props.entity === 'Role' && props.action !== 'Remove'"
          prepend-icon="mdi-account-lock-outline"
          @click="emit('permission')"
        >
          Permissions
        </v-btn>
      </template>

      <template v-slot:actions>
        <v-btn @click="$emit('close')"> Close </v-btn>
        <v-btn
          v-if="props.action === 'Create'"
          prepend-icon="mdi-plus"
          color="success"
          :loading="props.loading"
          :disabled="props.readOnly"
          @click="execute"
        >
          Create {{ displayEntity }}
        </v-btn>
        <v-btn
          v-if="props.action === 'Edit'"
          prepend-icon="mdi-pencil"
          color="info"
          :loading="props.loading"
          :disabled="props.readOnly"
          @click="execute"
        >
          Save {{ displayEntity }}
        </v-btn>
        <v-btn
          v-if="props.action === 'Remove'"
          prepend-icon="mdi-delete"
          color="error"
          :loading="props.loading"
          :disabled="props.readOnly"
          @click="execute"
        >
          Delete {{ displayEntity }}
        </v-btn>
      </template>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import { ColumnConfig } from "@/types/types";

const props = defineProps({
  loading: { type: Boolean, default: false },
  entity: { type: String, default: "" },
  action: { type: String, default: "" },
  readOnly: { type: Boolean, default: false },
  visible: { type: Boolean, default: false },
  form: { type: Object, default: () => {} },
  data: { type: Object, default: () => {} },
  fields: { type: Array as () => ColumnConfig[], default: () => [] },
});

const form = ref<Record<string, any>>({});

const emit = defineEmits(["permission", "close", "execute"]);

const isFieldReadOnly = (field: ColumnConfig): boolean => {
  if (props.readOnly) return true;
  if (field.readOnly) return true;
  if (field.readOnlyOnEdit && props.action === "Edit") return true;
  return false;
};

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

const execute = async () => {
  emit("execute", form.value);
};

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      form.value = { ...props.form, ...props.data };
    }
  },
);
</script>
