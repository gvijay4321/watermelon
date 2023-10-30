export type MarkdownResponse = string;

export type MarkdownRequest = {
  userLogin: string;
  value?: StandardAPIResponse;
};
type searchText = string | string[];
export type StandardAPIInput = {
  token: string;
  refresh_token?: string;
  searchText?: string;
  amount: number;
  user?: string;
  id?: string;
  owner?: string;
  repo?: string;
  randomWords?: string[];
};
export interface AtlassianAPIInput extends StandardAPIInput {
  cloudId?: string;
}
export type StandardProcessedDataArray = {
  title: string;
  body?: string;
  link?: string;
  number?: number | string;
  image?: string;
  created_at?: string;
  author?: string;
}[];
export type StandardAPIResponse = {
  data?: StandardProcessedDataArray;
  fullData?: any;
  error?: string;
};
