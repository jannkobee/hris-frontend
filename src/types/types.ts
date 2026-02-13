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
    | "datetime"
    | "none";
  inputOptions?: Array<any>;
  nullable?: boolean;
  readOnly?: boolean;
  readOnlyOnEdit?: boolean;
  formatter?: (value: any) => string;
  displayAs?: "chip" | "text";
  chipColor?: string;
};

type TextLikeColumn = BaseColumnConfig & {
  inputField?: "text" | "checkbox" | "date" | "datetime" | "none";
  inputOptions?: Array<{ label: string; value: any }>;
  selectKey?: never;
};

type SelectColumn = BaseColumnConfig & {
  inputField: "select";
  inputOptions: Array<{ label: string; value: any }>;
  selectKey: string; // Required for select fields
};

type RadioColumn = BaseColumnConfig & {
  inputField: "radio";
  inputOptions: Array<{ label: string; value: any }>;
  selectKey?: string; // Optional for radio fields
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
  role?: RoleWithPermissions;
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
};
