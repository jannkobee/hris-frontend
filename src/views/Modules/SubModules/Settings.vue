<template>
  <v-container fluid class="settings-page">
    <div class="settings-page-header">
      <div class="d-flex align-center ga-3">
        <v-avatar color="primary" variant="tonal" size="46">
          <v-icon icon="mdi-tune-variant" size="24" />
        </v-avatar>
        <div>
          <div class="text-h5 font-weight-bold">App Settings</div>
          <p class="text-body-2 text-medium-emphasis mb-0">
            Control your workspace experience and company-wide policies.
          </p>
        </div>
      </div>
      <div class="d-flex ga-2 flex-wrap">
        <v-chip
          :color="canManageAnyAppSettings ? 'primary' : 'default'"
          variant="tonal"
          size="small"
          :prepend-icon="
            canManageAnyAppSettings
              ? 'mdi-shield-check-outline'
              : 'mdi-eye-outline'
          "
        >
          {{
            canManageAnyAppSettings
              ? "Policy administrator"
              : "Company settings are read-only"
          }}
        </v-chip>
      </div>
    </div>

    <!-- Do not render fallback values while saved settings are hydrating. -->
    <template v-if="authUser && settingsReady">
      <v-tabs
        v-model="tab"
        color="primary"
        class="settings-tabs mb-5"
        :class="{ 'settings-tabs--two': !canViewTasks }"
        density="compact"
      >
        <v-tab value="general">
          <v-icon icon="mdi-palette-outline" start size="small" />
          General
        </v-tab>

        <v-tab v-if="canUsePayroll" value="payroll">
          <v-icon icon="mdi-cash-multiple" start size="small" />
          Payroll
        </v-tab>

        <v-tab v-if="canViewTasks" value="scheduled-tasks">
          <v-icon icon="mdi-clock-outline" start size="small" />
          Scheduled Tasks
        </v-tab>
      </v-tabs>

      <v-window v-model="tab">
        <!-- GENERAL TAB -->
        <v-window-item value="general">
          <div class="settings-grid">
            <div class="settings-column">
              <section class="settings-panel settings-panel--experience">
                <div class="panel-heading">
                  <v-avatar color="primary" variant="tonal" size="36">
                    <v-icon icon="mdi-palette-outline" size="19" />
                  </v-avatar>
                  <div>
                    <div class="panel-title">Your experience</div>
                    <div class="panel-description">
                      Only affects your signed-in account.
                    </div>
                  </div>
                  <v-chip size="x-small" variant="tonal" class="ml-auto"
                    >Personal</v-chip
                  >
                </div>

                <div class="theme-choice">
                  <button
                    v-for="option in themeOptions"
                    :key="option.value"
                    type="button"
                    class="theme-option"
                    :class="{ selected: theme === option.value }"
                    @click="theme = option.value"
                  >
                    <v-icon :icon="option.icon" size="21" />
                    <span>
                      <strong>{{ option.title }}</strong>
                      <small>{{ option.description }}</small>
                    </span>
                    <v-icon
                      :icon="
                        theme === option.value
                          ? 'mdi-check-circle'
                          : 'mdi-circle-outline'
                      "
                      :color="theme === option.value ? 'primary' : undefined"
                      size="19"
                      class="ml-auto"
                    />
                  </button>
                </div>
              </section>

              <section class="settings-panel settings-panel--organization">
                <div class="panel-heading">
                  <v-avatar color="primary" variant="tonal" size="36">
                    <v-icon icon="mdi-domain" size="19" />
                  </v-avatar>
                  <div>
                    <div class="panel-title">Organization</div>
                    <div class="panel-description">
                      Identity and regional defaults.
                    </div>
                  </div>
                  <v-chip size="x-small" variant="tonal" class="ml-auto"
                    >Company</v-chip
                  >
                </div>
                <div class="panel-fields">
                  <v-text-field
                    v-model="appSettingValues['organization.company_name']"
                    label="Company name"
                    density="compact"
                    variant="outlined"
                    hide-details
                    :disabled="!canManageOrganizationSettings"
                    prepend-inner-icon="mdi-domain"
                  />
                  <v-autocomplete
                    v-model="appSettingValues['organization.timezone']"
                    label="Company timezone"
                    :items="timezoneOptions"
                    density="compact"
                    variant="outlined"
                    hide-details
                    :disabled="!canManageOrganizationSettings"
                    prepend-inner-icon="mdi-map-clock-outline"
                  />
                </div>
              </section>
            </div>

            <div class="settings-column settings-column--wide">
              <section class="settings-panel settings-panel--attendance">
                <div class="panel-heading">
                  <v-avatar color="primary" variant="tonal" size="36">
                    <v-icon icon="mdi-clock-check-outline" size="19" />
                  </v-avatar>
                  <div>
                    <div class="panel-title">Attendance capture</div>
                    <div class="panel-description">
                      Choose the evidence collected at time in and time out.
                    </div>
                  </div>
                </div>

                <div class="policy-list policy-list--attendance">
                  <div class="policy-row">
                    <v-icon icon="mdi-camera-outline" class="policy-icon" />
                    <div class="policy-copy">
                      <strong>Attendance photos</strong>
                      <small
                        >Employees may include an optional photo with
                        attendance.</small
                      >
                    </div>
                    <v-select
                      v-if="
                        appSettingValues['attendance.photo_capture_enabled']
                      "
                      v-model="appSettingValues['attendance.photo_max_size_mb']"
                      label="Max size"
                      suffix="MB"
                      :items="[1, 2, 5, 10]"
                      density="compact"
                      variant="outlined"
                      hide-details
                      class="policy-inline-select"
                      :disabled="!canManageAttendanceSettings"
                    />
                    <v-switch
                      v-model="
                        appSettingValues['attendance.photo_capture_enabled']
                      "
                      color="primary"
                      density="compact"
                      hide-details
                      :disabled="!canManageAttendanceSettings"
                    />
                  </div>

                  <div class="policy-row">
                    <v-icon
                      icon="mdi-map-marker-radius-outline"
                      class="policy-icon"
                    />
                    <div class="policy-copy">
                      <strong>Current location</strong>
                      <small
                        >Request the device location during attendance
                        capture.</small
                      >
                    </div>
                    <v-switch
                      v-model="
                        appSettingValues['attendance.location_capture_enabled']
                      "
                      color="primary"
                      density="compact"
                      hide-details
                      :disabled="!canManageAttendanceSettings"
                    />
                  </div>

                  <div
                    class="policy-row policy-row--dependent"
                    :class="{
                      'policy-row--disabled':
                        !appSettingValues[
                          'attendance.location_capture_enabled'
                        ],
                    }"
                  >
                    <v-icon
                      icon="mdi-map-marker-check-outline"
                      class="policy-icon"
                    />
                    <div class="policy-copy">
                      <strong>Require location</strong>
                      <small
                        >Block attendance when a location cannot be
                        captured.</small
                      >
                    </div>
                    <v-switch
                      v-model="appSettingValues['attendance.location_required']"
                      color="primary"
                      density="compact"
                      hide-details
                      :disabled="
                        !canManageAttendanceSettings ||
                        !appSettingValues['attendance.location_capture_enabled']
                      "
                    />
                  </div>

                  <div class="policy-row">
                    <v-icon icon="mdi-note-text-outline" class="policy-icon" />
                    <div class="policy-copy">
                      <strong>Attendance notes</strong>
                      <small>Allow employees to attach an optional note.</small>
                    </div>
                    <v-switch
                      v-model="appSettingValues['attendance.notes_enabled']"
                      color="primary"
                      density="compact"
                      hide-details
                      :disabled="!canManageAttendanceSettings"
                    />
                  </div>

                  <div class="policy-row">
                    <v-icon icon="mdi-ip-network-outline" class="policy-icon" />
                    <div class="policy-copy">
                      <strong>Source IP address</strong>
                      <small
                        >Record the request IP for security and audit
                        review.</small
                      >
                    </div>
                    <v-switch
                      v-model="
                        appSettingValues['attendance.capture_ip_enabled']
                      "
                      color="primary"
                      density="compact"
                      hide-details
                      :disabled="!canManageAttendanceSettings"
                    />
                  </div>

                  <div class="policy-row">
                    <v-icon icon="mdi-calendar-edit" class="policy-icon" />
                    <div class="policy-copy">
                      <strong>Manual attendance entries</strong>
                      <small
                        >Permit authorized users to create or correct
                        entries.</small
                      >
                    </div>
                    <v-switch
                      v-model="
                        appSettingValues['attendance.manual_entries_enabled']
                      "
                      color="primary"
                      density="compact"
                      hide-details
                      :disabled="!canManageAttendanceSettings"
                    />
                  </div>
                </div>
              </section>

              <section class="settings-panel settings-panel--modules">
                <div class="panel-heading">
                  <v-avatar color="primary" variant="tonal" size="36">
                    <v-icon icon="mdi-apps" size="19" />
                  </v-avatar>
                  <div>
                    <div class="panel-title">Modules and notifications</div>
                    <div class="panel-description">
                      Supporting behavior shared across the company.
                    </div>
                  </div>
                </div>
                <div class="policy-list policy-list--modules">
                  <div class="policy-row">
                    <v-icon icon="mdi-paperclip" class="policy-icon" />
                    <div class="policy-copy">
                      <strong>Leave attachments</strong>
                      <small>Allow supporting files on leave requests.</small>
                    </div>
                    <v-switch
                      v-model="appSettingValues['leave.attachments_enabled']"
                      color="primary"
                      density="compact"
                      hide-details
                      :disabled="!canManageFeatureSettings"
                    />
                  </div>

                  <div v-if="canUseEmployeeDocuments" class="policy-row">
                    <v-icon
                      icon="mdi-folder-account-outline"
                      class="policy-icon"
                    />
                    <div class="policy-copy">
                      <strong>Employee 201 files</strong>
                      <small
                        >Secure personnel-document archive and employee
                        access.</small
                      >
                    </div>
                    <v-select
                      v-if="appSettingValues['employee_documents.enabled']"
                      v-model="
                        appSettingValues['employee_documents.max_size_mb']
                      "
                      label="Max size"
                      suffix="MB"
                      :items="[5, 10, 15, 25]"
                      density="compact"
                      variant="outlined"
                      hide-details
                      class="policy-inline-select"
                      :disabled="!canManageFeatureSettings"
                    />
                    <v-switch
                      v-model="appSettingValues['employee_documents.enabled']"
                      color="primary"
                      density="compact"
                      hide-details
                      :disabled="!canManageFeatureSettings"
                    />
                  </div>

                  <div class="policy-row">
                    <v-icon
                      icon="mdi-message-badge-outline"
                      class="policy-icon"
                    />
                    <div class="policy-copy">
                      <strong>Real-time messaging</strong>
                      <small
                        >Deliver new messages through the live Reverb
                        connection.</small
                      >
                    </div>
                    <v-switch
                      v-model="appSettingValues['messaging.realtime_enabled']"
                      color="primary"
                      density="compact"
                      hide-details
                      :disabled="!canManageFeatureSettings"
                    />
                  </div>

                  <div class="policy-row">
                    <v-icon icon="mdi-paperclip" class="policy-icon" />
                    <div class="policy-copy">
                      <strong>Message attachments</strong>
                      <small
                        >Allow photos, documents, media, and archives in
                        conversations.</small
                      >
                    </div>
                    <v-select
                      v-if="appSettingValues['messaging.attachments_enabled']"
                      v-model="
                        appSettingValues['messaging.max_attachment_size_mb']
                      "
                      label="Max size"
                      suffix="MB"
                      :items="[5, 10, 15, 25, 50]"
                      density="compact"
                      variant="outlined"
                      hide-details
                      class="policy-inline-select"
                      :disabled="!canManageFeatureSettings"
                    />
                    <v-switch
                      v-model="
                        appSettingValues['messaging.attachments_enabled']
                      "
                      color="primary"
                      density="compact"
                      hide-details
                      :disabled="!canManageFeatureSettings"
                    />
                  </div>

                  <div class="policy-row">
                    <v-icon icon="mdi-bell-check-outline" class="policy-icon" />
                    <div class="policy-copy">
                      <strong>Success notifications</strong>
                      <small
                        >Show confirmation alerts after successful
                        actions.</small
                      >
                    </div>
                    <v-switch
                      v-model="
                        appSettingValues['notifications.success_alerts_enabled']
                      "
                      color="primary"
                      density="compact"
                      hide-details
                      :disabled="!canManageFeatureSettings"
                    />
                  </div>
                </div>
              </section>
            </div>
          </div>

          <div class="settings-save-bar">
            <div>
              <div class="text-body-2 font-weight-medium">
                {{
                  hasChanges
                    ? "You have unsaved changes"
                    : "Settings are up to date"
                }}
              </div>
              <div class="text-caption text-medium-emphasis">
                {{
                  canManageAnyAppSettings
                    ? "Changes affect the organization unless marked Personal."
                    : "You can save changes to your personal theme."
                }}
              </div>
            </div>
            <v-btn
              color="primary"
              class="text-none"
              prepend-icon="mdi-content-save-outline"
              @click="saveGeneralSettings"
              :loading="saving || appSettingsLoading"
              :disabled="!hasChanges"
            >
              Save settings
            </v-btn>
          </div>
        </v-window-item>

        <!-- PAYROLL TAB -->
        <v-window-item v-if="canUsePayroll" value="payroll">
          <div class="payroll-settings-intro">
            <div class="d-flex align-center ga-3">
              <v-avatar color="primary" variant="tonal" size="46"
                ><v-icon icon="mdi-cash-cog"
              /></v-avatar>
              <div>
                <div class="text-subtitle-1 font-weight-bold">
                  Payroll policy — Philippines
                </div>
                <div class="text-body-2 text-medium-emphasis">
                  The payroll engine is country-ready, but Philippine statutory
                  rules are the only supported ruleset today.
                </div>
              </div>
            </div>
            <v-select
              v-model="appSettingValues['payroll.country']"
              label="Payroll country"
              :items="[{ title: 'Philippines (currently supported)', value: 'PH' }]"
              density="compact"
              variant="outlined"
              hide-details
              :disabled="!canManagePayrollSettings"
            />
            <v-switch
              v-model="appSettingValues['payroll.enabled']"
              label="Payroll enabled"
              color="primary"
              density="compact"
              hide-details
              :disabled="!canManagePayrollSettings"
            />
          </div>

          <div class="payroll-settings-grid">
            <section class="settings-panel payroll-policy-panel">
              <div class="panel-heading">
                <v-avatar color="primary" variant="tonal" size="36"
                  ><v-icon icon="mdi-calendar-clock" size="19"
                /></v-avatar>
                <div>
                  <div class="panel-title">Pay policy</div>
                  <div class="panel-description">
                    Company calculation defaults.
                  </div>
                </div>
              </div>
              <div class="compact-field-grid">
                <v-select
                  v-model="appSettingValues['payroll.default_frequency']"
                  label="Default frequency"
                  :items="payFrequencyOptions"
                  item-title="title"
                  item-value="value"
                  density="compact"
                  variant="outlined"
                  hide-details
                  :disabled="!canManagePayrollSettings"
                />
                <v-text-field
                  v-model.number="
                    appSettingValues['payroll.work_days_per_month']
                  "
                  type="number"
                  label="Work days / month"
                  density="compact"
                  variant="outlined"
                  hide-details
                  :disabled="!canManagePayrollSettings"
                />
                <v-text-field
                  v-model.number="appSettingValues['payroll.hours_per_day']"
                  type="number"
                  label="Hours / day"
                  density="compact"
                  variant="outlined"
                  hide-details
                  :disabled="!canManagePayrollSettings"
                />
                <v-text-field
                  v-model.number="
                    appSettingValues['payroll.overtime_multiplier']
                  "
                  type="number"
                  step="0.01"
                  label="OT multiplier"
                  suffix="×"
                  density="compact"
                  variant="outlined"
                  hide-details
                  :disabled="!canManagePayrollSettings"
                />
              </div>
              <div class="policy-footnote">
                <v-icon icon="mdi-alert-circle-outline" size="17" />Regular
                overtime is seeded at 1.25×. Configure holiday/rest-day rules
                before using this as final production payroll.
              </div>
            </section>

            <section class="settings-panel payroll-policy-panel">
              <div class="panel-heading">
                <v-avatar color="primary" variant="tonal" size="36"
                  ><v-icon icon="mdi-calendar-account-outline" size="19"
                /></v-avatar>
                <div>
                  <div class="panel-title">
                    Attendance and leave calculation
                  </div>
                  <div class="panel-description">
                    Define how the payroll generator interprets work records.
                  </div>
                </div>
                <v-switch
                  v-model="
                    appSettingValues['payroll.attendance_calculation_enabled']
                  "
                  color="primary"
                  density="compact"
                  hide-details
                  :disabled="!canManagePayrollSettings"
                />
              </div>
              <div
                :class="{
                  'policy-row--disabled':
                    !appSettingValues['payroll.attendance_calculation_enabled'],
                }"
              >
                <div class="weekday-setting">
                  <span>Scheduled workdays</span>
                  <v-btn-toggle
                    v-model="appSettingValues['payroll.work_weekdays']"
                    multiple
                    mandatory
                    color="primary"
                    density="compact"
                    variant="tonal"
                    :disabled="
                      !canManagePayrollSettings ||
                      !appSettingValues[
                        'payroll.attendance_calculation_enabled'
                      ]
                    "
                  >
                    <v-btn
                      v-for="day in payrollWeekdays"
                      :key="day.value"
                      :value="day.value"
                      size="small"
                      >{{ day.label }}</v-btn
                    >
                  </v-btn-toggle>
                </div>
                <div class="compact-field-grid mt-4">
                  <v-text-field
                    v-model="appSettingValues['payroll.scheduled_start_time']"
                    type="time"
                    label="Scheduled start"
                    density="compact"
                    variant="outlined"
                    hide-details
                    :disabled="
                      !canManagePayrollSettings ||
                      !appSettingValues[
                        'payroll.attendance_calculation_enabled'
                      ]
                    "
                  />
                  <v-text-field
                    v-model="appSettingValues['payroll.scheduled_end_time']"
                    type="time"
                    label="Scheduled end"
                    density="compact"
                    variant="outlined"
                    hide-details
                    :disabled="
                      !canManagePayrollSettings ||
                      !appSettingValues[
                        'payroll.attendance_calculation_enabled'
                      ]
                    "
                  />
                  <v-text-field
                    v-model.number="appSettingValues['payroll.grace_minutes']"
                    type="number"
                    min="0"
                    label="Late grace period"
                    suffix="minutes"
                    density="compact"
                    variant="outlined"
                    hide-details
                    :disabled="
                      !canManagePayrollSettings ||
                      !appSettingValues[
                        'payroll.attendance_calculation_enabled'
                      ]
                    "
                    class="span-2"
                  />
                </div>
                <div class="deduction-policy-grid mt-4">
                  <label class="deduction-policy"
                    ><div>
                      <strong>Absence deductions</strong
                      ><small
                        >Deduct scheduled days without attendance or approved
                        leave.</small
                      >
                    </div>
                    <v-switch
                      v-model="appSettingValues['payroll.deduct_absences']"
                      color="primary"
                      density="compact"
                      hide-details
                      :disabled="
                        !canManagePayrollSettings ||
                        !appSettingValues[
                          'payroll.attendance_calculation_enabled'
                        ]
                      "
                  /></label>
                  <label class="deduction-policy"
                    ><div>
                      <strong>Late and undertime</strong
                      ><small>Use the salary-derived per-minute rate.</small>
                    </div>
                    <v-switch
                      v-model="
                        appSettingValues['payroll.deduct_late_undertime']
                      "
                      color="primary"
                      density="compact"
                      hide-details
                      :disabled="
                        !canManagePayrollSettings ||
                        !appSettingValues[
                          'payroll.attendance_calculation_enabled'
                        ]
                      "
                  /></label>
                  <label class="deduction-policy"
                    ><div>
                      <strong>Unpaid leave</strong
                      ><small
                        >Deduct approved leave types marked as unpaid.</small
                      >
                    </div>
                    <v-switch
                      v-model="appSettingValues['payroll.deduct_unpaid_leave']"
                      color="primary"
                      density="compact"
                      hide-details
                      :disabled="
                        !canManagePayrollSettings ||
                        !appSettingValues[
                          'payroll.attendance_calculation_enabled'
                        ]
                      "
                  /></label>
                </div>
                <div class="policy-footnote">
                  <v-icon icon="mdi-information-outline" size="17" />Missing or
                  duplicate attendance becomes a payroll exception. HR must
                  review or acknowledge it before approval.
                </div>
              </div>
            </section>

            <section class="settings-panel statutory-panel">
              <div class="panel-heading">
                <v-avatar color="primary" variant="tonal" size="36"
                  ><v-icon icon="mdi-shield-account-outline" size="19"
                /></v-avatar>
                <div>
                  <div class="panel-title">SSS</div>
                  <div class="panel-description">Effective January 2025.</div>
                </div>
                <a
                  href="https://www.sss.gov.ph/pay-contribution/"
                  target="_blank"
                  rel="noopener"
                  class="source-link"
                  >Official source <v-icon icon="mdi-open-in-new" size="13"
                /></a>
              </div>
              <div class="compact-field-grid compact-field-grid--rates">
                <v-text-field
                  :model-value="
                    percent(appSettingValues['payroll.sss_employee_rate'])
                  "
                  label="Employee rate"
                  suffix="%"
                  density="compact"
                  variant="outlined"
                  hide-details
                  :disabled="!canManagePayrollSettings"
                  @update:model-value="
                    appSettingValues['payroll.sss_employee_rate'] = rate($event)
                  "
                />
                <v-text-field
                  :model-value="
                    percent(appSettingValues['payroll.sss_employer_rate'])
                  "
                  label="Employer rate"
                  suffix="%"
                  density="compact"
                  variant="outlined"
                  hide-details
                  :disabled="!canManagePayrollSettings"
                  @update:model-value="
                    appSettingValues['payroll.sss_employer_rate'] = rate($event)
                  "
                />
                <v-text-field
                  v-model.number="appSettingValues['payroll.sss_min_msc']"
                  type="number"
                  label="Minimum MSC"
                  prefix="₱"
                  density="compact"
                  variant="outlined"
                  hide-details
                  :disabled="!canManagePayrollSettings"
                />
                <v-text-field
                  v-model.number="appSettingValues['payroll.sss_max_msc']"
                  type="number"
                  label="Maximum MSC"
                  prefix="₱"
                  density="compact"
                  variant="outlined"
                  hide-details
                  :disabled="!canManagePayrollSettings"
                />
                <v-text-field
                  v-model.number="appSettingValues['payroll.sss_ec_low']"
                  type="number"
                  label="EC lower"
                  prefix="₱"
                  density="compact"
                  variant="outlined"
                  hide-details
                  :disabled="!canManagePayrollSettings"
                />
                <v-text-field
                  v-model.number="appSettingValues['payroll.sss_ec_high']"
                  type="number"
                  label="EC upper"
                  prefix="₱"
                  density="compact"
                  variant="outlined"
                  hide-details
                  :disabled="!canManagePayrollSettings"
                />
                <v-text-field
                  v-model.number="appSettingValues['payroll.sss_ec_threshold']"
                  type="number"
                  label="EC MSC threshold"
                  prefix="₱"
                  density="compact"
                  variant="outlined"
                  hide-details
                  :disabled="!canManagePayrollSettings"
                  class="span-2"
                />
              </div>
            </section>

            <section class="settings-panel statutory-panel">
              <div class="panel-heading">
                <v-avatar color="primary" variant="tonal" size="36"
                  ><v-icon icon="mdi-hospital-building" size="19"
                /></v-avatar>
                <div>
                  <div class="panel-title">PhilHealth</div>
                  <div class="panel-description">
                    Calendar year 2025 premium schedule.
                  </div>
                </div>
                <a
                  href="https://www.philhealth.gov.ph/advisories/2025/PA2025-0002.pdf"
                  target="_blank"
                  rel="noopener"
                  class="source-link"
                  >Official source <v-icon icon="mdi-open-in-new" size="13"
                /></a>
              </div>
              <div class="compact-field-grid">
                <v-text-field
                  :model-value="
                    percent(appSettingValues['payroll.philhealth_rate'])
                  "
                  label="Premium rate"
                  suffix="%"
                  density="compact"
                  variant="outlined"
                  hide-details
                  :disabled="!canManagePayrollSettings"
                  @update:model-value="
                    appSettingValues['payroll.philhealth_rate'] = rate($event)
                  "
                />
                <v-text-field
                  v-model.number="
                    appSettingValues['payroll.philhealth_salary_floor']
                  "
                  type="number"
                  label="Income floor"
                  prefix="₱"
                  density="compact"
                  variant="outlined"
                  hide-details
                  :disabled="!canManagePayrollSettings"
                />
                <v-text-field
                  v-model.number="
                    appSettingValues['payroll.philhealth_salary_ceiling']
                  "
                  type="number"
                  label="Income ceiling"
                  prefix="₱"
                  density="compact"
                  variant="outlined"
                  hide-details
                  :disabled="!canManagePayrollSettings"
                  class="span-2"
                />
              </div>
            </section>

            <section class="settings-panel statutory-panel">
              <div class="panel-heading">
                <v-avatar color="primary" variant="tonal" size="36"
                  ><v-icon icon="mdi-home-percent-outline" size="19"
                /></v-avatar>
                <div>
                  <div class="panel-title">Pag-IBIG</div>
                  <div class="panel-description">
                    Mandatory membership savings.
                  </div>
                </div>
                <a
                  href="https://www.pagibigfund.gov.ph/document/pdf/payments/PasilidadPagbabayadPamamagitanOTC_24%20JAN%202025.pdf"
                  target="_blank"
                  rel="noopener"
                  class="source-link"
                  >Official source <v-icon icon="mdi-open-in-new" size="13"
                /></a>
              </div>
              <div class="compact-field-grid compact-field-grid--rates">
                <v-text-field
                  :model-value="
                    percent(
                      appSettingValues['payroll.pagibig_employee_rate_low'],
                    )
                  "
                  label="Lower employee rate"
                  suffix="%"
                  density="compact"
                  variant="outlined"
                  hide-details
                  :disabled="!canManagePayrollSettings"
                  @update:model-value="
                    appSettingValues['payroll.pagibig_employee_rate_low'] =
                      rate($event)
                  "
                />
                <v-text-field
                  :model-value="
                    percent(appSettingValues['payroll.pagibig_employee_rate'])
                  "
                  label="Employee rate"
                  suffix="%"
                  density="compact"
                  variant="outlined"
                  hide-details
                  :disabled="!canManagePayrollSettings"
                  @update:model-value="
                    appSettingValues['payroll.pagibig_employee_rate'] =
                      rate($event)
                  "
                />
                <v-text-field
                  :model-value="
                    percent(appSettingValues['payroll.pagibig_employer_rate'])
                  "
                  label="Employer rate"
                  suffix="%"
                  density="compact"
                  variant="outlined"
                  hide-details
                  :disabled="!canManagePayrollSettings"
                  @update:model-value="
                    appSettingValues['payroll.pagibig_employer_rate'] =
                      rate($event)
                  "
                />
                <v-text-field
                  v-model.number="
                    appSettingValues['payroll.pagibig_rate_threshold']
                  "
                  type="number"
                  label="Rate threshold"
                  prefix="₱"
                  density="compact"
                  variant="outlined"
                  hide-details
                  :disabled="!canManagePayrollSettings"
                />
                <v-text-field
                  v-model.number="
                    appSettingValues['payroll.pagibig_max_salary']
                  "
                  type="number"
                  label="Maximum fund salary"
                  prefix="₱"
                  density="compact"
                  variant="outlined"
                  hide-details
                  :disabled="!canManagePayrollSettings"
                  class="span-2"
                />
              </div>
            </section>

            <section class="settings-panel tax-panel">
              <div class="panel-heading mb-2">
                <v-avatar color="primary" variant="tonal" size="36"
                  ><v-icon icon="mdi-file-percent-outline" size="19"
                /></v-avatar>
                <div>
                  <div class="panel-title">Withholding tax</div>
                  <div class="panel-description">
                    BIR revised withholding tax table effective January 1, 2023
                    onward.
                  </div>
                </div>
                <a
                  href="https://bir-cdn.bir.gov.ph/local/pdf/Annex%20E%20RR%2011-2018.pdf"
                  target="_blank"
                  rel="noopener"
                  class="source-link"
                  >View tax table <v-icon icon="mdi-open-in-new" size="13"
                /></a>
              </div>
              <div class="policy-footnote">
                <v-icon icon="mdi-lock-check-outline" size="17" />The monthly
                and semi-monthly brackets are versioned in each payslip
                calculation snapshot.
              </div>
            </section>
          </div>

          <div class="settings-save-bar">
            <div>
              <div class="text-body-2 font-weight-medium">
                {{
                  hasChanges
                    ? "You have unsaved payroll changes"
                    : "Payroll settings are up to date"
                }}
              </div>
              <div class="text-caption text-medium-emphasis">
                Changes apply only to payroll processed after saving.
              </div>
            </div>
            <v-btn
              color="primary"
              class="text-none"
              prepend-icon="mdi-content-save-outline"
              @click="saveGeneralSettings"
              :loading="saving || appSettingsLoading"
              :disabled="!hasChanges || !canManagePayrollSettings"
              >Save payroll settings</v-btn
            >
          </div>
        </v-window-item>

        <!-- SCHEDULED TASKS TAB -->
        <v-window-item v-if="canViewTasks" value="scheduled-tasks">
          <div class="automation-header">
            <v-avatar color="primary" variant="tonal" size="48" class="mr-4">
              <v-icon icon="mdi-clock-outline" size="large" />
            </v-avatar>
            <div>
              <div class="text-subtitle-1 font-weight-bold">
                Scheduled Tasks
              </div>
              <div class="text-body-2 text-medium-emphasis">
                Automate recurring jobs without touching the server crontab.
              </div>
            </div>
            <v-chip
              color="success"
              variant="tonal"
              size="small"
              class="ml-auto"
            >
              <v-icon icon="mdi-robot-outline" start size="small" />
              Automation
            </v-chip>
          </div>

          <div class="automation-note">
            <v-icon icon="mdi-information-outline" color="primary" size="20" />
            <div>
              <strong>Leave Accrual is managed automatically.</strong>
              <span>
                Leave Credit Settings decide which months receive credits. The
                task runs daily at 1:00 AM to safely catch eligible employees
                and prevent duplicate credits, so it cannot be edited here.
              </span>
            </div>
          </div>

          <Table
            entity="ScheduledTask"
            title=""
            :headers="taskHeaders"
            :data="taskItems"
            :pagination="taskPagination"
            :loading="taskLoading"
            @filter="onTaskFilter"
            @create="onTaskCreate"
            @view="onTaskView"
            @edit="onTaskEdit"
            @remove="onTaskRemove"
          >
            <template #extra-actions="{ item }">
              <v-btn
                v-if="checkPermissions('run-scheduled-tasks')"
                color="primary"
                variant="tonal"
                size="small"
                density="comfortable"
                icon="mdi-play"
                :loading="runningId === item.id"
                :title="`Run ${item.name} now`"
                :aria-label="`Run ${item.name} now`"
                @click="runTaskNow(item)"
              />
            </template>
          </Table>

          <Form
            :visible="taskDialog.visible"
            :action="taskDialog.action"
            entity="ScheduledTask"
            :fields="taskFieldsForDialog"
            :form="defaultTaskForm"
            :data="taskDialog.data"
            :loading="taskLoadingActions"
            @close="taskDialog.visible = false"
            @execute="onTaskExecute"
          />
        </v-window-item>
      </v-window>
    </template>

    <div v-else class="settings-loading" role="status" aria-live="polite">
      <span class="settings-loading__label">Loading your settings…</span>
      <v-skeleton-loader type="heading, paragraph" class="mb-4" />
      <div class="settings-loading__grid">
        <v-skeleton-loader type="article, list-item-three-line" />
        <v-skeleton-loader type="article, list-item-three-line" />
      </div>
    </div>
  </v-container>
</template>

<script lang="ts" setup>
import {
  onBeforeUnmount,
  onMounted,
  ref,
  reactive,
  computed,
  watch,
} from "vue";
import { useTheme } from "vuetify";
import { useAuth } from "@/composables/useAuth";
import { useApi } from "@/composables/useApi";
import { usePermissions } from "@/composables/usePermissions";
import { useAppSettings } from "@/composables/useAppSettings";
import { usePlanEntitlements } from "@/composables/usePlanEntitlements";
import Table from "@/components/Table.vue";
import Form from "@/components/Form.vue";
import { ColumnConfig } from "@/types/types";
import axios from "@/plugins/axios";
import { formatDateTime } from "@/utils/dateFormatter";
import { booleanChipColor } from "@/utils/chipColors";

const tab = ref("general");

/* ---------------------------------------------------------------------- */
/* General / theme                                                        */
/* ---------------------------------------------------------------------- */

const vuetifyTheme = useTheme();
const theme = ref(vuetifyTheme.global.name.value);
const themeOptions = [
  {
    value: "light",
    title: "Light",
    description: "Bright workspace",
    icon: "mdi-white-balance-sunny",
  },
  {
    value: "dark",
    title: "Dark",
    description: "Reduced glare",
    icon: "mdi-weather-night",
  },
];
const payFrequencyOptions = [
  { title: "Semi-monthly", value: "semi_monthly" },
  { title: "Monthly", value: "monthly" },
];
const payrollWeekdays = [
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
  { label: "Sun", value: 7 },
];
const percent = (value: any) => Number(value ?? 0) * 100;
const rate = (value: any) => Number(value ?? 0) / 100;
const saving = ref(false);
const savedSnapshot = ref("");

// Removed getUser since BaseContainer handles fetching it for the global state
const { settings, updateSettings, authUser } = useAuth();
const { checkPermissions } = usePermissions();
const { hasFeature } = usePlanEntitlements();
const {
  values: appSettingValues,
  definitions: appSettingDefinitions,
  loading: appSettingsLoading,
  initialized: appSettingsInitialized,
  loadAppSettings,
  updateAppSettings,
} = useAppSettings();
const settingsReady = ref(
  Boolean(authUser.value) && appSettingsInitialized.value,
);

const canManageSetting = (key: string): boolean => {
  if (key.startsWith("payroll.") && !hasFeature("payroll")) return false;
  if (
    key.startsWith("employee_documents.") &&
    !hasFeature("employee_documents")
  ) {
    return false;
  }

  if (checkPermissions("manage-app-settings")) return true;

  const permission = appSettingDefinitions.value[key]?.permission;
  return typeof permission === "string" && checkPermissions(permission);
};
const canManageOrganizationSettings = computed(() =>
  canManageSetting("organization.company_name"),
);
const canManageAttendanceSettings = computed(() =>
  canManageSetting("attendance.photo_capture_enabled"),
);
const canManageFeatureSettings = computed(() =>
  canManageSetting("leave.attachments_enabled"),
);
const canManagePayrollSettings = computed(() =>
  hasFeature("payroll") && canManageSetting("payroll.enabled"),
);
const canUsePayroll = computed(() => hasFeature("payroll"));
const canUseEmployeeDocuments = computed(() =>
  hasFeature("employee_documents"),
);
const canManageAnyAppSettings = computed(() =>
  [
    canManageOrganizationSettings.value,
    canManageAttendanceSettings.value,
    canManageFeatureSettings.value,
    canManagePayrollSettings.value,
  ].some(Boolean),
);
const timezoneOptions = computed<string[]>(
  () =>
    appSettingDefinitions.value["organization.timezone"]?.options ?? ["UTC"],
);

const currentSnapshot = computed(() =>
  JSON.stringify({
    theme: theme.value,
    values: appSettingValues.value,
  }),
);
const hasChanges = computed(
  () =>
    savedSnapshot.value !== "" && currentSnapshot.value !== savedSnapshot.value,
);

// Force Vue to reactively track the global permissions array directly!
const canViewTasks = computed(() => {
  if (!hasFeature("automation")) return false;
  if (!authUser.value?.role?.permissions) {
    return false;
  }
  return checkPermissions("view-scheduled-tasks");
});

const applyTheme = (themeName: string, persist = false) => {
  vuetifyTheme.global.name.value = themeName;
  if (persist) localStorage.setItem("APP_THEME", themeName);
};

watch(theme, (themeName) => applyTheme(themeName));

const saveGeneralSettings = async () => {
  saving.value = true;
  try {
    applyTheme(theme.value, true);
    await updateSettings({ theme: theme.value });
    if (canManageAnyAppSettings.value) {
      if (!appSettingValues.value["attendance.location_capture_enabled"]) {
        appSettingValues.value["attendance.location_required"] = false;
      }
      const authorizedUpdates = Object.fromEntries(
        Object.entries(appSettingValues.value).filter(([key]) =>
          canManageSetting(key),
        ),
      );
      await updateAppSettings(authorizedUpdates);
    }
    savedSnapshot.value = currentSnapshot.value;
  } finally {
    saving.value = false;
  }
};

/* ---------------------------------------------------------------------- */
/* Scheduled tasks                                                        */
/* ---------------------------------------------------------------------- */

const {
  items: taskItems,
  pagination: taskPagination,
  loading: taskLoading,
  loadingActions: taskLoadingActions,
  index: indexTasks,
  store: storeTask,
  update: updateTask,
  destroy: destroyTask,
} = useApi("/scheduled-tasks");

const runningId = ref<string | null>(null);

// Automatically fetch table data the moment the global user permission passes
watch(
  canViewTasks,
  async (hasPermission) => {
    if (hasPermission) {
      await indexTasks();
    }
  },
  { immediate: true },
);

const dayOptions = [
  { label: "Sunday", value: 0 },
  { label: "Monday", value: 1 },
  { label: "Tuesday", value: 2 },
  { label: "Wednesday", value: 3 },
  { label: "Thursday", value: 4 },
  { label: "Friday", value: 5 },
  { label: "Saturday", value: 6 },
];

const monthOptions = [
  { label: "January", value: 1 },
  { label: "February", value: 2 },
  { label: "March", value: 3 },
  { label: "April", value: 4 },
  { label: "May", value: 5 },
  { label: "June", value: 6 },
  { label: "July", value: 7 },
  { label: "August", value: 8 },
  { label: "September", value: 9 },
  { label: "October", value: 10 },
  { label: "November", value: 11 },
  { label: "December", value: 12 },
];

const formatTaskOutput = (value: string) => {
  if (!value) return "-";
  return value.length > 120 ? `${value.slice(0, 117)}...` : value;
};

const taskHeaders: ColumnConfig[] = [
  { key: "name", title: "Name" },
  { key: "command", title: "Command" },
  {
    key: "frequency",
    title: "Frequency",
    displayAs: "chip",
    chipColor: "primary",
  },
  {
    key: "is_active",
    title: "Status",
    displayAs: "chip",
    chipColor: booleanChipColor,
    formatter: (value: boolean) => (value ? "Active" : "Paused"),
  },
  { key: "last_run_at", title: "Last Run", formatter: formatDateTime },
  { key: "next_run_at", title: "Next Run", formatter: formatDateTime },
  { key: "last_run_output", title: "Last Result", formatter: formatTaskOutput },
  { key: "action", title: "Actions" },
];

const taskFields: ColumnConfig[] = [
  { key: "name", title: "Name", inputField: "text", required: true },
  { key: "description", title: "Description", inputField: "text" },
  {
    key: "command",
    title: "Artisan Command",
    inputField: "text",
    required: true,
  },
  {
    key: "frequency",
    selectKey: "frequency",
    title: "Frequency",
    inputField: "select",
    required: true,
    inputOptions: [
      { label: "Daily", value: "daily" },
      { label: "Weekly", value: "weekly" },
      { label: "Monthly", value: "monthly" },
      { label: "Yearly", value: "yearly" },
      { label: "Custom (cron expression)", value: "custom" },
    ],
    onChange: (value: string, form: Record<string, any>) => ({
      run_days: value === "weekly" ? (form.run_days ?? []) : [],
      run_day_of_month: ["monthly", "yearly"].includes(value)
        ? (form.run_day_of_month ?? 1)
        : null,
      run_months: value === "yearly" ? (form.run_months ?? []) : [],
      cron_expression: value === "custom" ? (form.cron_expression ?? "") : "",
    }),
  },
  { key: "run_time", title: "Run Time", inputField: "time" },
  { key: "timezone", title: "Timezone", inputField: "text" },
  {
    key: "run_days",
    selectKey: "run_days",
    title: "Run On (weekly only)",
    inputField: "select",
    inputOptions: dayOptions,
    multiple: true,
  },
  {
    key: "run_day_of_month",
    title: "Day of Month (monthly / yearly)",
    inputField: "text",
  },
  {
    key: "run_months",
    selectKey: "run_months",
    title: "Months (yearly only)",
    inputField: "select",
    inputOptions: monthOptions,
    multiple: true,
  },
  {
    key: "cron_expression",
    title: "Cron Expression (custom only)",
    inputField: "text",
  },
  { key: "is_active", title: "Active", inputField: "checkbox" },
];

const defaultTaskForm = {
  name: "",
  description: "",
  command: "",
  frequency: "daily",
  run_time: "00:00",
  timezone: "Asia/Manila",
  run_days: [] as number[],
  run_day_of_month: 1,
  run_months: [] as number[],
  cron_expression: "",
  is_active: true,
};

const autoManagedTaskNames = ["Leave Accrual"];
const autoManagedFieldKeys = new Set([
  "command",
  "frequency",
  "run_time",
  "run_days",
  "run_day_of_month",
  "run_months",
  "cron_expression",
]);

const isAutoManaged = (item: any) => autoManagedTaskNames.includes(item?.name);

const taskFieldsForDialog = computed<ColumnConfig[]>(() =>
  taskFields.map((field) =>
    isAutoManaged(taskDialog.data) && autoManagedFieldKeys.has(field.key)
      ? { ...field, readOnly: true }
      : field,
  ),
);

const taskDialog = reactive<{ visible: boolean; action: string; data: any }>({
  visible: false,
  action: "Create",
  data: {},
});

const onTaskFilter = (options: any) => indexTasks(options);
const onTaskCreate = () => {
  taskDialog.action = "Create";
  taskDialog.data = {};
  taskDialog.visible = true;
};
const onTaskView = (item: any) => {
  taskDialog.action = "View";
  taskDialog.data = item;
  taskDialog.visible = true;
};
const onTaskEdit = (item: any) => {
  taskDialog.action = "Edit";
  taskDialog.data = item;
  taskDialog.visible = true;
};
const onTaskRemove = (item: any) => {
  taskDialog.action = "Remove";
  taskDialog.data = item;
  taskDialog.visible = true;
};

const onTaskExecute = async (form: any) => {
  if (taskDialog.action === "Create") await storeTask(form);
  else if (taskDialog.action === "Edit")
    await updateTask(taskDialog.data.id, form);
  else if (taskDialog.action === "Remove")
    await destroyTask(taskDialog.data.id);

  taskDialog.visible = false;
};

const runTaskNow = async (item: any) => {
  runningId.value = item.id;
  try {
    await axios.post(`/scheduled-tasks/${item.id}/run`);
    await indexTasks();
  } finally {
    runningId.value = null;
  }
};

onMounted(async () => {
  try {
    // BaseContainer normally completes this request before mounting the page.
    // Keep the fallback for isolated/direct rendering without fetching twice.
    if (!appSettingsInitialized.value) await loadAppSettings();

    const savedTheme =
      settings.value?.theme ||
      localStorage.getItem("APP_THEME") ||
      vuetifyTheme.global.name.value;

    theme.value = savedTheme;
    applyTheme(savedTheme);
    savedSnapshot.value = currentSnapshot.value;
  } finally {
    settingsReady.value = true;
  }
});

onBeforeUnmount(() => {
  if (!savedSnapshot.value) return;

  const savedTheme = JSON.parse(savedSnapshot.value)?.theme;
  if (savedTheme && theme.value !== savedTheme) applyTheme(savedTheme);
});
</script>

<style scoped>
.settings-page {
  width: 100%;
  max-width: 1600px;
  margin-inline: auto;
}

.settings-page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 18px;
}

.settings-loading {
  position: relative;
  padding-top: 10px;
}

.settings-loading__label {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.settings-loading__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.settings-tabs {
  width: min(100%, 540px);
  min-height: 48px;
  padding: 5px;
  border-radius: 12px;
  background: rgba(var(--v-theme-on-surface), 0.055);
}

.settings-tabs :deep(.v-slide-group__container) {
  width: 100%;
}

.settings-tabs :deep(.v-slide-group__content) {
  display: grid;
  width: 100%;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-items: stretch;
}

.settings-tabs--two :deep(.v-slide-group__content) {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.settings-tabs :deep(.v-tab) {
  width: 100%;
  min-width: 0;
  min-height: 38px;
  justify-content: center;
  padding-inline: 16px;
  border-radius: 8px;
  color: rgb(var(--v-theme-on-surface-variant));
  text-transform: none;
  letter-spacing: normal;
  transition:
    color 160ms ease,
    background-color 160ms ease;
}

.settings-tabs :deep(.v-tab:hover) {
  color: rgb(var(--v-theme-on-surface));
  background: rgba(var(--v-theme-on-surface), 0.045);
}

.settings-tabs :deep(.v-tab--selected) {
  border: 1px solid rgba(var(--v-theme-primary), 0.18);
  color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.13);
}

.settings-tabs :deep(.v-tab__content) {
  gap: 7px;
  font-size: 0.84rem;
  font-weight: 650;
  white-space: nowrap;
}

.settings-tabs :deep(.v-tab__slider) {
  display: none;
}

.settings-grid {
  display: grid;
  grid-template-columns: minmax(300px, 0.72fr) minmax(520px, 1.28fr);
  grid-template-areas:
    "experience attendance"
    "organization attendance"
    "modules modules";
  gap: 18px;
  align-items: stretch;
}

.settings-column {
  display: contents;
}

.settings-panel--experience {
  grid-area: experience;
}
.settings-panel--organization {
  grid-area: organization;
}
.settings-panel--attendance {
  grid-area: attendance;
}
.settings-panel--modules {
  grid-area: modules;
}

.settings-panel {
  min-width: 0;
  padding: 22px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.075);
  border-radius: 16px;
  background: rgb(var(--v-theme-surface));
}

.settings-panel--attendance {
  display: flex;
  flex-direction: column;
}

.settings-panel--attendance .policy-list {
  flex: 1;
}

.panel-heading {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.panel-heading > div {
  min-width: 0;
}

.panel-title {
  font-size: 0.96rem;
  font-weight: 700;
  line-height: 1.35;
}

.panel-description {
  margin-top: 1px;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.78rem;
  line-height: 1.45;
}

.theme-choice {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.theme-option {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  min-height: 64px;
  padding: 13px 14px;
  border: 0;
  border-radius: 10px;
  color: rgb(var(--v-theme-on-surface));
  background: rgba(var(--v-theme-on-surface), 0.04);
  text-align: left;
  cursor: pointer;
  transition:
    background 0.16s ease,
    border-color 0.16s ease;
}

.theme-option:hover {
  background: rgba(var(--v-theme-primary), 0.07);
}

.theme-option.selected {
  border: 1px solid rgba(var(--v-theme-primary), 0.28);
  background: rgba(var(--v-theme-primary), 0.12);
}

.theme-option > span {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

.theme-option strong {
  font-size: 0.87rem;
}

.theme-option small {
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.74rem;
}

.panel-fields {
  display: grid;
  grid-template-columns: minmax(180px, 0.8fr) minmax(240px, 1.2fr);
  gap: 12px;
}

.policy-list {
  display: grid;
  gap: 10px;
}

.policy-list--attendance {
  grid-template-columns: 1fr;
}

.policy-list--modules {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.policy-row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  min-height: 68px;
  padding: 11px 13px;
  border-radius: 12px;
  background: rgba(var(--v-theme-on-surface), 0.035);
  transition:
    background-color 160ms ease,
    opacity 160ms ease;
}

.policy-row--dependent {
  background: rgba(var(--v-theme-primary), 0.045);
}

.policy-row--disabled {
  opacity: 0.58;
}

.policy-icon {
  flex: 0 0 auto;
  color: rgb(var(--v-theme-primary));
}

.policy-copy {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
}

.policy-copy strong {
  font-size: 0.84rem;
  line-height: 1.35;
}

.policy-copy small {
  margin-top: 1px;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.74rem;
  line-height: 1.4;
}

.policy-row :deep(.v-switch) {
  flex: 0 0 auto;
}

.policy-inline-select {
  flex: 0 0 128px;
  max-width: 128px;
}

.settings-save-bar {
  position: sticky;
  bottom: 12px;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin-top: 20px;
  padding: 12px 14px 12px 17px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  border-radius: 12px;
  background: rgb(var(--v-theme-surface));
}

.automation-header {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-bottom: 14px;
  padding: 4px 2px;
}

.payroll-settings-intro {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 18px;
  padding: 18px 20px;
  border-radius: 15px;
  background: linear-gradient(
    120deg,
    rgba(var(--v-theme-primary), 0.12),
    rgba(var(--v-theme-primary), 0.035)
  );
}

.payroll-settings-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.payroll-policy-panel,
.tax-panel {
  grid-column: 1 / -1;
}

.compact-field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 11px;
}

.compact-field-grid--rates {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.span-2 {
  grid-column: 1 / -1;
}

.source-link {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  margin-left: auto;
  color: rgb(var(--v-theme-primary));
  font-size: 0.72rem;
  text-decoration: none;
}

.policy-footnote {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  margin-top: 13px;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.73rem;
  line-height: 1.45;
}

.weekday-setting {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.weekday-setting > span {
  font-size: 0.8rem;
  font-weight: 650;
}

.weekday-setting :deep(.v-btn-group) {
  overflow: hidden;
  border-radius: 9px;
}

.deduction-policy-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.deduction-policy {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding: 11px 12px;
  border-radius: 11px;
  background: rgba(var(--v-theme-on-surface), 0.035);
}

.deduction-policy > div {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
}

.deduction-policy strong {
  font-size: 0.79rem;
}

.deduction-policy small {
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.69rem;
  line-height: 1.35;
}

.automation-note {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 18px;
  padding: 12px 14px;
  border-radius: 10px;
  background: rgba(var(--v-theme-primary), 0.07);
}

.automation-note > div {
  display: flex;
  flex-direction: column;
  font-size: 0.76rem;
}

.automation-note span {
  margin-top: 2px;
  color: rgb(var(--v-theme-on-surface-variant));
}

@media (max-width: 1250px) {
  .policy-list--modules {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 1050px) {
  .settings-grid,
  .settings-loading__grid {
    grid-template-columns: 1fr;
  }

  .settings-grid {
    grid-template-areas:
      "experience"
      "organization"
      "attendance"
      "modules";
  }

  .payroll-settings-grid {
    grid-template-columns: 1fr;
  }

  .payroll-policy-panel,
  .tax-panel {
    grid-column: auto;
  }

  .deduction-policy-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .settings-page-header,
  .settings-save-bar,
  .automation-header,
  .payroll-settings-intro {
    align-items: flex-start;
    flex-direction: column;
  }

  .settings-tabs {
    width: 100%;
  }

  .settings-tabs :deep(.v-tab) {
    width: 100%;
    min-width: 0;
    padding-inline: 9px;
  }

  .settings-tabs :deep(.v-tab__content) {
    gap: 5px;
    font-size: 0.76rem;
  }

  .theme-choice,
  .panel-fields {
    grid-template-columns: 1fr;
  }

  .policy-list--modules {
    grid-template-columns: 1fr;
  }

  .settings-panel {
    padding: 17px;
  }

  .policy-row {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .policy-copy {
    min-width: calc(100% - 78px);
  }

  .policy-inline-select {
    flex-basis: calc(100% - 54px);
    max-width: none;
    margin-left: 36px;
  }

  .weekday-setting {
    align-items: stretch;
    flex-direction: column;
  }

  .weekday-setting :deep(.v-btn-group) {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    height: auto;
  }

  .settings-save-bar .v-btn {
    width: 100%;
  }
}
</style>
