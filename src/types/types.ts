export type Data = {
  current_page: number;
  data?: Object;
  first_page_url?: string;
  from: number;
  last_page: number;
  last_page_url?: string;
  links?: Object;
  next_page_url?: string;
  path?: string;
  per_page: number;
  prev_page_url?: string;
  to: number;
  total: number;
};

type BaseColumnConfig = {
  title: string;
  key: string;
  sortable?: boolean;
  align?: "start" | "end" | "center";
  inputField?:
    | "text"
    | "radio"
    | "select"
    | "checkbox"
    | "date"
    | "time"
    | "datetime"
    | "file"
    | "richtext"
    | "none";
  inputOptions?: Array<any>;
  nullable?: boolean;
  required?: boolean;
  readOnly?: boolean;
  readOnlyOnEdit?: boolean;
  formatter?: (value: any) => string | string[];
  displayAs?: "chip" | "chips" | "text";
  chipColor?: string;
  multiple?: boolean;
  accept?: string;
  visibleInTable?: boolean;
  // Called whenever this field's bound value changes from real user input
  // (not when the form is populated/reset by opening the dialog). Return a
  // partial object to merge into the form, e.g. to keep a derived field in
  // sync — return nothing to leave the rest of the form untouched.
  onChange?: (
    value: any,
    form: Record<string, any>,
  ) => Record<string, any> | void;
};

type TextLikeColumn = BaseColumnConfig & {
  inputField?:
    | "text"
    | "checkbox"
    | "date"
    | "time"
    | "datetime"
    | "file"
    | "richtext"
    | "none";
  inputOptions?: Array<{ label: string; value: any }>;
  selectKey?: never;
};

type SelectColumn = BaseColumnConfig & {
  inputField: "select";
  inputOptions: Array<{ label: string; value: any }>;
  selectKey: string;
  // When true, the field binds to an array (e.g. run_months: [1, 6]) instead
  // of a single scalar. Needed for any select-type field whose backend
  // validation expects an array.
};

type RadioColumn = BaseColumnConfig & {
  inputField: "radio";
  inputOptions: Array<{ label: string; value: any }>;
  selectKey?: string;
};

export type ColumnConfig = TextLikeColumn | SelectColumn | RadioColumn;

export type User = {
  id: string;
  role_id: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  initials?: string;
  email: string;
  gender: string;
  birthday: string;
  profile_photo_url?: string | null;
  role?: RoleWithPermissions;
  settings?: Record<string, any>;
  employee?: {
    id: string;
    employee_no: string;
    department?: { name: string };
    position?: { name: string };
    employment_status?: { name: string };
    job_grade?: { name: string };
    hire_date?: string;
    addresses?: Array<Record<string, any>>;
    contacts?: Array<Record<string, any>>;
  };
};

export type RoleWithPermissions = Role & {
  permissions: Permission[];
};

export type Role = {
  name: string;
  description: string;
};

export type Permission = {
  id: string;
  model: string;
  name: string;
  slug: string;
  description?: string | null;
};
